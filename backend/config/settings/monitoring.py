# Enterprise Performance Monitoring Configuration
from .base import MIDDLEWARE, env
from .logging import LOGGING

# Performance Monitoring Settings
PERFORMANCE_MONITORING = {
    'ENABLED': env.bool('PERFORMANCE_MONITORING_ENABLED', default=True),
    'TRACK_DATABASE_QUERIES': env.bool('TRACK_DATABASE_QUERIES', default=True),
    'TRACK_CACHE_OPERATIONS': env.bool('TRACK_CACHE_OPERATIONS', default=True),
    'TRACK_API_RESPONSES': env.bool('TRACK_API_RESPONSES', default=True),
    'SLOW_QUERY_THRESHOLD': env.float('SLOW_QUERY_THRESHOLD', default=0.5),  # seconds
    'SLOW_REQUEST_THRESHOLD': env.float('SLOW_REQUEST_THRESHOLD', default=2.0),  # seconds
    'MEMORY_THRESHOLD': env.int('MEMORY_THRESHOLD', default=100),  # MB
    'REQUEST_LOG_SAMPLE_RATE': env.float('REQUEST_LOG_SAMPLE_RATE', default=0.1),
    'REDACTED_QUERY_PARAMS': env.list(
        'REDACTED_QUERY_PARAMS',
        default=['token', 'access', 'refresh', 'password', 'secret', 'signature', 'email'],
    ),
    'EXCLUDED_PATH_PREFIXES': env.list(
        'PERFORMANCE_EXCLUDED_PATH_PREFIXES',
        default=['/static/', '/media/', '/__debug__/'],
    ),
}

# Database Query Monitoring
if PERFORMANCE_MONITORING['TRACK_DATABASE_QUERIES']:
    LOGGING['loggers']['django.db.backends'] = {
        'level': 'DEBUG' if env.bool("DEBUG", default=False) else 'WARNING',
        'handlers': ['file_performance'],
        'propagate': False,
    }

# APM Integration Settings
APM_SETTINGS = {
    'SERVICE_NAME': env('APM_SERVICE_NAME', default='femvelle-backend'),
    'ENVIRONMENT': env('APM_ENVIRONMENT', default='development'),
    'SERVER_URL': env('APM_SERVER_URL', default=''),
    'SECRET_TOKEN': env('APM_SECRET_TOKEN', default=''),
}

# New Relic Configuration (if using New Relic)
if env('NEW_RELIC_LICENSE_KEY', default=''):
    NEW_RELIC_CONFIG_FILE = env('NEW_RELIC_CONFIG_FILE', default='newrelic.ini')
    NEW_RELIC_ENVIRONMENT = env('NEW_RELIC_ENVIRONMENT', default='development')

# DataDog Configuration (if using DataDog)
DATADOG_SETTINGS = {
    'API_KEY': env('DATADOG_API_KEY', default=''),
    'APP_KEY': env('DATADOG_APP_KEY', default=''),
    'TRACE_ENABLED': env.bool('DATADOG_TRACE_ENABLED', default=False),
    'PROFILING_ENABLED': env.bool('DATADOG_PROFILING_ENABLED', default=False),
}

# Custom Metrics Collection
METRICS_COLLECTION = {
    'ENABLED': env.bool('METRICS_COLLECTION_ENABLED', default=True),
    'INTERVAL': env.int('METRICS_COLLECTION_INTERVAL', default=60),  # seconds
    'RETENTION_DAYS': env.int('METRICS_RETENTION_DAYS', default=30),
    'AGGREGATION_INTERVALS': ['1m', '5m', '1h', '1d'],  # minute, 5-minute, hourly, daily
}

# Health Check Configuration
HEALTH_CHECK_SETTINGS = {
    'ENABLED': env.bool('HEALTH_CHECK_ENABLED', default=True),
    'DATABASE_CHECK': env.bool('HEALTH_CHECK_DATABASE', default=True),
    'CACHE_CHECK': env.bool('HEALTH_CHECK_CACHE', default=True),
    'ELASTICSEARCH_CHECK': env.bool('HEALTH_CHECK_ELASTICSEARCH', default=True),
    'EXTERNAL_SERVICES_CHECK': env.bool('HEALTH_CHECK_EXTERNAL', default=True),
}

# Performance Alerts
PERFORMANCE_ALERTS = {
    'ENABLED': env.bool('PERFORMANCE_ALERTS_ENABLED', default=True),
    'EMAIL_RECIPIENTS': env.list('PERFORMANCE_ALERT_EMAILS', default=[]),
    'SLACK_WEBHOOK': env('PERFORMANCE_ALERT_SLACK_WEBHOOK', default=''),
    'ALERT_THRESHOLDS': {
        'response_time_p95': env.float('ALERT_RESPONSE_TIME_P95', default=5.0),  # seconds
        'error_rate': env.float('ALERT_ERROR_RATE', default=5.0),  # percentage
        'database_connections': env.int('ALERT_DB_CONNECTIONS', default=80),  # percentage
        'memory_usage': env.int('ALERT_MEMORY_USAGE', default=85),  # percentage
        'cpu_usage': env.int('ALERT_CPU_USAGE', default=80),  # percentage
    }
}

# Request/Response Monitoring Middleware
if PERFORMANCE_MONITORING['ENABLED']:
    MIDDLEWARE.insert(1, 'core.performance_middleware.PerformanceMonitoringMiddleware')

# Database Connection Monitoring
DATABASE_MONITORING = {
    'TRACK_CONNECTIONS': env.bool('DB_TRACK_CONNECTIONS', default=True),
    'CONNECTION_POOL_SIZE': env.int('DB_CONNECTION_POOL_SIZE', default=20),
    'MAX_OVERFLOW': env.int('DB_MAX_OVERFLOW', default=10),
    'POOL_TIMEOUT': env.int('DB_POOL_TIMEOUT', default=30),
    'POOL_RECYCLE': env.int('DB_POOL_RECYCLE', default=3600),
}
