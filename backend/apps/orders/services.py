from decimal import Decimal
from typing import List, Optional

from django.db import transaction, IntegrityError

from apps.products.models import Product, ProductVariant
from .exceptions import (
    EmptyCartError,
    InsufficientStockError,
    InvalidProductError,
    OutOfStockError,
)
from .models import Order, OrderItem


# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

class CartItem:
    """Plain data container — no Django model, no serializer coupling."""

    def __init__(self, product_id: int, quantity: int, variant_id: Optional[int] = None):
        self.product_id = product_id
        self.quantity = quantity
        self.variant_id = variant_id  # None = no variant selected (product-level stock)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def create_order_from_cart(
    user,
    cart_items: List[CartItem],
    shipping_address: str,
    notes: str = "",
    idempotency_key: str = "",
) -> tuple[Order, bool]:
    if not cart_items:
        raise EmptyCartError()

    # Idempotency pre-check — outside transaction
    if idempotency_key:
        try:
            existing = (
                Order.objects.prefetch_related("items__product", "items__variant")
                .get(user=user, idempotency_key=idempotency_key)
            )
            return existing, False
        except Order.DoesNotExist:
            pass

    with transaction.atomic():
        # ── Determine which items use variants vs product-level stock ──
        variant_ids = [i.variant_id for i in cart_items if i.variant_id]
        product_ids = [i.product_id for i in cart_items]

        # Lock variants first (ordered by pk to prevent deadlocks)
        locked_variants: dict[int, ProductVariant] = {}
        if variant_ids:
            for v in (
                ProductVariant.objects.select_for_update()
                .filter(pk__in=variant_ids)
                .order_by("pk")
            ):
                locked_variants[v.pk] = v

        # Lock products (for items without variants)
        locked_products: dict[int, Product] = {}
        no_variant_ids = [i.product_id for i in cart_items if not i.variant_id]
        if no_variant_ids:
            for p in (
                Product.objects.select_for_update()
                .filter(pk__in=no_variant_ids, is_active=True)
                .order_by("pk")
            ):
                locked_products[p.pk] = p

        # Also load products for variant items (for price + name)
        all_products: dict[int, Product] = {**locked_products}
        variant_product_ids = [i.product_id for i in cart_items if i.variant_id]
        if variant_product_ids:
            for p in Product.objects.filter(pk__in=variant_product_ids, is_active=True):
                all_products[p.pk] = p

        # ── Validate all items before any write ──
        _validate_cart(cart_items, all_products, locked_variants)

        # ── Savepoint: deduct stock + create order ──
        try:
            with transaction.atomic():
                total = Decimal("0.00")
                order_items_to_create = []

                for item in cart_items:
                    product = all_products.get(item.product_id)
                    if not product:
                        raise InvalidProductError(item.product_id)

                    if item.variant_id:
                        variant = locked_variants[item.variant_id]
                        unit_price = variant.effective_price
                        variant.stock -= item.quantity
                        size_snapshot = variant.size
                        color_snapshot = variant.color
                    else:
                        variant = None
                        unit_price = product.sale_price if product.sale_price else product.price
                        product.stock -= item.quantity
                        size_snapshot = ""
                        color_snapshot = ""

                    total += unit_price * item.quantity
                    order_items_to_create.append((product, variant, item.quantity, unit_price, size_snapshot, color_snapshot))

                # Bulk-update stock
                if locked_variants:
                    ProductVariant.objects.bulk_update(list(locked_variants.values()), ["stock"])
                if locked_products:
                    Product.objects.bulk_update(list(locked_products.values()), ["stock"])

                order = Order.objects.create(
                    user=user,
                    status=Order.Status.PENDING,
                    total_price=total,
                    shipping_address=shipping_address,
                    notes=notes,
                    idempotency_key=idempotency_key,
                )

                OrderItem.objects.bulk_create([
                    OrderItem(
                        order=order,
                        product=product,
                        variant=variant,
                        quantity=qty,
                        unit_price=price,
                        size_snapshot=size_snap,
                        color_snapshot=color_snap,
                    )
                    for product, variant, qty, price, size_snap, color_snap in order_items_to_create
                ])

        except IntegrityError:
            if not idempotency_key:
                raise
            existing = (
                Order.objects.prefetch_related("items__product", "items__variant")
                .get(user=user, idempotency_key=idempotency_key)
            )
            return existing, False

    return (
        Order.objects.prefetch_related("items__product", "items__variant").get(pk=order.pk),
        True,
    )


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _validate_cart(
    cart_items: List[CartItem],
    product_map: dict,
    variant_map: dict,
) -> None:
    seen: set[tuple] = set()

    for item in cart_items:
        key = (item.product_id, item.variant_id)
        if key in seen:
            continue
        seen.add(key)

        product = product_map.get(item.product_id)
        if product is None:
            raise InvalidProductError(item.product_id)

        if item.variant_id:
            variant = variant_map.get(item.variant_id)
            if variant is None or variant.product_id != item.product_id:
                raise InvalidProductError(item.product_id)
            if variant.stock == 0:
                raise OutOfStockError(f"{product.name} ({variant.size})", available=0)
            if item.quantity > variant.stock:
                raise InsufficientStockError(
                    f"{product.name} ({variant.size})",
                    requested=item.quantity,
                    available=variant.stock,
                )
        else:
            # No variant — use product-level stock
            if product.stock == 0:
                raise OutOfStockError(product.name, available=0)
            if item.quantity > product.stock:
                raise InsufficientStockError(
                    product.name,
                    requested=item.quantity,
                    available=product.stock,
                )
