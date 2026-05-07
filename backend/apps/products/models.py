import logging

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from core.models import TimeStampedModel
from core.image_utils import image_optimizer

logger = logging.getLogger(__name__)


class Category(TimeStampedModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children")
    image = models.ImageField(upload_to="categories/", blank=True, null=True)

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="products")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)  # kept for backward compat; use variants for per-size stock
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    is_bestseller = models.BooleanField(default=False)
    is_customizable = models.BooleanField(default=False)
    
    # Review & Rating fields
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.PositiveIntegerField(default=0)
    rating_distribution = models.JSONField(default=dict, help_text="Distribution of ratings 1-5")

    def __str__(self):
        return self.name

    @property
    def total_stock(self):
        """Sum of all variant stock. Falls back to product.stock if no variants."""
        agg = self.variants.aggregate(total=models.Sum("stock"))["total"]
        return agg if agg is not None else self.stock


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=255, blank=True, help_text="Alternative text for accessibility")
    is_primary = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['sort_order', 'id']
    
    def __str__(self):
        return f"{self.product.name} - Image {self.id}"
    
    def save(self, *args, **kwargs):
        # Auto-generate alt_text if not provided
        if not self.alt_text:
            self.alt_text = f"{self.product.name} product image"
        
        super().save(*args, **kwargs)
        logger.debug("Product image saved", extra={"product_id": self.product_id, "image_id": self.id})


class ProductColor(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="colors")
    name = models.CharField(max_length=50)
    hex_code = models.CharField(max_length=7)

    def __str__(self):
        return f"{self.product.name} — {self.name}"


class ProductSize(models.Model):
    """Legacy — kept for existing data. Use ProductVariant for new products."""
    SIZES = [(s, s) for s in ("XS", "S", "M", "L", "XL", "XXL")]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="sizes")
    size = models.CharField(max_length=5, choices=SIZES)
    in_stock = models.BooleanField(default=True)

    class Meta:
        unique_together = ("product", "size")

    def __str__(self):
        return f"{self.product.name} — {self.size}"


class ProductVariant(models.Model):
    """Enterprise-grade variant inventory management."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    size = models.CharField(max_length=50)
    color = models.CharField(max_length=50, blank=True, default="")
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5, help_text="Alert when stock falls below this number")
    sku = models.CharField(max_length=100, unique=True, help_text="Stock Keeping Unit - must be unique")
    price_override = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True, help_text="Disable variant without deleting")
    
    # Tracking fields
    reserved_stock = models.PositiveIntegerField(default=0, help_text="Stock reserved for pending orders")
    total_sold = models.PositiveIntegerField(default=0, help_text="Total units sold (for analytics)")
    last_restocked = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("product", "size", "color")
        ordering = ["size", "color"]
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['stock']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        label = f"{self.product.name} — {self.size}"
        if self.color:
            label += f" / {self.color}"
        return f"{label} (SKU: {self.sku})"
    
    def clean(self):
        """Validate variant data"""
        if self.stock < 0:
            raise ValidationError("Stock cannot be negative")
        if self.reserved_stock < 0:
            raise ValidationError("Reserved stock cannot be negative")
        if self.reserved_stock > self.stock:
            raise ValidationError("Reserved stock cannot exceed total stock")
    
    def save(self, *args, **kwargs):
        # Auto-generate SKU if not provided
        if not self.sku:
            self.sku = self.generate_sku()
        self.clean()
        super().save(*args, **kwargs)
    
    def generate_sku(self):
        """Generate unique SKU based on product and variant details"""
        base_sku = f"{self.product.slug[:10].upper()}-{self.size.upper()}"
        if self.color:
            base_sku += f"-{self.color[:3].upper()}"
        
        # Ensure uniqueness
        counter = 1
        sku = base_sku
        while ProductVariant.objects.filter(sku=sku).exists():
            sku = f"{base_sku}-{counter:02d}"
            counter += 1
        return sku

    @property
    def effective_price(self):
        """Get the effective price for this variant"""
        if self.price_override:
            return self.price_override
        return self.product.sale_price or self.product.price
    
    @property
    def available_stock(self):
        """Get available stock (total - reserved)"""
        return max(0, self.stock - self.reserved_stock)
    
    @property
    def is_in_stock(self):
        """Check if variant has available stock"""
        return self.is_active and self.available_stock > 0
    
    @property
    def is_low_stock(self):
        """Check if variant is running low on stock"""
        return self.is_active and 0 < self.available_stock <= self.low_stock_threshold
    
    @property
    def stock_status(self):
        """Get human-readable stock status"""
        if not self.is_active:
            return "Discontinued"
        if self.available_stock == 0:
            return "Out of Stock"
        if self.is_low_stock:
            return f"Only {self.available_stock} left"
        return "In Stock"
    
    def reserve_stock(self, quantity):
        """Reserve stock for an order (atomic operation)"""
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        if quantity > self.available_stock:
            raise ValueError(f"Cannot reserve {quantity} units. Only {self.available_stock} available.")
        
        self.reserved_stock += quantity
        self.save(update_fields=['reserved_stock', 'updated_at'])
    
    def release_stock(self, quantity):
        """Release reserved stock (e.g., when order is cancelled)"""
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        if quantity > self.reserved_stock:
            raise ValueError(f"Cannot release {quantity} units. Only {self.reserved_stock} reserved.")
        
        self.reserved_stock -= quantity
        self.save(update_fields=['reserved_stock', 'updated_at'])
    
    def deduct_stock(self, quantity):
        """Deduct stock when order is completed (atomic operation)"""
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        if quantity > self.stock:
            raise ValueError(f"Cannot deduct {quantity} units. Only {self.stock} in stock.")
        
        self.stock -= quantity
        self.reserved_stock = max(0, self.reserved_stock - quantity)
        self.total_sold += quantity
        self.save(update_fields=['stock', 'reserved_stock', 'total_sold', 'updated_at'])
    
    def add_stock(self, quantity):
        """Add stock (e.g., when restocking)"""
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        
        from django.utils import timezone
        self.stock += quantity
        self.last_restocked = timezone.now()
        self.save(update_fields=['stock', 'last_restocked', 'updated_at'])
