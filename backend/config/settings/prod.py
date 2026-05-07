from .base import *  # noqa

DEBUG = env.bool("DEBUG", default=False)

from .security import *  # noqa
from .logging import *  # noqa
from .database import *  # noqa
from .cache import *  # noqa
from .search import *  # noqa
from .monitoring import *  # noqa
import sentry_sdk

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        "OPTIONS": {
            "bucket_name": env("AWS_STORAGE_BUCKET_NAME"),  # noqa
            "region_name": env("AWS_S3_REGION_NAME"),  # noqa
            "custom_domain": env("AWS_S3_CUSTOM_DOMAIN", default=None),  # noqa
        },
    },
    "staticfiles": {
        "BACKEND": "storages.backends.s3boto3.S3StaticStorage",
        "OPTIONS": {
            "bucket_name": env("AWS_STORAGE_BUCKET_NAME"),  # noqa
            "region_name": env("AWS_S3_REGION_NAME"),  # noqa
        },
    },
}

sentry_sdk.init(dsn=env("SENTRY_DSN", default=""), traces_sample_rate=0.2)  # noqa

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST")  # noqa
EMAIL_PORT = env.int("EMAIL_PORT", default=587)  # noqa
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env("EMAIL_HOST_USER")  # noqa
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")  # noqa
