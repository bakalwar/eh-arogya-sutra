# Rule 9 — Master Pipeline implementation evidence (post-merge)

## 1. Document control

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** (post-merge implementation evidence) |
| **Document class detail** | Technical shadow validator/packager evidence only — **not** clinical validation; **not** production-readiness approval; **not** orchestration or activation authority |
| **Authorization (this documentation)** | **`R9_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_AUTHORIZED`** |
| **Owner governance directive** | **`ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`** |
| **Independent technical review (pre-merge)** | **`R9_INDEPENDENT_SHADOW_VALIDATOR_REVIEW_PASS`** |
| **Owner merge readiness (pre-merge)** | **`EHAS2_PR95_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR95_OWNER_MERGE_AUTHORIZED`** (executed) |
| **Merge completion token** | **`RULE9_SHADOW_VALIDATOR_MERGED_TO_CANONICAL_MAIN`** |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |
| **Canonical `origin/main` (post PR #95)** | `24010d41234de598ba4532d3756afd6c58e52801` |
| **Companion canonical contract** | [rule-09-master-pipeline-contract.md](./rule-09-master-pipeline-contract.md) |
| **Cross-rule authority pointer** | [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md) (§ Owner clinical authority vs technical engineering) |
| **§F / OD-013 / OD-014 pointer** | [../mixture-evidence-safety-policy.md](../mixture-evidence-safety-policy.md) |

This document records **post-merge** evidence that the Rule 9 **shadow-only** Master Pipeline validator/packager (`@ehas2/rule9`, `evaluateRule9Shadow`, identity `MASTER_PIPELINE`) was merged to canonical `main` via PR #95, independently reviewed for technical compliance, and remains **non-clinical** / **non-orchestrated** / **non-activated**.

It does **not** claim Electrohomeopathy clinical correctness, invent complexity criteria, invent or approve medicines/formulas/mappings, connect Phase 5C/Python orchestration/runtime, activate clinical selection, grant medicine/prescription influence, change production Rx, resume Rule 5 C3E, alter Rules 6/7/8 clinical data, or modify legacy.

**Review and merge tokens prove technical review and merge authorization only — not clinical correctness.** Technical PASS is not clinical validation.

---

## 2. Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

This evidence tranche documents **technical engineering facts** only. Owner approval remains required before complexity criteria/classifier; medicine selection/removal/reordering; formula composition; clinical conflict-resolution policy beyond fail-closed; Rule applicability meaning; potency/dosage/electricity; Tablet A/B or external clinical meaning; final clinical approval; production orchestration or activation.

---

## 3. Canonical implementation status (current)

Unambiguous **current** posture after PR #95 merge:

| Token | Meaning (technical) |
|-------|---------------------|
| `RULE9_SHADOW_VALIDATOR_IMPLEMENTED` | Shadow validator/packager package present on canonical main |
| `RULE9_MASTER_PIPELINE_VALIDATE_REJECT_PACKAGE_ONLY` | Scope remains validate / reject / package only |
| `RULE9_REAL_CLINICAL_DATA_0` | No real Rule 9 clinical data/mappings |
| `RULE9_PRODUCTION_MAPPING_REGISTRY_EMPTY` | Production mapping registry entries empty and frozen |
| `RULE9_COMPLEXITY_CRITERIA_NOT_IMPLEMENTED` | No complexity criteria, threshold, weight, or classifier |
| `RULE9_ORCHESTRATION_NOT_CONNECTED` | No Phase 5C/Python/runtime connector |
| `RULE9_CLINICAL_ACTIVATION_NONE` | Clinical activation always `NONE` |
| `RULE9_MEDICINE_SELECTION_INFLUENCE_NONE` | Medicine/selection influence always `NONE` |
| `RULE9_PRESCRIPTION_EFFECT_NONE` | Prescription/Rx effect always `NONE` |
| `RULE9_PRODUCTION_RX_UNCHANGED` | Production prescription path unchanged |
| `RULE9_NOT_CLINICALLY_ACTIVATED_PRESCRIPTION` | Outputs are never a clinically activated prescription |
| `RULE9_TECHNICAL_READY_FOR_VALIDATION_NOT_CLINICAL_READY` | `nineRules` technical `READY_FOR_VALIDATION` ≠ clinical readiness |
| `RULE9_UPSTREAM_RULES_1_TO_8_NOT_REINTERPRETED` | Rules 1–8 typed envelopes only; no clinical reinterpretation |
| `RULE9_NO_SELECTION_NO_COMPOSITION_MUTATION` | No new selection; no composition mutation |
| `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` | No-paid lock intact |

**Token alias note:** Pre-implementation contract/docs used `RULE9_SHADOW_EVALUATOR_NOT_IMPLEMENTED`. Post-merge current token uses **`RULE9_SHADOW_VALIDATOR_IMPLEMENTED`** to match the owner-locked Master Pipeline **validate/reject/package** surface (`evaluateRule9Shadow`). “Evaluator” and “validator/packager” name the same shadow package surface; they are **not** competing clinical meanings.

Also retained (current, from contract lock): `RULE9_IDENTITY_OWNER_LOCKED` · `RULE9_SCOPE_OWNER_LOCKED` · `RULE9_CANONICAL_CONTRACT_DOCUMENTED` · `RULE9_NO_NEW_SELECTION` · `RULE9_NO_COMPOSITION_MUTATION` · `RULE9_COUNT_VALIDATE_OR_REJECT_ONLY` · `RULE9_COMPLEXITY_TIER_NOT_INFERRED` · `RULE9_COMPLEXITY_CLASSIFIER_CONTRACT_PENDING` · `RULE9_VALIDATE_REJECT_AND_PACKAGE_ONLY` · `RULE9_INDEPENDENT_OF_RULE5_C3E`.

**Historical (superseded for current implementation readiness):** contract-documentation-tranche tokens `RULE9_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE9_IMPLEMENTATION_NOT_AUTHORIZED`, and current-facing “evaluator **NOT_IMPLEMENTED**” / “impl **NOT_AUTHORIZED**” / “**no** impl” / “`packages/rule9` absent” wording in status matrices prior to this evidence document — do **not** read as current post-merge **package** status without this document and companion pointer updates.

---

## 4. PR #95 Git identity

| Item | Value |
|------|--------|
| **Repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **PR** | [#95](https://github.com/bakalwar/EH_AROGYA_SUTRA_2/pull/95) |
| **Branch** | `feat/rule9-master-pipeline-shadow` (not deleted by merge procedure) |
| **State** | **MERGED** |
| **Base (authorized / parent 1)** | `77546db3f13b4837205e4f65fb96a3070fc48e1b` |
| **Reviewed head (parent 2)** | `2fc5fd5aa22f5bd955b2eacad1b0cedac8afa2ed` |
| **Merge commit (`origin/main`)** | `24010d41234de598ba4532d3756afd6c58e52801` |
| **Merge style** | Normal two-parent merge (not squash/rebase; no admin bypass; no auto-merge) |
| **Reviewed-head tree** | `ec2eea2283421ffa125f166d9ec188101a8e8f62` |
| **Merge-commit tree** | `ec2eea2283421ffa125f166d9ec188101a8e8f62` |
| **Tree equality** | **Identical** |
| **Implementation commits (base→head)** | Exactly **1** linear commit (`2fc5fd5…`) |
| **Post-CI commit** | **None** |
| **CI on reviewed head** | GitHub Actions run **`31744292404`** — **success** on exact head `2fc5fd5aa22f5bd955b2eacad1b0cedac8afa2ed` |
| **Independent technical review** | **`R9_INDEPENDENT_SHADOW_VALIDATOR_REVIEW_PASS`** |
| **Owner merge readiness** | **`EHAS2_PR95_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR95_OWNER_MERGE_AUTHORIZED`** |
| **Merge completion** | **`RULE9_SHADOW_VALIDATOR_MERGED_TO_CANONICAL_MAIN`** |

These tokens attest **technical** review and merge authority only — **not** clinical correctness, clinical validation, or production readiness.

---

## 5. Package identity

| Item | Value |
|------|--------|
| Package | `@ehas2/rule9@0.1.0-shadow` |
| Public evaluator/validator | `evaluateRule9Shadow` |
| Rule identity | `MASTER_PIPELINE` |
| Display title | Master Pipeline |
| Contract / input / output versions | `ehas2-rule9-contract-v1` / `ehas2-rule9-input-v1` / `ehas2-rule9-output-v1` |
| Input keys | **14** (`RULE9_INPUT_KEY_ORDER`) |
| Output keys | **24** (`RULE9_OUTPUT_KEY_ORDER`) |
| Package-record keys | **6** (`RULE9_PACKAGE_KEY_ORDER`) |
| Closed outcomes | **7** |
| Fixed failure codes | **5** (`message === failureCode`) |
| Runtime dependencies | `dependencies: {}` |
| Production mapping registry | empty frozen `entries: []` |

---

## 6. Scope inventory (PR #95)

Base `77546db…` → reviewed head `2fc5fd5…` (and merge tree): **exactly 17 paths**, **`+1707/−3`**.

### 6.1 Path list

1. `packages/rule9/package.json`
2. `packages/rule9/tsconfig.json`
3. `packages/rule9/src/constants.ts`
4. `packages/rule9/src/errors.ts`
5. `packages/rule9/src/evaluate.ts`
6. `packages/rule9/src/freeze.ts`
7. `packages/rule9/src/index.ts`
8. `packages/rule9/src/types.ts`
9. `packages/rule9/src/validateInput.ts`
10. `packages/rule9/src/version.ts`
11. `packages/rule9/tests/rule9-shadow-proofs.test.ts`
12. `scripts/typecheck-all.mjs`
13. `vitest.config.ts`
14. `package-lock.json` (Rule 9 workspace link/entry **only**)
15. `packages/clinical-contracts/src/nineRules.ts` (Rule 9 entry only)
16. `tests/unit/phase5b-clinical-packages.test.ts` (Rule 9 status-assertion alignment only)
17. `tests/unit/phase5c-nine-rule-orchestration.test.ts` (Rule 9 status-assertion alignment only)

### 6.2 Exact three deletions

| File | Deleted meaning | Replacement |
|------|-----------------|-------------|
| `packages/clinical-contracts/src/nineRules.ts` | Rule 9 `affectsClinicalSelection: true` | `false` + shadow-only / not-production-connected comment |
| `tests/unit/phase5b-clinical-packages.test.ts` | Test title “Rule 8 shadow…” | Title widened to “Rule 8/9 shadow…” (+ Rule 9 assertions) |
| `tests/unit/phase5c-nine-rule-orchestration.test.ts` | Test title “Rule 8 shadow…” | Title widened to “Rule 8/9 shadow…” (+ Rule 9 assertions) |

### 6.3 Confirmed absences from PR #95

- no clinical data / real mappings
- no documentation paths
- no apps/dashboard change
- no Phase 5C/Python change
- no workflow change
- no orchestration connector
- no legacy mutation
- no deployment change

---

## 7. Contract traceability (technical)

Production enforcement in `@ehas2/rule9` (not test-only):

| Requirement | Enforcement |
|-------------|-------------|
| Validate / reject / package only | `evaluateRule9Shadow` — no medicine selection API |
| No selection / no composition mutation | Pass-through oral mixtures; reject forbidden filler/tablet/external/+1 keys |
| Exact schemas and versions | Exact 14-key input; `ehas2-rule9-input-v1`; ordered 24-key output |
| Unknown-key rejection | Exact-key sets at controlled object levels |
| Deterministic precedence | Contract §6.3 order in `evaluate.ts` |
| Defensive clone | JSON canonical clone after Proxy/accessor rejection |
| Deep-frozen output | Recursive `deepFreeze` |
| Fixed failure codes | `Rule9EvaluationError`; `message === failureCode`; unexpected → `INTERNAL_FAILURE` |
| Rules 1–8 typed envelopes | Identity + version + status + applicability (+ R6–8 count field) |
| Upstream applicability not inferred | Caller-declared only; `NOT_APPLICABLE` ≠ missing evidence |
| Rules 1–5 semantics not reinterpreted | Snapshot only; no clinical override |
| R6/7/8 synthetic or zero-data not clinical authority | Zero required data → fail-closed; fixtures ≠ clinical evidence |

---

## 8. Complexity and §F boundary

- Rule 9 **does not infer** complexity tier.
- Accepted tiers map exactly: Simple → **3**; Moderate → **4**; Complex → **5**.
- No 1–2 oral mixtures; no `+1`; no filler medicine.
- Tablet A/B and external applications are **excluded** from oral count (rejected as composition keys; package `sectionSeparations` flags).
- Count mismatch → `BLOCKED_BY_COUNT_VALIDATION` with **zero** composition mutation.
- Missing/unapproved/stale/contradictory tier → `NOT_EVALUABLE`; no positive package.
- No complexity criteria, thresholds, weights, heuristics, or classifier implemented.
- `countValidationState: 'PASS'` is an **output subfield only** — not a clinical success outcome.
- Technical success outcome remains **`SHADOW_PACKAGE_READY`** only.

---

## 9. Zero-data boundary

When required Rule 6/7/8 clinical data is unavailable/zero (or required `NOT_EVALUABLE`):

- no Rx / no positive clinical package
- `INSUFFICIENT_CLINICAL_EVIDENCE` and/or `DOCTOR_REVIEW_REQUIRED` per contract precedence
- no default formula / fallback medicine / inferred tier

Current data counts (production):

| Surface | Count |
|---------|-------|
| Rule 6 relationships | **0** |
| Rule 7 route/site mappings | **0** |
| Rule 8 disease→prakriti mappings | **0** |
| Rule 9 real clinical data/mappings | **0** |
| Rule 9 production mapping registry entries | **0** (empty frozen) |

A fully conjunctive **synthetic** fixture may reach technical `SHADOW_PACKAGE_READY` only. That is **not** a clinically activated prescription and is **not** clinical validation.

---

## 10. Proof evidence

| Item | Recorded fact |
|------|----------------|
| Mandatory proofs | **P01–P18** exactly; sequential; unique; **no** P19 |
| Additional regressions | **R01–R08** |
| Focused suite | **26/26 PASS**; **zero** skips/todos |
| Rule 9 typecheck/build | PASS on reviewed head |
| Root typecheck | `@ehas2/rule9` registered in `scripts/typecheck-all.mjs` |
| Vitest discovery | `packages/rule9/tests/**/*.test.ts` |
| phase5b / phase5c | Rule 9 technical metadata assertions aligned |
| Negative probes | Injected Rule 9 type error failed root typecheck → restored; injected P01 failure failed Vitest → restored; clean reviewed head afterward |
| Exact-head CI | Run `31744292404` **success** on `2fc5fd5…` |
| Production audit | **0** high+ vulnerabilities on CI |
| `nanoid` | **`3.3.18`** intact |

Technical proofs are **not** clinical validation.

---

## 11. Output invariants

Every reachable evaluated output preserves:

- `shadowOnly: true`
- `clinicalActivation: 'NONE'`
- `medicineSelectionInfluence: 'NONE'`
- `prescriptionEffect: 'NONE'`
- `notAClinicallyActivatedPrescription: true`

Package posture constants:

- `RULE9_ORCHESTRATION_STATUS = 'NOT_CONNECTED'`
- `RULE9_RUNTIME_STATUS = 'NOT_CONNECTED'`
- `RULE9_PRESCRIPTION_EFFECT = 'NONE'`

---

## 12. Accepted non-blocking residuals (honest; not fixed)

Preserved from independent review / merge record. **Do not** treat as corrected by this documentation PR:

1. **P11 channel:** contradiction is fail-closed through fixed error `CONTRADICTORY_UPSTREAM_STATE`; outcome `BLOCKED_BY_UPSTREAM_CONTRADICTION` is effectively unreachable after validation.
2. **`countValidationState: 'PASS'`** may appear with `UNRESOLVED_EVIDENCE` and a null package; it remains a **subfield**, not a success outcome.
3. **Protected-data validation** is PHI-key shaped, not a broad path-string scanner.
4. Native **`Rule9EvaluationError.stack`** may exist; callers must **not** serialize it into user/clinical output.
5. Local Windows Prettier CRLF noise; exact-head Linux CI format gate passed.
6. **R08** is static-leaning (export-surface assertion).
7. Clinical validation dashboard has **no dedicated `rule9Implementation` field**; dashboard was **unchanged** by PR #95.

These residuals do **not** authorize a correction PR in this documentation task.

---

## 13. Dashboard and interface distinction

| Surface | Current fact |
|---------|--------------|
| `nineRules` Rule 9 | technical `READY_FOR_VALIDATION` · `affectsClinicalSelection: false` · shadow-only / not-production-connected comment |
| Orchestration (`ORCHESTRATION_STATUS`) | **`NOT_CONNECTED`** |
| Dashboard file | **unchanged** by PR #95 |
| Dashboard static rules list | may show Rule 9 `READY_FOR_VALIDATION` (scaffold label only) |
| Dedicated `rule9Implementation` field | **does not exist** |
| `clinicalReadiness` | **`false`** |
| `prescriptionEngine` | **`NOT_CONNECTED`** |
| `rule8Implementation` | remains **`NOT_IMPLEMENTED`** |

Do **not** use `READY_FOR_VALIDATION` as a production or clinical-readiness claim.

---

## 14. Explicit non-claims / STOP

This evidence documentation does **not** authorize:

- real medicine selection
- formula creation
- composition changes
- complexity criteria / classifier
- clinical validation
- disease mapping
- thresholds or weights
- upstream clinical reinterpretation (Rules 1–8)
- Phase 5C / Python connection
- orchestration / runtime
- prescription activation
- production Rx
- C3E / protected access
- legacy harvesting
- paid service
- deployment

**STOP before:** real clinical data; medicine mappings; complexity-classifier work; Rules 1–8 clinical reconciliation beyond fail-closed; orchestration; activation; deployment.

**Separate owner authorizations required** before: complexity-classifier contract; validated clinical evidence for upstream Rules as needed; independent clinical review of concrete packaging semantics; orchestration connection; production activation.

---

## 15. Delivery token (documentation tranche)

When this documentation Draft PR is delivered for independent review:

`R9_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_DELIVERED_FOR_REVIEW`
