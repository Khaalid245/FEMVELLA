from rest_framework import serializers
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Post
        fields = ("id", "title", "slug", "author", "content", "cover_image", "is_published", "published_at", "created_at")
