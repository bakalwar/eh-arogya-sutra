-- Phase 3B — idempotency keys for create/finalize/review retries
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  actor_id uuid NOT NULL,
  operation text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, clinic_id, actor_id, operation, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_op
  ON idempotency_keys (organization_id, clinic_id, operation, created_at DESC);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS idempotency_keys_tenant_isolation ON idempotency_keys;
CREATE POLICY idempotency_keys_tenant_isolation ON idempotency_keys
  FOR ALL
  USING (ehas2_tenant_ok(organization_id, clinic_id))
  WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON idempotency_keys TO ehas2_app;
