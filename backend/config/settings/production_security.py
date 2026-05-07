# Production Security Settings for Femvelle
# This file contains additional security configurations for production deployment

from .base import *

# Override security settings for production
DEBUG = False

# Security Headers (Enhanced)
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Session Security (Enhanced)
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_AGE = 1800  # 30 minutes for production
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_SAVE_EVERY_REQUEST = True

# CSRF Protection (Enhanced)
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'
CSRF_USE_SESSIONS = True
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[])

# Database Security
DATABASES['default']['OPTIONS'] = {
    'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
    'charset': 'utf8mb4',
    'use_unicode': True,
}

# File Upload Security (Stricter)
FILE_UPLOAD_MAX_MEMORY_SIZE = 2 * 1024 * 1024  # 2MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 100

# Rate Limiting (Production)
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'

# Content Security Policy (Strict)
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "https://js.stripe.com", "https://checkout.stripe.com")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com")
CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")
CSP_IMG_SRC = ("'self'", "data:", "https:", "blob:")
CSP_CONNECT_SRC = ("'self'", "https://api.stripe.com")
CSP_FRAME_SRC = ("https://js.stripe.com", "https://hooks.stripe.com")
CSP_OBJECT_SRC = ("'none'",)
CSP_BASE_URI = ("'self'",)
CSP_FORM_ACTION = ("'self'",)
CSP_FRAME_ANCESTORS = ("'none'",)

# Logging (Production)
LOGGING['handlers']['file']['level'] = 'WARNING'
LOGGING['handlers']['security_file']['level'] = 'INFO'
LOGGING['loggers']['django']['level'] = 'WARNING'
LOGGING['loggers']['security']['level'] = 'INFO'

# Remove console logging in production
if 'console' in LOGGING['handlers']:
    del LOGGING['handlers']['console']
    for logger in LOGGING['loggers'].values():
        if 'console' in logger.get('handlers', []):
            logger['handlers'].remove('console')

# Admin Security
ADMIN_URL = env('ADMIN_URL', default='admin/')  # Use custom admin URL
ADMIN_FORCE_ALLAUTH = True

# API Security
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = [
    'rest_framework.throttling.AnonRateThrottle',
    'rest_framework.throttling.UserRateThrottle'
]
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '100/hour',
    'user': '1000/hour'
}

# Email Security
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False  # Use TLS instead of SSL

# Cache Security
CACHES['default']['OPTIONS']['CONNECTION_POOL_KWARGS'] = {
    'max_connections': 50,
    'retry_on_timeout': True,
}

# Celery Security
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = False
CELERY_WORKER_HIJACK_ROOT_LOGGER = False
CELERY_WORKER_LOG_COLOR = False

# Additional Security Middleware for Production
MIDDLEWARE.insert(0, 'django.middleware.cache.UpdateCacheMiddleware')
MIDDLEWARE.append('django.middleware.cache.FetchFromCacheMiddleware')

# Security Monitoring
SECURITY_MONITORING_ENABLED = True
SECURITY_ALERT_EMAIL = env.list('SECURITY_ALERT_EMAIL', default=['security@femvelle.com'])

# Backup and Recovery
BACKUP_ENABLED = True
BACKUP_RETENTION_DAYS = 30

# Performance Security
USE_ETAGS = True
USE_L10N = True
USE_TZ = True

# Static Files Security
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media Files Security
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Ensure media files are served securely
SECURE_MEDIA_URL = env('SECURE_MEDIA_URL', default='/media/')

# Database Connection Security
CONN_MAX_AGE = 60  # Connection pooling