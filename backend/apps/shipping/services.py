from decimal import Decimal
from typing import List, Dict, Optional
from django.db.models import Q
from .models import ShippingZone, ShippingMethod, ShippingRule


class ShippingCalculator:
    """Production-grade shipping calculation engine"""

    @staticmethod
    def get_zone_by_country(country_code: str) -> Optional[ShippingZone]:
        """Get shipping zone for a country"""
        return ShippingZone.objects.filter(
            countries__contains=[country_code],
            is_active=True
        ).first()

    @staticmethod
    def calculate_order_weight(cart_items: List[Dict]) -> Decimal:
        """Calculate total weight from cart items"""
        total_weight = Decimal('0.00')
        for item in cart_items:
            # Assuming each item has weight and quantity
            weight = Decimal(str(item.get('weight', 0.5)))  # Default 0.5kg
            quantity = item.get('quantity', 1)
            total_weight += weight * quantity
        return total_weight

    @staticmethod
    def get_available_methods(
        country_code: str,
        order_value: Decimal,
        cart_items: List[Dict] = None
    ) -> List[Dict]:
        """Get all available shipping methods for an order"""
        zone = ShippingCalculator.get_zone_by_country(country_code)
        if not zone:
            return []

        cart_items = cart_items or []
        weight = ShippingCalculator.calculate_order_weight(cart_items)
        quantity = sum(item.get('quantity', 1) for item in cart_items)

        # Get applicable rules
        rules = ShippingRule.objects.filter(
            zone=zone,
            is_active=True,
            method__is_active=True
        ).select_related('method').order_by('priority', 'price')

        available_methods = []
        processed_methods = set()

        for rule in rules:
            method_id = rule.method.id
            if method_id in processed_methods:
                continue

            if rule.applies_to_order(order_value, weight, quantity):
                cost = rule.calculate_shipping_cost(order_value)
                available_methods.append({
                    'id': method_id,
                    'name': rule.method.name,
                    'carrier': rule.method.carrier,
                    'description': rule.method.description,
                    'cost': float(cost),
                    'delivery_estimate': rule.method.delivery_estimate,
                    'min_days': rule.method.min_delivery_days,
                    'max_days': rule.method.max_delivery_days,
                    'is_free': cost == 0,
                })
                processed_methods.add(method_id)

        return available_methods

    @staticmethod
    def calculate_shipping_cost(
        method_id: int,
        country_code: str,
        order_value: Decimal,
        cart_items: List[Dict] = None
    ) -> Dict:
        """Calculate shipping cost for a specific method"""
        zone = ShippingCalculator.get_zone_by_country(country_code)
        if not zone:
            return {'error': 'Shipping not available to this country'}

        try:
            method = ShippingMethod.objects.get(id=method_id, is_active=True)
        except ShippingMethod.DoesNotExist:
            return {'error': 'Invalid shipping method'}

        cart_items = cart_items or []
        weight = ShippingCalculator.calculate_order_weight(cart_items)
        quantity = sum(item.get('quantity', 1) for item in cart_items)

        # Find applicable rule
        rule = ShippingRule.objects.filter(
            zone=zone,
            method=method,
            is_active=True
        ).order_by('priority').first()

        if not rule or not rule.applies_to_order(order_value, weight, quantity):
            return {'error': 'Shipping method not available for this order'}

        cost = rule.calculate_shipping_cost(order_value)

        return {
            'method_id': method_id,
            'method_name': method.name,
            'cost': float(cost),
            'delivery_estimate': method.delivery_estimate,
            'is_free': cost == 0,
        }

    @staticmethod
    def get_cheapest_method(
        country_code: str,
        order_value: Decimal,
        cart_items: List[Dict] = None
    ) -> Optional[Dict]:
        """Get the cheapest available shipping method"""
        methods = ShippingCalculator.get_available_methods(
            country_code, order_value, cart_items
        )
        if not methods:
            return None

        return min(methods, key=lambda x: x['cost'])

    @staticmethod
    def get_fastest_method(
        country_code: str,
        order_value: Decimal,
        cart_items: List[Dict] = None
    ) -> Optional[Dict]:
        """Get the fastest available shipping method"""
        methods = ShippingCalculator.get_available_methods(
            country_code, order_value, cart_items
        )
        if not methods:
            return None

        return min(methods, key=lambda x: x['min_days'])