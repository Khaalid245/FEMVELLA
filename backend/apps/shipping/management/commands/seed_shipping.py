from django.core.management.base import BaseCommand
from apps.shipping.models import ShippingZone, ShippingMethod, ShippingRule
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seed shipping data with zones, methods, and rules'

    def handle(self, *args, **options):
        self.stdout.write('Seeding shipping data...')

        # Create Shipping Zones
        zones_data = [
            {
                'name': 'United States',
                'countries': ['US'],
            },
            {
                'name': 'Canada',
                'countries': ['CA'],
            },
            {
                'name': 'Europe',
                'countries': ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH'],
            },
            {
                'name': 'Asia Pacific',
                'countries': ['AU', 'NZ', 'JP', 'SG', 'HK'],
            },
            {
                'name': 'India',
                'countries': ['IN'],
            },
        ]

        zones = {}
        for zone_data in zones_data:
            zone, created = ShippingZone.objects.get_or_create(
                name=zone_data['name'],
                defaults={'countries': zone_data['countries']}
            )
            zones[zone.name] = zone
            if created:
                self.stdout.write(f'Created zone: {zone.name}')

        # Create Shipping Methods
        methods_data = [
            {
                'name': 'Standard Shipping',
                'carrier': 'standard',
                'description': 'Regular delivery service',
                'min_delivery_days': 5,
                'max_delivery_days': 7,
            },
            {
                'name': 'Express Shipping',
                'carrier': 'express',
                'description': 'Faster delivery service',
                'min_delivery_days': 2,
                'max_delivery_days': 3,
            },
            {
                'name': 'Overnight Shipping',
                'carrier': 'overnight',
                'description': 'Next day delivery',
                'min_delivery_days': 1,
                'max_delivery_days': 1,
            },
            {
                'name': 'Store Pickup',
                'carrier': 'pickup',
                'description': 'Pick up from store',
                'min_delivery_days': 0,
                'max_delivery_days': 0,
            },
        ]

        methods = {}
        for method_data in methods_data:
            method, created = ShippingMethod.objects.get_or_create(
                name=method_data['name'],
                defaults=method_data
            )
            methods[method.name] = method
            if created:
                self.stdout.write(f'Created method: {method.name}')

        # Create Shipping Rules
        rules_data = [
            # US Rules
            {
                'zone': 'United States',
                'method': 'Standard Shipping',
                'condition_type': 'flat',
                'price': Decimal('8.99'),
                'free_shipping_threshold': Decimal('75.00'),
            },
            {
                'zone': 'United States',
                'method': 'Express Shipping',
                'condition_type': 'flat',
                'price': Decimal('15.99'),
                'free_shipping_threshold': Decimal('150.00'),
            },
            {
                'zone': 'United States',
                'method': 'Overnight Shipping',
                'condition_type': 'flat',
                'price': Decimal('25.99'),
            },
            {
                'zone': 'United States',
                'method': 'Store Pickup',
                'condition_type': 'flat',
                'price': Decimal('0.00'),
            },
            
            # Canada Rules
            {
                'zone': 'Canada',
                'method': 'Standard Shipping',
                'condition_type': 'flat',
                'price': Decimal('12.99'),
                'free_shipping_threshold': Decimal('100.00'),
            },
            {
                'zone': 'Canada',
                'method': 'Express Shipping',
                'condition_type': 'flat',
                'price': Decimal('22.99'),
            },
            
            # Europe Rules
            {
                'zone': 'Europe',
                'method': 'Standard Shipping',
                'condition_type': 'flat',
                'price': Decimal('18.99'),
                'free_shipping_threshold': Decimal('125.00'),
            },
            {
                'zone': 'Europe',
                'method': 'Express Shipping',
                'condition_type': 'flat',
                'price': Decimal('35.99'),
            },
            
            # Asia Pacific Rules
            {
                'zone': 'Asia Pacific',
                'method': 'Standard Shipping',
                'condition_type': 'flat',
                'price': Decimal('24.99'),
                'free_shipping_threshold': Decimal('150.00'),
            },
            {
                'zone': 'Asia Pacific',
                'method': 'Express Shipping',
                'condition_type': 'flat',
                'price': Decimal('45.99'),
            },
            
            # India Rules
            {
                'zone': 'India',
                'method': 'Standard Shipping',
                'condition_type': 'flat',
                'price': Decimal('5.99'),
                'free_shipping_threshold': Decimal('50.00'),
            },
            {
                'zone': 'India',
                'method': 'Express Shipping',
                'condition_type': 'flat',
                'price': Decimal('12.99'),
                'free_shipping_threshold': Decimal('100.00'),
            },
        ]

        for rule_data in rules_data:
            zone = zones[rule_data['zone']]
            method = methods[rule_data['method']]
            
            rule, created = ShippingRule.objects.get_or_create(
                zone=zone,
                method=method,
                condition_type=rule_data['condition_type'],
                min_value=rule_data.get('min_value', 0),
                defaults={
                    'price': rule_data['price'],
                    'free_shipping_threshold': rule_data.get('free_shipping_threshold'),
                }
            )
            
            if created:
                self.stdout.write(f'Created rule: {zone.name} - {method.name}')

        self.stdout.write(
            self.style.SUCCESS('Successfully seeded shipping data!')
        )