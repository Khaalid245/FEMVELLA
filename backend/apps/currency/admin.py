from django.contrib import admin
from .models import Currency


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "symbol", "exchange_rate", "is_active", "is_default", "updated_at")
    list_editable = ("exchange_rate", "is_active")
    list_filter = ("is_active", "is_default")
    search_fields = ("code", "name")
    readonly_fields = ("created_at", "updated_at")
