from django.http import JsonResponse

def test_speed(request):
    """Ultra simple test endpoint"""
    return JsonResponse({"message": "fast", "status": "ok"})

def simple_product(request, slug):
    """Hardcoded product response for testing"""
    return JsonResponse({
        "id": 1,
        "name": "Test Product",
        "slug": slug,
        "description": "Test description",
        "category": {"name": "Test Category"},
        "price": "100.00",
        "sale_price": "90.00",
        "total_stock": 10,
        "is_featured": True,
        "is_new": False,
        "is_bestseller": True,
        "images": [
            {
                "id": 1,
                "image": "http://localhost:8000/media/products/test.jpg",
                "is_primary": True,
                "sort_order": 0
            }
        ],
        "variants": [
            {
                "id": 1,
                "size": "M",
                "color": "Black",
                "stock": 5
            }
        ]
    })