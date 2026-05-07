# Femvelle Incident Runbooks

Runbooks for every alert defined in `monitoring/alert_rules.yml`.
Each runbook follows: **Detect → Assess → Mitigate → Resolve → Post-mortem**.

---

## SiteDown

**Severity**: Critical | **Team**: Platform

### Detect
Blackbox probe `probe_success == 0` for > 1 minute.

### Assess
```bash
# Check from outside
curl -I https://femvelle.com
curl -I https://api.femvelle.com/health/

# Check nginx
docker compose -f docker-compose.prod.yml logs nginx --tail=50

# Check django
docker compose -f docker-compose.prod.yml logs django --tail=50
docker compose -f docker-compose.prod.yml ps
```

### Mitigate
```bash
# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx

# Restart django if unhealthy
docker compose -f docker-compose.prod.yml restart django

# If blue/green — check active slot
cat /opt/femvelle/.current_slot
```

### Resolve
Confirm `probe_success == 1` in Grafana → Uptime panel.

---

## HighErrorRate

**Severity**: Critical | **Team**: Backend

### Detect
5xx rate > 5% for 3 minutes.

### Assess
```bash
# Check error logs in Loki (Grafana → Explore → Loki)
# Query: {service="django"} |= "ERROR" | json

# Check Django logs directly
docker compose -f docker-compose.prod.yml exec django \
  tail -100 /app/logs/django_error.log

# Check Sentry for exception details
# https://sentry.io/organizations/<org>/issues/?project=femvelle
```

### Mitigate
```bash
# If DB connection issue
docker compose -f docker-compose.prod.yml restart mysql

# If memory pressure
docker stats femvelle_django

# Emergency rollback to previous slot
cat /opt/femvelle/.current_slot  # check current
# Trigger rollback workflow in GitHub Actions
```

---

## HighP95Latency

**Severity**: Warning | **Team**: Backend

### Assess
```bash
# Check slow queries in MySQL
docker compose -f docker-compose.prod.yml exec mysql \
  mysql -u root -p -e "SHOW PROCESSLIST;"

# Check Redis latency
docker compose -f docker-compose.prod.yml exec redis \
  redis-cli -a $REDIS_PASSWORD SLOWLOG GET 10

# Check Celery queue depth
docker compose -f docker-compose.prod.yml exec redis \
  redis-cli -a $REDIS_PASSWORD LLEN celery
```

### Mitigate
- Scale Gunicorn workers: increase `--workers` in `Dockerfile.prod`
- Add Redis cache for slow endpoints
- Check for N+1 queries in Sentry Performance

---

## MySQLDown

**Severity**: Critical | **Team**: Platform

### Assess
```bash
docker compose -f docker-compose.prod.yml ps mysql
docker compose -f docker-compose.prod.yml logs mysql --tail=50
```

### Mitigate
```bash
# Restart MySQL
docker compose -f docker-compose.prod.yml restart mysql

# Check disk space (common cause)
df -h /var/lib/docker

# Check MySQL error log
docker compose -f docker-compose.prod.yml exec mysql \
  tail -50 /var/log/mysql/error.log
```

### Resolve
Confirm `up{job="mysql"} == 1` in Grafana.

---

## MySQLHighConnections

**Severity**: Warning | **Team**: Platform

### Assess
```bash
docker compose -f docker-compose.prod.yml exec mysql \
  mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"

docker compose -f docker-compose.prod.yml exec mysql \
  mysql -u root -p -e "SHOW PROCESSLIST;" | grep -v Sleep
```

### Mitigate
- Kill idle connections: `KILL <process_id>;`
- Reduce `CONN_MAX_AGE` in Django settings
- Increase `max_connections` in `mysql/conf.d/`

---

## RedisDown

**Severity**: Critical | **Team**: Platform

### Assess
```bash
docker compose -f docker-compose.prod.yml ps redis
docker compose -f docker-compose.prod.yml logs redis --tail=50
```

### Mitigate
```bash
docker compose -f docker-compose.prod.yml restart redis

# Check AOF file integrity
docker compose -f docker-compose.prod.yml exec redis \
  redis-check-aof /data/appendonly.aof
```

---

## HighCPU / CriticalCPU

**Severity**: Warning / Critical | **Team**: Platform

### Assess
```bash
# Top processes
docker stats --no-stream

# Check which container is consuming
docker stats femvelle_django femvelle_celery femvelle_mysql
```

### Mitigate
```bash
# Reduce Celery concurrency
docker compose -f docker-compose.prod.yml exec celery \
  celery -A config control pool_shrink 2

# Kill runaway Celery tasks
docker compose -f docker-compose.prod.yml exec celery \
  celery -A config purge
```

---

## DiskSpaceLow / DiskSpaceCritical

**Severity**: Warning / Critical | **Team**: Platform

### Assess
```bash
df -h
du -sh /var/lib/docker/*
docker system df
```

### Mitigate
```bash
# Remove unused Docker images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Remove old logs
find /opt/femvelle/logs -name "*.log" -mtime +7 -delete

# Emergency: truncate large log files
truncate -s 0 /opt/femvelle/logs/django.log
```

---

## CeleryQueueBacklog

**Severity**: Warning | **Team**: Backend

### Assess
```bash
# Check queue depth
docker compose -f docker-compose.prod.yml exec redis \
  redis-cli -a $REDIS_PASSWORD LLEN celery

# Check active workers
docker compose -f docker-compose.prod.yml exec celery \
  celery -A config inspect active
```

### Mitigate
```bash
# Scale up workers temporarily
docker compose -f docker-compose.prod.yml up -d --scale celery=3

# Purge stuck tasks (last resort)
docker compose -f docker-compose.prod.yml exec celery \
  celery -A config purge
```

---

## SSLCertExpiringSoon / SSLCertExpiryCritical

**Severity**: Warning / Critical | **Team**: Platform

### Mitigate
```bash
# Renew Let's Encrypt certificate
certbot renew --dry-run  # test first
certbot renew

# Copy renewed cert
cp /etc/letsencrypt/live/femvelle.com/fullchain.pem /opt/femvelle/ssl/femvelle.com.crt
cp /etc/letsencrypt/live/femvelle.com/privkey.pem /opt/femvelle/ssl/femvelle.com.key

# Reload nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## NoOrdersInLastHour

**Severity**: Warning | **Team**: Business

### Assess
1. Check Sentry for checkout errors
2. Check Stripe dashboard for payment failures
3. Test checkout flow manually on production
4. Check `django_error.log` for order creation errors

### Mitigate
- If Stripe webhook failing: check `STRIPE_WEBHOOK_SECRET` env var
- If DB issue: check MySQL status
- If frontend issue: check browser console on checkout page

---

## Escalation Matrix

| Severity | Response Time | Primary | Escalate To |
|---|---|---|---|
| Critical | 5 min | On-call engineer | CTO if unresolved in 30 min |
| Warning | 30 min | Backend/Platform team | On-call if unresolved in 2h |
| Business | 1 hour | Business team | Engineering if checkout affected |

## Post-Mortem Template

```
## Incident: <title>
**Date**: YYYY-MM-DD
**Duration**: Xh Ym
**Severity**: Critical/Warning
**Impact**: <users affected, revenue impact>

### Timeline
- HH:MM — Alert fired
- HH:MM — Engineer paged
- HH:MM — Root cause identified
- HH:MM — Mitigation applied
- HH:MM — Resolved

### Root Cause
<technical explanation>

### What Went Well
<things that helped>

### What Went Wrong
<gaps in process/tooling>

### Action Items
- [ ] <preventive measure> — Owner — Due date
```
