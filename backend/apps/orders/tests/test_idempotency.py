"""
Concurrency test for idempotency constraint.

Verifies that:
1. Concurrent requests with the same idempotency_key trigger IntegrityError
2. The IntegrityError is caught and the existing order is returned
3. Stock deductions are rolled back on the duplicate request
4. Only one order is created in the database
"""
import threading
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.db import connection

from apps.orders.models import Order
from apps.orders.services import CartItem, create_order_from_cart
from apps.products.models import Product, ProductVariant

User = get_user_model()


def _is_sqlite():
    return connection.vendor == "sqlite"


@pytest.mark.django_db(transaction=True)
class TestIdempotencyConstraint:
    """Test suite for idempotency constraint."""

    @pytest.fixture
    def user(self, db):
        return User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="testpass123",
        )

    @pytest.fixture
    def product(self, db):
        return Product.objects.create(
            name="Test Abaya",
            slug="test-abaya",
            price=Decimal("100.00"),
            stock=10,
            is_active=True,
        )

    @pytest.fixture
    def variant(self, product):
        return ProductVariant.objects.create(
            product=product,
            size="M",
            color="Black",
            sku="TEST-ABAYA-M-BLK",
            stock=5,
            price_override=Decimal("110.00"),
        )

    @pytest.mark.skipif(
        _is_sqlite(),
        reason="SQLite does not support concurrent writes; run against MySQL/PostgreSQL",
    )
    def test_concurrent_checkout_with_same_idempotency_key(self, user, product):
        """
        Two threads attempt to create an order with the same idempotency_key.
        Only one order should be created; the second should return the existing order.
        """
        idempotency_key = "test-concurrent-key-001"
        cart_items = [CartItem(product_id=product.id, quantity=2)]
        shipping_address = "123 Test St, Test City, Test Country"

        results = []
        errors = []

        def checkout():
            try:
                order, created = create_order_from_cart(
                    user=user,
                    cart_items=cart_items,
                    shipping_address=shipping_address,
                    idempotency_key=idempotency_key,
                )
                results.append((order, created))
            except Exception as exc:
                errors.append(exc)

        thread1 = threading.Thread(target=checkout)
        thread2 = threading.Thread(target=checkout)
        thread1.start()
        thread2.start()
        thread1.join()
        thread2.join()

        assert len(errors) == 0, f"Unexpected errors: {errors}"
        assert len(results) == 2

        order_count = Order.objects.filter(
            user=user, idempotency_key=idempotency_key
        ).count()
        assert order_count == 1, f"Expected 1 order, got {order_count}"

        created_flags = [c for _, c in results]
        assert created_flags.count(True) == 1
        assert created_flags.count(False) == 1
        assert results[0][0].id == results[1][0].id

        product.refresh_from_db()
        assert product.stock == 8  # 10 - 2 = 8

    @pytest.mark.skipif(
        _is_sqlite(),
        reason="SQLite does not support concurrent writes; run against MySQL/PostgreSQL",
    )
    def test_concurrent_checkout_with_variant(self, user, product, variant):
        """Idempotency holds when ordering a specific variant."""
        idempotency_key = "test-variant-key-001"
        cart_items = [CartItem(product_id=product.id, variant_id=variant.id, quantity=1)]

        results = []

        def checkout():
            order, created = create_order_from_cart(
                user=user,
                cart_items=cart_items,
                shipping_address="456 Variant St, Test City",
                idempotency_key=idempotency_key,
            )
            results.append((order, created))

        thread1 = threading.Thread(target=checkout)
        thread2 = threading.Thread(target=checkout)
        thread1.start()
        thread2.start()
        thread1.join()
        thread2.join()

        assert Order.objects.filter(user=user, idempotency_key=idempotency_key).count() == 1
        variant.refresh_from_db()
        assert variant.stock == 4  # 5 - 1 = 4

    def test_blank_idempotency_key_allows_duplicates(self, user, product):
        """Orders with blank idempotency_key are allowed to duplicate (admin/manual orders)."""
        cart_items = [CartItem(product_id=product.id, quantity=1)]

        order1, created1 = create_order_from_cart(
            user=user, cart_items=cart_items,
            shipping_address="789 Manual Order St", idempotency_key="",
        )
        order2, created2 = create_order_from_cart(
            user=user, cart_items=cart_items,
            shipping_address="789 Manual Order St", idempotency_key="",
        )

        assert created1 is True
        assert created2 is True
        assert order1.id != order2.id
        assert Order.objects.filter(user=user, idempotency_key="").count() == 2

    def test_different_users_same_idempotency_key(self, product):
        """Different users can use the same idempotency_key — constraint is per-user."""
        user1 = User.objects.create_user(
            email="user1@example.com", username="user1", password="pass"
        )
        user2 = User.objects.create_user(
            email="user2@example.com", username="user2", password="pass"
        )
        cart_items = [CartItem(product_id=product.id, quantity=1)]
        key = "shared-key-001"

        order1, created1 = create_order_from_cart(
            user=user1, cart_items=cart_items,
            shipping_address="User1 St", idempotency_key=key,
        )
        order2, created2 = create_order_from_cart(
            user=user2, cart_items=cart_items,
            shipping_address="User2 St", idempotency_key=key,
        )

        assert created1 is True
        assert created2 is True
        assert order1.id != order2.id
        assert order1.user == user1
        assert order2.user == user2

    def test_sequential_requests_with_same_key_return_existing(self, user, product):
        """Sequential retries with the same key return the existing order without creating a duplicate."""
        key = "sequential-key-001"
        cart_items = [CartItem(product_id=product.id, quantity=3)]

        order1, created1 = create_order_from_cart(
            user=user, cart_items=cart_items,
            shipping_address="Sequential Test St", idempotency_key=key,
        )
        order2, created2 = create_order_from_cart(
            user=user, cart_items=cart_items,
            shipping_address="Sequential Test St", idempotency_key=key,
        )

        assert created1 is True
        assert created2 is False
        assert order1.id == order2.id
        assert Order.objects.filter(user=user, idempotency_key=key).count() == 1

        product.refresh_from_db()
        assert product.stock == 7  # 10 - 3 = 7
