import time
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache


def health_check(request):
    checks = {}
    status = 200

    # Database
    try:
        start = time.monotonic()
        connection.ensure_connection()
        checks["database"] = {"status": "ok", "latency_ms": round((time.monotonic() - start) * 1000, 2)}
    except Exception as e:
        checks["database"] = {"status": "error", "detail": str(e)}
        status = 503

    # Cache (Redis)
    try:
        start = time.monotonic()
        cache.set("health_check", "ok", timeout=5)
        val = cache.get("health_check")
        if val != "ok":
            raise ValueError("Cache read/write mismatch")
        checks["cache"] = {"status": "ok", "latency_ms": round((time.monotonic() - start) * 1000, 2)}
    except Exception as e:
        checks["cache"] = {"status": "error", "detail": str(e)}
        status = 503

    return JsonResponse(
        {"status": "ok" if status == 200 else "degraded", "checks": checks},
        status=status,
    )
