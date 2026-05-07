from django.db import models
from django.conf import settings
from core.models import TimeStampedModel


class SearchQuery(TimeStampedModel):
    """
    Track search queries for analytics and optimization
    """
    query = models.CharField(max_length=255, db_index=True)
    result_count = models.PositiveIntegerField(default=0)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='search_queries'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Search context
    filters_applied = models.JSONField(default=dict, blank=True)
    sort_applied = models.CharField(max_length=50, blank=True)
    page_viewed = models.PositiveIntegerField(default=1)
    
    class Meta:
        indexes = [
            models.Index(fields=['query', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['result_count']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Search: {self.query} ({self.result_count} results)"


class SearchClick(TimeStampedModel):
    """
    Track clicks on search results for relevance optimization
    """
    query = models.CharField(max_length=255, db_index=True)
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='search_clicks'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='search_clicks'
    )
    position = models.PositiveIntegerField(null=True, blank=True)  # Position in search results
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['query', 'created_at']),
            models.Index(fields=['product', 'created_at']),
            models.Index(fields=['user', 'created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Click: {self.query} -> {self.product.name}"


class SearchSuggestion(TimeStampedModel):
    """
    Store and manage search suggestions
    """
    text = models.CharField(max_length=255, unique=True, db_index=True)
    popularity = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(
        'products.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='search_suggestions'
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-popularity', 'text']

    def __str__(self):
        return self.text


class SearchAnalytics(TimeStampedModel):
    """
    Aggregated search analytics data
    """
    date = models.DateField(db_index=True)
    
    # Query statistics
    total_searches = models.PositiveIntegerField(default=0)
    unique_queries = models.PositiveIntegerField(default=0)
    zero_result_searches = models.PositiveIntegerField(default=0)
    
    # User statistics
    unique_users = models.PositiveIntegerField(default=0)
    anonymous_searches = models.PositiveIntegerField(default=0)
    
    # Performance metrics
    avg_result_count = models.FloatField(default=0.0)
    avg_click_position = models.FloatField(default=0.0)
    click_through_rate = models.FloatField(default=0.0)
    
    # Top queries (JSON field)
    top_queries = models.JSONField(default=list, blank=True)
    top_zero_result_queries = models.JSONField(default=list, blank=True)
    
    class Meta:
        unique_together = ['date']
        ordering = ['-date']

    def __str__(self):
        return f"Analytics for {self.date}: {self.total_searches} searches"