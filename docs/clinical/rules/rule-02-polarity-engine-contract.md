# Rule 2 — Polarity Engine (Canonical Contract)

| Field | Value |
|-------|--------|
| **Rule number** | 2 |
| **Canonical identity token** | `POLARITY_ENGINE` |
| **Display title** | Polarity Engine |
| **Document class** | OWNER_LOCKED canonical contract |
| **Authority tokens** | `R2_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED` · `R2_POLARITY_ENGINE_CANONICAL_CONTRACT_DOCUMENTATION_AUTHORIZED` |
| **Contract version** | `ehas2-rule2-contract-v1` |
| **Input contract version** | `ehas2-rule2-input-v1` |
| **Output contract version** | `ehas2-rule2-output-v1` |
| **Implementation (current)** | `RULE2_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE2_IMPLEMENTATION_NOT_AUTHORIZED` |
| **Package** | `packages/rule2` **absent** · `@ehas2/rule2` **absent** |
| **Runtime** | `RULE2_ORCHESTRATION_NOT_CONNECTED` · `RULE2_CLINICAL_ACTIVATION_NONE` · `RULE2_MEDICINE_SELECTION_INFLUENCE_NONE` · `RULE2_FORMULA_MUTATION_NONE` · `RULE2_PRESCRIPTION_EFFECT_NONE` · `RULE2_PRODUCTION_RX_UNCHANGED` |
| **Real validated Rule 2 formula/slot polarity mappings** | **`0`** |
| **Evidence catalog** | `RULE2_EVIDENCE_CATALOG_NOT_CREATED` |
| **Evidence registry posture** | `RULE2_EMPTY_REGISTRY_FAIL_CLOSED` · production/real `entries: []` |
| **Paid services** | `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` |
| **Rule 5 C3E** | `RULE2_INDEPENDENT_OF_RULE5_C3E` (C3E remains `C3E_NOT_AUTHORIZED` separately) |
| **Owner governance** | `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED` |
| **Canonical `origin/main` base (this documentation tranche)** | `d926a9a0a3cc24491ffd3d07ff1c5b8c23df24db` |
| **Companion frozen clinical specification** | [rule-02-polarity-engine.md](./rule-02-polarity-engine.md) (clinical body preserved; this contract is normative for future package schemas) |
| **Companion owner decisions** | [rule-02-owner-decisions.md](./rule-02-owner-decisions.md) |
| **Companion frozen field semantics** | [rule-02-data-contract.md](./rule-02-data-contract.md) (preserved; not a package schema by itself) |
| **Companion test intent** | [rule-02-test-requirements.md](./rule-02-test-requirements.md) |
| **Legacy rejects** | [rule-02-legacy-conflicts.md](./rule-02-legacy-conflicts.md) |
| **Medicine pool identity pointer** | [rule-02-cq001a-medicine-pool-addendum.md](./rule-02-cq001a-medicine-pool-addendum.md) (38-code pool identity only — **not** Rule 2 disease-polarity evidence) |

**Status tokens (current):**

- `RULE2_IDENTITY_POLARITY_ENGINE`
- `RULE2_IDENTITY_OWNER_LOCKED`
- `RULE2_CANONICAL_CONTRACT_DOCUMENTED`
- `RULE2_SHADOW_EVALUATOR_NOT_IMPLEMENTED`
- `RULE2_IMPLEMENTATION_NOT_AUTHORIZED`
- `RULE2_REAL_VALIDATED_MAPPINGS_0`
- `RULE2_EVIDENCE_CATALOG_NOT_CREATED`
- `RULE2_EMPTY_REGISTRY_FAIL_CLOSED`
- `RULE2_FORMULA_MUTATION_NONE`
- `RULE2_MEDICINE_SELECTION_INFLUENCE_NONE`
- `RULE2_ORCHESTRATION_NOT_CONNECTED`
- `RULE2_CLINICAL_ACTIVATION_NONE`
- `RULE2_PRESCRIPTION_EFFECT_NONE`
- `RULE2_PRODUCTION_RX_UNCHANGED`
- `RULE2_INDEPENDENT_OF_RULE5_C3E`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`

**Historical / interface alias (R2-ID-05):** EH_9 / Phase 5B / `nineRules` / clinical-validation dashboard short label **“Polarity”** is a **historical / interface alias** only. Current owner-locked display name is **Polarity Engine**; machine identity is **`POLARITY_ENGINE`**. Dashboard rename is **not** authorized by this documentation tranche. Historical interface stub `affectsClinicalSelection: true` is **not** clinical authority; future separately authorized implementation should align metadata to `false` under R2-ID-04 shadow posture.

This document is the authoritative EHAS2 Rule 2 **focused canonical contract**. It does **not** create `packages/rule2`, invent formula/slot polarity mappings, create an evidence catalog, connect orchestration, activate clinical selection, grant medicine-selection influence, mutate formulas, integrate Rule 4, or change production prescription output.

---

## 0. Controlling authority

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

### Owner clinical authority (explicit owner approval required)

- Disease-polarity meanings and closed vocabulary
- Required therapeutic-polarity meanings and law-of-opposites
- MIXED disease-polarity clinical policy (`R2-ID-02`)
- Formula/slot clinical roles (including SUPPORT_ONLY)
- Evidence relationships that may activate real polarity annotations
- Review / doctor-review / blocking meaning for unresolved or MIXED postures
- Future downstream annotation influence (e.g. potency pathway consumption)
- Clinical activation, orchestration connection, production Rx effect

### Delegated technical engineering (within this locked contract)

- TypeScript schemas/types and exact-key validation
- Deterministic ordering, immutability, fingerprinting
- Fixed errors (`message === failureCode`)
- Lifecycle mechanics for empty registry / fail-closed gates
- Synthetic fixtures (tests only, after separate implementation authorization)
- Tests/CI and package organization **after** separate implementation authorization

Engineering **must not** invent polarity mappings, medicine-pair compatibility, formula compositions, potency/electricity shortcuts, or merge distinct polarity axes into one ambiguous `polarity` string.

Unresolved clinical decision → **STOP** and ask owner.

Canonical cross-rule pointer: [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md).

---

## 1. Canonical identity and current status

| Field | Locked value |
|-------|----------------|
| Rule number | `2` |
| Display name | Polarity Engine |
| Machine identity | `POLARITY_ENGINE` |
| Identity status | `RULE2_IDENTITY_OWNER_LOCKED` |
| Contract status | `RULE2_CANONICAL_CONTRACT_DOCUMENTED` |
| Evaluator | `RULE2_SHADOW_EVALUATOR_NOT_IMPLEMENTED` |
| Implementation | `RULE2_IMPLEMENTATION_NOT_AUTHORIZED` |
| Package | `packages/rule2` absent |
| Orchestration | `NOT_CONNECTED` |
| Clinical activation | `NONE` |
| Medicine-selection influence | `NONE` |
| Formula mutation | `NONE` (`mutatesMixtures` / `mutates_mixtures` = **false**) |
| Production Rx effect | `NONE` / unchanged |
| Real validated mappings | **`0`** |
| Evidence catalog | `NOT_CREATED` |
| Registry | empty / fail-closed |

---

## 2. Locked owner decisions (R2-ID-01 … R2-ID-05)

Combined approval: `R2_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`

| Decision ID | Owner disposition | Normative effect | Does **not** authorize | Safety consequence |
|-------------|-------------------|------------------|--------------------------|--------------------|
| **R2-ID-01** | **`R2_ID01_ACCEPT_POLARITY_ENGINE_TOKEN`** | Locks machine identity **`POLARITY_ENGINE`** and display name **Polarity Engine**. | Package, mappings, orch, Rx, dashboard rewrite. | Prevents competing identity tokens. |
| **R2-ID-02** | **`R2_ID02_MIXED_THERAPEUTIC_POLICY_LOCKED`** | When `diseasePolarity = MIXED`: **no** opposite therapeutic invented; **no** legacy coerce; `resolutionStatus = UNRESOLVED`; `requiredTherapeuticPolarity = NEUTRAL`; `doctorReviewRequired = true`; review-only; **no** medicine/formula/potency effect. | MIXED as potency selector; silent MIXED→scoring coerce. | Blocks unsafe therapeutic invention from MIXED. |
| **R2-ID-03** | **`R2_ID03_EMPTY_REGISTRY_FAIL_CLOSED_SYNTHETIC_ONLY`** | Real registry empty; active mappings **`0`**; synthetic-only fixtures; medicine-registry `.polarity` is **not** Rule 2 disease-polarity evidence; no auto-promotion. | Inventing catalog/rows; promoting inventory/legacy/AI/Rule 4 fixtures. | Fail-closed when real evidence absent. |
| **R2-ID-04** | **`R2_ID04_SHADOW_INFLUENCE_NONE`** | Annotation-only shadow posture: medicine influence **`NONE`**; formula mutation **`NONE`**; orch **`NOT_CONNECTED`**; activation **`NONE`**; Rx **`NONE`**. | Live selection, formula mutation, production effect. | Prevents selection creep in first technical shadow. |
| **R2-ID-05** | **`R2_ID05_POLARITY_ENGINE_DISPLAY_ALIAS_POLICY`** | Canonical display **Polarity Engine**; short **Polarity** = historical/interface alias only. | Dashboard rename in this PR; treating alias as competing canonical token. | Prevents identity drift in docs/metadata. |

---

## 3. Responsibility boundary

### Rule 2 owns only

- Formula/slot-specific **disease-polarity** annotation
- **Required therapeutic-polarity** annotation (law-of-opposites / fail-closed review postures)
- Resolution / review posture per slot (and aggregate doctor-review flag)
- Evidence gaps / reason codes
- `doctorReviewRequired` posture

### Rule 2 does **not** own

- Medicine identity or medicine-registry `.polarity` axis
- Medicine selection / ranking / boost / demote
- Medicine-pair compatibility tables
- Formula composition; add / remove / reorder / substitute
- Production contraindication enforcement
- Potency, dosage, electricity, Tablet A/B, external routes
- Temperament (Rule 1), organ/system affinity (Rule 3), monitoring, complexity/count/package (Rule 9)
- Production prescription issuance

---

## 4. Typed polarity axes (do not merge)

Keep **separate typed axes**:

1. **Formula-slot disease polarity** — Rule 2 primary clinical annotation axis
2. **Required therapeutic polarity** — law-of-opposites / review-neutral posture
3. **Optional case-polarity summary** — display/support only; `mustNotDriveSelection = true`
4. **Medicine-registry polarity** — external inventory axis on medicine codes; **not** Rule 2 disease-polarity evidence (`R2-ID-03`)
5. **Rule 4 polarity pathway / adapter** — downstream consumer of annotations; **not** the Rule 2 evaluator and **not** activating Rule 2 evidence

Do **not** collapse these into a single ambiguous `polarity` string (frozen data-contract separation preserved).

---

## 5. Formula / slot boundary

Normative requirements:

- Every evaluation is **formula/slot-specific**
- Slot references are opaque / non-clinical identifiers
- **No** hardcoded Formula A/B/C/D/E clinical authority
- **No** fixed formula sequence as clinical SoT
- Input slot order preserved in output annotations
- **No** reordering, add, remove, or substitute of medicines/slots by Rule 2
- Support-role slots may be annotated per frozen SUPPORT_ONLY rules
- `mutatesMixtures = false` always
- Rule 2 **cannot** create medicine pairs or mutate composition
- Global case polarity **must not** apply to all formulas

Companion freeze isolation (normative clinical constraints mirrored, not expanded):

- BP supporting only for cardiac / vascular / BP-target slots
- Report findings slot-aligned only
- Ordinary photos must not determine polarity; verified local observations may support related local slots only

---

## 6. Disease and therapeutic vocabulary

Exact frozen spellings (package camelCase keys; frozen snake_case examples in [rule-02-data-contract.md](./rule-02-data-contract.md) remain companion field semantics).

### 6.1 Disease polarity (`diseasePolarity`) — closed set

1. `POSITIVE`
2. `NEGATIVE`
3. `NEUTRAL`
4. `MIXED`
5. `UNRESOLVED`
6. `SUPPORT_ONLY`

`UNRESOLVED` and `SUPPORT_ONLY` remain **distinct** and must not be silently merged into `MIXED` or proven `NEUTRAL` disease state.

### 6.2 Required therapeutic polarity (`requiredTherapeuticPolarity`) — closed set

1. `POSITIVE`
2. `NEGATIVE`
3. `NEUTRAL`

`NEUTRAL` therapeutic review posture is **not** a clinically validated therapeutic choice when used as unresolved/MIXED/insufficient-evidence fallback.

### 6.3 Resolution status (`resolutionStatus`) — closed set

1. `RESOLVED`
2. `RESOLVED_SUPPORT_ROLE`
3. `NEUTRAL_FALLBACK_PENDING_REVIEW`
4. `UNRESOLVED`
5. `CONTRADICTORY`

Do not invent synonyms.

---

## 7. Law of opposites

| `diseasePolarity` | `requiredTherapeuticPolarity` | Notes |
|-------------------|-------------------------------|-------|
| `POSITIVE` | `NEGATIVE` | Locked |
| `NEGATIVE` | `POSITIVE` | Locked |
| `NEUTRAL` (resolved support / resolved neutral context) | `NEUTRAL` | Locked support/neutral posture |
| `SUPPORT_ONLY` | `NEUTRAL` | `resolutionStatus = RESOLVED_SUPPORT_ROLE` |
| `UNRESOLVED` | `NEUTRAL` | `fallbackPolicy = OWNER_APPROVED_NEUTRAL_FALLBACK`; `doctorReviewRequired = true`; `resolutionStatus` may be `NEUTRAL_FALLBACK_PENDING_REVIEW` or `UNRESOLVED` |
| `MIXED` | `NEUTRAL` | **`R2-ID-02`**: no opposite invented; `resolutionStatus = UNRESOLVED`; `doctorReviewRequired = true`; review-only; no medicine/formula/potency effect |

**Rejected:** legacy `UNRESOLVED`/`SUPPORT_ONLY` → `MIXED` scoring coerce; global `detect_polarity`; case polarity as selection driver.

---

## 8. Zero / insufficient evidence

When evidence is absent or insufficient for a slot:

- `diseasePolarity = UNRESOLVED` (or null only when outcome is non-applicable / non-evaluable per precedence)
- `requiredTherapeuticPolarity = NEUTRAL`
- `doctorReviewRequired = true`
- `fallbackPolicy = OWNER_APPROVED_NEUTRAL_FALLBACK` when neutral-fallback pending review applies
- **No** positive clinical resolution
- **No** medicine selection
- **No** fallback formula invention
- **No** global/case polarity default
- **No** BP/photo/report override across unrelated slots
- Evidence gaps **explicit**

Neutral review posture must **not** be described as a clinically validated therapeutic choice.

---

## 9. Evidence registry and lifecycle

### 9.1 Production / real registry (immutable empty)

```text
registryVersion: production-empty-v0
entries: []
activeRealMappingCount: 0
```

Catalog: **`NOT_CREATED`**.

### 9.2 Lifecycle classes (non-activating by default)

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

### 9.3 Conjunctive gates for a positive **real** mapping (future clinical data)

All required:

1. Approved source / provenance
2. Evidence validation under owner-approved criteria
3. Explicit owner clinical approval for that evidence version
4. Lifecycle = `APPROVED_AND_ACTIVE`
5. Supported contract/version
6. No contradiction / staleness / dispute / supersession
7. Formula/slot scope match

Otherwise: **fail-closed** — no positive real polarity resolution.

### 9.4 Synthetic fixtures

- Allowed **only** in tests after **separate** implementation authorization
- Must be labelled `SYNTHETIC_TEST_ONLY` (or equivalent locked synthetic classification)
- Never auto-promotable; never clinical authority alone

### 9.5 Forbidden as activating Rule 2 authority

- Medicine-registry `.polarity` fields
- Rule 4 polarity adapter fixtures / pathway enums as Rule 2 evidence
- Legacy polarity maps / dual-engine outputs
- Phase 5C synthetic orchestrator values
- AI suggestions / inventory-only audits
- Protected / C3E material

---

## 10. Input contract (`ehas2-rule2-input-v1`)

Plain-data, versioned schema. Identifiers are canonical / synthetic. **No PHI**. **No** protected clinical source paths. **No** raw report/photo bytes. **No** medicine selection. **No** medicine-registry polarity import as disease evidence. **No** formula mutation commands. **No** potency/dosage/electricity. **No** legacy object passthrough as clinical authority.

### 10.1 Required top-level keys (deterministic order) — **exactly 9**

1. `contractVersion` — must equal `ehas2-rule2-input-v1` (or a later owner-approved version supported by a future evaluator)
2. `requestId` — non-PHI synthetic evaluation / request identifier
3. `formulaSlotPolarityEvidenceRegistry` — production/real registry may contain **zero** activating entries (empty/fail-closed)
4. `orderedFormulaSlotRefs` — ordered opaque formula/slot references (order preserved; may be empty only if upstream not applicable)
5. `doctorSuppliedSlotBoundEvidenceItems` — ordered doctor-supplied slot-bound evidence refs (may be empty)
6. `casePolaritySummary` — display-only summary envelope **or** `{ "status": "NOT_SUPPLIED" }` (`mustNotDriveSelection` must be `true` when summary object supplied)
7. `slotBoundSupportingSignalRefs` — slot-aligned BP / report / photo **metadata references** **or** `{ "status": "NOT_SUPPLIED" }` (supporting isolation only; never bytes; never global override)
8. `evidenceDataVersions` — version stamps for evidence corpora / governance surfaces used
9. `upstreamApplicability` — upstream applicability envelope (`APPLICABLE` \| `NOT_APPLICABLE` \| `NOT_EVALUABLE`)

**Exact ordered top-level key count: 9.**

Strict schema validation **rejects unknown top-level keys** (and unknown keys inside locked nested objects). Extra keys → `INVALID_INPUT`.

Technical nested fields may be engineering-defined after implementation authorization but **cannot** add clinical meaning beyond this contract and the frozen clinical body.

### 10.2 Input prohibitions

- Medicine IDs, formula mutation commands, add/remove/reorder/substitute operations
- Medicine-registry polarity fields as Rule 2 disease-polarity authority
- Potency / dosage / electricity / Tablet / external / monitoring / mixture-count / Rx payloads
- Rule 4 pathway enums as Rule 2 input authority
- PHI, protected paths, raw report/photo bytes
- Invented polarity maps inside the request
- Free-text clinical narrative as sole authority without approved evidence classes (future catalogs)

---

## 11. Output contract (`ehas2-rule2-output-v1`)

Shadow-only deterministic result. Deep-frozen after construction. Key order fixed.

### 11.1 Required top-level keys (deterministic order) — **exactly 18**

1. `contractVersion`
2. `ruleNumber` — always `2`
3. `ruleIdentity` — always `POLARITY_ENGINE`
4. `requestId`
5. `status` — closed clinical outcome (§12)
6. `applicability`
7. `formulaSlotAnnotations` — ordered list of annotation records (same order as `orderedFormulaSlotRefs` when applicable)
8. `casePolaritySummary` — echo/display-only object **or** `null` (must not drive selection)
9. `evidenceGaps`
10. `reasonCodes`
11. `blockersOrUnresolvedEvidence`
12. `doctorReviewRequired` — aggregate boolean (`true` if any slot requires review or outcome requires review)
13. `deterministicFingerprint`
14. `shadowOnly` — always `true`
15. `formulaMutation` — always `NONE`
16. `medicineSelectionInfluence` — always `NONE`
17. `clinicalActivation` — always `NONE`
18. `prescriptionEffect` — always `NONE`

**Exact ordered top-level key count: 18.**

### 11.2 Annotation record keys (deterministic order) — **exactly 12**

Each element of `formulaSlotAnnotations`:

1. `formulaSlotId`
2. `formulaTargetId`
3. `rule2RecordId`
4. `targetPathologyRef` — opaque reference **or** `null`
5. `diseasePolarity` — closed disease polarity token **or** `null` when non-applicable / non-evaluable path requires null
6. `requiredTherapeuticPolarity` — closed therapeutic token (review-neutral `NEUTRAL` when unresolved/MIXED/insufficient)
7. `resolutionStatus` — closed resolution status
8. `fallbackPolicy` — `OWNER_APPROVED_NEUTRAL_FALLBACK` **or** `null`
9. `doctorReviewRequired`
10. `evidenceGaps`
11. `reasonCodes`
12. `mutatesMixtures` — always `false`

**Exact ordered annotation-record key count: 12.**

### 11.3 Package-level invariants (must be proven even if not duplicated as extra output keys)

- orchestration status = `NOT_CONNECTED`
- runtime status = `NOT_CONNECTED`
- `notClinicallyActivatedPrescription` = `true`

### 11.4 Output prohibitions

No medicines, formulas, potency, dosage, electricity, Tablet A/B, external routes, monitoring, mixture-count, ranking, or prescription content.

---

## 12. Closed outcomes and failure codes

### 12.1 Closed clinical outcomes (exactly 7)

1. `NOT_APPLICABLE`
2. `NOT_EVALUABLE`
3. `ADDITIONAL_INFORMATION_REQUIRED`
4. `UNRESOLVED_EVIDENCE`
5. `DOCTOR_REVIEW_REQUIRED`
6. `SHADOW_POLARITY_ANNOTATIONS_PROPOSED`
7. `BLOCKED_BY_SLOT_CONTRADICTION`

`NEUTRAL` therapeutic review posture is **not** an outcome.

Any positive-looking outcome (`SHADOW_POLARITY_ANNOTATIONS_PROPOSED`) remains **shadow-only** and does **not** activate medicine/Rx/formula influence.

### 12.2 Fixed implementation / configuration errors (exactly 5)

`message === failureCode` (when separately implemented):

1. `INVALID_INPUT`
2. `UNSUPPORTED_CONTRACT_VERSION`
3. `INVALID_EVIDENCE_REGISTRY`
4. `CONTRADICTORY_INPUT_STATE`
5. `INTERNAL_FAILURE`

Do **not** confuse fail-closed clinical outcomes with thrown structural errors.

---

## 13. Deterministic precedence

First matching wins. No default / global polarity. All fail-closed / review branches precede a synthetic positive technical result.

1. Safe structural validation failures → fixed error (`INVALID_INPUT` / `INVALID_EVIDENCE_REGISTRY` / …)
2. Unsupported contract version → `UNSUPPORTED_CONTRACT_VERSION`
3. Upstream / applicability `NOT_APPLICABLE` → `NOT_APPLICABLE`
4. Forbidden evidence source (medicine-registry polarity, legacy maps, AI, unprotected promotion, etc.) → `NOT_EVALUABLE` or `UNRESOLVED_EVIDENCE` as appropriate
5. Stale / disputed / superseded evidence blocking evaluation → `UNRESOLVED_EVIDENCE`
6. Contradictory formula/slot state → `BLOCKED_BY_SLOT_CONTRADICTION` and/or `CONTRADICTORY_INPUT_STATE` when structural
7. Missing / insufficient evidence → `ADDITIONAL_INFORMATION_REQUIRED` or `UNRESOLVED_EVIDENCE` with UNRESOLVED + NEUTRAL therapeutic + doctor review
8. Support-only role → SUPPORT_ONLY / `RESOLVED_SUPPORT_ROLE` / therapeutic `NEUTRAL` (no selection)
9. MIXED disease polarity → **`R2-ID-02`** UNRESOLVED + NEUTRAL therapeutic + `doctorReviewRequired` (review-only)
10. NEUTRAL review / unresolved fallback posture → review flags; not validated therapeutic choice
11. Full conjunctive **synthetic** eligible annotation gates (tests only) → `SHADOW_POLARITY_ANNOTATIONS_PROPOSED`
12. Safe fallback → `NOT_EVALUABLE` or normalized `INTERNAL_FAILURE`

---

## 14. Cross-rule separation

| Rule | Locked separation |
|------|-------------------|
| **Rule 1** | Temperament ≠ polarity; no copy/merge/weight sharing |
| **Rule 3** | Organ/system affinity ≠ polarity; slot-bound evidence boundary only |
| **Rule 4** | May later **consume** annotations; Rule 2 does **not** choose potency; current Rule 4 polarity adapter/fixtures are **not** Rule 2 implementation or evidence |
| **Rule 6** | Relationships remain separate; Rule 2 does not select/filter live candidates now; Rule 6 real relationships remain **0** independently |
| **Rule 9** | Does not reinterpret polarity; receives no live Rule 2 output now |
| **First package** | No cross-rule runtime dependency unless separately authorized |

---

## 15. Technical safety invariants (future separately authorized evaluator)

- Strict exact-key schemas; unknown-key rejection
- Proxy / accessor / getter-trap plain-data rejection
- Cycle / sparse-array / symbol / non-plain prototype rejection
- Defensive clone; input non-mutation
- Slot order preservation
- Recursive output freeze
- Deterministic fingerprint
- Fixed errors (`message === failureCode`)
- No mutable production registry
- No public bypass / test-only production seam
- No fs / network / DB / env / telemetry as clinical authority
- No `Error.stack` in user/clinical output
- No paid dependency (`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`)

---

## 16. Shadow / production boundary

Every future output under this contract stage:

| Field | Locked value |
|-------|----------------|
| `shadowOnly` | `true` |
| `formulaMutation` | `NONE` |
| `medicineSelectionInfluence` | `NONE` |
| `clinicalActivation` | `NONE` |
| `prescriptionEffect` | `NONE` |
| Orchestration | `NOT_CONNECTED` |
| Runtime | `NOT_CONNECTED` |
| Not clinically activated prescription | `true` |

Historical interface `affectsClinicalSelection: true` is a **stub** and **not** authority. Future separately authorized implementation should align it to `false` under R2-ID-04.

---

## 17. Future implementation allowlist (do not create in this tranche)

Documented for a **later** separately authorized implementation PR only:

- `packages/rule2/package.json`
- `packages/rule2/tsconfig.json`
- `packages/rule2/src/**`
- `packages/rule2/tests/**`
- Root typecheck registration
- Vitest discovery registration
- Lockfile workspace entry
- Rule 2-only `nineRules.ts` alignment (`Polarity Engine` / `affectsClinicalSelection: false`)
- Directly affected Rule 2 status tests

**Excluded without separate owner authorization:** apps/dashboard mutation, Rule 4 adapter mutation, orchestration, datasets/catalog, medicine registry edits, protected/C3E, legacy checkout, deployment, clinical activation, production Rx.

---

## 18. Mandatory proof matrix (P01–P18)

Mechanical count: **exactly 18**. Sequential and unique. Skipped / mocked / unavailable ≠ PASS. **Do not execute** proofs in this documentation tranche.

| # | Proof obligation |
|---|------------------|
| **P01** | Strict input schema; reject unknown keys; closed vocabularies |
| **P02** | Empty real registry / fail-closed; activating mappings remain **0**; catalog not created |
| **P03** | No / insufficient evidence → UNRESOLVED + therapeutic `NEUTRAL` + doctor review; gaps explicit |
| **P04** | Formula/slot-specific isolation; no global case polarity applied to all slots |
| **P05** | Slot order preserved; no add / remove / reorder / substitute; `mutatesMixtures = false` |
| **P06** | Law of opposites: POSITIVE→NEGATIVE therapeutic; NEGATIVE→POSITIVE therapeutic |
| **P07** | NEUTRAL / support-only review behavior (`RESOLVED_SUPPORT_ROLE` / NEUTRAL therapeutic) without selection |
| **P08** | MIXED → UNRESOLVED + therapeutic `NEUTRAL` + `doctorReviewRequired`; no opposite invented; no legacy coerce |
| **P09** | Forbidden medicine-registry `.polarity` as activating Rule 2 disease evidence |
| **P10** | Forbidden legacy / AI / inventory / Rule 4 fixture / unprotected lifecycle promotion as activating authority |
| **P11** | No medicine selection / ranking; formula mutation always `NONE` |
| **P12** | No potency / electricity / dosage / Tablet / external / Rx fields in output |
| **P13** | Input non-mutation |
| **P14** | Deep-freeze output |
| **P15** | Deterministic key order / fingerprint stability |
| **P16** | Fixed errors (`message === failureCode`); closed outcome/error sets |
| **P17** | No PHI / protected-path / raw report-photo leakage |
| **P18** | No Rule 4 / orchestration / runtime / production wiring in authorized scope |

---

## 19. Explicit non-claims

This contract does **not** authorize or claim:

- Real disease-polarity mappings or evidence catalog
- Real formula-polarity clinical resolution in production
- Medicine-registry polarity as Rule 2 evidence
- Medicine selection / ranking / pair compatibility
- Formula composition / mutation
- Production contraindication enforcement
- Potency / dosage / electricity / Tablet / external activation
- Rule 4 live activation or adapter mutation
- Orchestration / runtime connection
- Clinical validation completeness
- Production Rx effect
- C3E / protected-source access
- Legacy import as authority
- Paid service dependency
- Deployment

---

## 20. STOP

**STOP** before:

- Creating `packages/rule2`
- Evaluator / tests implementation
- Mappings / catalog creation
- Rule 4 integration
- Orchestration / activation
- Production connection

Next authorized step after independent review + owner merge of this documentation: **separate** Rule 2 synthetic shadow implementation authorization (not granted here).
