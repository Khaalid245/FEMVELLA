from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.security.models import SecurityEvent, SecurityIncident
from apps.security.services import SecurityLogger
import logging

logger = logging.getLogger('security')


class Command(BaseCommand):
    help = 'Monitor security events and create incidents for suspicious patterns'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=1,
            help='Number of hours to look back for events (default: 1)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without creating incidents'
        )

    def handle(self, *args, **options):
        hours = options['hours']
        dry_run = options['dry_run']
        
        self.stdout.write(f'Monitoring security events from the last {hours} hour(s)...')
        
        # Define time window
        since = timezone.now() - timedelta(hours=hours)
        
        # Check for suspicious patterns
        self.check_brute_force_attacks(since, dry_run)
        self.check_suspicious_activity_patterns(since, dry_run)
        self.check_failed_authentication_spikes(since, dry_run)
        self.check_admin_access_anomalies(since, dry_run)
        
        self.stdout.write(
            self.style.SUCCESS('Security monitoring completed successfully')
        )

    def check_brute_force_attacks(self, since, dry_run):
        """Check for brute force attack patterns"""
        # Group failed login attempts by IP
        from django.db.models import Count
        
        suspicious_ips = SecurityEvent.objects.filter(
            event_type='login_failed',
            timestamp__gte=since
        ).values('ip_address').annotate(
            attempt_count=Count('id')
        ).filter(attempt_count__gte=5)
        
        for ip_data in suspicious_ips:
            ip = ip_data['ip_address']
            count = ip_data['attempt_count']
            
            # Check if incident already exists
            existing = SecurityIncident.objects.filter(
                incident_type='brute_force',
                source_ip=ip,
                status__in=['open', 'investigating'],
                detected_at__gte=since
            ).exists()
            
            if not existing:
                if dry_run:
                    self.stdout.write(f'Would create brute force incident for IP {ip} ({count} attempts)')
                else:
                    SecurityLogger.create_security_incident(
                        incident_type='brute_force',
                        title=f'Brute force attack detected from {ip}',
                        description=f'IP {ip} made {count} failed login attempts in the last {since} hours',
                        severity='high' if count >= 10 else 'medium',
                        source_ip=ip,
                        attack_vector='authentication'
                    )
                    self.stdout.write(f'Created brute force incident for IP {ip}')

    def check_suspicious_activity_patterns(self, since, dry_run):
        """Check for patterns of suspicious activity"""
        from django.db.models import Count
        
        # Group suspicious activities by IP
        suspicious_ips = SecurityEvent.objects.filter(
            event_type='suspicious_activity',
            timestamp__gte=since
        ).values('ip_address').annotate(
            activity_count=Count('id')
        ).filter(activity_count__gte=3)
        
        for ip_data in suspicious_ips:
            ip = ip_data['ip_address']
            count = ip_data['activity_count']
            
            # Check if incident already exists
            existing = SecurityIncident.objects.filter(
                incident_type='suspicious_pattern',
                source_ip=ip,
                status__in=['open', 'investigating'],
                detected_at__gte=since
            ).exists()
            
            if not existing:
                if dry_run:
                    self.stdout.write(f'Would create suspicious pattern incident for IP {ip} ({count} activities)')
                else:
                    SecurityLogger.create_security_incident(
                        incident_type='suspicious_pattern',
                        title=f'Suspicious activity pattern from {ip}',
                        description=f'IP {ip} triggered {count} suspicious activity alerts',
                        severity='high',
                        source_ip=ip,
                        attack_vector='multiple_vectors'
                    )
                    self.stdout.write(f'Created suspicious pattern incident for IP {ip}')

    def check_failed_authentication_spikes(self, since, dry_run):
        """Check for authentication failure spikes"""
        # Count total failed authentications
        failed_count = SecurityEvent.objects.filter(
            event_type__in=['login_failed', 'permission_denied'],
            timestamp__gte=since
        ).count()
        
        # Define threshold based on normal activity (adjust as needed)
        threshold = 50  # 50 failed attempts per hour is suspicious
        
        if failed_count >= threshold:
            # Check if incident already exists
            existing = SecurityIncident.objects.filter(
                incident_type='ddos_attack',
                status__in=['open', 'investigating'],
                detected_at__gte=since
            ).exists()
            
            if not existing:
                if dry_run:
                    self.stdout.write(f'Would create authentication spike incident ({failed_count} failures)')
                else:
                    SecurityLogger.create_security_incident(
                        incident_type='ddos_attack',
                        title='Authentication failure spike detected',
                        description=f'Detected {failed_count} authentication failures in the last hour, indicating possible DDoS or coordinated attack',
                        severity='critical' if failed_count >= 100 else 'high',
                        attack_vector='authentication_flood'
                    )
                    self.stdout.write(f'Created authentication spike incident ({failed_count} failures)')

    def check_admin_access_anomalies(self, since, dry_run):
        """Check for unusual admin access patterns"""
        # Check for admin access from new IPs
        admin_events = SecurityEvent.objects.filter(
            event_type='admin_access',
            timestamp__gte=since
        ).select_related('user')
        
        for event in admin_events:
            if not event.user:
                continue
                
            # Check if this IP has been used by this admin before
            previous_access = SecurityEvent.objects.filter(
                event_type='admin_access',
                user=event.user,
                ip_address=event.ip_address,
                timestamp__lt=event.timestamp - timedelta(days=1)
            ).exists()
            
            if not previous_access:
                # New IP for admin user
                existing = SecurityIncident.objects.filter(
                    incident_type='unauthorized_access',
                    description__contains=event.user.email,
                    status__in=['open', 'investigating'],
                    detected_at__gte=since
                ).exists()
                
                if not existing:
                    if dry_run:
                        self.stdout.write(f'Would create admin access anomaly for {event.user.email} from {event.ip_address}')
                    else:
                        SecurityLogger.create_security_incident(
                            incident_type='unauthorized_access',
                            title=f'Admin access from new IP: {event.user.email}',
                            description=f'Admin user {event.user.email} accessed admin panel from new IP {event.ip_address}',
                            severity='medium',
                            source_ip=event.ip_address,
                            attack_vector='admin_access'
                        )
                        self.stdout.write(f'Created admin access anomaly for {event.user.email}')