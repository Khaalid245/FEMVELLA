"""
Performance Monitoring Middleware
================================

Tracks request/response performance, database queries, and system metrics
for enterprise-level monitoring and optimization.
"""

import time
import logging
import random
from urllib import request as urlrequest
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from django.db import connection
from django.core.cache import cache
import json

logger = logging.getLogger('performance')


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """
    Comprehensive performance monitoring middleware
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        monitoring = getattr(settings, 'PERFORMANCE_MONITORING', {})
        self.monitoring_enabled = monitoring.get('ENABLED', True)
        self.track_api_responses = monitoring.get('TRACK_API_RESPONSES', True)
        self.slow_request_threshold = monitoring.get('SLOW_REQUEST_THRESHOLD', 2.0)
        self.request_log_sample_rate = max(0.0, min(float(monitoring.get('REQUEST_LOG_SAMPLE_RATE', 0.1)), 1.0))
        self.redacted_query_params = {key.lower() for key in monitoring.get('REDACTED_QUERY_PARAMS', [])}
        self.excluded_path_prefixes = tuple(monitoring.get('EXCLUDED_PATH_PREFIXES', []))
        super().__init__(get_response)

    def process_request(self, request):
        """Start performance tracking"""
        if not self.monitoring_enabled:
            return
        if request.path.startswith(self.excluded_path_prefixes):
            return
        
        # Record start time
        request._performance_start_time = time.time()
        request._performance_start_queries = len(connection.queries)
        
        # Get system metrics at request start
        request._performance_start_memory = self._get_memory_usage()
        request._performance_start_cpu = self._get_cpu_usage()

    def process_response(self, request, response):
        """End performance tracking and log metrics"""
        if not self.monitoring_enabled or not hasattr(request, '_performance_start_time'):
            return response
        
        # Calculate metrics
        end_time = time.time()
        response_time = end_time - request._performance_start_time
        
        # Database metrics
        end_queries = len(connection.queries)
        query_count = end_queries - request._performance_start_queries
        query_time = sum(float(q['time']) for q in connection.queries[request._performance_start_queries:])
        
        # System metrics
        end_memory = self._get_memory_usage()
        end_cpu = self._get_cpu_usage()
        memory_delta = end_memory - request._performance_start_memory
        
        # Request details
        request_data = {
            'method': request.method,
            'path': request.path,
            'query_params': self._redact_query_params(request.GET),
            'user_id': request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None,
            'ip_address': self._get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:200],
        }
        
        # Response details
        response_data = {
            'status_code': response.status_code,
            'content_length': len(response.content) if hasattr(response, 'content') else 0,
        }
        
        # Performance metrics
        performance_data = {
            'response_time': response_time,
            'query_count': query_count,
            'query_time': query_time,
            'memory_usage': end_memory,
            'memory_delta': memory_delta,
            'cpu_usage': end_cpu,
        }
        
        # Log performance data
        is_slow_request = response_time > self.slow_request_threshold
        should_persist = self.track_api_responses and (
            is_slow_request or random.random() < self.request_log_sample_rate
        )
        self._log_performance_data(request_data, response_data, performance_data, persist=should_persist)
        
        # Check for slow requests
        if is_slow_request:
            self._handle_slow_request(request_data, performance_data)
        
        # Add performance headers (for debugging)
        if settings.DEBUG:
            response['X-Response-Time'] = f"{response_time:.3f}s"
            response['X-Query-Count'] = str(query_count)
            response['X-Query-Time'] = f"{query_time:.3f}s"
        
        return response

    def _get_memory_usage(self):
        """Get current memory usage in MB"""
        try:
            import psutil

            process = psutil.Process()
            return process.memory_info().rss / 1024 / 1024  # Convert to MB
        except Exception:
            return 0

    def _get_cpu_usage(self):
        """Get current CPU usage percentage"""
        try:
            import psutil

            return psutil.cpu_percent(interval=None)
        except Exception:
            return 0

    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip

    def _redact_query_params(self, query_params):
        """Return query params with sensitive values removed."""
        redacted = {}
        for key, values in query_params.lists():
            if key.lower() in self.redacted_query_params:
                redacted[key] = ["[REDACTED]"] * len(values)
            else:
                redacted[key] = values
        return redacted

    def _log_performance_data(self, request_data, response_data, performance_data, persist=False):
        """Log performance data to database and logs"""
        
        if persist:
            try:
                from apps.analytics.models import RequestLog

                RequestLog.objects.create(
                    method=request_data['method'],
                    path=request_data['path'],
                    status_code=response_data['status_code'],
                    response_time=performance_data['response_time'],
                    query_count=performance_data['query_count'],
                    query_time=performance_data['query_time'],
                    memory_usage=performance_data['memory_usage'],
                    user_id=request_data['user_id'],
                    ip_address=request_data['ip_address'],
                    metadata={
                        'query_params': request_data['query_params'],
                        'user_agent': request_data['user_agent'],
                        'content_length': response_data['content_length'],
                        'memory_delta': performance_data['memory_delta'],
                        'cpu_usage': performance_data['cpu_usage'],
                    }
                )

            except Exception as e:
                logger.error(f"Failed to log performance data: {str(e)}")
        
        # Log to file
        log_data = {
            **request_data,
            **response_data,
            **performance_data,
        }
        
        logger.info(f"Performance: {json.dumps(log_data)}")

    def _handle_slow_request(self, request_data, performance_data):
        """Handle slow request detection"""
        
        logger.warning(
            f"Slow request detected: {request_data['method']} {request_data['path']} "
            f"took {performance_data['response_time']:.3f}s with "
            f"{performance_data['query_count']} queries ({performance_data['query_time']:.3f}s)"
        )
        
        # Send alert if configured
        self._send_performance_alert('slow_request', {
            'path': request_data['path'],
            'response_time': performance_data['response_time'],
            'query_count': performance_data['query_count'],
        })

    def _send_performance_alert(self, alert_type, data):
        """Send performance alert"""
        
        alert_settings = getattr(settings, 'PERFORMANCE_ALERTS', {})
        if not alert_settings.get('ENABLED', False):
            return
        
        try:
            # Cache to prevent spam
            cache_key = f"perf_alert_{alert_type}_{hash(str(data))}"
            if cache.get(cache_key):
                return
            
            cache.set(cache_key, True, timeout=300)  # 5 minutes
            
            # Send email alert
            if alert_settings.get('EMAIL_RECIPIENTS'):
                self._send_email_alert(alert_type, data)
            
            # Send Slack alert
            if alert_settings.get('SLACK_WEBHOOK'):
                self._send_slack_alert(alert_type, data)
                
        except Exception as e:
            logger.error(f"Failed to send performance alert: {str(e)}")

    def _send_email_alert(self, alert_type, data):
        """Send email performance alert"""
        from django.core.mail import send_mail
        from django.template.loader import render_to_string
        
        subject = f"Performance Alert: {alert_type}"
        message = render_to_string('performance/alert_email.txt', {
            'alert_type': alert_type,
            'data': data,
        })
        
        recipients = getattr(settings, 'PERFORMANCE_ALERTS', {}).get('EMAIL_RECIPIENTS', [])
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=True,
        )

    def _send_slack_alert(self, alert_type, data):
        """Send Slack performance alert"""
        webhook_url = getattr(settings, 'PERFORMANCE_ALERTS', {}).get('SLACK_WEBHOOK')
        if not webhook_url:
            return
        
        payload = {
            'text': f"🚨 Performance Alert: {alert_type}",
            'attachments': [
                {
                    'color': 'warning',
                    'fields': [
                        {'title': key, 'value': str(value), 'short': True}
                        for key, value in data.items()
                    ]
                }
            ]
        }
        
        body = json.dumps(payload).encode('utf-8')
        req = urlrequest.Request(
            webhook_url,
            data=body,
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        urlrequest.urlopen(req, timeout=5).close()


class DatabaseQueryMonitoringMiddleware(MiddlewareMixin):
    """
    Monitor database query performance
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.slow_query_threshold = getattr(settings, 'PERFORMANCE_MONITORING', {}).get('SLOW_QUERY_THRESHOLD', 0.5)
        super().__init__(get_response)

    def process_response(self, request, response):
        """Monitor database queries"""
        
        if not getattr(settings, 'PERFORMANCE_MONITORING', {}).get('TRACK_DATABASE_QUERIES', False):
            return response
        
        # Check for slow queries
        for query in connection.queries:
            query_time = float(query['time'])
            if query_time > self.slow_query_threshold:
                logger.warning(
                    f"Slow query detected: {query_time:.3f}s - {query['sql'][:200]}..."
                )
        
        return response


class CacheMonitoringMiddleware(MiddlewareMixin):
    """
    Monitor cache operations
    """
    
    def process_request(self, request):
        """Start cache monitoring"""
        if getattr(settings, 'PERFORMANCE_MONITORING', {}).get('TRACK_CACHE_OPERATIONS', False):
            request._cache_operations = []

    def process_response(self, request, response):
        """Log cache operations"""
        
        if hasattr(request, '_cache_operations') and request._cache_operations:
            cache_stats = {
                'hits': sum(1 for op in request._cache_operations if op['hit']),
                'misses': sum(1 for op in request._cache_operations if not op['hit']),
                'operations': len(request._cache_operations),
            }
            
            logger.info(f"Cache stats: {json.dumps(cache_stats)}")
        
        return response
