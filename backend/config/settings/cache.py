# Enterprise Redis Caching Configuration
from .base import env

# Redis Configuration
REDIS_URL = env('REDIS_URL', default='redis://redis:6379')
REDIS_BASE_URL = REDIS_URL.rsplit("/", 1)[0] if REDIS_URL.rsplit("/", 1)[-1].isdigit() else REDIS_URL

# Multiple Redis Instances for Different Purposes
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'{REDIS_BASE_URL}/0',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': env.int('REDIS_MAX_CONNECTIONS', default=50),
                'retry_on_timeout': True,
                'socket_keepalive': True,
                'socket_keepalive_options': {},
            },
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'IGNORE_EXCEPTIONS': True,
        },
        'KEY_PREFIX': env('CACHE_KEY_PREFIX', default='femvelle'),
        'TIMEOUT': env.int('CACHE_DEFAULT_TIMEOUT', default=300),  # 5 minutes
        'VERSION': 1,
    },
    
    # Session Cache (Database 1)
    'sessions': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'{REDIS_BASE_URL}/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 20,
                'retry_on_timeout': True,
            },
        },
        'KEY_PREFIX': 'session',
        'TIMEOUT': env.int('SESSION_CACHE_TIMEOUT', default=3600),  # 1 hour
    },
    
    # API Response Cache (Database 2)
    'api': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'{REDIS_BASE_URL}/2',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 30,
                'retry_on_timeout': True,
            },
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
        },
        'KEY_PREFIX': 'api',
        'TIMEOUT': env.int('API_CACHE_TIMEOUT', default=900),  # 15 minutes
    },
    
    # Query Cache (Database 3)
    'queries': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'{REDIS_BASE_URL}/3',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 25,
                'retry_on_timeout': True,
            },
        },
        'KEY_PREFIX': 'query',
        'TIMEOUT': env.int('QUERY_CACHE_TIMEOUT', default=600),  # 10 minutes
    },
    
    # Long-term Cache (Database 4)
    'longterm': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'{REDIS_BASE_URL}/4',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 15,
                'retry_on_timeout': True,
            },
        },
        'KEY_PREFIX': 'longterm',
        'TIMEOUT': env.int('LONGTERM_CACHE_TIMEOUT', default=86400),  # 24 hours
    },
}

# Session Configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'sessions'
SESSION_COOKIE_AGE = env.int('SESSION_COOKIE_AGE', default=3600)  # 1 hour
SESSION_SAVE_EVERY_REQUEST = True

# Cache Middleware Settings
CACHE_MIDDLEWARE_ALIAS = 'default'
CACHE_MIDDLEWARE_SECONDS = env.int('CACHE_MIDDLEWARE_SECONDS', default=300)  # 5 minutes
CACHE_MIDDLEWARE_KEY_PREFIX = env('CACHE_MIDDLEWARE_KEY_PREFIX', default='middleware')

# Cache Versioning
CACHE_VERSION = env.int('CACHE_VERSION', default=1)

# Cache Key Function
def make_cache_key(key, key_prefix, version):
    """Custom cache key function"""
    return f"{key_prefix}:{version}:{key}"

CACHES['default']['KEY_FUNCTION'] = 'config.settings.cache.make_cache_key'

# Cache Tags (for selective invalidation)
CACHE_TAGS = {
    'products': ['product', 'category', 'inventory'],
    'orders': ['order', 'cart', 'checkout'],
    'users': ['user', 'profile', 'auth'],
    'content': ['blog', 'pages', 'media'],
}

# Cache Timeouts by Model
CACHE_TIMEOUTS = {
    'products.Product': 3600,      # 1 hour
    'products.Category': 7200,     # 2 hours  
    'products.ProductImage': 3600, # 1 hour
    'blog.Post': 1800,            # 30 minutes
    'orders.Order': 300,          # 5 minutes
    'accounts.User': 900,         # 15 minutes
}

# Cache Invalidation Settings
CACHE_INVALIDATION = {
    'AUTO_INVALIDATE': env.bool('CACHE_AUTO_INVALIDATE', default=True),
    'INVALIDATE_ON_SAVE': env.bool('CACHE_INVALIDATE_ON_SAVE', default=True),
    'INVALIDATE_ON_DELETE': env.bool('CACHE_INVALIDATE_ON_DELETE', default=True),
}

# Redis Sentinel Configuration (for high availability)
if env.bool('USE_REDIS_SENTINEL', default=False):
    DJANGO_REDIS_CONNECTION_FACTORY = 'django_redis.pool.SentinelConnectionFactory'
    CACHES['default']['LOCATION'] = [
        (env('REDIS_SENTINEL_HOST_1', default='sentinel1'), env.int('REDIS_SENTINEL_PORT_1', default=26379)),
        (env('REDIS_SENTINEL_HOST_2', default='sentinel2'), env.int('REDIS_SENTINEL_PORT_2', default=26379)),
        (env('REDIS_SENTINEL_HOST_3', default='sentinel3'), env.int('REDIS_SENTINEL_PORT_3', default=26379)),
    ]
    CACHES['default']['OPTIONS']['SENTINEL_SERVICE_NAME'] = env('REDIS_SENTINEL_SERVICE', default='mymaster')

# Cache Monitoring
CACHE_MONITORING = {
    'ENABLE_STATS': env.bool('CACHE_ENABLE_STATS', default=True),
    'STATS_INTERVAL': env.int('CACHE_STATS_INTERVAL', default=60),  # 1 minute
    'LOG_CACHE_MISSES': env.bool('CACHE_LOG_MISSES', default=False),
}
