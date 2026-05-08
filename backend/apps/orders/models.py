from django.db import models
from django.conf import settings
from apps.products.models import Product, ProductVariant
from core.models import TimeStampedModel


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        CONFIRMED = "confirmed", "Confirmed"
        PROCESSING = "processing", "Processing"
        PARTIALLY_FULFILLED = "partially_fulfilled", "Partially Fulfilled"
        FULFILLED = "fulfilled", "Fulfilled"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"
        PARTIALLY_REFUNDED = "partially_refunded", "Partially Refunded"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING, db_index=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_address = models.TextField()
    notes = models.TextField(blank=True)
    idempotency_key = models.CharField(max_length=64, blank=True, default="")
    # MySQL does not support partial unique indexes, so we use a separate
    # nullable field that is NULL for blank keys and a copy of idempotency_key
    # otherwise. A standard unique_together on (user, idempotency_key_unique)
    # then enforces the constraint only for non-blank keys.
    idempotency_key_unique = models.CharField(
        max_length=64, null=True, blank=True, default=None
    )

    # Fulfillment
    tracking_number = models.CharField(max_length=100, blank=True, default="")
    carrier = models.CharField(max_length=50, blank=True, default="")
    tracking_url = models.URLField(blank=True, default="")
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    # Refunds
    refunded_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        indexes = [
            models.Index(fields=["user", "idempotency_key"], name="order_user_idempotency_idx"),
            models.Index(fields=["created_at"], name="order_created_at_idx"),
            models.Index(fields=["status", "created_at"], name="order_status_created_idx"),
        ]
        # MySQL allows multiple NULLs in a unique index, so NULL values
        # (blank idempotency keys) never collide. Only non-NULL values
        # (real checkout keys) are enforced as unique per user.
        unique_together = [("user", "idempotency_key_unique")]

    def __str__(self):
        return f"Order #{self.pk} - {self.user.email}"

    @property
    def order_number(self):
        return f"FV-{self.pk:06d}"

    @property
    def balance_due(self):
        return self.total_price - self.refunded_amount


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="order_items"
    )
    size_snapshot = models.CharField(max_length=20, blank=True, default="")
    color_snapshot = models.CharField(max_length=50, blank=True, default="")
    customization_text = models.CharField(max_length=200, blank=True, default="")
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    # Fulfillment tracking per line item
    fulfilled_quantity = models.PositiveIntegerField(default=0)
    refunded_quantity = models.PositiveIntegerField(default=0)

    @property
    def subtotal(self):
        return self.quantity * self.unit_price

    @property
    def is_fully_fulfilled(self):
        return self.fulfilled_quantity >= self.quantity


class OrderStatusHistory(models.Model):
    """Audit log — every status transition is recorded here."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="history")
    old_status = models.CharField(max_length=30)
    new_status = models.CharField(max_length=30)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="order_status_changes"
    )
    note = models.TextField(blank=True, default="")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Order #{self.order_id}: {self.old_status} → {self.new_status}"


class Refund(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        PROCESSED = "processed", "Processed"
        REJECTED = "rejected", "Rejected"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="refunds")
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="refund_requests")
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="refunds_processed")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    stripe_refund_id = models.CharField(max_length=100, blank=True, default="")
    admin_note = models.TextField(blank=True, default="")
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Refund #{self.pk} for Order #{self.order_id} — ${self.amount}"


class ReturnRequest(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        ITEMS_RECEIVED = "items_received", "Items Received"
        COMPLETED = "completed", "Completed"
        REJECTED = "rejected", "Rejected"

    class Reason(models.TextChoices):
        DEFECTIVE = "defective", "Defective / Damaged"
        WRONG_ITEM = "wrong_item", "Wrong Item Sent"
        NOT_AS_DESCRIBED = "not_as_described", "Not as Described"
        CHANGED_MIND = "changed_mind", "Changed Mind"
        SIZE_ISSUE = "size_issue", "Size / Fit Issue"
        OTHER = "other", "Other"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="return_requests")
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="return_requests")
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="returns_reviewed")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reason = models.CharField(max_length=30, choices=Reason.choices)
    description = models.TextField(blank=True)
    items = models.JSONField(default=list, help_text="[{order_item_id, quantity}]")
    admin_note = models.TextField(blank=True, default="")
    return_tracking_number = models.CharField(max_length=100, blank=True, default="")
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Return #{self.pk} for Order #{self.order_id}"


class ExchangeRequest(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        ITEMS_RECEIVED = "items_received", "Items Received"
        NEW_ORDER_CREATED = "new_order_created", "New Order Created"
        COMPLETED = "completed", "Completed"
        REJECTED = "rejected", "Rejected"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="exchange_requests")
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="exchange_requests")
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="exchanges_reviewed")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reason = models.TextField()
    # Items to return: [{order_item_id, quantity}]
    return_items = models.JSONField(default=list)
    # Items requested in exchange: [{product_id, variant_id, quantity}]
    exchange_items = models.JSONField(default=list)
    admin_note = models.TextField(blank=True, default="")
    new_order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name="exchange_source")
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Exchange #{self.pk} for Order #{self.order_id}"
