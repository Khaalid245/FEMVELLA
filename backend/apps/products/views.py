from rest_framework import viewsets, filters, generics
from django_filters.rest_framework import DjangoFilterBackend
from core.permissions import IsAdminOrReadOnly
from .filters import ProductFilter
from .models import Category, Product
from .serializers import CategorySerializer, ProductListSerializer, ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = (IsAdminOrReadOnly,)
    lookup_field = "slug"


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAdminOrReadOnly,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_class = ProductFilter
    search_fields = ("name", "description")
    ordering_fields = ("price", "created_at")
    ordering = ("-created_at",)

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductSerializer

    def get_object(self):
        """Support lookup by both pk (integer) and slug (string)."""
        lookup = self.kwargs.get(self.lookup_field)
        qs = self.get_queryset()
        if lookup and lookup.isdigit():
            return generics.get_object_or_404(qs, pk=lookup)
        return generics.get_object_or_404(qs, slug=lookup)

    def get_queryset(self):
        qs = Product.objects.select_related("category").prefetch_related("images", "colors", "sizes", "variants")
        if self.request.user.is_staff:
            return qs.all()
        return qs.filter(is_active=True)
