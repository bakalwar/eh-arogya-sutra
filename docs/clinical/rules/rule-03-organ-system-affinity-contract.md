# Rule 3 — Organ-System Affinity Engine (Canonical Contract)

| Field | Value |
|-------|--------|
| **Rule number** | 3 |
| **Canonical identity token** | `ORGAN_SYSTEM_AFFINITY` |
| **Display title** | Organ-System Affinity Engine |
| **Approved UI label** | Rule 3 — Active Organ Systems |
| **Historical / non-authoritative interface alias** | Organ / System Affinity |
| **Document class** | OWNER_LOCKED canonical technical-shadow contract documentation |
| **Authority tokens** | `R3_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED` · `R3_ORGAN_SYSTEM_AFFINITY_CANONICAL_CONTRACT_DOCUMENTATION_AUTHORIZED` |
| **Contract version** | `ehas2-rule3-contract-v1` |
| **Input contract version** | `ehas2-rule3-input-v1` |
| **Output contract version** | `ehas2-rule3-output-v1` |
| **Implementation (current)** | `RULE3_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE3_IMPLEMENTATION_NOT_AUTHORIZED` |
| **Package** | `packages/rule3` **absent** · `@ehas2/rule3` **absent** |
| **Runtime** | `RULE3_ORCHESTRATION_NOT_CONNECTED` · `RULE3_CLINICAL_ACTIVATION_NONE` · `RULE3_MEDICINE_SELECTION_INFLUENCE_NONE` · `RULE3_FORMULA_MUTATION_NONE` · `RULE3_PRESCRIPTION_EFFECT_NONE` · `RULE3_PRODUCTION_RX_UNCHANGED` |
| **Real validated organ-system mappings** | **`0`** |
| **Evidence catalog** | `RULE3_EVIDENCE_CATALOG_NOT_CREATED` |
| **Closed real organ-system catalog** | `RULE3_REAL_CLOSED_ORGAN_SYSTEM_CATALOG_NOT_CREATED` |
| **Evidence registry posture** | `RULE3_EMPTY_REGISTRY_FAIL_CLOSED` · production/real `entries: []` |
| **Paid services** | `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` |
| **Rule 5 C3E** | `RULE3_INDEPENDENT_OF_RULE5_C3E` (C3E remains `C3E_NOT_AUTHORIZED` separately) |
| **Owner governance** | `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED` |
| **Canonical `origin/main` base (this documentation tranche)** | `32f652caa0c0dd090d4f33f21c572dbf08ec77f2` |
| **Companion frozen clinical specification** | [rule-03-organ-system-affinity.md](./rule-03-organ-system-affinity.md) (clinical body preserved; this contract is normative for future package schemas) |
| **Companion owner decisions** | [rule-03-owner-decisions.md](./rule-03-owner-decisions.md) |
| **Companion frozen field semantics** | [rule-03-data-contract.md](./rule-03-data-contract.md) (preserved; not a package schema by itself) |
| **Companion test intent** | [rule-03-test-requirements.md](./rule-03-test-requirements.md) |
| **Legacy rejects** | [rule-03-legacy-conflicts.md](./rule-03-legacy-conflicts.md) |

**Status tokens (current):**

- `RULE3_IDENTITY_ORGAN_SYSTEM_AFFINITY`
- `RULE3_IDENTITY_OWNER_LOCKED`
- `RULE3_CANONICAL_CONTRACT_DOCUMENTED`
- `RULE3_SHADOW_EVALUATOR_NOT_IMPLEMENTED`
- `RULE3_IMPLEMENTATION_NOT_AUTHORIZED`
- `RULE3_REAL_VALIDATED_MAPPINGS_0`
- `RULE3_EVIDENCE_CATALOG_NOT_CREATED`
- `RULE3_REAL_CLOSED_ORGAN_SYSTEM_CATALOG_NOT_CREATED`
- `RULE3_EMPTY_REGISTRY_FAIL_CLOSED`
- `RULE3_FORMULA_MUTATION_NONE`
- `RULE3_MEDICINE_SELECTION_INFLUENCE_NONE`
- `RULE3_ORCHESTRATION_NOT_CONNECTED`
- `RULE3_CLINICAL_ACTIVATION_NONE`
- `RULE3_PRESCRIPTION_EFFECT_NONE`
- `RULE3_PRODUCTION_RX_UNCHANGED`
- `RULE3_INDEPENDENT_OF_RULE5_C3E`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`

**Historical / interface alias (R3-ID-02):** Phase 5B / EH_9 / `nineRules` / clinical-validation dashboard label **“Organ / System Affinity”** is a **historical / non-authoritative interface alias** only. Current owner-locked display name is **Organ-System Affinity Engine**; machine identity is **`ORGAN_SYSTEM_AFFINITY`**; approved UI label remains **Rule 3 — Active Organ Systems**. Dashboard / `nineRules.ts` rename is **not** authorized by this documentation tranche. Historical interface stub `affectsClinicalSelection: true` is **metadata drift, not clinical authority**; future separately authorized implementation should align metadata to `false` under R3-ID-04.

**Non-authority labels:** `RULE9_RULE_IDENTITIES[3]`, Rule 4 binding-port types, Phase 5C synthetic wrappers, and legacy `detect_systems` / `detect_active_systems` **cannot** redefine Rule 3 identity or clinical meaning.

This document is the authoritative EHAS2 Rule 3 **focused canonical contract**. It does **not** create `packages/rule3`, invent a closed real organ-system catalog, invent real organ-system mappings, create an evidence catalog, connect orchestration, activate clinical selection, grant medicine-selection influence, mutate formulas, integrate Rule 4, execute proofs, or change production prescription output.

---

## 0. Controlling authority

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

### Owner clinical authority (explicit owner approval required)

- Organ/system clinical meanings and any future closed real catalog
- Evidence relationships that may activate real organ-system indications
- Candidate→active clinical promotion policy beyond fail-closed / pending freeze notes
- Normative scores, weights, or thresholds (freeze data-contract examples are **not** normative)
- Review / doctor-review / blocking meaning for unresolved postures
- Downstream evidence-supply clinical effects beyond shadow annotation envelopes
- Clinical activation, orchestration connection, production Rx effect

### Delegated technical engineering (within this locked contract)

- TypeScript schemas/types and exact-key validation
- Deterministic ordering, immutability, fingerprinting
- Fixed errors (`message === failureCode`)
- Lifecycle mechanics for empty registry / fail-closed gates
- Synthetic fixtures using unmistakable synthetic namespaces (tests only, after separate implementation authorization)
- Tests/CI and package organization **after** separate implementation authorization

Engineering **must not** invent organ-system clinical catalogs, disease↔system mappings, medicine selection, formula mutation, potency/electricity shortcuts, METABOLIC fallbacks, or merge Rule 3 with Rule 1 temperament / Rule 2 polarity / Triad composition.

Unresolved clinical decision → **STOP** and ask owner.

Canonical cross-rule pointer: [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md).

---

## 1. Canonical identity and current status

| Field | Locked value |
|-------|----------------|
| Rule number | `3` |
| Display name | Organ-System Affinity Engine |
| Machine identity | `ORGAN_SYSTEM_AFFINITY` |
| Approved UI label | Rule 3 — Active Organ Systems |
| Historical interface alias | Organ / System Affinity (non-authoritative) |
| Identity status | `RULE3_IDENTITY_OWNER_LOCKED` |
| Contract status | `RULE3_CANONICAL_CONTRACT_DOCUMENTED` |
| Evaluator | `RULE3_SHADOW_EVALUATOR_NOT_IMPLEMENTED` |
| Implementation | `RULE3_IMPLEMENTATION_NOT_AUTHORIZED` |
| Package | `packages/rule3` absent |
| Orchestration | `NOT_CONNECTED` |
| Clinical activation | `NONE` |
| Medicine-selection influence | `NONE` |
| Formula mutation | `NONE` |
| Production Rx effect | `NONE` / unchanged |
| Real validated mappings | **`0`** |
| Evidence catalog | `NOT_CREATED` |
| Closed real organ-system catalog | `NOT_CREATED` |
| Registry | empty / fail-closed |

---

## 2. Locked owner decisions (R3-ID-01 … R3-ID-05)

Combined approval: `R3_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`

| Decision ID | Owner disposition | Normative effect | Does **not** authorize | Safety consequence |
|-------------|-------------------|------------------|--------------------------|--------------------|
| **R3-ID-01** | **`R3_ID01_ACCEPT_ORGAN_SYSTEM_AFFINITY_TOKEN`** | Locks machine identity **`ORGAN_SYSTEM_AFFINITY`** and display **Organ-System Affinity Engine**. | Package, mappings, orch, Rx, dashboard rewrite. | Prevents competing identity tokens (including Rule 9 labels). |
| **R3-ID-02** | **`R3_ID02_DISPLAY_ALIAS_POLICY_LOCKED`** | Canonical display **Organ-System Affinity Engine**; UI label **Rule 3 — Active Organ Systems** retained; **Organ / System Affinity** = historical/non-authoritative interface alias only. | Treating interface/dashboard/Rule9 strings as competing canonical tokens; dashboard rename in this PR. | Prevents identity drift. |
| **R3-ID-03** | **`R3_ID03_EMPTY_REGISTRY_FAIL_CLOSED_SYNTHETIC_ONLY`** | Real registry empty; mappings **`0`**; catalog **`NOT_CREATED`**; synthetic-only technical fixtures; fail-closed evidence gates; no auto-promotion. | Inventing catalog/rows; promoting inventory/legacy/AI/interface evidence. | Fail-closed when real evidence absent. |
| **R3-ID-04** | **`R3_ID04_SHADOW_INFLUENCE_NONE`** | Annotation / evidence-supply only: medicine influence **`NONE`**; orch **`NOT_CONNECTED`**; activation **`NONE`**; Rx **`NONE`**; future `affectsClinicalSelection: false`. | Live selection, formula mutation, production effect, Rule 4 activation. | Prevents selection creep in first technical shadow. |
| **R3-ID-05** | **`R3_ID05_SYSTEM_VOCAB_FAIL_CLOSED_NO_CATALOG_YET`** | No approved real closed organ-system catalog; unknown **real** tokens fail closed; only unmistakable synthetic fixture IDs (`SYS_SYN_*`, `EVID_SYN_*`, `CASE_SYN_*`) may appear in technical fixtures. | Promoting historical examples (RESPIRATORY, GASTRIC, RENAL, HEPATIC, CARDIAC, METABOLIC, GYNE, …) into a closed approved catalog. | Blocks unauthorized clinical vocabulary expansion. |

---

## 3. Responsibility and scope

### 3.1 May (future shadow after separate implementation authorization)

- Accept structured organ/system-affinity evidence envelopes
- Classify evidence as unresolved, candidate, or synthetic technical indication under authorized gates
- Produce deterministic shadow annotations / evidence envelopes
- Supply **non-activating** evidence envelopes to separately authorized future consumers
- Record doctor-review and information-gap posture

### 3.2 Must not

- Select / rank medicine
- Add / remove / reorder / substitute formula content
- Select potency, dosage, electricity, Tablet, or external treatment
- Create prescription / Rx
- Activate Rule 4
- Override or reinterpret Rule 1 temperament or Rule 2 polarity
- Infer triad composition or redefine Rule 6/7/8/9 clinical meaning
- Perform frontend clinical inference
- Read raw global OCR/photo blobs
- Treat an ordinary photo as organ-system evidence
- Use BP as gender or organ-system truth
- Apply METABOLIC or any other automatic fallback
- Use dictionary order as clinical authority
- Coerce GYNE→METABOLIC or keyword-only → confirmed active

---

## 4. Frozen clinical meaning (preserved)

From [rule-03-organ-system-affinity.md](./rule-03-organ-system-affinity.md) and [rule-03-owner-decisions.md](./rule-03-owner-decisions.md):

- Chief complaint is the **primary anchor** (must not invent unrelated systems; must not erase verified serious evidence; must not blindly override all other evidence)
- Structured evidence may support active/candidate systems
- Verified reports and approved local image findings remain **isolated** and provenance-bound (no cross-system leakage)
- Co-involvement remains **candidate** until independently confirmed
- Keyword-only evidence is `LOW_CONFIDENCE_CANDIDATE` (not silent confirmed authority)
- Determinism is mandatory
- Automatic METABOLIC fallback **prohibited**
- GYNE→METABOLIC coercion **prohibited**
- BP-as-gender **prohibited**
- Global OCR blob / photo override **prohibited**
- Silent exception fallback **prohibited**
- Dictionary-order SoT **prohibited**
- Rule 1↔Rule 3 mutation **prohibited**
- Consensus life-threat logic is **not** Rule 3
- Organ-System Triad is **not** Rule 3 (`AUDIT_PENDING` numbering elsewhere)
- No medicine / potency / electricity / dosage / Rx selection

### 4.1 UNRESOLVED lock

When organ/system evidence is insufficient:

| Field | Locked value |
|-------|----------------|
| Active indications | empty |
| Reason | `INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE` |
| Doctor review | required (`true`) |
| Prescription issue allowed by Rule 3 | `false` |
| Default organ/system token | **none** |

### 4.2 Non-normative examples

Scores / confidences such as `3.0`, `1.5`, `0.82` in [rule-03-data-contract.md](./rule-03-data-contract.md) are **illustrative only** — **not** normative thresholds. Candidate→active clinical promotion rules remain **not invented** here (freeze notes IMPLEMENTATION-PENDING; fail-closed until separately owner-authorized).

---

## 5. Vocabulary posture (R3-ID-05)

Distinguish four layers:

1. **Owner-approved technical status/role vocabulary** (this contract) — closed for package schemas
2. **Historical / example organ-system labels** in freeze docs — **not** a closed approved catalog
3. **Unmistakable synthetic fixture identifiers** — `SYS_SYN_*`, `EVID_SYN_*`, `CASE_SYN_*` (and matching synthetic entry IDs)
4. **Future real catalog values** — require separate clinical evidence + owner approval

Unknown **real** organ-system tokens → **fail closed**.

### 5.1 Closed technical roles (`systemRole`)

1. `PRIMARY`
2. `SECONDARY`
3. `CANDIDATE`
4. `CO_INVOLVEMENT_CANDIDATE`

### 5.2 Closed technical verification statuses

1. `VERIFIED`
2. `UNVERIFIED`
3. `LOW_CONFIDENCE_CANDIDATE`

### 5.3 Closed technical indication statuses (`indicationStatus`)

1. `NOT_APPLICABLE`
2. `UNRESOLVED`
3. `CANDIDATE_ONLY`
4. `SHADOW_ACTIVE_TECHNICAL`
5. `BLOCKED_CONTRADICTION`

`SHADOW_ACTIVE_TECHNICAL` is **synthetic technical only** — not clinical activation and not promotable to production authority.

### 5.4 Closed detection method classes (technical)

1. `CHIEF_COMPLAINT_ANCHOR`
2. `STRUCTURED_SUPPORTING`
3. `VERIFIED_REPORT_ISOLATED`
4. `VERIFIED_LOCAL_IMAGE_SUPPORT`
5. `KEYWORD_LOW_CONFIDENCE`
6. `CO_INVOLVEMENT_CANDIDATE`
7. `HYBRID_TECHNICAL`
8. `SYNTHETIC_TEST_ONLY`

---

## 6. Evidence registry and lifecycle (R3-ID-03)

### 6.1 Production / real registry (immutable empty)

```text
registryVersion: production-empty-v0
entries: []
activeRealMappingCount: 0
```

Catalog: **`NOT_CREATED`**. Closed real organ-system catalog: **`NOT_CREATED`**.

Empty registry does **not** prove clinical absence of organ-system relationships in nature.

### 6.2 Lifecycle classes (non-activating by default)

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

### 6.3 Conjunctive gates for a positive **real** indication (future clinical data)

All required (future clinical authorization — **not** granted here):

1. Approved source / provenance
2. Evidence validation under owner-approved criteria
3. Explicit owner clinical approval for that evidence version
4. Lifecycle = `APPROVED_AND_ACTIVE`
5. Supported contract/version
6. No contradiction / staleness / dispute / supersession
7. Token present in a separately approved real catalog (none exists yet)

Otherwise: **fail-closed** — no positive real organ-system activation.

### 6.4 Synthetic fixtures

- Allowed **only** in tests after **separate** implementation authorization
- Must use `SYNTHETIC_TEST_ONLY` and synthetic namespaces (`SYS_SYN_*` / `EVID_SYN_*` / `CASE_SYN_*`)
- Never auto-promotable; never clinical authority alone

### 6.5 Forbidden as activating Rule 3 authority

- Medicine-registry fields
- Rule 4 binding-port fixtures as Rule 3 SoT
- Legacy `detect_systems` / wrapper outputs
- Phase 5C synthetic orchestrator values
- AI suggestions / inventory-only audits
- Interface/dashboard stubs
- Protected / C3E material
- Caller assertions of “approved” without empty-registry gates
- Historical example tokens as if a closed catalog existed

---

## 7. Input contract (`ehas2-rule3-input-v1`)

Plain-data, versioned schema. Identifiers are canonical / synthetic. **No PHI**. **No** protected clinical source paths. **No** raw report/photo bytes. **No** medicine selection. **No** formula mutation. **No** potency/dosage/electricity. **No** legacy object passthrough as clinical authority. **No** global OCR/photo blob fields.

### 7.1 Required top-level keys (deterministic order) — **exactly 9**

1. `contractVersion` — must equal `ehas2-rule3-input-v1`
2. `requestId` — non-PHI synthetic evaluation / request identifier (`CASE_SYN_*` in fixtures)
3. `organSystemAffinityEvidenceRegistry` — production/real registry may contain **zero** activating entries (empty/fail-closed)
4. `orderedEvidenceBindingRefs` — ordered opaque binding references for deterministic evaluation scope (order preserved)
5. `doctorSuppliedStructuredEvidenceItems` — ordered doctor-supplied structured evidence refs (may be empty)
6. `caseOrganSystemSummary` — display-only summary envelope **or** `{ "status": "NOT_SUPPLIED" }` (`mustNotDriveSelection` must be `true` when summary object supplied)
7. `structuredFindingRefs` — finding-aligned report / local-image **metadata references** **or** `{ "status": "NOT_SUPPLIED" }` (never bytes; never global override)
8. `evidenceDataVersions` — version stamps for evidence corpora / governance surfaces used
9. `upstreamApplicability` — `{ status, notes }` where status ∈ `APPLICABLE` \| `NOT_APPLICABLE` \| `NOT_EVALUABLE`

**Exact ordered top-level key count: 9.**

Strict schema validation **rejects unknown top-level keys** (and unknown keys inside locked nested objects). Extra keys → `INVALID_INPUT`.

### 7.2 Nested registry object keys (deterministic order) — **exactly 3**

1. `registryVersion`
2. `entries`
3. `activeRealMappingCount` — must be `0` for production-empty posture; caller cannot inflate clinical authority

### 7.3 Evidence entry keys (deterministic order) — **exactly 12**

1. `entryId`
2. `bindingRefId`
3. `organSystemToken` — `SYS_SYN_*` only in synthetic fixtures; unknown real tokens fail closed
4. `systemRole`
5. `verificationStatus`
6. `detectionMethodClass`
7. `evidenceSourceId`
8. `evidenceValidationStatus`
9. `ownerClinicalApprovalStatus`
10. `version`
11. `effectiveStatus` — lifecycle class
12. `testClassification`

### 7.4 Input prohibitions

- Medicine IDs, formula mutation commands, ranking commands
- Potency / dosage / electricity / Tablet / external / monitoring / mixture-count / Rx payloads
- PHI, protected paths, raw report/photo bytes
- Global symptom blob / concatenated OCR as Rule 3 authority
- BP-as-gender fields as organ-system truth
- Invented closed real organ-system catalogs inside the request
- Cross-rule payload substitution (Rule 1/2/4/6/7/9 objects as Rule 3 SoT)

---

## 8. Output contract (`ehas2-rule3-output-v1`)

Shadow-only deterministic result. Deep-frozen after construction. Key order fixed.

### 8.1 Required top-level keys (deterministic order) — **exactly 18**

1. `contractVersion`
2. `ruleNumber` — always `3`
3. `ruleIdentity` — always `ORGAN_SYSTEM_AFFINITY`
4. `requestId`
5. `status` — closed technical outcome (§9)
6. `applicability`
7. `organSystemAnnotations` — ordered annotation records
8. `caseOrganSystemSummary` — echo/display-only object **or** `null` (must not drive selection)
9. `evidenceGaps`
10. `reasonCodes`
11. `blockersOrUnresolvedEvidence`
12. `doctorReviewRequired`
13. `deterministicFingerprint`
14. `shadowOnly` — always `true`
15. `formulaMutation` — always `NONE`
16. `medicineSelectionInfluence` — always `NONE`
17. `clinicalActivation` — always `NONE`
18. `prescriptionEffect` — always `NONE`

**Exact ordered top-level key count: 18.**

### 8.2 Annotation record keys (deterministic order) — **exactly 11**

1. `organSystemIndicationId`
2. `bindingRefId`
3. `organSystemToken` — `null` when unresolved / non-applicable; otherwise synthetic `SYS_SYN_*` in first-shadow fixtures
4. `systemRole` — closed role **or** `null` when unresolved / non-applicable
5. `indicationStatus`
6. `verificationStatus` — closed **or** `null` when non-applicable
7. `detectionMethodClass` — closed **or** `null` when non-applicable
8. `unresolvedReason` — `INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE` **or** `null`
9. `doctorReviewRequired`
10. `evidenceGaps`
11. `reasonCodes`

**Exact ordered annotation-record key count: 11.**

**No** normative clinical `score` / threshold fields in the package schema (freeze examples remain non-normative).

### 8.3 Package-level invariants

- orchestration status = `NOT_CONNECTED`
- runtime status = `NOT_CONNECTED`
- `notClinicallyActivatedPrescription` = `true`
- Rule 3 shadow never issues Rx (`prescriptionEffect = NONE`)

### 8.4 Output prohibitions

No medicines, formulas, potency, dosage, electricity, Tablet A/B, external routes, monitoring, mixture-count, ranking, prescription content, or closed real clinical organ-system catalog rows.

---

## 9. Closed outcomes — **exactly 7**

1. `NOT_APPLICABLE`
2. `NOT_EVALUABLE`
3. `ADDITIONAL_INFORMATION_REQUIRED`
4. `UNRESOLVED_EVIDENCE`
5. `DOCTOR_REVIEW_REQUIRED`
6. `SHADOW_ORGAN_SYSTEM_ANNOTATIONS_PROPOSED`
7. `BLOCKED_BY_CONTRADICTION`

These are **technical shadow outcomes**, not clinical production readiness.

---

## 10. Closed failure codes — **exactly 5**

1. `INVALID_INPUT`
2. `UNSUPPORTED_CONTRACT_VERSION`
3. `INVALID_EVIDENCE_REGISTRY`
4. `CONTRADICTORY_INPUT_STATE`
5. `INTERNAL_FAILURE`

Locks:

- `message === failureCode`
- No PHI / path / stack in returned output
- Unexpected errors normalize to `INTERNAL_FAILURE`

---

## 11. Deterministic evaluation precedence (fail-closed)

1. Unsafe / malformed structure → `INVALID_INPUT` (or registry invalid)
2. Unsupported version → `UNSUPPORTED_CONTRACT_VERSION`
3. Upstream `NOT_APPLICABLE` → `NOT_APPLICABLE`
4. Forbidden / unapproved evidence classes → fail-closed (no activation)
5. Stale / disputed / superseded → fail-closed
6. Contradictory input/evidence → `BLOCKED_BY_CONTRADICTION` and/or `CONTRADICTORY_INPUT_STATE` per structural channel
7. No validated real registry/catalog → no real positive activation
8. Insufficient structured evidence → `UNRESOLVED_EVIDENCE` with `INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE`
9. Candidate / low-confidence only → `DOCTOR_REVIEW_REQUIRED` (no active promotion)
10. Synthetic technical positive **last** → `SHADOW_ORGAN_SYSTEM_ANNOTATIONS_PROPOSED` (non-clinical, non-promotable)

Also locked:

- No default active system
- No fallback organ/system (including METABOLIC)
- No keyword-only promotion
- No co-involvement auto-confirmation
- No dictionary-order winner
- No clinical candidate→active promotion without separate owner policy
- Unknown real tokens fail closed

---

## 12. Cross-rule boundaries

| Rule | Boundary |
|------|----------|
| **Rule 1** | Parallel SoT; no merge/mutation/overwrite/shared scoring; Rule 3 cannot reinterpret temperament |
| **Rule 2** | Organ/system affinity ≠ polarity; no axis conversion; no formula-slot mutation |
| **Rule 4** | Binding port is **not** Rule 3 implementation; Rule 3 does not call/activate Rule 4; Rule 4 may consume a future typed Rule 3 envelope only under **separate** authorization; potency outside Rule 3 |
| **Rules 6 / 7** | Existing `rule3OrganSystemRef` refs are opaque future consumer refs; Rule 3 must not invent their mappings; their clinical-data posture unchanged |
| **Rule 9** | `RULE9_RULE_IDENTITIES[3]` / `ORGAN_SYSTEM_AFFINITY` label is **not** owner authority to redefine Rule 3; future envelope consumption only under separate orch authorization; Rule 9 must not reinterpret Rule 3 |
| **Triad** | Explicitly separate; no triad composition/selection/mutation in Rule 3 |

---

## 13. Security contract (future implementation)

Fail closed on: Proxy before property access; getters/accessors before invocation; cycles; sparse arrays; symbol keys; non-plain objects; unknown keys; duplicate IDs; unsupported versions; PHI-shaped keys; raw report/image payloads; protected/local paths; unversioned evidence; mutable registry overrides; environment bypass; legacy payload shapes; cross-rule payload substitution.

Also require: Proxy `get` hits = 0 before reject; getter hits = 0 before reject; no fs/net/DB/env/telemetry; no `console.*`; `message === failureCode`; no stack/path/PHI in returned output; deep-frozen registry/output; no paid dependency.

These controls are **technical safety**, not clinical validation.

---

## 14. Output invariants (every future output)

- `ruleIdentity: ORGAN_SYSTEM_AFFINITY`
- `shadowOnly: true`
- Medicine-selection influence `NONE`
- Clinical activation `NONE`
- Prescription effect `NONE`
- Not a clinically activated prescription
- Orchestration/runtime `NOT_CONNECTED`
- Formula/mixture mutation `NONE`
- Doctor-review posture where unresolved
- Empty active annotations when unresolved or unauthorized
- Deterministic fingerprint
- Input non-mutation; defensive clone; recursive deep freeze; stable key order

Rule 3 evidence supply must **not** itself issue or modify a prescription.

---

## 15. Mandatory future proof matrix (P01–P18)

**Documentation targets only — do not execute in this tranche.**

| ID | Proof intent |
|----|----------------|
| **P01** | Exact input schema / version / unknown-key rejection |
| **P02** | Empty registry and real mappings `0` / catalog `NOT_CREATED` |
| **P03** | No evidence → unresolved / information required + `INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE` |
| **P04** | Inventory / schema / owner-review lifecycle cannot activate |
| **P05** | Stale / disputed / superseded fail closed |
| **P06** | Keyword-only remains `LOW_CONFIDENCE_CANDIDATE` / candidate-only |
| **P07** | Co-involvement cannot auto-confirm to active |
| **P08** | No fallback / default system (including METABOLIC) |
| **P09** | Synthetic conjunctive positive path only (`SYS_SYN_*` / `SYNTHETIC_TEST_ONLY`) |
| **P10** | Unknown real organ-system token fail-closed |
| **P11** | No medicine / formula / potency / electricity / Rx influence |
| **P12** | Rule 1 / Rule 2 / Triad separation |
| **P13** | Rule 4 not connected / not activated |
| **P14** | Determinism, order, and fingerprint stability |
| **P15** | Input non-mutation and output deep freeze |
| **P16** | Proxy / getter / cycle / sparse / symbol rejection (zero trap/getter hits) |
| **P17** | Fixed errors; PHI / path leakage prevention |
| **P18** | Package / orchestration / activation / Rx boundaries |

Mechanical count: **exactly 18**. Sequential and unique. Skipped ≠ PASS. **Do not execute** proofs in this documentation tranche.

---

## 16. Future implementation allowlist (do not create in this tranche)

Documented for a **later** separately authorized implementation PR only:

- `packages/rule3/**`
- Root typecheck registration
- Vitest registration
- Workspace lockfile (Rule 3 workspace entry only)
- Rule 3-only `nineRules` metadata alignment (`Organ-System Affinity Engine` / `affectsClinicalSelection: false`)
- Rule 3-only phase5b / phase5c assertions

**Excluded without separate owner authorization:** apps/dashboard mutation, Rule 4 adapter mutation, Rule 6/7/9 orchestration, datasets/catalog, closed real organ-system catalog, medicine registry edits, protected/C3E, legacy checkout, workflows/deployment, clinical activation, production Rx, paid services.

---

## 17. Explicit non-claims

This contract does **not** authorize:

- Package / evaluator / tests
- Real organ-system catalog
- Real mappings / evidence rows
- Candidate→active clinical promotion rule
- Normative scores or thresholds
- Medicine selection / formula mutation
- Potency / dosage / electricity / Tablet / external selection
- Rule 4 integration
- Rule 6/7/9 orchestration
- Clinical activation / production Rx
- C3E / protected access
- Legacy mutation
- Paid services
- Deployment

---

## 18. STOP

**STOP** before:

- Creating `packages/rule3`
- Evaluator / tests implementation
- Executing P01–P18
- Mappings / catalog / closed real organ-system list creation
- Orchestration / activation / production connection
- Rule 4 wiring
- Dashboard / `nineRules.ts` mutation in this tranche
- C3E / SAC / protected-source access
- Legacy mutation / paid services / deployment

Next authorized step after independent review + owner merge of this documentation: **separate** Rule 3 synthetic shadow implementation authorization (not granted here).
