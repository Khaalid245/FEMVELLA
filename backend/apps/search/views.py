from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from .services import search_service
from .models import SearchQuery, SearchClick, SearchAnalytics
from .serializers import (
    AutocompleteParamsSerializer,
    PopularQueriesParamsSerializer,
    SearchAnalyticsDashboardParamsSerializer,
    SearchAnalyticsSerializer,
    SearchClickEventSerializer,
    SearchParamsSerializer,
    SimilarProductsParamsSerializer,
)
import logging

logger = logging.getLogger(__name__)


class SearchViewSet(viewsets.ViewSet):
    """
    Advanced search API with Elasticsearch
    """
    permission_classes = [AllowAny]
    throttle_scope = "search"

    def get_throttles(self):
        if getattr(self, "action", None) == "track_click":
            self.throttle_scope = "search_click"
        else:
            self.throttle_scope = "search"
        return super().get_throttles()

    def _query_data(self, request, list_fields=None):
        list_fields = set(list_fields or [])
        data = {}
        for key in request.query_params:
            if key in list_fields:
                data[key] = request.query_params.getlist(key)
            else:
                data[key] = request.query_params.get(key)
        return data
    
    def list(self, request):
        """
        Main search endpoint
        
        Query Parameters:
        - q: Search query
        - category: Filter by category slug
        - price_min, price_max: Price range filter
        - size: Filter by size
        - color: Filter by color
        - in_stock: Filter by availability (true/false)
        - featured: Filter featured products (true/false)
        - new: Filter new arrivals (true/false)
        - bestseller: Filter bestsellers (true/false)
        - on_sale: Filter products on sale (true/false)
        - sort: Sort order (price_asc, price_desc, name_asc, name_desc, newest, popularity)
        - page: Page number (default: 1)
        - page_size: Results per page (default: 20, max: 100)
        """
        
        params = SearchParamsSerializer(
            data=self._query_data(request, list_fields={"category", "size", "color"})
        )
        params.is_valid(raise_exception=True)
        data = params.validated_data

        query = data.get("q", "")
        page = data["page"]
        page_size = data["page_size"]

        filters = {
            key: data[key]
            for key in (
                "category",
                "price_min",
                "price_max",
                "size",
                "color",
                "in_stock",
                "featured",
                "new",
                "bestseller",
                "on_sale",
            )
            if key in data
        }
        sort = data.get("sort")

        try:
            results = search_service.search(
                query=query,
                filters=filters,
                sort=sort,
                page=page,
                page_size=page_size,
                user=request.user,
                track_search=True,
                request=request,
            )

            return Response(results)

        except Exception:
            logger.exception("Search API error")
            return Response(
                {'error': 'Search service temporarily unavailable'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
    
    @action(detail=False, methods=['get'])
    def autocomplete(self, request):
        """
        Autocomplete suggestions endpoint
        
        Query Parameters:
        - q: Search query (minimum 2 characters)
        - limit: Maximum suggestions (default: 10, max: 20)
        """
        
        params = AutocompleteParamsSerializer(data=self._query_data(request))
        params.is_valid(raise_exception=True)
        query = params.validated_data["q"]
        limit = params.validated_data["limit"]
        
        try:
            suggestions = search_service.autocomplete(query, limit)
            return Response({'suggestions': suggestions})
            
        except Exception:
            logger.exception("Autocomplete API error")
            return Response({'suggestions': []})
    
    @action(detail=False, methods=['get'])
    def similar(self, request):
        """
        Get similar products
        
        Query Parameters:
        - product_id: Product ID to find similar products for
        - limit: Maximum results (default: 6, max: 12)
        """
        
        params = SimilarProductsParamsSerializer(data=self._query_data(request))
        params.is_valid(raise_exception=True)
        product_id = params.validated_data["product_id"]
        limit = params.validated_data["limit"]
        
        try:
            similar_products = search_service.get_similar_products(product_id, limit, request=request)
            return Response({'products': similar_products})
            
        except Exception:
            logger.exception("Similar products API error")
            return Response({'products': []})
    
    @action(detail=False, methods=['post'])
    def track_click(self, request):
        """
        Track search result click
        
        POST Data:
        - query: Search query that led to this click
        - product_id: ID of clicked product
        - position: Position in search results (optional)
        """
        
        serializer = SearchClickEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        try:
            search_service.track_click(
                query=data["query"],
                product_id=data["product"].id,
                user=request.user,
                position=data.get("position"),
                request=request,
            )
            return Response({'status': 'tracked'})
            
        except Exception:
            logger.exception("Click tracking error")
            return Response({'status': 'error'})
    
    @action(detail=False, methods=['get'])
    def popular_queries(self, request):
        params = PopularQueriesParamsSerializer(data=self._query_data(request))
        params.is_valid(raise_exception=True)
        limit = params.validated_data["limit"]
        days = params.validated_data["days"]
        
        try:
            from django.utils import timezone
            from datetime import timedelta
            from django.db.models import Count
            
            since_date = timezone.now() - timedelta(days=days)
            
            popular_queries = SearchQuery.objects.filter(
                created_at__gte=since_date,
                result_count__gt=0
            ).values('query').annotate(
                search_count=Count('id')
            ).order_by('-search_count')[:limit]
            
            return Response({
                'queries': [
                    {
                        'query': item['query'],
                        'count': item['search_count']
                    }
                    for item in popular_queries
                ]
            })
            
        except Exception:
            logger.exception("Popular queries error")
            return Response({'queries': []})

    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Return trending search queries."""
        try:
            limit = int(request.query_params.get('limit', 8))
            queries = search_service.get_trending(limit=limit)
            return Response({'queries': queries})
        except Exception:
            logger.exception("Trending queries error")
            return Response({'queries': []})

    @action(detail=False, methods=['get'])
    def recently_viewed(self, request):
        """Return recently viewed products for the current session."""
        try:
            session_key = request.session.session_key or request.META.get('HTTP_X_SESSION_ID', '')
            if not session_key:
                return Response({'products': []})
            products = search_service.get_recently_viewed(session_key)
            return Response({'products': products})
        except Exception:
            logger.exception("Recently viewed error")
            return Response({'products': []})

    @action(detail=False, methods=['post'])
    def record_view(self, request):
        """Record a product view for recently-viewed tracking."""
        try:
            product_id = int(request.data.get('product_id', 0))
            session_key = request.session.session_key or request.META.get('HTTP_X_SESSION_ID', '')
            if product_id and session_key:
                if not request.session.session_key:
                    request.session.create()
                search_service.record_product_view(session_key, product_id)
            return Response({'status': 'ok'})
        except Exception:
            logger.exception("Record view error")
            return Response({'status': 'error'})


class SearchAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Search analytics for admin users
    """
    queryset = SearchAnalytics.objects.all()
    serializer_class = SearchAnalyticsSerializer
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Search analytics dashboard data
        """
        
        try:
            from django.utils import timezone
            from datetime import timedelta
            from django.db.models import Count, Avg, Q
            
            params = SearchAnalyticsDashboardParamsSerializer(data=request.query_params)
            params.is_valid(raise_exception=True)
            days = params.validated_data["days"]
            since_date = timezone.now() - timedelta(days=days)
            
            # Basic metrics
            total_searches = SearchQuery.objects.filter(
                created_at__gte=since_date
            ).count()
            
            unique_queries = SearchQuery.objects.filter(
                created_at__gte=since_date
            ).values('query').distinct().count()
            
            zero_result_searches = SearchQuery.objects.filter(
                created_at__gte=since_date,
                result_count=0
            ).count()
            
            avg_results = SearchQuery.objects.filter(
                created_at__gte=since_date
            ).aggregate(avg=Avg('result_count'))['avg'] or 0
            
            # Click-through rate
            total_clicks = SearchClick.objects.filter(
                created_at__gte=since_date
            ).count()
            
            ctr = (total_clicks / total_searches * 100) if total_searches > 0 else 0
            
            # Top queries with no results
            zero_result_queries = SearchQuery.objects.filter(
                created_at__gte=since_date,
                result_count=0
            ).values('query').annotate(
                count=Count('id')
            ).order_by('-count')[:10]
            
            # Most clicked products
            top_clicked_products = SearchClick.objects.filter(
                created_at__gte=since_date
            ).values(
                'product__name', 'product__slug'
            ).annotate(
                click_count=Count('id')
            ).order_by('-click_count')[:10]
            
            return Response({
                'period_days': days,
                'metrics': {
                    'total_searches': total_searches,
                    'unique_queries': unique_queries,
                    'zero_result_searches': zero_result_searches,
                    'zero_result_rate': (zero_result_searches / total_searches * 100) if total_searches > 0 else 0,
                    'avg_results_per_search': round(avg_results, 1),
                    'total_clicks': total_clicks,
                    'click_through_rate': round(ctr, 2),
                },
                'zero_result_queries': [
                    {'query': item['query'], 'count': item['count']}
                    for item in zero_result_queries
                ],
                'top_clicked_products': [
                    {
                        'name': item['product__name'],
                        'slug': item['product__slug'],
                        'clicks': item['click_count']
                    }
                    for item in top_clicked_products
                ]
            })
            
        except Exception:
            logger.exception("Analytics dashboard error")
            return Response({'error': 'Analytics temporarily unavailable'})
