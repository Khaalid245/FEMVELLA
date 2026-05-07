from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class ShippingZone(models.Model):
    name = models.CharField(max_length=100)
    countries = models.JSONField(default=list, help_text="List of country codes")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class ShippingMethod(models.Model):
    CARRIER_CHOICES = [
        ('standard', 'Standard Shipping'),
        ('express', 'Express Shipping'),
        ('overnight', 'Overnight Shipping'),
        ('pickup', 'Store Pickup'),
    ]

    name = models.CharField(max_length=100)
    carrier = models.CharField(max_length=20, choices=CARRIER_CHOICES)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    min_delivery_days = models.PositiveIntegerField(default=1)
    max_delivery_days = models.PositiveIntegerField(default=7)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['min_delivery_days', 'name']

    def __str__(self):
        return f"{self.name} ({self.min_delivery_days}-{self.max_delivery_days} days)"

    @property
    def delivery_estimate(self):
        if self.min_delivery_days == self.max_delivery_days:
            return f"{self.min_delivery_days} day{'s' if self.min_delivery_days > 1 else ''}"
        return f"{self.min_delivery_days}-{self.max_delivery_days} days"


class ShippingRule(models.Model):
    CONDITION_CHOICES = [
        ('weight', 'By Weight'),
        ('price', 'By Order Value'),
        ('quantity', 'By Item Count'),
        ('flat', 'Flat Rate'),
    ]

    zone = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name='rules')
    method = models.ForeignKey(ShippingMethod, on_delete=models.CASCADE, related_name='rules')
    condition_type = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    min_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    free_shipping_threshold = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Order value for free shipping"
    )
    is_active = models.BooleanField(default=True)
    priority = models.PositiveIntegerField(default=0, help_text="Lower number = higher priority")

    class Meta:
        ordering = ['priority', 'price']
        unique_together = ['zone', 'method', 'condition_type', 'min_value']

    def __str__(self):
        return f"{self.zone.name} - {self.method.name} - ${self.price}"

    def applies_to_order(self, order_value, weight=0, quantity=0):
        """Check if this rule applies to the given order parameters"""
        if not self.is_active or not self.method.is_active or not self.zone.is_active:
            return False

        if self.condition_type == 'price':
            value = order_value
        elif self.condition_type == 'weight':
            value = weight
        elif self.condition_type == 'quantity':
            value = quantity
        else:  # flat rate
            return True

        if value < self.min_value:
            return False
        if self.max_value and value > self.max_value:
            return False

        return True

    def calculate_shipping_cost(self, order_value):
        """Calculate shipping cost, considering free shipping threshold"""
        if self.free_shipping_threshold and order_value >= self.free_shipping_threshold:
            return Decimal('0.00')
        return self.price