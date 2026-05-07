from .base import *  # noqa

DEBUG = env.bool("DEBUG", default=True)

from .security import *  # noqa
from .logging import *  # noqa
from .database import *  # noqa
from .cache import *  # noqa
from .search import *  # noqa
from .monitoring import *  # noqa

# Temporarily disable problematic middleware temporarily
if env.bool("DISABLE_REDIS_CACHE", default=False):
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "femvelle-default",
            "TIMEOUT": env.int("CACHE_DEFAULT_TIMEOUT", default=300),
        }
    }
    SESSION_ENGINE = "django.contrib.sessions.backends.db"
    # Disable rate limiting when using LocMemCache
    RATELIMIT_ENABLE = False
    # Disable performance monitoring middleware when Redis is disabled
    MIDDLEWARE = [m for m in MIDDLEWARE if 'PerformanceMonitoringMiddleware' not in m]
    # Remove problematic middleware temporarily
    MIDDLEWARE = [m for m in MIDDLEWARE if 'AuditMiddleware' not in m]
    MIDDLEWARE = [m for m in MIDDLEWARE if 'AxesMiddleware' not in m]
    MIDDLEWARE = [m for m in MIDDLEWARE if 'CSPMiddleware' not in m]
    # Remove django-ratelimit from installed apps
    INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'django_ratelimit']
    INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'axes']
    INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'csp']
    INSTALLED_APPS = [app for app in INSTALLED_APPS if 'audit' not in app]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

INSTALLED_APPS += ["debug_toolbar"]  # noqa
MIDDLEWARE.insert(1, "debug_toolbar.middleware.DebugToolbarMiddleware")  # noqa

INTERNAL_IPS = ["127.0.0.1"]
