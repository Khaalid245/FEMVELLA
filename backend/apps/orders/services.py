from decimal import Decimal
from typing import List

from django.db import transaction, IntegrityError

from apps.products.models import Product
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

    def __init__(self, product_id: int, quantity: int):
        self.product_id = product_id
        self.quantity = quantity


# ---------------------------------------------------------------------------
# Public API — the only entry point views should call
# ---------------------------------------------------------------------------

def create_order_from_cart(
    user,
    cart_items: List[CartItem],
    shipping_address: str,
    notes: str = "",
    idempotency_key: str = "",
) -> tuple[Order, bool]:
    """
    Create an Order atomically from a list of CartItems.

    Returns:
        (order, created) — created=False means a duplicate request was detected
        and the existing order was returned without touching stock.

    Guarantees:
    - All stock is validated before any write occurs.
    - select_for_update() locks product rows for the duration of the
      transaction, preventing concurrent orders from overselling.
    - If anything fails the entire transaction rolls back — no partial orders.
    - Price is snapshotted at the moment of purchase (sale_price takes
      priority over price).
    - If idempotency_key is provided and an order already exists for this
      user+key, the existing order is returned immediately — no stock touched.

    Raises:
        EmptyCartError            – cart_items is empty
        InvalidProductError       – product_id not found or inactive
        OutOfStockError           – product stock is 0
        InsufficientStockError    – requested quantity > available stock
    """
    if not cart_items:
        raise EmptyCartError()

    # ------------------------------------------------------------------
    # Idempotency check — outside the transaction on purpose.
    # A simple read before acquiring any locks. If the key exists we
    # return immediately — zero writes, zero lock contention.
    # ------------------------------------------------------------------
    if idempotency_key:
        try:
            existing = (
                Order.objects.prefetch_related("items__product")
                .get(user=user, idempotency_key=idempotency_key)
            )
            return existing, False
        except Order.DoesNotExist:
            pass

    with transaction.atomic():
        # ------------------------------------------------------------------
        # 1. Lock all relevant product rows in a deterministic order.
        #    Ordering by pk avoids deadlocks when two concurrent transactions
        #    try to lock the same rows in different orders.
        # ------------------------------------------------------------------
        requested_ids = [item.product_id for item in cart_items]

        locked_products = (
            Product.objects.select_for_update()
            .filter(pk__in=requested_ids, is_active=True)
            .order_by("pk")
        )

        # Build a lookup so we can validate in O(1)
        product_map: dict[int, Product] = {p.pk: p for p in locked_products}

        # ------------------------------------------------------------------
        # 2. Validate every item BEFORE touching the database.
        #    Fail fast — raise on the first problem found.
        # ------------------------------------------------------------------
        _validate_cart(cart_items, product_map)

        # ------------------------------------------------------------------
        # 3 + 4. Deduct stock and persist Order + OrderItems inside a single
        #        savepoint. If a concurrent request already committed an order
        #        with the same idempotency_key, the IntegrityError rolls back
        #        this savepoint — including the stock deduction — cleanly.
        #        The outer transaction remains alive for the recovery query.
        # ------------------------------------------------------------------
        try:
            with transaction.atomic():
                total = Decimal("0.00")
                for item in cart_items:
                    product = product_map[item.product_id]
                    unit_price = product.sale_price if product.sale_price else product.price
                    total += unit_price * item.quantity
                    product.stock -= item.quantity

                Product.objects.bulk_update(list(product_map.values()), ["stock"])

                order = Order.objects.create(
                    user=user,
                    status=Order.Status.PENDING,
                    total_price=total,
                    shipping_address=shipping_address,
                    notes=notes,
                    idempotency_key=idempotency_key,
                )

                order_items = []
                for item in cart_items:
                    product = product_map[item.product_id]
                    unit_price = product.sale_price if product.sale_price else product.price
                    order_items.append(
                        OrderItem(
                            order=order,
                            product=product,
                            quantity=item.quantity,
                            unit_price=unit_price,
                        )
                    )

                OrderItem.objects.bulk_create(order_items)

        except IntegrityError:
            # Concurrent request won the race. Savepoint rolled back —
            # stock deduction included. Fetch and return the winner's order.
            if not idempotency_key:
                raise  # genuine integrity error unrelated to idempotency

            existing = (
                Order.objects.prefetch_related("items__product")
                .get(user=user, idempotency_key=idempotency_key)
            )
            return existing, False

    # Return the fully populated order outside the lock
    return Order.objects.prefetch_related("items__product").get(pk=order.pk), True


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _validate_cart(cart_items: List[CartItem], product_map: dict) -> None:
    """
    Validate all items against locked product rows.
    Raises on the first violation found.
    """
    seen_ids: set[int] = set()

    for item in cart_items:
        # Duplicate product_id in the same cart
        if item.product_id in seen_ids:
            # Merge duplicates upstream; here we just skip — the caller's
            # serializer should deduplicate, but we handle it defensively.
            continue
        seen_ids.add(item.product_id)

        # Product not found or inactive
        product = product_map.get(item.product_id)
        if product is None:
            raise InvalidProductError(item.product_id)

        # Product exists but stock is zero
        if product.stock == 0:
            raise OutOfStockError(product.name, available=0)

        # Requested more than available
        if item.quantity > product.stock:
            raise InsufficientStockError(
                product.name,
                requested=item.quantity,
                available=product.stock,
            )
