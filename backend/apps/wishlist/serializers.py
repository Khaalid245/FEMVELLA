from rest_framework import serializers
from .models import Wishlist, WishlistItem
from apps.products.serializers import ProductSerializer


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'added_at']
        read_only_fields = ['id', 'added_at']


class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)
    item_count = serializers.ReadOnlyField()
    total_value = serializers.ReadOnlyField()
    
    class Meta:
        model = Wishlist
        fields = ['id', 'items', 'item_count', 'total_value', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AddToWishlistSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    
    def validate_product_id(self, value):
        from apps.products.models import Product
        
        try:
            Product.objects.get(id=value, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found or inactive")
        
        return value


class RemoveFromWishlistSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    
    def validate_product_id(self, value):
        from apps.products.models import Product
        
        try:
            Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found")
        
        return value