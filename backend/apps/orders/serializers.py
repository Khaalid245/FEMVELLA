from rest_framework import serializers

from apps.products.models import Product
from .models import Order, OrderItem


# ---------------------------------------------------------------------------
# Input
# ---------------------------------------------------------------------------

class CartItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=100)

    def validate_product_id(self, value):
        # Lightweight existence check — deep stock validation is in the service
        if not Product.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError(
                f"Product with id={value} does not exist or is inactive."
            )
        return value


class CreateOrderSerializer(serializers.Serializer):
    items = CartItemInputSerializer(many=True, min_length=1)
    shipping_address = serializers.CharField(min_length=10, max_length=500)
    notes = serializers.CharField(required=False, allow_blank=True, default="", max_length=1000)

    def validate_items(self, items):
        # Deduplicate by product_id — merge quantities
        merged: dict[int, int] = {}
        for item in items:
            pid = item["product_id"]
            merged[pid] = merged.get(pid, 0) + item["quantity"]
        return [{"product_id": pid, "quantity": qty} for pid, qty in merged.items()]


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

class OrderItemOutputSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = ("id", "product", "product_name", "quantity", "unit_price", "subtotal")


class OrderOutputSerializer(serializers.ModelSerializer):
    items = OrderItemOutputSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "total_price",
            "shipping_address",
            "notes",
            "items",
            "created_at",
        )
