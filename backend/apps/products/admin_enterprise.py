from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Category, Product, ProductImage, ProductColor, ProductSize, ProductVariant


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'alt_text', 'is_primary', 'sort_order')
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 50px;"/>',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = "Preview"


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    fields = (
        'size', 'color', 'stock', 'available_stock', 'reserved_stock', 
        'low_stock_threshold', 'sku', 'price_override', 'is_active', 'stock_badge'
    )
    readonly_fields = ('available_stock', 'stock_badge', 'sku')
    
    def stock_badge(self, obj):
        if not obj.is_active:
            return format_html(
                '<span style="background: #666; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">INACTIVE</span>'
            )
        elif obj.available_stock == 0:
            return format_html(
                '<span style="background: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">OUT OF STOCK</span>'
            )
        elif obj.is_low_stock:
            return format_html(
                '<span style="background: #ffc107; color: black; padding: 2px 6px; border-radius: 3px; font-size: 11px;">LOW STOCK</span>'
            )
        else:
            return format_html(
                '<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">IN STOCK</span>'
            )
    stock_badge.short_description = "Status"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'created_at')
    list_filter = ('parent', 'created_at')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'category', 'price', 'sale_price', 'total_stock', 
        'variant_count', 'stock_status_badge', 'is_active', 'created_at'
    )
    list_filter = (
        'is_active', 'is_featured', 'is_new', 'is_bestseller', 
        'category', 'created_at'
    )
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, ProductVariantInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'category')
        }),
        ('Pricing', {
            'fields': ('price', 'sale_price')
        }),
        ('Inventory', {
            'fields': ('stock',),
            'description': 'Legacy stock field. Use variants for detailed inventory management.'
        }),
        ('Status & Features', {
            'fields': (
                'is_active', 'is_featured', 'is_new', 
                'is_bestseller', 'is_customizable'
            )
        }),
    )
    
    def variant_count(self, obj):
        return obj.variants.count()
    variant_count.short_description = "Variants"
    
    def stock_status_badge(self, obj):
        total_stock = obj.total_stock
        active_variants = obj.variants.filter(is_active=True)
        
        if not active_variants.exists():
            return format_html(
                '<span style="background: #6c757d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">NO VARIANTS</span>'
            )
        
        out_of_stock = active_variants.filter(stock=0).count()
        low_stock = sum(1 for v in active_variants if v.is_low_stock)
        
        if total_stock == 0:
            return format_html(
                '<span style="background: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">OUT OF STOCK</span>'
            )
        elif low_stock > 0:
            return format_html(
                '<span style="background: #ffc107; color: black; padding: 2px 6px; border-radius: 3px; font-size: 11px;">LOW STOCK ({}/{})</span>',
                low_stock, active_variants.count()
            )
        else:
            return format_html(
                '<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">IN STOCK ({})</span>',
                total_stock
            )
    stock_status_badge.short_description = "Stock Status"


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = (
        'sku', 'product', 'size', 'color', 'stock', 'available_stock', 
        'reserved_stock', 'stock_badge', 'is_active', 'updated_at'
    )
    list_filter = (
        'is_active', 'size', 'color', 'product__category', 
        'updated_at', 'last_restocked'
    )
    search_fields = ('sku', 'product__name', 'size', 'color')
    readonly_fields = (
        'sku', 'available_stock', 'stock_badge', 'total_sold', 
        'last_restocked', 'created_at', 'updated_at'
    )
    
    fieldsets = (
        ('Product Information', {
            'fields': ('product', 'size', 'color', 'sku')
        }),
        ('Inventory', {
            'fields': (
                'stock', 'available_stock', 'reserved_stock', 
                'low_stock_threshold', 'stock_badge'
            )
        }),
        ('Pricing', {
            'fields': ('price_override',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Analytics', {
            'fields': ('total_sold', 'last_restocked'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def stock_badge(self, obj):
        if not obj.is_active:
            return format_html(
                '<span style="background: #666; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">INACTIVE</span>'
            )
        elif obj.available_stock == 0:
            return format_html(
                '<span style="background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">OUT OF STOCK</span>'
            )
        elif obj.is_low_stock:
            return format_html(
                '<span style="background: #ffc107; color: black; padding: 4px 8px; border-radius: 4px; font-size: 12px;">LOW STOCK</span>'
            )
        else:
            return format_html(
                '<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">IN STOCK</span>'
            )
    stock_badge.short_description = "Status"
    
    actions = ['mark_as_active', 'mark_as_inactive', 'restock_variants']
    
    def mark_as_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} variants marked as active.')
    mark_as_active.short_description = "Mark selected variants as active"
    
    def mark_as_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} variants marked as inactive.')
    mark_as_inactive.short_description = "Mark selected variants as inactive"
    
    def restock_variants(self, request, queryset):
        self.message_user(request, f'Selected {queryset.count()} variants for restocking.')
    restock_variants.short_description = "Restock selected variants"


@admin.register(ProductColor)
class ProductColorAdmin(admin.ModelAdmin):
    list_display = ('product', 'name', 'hex_code', 'color_preview')
    list_filter = ('product',)
    search_fields = ('name', 'hex_code', 'product__name')
    
    def color_preview(self, obj):
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ccc; border-radius: 3px;"></div>',
            obj.hex_code
        )
    color_preview.short_description = "Preview"


@admin.register(ProductSize)
class ProductSizeAdmin(admin.ModelAdmin):
    list_display = ('product', 'size', 'in_stock')
    list_filter = ('size', 'in_stock', 'product')
    search_fields = ('product__name', 'size')