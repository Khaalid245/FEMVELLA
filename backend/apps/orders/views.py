from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsOwnerOrReadOnly
from .models import Order, OrderStatusHistory
from .serializers import (
    CreateOrderSerializer,
    OrderOutputSerializer,
    OrderStatusHistorySerializer,
)
from .services import CartItem, create_order_from_cart


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderOutputSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly)
    filter_backends = (filters.SearchFilter,)
    search_fields = ("id", "user__email")

    def get_queryset(self):
        qs = (
            Order.objects.all()
            .select_related("user")
            .prefetch_related("items__product")
            .order_by("-created_at")
        ) if self.request.user.is_staff else (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items__product")
            .order_by("-created_at")
        )

        # Admin-only filters
        if self.request.user.is_staff:
            s = self.request.query_params.get("status")
            date_from = self.request.query_params.get("date_from")
            date_to = self.request.query_params.get("date_to")
            if s:
                qs = qs.filter(status=s)
            if date_from:
                qs = qs.filter(created_at__date__gte=date_from)
            if date_to:
                qs = qs.filter(created_at__date__lte=date_to)

        return qs

    # ── Checkout ──────────────────────────────────────────────────────────
    @action(methods=["post"], detail=False, url_path="checkout")
    def checkout(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data
        cart_items = [
            CartItem(
                product_id=i["product_id"],
                quantity=i["quantity"],
                variant_id=i.get("variant_id"),
            )
            for i in v["items"]
        ]
        order, created = create_order_from_cart(
            user=request.user,
            cart_items=cart_items,
            shipping_address=v["shipping_address"],
            notes=v.get("notes", ""),
            idempotency_key=v.get("idempotency_key", ""),
        )
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(OrderOutputSerializer(order).data, status=http_status)

    # ── Single status update (with audit log) ─────────────────────────────
    @action(methods=["patch"], detail=True, url_path="update-status",
            permission_classes=[permissions.IsAdminUser])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("status")
        valid = [s.value for s in Order.Status]
        if new_status not in valid:
            return Response(
                {"detail": f"Invalid status. Choose from: {valid}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        old_status = order.status
        order.status = new_status
        order.save(update_fields=["status", "updated_at"])

        OrderStatusHistory.objects.create(
            order=order,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
        )
        return Response(OrderOutputSerializer(order).data)

    # ── Audit log for a single order ──────────────────────────────────────
    @action(methods=["get"], detail=True, url_path="history",
            permission_classes=[permissions.IsAdminUser])
    def history(self, request, pk=None):
        order = self.get_object()
        qs = order.history.select_related("changed_by").all()
        return Response(OrderStatusHistorySerializer(qs, many=True).data)

    # ── Bulk status update ────────────────────────────────────────────────
    @action(methods=["post"], detail=False, url_path="bulk-update-status",
            permission_classes=[permissions.IsAdminUser])
    def bulk_update_status(self, request):
        order_ids = request.data.get("order_ids", [])
        new_status = request.data.get("status")
        valid = [s.value for s in Order.Status]

        if not order_ids or not isinstance(order_ids, list):
            return Response({"detail": "order_ids must be a non-empty list."},
                            status=status.HTTP_400_BAD_REQUEST)
        if new_status not in valid:
            return Response({"detail": f"Invalid status. Choose from: {valid}"},
                            status=status.HTTP_400_BAD_REQUEST)

        orders = Order.objects.filter(pk__in=order_ids)
        history_records = []
        for order in orders:
            if order.status != new_status:
                history_records.append(OrderStatusHistory(
                    order=order,
                    old_status=order.status,
                    new_status=new_status,
                    changed_by=request.user,
                ))

        orders.update(status=new_status)
        OrderStatusHistory.objects.bulk_create(history_records)

        return Response({"updated": orders.count(), "status": new_status})
