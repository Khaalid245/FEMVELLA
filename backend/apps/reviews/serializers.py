from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Review, ReviewHelpfulness, ReviewImage
from apps.products.models import Product
from apps.orders.models import OrderItem

User = get_user_model()


class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ['id', 'image', 'caption', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReviewerSerializer(serializers.ModelSerializer):
    """Minimal user info for reviews"""
    class Meta:
        model = User
        fields = ['first_name', 'last_name']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Show only first name and last initial for privacy
        if data['last_name']:
            data['display_name'] = f"{data['first_name']} {data['last_name'][0]}."
        else:
            data['display_name'] = data['first_name'] or 'Anonymous'
        return {'display_name': data['display_name']}


class ReviewSerializer(serializers.ModelSerializer):
    user = ReviewerSerializer(read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)
    helpfulness_ratio = serializers.ReadOnlyField()
    can_vote = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'rating', 'title', 'content', 'user', 'is_verified_purchase',
            'helpful_count', 'not_helpful_count', 'helpfulness_ratio',
            'images', 'created_at', 'updated_at', 'can_vote', 'user_vote'
        ]
        read_only_fields = [
            'id', 'user', 'is_verified_purchase', 'helpful_count', 
            'not_helpful_count', 'created_at', 'updated_at'
        ]

    def get_can_vote(self, obj):
        """Check if current user can vote on this review"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.user != request.user  # Can't vote on own review

    def get_user_vote(self, obj):
        """Get current user's vote on this review"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        try:
            vote = ReviewHelpfulness.objects.get(review=obj, user=request.user)
            return vote.is_helpful
        except ReviewHelpfulness.DoesNotExist:
            return None


class CreateReviewSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        max_length=5,  # Max 5 images per review
        help_text="Optional images for the review (max 5)"
    )

    class Meta:
        model = Review
        fields = ['rating', 'title', 'content', 'images']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def validate_title(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters long")
        return value.strip()

    def validate_content(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Review content must be at least 20 characters long")
        return value.strip()

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        
        # Get user and product from context
        user = self.context['request'].user
        product_id = self.context['product_id']
        
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found")

        # Check if user already reviewed this product
        if Review.objects.filter(product=product, user=user).exists():
            raise serializers.ValidationError("You have already reviewed this product")

        # Check for verified purchase
        order_item = OrderItem.objects.filter(
            order__user=user,
            product=product,
            order__status='completed'
        ).first()

        # Create review
        review = Review.objects.create(
            product=product,
            user=user,
            order_item=order_item,
            is_verified_purchase=bool(order_item),
            **validated_data
        )

        # Create review images
        for image_data in images_data:
            ReviewImage.objects.create(review=review, image=image_data)

        return review


class ReviewHelpfulnessSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewHelpfulness
        fields = ['is_helpful']

    def create(self, validated_data):
        user = self.context['request'].user
        review_id = self.context['review_id']
        
        try:
            review = Review.objects.get(id=review_id, status='approved')
        except Review.DoesNotExist:
            raise serializers.ValidationError("Review not found")

        if review.user == user:
            raise serializers.ValidationError("Cannot vote on your own review")

        # Update or create vote
        vote, created = ReviewHelpfulness.objects.update_or_create(
            review=review,
            user=user,
            defaults={'is_helpful': validated_data['is_helpful']}
        )

        # Update review helpfulness counts
        helpful_count = review.helpfulness_votes.filter(is_helpful=True).count()
        not_helpful_count = review.helpfulness_votes.filter(is_helpful=False).count()
        
        review.helpful_count = helpful_count
        review.not_helpful_count = not_helpful_count
        review.save(update_fields=['helpful_count', 'not_helpful_count'])

        return vote


class ProductRatingSerializer(serializers.Serializer):
    """Serializer for product rating statistics"""
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2)
    total_reviews = serializers.IntegerField()
    rating_distribution = serializers.DictField()
    
    def to_representation(self, instance):
        return {
            'average_rating': float(instance.average_rating),
            'total_reviews': instance.total_reviews,
            'rating_distribution': instance.rating_distribution or {},
            'rating_breakdown': self.get_rating_breakdown(instance),
        }
    
    def get_rating_breakdown(self, instance):
        """Calculate percentage breakdown of ratings"""
        distribution = instance.rating_distribution or {}
        total = instance.total_reviews
        
        if total == 0:
            return {str(i): 0 for i in range(1, 6)}
        
        return {
            rating: round((count / total) * 100, 1)
            for rating, count in distribution.items()
        }