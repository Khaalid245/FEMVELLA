from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from config.token import EmailTokenObtainPairView
from django.contrib import admin
from core.health import health_check

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("admin/", admin.site.urls),
    path("api/auth/token/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/products/", include("apps.products.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/blog/", include("apps.blog.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/contact/", include("apps.contact.urls")),
    path("api/shipping/", include("apps.shipping.urls")),
    path("api/wishlist/", include("apps.wishlist.urls")),
    path("api/reviews/", include("apps.reviews.urls")),
    path("api/search/", include("apps.search.urls")),
    # Feature flags
    path("api/feature-flags/", include("core.feature_flag_urls")),
    # CMS
    path("api/cms/", include("apps.cms.urls")),
    # Currency
    path("api/currency/", include("apps.currency.urls")),
    # SEO URLs (at root level)
    path("", include("apps.seo.urls")),
    # path("api/audit/", include("apps.audit.urls")),  # Temporarily disabled
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
