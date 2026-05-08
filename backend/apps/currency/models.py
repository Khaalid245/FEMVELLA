from django.db import models
from core.models import TimeStampedModel


class Currency(TimeStampedModel):
    code = models.CharField(max_length=3, unique=True, help_text="ISO 4217 e.g. USD, EUR, SAR")
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=10)
    # Rate relative to base currency (USD). Base currency has rate=1.0
    exchange_rate = models.DecimalField(max_digits=12, decimal_places=6, default=1.0)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    decimal_places = models.PositiveSmallIntegerField(default=2)

    class Meta:
        verbose_name_plural = "Currencies"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} ({self.symbol})"

    def save(self, *args, **kwargs):
        # Ensure only one default currency
        if self.is_default:
            Currency.objects.exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)
