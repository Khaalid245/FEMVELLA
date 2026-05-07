import time
import logging
from django.db import connection
from django.conf import settings

logger = logging.getLogger('performance')

class PerformanceMonitoringMiddleware:
    """Monitor request performance and log slow requests"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.slow_request_threshold = getattr(settings, 'SLOW_REQUEST_THRESHOLD', 1.0)  # 1 second
        
    def __call__(self, request):
        start_time = time.time()
        initial_queries = len(connection.queries)
        
        response = self.get_response(request)
        
        end_time = time.time()
        duration = end_time - start_time
        query_count = len(connection.queries) - initial_queries
        
        # Log slow requests
        if duration > self.slow_request_threshold:
            logger.warning(
                f"Slow request detected: {request.method} {request.path} "
                f"took {duration:.2f}s with {query_count} queries",
                extra={
                    'method': request.method,
                    'path': request.path,
                    'duration': duration,
                    'query_count': query_count,
                    'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None
                }
            )
        
        # Add performance headers in debug mode
        if settings.DEBUG:
            response['X-Response-Time'] = f"{duration:.3f}s"
            response['X-Query-Count'] = str(query_count)
            
        return response