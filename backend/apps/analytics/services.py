from django.db.models import Sum, Count, Avg, F, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Any
from .models import (
    AnalyticsEvent, RevenueMetrics, ProductAnalytics, 
    CustomerAnalytics, ConversionFunnel, AbandonedCart, SearchAnalytics
)
from apps.orders.models import Order, OrderItem
from apps.products.models import Product
from django.contrib.auth import get_user_model

User = get_user_model()

class AnalyticsService:
    
    def track_event(self, event_type: str, session_id: str, user=None, **kwargs):
        """Track analytics event"""
        return AnalyticsEvent.objects.create(
            event_type=event_type,
            session_id=session_id,
            user=user,
            **kwargs
        )
    
    def get_revenue_trends(self, days: int = 30) -> Dict[str, Any]:
        """Get revenue trends for specified period"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        metrics = RevenueMetrics.objects.filter(
            date__range=[start_date, end_date]
        ).order_by('date')
        
        # Calculate trends
        current_period = metrics.filter(date__gte=end_date - timedelta(days=days//2))
        previous_period = metrics.filter(
            date__lt=end_date - timedelta(days=days//2),
            date__gte=start_date
        )
        
        current_revenue = current_period.aggregate(
            total=Sum('total_revenue')
        )['total'] or Decimal('0')
        
        previous_revenue = previous_period.aggregate(
            total=Sum('total_revenue')
        )['total'] or Decimal('0')
        
        growth_rate = 0
        if previous_revenue > 0:
            growth_rate = float((current_revenue - previous_revenue) / previous_revenue * 100)
        
        return {
            'daily_data': [
                {
                    'date': metric.date.isoformat(),
                    'revenue': float(metric.total_revenue),
                    'orders': metric.total_orders,
                    'aov': float(metric.average_order_value),
                    'conversion_rate': float(metric.conversion_rate)
                }
                for metric in metrics
            ],
            'summary': {
                'total_revenue': float(current_revenue),
                'growth_rate': growth_rate,
                'total_orders': current_period.aggregate(Sum('total_orders'))['total_orders__sum'] or 0,
                'average_order_value': float(current_period.aggregate(Avg('average_order_value'))['average_order_value__avg'] or 0)
            }
        }
    
    def get_top_products(self, days: int = 30, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top-selling products"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        products = ProductAnalytics.objects.filter(
            date__range=[start_date, end_date]
        ).values('product_id', 'product_name', 'category_name').annotate(
            total_revenue=Sum('revenue'),
            total_units=Sum('units_sold'),
            total_views=Sum('page_views'),
            conversion_rate=Avg('cart_to_purchase_rate')
        ).order_by('-total_revenue')[:limit]
        
        return [
            {
                'product_id': product['product_id'],
                'name': product['product_name'],
                'category': product['category_name'],
                'revenue': float(product['total_revenue']),
                'units_sold': product['total_units'],
                'views': product['total_views'],
                'conversion_rate': float(product['conversion_rate'] or 0)
            }
            for product in products
        ]
    
    def get_customer_segments(self) -> Dict[str, Any]:
        """Get customer segmentation data"""
        segments = CustomerAnalytics.objects.values('customer_segment').annotate(
            count=Count('id'),
            total_revenue=Sum('total_spent'),
            avg_order_value=Avg('average_order_value')
        )
        
        total_customers = CustomerAnalytics.objects.count()
        
        return {
            'segments': [
                {
                    'segment': segment['customer_segment'],
                    'count': segment['count'],
                    'percentage': round(segment['count'] / total_customers * 100, 2) if total_customers > 0 else 0,
                    'revenue': float(segment['total_revenue'] or 0),
                    'avg_order_value': float(segment['avg_order_value'] or 0)
                }
                for segment in segments
            ],
            'total_customers': total_customers
        }
    
    def get_conversion_funnel(self, days: int = 30) -> Dict[str, Any]:
        """Get conversion funnel data"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        funnel_data = ConversionFunnel.objects.filter(
            date__range=[start_date, end_date]
        ).aggregate(
            visitors=Sum('visitors'),
            product_views=Sum('product_views'),
            add_to_cart=Sum('add_to_cart'),
            checkout_start=Sum('checkout_start'),
            checkout_complete=Sum('checkout_complete')
        )
        
        visitors = funnel_data['visitors'] or 0
        
        # Calculate conversion rates
        rates = {}
        if visitors > 0:
            rates = {
                'visitor_to_view': round((funnel_data['product_views'] or 0) / visitors * 100, 2),
                'view_to_cart': round((funnel_data['add_to_cart'] or 0) / (funnel_data['product_views'] or 1) * 100, 2),
                'cart_to_checkout': round((funnel_data['checkout_start'] or 0) / (funnel_data['add_to_cart'] or 1) * 100, 2),
                'checkout_to_purchase': round((funnel_data['checkout_complete'] or 0) / (funnel_data['checkout_start'] or 1) * 100, 2),
                'overall_conversion': round((funnel_data['checkout_complete'] or 0) / visitors * 100, 2)
            }
        
        return {
            'funnel_data': funnel_data,
            'conversion_rates': rates
        }
    
    def get_abandoned_carts(self, days: int = 30) -> Dict[str, Any]:
        """Get abandoned cart analytics"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        abandoned_carts = AbandonedCart.objects.filter(
            abandoned_at__range=[start_date, end_date]
        )
        
        total_abandoned = abandoned_carts.count()
        recovered_carts = abandoned_carts.filter(recovered=True).count()
        
        # Calculate metrics
        total_value = abandoned_carts.aggregate(
            total=Sum('total_value')
        )['total'] or Decimal('0')
        
        recovered_value = abandoned_carts.filter(recovered=True).aggregate(
            total=Sum('total_value')
        )['total'] or Decimal('0')
        
        recovery_rate = 0
        if total_abandoned > 0:
            recovery_rate = round(recovered_carts / total_abandoned * 100, 2)
        
        # Get abandonment reasons (time-based analysis)
        abandonment_analysis = abandoned_carts.values('time_spent_minutes').annotate(
            count=Count('id')
        ).order_by('time_spent_minutes')
        
        return {
            'summary': {
                'total_abandoned': total_abandoned,
                'recovered_carts': recovered_carts,
                'recovery_rate': recovery_rate,
                'total_value': float(total_value),
                'recovered_value': float(recovered_value),
                'lost_revenue': float(total_value - recovered_value)
            },
            'abandonment_analysis': list(abandonment_analysis),
            'recent_carts': [
                {
                    'id': cart.id,
                    'user_email': cart.user.email if cart.user else 'Anonymous',
                    'total_value': float(cart.total_value),
                    'item_count': cart.item_count,
                    'abandoned_at': cart.abandoned_at.isoformat(),
                    'recovered': cart.recovered,
                    'recovery_email_sent': cart.recovery_email_sent
                }
                for cart in abandoned_carts.order_by('-abandoned_at')[:10]
            ]
        }
    
    def get_search_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get search analytics data"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        search_data = SearchAnalytics.objects.filter(
            date__range=[start_date, end_date]
        )
        
        # Top searches
        top_searches = search_data.values('query').annotate(
            total_searches=Sum('search_count'),
            avg_results=Avg('results_count'),
            total_conversions=Sum('conversions'),
            total_revenue=Sum('revenue')
        ).order_by('-total_searches')[:10]
        
        # Zero result searches
        zero_results = search_data.filter(results_count=0).values('query').annotate(
            search_count=Sum('search_count')
        ).order_by('-search_count')[:10]
        
        return {
            'top_searches': [
                {
                    'query': search['query'],
                    'searches': search['total_searches'],
                    'avg_results': round(search['avg_results'] or 0, 1),
                    'conversions': search['total_conversions'],
                    'revenue': float(search['total_revenue'] or 0)
                }
                for search in top_searches
            ],
            'zero_results': list(zero_results),
            'summary': {
                'total_searches': search_data.aggregate(Sum('search_count'))['search_count__sum'] or 0,
                'avg_conversion_rate': search_data.aggregate(Avg('conversion_rate'))['conversion_rate__avg'] or 0,
                'total_search_revenue': float(search_data.aggregate(Sum('revenue'))['revenue__sum'] or 0)
            }
        }
    
    def update_daily_metrics(self, date=None):
        """Update daily metrics for specified date"""
        if date is None:
            date = timezone.now().date()
        
        # Update revenue metrics
        self._update_revenue_metrics(date)
        
        # Update product analytics
        self._update_product_analytics(date)
        
        # Update conversion funnel
        self._update_conversion_funnel(date)
        
        # Update customer analytics
        self._update_customer_analytics()
    
    def _update_revenue_metrics(self, date):
        """Update revenue metrics for date"""
        orders = Order.objects.filter(
            created_at__date=date,
            status__in=['confirmed', 'shipped', 'delivered']
        )
        
        total_revenue = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0')
        total_orders = orders.count()
        
        # Calculate other metrics
        new_customers = orders.filter(user__date_joined__date=date).count()
        returning_customers = total_orders - new_customers
        
        avg_order_value = total_revenue / total_orders if total_orders > 0 else Decimal('0')
        
        # Get visitor count from analytics events
        visitors = AnalyticsEvent.objects.filter(
            timestamp__date=date,
            event_type='page_view'
        ).values('session_id').distinct().count()
        
        conversion_rate = (total_orders / visitors * 100) if visitors > 0 else Decimal('0')
        
        RevenueMetrics.objects.update_or_create(
            date=date,
            defaults={
                'total_revenue': total_revenue,
                'gross_revenue': total_revenue,
                'net_revenue': total_revenue * Decimal('0.97'),  # Assuming 3% fees
                'total_orders': total_orders,
                'completed_orders': total_orders,
                'new_customers': new_customers,
                'returning_customers': returning_customers,
                'average_order_value': avg_order_value,
                'website_visitors': visitors,
                'conversion_rate': conversion_rate
            }
        )
    
    def _update_product_analytics(self, date):
        """Update product analytics for date"""
        # Get product events for the date
        product_events = AnalyticsEvent.objects.filter(
            timestamp__date=date,
            product_id__isnull=False
        )
        
        products = product_events.values('product_id', 'product_name', 'category_name').distinct()
        
        for product in products:
            product_id = product['product_id']
            
            # Calculate metrics
            page_views = product_events.filter(
                product_id=product_id,
                event_type='product_view'
            ).count()
            
            unique_views = product_events.filter(
                product_id=product_id,
                event_type='product_view'
            ).values('session_id').distinct().count()
            
            add_to_cart = product_events.filter(
                product_id=product_id,
                event_type='add_to_cart'
            ).count()
            
            # Get sales data
            sales_data = OrderItem.objects.filter(
                order__created_at__date=date,
                product_variant__product_id=product_id,
                order__status__in=['confirmed', 'shipped', 'delivered']
            ).aggregate(
                units_sold=Sum('quantity'),
                revenue=Sum(F('quantity') * F('price'))
            )
            
            units_sold = sales_data['units_sold'] or 0
            revenue = sales_data['revenue'] or Decimal('0')
            
            # Calculate conversion rates
            view_to_cart_rate = (add_to_cart / page_views * 100) if page_views > 0 else 0
            cart_to_purchase_rate = (units_sold / add_to_cart * 100) if add_to_cart > 0 else 0
            
            ProductAnalytics.objects.update_or_create(
                product_id=product_id,
                date=date,
                defaults={
                    'product_name': product['product_name'],
                    'category_name': product['category_name'],
                    'page_views': page_views,
                    'unique_views': unique_views,
                    'add_to_cart_count': add_to_cart,
                    'units_sold': units_sold,
                    'revenue': revenue,
                    'view_to_cart_rate': Decimal(str(view_to_cart_rate)),
                    'cart_to_purchase_rate': Decimal(str(cart_to_purchase_rate))
                }
            )
    
    def _update_conversion_funnel(self, date):
        """Update conversion funnel for date"""
        events = AnalyticsEvent.objects.filter(timestamp__date=date)
        
        visitors = events.filter(event_type='page_view').values('session_id').distinct().count()
        product_views = events.filter(event_type='product_view').count()
        add_to_cart = events.filter(event_type='add_to_cart').count()
        checkout_start = events.filter(event_type='checkout_start').count()
        checkout_complete = events.filter(event_type='checkout_complete').count()
        
        # Calculate rates
        visitor_to_view_rate = (product_views / visitors * 100) if visitors > 0 else 0
        view_to_cart_rate = (add_to_cart / product_views * 100) if product_views > 0 else 0
        cart_to_checkout_rate = (checkout_start / add_to_cart * 100) if add_to_cart > 0 else 0
        checkout_to_purchase_rate = (checkout_complete / checkout_start * 100) if checkout_start > 0 else 0
        overall_conversion_rate = (checkout_complete / visitors * 100) if visitors > 0 else 0
        
        ConversionFunnel.objects.update_or_create(
            date=date,
            defaults={
                'visitors': visitors,
                'product_views': product_views,
                'add_to_cart': add_to_cart,
                'checkout_start': checkout_start,
                'checkout_complete': checkout_complete,
                'visitor_to_view_rate': Decimal(str(visitor_to_view_rate)),
                'view_to_cart_rate': Decimal(str(view_to_cart_rate)),
                'cart_to_checkout_rate': Decimal(str(cart_to_checkout_rate)),
                'checkout_to_purchase_rate': Decimal(str(checkout_to_purchase_rate)),
                'overall_conversion_rate': Decimal(str(overall_conversion_rate))
            }
        )
    
    def _update_customer_analytics(self):
        """Update customer analytics for all users"""
        users = User.objects.all()
        
        for user in users:
            orders = Order.objects.filter(user=user, status__in=['confirmed', 'shipped', 'delivered'])
            
            total_orders = orders.count()
            total_spent = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0')
            avg_order_value = total_spent / total_orders if total_orders > 0 else Decimal('0')
            
            first_purchase = orders.order_by('created_at').first()
            last_purchase = orders.order_by('-created_at').first()
            
            # Calculate days since last purchase
            days_since_last = 0
            if last_purchase:
                days_since_last = (timezone.now().date() - last_purchase.created_at.date()).days
            
            # Determine customer segment
            segment = self._determine_customer_segment(total_orders, total_spent, days_since_last)
            
            CustomerAnalytics.objects.update_or_create(
                user=user,
                defaults={
                    'total_orders': total_orders,
                    'total_spent': total_spent,
                    'average_order_value': avg_order_value,
                    'first_purchase_date': first_purchase.created_at if first_purchase else None,
                    'last_purchase_date': last_purchase.created_at if last_purchase else None,
                    'days_since_last_purchase': days_since_last,
                    'customer_segment': segment
                }
            )
    
    def _determine_customer_segment(self, total_orders, total_spent, days_since_last):
        """Determine customer segment based on behavior"""
        if total_orders == 0:
            return 'new'
        elif total_spent > 1000:
            return 'vip'
        elif days_since_last > 90:
            return 'churned'
        elif days_since_last > 30:
            return 'at_risk'
        else:
            return 'active'