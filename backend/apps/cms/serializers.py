from rest_framework import serializers
from .models import Banner, Collection, LookbookEntry


class BannerSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = [
            "id", "title", "subtitle", "badge_text",
            "cta_label", "cta_url", "secondary_cta_label", "secondary_cta_url",
            "image", "image_alt", "sort_order",
        ]

    def get_image(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class CollectionSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = [
            "id", "title", "subtitle", "slug",
            "image", "image_alt", "cta_label", "cta_url", "sort_order",
        ]

    def get_image(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class LookbookEntrySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = LookbookEntry
        fields = ["id", "title", "description", "image", "image_alt", "product_url", "sort_order"]

    def get_image(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class HomepageContentSerializer(serializers.Serializer):
    banners = BannerSerializer(many=True)
    collections = CollectionSerializer(many=True)
    lookbook = LookbookEntrySerializer(many=True)
