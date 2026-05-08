from django.urls import path
from .views import CurrencyListView, SetCurrencyView

urlpatterns = [
    path("", CurrencyListView.as_view(), name="currency-list"),
    path("set/", SetCurrencyView.as_view(), name="currency-set"),
]
