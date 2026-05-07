from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.orders.models import Order
from apps.products.models import ProductVariant
from .tasks import (
    send_order_confirmation_email,
    send_payment_confirmation_email,
    send_admin_new_order_alert,
    send_low_stock_alert
)
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Order)
def handle_order_created(sender, instance, created, **kwargs):
    """Send emails when order is created or updated"""
    if created:
        # Send order confirmation to customer
        send_order_confirmation_email.delay(
            order_id=instance.id,
            user_email=instance.user.email
        )
        
        # Send new order alert to admin
        send_admin_new_order_alert.delay(order_id=instance.id)
        
        logger.info(f"Order emails queued for order {instance.id}")
    
    # Send payment confirmation when order is paid
    elif instance.status == 'paid' and 'status' in kwargs.get('update_fields', []):
        send_payment_confirmation_email.delay(
            order_id=instance.id,
            user_email=instance.user.email
        )
        
        logger.info(f"Payment confirmation email queued for order {instance.id}")


@receiver(post_save, sender=ProductVariant)
def handle_stock_update(sender, instance, **kwargs):
    """Send low stock alert when stock falls below threshold"""
    if hasattr(instance, '_stock_updated'):
        current_stock = instance.available_stock
        
        if (current_stock <= instance.low_stock_threshold and 
            current_stock > 0 and 
            instance.is_active):
            
            send_low_stock_alert.delay(
                product_variant_id=instance.id,
                current_stock=current_stock
            )
            
            logger.info(f"Low stock alert queued for variant {instance.id}")


# Signal to track stock updates
def track_stock_update(sender, instance, **kwargs):
    """Track when stock is updated to trigger alerts"""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            if old_instance.available_stock != instance.available_stock:
                instance._stock_updated = True
        except sender.DoesNotExist:
            pass

# Connect the stock tracking signal
post_save.connect(track_stock_update, sender=ProductVariant, dispatch_uid="track_stock_update")