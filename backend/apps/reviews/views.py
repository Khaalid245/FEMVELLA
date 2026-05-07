from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q
from .models import Review, ReviewHelpfulness
from .serializers import (
    ReviewSerializer, 
    CreateReviewSerializer, 
    ReviewHelpfulnessSerializer,
    ProductRatingSerializer
)
from apps.products.models import Product
import logging

logger = logging.getLogger(__name__)


class ReviewPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_reviews(request, product_id):
    """Get paginated reviews for a product"""
    try:
        product = get_object_or_404(Product, id=product_id, is_active=True)
        
        # Filter parameters
        rating_filter = request.GET.get('rating')
        verified_only = request.GET.get('verified_only', '').lower() == 'true'
        sort_by = request.GET.get('sort', 'newest')  # newest, oldest, helpful, rating_high, rating_low
        
        # Base queryset - only approved reviews
        reviews = Review.objects.filter(
            product=product,
            status='approved'
        ).select_related('user').prefetch_related('images', 'helpfulness_votes')
        
        # Apply filters
        if rating_filter and rating_filter.isdigit():
            reviews = reviews.filter(rating=int(rating_filter))
        
        if verified_only:
            reviews = reviews.filter(is_verified_purchase=True)
        
        # Apply sorting
        if sort_by == 'oldest':
            reviews = reviews.order_by('created_at')
        elif sort_by == 'helpful':
            reviews = reviews.order_by('-helpful_count', '-created_at')
        elif sort_by == 'rating_high':
            reviews = reviews.order_by('-rating', '-created_at')
        elif sort_by == 'rating_low':
            reviews = reviews.order_by('rating', '-created_at')
        else:  # newest (default)
            reviews = reviews.order_by('-created_at')
        
        # Paginate
        paginator = ReviewPagination()
        paginated_reviews = paginator.paginate_queryset(reviews, request)
        
        serializer = ReviewSerializer(
            paginated_reviews, 
            many=True, 
            context={'request': request}
        )
        
        return paginator.get_paginated_response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error getting product reviews: {e}")
        return Response(
            {'error': 'Failed to retrieve reviews'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_rating_summary(request, product_id):
    """Get product rating summary and statistics"""
    try:
        product = get_object_or_404(Product, id=product_id, is_active=True)
        
        serializer = ProductRatingSerializer(product)
        
        return Response({
            'success': True,
            'rating_summary': serializer.data,
        })
        
    except Exception as e:
        logger.error(f"Error getting product rating summary: {e}")
        return Response(
            {'error': 'Failed to retrieve rating summary'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review(request, product_id):
    """Create a new review for a product"""
    try:
        with transaction.atomic():
            serializer = CreateReviewSerializer(
                data=request.data,
                context={'request': request, 'product_id': product_id}
            )
            
            if not serializer.is_valid():
                return Response(
                    {'error': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            review = serializer.save()
            
            logger.info(f"Review created: {review.id} by user {request.user.id}")
            
            # Return created review
            response_serializer = ReviewSerializer(
                review, 
                context={'request': request}
            )
            
            return Response({
                'success': True,
                'message': 'Review submitted successfully. It will be published after moderation.',
                'review': response_serializer.data,
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Error creating review: {e}")
        return Response(
            {'error': 'Failed to create review'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_review_eligibility(request, product_id):
    """Check if user can review this product"""
    try:
        product = get_object_or_404(Product, id=product_id, is_active=True)
        
        # Check if already reviewed
        existing_review = Review.objects.filter(
            product=product,
            user=request.user
        ).first()
        
        if existing_review:
            return Response({
                'can_review': False,
                'reason': 'already_reviewed',
                'message': 'You have already reviewed this product',
                'existing_review': ReviewSerializer(
                    existing_review, 
                    context={'request': request}
                ).data
            })
        
        # Check for verified purchase
        from apps.orders.models import OrderItem
        has_purchased = OrderItem.objects.filter(
            order__user=request.user,
            product=product,
            order__status='completed'
        ).exists()
        
        return Response({
            'can_review': True,
            'is_verified_purchase': has_purchased,
            'message': 'You can review this product' + (
                ' as a verified purchaser' if has_purchased else ''
            )
        })
        
    except Exception as e:
        logger.error(f"Error checking review eligibility: {e}")
        return Response(
            {'error': 'Failed to check review eligibility'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_review_helpfulness(request, review_id):
    """Vote on review helpfulness"""
    try:
        with transaction.atomic():
            serializer = ReviewHelpfulnessSerializer(
                data=request.data,
                context={'request': request, 'review_id': review_id}
            )
            
            if not serializer.is_valid():
                return Response(
                    {'error': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            vote = serializer.save()
            
            # Get updated review
            review = Review.objects.get(id=review_id)
            
            return Response({
                'success': True,
                'message': 'Vote recorded successfully',
                'helpful_count': review.helpful_count,
                'not_helpful_count': review.not_helpful_count,
                'user_vote': vote.is_helpful,
            })
            
    except Exception as e:
        logger.error(f"Error voting on review helpfulness: {e}")
        return Response(
            {'error': 'Failed to record vote'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_reviews(request):
    """Get current user's reviews"""
    try:
        reviews = Review.objects.filter(
            user=request.user
        ).select_related('product').order_by('-created_at')
        
        # Paginate
        paginator = ReviewPagination()
        paginated_reviews = paginator.paginate_queryset(reviews, request)
        
        # Custom serialization to include product info
        review_data = []
        for review in paginated_reviews:
            review_serializer = ReviewSerializer(review, context={'request': request})
            data = review_serializer.data
            data['product'] = {
                'id': review.product.id,
                'name': review.product.name,
                'slug': review.product.slug,
                'image_url': review.product.images.first().image.url if review.product.images.exists() else None,
            }
            data['status'] = review.status
            review_data.append(data)
        
        return paginator.get_paginated_response(review_data)
        
    except Exception as e:
        logger.error(f"Error getting user reviews: {e}")
        return Response(
            {'error': 'Failed to retrieve your reviews'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_review(request, review_id):
    """Delete user's own review (only if pending)"""
    try:
        review = get_object_or_404(
            Review,
            id=review_id,
            user=request.user,
            status='pending'  # Only allow deletion of pending reviews
        )
        
        product = review.product
        review.delete()
        
        # Update product rating cache
        product.update_rating_cache()
        
        logger.info(f"Review {review_id} deleted by user {request.user.id}")
        
        return Response({
            'success': True,
            'message': 'Review deleted successfully',
        })
        
    except Review.DoesNotExist:
        return Response(
            {'error': 'Review not found or cannot be deleted'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error deleting review: {e}")
        return Response(
            {'error': 'Failed to delete review'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )