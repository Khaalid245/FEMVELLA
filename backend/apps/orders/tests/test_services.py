import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from apps.products.models import Category, Product
from apps.orders.models import Order, OrderItem
from apps.orders.services import CartItem, create_order_from_cart
from apps.orders.exceptions import (
    OutOfStockError,
    InsufficientStockError,
    InvalidProductError,
    EmptyCartError,
)

User = get_user_model()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="testuser", email="test@femvelle.com", password="pass1234"
    )


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


@pytest.fixture
def product_on_sale(db, category):
    return Product.objects.create(
        name="Sale Abaya",
        slug="sale-abaya",
        category=category,
        price=Decimal("100.00"),
        sale_price=Decimal("75.00"),
        stock=5,
        is_active=True,
    )


@pytest.fixture
def out_of_stock_product(db, category):
    return Product.objects.create(
        name="Sold Out Abaya",
        slug="sold-out-abaya",
        category=category,
        price=Decimal("90.00"),
        stock=0,
        is_active=True,
    )


@pytest.fixture
def inactive_product(db, category):
    return Product.objects.create(
        name="Inactive Abaya",
        slug="inactive-abaya",
        category=category,
        price=Decimal("80.00"),
        stock=10,
        is_active=False,
    )


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_create_order_success(user, product):
    order = create_order_from_cart(
        user=user,
        cart_items=[CartItem(product_id=product.pk, quantity=2)],
        shipping_address="123 Main St, Riyadh, Saudi Arabia",
    )

    assert order.pk is not None
    assert order.status == Order.Status.PENDING
    assert order.user == user
    assert order.total_price == Decimal("240.00")
    assert order.items.count() == 1

    item = order.items.first()
    assert item.quantity == 2
    assert item.unit_price == Decimal("120.00")
    assert item.subtotal == Decimal("240.00")

    # Stock must be deducted
    product.refresh_from_db()
    assert product.stock == 8


@pytest.mark.django_db
def test_create_order_uses_sale_price(user, product_on_sale):
    order = create_order_from_cart(
        user=user,
        cart_items=[CartItem(product_id=product_on_sale.pk, quantity=1)],
        shipping_address="123 Main St, Riyadh, Saudi Arabia",
    )

    assert order.total_price == Decimal("75.00")
    item = order.items.first()
    assert item.unit_price == Decimal("75.00")


@pytest.mark.django_db
def test_create_order_multiple_items(user, product, product_on_sale):
    order = create_order_from_cart(
        user=user,
        cart_items=[
            CartItem(product_id=product.pk, quantity=1),
            CartItem(product_id=product_on_sale.pk, quantity=2),
        ],
        shipping_address="123 Main St, Riyadh, Saudi Arabia",
    )

    # 120.00 + (75.00 * 2) = 270.00
    assert order.total_price == Decimal("270.00")
    assert order.items.count() == 2

    product.refresh_from_db()
    product_on_sale.refresh_from_db()
    assert product.stock == 9
    assert product_on_sale.stock == 3


# ---------------------------------------------------------------------------
# Edge cases — stock validation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_raises_empty_cart(user):
    with pytest.raises(EmptyCartError):
        create_order_from_cart(
            user=user,
            cart_items=[],
            shipping_address="123 Main St",
        )


@pytest.mark.django_db
def test_raises_out_of_stock(user, out_of_stock_product):
    with pytest.raises(OutOfStockError):
        create_order_from_cart(
            user=user,
            cart_items=[CartItem(product_id=out_of_stock_product.pk, quantity=1)],
            shipping_address="123 Main St",
        )


@pytest.mark.django_db
def test_raises_insufficient_stock(user, product):
    with pytest.raises(InsufficientStockError):
        create_order_from_cart(
            user=user,
            cart_items=[CartItem(product_id=product.pk, quantity=999)],
            shipping_address="123 Main St",
        )


@pytest.mark.django_db
def test_raises_invalid_product_id(user):
    with pytest.raises(InvalidProductError):
        create_order_from_cart(
            user=user,
            cart_items=[CartItem(product_id=99999, quantity=1)],
            shipping_address="123 Main St",
        )


@pytest.mark.django_db
def test_raises_inactive_product(user, inactive_product):
    with pytest.raises(InvalidProductError):
        create_order_from_cart(
            user=user,
            cart_items=[CartItem(product_id=inactive_product.pk, quantity=1)],
            shipping_address="123 Main St",
        )


# ---------------------------------------------------------------------------
# Atomicity — partial failure must roll back everything
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_atomic_rollback_on_invalid_item(user, product, out_of_stock_product):
    """
    First item is valid, second is out of stock.
    No order should be created and stock must be unchanged.
    """
    stock_before = product.stock

    with pytest.raises(OutOfStockError):
        create_order_from_cart(
            user=user,
            cart_items=[
                CartItem(product_id=product.pk, quantity=1),
                CartItem(product_id=out_of_stock_product.pk, quantity=1),
            ],
            shipping_address="123 Main St",
        )

    assert Order.objects.count() == 0
    product.refresh_from_db()
    assert product.stock == stock_before  # untouched


@pytest.mark.django_db
def test_no_partial_order_on_invalid_product(user, product):
    stock_before = product.stock

    with pytest.raises(InvalidProductError):
        create_order_from_cart(
            user=user,
            cart_items=[
                CartItem(product_id=product.pk, quantity=1),
                CartItem(product_id=99999, quantity=1),
            ],
            shipping_address="123 Main St",
        )

    assert Order.objects.count() == 0
    product.refresh_from_db()
    assert product.stock == stock_before
