# Rule 1 — Temperament Engine (Canonical Contract)

| Field | Value |
|-------|--------|
| **Rule number** | 1 |
| **Canonical identity token** | `TEMPERAMENT_ENGINE` |
| **Display title** | Temperament Engine |
| **Document class** | OWNER_LOCKED canonical contract |
| **Authority tokens** | `R1_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED` · `R1_TEMPERAMENT_ENGINE_CANONICAL_CONTRACT_DOCUMENTATION_AUTHORIZED` |
| **Contract version** | `ehas2-rule1-contract-v1` |
| **Input contract version** | `ehas2-rule1-input-v1` |
| **Output contract version** | `ehas2-rule1-output-v1` |
| **Implementation (current)** | `RULE1_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE1_IMPLEMENTATION_NOT_AUTHORIZED` |
| **Package** | `packages/rule1` **absent** · `@ehas2/rule1` **absent** |
| **Runtime** | `RULE1_ORCHESTRATION_NOT_CONNECTED` · `RULE1_CLINICAL_ACTIVATION_NONE` · `RULE1_MEDICINE_SELECTION_INFLUENCE_NONE` · `RULE1_PRODUCTION_RX_UNCHANGED` |
| **Real validated symptom/case→temperament mappings** | **`0`** |
| **Evidence catalog** | `RULE1_EVIDENCE_CATALOG_NOT_CREATED` |
| **Evidence registry posture** | `RULE1_EMPTY_REGISTRY_FAIL_CLOSED` |
| **Paid services** | `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` |
| **Rule 5 C3E** | `RULE1_INDEPENDENT_OF_RULE5_C3E` (C3E remains `C3E_NOT_AUTHORIZED` separately) |
| **Owner governance** | `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED` |
| **Canonical `origin/main` base (documentation tranche)** | `a89202c3e5d1042a0e06f240408ae4c1ce1f4159` |
| **Companion frozen clinical specification** | [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) (historical body preserved; Q3G-TIE normative for future implementation) |
| **Companion owner decisions** | [rule-01-owner-decisions.md](./rule-01-owner-decisions.md) · [rule-01-q3-evidence-workflow-owner-decisions.md](./rule-01-q3-evidence-workflow-owner-decisions.md) · [rule-01-blood-lymph-owner-decisions.md](./rule-01-blood-lymph-owner-decisions.md) |
| **Rule 8 separation authority** | [rule-08-disease-level-prakruti-inference-contract.md](./rule-08-disease-level-prakruti-inference-contract.md) (`R8-ID-02`) |

**Status tokens (current):**

- `RULE1_IDENTITY_TEMPERAMENT_ENGINE`
- `RULE1_IDENTITY_OWNER_LOCKED`
- `RULE1_SCOPE_OWNER_LOCKED`
- `RULE1_CANONICAL_CONTRACT_DOCUMENTED`
- `RULE1_SHADOW_EVALUATOR_NOT_IMPLEMENTED`
- `RULE1_IMPLEMENTATION_NOT_AUTHORIZED`
- `RULE1_REAL_VALIDATED_MAPPINGS_0`
- `RULE1_EVIDENCE_CATALOG_NOT_CREATED`
- `RULE1_EMPTY_REGISTRY_FAIL_CLOSED`
- `RULE1_RULE8_SEPARATION_LOCKED`
- `RULE1_MEDICINE_SELECTION_INFLUENCE_NONE`
- `RULE1_ORCHESTRATION_NOT_CONNECTED`
- `RULE1_CLINICAL_ACTIVATION_NONE`
- `RULE1_PRODUCTION_RX_UNCHANGED`
- `RULE1_Q3G_TIE_NORMATIVE`
- `RULE1_INDEPENDENT_OF_RULE5_C3E`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`

**Historical / interface alias (superseded for current identity readiness):** Phase 5B / EH_9 interface display **“Temperament (Prakriti)”** in `nineRules.ts` and nine-rule interface status remains identifiable as a **historical alias** only. Current owner-locked display name is **Temperament Engine**; machine identity is **`TEMPERAMENT_ENGINE`**. Do not treat the alias as a competing canonical token.

**Historical (preserved, superseded for future equal-tie implementation):** Interactive follow-up / MIXED-as-tie-fallback prose in the frozen clinical body of [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) remains **preserved in place**. Future implementation is governed by **Q3G-TIE** (`R1-ID-05`): exact remaining tie → **`UNRESOLVED_TIE`**; no question bank; `MIXED` only when genuinely evidence-supported.

This document is the authoritative EHAS2 Rule 1 **focused canonical contract** for a future separately authorized shadow evaluator. It does **not** create `packages/rule1`, invent symptom→temperament mappings, connect orchestration, activate clinical selection, grant medicine-selection influence, or change production prescription output.

---

## 0. Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

### Owner clinical authority (explicit owner approval required)

- Temperament vocabulary and clinical meanings
- Evidence classes and symptom/case→temperament relationships
- Exact-tie clinical meaning (`UNRESOLVED_TIE`) and no-question-bank workflow
- BP clinical support meaning and frozen supporting weights
- Photo clinical support meaning (supporting only)
- Blood/Lymph clinical relationships (Q2/Q3 governance)
- Future downstream evidence influence (historical impact-matrix “YES” surfaces)
- Rule 1 ↔ Rule 8 reconciliation beyond fail-closed STOP
- Clinical activation, orchestration connection, production Rx effect

### Delegated technical engineering (within this locked contract)

- TypeScript schemas/types
- Validation, deterministic ordering, fail-closed mechanics
- Immutability, error normalization
- Synthetic fixtures (tests only, after separate implementation authorization)
- Tests/CI and package organization **after** separate implementation authorization

Engineering **must not** invent clinical mappings, thresholds, keywords, medicine shortcuts, or reconciliation weights.

Unresolved clinical decision → **STOP** and ask owner.

Canonical cross-rule pointer: [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md).

---

## 1. Canonical identity and current status

| Field | Locked value |
|-------|----------------|
| Rule number | `1` |
| Display name | Temperament Engine |
| Machine identity | `TEMPERAMENT_ENGINE` |
| Identity status | `RULE1_IDENTITY_OWNER_LOCKED` |
| Contract status | `RULE1_CANONICAL_CONTRACT_DOCUMENTED` |
| Evaluator | `RULE1_SHADOW_EVALUATOR_NOT_IMPLEMENTED` |
| Implementation authorization | `RULE1_IMPLEMENTATION_NOT_AUTHORIZED` |
| Package | absent |
| Orchestration | `NOT_CONNECTED` |
| Clinical activation | `NONE` |
| Medicine-selection influence | `NONE` |
| Production Rx effect | `NONE` / unchanged |
| Real validated mappings | **`0`** |
| Evidence catalog | `NOT_CREATED` |
| Registry | empty / fail-closed |

---

## 2. Locked owner decisions (R1-ID-01 … R1-ID-05)

| Decision ID | Owner disposition | Normative effect | Exclusions / does not authorize | Safety consequence |
|-------------|-------------------|------------------|----------------------------------|--------------------|
| **R1-ID-01** | **`ACCEPT_TEMPERAMENT_ENGINE_TOKEN`** | Locks machine identity **`TEMPERAMENT_ENGINE`** and display name **Temperament Engine**. Combined token: `R1_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`. | Does **not** approve mappings, package, orch, or Rx. | Prevents competing identity tokens. |
| **R1-ID-02** | **`AFFIRM_CASE_TEMPERAMENT_SCOPE`** | Rule 1 owns **patient/case/symptom-level** Electro-Homeopathy temperament only. Rule 8 owns **disease-level** prakriti only. | Does **not** redefine Rule 8; does **not** authorize reconciliation. | Prevents silent merge with disease-level prakriti. |
| **R1-ID-03** | **`SHADOW_MEDICINE_INFLUENCE_NONE`** | First shadow form: medicine-selection influence **`NONE`**; clinical activation **`NONE`**; orchestration **`NOT_CONNECTED`**; prescription/Rx effect **`NONE`**. Historical impact-matrix “YES” = **future** downstream evidence influence only (separate owner tranche). | Does **not** cancel forever the future clinical impact matrix; does **not** authorize ranking/boost/demote now. | Prevents selection creep in first technical shadow. |
| **R1-ID-04** | **`EMPTY_REGISTRY_FAIL_CLOSED`** | Production/real evidence registry remains **immutable empty**; active validated mappings **`0`**. No invented keyword maps. Positive real mapping requires conjunctive gates (§6). | Does **not** create catalog or edges; does **not** import legacy `PRAKRITI_KEYWORDS` as authority. | Fail-closed when evidence absent/unapproved. |
| **R1-ID-05** | **`ENCODE_Q3G_TIE_NORMATIVE`** | Future implementation: exact remaining equal tie → **`UNRESOLVED_TIE`**; **no** interactive question bank; **`MIXED`** only when genuinely evidence-supported — **never** as tie fallback. Historical freeze body preserved. | Does **not** invent tie-break questions or default temperament. | Aligns contract with Q3G-TIE; blocks dictionary/first-key defaults. |

---

## 3. Responsibility boundary

| Concern | Ownership |
|---------|-----------|
| Patient/case/symptom EH temperament evaluation | **Rule 1** |
| Separate EH temperament output tokens | **Rule 1** |
| Separately typed Tridosha / `dosha_mapping` fields (already frozen) | **Rule 1** (presentation/mapping fields — not merged `prakriti` string) |
| Evidence gaps / resolution posture | **Rule 1** |
| Disease-level prakriti | **Rule 8** |
| Polarity | **Rule 2** |
| Organ/system affinity | **Rule 3** |
| Direct medicine selection / relationships | **Rule 6** / downstream (not Rule 1) |
| Potency | **Rule 4** |
| Monitoring / follow-up | **Rule 5** |
| External routes | **Rule 7** |
| Complexity / mixture count / packaging | **Rule 9** |
| Dosage | **`DOSAGE_ENGINE_AUDIT_PENDING`** (unnumbered) |
| Electricity | Sibling track (not Rule 1) |
| Tablet A/B | Unnumbered tablet track |
| Production prescription | Prescription engine (**NOT_CONNECTED**) |

Rule 1 must **not** silently absorb out-of-scope capabilities.

---

## 4. Rule 1 versus Rule 8 separation

| Rule | Authority |
|------|-----------|
| **Rule 1** | Patient/case/symptom temperament (authoritative under this contract) |
| **Rule 8** | Disease-level prakriti inference only |

Mandatory behaviors:

1. Outputs are **separate typed envelopes** — Rule 1 is not a Rule 8 replacement and Rule 8 is not a Rule 1 replacement.
2. **No** overwrite, silent merge, averaging, shared weights, or fallback copy between Rule 1 and Rule 8.
3. Rule 1 must **not** infer temperament from Rule 8 disease-level output.
4. Rule 1 shadow evaluation **need not** consume Rule 8; `rule8ComparisonRef` may be `NOT_SUPPLIED`.
5. If a Rule 8 comparison reference is **supplied** and reports `CONFLICT`, Rule 1 must **fail-closed** (`BLOCKED_BY_RULE8_CONTRADICTION` or `UNRESOLVED_EVIDENCE`) rather than invent a merged positive conclusion.
6. Agreement may be recorded only as comparison posture (`CONSISTENT`) — **not** as merged clinical meaning.
7. **Neither** Rule owns reconciliation until a separate owner-approved reconciliation contract exists.

Token: `RULE1_RULE8_SEPARATION_LOCKED` (aligned with Rule 8 `RULE8_RULE1_SEPARATION_PRESERVED`).

---

## 5. Clinical vocabulary

### 5.1 EH Temperament tokens (owner-locked; exact)

1. `LYMPHATIC`
2. `SANGUINE`
3. `BILIOUS_HEPATIC`
4. `NERVOUS`
5. `MIXED`
6. `UNKNOWN`

Do **not** invent synonyms. Do **not** merge this vocabulary with Rule 8 disease-level prakriti categories.

### 5.2 Resolution / tie tokens (Q3G-TIE normative)

- Exact remaining equal tie → resolution state **`UNRESOLVED_TIE`** (not a sixth “default” temperament winner; not interactive follow-up).
- `MIXED` only when multi-temperament support is **genuinely evidence-backed** — never as unresolved-tie fallback.
- Insufficient evidence → `UNKNOWN` with additional-information-required posture.

### 5.3 EH Temperament vs Tridosha

- Separate typed fields (`dosha_mapping` / `dosha_classification` as frozen in the clinical specification).
- Do **not** collapse into one ambiguous `prakriti` string.
- Bilious secondary-dosha (VATA vs KAPHA vs UNRESOLVED) remains **OWNER-CLARIFICATION-PENDING** → fail-closed / unresolved secondary — **do not guess**.

---

## 6. Evidence authority and empty registry

### 6.1 Evidence lifecycle classes (non-activating by default)

1. `INVENTORY`
2. `SUBMITTED`
3. `UNDER_REVIEW`
4. `TECHNICALLY_SCHEMA_VALID`
5. `EVIDENCE_VALIDATED`
6. `OWNER_APPROVED`
7. `APPROVED_AND_ACTIVE`
8. `STALE`
9. `DISPUTED`
10. `SUPERSEDED`
11. `SYNTHETIC_TEST_ONLY`

### 6.2 Conjunctive gates for a positive **real** mapping

All of the following must hold:

1. Approved source / provenance
2. Evidence validation under owner-approved criteria
3. Explicit owner clinical approval for that evidence version
4. Lifecycle = `APPROVED_AND_ACTIVE` (or equivalent active token at later data-auth time)
5. Supported contract/version
6. No contradiction / staleness / dispute / supersession

Otherwise: **fail-closed** — no positive real indication.

### 6.3 Current production / real registry

- Immutable
- Empty of activating clinical rows
- Active validated mapping count **`0`**
- Evidence catalog **`NOT_CREATED`**

### 6.4 Synthetic fixtures

- Allowed **only** in tests after **separate** implementation authorization
- Must be clearly labelled `SYNTHETIC_TEST_ONLY`
- Never auto-promotable to clinical evidence
- Never clinical authority alone

This documentation tranche creates **no** symptom keywords and **no** mapping rows.

---

## 7. Frozen clinical evidence rules (mirror only; no expansion)

Authority: [rule-01-temperament-engine.md](./rule-01-temperament-engine.md), [rule-01-owner-decisions.md](./rule-01-owner-decisions.md), Q3G / Q3G-TIE.

1. No sufficient evidence → `UNKNOWN` + additional-information-required posture.
2. **No** default `LYMPHATIC`.
3. **No** automatic `MIXED` for empty / missing evidence.
4. **No** “balanced” silent fallback.
5. Exact remaining equal tie → **`UNRESOLVED_TIE`** (Q3G-TIE normative; no interactive question bank).
6. Doctor-supplied available evidence only; system does not invent missing symptoms.
7. BP supporting only (frozen weights — **do not add thresholds**):
   - Systolic ≥ 140 → SANGUINE supporting **+3**
   - Systolic < 100 → LYMPHATIC supporting **+2**
   - BP alone **cannot** resolve; ≥1 separate approved non-BP evidence item required before resolved temperament
8. Photo = supporting observation only; never sole authority; no skin-colour / ordinary-face automatic authority; no image bytes in contract input.
9. Q2 Blood/Lymph governance must **not** become a medicine shortcut.
10. Evidence gaps remain explicit and fail-closed.

---

## 8. Input contract (`ehas2-rule1-input-v1`)

Plain-data, versioned schema. Identifiers are canonical / synthetic. **No PHI**. **No** protected clinical source paths. **No** raw image bytes. **No** medicine/formula/potency/dosage fields. **No** legacy object passthrough as clinical authority.

### 8.1 Required top-level keys (deterministic order) — **exactly 10**

1. `contractVersion` — must equal `ehas2-rule1-input-v1` (or a later owner-approved version supported by a future evaluator)
2. `requestId` — non-PHI synthetic evaluation / request identifier
3. `caseTemperamentEvidenceRegistry` — case/symptom temperament evidence registry (may contain **zero** activating entries; production empty)
4. `doctorSuppliedEvidenceItems` — ordered list of doctor-supplied evidence item refs (may be empty)
5. `bloodPressureEvidence` — structured BP support object **or** explicit `{ "status": "NOT_SUPPLIED" }` (supporting only; never sole resolve)
6. `photoEvidenceRef` — non-diagnostic photo **metadata/reference** object **or** `{ "status": "NOT_SUPPLIED" }` (never image bytes; never protected paths)
7. `bloodLymphAxisContext` — Blood/Lymph axis context refs under Q2/Q3 governance **or** `{ "status": "NOT_SUPPLIED" }` (no medicine shortcut)
8. `rule8ComparisonRef` — optional comparison envelope: `{ "status": "NOT_SUPPLIED" }` \| `{ "status": "UNAVAILABLE" }` \| `{ "status": "CONSISTENT" }` \| `{ "status": "CONFLICT" }` \| `{ "status": "UNRESOLVED" }` (with allowed non-PHI identity/version fields when supplied). Rule 1 evaluation **does not require** Rule 8; default safe posture is `NOT_SUPPLIED`
9. `evidenceDataVersions` — version stamps for evidence corpora / governance surfaces used
10. `upstreamApplicability` — upstream applicability envelope (`APPLICABLE` \| `NOT_APPLICABLE` \| `NOT_EVALUABLE`)

**Exact ordered top-level key count: 10.**

Strict schema validation **rejects unknown top-level keys** (and unknown keys inside locked nested objects). Extra keys → `INVALID_INPUT`.

### 8.2 Input prohibitions

- Medicine IDs, formula objects, potency/dosage/electricity/Tablet/external/monitoring payloads
- Rule 6 relationship edges or Rule 7 route indications as temperament authority
- Legacy `detect_prakriti` / `PRAKRITI_KEYWORDS` structures as clinical authority
- PHI, protected paths, hashes, manifests, raw image bytes
- Invented symptom→temperament maps inside the request
- Free-text clinical narrative as sole authority without approved evidence classes (future catalogs)

---

## 9. Output contract (`ehas2-rule1-output-v1`)

Shadow-only deterministic result. Deep-frozen after construction. Key order fixed.

### 9.1 Required top-level keys (deterministic order) — **exactly 20**

1. `contractVersion`
2. `ruleNumber` — always `1`
3. `ruleIdentity` — always `TEMPERAMENT_ENGINE`
4. `requestId`
5. `status` — closed clinical outcome (§10)
6. `applicability`
7. `primaryTemperament` — EH temperament token **or** `null` when non-success / unresolved tie path requires null primary
8. `secondaryTemperament` — EH temperament token **or** `null`
9. `mixedComponents` — ordered list of temperament tokens (empty allowed)
10. `resolutionState` — closed resolution posture including `OK` \| `ADDITIONAL_INFORMATION_REQUIRED` \| `UNRESOLVED_TIE` \| `FOLLOW_UP_NOT_USED` \| `NOT_EVALUABLE` \| `UNRESOLVED_EVIDENCE` (exact closed set enforced at implementation; must encode Q3G-TIE)
11. `doshaMapping` — separate Tridosha mapping object **or** `null` (never a merged ambiguous `prakriti` string)
12. `evidenceGaps` — structured gaps (not interactive questions)
13. `reasonCodes`
14. `blockersOrUnresolvedEvidence`
15. `rule8ComparisonState` — `NOT_SUPPLIED` \| `UNAVAILABLE` \| `NOT_COMPARED` \| `CONSISTENT` \| `CONFLICT` \| `UNRESOLVED`
16. `deterministicFingerprint`
17. `shadowOnly` — always `true`
18. `clinicalActivation` — always `NONE`
19. `medicineSelectionInfluence` — always `NONE`
20. `prescriptionEffect` — always `NONE`

**Exact ordered top-level key count: 20.**

Additional locked invariants (may be derived constants on the package, and **must** be proven true even if not duplicated as extra output keys):

- orchestration status = `NOT_CONNECTED`
- `notClinicallyActivatedPrescription` = `true`

Strict schema validation **rejects unknown top-level keys**. Extra keys → `INVALID_INPUT`.

### 9.2 Output prohibitions

No medicine, formula, potency, dosage, electricity, Tablet A/B, external-route, monitoring, mixture-count, or prescription fields.

---

## 10. Outcomes and failure codes

### 10.1 Closed clinical outcomes (exactly 7)

1. `NOT_APPLICABLE`
2. `NOT_EVALUABLE`
3. `ADDITIONAL_INFORMATION_REQUIRED`
4. `UNRESOLVED_TIE`
5. `UNRESOLVED_EVIDENCE`
6. `SHADOW_TEMPERAMENT_INDICATION_PROPOSED`
7. `BLOCKED_BY_RULE8_CONTRADICTION`

Any positive-looking outcome (`SHADOW_TEMPERAMENT_INDICATION_PROPOSED`) remains **shadow-only** and does **not** activate medicine/Rx influence.

### 10.2 Fixed implementation / configuration errors (exactly 5)

`message === failureCode` (when separately implemented):

1. `INVALID_INPUT`
2. `UNSUPPORTED_CONTRACT_VERSION`
3. `INVALID_EVIDENCE_REGISTRY`
4. `CONTRADICTORY_INPUT_STATE`
5. `INTERNAL_FAILURE`

Do **not** confuse fail-closed clinical outcomes with thrown structural errors.

---

## 11. Deterministic precedence

First matching wins. No default temperament. Fail-closed before any synthetic positive indication.

1. Structural validation failures → fixed error (`INVALID_INPUT` / `INVALID_EVIDENCE_REGISTRY` / …)
2. Unsupported contract version → `UNSUPPORTED_CONTRACT_VERSION`
3. Upstream / applicability `NOT_APPLICABLE` → `NOT_APPLICABLE`
4. Forbidden / unauthorized evidence source → `NOT_EVALUABLE` or `UNRESOLVED_EVIDENCE` (as appropriate)
5. Stale / disputed / superseded evidence blocking evaluation → `UNRESOLVED_EVIDENCE`
6. Contradictory Rule 1 evidence → `UNRESOLVED_EVIDENCE` / `CONTRADICTORY_INPUT_STATE` when structural
7. Rule 8 comparison supplied as `CONFLICT` → `BLOCKED_BY_RULE8_CONTRADICTION`
8. No sufficient evidence → `ADDITIONAL_INFORMATION_REQUIRED` with `UNKNOWN` posture
9. BP-only or photo-only insufficiency → `ADDITIONAL_INFORMATION_REQUIRED` / `NOT_EVALUABLE` (no resolved temperament)
10. Exact equal tie after authorized evidence → `UNRESOLVED_TIE`
11. Unresolved Bilious secondary-dosha where secondary is required and still pending → fail-closed unresolved secondary (no guessed secondary)
12. Full conjunctive **synthetic** eligible indication gates (tests only) → `SHADOW_TEMPERAMENT_INDICATION_PROPOSED`
13. Safe fallback → `NOT_EVALUABLE` or normalized `INTERNAL_FAILURE`

---

## 12. Technical safety invariants (future separately authorized evaluator)

- Deterministic behavior
- Exact-key validation; unknown-key rejection
- Proxy / accessor / getter-trap plain-data rejection
- Cycle / sparse-array / symbol rejection
- Input non-mutation; defensive clone
- Recursive output freeze
- Stable ordering / fingerprint
- Fixed error messages (`message === failureCode`)
- No fs / network / DB / env / telemetry as clinical authority
- No mutable production registry
- No public bypass / test-only production seam
- No raw `Error.stack` in user/clinical output
- No paid dependency (`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`)

---

## 13. Shadow and production boundary

Every future output under this contract stage:

| Field | Locked value |
|-------|----------------|
| `shadowOnly` | `true` |
| `medicineSelectionInfluence` | `NONE` |
| `clinicalActivation` | `NONE` |
| Orchestration | `NOT_CONNECTED` |
| `prescriptionEffect` | `NONE` |
| Not clinically activated prescription | `true` |

### 13.1 Historical clinical impact matrix (future only)

Owner-approved **intended** downstream evidence influence (Formula 2/3, tablets, external, potency, electricity, summary) documented in [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) remains **historical / future clinical intent**.

Under **R1-ID-03**, that matrix does **not** authorize current:

- selection, ranking, boost, or demotion
- formula / potency / Tablet / external mutation
- orchestration connection
- production Rx effect

Any future influence requires a **separate** owner-approved clinical and activation tranche.

---

## 14. Future implementation allowlist (not authorized now)

Suggested package allowlist — **do not create** under this documentation authorization:

- `packages/rule1/package.json`
- `packages/rule1/tsconfig.json`
- `packages/rule1/src/**`
- `packages/rule1/tests/**`
- Mechanical root typecheck registration
- Mechanical Vitest registration
- Lockfile workspace entry
- Rule 1-only `nineRules.ts` metadata alignment
- Directly affected Rule 1 status tests

**Excluded:** apps, dashboards, orchestration wiring, clinical datasets/mappings, protected sources, legacy checkout, deployment, C3E/SAC.

---

## 15. Mandatory proof matrix (P01–P18)

Mechanical count: **exactly 18**. Sequential and unique. Skipped / mocked / unavailable ≠ PASS. **Do not execute** in this documentation tranche.

| # | Proof obligation |
|---|------------------|
| **P01** | Strict input schema; reject unknown keys; closed vocabularies |
| **P02** | Empty real registry / fail-closed; activating mappings remain **0** |
| **P03** | No evidence → `UNKNOWN` posture + `ADDITIONAL_INFORMATION_REQUIRED` |
| **P04** | No default `LYMPHATIC` / no automatic `MIXED` on empty |
| **P05** | BP alone insufficient; photo alone insufficient |
| **P06** | Q3 evidence gates / lifecycle non-activating classes respected |
| **P07** | Exact tie → `UNRESOLVED_TIE`; Q3G no question bank |
| **P08** | Bilious secondary unresolved → fail-closed (no guess) |
| **P09** | Rule 8 separation — no overwrite / silent merge / inference from Rule 8 |
| **P10** | Rule 8 `CONFLICT` when comparison supplied → `BLOCKED_BY_RULE8_CONTRADICTION` |
| **P11** | No medicine / formula / potency / dosage / Rx fields in output |
| **P12** | `medicineSelectionInfluence` / `clinicalActivation` / `prescriptionEffect` always `NONE`; `shadowOnly` always `true` |
| **P13** | Input non-mutation |
| **P14** | Deep-freeze output |
| **P15** | Deterministic key order / fingerprint stability |
| **P16** | Fixed errors (`message === failureCode`); closed outcome/error sets |
| **P17** | No PHI / protected-path / raw image leakage |
| **P18** | No orchestration / runtime / production wiring in authorized scope |

---

## 16. Explicit non-claims

This contract does **not** claim or authorize:

- Validated symptom→temperament mappings
- Evidence catalog creation
- Real positive temperament resolution as clinical truth
- Bilious secondary clarification
- Question bank
- Medicine selection / ranking / boost / demote
- Formula / potency / dosage / electricity
- Tablet A/B
- External routes
- Rule 8 reconciliation beyond fail-closed
- Orchestration connection
- Production Rx
- Clinical correctness / efficacy
- C3E / protected access
- Legacy import as clinical authority
- Paid service
- Deployment
- `packages/rule1` or evaluator implementation

---

## 17. STOP

Under **`R1_TEMPERAMENT_ENGINE_CANONICAL_CONTRACT_DOCUMENTATION_AUTHORIZED`**:

- Do **not** create `packages/rule1` or implement evaluator/tests
- Do **not** create mapping data or evidence catalog
- Do **not** treat this document as implementation authorization
- Do **not** connect orchestration / runtime or activate clinical selection
- Do **not** alter production prescription
- Do **not** invent keywords, thresholds, or clinical relationships
- Do **not** resume Rule 5 C3E, change Smart App Control, or access protected sources
- Do **not** modify the legacy repository
- Do **not** use paid APIs / services / certificates
- Do **not** deploy

**Separate authorizations required:** shadow package implementation; validated evidence catalog / mappings; independent clinical review of concrete edges; Rule 1↔Rule 8 reconciliation (if ever); orchestration connection; production activation.
