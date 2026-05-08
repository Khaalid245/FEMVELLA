# Idempotency Constraint Fix

## Problem

The Order model had an **index** on `(user, idempotency_key)` but no **unique constraint**.

This meant:
- Concurrent duplicate checkout requests could both succeed
- The `IntegrityError` fallback in `services.py` never triggered
- Stock could be double-deducted
- Customers could be charged twice

## Solution

### 1. Added Conditional Unique Constraint

**File**: `backend/apps/orders/models.py`

```python
class Order(TimeStampedModel):
    # ... fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=["user", "idempotency_key"], name="order_user_idempotency_idx"),
            models.Index(fields=["created_at"], name="order_created_at_idx"),
            models.Index(fields=["status", "created_at"], name="order_status_created_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "idempotency_key"],
                condition=~models.Q(idempotency_key=""),
                name="unique_user_idempotency_key",
            ),
        ]
```

**Key Points**:
- Uses `UniqueConstraint` with a `condition` parameter
- Only enforces uniqueness when `idempotency_key != ""`
- Blank keys remain allowed (for admin/manual orders)
- Database-level enforcement — no race conditions possible

### 2. Hardened IntegrityError Recovery

**File**: `backend/apps/orders/services.py`

```python
try:
    with transaction.atomic():
        # Stock deductions + order creation
        # ...
        order = Order.objects.create(
            user=user,
            status=Order.Status.PENDING,
            total_price=total,
            shipping_address=shipping_address,
            notes=notes,
            idempotency_key=idempotency_key,
        )
        # ...

except IntegrityError:
    if not idempotency_key:
        raise
    try:
        existing = Order.objects.get(user=user, idempotency_key=idempotency_key)
    except Order.DoesNotExist:
        # Constraint fired but row is gone — should never happen
        raise
    return existing, False
```

**Key Points**:
- Inner `transaction.atomic()` creates a savepoint
- On `IntegrityError`, the savepoint rolls back cleanly
- Stock deductions are undone automatically
- Outer transaction remains usable to query the existing order
- Guards against the edge case where the constraint fires but the row disappears

### 3. Migration

**File**: `backend/apps/orders/migrations/0007_order_unique_user_idempotency_key.py`

```python
operations = [
    migrations.AddConstraint(
        model_name="order",
        constraint=models.UniqueConstraint(
            condition=~models.Q(idempotency_key=""),
            fields=["user", "idempotency_key"],
            name="unique_user_idempotency_key",
        ),
    ),
]
```

**Safe to run on production**:
- No data migration required
- Existing blank keys are unaffected
- Constraint only applies to new inserts

## Verification

### Concurrency Test Suite

**File**: `backend/apps/orders/tests/test_idempotency.py`

Tests verify:
1. ✅ Concurrent requests with same key → only one order created
2. ✅ Stock deducted only once
3. ✅ Both threads get the same order
4. ✅ One thread returns `created=True`, other returns `created=False`
5. ✅ Blank keys allow duplicates (admin orders)
6. ✅ Different users can use the same key
7. ✅ Sequential requests return existing order

### Run Tests

```bash
cd backend
pytest apps/orders/tests/test_idempotency.py -v
```

## How It Works

### Before (Broken)

```
Thread A                    Thread B
────────                    ────────
Check DB (no order)         Check DB (no order)
Lock stock                  Lock stock
Deduct stock                Deduct stock
Create order ✅             Create order ✅
                            
Result: 2 orders, stock deducted twice
```

### After (Fixed)

```
Thread A                    Thread B
────────                    ────────
Check DB (no order)         Check DB (no order)
Lock stock                  Lock stock
Deduct stock                Deduct stock
Create order ✅             Create order ❌ IntegrityError
                            Rollback stock
                            Query existing order
                            Return existing ✅
                            
Result: 1 order, stock deducted once
```

## Production Deployment

### 1. Apply Migration

```bash
docker compose exec django python manage.py migrate orders 0007
```

### 2. Verify Constraint

```bash
docker compose exec db psql -U femvelle -d femvelle -c "
  SELECT conname, contype, pg_get_constraintdef(oid) 
  FROM pg_constraint 
  WHERE conname = 'unique_user_idempotency_key';
"
```

Expected output:
```
           conname            | contype |                    pg_get_constraintdef                     
------------------------------+---------+-------------------------------------------------------------
 unique_user_idempotency_key  | u       | UNIQUE (user_id, idempotency_key) WHERE (idempotency_key <> ''::text)
```

### 3. Monitor Logs

After deployment, monitor for:
- No increase in `IntegrityError` exceptions (should be rare, only on true concurrency)
- No duplicate orders with the same `idempotency_key`

```bash
docker compose logs -f django | grep -i "integrityerror\|idempotency"
```

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Concurrent requests, same key | ✅ One order created, other returns existing |
| Sequential requests, same key | ✅ Second request returns existing order |
| Blank idempotency key | ✅ Duplicates allowed (admin orders) |
| Different users, same key | ✅ Both orders created (constraint is per-user) |
| Network retry after success | ✅ Returns existing order, no duplicate charge |
| Constraint fires but row deleted | ✅ Re-raises IntegrityError (fail-safe) |

## Performance Impact

- **Negligible**: The constraint uses the existing index `order_user_idempotency_idx`
- **No additional index required**: Conditional unique constraints in PostgreSQL use the same B-tree structure
- **Lock contention**: Unchanged — `select_for_update()` on products/variants is still the bottleneck

## Rollback Plan

If issues arise:

```sql
-- Remove constraint
ALTER TABLE orders_order DROP CONSTRAINT unique_user_idempotency_key;
```

Then revert the migration:

```bash
docker compose exec django python manage.py migrate orders 0006
```

## Related Issues Fixed

This fix also resolves:
- Double-charging customers on network retry
- Inventory overselling under high concurrency
- Race condition in payment intent creation (order must exist first)

## Next Steps

Consider adding:
1. Metrics dashboard for idempotency key collision rate
2. Alert if `IntegrityError` rate exceeds threshold (indicates frontend retry logic issue)
3. Periodic cleanup of old idempotency keys (after 24h, per Stripe's window)
