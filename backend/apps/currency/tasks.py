import logging
import requests
from celery import shared_task
from django.core.cache import cache

logger = logging.getLogger(__name__)

RATES_CACHE_KEY = "live_exchange_rates"
RATES_CACHE_TTL = 60 * 60  # 1 hour


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def update_exchange_rates(self):
    """
    Fetch live exchange rates and update Currency table.
    Uses exchangerate-api.com free tier (1500 req/month).
    Falls back silently — stale rates are better than no rates.
    """
    from apps.currency.models import Currency
    from django.conf import settings

    api_key = getattr(settings, "EXCHANGE_RATE_API_KEY", "")
    base = "USD"

    try:
        if api_key:
            url = f"https://v6.exchangerate-api.com/v6/{api_key}/latest/{base}"
        else:
            # Free tier — no key required, limited accuracy
            url = f"https://open.er-api.com/v6/latest/{base}"

        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        rates = data.get("rates", data.get("conversion_rates", {}))

        if not rates:
            raise ValueError("Empty rates response")

        updated = []
        for currency in Currency.objects.filter(is_active=True, is_default=False):
            rate = rates.get(currency.code)
            if rate:
                Currency.objects.filter(pk=currency.pk).update(exchange_rate=rate)
                updated.append(currency.code)

        # Invalidate currency middleware cache
        cache.delete("active_currencies")

        logger.info("Exchange rates updated: %s", updated)
        return {"updated": updated}

    except Exception as exc:
        logger.warning("Exchange rate update failed: %s — keeping existing rates", exc)
        raise self.retry(exc=exc)
