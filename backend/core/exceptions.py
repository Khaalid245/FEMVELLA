from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


class _SafeThrottleMixin:
    """Silently disables itself when no rate is configured for its scope."""
    def get_rate(self):
        try:
            return super().get_rate()
        except Exception:
            return None

    def allow_request(self, request, view):
        if self.rate is None:
            return True
        return super().allow_request(request, view)


class AuthRateThrottle(_SafeThrottleMixin, AnonRateThrottle):
    scope = "auth"


class PaymentRateThrottle(_SafeThrottleMixin, UserRateThrottle):
    scope = "payment"


class SearchRateThrottle(_SafeThrottleMixin, AnonRateThrottle):
    scope = "search"


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        # Normalise all DRF errors to {error, detail, code}
        error_data = {
            "error": True,
            "status_code": response.status_code,
            "detail": response.data,
        }
        # Log 5xx server errors
        if response.status_code >= 500:
            logger.error(
                "Server error: %s %s — %s",
                context["request"].method,
                context["request"].path,
                response.data,
            )
        response.data = error_data

    return response
