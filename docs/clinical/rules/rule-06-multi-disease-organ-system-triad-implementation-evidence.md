# Rule 6 — Multi-Disease / Organ-System Triad implementation evidence (post-merge)

## 1. Document control

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** (post-merge implementation evidence) |
| **Authorization (this documentation)** | **`R6_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_AUTHORIZED`** |
| **Owner governance directive** | **`ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`** |
| **Independent correction re-review** | **`R6_PR84_B1_TO_B5_CORRECTIONS_VERIFIED`** |
| **Owner merge readiness (pre-merge)** | **`EHAS2_PR84_UPDATED_HEAD_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR84_OWNER_MERGE_AUTHORIZED`** (executed) |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |
| **Canonical `origin/main` (post PR #84)** | `a14734275168b1c82dffab8ad0dde83a45f44d3c` |
| **Companion canonical contract** | [rule-06-multi-disease-organ-system-triad-contract.md](./rule-06-multi-disease-organ-system-triad-contract.md) |
| **Cross-rule authority pointer** | [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md) (§ Owner clinical authority vs technical engineering) |

This document records **post-merge** evidence that the Rule 6 **shadow-only** evaluator (`@ehas2/rule6`, `evaluateRule6Shadow`) was merged to canonical `main` via PR #84, independently re-reviewed after B1–B5 corrections, and remains **non-clinical** / **non-orchestrated**.

It does **not** claim Electrohomeopathy clinical correctness, authorize real medicine relationships, connect orchestration/runtime, activate production prescription, resume Rule 5 C3E, or modify legacy.

---

## 2. Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

### 2.1 Owner-controlled clinical decisions

Explicit approval by **Dr. Ghanshyam Bakalwar** is required before adding or changing:

- Electrohomeopathy सिद्धांत
- disease / symptom / clinical-target interpretation
- temperament and constitution meaning
- medicine eligibility, ranking, selection, or rejection authority
- medicine relationship / combination edges
- formula composition rules
- contraindications and clinical exclusions
- mixture-count clinical policy
- potency, dosage, electricity, Tablet A/B clinical logic, external applications
- monitoring / follow-up clinical rules and emergency clinical behavior
- clinical thresholds / weights
- evidence validation / clinical approval status for relationships

AI / engineering must **not** infer or manufacture these decisions. Unresolved clinical decision → **STOP** and ask owner.

### 2.2 Delegated technical engineering

Within **already approved** clinical contracts, engineering may autonomously handle architecture, TypeScript schemas, canonicalization/validation, deterministic sorting/key order, immutability, fixed error taxonomy, tests/CI, security/privacy, performance bounds, package/workspace integration, API/database/frontend engineering, PHI-free auditability, and refactors that do **not** alter clinical meaning.

Technical work still requires owner approval if it introduces cost/paid service, changes security policy, accesses protected data, changes clinical meaning, connects production/runtime, deploys externally, or modifies the legacy system.

---

## 3. Canonical identity (post PR #84)

| Item | Value |
|------|--------|
| **Repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Merge commit (`origin/main`)** | `a14734275168b1c82dffab8ad0dde83a45f44d3c` |
| **Merge parent 1 (pre-merge `main`)** | `6c6ed851f8a4a54a0d02a15ff7c0ff9f11799eab` |
| **Merge parent 2 (reviewed PR head)** | `3c4fa0793e06b87da7e8c7134990abd401ce3410` |
| **Reviewed-head tree == merge tree** | `7ba1c07bb17474dac3aa48ef4aa87298030b8855` |
| **Merge style** | Normal merge commit (not squash/rebase) |
| **Package** | `@ehas2/rule6` |
| **Public evaluator** | `evaluateRule6Shadow` |
| **Rule identity** | `MULTI_DISEASE_ORGAN_SYSTEM_TRIAD` |

---

## 4. PR #84 identity

| Item | Value |
|------|--------|
| **PR** | [#84](https://github.com/bakalwar/EH_AROGYA_SUTRA_2/pull/84) |
| **Branch** | `feat/rule6-multi-disease-organ-system-triad-shadow` |
| **State** | **MERGED** |
| **Initial implementation commit** | `f2d2b76a0b6f700eb5c0fa61efa0dc99ffb627e5` |
| **B1–B5 correction commit** | `3c4fa0793e06b87da7e8c7134990abd401ce3410` |
| **Correction parent** | `f2d2b76a0b6f700eb5c0fa61efa0dc99ffb627e5` |
| **Independent correction re-review** | **`R6_PR84_B1_TO_B5_CORRECTIONS_VERIFIED`** |
| **Owner merge readiness (pre-merge)** | **`EHAS2_PR84_UPDATED_HEAD_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR84_OWNER_MERGE_AUTHORIZED`** |

### 4.1 Cumulative implementation scope

Base `6c6ed851…` → reviewed head `3c4fa07…` (and merge tree): **exactly 14 paths**, cumulative **`+1998/−0`**.

**Package paths**

1. `packages/rule6/package.json`
2. `packages/rule6/tsconfig.json`
3. `packages/rule6/src/constants.ts`
4. `packages/rule6/src/errors.ts`
5. `packages/rule6/src/evaluate.ts`
6. `packages/rule6/src/freeze.ts`
7. `packages/rule6/src/index.ts`
8. `packages/rule6/src/types.ts`
9. `packages/rule6/src/validateInput.ts`
10. `packages/rule6/src/version.ts`
11. `packages/rule6/tests/rule6-shadow-proofs.test.ts`

**Mechanical root paths**

12. `scripts/typecheck-all.mjs`
13. `vitest.config.ts`
14. `package-lock.json`

No documentation, workflows, other Rules, orchestration, medicine/relationship data, or legacy paths were in PR #84.

---

## 5. Implementation and proof evidence

| Item | Recorded fact |
|------|----------------|
| Input schema | **12** ordered keys (`ehas2-rule6-input-v1`) |
| Output schema | **18** ordered keys (`ehas2-rule6-output-v1`) |
| Edge schema | **13** fields |
| Outcomes | **6** closed clinical outcomes |
| Errors | **5** fixed implementation/configuration codes (`message === failureCode`) |
| Mandatory proofs | **P01–P20** aligned to contract §13.2 (**20**) |
| Additional regressions | **24** |
| Focused Rule 6 tests | **44** (20 + 24); **0** skipped mandatory |
| Root typecheck | `@ehas2/rule6` registered in `scripts/typecheck-all.mjs` |
| Root Vitest | include `packages/rule6/tests/**/*.test.ts` |
| Free CI on corrected head | run **`31676867239`** — **success** on `3c4fa079…` |
| B1–B5 | Incomplete multi-endpoint singleton forbidden; `BLOCKED_BY_SAFETY` only all-safety; Proxy rejection via `node:util` `types.isProxy` before traps; registry faults → `INVALID_EVIDENCE_REGISTRY`; P-matrix realigned |
| Immutability | Canonical input copy; input non-mutation; deep-frozen output |
| Determinism | Lexicographic sorting; no arbitrary clinical tie-break |
| Hardcode / edges | No hardcoded medicine/formula; **0** real relationship edges in package |
| Thresholds / weights | None |
| Rule 9 / §F | Final mixture-count ownership retained; `rule9SectionFValidationRequired` marker only |
| Shadow / activation | `shadowOnly: true` · `clinicalActivation: NONE` |
| Rule 5 C3E | Independent; C3E remains paused |
| Paid services | `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` |

**This evidence does not prove clinical correctness.**

---

## 6. Current status tokens

- `RULE6_IDENTITY_OWNER_LOCKED`
- `RULE6_SCOPE_OWNER_LOCKED`
- `RULE6_CANONICAL_CONTRACT_DOCUMENTED`
- `RULE6_SHADOW_EVALUATOR_IMPLEMENTED`
- `RULE6_MANDATORY_PROOFS_20_OF_20_PASS`
- `RULE6_ADDITIONAL_REGRESSIONS_24_PASS`
- `RULE6_INDEPENDENT_IMPLEMENTATION_REVIEW_PASS`
- `RULE6_ORCHESTRATION_NOT_CONNECTED`
- `RULE6_CLINICAL_ACTIVATION_NONE`
- `RULE6_REAL_MEDICINE_RELATIONSHIPS_0`
- `RULE6_VALIDATED_RELATIONSHIP_DATA_PENDING`
- `RULE6_RELATIONSHIP_DATA_CONTRACT_DOCUMENTED` (see companion relationship-data contract; owner CE-OD-01…05)
- `RULE6_ACTIVE_RELATIONSHIP_REGISTRY_EMPTY`
- `RULE6_PRODUCTION_OUTPUT_UNCHANGED`
- `RULE6_INDEPENDENT_OF_RULE5_C3E`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`

**Owner clinical-evidence decisions (governance):** `R6_CE_OD01_TO_OD05_RECOMMENDED_DECISIONS_APPROVED` — [rule-06-relationship-data-and-evidence-intake-contract.md](./rule-06-relationship-data-and-evidence-intake-contract.md). Does **not** add real edges.

**Historical (pre-PR #84 / contract-documentation tranche only):** `RULE6_IMPLEMENTATION_NOT_AUTHORIZED` · `RULE6_SHADOW_EVALUATOR_NOT_IMPLEMENTED` — do not read as current post-merge status without this evidence document and companion pointer updates.

---

## 7. Explicit non-claims

Post-merge Rule 6 implementation does **not** prove or authorize:

- Electrohomeopathy clinical correctness
- real medicine relationships or disease-to-medicine mappings
- formula clinical correctness
- clinical thresholds / weights
- production prescription changes
- orchestration / runtime connection
- potency / dosage / electricity ownership
- Tablet A/B or external applications
- Rule 9 final mixture-count approval
- deployment
- Rule 5 C3E
- protected data access
- legacy replacement

**Independent clinical review** is deferred until owner-approved validated relationship evidence exists. No empty ceremonial clinical-review tranche is created by this documentation.

---

## 8. STOP boundaries

Under this documentation authorization:

- Do **not** alter Rule 6 code/tests in this tranche
- Do **not** add real medicine edges or clinical rules
- Do **not** connect orchestration / runtime or activate clinical output
- Do **not** resume Rule 5 C3E or change Smart App Control
- Do **not** access protected sources or modify legacy
- Do **not** use paid APIs / services / certificates
- Do **not** deploy

**Separate owner authorizations required** before: real relationship data addition; independent clinical review of concrete edges; orchestration connection; production activation. Relationship-data contract documentation: [rule-06-relationship-data-and-evidence-intake-contract.md](./rule-06-relationship-data-and-evidence-intake-contract.md).
