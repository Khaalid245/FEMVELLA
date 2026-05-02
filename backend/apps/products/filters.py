import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    on_sale = django_filters.BooleanFilter(method="filter_on_sale")
    category__slug = django_filters.CharFilter(field_name="category__slug")

    class Meta:
        model = Product
        fields = ("is_featured", "is_new", "is_bestseller", "category__slug")

    def filter_on_sale(self, queryset, name, value):
        if value:
            return queryset.filter(sale_price__isnull=False)
        return queryset.filter(sale_price__isnull=True)
