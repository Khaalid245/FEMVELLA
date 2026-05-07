"""
Enterprise order operations service.

Handles:
  - Partial / full refunds (Stripe + DB)
  - Return request workflow
  - Exchange request workflow
  - Partial / full fulfillment with tracking
  - PDF invoice generation (ReportLab)
"""

import logging
from decimal import Decimal
from io import BytesIO

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import (
    ExchangeRequest,
    Order,
    OrderItem,
    OrderStatusHistory,
    Refund,
    ReturnRequest,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Refund service
# ---------------------------------------------------------------------------

def create_refund_request(order: Order, requested_by, amount: Decimal, reason: str) -> Refund:
    """Customer or admin creates a refund request."""
    if amount <= 0:
        raise ValueError("Refund amount must be positive.")
    if amount > order.balance_due:
        raise ValueError(
            f"Refund amount ${amount} exceeds balance due ${order.balance_due}."
        )
    return Refund.objects.create(
        order=order,
        requested_by=requested_by,
        amount=amount,
        reason=reason,
    )


def process_refund(refund: Refund, processed_by, admin_note: str = "") -> Refund:
    """
    Admin approves and processes a refund.
    Issues Stripe refund if payment exists, then updates DB atomically.
    """
    if refund.status != Refund.Status.PENDING:
        raise ValueError(f"Refund is already {refund.status}.")

    order = refund.order
    stripe_refund_id = ""

    # Attempt Stripe refund
    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        payment = order.payment
        if payment and payment.stripe_payment_intent_id:
            stripe_refund = stripe.Refund.create(
                payment_intent=payment.stripe_payment_intent_id,
                amount=int(refund.amount * 100),
                reason="requested_by_customer",
            )
            stripe_refund_id = stripe_refund.id
    except Exception as exc:
        logger.warning("Stripe refund failed for refund #%s: %s", refund.pk, exc)
        # Continue — record refund in DB even if Stripe call fails

    with transaction.atomic():
        refund.status = Refund.Status.PROCESSED
        refund.processed_by = processed_by
        refund.admin_note = admin_note
        refund.stripe_refund_id = stripe_refund_id
        refund.processed_at = timezone.now()
        refund.save()

        order.refunded_amount += refund.amount
        # Determine new order status
        if order.refunded_amount >= order.total_price:
            new_status = Order.Status.REFUNDED
        else:
            new_status = Order.Status.PARTIALLY_REFUNDED

        old_status = order.status
        order.status = new_status
        order.save(update_fields=["refunded_amount", "status", "updated_at"])

        OrderStatusHistory.objects.create(
            order=order,
            old_status=old_status,
            new_status=new_status,
            changed_by=processed_by,
            note=f"Refund #{refund.pk} processed — ${refund.amount}",
        )

    return refund


def reject_refund(refund: Refund, processed_by, admin_note: str = "") -> Refund:
    if refund.status != Refund.Status.PENDING:
        raise ValueError(f"Refund is already {refund.status}.")
    refund.status = Refund.Status.REJECTED
    refund.processed_by = processed_by
    refund.admin_note = admin_note
    refund.processed_at = timezone.now()
    refund.save()
    return refund


# ---------------------------------------------------------------------------
# Return request service
# ---------------------------------------------------------------------------

def create_return_request(
    order: Order,
    requested_by,
    reason: str,
    description: str,
    items: list,  # [{order_item_id, quantity}]
) -> ReturnRequest:
    """Customer submits a return request."""
    if order.status not in (
        Order.Status.DELIVERED,
        Order.Status.SHIPPED,
        Order.Status.FULFILLED,
    ):
        raise ValueError("Returns can only be requested for delivered or shipped orders.")

    # Validate items belong to this order
    item_ids = {i["order_item_id"] for i in items}
    valid_ids = set(order.items.values_list("id", flat=True))
    invalid = item_ids - valid_ids
    if invalid:
        raise ValueError(f"Order items {invalid} do not belong to this order.")

    return ReturnRequest.objects.create(
        order=order,
        requested_by=requested_by,
        reason=reason,
        description=description,
        items=items,
    )


def review_return_request(
    return_request: ReturnRequest,
    reviewed_by,
    approved: bool,
    admin_note: str = "",
) -> ReturnRequest:
    if return_request.status != ReturnRequest.Status.PENDING:
        raise ValueError(f"Return request is already {return_request.status}.")

    return_request.status = (
        ReturnRequest.Status.APPROVED if approved else ReturnRequest.Status.REJECTED
    )
    return_request.reviewed_by = reviewed_by
    return_request.admin_note = admin_note
    return_request.reviewed_at = timezone.now()
    return_request.save()
    return return_request


def mark_return_received(return_request: ReturnRequest, admin_note: str = "") -> ReturnRequest:
    if return_request.status != ReturnRequest.Status.APPROVED:
        raise ValueError("Return must be approved before marking items received.")
    return_request.status = ReturnRequest.Status.ITEMS_RECEIVED
    if admin_note:
        return_request.admin_note = admin_note
    return_request.save()
    return return_request


# ---------------------------------------------------------------------------
# Exchange request service
# ---------------------------------------------------------------------------

def create_exchange_request(
    order: Order,
    requested_by,
    reason: str,
    return_items: list,   # [{order_item_id, quantity}]
    exchange_items: list, # [{product_id, variant_id, quantity}]
) -> ExchangeRequest:
    if order.status not in (
        Order.Status.DELIVERED,
        Order.Status.SHIPPED,
        Order.Status.FULFILLED,
    ):
        raise ValueError("Exchanges can only be requested for delivered or shipped orders.")

    return ExchangeRequest.objects.create(
        order=order,
        requested_by=requested_by,
        reason=reason,
        return_items=return_items,
        exchange_items=exchange_items,
    )


def approve_exchange(
    exchange: ExchangeRequest,
    reviewed_by,
    admin_note: str = "",
) -> ExchangeRequest:
    if exchange.status != ExchangeRequest.Status.PENDING:
        raise ValueError(f"Exchange is already {exchange.status}.")
    exchange.status = ExchangeRequest.Status.APPROVED
    exchange.reviewed_by = reviewed_by
    exchange.admin_note = admin_note
    exchange.reviewed_at = timezone.now()
    exchange.save()
    return exchange


def complete_exchange(exchange: ExchangeRequest, new_order: Order) -> ExchangeRequest:
    exchange.status = ExchangeRequest.Status.COMPLETED
    exchange.new_order = new_order
    exchange.save()
    return exchange


# ---------------------------------------------------------------------------
# Fulfillment service
# ---------------------------------------------------------------------------

def fulfill_order(
    order: Order,
    fulfilled_by,
    tracking_number: str,
    carrier: str,
    tracking_url: str = "",
    item_fulfillments: list | None = None,  # [{order_item_id, quantity}] or None = all
) -> Order:
    """
    Mark order items as fulfilled and attach tracking info.
    Supports partial fulfillment — call multiple times for split shipments.
    """
    with transaction.atomic():
        if item_fulfillments:
            # Partial fulfillment
            item_map = {f["order_item_id"]: f["quantity"] for f in item_fulfillments}
            items = list(order.items.filter(id__in=item_map.keys()))
            for item in items:
                qty = item_map[item.id]
                if qty > (item.quantity - item.fulfilled_quantity):
                    raise ValueError(
                        f"Cannot fulfill {qty} of item #{item.id} — only "
                        f"{item.quantity - item.fulfilled_quantity} remaining."
                    )
                item.fulfilled_quantity += qty
            OrderItem.objects.bulk_update(items, ["fulfilled_quantity"])
        else:
            # Fulfill all remaining
            order.items.filter(
                fulfilled_quantity__lt=models_F("quantity")
            ).update(fulfilled_quantity=models_F("quantity"))

        # Determine new status
        all_items = list(order.items.all())
        all_fulfilled = all(i.fulfilled_quantity >= i.quantity for i in all_items)
        any_fulfilled = any(i.fulfilled_quantity > 0 for i in all_items)

        old_status = order.status
        if all_fulfilled:
            new_status = Order.Status.FULFILLED
        elif any_fulfilled:
            new_status = Order.Status.PARTIALLY_FULFILLED
        else:
            new_status = order.status

        order.tracking_number = tracking_number
        order.carrier = carrier
        order.tracking_url = tracking_url
        order.status = new_status
        if new_status == Order.Status.FULFILLED:
            order.shipped_at = order.shipped_at or timezone.now()
        order.save()

        OrderStatusHistory.objects.create(
            order=order,
            old_status=old_status,
            new_status=new_status,
            changed_by=fulfilled_by,
            note=f"Tracking: {carrier} {tracking_number}",
        )

    return order


def add_tracking(
    order: Order,
    updated_by,
    tracking_number: str,
    carrier: str,
    tracking_url: str = "",
) -> Order:
    """Update tracking info without changing fulfillment status."""
    old_status = order.status
    order.tracking_number = tracking_number
    order.carrier = carrier
    order.tracking_url = tracking_url
    if order.status == Order.Status.FULFILLED:
        order.status = Order.Status.SHIPPED
        order.shipped_at = timezone.now()
    order.save()

    if order.status != old_status:
        OrderStatusHistory.objects.create(
            order=order,
            old_status=old_status,
            new_status=order.status,
            changed_by=updated_by,
            note=f"Tracking added: {carrier} {tracking_number}",
        )
    return order


# ---------------------------------------------------------------------------
# PDF Invoice generation
# ---------------------------------------------------------------------------

def generate_invoice_pdf(order: Order) -> bytes:
    """
    Generate a PDF invoice for the given order.
    Returns raw bytes. Uses ReportLab if available, falls back to plain HTML bytes.
    """
    try:
        return _generate_reportlab_pdf(order)
    except ImportError:
        logger.warning("ReportLab not installed — generating HTML invoice fallback.")
        return _generate_html_invoice(order).encode("utf-8")


def _generate_reportlab_pdf(order: Order) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        HRFlowable,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    gold = colors.HexColor("#C4985A")
    dark = colors.HexColor("#2C2420")
    muted = colors.HexColor("#6B5B55")

    brand_style = ParagraphStyle("brand", fontSize=24, textColor=dark, fontName="Helvetica-Bold", spaceAfter=2)
    tagline_style = ParagraphStyle("tagline", fontSize=9, textColor=muted, fontName="Helvetica", spaceAfter=12)
    heading_style = ParagraphStyle("heading", fontSize=11, textColor=dark, fontName="Helvetica-Bold", spaceAfter=4)
    body_style = ParagraphStyle("body", fontSize=9, textColor=muted, fontName="Helvetica", leading=14)
    small_style = ParagraphStyle("small", fontSize=8, textColor=muted, fontName="Helvetica")

    story = []

    # Header
    story.append(Paragraph("FEMVELLE", brand_style))
    story.append(Paragraph("Curated Modest Fashion", tagline_style))
    story.append(HRFlowable(width="100%", thickness=1, color=gold, spaceAfter=12))

    # Invoice meta
    story.append(Paragraph("INVOICE", ParagraphStyle("inv", fontSize=18, textColor=gold, fontName="Helvetica-Bold", spaceAfter=6)))
    meta_data = [
        ["Invoice Number:", order.order_number],
        ["Order Date:", order.created_at.strftime("%B %d, %Y")],
        ["Status:", order.status.replace("_", " ").title()],
        ["Customer:", order.user.email],
    ]
    if order.tracking_number:
        meta_data.append(["Tracking:", f"{order.carrier} — {order.tracking_number}"])

    meta_table = Table(meta_data, colWidths=[45 * mm, 100 * mm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), dark),
        ("TEXTCOLOR", (1, 0), (1, -1), muted),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8 * mm))

    # Shipping address
    story.append(Paragraph("Ship To", heading_style))
    story.append(Paragraph(order.shipping_address.replace("\n", "<br/>"), body_style))
    story.append(Spacer(1, 6 * mm))

    # Line items
    story.append(Paragraph("Order Items", heading_style))
    item_data = [["Product", "Size", "Color", "Qty", "Unit Price", "Subtotal"]]
    for item in order.items.all():
        name = item.product.name if item.product else "Deleted Product"
        size = item.size_snapshot or (item.variant.size if item.variant else "—")
        color = item.color_snapshot or (item.variant.color if item.variant else "—")
        item_data.append([
            name,
            size,
            color,
            str(item.quantity),
            f"${item.unit_price:.2f}",
            f"${item.subtotal:.2f}",
        ])

    item_table = Table(
        item_data,
        colWidths=[65 * mm, 20 * mm, 25 * mm, 12 * mm, 22 * mm, 22 * mm],
    )
    item_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("TEXTCOLOR", (0, 1), (-1, -1), muted),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAF7F4")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#EDE8E3")),
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(item_table)
    story.append(Spacer(1, 6 * mm))

    # Totals
    totals_data = [["Subtotal", f"${order.total_price:.2f}"]]
    if order.refunded_amount > 0:
        totals_data.append(["Refunded", f"-${order.refunded_amount:.2f}"])
        totals_data.append(["Balance Due", f"${order.balance_due:.2f}"])
    totals_table = Table(totals_data, colWidths=[130 * mm, 36 * mm])
    totals_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -2), "Helvetica"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), dark),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEABOVE", (0, -1), (-1, -1), 1, gold),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(totals_table)

    # Footer
    story.append(Spacer(1, 10 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#EDE8E3"), spaceAfter=6))
    story.append(Paragraph("Thank you for shopping with Femvelle. For returns or enquiries: support@femvelle.com", small_style))

    doc.build(story)
    return buffer.getvalue()


def _generate_html_invoice(order: Order) -> str:
    """Minimal HTML invoice fallback when ReportLab is not installed."""
    items_html = "".join(
        f"<tr><td>{i.product.name if i.product else 'Deleted'}</td>"
        f"<td>{i.size_snapshot}</td><td>{i.color_snapshot}</td>"
        f"<td>{i.quantity}</td><td>${i.unit_price:.2f}</td>"
        f"<td>${i.subtotal:.2f}</td></tr>"
        for i in order.items.all()
    )
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice {order.order_number}</title>
<style>body{{font-family:sans-serif;color:#2C2420;padding:40px}}
h1{{color:#C4985A}}table{{width:100%;border-collapse:collapse;margin-top:20px}}
th{{background:#2C2420;color:#fff;padding:8px;text-align:left}}
td{{padding:8px;border-bottom:1px solid #EDE8E3}}</style></head>
<body>
<h1>FEMVELLE</h1>
<h2>Invoice {order.order_number}</h2>
<p>Date: {order.created_at.strftime('%B %d, %Y')}</p>
<p>Customer: {order.user.email}</p>
<p>Ship to: {order.shipping_address}</p>
<table><thead><tr><th>Product</th><th>Size</th><th>Color</th>
<th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
<tbody>{items_html}</tbody></table>
<p style="text-align:right;margin-top:20px"><strong>Total: ${order.total_price:.2f}</strong></p>
</body></html>"""


# Avoid circular import — use F() from django.db.models
def models_F(field):
    from django.db.models import F
    return F(field)
