from rest_framework import viewsets, permissions
from core.permissions import IsOwnerOrReadOnly
from .models import Order
from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly)

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all().prefetch_related("items")
        return Order.objects.filter(user=self.request.user).prefetch_related("items")
