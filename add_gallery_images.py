"""
Script to add multiple images to Women Floral Print Gown Dress product
This simulates what you would do in the Django admin with multiple images
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append('backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from apps.products.models import Product, ProductImage

def add_multiple_images():
    try:
        # Get the Women Floral Print Gown Dress product
        product = Product.objects.get(slug='women-floral-print-gown-dress')
        print(f"Found product: {product.name}")
        
        # Clear existing images
        product.images.all().delete()
        print("Cleared existing images")
        
        # Available sample images from media/products/
        sample_images = [
            'products/images_2.jpg',
            'products/images_3.jpg', 
            'products/download_1.jpg',
            'products/Limited_edition_abaya_mobile_banner_1.webp',
            'products/WhatsAppImage2025-08-12at21.05.26_b698d6ca.webp'
        ]
        
        # Add multiple images
        for i, image_path in enumerate(sample_images[:4]):  # Add 4 images for gallery
            is_primary = (i == 0)  # First image is primary
            
            ProductImage.objects.create(
                product=product,
                image=image_path,
                alt_text=f"{product.name} - View {i+1}",
                is_primary=is_primary
            )
            
            print(f"Added image {i+1}: {image_path} (Primary: {is_primary})")
        
        # Verify images were added
        image_count = product.images.count()
        print(f"\nSuccess! Added {image_count} images to {product.name}")
        
        # Show the images
        print("\nImages in database:")
        for img in product.images.all():
            status = "PRIMARY" if img.is_primary else "SECONDARY"
            print(f"  - {status}: {img.image} (Alt: {img.alt_text})")
            
    except Product.DoesNotExist:
        print("Product 'women-floral-print-gown-dress' not found")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    add_multiple_images()