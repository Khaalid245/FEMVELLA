import pytest
from decimal import Decimal
from django.test import TransactionTestCase
from django.db import transaction
from concurrent.futures import ThreadPoolExecutor
from apps.products.models import ProductVariant
from apps.products.inventory import InventoryService
from apps.orders.models import Order, OrderItem

@pytest.mark.django_db
class TestInventoryService:
    
    def test_reserve_stock_success(self, product_variant):
        """Test successful stock reservation"""
        service = InventoryService()
        
        result = service.reserve_stock(product_variant.id, 5)
        
        assert result is True
        product_variant.refresh_from_db()
        assert product_variant.stock_quantity == 5
        assert product_variant.reserved_quantity == 5
    
    def test_reserve_stock_insufficient(self, product_variant):
        """Test stock reservation with insufficient quantity"""
        service = InventoryService()
        
        result = service.reserve_stock(product_variant.id, 15)
        
        assert result is False
        product_variant.refresh_from_db()
        assert product_variant.stock_quantity == 10
        assert product_variant.reserved_quantity == 0
    
    def test_release_stock(self, product_variant):
        """Test stock release"""
        service = InventoryService()
        service.reserve_stock(product_variant.id, 5)
        
        service.release_stock(product_variant.id, 3)
        
        product_variant.refresh_from_db()
        assert product_variant.stock_quantity == 8
        assert product_variant.reserved_quantity == 2
    
    def test_confirm_stock(self, product_variant):
        """Test stock confirmation"""
        service = InventoryService()
        service.reserve_stock(product_variant.id, 5)
        
        service.confirm_stock(product_variant.id, 5)
        
        product_variant.refresh_from_db()
        assert product_variant.stock_quantity == 5
        assert product_variant.reserved_quantity == 0
        assert product_variant.sold_quantity == 5

class TestInventoryConcurrency(TransactionTestCase):
    """Test inventory operations under concurrent access"""
    
    def setUp(self):
        from apps.products.models import Product, Category
        category = Category.objects.create(name='Test', slug='test')
        product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            category=category,
            price=Decimal('99.99')
        )
        self.variant = ProductVariant.objects.create(
            product=product,
            size='M',
            color='Black',
            sku='TEST-CONCURRENT',
            stock_quantity=10,
            price=Decimal('99.99')
        )
    
    def test_concurrent_reservations(self):
        """Test that concurrent reservations don't oversell"""
        service = InventoryService()
        
        def reserve_stock():
            return service.reserve_stock(self.variant.id, 6)
        
        # Try to reserve 6 items concurrently (should only succeed once)
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(reserve_stock) for _ in range(2)]
            results = [f.result() for f in futures]
        
        # Only one should succeed
        assert sum(results) == 1
        
        self.variant.refresh_from_db()
        assert self.variant.stock_quantity == 4
        assert self.variant.reserved_quantity == 6