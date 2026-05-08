# Rate Limiting Protection — Checkout Endpoint

## Overview

The checkout endpoint (`POST /api/orders/checkout/`) is protected with rate limiting to prevent:
- Excessive checkout attempts
- Stock-lock abuse
- Automated spam requests
- Denial of service attacks

## Implementation

### Throttle Configuration

**Throttle Class**: `PaymentRateThrottle` (defined in `core/exceptions.py`)
- **Type**: `UserRateThrottle` (per-user rate limiting)
- **Scope**: `payment`
- **Rate**: `20 requests per minute` (configured in `config/settings/base.py`)

### Endpoint Protection

```python
@action(methods=["post"], detail=False, url_path="checkout",
        permission_classes=[permissions.IsAuthenticated],
        throttle_classes=[PaymentRateThrottle])
def checkout(self, request):
    # Checkout logic
```

**Key Features**:
- ✅ Requires authentication (`IsAuthenticated`)
- ✅ Rate limited to 20 requests/minute per user
- ✅ Per-user limits (not global)
- ✅ Proper DRF throttle responses (429 Too Many Requests)

## Behavior

### Allowed Requests
- Authenticated users can make up to 20 checkout requests per minute
- Each user has an independent rate limit counter
- Idempotent requests (same `idempotency_key`) do not consume additional quota

### Throttled Requests
When limit is exceeded:
- **Status Code**: `429 Too Many Requests`
- **Response Format**:
```json
{
  "error": true,
  "status_code": 429,
  "detail": "Request was throttled. Expected available in 60 seconds."
}
```

### Unauthenticated Access
- **Status Code**: `401 Unauthorized`
- Unauthenticated users cannot access the checkout endpoint

## Testing

Run throttle tests:
```bash
pytest backend/apps/orders/tests/test_views.py::test_checkout_throttle_allows_normal_requests -v
pytest backend/apps/orders/tests/test_views.py::test_checkout_throttle_blocks_excessive_requests -v
pytest backend/apps/orders/tests/test_views.py::test_checkout_throttle_per_user -v
pytest backend/apps/orders/tests/test_views.py::test_checkout_throttle_unauthenticated_blocked -v
```

Or run all checkout tests:
```bash
pytest backend/apps/orders/tests/test_views.py -k checkout -v
```

## Configuration

### Adjusting Rate Limits

Edit `backend/config/settings/base.py`:

```python
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_RATES": {
        "payment": "20/minute",  # Adjust this value
    },
}
```

Examples:
- `"10/minute"` — 10 requests per minute
- `"100/hour"` — 100 requests per hour
- `"1000/day"` — 1000 requests per day

### Cache Backend

Rate limiting uses Django's cache backend (Redis by default):
```python
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://redis:6379/0",
    }
}
```

## Security Considerations

1. **Per-User Limits**: Each authenticated user has independent quota
2. **Cache-Based**: Uses Redis for fast, distributed rate limit tracking
3. **Idempotency**: Duplicate requests with same key don't consume quota
4. **Stock Protection**: Prevents rapid stock-lock abuse
5. **DDoS Mitigation**: Reduces impact of automated attacks

## Related Endpoints

Other payment-related endpoints also use `PaymentRateThrottle`:
- `POST /api/payments/create-intent/` — Create payment intent (20/minute)

## Monitoring

Monitor throttle events in logs:
```bash
tail -f backend/logs/django.log | grep "throttled"
```

Check Redis cache usage:
```bash
redis-cli INFO stats
```

## Troubleshooting

### Users Getting 429 Errors

1. Check if they're making legitimate requests
2. Verify rate limit configuration
3. Consider increasing limit if needed
4. Check for bot/automation issues

### Rate Limit Not Working

1. Verify Redis is running: `redis-cli ping`
2. Check cache configuration in settings
3. Ensure `PaymentRateThrottle` is applied to endpoint
4. Verify user is authenticated

## Future Enhancements

- Implement sliding window rate limiting
- Add per-IP rate limiting for unauthenticated requests
- Create admin dashboard for rate limit monitoring
- Implement adaptive rate limiting based on load
