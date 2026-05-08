import json
import logging
from pathlib import Path

from django.conf import settings
from rest_framework import serializers
from django.db import models
from .models import Category, Product, ProductImage, ProductColor, ProductSize, ProductVariant
from apps.currency.serializers import CurrencyPriceMixin

logger = logging.getLogger(__name__)


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "is_primary", "sort_order")

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "parent", "image")

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class ProductColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductColor
        fields = ("id", "name", "hex_code")


class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = ("id", "size", "in_stock")


class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.ReadOnlyField()
    available_stock = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    stock_status = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariant
        fields = (
            "id", "size", "color", "stock", "available_stock", "reserved_stock",
            "low_stock_threshold", "sku", "price_override", "effective_price", 
            "is_active", "is_in_stock", "is_low_stock", "stock_status",
            "total_sold", "last_restocked"
        )
        read_only_fields = ('sku', 'total_sold', 'last_restocked')


# Optimized serializer for product list views
class ProductListSerializer(CurrencyPriceMixin, serializers.ModelSerializer):
    """Lightweight serializer for product list views"""
    primary_image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    discount_percent = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "category_name", 
            "price", "sale_price", "discount_percent",
            "total_stock", "is_featured", "is_new", "is_bestseller",
            "primary_image", "created_at"
        )
    
    def get_primary_image(self, obj):
        # Use prefetched images to avoid additional queries
        primary_image = None
        for image in obj.images.all():
            if image.is_primary:
                primary_image = image
                break
        
        if not primary_image and obj.images.exists():
            primary_image = obj.images.first()
            
        if primary_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(primary_image.image.url)
            return primary_image.image.url
        return None
    
    def get_discount_percent(self, obj):
        if obj.sale_price and obj.price:
            discount = ((obj.price - obj.sale_price) / obj.price) * 100
            return round(discount)
        return None


class ProductSerializer(CurrencyPriceMixin, serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    colors = ProductColorSerializer(many=True, read_only=True)
    sizes = ProductSizeSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    discount_percent = serializers.SerializerMethodField()
    total_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "description", "category", "category_id",
            "price", "sale_price", "discount_percent",
            "stock", "total_stock",
            "is_active", "is_featured", "is_new", "is_bestseller", "is_customizable",
            "images", "colors", "sizes", "variants",
            "created_at", "updated_at",
        )

    def get_discount_percent(self, obj):
        if obj.sale_price and obj.price:
            discount = ((obj.price - obj.sale_price) / obj.price) * 100
            return round(discount)
        return None
