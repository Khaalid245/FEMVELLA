# PHASE 1 SETUP INSTRUCTIONS

## Step 1: Install Security Packages
Run these commands in your backend directory with venv activated:

```bash
pip install django-csp==3.8
pip install django-ratelimit==4.1.0  
pip install django-axes==6.5.1
pip install django-security==1.1.6
```

## Step 2: Create Migrations
```bash
python manage.py makemigrations audit
python manage.py migrate
```

## Step 3: Run Setup Script
```bash
python setup_phase1.py
```

## Step 4: Test the System
```bash
python manage.py runserver
```

Then visit:
- http://localhost:8000/admin/ (Django Admin)
- Check "Audit & Security" section

## Step 5: Test API Endpoints
```bash
# Test GDPR endpoint
curl -X GET http://localhost:8000/api/audit/data-exports/

# Test audit logs (requires authentication)
curl -X GET http://localhost:8000/api/audit/audit-logs/
```

## What You Get:
✅ Enterprise security hardening
✅ Comprehensive audit logging
✅ GDPR compliance system
✅ Security event monitoring
✅ Real-time threat detection

## Next Phase:
Once this works, we'll implement Phase 2: Performance & Scalability