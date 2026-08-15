# Rule 2 — Polarity Engine implementation evidence (post-merge)

## 1. Document control

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** (post-merge implementation evidence) |
| **Document class detail** | Technical synthetic shadow-evaluator evidence only — **not** clinical validation; **not** clinical correctness; **not** real polarity evidence; **not** production readiness; **not** orchestration or activation authorization; **not** medicine-selection, formula-mutation, or potency authority |
| **Authorization (this documentation)** | **`R2_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_AUTHORIZED`** |
| **Owner governance directive** | **`ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`** |
| **Independent technical review (pre-merge)** | **`R2_INDEPENDENT_SYNTHETIC_SHADOW_REVIEW_PASS`** |
| **Owner merge readiness (pre-merge)** | **`EHAS2_PR101_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR101_OWNER_MERGE_AUTHORIZED`** (executed) |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |
| **Canonical `origin/main` (post PR #101)** | `95a6521307daa6b9cb93c63e6cc70ecfbee14983` |
| **Companion canonical contract** | [rule-02-polarity-engine-contract.md](./rule-02-polarity-engine-contract.md) |
| **Companion frozen clinical specification** | [rule-02-polarity-engine.md](./rule-02-polarity-engine.md) (body preserved) |
| **Cross-rule authority pointer** | [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md) |

This document records **post-merge** evidence that the Rule 2 **synthetic-only shadow** evaluator (`@ehas2/rule2`, `evaluateRule2Shadow`, identity `POLARITY_ENGINE`) was merged to canonical `main` via PR #101, independently reviewed for technical compliance, and remains **non-clinical** / **non-orchestrated**.

It does **not** claim Electrohomeopathy clinical correctness, invent or approve any real formula/slot disease-polarity mapping, create an evidence catalog, connect orchestration/runtime, activate clinical selection, grant medicine/prescription influence, mutate formulas, integrate Rule 4, resume Rule 5 C3E, or modify legacy.

**Review/merge tokens do not prove clinical correctness** — they attest technical shadow-evaluator review and owner merge authority only. **Technical PASS is not clinical validation. Technical implementation does not mean clinically activated Rule 2.**

Facts below that cite CI, pre-merge independent review, or prior local gates are **recorded evidence**, not freshly re-executed in this documentation-only tranche.

---

## 2. Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

| Layer | Holds |
|-------|--------|
| Owner clinical authority | Disease/therapeutic polarity meanings; MIXED policy (R2-ID-02); formula/slot clinical roles; evidence that may activate real annotations; review/blocking meaning; future downstream influence; clinical activation / orch / production Rx |
| Technical engineering (documented here) | Package schemas; fail-closed validation; empty registry mechanics; synthetic fixtures; deterministic ordering/fingerprinting; tests/CI; metadata alignment |

Owner approval remains required before real polarity mappings, catalog population, medicine selection, formula mutation, potency/electricity, Rule 4 live integration, orchestration, clinical activation, or production Rx effect.

---

## 3. Canonical current status

| Token | Meaning |
|-------|---------|
| `RULE2_IDENTITY_POLARITY_ENGINE` | Machine identity `POLARITY_ENGINE` / display **Polarity Engine** |
| `RULE2_CANONICAL_CONTRACT_DOCUMENTED` | Focused contract documented (PR #100) |
| `RULE2_SHADOW_EVALUATOR_IMPLEMENTED` | Synthetic shadow package present on main (PR #101) |
| `RULE2_TECHNICAL_READY_FOR_VALIDATION` | `nineRules` technical `READY_FOR_VALIDATION` only — **not** clinical readiness |
| `RULE2_REAL_POLARITY_MAPPINGS_0` | Real validated formula/slot polarity mappings **0** (alias of contract `RULE2_REAL_VALIDATED_MAPPINGS_0`) |
| `RULE2_EVIDENCE_CATALOG_NOT_CREATED` | Evidence catalog not created |
| `RULE2_PRODUCTION_REGISTRY_EMPTY` | Production registry empty (`entries: []`) |
| `RULE2_SYNTHETIC_FIXTURES_NON_PROMOTABLE` | Synthetic fixtures technical-only / non-promotable |
| `RULE2_MEDICINE_REGISTRY_POLARITY_NOT_EVIDENCE` | Medicine-registry `.polarity` is not Rule 2 disease-polarity evidence |
| `RULE2_FORMULA_MUTATION_NONE` | Formula mutation **NONE** (`mutatesMixtures: false`) |
| `RULE2_MEDICINE_SELECTION_INFLUENCE_NONE` | Medicine-selection influence **NONE** |
| `RULE2_RULE4_NOT_CONNECTED` | Rule 4 untouched / not wired as evaluator or evidence |
| `RULE2_ORCHESTRATION_NOT_CONNECTED` | Orchestration **NOT_CONNECTED** |
| `RULE2_CLINICAL_ACTIVATION_NONE` | Clinical activation **NONE** |
| `RULE2_PRESCRIPTION_EFFECT_NONE` | Prescription/Rx effect **NONE** |
| `RULE2_NOT_CLINICALLY_ACTIVATED_PRESCRIPTION` | Not a clinically activated prescription |
| `RULE2_PRODUCTION_POSTURE_UNCHANGED` | Production Rx / clinical production posture unchanged |
| `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` | No paid dependency |

Also retained (current): `RULE2_IDENTITY_OWNER_LOCKED` · `RULE2_EMPTY_REGISTRY_FAIL_CLOSED` · `RULE2_INDEPENDENT_OF_RULE5_C3E` · `RULE2_PRODUCTION_RX_UNCHANGED`.

**Historical (superseded for current package readiness):** contract-tranche tokens `RULE2_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE2_IMPLEMENTATION_NOT_AUTHORIZED`, and current-facing “evaluator **NOT_IMPLEMENTED**” / “impl **NOT_AUTHORIZED**” / “`packages/rule2` **absent**” / “do not execute proofs” wording prior to PR #101 — do **not** read as current post-merge **package** status without this document and companion pointer updates. Clinical prohibitions, mappings **0**, catalog **NOT_CREATED**, influence/mutation/orch/activation/Rx **NONE**, and C3E pause remain **current**.

---

## 4. Three-stage delivery chain

### 4.1 Contract PR #100

| Item | Value |
|------|--------|
| **PR** | [#100](https://github.com/bakalwar/EH_AROGYA_SUTRA_2/pull/100) |
| **Base** | `d926a9a0a3cc24491ffd3d07ff1c5b8c23df24db` |
| **Reviewed head** | `84c1205e5e1502200fca8590de35c7077df1f96e` |
| **Merge** | `df0db654086da2e1d6a09da104114a7d034d50eb` |
| **Merge tree** | `6d3e06c816669b95421e4bf406dcda15a469dee2` |
| **Scope** | 10 docs, `+620/−13`; contract **579** lines |
| **Token** | `RULE2_POLARITY_ENGINE_CANONICAL_CONTRACT_MERGED_TO_MAIN` |

Docs-only; no package.

### 4.2 Implementation PR #101

| Item | Value |
|------|--------|
| **Repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **PR** | [#101](https://github.com/bakalwar/EH_AROGYA_SUTRA_2/pull/101) |
| **Branch** | `feat/rule2-polarity-engine-shadow` (**not deleted**; tip still reviewed head) |
| **State** | **MERGED** |
| **Authorized base / Parent 1** | `df0db654086da2e1d6a09da104114a7d034d50eb` |
| **Reviewed head / Parent 2** | `a083b03cd385307f819b3fc6d76af18c87e59da0` |
| **Merge commit (`origin/main`)** | `95a6521307daa6b9cb93c63e6cc70ecfbee14983` |
| **Merge style** | Normal two-parent merge (not squash/rebase; no admin bypass; no auto-merge; branch not deleted) |
| **Reviewed-head tree** | `b6b7a16e4f319e51f11e6d1a5a1196a0df671458` |
| **Merge-commit tree** | `b6b7a16e4f319e51f11e6d1a5a1196a0df671458` |
| **Tree equality** | **YES** |
| **Implementation commits on PR** | Exactly **1**; **no** post-CI commit |
| **Scope** | **exactly 17 paths**, **`+2251/−4`** |
| **CI on reviewed head** | GitHub Actions run **`31834114020`** — **success** on exact head `a083b03cd385307f819b3fc6d76af18c87e59da0` |

### 4.3 Delivery / review / merge tokens (technical only)

- `R2_POLARITY_ENGINE_SYNTHETIC_SHADOW_IMPLEMENTATION_DELIVERED_FOR_INDEPENDENT_REVIEW`
- `R2_INDEPENDENT_SYNTHETIC_SHADOW_REVIEW_PASS`
- `EHAS2_PR101_READY_FOR_OWNER_MERGE_APPROVAL`
- `EHAS2_PR101_OWNER_MERGE_AUTHORIZED`
- `RULE2_POLARITY_ENGINE_SYNTHETIC_SHADOW_MERGED_TO_CANONICAL_MAIN`

These prove **authorized technical shadow delivery and owner merge** only — **not** clinical validation, real mappings, catalog, Rule 4 integration, orchestration, activation, or production readiness.

### 4.4 Implementation path inventory (PR #101)

1. `packages/rule2/package.json`
2. `packages/rule2/tsconfig.json`
3. `packages/rule2/src/constants.ts`
4. `packages/rule2/src/errors.ts`
5. `packages/rule2/src/evaluate.ts`
6. `packages/rule2/src/freeze.ts`
7. `packages/rule2/src/index.ts`
8. `packages/rule2/src/types.ts`
9. `packages/rule2/src/validateInput.ts`
10. `packages/rule2/src/version.ts`
11. `packages/rule2/tests/rule2-shadow-proofs.test.ts`
12. `package-lock.json` (Rule 2 workspace registration only)
13. `scripts/typecheck-all.mjs`
14. `vitest.config.ts`
15. `packages/clinical-contracts/src/nineRules.ts` (Rule 2 entry only)
16. `tests/unit/phase5b-clinical-packages.test.ts` (Rule 2 assertions only)
17. `tests/unit/phase5c-nine-rule-orchestration.test.ts` (Rule 2 assertions only)

No documentation, workflows, apps/dashboard, clinical datasets/mappings, Rule 4, orchestration/runtime source, protected-source, C3E/SAC, legacy, or deploy paths were in PR #101.

---

## 5. Package surface (from merged code)

| Item | Recorded fact |
|------|----------------|
| Package | `@ehas2/rule2@0.1.0-shadow` |
| Public evaluator | `evaluateRule2Shadow` |
| Error type | `Rule2EvaluationError` (`message === failureCode`) |
| Machine identity | `POLARITY_ENGINE` |
| Display | **Polarity Engine** |
| Contract / input / output versions | `ehas2-rule2-contract-v1` / `ehas2-rule2-input-v1` / `ehas2-rule2-output-v1` |
| Runtime dependencies | `dependencies: {}` |
| Input keys | **exactly 9** ordered top-level |
| Output keys | **exactly 18** ordered top-level |
| Annotation keys | **exactly 12** ordered |
| Outcomes | **exactly 7** |
| Failure codes | **exactly 5** |
| Proofs | **P01–P18** (exactly 18; sequential; unique; no P19) |
| Adversarial regressions | **8** |
| Focused tests | **26** (18 + 8); zero skips/todos |
| Rule 4 / other clinical-rule imports | **none** |

---

## 6. Registry and evidence posture

| Boundary | Current fact |
|----------|----------------|
| Production registry | `entries: []` · `activeRealMappingCount: 0` · frozen |
| Real polarity mappings | **0** |
| Evidence catalog | `NOT_CREATED` |
| Synthetic fixtures | technical-only; `SYNTHETIC_TEST_ONLY`; non-promotable |
| Apparently real `APPROVED_AND_ACTIVE` non-synthetic input | cannot bypass empty production registry (fail-closed / `NOT_EVALUABLE`) |
| Medicine-registry `.polarity` | **not** Rule 2 disease-polarity evidence (rejected as forbidden key / non-authority) |
| Empty registry | does **not** prove clinical absence of polarity relationships in nature |

---

## 7. Formula-slot boundary

- Annotation-only; opaque formula-slot identifiers
- Input slot order preserved in annotations
- No Formula A–E clinical authority; no content inspection for composition
- No add / remove / reorder / substitute / rank / boost / demote
- No medicine-pair creation; no mutation commands
- `mutatesMixtures: false` always; package `formulaMutation: NONE`
- No medicine selection; no potency/electricity decision; no Rule 4 activation

---

## 8. Polarity law and MIXED (technical)

| Disease polarity | Required technical posture |
|------------------|----------------------------|
| `POSITIVE` | therapeutic `NEGATIVE` |
| `NEGATIVE` | therapeutic `POSITIVE` |
| `NEUTRAL` | therapeutic `NEUTRAL` in contract-defined resolved/support posture |
| `SUPPORT_ONLY` | therapeutic `NEUTRAL`; `RESOLVED_SUPPORT_ROLE` |
| `MIXED` | `resolutionStatus = UNRESOLVED`; therapeutic `NEUTRAL`; `doctorReviewRequired = true`; review-only; **no** opposite invented; **no** coerce to POSITIVE/NEGATIVE |
| Insufficient / unresolved | no invented opposite; therapeutic `NEUTRAL` + doctor review where applicable |
| Slot contradiction | fail-closed (`BLOCKED_BY_SLOT_CONTRADICTION` / structural error channel as contracted) |

`NEUTRAL` on the MIXED/insufficient path is **review-only**, not validated therapy. `NEUTRAL` is **not** a success outcome.

---

## 9. Shadow and production invariants

| Field / posture | Locked value |
|-----------------|--------------|
| `shadowOnly` | `true` |
| Medicine-selection influence | `NONE` |
| Formula mutation | `NONE` |
| Clinical activation | `NONE` |
| Prescription/Rx effect | `NONE` |
| Orchestration / runtime | `NOT_CONNECTED` |
| Not clinically activated prescription | `true` |
| Rule 4 | untouched; possible future **consumer** only under separate authorization |
| Dashboard | historical short label **Polarity** unchanged |
| `nineRules` Rule 2 | **Polarity Engine**; technical `READY_FOR_VALIDATION`; `affectsClinicalSelection: false`; synthetic-shadow comment |
| Technical READY | **≠** clinical readiness |

---

## 10. Safety and mechanical evidence (recorded)

Recorded from implementation + pre-merge independent review + exact-head CI (not re-executed in this docs tranche):

- Exact-key validation; unknown/missing/duplicate/wrong-type fail-closed
- Proxy / throwing-getter rejection with zero trap/getter execution before reject
- Cycle / sparse / symbol / non-plain rejection
- PHI / protected-path / forbidden medicine-formula mutation keys rejected
- Defensive clone; input non-mutation; deep-frozen output and registry
- Deterministic key order / fingerprint; permitted evidence reorder stability
- Fixed failure messages (`message === failureCode`)
- No Rule 4 / fs / net / DB / env / orch dependency in production source
- Root typecheck + Vitest discovery registration
- Production audit (`npm audit --omit=dev --audit-level=high`) **0** vulnerabilities (prior run / CI surface)
- Root override `nanoid@3.3.18` intact

---

## 11. Proof matrix summary (P01–P18 + regressions)

| Layer | Role |
|-------|------|
| Production enforcement | Evaluator / validators implement contract obligations |
| Committed proofs | P01–P18 + 8 adversarial regressions in `packages/rule2/tests/rule2-shadow-proofs.test.ts` |
| Independent review | `R2_INDEPENDENT_SYNTHETIC_SHADOW_REVIEW_PASS` on exact head |
| Exact-head CI | run `31834114020` **success** on `a083b03…` |

**P01–P18 (titles only):** strict schema; empty registry/mappings 0; insufficient → UNRESOLVED+NEUTRAL+review; slot isolation; order/`mutatesMixtures`; law of opposites; NEUTRAL/SUPPORT_ONLY; MIXED review-only; medicine `.polarity` reject; forbidden lifecycle/promotion; no selection/ranking; no potency/Rx fields; input non-mutation; deep-freeze; fingerprint/order; fixed errors; no PHI/path leakage; no Rule 4/orch wiring.

**8 regressions:** Proxy/getter zero-access; cycles/sparse/symbols; duplicate IDs/versions; lifecycle matrix; empty-registry bypass; contradiction precedence; export/deps surface; (plus covered order/MIXED/medicine-key surfaces in P-matrix).

---

## 12. Accepted NON_BLOCKING residuals (unchanged)

None fixed in this evidence tranche. Not clinically resolved.

1. Windows CRLF Prettier checkout noise; Linux exact-head CI authoritative  
2. Native `Error.stack` exists on thrown `Rule2EvaluationError`; returned evaluator **output** excludes stack  
3. `R2_FORBIDDEN_MEDICINE_REGISTRY_POLARITY` reason code defined but unused — rejection occurs earlier via forbidden-key `INVALID_INPUT`  
4. `INTERNAL_FAILURE` conversion path not reached by committed behavioral fixtures  
5. Some P18 checks are static/supplementary to runtime invariants  
6. Inventory/non-stale blocking lifecycle aggregation may return `DOCTOR_REVIEW_REQUIRED` (still fail-closed)  
7. Temporary-worktree folder-name boundary warning  
8. Unrelated local Windows full-phase5b `better-sqlite3` / CRLF hash noise  

---

## 13. Interface / dashboard distinction

| Surface | Required posture |
|---------|------------------|
| Technical package | Implemented (`RULE2_SHADOW_EVALUATOR_IMPLEMENTED`) |
| `nineRules` metadata | `Polarity Engine` · `READY_FOR_VALIDATION` · `affectsClinicalSelection: false` |
| Dashboard alias | Historical **Polarity** — unchanged |
| Clinical mappings | **0** |
| Catalog | `NOT_CREATED` |
| Rule 4 integration | None |
| Orchestration | `NOT_CONNECTED` |
| Clinical activation | `NONE` |
| Medicine / formula / Rx effect | `NONE` |
| Clinical correctness | **Not established** |

---

## 14. Explicit clinical non-claims

This evidence does **not** establish:

- Clinical correctness or validated real disease-polarity mappings  
- Medicine-registry polarity as disease evidence  
- Medicine selection / ranking / pair compatibility  
- Formula / mixture mutation  
- Potency / electricity / dosage / Tablet / external choice  
- Rule 4 clinical integration  
- Orchestration / clinical activation / production Rx  
- Production readiness  

---

## 15. Continuing STOP

**STOP** before (without separate owner authorization):

- Residual fixes that change production behavior  
- Real polarity mappings / evidence catalog creation  
- Medicine selection / formula mutation / potency-electricity decisions  
- Rule 4 integration / orchestration / clinical activation / production Rx  
- C3E / SAC / protected-source access  
- Legacy mutation / paid services / deployment  

---

## 16. STOP (this documentation tranche)

This PR is **documentation-only**. It must not mutate packages, tests, lockfile, apps, workflows, mappings, Rule 4, orchestration, or deployment.

Next separately authorized steps (if any) remain owner-gated under `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`.
