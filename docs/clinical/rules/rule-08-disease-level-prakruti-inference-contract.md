# Rule 8 — Disease-level Prakruti Inference (Canonical Contract)

| Field | Value |
|-------|--------|
| **Rule number** | 8 |
| **Canonical identity token** | `DISEASE_LEVEL_PRAKRUTI_INFERENCE` |
| **Display title** | Disease-level Prakruti Inference |
| **Document class** | OWNER_LOCKED canonical contract |
| **Authority tokens** | `R8_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED` · `R8_DISEASE_LEVEL_PRAKRUTI_CANONICAL_CONTRACT_DOCUMENTATION_AUTHORIZED` |
| **Contract version** | `ehas2-rule8-contract-v1` |
| **Implementation (current)** | `RULE8_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE8_IMPLEMENTATION_NOT_AUTHORIZED` |
| **Runtime** | `RULE8_ORCHESTRATION_NOT_CONNECTED` · `RULE8_CLINICAL_ACTIVATION_NONE` · `RULE8_MEDICINE_SELECTION_INFLUENCE_NONE` |
| **Prescription posture** | `RULE8_NOT_REQUIRED_FOR_PRESCRIPTION` · `RULE8_PRODUCTION_RX_UNCHANGED` |
| **Real approved disease→prakriti mappings** | **`0`** |
| **Paid services** | `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` |
| **Rule 5 C3E** | `RULE8_INDEPENDENT_OF_RULE5_C3E` (C3E remains paused separately) |
| **Owner governance** | `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED` |
| **Canonical `origin/main` base (at documentation start)** | `b2d03c4632b5e0b18cd595bb54b474bbbb9e461d` |

**Status tokens (current):**

- `RULE8_IDENTITY_OWNER_LOCKED`
- `RULE8_SCOPE_OWNER_LOCKED`
- `RULE8_CANONICAL_CONTRACT_DOCUMENTED`
- `RULE8_SHADOW_EVALUATOR_NOT_IMPLEMENTED`
- `RULE8_IMPLEMENTATION_NOT_AUTHORIZED`
- `RULE8_ORCHESTRATION_NOT_CONNECTED`
- `RULE8_CLINICAL_ACTIVATION_NONE`
- `RULE8_MEDICINE_SELECTION_INFLUENCE_NONE`
- `RULE8_NOT_REQUIRED_FOR_PRESCRIPTION`
- `RULE8_PRODUCTION_RX_UNCHANGED`
- `RULE8_REAL_APPROVED_DISEASE_PRAKRUTI_MAPPINGS_0`
- `RULE8_CLINICAL_EVIDENCE_PENDING`
- `RULE8_NO_MEDICINE_FORMULA_OR_TREATMENT_AUTHORITY`
- `RULE8_SEPARATE_FROM_RULE1`
- `RULE8_INDEPENDENT_OF_RULE5_C3E`
- `RULE8_INDEPENDENT_OF_RULE6_RELATIONSHIP_DATA`
- `RULE8_INDEPENDENT_OF_RULE7_ROUTE_MAPPINGS`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`

**Historical (superseded for current identity readiness):** Stage A `IDENTITY_CANDIDATE_ONLY` for Rule 8 — retained only as pre-owner-decision history. Phase 5C readiness docs remain historical recommendations until this contract.

This document is the authoritative EHAS2 Rule 8 **contract**. It does **not** create `packages/rule8`, implement an evaluator, invent disease→prakriti mappings, connect orchestration, activate clinical selection, influence medicine selection, or change production prescription output.

---

## 0. Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

Explicit owner approval is required before adding or changing: disease→prakriti mapping; Electrohomeopathy clinical meaning of any prakriti category; Rule 1 ↔ Rule 8 contradiction reconciliation policy beyond fail-closed STOP; medicine-selection influence; formula, potency, dosage or electricity; Tablet A/B, external application or monitoring; clinical activation or prescription effect.

Within this locked contract, technical engineering may design schemas/types, deterministic evaluation, validation, immutable outputs, fixed error handling, security/privacy controls, and tests that preserve clinical meaning. Cost/paid services, security-policy change, protected-data access, production/runtime connection, external deploy, and legacy modification still require owner approval.

Unresolved clinical decision → **STOP** and ask owner.

Canonical cross-rule pointer: [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md).

---

## 1. Locked owner decisions (R8-ID-01 … R8-ID-05)

| Decision ID | Owner disposition | Normative effect |
|-------------|-------------------|------------------|
| **R8-ID-01** | **`ACCEPT_DISEASE_LEVEL_PRAKRUTI_INFERENCE`** | Canonical name **Disease-level Prakruti Inference**; identity token **`DISEASE_LEVEL_PRAKRUTI_INFERENCE`**. Locks identity only — **does not** clinically approve any disease→prakriti mapping. |
| **R8-ID-02** | **`KEEP_DISEASE_LEVEL_PRAKRUTI_SEPARATE_FROM_RULE1`** | Rule 8 owns **disease-level** prakriti inference only. Rule 1 remains authoritative for patient/case/symptom temperament. Rule 8 must not redefine Rule 1, overwrite Rule 1 output, silently merge outputs, or hide disagreement behind a positive result. Rule 1 ↔ Rule 8 contradiction → **fail-closed** until a separate owner-approved reconciliation contract exists. |
| **R8-ID-03** | **`SHADOW_ONLY_NOT_REQUIRED_FOR_PRESCRIPTION`** | First form is shadow-only contract → (later) evaluator + tests. Until separate owner authorization: medicine-selection influence **`NONE`**; prescription effect **`NONE`**; clinical activation **`NONE`**; orchestration **`NOT_CONNECTED`**; Phase 5D posture **`NOT_REQUIRED_FOR_PRESCRIPTION`**. Shadow output must not boost, demote, select, reject, or prescribe any medicine. |
| **R8-ID-04** | **`FAIL_CLOSED_VALIDATED_AND_OWNER_APPROVED_EVIDENCE_REQUIRED`** | Any positive disease-level prakriti indication requires **validated** clinical evidence **and** recorded explicit owner clinical approval (conjunctive). Legacy inference, inventory/audit prose, agent text, AI suggestion, synthetic fixture, interface metadata, unvalidated docs, schema-valid-only data, owner mention without recorded approval, and validation without owner approval are **not** clinical authority alone. Missing/stale/disputed/superseded/contradictory/owner-unapproved evidence → fail-closed. Current real approved mappings: **`0`**. |
| **R8-ID-05** | **`NO_MEDICINE_FORMULA_OR_TREATMENT_AUTHORITY`** | Rule 8 does **not** own medicine selection/ranking/boosting/rejection; relationships; formula; potency; dosage; electricity; Tablet A/B; external applications; monitoring/follow-up; mixture count; final prescription approval; or Rule 9 packaging. Future output is shadow disease-level prakriti information only — not a treatment instruction or prescription. |

---

## 2. Provenance

| Source | Role |
|--------|------|
| EH_9 / Phase 5A nine-rule vocabulary | Name and number |
| Owner decisions R8-ID-01–R8-ID-05 | Identity and scope lock |
| Rule 1 temperament freeze | Separate authoritative case/symptom temperament owner |
| Legacy `infer_disease_prakruti` / `resolve_prakriti` | **LEGACY_REFERENCE_ONLY** — not EHAS2 clinical authority |
| Phase 5C Rule 8 readiness docs | Historical recommendations only |

---

## 3. Scope and non-goals

### 3.1 In scope (this contract)

- Deterministic **shadow** evaluation of disease-level prakriti **indication** eligibility under owner-approved evidence gates
- Emission of `NOT_CLINICALLY_INDICATED` when evidence does not support a positive indication
- Fail-closed handling of missing, stale, contradictory, unvalidated, or owner-unapproved evidence
- Fail-closed handling of Rule 1 ↔ Rule 8 contradiction **without** silent merge or overwrite
- Explicit prohibition of medicine/prescription influence

### 3.2 Out of scope (this stage)

- Inventing or committing real disease→prakriti mappings (count remains **0**)
- Defining Electrohomeopathy clinical meaning of prakriti categories beyond owner-approved evidence references
- Rule 1 redefinition, overwrite, or silent merge
- Medicine selection, ranking, boosting, rejection, or relationships
- Formula, potency, dosage, electricity, Tablet A/B, external applications, monitoring, mixture count, Rule 9 packaging
- Orchestration / runtime / production Rx effect

Rule 8 must **not** silently absorb out-of-scope capabilities.

---

## 4. Rule 1 separation and contradiction handling

| Rule | Authority |
|------|-----------|
| **Rule 1** | Patient/case/symptom temperament (authoritative) |
| **Rule 8** | Disease-level prakriti inference only (shadow under this contract) |

Mandatory behaviors:

1. Rule 8 output is a **separate** envelope; it is not a Rule 1 replacement.
2. Presence of Rule 1 output does **not** auto-activate Rule 8.
3. Presence of Rule 8 shadow output does **not** alter Rule 1.
4. If both envelopes are present and conflict under an owner-defined comparison policy later, the evaluator must **fail-closed** (`BLOCKED_BY_RULE1_CONTRADICTION` or `UNRESOLVED_EVIDENCE`) rather than invent a merged positive clinical conclusion.
5. No owner-approved reconciliation contract exists yet — engineering must not invent reconciliation weights, priorities, or clinical tie-breaks.

---

## 5. Input vocabulary (`ehas2-rule8-input-v1`)

Plain-data, versioned schema. Identifiers are canonical references. **No PHI**. **No** protected clinical source paths. **No** direct database access as clinical authority.

### 5.1 Required top-level keys (deterministic order)

1. `contractVersion` — must equal `ehas2-rule8-input-v1` (or a later owner-approved version supported by the evaluator)
2. `requestId` — non-PHI synthetic evaluation / request identifier
3. `diseaseConditionRefs` — disease / condition canonical IDs only (no free-text clinical narrative authority)
4. `rule1TemperamentRef` — reference to Rule 1 result envelope (identity + version + status) **or** explicit `{ "status": "UNAVAILABLE" }`
5. `prakritiEvidenceRegistry` — evidence registry for disease-level prakriti indication (may contain **zero** activating entries)
6. `evidenceDataVersions` — version stamps for evidence corpora used
7. `upstreamApplicability` — upstream applicability envelope (applicable / not applicable / not evaluable)

### 5.2 Input prohibitions

- Medicine IDs, formula objects, potency/dosage/electricity/Tablet/external/monitoring payloads as authority
- Rule 6 relationship edges or Rule 7 route indications as automatic prakriti authority
- Legacy engine structures as clinical authority
- PHI, protected paths, hashes, manifests
- Thresholds / weights invented by engineering
- Free invention of disease→prakriti maps inside the request

---

## 6. Output vocabulary (`ehas2-rule8-output-v1`)

Shadow-only deterministic result. Deep-frozen after construction. Key order fixed.

### 6.1 Required top-level keys (deterministic order)

1. `contractVersion`
2. `ruleNumber` — always `8`
3. `ruleIdentity` — always `DISEASE_LEVEL_PRAKRUTI_INFERENCE`
4. `requestId`
5. `status` — closed clinical outcome (§6.3)
6. `applicability`
7. `evaluatedDiseaseRefs`
8. `prakritiIndications` — list of disease-level prakriti indication records (empty allowed)
9. `notClinicallyIndicated` — boolean **or** structured reason block when status is `NOT_CLINICALLY_INDICATED`
10. `rule1ComparisonState` — closed comparison posture (`NOT_COMPARED` \| `UNAVAILABLE` \| `CONSISTENT` \| `CONFLICT` \| `UNRESOLVED`) without inventing merged clinical meaning
11. `evidenceRefs`
12. `reasonCodes`
13. `blockersOrUnresolvedEvidence`
14. `deterministicFingerprint`
15. `shadowOnly` — always `true` under this contract
16. `clinicalActivation` — always `NONE`
17. `medicineSelectionInfluence` — always `NONE`
18. `notRequiredForPrescription` — always `true` under this contract stage

### 6.2 Prakriti indication record (when present; non-medicine)

Fields (key order):

1. `indicationId`
2. `diseaseConditionRef`
3. `prakritiCategoryRef` — canonical category reference ID only (no prose clinical essay; no medicine ID)
4. `eligibilityState` — `ELIGIBLE` \| `REJECTED` \| `UNRESOLVED` \| `EVIDENCE_INSUFFICIENT`
5. `evidenceRefs`
6. `reasonCodes`

**Must not** include medicine IDs, formula IDs, ranking scores, boost/demote deltas, potency, dosage, electricity, Tablet A/B, external routes, or treatment instructions under this contract stage.

### 6.3 Closed clinical outcomes

1. `NOT_APPLICABLE`
2. `NOT_EVALUABLE`
3. `NOT_CLINICALLY_INDICATED`
4. `SHADOW_PRAKRUTI_INDICATIONS_PROPOSED`
5. `BLOCKED_BY_RULE1_CONTRADICTION`
6. `UNRESOLVED_EVIDENCE`

### 6.4 Fixed implementation / configuration errors

`message === failureCode`:

1. `INVALID_INPUT`
2. `INVALID_EVIDENCE_REGISTRY`
3. `UNSUPPORTED_CONTRACT_VERSION`
4. `CONTRADICTORY_UPSTREAM_STATE`
5. `INTERNAL_FAILURE`

---

## 7. Fail-closed evidence requirements

A disease-level prakriti indication may be proposed as **ELIGIBLE** in shadow output **only if all** are true:

1. Present in `prakritiEvidenceRegistry` with required provenance fields
2. Evidence validation status = validated under owner-approved criteria
3. Owner clinical approval status = explicitly approved for that evidence version
4. Effective status = approved-and-active (or equivalent active token defined at later data-auth time)
5. Not draft / inventory-only / queued / disputed / stale / superseded / missing-evidence / owner-unapproved
6. Not derived from legacy inference alone, inventory prose, agent/AI text, synthetic fixture alone, interface metadata, or schema PASS alone
7. Not used to overwrite Rule 1 or hide a Rule 1 conflict

Otherwise: fail-closed → `NOT_CLINICALLY_INDICATED`, `NOT_EVALUABLE`, `UNRESOLVED_EVIDENCE`, or `BLOCKED_BY_RULE1_CONTRADICTION` as appropriate — **no** positive eligible indication.

### 7.1 Non-activating evidence sources (never authority alone)

- Legacy `infer_disease_prakruti` / `resolve_prakriti` / old-project disease votes
- Medicine inventory / R5-M6B audits
- Rule 6 relationship edges / Rule 7 route indications
- Synthetic CI fixtures
- Agent-generated suggestions
- Unvalidated documentation prose
- File presence, CI PASS, or schema PASS alone

### 7.2 Current clinical data posture

**Real approved disease→prakriti mappings: `0`.** Production evidence registry remains empty of activating clinical rows until separately authorized validated + owner-approved evidence exists.

---

## 8. Determinism and immutability (future implementation)

When separately authorized to implement:

- Deep-copy validated input; do not mutate caller input
- Deterministic key order and lexicographic sorting of lists
- Deep-freeze output
- No arbitrary clinical tie-break; unresolved evidence or Rule 1 conflict → non-success outcome
- Code-only fixed errors (no PHI / protected paths / medicine dumps)

---

## 9. Future implementation plan (not authorized now)

### 9.1 Suggested package allowlist (unauthorized until separate auth)

- `packages/rule8/package.json`
- `packages/rule8/tsconfig.json`
- `packages/rule8/src/**/*.ts`
- `packages/rule8/tests/**/*.test.ts`

Mechanical root registration (typecheck / Vitest / lockfile) **only** if monorepo convention requires it under that separate implementation authorization.

Do **not** connect orchestration or production in the first implementation auth without explicit extension.

### 9.2 Mandatory future proof matrix

Mechanical count: **16**

| # | Proof category |
|---|----------------|
| P01 | Strict schema validation |
| P02 | Deterministic canonical copy |
| P03 | Positive prakriti indication only with approved active evidence |
| P04 | Unvalidated / inventory evidence → non-activating |
| P05 | Missing evidence → `NOT_EVALUABLE` or `NOT_CLINICALLY_INDICATED` |
| P06 | Contradictory evidence fail-closed |
| P07 | Rule 1 separation — no overwrite / no silent merge |
| P08 | Rule 1 conflict → fail-closed (no hidden positive) |
| P09 | No medicine / formula / treatment fields in output |
| P10 | `NOT_CLINICALLY_INDICATED` valid empty success-path outcome |
| P11 | Input non-mutation |
| P12 | Deep-freeze output |
| P13 | Exact key order |
| P14 | Code-only errors |
| P15 | No PHI / protected-path leakage |
| P16 | Outcome / error vocabulary closed-set enforcement |

Do **not** execute these tests in this documentation tranche.

---

## 10. Explicit STOP

Under **`R8_DISEASE_LEVEL_PRAKRUTI_CANONICAL_CONTRACT_DOCUMENTATION_AUTHORIZED`**:

- Do **not** implement Rule 8 code or create `packages/rule8`
- Do **not** invent or commit real disease→prakriti mappings (count remains **0**)
- Do **not** invent prakriti-category clinical meanings, thresholds, or weights
- Do **not** connect orchestration / runtime or activate clinical selection
- Do **not** grant medicine-selection influence or alter production prescription
- Do **not** redefine, overwrite, or silently merge Rule 1
- Do **not** resume Rule 5 C3E, change Smart App Control, access protected sources, or create hashes/manifests
- Do **not** modify the legacy repository
- Do **not** use paid APIs / services / certificates
- Do **not** deploy

**Separate authorizations required:** shadow implementation; validated disease→prakriti evidence data; Rule 1 reconciliation contract (if ever); independent clinical review; orchestration connection; production activation.
