from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from .models import ContactInquiry
from .serializers import ContactInquirySerializer

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
@never_cache
def contact_inquiry(request):
    """
    Create a new contact inquiry
    """
    # Simple rate limiting check - max 5 submissions per IP per hour
    client_ip = get_client_ip(request)
    recent_submissions = ContactInquiry.objects.filter(
        ip_address=client_ip,
        created_at__gte=timezone.now() - timedelta(hours=1)
    ).count()
    
    if recent_submissions >= 5:
        return Response(
            {'error': 'Too many submissions. Please try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    serializer = ContactInquirySerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        inquiry = serializer.save()
        
        # Optional: Send email notification to admin
        # send_contact_notification.delay(inquiry.id)
        
        return Response(
            {'message': 'Thank you for your message. We will get back to you soon.'},
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

# Import at the end to avoid circular imports
from django.utils import timezone
from datetime import timedelta