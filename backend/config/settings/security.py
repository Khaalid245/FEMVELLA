# Enterprise Security Configuration
from .base import *  # noqa

# Security Headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'

# CSRF Protection
CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=True)
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[])

# Session Security
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=True)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_AGE = env.int('SESSION_COOKIE_AGE', default=3600)  # 1 hour

# Password Security
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': env.int('PASSWORD_MIN_LENGTH', default=12),
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Rate Limiting & Throttling
REST_FRAMEWORK.update({
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': env('THROTTLE_ANON', default='100/hour'),
        'user': env('THROTTLE_USER', default='1000/hour'),
        'login': env('THROTTLE_LOGIN', default='5/min'),
        'register': env('THROTTLE_REGISTER', default='3/min'),
        'password_reset': env('THROTTLE_PASSWORD_RESET', default='3/hour'),
        'search': env('THROTTLE_SEARCH', default='120/min'),
        'search_click': env('THROTTLE_SEARCH_CLICK', default='30/min'),
    }
})

# Content Security Policy
CSP_ALLOW_UNSAFE_INLINE = env.bool('CSP_ALLOW_UNSAFE_INLINE', default=False)
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "https://js.stripe.com")
CSP_STYLE_SRC = ("'self'", "https://fonts.googleapis.com")
if CSP_ALLOW_UNSAFE_INLINE:
    CSP_SCRIPT_SRC += ("'unsafe-inline'",)
    CSP_STYLE_SRC += ("'unsafe-inline'",)
CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_CONNECT_SRC = ("'self'", "https://api.stripe.com")
CSP_FRAME_SRC = ("'self'", "https://js.stripe.com", "https://hooks.stripe.com")

# File Upload Security
FILE_UPLOAD_MAX_MEMORY_SIZE = env.int('FILE_UPLOAD_MAX_MEMORY_SIZE', default=5242880)  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = env.int('DATA_UPLOAD_MAX_MEMORY_SIZE', default=5242880)  # 5MB
FILE_UPLOAD_PERMISSIONS = 0o644
ALLOWED_IMAGE_EXTENSIONS = env.list('ALLOWED_IMAGE_EXTENSIONS', default=['jpg', 'jpeg', 'png', 'webp', 'gif'])
MAX_IMAGE_SIZE = env.int('MAX_IMAGE_SIZE', default=10485760)  # 10MB
MAX_PRODUCT_IMAGE_COUNT = env.int('MAX_PRODUCT_IMAGE_COUNT', default=5)

# API Security
CORS_ALLOW_CREDENTIALS = True
# Do NOT re-read CORS_ALLOWED_ORIGINS here — base.py already loaded it from .env.
# Overwriting it here with a fresh env.list() call loses the value in dev.
CORS_ALLOW_ALL_ORIGINS = False

# JWT Security
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=env.int('JWT_ACCESS_TOKEN_LIFETIME', default=60)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=env.int('JWT_REFRESH_TOKEN_LIFETIME', default=7)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
