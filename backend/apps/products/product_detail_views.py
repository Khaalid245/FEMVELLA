from django.http import JsonResponse
from .models import Product


def product_detail(request, slug):
    try:
        product = (
            Product.objects
            .select_related("category")
            .prefetch_related("images", "variants")
            .get(slug=slug, is_active=True)
        )
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found"}, status=404)

    images = []
    for img in product.images.all():
        images.append({
            "id": img.id,
            "image": request.build_absolute_uri(img.image.url) if img.image else None,
            "alt_text": img.alt_text,
            "is_primary": img.is_primary,
            "sort_order": img.sort_order,
        })

    variants = []
    for v in product.variants.filter(is_active=True):
        variants.append({
            "id": v.id,
            "size": v.size,
            "color": v.color,
            "stock": v.stock,
            "sku": v.sku,
            "price_override": str(v.price_override) if v.price_override else None,
            "effective_price": str(v.effective_price),
        })

    return JsonResponse({
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "category": {
            "id": product.category.id if product.category else None,
            "name": product.category.name if product.category else "",
            "slug": product.category.slug if product.category else "",
        },
        "price": str(product.price),
        "sale_price": str(product.sale_price) if product.sale_price else None,
        "total_stock": product.total_stock,
        "is_featured": product.is_featured,
        "is_new": product.is_new,
        "is_bestseller": product.is_bestseller,
        "is_customizable": product.is_customizable,
        "average_rating": str(product.average_rating),
        "total_reviews": product.total_reviews,
        "images": images,
        "variants": variants,
    })
