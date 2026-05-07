from django.template import Template, Context
from .models import EmailTemplate, EmailLog
from .tasks import send_transactional_email
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Production-grade email service"""

    @staticmethod
    def send_email(template_type, recipient_email, context_data, recipient_user=None, priority='normal'):
        """Send email using template"""
        try:
            # Create email log
            email_log = EmailLog.objects.create(
                template_type=template_type,
                recipient_email=recipient_email,
                recipient_user=recipient_user,
                subject=f"Femvelle - {template_type.replace('_', ' ').title()}",
                context_data=context_data,
                max_retries=3 if priority == 'normal' else 5,
            )
            
            # Queue email for sending
            if priority == 'high':
                send_transactional_email.apply_async(
                    args=[str(email_log.id)],
                    priority=9
                )
            else:
                send_transactional_email.delay(str(email_log.id))
            
            logger.info(f"Email queued: {template_type} to {recipient_email}")
            return email_log
            
        except Exception as e:
            logger.error(f"Failed to queue email: {template_type} to {recipient_email} - {e}")
            return None

    @staticmethod
    def create_default_templates():
        """Create default email templates"""
        templates = [
            {
                'name': 'Order Confirmation',
                'template_type': 'order_confirmation',
                'subject': 'Order Confirmation #{order.order_number} - Femvelle',
                'html_content': '''
                    <div class="greeting">Hello {user.first_name},</div>
                    
                    <div class="message">
                        Thank you for your order! We're excited to prepare your beautiful pieces for you.
                        Your order has been confirmed and we'll send you updates as it progresses.
                    </div>
                    
                    <div class="order-details">
                        <div class="order-header">Order Details</div>
                        <div class="order-info">
                            <span class="order-label">Order Number:</span>
                            <span class="order-value">#{order.order_number}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Order Date:</span>
                            <span class="order-value">{order.created_at}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Subtotal:</span>
                            <span class="order-value">${order.subtotal}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Shipping:</span>
                            <span class="order-value">${order.shipping_cost}</span>
                        </div>
                        <div class="order-info total-row">
                            <span class="order-label">Total:</span>
                            <span class="order-value">${order.total}</span>
                        </div>
                    </div>
                    
                    {% if shipping_address %}
                    <div class="address-section">
                        <div class="address-title">Shipping Address</div>
                        <div class="address-text">
                            {shipping_address.full_name}<br>
                            {shipping_address.address_line_1}<br>
                            {% if shipping_address.address_line_2 %}{shipping_address.address_line_2}<br>{% endif %}
                            {shipping_address.city}, {shipping_address.state} {shipping_address.postal_code}<br>
                            {shipping_address.country}
                        </div>
                    </div>
                    {% endif %}
                    
                    <div style="text-align: center;">
                        <a href="{site_url}/orders/{order.id}" class="button">View Order Details</a>
                    </div>
                    
                    <div class="message">
                        We'll send you another email when your order ships. If you have any questions, 
                        please don't hesitate to contact our customer service team.
                    </div>
                ''',
            },
            {
                'name': 'Payment Confirmation',
                'template_type': 'payment_confirmation',
                'subject': 'Payment Confirmed for Order #{order.order_number} - Femvelle',
                'html_content': '''
                    <div class="greeting">Hello {user.first_name},</div>
                    
                    <div class="message">
                        Great news! Your payment has been successfully processed for order #{order.order_number}.
                    </div>
                    
                    <div class="order-details">
                        <div class="order-header">Payment Details</div>
                        <div class="order-info">
                            <span class="order-label">Order Number:</span>
                            <span class="order-value">#{order.order_number}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Amount Paid:</span>
                            <span class="order-value">${order.total}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Payment Method:</span>
                            <span class="order-value">{order.payment_method}</span>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="{site_url}/orders/{order.id}" class="button">View Order</a>
                    </div>
                    
                    <div class="message">
                        Your order is now being prepared for shipment. We'll notify you as soon as it's on its way!
                    </div>
                ''',
            },
            {
                'name': 'Shipping Update',
                'template_type': 'shipping_update',
                'subject': 'Your Order #{order.order_number} Has Shipped - Femvelle',
                'html_content': '''
                    <div class="greeting">Hello {user.first_name},</div>
                    
                    <div class="message">
                        Exciting news! Your order #{order.order_number} has been shipped and is on its way to you.
                    </div>
                    
                    {% if order.tracking_number %}
                    <div class="order-details">
                        <div class="order-header">Tracking Information</div>
                        <div class="order-info">
                            <span class="order-label">Tracking Number:</span>
                            <span class="order-value">{order.tracking_number}</span>
                        </div>
                    </div>
                    {% endif %}
                    
                    <div style="text-align: center;">
                        <a href="{site_url}/orders/{order.order_number}" class="button">Track Your Order</a>
                    </div>
                    
                    <div class="message">
                        You can expect to receive your package within the estimated delivery timeframe. 
                        We hope you love your new pieces!
                    </div>
                ''',
            },
            {
                'name': 'New Order Admin Alert',
                'template_type': 'new_order_admin',
                'subject': 'New Order #{order.order_number} - ${order.total}',
                'html_content': '''
                    <div class="greeting">New Order Alert</div>
                    
                    <div class="message">
                        A new order has been placed on Femvelle.
                    </div>
                    
                    <div class="order-details">
                        <div class="order-header">Order Information</div>
                        <div class="order-info">
                            <span class="order-label">Order Number:</span>
                            <span class="order-value">#{order.order_number}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Customer:</span>
                            <span class="order-value">{order.customer_name}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Email:</span>
                            <span class="order-value">{order.customer_email}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Order Date:</span>
                            <span class="order-value">{order.created_at}</span>
                        </div>
                        <div class="order-info total-row">
                            <span class="order-label">Total:</span>
                            <span class="order-value">${order.total}</span>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="{site_url}/admin/orders/order/{order.id}/" class="button">View in Admin</a>
                    </div>
                ''',
            },
            {
                'name': 'Low Stock Alert',
                'template_type': 'low_stock_admin',
                'subject': 'Low Stock Alert: {product.name} ({product.sku})',
                'html_content': '''
                    <div class="greeting">Low Stock Alert</div>
                    
                    <div class="message">
                        The following product variant is running low on stock and needs attention.
                    </div>
                    
                    <div class="order-details">
                        <div class="order-header">Product Information</div>
                        <div class="order-info">
                            <span class="order-label">Product:</span>
                            <span class="order-value">{product.name}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">SKU:</span>
                            <span class="order-value">{product.sku}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Size:</span>
                            <span class="order-value">{product.size}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Color:</span>
                            <span class="order-value">{product.color}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Current Stock:</span>
                            <span class="order-value" style="color: #DC2626; font-weight: bold;">{product.current_stock}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Threshold:</span>
                            <span class="order-value">{product.threshold}</span>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="{site_url}/admin/products/productvariant/" class="button">Manage Inventory</a>
                    </div>
                ''',
            },
        ]
        
        for template_data in templates:
            EmailTemplate.objects.get_or_create(
                template_type=template_data['template_type'],
                defaults=template_data
            )
        
        logger.info("Default email templates created/updated")