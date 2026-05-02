from django.contrib import admin
from .models import Category, Product, ProductImage, ProductColor, ProductSize


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductColorInline(admin.TabularInline):
    model = ProductColor
    extra = 1


class ProductSizeInline(admin.TabularInline):
    model = ProductSize
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "sale_price", "stock", "is_active", "is_featured", "is_new", "is_bestseller")
    list_filter = ("is_active", "is_featured", "is_new", "is_bestseller", "category")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline, ProductColorInline, ProductSizeInline]


admin.site.register(Category)
admin.site.register(ProductImage)
