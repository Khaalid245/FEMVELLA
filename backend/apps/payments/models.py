from django.db import models
from django.conf import settings
from apps.orders.models import Order
from core.models import TimeStampedModel


class Payment(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="payment")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    provider = models.CharField(max_length=50, default="stripe")
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True, blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["stripe_payment_intent_id"]),
        ]

    def __str__(self):
        return f"Payment {self.pk} - {self.status}"


class ProcessedWebhookEvent(models.Model):
    """Deduplication table — prevents double-processing Stripe webhook events."""
    stripe_event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=100)
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["stripe_event_id"])]

    def __str__(self):
        return f"{self.event_type} — {self.stripe_event_id}"
