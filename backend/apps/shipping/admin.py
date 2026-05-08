from django.contrib import admin
from django.utils.html import format_html
from .models import ShippingZone, ShippingMethod, ShippingRule


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'country_count', 'active_status', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']
    actions = ['enable_zones', 'disable_zones']

    def country_count(self, obj):
        return len(obj.countries)
    country_count.short_description = 'Countries'

    def active_status(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green;">●</span> Active')
        return format_html('<span style="color: red;">●</span> Inactive')
    active_status.short_description = 'Status'

    def enable_zones(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"{queryset.count()} zones enabled.")
    enable_zones.short_description = "Enable selected zones"

    def disable_zones(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"{queryset.count()} zones disabled.")
    disable_zones.short_description = "Disable selected zones"


@admin.register(ShippingMethod)
class ShippingMethodAdmin(admin.ModelAdmin):
    list_display = ['name', 'carrier', 'delivery_range', 'active_status', 'rule_count']
    list_filter = ['carrier', 'is_active', 'min_delivery_days']
    search_fields = ['name', 'description']
    actions = ['enable_methods', 'disable_methods']

    def delivery_range(self, obj):
        return f"{obj.min_delivery_days}-{obj.max_delivery_days} days"
    delivery_range.short_description = 'Delivery Time'

    def active_status(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green;">●</span> Active')
        return format_html('<span style="color: red;">●</span> Inactive')
    active_status.short_description = 'Status'

    def rule_count(self, obj):
        return obj.rules.count()
    rule_count.short_description = 'Rules'

    def enable_methods(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"{queryset.count()} methods enabled.")
    enable_methods.short_description = "Enable selected methods"

    def disable_methods(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"{queryset.count()} methods disabled.")
    disable_methods.short_description = "Disable selected methods"


class ShippingRuleInline(admin.TabularInline):
    model = ShippingRule
    extra = 1
    fields = ['method', 'condition_type', 'min_value', 'max_value', 'price', 'free_shipping_threshold', 'is_active']


@admin.register(ShippingRule)
class ShippingRuleAdmin(admin.ModelAdmin):
    list_display = ['zone', 'method', 'condition_type', 'price_display', 'free_threshold', 'active_status', 'priority', 'is_active']
    list_filter = ['condition_type', 'is_active', 'zone', 'method__carrier']
    search_fields = ['zone__name', 'method__name']
    list_editable = ['priority', 'is_active']
    actions = ['enable_rules', 'disable_rules', 'set_high_priority', 'set_low_priority']

    def price_display(self, obj):
        return f"${obj.price}"
    price_display.short_description = 'Price'

    def free_threshold(self, obj):
        if obj.free_shipping_threshold:
            return f"Free over ${obj.free_shipping_threshold}"
        return "No free shipping"
    free_threshold.short_description = 'Free Shipping'

    def active_status(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green;">●</span> Active')
        return format_html('<span style="color: red;">●</span> Inactive')
    active_status.short_description = 'Status'

    def enable_rules(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"{queryset.count()} rules enabled.")
    enable_rules.short_description = "Enable selected rules"

    def disable_rules(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"{queryset.count()} rules disabled.")
    disable_rules.short_description = "Disable selected rules"

    def set_high_priority(self, request, queryset):
        queryset.update(priority=0)
        self.message_user(request, f"{queryset.count()} rules set to high priority.")
    set_high_priority.short_description = "Set high priority (0)"

    def set_low_priority(self, request, queryset):
        queryset.update(priority=100)
        self.message_user(request, f"{queryset.count()} rules set to low priority.")
    set_low_priority.short_description = "Set low priority (100)"