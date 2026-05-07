from django.contrib import admin
from django.utils.html import format_html
from .models import Wishlist, WishlistItem


class WishlistItemInline(admin.TabularInline):
    model = WishlistItem
    extra = 0
    readonly_fields = ['added_at']
    fields = ['product', 'added_at']


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'item_count_display', 'total_value_display', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at', 'item_count', 'total_value']
    inlines = [WishlistItemInline]

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'
    user_email.admin_order_field = 'user__email'

    def item_count_display(self, obj):
        count = obj.item_count
        if count == 0:
            return format_html('<span style="color: #999;">0 items</span>')
        elif count < 5:
            return format_html('<span style="color: #28a745;">{} items</span>', count)
        else:
            return format_html('<span style="color: #007bff; font-weight: bold;">{} items</span>', count)
    item_count_display.short_description = 'Items'

    def total_value_display(self, obj):
        value = obj.total_value
        if value == 0:
            return format_html('<span style="color: #999;">$0.00</span>')
        else:
            return format_html('<span style="color: #28a745; font-weight: bold;">${:.2f}</span>', value)
    total_value_display.short_description = 'Total Value'


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'user_email', 'product_price', 'added_at']
    list_filter = ['added_at', 'product__category']
    search_fields = [
        'product__name', 
        'wishlist__user__email',
        'wishlist__user__first_name',
        'wishlist__user__last_name'
    ]
    readonly_fields = ['added_at']

    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'
    product_name.admin_order_field = 'product__name'

    def user_email(self, obj):
        return obj.wishlist.user.email
    user_email.short_description = 'User'
    user_email.admin_order_field = 'wishlist__user__email'

    def product_price(self, obj):
        return format_html('${:.2f}', obj.product.price)
    product_price.short_description = 'Price'
    product_price.admin_order_field = 'product__price'