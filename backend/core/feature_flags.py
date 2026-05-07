"""
Feature flag system for Femvelle.

Usage in views:
    from core.feature_flags import flag_enabled, require_flag

    if flag_enabled(request, 'ENABLE_NEW_CHECKOUT'):
        ...

    @require_flag('ENABLE_LOYALTY_PROGRAM')
    def loyalty_view(request):
        ...

Usage in templates / serializers:
    from core.feature_flags import get_all_flags
    flags = get_all_flags(request)

Flags are read from settings.FEATURE_FLAGS dict.
Individual flags can be overridden per-user via Redis:
    SET femvelle:ff:user:{user_id}:{flag_name} 1
"""

import functools
import logging

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse

logger = logging.getLogger(__name__)

# Default flags — always defined so code never KeyErrors
_DEFAULTS: dict[str, bool] = {
    "ENABLE_NEW_CHECKOUT": False,
    "ENABLE_RECOMMENDATIONS": True,
    "ENABLE_ANALYTICS_V2": False,
    "ENABLE_SEARCH_V2": True,
    "ENABLE_WISHLIST_SHARING": False,
    "ENABLE_LOYALTY_PROGRAM": False,
    "ENABLE_REVIEW_PHOTOS": True,
    "ENABLE_EXCHANGE_REQUESTS": True,
    "ENABLE_PARTIAL_REFUNDS": True,
}


def _settings_flags() -> dict[str, bool]:
    """Flags defined in Django settings (environment-level overrides)."""
    return getattr(settings, "FEATURE_FLAGS", {})


def flag_enabled(request, flag_name: str) -> bool:
    """
    Return True if the flag is enabled for this request.

    Resolution order (highest wins):
      1. Per-user Redis override  (staff can test unreleased features)
      2. settings.FEATURE_FLAGS   (environment-level)
      3. _DEFAULTS                (codebase default)
    """
    # 1. Per-user override (staff only)
    if request and hasattr(request, "user") and request.user.is_authenticated and request.user.is_staff:
        cache_key = f"femvelle:ff:user:{request.user.pk}:{flag_name}"
        user_override = cache.get(cache_key)
        if user_override is not None:
            return bool(user_override)

    # 2. Settings-level
    flags = _settings_flags()
    if flag_name in flags:
        return bool(flags[flag_name])

    # 3. Default
    return _DEFAULTS.get(flag_name, False)


def get_all_flags(request=None) -> dict[str, bool]:
    """Return all flags resolved for the current request context."""
    all_names = set(_DEFAULTS) | set(_settings_flags())
    return {name: flag_enabled(request, name) for name in sorted(all_names)}


def set_user_flag(user_id: int, flag_name: str, enabled: bool, ttl: int = 86400) -> None:
    """Set a per-user flag override in Redis (expires after ttl seconds)."""
    cache_key = f"femvelle:ff:user:{user_id}:{flag_name}"
    cache.set(cache_key, int(enabled), ttl)
    logger.info("Feature flag %s set to %s for user %s", flag_name, enabled, user_id)


def clear_user_flag(user_id: int, flag_name: str) -> None:
    """Remove a per-user flag override."""
    cache.delete(f"femvelle:ff:user:{user_id}:{flag_name}")


def require_flag(flag_name: str):
    """
    Decorator that returns 404 if the flag is disabled.

    @require_flag('ENABLE_LOYALTY_PROGRAM')
    def loyalty_view(request):
        ...
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not flag_enabled(request, flag_name):
                return JsonResponse(
                    {"detail": "This feature is not available."},
                    status=404,
                )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
