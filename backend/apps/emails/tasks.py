from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from django.db import models
from .models import EmailTemplate, EmailLog
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_transactional_email(self, email_log_id):
    """Send transactional email with retry logic"""
    try:
        email_log = EmailLog.objects.get(id=email_log_id)
        
        # Get template
        try:
            template = EmailTemplate.objects.get(
                template_type=email_log.template_type,
                is_active=True
            )
        except EmailTemplate.DoesNotExist:
            email_log.status = 'failed'
            email_log.error_message = f"Template not found: {email_log.template_type}"
            email_log.save()
            logger.error(f"Email template not found: {email_log.template_type}")
            return False

        # Render email content
        context = email_log.context_data
        context.update({
            'site_name': 'Femvelle',
            'site_url': getattr(settings, 'FRONTEND_URL', 'https://femvelle.com'),
            'support_email': getattr(settings, 'DEFAULT_FROM_EMAIL', 'support@femvelle.com'),
        })

        # Render HTML content
        html_content = render_to_string('emails/base.html', {
            'content': template.html_content,
            **context
        })

        # Create email
        email = EmailMultiAlternatives(
            subject=template.subject.format(**context),
            body=template.text_content.format(**context) if template.text_content else '',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_log.recipient_email],
        )
        
        if html_content:
            email.attach_alternative(html_content, "text/html")

        # Send email
        email.send()
        
        # Update log
        email_log.status = 'sent'
        email_log.sent_at = timezone.now()
        email_log.save()
        
        logger.info(f"Email sent successfully: {email_log_id}")
        return True

    except Exception as exc:
        email_log.retry_count += 1
        email_log.error_message = str(exc)
        
        if email_log.can_retry:
            email_log.status = 'retry'
            email_log.save()
            logger.warning(f"Email failed, retrying: {email_log_id} - {exc}")
            raise self.retry(exc=exc)
        else:
            email_log.status = 'failed'
            email_log.save()
            logger.error(f"Email failed permanently: {email_log_id} - {exc}")
            return False


@shared_task
def send_order_confirmation_email(order_id, user_email):
    """Send order confirmation email"""
    from apps.orders.models import Order
    
    try:
        order = Order.objects.select_related('user', 'shipping_address').get(id=order_id)
        
        context = {
            'order': {
                'id': order.id,
                'order_number': order.order_number,
                'total': float(order.total),
                'subtotal': float(order.subtotal),
                'shipping_cost': float(order.shipping_cost),
                'created_at': order.created_at.strftime('%B %d, %Y'),
            },
            'user': {
                'first_name': order.user.first_name,
                'last_name': order.user.last_name,
            },
            'shipping_address': {
                'full_name': f"{order.shipping_address.first_name} {order.shipping_address.last_name}",
                'address_line_1': order.shipping_address.address_line_1,
                'address_line_2': order.shipping_address.address_line_2,
                'city': order.shipping_address.city,
                'state': order.shipping_address.state,
                'postal_code': order.shipping_address.postal_code,
                'country': order.shipping_address.country,
            } if order.shipping_address else None,
        }
        
        email_log = EmailLog.objects.create(
            template_type='order_confirmation',
            recipient_email=user_email,
            recipient_user=order.user,
            subject=f"Order Confirmation #{order.order_number}",
            context_data=context,
        )
        
        send_transactional_email.delay(str(email_log.id))
        
    except Exception as e:
        logger.error(f"Failed to create order confirmation email: {e}")


@shared_task
def send_payment_confirmation_email(order_id, user_email):
    """Send payment confirmation email"""
    from apps.orders.models import Order
    
    try:
        order = Order.objects.select_related('user').get(id=order_id)
        
        context = {
            'order': {
                'id': order.id,
                'order_number': order.order_number,
                'total': float(order.total),
                'payment_method': 'Credit Card',  # Can be enhanced
            },
            'user': {
                'first_name': order.user.first_name,
            },
        }
        
        email_log = EmailLog.objects.create(
            template_type='payment_confirmation',
            recipient_email=user_email,
            recipient_user=order.user,
            subject=f"Payment Confirmed for Order #{order.order_number}",
            context_data=context,
        )
        
        send_transactional_email.delay(str(email_log.id))
        
    except Exception as e:
        logger.error(f"Failed to create payment confirmation email: {e}")


@shared_task
def send_shipping_update_email(order_id, tracking_number=None):
    """Send shipping update email"""
    from apps.orders.models import Order
    
    try:
        order = Order.objects.select_related('user').get(id=order_id)
        
        context = {
            'order': {
                'order_number': order.order_number,
                'tracking_number': tracking_number,
            },
            'user': {
                'first_name': order.user.first_name,
            },
        }
        
        email_log = EmailLog.objects.create(
            template_type='shipping_update',
            recipient_email=order.user.email,
            recipient_user=order.user,
            subject=f"Your Order #{order.order_number} Has Shipped",
            context_data=context,
        )
        
        send_transactional_email.delay(str(email_log.id))
        
    except Exception as e:
        logger.error(f"Failed to create shipping update email: {e}")


@shared_task
def send_admin_new_order_alert(order_id):
    """Send new order alert to admin"""
    from apps.orders.models import Order
    
    try:
        order = Order.objects.select_related('user').get(id=order_id)
        admin_emails = getattr(settings, 'ADMIN_NOTIFICATION_EMAILS', ['admin@femvelle.com'])
        
        context = {
            'order': {
                'id': order.id,
                'order_number': order.order_number,
                'total': float(order.total),
                'customer_name': f"{order.user.first_name} {order.user.last_name}",
                'customer_email': order.user.email,
                'created_at': order.created_at.strftime('%B %d, %Y at %I:%M %p'),
            },
        }
        
        for admin_email in admin_emails:
            email_log = EmailLog.objects.create(
                template_type='new_order_admin',
                recipient_email=admin_email,
                subject=f"New Order #{order.order_number} - ${order.total}",
                context_data=context,
            )
            
            send_transactional_email.delay(str(email_log.id))
        
    except Exception as e:
        logger.error(f"Failed to create admin new order email: {e}")


@shared_task
def send_low_stock_alert(product_variant_id, current_stock):
    """Send low stock alert to admin"""
    from apps.products.models import ProductVariant
    
    try:
        variant = ProductVariant.objects.select_related('product').get(id=product_variant_id)
        admin_emails = getattr(settings, 'ADMIN_NOTIFICATION_EMAILS', ['admin@femvelle.com'])
        
        context = {
            'product': {
                'name': variant.product.name,
                'sku': variant.sku,
                'size': variant.size,
                'color': variant.color,
                'current_stock': current_stock,
                'threshold': variant.low_stock_threshold,
            },
        }
        
        for admin_email in admin_emails:
            email_log = EmailLog.objects.create(
                template_type='low_stock_admin',
                recipient_email=admin_email,
                subject=f"Low Stock Alert: {variant.product.name} ({variant.sku})",
                context_data=context,
            )
            
            send_transactional_email.delay(str(email_log.id))
        
    except Exception as e:
        logger.error(f"Failed to create low stock alert email: {e}")


@shared_task
def retry_failed_emails():
    """Retry failed emails that can be retried"""
    failed_emails = EmailLog.objects.filter(status='failed').filter(
        retry_count__lt=models.F('max_retries')
    )
    
    for email_log in failed_emails:
        if email_log.can_retry:
            send_transactional_email.delay(str(email_log.id))


@shared_task
def cleanup_old_email_logs():
    """Clean up email logs older than 30 days"""
    cutoff_date = timezone.now() - timedelta(days=30)
    deleted_count = EmailLog.objects.filter(
        created_at__lt=cutoff_date,
        status='sent'
    ).delete()[0]
    
    logger.info(f"Cleaned up {deleted_count} old email logs")
    return deleted_count


@shared_task
def send_daily_email_stats():
    """Send daily email statistics to admin"""
    from django.db.models import Count
    
    yesterday = timezone.now() - timedelta(days=1)
    stats = EmailLog.objects.filter(
        created_at__date=yesterday.date()
    ).aggregate(
        total=Count('id'),
        sent=Count('id', filter=models.Q(status='sent')),
        failed=Count('id', filter=models.Q(status='failed')),
        pending=Count('id', filter=models.Q(status='pending')),
    )
    
    admin_emails = getattr(settings, 'ADMIN_NOTIFICATION_EMAILS', ['admin@femvelle.com'])
    
    context = {
        'date': yesterday.strftime('%B %d, %Y'),
        'stats': stats,
        'success_rate': round((stats['sent'] / stats['total'] * 100) if stats['total'] > 0 else 0, 2)
    }
    
    for admin_email in admin_emails:
        email_log = EmailLog.objects.create(
            template_type='daily_email_stats',
            recipient_email=admin_email,
            subject=f"Daily Email Stats - {context['date']}",
            context_data=context,
        )
        
        send_transactional_email.delay(str(email_log.id))