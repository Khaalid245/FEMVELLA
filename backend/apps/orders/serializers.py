from rest_framework import serializers

from apps.products.models import Product, ProductVariant
from .models import (
    ExchangeRequest,
    Order,
    OrderItem,
    OrderStatusHistory,
    Refund,
    ReturnRequest,
)


# ---------------------------------------------------------------------------
# Input
# ---------------------------------------------------------------------------

class CartItemInputSerializer(serializers.Serializer):
    product_id         = serializers.IntegerField(min_value=1)
    quantity           = serializers.IntegerField(min_value=1, max_value=100)
    variant_id         = serializers.IntegerField(min_value=1, required=False, allow_null=True, default=None)
    customization_text = serializers.CharField(required=False, allow_blank=True, default="", max_length=200)

    def validate(self, data):
        product_id         = data["product_id"]
        variant_id         = data.get("variant_id")
        customization_text = data.get("customization_text", "")

        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError(
                {"product_id": f"Product {product_id} does not exist or is inactive."}
            )

        if customization_text and not product.is_customizable:
            raise serializers.ValidationError(
                {"customization_text": "This product does not support customization."}
            )

        if variant_id:
            if not ProductVariant.objects.filter(pk=variant_id, product_id=product_id).exists():
                raise serializers.ValidationError(
                    {"variant_id": f"Variant {variant_id} does not belong to product {product_id}."}
                )
        return data


class CreateOrderSerializer(serializers.Serializer):
    idempotency_key = serializers.CharField(required=False, allow_blank=True, default="", max_length=64)
    items = CartItemInputSerializer(many=True, min_length=1)
    shipping_address = serializers.CharField(min_length=10, max_length=500)
    notes = serializers.CharField(required=False, allow_blank=True, default="", max_length=1000)

    def validate_items(self, items):
        merged: dict[tuple, dict] = {}
        for item in items:
            key = (item["product_id"], item.get("variant_id"), item.get("customization_text", ""))
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
        fields = (
            "id", "product", "product_name", "variant", "size", "color",
            "customization_text", "quantity", "unit_price", "subtotal",
            "fulfilled_quantity", "refunded_quantity",
        )

    def get_size(self, obj):
        return obj.size_snapshot or (obj.variant.size if obj.variant else "")

    def get_color(self, obj):
        return obj.color_snapshot or (obj.variant.color if obj.variant else "")


class OrderOutputSerializer(serializers.ModelSerializer):
    items        = OrderItemOutputSerializer(many=True, read_only=True)
    user_email   = serializers.EmailField(source="user.email", read_only=True)
    order_number = serializers.ReadOnlyField()
    balance_due  = serializers.ReadOnlyField()

    class Meta:
        model  = Order
        fields = (
            "id", "order_number", "user_email", "status", "total_price",
            "refunded_amount", "balance_due",
            "shipping_address", "notes", "idempotency_key",
            "tracking_number", "carrier", "tracking_url",
            "shipped_at", "delivered_at",
            "items", "created_at",
        )


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source="changed_by.email", read_only=True, default=None)

    class Meta:
        model  = OrderStatusHistory
        fields = ("id", "old_status", "new_status", "changed_by_email", "note", "timestamp")


# ---------------------------------------------------------------------------
# Refund serializers
# ---------------------------------------------------------------------------

class RefundRequestSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01"))
    reason = serializers.CharField(min_length=10, max_length=1000)


class RefundReviewSerializer(serializers.Serializer):
    approved   = serializers.BooleanField()
    admin_note = serializers.CharField(required=False, allow_blank=True, default="")


class RefundOutputSerializer(serializers.ModelSerializer):
    requested_by_email = serializers.EmailField(source="requested_by.email", read_only=True, default=None)
    processed_by_email = serializers.EmailField(source="processed_by.email", read_only=True, default=None)

    class Meta:
        model  = Refund
        fields = (
            "id", "order", "amount", "reason", "status",
            "requested_by_email", "processed_by_email",
            "admin_note", "stripe_refund_id", "processed_at", "created_at",
        )


# ---------------------------------------------------------------------------
# Return request serializers
# ---------------------------------------------------------------------------

class ReturnItemSerializer(serializers.Serializer):
    order_item_id = serializers.IntegerField(min_value=1)
    quantity      = serializers.IntegerField(min_value=1)


class ReturnRequestCreateSerializer(serializers.Serializer):
    reason      = serializers.ChoiceField(choices=ReturnRequest.Reason.choices)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    items       = ReturnItemSerializer(many=True, min_length=1)


class ReturnReviewSerializer(serializers.Serializer):
    approved   = serializers.BooleanField()
    admin_note = serializers.CharField(required=False, allow_blank=True, default="")


class ReturnRequestOutputSerializer(serializers.ModelSerializer):
    requested_by_email = serializers.EmailField(source="requested_by.email", read_only=True, default=None)

    class Meta:
        model  = ReturnRequest
        fields = (
            "id", "order", "status", "reason", "description", "items",
            "requested_by_email", "admin_note",
            "return_tracking_number", "reviewed_at", "created_at",
        )


# ---------------------------------------------------------------------------
# Exchange request serializers
# ---------------------------------------------------------------------------

class ExchangeItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    variant_id = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    quantity   = serializers.IntegerField(min_value=1)


class ExchangeRequestCreateSerializer(serializers.Serializer):
    reason         = serializers.CharField(min_length=5, max_length=1000)
    return_items   = ReturnItemSerializer(many=True, min_length=1)
    exchange_items = ExchangeItemSerializer(many=True, min_length=1)


class ExchangeRequestOutputSerializer(serializers.ModelSerializer):
    requested_by_email = serializers.EmailField(source="requested_by.email", read_only=True, default=None)

    class Meta:
        model  = ExchangeRequest
        fields = (
            "id", "order", "status", "reason",
            "return_items", "exchange_items",
            "requested_by_email", "admin_note",
            "new_order", "reviewed_at", "created_at",
        )


# ---------------------------------------------------------------------------
# Fulfillment serializers
# ---------------------------------------------------------------------------

class FulfillItemSerializer(serializers.Serializer):
    order_item_id = serializers.IntegerField(min_value=1)
    quantity      = serializers.IntegerField(min_value=1)


class FulfillOrderSerializer(serializers.Serializer):
    tracking_number   = serializers.CharField(max_length=100)
    carrier           = serializers.CharField(max_length=50)
    tracking_url      = serializers.URLField(required=False, allow_blank=True, default="")
    item_fulfillments = FulfillItemSerializer(many=True, required=False)  # None = fulfill all


class AddTrackingSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(max_length=100)
    carrier         = serializers.CharField(max_length=50)
    tracking_url    = serializers.URLField(required=False, allow_blank=True, default="")


from decimal import Decimal  # noqa: E402 — needed for RefundRequestSerializer
