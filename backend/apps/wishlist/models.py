from django.db import models
from django.contrib.auth import get_user_model
from apps.products.models import Product

User = get_user_model()


class Wishlist(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wishlist')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Wishlist'
        verbose_name_plural = 'Wishlists'

    def __str__(self):
        return f"{self.user.email}'s Wishlist"

    @property
    def item_count(self):
        return self.items.count()

    @property
    def total_value(self):
        return sum(item.product.price for item in self.items.all())


class WishlistItem(models.Model):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlist_items')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['wishlist', 'product']
        ordering = ['-added_at']
        indexes = [
            models.Index(fields=['wishlist', '-added_at']),
            models.Index(fields=['product']),
        ]

    def __str__(self):
        return f"{self.product.name} in {self.wishlist.user.email}'s wishlist"