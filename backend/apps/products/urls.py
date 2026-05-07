from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet
from .fast_views import fast_product_detail
from .minimal_views import minimal_product_detail, minimal_products_list
from .test_views import test_speed, simple_product
from .inventory_views import (
    product_availability, check_variant_availability, 
    reserve_stock, low_stock_report, update_variant_stock
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("", ProductViewSet, basename="product")

# Inventory management endpoints
inventory_patterns = [
    path('inventory/availability/<int:product_id>/', product_availability, name='product-availability'),
    path('inventory/check/', check_variant_availability, name='check-variant-availability'),
    path('inventory/reserve/', reserve_stock, name='reserve-stock'),
    path('inventory/low-stock/', low_stock_report, name='low-stock-report'),
    path('inventory/variant/<int:variant_id>/update/', update_variant_stock, name='update-variant-stock'),
]

# Test endpoints
test_patterns = [
    path('test/', test_speed, name='test-speed'),
    path('simple/<slug:slug>/', simple_product, name='simple-product'),
]

# Fast endpoints for product details
fast_patterns = [
    path('fast/<slug:slug>/', fast_product_detail, name='fast-product-detail'),
    path('minimal/<slug:slug>/', minimal_product_detail, name='minimal-product-detail'),
    path('minimal/', minimal_products_list, name='minimal-products-list'),
]

urlpatterns = inventory_patterns + test_patterns + fast_patterns + router.urls
