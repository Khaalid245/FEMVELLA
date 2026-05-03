from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from apps.orders.models import Order
from apps.products.models import Product
from .models import PageView
from django.contrib.auth import get_user_model

User = get_user_model()


class PageViewCreateView(APIView):
    permission_classes = ()

    def post(self, request):
        PageView.objects.create(
            path=request.data.get("path", ""),
            referrer=request.data.get("referrer", ""),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            ip_address=request.META.get("REMOTE_ADDR"),
            session_key=request.session.session_key or "",
        )
        return Response({"status": "ok"}, status=201)


class PageViewStatsView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        stats = (
            PageView.objects.values("path")
            .annotate(views=Count("id"))
            .order_by("-views")[:20]
        )
        return Response(stats)


class AdminStatsView(APIView):
    """
    GET /api/analytics/admin-stats/
    Returns KPI cards + revenue chart data for the last 30 days.
    """
    permission_classes = (IsAdminUser,)

    def get(self, request):
        now = timezone.now()
        today = now.date()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)

        paid_orders = Order.objects.filter(status="paid")
        total_revenue = paid_orders.aggregate(total=Sum("total_price"))["total"] or 0
        revenue_7d    = paid_orders.filter(created_at__gte=seven_days_ago).aggregate(total=Sum("total_price"))["total"] or 0
        revenue_today = paid_orders.filter(created_at__date=today).aggregate(total=Sum("total_price"))["total"] or 0

        total_orders  = Order.objects.count()
        orders_7d     = Order.objects.filter(created_at__gte=seven_days_ago).count()
        orders_today  = Order.objects.filter(created_at__date=today).count()
        total_products = Product.objects.filter(is_active=True).count()
        low_stock      = Product.objects.filter(is_active=True, stock__lte=5).count()
        total_customers = User.objects.filter(is_staff=False).count()

        # ── Revenue chart — last 30 days ──
        revenue_chart = (
            Order.objects.filter(status="paid", created_at__gte=thirty_days_ago)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(revenue=Sum("total_price"), orders=Count("id"))
            .order_by("date")
        )

        # ── Recent orders ──
        recent_orders = (
            Order.objects.select_related("user")
            .order_by("-created_at")[:5]
        )
        recent_orders_data = [
            {
                "id": o.pk,
                "user_email": o.user.email,
                "status": o.status,
                "total_price": str(o.total_price),
                "created_at": o.created_at.isoformat(),
            }
            for o in recent_orders
        ]

        # ── Order status breakdown ──
        status_breakdown = (
            Order.objects.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        return Response({
            "kpis": {
                "total_revenue":  float(total_revenue),
                "revenue_7d":     float(revenue_7d),
                "revenue_today":  float(revenue_today),
                "total_orders":   total_orders,
                "orders_7d":      orders_7d,
                "orders_today":   orders_today,
                "total_products": total_products,
                "low_stock":      low_stock,
                "total_customers": total_customers,
            },
            "revenue_chart": [
                {
                    "date": str(r["date"]),
                    "revenue": float(r["revenue"]),
                    "orders": r["orders"],
                }
                for r in revenue_chart
            ],
            "recent_orders": recent_orders_data,
            "status_breakdown": list(status_breakdown),
        })
