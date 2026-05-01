from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from .models import PageView


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
        from django.db.models import Count
        stats = (
            PageView.objects.values("path")
            .annotate(views=Count("id"))
            .order_by("-views")[:20]
        )
        return Response(stats)
