"""
Staging settings — mirrors production exactly except:
  - Uses staging database / S3 bucket
  - Sentry environment = 'staging'
  - No SSL redirect (staging may run behind HTTP load balancer)
  - Lower Sentry traces_sample_rate (save quota)
  - Allows staging hostname
"""
from .prod import *  # noqa: F401, F403
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration

# ── Identity ──────────────────────────────────────────────────────────────────
ENVIRONMENT = "staging"

ALLOWED_HOSTS = env.list(
    "ALLOWED_HOSTS",
    default=["staging.femvelle.com", "api.staging.femvelle.com"],
)

# ── Database (separate staging DB) ───────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": env("DB_NAME", default="femvelle_staging"),
        "USER": env("DB_USER", default="femvelle"),
        "PASSWORD": env("DB_PASSWORD"),
        "HOST": env("DB_HOST", default="mysql"),
        "PORT": env("DB_PORT", default="3306"),
        "OPTIONS": {
            "charset": "utf8mb4",
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
        },
        "CONN_MAX_AGE": 60,
    }
}

# ── Storage (separate staging S3 bucket) ─────────────────────────────────────
AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME", default="femvelle-staging")
AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
STATIC_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/static/"
MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/media/"

# ── Security (relaxed for staging) ───────────────────────────────────────────
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0

CORS_ALLOWED_ORIGINS = [
    "https://staging.femvelle.com",
    "https://api.staging.femvelle.com",
    "http://localhost:5173",  # local dev against staging API
]

# ── Sentry (staging environment, lower sample rate) ──────────────────────────
sentry_sdk.init(
    dsn=env("SENTRY_DSN", default=""),
    integrations=[
        DjangoIntegration(transaction_style="url"),
        CeleryIntegration(),
        RedisIntegration(),
    ],
    traces_sample_rate=0.5,   # higher than prod for debugging
    send_default_pii=False,
    environment="staging",
    release=env("RELEASE_VERSION", default="staging"),
)

# ── Feature flags (staging can enable unreleased features) ───────────────────
FEATURE_FLAGS = {
    "ENABLE_NEW_CHECKOUT": env.bool("FF_NEW_CHECKOUT", default=True),
    "ENABLE_RECOMMENDATIONS": env.bool("FF_RECOMMENDATIONS", default=True),
    "ENABLE_ANALYTICS_V2": env.bool("FF_ANALYTICS_V2", default=True),
    "ENABLE_SEARCH_V2": env.bool("FF_SEARCH_V2", default=True),
    "ENABLE_WISHLIST_SHARING": env.bool("FF_WISHLIST_SHARING", default=False),
    "ENABLE_LOYALTY_PROGRAM": env.bool("FF_LOYALTY_PROGRAM", default=False),
}
