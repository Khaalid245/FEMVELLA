from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.contrib.auth import get_user_model
from .models import AuditLog
from .utils import log_model_change, get_model_fields_dict, get_client_ip
from apps.products.models import Product, ProductImage, ProductVariant
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment

User = get_user_model()

# Store original values before save
_original_values = {}


@receiver(pre_save)
def store_original_values(sender, instance, **kwargs):
    """Store original values before model save"""
    if instance.pk:
        try:
            original = sender.objects.get(pk=instance.pk)
            _original_values[f"{sender.__name__}_{instance.pk}"] = get_model_fields_dict(original)
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender=Product)
def log_product_changes(sender, instance, created, **kwargs):
    """Log product creation and updates"""
    action = AuditLog.ActionType.CREATE if created else AuditLog.ActionType.UPDATE
    
    old_values = None
    new_values = get_model_fields_dict(instance)
    
    if not created:
        key = f"{sender.__name__}_{instance.pk}"
        old_values = _original_values.pop(key, None)
    
    log_model_change(
        instance=instance,
        action=action,
        old_values=old_values,
        new_values=new_values
    )


@receiver(post_save, sender=Order)
def log_order_changes(sender, instance, created, **kwargs):
    """Log order creation and updates"""
    action = AuditLog.ActionType.CREATE if created else AuditLog.ActionType.UPDATE
    
    old_values = None
    new_values = get_model_fields_dict(instance)
    
    if not created:
        key = f"{sender.__name__}_{instance.pk}"
        old_values = _original_values.pop(key, None)
    
    # Special handling for order status changes
    if not created and old_values and old_values.get('status') != new_values.get('status'):
        log_model_change(
            instance=instance,
            action=AuditLog.ActionType.UPDATE,
            old_values=old_values,
            new_values=new_values
        )


@receiver(post_save, sender=Payment)
def log_payment_changes(sender, instance, created, **kwargs):
    """Log payment events"""
    action = AuditLog.ActionType.PAYMENT if created else AuditLog.ActionType.UPDATE
    
    old_values = None
    new_values = get_model_fields_dict(instance)
    
    if not created:
        key = f"{sender.__name__}_{instance.pk}"
        old_values = _original_values.pop(key, None)
    
    log_model_change(
        instance=instance,
        action=action,
        old_values=old_values,
        new_values=new_values
    )


@receiver(post_delete)
def log_model_deletion(sender, instance, **kwargs):
    """Log model deletions"""
    # Only log deletions for important models
    important_models = [Product, Order, Payment, User, ProductImage, ProductVariant]
    
    if sender in important_models:
        log_model_change(
            instance=instance,
            action=AuditLog.ActionType.DELETE,
            new_values=get_model_fields_dict(instance)
        )


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log successful user login"""
    AuditLog.objects.create(
        user=user,
        action_type=AuditLog.ActionType.LOGIN,
        action_description=f"User logged in: {user.email}",
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        request_method=request.method,
        request_path=request.path,
        metadata={
            'login_method': 'web' if not request.path.startswith('/api/') else 'api'
        }
    )


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """Log user logout"""
    if user:
        AuditLog.objects.create(
            user=user,
            action_type=AuditLog.ActionType.LOGOUT,
            action_description=f"User logged out: {user.email}",
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            request_method=request.method,
            request_path=request.path
        )


@receiver(user_login_failed)
def log_failed_login(sender, credentials, request, **kwargs):
    """Log failed login attempts"""
    from .models import SecurityEvent
    
    email = credentials.get('email', 'unknown')
    
    # Log as audit event
    AuditLog.objects.create(
        user=None,
        action_type=AuditLog.ActionType.SECURITY_EVENT,
        action_description=f"Failed login attempt: {email}",
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        request_method=request.method,
        request_path=request.path,
        is_suspicious=True,
        risk_level='medium',
        metadata={'attempted_email': email}
    )
    
    # Log as security event
    SecurityEvent.objects.create(
        event_type=SecurityEvent.EventType.FAILED_LOGIN,
        severity='warning',
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        description=f"Failed login attempt for email: {email}",
        request_data={
            'email': email,
            'method': request.method,
            'path': request.path
        }
    )