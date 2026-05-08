from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Currency
from .middleware import get_currencies


class CurrencyListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        currencies = [
            {
                "code": c.code,
                "name": c.name,
                "symbol": c.symbol,
                "is_default": c.is_default,
            }
            for c in get_currencies().values()
        ]
        active_code = getattr(request.currency, "code", None)
        return Response({"currencies": currencies, "active": active_code})


class SetCurrencyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get("code", "").upper()
        currencies = get_currencies()
        if code not in currencies:
            return Response({"detail": "Unsupported currency."}, status=400)
        response = Response({"code": code})
        response.set_cookie("currency", code, max_age=60 * 60 * 24 * 365, samesite="Lax")
        return response
