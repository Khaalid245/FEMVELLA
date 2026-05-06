from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import AuditLog, SecurityEvent, DataExportRequest
import json


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = [
        'created_at', 'user_email', 'action_type', 'action_description',
        'ip_address', 'risk_level_badge', 'is_suspicious'
    ]
    list_filter = [
        'action_type', 'risk_level', 'is_suspicious', 'created_at',
        'content_type'
    ]
    search_fields = [
        'user__email', 'action_description', 'ip_address',
        'request_path', 'user_agent'
    ]
    readonly_fields = [
        'created_at', 'updated_at', 'user', 'action_type',
        'action_description', 'content_type', 'object_id',
        'ip_address', 'user_agent', 'request_method', 'request_path',
        'old_values_formatted', 'new_values_formatted', 'metadata_formatted'
    ]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def user_email(self, obj):
        return obj.user.email if obj.user else 'Anonymous'
    user_email.short_description = 'User'
    
    def risk_level_badge(self, obj):
        colors = {
            'low': '#28a745',
            'medium': '#ffc107',
            'high': '#fd7e14',
            'critical': '#dc3545'
        }
        color = colors.get(obj.risk_level, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.risk_level.upper()
        )
    risk_level_badge.short_description = 'Risk Level'
    
    def old_values_formatted(self, obj):
        if obj.old_values:
            return format_html('<pre>{}</pre>', json.dumps(obj.old_values, indent=2))
        return '-'
    old_values_formatted.short_description = 'Old Values'
    
    def new_values_formatted(self, obj):
        if obj.new_values:
            return format_html('<pre>{}</pre>', json.dumps(obj.new_values, indent=2))
        return '-'
    new_values_formatted.short_description = 'New Values'
    
    def metadata_formatted(self, obj):
        if obj.metadata:
            return format_html('<pre>{}</pre>', json.dumps(obj.metadata, indent=2))
        return '-'
    metadata_formatted.short_description = 'Metadata'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(SecurityEvent)
class SecurityEventAdmin(admin.ModelAdmin):
    list_display = [
        'created_at', 'event_type', 'severity_badge', 'ip_address',
        'user_email', 'country', 'is_resolved'
    ]
    list_filter = [
        'event_type', 'severity', 'is_resolved', 'created_at', 'country'
    ]
    search_fields = [
        'ip_address', 'description', 'user__email', 'user_agent'
    ]
    readonly_fields = [
        'created_at', 'updated_at', 'event_type', 'ip_address',
        'user_agent', 'user', 'description', 'request_data_formatted',
        'response_status', 'country', 'city'
    ]
    fields = [
        'event_type', 'severity', 'ip_address', 'user_agent', 'user',
        'description', 'request_data_formatted', 'response_status',
        'country', 'city', 'is_resolved', 'resolved_by', 'resolution_notes',
        'created_at', 'updated_at'
    ]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def user_email(self, obj):
        return obj.user.email if obj.user else 'Anonymous'
    user_email.short_description = 'User'
    
    def severity_badge(self, obj):
        colors = {
            'info': '#17a2b8',
            'warning': '#ffc107',
            'error': '#fd7e14',
            'critical': '#dc3545'
        }
        color = colors.get(obj.severity, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.severity.upper()
        )
    severity_badge.short_description = 'Severity'
    
    def request_data_formatted(self, obj):
        if obj.request_data:
            return format_html('<pre>{}</pre>', json.dumps(obj.request_data, indent=2))
        return '-'
    request_data_formatted.short_description = 'Request Data'
    
    def save_model(self, request, obj, form, change):
        if change and 'is_resolved' in form.changed_data and obj.is_resolved:
            obj.resolved_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(DataExportRequest)
class DataExportRequestAdmin(admin.ModelAdmin):
    list_display = [
        'created_at', 'user_email', 'request_type', 'status_badge',
        'file_size_formatted', 'download_count', 'expires_at'
    ]
    list_filter = ['request_type', 'status', 'created_at']
    search_fields = ['user__email']
    readonly_fields = [
        'created_at', 'updated_at', 'user', 'file_path',
        'file_size', 'processed_at'
    ]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    
    def status_badge(self, obj):
        colors = {
            'pending': '#6c757d',
            'processing': '#17a2b8',
            'completed': '#28a745',
            'failed': '#dc3545'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.status.upper()
        )
    status_badge.short_description = 'Status'
    
    def file_size_formatted(self, obj):
        if obj.file_size:
            # Convert bytes to human readable format
            for unit in ['B', 'KB', 'MB', 'GB']:
                if obj.file_size < 1024.0:
                    return f"{obj.file_size:.1f} {unit}"
                obj.file_size /= 1024.0
            return f"{obj.file_size:.1f} TB"
        return '-'
    file_size_formatted.short_description = 'File Size'