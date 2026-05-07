from django.urls import path
from . import views

app_name = 'reviews'

urlpatterns = [
    # Product reviews
    path('product/<int:product_id>/', views.get_product_reviews, name='product_reviews'),
    path('product/<int:product_id>/rating/', views.get_product_rating_summary, name='product_rating'),
    path('product/<int:product_id>/create/', views.create_review, name='create_review'),
    path('product/<int:product_id>/eligibility/', views.check_review_eligibility, name='review_eligibility'),
    
    # Review interactions
    path('<int:review_id>/vote/', views.vote_review_helpfulness, name='vote_helpfulness'),
    path('<int:review_id>/delete/', views.delete_review, name='delete_review'),
    
    # User reviews
    path('my-reviews/', views.get_user_reviews, name='user_reviews'),
]