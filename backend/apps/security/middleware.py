import time
import hashlib
from django.core.cache import cache
from django.http import JsonResponse
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger('security')
User = get_user_model()


class SecurityMiddleware(MiddlewareMixin):
    """Enterprise security middleware with rate limiting and protection"""

    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def process_request(self, request):
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Check for suspicious patterns
        if self.is_suspicious_request(request, client_ip):
            logger.warning(f"Suspicious request blocked from {client_ip}: {request.path}")
            return JsonResponse(
                {'error': 'Request blocked for security reasons'}, 
                status=429
            )

        # Apply rate limiting
        if self.is_rate_limited(request, client_ip):
            logger.warning(f"Rate limit exceeded for {client_ip}: {request.path}")
            return JsonResponse(
                {'error': 'Rate limit exceeded. Please try again later.'}, 
                status=429
            )

        # Log security events
        self.log_security_event(request, client_ip)

        return None

    def get_client_ip(self, request):
        """Get real client IP considering proxies"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def is_suspicious_request(self, request, client_ip):
        """Detect suspicious request patterns"""
        # Check for common attack patterns
        suspicious_patterns = [
            'script', 'javascript:', 'vbscript:', 'onload', 'onerror',
            'eval(', 'alert(', 'document.cookie', 'window.location',
            '../', '..\\', '/etc/passwd', '/proc/', 'cmd.exe',
            'powershell', 'wget', 'curl', 'nc ', 'netcat',
            'union select', 'drop table', 'insert into', 'delete from',
            '1=1', '1\'=\'1', 'or 1=1', 'and 1=1'
        ]

        # Check URL and query parameters
        full_path = request.get_full_path().lower()
        for pattern in suspicious_patterns:
            if pattern in full_path:
                return True

        # Check POST data
        if request.method == 'POST':
            try:
                body = request.body.decode('utf-8').lower()
                for pattern in suspicious_patterns:
                    if pattern in body:
                        return True
            except:
                pass

        # Check for excessive request size
        if len(request.body) > 10 * 1024 * 1024:  # 10MB limit
            return True

        return False

    def is_rate_limited(self, request, client_ip):
        """Implement rate limiting per IP and endpoint"""
        # Different limits for different endpoints
        rate_limits = {
            '/api/auth/': {'requests': 5, 'window': 300},  # 5 requests per 5 minutes
            '/api/contact/': {'requests': 3, 'window': 3600},  # 3 requests per hour
            '/api/reviews/': {'requests': 10, 'window': 3600},  # 10 reviews per hour
            'default': {'requests': 100, 'window': 3600},  # 100 requests per hour
        }

        # Determine rate limit for this endpoint
        limit_config = rate_limits['default']
        for endpoint, config in rate_limits.items():
            if endpoint != 'default' and request.path.startswith(endpoint):
                limit_config = config
                break

        # Create cache key
        cache_key = f"rate_limit:{client_ip}:{request.path.split('/')[1:3]}"
        
        # Get current request count
        current_requests = cache.get(cache_key, 0)
        
        if current_requests >= limit_config['requests']:
            return True

        # Increment counter
        cache.set(cache_key, current_requests + 1, limit_config['window'])
        return False

    def log_security_event(self, request, client_ip):
        """Log security-relevant events"""
        # Log authentication attempts
        if '/api/auth/' in request.path:
            logger.info(f"Auth attempt from {client_ip}: {request.path}")

        # Log admin access
        if '/admin/' in request.path:
            user = getattr(request, 'user', None)
            if user and user.is_authenticated:
                logger.info(f"Admin access by {user.email} from {client_ip}: {request.path}")

        # Log API access patterns
        if request.path.startswith('/api/'):
            user = getattr(request, 'user', None)
            user_info = user.email if user and user.is_authenticated else 'anonymous'
            logger.debug(f"API access by {user_info} from {client_ip}: {request.method} {request.path}")


class BruteForceProtectionMiddleware(MiddlewareMixin):
    """Protection against brute force attacks"""

    def process_request(self, request):
        if request.path in ['/api/auth/token/', '/admin/login/']:
            client_ip = self.get_client_ip(request)
            
            # Check if IP is temporarily blocked
            block_key = f"blocked_ip:{client_ip}"
            if cache.get(block_key):
                logger.warning(f"Blocked IP attempted access: {client_ip}")
                return JsonResponse(
                    {'error': 'Access temporarily blocked due to suspicious activity'}, 
                    status=429
                )

        return None

    def process_response(self, request, response):
        # Track failed login attempts
        if (request.path in ['/api/auth/token/', '/admin/login/'] and 
            response.status_code in [400, 401, 403]):
            
            client_ip = self.get_client_ip(request)
            self.track_failed_attempt(client_ip)

        return response

    def get_client_ip(self, request):
        """Get real client IP considering proxies"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def track_failed_attempt(self, client_ip):
        """Track and block IPs with too many failed attempts"""
        attempts_key = f"failed_attempts:{client_ip}"
        attempts = cache.get(attempts_key, 0) + 1
        
        # Block after 5 failed attempts
        if attempts >= 5:
            block_key = f"blocked_ip:{client_ip}"
            cache.set(block_key, True, 3600)  # Block for 1 hour
            logger.warning(f"IP blocked due to brute force: {client_ip}")
        else:
            cache.set(attempts_key, attempts, 900)  # Track for 15 minutes


class CSPMiddleware(MiddlewareMixin):
    """Content Security Policy middleware"""

    def process_response(self, request, response):
        # Only apply CSP to HTML responses
        if 'text/html' in response.get('Content-Type', ''):
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https: blob:; "
                "connect-src 'self' https://api.stripe.com; "
                "frame-src https://js.stripe.com https://hooks.stripe.com; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none';"
            )
            response['Content-Security-Policy'] = csp_policy

        # Additional security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = (
            'geolocation=(), microphone=(), camera=(), '
            'payment=(self), usb=(), magnetometer=(), gyroscope=()'
        )

        return response


class InputSanitizationMiddleware(MiddlewareMixin):
    """Sanitize and validate input data"""

    def process_request(self, request):
        if request.method in ['POST', 'PUT', 'PATCH']:
            # Sanitize form data
            if hasattr(request, 'POST'):
                for key, value in request.POST.items():
                    if isinstance(value, str):
                        request.POST._mutable = True
                        request.POST[key] = self.sanitize_input(value)
                        request.POST._mutable = False

        return None

    def sanitize_input(self, value):
        """Basic input sanitization"""
        if not isinstance(value, str):
            return value

        # Remove null bytes
        value = value.replace('\x00', '')
        
        # Limit length
        if len(value) > 10000:  # 10KB limit
            value = value[:10000]

        # Remove potentially dangerous characters for non-content fields
        dangerous_chars = ['<script', '</script', 'javascript:', 'vbscript:', 'onload=', 'onerror=']
        for char in dangerous_chars:
            value = value.replace(char, '')

        return value.strip()