import pytest
from unittest.mock import patch, Mock
from decimal import Decimal
from apps.emails.services import EmailService
from apps.shipping.services import ShippingCalculator
from apps.reviews.models import Review

@pytest.mark.django_db
class TestEmailService:
    
    @patch('apps.emails.tasks.send_email_task.delay')
    def test_send_order_confirmation(self, mock_task, user):
        """Test order confirmation email"""
        from apps.orders.models import Order
        
        order = Order.objects.create(
            user=user,
            status='confirmed',
            total_amount=Decimal('99.99')
        )
        
        service = EmailService()
        service.send_order_confirmation(order)
        
        mock_task.assert_called_once()
        args = mock_task.call_args[1]
        assert args['template_name'] == 'order_confirmation'
        assert args['to_email'] == user.email
        assert args['context']['order_id'] == str(order.id)
    
    @patch('apps.emails.tasks.send_email_task.delay')
    def test_send_welcome_email(self, mock_task, user):
        """Test welcome email"""
        service = EmailService()
        service.send_welcome_email(user)
        
        mock_task.assert_called_once()
        args = mock_task.call_args[1]
        assert args['template_name'] == 'welcome'
        assert args['to_email'] == user.email
        assert args['context']['user_name'] == user.first_name

@pytest.mark.django_db
class TestShippingCalculator:
    
    def test_calculate_shipping_cost(self, shipping_method, product_variant):
        """Test shipping cost calculation"""
        calculator = ShippingCalculator()
        
        items = [
            {'variant': product_variant, 'quantity': 2, 'weight': 0.5}
        ]
        
        cost = calculator.calculate_cost(shipping_method, items, 'US')
        
        assert cost == Decimal('9.99')  # Base shipping cost
    
    def test_free_shipping_threshold(self, shipping_method, product_variant):
        """Test free shipping over threshold"""
        # Set free shipping threshold
        shipping_method.free_shipping_threshold = Decimal('100.00')
        shipping_method.save()
        
        calculator = ShippingCalculator()
        
        # Order over threshold
        items = [
            {'variant': product_variant, 'quantity': 2, 'weight': 0.5, 'price': Decimal('60.00')}
        ]
        
        cost = calculator.calculate_cost(shipping_method, items, 'US')
        
        assert cost == Decimal('0.00')
    
    def test_weight_based_pricing(self, shipping_zone):
        """Test weight-based shipping pricing"""
        from apps.shipping.models import ShippingMethod
        
        method = ShippingMethod.objects.create(
            zone=shipping_zone,
            name='Weight Based',
            price_per_kg=Decimal('5.00'),
            min_delivery_days=3,
            max_delivery_days=7
        )
        
        calculator = ShippingCalculator()
        
        items = [
            {'variant': None, 'quantity': 1, 'weight': 2.5}  # 2.5kg
        ]
        
        cost = calculator.calculate_cost(method, items, 'US')
        
        assert cost == Decimal('12.50')  # 2.5 * 5.00

@pytest.mark.django_db
class TestReviewService:
    
    def test_create_review(self, user, product):
        """Test review creation"""
        review_data = {
            'rating': 5,
            'title': 'Great product!',
            'content': 'Really happy with this purchase.',
            'is_verified_purchase': True
        }
        
        review = Review.objects.create(
            user=user,
            product=product,
            **review_data
        )
        
        assert review.rating == 5
        assert review.title == 'Great product!'
        assert review.is_verified_purchase is True
    
    def test_review_moderation(self, user, product):
        """Test review moderation workflow"""
        review = Review.objects.create(
            user=user,
            product=product,
            rating=1,
            title='Terrible product',
            content='This product is awful and I hate it.',
            status='pending'
        )
        
        # Simulate moderation approval
        review.status = 'approved'
        review.save()
        
        assert review.status == 'approved'
    
    def test_review_helpfulness(self, user, product):
        """Test review helpfulness voting"""
        from apps.reviews.models import ReviewHelpfulness
        
        review = Review.objects.create(
            user=user,
            product=product,
            rating=4,
            title='Good product',
            content='Pretty good overall.'
        )
        
        # Add helpfulness vote
        ReviewHelpfulness.objects.create(
            review=review,
            user=user,
            is_helpful=True
        )
        
        assert review.helpfulness_votes.filter(is_helpful=True).count() == 1