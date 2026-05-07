from django.contrib import admin
from .models import PageView, PerformanceMetric, RequestLog

admin.site.register(PageView)


@admin.register(RequestLog)
class RequestLogAdmin(admin.ModelAdmin):
    list_display = ("method", "path", "status_code", "response_time", "query_count", "created_at")
    list_filter = ("method", "status_code", "created_at")
    search_fields = ("path", "ip_address", "user__email")
    readonly_fields = ("created_at", "updated_at")


@admin.register(PerformanceMetric)
class PerformanceMetricAdmin(admin.ModelAdmin):
    list_display = ("name", "value", "unit", "created_at")
    list_filter = ("name", "unit", "created_at")
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")
