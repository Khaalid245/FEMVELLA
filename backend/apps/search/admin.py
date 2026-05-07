from django.contrib import admin

from .models import SearchAnalytics, SearchClick, SearchQuery, SearchSuggestion


@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ("query", "result_count", "user", "created_at")
    list_filter = ("created_at", "result_count")
    search_fields = ("query", "user__email")
    readonly_fields = ("created_at", "updated_at")


@admin.register(SearchClick)
class SearchClickAdmin(admin.ModelAdmin):
    list_display = ("query", "product", "position", "user", "created_at")
    list_filter = ("created_at",)
    search_fields = ("query", "product__name", "user__email")
    readonly_fields = ("created_at", "updated_at")


@admin.register(SearchSuggestion)
class SearchSuggestionAdmin(admin.ModelAdmin):
    list_display = ("text", "popularity", "category", "is_active")
    list_filter = ("is_active", "category")
    search_fields = ("text",)


@admin.register(SearchAnalytics)
class SearchAnalyticsAdmin(admin.ModelAdmin):
    list_display = ("date", "total_searches", "unique_queries", "zero_result_searches", "click_through_rate")
    list_filter = ("date",)
    readonly_fields = ("created_at", "updated_at")
