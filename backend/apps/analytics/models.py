from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import uuid

User = get_user_model()

class AnalyticsEvent(models.Model):
    EVENT_TYPES = [
        ('page_view', 'Page View'),
        ('product_view', 'Product View'),
        ('add_to_cart', 'Add to Cart'),
        ('remove_from_cart', 'Remove from Cart'),
        ('checkout_start', 'Checkout Start'),
        ('checkout_complete', 'Checkout Complete'),
        ('search', 'Search'),
        ('filter_applied', 'Filter Applied'),
        ('wishlist_add', 'Wishlist Add'),
        ('newsletter_signup', 'Newsletter Signup'),
        ('user_registration', 'User Registration'),
        ('user_login', 'User Login'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100)
    timestamp = models.DateTimeField(default=timezone.now)
    
    # Event data
    page_url = models.URLField(blank=True)
    referrer = models.URLField(blank=True)
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    # Product-related data
    product_id = models.IntegerField(null=True, blank=True)
    product_name = models.CharField(max_length=255, blank=True)
    product_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category_name = models.CharField(max_length=100, blank=True)
    
    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'analytics_events'
        indexes = [
            models.Index(fields=['event_type', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['session_id', 'timestamp']),
            models.Index(fields=['product_id', 'timestamp']),
        ]

class RevenueMetrics(models.Model):
    date = models.DateField(unique=True)
    
    # Revenue data
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Order data
    total_orders = models.IntegerField(default=0)
    completed_orders = models.IntegerField(default=0)
    cancelled_orders = models.IntegerField(default=0)
    
    # Customer data
    new_customers = models.IntegerField(default=0)
    returning_customers = models.IntegerField(default=0)
    
    # Product data
    total_items_sold = models.IntegerField(default=0)
    average_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Conversion data
    website_visitors = models.IntegerField(default=0)
    conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'revenue_metrics'
        ordering = ['-date']

class ProductAnalytics(models.Model):
    product_id = models.IntegerField()
    product_name = models.CharField(max_length=255)
    category_name = models.CharField(max_length=100)
    date = models.DateField()
    
    # View metrics
    page_views = models.IntegerField(default=0)
    unique_views = models.IntegerField(default=0)
    
    # Engagement metrics
    add_to_cart_count = models.IntegerField(default=0)
    wishlist_count = models.IntegerField(default=0)
    
    # Sales metrics
    units_sold = models.IntegerField(default=0)
    revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Conversion metrics
    view_to_cart_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cart_to_purchase_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product_analytics'
        unique_together = ['product_id', 'date']
        indexes = [
            models.Index(fields=['date', 'revenue']),
            models.Index(fields=['date', 'units_sold']),
            models.Index(fields=['category_name', 'date']),
        ]

class CustomerAnalytics(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Lifetime metrics
    total_orders = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Engagement metrics
    first_purchase_date = models.DateTimeField(null=True, blank=True)
    last_purchase_date = models.DateTimeField(null=True, blank=True)
    days_since_last_purchase = models.IntegerField(default=0)
    
    # Behavior metrics
    total_sessions = models.IntegerField(default=0)
    total_page_views = models.IntegerField(default=0)
    products_viewed = models.IntegerField(default=0)
    
    # Segmentation
    customer_segment = models.CharField(max_length=50, choices=[
        ('new', 'New Customer'),
        ('active', 'Active Customer'),
        ('at_risk', 'At Risk'),
        ('churned', 'Churned'),
        ('vip', 'VIP Customer'),
    ], default='new')
    
    # Preferences
    favorite_category = models.CharField(max_length=100, blank=True)
    preferred_price_range = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'customer_analytics'

class ConversionFunnel(models.Model):
    date = models.DateField()
    
    # Funnel stages
    visitors = models.IntegerField(default=0)
    product_views = models.IntegerField(default=0)
    add_to_cart = models.IntegerField(default=0)
    checkout_start = models.IntegerField(default=0)
    checkout_complete = models.IntegerField(default=0)
    
    # Conversion rates
    visitor_to_view_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    view_to_cart_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cart_to_checkout_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    checkout_to_purchase_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overall_conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conversion_funnel'
        unique_together = ['date']
        ordering = ['-date']

class AbandonedCart(models.Model):
    session_id = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Cart data
    items = models.JSONField(default=list)
    total_value = models.DecimalField(max_digits=10, decimal_places=2)
    item_count = models.IntegerField()
    
    # Timestamps
    created_at = models.DateTimeField()
    last_updated = models.DateTimeField()
    abandoned_at = models.DateTimeField(auto_now_add=True)
    
    # Recovery tracking
    recovery_email_sent = models.BooleanField(default=False)
    recovery_email_sent_at = models.DateTimeField(null=True, blank=True)
    recovered = models.BooleanField(default=False)
    recovered_at = models.DateTimeField(null=True, blank=True)
    recovery_order_id = models.IntegerField(null=True, blank=True)
    
    # Analytics
    time_spent_minutes = models.IntegerField(default=0)
    pages_visited = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'abandoned_carts'
        indexes = [
            models.Index(fields=['abandoned_at']),
            models.Index(fields=['user', 'abandoned_at']),
            models.Index(fields=['recovered', 'abandoned_at']),
        ]

class SearchAnalytics(models.Model):
    query = models.CharField(max_length=255)
    date = models.DateField()
    
    # Search metrics
    search_count = models.IntegerField(default=0)
    results_count = models.IntegerField(default=0)
    click_through_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Conversion metrics
    conversions = models.IntegerField(default=0)
    conversion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'search_analytics'
        unique_together = ['query', 'date']
        indexes = [
            models.Index(fields=['date', 'search_count']),
            models.Index(fields=['date', 'conversion_rate']),
        ]