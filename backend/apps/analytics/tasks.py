from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .services import AnalyticsService
from .models import AbandonedCart, AnalyticsEvent
from apps.orders.models import Order
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

@shared_task
def update_daily_analytics():
    """Update daily analytics metrics"""
    try:
        analytics_service = AnalyticsService()
        yesterday = timezone.now().date() - timedelta(days=1)
        
        logger.info(f"Updating analytics for {yesterday}")
        analytics_service.update_daily_metrics(yesterday)
        
        logger.info("Daily analytics update completed successfully")
        return f"Analytics updated for {yesterday}"
        
    except Exception as e:
        logger.error(f"Error updating daily analytics: {str(e)}")
        raise

@shared_task
def process_abandoned_carts():
    """Process and identify abandoned carts"""
    try:
        # Find sessions with add_to_cart events but no checkout_complete in last 2 hours
        cutoff_time = timezone.now() - timedelta(hours=2)
        
        # Get sessions with cart activity but no completion
        cart_sessions = AnalyticsEvent.objects.filter(
            event_type='add_to_cart',
            timestamp__gte=timezone.now() - timedelta(hours=24),
            timestamp__lte=cutoff_time
        ).values('session_id', 'user').distinct()
        
        abandoned_count = 0
        
        for session_data in cart_sessions:
            session_id = session_data['session_id']
            user_id = session_data['user']
            
            # Check if this session completed checkout
            completed = AnalyticsEvent.objects.filter(
                session_id=session_id,
                event_type='checkout_complete',
                timestamp__gte=cutoff_time
            ).exists()
            
            if not completed:
                # Check if already recorded as abandoned
                if not AbandonedCart.objects.filter(session_id=session_id).exists():
                    # Get cart details from events
                    cart_events = AnalyticsEvent.objects.filter(
                        session_id=session_id,
                        event_type='add_to_cart'
                    ).order_by('timestamp')
                    
                    if cart_events.exists():
                        # Calculate cart value and items
                        total_value = sum(
                            float(event.product_price or 0) 
                            for event in cart_events 
                            if event.product_price
                        )
                        
                        items = [
                            {
                                'product_id': event.product_id,
                                'product_name': event.product_name,
                                'price': float(event.product_price or 0)
                            }
                            for event in cart_events
                        ]
                        
                        # Create abandoned cart record
                        user = None
                        if user_id:
                            try:
                                user = User.objects.get(id=user_id)
                            except User.DoesNotExist:
                                pass
                        
                        first_event = cart_events.first()
                        last_event = cart_events.last()
                        
                        AbandonedCart.objects.create(
                            session_id=session_id,
                            user=user,
                            items=items,
                            total_value=total_value,
                            item_count=len(items),
                            created_at=first_event.timestamp,
                            last_updated=last_event.timestamp,
                            time_spent_minutes=int(
                                (last_event.timestamp - first_event.timestamp).total_seconds() / 60
                            )
                        )
                        
                        abandoned_count += 1
        
        logger.info(f"Processed {abandoned_count} abandoned carts")
        return f"Processed {abandoned_count} abandoned carts"
        
    except Exception as e:
        logger.error(f"Error processing abandoned carts: {str(e)}")
        raise

@shared_task
def send_cart_recovery_emails():
    """Send recovery emails for abandoned carts"""
    try:
        # Get abandoned carts from 1-24 hours ago that haven't had recovery emails sent
        start_time = timezone.now() - timedelta(hours=24)
        end_time = timezone.now() - timedelta(hours=1)
        
        abandoned_carts = AbandonedCart.objects.filter(
            abandoned_at__range=[start_time, end_time],
            recovery_email_sent=False,
            user__isnull=False,  # Only send to registered users
            recovered=False
        )
        
        emails_sent = 0
        
        for cart in abandoned_carts:
            try:
                # Import here to avoid circular imports
                from apps.emails.services import EmailService
                
                email_service = EmailService()
                email_service.send_cart_recovery_email(cart)
                
                # Mark as sent
                cart.recovery_email_sent = True
                cart.recovery_email_sent_at = timezone.now()
                cart.save()
                
                emails_sent += 1
                
            except Exception as e:
                logger.error(f"Error sending recovery email for cart {cart.id}: {str(e)}")
                continue
        
        logger.info(f"Sent {emails_sent} cart recovery emails")
        return f"Sent {emails_sent} cart recovery emails"
        
    except Exception as e:
        logger.error(f"Error sending cart recovery emails: {str(e)}")
        raise

@shared_task
def update_customer_segments():
    """Update customer segmentation"""
    try:
        analytics_service = AnalyticsService()
        analytics_service._update_customer_analytics()
        
        logger.info("Customer segments updated successfully")
        return "Customer segments updated"
        
    except Exception as e:
        logger.error(f"Error updating customer segments: {str(e)}")
        raise

@shared_task
def cleanup_old_events():
    """Clean up old analytics events (keep last 90 days)"""
    try:
        cutoff_date = timezone.now() - timedelta(days=90)
        
        deleted_count = AnalyticsEvent.objects.filter(
            timestamp__lt=cutoff_date
        ).delete()[0]
        
        logger.info(f"Cleaned up {deleted_count} old analytics events")
        return f"Cleaned up {deleted_count} old events"
        
    except Exception as e:
        logger.error(f"Error cleaning up old events: {str(e)}")
        raise

@shared_task
def generate_weekly_report():
    """Generate weekly analytics report"""
    try:
        analytics_service = AnalyticsService()
        
        # Get last 7 days data
        revenue_data = analytics_service.get_revenue_trends(7)
        top_products = analytics_service.get_top_products(7, 10)
        conversion_data = analytics_service.get_conversion_funnel(7)
        abandoned_data = analytics_service.get_abandoned_carts(7)
        
        # Prepare report data
        report_data = {
            'period': 'Last 7 days',
            'revenue': revenue_data['summary'],
            'top_products': top_products[:5],
            'conversion_rate': conversion_data['conversion_rates']['overall_conversion'],
            'abandoned_carts': abandoned_data['summary']
        }
        
        # Send report email to admins
        from apps.emails.services import EmailService
        email_service = EmailService()
        
        # Get admin users
        admin_users = User.objects.filter(is_staff=True, is_active=True)
        
        for admin in admin_users:
            email_service.send_weekly_analytics_report(admin, report_data)
        
        logger.info(f"Weekly report sent to {admin_users.count()} admins")
        return f"Weekly report sent to {admin_users.count()} admins"
        
    except Exception as e:
        logger.error(f"Error generating weekly report: {str(e)}")
        raise

@shared_task
def update_search_analytics():
    """Update search analytics from events"""
    try:
        # Get yesterday's search events
        yesterday = timezone.now().date() - timedelta(days=1)
        
        search_events = AnalyticsEvent.objects.filter(
            timestamp__date=yesterday,
            event_type='search'
        )
        
        # Group by search query
        from django.db.models import Count
        search_queries = search_events.values('metadata__query').annotate(
            search_count=Count('id')
        )
        
        from .models import SearchAnalytics
        
        for query_data in search_queries:
            query = query_data['metadata__query']
            if not query:
                continue
                
            search_count = query_data['search_count']
            
            # Calculate results count (would need to implement search result tracking)
            results_count = 0  # Placeholder
            
            # Calculate conversions (purchases after search)
            conversions = 0  # Would need to track search -> purchase flow
            
            SearchAnalytics.objects.update_or_create(
                query=query,
                date=yesterday,
                defaults={
                    'search_count': search_count,
                    'results_count': results_count,
                    'conversions': conversions,
                    'conversion_rate': (conversions / search_count * 100) if search_count > 0 else 0
                }
            )
        
        logger.info(f"Updated search analytics for {len(search_queries)} queries")
        return f"Updated search analytics for {len(search_queries)} queries"
        
    except Exception as e:
        logger.error(f"Error updating search analytics: {str(e)}")
        raise