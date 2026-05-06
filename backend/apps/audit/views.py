from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse, Http404
from django.conf import settings
from django.utils import timezone
from django.core.files.storage import default_storage
from .models import DataExportRequest, AuditLog, SecurityEvent
from .serializers import (
    DataExportRequestSerializer, AuditLogSerializer, 
    SecurityEventSerializer, UserDataExportSerializer
)
from .tasks import process_data_export, process_data_deletion
import json
import os


class DataExportViewSet(viewsets.ModelViewSet):
    """
    GDPR compliance - data export and deletion requests
    """
    serializer_class = DataExportRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DataExportRequest.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Check if user already has a pending request
        existing_request = DataExportRequest.objects.filter(
            user=self.request.user,
            status__in=['pending', 'processing']
        ).first()
        
        if existing_request:
            raise serializers.ValidationError(
                "You already have a pending data request. Please wait for it to complete."
            )
        
        request_obj = serializer.save(user=self.request.user)
        
        # Queue background task to process the request
        if request_obj.request_type == 'export':
            process_data_export.delay(request_obj.id)
        elif request_obj.request_type == 'deletion':
            process_data_deletion.delay(request_obj.id)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Download exported data file
        """
        export_request = self.get_object()
        
        if export_request.status != 'completed':
            return Response(
                {'error': 'Export is not completed yet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if export_request.expires_at and export_request.expires_at < timezone.now():
            return Response(
                {'error': 'Download link has expired'},
                status=status.HTTP_410_GONE
            )
        
        if not export_request.file_path or not default_storage.exists(export_request.file_path):
            return Response(
                {'error': 'File not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Increment download count
        export_request.download_count += 1
        export_request.save(update_fields=['download_count'])
        
        # Serve file
        file_content = default_storage.open(export_request.file_path).read()
        response = HttpResponse(
            file_content,
            content_type='application/json'
        )
        response['Content-Disposition'] = f'attachment; filename="user_data_export_{export_request.id}.json"'
        
        return response
    
    @action(detail=False, methods=['get'])
    def my_data_summary(self, request):
        """
        Get summary of user's data for transparency
        """
        user = request.user
        
        # Count user's data across different models
        from apps.orders.models import Order
        from apps.products.models import Product
        
        summary = {
            'personal_info': {
                'email': user.email,
                'username': user.username,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
            },
            'data_counts': {
                'orders': Order.objects.filter(user=user).count(),
                'audit_logs': AuditLog.objects.filter(user=user).count(),
                'security_events': SecurityEvent.objects.filter(user=user).count(),
            },
            'rights': {
                'can_export_data': True,
                'can_delete_data': True,
                'can_update_data': True,
                'data_retention_period': '7 years for orders, 2 years for logs'
            }
        }
        
        return Response(summary)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    User's audit logs (read-only for transparency)
    """
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own audit logs
        return AuditLog.objects.filter(user=self.request.user)


class SecurityEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    User's security events (read-only for transparency)
    """
    serializer_class = SecurityEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own security events
        return SecurityEvent.objects.filter(user=self.request.user)


class AdminAuditViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only access to all audit logs
    """
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        return AuditLog.objects.all()
    
    @action(detail=False, methods=['get'])
    def security_dashboard(self, request):
        """
        Security dashboard data for admins
        """
        from django.db.models import Count, Q
        from datetime import timedelta
        
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        
        # Security metrics
        metrics = {
            'failed_logins_24h': SecurityEvent.objects.filter(
                event_type=SecurityEvent.EventType.FAILED_LOGIN,
                created_at__gte=last_24h
            ).count(),
            
            'suspicious_activities_24h': AuditLog.objects.filter(
                is_suspicious=True,
                created_at__gte=last_24h
            ).count(),
            
            'high_risk_events_7d': AuditLog.objects.filter(
                risk_level__in=['high', 'critical'],
                created_at__gte=last_7d
            ).count(),
            
            'unresolved_security_events': SecurityEvent.objects.filter(
                is_resolved=False,
                severity__in=['error', 'critical']
            ).count(),
            
            'top_suspicious_ips': SecurityEvent.objects.filter(
                created_at__gte=last_7d
            ).values('ip_address').annotate(
                count=Count('id')
            ).order_by('-count')[:10],
            
            'recent_admin_actions': AuditLog.objects.filter(
                action_type=AuditLog.ActionType.ADMIN_ACTION,
                created_at__gte=last_24h
            ).count()
        }
        
        return Response(metrics)