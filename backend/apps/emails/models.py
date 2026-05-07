from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class EmailTemplate(models.Model):
    TEMPLATE_TYPES = [
        ('order_confirmation', 'Order Confirmation'),
        ('payment_confirmation', 'Payment Confirmation'),
        ('shipping_update', 'Shipping Update'),
        ('password_reset', 'Password Reset'),
        ('new_order_admin', 'New Order Admin Alert'),
        ('low_stock_admin', 'Low Stock Admin Alert'),
        ('welcome', 'Welcome Email'),
        ('order_cancelled', 'Order Cancelled'),
    ]

    name = models.CharField(max_length=100)
    template_type = models.CharField(max_length=30, choices=TEMPLATE_TYPES, unique=True)
    subject = models.CharField(max_length=200)
    html_content = models.TextField()
    text_content = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"


class EmailLog(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('retry', 'Retry'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template_type = models.CharField(max_length=30)
    recipient_email = models.EmailField()
    recipient_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    subject = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)
    context_data = models.JSONField(default=dict)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['template_type', 'status']),
            models.Index(fields=['recipient_email', 'created_at']),
        ]

    def __str__(self):
        return f"{self.template_type} to {self.recipient_email} - {self.status}"

    @property
    def can_retry(self):
        return self.status == 'failed' and self.retry_count < self.max_retries