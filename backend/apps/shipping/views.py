from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from decimal import Decimal
from .services import ShippingCalculator


@api_view(['POST'])
@permission_classes([AllowAny])
def get_shipping_methods(request):
    """Get available shipping methods for checkout"""
    try:
        country_code = request.data.get('country_code', '').upper()
        order_value = Decimal(str(request.data.get('order_value', 0)))
        cart_items = request.data.get('cart_items', [])

        if not country_code:
            return Response(
                {'error': 'Country code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        methods = ShippingCalculator.get_available_methods(
            country_code, order_value, cart_items
        )

        return Response({
            'success': True,
            'methods': methods,
            'country_code': country_code,
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def calculate_shipping(request):
    """Calculate shipping cost for a specific method"""
    try:
        method_id = request.data.get('method_id')
        country_code = request.data.get('country_code', '').upper()
        order_value = Decimal(str(request.data.get('order_value', 0)))
        cart_items = request.data.get('cart_items', [])

        if not method_id or not country_code:
            return Response(
                {'error': 'Method ID and country code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = ShippingCalculator.calculate_shipping_cost(
            method_id, country_code, order_value, cart_items
        )

        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'shipping': result,
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def get_shipping_recommendations(request):
    """Get cheapest and fastest shipping options"""
    try:
        country_code = request.data.get('country_code', '').upper()
        order_value = Decimal(str(request.data.get('order_value', 0)))
        cart_items = request.data.get('cart_items', [])

        if not country_code:
            return Response(
                {'error': 'Country code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cheapest = ShippingCalculator.get_cheapest_method(
            country_code, order_value, cart_items
        )
        fastest = ShippingCalculator.get_fastest_method(
            country_code, order_value, cart_items
        )

        return Response({
            'success': True,
            'recommendations': {
                'cheapest': cheapest,
                'fastest': fastest,
            }
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )