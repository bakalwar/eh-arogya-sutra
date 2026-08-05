# Stage A — Conflict register (correction pass)

**Baseline:** `658f3fd` · **Conflicts:** **6** · **Stage B blockers:** **2** (SAC-001, SAC-003)

## SAC-001 — Rule 5 identity

Unchanged substance; evidence expanded: `b1ccfb5` **UNMERGED_CANDIDATE_EVIDENCE** (Monitoring spec **OWNER_APPROVED** on branch only). `main` = **Dosage** + **NO_CANONICAL_RULE_5_SPEC_ON_MAIN**.

## SAC-002 — Rules 1–3 spec vs 5C synthetic

Unchanged.

## SAC-003 — Rule 4 freeze status

Stage A labels: **FREEZE_STATUS_CONFLICT** · **NORMATIVE_CANDIDATE** · **not** formally frozen. Historical “DOCUMENTATION FROZEN” = **CONFLICTING_HISTORICAL_STATUS_CLAIM**.

## SAC-004 — Matrix legacy column

Unchanged.

## SAC-005 — OD-013 tail vs OD-014

Clarified: OD-014 is current fail-closed authority; OD-013 tail is stale ordering only.

## SAC-006 — Rule 8 legacy claims

Unchanged; Rule 8 identity **IDENTITY_CANDIDATE_ONLY** in matrix.

## SAC-007 — Dependency risk register vs local npm audit (correction)

| Field | Value |
|-------|--------|
| Topic | High advisories on Node 24 local `npm audit` vs register “0 after hardening” |
| Source A | `docs/security/dependency-risk-register.md` — overrides applied; **0** at Node 20.20.2 validation |
| Source B | Local `npm audit` on Node **24** — **5 high** (brace-expansion/eslint chain) |
| Classification | **DEPENDENCY_RISK_REGISTER_GAP** for Node 24 local tree **or** environment mismatch — register not updated in this PR (outside six-file scope) |
| PR #5 introduced? | **No** — docs only |
| CI on `136ca9e` | Audit step **success** (Node 20 in CI) |

**Stage B impact:** Non-blocking for Stage A doc merge; follow-up register update on Node 20 separately.
