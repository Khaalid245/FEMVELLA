from decimal import Decimal, ROUND_HALF_UP
from rest_framework import serializers


def convert_price(amount, currency):
    """Convert a Decimal price from base currency to target currency."""
    if amount is None or currency is None:
        return amount
    converted = Decimal(str(amount)) * Decimal(str(currency.exchange_rate))
    quantize = Decimal(10) ** -currency.decimal_places
    return converted.quantize(quantize, rounding=ROUND_HALF_UP)


class CurrencyPriceMixin:
    """
    Mixin for ModelSerializers that have `price` and optionally `sale_price`.
    Adds `currency`, `display_price`, `display_sale_price` to output.
    Reads currency from serializer context['request'].currency.
    """

    def get_currency(self):
        request = self.context.get("request")
        return getattr(request, "currency", None)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        currency = self.get_currency()
        if currency is None:
            return data

        data["currency"] = currency.code
        data["currency_symbol"] = currency.symbol

        if "price" in data and data["price"] is not None:
            data["display_price"] = str(convert_price(data["price"], currency))

        if "sale_price" in data and data["sale_price"] is not None:
            data["display_sale_price"] = str(convert_price(data["sale_price"], currency))

        return data
