"""
Distributed tracing configuration for Femvelle.

Integrates Sentry Performance with OpenTelemetry for end-to-end
trace propagation across Django → Celery → Redis → MySQL.

Usage: imported by prod.py and staging.py via:
    from .tracing import configure_tracing
    configure_tracing(environment, dsn, release)
"""

import logging

logger = logging.getLogger(__name__)


def configure_tracing(environment: str, dsn: str, release: str, sample_rate: float = 0.1):
    """
    Configure Sentry SDK with full distributed tracing.

    Instruments:
    - Django HTTP requests (transaction per URL pattern)
    - Celery tasks (task name as transaction)
    - Redis commands (as spans)
    - MySQL queries (as spans via django integration)
    - HTTP outbound calls (stripe, email, S3)
    """
    if not dsn:
        logger.warning("SENTRY_DSN not set — tracing disabled.")
        return

    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

    # Try OpenTelemetry HTTP propagation (trace-id flows through HTTP headers)
    try:
        from sentry_sdk.integrations.opentelemetry import OpenTelemetryIntegration
        otel_integration = OpenTelemetryIntegration()
        logger.info("OpenTelemetry integration enabled.")
    except ImportError:
        otel_integration = None
        logger.info("OpenTelemetry not installed — using Sentry-native propagation.")

    integrations = [
        DjangoIntegration(
            transaction_style="url",          # group by URL pattern, not function name
            middleware_spans=True,            # span per middleware
            signals_spans=False,              # too noisy
            cache_spans=True,                 # Redis cache spans
        ),
        CeleryIntegration(
            monitor_beat_tasks=True,          # Celery Beat cron monitoring
            propagate_traces=True,            # trace-id flows into tasks
        ),
        RedisIntegration(),
        LoggingIntegration(
            level=logging.INFO,               # breadcrumbs from INFO+
            event_level=logging.ERROR,        # Sentry events from ERROR+
        ),
    ]

    if otel_integration:
        integrations.append(otel_integration)

    # Try SqlAlchemy integration (optional)
    try:
        integrations.append(SqlalchemyIntegration())
    except Exception:
        pass

    sentry_sdk.init(
        dsn=dsn,
        integrations=integrations,
        traces_sample_rate=sample_rate,
        profiles_sample_rate=sample_rate / 2,   # profiling at half the trace rate
        send_default_pii=False,
        environment=environment,
        release=release,
        # Attach request data to all events
        request_bodies="medium",
        # Custom before_send to scrub sensitive data
        before_send=_scrub_sensitive_data,
        # Custom traces sampler for fine-grained control
        traces_sampler=_traces_sampler,
        # Ignore noisy errors
        ignore_errors=[
            KeyboardInterrupt,
            SystemExit,
        ],
    )

    logger.info(
        "Sentry tracing configured: env=%s release=%s sample_rate=%s",
        environment, release, sample_rate,
    )


def _scrub_sensitive_data(event, hint):
    """Remove sensitive fields before sending to Sentry."""
    # Scrub request headers
    if "request" in event:
        headers = event["request"].get("headers", {})
        for sensitive in ("Authorization", "Cookie", "X-Api-Key"):
            if sensitive in headers:
                headers[sensitive] = "[Filtered]"

    # Scrub POST body fields
    if "request" in event:
        data = event["request"].get("data", {})
        if isinstance(data, dict):
            for sensitive in ("password", "card_number", "cvv", "stripe_token"):
                if sensitive in data:
                    data[sensitive] = "[Filtered]"

    return event


def _traces_sampler(sampling_context):
    """
    Fine-grained trace sampling:
    - Health checks: never sample (too noisy)
    - Checkout / payment: always sample (critical path)
    - Everything else: use default rate
    """
    transaction_name = sampling_context.get("transaction_context", {}).get("name", "")

    # Never trace health checks or metrics endpoints
    if any(skip in transaction_name for skip in ["/health/", "/metrics", "/__debug__/"]):
        return 0

    # Always trace critical business paths
    if any(critical in transaction_name for critical in [
        "/checkout", "/payments", "/orders", "/webhooks"
    ]):
        return 1.0

    # Default sample rate from parent context or settings
    parent_sampled = sampling_context.get("parent_sampled")
    if parent_sampled is not None:
        return parent_sampled

    return None  # fall back to traces_sample_rate
