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
