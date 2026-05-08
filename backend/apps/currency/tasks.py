import logging
import requests
from celery import shared_task
from django.core.cache import cache

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def update_exchange_rates(self):
    """
    Fetch live rates from open.er-api.com (free, no key needed).
    Falls back silently — stale rates beat a crash.
    """
    from apps.currency.models import Currency
    from django.conf import settings

    api_key = getattr(settings, "EXCHANGE_RATE_API_KEY", "")
    url = (
        f"https://v6.exchangerate-api.com/v6/{api_key}/latest/USD"
        if api_key
        else "https://open.er-api.com/v6/latest/USD"
    )

    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        rates = resp.json().get("rates", resp.json().get("conversion_rates", {}))
        if not rates:
            raise ValueError("Empty rates payload")

        updated = []
        for currency in Currency.objects.filter(is_active=True, is_default=False):
            rate = rates.get(currency.code)
            if rate:
                Currency.objects.filter(pk=currency.pk).update(exchange_rate=rate)
                updated.append(currency.code)

        cache.delete("active_currencies")  # invalidate middleware cache
        logger.info("Exchange rates updated: %s", updated)
        return updated

    except Exception as exc:
        logger.warning("Exchange rate update failed (%s) — keeping existing rates", exc)
        raise self.retry(exc=exc)
