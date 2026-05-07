# Enterprise Database Configuration
from .base import env

# Database Connection Pooling & Optimization
DATABASES = {
    "default": env.db("DATABASE_URL", default="mysql://femvelle:femvelle@mysql:3306/femvelle")
}

DATABASES["default"].update({
        'ENGINE': 'django.db.backends.mysql',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
            'use_unicode': True,
            # Connection pooling settings
            'autocommit': True,
            # Performance optimizations
            'connect_timeout': 60,
            'read_timeout': 30,
            'write_timeout': 30,
        },
        # Connection pooling
        'CONN_MAX_AGE': env.int('DB_CONN_MAX_AGE', default=300),  # 5 minutes
        'CONN_HEALTH_CHECKS': True,
        'ATOMIC_REQUESTS': True,
})

# Read Replica Configuration (for scaling)
if env.bool('USE_READ_REPLICA', default=False):
    DATABASES['replica'] = {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': env('MYSQL_DATABASE'),
        'USER': env('MYSQL_REPLICA_USER', default=env('MYSQL_USER')),
        'PASSWORD': env('MYSQL_REPLICA_PASSWORD', default=env('MYSQL_PASSWORD')),
        'HOST': env('DATABASE_REPLICA_HOST', default='mysql-replica'),
        'PORT': env('DATABASE_REPLICA_PORT', default='3306'),
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
            'use_unicode': True,
        },
        'CONN_MAX_AGE': env.int('DB_CONN_MAX_AGE', default=300),
        'CONN_HEALTH_CHECKS': True,
    }

# Database Router for Read/Write Splitting
DATABASE_ROUTERS = ['core.db_router.DatabaseRouter'] if env.bool('USE_READ_REPLICA', default=False) else []

# Query Optimization Settings
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Database Performance Settings
DATABASES['default']['TEST'] = {
    'CHARSET': 'utf8mb4',
    'COLLATION': 'utf8mb4_unicode_ci',
}

# Connection Pool Settings
DB_POOL_SETTINGS = {
    'MAX_CONNECTIONS': env.int('DB_MAX_CONNECTIONS', default=20),
    'MIN_CONNECTIONS': env.int('DB_MIN_CONNECTIONS', default=5),
    'CONNECTION_LIFETIME': env.int('DB_CONNECTION_LIFETIME', default=3600),  # 1 hour
}

# Query Logging (for development/debugging)
if env.bool('LOG_DATABASE_QUERIES', default=False):
    from .logging import LOGGING

    LOGGING['loggers']['django.db.backends'] = {
        'level': 'DEBUG',
        'handlers': ['file_performance'],
        'propagate': False,
    }
