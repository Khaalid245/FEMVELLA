from django.contrib import admin
from .models import (
    AnalyticsEvent, RevenueMetrics, ProductAnalytics,
    CustomerAnalytics, ConversionFunnel, AbandonedCart, SearchAnalytics,
)


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "user", "session_id", "product_name", "timestamp")
    list_filter = ("event_type", "timestamp")
    search_fields = ("session_id", "product_name", "user__email")
    readonly_fields = ("id", "timestamp")


@admin.register(RevenueMetrics)
class RevenueMetricsAdmin(admin.ModelAdmin):
    list_display = ("date", "total_revenue", "total_orders", "average_order_value", "conversion_rate")
    list_filter = ("date",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(ProductAnalytics)
class ProductAnalyticsAdmin(admin.ModelAdmin):
    list_display = ("product_name", "category_name", "date", "page_views", "units_sold", "revenue")
    list_filter = ("date", "category_name")
    search_fields = ("product_name",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(CustomerAnalytics)
class CustomerAnalyticsAdmin(admin.ModelAdmin):
    list_display = ("user", "customer_segment", "total_orders", "total_spent", "last_purchase_date")
    list_filter = ("customer_segment",)
    search_fields = ("user__email",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(ConversionFunnel)
class ConversionFunnelAdmin(admin.ModelAdmin):
    list_display = ("date", "visitors", "product_views", "add_to_cart", "checkout_complete", "overall_conversion_rate")
    list_filter = ("date",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(AbandonedCart)
class AbandonedCartAdmin(admin.ModelAdmin):
    list_display = ("session_id", "user", "total_value", "item_count", "recovered", "abandoned_at")
    list_filter = ("recovered", "recovery_email_sent")
    search_fields = ("session_id", "user__email")


@admin.register(SearchAnalytics)
class SearchAnalyticsAdmin(admin.ModelAdmin):
    list_display = ("query", "date", "search_count", "results_count", "conversion_rate")
    list_filter = ("date",)
    search_fields = ("query",)
    readonly_fields = ("created_at", "updated_at")
