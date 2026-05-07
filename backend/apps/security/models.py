from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
import json

User = get_user_model()


class SecurityEvent(models.Model):
    """Log security-related events"""
    EVENT_TYPES = [
        ('login_success', 'Successful Login'),
        ('login_failed', 'Failed Login'),
        ('logout', 'Logout'),
        ('password_change', 'Password Change'),
        ('password_reset', 'Password Reset'),
        ('account_locked', 'Account Locked'),
        ('suspicious_activity', 'Suspicious Activity'),
        ('rate_limit_exceeded', 'Rate Limit Exceeded'),
        ('brute_force_detected', 'Brute Force Detected'),
        ('admin_access', 'Admin Access'),
        ('permission_denied', 'Permission Denied'),
        ('data_export', 'Data Export'),
        ('sensitive_data_access', 'Sensitive Data Access'),
    ]

    SEVERITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='medium')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    session_key = models.CharField(max_length=40, blank=True)
    
    # Request details
    method = models.CharField(max_length=10, blank=True)
    path = models.CharField(max_length=500, blank=True)
    query_params = models.JSONField(default=dict, blank=True)
    
    # Event details
    description = models.TextField()
    additional_data = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['event_type', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['ip_address', '-timestamp']),
            models.Index(fields=['severity', '-timestamp']),
        ]

    def __str__(self):
        user_info = self.user.email if self.user else 'Anonymous'
        return f"{self.event_type} - {user_info} - {self.timestamp}"


class AdminActionLog(models.Model):
    """Enhanced admin action logging"""
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('bulk_update', 'Bulk Update'),
        ('bulk_delete', 'Bulk Delete'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('login', 'Admin Login'),
        ('logout', 'Admin Logout'),
        ('permission_change', 'Permission Change'),
        ('system_config', 'System Configuration'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    
    # Target object information
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    object_repr = models.CharField(max_length=200, blank=True)
    
    # Change details
    changes = models.JSONField(default=dict, help_text="Field changes in {field: {old: value, new: value}} format")
    affected_count = models.PositiveIntegerField(default=1, help_text="Number of objects affected")
    
    # Request context
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    session_key = models.CharField(max_length=40, blank=True)
    
    # Additional metadata
    description = models.TextField(blank=True)
    risk_level = models.CharField(
        max_length=20,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
        default='low'
    )
    
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action_type', '-timestamp']),
            models.Index(fields=['content_type', '-timestamp']),
            models.Index(fields=['risk_level', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.action_type} - {self.timestamp}"


class DataAccessLog(models.Model):
    """Log access to sensitive data"""
    ACCESS_TYPES = [
        ('view', 'View'),
        ('export', 'Export'),
        ('search', 'Search'),
        ('filter', 'Filter'),
        ('bulk_access', 'Bulk Access'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    access_type = models.CharField(max_length=20, choices=ACCESS_TYPES)
    
    # Data accessed
    model_name = models.CharField(max_length=100)
    record_count = models.PositiveIntegerField(default=1)
    fields_accessed = models.JSONField(default=list, help_text="List of sensitive fields accessed")
    
    # Access context
    purpose = models.CharField(max_length=200, blank=True, help_text="Business purpose for access")
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    
    # Query details
    query_params = models.JSONField(default=dict)
    filters_applied = models.JSONField(default=dict)
    
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['model_name', '-timestamp']),
            models.Index(fields=['access_type', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.access_type} {self.model_name} - {self.timestamp}"


class SecurityIncident(models.Model):
    """Track and manage security incidents"""
    INCIDENT_TYPES = [
        ('brute_force', 'Brute Force Attack'),
        ('sql_injection', 'SQL Injection Attempt'),
        ('xss_attempt', 'XSS Attempt'),
        ('unauthorized_access', 'Unauthorized Access'),
        ('data_breach', 'Data Breach'),
        ('malware_detected', 'Malware Detected'),
        ('ddos_attack', 'DDoS Attack'),
        ('privilege_escalation', 'Privilege Escalation'),
        ('suspicious_pattern', 'Suspicious Pattern'),
        ('policy_violation', 'Policy Violation'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('contained', 'Contained'),
        ('resolved', 'Resolved'),
        ('false_positive', 'False Positive'),
    ]

    SEVERITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    incident_id = models.CharField(max_length=20, unique=True)
    incident_type = models.CharField(max_length=50, choices=INCIDENT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    # Incident details
    title = models.CharField(max_length=200)
    description = models.TextField()
    affected_systems = models.JSONField(default=list)
    affected_users = models.ManyToManyField(User, blank=True)
    
    # Source information
    source_ip = models.GenericIPAddressField(null=True, blank=True)
    source_country = models.CharField(max_length=100, blank=True)
    attack_vector = models.CharField(max_length=200, blank=True)
    
    # Response details
    response_actions = models.TextField(blank=True)
    mitigation_steps = models.TextField(blank=True)
    lessons_learned = models.TextField(blank=True)
    
    # Timestamps
    detected_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Assignment
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_incidents'
    )

    class Meta:
        ordering = ['-detected_at']
        indexes = [
            models.Index(fields=['status', '-detected_at']),
            models.Index(fields=['severity', '-detected_at']),
            models.Index(fields=['incident_type', '-detected_at']),
        ]

    def __str__(self):
        return f"{self.incident_id} - {self.title}"

    def save(self, *args, **kwargs):
        if not self.incident_id:
            # Generate incident ID
            from django.utils import timezone
            timestamp = timezone.now().strftime('%Y%m%d%H%M')
            count = SecurityIncident.objects.filter(
                incident_id__startswith=f"INC-{timestamp}"
            ).count()
            self.incident_id = f"INC-{timestamp}-{count + 1:03d}"
        
        super().save(*args, **kwargs)