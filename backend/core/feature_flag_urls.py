from django.urls import path
from .feature_flag_views import feature_flags_view, set_user_flag_view, clear_user_flag_view

urlpatterns = [
    path("", feature_flags_view),
    path("override/", set_user_flag_view),
    path("override/clear/", clear_user_flag_view),
]
