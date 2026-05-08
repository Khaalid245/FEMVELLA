from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.http import HttpResponseRedirect
from django.contrib import messages
from django.utils import timezone
from django.db.models import Count, Q
from .models import SecurityEvent, AdminActionLog, DataAccessLog, SecurityIncident


@admin.register(SecurityEvent)
class SecurityEventAdmin(admin.ModelAdmin):
    list_display = [
        'event_type', 'severity_display', 'user_email', 'ip_address', 
        'path', 'timestamp'
    ]
    list_filter = [
        'event_type', 'severity', 'timestamp', 'method'
    ]
    search_fields = [
        'user__email', 'ip_address', 'path', 'description'
    ]
    readonly_fields = [
        'event_type', 'severity', 'user', 'ip_address', 'user_agent',
        'session_key', 'method', 'path', 'query_params', 'description',
        'additional_data', 'timestamp'
    ]
    date_hierarchy = 'timestamp'
    actions = ['create_incident_from_events', 'mark_as_investigated']

    fieldsets = (
        ('Event Information', {
            'fields': ('event_type', 'severity', 'timestamp', 'description')
        }),
        ('User & Session', {
            'fields': ('user', 'ip_address', 'user_agent', 'session_key')
        }),
        ('Request Details', {
            'fields': ('method', 'path', 'query_params'),
            'classes': ('collapse',)
        }),
        ('Additional Data', {
            'fields': ('additional_data',),
            'classes': ('collapse',)
        }),
    )

    def user_email(self, obj):
        return obj.user.email if obj.user else 'Anonymous'
    user_email.short_description = 'User'
    user_email.admin_order_field = 'user__email'

    def severity_display(self, obj):
        colors = {
            'low': '#28a745',
            'medium': '#ffc107',
            'high': '#fd7e14',
            'critical': '#dc3545',
        }
        color = colors.get(obj.severity, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">●</span> {}',
            color, obj.get_severity_display()
        )
    severity_display.short_description = 'Severity'

    def create_incident_from_events(self, request, queryset):
        """Create security incident from selected events"""
        if queryset.count() > 10:
            self.message_user(request, "Cannot create incident from more than 10 events", level=messages.ERROR)
            return

        # Create incident
        event_types = list(queryset.values_list('event_type', flat=True).distinct())
        incident = SecurityIncident.objects.create(
            incident_type='suspicious_pattern',
            severity='medium',
            title=f"Multiple security events: {', '.join(event_types[:3])}",
            description=f"Incident created from {queryset.count()} security events",
            affected_systems=['web_application']
        )

        self.message_user(request, f"Created incident {incident.incident_id}")
    create_incident_from_events.short_description = "Create incident from events"

    def mark_as_investigated(self, request, queryset):
        """Mark events as investigated"""
        count = queryset.count()
        # Add investigated flag to additional_data
        for event in queryset:
            event.additional_data['investigated'] = True
            event.additional_data['investigated_by'] = request.user.email
            event.additional_data['investigated_at'] = timezone.now().isoformat()
            event.save()
        
        self.message_user(request, f"Marked {count} events as investigated")
    mark_as_investigated.short_description = "Mark as investigated"


@admin.register(AdminActionLog)
class AdminActionLogAdmin(admin.ModelAdmin):
    list_display = [
        'user_email', 'action_type', 'object_repr', 'risk_level_display',
        'affected_count', 'timestamp'
    ]
    list_filter = [
        'action_type', 'risk_level', 'timestamp', 'content_type'
    ]
    search_fields = [
        'user__email', 'object_repr', 'description'
    ]
    readonly_fields = [
        'user', 'action_type', 'content_type', 'object_id', 'object_repr',
        'changes', 'affected_count', 'ip_address', 'user_agent', 'session_key',
        'description', 'risk_level', 'timestamp'
    ]
    date_hierarchy = 'timestamp'

    fieldsets = (
        ('Action Information', {
            'fields': ('user', 'action_type', 'risk_level', 'timestamp')
        }),
        ('Target Object', {
            'fields': ('content_type', 'object_id', 'object_repr', 'affected_count')
        }),
        ('Changes', {
            'fields': ('changes', 'description'),
            'classes': ('collapse',)
        }),
        ('Request Context', {
            'fields': ('ip_address', 'user_agent', 'session_key'),
            'classes': ('collapse',)
        }),
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    user_email.admin_order_field = 'user__email'

    def risk_level_display(self, obj):
        colors = {
            'low': '#28a745',
            'medium': '#ffc107',
            'high': '#dc3545',
        }
        color = colors.get(obj.risk_level, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">●</span> {}',
            color, obj.get_risk_level_display()
        )
    risk_level_display.short_description = 'Risk Level'


@admin.register(DataAccessLog)
class DataAccessLogAdmin(admin.ModelAdmin):
    list_display = [
        'user_email', 'access_type', 'model_name', 'record_count',
        'purpose', 'timestamp'
    ]
    list_filter = [
        'access_type', 'model_name', 'timestamp'
    ]
    search_fields = [
        'user__email', 'model_name', 'purpose'
    ]
    readonly_fields = [
        'user', 'access_type', 'model_name', 'record_count', 'fields_accessed',
        'purpose', 'ip_address', 'user_agent', 'query_params', 'filters_applied',
        'timestamp'
    ]
    date_hierarchy = 'timestamp'

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    user_email.admin_order_field = 'user__email'


@admin.register(SecurityIncident)
class SecurityIncidentAdmin(admin.ModelAdmin):
    list_display = [
        'incident_id', 'title', 'incident_type', 'severity_display',
        'status', 'status_display', 'assigned_to', 'detected_at'
    ]
    list_filter = [
        'incident_type', 'severity', 'status', 'detected_at'
    ]
    search_fields = [
        'incident_id', 'title', 'description', 'source_ip'
    ]
    list_editable = ['status', 'assigned_to']
    actions = [
        'mark_as_resolved', 'mark_as_false_positive', 'escalate_to_critical'
    ]
    date_hierarchy = 'detected_at'

    fieldsets = (
        ('Incident Information', {
            'fields': ('incident_id', 'incident_type', 'severity', 'status', 'title')
        }),
        ('Description', {
            'fields': ('description', 'affected_systems', 'affected_users')
        }),
        ('Source Information', {
            'fields': ('source_ip', 'source_country', 'attack_vector')
        }),
        ('Response & Resolution', {
            'fields': ('assigned_to', 'response_actions', 'mitigation_steps', 'lessons_learned')
        }),
        ('Timestamps', {
            'fields': ('detected_at', 'resolved_at'),
            'classes': ('collapse',)
        }),
    )

    def severity_display(self, obj):
        colors = {
            'low': '#28a745',
            'medium': '#ffc107',
            'high': '#fd7e14',
            'critical': '#dc3545',
        }
        color = colors.get(obj.severity, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">●</span> {}',
            color, obj.get_severity_display()
        )
    severity_display.short_description = 'Severity'

    def status_display(self, obj):
        colors = {
            'open': '#dc3545',
            'investigating': '#ffc107',
            'contained': '#fd7e14',
            'resolved': '#28a745',
            'false_positive': '#6c757d',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">●</span> {}',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Status'

    def mark_as_resolved(self, request, queryset):
        """Mark incidents as resolved"""
        updated = queryset.update(
            status='resolved',
            resolved_at=timezone.now()
        )
        self.message_user(request, f"{updated} incidents marked as resolved")
    mark_as_resolved.short_description = "Mark as resolved"

    def mark_as_false_positive(self, request, queryset):
        """Mark incidents as false positive"""
        updated = queryset.update(
            status='false_positive',
            resolved_at=timezone.now()
        )
        self.message_user(request, f"{updated} incidents marked as false positive")
    mark_as_false_positive.short_description = "Mark as false positive"

    def escalate_to_critical(self, request, queryset):
        """Escalate incidents to critical severity"""
        updated = queryset.update(severity='critical')
        self.message_user(request, f"{updated} incidents escalated to critical")
    escalate_to_critical.short_description = "Escalate to critical"

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        
        # Add incident statistics
        stats = SecurityIncident.objects.aggregate(
            total=Count('id'),
            open=Count('id', filter=Q(status='open')),
            investigating=Count('id', filter=Q(status='investigating')),
            critical=Count('id', filter=Q(severity='critical')),
            high=Count('id', filter=Q(severity='high')),
        )
        
        extra_context['incident_stats'] = stats
        return super().changelist_view(request, extra_context)


# Custom admin site configuration
admin.site.site_header = "Femvelle Security Center"
admin.site.site_title = "Security Admin"
admin.site.index_title = "Security Management Dashboard"