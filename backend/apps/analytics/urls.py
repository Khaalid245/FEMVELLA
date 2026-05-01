from django.urls import path
from .views import PageViewCreateView, PageViewStatsView

urlpatterns = [
    path("pageview/", PageViewCreateView.as_view(), name="pageview-create"),
    path("stats/", PageViewStatsView.as_view(), name="pageview-stats"),
]
