from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .services import AnalyticsService
from .models import AnalyticsEvent, AbandonedCart
from django.db.models import Count, Sum, Avg
from django.http import JsonResponse
import json

class DashboardOverviewView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get dashboard overview data"""
        analytics_service = AnalyticsService()
        days = int(request.query_params.get('days', 30))
        
        # Get key metrics
        revenue_data = analytics_service.get_revenue_trends(days)
        top_products = analytics_service.get_top_products(days, 5)
        customer_segments = analytics_service.get_customer_segments()
        conversion_funnel = analytics_service.get_conversion_funnel(days)
        abandoned_carts = analytics_service.get_abandoned_carts(days)
        
        return Response({
            'revenue': revenue_data,
            'top_products': top_products,
            'customer_segments': customer_segments,
            'conversion_funnel': conversion_funnel,
            'abandoned_carts': abandoned_carts['summary'],
            'period': f'{days} days'
        })

class RevenueAnalyticsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get detailed revenue analytics"""
        analytics_service = AnalyticsService()
        days = int(request.query_params.get('days', 30))
        
        revenue_data = analytics_service.get_revenue_trends(days)
        
        # Add additional revenue insights
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Revenue by category (from product analytics)
        from .models import ProductAnalytics
        category_revenue = ProductAnalytics.objects.filter(
            date__range=[start_date, end_date]
        ).values('category_name').annotate(
            total_revenue=Sum('revenue'),
            total_units=Sum('units_sold')
        ).order_by('-total_revenue')
        
        # Revenue by day of week
        from django.db.models import Extract
        from .models import RevenueMetrics
        dow_revenue = RevenueMetrics.objects.filter(
            date__range=[start_date, end_date]
        ).annotate(
            day_of_week=Extract('date', 'week_day')
        ).values('day_of_week').annotate(
            avg_revenue=Avg('total_revenue'),
            avg_orders=Avg('total_orders')
        ).order_by('day_of_week')
        
        return Response({
            **revenue_data,
            'category_breakdown': [
                {
                    'category': cat['category_name'],
                    'revenue': float(cat['total_revenue']),
                    'units': cat['total_units']
                }
                for cat in category_revenue
            ],
            'day_of_week_analysis': [
                {
                    'day': day['day_of_week'],
                    'avg_revenue': float(day['avg_revenue'] or 0),
                    'avg_orders': float(day['avg_orders'] or 0)
                }
                for day in dow_revenue
            ]
        })

class ProductAnalyticsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get product performance analytics"""
        analytics_service = AnalyticsService()
        days = int(request.query_params.get('days', 30))
        limit = int(request.query_params.get('limit', 20))
        
        top_products = analytics_service.get_top_products(days, limit)
        
        # Get product performance trends
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        from .models import ProductAnalytics
        
        # Products with highest conversion rates
        top_converting = ProductAnalytics.objects.filter(
            date__range=[start_date, end_date]
        ).values('product_id', 'product_name').annotate(
            avg_conversion=Avg('cart_to_purchase_rate'),
            total_views=Sum('page_views'),
            total_revenue=Sum('revenue')
        ).filter(total_views__gte=10).order_by('-avg_conversion')[:10]
        
        # Products with most views but low conversion
        low_converting = ProductAnalytics.objects.filter(
            date__range=[start_date, end_date]
        ).values('product_id', 'product_name').annotate(
            avg_conversion=Avg('cart_to_purchase_rate'),
            total_views=Sum('page_views'),
            total_revenue=Sum('revenue')
        ).filter(total_views__gte=50).order_by('avg_conversion')[:10]
        
        return Response({
            'top_products': top_products,
            'top_converting': [
                {
                    'product_id': p['product_id'],
                    'name': p['product_name'],
                    'conversion_rate': float(p['avg_conversion'] or 0),
                    'views': p['total_views'],
                    'revenue': float(p['total_revenue'] or 0)
                }
                for p in top_converting
            ],
            'low_converting': [
                {
                    'product_id': p['product_id'],
                    'name': p['product_name'],
                    'conversion_rate': float(p['avg_conversion'] or 0),
                    'views': p['total_views'],
                    'revenue': float(p['total_revenue'] or 0)
                }
                for p in low_converting
            ]
        })

class CustomerAnalyticsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get customer analytics data"""
        analytics_service = AnalyticsService()
        
        customer_segments = analytics_service.get_customer_segments()
        
        # Additional customer insights
        from .models import CustomerAnalytics
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Customer lifetime value distribution
        ltv_distribution = CustomerAnalytics.objects.values('total_spent').annotate(
            count=Count('id')
        ).order_by('total_spent')
        
        # New vs returning customer trends
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)
        
        from .models import RevenueMetrics
        customer_trends = RevenueMetrics.objects.filter(
            date__range=[start_date, end_date]
        ).values('date', 'new_customers', 'returning_customers').order_by('date')
        
        # Top customers by value
        top_customers = CustomerAnalytics.objects.select_related('user').order_by('-total_spent')[:10]
        
        return Response({
            **customer_segments,
            'ltv_distribution': [
                {
                    'ltv_range': f"${int(item['total_spent'])}-${int(item['total_spent']) + 100}",
                    'count': item['count']
                }
                for item in ltv_distribution
            ],
            'customer_trends': [
                {
                    'date': trend['date'].isoformat(),
                    'new_customers': trend['new_customers'],
                    'returning_customers': trend['returning_customers']
                }
                for trend in customer_trends
            ],
            'top_customers': [
                {
                    'user_id': customer.user.id,
                    'email': customer.user.email,
                    'total_spent': float(customer.total_spent),
                    'total_orders': customer.total_orders,
                    'avg_order_value': float(customer.average_order_value),
                    'segment': customer.customer_segment
                }
                for customer in top_customers
            ]
        })

class ConversionAnalyticsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get conversion funnel analytics"""
        analytics_service = AnalyticsService()
        days = int(request.query_params.get('days', 30))
        
        funnel_data = analytics_service.get_conversion_funnel(days)
        
        # Get conversion trends over time
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        from .models import ConversionFunnel
        daily_conversions = ConversionFunnel.objects.filter(
            date__range=[start_date, end_date]
        ).order_by('date')
        
        return Response({
            **funnel_data,
            'daily_trends': [
                {
                    'date': day.date.isoformat(),
                    'visitors': day.visitors,
                    'conversion_rate': float(day.overall_conversion_rate),
                    'product_views': day.product_views,
                    'add_to_cart': day.add_to_cart,
                    'checkout_complete': day.checkout_complete
                }
                for day in daily_conversions
            ]
        })

class AbandonedCartAnalyticsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get abandoned cart analytics"""
        analytics_service = AnalyticsService()
        days = int(request.query_params.get('days', 30))
        
        abandoned_data = analytics_service.get_abandoned_carts(days)
        
        # Additional abandoned cart insights
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Abandonment by hour of day
        from django.db.models import Extract
        hourly_abandonment = AbandonedCart.objects.filter(
            abandoned_at__range=[start_date, end_date]
        ).annotate(
            hour=Extract('abandoned_at', 'hour')
        ).values('hour').annotate(
            count=Count('id'),
            avg_value=Avg('total_value')
        ).order_by('hour')
        
        # Recovery email effectiveness
        recovery_stats = AbandonedCart.objects.filter(
            abandoned_at__range=[start_date, end_date],
            recovery_email_sent=True
        ).aggregate(
            emails_sent=Count('id'),
            recovered_after_email=Count('id', filter=models.Q(recovered=True))
        )
        
        return Response({
            **abandoned_data,
            'hourly_abandonment': [
                {
                    'hour': item['hour'],
                    'count': item['count'],
                    'avg_value': float(item['avg_value'] or 0)
                }
                for item in hourly_abandonment
            ],
            'recovery_email_stats': {
                'emails_sent': recovery_stats['emails_sent'] or 0,
                'recovered_after_email': recovery_stats['recovered_after_email'] or 0,
                'email_recovery_rate': round(
                    (recovery_stats['recovered_after_email'] or 0) / 
                    (recovery_stats['emails_sent'] or 1) * 100, 2
                )
            }
        })

class SearchAnalyticsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get search analytics data"""
        analytics_service = AnalyticsService()
        days = int(request.query_params.get('days', 30))
        
        return Response(analytics_service.get_search_analytics(days))

class TrackEventView(APIView):
    """Public endpoint for tracking analytics events"""
    
    def post(self, request):
        """Track an analytics event"""
        try:
            data = request.data
            analytics_service = AnalyticsService()
            
            event = analytics_service.track_event(
                event_type=data.get('event_type'),
                session_id=data.get('session_id'),
                user=request.user if request.user.is_authenticated else None,
                page_url=data.get('page_url', ''),
                referrer=data.get('referrer', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                ip_address=self._get_client_ip(request),
                product_id=data.get('product_id'),
                product_name=data.get('product_name', ''),
                product_price=data.get('product_price'),
                category_name=data.get('category_name', ''),
                metadata=data.get('metadata', {})
            )
            
            return Response({'success': True, 'event_id': str(event.id)})
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class RealTimeMetricsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get real-time metrics for dashboard"""
        # Current day metrics
        today = timezone.now().date()
        
        # Today's events
        today_events = AnalyticsEvent.objects.filter(timestamp__date=today)
        
        # Real-time counters
        metrics = {
            'active_sessions': today_events.filter(
                timestamp__gte=timezone.now() - timedelta(minutes=30)
            ).values('session_id').distinct().count(),
            
            'today_visitors': today_events.filter(
                event_type='page_view'
            ).values('session_id').distinct().count(),
            
            'today_orders': today_events.filter(
                event_type='checkout_complete'
            ).count(),
            
            'today_revenue': 0,  # Would need to calculate from orders
            
            'current_cart_abandonment': AbandonedCart.objects.filter(
                abandoned_at__date=today
            ).count(),
            
            'top_pages_today': list(
                today_events.filter(event_type='page_view')
                .values('page_url')
                .annotate(views=Count('id'))
                .order_by('-views')[:5]
            )
        }
        
        return Response(metrics)