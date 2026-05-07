import pytest
from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.products.models import Product, ProductVariant, Category
from apps.orders.models import Order
from apps.shipping.models import ShippingZone, ShippingMethod
from decimal import Decimal

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user():
    return User.objects.create_user(
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )

@pytest.fixture
def admin_user():
    return User.objects.create_superuser(
        email='admin@example.com',
        password='adminpass123'
    )

@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def category():
    return Category.objects.create(
        name='Test Category',
        slug='test-category'
    )

@pytest.fixture
def product(category):
    return Product.objects.create(
        name='Test Product',
        slug='test-product',
        description='Test description',
        price=Decimal('99.99'),
        category=category,
        is_active=True
    )

@pytest.fixture
def product_variant(product):
    return ProductVariant.objects.create(
        product=product,
        size='M',
        color='Black',
        sku='TEST-M-BLACK',
        stock_quantity=10,
        price=Decimal('99.99')
    )

@pytest.fixture
def shipping_zone():
    return ShippingZone.objects.create(
        name='Test Zone',
        countries=['US']
    )

@pytest.fixture
def shipping_method(shipping_zone):
    return ShippingMethod.objects.create(
        zone=shipping_zone,
        name='Standard Shipping',
        price=Decimal('9.99'),
        min_delivery_days=3,
        max_delivery_days=7
    )