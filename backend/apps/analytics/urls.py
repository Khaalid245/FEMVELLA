from django.urls import path
from .views import (
    DashboardOverviewView,
    RevenueAnalyticsView,
    ProductAnalyticsView,
    CustomerAnalyticsView,
    ConversionAnalyticsView,
    AbandonedCartAnalyticsView,
    SearchAnalyticsView,
    TrackEventView,
    RealTimeMetricsView
)

app_name = 'analytics'

urlpatterns = [
    # Dashboard endpoints
    path('dashboard/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('revenue/', RevenueAnalyticsView.as_view(), name='revenue-analytics'),
    path('products/', ProductAnalyticsView.as_view(), name='product-analytics'),
    path('customers/', CustomerAnalyticsView.as_view(), name='customer-analytics'),
    path('conversion/', ConversionAnalyticsView.as_view(), name='conversion-analytics'),
    path('abandoned-carts/', AbandonedCartAnalyticsView.as_view(), name='abandoned-cart-analytics'),
    path('search/', SearchAnalyticsView.as_view(), name='search-analytics'),
    path('realtime/', RealTimeMetricsView.as_view(), name='realtime-metrics'),
    
    # Event tracking
    path('track/', TrackEventView.as_view(), name='track-event'),
]