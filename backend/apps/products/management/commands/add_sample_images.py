from django.core.management.base import BaseCommand
from apps.products.models import Product, ProductImage
import os
from django.conf import settings


class Command(BaseCommand):
    help = 'Add sample images to products that have no images'

    def handle(self, *args, **options):
        # Get products without images
        products_without_images = Product.objects.filter(images__isnull=True)
        
        # Get available sample images from media/products/
        media_products_path = os.path.join(settings.MEDIA_ROOT, 'products')
        available_images = []
        
        if os.path.exists(media_products_path):
            for filename in os.listdir(media_products_path):
                if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                    available_images.append(f'products/{filename}')
        
        if not available_images:
            self.stdout.write(
                self.style.WARNING('No sample images found in media/products/')
            )
            return
        
        count = 0
        for product in products_without_images:
            # Use the first available image as sample
            image_path = available_images[count % len(available_images)]
            
            ProductImage.objects.create(
                product=product,
                image=image_path,
                is_primary=True
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Added image to product: {product.name}')
            )
            count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully added images to {count} products')
        )