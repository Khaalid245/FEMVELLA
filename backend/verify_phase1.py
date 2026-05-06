#!/usr/bin/env python3
"""
PHASE 1 VERIFICATION SCRIPT
===========================

This script verifies that all Phase 1 security features are working correctly.
Run this after completing the setup instructions.
"""

import os
import sys
import django
import requests
from pathlib import Path

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

def setup_django():
    """Initialize Django"""
    try:
        django.setup()
        return True
    except Exception as e:
        print(f"❌ Django setup failed: {e}")
        return False

def check_installed_packages():
    """Check if security packages are installed"""
    print("🔍 Checking installed security packages...")
    
    packages = [
        'csp',
        'django_ratelimit', 
        'axes',
        'security'
    ]
    
    for package in packages:
        try:
            __import__(package)
            print(f"✅ {package} installed")
        except ImportError:
            print(f"❌ {package} NOT installed")
            return False
    
    return True

def check_database_tables():
    """Check if audit tables exist"""
    print("\n🗄️ Checking database tables...")
    
    try:
        from apps.audit.models import AuditLog, SecurityEvent, DataExportRequest
        
        # Try to query each model
        AuditLog.objects.count()
        print("✅ AuditLog table exists")
        
        SecurityEvent.objects.count()
        print("✅ SecurityEvent table exists")
        
        DataExportRequest.objects.count()
        print("✅ DataExportRequest table exists")
        
        return True
        
    except Exception as e:
        print(f"❌ Database check failed: {e}")
        return False

def check_middleware():
    """Check if security middleware is configured"""
    print("\n⚙️ Checking middleware configuration...")
    
    from django.conf import settings
    
    required_middleware = [
        'csp.middleware.CSPMiddleware',
        'axes.middleware.AxesMiddleware',
        'apps.audit.middleware.AuditMiddleware'
    ]
    
    for middleware in required_middleware:
        if middleware in settings.MIDDLEWARE:
            print(f"✅ {middleware} configured")
        else:
            print(f"❌ {middleware} NOT configured")
            return False
    
    return True

def check_security_settings():
    """Check security settings"""
    print("\n🔒 Checking security settings...")
    
    from django.conf import settings
    
    # Check if security apps are installed
    security_apps = ['csp', 'axes', 'apps.audit']
    
    for app in security_apps:
        if app in settings.INSTALLED_APPS:
            print(f"✅ {app} app installed")
        else:
            print(f"❌ {app} app NOT installed")
            return False
    
    return True

def test_audit_logging():
    """Test audit logging functionality"""
    print("\n📝 Testing audit logging...")
    
    try:
        from apps.audit.models import AuditLog
        
        # Create test log
        test_log = AuditLog.objects.create(
            action_type='admin_action',
            action_description='Verification test',
            ip_address='127.0.0.1'
        )
        
        print("✅ Audit log created successfully")
        
        # Clean up
        test_log.delete()
        print("✅ Audit log cleanup successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Audit logging test failed: {e}")
        return False

def test_security_events():
    """Test security event logging"""
    print("\n🛡️ Testing security events...")
    
    try:
        from apps.audit.models import SecurityEvent
        
        # Create test event
        test_event = SecurityEvent.objects.create(
            event_type='suspicious_ip',
            severity='info',
            ip_address='127.0.0.1',
            description='Verification test'
        )
        
        print("✅ Security event created successfully")
        
        # Clean up
        test_event.delete()
        print("✅ Security event cleanup successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Security event test failed: {e}")
        return False

def check_api_endpoints():
    """Check if API endpoints are accessible"""
    print("\n🌐 Checking API endpoints...")
    
    base_url = "http://localhost:8000"
    
    endpoints = [
        "/api/audit/data-exports/",
        "/api/audit/audit-logs/",
        "/api/audit/security-events/"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code in [200, 401, 403]:  # 401/403 are OK (need auth)
                print(f"✅ {endpoint} accessible")
            else:
                print(f"❌ {endpoint} returned {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print(f"⚠️ {endpoint} - Server not running")
            return False
        except Exception as e:
            print(f"❌ {endpoint} error: {e}")
            return False
    
    return True

def check_logs_directory():
    """Check if logs directory exists"""
    print("\n📁 Checking logs directory...")
    
    logs_dir = Path('logs')
    
    if logs_dir.exists():
        print("✅ Logs directory exists")
        
        log_files = ['django.log', 'security.log', 'audit.log', 'performance.log']
        for log_file in log_files:
            log_path = logs_dir / log_file
            if log_path.exists():
                print(f"✅ {log_file} exists")
            else:
                print(f"⚠️ {log_file} missing (will be created on first use)")
        
        return True
    else:
        print("❌ Logs directory missing")
        return False

def main():
    """Main verification function"""
    print("🔍 PHASE 1 VERIFICATION")
    print("=" * 40)
    
    # Setup Django
    if not setup_django():
        return False
    
    # Run all checks
    checks = [
        check_installed_packages,
        check_database_tables,
        check_middleware,
        check_security_settings,
        test_audit_logging,
        test_security_events,
        check_logs_directory,
        check_api_endpoints
    ]
    
    passed = 0
    total = len(checks)
    
    for check in checks:
        if check():
            passed += 1
        print()  # Add spacing
    
    # Summary
    print("=" * 40)
    print(f"VERIFICATION COMPLETE: {passed}/{total} checks passed")
    
    if passed == total:
        print("🎉 ALL CHECKS PASSED! Phase 1 is working correctly.")
        print("\n🚀 You're ready for Phase 2: Performance & Scalability")
        return True
    else:
        print("⚠️ Some checks failed. Please review the output above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)