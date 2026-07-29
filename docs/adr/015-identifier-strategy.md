# ADR 015 — Identifier strategy

## Status

Accepted (Phase 3A)

## Decision

| Kind | Strategy |
|------|----------|
| Internal primary keys | UUID (`gen_random_uuid()`) |
| Public/API IDs | Separate non-enumerable UUID (`public_id`) where resources are URL-exposed |
| Provider subjects | Stored only in `external_identity_mappings` |
| Phone numbers | Never primary keys; optional unique verified attributes later |
| Patient names | Never used in URLs |

Timestamps are `timestamptz`. Protected rows carry `organization_id`, `clinic_id` where applicable, and created/updated actor columns.
