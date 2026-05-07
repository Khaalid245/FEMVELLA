from rest_framework.routers import DefaultRouter

from .views import SearchAnalyticsViewSet, SearchViewSet
from .recommendation_views import RecommendationViewSet

router = DefaultRouter()
router.register("analytics", SearchAnalyticsViewSet, basename="search-analytics")
router.register("recommendations", RecommendationViewSet, basename="recommendations")
router.register("", SearchViewSet, basename="search")

urlpatterns = router.urls
