from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg, Count
from apps.products.models import Product
from apps.orders.models import Order, OrderItem

User = get_user_model()


class Review(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Moderation'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('flagged', 'Flagged for Review'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    order_item = models.OneToOneField(
        OrderItem, 
        on_delete=models.CASCADE, 
        related_name='review',
        null=True, 
        blank=True,
        help_text="Links review to verified purchase"
    )
    
    # Review Content
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    title = models.CharField(max_length=200, help_text="Review title/headline")
    content = models.TextField(help_text="Detailed review content")
    
    # Verification & Moderation
    is_verified_purchase = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    moderation_notes = models.TextField(blank=True)
    
    # Helpfulness
    helpful_count = models.PositiveIntegerField(default=0)
    not_helpful_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    moderated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['product', 'user']  # One review per user per product
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'status', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['is_verified_purchase', 'status']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.product.name} ({self.rating}★)"

    @property
    def helpfulness_ratio(self):
        """Calculate helpfulness ratio"""
        total_votes = self.helpful_count + self.not_helpful_count
        if total_votes == 0:
            return 0
        return (self.helpful_count / total_votes) * 100

    def save(self, *args, **kwargs):
        # Auto-verify if linked to order item
        if self.order_item and not self.is_verified_purchase:
            self.is_verified_purchase = True
        
        super().save(*args, **kwargs)
        
        # Update product rating cache
        self.product.update_rating_cache()


class ReviewHelpfulness(models.Model):
    """Track user votes on review helpfulness"""
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='helpfulness_votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_helpful = models.BooleanField()  # True for helpful, False for not helpful
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['review', 'user']  # One vote per user per review
        indexes = [
            models.Index(fields=['review', 'is_helpful']),
        ]

    def __str__(self):
        vote_type = "helpful" if self.is_helpful else "not helpful"
        return f"{self.user.email} voted {vote_type} on review {self.review.id}"


class ReviewImage(models.Model):
    """Images attached to reviews"""
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reviews/%Y/%m/')
    caption = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Image for review {self.review.id}"


# Add methods to Product model for rating calculations
def update_rating_cache(self):
    """Update cached rating statistics"""
    approved_reviews = self.reviews.filter(status='approved')
    
    stats = approved_reviews.aggregate(
        avg_rating=Avg('rating'),
        total_reviews=Count('id'),
        five_star=Count('id', filter=models.Q(rating=5)),
        four_star=Count('id', filter=models.Q(rating=4)),
        three_star=Count('id', filter=models.Q(rating=3)),
        two_star=Count('id', filter=models.Q(rating=2)),
        one_star=Count('id', filter=models.Q(rating=1)),
    )
    
    self.average_rating = round(stats['avg_rating'] or 0, 2)
    self.total_reviews = stats['total_reviews']
    self.rating_distribution = {
        '5': stats['five_star'],
        '4': stats['four_star'],
        '3': stats['three_star'],
        '2': stats['two_star'],
        '1': stats['one_star'],
    }
    self.save(update_fields=['average_rating', 'total_reviews', 'rating_distribution'])

# Monkey patch the method to Product model
Product.update_rating_cache = update_rating_cache