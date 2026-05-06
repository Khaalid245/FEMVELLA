from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from .models import DataExportRequest, AuditLog, SecurityEvent
import json
import logging
from datetime import timedelta

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_data_export(self, request_id):
    """
    Process user data export request (GDPR compliance)
    """
    try:
        export_request = DataExportRequest.objects.get(id=request_id)
        export_request.status = 'processing'
        export_request.save()
        
        user = export_request.user
        
        # Collect all user data
        user_data = {
            'export_info': {
                'user_id': user.id,
                'export_date': timezone.now().isoformat(),
                'export_type': 'complete_user_data',
                'gdpr_compliant': True
            },
            
            'personal_information': {
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': getattr(user, 'phone', ''),
                'date_joined': user.date_joined.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'is_active': user.is_active,
            },
            
            'orders': [],
            'audit_logs': [],
            'security_events': [],
        }
        
        # Export orders
        from apps.orders.models import Order
        orders = Order.objects.filter(user=user).prefetch_related('items')
        for order in orders:
            order_data = {
                'id': order.id,
                'status': order.status,
                'total_price': str(order.total_price),
                'shipping_address': order.shipping_address,
                'notes': order.notes,
                'created_at': order.created_at.isoformat(),
                'items': []
            }
            
            for item in order.items.all():
                item_data = {
                    'product_name': item.product.name if item.product else 'Deleted Product',
                    'size': item.size_snapshot,
                    'color': item.color_snapshot,
                    'customization': item.customization_text,
                    'quantity': item.quantity,
                    'unit_price': str(item.unit_price),
                    'subtotal': str(item.subtotal)
                }
                order_data['items'].append(item_data)
            
            user_data['orders'].append(order_data)
        
        # Export audit logs (last 2 years for privacy)
        two_years_ago = timezone.now() - timedelta(days=730)
        audit_logs = AuditLog.objects.filter(
            user=user,
            created_at__gte=two_years_ago
        )
        
        for log in audit_logs:
            log_data = {
                'action_type': log.action_type,
                'action_description': log.action_description,
                'ip_address': log.ip_address,
                'user_agent': log.user_agent[:100],  # Truncate for privacy
                'request_method': log.request_method,
                'request_path': log.request_path,
                'created_at': log.created_at.isoformat(),
            }
            user_data['audit_logs'].append(log_data)
        
        # Export security events
        security_events = SecurityEvent.objects.filter(user=user)
        for event in security_events:
            event_data = {
                'event_type': event.event_type,
                'severity': event.severity,
                'description': event.description,
                'ip_address': event.ip_address,
                'country': event.country,
                'city': event.city,
                'created_at': event.created_at.isoformat(),
                'is_resolved': event.is_resolved,
            }
            user_data['security_events'].append(event_data)
        
        # Save to file
        json_content = json.dumps(user_data, indent=2, ensure_ascii=False)
        file_content = ContentFile(json_content.encode('utf-8'))
        
        file_path = f'exports/user_{user.id}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.json'
        saved_path = default_storage.save(file_path, file_content)
        
        # Update export request
        export_request.status = 'completed'
        export_request.file_path = saved_path
        export_request.file_size = len(json_content.encode('utf-8'))
        export_request.processed_at = timezone.now()
        export_request.expires_at = timezone.now() + timedelta(days=30)  # 30 days to download
        export_request.save()
        
        logger.info(f"Data export completed for user {user.email}")
        
        # Send notification email (implement as needed)
        # send_export_ready_email.delay(user.id, export_request.id)
        
    except DataExportRequest.DoesNotExist:
        logger.error(f"Export request {request_id} not found")
    except Exception as exc:
        logger.error(f"Data export failed for request {request_id}: {str(exc)}")
        
        try:
            export_request = DataExportRequest.objects.get(id=request_id)
            export_request.status = 'failed'
            export_request.error_message = str(exc)
            export_request.save()
        except:
            pass
        
        # Retry the task
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60 * (self.request.retries + 1))


@shared_task(bind=True, max_retries=3)
def process_data_deletion(self, request_id):
    """
    Process user data deletion request (GDPR right to be forgotten)
    """
    try:
        deletion_request = DataExportRequest.objects.get(id=request_id)
        deletion_request.status = 'processing'
        deletion_request.save()
        
        user = deletion_request.user
        
        # Anonymize user data (don't delete completely for business records)
        user.email = f"deleted_user_{user.id}@anonymized.local"
        user.username = f"deleted_user_{user.id}"
        user.first_name = ""
        user.last_name = ""
        user.phone = ""
        user.is_active = False
        user.save()
        
        # Anonymize audit logs
        AuditLog.objects.filter(user=user).update(
            user=None,
            metadata={}
        )
        
        # Anonymize security events
        SecurityEvent.objects.filter(user=user).update(
            user=None
        )
        
        # Keep orders for business/legal requirements but anonymize personal data
        from apps.orders.models import Order
        Order.objects.filter(user=user).update(
            shipping_address="[ANONYMIZED]",
            notes=""
        )
        
        deletion_request.status = 'completed'
        deletion_request.processed_at = timezone.now()
        deletion_request.save()
        
        logger.info(f"Data deletion completed for user ID {user.id}")
        
    except DataExportRequest.DoesNotExist:
        logger.error(f"Deletion request {request_id} not found")
    except Exception as exc:
        logger.error(f"Data deletion failed for request {request_id}: {str(exc)}")
        
        try:
            deletion_request = DataExportRequest.objects.get(id=request_id)
            deletion_request.status = 'failed'
            deletion_request.error_message = str(exc)
            deletion_request.save()
        except:
            pass
        
        # Retry the task
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60 * (self.request.retries + 1))


@shared_task
def cleanup_expired_exports():
    """
    Clean up expired export files
    """
    expired_exports = DataExportRequest.objects.filter(
        status='completed',
        expires_at__lt=timezone.now()
    )
    
    for export in expired_exports:
        if export.file_path and default_storage.exists(export.file_path):
            default_storage.delete(export.file_path)
        
        export.file_path = ""
        export.save()
    
    logger.info(f"Cleaned up {expired_exports.count()} expired exports")


@shared_task
def generate_security_report():
    """
    Generate daily security report
    """
    from datetime import timedelta
    
    yesterday = timezone.now() - timedelta(days=1)
    
    # Count security events from yesterday
    failed_logins = SecurityEvent.objects.filter(
        event_type=SecurityEvent.EventType.FAILED_LOGIN,
        created_at__gte=yesterday
    ).count()
    
    suspicious_activities = AuditLog.objects.filter(
        is_suspicious=True,
        created_at__gte=yesterday
    ).count()
    
    high_risk_events = AuditLog.objects.filter(
        risk_level__in=['high', 'critical'],
        created_at__gte=yesterday
    ).count()
    
    report = {
        'date': yesterday.date().isoformat(),
        'failed_logins': failed_logins,
        'suspicious_activities': suspicious_activities,
        'high_risk_events': high_risk_events,
    }
    
    logger.info(f"Daily security report: {report}")
    
    # Send to security team (implement as needed)
    # send_security_report_email.delay(report)