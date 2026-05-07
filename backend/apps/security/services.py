from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from .models import SecurityEvent, AdminActionLog, DataAccessLog, SecurityIncident
import logging

logger = logging.getLogger('security')
User = get_user_model()


class SecurityLogger:
    """Centralized security logging service"""

    @staticmethod
    def log_security_event(event_type, request, user=None, severity='medium', 
                          description='', additional_data=None):
        """Log a security event"""
        try:
            client_ip = SecurityLogger._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            session_key = request.session.session_key if hasattr(request, 'session') else ''
            
            SecurityEvent.objects.create(
                event_type=event_type,
                severity=severity,
                user=user or getattr(request, 'user', None),
                ip_address=client_ip,
                user_agent=user_agent,
                session_key=session_key,
                method=request.method,
                path=request.path,
                query_params=dict(request.GET),
                description=description,
                additional_data=additional_data or {}
            )
            
            # Log to file as well
            logger.info(f"Security Event: {event_type} - {description} - IP: {client_ip}")
            
        except Exception as e:
            logger.error(f"Failed to log security event: {e}")

    @staticmethod
    def log_admin_action(user, action_type, request, content_object=None, 
                        changes=None, description='', risk_level='low'):
        """Log admin actions with detailed tracking"""
        try:
            client_ip = SecurityLogger._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            session_key = request.session.session_key if hasattr(request, 'session') else ''
            
            # Get content type and object info
            content_type = None
            object_id = None
            object_repr = ''
            
            if content_object:
                content_type = ContentType.objects.get_for_model(content_object)
                object_id = content_object.pk
                object_repr = str(content_object)[:200]
            
            AdminActionLog.objects.create(
                user=user,
                action_type=action_type,
                content_type=content_type,
                object_id=object_id,
                object_repr=object_repr,
                changes=changes or {},
                ip_address=client_ip,
                user_agent=user_agent,
                session_key=session_key,
                description=description,
                risk_level=risk_level
            )
            
            logger.info(f"Admin Action: {user.email} - {action_type} - {object_repr}")
            
        except Exception as e:
            logger.error(f"Failed to log admin action: {e}")

    @staticmethod
    def log_data_access(user, access_type, model_name, request, 
                       record_count=1, fields_accessed=None, purpose=''):
        """Log access to sensitive data"""
        try:
            client_ip = SecurityLogger._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            DataAccessLog.objects.create(
                user=user,
                access_type=access_type,
                model_name=model_name,
                record_count=record_count,
                fields_accessed=fields_accessed or [],
                purpose=purpose,
                ip_address=client_ip,
                user_agent=user_agent,
                query_params=dict(request.GET),
                filters_applied=getattr(request, 'filters_applied', {})
            )
            
            logger.info(f"Data Access: {user.email} - {access_type} {model_name} - {record_count} records")
            
        except Exception as e:
            logger.error(f"Failed to log data access: {e}")

    @staticmethod
    def create_security_incident(incident_type, title, description, severity='medium',
                               source_ip=None, affected_systems=None, attack_vector=''):
        """Create a security incident"""
        try:
            incident = SecurityIncident.objects.create(
                incident_type=incident_type,
                severity=severity,
                title=title,
                description=description,
                source_ip=source_ip,
                attack_vector=attack_vector,
                affected_systems=affected_systems or []
            )
            
            logger.critical(f"Security Incident Created: {incident.incident_id} - {title}")
            
            # Send alerts for high/critical incidents
            if severity in ['high', 'critical']:
                SecurityLogger._send_incident_alert(incident)
            
            return incident
            
        except Exception as e:
            logger.error(f"Failed to create security incident: {e}")
            return None

    @staticmethod
    def track_suspicious_activity(request, activity_type, details):
        """Track and potentially escalate suspicious activity"""
        try:
            client_ip = SecurityLogger._get_client_ip(request)
            
            # Log the activity
            SecurityLogger.log_security_event(
                event_type='suspicious_activity',
                request=request,
                severity='high',
                description=f"Suspicious activity detected: {activity_type}",
                additional_data={
                    'activity_type': activity_type,
                    'details': details,
                    'client_ip': client_ip
                }
            )
            
            # Check if this IP has multiple suspicious activities
            recent_events = SecurityEvent.objects.filter(
                ip_address=client_ip,
                event_type='suspicious_activity',
                timestamp__gte=timezone.now() - timezone.timedelta(hours=1)
            ).count()
            
            # Create incident if threshold exceeded
            if recent_events >= 3:
                SecurityLogger.create_security_incident(
                    incident_type='suspicious_pattern',
                    title=f"Multiple suspicious activities from {client_ip}",
                    description=f"IP {client_ip} has triggered {recent_events} suspicious activity alerts in the last hour",
                    severity='high',
                    source_ip=client_ip,
                    attack_vector=activity_type
                )
            
        except Exception as e:
            logger.error(f"Failed to track suspicious activity: {e}")

    @staticmethod
    def _get_client_ip(request):
        """Get real client IP considering proxies"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip

    @staticmethod
    def _send_incident_alert(incident):
        """Send alert for security incidents"""
        try:
            # Import here to avoid circular imports
            from apps.emails.tasks import send_admin_security_alert
            
            send_admin_security_alert.delay(
                incident_id=incident.incident_id,
                title=incident.title,
                severity=incident.severity,
                description=incident.description
            )
            
        except Exception as e:
            logger.error(f"Failed to send incident alert: {e}")


class SecurityDecorator:
    """Decorators for automatic security logging"""

    @staticmethod
    def log_admin_action(action_type, risk_level='low'):
        """Decorator to automatically log admin actions"""
        def decorator(func):
            def wrapper(request, *args, **kwargs):
                result = func(request, *args, **kwargs)
                
                if hasattr(request, 'user') and request.user.is_authenticated:
                    SecurityLogger.log_admin_action(
                        user=request.user,
                        action_type=action_type,
                        request=request,
                        description=f"Admin action: {func.__name__}",
                        risk_level=risk_level
                    )
                
                return result
            return wrapper
        return decorator

    @staticmethod
    def log_data_access(model_name, access_type='view'):
        """Decorator to automatically log data access"""
        def decorator(func):
            def wrapper(request, *args, **kwargs):
                result = func(request, *args, **kwargs)
                
                if hasattr(request, 'user') and request.user.is_authenticated:
                    SecurityLogger.log_data_access(
                        user=request.user,
                        access_type=access_type,
                        model_name=model_name,
                        request=request
                    )
                
                return result
            return wrapper
        return decorator

    @staticmethod
    def require_secure_access(min_auth_level='user'):
        """Decorator to enforce secure access requirements"""
        def decorator(func):
            def wrapper(request, *args, **kwargs):
                # Check authentication
                if not request.user.is_authenticated:
                    SecurityLogger.log_security_event(
                        event_type='permission_denied',
                        request=request,
                        severity='medium',
                        description='Unauthenticated access attempt'
                    )
                    from django.http import JsonResponse
                    return JsonResponse({'error': 'Authentication required'}, status=401)
                
                # Check authorization level
                if min_auth_level == 'admin' and not request.user.is_staff:
                    SecurityLogger.log_security_event(
                        event_type='permission_denied',
                        request=request,
                        user=request.user,
                        severity='high',
                        description='Unauthorized admin access attempt'
                    )
                    from django.http import JsonResponse
                    return JsonResponse({'error': 'Admin access required'}, status=403)
                
                return func(request, *args, **kwargs)
            return wrapper
        return decorator