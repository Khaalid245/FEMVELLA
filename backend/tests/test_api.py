import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from apps.products.models import Product, ProductVariant
from apps.orders.models import Order

@pytest.mark.django_db
class TestProductAPI:
    
    def test_list_products(self, api_client, product):
        """Test product list endpoint"""
        url = reverse('product-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['name'] == 'Test Product'
    
    def test_product_detail(self, api_client, product):
        """Test product detail endpoint"""
        url = reverse('product-detail', kwargs={'slug': product.slug})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Test Product'
        assert response.data['slug'] == 'test-product'
    
    def test_product_variants(self, api_client, product_variant):
        """Test product variants in detail view"""
        url = reverse('product-detail', kwargs={'slug': product_variant.product.slug})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['variants']) == 1
        assert response.data['variants'][0]['sku'] == 'TEST-M-BLACK'

@pytest.mark.django_db
class TestOrderAPI:
    
    def test_create_order_authenticated(self, authenticated_client, product_variant):
        """Test order creation with authenticated user"""
        url = reverse('order-list')
        data = {
            'items': [
                {
                    'variant_id': product_variant.id,
                    'quantity': 2
                }
            ],
            'shipping_address': {
                'first_name': 'John',
                'last_name': 'Doe',
                'address_line_1': '123 Test St',
                'city': 'Test City',
                'postal_code': '12345',
                'country': 'US'
            }
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Order.objects.count() == 1
        
        order = Order.objects.first()
        assert order.items.count() == 1
        assert order.total_amount == Decimal('199.98')  # 2 * 99.99
    
    def test_create_order_unauthenticated(self, api_client, product_variant):
        """Test order creation fails without authentication"""
        url = reverse('order-list')
        data = {
            'items': [{'variant_id': product_variant.id, 'quantity': 1}]
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_order_stock_validation(self, authenticated_client, product_variant):
        """Test order creation with insufficient stock"""
        url = reverse('order-list')
        data = {
            'items': [
                {
                    'variant_id': product_variant.id,
                    'quantity': 15  # More than available stock (10)
                }
            ]
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'insufficient stock' in str(response.data).lower()

@pytest.mark.django_db
class TestAuthAPI:
    
    def test_user_registration(self, api_client):
        """Test user registration endpoint"""
        url = reverse('auth_register')
        data = {
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_user_login(self, api_client, user):
        """Test user login endpoint"""
        url = reverse('token_obtain_pair')
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_invalid_login(self, api_client):
        """Test login with invalid credentials"""
        url = reverse('token_obtain_pair')
        data = {
            'email': 'invalid@example.com',
            'password': 'wrongpass'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED