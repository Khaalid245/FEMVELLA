from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Product

@require_http_methods(["GET"])
@csrf_exempt
def minimal_product_detail(request, slug):
    """Ultra-minimal product detail - no serializers, no complex queries"""
    try:
        product = Product.objects.select_related('category').get(slug=slug, is_active=True)
        
        # Get images with minimal query
        images = list(product.images.values('id', 'image', 'is_primary', 'sort_order'))
        for img in images:
            img['image'] = request.build_absolute_uri(f"/media/{img['image']}")
        
        # Get variants with minimal query  
        variants = list(product.variants.values('id', 'size', 'color', 'stock'))
        
        data = {
            'id': product.id,
            'name': product.name,
            'slug': product.slug,
            'description': product.description,
            'category': {'name': product.category.name if product.category else ''},
            'price': str(product.price),
            'sale_price': str(product.sale_price) if product.sale_price else None,
            'total_stock': product.total_stock,
            'is_featured': product.is_featured,
            'is_new': product.is_new,
            'is_bestseller': product.is_bestseller,
            'images': images,
            'variants': variants,
        }
        
        return JsonResponse(data)
        
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)

@require_http_methods(["GET"])
@csrf_exempt  
def minimal_products_list(request):
    """Ultra-minimal products list"""
    products = Product.objects.select_related('category').filter(is_active=True)[:20]
    
    results = []
    for product in products:
        # Get primary image only
        primary_image = product.images.filter(is_primary=True).first()
        image_url = ''
        if primary_image:
            image_url = request.build_absolute_uri(f"/media/{primary_image.image}")
        
        results.append({
            'id': product.id,
            'name': product.name,
            'slug': product.slug,
            'price': str(product.price),
            'sale_price': str(product.sale_price) if product.sale_price else None,
            'is_featured': product.is_featured,
            'is_new': product.is_new,
            'is_bestseller': product.is_bestseller,
            'image': image_url,
        })
    
    return JsonResponse({'results': results})