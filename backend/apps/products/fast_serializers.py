from rest_framework import serializers
from .models import Product


class FastProductSerializer(serializers.ModelSerializer):
    """
    Minimal read-only serializer for search results and recommendations.
    Uses prefetched images — no extra queries.
    """
    primary_image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    total_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "price", "sale_price", "discount_percent",
            "total_stock", "is_featured", "is_new", "is_bestseller",
            "primary_image", "images", "category",
        )

    def get_primary_image(self, obj):
        request = self.context.get("request")
        first = None
        for image in obj.images.all():
            if first is None:
                first = image
            if image.is_primary:
                img = image
                break
        else:
            img = first
        if not img or not img.image:
            return None
        return request.build_absolute_uri(img.image.url) if request else img.image.url

    def get_images(self, obj):
        request = self.context.get("request")
        result = []
        for image in obj.images.all():
            if not image.image:
                continue
            url = request.build_absolute_uri(image.image.url) if request else image.image.url
            result.append({
                "id": image.id,
                "image": url,
                "alt_text": image.alt_text,
                "is_primary": image.is_primary,
            })
        return result

    def get_category(self, obj):
        if not obj.category:
            return None
        return {"id": obj.category.id, "name": obj.category.name, "slug": obj.category.slug}

    def get_discount_percent(self, obj):
        if obj.sale_price and obj.price:
            return round(((obj.price - obj.sale_price) / obj.price) * 100)
        return None
