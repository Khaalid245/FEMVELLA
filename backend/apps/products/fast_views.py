from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import connection
from .models import Product
from .fast_serializers import FastProductSerializer

@api_view(['GET'])
def fast_product_detail(request, slug):
    """Ultra-fast product detail endpoint with minimal queries"""
    try:
        # Single optimized query
        product = Product.objects.select_related('category').prefetch_related(
            'images', 'variants'
        ).get(slug=slug, is_active=True)
        
        serializer = FastProductSerializer(product, context={'request': request})
        
        # Add debug info in development
        if request.GET.get('debug'):
            query_count = len(connection.queries)
            return Response({
                'product': serializer.data,
                'debug': {
                    'query_count': query_count,
                    'queries': connection.queries[-query_count:] if query_count > 0 else []
                }
            })
        
        return Response(serializer.data)
        
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )