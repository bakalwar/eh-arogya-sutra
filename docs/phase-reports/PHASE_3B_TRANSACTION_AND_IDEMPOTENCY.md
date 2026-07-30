# PHASE 3B TRANSACTION AND IDEMPOTENCY

- Service operations wrap business write + audit in one `withTenantTransaction`
- Table `idempotency_keys` (007): unique per tenant/actor/operation/key
- Same key + same hash → return prior resource
- Same key + different hash → IDEMPOTENCY_CONFLICT
- Optimistic concurrency via expectedUpdatedAt on patient/consultation updates
- Invalid finding batch fails closed before commit
