from rest_framework import serializers
from .models import Product, ProductImage, ProductVariant, Category


class FastProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "is_primary", "sort_order")


class FastProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ("id", "size", "color", "stock", "effective_price")


class FastCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class FastProductSerializer(serializers.ModelSerializer):
    """Lean serializer used by search and recommendation endpoints."""
    images = FastProductImageSerializer(many=True, read_only=True)
    variants = FastProductVariantSerializer(many=True, read_only=True)
    category = FastCategorySerializer(read_only=True)
    discount_percent = serializers.SerializerMethodField()
    total_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "description",
            "price", "sale_price", "discount_percent",
            "stock", "total_stock",
            "is_active", "is_featured", "is_new", "is_bestseller", "is_customizable",
            "category", "images", "variants",
            "created_at",
        )

    def get_discount_percent(self, obj):
        if obj.sale_price and obj.price and obj.price > 0:
            return round(((obj.price - obj.sale_price) / obj.price) * 100)
        return None

    def get_total_stock(self, obj):
        return obj.total_stock