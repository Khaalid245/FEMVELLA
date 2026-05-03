from rest_framework import serializers

from apps.products.models import Product, ProductVariant
from .models import Order, OrderItem, OrderStatusHistory


# ---------------------------------------------------------------------------
# Input
# ---------------------------------------------------------------------------

class CartItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity   = serializers.IntegerField(min_value=1, max_value=100)
    variant_id = serializers.IntegerField(min_value=1, required=False, allow_null=True, default=None)

    def validate(self, data):
        product_id = data["product_id"]
        variant_id = data.get("variant_id")

        if not Product.objects.filter(pk=product_id, is_active=True).exists():
            raise serializers.ValidationError(
                {"product_id": f"Product {product_id} does not exist or is inactive."}
            )
        if variant_id:
            if not ProductVariant.objects.filter(pk=variant_id, product_id=product_id).exists():
                raise serializers.ValidationError(
                    {"variant_id": f"Variant {variant_id} does not belong to product {product_id}."}
                )
        return data


class CreateOrderSerializer(serializers.Serializer):
    idempotency_key = serializers.CharField(
        required=False, allow_blank=True, default="", max_length=64
    )
    items = CartItemInputSerializer(many=True, min_length=1)
    shipping_address = serializers.CharField(min_length=10, max_length=500)
    notes = serializers.CharField(required=False, allow_blank=True, default="", max_length=1000)

    def validate_items(self, items):
        # Deduplicate by (product_id, variant_id) — merge quantities
        merged: dict[tuple, dict] = {}
        for item in items:
            key = (item["product_id"], item.get("variant_id"))
            if key in merged:
                merged[key]["quantity"] += item["quantity"]
            else:
                merged[key] = dict(item)
        return list(merged.values())


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

class OrderItemOutputSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    subtotal     = serializers.ReadOnlyField()
    size         = serializers.SerializerMethodField()
    color        = serializers.SerializerMethodField()

    class Meta:
        model  = OrderItem
        fields = ("id", "product", "product_name", "variant", "size", "color",
                  "quantity", "unit_price", "subtotal")

    def get_size(self, obj):
        return obj.size_snapshot or (obj.variant.size if obj.variant else "")

    def get_color(self, obj):
        return obj.color_snapshot or (obj.variant.color if obj.variant else "")


class OrderOutputSerializer(serializers.ModelSerializer):
    items      = OrderItemOutputSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model  = Order
        fields = (
            "id", "user_email", "status", "total_price",
            "shipping_address", "notes", "idempotency_key",
            "items", "created_at",
        )


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(
        source="changed_by.email", read_only=True, default=None
    )

    class Meta:
        model  = OrderStatusHistory
        fields = ("id", "old_status", "new_status", "changed_by_email", "timestamp")
