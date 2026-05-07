from django.urls import path
from . import views

app_name = 'wishlist'

urlpatterns = [
    path('', views.get_wishlist, name='get_wishlist'),
    path('add/', views.add_to_wishlist, name='add_to_wishlist'),
    path('remove/', views.remove_from_wishlist, name='remove_from_wishlist'),
    path('toggle/', views.toggle_wishlist, name='toggle_wishlist'),
    path('clear/', views.clear_wishlist, name='clear_wishlist'),
    path('check/<int:product_id>/', views.check_wishlist_status, name='check_wishlist_status'),
]