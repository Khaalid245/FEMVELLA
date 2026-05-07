from celery import Celery
from celery.schedules import crontab
from django.conf import settings

app = Celery('femvelle')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Periodic tasks for email system
app.conf.beat_schedule = {
    # Retry failed emails every 30 minutes
    'retry-failed-emails': {
        'task': 'apps.emails.tasks.retry_failed_emails',
        'schedule': crontab(minute='*/30'),
    },
    
    # Clean up old email logs (older than 30 days) daily at 2 AM
    'cleanup-old-email-logs': {
        'task': 'apps.emails.tasks.cleanup_old_email_logs',
        'schedule': crontab(hour=2, minute=0),
    },
    
    # Send daily email statistics to admin at 9 AM
    'daily-email-stats': {
        'task': 'apps.emails.tasks.send_daily_email_stats',
        'schedule': crontab(hour=9, minute=0),
    },
}

app.conf.timezone = 'UTC'