import logging

from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from .recommendations import recommendation_service

logger = logging.getLogger(__name__)


def _session_key(request) -> str:
    """Return session key, creating a session if needed."""
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key or ""


class RecommendationViewSet(ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=["get"])
    def similar(self, request):
        """GET /api/recommendations/similar/?product_id=<id>&limit=8"""
        try:
            product_id = int(request.query_params.get("product_id", 0))
            limit = min(int(request.query_params.get("limit", 8)), 20)
            if not product_id:
                return Response({"products": []})
            data = recommendation_service.similar_to_product(product_id, limit, request)
            return Response({"products": data})
        except Exception:
            logger.exception("similar endpoint error")
            return Response({"products": []})

    @action(detail=False, methods=["get"])
    def feed(self, request):
        """GET /api/recommendations/feed/?limit=8"""
        try:
            limit = min(int(request.query_params.get("limit", 8)), 20)
            data = recommendation_service.personalized_feed(
                user=request.user,
                session_key=_session_key(request),
                limit=limit,
                request=request,
            )
            return Response({"products": data})
        except Exception:
            logger.exception("feed endpoint error")
            return Response({"products": []})

    @action(detail=False, methods=["get"])
    def trending(self, request):
        """GET /api/recommendations/trending/?limit=8"""
        try:
            limit = min(int(request.query_params.get("limit", 8)), 20)
            data = recommendation_service.trending_now(limit, request)
            return Response({"products": data})
        except Exception:
            logger.exception("trending endpoint error")
            return Response({"products": []})

    @action(detail=False, methods=["get"])
    def category(self, request):
        """GET /api/recommendations/category/?slug=abayas&limit=8"""
        try:
            slug = request.query_params.get("slug", "")
            limit = min(int(request.query_params.get("limit", 8)), 20)
            if not slug:
                return Response({"products": []})
            data = recommendation_service.category_picks(slug, limit, request)
            return Response({"products": data})
        except Exception:
            logger.exception("category endpoint error")
            return Response({"products": []})

    @action(detail=False, methods=["get"])
    def complete_the_look(self, request):
        """GET /api/recommendations/complete_the_look/?product_id=<id>&limit=4"""
        try:
            product_id = int(request.query_params.get("product_id", 0))
            limit = min(int(request.query_params.get("limit", 4)), 8)
            if not product_id:
                return Response({"products": []})
            data = recommendation_service.complete_the_look(product_id, limit, request)
            return Response({"products": data})
        except Exception:
            logger.exception("complete_the_look endpoint error")
            return Response({"products": []})

    @action(detail=False, methods=["get"])
    def recently_viewed(self, request):
        """GET /api/recommendations/recently_viewed/?limit=6"""
        try:
            limit = min(int(request.query_params.get("limit", 6)), 12)
            data = recommendation_service.get_recently_viewed(
                _session_key(request), limit, request
            )
            return Response({"products": data})
        except Exception:
            logger.exception("recently_viewed endpoint error")
            return Response({"products": []})

    @action(detail=False, methods=["post"])
    def record_view(self, request):
        """POST /api/recommendations/record_view/  body: {product_id: int}"""
        try:
            product_id = int(request.data.get("product_id", 0))
            if product_id:
                recommendation_service.record_view(_session_key(request), product_id)
                # Also fire analytics event if available
                try:
                    from apps.analytics.models import AnalyticsEvent
                    AnalyticsEvent.objects.create(
                        event_type="product_view",
                        session_id=_session_key(request),
                        user=request.user if request.user.is_authenticated else None,
                        product_id=product_id,
                        page_url=request.data.get("page_url", ""),
                        ip_address=_get_ip(request),
                    )
                except Exception:
                    pass
            return Response({"status": "ok"})
        except Exception:
            logger.exception("record_view endpoint error")
            return Response({"status": "error"})

    @action(detail=False, methods=["get"])
    def new_arrivals(self, request):
        """GET /api/recommendations/new_arrivals/?limit=8"""
        try:
            limit = min(int(request.query_params.get("limit", 8)), 20)
            data = recommendation_service.new_arrivals(limit, request)
            return Response({"products": data})
        except Exception:
            logger.exception("new_arrivals endpoint error")
            return Response({"products": []})


def _get_ip(request) -> str | None:
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")
