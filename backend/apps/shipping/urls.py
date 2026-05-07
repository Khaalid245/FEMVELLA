from django.urls import path
from . import views

app_name = 'shipping'

urlpatterns = [
    path('methods/', views.get_shipping_methods, name='methods'),
    path('calculate/', views.calculate_shipping, name='calculate'),
    path('recommendations/', views.get_shipping_recommendations, name='recommendations'),
]