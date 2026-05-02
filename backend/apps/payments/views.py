import logging

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import Payment
from .serializers import CreatePaymentIntentSerializer
from .services import get_or_create_payment_intent, handle_webhook

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/payments/        — list user's payments
    GET /api/payments/{id}/   — retrieve a payment
    POST /api/payments/create-intent/ — create or retrieve PaymentIntent
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        if self.request.user.is_staff:
            return Payment.objects.select_related("order").all()
        return Payment.objects.select_related("order").filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "create_intent":
            return CreatePaymentIntentSerializer
        from rest_framework import serializers

        class _Out(serializers.ModelSerializer):
            class Meta:
                model = Payment
                fields = ("id", "order", "amount", "status", "provider",
                          "stripe_payment_intent_id", "created_at")
        return _Out

    @action(methods=["post"], detail=False, url_path="create-intent")
    def create_intent(self, request):
        """
        POST /api/payments/create-intent/
        Body: { "order_id": 42 }
        Response: { "client_secret": "pi_xxx_secret_yyy" }
        """
        serializer = CreatePaymentIntentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        client_secret = get_or_create_payment_intent(
            user=request.user,
            order_id=serializer.validated_data["order_id"],
        )

        return Response({"client_secret": client_secret}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    """
    POST /api/payments/webhook/

    Stripe sends signed POST requests here. CSRF must be exempt because
    Stripe cannot send a CSRF token. Security is provided entirely by
    Stripe signature verification inside handle_webhook().

    Authentication is intentionally disabled — this endpoint is called
    by Stripe's servers, not by authenticated users.
    """
    authentication_classes = ()
    permission_classes = ()

    def post(self, request):
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
        payload = request.body  # raw bytes — must not be parsed before this

        try:
            handle_webhook(payload, sig_header)
        except ValueError:
            # Invalid signature — reject immediately
            return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception("Unexpected error processing Stripe webhook")
            # Return 500 so Stripe retries the event
            return Response(
                {"error": "Internal error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Stripe requires a 2xx response to acknowledge receipt
        return Response({"status": "ok"}, status=status.HTTP_200_OK)
