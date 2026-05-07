from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.http import HttpResponseRedirect
from django.contrib import messages
from .models import EmailTemplate, EmailLog
from .tasks import send_transactional_email, retry_failed_emails


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'active_status', 'updated_at']
    list_filter = ['template_type', 'is_active', 'created_at']
    search_fields = ['name', 'subject']
    list_editable = ['is_active']
    actions = ['activate_templates', 'deactivate_templates']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'template_type', 'is_active')
        }),
        ('Email Content', {
            'fields': ('subject', 'html_content', 'text_content')
        }),
    )

    def active_status(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green;">●</span> Active')
        return format_html('<span style="color: red;">●</span> Inactive')
    active_status.short_description = 'Status'

    def activate_templates(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"{queryset.count()} templates activated.")
    activate_templates.short_description = "Activate selected templates"

    def deactivate_templates(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"{queryset.count()} templates deactivated.")
    deactivate_templates.short_description = "Deactivate selected templates"


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = [
        'template_type', 'recipient_email', 'status_display', 
        'retry_info', 'sent_at', 'created_at'
    ]
    list_filter = [
        'status', 'template_type', 'created_at', 'sent_at'
    ]
    search_fields = ['recipient_email', 'subject', 'template_type']
    readonly_fields = [
        'id', 'created_at', 'sent_at', 'context_data_display'
    ]
    actions = ['retry_failed_emails_action', 'mark_as_sent']
    
    fieldsets = (
        ('Email Information', {
            'fields': ('template_type', 'recipient_email', 'recipient_user', 'subject')
        }),
        ('Status & Timing', {
            'fields': ('status', 'sent_at', 'created_at')
        }),
        ('Retry Information', {
            'fields': ('retry_count', 'max_retries', 'error_message')
        }),
        ('Context Data', {
            'fields': ('context_data_display',),
            'classes': ('collapse',)
        }),
    )

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('retry-all-failed/', self.retry_all_failed, name='retry_all_failed_emails'),
        ]
        return custom_urls + urls

    def status_display(self, obj):
        colors = {
            'pending': '#FFA500',
            'sent': '#28A745',
            'failed': '#DC3545',
            'retry': '#007BFF',
        }
        color = colors.get(obj.status, '#6C757D')
        return format_html(
            '<span style="color: {}; font-weight: bold;">●</span> {}',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Status'

    def retry_info(self, obj):
        if obj.retry_count > 0:
            return format_html(
                '<span style="color: #FFA500;">{}/{}</span>',
                obj.retry_count, obj.max_retries
            )
        return '-'
    retry_info.short_description = 'Retries'

    def context_data_display(self, obj):
        import json
        return format_html(
            '<pre style="background: #f8f9fa; padding: 10px; border-radius: 4px;">{}</pre>',
            json.dumps(obj.context_data, indent=2)
        )
    context_data_display.short_description = 'Context Data'

    def retry_failed_emails_action(self, request, queryset):
        failed_emails = queryset.filter(status='failed')
        retryable = [email for email in failed_emails if email.can_retry]
        
        for email_log in retryable:
            send_transactional_email.delay(str(email_log.id))
        
        self.message_user(
            request, 
            f"{len(retryable)} emails queued for retry out of {failed_emails.count()} failed emails."
        )
    retry_failed_emails_action.short_description = "Retry failed emails"

    def mark_as_sent(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status__in=['pending', 'failed']).update(
            status='sent',
            sent_at=timezone.now()
        )
        self.message_user(request, f"{updated} emails marked as sent.")
    mark_as_sent.short_description = "Mark as sent"

    def retry_all_failed(self, request):
        retry_failed_emails.delay()
        messages.success(request, "All failed emails have been queued for retry.")
        return HttpResponseRedirect("../")

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        
        # Add statistics
        from django.db.models import Count
        stats = EmailLog.objects.aggregate(
            total=Count('id'),
            sent=Count('id', filter=models.Q(status='sent')),
            failed=Count('id', filter=models.Q(status='failed')),
            pending=Count('id', filter=models.Q(status='pending')),
        )
        
        extra_context['email_stats'] = stats
        return super().changelist_view(request, extra_context)


# Custom admin site configuration
admin.site.site_header = "Femvelle Email Management"
admin.site.site_title = "Email Admin"
admin.site.index_title = "Email System Administration"