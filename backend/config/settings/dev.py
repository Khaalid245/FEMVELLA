from .base import *  # noqa
from .security import *  # noqa
from .logging import *  # noqa

DEBUG = env.bool("DEBUG", default=True)

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

INSTALLED_APPS += ["debug_toolbar"]  # noqa
MIDDLEWARE.insert(1, "debug_toolbar.middleware.DebugToolbarMiddleware")  # noqa

INTERNAL_IPS = ["127.0.0.1"]
