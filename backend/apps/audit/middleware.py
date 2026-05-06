from django.utils.deprecation import MiddlewareMixin
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog, SecurityEvent
from .utils import get_client_ip, is_suspicious_request
import json


class AuditMiddleware(MiddlewareMixin):
    """
    Middleware to automatically log user actions and security events
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def process_request(self, request):
        # Store request start time for performance tracking
        import time
        request._audit_start_time = time.time()
        
        # Get client information
        request._client_ip = get_client_ip(request)
        request._user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Check for suspicious requests
        if is_suspicious_request(request):
            self._log_security_event(
                request,
                SecurityEvent.EventType.SUSPICIOUS_IP,
                'Suspicious request detected',
                'warning'
            )

    def process_response(self, request, response):
        # Skip logging for certain paths
        skip_paths = ['/health/', '/metrics/', '/static/', '/media/']
        if any(request.path.startswith(path) for path in skip_paths):
            return response
            
        # Log API calls
        if request.path.startswith('/api/'):
            self._log_api_call(request, response)
            
        # Log authentication events
        if request.path in ['/api/auth/token/', '/api/auth/token/refresh/']:
            self._log_auth_event(request, response)
            
        return response

    def _log_api_call(self, request, response):
        """Log API calls for audit trail"""
        try:
            user = getattr(request, 'user', None)
            if user and user.is_authenticated:
                
                # Determine action type based on HTTP method
                action_type_map = {
                    'GET': AuditLog.ActionType.VIEW,
                    'POST': AuditLog.ActionType.CREATE,
                    'PUT': AuditLog.ActionType.UPDATE,
                    'PATCH': AuditLog.ActionType.UPDATE,
                    'DELETE': AuditLog.ActionType.DELETE,
                }
                
                action_type = action_type_map.get(request.method, AuditLog.ActionType.API_CALL)
                
                # Calculate response time
                response_time = None
                if hasattr(request, '_audit_start_time'):
                    import time
                    response_time = time.time() - request._audit_start_time
                
                AuditLog.objects.create(
                    user=user,
                    action_type=action_type,
                    action_description=f"{request.method} {request.path}",
                    ip_address=getattr(request, '_client_ip', None),
                    user_agent=getattr(request, '_user_agent', ''),
                    request_method=request.method,
                    request_path=request.path,
                    metadata={
                        'response_status': response.status_code,
                        'response_time': response_time,
                        'query_params': dict(request.GET),
                    }
                )
                
        except Exception as e:
            # Don't let audit logging break the application
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Audit logging failed: {str(e)}")

    def _log_auth_event(self, request, response):
        """Log authentication events"""
        try:
            if response.status_code == 200:
                # Successful login
                user_email = None
                if hasattr(request, 'data') and 'email' in request.data:
                    user_email = request.data['email']
                
                AuditLog.objects.create(
                    user=getattr(request, 'user', None),
                    action_type=AuditLog.ActionType.LOGIN,
                    action_description=f"Successful login: {user_email}",
                    ip_address=getattr(request, '_client_ip', None),
                    user_agent=getattr(request, '_user_agent', ''),
                    request_method=request.method,
                    request_path=request.path,
                    metadata={'email': user_email}
                )
            else:
                # Failed login attempt
                self._log_security_event(
                    request,
                    SecurityEvent.EventType.FAILED_LOGIN,
                    f"Failed login attempt: {response.status_code}",
                    'warning'
                )
                
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Auth event logging failed: {str(e)}")

    def _log_security_event(self, request, event_type, description, severity):
        """Log security events"""
        try:
            SecurityEvent.objects.create(
                event_type=event_type,
                severity=severity,
                ip_address=getattr(request, '_client_ip', '127.0.0.1'),
                user_agent=getattr(request, '_user_agent', ''),
                user=getattr(request, 'user', None) if hasattr(request, 'user') and request.user.is_authenticated else None,
                description=description,
                request_data={
                    'method': request.method,
                    'path': request.path,
                    'query_params': dict(request.GET),
                }
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Security event logging failed: {str(e)}")