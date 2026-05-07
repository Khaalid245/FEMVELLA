"""
Enterprise Caching Utilities
============================

Provides caching decorators, utilities, and cache management functions
for high-performance Django applications.
"""

import hashlib
import json
from functools import wraps
from django.core.cache import caches, cache
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
import logging

logger = logging.getLogger(__name__)


def cache_key_generator(prefix, *args, **kwargs):
    """
    Generate a consistent cache key from arguments
    """
    key_parts = [prefix]
    
    # Add positional arguments
    for arg in args:
        if hasattr(arg, 'pk'):
            key_parts.append(f"{arg.__class__.__name__}_{arg.pk}")
        else:
            key_parts.append(str(arg))
    
    # Add keyword arguments
    for key, value in sorted(kwargs.items()):
        key_parts.append(f"{key}_{value}")
    
    # Create hash for long keys
    key_string = ":".join(key_parts)
    if len(key_string) > 200:  # Redis key limit
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"{prefix}:{key_hash}"
    
    return key_string


def cached_function(timeout=300, cache_alias='default', key_prefix=None):
    """
    Decorator to cache function results
    
    Usage:
        @cached_function(timeout=600, key_prefix='products')
        def get_featured_products():
            return Product.objects.filter(is_featured=True)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            prefix = key_prefix or f"func_{func.__name__}"
            cache_key = cache_key_generator(prefix, *args, **kwargs)
            
            # Try to get from cache
            cache_instance = caches[cache_alias]
            result = cache_instance.get(cache_key)
            
            if result is None:
                # Execute function and cache result
                result = func(*args, **kwargs)
                cache_instance.set(cache_key, result, timeout)
                logger.debug(f"Cache MISS: {cache_key}")
            else:
                logger.debug(f"Cache HIT: {cache_key}")
            
            return result
        return wrapper
    return decorator


def cached_method(timeout=300, cache_alias='default', key_prefix=None):
    """
    Decorator to cache method results (includes self in key)
    
    Usage:
        class ProductService:
            @cached_method(timeout=600, key_prefix='product_service')
            def get_product_stats(self, product_id):
                return expensive_calculation(product_id)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # Generate cache key including class name
            class_name = self.__class__.__name__
            prefix = key_prefix or f"method_{class_name}_{func.__name__}"
            cache_key = cache_key_generator(prefix, *args, **kwargs)
            
            # Try to get from cache
            cache_instance = caches[cache_alias]
            result = cache_instance.get(cache_key)
            
            if result is None:
                # Execute method and cache result
                result = func(self, *args, **kwargs)
                cache_instance.set(cache_key, result, timeout)
                logger.debug(f"Cache MISS: {cache_key}")
            else:
                logger.debug(f"Cache HIT: {cache_key}")
            
            return result
        return wrapper
    return decorator


def cache_model_instance(instance, timeout=None, cache_alias='default'):
    """
    Cache a model instance
    
    Usage:
        product = Product.objects.get(pk=1)
        cache_model_instance(product, timeout=3600)
    """
    if not timeout:
        model_name = f"{instance._meta.app_label}.{instance._meta.model_name}"
        timeout = getattr(settings, 'CACHE_TIMEOUTS', {}).get(model_name, 300)
    
    cache_key = f"model_{instance._meta.label_lower}_{instance.pk}"
    caches[cache_alias].set(cache_key, instance, timeout)


def get_cached_model_instance(model_class, pk, cache_alias='default'):
    """
    Get a cached model instance
    
    Usage:
        product = get_cached_model_instance(Product, 1)
        if not product:
            product = Product.objects.get(pk=1)
            cache_model_instance(product)
    """
    cache_key = f"model_{model_class._meta.label_lower}_{pk}"
    return caches[cache_alias].get(cache_key)


def invalidate_model_cache(instance, cache_alias='default'):
    """
    Invalidate cache for a model instance
    
    Usage:
        invalidate_model_cache(product)
    """
    cache_key = f"model_{instance._meta.label_lower}_{instance.pk}"
    caches[cache_alias].delete(cache_key)
    
    # Also invalidate related caches
    model_name = f"{instance._meta.app_label}.{instance._meta.model_name}"
    cache_tags = getattr(settings, 'CACHE_TAGS', {})
    
    for tag_group, tags in cache_tags.items():
        if instance._meta.model_name.lower() in [tag.lower() for tag in tags]:
            invalidate_cache_by_tag(tag_group, cache_alias)


def invalidate_cache_by_tag(tag, cache_alias='default'):
    """
    Invalidate all cache entries with a specific tag
    
    Usage:
        invalidate_cache_by_tag('products')
    """
    cache_instance = caches[cache_alias]
    
    # Get all keys with this tag
    pattern = f"*{tag}*"
    try:
        # This requires django-redis
        cache_instance.delete_pattern(pattern)
        logger.info(f"Invalidated cache tag: {tag}")
    except AttributeError:
        logger.warning(f"Cache backend doesn't support pattern deletion for tag: {tag}")


def cache_api_response(timeout=900, cache_alias='api', vary_on=None):
    """
    Decorator for caching API responses
    
    Usage:
        @cache_api_response(timeout=600, vary_on=['user'])
        def product_list_view(request):
            return JsonResponse(data)
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Generate cache key based on request
            key_parts = [
                request.path,
                request.method,
                str(sorted(request.GET.items())),
            ]
            
            # Add vary_on parameters
            if vary_on:
                for param in vary_on:
                    if param == 'user' and hasattr(request, 'user'):
                        key_parts.append(f"user_{request.user.pk if request.user.is_authenticated else 'anon'}")
                    elif hasattr(request, param):
                        key_parts.append(f"{param}_{getattr(request, param)}")
            
            cache_key = cache_key_generator('api_response', *key_parts)
            
            # Try to get from cache
            cache_instance = caches[cache_alias]
            response_data = cache_instance.get(cache_key)
            
            if response_data is None:
                # Execute view and cache response
                response = view_func(request, *args, **kwargs)
                
                # Only cache successful responses
                if hasattr(response, 'status_code') and 200 <= response.status_code < 300:
                    cache_instance.set(cache_key, {
                        'content': response.content.decode('utf-8'),
                        'status_code': response.status_code,
                        'headers': dict(response.items()),
                    }, timeout)
                
                return response
            else:
                # Return cached response
                from django.http import HttpResponse
                response = HttpResponse(
                    response_data['content'],
                    status=response_data['status_code']
                )
                for key, value in response_data['headers'].items():
                    response[key] = value
                
                return response
        
        return wrapper
    return decorator


class CacheManager:
    """
    Centralized cache management
    """
    
    @staticmethod
    def warm_cache():
        """
        Warm up frequently accessed cache entries
        """
        from apps.products.models import Product, Category
        
        logger.info("Starting cache warm-up...")
        
        # Cache featured products
        featured_products = Product.objects.filter(is_featured=True)[:10]
        for product in featured_products:
            cache_model_instance(product, timeout=3600)
        
        # Cache categories
        categories = Category.objects.all()[:20]
        for category in categories:
            cache_model_instance(category, timeout=7200)
        
        logger.info("Cache warm-up completed")
    
    @staticmethod
    def clear_all_caches():
        """
        Clear all cache instances
        """
        for alias in settings.CACHES.keys():
            caches[alias].clear()
        logger.info("All caches cleared")
    
    @staticmethod
    def get_cache_stats():
        """
        Get cache statistics
        """
        stats = {}
        for alias in settings.CACHES.keys():
            try:
                cache_instance = caches[alias]
                if hasattr(cache_instance, 'get_stats'):
                    stats[alias] = cache_instance.get_stats()
                else:
                    stats[alias] = {'status': 'available'}
            except Exception as e:
                stats[alias] = {'error': str(e)}
        
        return stats


# Cache warming management command helper
def warm_product_cache():
    """Warm product-related caches"""
    from apps.products.models import Product
    
    # Cache bestsellers
    bestsellers = Product.objects.filter(is_bestseller=True)[:20]
    cache.set('bestsellers', list(bestsellers.values()), timeout=3600)
    
    # Cache new arrivals
    new_arrivals = Product.objects.filter(is_new=True)[:20]
    cache.set('new_arrivals', list(new_arrivals.values()), timeout=3600)
    
    logger.info("Product cache warmed up")