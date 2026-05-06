from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductColor, ProductSize, ProductVariant


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "image", "is_primary")

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
    effective_price = serializers.ReadOnlyField()
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ("id", "size", "color", "stock", "price_override", "effective_price", "in_stock")

    def get_in_stock(self, obj):
        return obj.stock > 0


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    colors = ProductColorSerializer(many=True, read_only=True)
    sizes = ProductSizeSerializer(many=True, read_only=True)   # legacy
    variants = ProductVariantSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    discount_percent = serializers.SerializerMethodField()
    total_stock = serializers.ReadOnlyField()
    upload_image = serializers.ImageField(write_only=True, required=False)
    variants_data = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "description", "category", "category_id",
            "price", "sale_price", "discount_percent",
            "stock", "total_stock",
            "is_active", "is_featured", "is_new", "is_bestseller", "is_customizable",
            "upload_image", "images", "colors", "sizes", "variants", "variants_data",
            "created_at", "updated_at",
        )

    def get_discount_percent(self, obj):
        if obj.sale_price and obj.price:
            discount = ((obj.price - obj.sale_price) / obj.price) * 100
            return round(discount)
        return None

    def _save_variants(self, product, variants_json):
        import json
        try:
            variants = json.loads(variants_json)
        except (ValueError, TypeError):
            return
        incoming_ids = {int(v["id"]) for v in variants if v.get("id")}
        product.variants.exclude(pk__in=incoming_ids).delete()
        for v in variants:
            size = v.get("size", "").strip()
            if not size:
                continue
            defaults = {
                "stock": int(v.get("stock") or 0),
                "color": (v.get("color") or "").strip(),
                "price_override": v.get("price_override") or None,
            }
            if v.get("id"):
                ProductVariant.objects.filter(pk=int(v["id"]), product=product).update(**defaults)
            else:
                ProductVariant.objects.update_or_create(
                    product=product,
                    size=size,
                    color=defaults["color"],
                    defaults={"stock": defaults["stock"], "price_override": defaults["price_override"]},
                )

    def create(self, validated_data):
        image = validated_data.pop("upload_image", None)
        variants_json = validated_data.pop("variants_data", None)
        product = super().create(validated_data)
        if image:
            ProductImage.objects.create(product=product, image=image, is_primary=True)
        if variants_json:
            self._save_variants(product, variants_json)
        return product

    def update(self, instance, validated_data):
        image = validated_data.pop("upload_image", None)
        variants_json = validated_data.pop("variants_data", None)
        product = super().update(instance, validated_data)
        if image:
            ProductImage.objects.filter(product=product, is_primary=True).delete()
            ProductImage.objects.create(product=product, image=image, is_primary=True)
        if variants_json:
            self._save_variants(product, variants_json)
        return product
