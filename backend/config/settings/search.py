# Search Configuration
from .base import env

SEARCH_BACKEND = env("SEARCH_BACKEND", default="database")

# Elasticsearch Settings
ELASTICSEARCH_DSL = {
    'default': {
        'hosts': env('ELASTICSEARCH_URL', default='http://elasticsearch:9200'),
        'timeout': env.int('ELASTICSEARCH_TIMEOUT', default=30),
        'max_retries': env.int('ELASTICSEARCH_MAX_RETRIES', default=3),
        'retry_on_timeout': True,
        'http_auth': (
            env('ELASTICSEARCH_USERNAME', default=''),
            env('ELASTICSEARCH_PASSWORD', default='')
        ) if env('ELASTICSEARCH_USERNAME', default='') else None,
        'use_ssl': env.bool('ELASTICSEARCH_USE_SSL', default=False),
        'verify_certs': env.bool('ELASTICSEARCH_VERIFY_CERTS', default=False),
        'ca_certs': env('ELASTICSEARCH_CA_CERTS', default=''),
        'client_cert': env('ELASTICSEARCH_CLIENT_CERT', default=''),
        'client_key': env('ELASTICSEARCH_CLIENT_KEY', default=''),
    }
}

# Search Configuration
SEARCH_SETTINGS = {
    'INDEX_PREFIX': env('SEARCH_INDEX_PREFIX', default='femvelle'),
    'AUTO_SYNC': env.bool('SEARCH_AUTO_SYNC', default=True),
    'BATCH_SIZE': env.int('SEARCH_BATCH_SIZE', default=100),
    'MAX_RESULTS': env.int('SEARCH_MAX_RESULTS', default=1000),
    'DEFAULT_PAGE_SIZE': env.int('SEARCH_DEFAULT_PAGE_SIZE', default=20),
    'HIGHLIGHT_ENABLED': env.bool('SEARCH_HIGHLIGHT_ENABLED', default=True),
    'FUZZY_SEARCH': env.bool('SEARCH_FUZZY_ENABLED', default=True),
    'AUTOCOMPLETE_ENABLED': env.bool('SEARCH_AUTOCOMPLETE_ENABLED', default=True),
}

# Search Analytics
SEARCH_ANALYTICS = {
    'TRACK_SEARCHES': env.bool('SEARCH_TRACK_SEARCHES', default=True),
    'TRACK_CLICKS': env.bool('SEARCH_TRACK_CLICKS', default=True),
    'TRACK_CONVERSIONS': env.bool('SEARCH_TRACK_CONVERSIONS', default=True),
}

# Language Settings for Search
SEARCH_LANGUAGES = {
    'default': 'english',
    'supported': ['english', 'arabic'],  # Add more as needed
    'analyzers': {
        'english': 'standard',
        'arabic': 'arabic',
    }
}

# Search Boost Settings
SEARCH_BOOST_SETTINGS = {
    'name': 3.0,           # Product name gets highest boost
    'description': 1.0,    # Description gets normal boost
    'category': 2.0,       # Category gets high boost
    'tags': 1.5,          # Tags get medium boost
    'brand': 2.5,         # Brand gets high boost
}

# Facet Configuration
SEARCH_FACETS = {
    'category': {
        'field': 'category.name.keyword',
        'size': 20,
    },
    'price_range': {
        'field': 'price',
        'ranges': [
            {'to': 50, 'key': 'under_50'},
            {'from': 50, 'to': 100, 'key': '50_to_100'},
            {'from': 100, 'to': 200, 'key': '100_to_200'},
            {'from': 200, 'key': 'over_200'},
        ]
    },
    'brand': {
        'field': 'brand.keyword',
        'size': 15,
    },
    'availability': {
        'field': 'in_stock',
        'size': 2,
    },
    'rating': {
        'field': 'average_rating',
        'ranges': [
            {'from': 4, 'key': '4_stars_up'},
            {'from': 3, 'to': 4, 'key': '3_to_4_stars'},
            {'to': 3, 'key': 'under_3_stars'},
        ]
    }
}

# Search Suggestions
SEARCH_SUGGESTIONS = {
    'ENABLED': env.bool('SEARCH_SUGGESTIONS_ENABLED', default=True),
    'MIN_QUERY_LENGTH': env.int('SEARCH_MIN_QUERY_LENGTH', default=2),
    'MAX_SUGGESTIONS': env.int('SEARCH_MAX_SUGGESTIONS', default=10),
    'INCLUDE_CATEGORIES': env.bool('SEARCH_SUGGEST_CATEGORIES', default=True),
    'INCLUDE_BRANDS': env.bool('SEARCH_SUGGEST_BRANDS', default=True),
}
