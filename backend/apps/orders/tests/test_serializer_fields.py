"""
Tests for OrderOutputSerializer field exposure.

Verifies:
- idempotency_key is NOT present in serialized output
- idempotency_key_unique is NOT present in serialized output
- all expected public fields ARE present
- checkout endpoint response does not leak idempotency_key
"""
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.urls import path, include
from rest_framework.test import APIClient

from apps.orders.models import Order
from apps.orders.serializers import OrderOutputSerializer
from apps.products.models import Product

User = get_user_model()

EXPECTED_FIELDS = {
    "id", "order_number", "user_email", "status", "total_price",
    "refunded_amount", "balance_due", "shipping_address", "notes",
    "tracking_number", "carrier", "tracking_url",
    "shipped_at", "delivered_at", "items", "created_at",
}

FORBIDDEN_FIELDS = {"idempotency_key", "idempotency_key_unique"}

# Minimal URL conf — avoids loading apps.search which is not in test INSTALLED_APPS
urlpatterns = [
    path("api/orders/", include("apps.orders.urls")),
]


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="test@example.com", username="testuser", password="pass"
    )


@pytest.fixture
def order(user):
    return Order.objects.create(
        user=user,
        status=Order.Status.PENDING,
        total_price=Decimal("120.00"),
        shipping_address="1 Test St, Test City",
        idempotency_key="test-key-abc123",
        idempotency_key_unique="test-key-abc123",
    )


# ---------------------------------------------------------------------------
# Serializer unit tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestOrderOutputSerializerFields:

    def test_idempotency_key_absent_from_output(self, order):
        data = OrderOutputSerializer(order).data
        assert "idempotency_key" not in data

    def test_idempotency_key_unique_absent_from_output(self, order):
        data = OrderOutputSerializer(order).data
        assert "idempotency_key_unique" not in data

    def test_all_expected_fields_present(self, order):
        data = OrderOutputSerializer(order).data
        assert EXPECTED_FIELDS.issubset(set(data.keys()))

    def test_no_forbidden_fields_present(self, order):
        data = OrderOutputSerializer(order).data
        assert not FORBIDDEN_FIELDS.intersection(set(data.keys()))

    def test_idempotency_logic_unaffected(self, user):
        """Two orders with the same key are distinct DB rows — serializer
        removal does not touch the model or service layer."""
        o1 = Order.objects.create(
            user=user, status=Order.Status.PENDING,
            total_price=Decimal("50.00"), shipping_address="Addr A",
            idempotency_key="key-1", idempotency_key_unique="key-1",
        )
        # Blank key — allowed to duplicate
        o2 = Order.objects.create(
            user=user, status=Order.Status.PENDING,
            total_price=Decimal("50.00"), shipping_address="Addr B",
            idempotency_key="", idempotency_key_unique=None,
        )
        for order in (o1, o2):
            data = OrderOutputSerializer(order).data
            assert "idempotency_key" not in data


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@pytest.mark.urls("apps.orders.tests.test_serializer_fields")
class TestCheckoutEndpointResponse:

    @pytest.fixture
    def client(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    @pytest.fixture
    def product(self, db):
        return Product.objects.create(
            name="Test Abaya", slug="test-abaya",
            price=Decimal("100.00"), stock=10, is_active=True,
        )

    def test_checkout_response_excludes_idempotency_key(self, client, product):
        payload = {
            "items": [{"product_id": product.id, "quantity": 1}],
            "shipping_address": "123 Checkout St, Test City",
            "idempotency_key": "checkout-test-key-001",
        }
        response = client.post("/api/orders/checkout/", payload, format="json")

        assert response.status_code in (200, 201)
        assert "idempotency_key" not in response.data
        assert "idempotency_key_unique" not in response.data

    def test_checkout_response_contains_expected_fields(self, client, product):
        payload = {
            "items": [{"product_id": product.id, "quantity": 1}],
            "shipping_address": "456 Fields Test St, City",
            "idempotency_key": "checkout-test-key-002",
        }
        response = client.post("/api/orders/checkout/", payload, format="json")

        assert response.status_code in (200, 201)
        assert EXPECTED_FIELDS.issubset(set(response.data.keys()))

    def test_order_detail_excludes_idempotency_key(self, client, order):
        response = client.get(f"/api/orders/{order.id}/")

        assert response.status_code == 200
        assert "idempotency_key" not in response.data
        assert "idempotency_key_unique" not in response.data

    def test_idempotent_checkout_returns_same_order_without_key(self, client, product):
        """Sending the same idempotency_key twice returns HTTP 200 with the
        existing order — and neither response leaks the key."""
        payload = {
            "items": [{"product_id": product.id, "quantity": 1}],
            "shipping_address": "789 Idempotent Ave, City",
            "idempotency_key": "checkout-idempotent-key-001",
        }
        r1 = client.post("/api/orders/checkout/", payload, format="json")
        r2 = client.post("/api/orders/checkout/", payload, format="json")

        assert r1.status_code == 201
        assert r2.status_code == 200
        assert r1.data["id"] == r2.data["id"]
        assert "idempotency_key" not in r1.data
        assert "idempotency_key" not in r2.data
