# Rate Limiting Quick Reference

## 🔒 Protected Endpoints

| Endpoint | Method | Limit | Auth |
|----------|--------|-------|------|
| `/api/orders/checkout/` | POST | 20/min | ✅ Required |
| `/api/payments/create-intent/` | POST | 20/min | ✅ Required |

---

## 📊 Rate Limit: 20 requests/minute per user

**Throttle Class**: `PaymentRateThrottle` (UserRateThrottle)

**Cache**: Redis (distributed tracking)

---

## 🧪 Test Commands

```bash
# All checkout tests
pytest backend/apps/orders/tests/test_views.py -v

# Only throttle tests
pytest backend/apps/orders/tests/test_views.py -k throttle -v

# Specific test
pytest backend/apps/orders/tests/test_views.py::test_checkout_throttle_blocks_excessive_requests -v
```

---

## 📝 Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 201 | Created | Order created successfully |
| 200 | OK | Duplicate request (idempotent) |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not authenticated |
| 409 | Conflict | Out of stock |
| 429 | Too Many Requests | **Rate limited** |

---

## 🚨 429 Response Format

```json
{
  "error": true,
  "status_code": 429,
  "detail": "Request was throttled. Expected available in 60 seconds."
}
```

---

## ⚙️ Configuration

**File**: `backend/config/settings/base.py`

```python
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_RATES": {
        "payment": "20/minute",  # ← Adjust here
    },
}
```

**Examples**:
- `"10/minute"` — 10 per minute
- `"100/hour"` — 100 per hour
- `"1000/day"` — 1000 per day

---

## 🔍 Monitoring

```bash
# Check throttle events
tail -f backend/logs/django.log | grep "throttled"

# Redis stats
redis-cli INFO stats

# Test manually
curl -X POST http://localhost:8000/api/orders/checkout/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"product_id": 1, "quantity": 1}], "shipping_address": "123 Main St"}'
```

---

## 📚 Documentation

- **Full Guide**: `backend/RATE_LIMITING.md`
- **Implementation**: `backend/IMPLEMENTATION_SUMMARY.md`
- **Verification**: `backend/VERIFICATION_CHECKLIST.md`
- **Changelog**: `backend/CHANGELOG.md`

---

## 🛠️ Implementation Details

**File**: `backend/apps/orders/views.py` (Line 51-53)

```python
@action(methods=["post"], detail=False, url_path="checkout",
        permission_classes=[permissions.IsAuthenticated],
        throttle_classes=[PaymentRateThrottle])
def checkout(self, request):
    # Checkout logic
```

**Tests**: `backend/apps/orders/tests/test_views.py` (Lines 165-237)

---

## ✅ Security Benefits

- ✅ Prevents excessive checkout attempts
- ✅ Blocks stock-lock abuse
- ✅ Mitigates automated spam
- ✅ Reduces DDoS impact
- ✅ Per-user limits (fair)

---

## 🔄 Per-User Limits

Each user has **independent** 20/minute quota:

```
User A: 20 requests/minute
User B: 20 requests/minute  ← Independent
User C: 20 requests/minute  ← Independent
```

---

## 🚀 Deployment

- ✅ No database migrations
- ✅ No breaking changes
- ✅ Backward compatible
- ✅ Redis required (already in use)
- ✅ Ready for production

---

## 🐛 Troubleshooting

### Users getting 429 errors
1. Check if legitimate requests
2. Verify rate limit configuration
3. Consider increasing limit
4. Check for bot/automation

### Rate limit not working
1. Verify Redis running: `redis-cli ping`
2. Check cache config in settings
3. Ensure throttle applied to endpoint
4. Verify user authenticated

---

## 📞 Support

For issues or questions:
1. Check `RATE_LIMITING.md` for detailed guide
2. Review test cases for examples
3. Check logs: `backend/logs/django.log`
4. Verify Redis connection

---

## 🔗 Related

- [DRF Throttling](https://www.django-rest-framework.org/api-guide/throttling/)
- [Django Cache](https://docs.djangoproject.com/en/5.0/topics/cache/)
- [Redis](https://redis.io/)

---

**Last Updated**: 2024
**Status**: ✅ Production Ready
