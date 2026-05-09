from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductColor, ProductSize, ProductVariant
from apps.currency.serializers import CurrencyPriceMixin


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "is_primary", "sort_order")

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "parent", "image")

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class ProductColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductColor
        fields = ("id", "name", "hex_code")


class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = ("id", "size", "in_stock")


class ProductVariantSerializer(serializers.ModelSerializer):
    """Public-facing variant serializer — no internal inventory fields."""
    effective_price = serializers.ReadOnlyField()
    available_stock = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    stock_status = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariant
        fields = (
            "id", "size", "color", "stock", "available_stock",
            "price_override", "effective_price",
            "is_in_stock", "is_low_stock", "stock_status",
        )


class ProductListSerializer(CurrencyPriceMixin, serializers.ModelSerializer):
    """Lightweight serializer for product list views — minimal fields, no variants."""
    primary_image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="category.name", read_only=True)
    category = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "category", "category_name",
            "price", "sale_price", "discount_percent",
            "total_stock", "is_featured", "is_new", "is_bestseller",
            "primary_image", "images", "created_at",
        )

    def get_category(self, obj):
        if not obj.category:
            return None
        return {"id": obj.category.id, "name": obj.category.name, "slug": obj.category.slug}

    def get_images(self, obj):
        """Return all images with absolute URLs — needed by ProductCard components."""
        request = self.context.get("request")
        result = []
        for image in obj.images.all():
            url = (
                request.build_absolute_uri(image.image.url)
                if request and image.image
                else (image.image.url if image.image else None)
            )
            result.append({
                "id": image.id,
                "image": url,
                "alt_text": image.alt_text,
                "is_primary": image.is_primary,
                "sort_order": image.sort_order,
            })
        return result

    def get_primary_image(self, obj):
        # Iterate the prefetched queryset once — avoids a second DB call
        # when no image is marked is_primary.
        first = None
        for image in obj.images.all():
            if first is None:
                first = image
            if image.is_primary:
                primary_image = image
                break
        else:
            primary_image = first
        if primary_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(primary_image.image.url)
            return primary_image.image.url
        return None

    def get_discount_percent(self, obj):
        if obj.sale_price and obj.price:
            return round(((obj.price - obj.sale_price) / obj.price) * 100)
        return None


class ProductSerializer(CurrencyPriceMixin, serializers.ModelSerializer):
    """Full product serializer — used for detail views and admin write operations."""
    images = ProductImageSerializer(many=True, read_only=True)
    colors = ProductColorSerializer(many=True, read_only=True)
    sizes = ProductSizeSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    discount_percent = serializers.SerializerMethodField()
    total_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "description", "category", "category_id",
            "price", "sale_price", "discount_percent",
            "stock", "total_stock",
            "is_featured", "is_new", "is_bestseller", "is_customizable",
            "images", "colors", "sizes", "variants",
            "created_at", "updated_at",
        )

    def get_discount_percent(self, obj):
        if obj.sale_price and obj.price:
            return round(((obj.price - obj.sale_price) / obj.price) * 100)
        return None
