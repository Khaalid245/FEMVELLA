from decimal import Decimal

from rest_framework import serializers

from apps.products.models import Product

from .models import SearchAnalytics, SearchClick, SearchQuery, SearchSuggestion


class SearchParamsSerializer(serializers.Serializer):
    SORT_CHOICES = (
        ("price_asc", "Price low to high"),
        ("price_desc", "Price high to low"),
        ("name_asc", "Name A-Z"),
        ("name_desc", "Name Z-A"),
        ("newest", "Newest"),
        ("oldest", "Oldest"),
        ("popularity", "Popularity"),
    )

    q = serializers.CharField(required=False, allow_blank=True, max_length=255, trim_whitespace=True)
    category = serializers.ListField(child=serializers.SlugField(max_length=100), required=False)
    price_min = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.00"), required=False)
    price_max = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.00"), required=False)
    size = serializers.ListField(child=serializers.CharField(max_length=50), required=False)
    color = serializers.ListField(child=serializers.CharField(max_length=50), required=False)
    in_stock = serializers.BooleanField(required=False)
    featured = serializers.BooleanField(required=False)
    new = serializers.BooleanField(required=False)
    bestseller = serializers.BooleanField(required=False)
    on_sale = serializers.BooleanField(required=False)
    sort = serializers.ChoiceField(choices=SORT_CHOICES, required=False)
    page = serializers.IntegerField(min_value=1, default=1)
    page_size = serializers.IntegerField(min_value=1, max_value=100, default=20)

    def validate(self, attrs):
        price_min = attrs.get("price_min")
        price_max = attrs.get("price_max")
        if price_min is not None and price_max is not None and price_min > price_max:
            raise serializers.ValidationError({"price_max": "price_max must be greater than or equal to price_min."})
        return attrs


class AutocompleteParamsSerializer(serializers.Serializer):
    q = serializers.CharField(min_length=2, max_length=255, trim_whitespace=True)
    limit = serializers.IntegerField(min_value=1, max_value=20, default=10)


class SimilarProductsParamsSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    limit = serializers.IntegerField(min_value=1, max_value=12, default=6)


class PopularQueriesParamsSerializer(serializers.Serializer):
    limit = serializers.IntegerField(min_value=1, max_value=50, default=10)
    days = serializers.IntegerField(min_value=1, max_value=30, default=7)


class SearchAnalyticsDashboardParamsSerializer(serializers.Serializer):
    days = serializers.IntegerField(min_value=1, max_value=365, default=7)


class SearchClickEventSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=255, trim_whitespace=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        source="product",
    )
    position = serializers.IntegerField(min_value=1, max_value=1000, required=False, allow_null=True)


class SearchResultSerializer(serializers.Serializer):
    products = serializers.ListField()
    total = serializers.IntegerField()
    page = serializers.IntegerField()
    page_size = serializers.IntegerField()
    total_pages = serializers.IntegerField()
    facets = serializers.DictField()
    suggestions = serializers.ListField(required=False)
    query = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    backend = serializers.CharField(required=False)


class SearchQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchQuery
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


class SearchClickSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchClick
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


class SearchSuggestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchSuggestion
        fields = "__all__"


class SearchAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchAnalytics
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")
