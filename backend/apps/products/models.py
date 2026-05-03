from django.db import models
from core.models import TimeStampedModel


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
    is_primary = models.BooleanField(default=False)


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
    """Per-size (and optionally per-color) stock tracking."""
    SIZE_CHOICES = [(s, s) for s in ("XS", "S", "M", "L", "XL", "XXL", "One Size")]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    size = models.CharField(max_length=10, choices=SIZE_CHOICES)
    color = models.CharField(max_length=50, blank=True, default="")
    stock = models.PositiveIntegerField(default=0)
    price_override = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        unique_together = ("product", "size", "color")
        ordering = ["size"]

    def __str__(self):
        label = f"{self.product.name} — {self.size}"
        if self.color:
            label += f" / {self.color}"
        return label

    @property
    def effective_price(self):
        if self.price_override:
            return self.price_override
        return self.product.sale_price or self.product.price
