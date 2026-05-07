from django.db import models
from core.models import TimeStampedModel


class PageView(TimeStampedModel):
    path = models.CharField(max_length=500)
    referrer = models.CharField(max_length=500, blank=True)
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    session_key = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.path} - {self.created_at}"


class RequestLog(TimeStampedModel):
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=500, db_index=True)
    status_code = models.PositiveIntegerField(db_index=True)
    response_time = models.FloatField(help_text="Response time in seconds")
    query_count = models.PositiveIntegerField(default=0)
    query_time = models.FloatField(default=0.0, help_text="Database query time in seconds")
    memory_usage = models.FloatField(default=0.0, help_text="Memory usage in MB")
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="request_logs",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["path", "created_at"]),
            models.Index(fields=["status_code", "created_at"]),
            models.Index(fields=["response_time"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.method} {self.path} - {self.status_code}"


class PerformanceMetric(TimeStampedModel):
    name = models.CharField(max_length=100, db_index=True)
    value = models.FloatField()
    unit = models.CharField(max_length=30, blank=True)
    tags = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["name", "created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name}: {self.value} {self.unit}".strip()
