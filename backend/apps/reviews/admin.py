from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.http import HttpResponseRedirect
from django.contrib import messages
from django.utils import timezone
from .models import Review, ReviewHelpfulness, ReviewImage


class ReviewImageInline(admin.TabularInline):
    model = ReviewImage
    extra = 0
    readonly_fields = ['created_at']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        'product_name', 'user_email', 'rating_display', 'status', 'status_display',
        'verified_badge', 'helpfulness_score', 'created_at'
    ]
    list_filter = [
        'status', 'rating', 'is_verified_purchase', 'created_at'
    ]
    search_fields = [
        'product__name', 'user__email', 'title', 'content'
    ]
    list_editable = ['status']
    readonly_fields = [
        'user', 'product', 'order_item', 'is_verified_purchase',
        'helpful_count', 'not_helpful_count', 'helpfulness_ratio',
        'created_at', 'updated_at'
    ]
    actions = [
        'approve_reviews', 'reject_reviews', 'flag_reviews',
        'bulk_moderate_approved'
    ]
    inlines = [ReviewImageInline]

    fieldsets = (
        ('Review Information', {
            'fields': ('product', 'user', 'order_item', 'is_verified_purchase')
        }),
        ('Review Content', {
            'fields': ('rating', 'title', 'content')
        }),
        ('Moderation', {
            'fields': ('status', 'moderation_notes', 'moderated_at')
        }),
        ('Helpfulness', {
            'fields': ('helpful_count', 'not_helpful_count', 'helpfulness_ratio'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('moderate-pending/', self.moderate_pending_view, name='moderate_pending_reviews'),
        ]
        return custom_urls + urls

    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'
    product_name.admin_order_field = 'product__name'

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    user_email.admin_order_field = 'user__email'

    def rating_display(self, obj):
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        return format_html(
            '<span style="color: #ffa500; font-size: 16px;" title="{}/5 stars">{}</span>',
            obj.rating, stars
        )
    rating_display.short_description = 'Rating'
    rating_display.admin_order_field = 'rating'

    def status_display(self, obj):
        colors = {
            'pending': '#ffa500',
            'approved': '#28a745',
            'rejected': '#dc3545',
            'flagged': '#6f42c1',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">●</span> {}',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Status'

    def verified_badge(self, obj):
        if obj.is_verified_purchase:
            return format_html(
                '<span style="background: #28a745; color: white; padding: 2px 6px; '
                'border-radius: 3px; font-size: 11px;">✓ VERIFIED</span>'
            )
        return format_html(
            '<span style="color: #6c757d; font-size: 11px;">Not Verified</span>'
        )
    verified_badge.short_description = 'Purchase'

    def helpfulness_score(self, obj):
        total_votes = obj.helpful_count + obj.not_helpful_count
        if total_votes == 0:
            return format_html('<span style="color: #6c757d;">No votes</span>')
        
        ratio = obj.helpfulness_ratio
        color = '#28a745' if ratio >= 70 else '#ffa500' if ratio >= 40 else '#dc3545'
        
        return format_html(
            '<span style="color: {};">{:.1f}% ({}/{})</span>',
            color, ratio, obj.helpful_count, total_votes
        )
    helpfulness_score.short_description = 'Helpfulness'

    def approve_reviews(self, request, queryset):
        updated = queryset.update(
            status='approved',
            moderated_at=timezone.now()
        )
        
        # Update product rating caches
        for review in queryset:
            review.product.update_rating_cache()
        
        self.message_user(request, f"{updated} reviews approved.")
    approve_reviews.short_description = "Approve selected reviews"

    def reject_reviews(self, request, queryset):
        updated = queryset.update(
            status='rejected',
            moderated_at=timezone.now()
        )
        
        # Update product rating caches
        for review in queryset:
            review.product.update_rating_cache()
        
        self.message_user(request, f"{updated} reviews rejected.")
    reject_reviews.short_description = "Reject selected reviews"

    def flag_reviews(self, request, queryset):
        updated = queryset.update(status='flagged')
        self.message_user(request, f"{updated} reviews flagged for further review.")
    flag_reviews.short_description = "Flag selected reviews"

    def bulk_moderate_approved(self, request, queryset):
        """Bulk approve reviews that meet criteria"""
        criteria_met = queryset.filter(
            status='pending',
            is_verified_purchase=True,
            rating__gte=3  # 3+ stars
        )
        
        updated = criteria_met.update(
            status='approved',
            moderated_at=timezone.now()
        )
        
        # Update product rating caches
        for review in criteria_met:
            review.product.update_rating_cache()
        
        self.message_user(
            request, 
            f"{updated} verified purchase reviews with 3+ stars auto-approved."
        )
    bulk_moderate_approved.short_description = "Auto-approve verified 3+ star reviews"

    def moderate_pending_view(self, request):
        """Custom view for bulk moderation"""
        pending_count = Review.objects.filter(status='pending').count()
        messages.info(request, f"There are {pending_count} reviews pending moderation.")
        return HttpResponseRedirect("../")

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        
        # Add moderation statistics
        from django.db.models import Count
        stats = Review.objects.aggregate(
            total=Count('id'),
            pending=Count('id', filter=models.Q(status='pending')),
            approved=Count('id', filter=models.Q(status='approved')),
            rejected=Count('id', filter=models.Q(status='rejected')),
            flagged=Count('id', filter=models.Q(status='flagged')),
        )
        
        extra_context['moderation_stats'] = stats
        return super().changelist_view(request, extra_context)


@admin.register(ReviewHelpfulness)
class ReviewHelpfulnessAdmin(admin.ModelAdmin):
    list_display = ['review_title', 'user_email', 'vote_display', 'created_at']
    list_filter = ['is_helpful', 'created_at']
    search_fields = ['review__title', 'user__email']
    readonly_fields = ['review', 'user', 'created_at']

    def review_title(self, obj):
        return obj.review.title[:50] + ('...' if len(obj.review.title) > 50 else '')
    review_title.short_description = 'Review'

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'

    def vote_display(self, obj):
        if obj.is_helpful:
            return format_html('<span style="color: #28a745;">👍 Helpful</span>')
        return format_html('<span style="color: #dc3545;">👎 Not Helpful</span>')
    vote_display.short_description = 'Vote'


@admin.register(ReviewImage)
class ReviewImageAdmin(admin.ModelAdmin):
    list_display = ['review_title', 'image_preview', 'caption', 'created_at']
    list_filter = ['created_at']
    search_fields = ['review__title', 'caption']
    readonly_fields = ['review', 'created_at', 'image_preview']

    def review_title(self, obj):
        return obj.review.title[:50] + ('...' if len(obj.review.title) > 50 else '')
    review_title.short_description = 'Review'

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 100px; max-height: 100px;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = 'Preview'