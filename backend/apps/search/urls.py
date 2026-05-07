from rest_framework.routers import DefaultRouter

from .views import SearchAnalyticsViewSet, SearchViewSet

router = DefaultRouter()
router.register("analytics", SearchAnalyticsViewSet, basename="search-analytics")
router.register("", SearchViewSet, basename="search")

urlpatterns = router.urls
