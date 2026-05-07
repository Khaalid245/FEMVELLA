from PIL import Image, ImageOps
from io import BytesIO
from django.core.files.base import ContentFile
from django.conf import settings
import os

class ImageOptimizer:
    """Optimize images for web performance"""
    
    def __init__(self):
        self.max_width = getattr(settings, 'MAX_IMAGE_WIDTH', 1200)
        self.max_height = getattr(settings, 'MAX_IMAGE_HEIGHT', 1200)
        self.quality = getattr(settings, 'IMAGE_QUALITY', 85)
        self.thumbnail_size = getattr(settings, 'THUMBNAIL_SIZE', (300, 300))
        
    def optimize_image(self, image_file, format='WEBP'):
        """
        Optimize an image file for web use
        Returns optimized image as ContentFile
        """
        try:
            # Open and process image
            with Image.open(image_file) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Auto-orient based on EXIF data
                img = ImageOps.exif_transpose(img)
                
                # Resize if too large
                if img.width > self.max_width or img.height > self.max_height:
                    img.thumbnail((self.max_width, self.max_height), Image.Resampling.LANCZOS)
                
                # Save optimized image
                output = BytesIO()
                img.save(output, format=format, quality=self.quality, optimize=True)
                output.seek(0)
                
                # Generate filename
                name = os.path.splitext(image_file.name)[0]
                extension = 'webp' if format == 'WEBP' else format.lower()
                filename = f"{name}_optimized.{extension}"
                
                return ContentFile(output.getvalue(), name=filename)
                
        except Exception as e:
            # If optimization fails, return original
            return image_file
    
    def create_thumbnail(self, image_file, size=None):
        """Create a thumbnail version of the image"""
        if size is None:
            size = self.thumbnail_size
            
        try:
            with Image.open(image_file) as img:
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                img = ImageOps.exif_transpose(img)
                img.thumbnail(size, Image.Resampling.LANCZOS)
                
                output = BytesIO()
                img.save(output, format='WEBP', quality=80, optimize=True)
                output.seek(0)
                
                name = os.path.splitext(image_file.name)[0]
                filename = f"{name}_thumb.webp"
                
                return ContentFile(output.getvalue(), name=filename)
                
        except Exception:
            return None

# Global instance
image_optimizer = ImageOptimizer()