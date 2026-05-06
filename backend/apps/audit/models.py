from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from core.models import TimeStampedModel
import json


class AuditLog(TimeStampedModel):
    """
    Comprehensive audit logging for all user actions
    """
    class ActionType(models.TextChoices):
        CREATE = 'create', 'Create'
        UPDATE = 'update', 'Update'
        DELETE = 'delete', 'Delete'
        VIEW = 'view', 'View'
        LOGIN = 'login', 'Login'
        LOGOUT = 'logout', 'Logout'
        PURCHASE = 'purchase', 'Purchase'
        PAYMENT = 'payment', 'Payment'
        ADMIN_ACTION = 'admin_action', 'Admin Action'
        API_CALL = 'api_call', 'API Call'
        SECURITY_EVENT = 'security_event', 'Security Event'

    # User who performed the action
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_logs'
    )
    
    # Action details
    action_type = models.CharField(max_length=20, choices=ActionType.choices, db_index=True)
    action_description = models.CharField(max_length=255)
    
    # Object being acted upon (generic foreign key)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Request details
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_method = models.CharField(max_length=10, blank=True)
    request_path = models.CharField(max_length=500, blank=True)
    
    # Data changes (for update actions)
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    
    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    # Security flags
    is_suspicious = models.BooleanField(default=False, db_index=True)
    risk_level = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('critical', 'Critical')
        ],
        default='low',
        db_index=True
    )

    class Meta:
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action_type', 'created_at']),
            models.Index(fields=['ip_address', 'created_at']),
            models.Index(fields=['is_suspicious', 'risk_level']),
            models.Index(fields=['content_type', 'object_id']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.email if self.user else 'Anonymous'
        return f"{user_str} - {self.action_type} - {self.action_description}"


class SecurityEvent(TimeStampedModel):
    """
    Security-specific events and threats
    """
    class EventType(models.TextChoices):
        FAILED_LOGIN = 'failed_login', 'Failed Login'
        BRUTE_FORCE = 'brute_force', 'Brute Force Attack'
        SUSPICIOUS_IP = 'suspicious_ip', 'Suspicious IP'
        RATE_LIMIT_EXCEEDED = 'rate_limit', 'Rate Limit Exceeded'
        INVALID_TOKEN = 'invalid_token', 'Invalid Token'
        PERMISSION_DENIED = 'permission_denied', 'Permission Denied'
        SQL_INJECTION_ATTEMPT = 'sql_injection', 'SQL Injection Attempt'
        XSS_ATTEMPT = 'xss_attempt', 'XSS Attempt'
        CSRF_FAILURE = 'csrf_failure', 'CSRF Failure'
        FILE_UPLOAD_THREAT = 'file_upload_threat', 'File Upload Threat'

    event_type = models.CharField(max_length=30, choices=EventType.choices, db_index=True)
    severity = models.CharField(
        max_length=10,
        choices=[
            ('info', 'Info'),
            ('warning', 'Warning'),
            ('error', 'Error'),
            ('critical', 'Critical')
        ],
        default='warning',
        db_index=True
    )
    
    # Source of the event
    ip_address = models.GenericIPAddressField(db_index=True)
    user_agent = models.TextField(blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='security_events'
    )
    
    # Event details
    description = models.TextField()
    request_data = models.JSONField(default=dict, blank=True)
    response_status = models.PositiveSmallIntegerField(null=True, blank=True)
    
    # Geolocation (if available)
    country = models.CharField(max_length=2, blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    # Resolution
    is_resolved = models.BooleanField(default=False, db_index=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_security_events'
    )
    resolution_notes = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['ip_address', 'created_at']),
            models.Index(fields=['event_type', 'severity']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['is_resolved', 'severity']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} - {self.ip_address} - {self.severity}"


class DataExportRequest(TimeStampedModel):
    """
    GDPR compliance - track data export requests
    """
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='data_export_requests'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    request_type = models.CharField(
        max_length=20,
        choices=[
            ('export', 'Data Export'),
            ('deletion', 'Data Deletion')
        ],
        default='export'
    )
    
    # File details (for completed exports)
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    download_count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Processing details
    processed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.request_type} - {self.status}"