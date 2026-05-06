# Enterprise Logging Configuration
import os
from .base import BASE_DIR

# Create logs directory
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'json': {
            'format': '{"level": "%(levelname)s", "time": "%(asctime)s", "module": "%(module)s", "process": %(process)d, "thread": %(thread)d, "message": "%(message)s"}',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'security': {
            'format': 'SECURITY {asctime} {levelname} {module} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'filters': ['require_debug_true'],
        },
        'file_general': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'django.log',
            'maxBytes': 1024*1024*15,  # 15MB
            'backupCount': 10,
            'formatter': 'json',
            'filters': ['require_debug_false'],
        },
        'file_security': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'security.log',
            'maxBytes': 1024*1024*15,  # 15MB
            'backupCount': 20,
            'formatter': 'security',
        },
        'file_audit': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'audit.log',
            'maxBytes': 1024*1024*15,  # 15MB
            'backupCount': 30,
            'formatter': 'json',
        },
        'file_performance': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'performance.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'json',
        },
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'filters': ['require_debug_false'],
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file_general'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['file_security', 'mail_admins'],
            'level': 'WARNING',
            'propagate': False,
        },
        'apps.audit': {
            'handlers': ['file_audit', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.orders': {
            'handlers': ['file_general', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.payments': {
            'handlers': ['file_general', 'file_security', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'performance': {
            'handlers': ['file_performance'],
            'level': 'INFO',
            'propagate': False,
        },
        'security': {
            'handlers': ['file_security', 'mail_admins'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console', 'file_general'],
        'level': 'INFO',
    },
}

# Additional security logging settings
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = 1  # 1 hour
AXES_LOCK_OUT_AT_FAILURE = True
AXES_ENABLE_ADMIN = True
AXES_VERBOSE = True

# Authentication backends
AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
]