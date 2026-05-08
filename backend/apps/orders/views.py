import logging

from django.http import HttpResponse
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.exceptions import PaymentRateThrottle
from core.permissions import IsOwnerOrReadOnly
from .models import ExchangeRequest, Order, OrderStatusHistory, Refund, ReturnRequest
from .operations import (
    add_tracking,
    approve_exchange,
    create_exchange_request,
    create_refund_request,
    create_return_request,
    fulfill_order,
    generate_invoice_pdf,
    mark_return_received,
    process_refund,
    reject_refund,
    review_return_request,
)
from .serializers import (
    AddTrackingSerializer,
    CreateOrderSerializer,
    ExchangeRequestCreateSerializer,
    ExchangeRequestOutputSerializer,
    FulfillOrderSerializer,
    OrderOutputSerializer,
    OrderStatusHistorySerializer,
    RefundOutputSerializer,
    RefundRequestSerializer,
    RefundReviewSerializer,
    ReturnRequestCreateSerializer,
    ReturnRequestOutputSerializer,
    ReturnReviewSerializer,
)
from .services import CartItem, create_order_from_cart

logger = logging.getLogger(__name__)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderOutputSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly)
    filter_backends = (filters.SearchFilter,)
    search_fields = ("id", "user__email")

    def get_queryset(self):
        qs = (
            Order.objects.all()
            .select_related("user")
            .prefetch_related("items__product", "items__variant")
            .order_by("-created_at")
        ) if self.request.user.is_staff else (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items__product", "items__variant")
            .order_by("-created_at")
        )

        if self.request.user.is_staff:
            s = self.request.query_params.get("status")
            date_from = self.request.query_params.get("date_from")
            date_to = self.request.query_params.get("date_to")
            if s:
                qs = qs.filter(status=s)
            if date_from:
                qs = qs.filter(created_at__date__gte=date_from)
            if date_to:
                qs = qs.filter(created_at__date__lte=date_to)

        return qs

    # ── Checkout ──────────────────────────────────────────────────────────
    @action(methods=["post"], detail=False, url_path="checkout",
            permission_classes=[permissions.IsAuthenticated],
            throttle_classes=[PaymentRateThrottle])
    def checkout(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        cart_items = [
            CartItem(
                product_id=i["product_id"],
                quantity=i["quantity"],
                variant_id=i.get("variant_id"),
                customization_text=i.get("customization_text", ""),
            )
            for i in v["items"]
        ]
        order, created = create_order_from_cart(
            user=request.user,
            cart_items=cart_items,
            shipping_address=v["shipping_address"],
            notes=v.get("notes", ""),
            idempotency_key=v.get("idempotency_key", ""),
        )
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(OrderOutputSerializer(order).data, status=http_status)

    # ── Status update ─────────────────────────────────────────────────────
    @action(methods=["patch"], detail=True, url_path="update-status",
            permission_classes=[permissions.IsAdminUser])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("status")
        valid = [s.value for s in Order.Status]
        if new_status not in valid:
            return Response({"detail": f"Invalid status. Choose from: {valid}"},
                            status=status.HTTP_400_BAD_REQUEST)
        old_status = order.status
        order.status = new_status
        order.save(update_fields=["status", "updated_at"])
        OrderStatusHistory.objects.create(
            order=order, old_status=old_status, new_status=new_status,
            changed_by=request.user, note=request.data.get("note", ""),
        )
        return Response(OrderOutputSerializer(order).data)

    # ── Audit log ─────────────────────────────────────────────────────────
    @action(methods=["get"], detail=True, url_path="history",
            permission_classes=[permissions.IsAdminUser])
    def history(self, request, pk=None):
        order = self.get_object()
        qs = order.history.select_related("changed_by").all()
        return Response(OrderStatusHistorySerializer(qs, many=True).data)

    # ── Bulk status update ────────────────────────────────────────────────
    @action(methods=["post"], detail=False, url_path="bulk-update-status",
            permission_classes=[permissions.IsAdminUser])
    def bulk_update_status(self, request):
        order_ids = request.data.get("order_ids", [])
        new_status = request.data.get("status")
        valid = [s.value for s in Order.Status]
        if not order_ids or not isinstance(order_ids, list):
            return Response({"detail": "order_ids must be a non-empty list."},
                            status=status.HTTP_400_BAD_REQUEST)
        if new_status not in valid:
            return Response({"detail": f"Invalid status. Choose from: {valid}"},
                            status=status.HTTP_400_BAD_REQUEST)
        orders = Order.objects.filter(pk__in=order_ids)
        history_records = [
            OrderStatusHistory(
                order=order, old_status=order.status, new_status=new_status,
                changed_by=request.user,
            )
            for order in orders if order.status != new_status
        ]
        orders.update(status=new_status)
        OrderStatusHistory.objects.bulk_create(history_records)
        return Response({"updated": orders.count(), "status": new_status})

    # ── PDF Invoice ───────────────────────────────────────────────────────
    @action(methods=["get"], detail=True, url_path="invoice")
    def invoice(self, request, pk=None):
        """Download PDF invoice. Available to order owner and admin."""
        order = self.get_object()
        try:
            pdf_bytes = generate_invoice_pdf(order)
            content_type = "application/pdf"
            filename = f"femvelle-invoice-{order.order_number}.pdf"
        except Exception as exc:
            logger.error("Invoice generation failed for order %s: %s", order.pk, exc)
            return Response({"detail": "Invoice generation failed."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response = HttpResponse(pdf_bytes, content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    # ── Fulfillment ───────────────────────────────────────────────────────
    @action(methods=["post"], detail=True, url_path="fulfill",
            permission_classes=[permissions.IsAdminUser])
    def fulfill(self, request, pk=None):
        """Mark order (or specific items) as fulfilled with tracking info."""
        order = self.get_object()
        serializer = FulfillOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        try:
            order = fulfill_order(
                order=order,
                fulfilled_by=request.user,
                tracking_number=v["tracking_number"],
                carrier=v["carrier"],
                tracking_url=v.get("tracking_url", ""),
                item_fulfillments=v.get("item_fulfillments") or None,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderOutputSerializer(order).data)

    @action(methods=["patch"], detail=True, url_path="tracking",
            permission_classes=[permissions.IsAdminUser])
    def tracking(self, request, pk=None):
        """Add or update shipment tracking number."""
        order = self.get_object()
        serializer = AddTrackingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        order = add_tracking(
            order=order,
            updated_by=request.user,
            tracking_number=v["tracking_number"],
            carrier=v["carrier"],
            tracking_url=v.get("tracking_url", ""),
        )
        return Response(OrderOutputSerializer(order).data)

    # ── Refunds ───────────────────────────────────────────────────────────
    @action(methods=["get"], detail=True, url_path="refunds")
    def list_refunds(self, request, pk=None):
        order = self.get_object()
        qs = order.refunds.select_related("requested_by", "processed_by").all()
        return Response(RefundOutputSerializer(qs, many=True).data)

    @action(methods=["post"], detail=True, url_path="refunds/request")
    def request_refund(self, request, pk=None):
        """Customer or admin requests a refund."""
        order = self.get_object()
        serializer = RefundRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        try:
            refund = create_refund_request(
                order=order,
                requested_by=request.user,
                amount=v["amount"],
                reason=v["reason"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(RefundOutputSerializer(refund).data, status=status.HTTP_201_CREATED)

    @action(methods=["post"], detail=True, url_path="refunds/(?P<refund_pk>[0-9]+)/review",
            permission_classes=[permissions.IsAdminUser])
    def review_refund(self, request, pk=None, refund_pk=None):
        """Admin approves or rejects a refund."""
        order = self.get_object()
        try:
            refund = order.refunds.get(pk=refund_pk)
        except Refund.DoesNotExist:
            return Response({"detail": "Refund not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RefundReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data

        try:
            if v["approved"]:
                refund = process_refund(refund, request.user, v.get("admin_note", ""))
            else:
                refund = reject_refund(refund, request.user, v.get("admin_note", ""))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(RefundOutputSerializer(refund).data)

    # ── Return requests ───────────────────────────────────────────────────
    @action(methods=["get"], detail=True, url_path="returns")
    def list_returns(self, request, pk=None):
        order = self.get_object()
        qs = order.return_requests.select_related("requested_by").all()
        return Response(ReturnRequestOutputSerializer(qs, many=True).data)

    @action(methods=["post"], detail=True, url_path="returns/request")
    def request_return(self, request, pk=None):
        """Customer submits a return request."""
        order = self.get_object()
        serializer = ReturnRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        try:
            ret = create_return_request(
                order=order,
                requested_by=request.user,
                reason=v["reason"],
                description=v.get("description", ""),
                items=v["items"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ReturnRequestOutputSerializer(ret).data, status=status.HTTP_201_CREATED)

    @action(methods=["post"], detail=True, url_path="returns/(?P<return_pk>[0-9]+)/review",
            permission_classes=[permissions.IsAdminUser])
    def review_return(self, request, pk=None, return_pk=None):
        """Admin approves or rejects a return request."""
        order = self.get_object()
        try:
            ret = order.return_requests.get(pk=return_pk)
        except ReturnRequest.DoesNotExist:
            return Response({"detail": "Return request not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReturnReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        try:
            ret = review_return_request(ret, request.user, v["approved"], v.get("admin_note", ""))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ReturnRequestOutputSerializer(ret).data)

    @action(methods=["post"], detail=True, url_path="returns/(?P<return_pk>[0-9]+)/received",
            permission_classes=[permissions.IsAdminUser])
    def mark_return_received(self, request, pk=None, return_pk=None):
        """Admin marks returned items as received."""
        order = self.get_object()
        try:
            ret = order.return_requests.get(pk=return_pk)
        except ReturnRequest.DoesNotExist:
            return Response({"detail": "Return request not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            ret = mark_return_received(ret, request.data.get("admin_note", ""))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ReturnRequestOutputSerializer(ret).data)

    # ── Exchange requests ─────────────────────────────────────────────────
    @action(methods=["get"], detail=True, url_path="exchanges")
    def list_exchanges(self, request, pk=None):
        order = self.get_object()
        qs = order.exchange_requests.select_related("requested_by").all()
        return Response(ExchangeRequestOutputSerializer(qs, many=True).data)

    @action(methods=["post"], detail=True, url_path="exchanges/request")
    def request_exchange(self, request, pk=None):
        """Customer submits an exchange request."""
        order = self.get_object()
        serializer = ExchangeRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        try:
            exc_req = create_exchange_request(
                order=order,
                requested_by=request.user,
                reason=v["reason"],
                return_items=v["return_items"],
                exchange_items=v["exchange_items"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ExchangeRequestOutputSerializer(exc_req).data, status=status.HTTP_201_CREATED)

    @action(methods=["post"], detail=True, url_path="exchanges/(?P<exchange_pk>[0-9]+)/review",
            permission_classes=[permissions.IsAdminUser])
    def review_exchange(self, request, pk=None, exchange_pk=None):
        """Admin approves or rejects an exchange request."""
        order = self.get_object()
        try:
            exc_req = order.exchange_requests.get(pk=exchange_pk)
        except ExchangeRequest.DoesNotExist:
            return Response({"detail": "Exchange request not found."}, status=status.HTTP_404_NOT_FOUND)

        approved = request.data.get("approved", True)
        admin_note = request.data.get("admin_note", "")
        try:
            if approved:
                exc_req = approve_exchange(exc_req, request.user, admin_note)
            else:
                exc_req.status = ExchangeRequest.Status.REJECTED
                exc_req.reviewed_by = request.user
                exc_req.admin_note = admin_note
                from django.utils import timezone
                exc_req.reviewed_at = timezone.now()
                exc_req.save()
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ExchangeRequestOutputSerializer(exc_req).data)
