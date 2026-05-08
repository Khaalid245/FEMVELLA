# Femvelle Observability

## Stack

| Tool | Role | Port |
|------|------|------|
| Prometheus | Metrics collection & alerting rules | 9090 |
| Grafana | Dashboards & unified alerting | 3000 |
| Loki | Log aggregation | 3100 |
| Promtail | Log shipping (Docker + files) | 9080 |
| Tempo | Distributed trace storage (OTLP) | 3200 / 4317 / 4318 |
| Alertmanager | Alert routing (Slack / PagerDuty / email) | 9093 |
| Blackbox Exporter | Uptime / SSL probes | 9115 |
| Node Exporter | Host CPU / memory / disk | 9100 |
| MySQL Exporter | MySQL metrics | 9104 |
| Redis Exporter | Redis metrics | 9121 |
| Nginx Exporter | Nginx stub_status metrics | 9113 |
| Sentry | Error tracking + distributed tracing (frontend + backend) | hosted |

## Deployment

```bash
# Production (monitoring included in prod compose)
docker compose -f docker-compose.prod.yml up -d

# Staging + monitoring overlay
MONITORING_NETWORK=femvelle_staging \
  docker compose -f docker-compose.staging.yml \
                 -f docker-compose.monitoring.yml up -d

# Monitoring stack only (against existing network)
MONITORING_NETWORK=femvelle_network \
  docker compose -f docker-compose.monitoring.yml up -d
```

## Grafana Dashboards

Access: `http://localhost:3000` (prod: `https://monitoring.femvelle.com/grafana/`)

| Dashboard | UID | Description |
|-----------|-----|-------------|
| Application Performance | `femvelle-app` | Request rate, error rate, P50/P95/P99 latency, uptime, SSL expiry |
| Business Metrics | `femvelle-business` | Orders, conversion rate, payment failures, active sessions |
| Infrastructure | `femvelle-infra` | CPU, memory, disk, network I/O |
| Distributed Traces | `femvelle-traces` | Service map, slow trace search, P95 duration by service |

## Alert Channels

| Severity | Channel |
|----------|---------|
| `critical` | `#femvelle-critical` (Slack) + PagerDuty + email to oncall |
| `warning` / `team: platform` | `#femvelle-platform` |
| `warning` / `team: backend` | `#femvelle-backend` |
| `team: business` | `#femvelle-business-alerts` |

Required env vars for alerting:
```
SLACK_WEBHOOK_URL=
PAGERDUTY_ROUTING_KEY=
EMAIL_HOST=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
```

## Sentry

### Backend
- Configured in `backend/config/tracing.py` via `configure_tracing()`
- Loaded by `prod.py` and `staging.py`
- Instruments: Django, Celery, Redis, outbound HTTP
- Critical paths (checkout, payments, orders) sampled at 100%
- Health checks and metrics endpoints excluded

### Frontend
- Initialized in `frontend/src/lib/sentry.ts` → called from `main.tsx`
- Skipped in `DEV` mode
- Includes browser tracing + session replay (5% sessions, 100% on error)

Required env vars:
```
# Backend
SENTRY_DSN=

# Frontend
VITE_SENTRY_DSN=
VITE_ENVIRONMENT=production
VITE_RELEASE_VERSION=1.0.0
```

## Distributed Tracing (Tempo)

Traces flow: `Django/Celery → Sentry SDK → (OTLP export) → Tempo → Grafana`

Tempo receives OTLP on:
- gRPC: `tempo:4317`
- HTTP: `tempo:4318`

To query traces in Grafana: open the **Distributed Traces** dashboard or use Explore → Tempo datasource with TraceQL.

Log-to-trace correlation: Loki derived fields extract `trace_id` from JSON logs and link directly to Tempo.

## Uptime Monitoring

Blackbox exporter probes (configured in `monitoring/prometheus.yml`):
- `https://femvelle.com` — HTTP 2xx
- `https://api.femvelle.com/health/` — HTTP 2xx
- `https://api.femvelle.com/api/products/` — HTTP 2xx
- `femvelle.com:443` — TCP connect (SSL)

Alerts fire after 1 minute of failure → `SiteDown` (critical).

SSL expiry alerts:
- `< 14 days` → warning
- `< 3 days` → critical

## Key Alert Runbooks

### SiteDown
1. Check `docker compose ps` on the server
2. Check Nginx logs: `docker logs femvelle_nginx --tail 100`
3. Check Django health: `curl http://localhost:8000/health/`
4. If Django is up but Nginx is down, restart Nginx
5. If Django is down, check `docker logs femvelle_django --tail 100`

### HighErrorRate (5xx > 5%)
1. Open Grafana → Application Performance → Error Rate panel
2. Open Loki: `{service="django"} |= "ERROR"` for the time window
3. Check Sentry for the error group
4. Roll back if a recent deploy caused the spike: `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d`

### DiskSpaceCritical (< 5%)
1. `df -h` on the host
2. Clean old Docker images: `docker image prune -a`
3. Rotate logs: `docker compose -f docker-compose.prod.yml exec django find /app/logs -name "*.log.*" -mtime +7 -delete`
4. Check Prometheus TSDB size: `du -sh /var/lib/docker/volumes/femvelle_prometheus_data`

### MySQLDown
1. `docker compose -f docker-compose.prod.yml restart mysql`
2. Check logs: `docker logs femvelle_mysql --tail 50`
3. Verify data volume: `docker volume inspect femvelle_mysql_data`

### CeleryQueueBacklog (> 100 tasks)
1. Check worker count: `docker compose -f docker-compose.prod.yml ps celery`
2. Scale workers: `docker compose -f docker-compose.prod.yml up -d --scale celery=3`
3. Check for stuck tasks in Flower (if deployed) or Redis: `redis-cli LLEN celery`

## Adding New Metrics

1. In Django, use `django-prometheus` auto-instrumented metrics or add custom ones:
   ```python
   from prometheus_client import Counter
   my_counter = Counter("femvelle_my_event_total", "Description")
   my_counter.inc()
   ```
2. Metrics are exposed at `http://django:8001/metrics` (scraped by Prometheus every 15s)
3. Add recording rules to `monitoring/recording_rules.yml` for expensive queries
4. Add alert rules to `monitoring/alert_rules.yml`
5. Reload Prometheus without restart: `curl -X POST http://localhost:9090/-/reload`
