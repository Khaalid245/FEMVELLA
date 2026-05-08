"""
Tests for transactional order confirmation email task.

Covers:
- EmailLog created with correct fields from Order model
- send_transactional_email is queued after log creation
- Task handles missing order gracefully (logs, does not raise)
- send_transactional_email: missing EmailLog returns False
- send_transactional_email: missing template marks log failed
- send_transactional_email: send failure triggers Celery retry
- send_transactional_email: exhausted retries marks log permanently failed
- send_transactional_email: success marks log sent
"""
from decimal import Decimal
from unittest.mock import MagicMock, patch, call
from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.emails.models import EmailLog, EmailTemplate
from apps.emails.tasks import (
    send_order_confirmation_email,
    send_transactional_email,
)
from apps.orders.models import Order, OrderItem
from apps.products.models import Product

User = get_user_model()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="customer@example.com",
        username="customer",
        first_name="Aisha",
        last_name="Al-Rashid",
        password="pass",
    )


@pytest.fixture
def user_no_name(db):
    """User with blank first/last name — tests username fallback."""
    return User.objects.create_user(
        email="noname@example.com",
        username="noname_user",
        password="pass",
    )


@pytest.fixture
def product(db):
    return Product.objects.create(
        name="Luxury Abaya",
        slug="luxury-abaya",
        price=Decimal("200.00"),
        stock=10,
        is_active=True,
    )


@pytest.fixture
def order(user, product):
    o = Order.objects.create(
        user=user,
        status=Order.Status.PENDING,
        total_price=Decimal("200.00"),
        shipping_address="42 Madinah Rd, Riyadh, Saudi Arabia",
        notes="Please gift wrap",
    )
    OrderItem.objects.create(
        order=o,
        product=product,
        quantity=1,
        unit_price=Decimal("200.00"),
    )
    return o


@pytest.fixture
def email_template(db):
    return EmailTemplate.objects.create(
        name="Order Confirmation",
        template_type="order_confirmation",
        subject="Order Confirmation",
        html_content="<p>Thank you for your order.</p>",
        text_content="Thank you for your order.",
        is_active=True,
    )


# ---------------------------------------------------------------------------
# send_order_confirmation_email
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSendOrderConfirmationEmail:

    def test_creates_email_log_with_correct_fields(self, order):
        """EmailLog is created with fields that actually exist on Order."""
        with patch("apps.emails.tasks.send_transactional_email"), \
             patch("apps.emails.signals.send_admin_new_order_alert"), \
             patch("apps.emails.signals.send_order_confirmation_email"):
            send_order_confirmation_email(order.id, order.user.email)

        log = EmailLog.objects.filter(
            template_type="order_confirmation",
            recipient_email=order.user.email,
        ).latest("created_at")

        assert log.recipient_user == order.user
        assert order.order_number in log.subject

        ctx = log.context_data
        # total_price — not order.total
        assert ctx["order"]["total_price"] == float(order.total_price)
        # shipping_address is a plain string, not a nested object
        assert ctx["shipping_address"] == order.shipping_address
        # user name populated
        assert ctx["user"]["first_name"] == order.user.first_name

    def test_queues_send_transactional_email(self, order):
        """send_transactional_email.delay is called with the new log's UUID."""
        with patch("apps.emails.tasks.send_transactional_email") as mock_send, \
             patch("apps.emails.signals.send_admin_new_order_alert"), \
             patch("apps.emails.signals.send_order_confirmation_email"):
            send_order_confirmation_email(order.id, order.user.email)

        log = EmailLog.objects.filter(
            template_type="order_confirmation",
            recipient_email=order.user.email,
        ).latest("created_at")
        mock_send.delay.assert_called_once_with(str(log.id))

    def test_items_list_built_from_order_items(self, order, product):
        """Context contains one item entry per OrderItem with correct values."""
        with patch("apps.emails.tasks.send_transactional_email"), \
             patch("apps.emails.signals.send_admin_new_order_alert"), \
             patch("apps.emails.signals.send_order_confirmation_email"):
            send_order_confirmation_email(order.id, order.user.email)

        ctx = EmailLog.objects.filter(
            template_type="order_confirmation",
            recipient_email=order.user.email,
        ).latest("created_at").context_data

        assert len(ctx["order"]["items"]) == 1
        item = ctx["order"]["items"][0]
        assert item["name"] == product.name
        assert item["quantity"] == 1
        assert item["unit_price"] == 200.0
        assert item["subtotal"] == 200.0

    def test_username_fallback_when_first_name_blank(self, user_no_name):
        """Users with no first_name get username as fallback — no KeyError."""
        o = Order.objects.create(
            user=user_no_name,
            status=Order.Status.PENDING,
            total_price=Decimal("50.00"),
            shipping_address="Test St",
        )
        with patch("apps.emails.tasks.send_transactional_email"), \
             patch("apps.emails.signals.send_admin_new_order_alert"), \
             patch("apps.emails.signals.send_order_confirmation_email"):
            send_order_confirmation_email(o.id, user_no_name.email)

        ctx = EmailLog.objects.filter(
            template_type="order_confirmation",
            recipient_email=user_no_name.email,
        ).latest("created_at").context_data
        assert ctx["user"]["first_name"] == user_no_name.username

    def test_missing_order_logs_error_and_does_not_raise(self):
        """Non-existent order_id must log an error and return silently."""
        with patch("apps.emails.tasks.logger") as mock_logger:
            send_order_confirmation_email(999999, "nobody@example.com")

        mock_logger.error.assert_called_once()
        assert EmailLog.objects.filter(template_type="order_confirmation").count() == 0

    def test_no_email_log_created_on_db_error(self, order):
        """If EmailLog.objects.create raises, the task logs and does not propagate."""
        with patch("apps.emails.tasks.EmailLog.objects.create", side_effect=Exception("DB down")), \
             patch("apps.emails.tasks.logger") as mock_logger:
            send_order_confirmation_email(order.id, order.user.email)

        mock_logger.error.assert_called_once()


# ---------------------------------------------------------------------------
# send_transactional_email (Celery retry behaviour)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSendTransactionalEmail:

    @pytest.fixture
    def email_log(self, db, user):
        return EmailLog.objects.create(
            template_type="order_confirmation",
            recipient_email=user.email,
            recipient_user=user,
            subject="Test Subject",
            context_data={"order": {"order_number": "FV-000001"}},
        )

    def test_returns_false_for_missing_log(self):
        """Missing EmailLog UUID returns False without raising."""
        result = send_transactional_email(str(uuid4()))
        assert result is False

    def test_marks_failed_when_template_missing(self, email_log):
        """No active EmailTemplate → log status set to 'failed'."""
        result = send_transactional_email(str(email_log.id))

        assert result is False
        email_log.refresh_from_db()
        assert email_log.status == "failed"
        assert "Template not found" in email_log.error_message

    def test_marks_sent_on_success(self, email_log, email_template):
        """Successful send → log status 'sent', sent_at populated."""
        with patch("apps.emails.tasks.render_to_string", return_value="<html/>"):
            with patch("apps.emails.tasks.EmailMultiAlternatives") as mock_email_cls:
                mock_email_cls.return_value.send.return_value = None
                result = send_transactional_email(str(email_log.id))

        assert result is True
        email_log.refresh_from_db()
        assert email_log.status == "sent"
        assert email_log.sent_at is not None

    def test_retries_on_send_failure(self, email_log, email_template):
        """SMTP failure increments retry_count, sets status to 'retry'."""
        from celery.exceptions import Retry

        with patch.object(send_transactional_email, 'retry', side_effect=Retry()), \
             patch("apps.emails.tasks.render_to_string", return_value="<html/>"), \
             patch("apps.emails.tasks.EmailMultiAlternatives") as mock_email_cls:
            mock_email_cls.return_value.send.side_effect = Exception("SMTP timeout")
            with pytest.raises(Retry):
                send_transactional_email(str(email_log.id))

        email_log.refresh_from_db()
        assert email_log.retry_count == 1
        assert email_log.status == "retry"
        assert "SMTP timeout" in email_log.error_message

    def test_marks_permanently_failed_after_max_retries(self, email_log, email_template):
        """After max_retries exhausted, status is 'failed' and task returns False."""
        email_log.retry_count = email_log.max_retries  # already at limit
        email_log.save(update_fields=["retry_count"])

        with patch("apps.emails.tasks.render_to_string", return_value="<html/>"):
            with patch("apps.emails.tasks.EmailMultiAlternatives") as mock_email_cls:
                mock_email_cls.return_value.send.side_effect = Exception("SMTP down")
                result = send_transactional_email(str(email_log.id))

        assert result is False
        email_log.refresh_from_db()
        assert email_log.status == "failed"
        assert email_log.retry_count == email_log.max_retries + 1

    def test_context_data_not_mutated_in_db(self, email_log, email_template):
        """send_transactional_email must not mutate the stored context_data JSON."""
        original_context = dict(email_log.context_data)

        with patch("apps.emails.tasks.render_to_string", return_value="<html/>"):
            with patch("apps.emails.tasks.EmailMultiAlternatives") as mock_email_cls:
                mock_email_cls.return_value.send.return_value = None
                send_transactional_email(str(email_log.id))

        email_log.refresh_from_db()
        # site_name etc. must NOT have been written back into context_data
        assert "site_name" not in email_log.context_data
        assert email_log.context_data == original_context
