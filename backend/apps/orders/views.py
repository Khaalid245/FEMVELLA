from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsOwnerOrReadOnly
from .models import Order
from .serializers import CreateOrderSerializer, OrderOutputSerializer
from .services import CartItem, create_order_from_cart


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET  /api/orders/          — list authenticated user's orders
    GET  /api/orders/{id}/     — retrieve a single order
    POST /api/orders/checkout/ — create order from cart
    """

    serializer_class = OrderOutputSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly)

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all().prefetch_related("items__product")
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items__product")
            .order_by("-created_at")
        )

    @action(methods=["post"], detail=False, url_path="checkout")
    def checkout(self, request):
        """
        POST /api/orders/checkout/

        Body:
        {
            "items": [
                {"product_id": 1, "quantity": 2},
                {"product_id": 4, "quantity": 1}
            ],
            "shipping_address": "123 Main St, City, Country",
            "notes": "Leave at door"
        }
        """
        input_serializer = CreateOrderSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        validated = input_serializer.validated_data

        cart_items = [
            CartItem(product_id=item["product_id"], quantity=item["quantity"])
            for item in validated["items"]
        ]

        # All business logic + DB writes happen here — view stays thin
        order, created = create_order_from_cart(
            user=request.user,
            cart_items=cart_items,
            shipping_address=validated["shipping_address"],
            notes=validated.get("notes", ""),
            idempotency_key=validated.get("idempotency_key", ""),
        )

        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(OrderOutputSerializer(order).data, status=http_status)
