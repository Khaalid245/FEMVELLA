from .base import *  # noqa

DEBUG = env.bool("DEBUG", default=True)

from .security import *  # noqa
from .logging import *  # noqa
from .database import *  # noqa
from .cache import *  # noqa
from .search import *  # noqa
from .monitoring import *  # noqa

# ---------------------------------------------------------------------------
# Celery — run tasks synchronously in dev (no Redis/worker needed)
# ---------------------------------------------------------------------------
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = False  # don't crash the request on task errors

# ---------------------------------------------------------------------------
# Throttling — disabled in development so parallel page loads don't 429
# Production throttle rates are defined in base.py
# ---------------------------------------------------------------------------
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {}

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
    RATELIMIT_ENABLE = False
    MIDDLEWARE = [m for m in MIDDLEWARE if 'PerformanceMonitoringMiddleware' not in m]
    MIDDLEWARE = [m for m in MIDDLEWARE if 'AuditMiddleware' not in m]
    MIDDLEWARE = [m for m in MIDDLEWARE if 'AxesMiddleware' not in m]
    MIDDLEWARE = [m for m in MIDDLEWARE if 'CSPMiddleware' not in m]
    INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'django_ratelimit']
    INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'axes']
    INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'csp']
    INSTALLED_APPS = [app for app in INSTALLED_APPS if 'audit' not in app]
    # Remove axes auth backend — axes is not in INSTALLED_APPS so its models
    # cannot be imported; keeping the backend causes a RuntimeError on login.
    AUTHENTICATION_BACKENDS = ['django.contrib.auth.backends.ModelBackend']

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

INSTALLED_APPS += ["debug_toolbar"]  # noqa
MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")  # noqa

INTERNAL_IPS = ["127.0.0.1"]
