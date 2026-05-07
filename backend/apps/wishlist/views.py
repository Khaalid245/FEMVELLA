from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Wishlist, WishlistItem
from .serializers import (
    WishlistSerializer, 
    AddToWishlistSerializer, 
    RemoveFromWishlistSerializer
)
from apps.products.models import Product
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wishlist(request):
    """Get user's wishlist"""
    try:
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        serializer = WishlistSerializer(wishlist)
        
        return Response({
            'success': True,
            'wishlist': serializer.data,
        })
        
    except Exception as e:
        logger.error(f"Error getting wishlist for user {request.user.id}: {e}")
        return Response(
            {'error': 'Failed to retrieve wishlist'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_wishlist(request):
    """Add product to wishlist"""
    try:
        serializer = AddToWishlistSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        product_id = serializer.validated_data['product_id']
        product = get_object_or_404(Product, id=product_id, is_active=True)
        
        with transaction.atomic():
            wishlist, created = Wishlist.objects.get_or_create(user=request.user)
            
            # Check if already in wishlist
            if WishlistItem.objects.filter(wishlist=wishlist, product=product).exists():
                return Response(
                    {'error': 'Product already in wishlist'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add to wishlist
            wishlist_item = WishlistItem.objects.create(
                wishlist=wishlist,
                product=product
            )
            
            logger.info(f"Product {product_id} added to wishlist for user {request.user.id}")
            
            return Response({
                'success': True,
                'message': 'Product added to wishlist',
                'item_count': wishlist.item_count,
            })
            
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error adding to wishlist for user {request.user.id}: {e}")
        return Response(
            {'error': 'Failed to add product to wishlist'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_wishlist(request):
    """Remove product from wishlist"""
    try:
        serializer = RemoveFromWishlistSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        product_id = serializer.validated_data['product_id']
        
        with transaction.atomic():
            wishlist = get_object_or_404(Wishlist, user=request.user)
            wishlist_item = get_object_or_404(
                WishlistItem, 
                wishlist=wishlist, 
                product_id=product_id
            )
            
            wishlist_item.delete()
            
            logger.info(f"Product {product_id} removed from wishlist for user {request.user.id}")
            
            return Response({
                'success': True,
                'message': 'Product removed from wishlist',
                'item_count': wishlist.item_count,
            })
            
    except Wishlist.DoesNotExist:
        return Response(
            {'error': 'Wishlist not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except WishlistItem.DoesNotExist:
        return Response(
            {'error': 'Product not in wishlist'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error removing from wishlist for user {request.user.id}: {e}")
        return Response(
            {'error': 'Failed to remove product from wishlist'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_wishlist(request):
    """Toggle product in/out of wishlist"""
    try:
        serializer = AddToWishlistSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        product_id = serializer.validated_data['product_id']
        product = get_object_or_404(Product, id=product_id, is_active=True)
        
        with transaction.atomic():
            wishlist, created = Wishlist.objects.get_or_create(user=request.user)
            
            try:
                wishlist_item = WishlistItem.objects.get(
                    wishlist=wishlist, 
                    product=product
                )
                # Remove if exists
                wishlist_item.delete()
                action = 'removed'
                in_wishlist = False
                
            except WishlistItem.DoesNotExist:
                # Add if doesn't exist
                WishlistItem.objects.create(
                    wishlist=wishlist,
                    product=product
                )
                action = 'added'
                in_wishlist = True
            
            logger.info(f"Product {product_id} {action} for user {request.user.id}")
            
            return Response({
                'success': True,
                'action': action,
                'in_wishlist': in_wishlist,
                'item_count': wishlist.item_count,
            })
            
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error toggling wishlist for user {request.user.id}: {e}")
        return Response(
            {'error': 'Failed to update wishlist'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_wishlist_status(request, product_id):
    """Check if product is in user's wishlist"""
    try:
        wishlist = Wishlist.objects.filter(user=request.user).first()
        
        if not wishlist:
            return Response({
                'in_wishlist': False,
                'item_count': 0,
            })
        
        in_wishlist = WishlistItem.objects.filter(
            wishlist=wishlist,
            product_id=product_id
        ).exists()
        
        return Response({
            'in_wishlist': in_wishlist,
            'item_count': wishlist.item_count,
        })
        
    except Exception as e:
        logger.error(f"Error checking wishlist status for user {request.user.id}: {e}")
        return Response(
            {'error': 'Failed to check wishlist status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_wishlist(request):
    """Clear all items from wishlist"""
    try:
        with transaction.atomic():
            wishlist = get_object_or_404(Wishlist, user=request.user)
            deleted_count = wishlist.items.count()
            wishlist.items.all().delete()
            
            logger.info(f"Cleared {deleted_count} items from wishlist for user {request.user.id}")
            
            return Response({
                'success': True,
                'message': f'Removed {deleted_count} items from wishlist',
                'item_count': 0,
            })
            
    except Wishlist.DoesNotExist:
        return Response(
            {'error': 'Wishlist not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error clearing wishlist for user {request.user.id}: {e}")
        return Response(
            {'error': 'Failed to clear wishlist'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )