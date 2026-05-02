import pytest
import json
from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
import stripe

from apps.products.models import Category, Product
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.payments.services import (
    get_or_create_payment_intent,
    handle_webhook,
    _to_cents,
)
from apps.payments.exceptions import (
    OrderNotFoundError,
    OrderNotPayableError,
    StripeGatewayError,
)

User = get_user_model()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="buyer", email="buyer@femvelle.com", password="pass1234"
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        username="other", email="other@femvelle.com", password="pass1234"
    )


@pytest.fixture
def pending_order(db, user):
    category = Category.objects.create(name="Abayas", slug="abayas")
    Product.objects.create(
        name="Classic Abaya", slug="classic-abaya", category=category,
        price=Decimal("120.00"), stock=10, is_active=True,
    )
    return Order.objects.create(
        user=user,
        status=Order.Status.PENDING,
        total_price=Decimal("120.00"),
        shipping_address="123 Main St, Riyadh",
    )


@pytest.fixture
def paid_order(db, user):
    return Order.objects.create(
        user=user,
        status=Order.Status.PAID,
        total_price=Decimal("120.00"),
        shipping_address="123 Main St, Riyadh",
    )


@pytest.fixture
def mock_intent():
    intent = MagicMock()
    intent.id = "pi_test_abc123"
    intent.client_secret = "pi_test_abc123_secret_xyz"
    return intent


# ---------------------------------------------------------------------------
# Unit: _to_cents
# ---------------------------------------------------------------------------

def test_to_cents_whole():
    assert _to_cents(Decimal("120.00")) == 12000


def test_to_cents_fractional():
    assert _to_cents(Decimal("9.99")) == 999


# ---------------------------------------------------------------------------
# get_or_create_payment_intent — order validation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_raises_order_not_found_for_wrong_user(other_user, pending_order):
    with pytest.raises(OrderNotFoundError):
        get_or_create_payment_intent(user=other_user, order_id=pending_order.pk)


@pytest.mark.django_db
def test_raises_order_not_found_for_missing_order(user):
    with pytest.raises(OrderNotFoundError):
        get_or_create_payment_intent(user=user, order_id=99999)


@pytest.mark.django_db
def test_raises_order_not_payable_when_already_paid(user, paid_order):
    with pytest.raises(OrderNotPayableError):
        get_or_create_payment_intent(user=user, order_id=paid_order.pk)


# ---------------------------------------------------------------------------
# get_or_create_payment_intent — happy path
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_creates_payment_intent_and_payment_record(user, pending_order, mock_intent):
    with patch("apps.payments.services.stripe.PaymentIntent.create", return_value=mock_intent):
        secret = get_or_create_payment_intent(user=user, order_id=pending_order.pk)

    assert secret == mock_intent.client_secret
    assert Payment.objects.count() == 1

    payment = Payment.objects.get(order=pending_order)
    assert payment.stripe_payment_intent_id == "pi_test_abc123"
    assert payment.status == Payment.Status.PENDING
    assert payment.amount == Decimal("120.00")
    assert payment.provider == "stripe"


@pytest.mark.django_db
def test_stripe_called_with_correct_amount(user, pending_order, mock_intent):
    with patch("apps.payments.services.stripe.PaymentIntent.create", return_value=mock_intent) as mock_create:
        get_or_create_payment_intent(user=user, order_id=pending_order.pk)

    call_kwargs = mock_create.call_args.kwargs
    assert call_kwargs["amount"] == 12000  # 120.00 * 100
    assert call_kwargs["metadata"]["order_id"] == pending_order.pk
    assert call_kwargs["metadata"]["user_email"] == user.email
    assert call_kwargs["idempotency_key"] == f"order-{pending_order.pk}-intent"


# ---------------------------------------------------------------------------
# get_or_create_payment_intent — idempotency
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_returns_existing_client_secret_without_creating_new_intent(
    user, pending_order, mock_intent
):
    # Pre-existing Payment record
    Payment.objects.create(
        order=pending_order,
        user=user,
        amount=pending_order.total_price,
        status=Payment.Status.PENDING,
        provider="stripe",
        stripe_payment_intent_id="pi_existing_123",
    )

    retrieved_intent = MagicMock()
    retrieved_intent.client_secret = "pi_existing_123_secret"

    with patch("apps.payments.services.stripe.PaymentIntent.create") as mock_create, \
         patch("apps.payments.services.stripe.PaymentIntent.retrieve", return_value=retrieved_intent):
        secret = get_or_create_payment_intent(user=user, order_id=pending_order.pk)

    mock_create.assert_not_called()
    assert secret == "pi_existing_123_secret"
    assert Payment.objects.count() == 1  # no new record created


# ---------------------------------------------------------------------------
# get_or_create_payment_intent — Stripe error handling
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_raises_stripe_gateway_error_on_stripe_failure(user, pending_order):
    with patch(
        "apps.payments.services.stripe.PaymentIntent.create",
        side_effect=stripe.error.StripeError("Network error"),
    ):
        with pytest.raises(StripeGatewayError):
            get_or_create_payment_intent(user=user, order_id=pending_order.pk)

    # No Payment record should be created on Stripe failure
    assert Payment.objects.count() == 0


# ---------------------------------------------------------------------------
# Webhook: signature verification
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_handle_webhook_raises_on_invalid_signature():
    with patch(
        "apps.payments.services.stripe.Webhook.construct_event",
        side_effect=stripe.error.SignatureVerificationError("bad sig", "sig_header"),
    ):
        with pytest.raises(ValueError, match="Invalid signature"):
            handle_webhook(b"payload", "bad_sig")


# ---------------------------------------------------------------------------
# Webhook: payment_intent.succeeded
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_webhook_succeeded_marks_order_paid(user, pending_order):
    payment = Payment.objects.create(
        order=pending_order,
        user=user,
        amount=pending_order.total_price,
        status=Payment.Status.PENDING,
        provider="stripe",
        stripe_payment_intent_id="pi_test_success_001",
    )

    event = _build_event("payment_intent.succeeded", "pi_test_success_001")

    with patch("apps.payments.services.stripe.Webhook.construct_event", return_value=event):
        handle_webhook(b"payload", "sig")

    payment.refresh_from_db()
    pending_order.refresh_from_db()
    assert payment.status == Payment.Status.COMPLETED
    assert pending_order.status == Order.Status.PAID


@pytest.mark.django_db
def test_webhook_succeeded_is_idempotent(user, pending_order):
    """succeeded webhook on an already-PAID order must be a no-op."""
    payment = Payment.objects.create(
        order=pending_order,
        user=user,
        amount=pending_order.total_price,
        status=Payment.Status.COMPLETED,
        provider="stripe",
        stripe_payment_intent_id="pi_test_idempotent_001",
    )
    pending_order.status = Order.Status.PAID
    pending_order.save()

    event = _build_event("payment_intent.succeeded", "pi_test_idempotent_001")

    with patch("apps.payments.services.stripe.Webhook.construct_event", return_value=event):
        handle_webhook(b"payload", "sig")  # must not raise

    payment.refresh_from_db()
    pending_order.refresh_from_db()
    assert payment.status == Payment.Status.COMPLETED
    assert pending_order.status == Order.Status.PAID


@pytest.mark.django_db
def test_webhook_succeeded_ignored_when_order_already_failed(user, pending_order):
    """FAILED → PAID transition must be blocked."""
    payment = Payment.objects.create(
        order=pending_order,
        user=user,
        amount=pending_order.total_price,
        status=Payment.Status.FAILED,
        provider="stripe",
        stripe_payment_intent_id="pi_test_failed_to_paid",
    )
    pending_order.status = Order.Status.FAILED
    pending_order.save()

    event = _build_event("payment_intent.succeeded", "pi_test_failed_to_paid")

    with patch("apps.payments.services.stripe.Webhook.construct_event", return_value=event):
        handle_webhook(b"payload", "sig")

    payment.refresh_from_db()
    pending_order.refresh_from_db()
    # Neither record must change
    assert payment.status == Payment.Status.FAILED
    assert pending_order.status == Order.Status.FAILED


# ---------------------------------------------------------------------------
# Webhook: payment_intent.payment_failed
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_webhook_failed_marks_order_failed(user, pending_order):
    payment = Payment.objects.create(
        order=pending_order,
        user=user,
        amount=pending_order.total_price,
        status=Payment.Status.PENDING,
        provider="stripe",
        stripe_payment_intent_id="pi_test_fail_001",
    )

    event = _build_event("payment_intent.payment_failed", "pi_test_fail_001")

    with patch("apps.payments.services.stripe.Webhook.construct_event", return_value=event):
        handle_webhook(b"payload", "sig")

    payment.refresh_from_db()
    pending_order.refresh_from_db()
    assert payment.status == Payment.Status.FAILED
    assert pending_order.status == Order.Status.FAILED


@pytest.mark.django_db
def test_webhook_failed_is_idempotent(user, pending_order):
    """failed webhook on an already-FAILED order must be a no-op."""
    payment = Payment.objects.create(
        order=pending_order,
        user=user,
        amount=pending_order.total_price,
        status=Payment.Status.FAILED,
        provider="stripe",
        stripe_payment_intent_id="pi_test_fail_idem_001",
    )
    pending_order.status = Order.Status.FAILED
    pending_order.save()

    event = _build_event("payment_intent.payment_failed", "pi_test_fail_idem_001")

    with patch("apps.payments.services.stripe.Webhook.construct_event", return_value=event):
        handle_webhook(b"payload", "sig")  # must not raise

    payment.refresh_from_db()
    assert payment.status == Payment.Status.FAILED


@pytest.mark.django_db
def test_webhook_failed_ignored_when_order_already_paid(user, pending_order):
    """PAID → FAILED transition must be blocked."""
    payment = Payment.objects.create(
        order=pending_order,
        user=user,
        amount=pending_order.total_price,
        status=Payment.Status.COMPLETED,
        provider="stripe",
        stripe_payment_intent_id="pi_test_paid_to_failed",
    )
    pending_order.status = Order.Status.PAID
    pending_order.save()

    event = _build_event("payment_intent.payment_failed", "pi_test_paid_to_failed")

    with patch("apps.payments.services.stripe.Webhook.construct_event", return_value=event):
        handle_webhook(b"payload", "sig")

    payment.refresh_from_db()
    pending_order.refresh_from_db()
    # Neither record must change
    assert payment.status == Payment.Status.COMPLETED
    assert pending_order.status == Order.Status.PAID


@pytest.mark.django_db
def test_webhook_unknown_intent_id_does_not_raise(user):
    """Webhook for an unknown intent must log and return, not raise."""
    event = _build_event("payment_intent.succeeded", "pi_unknown_999")

    with patch("apps.payments.services.stripe.Webhook.construct_event", return_value=event):
        handle_webhook(b"payload", "sig")  # must not raise


@pytest.mark.django_db
def test_webhook_unhandled_event_type_does_not_raise():
    event = _build_event("customer.created", "pi_irrelevant")

    with patch("apps.payments.services.stripe.Webhook.construct_event", return_value=event):
        handle_webhook(b"payload", "sig")  # must not raise


# ---------------------------------------------------------------------------
# API: create-intent endpoint
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_create_intent_api_returns_client_secret(user, pending_order, mock_intent):
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=user)

    with patch("apps.payments.services.stripe.PaymentIntent.create", return_value=mock_intent):
        res = client.post(
            "/api/payments/create-intent/",
            {"order_id": pending_order.pk},
            format="json",
        )

    assert res.status_code == 200
    assert res.json()["client_secret"] == mock_intent.client_secret


@pytest.mark.django_db
def test_create_intent_api_requires_auth(pending_order):
    from rest_framework.test import APIClient
    client = APIClient()
    res = client.post("/api/payments/create-intent/", {"order_id": pending_order.pk}, format="json")
    assert res.status_code == 401


@pytest.mark.django_db
def test_create_intent_api_returns_400_for_paid_order(user, paid_order):
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=user)
    res = client.post("/api/payments/create-intent/", {"order_id": paid_order.pk}, format="json")
    assert res.status_code == 400


# ---------------------------------------------------------------------------
# API: webhook endpoint
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_webhook_endpoint_returns_400_on_bad_signature():
    from rest_framework.test import APIClient
    client = APIClient()

    with patch(
        "apps.payments.services.stripe.Webhook.construct_event",
        side_effect=stripe.error.SignatureVerificationError("bad", "sig"),
    ):
        res = client.post(
            "/api/payments/webhook/",
            data=b"payload",
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="bad_sig",
        )

    assert res.status_code == 400


@pytest.mark.django_db
def test_webhook_endpoint_returns_200_on_valid_event(user, pending_order):
    from rest_framework.test import APIClient
    client = APIClient()

    Payment.objects.create(
        order=pending_order, user=user,
        amount=pending_order.total_price,
        status=Payment.Status.PENDING,
        provider="stripe",
        stripe_payment_intent_id="pi_webhook_api_001",
    )
    event = _build_event("payment_intent.succeeded", "pi_webhook_api_001")

    with patch("apps.payments.services.stripe.Webhook.construct_event", return_value=event):
        res = client.post(
            "/api/payments/webhook/",
            data=b"payload",
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="valid_sig",
        )

    assert res.status_code == 200


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_event(event_type: str, intent_id: str) -> dict:
    """Build a minimal Stripe event dict for testing."""
    return {
        "type": event_type,
        "data": {
            "object": {
                "id": intent_id,
                "object": "payment_intent",
            }
        },
    }
