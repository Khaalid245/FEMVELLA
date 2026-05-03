from django.contrib import admin
from .models import Category, Product, ProductImage, ProductColor, ProductSize, ProductVariant


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductColorInline(admin.TabularInline):
    model = ProductColor
    extra = 1


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 3
    fields = ("size", "color", "stock", "price_override")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "sale_price", "get_total_stock",
                    "is_active", "is_featured", "is_new", "is_bestseller")
    list_filter = ("is_active", "is_featured", "is_new", "is_bestseller", "category")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline, ProductColorInline, ProductVariantInline]

    @admin.display(description="Total Stock")
    def get_total_stock(self, obj):
        return obj.total_stock


admin.site.register(Category)
admin.site.register(ProductImage)
admin.site.register(ProductVariant)
