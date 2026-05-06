from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DataExportViewSet, AuditLogViewSet, SecurityEventViewSet, AdminAuditViewSet
)

router = DefaultRouter()
router.register(r'data-exports', DataExportViewSet, basename='data-exports')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')
router.register(r'security-events', SecurityEventViewSet, basename='security-events')
router.register(r'admin/audit', AdminAuditViewSet, basename='admin-audit')

urlpatterns = [
    path('', include(router.urls)),
]