from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductColor, ProductSize


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


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    colors = ProductColorSerializer(many=True, read_only=True)
    sizes = ProductSizeSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    discount_percent = serializers.SerializerMethodField()
    # Write-only — accepts uploaded file, creates ProductImage with is_primary=True
    upload_image = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "description", "category", "category_id",
            "price", "sale_price", "discount_percent",
            "stock", "is_active", "is_featured", "is_new", "is_bestseller",
            "upload_image", "images", "colors", "sizes",
            "created_at", "updated_at",
        )

    def get_discount_percent(self, obj):
        if obj.sale_price and obj.price:
            discount = ((obj.price - obj.sale_price) / obj.price) * 100
            return round(discount)
        return None

    def create(self, validated_data):
        image = validated_data.pop("upload_image", None)
        product = super().create(validated_data)
        if image:
            ProductImage.objects.create(product=product, image=image, is_primary=True)
        return product

    def update(self, instance, validated_data):
        image = validated_data.pop("upload_image", None)
        product = super().update(instance, validated_data)
        if image:
            ProductImage.objects.filter(product=product, is_primary=True).delete()
            ProductImage.objects.create(product=product, image=image, is_primary=True)
        return product
