import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    # Existing
    on_sale = django_filters.BooleanFilter(method="filter_on_sale")
    category__slug = django_filters.CharFilter(field_name="category__slug")

    # Price range
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    # Size — matches any ProductSize.size for this product
    size = django_filters.CharFilter(method="filter_size")

    # Color — matches any ProductColor.name (case-insensitive)
    color = django_filters.CharFilter(method="filter_color")

    class Meta:
        model = Product
        fields = ("is_featured", "is_new", "is_bestseller", "category__slug")

    def filter_on_sale(self, queryset, name, value):
        if value:
            return queryset.filter(sale_price__isnull=False)
        return queryset.filter(sale_price__isnull=True)

    def filter_size(self, queryset, name, value):
        # Support comma-separated multi-select: ?size=S,M,L
        sizes = [s.strip() for s in value.split(",") if s.strip()]
        return queryset.filter(sizes__size__in=sizes).distinct()

    def filter_color(self, queryset, name, value):
        colors = [c.strip() for c in value.split(",") if c.strip()]
        return queryset.filter(colors__name__in=colors).distinct()
