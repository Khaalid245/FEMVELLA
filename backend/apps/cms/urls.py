from django.urls import path
from .views import HomepageContentView, ReorderView

urlpatterns = [
    path("homepage/", HomepageContentView.as_view(), name="cms-homepage"),
    path("reorder/<str:content_type>/", ReorderView.as_view(), name="cms-reorder"),
]
