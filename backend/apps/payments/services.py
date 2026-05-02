import logging
from django.conf import settings
from django.db import transaction
import stripe

from apps.orders.models import Order
from .exceptions import OrderNotFoundError, OrderNotPayableError, StripeGatewayError
from .models import Payment

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY


# ---------------------------------------------------------------------------
# PaymentIntent creation
# ---------------------------------------------------------------------------

def get_or_create_payment_intent(user, order_id: int) -> str:
    """
    Return the Stripe client_secret for the given order.

    - Validates the order belongs to the user and is in PENDING status.
    - If a Payment record with a PaymentIntent already exists, returns the
      existing client_secret without calling Stripe again.
    - Creates a new PaymentIntent + Payment record otherwise.

    Returns:
        client_secret string — passed to the frontend Stripe.js

    Raises:
        OrderNotFoundError    — order does not exist or does not belong to user
        OrderNotPayableError  — order is not in PENDING status
        StripeGatewayError    — Stripe API call failed
    """
    order = _get_payable_order(user, order_id)

    # ------------------------------------------------------------------
    # Idempotency: if a Payment record already exists with a PaymentIntent
    # id, retrieve the existing intent from Stripe and return its secret.
    # We never trust a locally stored client_secret because it can expire —
    # always retrieve fresh from Stripe.
    # ------------------------------------------------------------------
    try:
        payment = Payment.objects.get(order=order)
        if payment.stripe_payment_intent_id:
            intent = _retrieve_intent(payment.stripe_payment_intent_id)
            return intent.client_secret
    except Payment.DoesNotExist:
        pass

    # ------------------------------------------------------------------
    # Create a new PaymentIntent on Stripe, then persist the Payment record.
    # Both operations are wrapped in a transaction so a Stripe success with
    # a DB failure does not leave an orphaned intent.
    # ------------------------------------------------------------------
    amount_cents = _to_cents(order.total_price)

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=settings.STRIPE_CURRENCY,
            metadata={
                "order_id": order.pk,
                "user_id": user.pk,
                "user_email": user.email,
            },
            # Stripe-side idempotency: same order always produces same intent
            # if retried within 24 hours.
            idempotency_key=f"order-{order.pk}-intent",
        )
    except stripe.error.StripeError as exc:
        logger.error("Stripe PaymentIntent creation failed for order %s: %s", order.pk, exc)
        raise StripeGatewayError(str(exc.user_message or exc)) from exc

    with transaction.atomic():
        Payment.objects.create(
            order=order,
            user=user,
            amount=order.total_price,
            status=Payment.Status.PENDING,
            provider="stripe",
            stripe_payment_intent_id=intent.id,
        )

    return intent.client_secret


# ---------------------------------------------------------------------------
# Webhook handlers
# ---------------------------------------------------------------------------

def handle_webhook(payload: bytes, sig_header: str) -> None:
    """
    Verify the Stripe webhook signature and dispatch to the correct handler.

    Raises ValueError on invalid signature — caller should return HTTP 400.
    """
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError as exc:
        logger.warning("Stripe webhook signature verification failed: %s", exc)
        raise ValueError("Invalid signature") from exc

    event_type = event["type"]
    intent = event["data"]["object"]

    if event_type == "payment_intent.succeeded":
        _handle_payment_succeeded(intent)
    elif event_type == "payment_intent.payment_failed":
        _handle_payment_failed(intent)
    else:
        # Log unhandled event types but do not fail — Stripe expects 200
        logger.debug("Unhandled Stripe event type: %s", event_type)


def _handle_payment_succeeded(intent: dict) -> None:
    """
    Mark Payment COMPLETED and Order PAID.
    Transition allowed: PENDING → PAID only.
    Any other order state is a no-op — logged and ignored.
    """
    intent_id = intent["id"]

    with transaction.atomic():
        try:
            payment = (
                Payment.objects.select_for_update()
                .select_related("order")
                .get(stripe_payment_intent_id=intent_id)
            )
        except Payment.DoesNotExist:
            logger.error(
                "payment_intent.succeeded received for unknown intent %s", intent_id
            )
            return

        order = payment.order

        if order.status != Order.Status.PENDING:
            logger.info(
                "payment_intent.succeeded ignored — order %s is already '%s'",
                order.pk, order.status,
            )
            return

        order.status = Order.Status.PAID
        order.save(update_fields=["status", "updated_at"])

        payment.status = Payment.Status.COMPLETED
        payment.save(update_fields=["status", "updated_at"])

    logger.info("Order %s marked PAID via intent %s", order.pk, intent_id)


def _handle_payment_failed(intent: dict) -> None:
    """
    Mark Payment FAILED and Order FAILED.
    Transition allowed: PENDING → FAILED only.
    Any other order state is a no-op — logged and ignored.
    """
    intent_id = intent["id"]

    with transaction.atomic():
        try:
            payment = (
                Payment.objects.select_for_update()
                .select_related("order")
                .get(stripe_payment_intent_id=intent_id)
            )
        except Payment.DoesNotExist:
            logger.error(
                "payment_intent.payment_failed received for unknown intent %s", intent_id
            )
            return

        order = payment.order

        if order.status != Order.Status.PENDING:
            logger.info(
                "payment_intent.payment_failed ignored — order %s is already '%s'",
                order.pk, order.status,
            )
            return

        order.status = Order.Status.FAILED
        order.save(update_fields=["status", "updated_at"])

        payment.status = Payment.Status.FAILED
        payment.save(update_fields=["status", "updated_at"])

    logger.info("Order %s marked FAILED via intent %s", order.pk, intent_id)


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _get_payable_order(user, order_id: int) -> Order:
    try:
        order = Order.objects.get(pk=order_id, user=user)
    except Order.DoesNotExist:
        raise OrderNotFoundError()

    if order.status != Order.Status.PENDING:
        raise OrderNotPayableError(
            f"Order is in '{order.status}' status and cannot be paid."
        )

    return order


def _retrieve_intent(intent_id: str) -> stripe.PaymentIntent:
    try:
        return stripe.PaymentIntent.retrieve(intent_id)
    except stripe.error.StripeError as exc:
        logger.error("Failed to retrieve PaymentIntent %s: %s", intent_id, exc)
        raise StripeGatewayError(str(exc.user_message or exc)) from exc


def _to_cents(amount) -> int:
    """Convert Decimal amount to integer cents (Stripe smallest unit)."""
    return int(amount * 100)
