from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework import status
from .models import Banner, Collection, LookbookEntry, CMS_CACHE_KEY
from .serializers import HomepageContentSerializer, BannerSerializer, CollectionSerializer, LookbookEntrySerializer

CACHE_TTL = 60 * 5  # 5 minutes


class HomepageContentView(APIView):
    """Public endpoint — returns all live CMS content for the homepage."""
    permission_classes = [AllowAny]

    def get(self, request):
        data = cache.get(CMS_CACHE_KEY)
        if data is None:
            banners = [b for b in Banner.objects.filter(is_active=True) if b.is_live]
            collections = [c for c in Collection.objects.filter(is_active=True) if c.is_live]
            lookbook = LookbookEntry.objects.filter(is_active=True)
            ctx = {"request": request}
            data = HomepageContentSerializer({
                "banners": banners,
                "collections": collections,
                "lookbook": lookbook,
            }, context=ctx).data
            cache.set(CMS_CACHE_KEY, data, CACHE_TTL)
        return Response(data)


class ReorderView(APIView):
    """Admin — bulk update sort_order for a model. Body: [{id, sort_order}, ...]"""
    permission_classes = [IsAdminUser]

    MODEL_MAP = {
        "banners": Banner,
        "collections": Collection,
        "lookbook": LookbookEntry,
    }

    def patch(self, request, content_type):
        model = self.MODEL_MAP.get(content_type)
        if not model:
            return Response({"detail": "Unknown content type."}, status=status.HTTP_400_BAD_REQUEST)

        items = request.data
        if not isinstance(items, list):
            return Response({"detail": "Expected a list."}, status=status.HTTP_400_BAD_REQUEST)

        for item in items:
            model.objects.filter(pk=item["id"]).update(sort_order=item["sort_order"])

        return Response({"detail": "Order updated."})
