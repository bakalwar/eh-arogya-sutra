# Rule 6 — Relationship-data and evidence-intake contract

## 1. Document control

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** (technical contract + clinical-evidence governance) |
| **Owner decision token** | **`R6_CE_OD01_TO_OD05_RECOMMENDED_DECISIONS_APPROVED`** |
| **Authorization (this documentation)** | **`R6_RELATIONSHIP_DATA_AND_EVIDENCE_INTAKE_CONTRACT_DOCUMENTATION_AUTHORIZED`** |
| **Owner governance directive** | **`ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`** |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |
| **Canonical `origin/main` base (at documentation start)** | `60cbb1f4b59f7d99ea8ff48448b07bf9ccb1a81b` |
| **Companion Rule 6 evaluator contract** | [rule-06-multi-disease-organ-system-triad-contract.md](./rule-06-multi-disease-organ-system-triad-contract.md) |
| **Companion implementation evidence** | [rule-06-multi-disease-organ-system-triad-implementation-evidence.md](./rule-06-multi-disease-organ-system-triad-implementation-evidence.md) |
| **Cross-rule authority** | [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md) |
| **Contract version (this document)** | `ehas2-rule6-relationship-data-contract-v1` |

This document defines how Rule 6 **may eventually** accept owner-controlled medicine-relationship evidence. It does **not** add any real medicine-relationship edge, activate clinical selection, connect orchestration/runtime, access protected sources, resume Rule 5 C3E, or change production prescription output.

**Current active clinical relationship count:** **0**.

---

## 2. Locked owner clinical-evidence decisions (R6-CE-OD-01 … OD-05)

| Decision ID | Owner disposition | Normative effect |
|-------------|-------------------|------------------|
| **R6-CE-OD-01** | **`APPROVE_ZERO`** | Exactly **zero** validated and owner-approved real medicine-relationship edges exist. No medicine pair or clinical relationship may be treated as active. |
| **R6-CE-OD-02** | **`QUEUE_FOR_FUTURE_VALIDATION`** | R5-M6B medicine audits remain **inventory-only** and **non-activating**. They may enter a future validation queue. They must **never** auto-convert into Rule 6 edges. Every clinical meaning still requires explicit owner approval. |
| **R6-CE-OD-03** | **`AUTHORIZE_FUTURE_EVIDENCE_SOURCE_PLANNING`** | Planning for a separate owner-controlled Rule 6 clinical-evidence source is authorized. **Planning only** — not protected discovery/access, C3E, hashes, manifests, edges, activation, runtime, or production. |
| **R6-CE-OD-04** | **`REQUIRE_RELATIONSHIP_DATA_CONTRACT_DOCS_BEFORE_DATA`** | This relationship-data contract (and independent review) is required **before** any real medicine-relationship data is added. |
| **R6-CE-OD-05** | **`MAINTAIN_EMPTY_ACTIVE_REGISTRY_FAIL_CLOSED`** | Until validated evidence **and** explicit owner approval exist, Rule 6 retains an **empty active** clinical relationship registry; shadow-only; fail-closed; orchestration **NOT_CONNECTED**; clinical activation **NONE**. No invented recipes, pairs, formulas, weights, or thresholds. |

---

## 3. Status tokens (current)

- `RULE6_RELATIONSHIP_DATA_CONTRACT_DOCUMENTED`
- `RULE6_EVIDENCE_INTAKE_PLANNING_AUTHORIZED`
- `RULE6_ACTIVE_RELATIONSHIP_REGISTRY_EMPTY`
- `RULE6_REAL_MEDICINE_RELATIONSHIPS_0`
- `RULE6_VALIDATED_RELATIONSHIP_DATA_PENDING`
- `RULE6_R5M6B_INVENTORY_QUEUE_ONLY_NON_ACTIVATING`
- `RULE6_ORCHESTRATION_NOT_CONNECTED`
- `RULE6_CLINICAL_ACTIVATION_NONE`
- `RULE6_PRODUCTION_OUTPUT_UNCHANGED`
- `RULE6_INDEPENDENT_OF_RULE5_C3E`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`

Inherited (unchanged) evaluator posture: `RULE6_SHADOW_EVALUATOR_IMPLEMENTED` · `RULE6_IDENTITY_OWNER_LOCKED` · `RULE6_SCOPE_OWNER_LOCKED`.

---

## 4. Relationship to the evaluator contract (§9 schema)

The evaluator contract already defines the **13-field edge schema** and non-activating states. This document **binds data governance** around that schema.

| Layer | Authority |
|-------|-----------|
| Evaluator behavior / I/O / proofs | [rule-06-multi-disease-organ-system-triad-contract.md](./rule-06-multi-disease-organ-system-triad-contract.md) |
| Relationship **data** provenance, lifecycle, intake, owner batches, empty-registry rules | **This document** |
| Final oral mixture count | Constitution §F / Rule 9 — **OUT_OF_RULE6_SCOPE** |
| Potency / dosage / electricity / Tablet A/B / external / monitoring | **OUT_OF_RULE6_SCOPE** (R6-Q13–18, R6-ID-05) |

Edge field order (normative, unchanged):

1. `edgeId`
2. `sourceMedicineId`
3. `targetMedicineIdOrSet`
4. `directionality` — `DIRECTED` \| `UNDIRECTED`
5. `relationshipType`
6. `applicabilityConditions`
7. `prohibitionConditions`
8. `evidenceSourceId`
9. `evidenceValidationStatus`
10. `ownerClinicalApprovalStatus`
11. `version`
12. `effectiveStatus`
13. `supersessionMetadata`

**No edge may be inferred** from legacy formula co-occurrence, inventory prose, synthetic tests, or AI invention.

---

## 5. Empty active registry and lifecycle rules

### 5.1 Empty active registry (mandatory now)

| Rule | Requirement |
|------|-------------|
| Active edge count | **0** |
| Default registry for clinical meaning | Empty `edges: []` (or equivalent) for any **active** clinical interpretation |
| Synthetic test edges | Allowed **only** inside Rule 6 tests; never promotion to clinical registry without separate owner data authorization |
| Fail-closed | Missing / empty / unvalidated / owner-unapproved evidence → no clinical activation; evaluator outcomes remain non-activating |

### 5.2 Lifecycle vocabulary (documentation; future data must use these labels)

| Lifecycle / effective posture | May influence Rule 6 evaluation? |
|-------------------------------|----------------------------------|
| `draft` | **No** |
| `inventory-only` | **No** |
| `queued-for-validation` | **No** |
| `unvalidated` | **No** |
| `disputed` | **No** |
| `stale` | **No** |
| `superseded` | **No** |
| `missing-evidence` | **No** |
| `owner-unapproved` | **No** |
| `evidence-validated-owner-unapproved` | **No** |
| `owner-approved-inactive` | **No** |
| `approved-and-active` | **Yes — only after separate data authorization + both statuses true** |

`ACTIVE` / `approved-and-active` is **never** a default. Transition into `approved-and-active` requires:

1. documented provenance meeting §7;
2. `evidenceValidationStatus` = validated under owner-approved criteria;
3. `ownerClinicalApprovalStatus` = explicitly approved for that edge version;
4. `effectiveStatus` = active;
5. a **separate** owner authorization to add real relationship data (not granted by this documentation tranche).

### 5.3 Conflict handling

| Conflict class | Required behavior |
|----------------|-------------------|
| Contradictory edges for same pair/type | Fail-closed; do **not** average into approval; mark `disputed` / unresolved |
| Inventory vs registry identity mismatch | Keep inventory non-activating; do not invent a resolving edge |
| Supersession | Newer owner-approved version supersedes prior; superseded edges non-activating |
| Missing required field / provenance | Edge invalid for activation; registry fault or non-activating state |

### 5.4 Versioning

- Every edge carries a monotonic `version` string scoped to `edgeId`.
- Owner clinical approval is **per edge version**.
- Changing clinical meaning of an edge requires a **new version** and new owner approval.
- Registry document itself must carry `registryVersion` (already required by evaluator input).

---

## 6. Owner-controlled evidence-source intake mechanism (planning only)

### 6.1 Purpose

Define how future Rule 6 clinical-evidence may be **proposed for owner review** without accessing protected bytes, legacy checkouts, C3E, hashes, or manifests in this tranche.

### 6.2 Allowed intake classes (future; not executed here)

| Intake class | Description | Current authorization |
|--------------|-------------|----------------------|
| **A. Owner-declared clinical relationship candidates** | Owner (or owner-directed clinician) supplies de-identified relationship candidates in an owner-approved intake form | Planning authorized (R6-CE-OD-03); **no form filled / no data added** by this PR |
| **B. R5-M6B inventory queue** | Existing medicine audit inventory items queued for future validation | Queue allowed (R6-CE-OD-02); **non-activating**; no auto-edge |
| **C. Synthetic / CI fixtures** | Test-only | Never clinical authority |

### 6.3 Forbidden intake (this and next data tranche until separately authorized)

- Protected clinical source discovery, open, read, hash, or manifest
- Rule 5 C3E execution
- Legacy `EH_Arogya_Sutra_App` file harvest
- Database / catalog / runtime / PHI patient records
- Paid API / SaaS / certificate-backed commercial services
- Silent conversion of formula templates or legacy mixtures into edges

### 6.4 Intake record (future technical shape — documentation only)

Each intake candidate **record** (when later authorized) must be PHI-free and include at minimum:

- stable `intakeCandidateId`
- proposed `sourceMedicineId` / `targetMedicineIdOrSet` (canonical registry codes only)
- proposed `relationshipType` and directionality
- claimed evidence summary (no protected path literals)
- provenance class label
- validation status = non-activating until owner approval
- owner review batch ID

Engineering may later implement schemas/validators/tests for this shape **inside approved contracts**. Engineering must **STOP** before assigning clinical meaning or `approved-and-active`.

---

## 7. Validation and provenance requirements

### 7.1 Two independent axes (both required for activation)

| Axis | Field | Meaning |
|------|-------|---------|
| Evidence validation | `evidenceValidationStatus` | Technical/clinical evidence review against owner-approved criteria — **not** invented by engineering |
| Owner clinical approval | `ownerClinicalApprovalStatus` | Explicit owner decision that this edge version may carry clinical meaning for Rule 6 |

Owner approval **alone** does not prove medical evidence completeness. Evidence validation **alone** does not authorize clinical meaning. **Both** are required before `approved-and-active`.

### 7.2 Provenance requirements (before any future activating edge)

Each activating edge must record:

- `evidenceSourceId` (stable, non-PHI, non-protected-path)
- source tier / custody class consistent with product provenance policy
- applicability and prohibition conditions
- version and supersession metadata
- explicit non-use of legacy-inferred co-occurrence

### 7.3 What does **not** count as validation

- File presence in git
- CI PASS / schema PASS
- Shadow evaluator technical proofs (P01–P20)
- R5-M6B documentation audit completion
- Inventory prose or “COMPLETED_INVENTORY_NOT_VALIDATED”
- Synthetic test edges
- AI-generated relationship guesses

---

## 8. Maximum-five owner review batches

### 8.1 Batch rules

| Rule | Requirement |
|------|-------------|
| Batch size | **Maximum 5** clinical decisions per owner review batch |
| Language | Clinical questions in **simple Hindi** (plus stable decision IDs in English tokens) |
| Grouping | Related questions may be grouped; do not re-ask already owner-locked decisions |
| Identifiers | Medicine/disease IDs only if already present in allowed committed non-protected evidence |
| No protected exposure | Never include protected paths, hashes, manifests, PHI, or legacy file contents |
| Empty honesty | If no clinically adequate candidate exists, report **MISSING** — do not manufacture pairs |

### 8.2 Required fields per proposed decision

1. Stable decision ID (e.g. `R6-CE-Bxx-0y`)
2. Exact clinical question (simple Hindi)
3. Identifiers only if already allowed
4. Existing evidence source + classification
5. Recommended disposition
6. Alternatives
7. Safety consequence
8. Whether approval authorizes documentation only vs future shadow-data
9. Explicit owner approval field

### 8.3 First clinical-evidence governance batch (already decided)

`R6-CE-OD-01` … `R6-CE-OD-05` — recorded in §2. Do **not** re-open unless owner revises.

### 8.4 Next clinical batches

Future batches may propose **at most five** concrete relationship or disease-mapping questions **only after**:

1. this contract is independently reviewed and merged;
2. a separate evidence-source / data authorization exists;
3. candidates are drawn from owner intake or queued inventory **without** auto-activation.

---

## 9. Activation rules (fail-closed)

An edge may influence Rule 6 shadow evaluation **only if all** are true:

1. Present in the relationship evidence registry supplied to the evaluator
2. `evidenceValidationStatus` = validated under owner-approved criteria
3. `ownerClinicalApprovalStatus` = explicitly approved for that version
4. `effectiveStatus` = `approved-and-active` (or equivalent active token defined at data-auth time)
5. Not draft / inventory-only / queued / disputed / stale / superseded / missing-evidence / owner-unapproved
6. Separate owner **data** authorization for adding real edges has been issued

Otherwise the edge is **non-activating**. Incomplete multi-endpoint relationships must not yield confident compositions (evaluator contract §12).

**Current posture:** conditions fail → active registry remains **empty**.

---

## 10. Explicit STOP before any real edge

Under **`R6_RELATIONSHIP_DATA_AND_EVIDENCE_INTAKE_CONTRACT_DOCUMENTATION_AUTHORIZED`**:

- Do **not** add real medicine-relationship edges or clinical relationship JSON/data files
- Do **not** auto-convert R5-M6B inventory into edges
- Do **not** invent disease→medicine maps, formulas, weights, or thresholds
- Do **not** connect orchestration / runtime or change production Rx
- Do **not** resume Rule 5 C3E, change Smart App Control, access protected sources, or hash/manifest
- Do **not** modify the legacy repository
- Do **not** use paid APIs / services / certificates
- Do **not** deploy

**Separate owner authorizations required before:** evidence-source execution beyond planning; real relationship data addition; independent clinical review of concrete edges; orchestration connection; production activation.

---

## 11. Delegated technical engineering (within this contract)

Engineering **may** (after merge of this documentation, under separate implementation auth if code is needed):

- design technical schemas/types for intake candidates and empty registries
- canonicalization, validation, deterministic ordering, immutability
- fixed error taxonomy, tests/CI, security/privacy, performance bounds
- PHI-free observability

Engineering **must STOP and ask owner** before deciding or changing:

- medicine relationships or combinations
- disease-to-medicine mapping
- formula composition
- potency or dosage
- electricity
- Tablet A/B
- external applications
- monitoring or clinical outcome interpretation
- clinical thresholds / weights
- evidence validation or clinical approval status for any real edge

---

## 12. Non-claims

This documentation does **not** claim or authorize:

- Electrohomeopathy clinical correctness
- any real medicine relationship
- disease-to-medicine mapping authority
- formula correctness
- thresholds / weights
- production prescription change
- orchestration / runtime connection
- protected-data access or C3E
- legacy replacement
- that owner approval alone equals validated medical evidence

---

## 13. Rule 5 C3E and no-paid independence

- Rule 6 relationship-data governance is **independent** of Rule 5 C3E.
- C3E remains **paused**.
- Smart App Control remains unchanged by this tranche.
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` remains permanent.
