import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.products.models import Category, Product
from apps.orders.models import Order

User = get_user_model()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="buyer", email="buyer@femvelle.com", password="pass1234"
    )


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def category(db):
    return Category.objects.create(name="Abayas", slug="abayas")


@pytest.fixture
def product(db, category):
    return Product.objects.create(
        name="Classic Abaya",
        slug="classic-abaya",
        category=category,
        price=Decimal("120.00"),
        stock=10,
        is_active=True,
    )


CHECKOUT_URL = "/api/orders/checkout/"


# ---------------------------------------------------------------------------
# Auth guard
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_checkout_requires_authentication(api_client, product):
    res = api_client.post(CHECKOUT_URL, {
        "items": [{"product_id": product.pk, "quantity": 1}],
        "shipping_address": "123 Main St, Riyadh",
    }, format="json")
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_checkout_creates_order(auth_client, product):
    res = auth_client.post(CHECKOUT_URL, {
        "items": [{"product_id": product.pk, "quantity": 2}],
        "shipping_address": "123 Main St, Riyadh, Saudi Arabia",
        "notes": "Ring the bell",
    }, format="json")

    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "pending"
    assert Decimal(data["total_price"]) == Decimal("240.00")
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2
    assert data["items"][0]["product_name"] == "Classic Abaya"

    assert Order.objects.count() == 1
    product.refresh_from_db()
    assert product.stock == 8


# ---------------------------------------------------------------------------
# Validation errors — 400
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_checkout_empty_items_returns_400(auth_client):
    res = auth_client.post(CHECKOUT_URL, {
        "items": [],
        "shipping_address": "123 Main St",
    }, format="json")
    assert res.status_code == 400


@pytest.mark.django_db
def test_checkout_missing_shipping_address_returns_400(auth_client, product):
    res = auth_client.post(CHECKOUT_URL, {
        "items": [{"product_id": product.pk, "quantity": 1}],
    }, format="json")
    assert res.status_code == 400


@pytest.mark.django_db
def test_checkout_zero_quantity_returns_400(auth_client, product):
    res = auth_client.post(CHECKOUT_URL, {
        "items": [{"product_id": product.pk, "quantity": 0}],
        "shipping_address": "123 Main St, Riyadh",
    }, format="json")
    assert res.status_code == 400


@pytest.mark.django_db
def test_checkout_invalid_product_returns_400(auth_client):
    res = auth_client.post(CHECKOUT_URL, {
        "items": [{"product_id": 99999, "quantity": 1}],
        "shipping_address": "123 Main St, Riyadh",
    }, format="json")
    assert res.status_code == 400


# ---------------------------------------------------------------------------
# Stock conflict errors — 409
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_checkout_out_of_stock_returns_409(auth_client, category):
    sold_out = Product.objects.create(
        name="Sold Out", slug="sold-out", category=category,
        price=Decimal("50.00"), stock=0, is_active=True,
    )
    res = auth_client.post(CHECKOUT_URL, {
        "items": [{"product_id": sold_out.pk, "quantity": 1}],
        "shipping_address": "123 Main St, Riyadh",
    }, format="json")
    assert res.status_code == 409
    assert Order.objects.count() == 0


@pytest.mark.django_db
def test_checkout_exceeds_stock_returns_409(auth_client, product):
    res = auth_client.post(CHECKOUT_URL, {
        "items": [{"product_id": product.pk, "quantity": 999}],
        "shipping_address": "123 Main St, Riyadh",
    }, format="json")
    assert res.status_code == 409
    assert Order.objects.count() == 0
    product.refresh_from_db()
    assert product.stock == 10  # unchanged


# ---------------------------------------------------------------------------
# Deduplication — duplicate product_id in same cart merges quantities
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_checkout_deduplicates_cart_items(auth_client, product):
    res = auth_client.post(CHECKOUT_URL, {
        "items": [
            {"product_id": product.pk, "quantity": 2},
            {"product_id": product.pk, "quantity": 3},
        ],
        "shipping_address": "123 Main St, Riyadh",
    }, format="json")

    assert res.status_code == 201
    data = res.json()
    # merged: quantity=5, total=600.00
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 5
    assert Decimal(data["total_price"]) == Decimal("600.00")
    product.refresh_from_db()
    assert product.stock == 5


# ---------------------------------------------------------------------------
# Idempotency — API level
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_duplicate_request_returns_200_not_201(auth_client, product):
    payload = {
        "idempotency_key": "client-uuid-aabbcc",
        "items": [{"product_id": product.pk, "quantity": 1}],
        "shipping_address": "123 Main St, Riyadh, Saudi Arabia",
    }

    res1 = auth_client.post(CHECKOUT_URL, payload, format="json")
    assert res1.status_code == 201

    res2 = auth_client.post(CHECKOUT_URL, payload, format="json")
    assert res2.status_code == 200  # duplicate — existing order returned

    # Same order id in both responses
    assert res1.json()["id"] == res2.json()["id"]
    assert Order.objects.count() == 1

    # Stock deducted only once
    product.refresh_from_db()
    assert product.stock == 9


@pytest.mark.django_db
def test_idempotency_key_in_response(auth_client, product):
    key = "my-unique-key-123"
    res = auth_client.post(CHECKOUT_URL, {
        "idempotency_key": key,
        "items": [{"product_id": product.pk, "quantity": 1}],
        "shipping_address": "123 Main St, Riyadh, Saudi Arabia",
    }, format="json")

    assert res.status_code == 201
    assert res.json()["idempotency_key"] == key
