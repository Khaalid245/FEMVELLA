from django.urls import path
from .views import contact_inquiry

urlpatterns = [
    path('', contact_inquiry, name='contact-inquiry'),
]