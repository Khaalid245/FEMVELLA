from rest_framework import serializers
from .models import Product, ProductImage, ProductVariant

class FastProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "is_primary", "sort_order")

class FastProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ("id", "size", "color", "stock", "effective_price")

class FastProductSerializer(serializers.ModelSerializer):
    """Optimized serializer for fast product detail loading"""
    images = FastProductImageSerializer(many=True, read_only=True)
    variants = FastProductVariantSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    discount_percent = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "description", "category_name",
            "price", "sale_price", "discount_percent", "total_stock",
            "is_active", "is_featured", "is_new", "is_bestseller", "is_customizable",
            "images", "variants", "created_at"
        )
    
    def get_discount_percent(self, obj):
        if obj.sale_price and obj.price:
            discount = ((obj.price - obj.sale_price) / obj.price) * 100
            return round(discount)
        return None