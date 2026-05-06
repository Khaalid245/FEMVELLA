import re
from django.core.cache import cache
from django.conf import settings


def get_client_ip(request):
    """
    Get the real client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip


def is_suspicious_request(request):
    """
    Check if a request is suspicious based on various factors
    """
    ip = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Check for suspicious patterns
    suspicious_patterns = [
        r'(?i)(union|select|insert|delete|drop|create|alter)',  # SQL injection
        r'(?i)(<script|javascript:|vbscript:|onload=|onerror=)',  # XSS
        r'(?i)(\.\.\/|\.\.\\)',  # Path traversal
        r'(?i)(cmd|exec|system|eval)',  # Command injection
    ]
    
    # Check URL and query parameters
    full_path = request.get_full_path()
    for pattern in suspicious_patterns:
        if re.search(pattern, full_path):
            return True
    
    # Check POST data
    if request.method == 'POST':
        try:
            body = request.body.decode('utf-8')
            for pattern in suspicious_patterns:
                if re.search(pattern, body):
                    return True
        except:
            pass
    
    # Check for suspicious user agents
    suspicious_user_agents = [
        'sqlmap', 'nikto', 'nmap', 'masscan', 'nessus',
        'burpsuite', 'owasp', 'w3af', 'acunetix'
    ]
    
    for suspicious_ua in suspicious_user_agents:
        if suspicious_ua.lower() in user_agent.lower():
            return True
    
    # Check rate limiting
    if is_rate_limited(ip):
        return True
    
    return False


def is_rate_limited(ip):
    """
    Check if IP is making too many requests
    """
    cache_key = f'rate_limit:{ip}'
    current_requests = cache.get(cache_key, 0)
    
    # Allow 100 requests per minute per IP
    max_requests = getattr(settings, 'RATE_LIMIT_REQUESTS', 100)
    time_window = getattr(settings, 'RATE_LIMIT_WINDOW', 60)
    
    if current_requests >= max_requests:
        return True
    
    # Increment counter
    cache.set(cache_key, current_requests + 1, time_window)
    return False


def log_model_change(instance, action, user=None, old_values=None, new_values=None):
    """
    Helper function to log model changes
    """
    from django.contrib.contenttypes.models import ContentType
    from .models import AuditLog
    
    try:
        content_type = ContentType.objects.get_for_model(instance)
        
        AuditLog.objects.create(
            user=user,
            action_type=action,
            action_description=f"{action.title()} {content_type.model}: {str(instance)}",
            content_type=content_type,
            object_id=instance.pk,
            old_values=old_values,
            new_values=new_values,
            metadata={
                'model': content_type.model,
                'app_label': content_type.app_label,
            }
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Model change logging failed: {str(e)}")


def get_model_fields_dict(instance):
    """
    Get all field values of a model instance as a dictionary
    """
    fields_dict = {}
    for field in instance._meta.fields:
        try:
            value = getattr(instance, field.name)
            # Convert non-serializable values
            if hasattr(value, 'isoformat'):  # datetime objects
                value = value.isoformat()
            elif hasattr(value, 'pk'):  # foreign key objects
                value = {'pk': value.pk, 'str': str(value)}
            fields_dict[field.name] = value
        except:
            fields_dict[field.name] = None
    return fields_dict


def is_admin_user(user):
    """
    Check if user has admin privileges
    """
    return user and user.is_authenticated and (user.is_staff or user.is_superuser)


def mask_sensitive_data(data):
    """
    Mask sensitive data in logs
    """
    if not isinstance(data, dict):
        return data
    
    sensitive_fields = [
        'password', 'token', 'secret', 'key', 'credit_card',
        'ssn', 'social_security', 'passport', 'license'
    ]
    
    masked_data = data.copy()
    for key, value in masked_data.items():
        if any(sensitive_field in key.lower() for sensitive_field in sensitive_fields):
            if isinstance(value, str) and len(value) > 4:
                masked_data[key] = '*' * (len(value) - 4) + value[-4:]
            else:
                masked_data[key] = '***'
    
    return masked_data