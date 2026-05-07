from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from core.feature_flags import (
    get_all_flags,
    set_user_flag,
    clear_user_flag,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def feature_flags_view(request):
    """
    GET /api/feature-flags/
    Returns all feature flags resolved for the current user/environment.
    Frontend calls this once on boot and caches the result.
    """
    return Response(get_all_flags(request))


@api_view(["POST"])
@permission_classes([IsAdminUser])
def set_user_flag_view(request):
    """
    POST /api/feature-flags/override/
    Body: { user_id, flag_name, enabled, ttl? }
    Allows staff to enable unreleased features for specific users.
    """
    user_id = request.data.get("user_id")
    flag_name = request.data.get("flag_name")
    enabled = request.data.get("enabled")
    ttl = int(request.data.get("ttl", 86400))

    if not all([user_id, flag_name, enabled is not None]):
        return Response(
            {"detail": "user_id, flag_name, and enabled are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    set_user_flag(int(user_id), flag_name, bool(enabled), ttl)
    return Response({"status": "ok", "flag": flag_name, "enabled": enabled, "user_id": user_id})


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def clear_user_flag_view(request):
    """
    DELETE /api/feature-flags/override/
    Body: { user_id, flag_name }
    """
    user_id = request.data.get("user_id")
    flag_name = request.data.get("flag_name")

    if not all([user_id, flag_name]):
        return Response(
            {"detail": "user_id and flag_name are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    clear_user_flag(int(user_id), flag_name)
    return Response({"status": "cleared"})
