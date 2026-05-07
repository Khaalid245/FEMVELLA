# Femvelle Production Deployment Architecture

## 🏗️ Infrastructure Overview

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer / CDN                      │
│                    (CloudFlare/AWS ALB)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                     Nginx Reverse Proxy                     │
│              (SSL Termination, Rate Limiting)               │
└─────────┬─────────────────────────────────┬─────────────────┘
          │                                 │
┌─────────▼─────────┐                ┌─────▼─────────────────┐
│   Frontend App    │                │    Backend API        │
│   (React/Vite)    │                │   (Django/DRF)       │
│   Static Files    │                │   Gunicorn + Gevent  │
└───────────────────┘                └─────┬─────────────────┘
                                           │
                              ┌────────────▼────────────────┐
                              │      Background Tasks       │
                              │    (Celery + Redis)         │
                              └─────────────────────────────┘
                                           │
                              ┌────────────▼────────────────┐
                              │        Database             │
                              │      (MySQL 8.0)           │
                              └─────────────────────────────┘
```

### Service Stack

- **Web Server**: Nginx (Reverse Proxy, SSL, Static Files)
- **Application**: Django 5 + DRF + Gunicorn
- **Frontend**: React 18 + Vite (Static Build)
- **Database**: MySQL 8.0 (Primary)
- **Cache**: Redis 7 (Sessions, Cache, Celery Broker)
- **Background Tasks**: Celery + Redis
- **File Storage**: AWS S3 (Media Files)
- **Monitoring**: Prometheus + Grafana + Node Exporter
- **Error Tracking**: Sentry
- **Logging**: JSON Structured Logs + Log Rotation

## 🚀 Deployment Process

### 1. Server Requirements

**Minimum Specifications:**
- **CPU**: 4 vCPUs
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1Gbps
- **OS**: Ubuntu 22.04 LTS

**Recommended Specifications:**
- **CPU**: 8 vCPUs
- **RAM**: 16GB
- **Storage**: 200GB SSD
- **Network**: 10Gbps

### 2. Quick Deployment

```bash
# 1. Clone repository
git clone https://github.com/your-org/femvelle.git
cd femvelle

# 2. Run deployment script
chmod +x deploy.sh
sudo ./deploy.sh

# 3. Configure environment
cp .env.prod.example .env
# Edit .env with production values

# 4. Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Manual Deployment Steps

#### A. System Setup
```bash
# Update system
apt update && apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

#### B. SSL Certificates
```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Generate certificates
certbot certonly --standalone -d femvelle.com -d www.femvelle.com -d api.femvelle.com

# Copy to project
cp /etc/letsencrypt/live/femvelle.com/fullchain.pem ./ssl/femvelle.com.crt
cp /etc/letsencrypt/live/femvelle.com/privkey.pem ./ssl/femvelle.com.key
```

#### C. Environment Configuration
```bash
# Database
DB_PASSWORD=secure_password_here
DB_ROOT_PASSWORD=secure_root_password

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_STORAGE_BUCKET_NAME=femvelle-media

# Sentry
SENTRY_DSN=https://your-dsn@sentry.io/project
```

#### D. Deploy Services
```bash
# Build and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec django python manage.py migrate

# Create superuser
docker-compose -f docker-compose.prod.yml exec django python manage.py createsuperuser

# Collect static files
docker-compose -f docker-compose.prod.yml exec django python manage.py collectstatic --noinput
```

## 🔒 Security Configuration

### SSL/TLS
- **TLS 1.2/1.3** only
- **HSTS** enabled (1 year)
- **Certificate pinning** via headers
- **Auto-renewal** via Let's Encrypt

### Security Headers
```nginx
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'..." always;
```

### Rate Limiting
- **API**: 10 requests/second
- **Login**: 5 attempts/minute
- **Global**: 100 requests/minute per IP

### Firewall Rules
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (redirect to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw deny 3000/tcp   # Grafana (internal only)
ufw deny 9090/tcp   # Prometheus (internal only)
```

## 📊 Monitoring & Observability

### Metrics Collection
- **System Metrics**: Node Exporter
- **Application Metrics**: Django Prometheus
- **Database Metrics**: MySQL Exporter
- **Web Server Metrics**: Nginx Exporter

### Dashboards
- **System Overview**: CPU, Memory, Disk, Network
- **Application Performance**: Response times, Error rates
- **Database Performance**: Queries, Connections, Slow queries
- **Business Metrics**: Orders, Revenue, User activity

### Alerting Rules
```yaml
# High error rate
- alert: HighErrorRate
  expr: rate(django_http_responses_total{status=~"5.."}[5m]) > 0.1
  
# High response time
- alert: HighResponseTime
  expr: django_http_request_duration_seconds{quantile="0.95"} > 2
  
# Database connections
- alert: HighDBConnections
  expr: mysql_global_status_threads_connected > 80
```

## 💾 Backup Strategy

### Automated Backups
- **Database**: Daily at 2 AM UTC
- **Media Files**: Daily at 3 AM UTC
- **Configuration**: Weekly
- **Retention**: 30 days local, 90 days S3

### Backup Verification
```bash
# Test database backup
docker-compose -f docker-compose.prod.yml run --rm backup /verify-backup.sh

# Restore test (staging environment)
docker-compose -f docker-compose.staging.yml run --rm restore /restore-backup.sh latest
```

### Disaster Recovery
1. **RTO**: 4 hours (Recovery Time Objective)
2. **RPO**: 24 hours (Recovery Point Objective)
3. **Backup Locations**: Local + AWS S3 + Cross-region replication

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
1. **Test**: Run backend/frontend tests
2. **Security Scan**: Trivy vulnerability scanning
3. **Build**: Docker images with multi-stage builds
4. **Deploy**: Zero-downtime deployment
5. **Verify**: Health checks and smoke tests
6. **Backup**: Trigger post-deployment backup

### Deployment Strategy
- **Blue-Green Deployment**: Zero downtime
- **Health Checks**: Automated verification
- **Rollback**: Automatic on failure
- **Notifications**: Slack/Email alerts

## 📝 Logging

### Log Aggregation
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "service": "django",
  "message": "User login successful",
  "user_id": 123,
  "ip_address": "192.168.1.100",
  "request_id": "req_abc123"
}
```

### Log Retention
- **Application Logs**: 30 days
- **Access Logs**: 90 days
- **Security Logs**: 1 year
- **Audit Logs**: 7 years

## 🎯 Performance Optimization

### Caching Strategy
- **Redis**: Sessions, API responses, database queries
- **CDN**: Static assets, images
- **Browser**: Static files (1 year cache)
- **Database**: Query optimization, indexing

### Scaling Considerations
- **Horizontal Scaling**: Load balancer + multiple app instances
- **Database Scaling**: Read replicas, connection pooling
- **File Storage**: CDN distribution
- **Background Tasks**: Multiple Celery workers

## 🚨 Incident Response

### Monitoring Alerts
1. **Critical**: Page/SMS + Email
2. **Warning**: Email only
3. **Info**: Dashboard notification

### Response Procedures
1. **Acknowledge** alert within 5 minutes
2. **Investigate** and identify root cause
3. **Mitigate** immediate impact
4. **Resolve** underlying issue
5. **Document** incident and lessons learned

### Emergency Contacts
- **On-call Engineer**: +1-xxx-xxx-xxxx
- **DevOps Lead**: devops@femvelle.com
- **CTO**: cto@femvelle.com

## 📋 Maintenance

### Regular Tasks
- **Weekly**: Security updates, log review
- **Monthly**: Performance review, capacity planning
- **Quarterly**: Disaster recovery testing
- **Annually**: Security audit, architecture review

### Health Checks
```bash
# Application health
curl -f https://api.femvelle.com/health/

# Database health
docker-compose exec mysql mysqladmin ping

# Redis health
docker-compose exec redis redis-cli ping
```

## 🔧 Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Check container memory
docker stats

# Check application memory
docker-compose exec django python manage.py shell -c "import psutil; print(psutil.virtual_memory())"
```

#### Database Connection Issues
```bash
# Check connections
docker-compose exec mysql mysql -e "SHOW PROCESSLIST;"

# Check slow queries
docker-compose exec mysql mysql -e "SELECT * FROM information_schema.processlist WHERE time > 10;"
```

#### SSL Certificate Issues
```bash
# Check certificate expiry
openssl x509 -in ssl/femvelle.com.crt -text -noout | grep "Not After"

# Renew certificate
certbot renew --dry-run
```

## 📞 Support

- **Documentation**: https://docs.femvelle.com
- **Issues**: https://github.com/femvelle/femvelle/issues
- **Support**: support@femvelle.com
- **Emergency**: +1-xxx-xxx-xxxx