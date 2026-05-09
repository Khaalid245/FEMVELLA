from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from .models import Product
from .serializers import ProductSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def product_detail(request, slug):
    try:
        product = (
            Product.objects
            .select_related("category")
            .prefetch_related("images", "colors", "sizes", "variants")
            .get(slug=slug, is_active=True)
        )
    except Product.DoesNotExist:
        raise NotFound("Product not found.")

    serializer = ProductSerializer(product, context={"request": request})
    return Response(serializer.data)
