#!/usr/bin/env python3
"""
FEMVELLE ENTERPRISE UPGRADE - PHASE 1: SECURITY & COMPLIANCE
============================================================

This script sets up the security and compliance infrastructure for the enterprise upgrade.

WHAT THIS PHASE INCLUDES:
- Security hardening (rate limiting, CSRF protection, secure headers)
- Comprehensive audit logging system
- GDPR compliance (data export/deletion)
- Security event monitoring
- Enterprise logging configuration

USAGE:
    python setup_phase1.py

REQUIREMENTS:
- Django environment set up
- Database connection available
- Redis connection available
"""

import os
import sys
import django
from pathlib import Path

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

def setup_django():
    """Initialize Django"""
    try:
        django.setup()
        print("✅ Django initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Django initialization failed: {e}")
        return False

def create_migrations():
    """Create and run migrations for audit system"""
    print("\n🔄 Creating database migrations...")
    
    try:
        from django.core.management import execute_from_command_line
        
        # Create migrations
        execute_from_command_line(['manage.py', 'makemigrations', 'audit'])
        print("✅ Created audit migrations")
        
        # Run migrations
        execute_from_command_line(['manage.py', 'migrate'])
        print("✅ Applied migrations")
        
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

def create_logs_directory():
    """Create logs directory structure"""
    print("\n📁 Creating logs directory...")
    
    logs_dir = Path('logs')
    logs_dir.mkdir(exist_ok=True)
    
    # Create log files
    log_files = [
        'django.log',
        'security.log', 
        'audit.log',
        'performance.log'
    ]
    
    for log_file in log_files:
        log_path = logs_dir / log_file
        log_path.touch(exist_ok=True)
        print(f"✅ Created {log_file}")

def create_superuser_if_needed():
    """Create superuser if none exists"""
    print("\n👤 Checking for superuser...")
    
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if not User.objects.filter(is_superuser=True).exists():
            print("No superuser found. You can create one later with: python manage.py createsuperuser")
        else:
            print("✅ Superuser already exists")
            
    except Exception as e:
        print(f"❌ Superuser check failed: {e}")

def test_security_features():
    """Test that security features are working"""
    print("\n🔒 Testing security features...")
    
    try:
        # Test audit logging
        from apps.audit.models import AuditLog
        test_log = AuditLog.objects.create(
            action_type='admin_action',
            action_description='Phase 1 setup test',
            ip_address='127.0.0.1'
        )
        print("✅ Audit logging working")
        
        # Test security event logging
        from apps.audit.models import SecurityEvent
        test_event = SecurityEvent.objects.create(
            event_type='suspicious_ip',
            severity='info',
            ip_address='127.0.0.1',
            description='Phase 1 setup test'
        )
        print("✅ Security event logging working")
        
        # Clean up test records
        test_log.delete()
        test_event.delete()
        
        return True
        
    except Exception as e:
        print(f"❌ Security features test failed: {e}")
        return False

def display_next_steps():
    """Display next steps for the user"""
    print("\n" + "="*60)
    print("🎉 PHASE 1: SECURITY & COMPLIANCE - COMPLETED!")
    print("="*60)
    
    print("\n✅ WHAT WAS IMPLEMENTED:")
    print("• Security hardening (rate limiting, CSRF, secure headers)")
    print("• Comprehensive audit logging system")
    print("• GDPR compliance endpoints")
    print("• Security event monitoring")
    print("• Enterprise logging configuration")
    
    print("\n🔧 NEXT STEPS:")
    print("1. Start the server: python manage.py runserver")
    print("2. Test the admin interface: http://localhost:8000/admin/")
    print("3. Check audit logs in the admin under 'Audit & Security'")
    print("4. Test GDPR endpoints: /api/audit/data-exports/")
    print("5. Monitor security events in real-time")
    
    print("\n📚 NEW API ENDPOINTS:")
    print("• GET /api/audit/data-exports/ - List data export requests")
    print("• POST /api/audit/data-exports/ - Request data export/deletion")
    print("• GET /api/audit/audit-logs/ - View your audit logs")
    print("• GET /api/audit/security-events/ - View your security events")
    print("• GET /api/audit/data-exports/my_data_summary/ - GDPR data summary")
    
    print("\n⚠️  IMPORTANT:")
    print("• Review and update security settings in .env")
    print("• Set up proper SSL certificates for production")
    print("• Configure email settings for security alerts")
    print("• Test rate limiting and security features")
    
    print("\n🚀 READY FOR PHASE 2: PERFORMANCE & SCALABILITY")

def main():
    """Main setup function"""
    print("🚀 FEMVELLE ENTERPRISE UPGRADE - PHASE 1")
    print("Security & Compliance Setup")
    print("="*50)
    
    # Step 1: Setup Django
    if not setup_django():
        return False
    
    # Step 2: Create logs directory
    create_logs_directory()
    
    # Step 3: Create migrations
    if not create_migrations():
        return False
    
    # Step 4: Create superuser if needed
    create_superuser_if_needed()
    
    # Step 5: Test security features
    if not test_security_features():
        return False
    
    # Step 6: Display next steps
    display_next_steps()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)