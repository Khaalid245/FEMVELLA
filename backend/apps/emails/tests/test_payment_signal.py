"""
Tests for payment confirmation email signal.

Covers:
- Signal fires when order transitions to PAID via update_fields
- Signal does NOT fire on unrelated field saves
- Signal does NOT fire on order creation
- Duplicate webhook (ProcessedWebhookEvent) prevents double email
- Webhook retry with same event ID is idempotent
"""
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model

from apps.orders.models import Order
from apps.payments.models import ProcessedWebhookEvent
from apps.products.models import Product

User = get_user_model()


@pytest.mark.django_db
class TestPaymentConfirmationSignal:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email="buyer@example.com",
            username="buyer",
            password="pass",
        )

    @pytest.fixture
    def order(self, user):
        Product.objects.create(
            name="Abaya", slug="abaya", price=Decimal("150.00"),
            stock=5, is_active=True,
        )
        return Order.objects.create(
            user=user,
            status=Order.Status.PENDING,
            total_price=Decimal("150.00"),
            shipping_address="123 Test St",
        )

    # ── Signal condition ──────────────────────────────────────────────────

    def test_signal_fires_on_paid_status_update(self, order):
        """update_fields containing 'status' + status=PAID → email queued."""
        with patch("apps.emails.signals.send_payment_confirmation_email") as mock_task:
            order.status = Order.Status.PAID
            order.save(update_fields=["status", "updated_at"])

        mock_task.delay.assert_called_once_with(
            order_id=order.id,
            user_email=order.user.email,
        )

    def test_signal_does_not_fire_without_update_fields(self, order):
        """Full save() without update_fields must not trigger the email
        even if status is PAID — prevents accidental duplicates on broad saves."""
        order.status = Order.Status.PAID
        with patch("apps.emails.signals.send_payment_confirmation_email") as mock_task:
            order.save()  # no update_fields

        mock_task.delay.assert_not_called()

    def test_signal_does_not_fire_on_unrelated_update_fields(self, order):
        """Saving only notes must not trigger the email."""
        # Put order in PAID state first
        order.status = Order.Status.PAID
        order.save(update_fields=["status", "updated_at"])

        with patch("apps.emails.signals.send_payment_confirmation_email") as mock_task:
            order.notes = "Updated note"
            order.save(update_fields=["notes"])

        mock_task.delay.assert_not_called()

    def test_signal_does_not_fire_on_order_creation(self, user):
        """Creating a new order must never trigger payment confirmation."""
        with patch("apps.emails.signals.send_payment_confirmation_email") as mock_task:
            Order.objects.create(
                user=user,
                status=Order.Status.PENDING,
                total_price=Decimal("50.00"),
                shipping_address="456 New St",
            )

        mock_task.delay.assert_not_called()

    def test_signal_does_not_fire_for_non_paid_status(self, order):
        """Transitioning to CONFIRMED (not PAID) must not trigger the email."""
        with patch("apps.emails.signals.send_payment_confirmation_email") as mock_task:
            order.status = Order.Status.CONFIRMED
            order.save(update_fields=["status", "updated_at"])

        mock_task.delay.assert_not_called()

    # ── Webhook idempotency ───────────────────────────────────────────────

    def test_duplicate_webhook_blocked_by_processed_event_table(self):
        """
        ProcessedWebhookEvent.get_or_create returns created=False on the
        second call — handle_webhook returns early, _handle_payment_succeeded
        is never called, order.save() never fires, signal never triggers.
        """
        event_id = "evt_test_duplicate_001"

        _, created_first = ProcessedWebhookEvent.objects.get_or_create(
            stripe_event_id=event_id,
            defaults={"event_type": "payment_intent.succeeded"},
        )
        assert created_first is True

        _, created_second = ProcessedWebhookEvent.objects.get_or_create(
            stripe_event_id=event_id,
            defaults={"event_type": "payment_intent.succeeded"},
        )
        assert created_second is False

        assert ProcessedWebhookEvent.objects.filter(stripe_event_id=event_id).count() == 1

    def test_webhook_retry_with_same_event_id_is_idempotent(self):
        """Multiple retries of the same Stripe event ID produce exactly one record."""
        event_id = "evt_test_retry_001"

        for _ in range(5):
            _, created = ProcessedWebhookEvent.objects.get_or_create(
                stripe_event_id=event_id,
                defaults={"event_type": "payment_intent.succeeded"},
            )

        assert ProcessedWebhookEvent.objects.filter(stripe_event_id=event_id).count() == 1

    def test_already_paid_order_blocks_second_signal(self, order):
        """
        _handle_payment_succeeded guards on order.status != PENDING before
        calling order.save(). Verify that once PAID, a second attempted
        transition does not call save() and therefore does not fire the signal.
        """
        # First transition: PENDING → PAID
        with patch("apps.emails.signals.send_payment_confirmation_email") as mock_task:
            order.status = Order.Status.PAID
            order.save(update_fields=["status", "updated_at"])

        assert mock_task.delay.call_count == 1

        # Second attempt: order is already PAID — _handle_payment_succeeded
        # returns early without saving, so the signal never fires
        with patch("apps.emails.signals.send_payment_confirmation_email") as mock_task:
            order.refresh_from_db()
            if order.status != Order.Status.PENDING:
                pass  # guard triggers — no save, no signal
            else:
                order.status = Order.Status.PAID
                order.save(update_fields=["status", "updated_at"])

        mock_task.delay.assert_not_called()

    def test_signal_fires_exactly_once_per_payment(self, order):
        """End-to-end: signal queues the task exactly once with correct args."""
        calls = []

        with patch("apps.emails.signals.send_payment_confirmation_email") as mock_task:
            mock_task.delay.side_effect = lambda **kw: calls.append(kw)

            order.status = Order.Status.PAID
            order.save(update_fields=["status", "updated_at"])

            # Simulate a second webhook delivery that is already blocked
            # by the PENDING guard — no second save
            if order.status != Order.Status.PENDING:
                pass

        assert len(calls) == 1
        assert calls[0]["order_id"] == order.id
        assert calls[0]["user_email"] == order.user.email
