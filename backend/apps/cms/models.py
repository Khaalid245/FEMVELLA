from django.db import models
from django.utils import timezone
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from core.models import TimeStampedModel

CMS_CACHE_KEY = "cms_homepage_content"


class Banner(TimeStampedModel):
    """Homepage hero / campaign banner."""
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=400, blank=True)
    badge_text = models.CharField(max_length=100, blank=True, help_text="Small label above headline e.g. 'New Season · 2026'")
    cta_label = models.CharField(max_length=80, default="Discover Collection")
    cta_url = models.CharField(max_length=500, default="/products")
    secondary_cta_label = models.CharField(max_length=80, blank=True)
    secondary_cta_url = models.CharField(max_length=500, blank=True)
    image = models.ImageField(upload_to="cms/banners/", blank=True, null=True)
    image_alt = models.CharField(max_length=255, blank=True)
    # Scheduling
    is_active = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    # Ordering
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]

    def __str__(self):
        return self.title

    @property
    def is_live(self):
        if not self.is_active:
            return False
        now = timezone.now()
        if self.published_at and now < self.published_at:
            return False
        if self.expires_at and now > self.expires_at:
            return False
        return True


class Collection(TimeStampedModel):
    """Seasonal / campaign collection section on homepage."""
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=400, blank=True)
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to="cms/collections/", blank=True, null=True)
    image_alt = models.CharField(max_length=255, blank=True)
    cta_label = models.CharField(max_length=80, default="Shop Now")
    cta_url = models.CharField(max_length=500, default="/products")
    is_active = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]

    def __str__(self):
        return self.title

    @property
    def is_live(self):
        if not self.is_active:
            return False
        now = timezone.now()
        if self.published_at and now < self.published_at:
            return False
        if self.expires_at and now > self.expires_at:
            return False
        return True


class LookbookEntry(TimeStampedModel):
    """Individual lookbook image with optional product link."""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="cms/lookbook/")
    image_alt = models.CharField(max_length=255, blank=True)
    product_url = models.CharField(max_length=500, blank=True, help_text="Optional link to a product")
    is_active = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]
        verbose_name = "Lookbook Entry"
        verbose_name_plural = "Lookbook Entries"

    def __str__(self):
        return self.title


def _invalidate_cms_cache():
    """Clear all homepage cache variants when CMS content changes."""
    cache.delete(CMS_CACHE_KEY)
    # cache_page uses a pattern-based key — delete by prefix
    from django.core.cache import caches
    try:
        caches["default"].delete_pattern("*cms*homepage*")
    except AttributeError:
        pass  # Non-Redis cache backends don't support delete_pattern


@receiver([post_save, post_delete], sender=Banner)
@receiver([post_save, post_delete], sender=Collection)
@receiver([post_save, post_delete], sender=LookbookEntry)
def invalidate_cms_cache(sender, **kwargs):
    _invalidate_cms_cache()
