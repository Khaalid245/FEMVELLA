from celery.schedules import crontab

# Celery Beat Schedule for Analytics Tasks
CELERY_BEAT_SCHEDULE = {
    # Update daily analytics every day at 1 AM
    'update-daily-analytics': {
        'task': 'apps.analytics.tasks.update_daily_analytics',
        'schedule': crontab(hour=1, minute=0),
    },
    
    # Process abandoned carts every 2 hours
    'process-abandoned-carts': {
        'task': 'apps.analytics.tasks.process_abandoned_carts',
        'schedule': crontab(minute=0, hour='*/2'),
    },
    
    # Send cart recovery emails every 4 hours
    'send-cart-recovery-emails': {
        'task': 'apps.analytics.tasks.send_cart_recovery_emails',
        'schedule': crontab(minute=0, hour='*/4'),
    },
    
    # Update customer segments daily at 2 AM
    'update-customer-segments': {
        'task': 'apps.analytics.tasks.update_customer_segments',
        'schedule': crontab(hour=2, minute=0),
    },
    
    # Clean up old events weekly on Sunday at 3 AM
    'cleanup-old-events': {
        'task': 'apps.analytics.tasks.cleanup_old_events',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),
    },
    
    # Generate weekly report every Monday at 9 AM
    'generate-weekly-report': {
        'task': 'apps.analytics.tasks.generate_weekly_report',
        'schedule': crontab(hour=9, minute=0, day_of_week=1),
    },
    
    # Update search analytics daily at 4 AM
    'update-search-analytics': {
        'task': 'apps.analytics.tasks.update_search_analytics',
        'schedule': crontab(hour=4, minute=0),
    },

    # Update live exchange rates every hour
    'update-exchange-rates': {
        'task': 'apps.currency.tasks.update_exchange_rates',
        'schedule': crontab(minute=0),  # top of every hour
    },
}