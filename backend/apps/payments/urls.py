from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, StripeWebhookView

router = DefaultRouter()
router.register("", PaymentViewSet, basename="payment")

urlpatterns = [
    # Webhook must be registered BEFORE the router urls so it is not
    # accidentally matched by the router's trailing-slash patterns.
    path("webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
] + router.urls
