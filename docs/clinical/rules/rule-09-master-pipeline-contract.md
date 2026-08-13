# Rule 9 — Master Pipeline (Canonical Contract)

| Field | Value |
|-------|--------|
| **Rule number** | 9 |
| **Canonical identity token** | `MASTER_PIPELINE` |
| **Display title** | Master Pipeline |
| **Document class** | OWNER_LOCKED canonical contract |
| **Authority tokens** | `R9_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED` · `R9_MASTER_PIPELINE_CANONICAL_CONTRACT_DOCUMENTATION_AUTHORIZED` |
| **Contract version** | `ehas2-rule9-contract-v1` |
| **Implementation (current)** | `RULE9_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE9_IMPLEMENTATION_NOT_AUTHORIZED` |
| **Runtime** | `RULE9_ORCHESTRATION_NOT_CONNECTED` · `RULE9_CLINICAL_ACTIVATION_NONE` · `RULE9_MEDICINE_SELECTION_INFLUENCE_NONE` · `RULE9_PRESCRIPTION_EFFECT_NONE` |
| **Prescription posture** | Shadow package only under this contract · production Rx **unauthorized** · `RULE9_PRODUCTION_RX_UNCHANGED` |
| **Complexity-tier classifier** | **Separate** owner-approved input required · **not** inferred by Rule 9 · criteria **not** defined in this tranche |
| **Paid services** | `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` |
| **Rule 5 C3E** | `RULE9_INDEPENDENT_OF_RULE5_C3E` (C3E remains paused separately) |
| **Owner governance** | `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED` |
| **Canonical `origin/main` base (at documentation start)** | `8af924c82d7660f232b02f763447f6b707d94dea` |

**Status tokens (current):**

- `RULE9_IDENTITY_OWNER_LOCKED`
- `RULE9_SCOPE_OWNER_LOCKED`
- `RULE9_CANONICAL_CONTRACT_DOCUMENTED`
- `RULE9_SHADOW_EVALUATOR_NOT_IMPLEMENTED`
- `RULE9_IMPLEMENTATION_NOT_AUTHORIZED`
- `RULE9_ORCHESTRATION_NOT_CONNECTED`
- `RULE9_CLINICAL_ACTIVATION_NONE`
- `RULE9_MEDICINE_SELECTION_INFLUENCE_NONE`
- `RULE9_PRESCRIPTION_EFFECT_NONE`
- `RULE9_PRODUCTION_RX_UNCHANGED`
- `RULE9_NO_NEW_SELECTION`
- `RULE9_NO_COMPOSITION_MUTATION`
- `RULE9_COUNT_VALIDATE_OR_REJECT_ONLY`
- `RULE9_COMPLEXITY_TIER_NOT_INFERRED`
- `RULE9_COMPLEXITY_CLASSIFIER_CONTRACT_PENDING`
- `RULE9_VALIDATE_REJECT_AND_PACKAGE_ONLY`
- `RULE9_INDEPENDENT_OF_RULE5_C3E`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`

**Historical (superseded for current identity readiness):** Stage A `IDENTITY_CANDIDATE_ONLY` for Rule 9 — retained only as pre-owner-decision history. Phase 5C synthetic “EXECUTED” validation-wrapper labeling remains **historical / non-authoritative** for this owner-locked contract and must **not** be read as Rule 9 clinical implementation, production orchestration, or prescription authority.

This document is the authoritative EHAS2 Rule 9 **contract**. It does **not** create `packages/rule9`, implement an evaluator, connect Phase 5C/Python orchestration, invent complexity criteria, invent clinical data, activate clinical selection, or change production prescription output.

---

## 0. Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

Explicit owner approval is required before adding or changing: complexity criteria; medicine selection/removal/reordering; formula composition; clinical conflict-resolution policy beyond this fail-closed contract; Rule applicability meaning; potency, dosage or electricity; Tablet A/B or external clinical meaning; final clinical approval; production orchestration or activation.

Within this locked contract, technical engineering may design schemas/types, deterministic validation, immutable redacted shadow outputs, fixed error handling, security/privacy controls, and synthetic tests that preserve clinical meaning. Cost/paid services, security-policy change, protected-data access, production/runtime connection, external deploy, and legacy modification still require owner approval.

Unresolved clinical decision → **STOP** and ask owner.

Canonical cross-rule pointer: [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md).

§F / OD-013 / OD-014 mixture safety: [../mixture-evidence-safety-policy.md](../mixture-evidence-safety-policy.md).

---

## 1. Locked owner decisions (R9-ID-01 … R9-ID-05)

| Decision ID | Owner disposition | Normative effect |
|-------------|-------------------|------------------|
| **R9-ID-01** | **`ACCEPT_MASTER_PIPELINE`** | Canonical name **Master Pipeline**; identity token **`MASTER_PIPELINE`**. Names orchestration / final validation / packaging responsibility. Rule 9 is **not** a ninth medicine selector. Does **not** approve any medicine, formula, or clinical mapping. |
| **R9-ID-02** | **`VALIDATE_REJECT_AND_PACKAGE_ONLY_NO_NEW_SELECTION`** | Rule 9 may accept contract-valid upstream envelopes; check required upstream states and evidence versions; detect cross-rule contradictions; apply Constitution §F and OD-013/014; shadow-package complete eligible proposals; reject unsafe/incomplete/contradictory/unsupported proposals; emit typed fail-closed outcomes. Rule 9 must **not** select new medicines; rank/boost/demote; change upstream medicines; compose new formulas; fill missing medicines; invent fallback prescriptions; or invent clinical evidence. |
| **R9-ID-03** | **`RULE9_COUNT_VALIDATE_OR_REJECT_NO_COMPOSITION_MUTATION`** | Rule 9 validates owner-locked oral mixture counts: Simple → exactly **3**; Moderate → exactly **4**; Complex → exactly **5**; never 1 or 2; no oral “+1”; Tablet A/B and external applications are **not** oral-count members. On count failure → **fail-closed** outcome only — **no** add/remove/reorder/rank, **no** filler or synthetic medicines. |
| **R9-ID-04** | **`ZERO_CLINICAL_DATA_NO_RX_TYPED_FAIL_CLOSED_SHADOW_ENVELOPE_ONLY`** | When Rule 6 relationships, Rule 7 mappings, or Rule 8 mappings/evidence are **required** for the case but validated active clinical data count is **`0`**: no Rx; no fallback medicine/formula; affected Rule status `NOT_EVALUABLE` (or exact contract-defined non-success); Master Pipeline fail-closed; `INSUFFICIENT_CLINICAL_EVIDENCE`; `DOCTOR_REVIEW_REQUIRED`; redacted technical shadow envelope only; clinical activation **`NONE`**; production prescription effect **`NONE`**. Upstream **`NOT_APPLICABLE`** is **not** treated as missing evidence; Rule 9 must **not** invent applicability meaning. |
| **R9-ID-05** | **`COMPLEXITY_TIER_SEPARATE_OWNER_APPROVED_INPUT_NOT_INFERRED_BY_RULE9`** | Simple/Moderate/Complex is **not** hardcoded or inferred inside Rule 9. Rule 9 accepts only a separately owner-approved, evidence-backed complexity-tier input. Until a separate complexity-classifier contract is owner-approved: no inference from symptoms/disease/organ counts; no legacy copy; no agent/AI suggestion; missing/stale/contradictory/unapproved tier → fail-closed / `NOT_EVALUABLE`; no positive count validation; no Rx. This tranche does **not** define complexity criteria. |

---

## 2. Provenance

| Source | Role |
|--------|------|
| EH_9 / Phase 5A nine-rule vocabulary | Name and number (**Master Pipeline**) |
| Owner decisions R9-ID-01–R9-ID-05 | Identity and scope lock |
| Constitution §F · OD-013 · OD-014 | Owner-locked oral mixture-count and insufficient-evidence fail-closed policy |
| Rule 6/7/8 contracts | Upstream boundaries; mixture-count ownership attributed to Rule 9 / §F |
| Phase 5C synthetic orchestrator Rule 9 wrapper | **HISTORICAL / SYNTHETIC_VALIDATION_ONLY** — not this contract’s clinical authority |
| Legacy `generate_complete_formula` / MDE / `mixture_count_engine` | **LEGACY_REFERENCE_ONLY** |

---

## 3. Scope and non-goals

### 3.1 In scope (this contract)

- Deterministic **shadow** Master Pipeline evaluation: validate / reject / package only
- Typed consumption of Rules 1–8 upstream envelopes (identity + version + status + declared applicability)
- Constitution §F / OD-013 oral mixture-count validation against a separately approved complexity-tier input
- OD-014 insufficient-evidence fail-closed emission (`INSUFFICIENT_CLINICAL_EVIDENCE`, `DOCTOR_REVIEW_REQUIRED`)
- Zero required clinical-data fail-closed behavior (R9-ID-04)
- Cross-rule contradiction detection without inventing clinical resolution policy beyond fail-closed STOP
- Redacted immutable shadow package output (never a clinically activated prescription under this contract)

### 3.2 Out of scope (this stage and locked prohibitions)

- Creating `packages/rule9` or implementing an evaluator (separate authorization required)
- Connecting Phase 5C/Python orchestration or production AnalyzeComplete
- Complexity criteria / classifier contract (separate owner tranche)
- New medicine selection, ranking, boosting, demotion, removal, reordering
- Formula composition or filler to satisfy 3/4/5
- Potency, dosage, electricity, Tablet A/B clinical selection, external clinical meaning, monitoring/emergency instructions
- Overriding Rules 1–8 clinical meanings
- Real clinical data population
- Clinical activation or production prescription effect

Rule 9 must **not** silently absorb out-of-scope capabilities.

---

## 4. Cross-rule authority (locked)

| Rule | Rule 9 must not |
|------|-----------------|
| **1** | Override temperament |
| **2** | Redefine polarity |
| **3** | Change systems |
| **4** | Decide potency |
| **5** | Create monitoring / emergency instructions |
| **6** | Add / remove / reorder medicines in Rule 6 proposals |
| **7** | Change external route clinical meaning |
| **8** | Reconcile or overwrite disease-level prakriti |

Synthetic fixtures, interface metadata, inventories, and legacy output are **not** clinical authority.

### 4.1 Capability ownership map

| Capability | Owner |
|------------|--------|
| Final oral mixture-count validation (3/4/5) | **Rule 9** applying **Constitution §F / OD-013** |
| Insufficient-evidence fail-closed (no filler Rx) | **Rule 9** applying **OD-014** |
| Shadow packaging of eligible upstream proposal | **Rule 9** (validate/reject/package only) |
| Composition candidate proposal | Rule 6 (when authorized data exists) |
| External route/site indication | Rule 7 |
| Disease-level prakriti indication | Rule 8 |
| Complexity-tier classification | **Separate** owner-approved classifier / input (pending) |
| Clinically activated prescription issuance | **Unauthorized** under this contract; doctor review + separate activation required later |

---

## 5. Input vocabulary (`ehas2-rule9-input-v1`)

Plain-data, versioned schema. Identifiers are canonical references. **No PHI**. **No** protected clinical source paths. **No** direct database access as clinical authority.

### 5.1 Required top-level keys (deterministic order)

1. `contractVersion` — must equal `ehas2-rule9-input-v1` (or a later owner-approved version supported by a future evaluator)
2. `requestId` — non-PHI synthetic evaluation / request identifier
3. `complexityTierRef` — separately owner-approved complexity-tier envelope (`SIMPLE` \| `MODERATE` \| `COMPLEX` **only when** evidence-backed approval metadata is present) **or** explicit non-success `{ "status": "UNAVAILABLE" | "UNAPPROVED" | "CONTRADICTORY" | "STALE" }`
4. `rule1Envelope` — Rule 1 result envelope (identity + version + status + applicability) **or** `{ "status": "UNAVAILABLE" }`
5. `rule2Envelope` — Rule 2 result envelope **or** `{ "status": "UNAVAILABLE" }`
6. `rule3Envelope` — Rule 3 result envelope **or** `{ "status": "UNAVAILABLE" }`
7. `rule4Envelope` — Rule 4 result envelope **or** `{ "status": "UNAVAILABLE" }`
8. `rule5Envelope` — Rule 5 result envelope **or** `{ "status": "UNAVAILABLE" }` / `{ "status": "NOT_IMPLEMENTED" }`
9. `rule6Envelope` — Rule 6 shadow/result envelope including composition candidates and `rule9ValidationRequired` markers when proposed **or** `{ "status": "UNAVAILABLE" }`
10. `rule7Envelope` — Rule 7 shadow/result envelope **or** `{ "status": "UNAVAILABLE" }`
11. `rule8Envelope` — Rule 8 shadow/result envelope **or** `{ "status": "UNAVAILABLE" }`
12. `proposedOralComposition` — oral mixture proposal under validation (medicine IDs + evidence refs only as passed through from upstream; may be empty) **or** `{ "status": "ABSENT" }`
13. `evidenceDataVersions` — version stamps for corpora / envelopes used
14. `upstreamApplicability` — pipeline applicability envelope (`APPLICABLE` \| `NOT_APPLICABLE` \| `NOT_EVALUABLE` with reason codes)

### 5.2 Input prohibitions

- Complexity criteria, scores, or inferred tiers invented by Rule 9
- Medicine lists invented by Rule 9 to fill count
- Legacy MDE / `mixture_count_engine` structures as clinical authority
- PHI, protected paths, hashes, manifests
- Thresholds / weights invented by engineering
- Agent/AI suggestions as clinical authority

### 5.3 Upstream applicability distinctions (mandatory)

| State | Meaning for Rule 9 |
|-------|-------------------|
| Upstream **`NOT_APPLICABLE`** | Contractually out of scope for that Rule/case — **not** treated as missing evidence |
| Upstream **`NOT_EVALUABLE`** | Required for the case but cannot be evaluated — contributes to fail-closed / non-success |
| **Missing required evidence** | Required activating clinical data absent (including validated count **`0`** when required) — fail-closed per R9-ID-04 / OD-014 |
| **Contradictory upstream states** | Detected contradiction among envelopes — fail-closed; **no** invented clinical reconciliation |
| Rule 9 must **not** invent which Rules are applicable | Applicability is declared by upstream envelopes / owner-approved contracts only |

---

## 6. Output vocabulary (`ehas2-rule9-output-v1`)

Shadow-only deterministic result. Deep-frozen after construction. Key order fixed. **Never** a clinically activated prescription under this contract.

### 6.1 Required top-level keys (deterministic order)

1. `contractVersion`
2. `ruleNumber` — always `9`
3. `ruleIdentity` — always `MASTER_PIPELINE`
4. `requestId`
5. `status` — closed outcome (§6.3)
6. `applicability`
7. `complexityTierAccepted` — accepted tier token **or** `null` when tier not accepted
8. `requiredOralMixtureCount` — `3` \| `4` \| `5` when tier accepted; otherwise `null`
9. `observedOralMixtureCount` — non-negative integer count of oral mixtures in the validated proposal (or `null` when not evaluable)
10. `countValidationState` — `PASS` \| `FAIL` \| `NOT_EVALUABLE` \| `NOT_APPLICABLE`
11. `packagedShadowProposal` — redacted immutable shadow package object **or** `null`
12. `rejectionReasons` — ordered reason codes (may be empty only on successful shadow package)
13. `insufficientClinicalEvidence` — boolean
14. `doctorReviewRequired` — boolean
15. `upstreamRuleStates` — per-Rule 1…8 status snapshot (typed; no PHI)
16. `evidenceRefs`
17. `reasonCodes`
18. `blockersOrUnresolvedEvidence`
19. `deterministicFingerprint`
20. `shadowOnly` — always `true` under this contract
21. `clinicalActivation` — always `NONE`
22. `medicineSelectionInfluence` — always `NONE`
23. `prescriptionEffect` — always `NONE`
24. `notAClinicallyActivatedPrescription` — always `true`

### 6.2 Shadow package record (when present)

Fields (key order):

1. `packageId`
2. `sourceRuleEnvelopes` — ordered refs to contributing upstream envelope versions
3. `oralMixtures` — pass-through validated mixture slots (**no** Rule 9 mutation)
4. `sectionSeparations` — markers that Tablet A/B and external are **not** oral-count members (values are structural flags only; no clinical selection)
5. `countValidated` — boolean
6. `packagingNotes` — closed reason codes only (no free-text clinical invention)

**Must not** include newly selected medicines, filler slots, potency/dosage/electricity decisions, Tablet A/B selections, external instructions, monitoring plans, or issuance flags under this contract stage.

### 6.3 Closed clinical / pipeline outcomes

1. `NOT_APPLICABLE`
2. `NOT_EVALUABLE`
3. `INSUFFICIENT_CLINICAL_EVIDENCE`
4. `BLOCKED_BY_UPSTREAM_CONTRADICTION`
5. `BLOCKED_BY_COUNT_VALIDATION`
6. `SHADOW_PACKAGE_READY`
7. `UNRESOLVED_EVIDENCE`

**Notes:**

- `INSUFFICIENT_CLINICAL_EVIDENCE` **must** set `insufficientClinicalEvidence: true` and `doctorReviewRequired: true`.
- `SHADOW_PACKAGE_READY` means a **technically valid redacted shadow package** only — **not** a clinically activated prescription.
- Clinically activated prescription remains **unauthorized** under this contract.

**Deterministic outcome precedence** (first matching wins; evaluator must not invent ties):

1. Pipeline / upstream applicability yields not-applicable → `NOT_APPLICABLE`
2. Input structurally invalid → fixed error (`INVALID_INPUT` / …) rather than a clinical outcome
3. Complexity tier missing / unapproved / stale / contradictory / inferred attempt → `NOT_EVALUABLE` (no positive count validation)
4. Detected cross-rule contradiction without owner reconciliation contract → `BLOCKED_BY_UPSTREAM_CONTRADICTION`
5. Required upstream Rule is `NOT_EVALUABLE`, or required validated clinical data count is `0` when that Rule’s data is required (R9-ID-04) → `INSUFFICIENT_CLINICAL_EVIDENCE` with `doctorReviewRequired: true` (affected Rule snapshots remain non-success / `NOT_EVALUABLE` as typed)
6. Tier accepted but oral count ≠ required 3/4/5, or count is 1/2, or “+1”/tablet/external counted as oral → `BLOCKED_BY_COUNT_VALIDATION` (fail-closed; **no** composition mutation)
7. Evidence contradictory / unresolved blocking packaging → `UNRESOLVED_EVIDENCE`
8. Otherwise, only when all validation gates hold and proposal is complete/eligible → `SHADOW_PACKAGE_READY`

### 6.4 Fixed implementation / configuration errors

`message === failureCode`:

1. `INVALID_INPUT`
2. `INVALID_UPSTREAM_ENVELOPE`
3. `UNSUPPORTED_CONTRACT_VERSION`
4. `CONTRADICTORY_UPSTREAM_STATE`
5. `INTERNAL_FAILURE`

---

## 7. Fail-closed requirements

### 7.1 Count validation (OD-013 / R9-ID-03)

When `complexityTierRef` is accepted:

| Tier | Required oral mixture count |
|------|-----------------------------|
| Simple | exactly **3** |
| Moderate | exactly **4** |
| Complex | exactly **5** |

Reject (fail-closed, no mutation) if:

- observed oral count is 1 or 2
- observed oral count ≠ required tier total
- proposal treats Tablet A/B or external applications as oral-count members
- proposal uses unauthorized “+1” oral-count semantics

### 7.2 Insufficient evidence (OD-014 / R9-ID-04)

When evidence cannot justify the required 3/4/5 **without** filler/unsupported medicines, or when required Rule 6/7/8 validated active clinical data is **`0`**:

- Do **not** issue or represent a prescription as successful
- Do **not** add filler, fixed, weakly supported, fabricated, or synthetic medicines
- Emit `INSUFFICIENT_CLINICAL_EVIDENCE` with `DOCTOR_REVIEW_REQUIRED`
- Emit **zero** fake or partial oral formulas presented as success
- Allow only a redacted technical shadow envelope describing the fail-closed state

### 7.3 Non-authority sources (never alone)

- Phase 5C synthetic orchestrator “EXECUTED” Rule 9 wrapper
- Legacy MDE / `generate_complete_formula` / `mixture_count_engine`
- Interface metadata (`nineRules.ts` READY_FOR_VALIDATION / affectsClinicalSelection)
- Synthetic CI fixtures
- Agent/AI suggestions
- Unvalidated documentation prose
- File presence, CI PASS, or schema PASS alone

### 7.4 Distinction: shadow package vs clinical activation

| Concept | Status under this contract |
|---------|----------------------------|
| Technically valid **shadow package** | Allowed outcome `SHADOW_PACKAGE_READY` only after gates |
| **Clinically activated prescription** | **Unauthorized** — always `clinicalActivation: NONE`, `prescriptionEffect: NONE` |
| Production AnalyzeComplete / Rx engine | **NOT_CONNECTED** |

---

## 8. Determinism and immutability (future implementation)

When separately authorized to implement:

- Deep-copy validated input; do not mutate caller input
- Deterministic key order and lexicographic sorting of lists
- Deep-freeze output
- No arbitrary clinical tie-break; unresolved or contradictory states → non-success outcome
- Code-only fixed errors (no PHI / protected paths / medicine dumps)
- Never serialize raw `Error.stack` into user-facing or clinical outputs

---

## 9. Future implementation plan (not authorized now)

### 9.1 Suggested package allowlist (unauthorized until separate auth)

- `packages/rule9/package.json`
- `packages/rule9/tsconfig.json`
- `packages/rule9/src/**/*.ts`
- `packages/rule9/tests/**/*.test.ts`

Mechanical root registration (typecheck / Vitest / lockfile) and Rule 9 `nineRules.ts` metadata alignment **only** under that separate implementation authorization.

Do **not** connect Phase 5C/Python orchestration, production AnalyzeComplete, or clinical activation without explicit separate owner authorization.

### 9.2 Mandatory future proof matrix (synthetic cross-rule)

Mechanical count: **18** (do **not** execute in this documentation tranche)

| # | Proof category |
|---|----------------|
| P01 | Strict schema validation (reject unknown keys) |
| P02 | Deterministic canonical copy |
| P03 | `SHADOW_PACKAGE_READY` only when all gates hold |
| P04 | Complexity tier missing/unapproved → `NOT_EVALUABLE` (no inference) |
| P05 | Count mismatch → `BLOCKED_BY_COUNT_VALIDATION` with **zero** composition mutation |
| P06 | Oral count 1 or 2 rejected |
| P07 | Tablet/external never counted as oral mixtures |
| P08 | OD-014 path → `INSUFFICIENT_CLINICAL_EVIDENCE` + `DOCTOR_REVIEW_REQUIRED` |
| P09 | Required Rule 6/7/8 data `0` → fail-closed; no Rx; no fallback medicine |
| P10 | Upstream `NOT_APPLICABLE` ≠ missing evidence |
| P11 | Upstream contradiction → `BLOCKED_BY_UPSTREAM_CONTRADICTION` (no invented reconciliation) |
| P12 | No new medicine selection / ranking / filler fields in output |
| P13 | Rules 1–8 non-override (temperament/polarity/systems/potency/monitoring/R6 composition/R7 meaning/R8 prakriti) |
| P14 | Input non-mutation |
| P15 | Deep-freeze output |
| P16 | Exact key order |
| P17 | Code-only errors; no PHI / protected-path / raw stack leakage |
| P18 | Outcome / error vocabulary closed-set; `clinicalActivation`/`prescriptionEffect` always `NONE` |

Do **not** execute these tests in this documentation tranche.

---

## 10. Explicit STOP

Under **`R9_MASTER_PIPELINE_CANONICAL_CONTRACT_DOCUMENTATION_AUTHORIZED`**:

- Do **not** implement Rule 9 code or create `packages/rule9`
- Do **not** connect Phase 5C/Python orchestration or production runtime
- Do **not** invent complexity criteria or a complexity classifier
- Do **not** invent or commit real clinical data / mappings / formulas / medicines
- Do **not** select, remove, reorder, or fill medicines
- Do **not** activate clinical selection or change production prescription output
- Do **not** override Rules 1–8
- Do **not** resume Rule 5 C3E or alter SAC
- Do **not** access protected sources, hashes, or manifests
- Do **not** mutate legacy
- Do **not** use paid APIs / services / certificates
- Do **not** deploy

**Separate authorizations required:** shadow implementation; complexity-classifier contract; validated clinical evidence for upstream Rules as needed; independent clinical review of concrete packaging semantics beyond this lock; orchestration connection; production activation.

---

## 11. Delivery token (documentation tranche)

When this documentation Draft PR is delivered for independent review:

`R9_MASTER_PIPELINE_CANONICAL_CONTRACT_DOCUMENTATION_DELIVERED_FOR_REVIEW`
