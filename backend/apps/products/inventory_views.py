from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Product, ProductVariant
from .inventory import InventoryService
from .serializers import ProductVariantSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_availability(request, product_id):
    """
    Get availability matrix for a product's variants
    """
    try:
        product = get_object_or_404(Product, id=product_id, is_active=True)
        availability = InventoryService.get_variant_availability(product_id)
        
        return Response({
            'product_id': product_id,
            'product_name': product.name,
            'availability': availability
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_variant_availability(request):
    """
    Check if specific variants are available for given quantities
    Payload: [{'variant_id': int, 'quantity': int}, ...]
    """
    try:
        items = request.data.get('items', [])
        if not items:
            return Response(
                {'error': 'Items list is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = []
        for item in items:
            variant_id = item.get('variant_id')
            quantity = item.get('quantity', 1)
            
            try:
                variant = ProductVariant.objects.get(id=variant_id, is_active=True)
                available = variant.available_stock >= quantity
                
                results.append({
                    'variant_id': variant_id,
                    'sku': variant.sku,
                    'requested_quantity': quantity,
                    'available_stock': variant.available_stock,
                    'is_available': available,
                    'stock_status': variant.stock_status
                })
            except ProductVariant.DoesNotExist:
                results.append({
                    'variant_id': variant_id,
                    'error': 'Variant not found or inactive'
                })
        
        return Response({'results': results})
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAdminUser])
def reserve_stock(request):
    """
    Reserve stock for variants (admin only)
    Payload: [{'variant_id': int, 'quantity': int}, ...]
    """
    try:
        reservations = request.data.get('reservations', [])
        if not reservations:
            return Response(
                {'error': 'Reservations list is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use bulk reservation for atomic operation
        InventoryService.bulk_reserve_stock(reservations)
        
        return Response({
            'message': f'Successfully reserved stock for {len(reservations)} variants',
            'reservations': reservations
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAdminUser])
def low_stock_report(request):
    """
    Get report of variants with low stock (admin only)
    """
    try:
        threshold = request.GET.get('threshold')
        if threshold:
            threshold = int(threshold)
        
        low_stock_variants = InventoryService.get_low_stock_variants(threshold)
        
        return Response({
            'count': len(low_stock_variants),
            'variants': low_stock_variants
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAdminUser])
def update_variant_stock(request, variant_id):
    """
    Update variant stock (admin only)
    Payload: {'action': 'add'|'set', 'quantity': int}
    """
    try:
        variant = get_object_or_404(ProductVariant, id=variant_id)
        action = request.data.get('action')
        quantity = request.data.get('quantity')
        
        if not action or quantity is None:
            return Response(
                {'error': 'Action and quantity are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if action == 'add':
            variant.add_stock(quantity)
        elif action == 'set':
            variant.stock = quantity
            variant.save(update_fields=['stock', 'updated_at'])
        else:
            return Response(
                {'error': 'Invalid action. Use "add" or "set"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ProductVariantSerializer(variant)
        return Response({
            'message': f'Stock updated for variant {variant.sku}',
            'variant': serializer.data
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )