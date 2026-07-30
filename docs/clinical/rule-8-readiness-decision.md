# Rule 8 readiness decision (Phase 5C-G)

## Canonical name

**Disease-level Prakruti Inference**

## Intended purpose (EH_9 / Phase 5A)

Infer prakriti/temperament from disease-level registry votes to influence clinical selection.

## Required inputs

- Disease identity / disease-pack `prakruti` votes  
- Legacy APIs named in audit: `infer_disease_prakruti`, `resolve_prakriti`

## Expected outputs

- Temperament / prakriti label (docs claim selection boost)

## Why legacy runtime left it unwired

Phase 5A forensic audit: live `MultiDiseaseEngine` path **does not call** Rule 8 APIs. Documentation claimed clinical effect; production orchestration did not execute it.

## Relationship to prescription selection

| Claim | Evidence |
|-------|----------|
| Docs: affects selection | YES (documented) |
| Live MDE prescription path | **NO** — unused |
| Owner Tablet A/B full 39-pool rule | Independent of Rule 8 |
| Owner oral 3/4/5 + scoring | Driven by R6/R2/R4/electricity — not Rule 8 |

## Owner-rule conflicts

1. Wiring Rule 8 would **change** selection vs proven live path without a proven live baseline.  
2. Risk of inventing disease→prakriti authority without verified clinical SoT.  
3. May interact with temperament (R1) dual-path confusion.

## Is Rule 8 medicine-selection authority?

**Not on the proven live path.** Docs assert authority; runtime did not grant it. EHAS2 must not invent authority.

## Must Rule 8 be implemented in Phase 5D?

**Not required** to reconstruct the proven oral/tablet/external prescription pipeline with owner corrections (full-pool tablets, no-default-WE, evidence-gated externals).

Implementing Rule 8 inside Phase 5D would be a **new clinical authority decision**, not a faithful reconstruction of live MDE.

## Final status (Phase 5C-G)

**OWNER_DECISION_REQUIRED**

Recommended default if owner wants prescription reconstruction first:

- Treat Rule 8 as **NOT_REQUIRED_FOR_PRESCRIPTION** for Phase 5D scope  
- Keep status `NOT_IMPLEMENTED` until a dedicated owner-approved Rule 8 phase  
- No dummy pass-through

Dummy implementation: **forbidden**.
