import pytest
import json
from unittest.mock import patch, Mock
from django.test import Client
from django.urls import reverse
from apps.orders.models import Order, Payment
from apps.payments.webhooks import handle_stripe_webhook

@pytest.mark.django_db
class TestPaymentWebhooks:
    
    def setUp(self):
        self.client = Client()
    
    @patch('stripe.Webhook.construct_event')
    def test_payment_success_webhook(self, mock_construct_event, user, product_variant):
        """Test successful payment webhook processing"""
        # Create order
        order = Order.objects.create(
            user=user,
            status='pending',
            total_amount=99.99
        )
        
        # Mock Stripe event
        mock_event = Mock()
        mock_event.type = 'payment_intent.succeeded'
        mock_event.data = Mock()
        mock_event.data.object = Mock()
        mock_event.data.object.id = 'pi_test123'
        mock_event.data.object.metadata = {'order_id': str(order.id)}
        mock_construct_event.return_value = mock_event
        
        url = reverse('stripe_webhook')
        response = self.client.post(
            url,
            data='{"type": "payment_intent.succeeded"}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_signature'
        )
        
        assert response.status_code == 200
        
        order.refresh_from_db()
        assert order.status == 'confirmed'
        assert order.payments.filter(status='completed').exists()
    
    @patch('stripe.Webhook.construct_event')
    def test_payment_failed_webhook(self, mock_construct_event, user):
        """Test failed payment webhook processing"""
        order = Order.objects.create(
            user=user,
            status='pending',
            total_amount=99.99
        )
        
        mock_event = Mock()
        mock_event.type = 'payment_intent.payment_failed'
        mock_event.data = Mock()
        mock_event.data.object = Mock()
        mock_event.data.object.id = 'pi_test123'
        mock_event.data.object.metadata = {'order_id': str(order.id)}
        mock_construct_event.return_value = mock_event
        
        url = reverse('stripe_webhook')
        response = self.client.post(
            url,
            data='{"type": "payment_intent.payment_failed"}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_signature'
        )
        
        assert response.status_code == 200
        
        order.refresh_from_db()
        assert order.status == 'cancelled'
    
    def test_invalid_signature(self):
        """Test webhook with invalid signature"""
        url = reverse('stripe_webhook')
        response = self.client.post(
            url,
            data='{"type": "payment_intent.succeeded"}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='invalid_signature'
        )
        
        assert response.status_code == 400
    
    @patch('stripe.Webhook.construct_event')
    def test_unknown_event_type(self, mock_construct_event):
        """Test webhook with unknown event type"""
        mock_event = Mock()
        mock_event.type = 'unknown.event'
        mock_construct_event.return_value = mock_event
        
        url = reverse('stripe_webhook')
        response = self.client.post(
            url,
            data='{"type": "unknown.event"}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_signature'
        )
        
        assert response.status_code == 200  # Should handle gracefully

@pytest.mark.django_db
class TestPaymentService:
    
    @patch('stripe.PaymentIntent.create')
    def test_create_payment_intent(self, mock_create, user):
        """Test payment intent creation"""
        from apps.payments.services import PaymentService
        
        mock_create.return_value = Mock(
            id='pi_test123',
            client_secret='pi_test123_secret_test'
        )
        
        order = Order.objects.create(
            user=user,
            status='pending',
            total_amount=99.99
        )
        
        service = PaymentService()
        result = service.create_payment_intent(order)
        
        assert result['payment_intent_id'] == 'pi_test123'
        assert result['client_secret'] == 'pi_test123_secret_test'
        
        mock_create.assert_called_once_with(
            amount=9999,  # Amount in cents
            currency='usd',
            metadata={'order_id': str(order.id)}
        )