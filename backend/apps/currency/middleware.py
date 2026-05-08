from django.core.cache import cache
from .models import Currency

CACHE_KEY = "active_currencies"
CACHE_TTL = 60 * 60  # 1 hour


def get_currencies():
    currencies = cache.get(CACHE_KEY)
    if currencies is None:
        currencies = {c.code: c for c in Currency.objects.filter(is_active=True)}
        cache.set(CACHE_KEY, currencies, CACHE_TTL)
    return currencies


def get_default_currency():
    currencies = get_currencies()
    for c in currencies.values():
        if c.is_default:
            return c
    # Fallback: first active currency
    return next(iter(currencies.values()), None)


class CurrencyMiddleware:
    """
    Attaches `request.currency` (a Currency instance) based on:
    1. `Accept-Currency` request header
    2. `currency` cookie
    3. Default currency
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        currencies = get_currencies()
        code = (
            request.headers.get("Accept-Currency")
            or request.COOKIES.get("currency")
        )
        request.currency = currencies.get(code) if code else None
        if request.currency is None:
            request.currency = get_default_currency()

        response = self.get_response(request)

        # Echo back the active currency in response header
        if request.currency:
            response["X-Currency"] = request.currency.code
        return response
