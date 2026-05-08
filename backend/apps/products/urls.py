from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet
from .product_detail_views import product_detail
from .inventory_views import (
    product_availability, check_variant_availability,
    reserve_stock, low_stock_report, update_variant_stock,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("", ProductViewSet, basename="product")

inventory_patterns = [
    path("inventory/availability/<int:product_id>/", product_availability, name="product-availability"),
    path("inventory/check/", check_variant_availability, name="check-variant-availability"),
    path("inventory/reserve/", reserve_stock, name="reserve-stock"),
    path("inventory/low-stock/", low_stock_report, name="low-stock-report"),
    path("inventory/variant/<int:variant_id>/update/", update_variant_stock, name="update-variant-stock"),
]

urlpatterns = inventory_patterns + [
    path("detail/<slug:slug>/", product_detail, name="product-detail-public"),
] + router.urls
