# Rule 1 — Q3 Pre-Contract Owner Decisions (R1-Q3-PC-Q3 … Q16)

## 1. Document control

| Field | Value |
|-------|--------|
| **Title** | Rule 1 — Q3 Pre-Contract Owner Decisions |
| **Phase** | R1-Q3 PRE-CONTRACT |
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Classification** | OWNER_APPROVED_GOVERNANCE_BASELINE |
| **Documentation only** | YES — no runtime, contracts, or clinical activation in this record |
| **implemented** | false |
| **connected** | false |
| **executable** | false |
| **affectsClinicalSelection** | false |
| **clinicalActionAuthorized** | false |
| **medicineMutationAuthorized** | false |
| **potencyMutationAuthorized** | false |
| **dosageMutationAuthorized** | false |
| **evaluationMode** | OFF |
| **deterministicFingerprint** | null |
| **Rule 1** | NOT_IMPLEMENTED |
| **Rule 5** | NOT_IMPLEMENTED |
| **Rule 6** | NOT_STARTED |
| **Production / deployment** | NONE |

---

## 2. Authority and precedence

- **Parent Q3 governance (clinical decisions Q3A–H, Q3G-TIE):** [rule-01-q3-evidence-workflow-owner-decisions.md](./rule-01-q3-evidence-workflow-owner-decisions.md)
- **This document:** Pre-contract **metadata / namespace / vocabulary / validation posture** only (PC-Q3 through PC-Q16).
- **Precedence:** Where this record defines future contract surfaces, it **does not** override Q3 clinical outcomes, Blood/Lymph Q2 integration, OD-013/OD-014, or frozen Rule 1 temperament **body** in [rule-01-temperament-engine.md](./rule-01-temperament-engine.md). Historical equal-tie follow-up prose in that body remains **preserved**; **future implementation** is governed by Q3G revised final + Q3G-TIE + this pre-contract record.
- **Canonical medicine registry:** `ehas2-medicine-registry-v2` — **38** medicines; **C11 excluded**; no restoration or remapping.
- **Question bank:** Initial Q3G D+A question-bank proposal **superseded/rejected**. **No** interactive clinical questions; structured evidence gaps only; exact unresolved tie → **`UNRESOLVED_TIE`**; **`MIXED`** only when genuinely supported — **never** tie fallback.

---

## 3. Decision index (exactly 14)

| ID | Topic | Option |
|----|--------|--------|
| R1-Q3-PC-Q3 | Independent version domains + initial v1 identifiers | **A** |
| R1-Q3-PC-Q4 | Rule 1-owned reference-only OFF foundation | **A** |
| R1-Q3-PC-Q5 | Shared required actions + Rule 1 structured gaps | **A** |
| R1-Q3-PC-Q6 | Shared red-flag statuses + Rule 1 category metadata | **A** |
| R1-Q3-PC-Q7 | Shared eleven-state doctor-gated workflow | **A** |
| R1-Q3-PC-Q8 | Privacy-safe shared provenance + Rule 1 binding | **A** |
| R1-Q3-PC-Q9 | Item-level freshness statuses (separate from Q2 evidenceStatus) | **A** |
| R1-Q3-PC-Q10 | Verification statuses + evidence origin modes | **A** |
| R1-Q3-PC-Q11 | Recorder roles + verification authority types | **A** |
| R1-Q3-PC-Q12 | Nine evidence source types + source authority | **A** |
| R1-Q3-PC-Q13 | Four relationship vocabularies (derivation, duplication, independence, supersession) | **A** |
| R1-Q3-PC-Q14 | Conflict + clinical uncertainty vocabularies | **A** |
| R1-Q3-PC-Q15 | Structural compatibility matrix + Rule 1 applicability overlay | **A** |
| R1-Q3-PC-Q16 | Typed provenance completeness (supersedes PC-Q8 boolean) | **A** |

---

## 4. PC-Q3 — Six immutable version domains

Published version identifiers denote **schema/governance identity only** — not implemented, connected, executable, clinically activated, medicine-selection ready, or production authorized.

**Immutable rule:** Meaningful contract change requires a **new** identifier; v1 objects are not overwritten with changed semantics.

**Independent evolution:** Bumping one domain does not silently bump others.

**No `RULE_SET_VERSION` reuse** for these surfaces. No reuse of Rule 4/Rule 5 version constants as identity for these surfaces.

**No fingerprint version** approved in PC-Q3; until separate approval: `deterministicFingerprint: null`, no hash generation, no `node:crypto`, no fingerprint compatibility claim.

**Future validation:** Exact known versions only; unknown/missing/malformed/incompatible → reject (no coerce, default-latest, silent migration, cross-version merge).

### Exact initial identifiers

| Constant (future) | Identifier |
|-------------------|------------|
| `CLINICAL_GOVERNANCE_EVIDENCE_STATUS_VERSION` | `ehas2-clinical-governance-evidence-status-v1` |
| `CLINICAL_GOVERNANCE_EVIDENCE_CLASS_VERSION` | `ehas2-clinical-governance-evidence-class-v1` |
| `RULE1_Q3_FOUNDATION_VERSION` | `ehas2-rule1-q3-foundation-v1` |
| `RULE1_Q3_AXIS_CLINICAL_VALUES_VERSION` | `ehas2-rule1-q3-axis-clinical-values-v1` |
| `RULE1_Q3_TIE_RESOLUTION_VERSION` | `ehas2-rule1-q3-tie-resolution-v1` |
| `RULE1_Q3_MINIMUM_COMBINATION_VERSION` | `ehas2-rule1-q3-minimum-combination-v1` |

**Export boundary (planning):** Shared evidence versions → `governance/evidence` namespace; Rule 1-specific versions → `rule1` namespace. Root barrel vs subpath → separate implementation review.

---

## 5. PC-Q4 — Rule 1-owned reference-only OFF foundation

- **Ownership:** `packages/clinical-contracts/src/rule1/` (not shared evidence namespace).
- **Purpose:** Governance identity, version references, posture, boundaries — **not** patient assessment, evidence items, medicine candidates, prescriptions, or runtime results.
- **Root identity (future):**
  - `schemaVersion`: `ehas2-rule1-q3-foundation-v1`
  - `schemaKind`: `REFERENCE_ONLY_GOVERNANCE_FOUNDATION`
  - `evaluationMode`: `OFF`
- **Explicit version references (references ≠ activation):**
  - `evidenceStatusVersion`: `ehas2-clinical-governance-evidence-status-v1`
  - `evidenceClassVersion`: `ehas2-clinical-governance-evidence-class-v1`
  - `axisClinicalValuesVersion`: `ehas2-rule1-q3-axis-clinical-values-v1`
  - `tieResolutionVersion`: `ehas2-rule1-q3-tie-resolution-v1`
  - `minimumCombinationVersion`: `ehas2-rule1-q3-minimum-combination-v1`
- **Posture flags (all false; any true → reject):** `implemented`, `connected`, `executable`, `affectsClinicalSelection`, `clinicalActionAuthorized`, `medicineMutationAuthorized`, `potencyMutationAuthorized`, `dosageMutationAuthorized`.
- **`deterministicFingerprint`:** null only; non-null → reject.
- **Behavior (when authorized):** TypeScript-first canonical object; readonly; deep-frozen singleton; no caller object return; no public mutable Set/Map; no runtime fs/path/crypto/process.env activation.
- **Fixture mirror:** Separate allowlist only; TS authoritative.
- **Separation:** Does not extend Rule 4/Rule 5 schemas; does not use `RULE_SET_VERSION` as `schemaVersion`. Rule 5 **engineering patterns** only — not clinical semantics.

---

## 6. PC-Q5 — Shared required actions + Rule 1 structured gaps

### Concept separation (distinct typed fields)

`evidenceStatus`, `requiredActions`, `axisClinicalValue`, `temperamentResolution`, `redFlagStatus`, `structuredGapOutput`, `workflowState` — **no aliasing** (e.g. `NOT_EVALUABLE` ≠ `ADDITIONAL_INFORMATION_REQUIRED`; `UNRESOLVED_TIE` ≠ workflow state).

### Shared required actions — `packages/clinical-contracts/src/governance/actions/`

**Only four approved literals:**

- `ADDITIONAL_INFORMATION_REQUIRED`
- `DOCTOR_REVIEW_REQUIRED`
- `URGENT_DOCTOR_REVIEW_REQUIRED`
- `EMERGENCY_ESCALATION` (only when future rules yield `RED_FLAG_VERIFIED`; not diagnosis/treatment instruction; no medicine/potency/dosage mutation)

**Not approved:** `NONE`, `NO_ACTION_REQUIRED`, `SAFE_TO_CONTINUE`, `AUTO_CONTINUE`, `PASS`, `IGNORE`, `ACKNOWLEDGED_AS_RESOLVED`. Absence of actions ≠ safe/normal/approved.

**Multiple actions** may apply; if array authorized: readonly canonical order (TBD at implementation), no duplicates, no unknowns, order ≠ priority.

### Rule 1 structured gap output — `rule1/`

- Explains why decision incomplete + what **types** of verified information needed; **no** questions, medicine steering, fabrication, or default clinical values.
- **Planning field concepts:** `affectedAxis`, `evidenceStatus`, `missingEvidenceClasses`, `unresolvedTemperamentCandidates`, conflicting/stale/unverified refs, `requiredVerification`, `requiredActions`, `reevaluationRequired`, `ownerDecisionAnchor`, `policyVersionReferences`, `deterministicAuditContext` (exact names → implementation allowlist).
- **No-question:** gaps are not interactive prompts; Q3G question bank remains superseded.

**Version:** PC-Q5 does **not** approve action/gap version ids; PC-Q4 foundation not expanded silently for them.

---

## 7. PC-Q6 — Shared red-flag statuses + Rule 1 category boundary

### Shared — `packages/clinical-contracts/src/governance/safety/`

**Four status literals only:**

- `RED_FLAG_NOT_EVALUATED`
- `RED_FLAG_SUSPECTED`
- `RED_FLAG_VERIFIED`
- `NO_RED_FLAG_SUPPORTED_AFTER_COMPLETE_ASSESSMENT` (≠ universal safety / future emergency impossible / treatment success)

**Not** Rule 1 evaluator, Rule 5 hard-blocker implementation, emergency diagnosis engine, or treatment instruction module.

### Rule 1 — category-level candidate metadata (non-executable)

Blood/Lymph/cross-axis **category labels** per Q3H planning; no stable IDs, thresholds, or executable mappings in this record.

**Relationships (governance, not executable mapping):** `RED_FLAG_SUSPECTED` may require `URGENT_DOCTOR_REVIEW_REQUIRED`; `RED_FLAG_VERIFIED` may require `EMERGENCY_ESCALATION`. `SAFETY_RED_FLAG` evidence class remains separate.

**`ordinaryEvaluationHold`:** boolean metadata — not action, workflow state, or medicine result; not cleared by acknowledgment alone.

---

## 8. PC-Q7 — Shared eleven-state doctor-gated workflow

**Namespace:** `packages/clinical-contracts/src/governance/workflow/`

**Canonical sequence (11 literals):**

1. `INPUT_RECORDED`
2. `SYSTEM_ANALYSIS_COMPLETED`
3. `SYSTEM_DRAFT_SUMMARY_CREATED`
4. `DOCTOR_SUMMARY_REVIEW_REQUIRED`
5. `DOCTOR_SUMMARY_APPROVED`
6. `DRAFT_PRESCRIPTION_CREATED`
7. `DOCTOR_PRESCRIPTION_REVIEW_REQUIRED`
8. `DOCTOR_CORRECTION_RECORDED` (conditional)
9. `FULL_SAFETY_REVALIDATION_REQUIRED` (conditional)
10. `FINAL_DOCTOR_APPROVAL`
11. `FINAL_PRESCRIPTION_CREATED`

Workflow state ≠ clinical PASS; draft ≠ final; approval ≠ evidence verified or blocker override.

**Naming distinction:** `DOCTOR_SUMMARY_REVIEW_REQUIRED` (workflow) ≠ `DOCTOR_REVIEW_REQUIRED` (required action).

Steps 8–9 conditional on material correction; transition graph → separate contract approval.

**No interactive clinical questions** at any state; gaps/actions/reassessment only.

**Version:** PC-Q7 does not approve workflow version ids; not owned by Rule 1 foundation.

---

## 9. PC-Q8 — Privacy-safe shared provenance + Rule 1 binding

**Shared envelope:** `governance/evidence/` — class, source category, observed/reported/verified path, temporal refs, policy/version, duplicate/derived/superseded/conflict flags — **not** raw clinical bodies.

**Rule 1 binding extension:** `rule1/` — `affectedAxis`, temperament relationship, disease/organ context refs, min-combination contribution, gap links — **no** raw symptom/diagnosis/report content.

**PC-Q8 planning `provenanceComplete` boolean:** planning-only; **superseded/refined by PC-Q16** (`provenanceCompletenessStatus` + `provenanceIncompletenessReasonCategories`). **Do not** implement boolean `provenanceComplete` as canonical authority.

**Deferred closed vocabularies (separate owner decisions):** `sourceType` literals (see PC-Q12), `observedOrReported`, `verificationRole`, `verificationStatus` (PC-Q10), `freshnessStatus` (PC-Q9), completeness reasons (PC-Q16), conflict types, supersession types.

**References:** opaque, non-clinical, patient-safe for governance transport; no PHI in logs/CI/fingerprints/errors.

---

## 10. PC-Q9 — Four item-level freshness statuses

**Separate from Q2 assessment `evidenceStatus`** (e.g. `STALE_EVIDENCE`).

| Literal |
|---------|
| `FRESHNESS_NOT_EVALUATED` |
| `FRESHNESS_CURRENT_UNDER_APPLICABLE_POLICY` |
| `FRESHNESS_STALE_UNDER_APPLICABLE_POLICY` |
| `FRESHNESS_UNDETERMINED` |

No universal durations approved. Missing time ≠ current. Supersession ≠ freshness (`SUPERSEDED` not in freshness enum).

No automatic item→assessment mapping authorized in PC-Q9.

---

## 11. PC-Q10 — Five verification statuses + seven origin modes

### `verificationStatus` (item-level)

- `VERIFICATION_NOT_EVALUATED`
- `VERIFICATION_PENDING`
- `VERIFIED_UNDER_APPLICABLE_POLICY`
- `VERIFICATION_FAILED`
- `VERIFICATION_UNDETERMINED`

≠ `evidenceStatus`; ≠ `freshnessStatus`.

### `evidenceOriginMode`

- `PATIENT_REPORTED`
- `AUTHORIZED_REPRESENTATIVE_REPORTED`
- `CLINICIAN_OBSERVED`
- `CLINICIAN_CONFIRMED`
- `DEVICE_MEASURED`
- `DOCUMENT_OR_REPORT_DERIVED`
- `EVIDENCE_ORIGIN_UNDETERMINED`

No silent promotion (patient→observed, report→diagnosis, pending→verified, etc.).

≠ `evidenceClass`; compatibility examples are non-executable.

---

## 12. PC-Q11 — Three recorder roles + five verification authorities

### `evidenceRecorderRole`

- `CLINICIAN_RECORDED`
- `AUTHORIZED_INGESTION_PROCESS_RECORDED`
- `RECORDER_ROLE_UNDETERMINED`

Recording ≠ changing origin mode. Ingestion ≠ clinician/diagnosis/verification/medicine selection; no interactive questions.

### `verificationAuthorityType`

- `CLINICIAN_VERIFICATION_AUTHORITY`
- `AUTHORIZED_SOURCE_VERIFICATION_PROCESS`
- `AUTHORIZED_DEVICE_VERIFICATION_PROCESS`
- `AUTHORIZED_STRUCTURAL_VALIDATION_PROCESS`
- `VERIFICATION_AUTHORITY_UNDETERMINED`

Structural validation ≠ clinical verification. Authority present ≠ verification complete.

**Not** persistence/RBAC role aliases. **No default self-verification.**

---

## 13. PC-Q12 — Nine evidence source types

- `CLINICAL_HISTORY_RECORD_SOURCE`
- `CLINICAL_EXAMINATION_RECORD_SOURCE`
- `VITAL_MEASUREMENT_SOURCE`
- `CLINICIAN_AUTHORED_CONDITION_RECORD_SOURCE`
- `LABORATORY_REPORT_SOURCE`
- `IMAGING_REPORT_SOURCE`
- `PATHOLOGY_REPORT_SOURCE`
- `OTHER_AUTHORIZED_INVESTIGATION_REPORT_SOURCE` (not catch-all; unknown not defaulted)
- `EVIDENCE_SOURCE_TYPE_UNDETERMINED`

**No `PHOTO_SOURCE`** in PC-Q12 — separate future decision.

**Non-authoritative as patient evidence:** registry/materia-medica narrative, legacy scores/mappings, synthetic/test output, generated summary/Rx, search keyword, unbound OCR, AI clinical statements.

≠ `evidenceOriginMode`; ≠ `evidenceClass`; presence ≠ verification.

---

## 14. PC-Q13 — Four relationship vocabularies (three literals each)

**No single overloaded relationship enum.**

| Field | Values |
|-------|--------|
| `evidenceDerivationStatus` | `ORIGINAL_SOURCE_EVIDENCE_ITEM`, `DERIVED_FROM_OTHER_EVIDENCE_ITEM`, `EVIDENCE_DERIVATION_UNDETERMINED` |
| `evidenceDuplicationStatus` | `NO_DUPLICATE_IDENTIFIED_AFTER_PROVENANCE_REVIEW`, `DUPLICATE_OF_OTHER_EVIDENCE_ITEM`, `EVIDENCE_DUPLICATION_UNDETERMINED` |
| `evidenceIndependenceStatus` | `INDEPENDENT_EVIDENCE_CHAIN`, `SAME_EVIDENCE_CHAIN`, `EVIDENCE_INDEPENDENCE_UNDETERMINED` |
| `evidenceSupersessionStatus` | `NOT_SUPERSEDED_UNDER_AVAILABLE_PROVENANCE`, `SUPERSEDED_BY_NEWER_OR_CORRECTED_EVIDENCE`, `EVIDENCE_SUPERSESSION_UNDETERMINED` |

Four-way orthogonality — no inferring three fields from one.

Q3D/Q3E independence rules apply; executable counter not authorized.

---

## 15. PC-Q14 — Conflict and clinical uncertainty

### `evidenceConflictStatus` (4)

- `CONFLICT_NOT_EVALUATED`
- `NO_MATERIAL_CONFLICT_IDENTIFIED_AFTER_REVIEW`
- `MATERIAL_CONFLICT_IDENTIFIED`
- `CONFLICT_STATUS_UNDETERMINED`

### `evidenceConflictReasonCategories` (10)

- `SOURCE_OR_PROVENANCE_CONFLICT`
- `TEMPORAL_OR_CLINICAL_EPISODE_CONFLICT`
- `VERIFICATION_RECORD_CONFLICT`
- `FRESHNESS_OR_SUPERSESSION_CONFLICT`
- `SYMPTOM_SIGN_OR_EXAMINATION_CONFLICT`
- `VITAL_OR_MEASUREMENT_CONTEXT_CONFLICT`
- `DIAGNOSIS_INVESTIGATION_CONFLICT`
- `DISEASE_ORGAN_CONTEXT_CONFLICT`
- `TEMPERAMENT_AXIS_RELATIONSHIP_CONFLICT`
- `CONFLICT_REASON_UNDETERMINED`

### `clinicalUncertaintyStatus` (4)

- `CLINICAL_UNCERTAINTY_NOT_EVALUATED`
- `NO_MATERIAL_CLINICAL_UNCERTAINTY_IDENTIFIED_AFTER_REVIEW`
- `MATERIAL_CLINICAL_UNCERTAINTY_PRESENT`
- `CLINICAL_UNCERTAINTY_STATUS_UNDETERMINED`

### `clinicalUncertaintyReasonCategories` (8)

- `ALTERNATIVE_CLINICAL_CAUSES_UNRESOLVED`
- `CLINICAL_INTERPRETATION_REQUIRED`
- `AXIS_RELEVANCE_UNCLEAR`
- `DISEASE_ORGAN_LINK_UNCLEAR`
- `EVIDENCE_COMBINATION_INCOMPLETE`
- `SOURCE_CLINICAL_MEANING_UNCLEAR`
- `CONTEXT_OR_SEVERITY_INSUFFICIENT`
- `CLINICAL_UNCERTAINTY_REASON_UNDETERMINED`

Conflict ≠ uncertainty; no silent inference to Q2 `evidenceStatus` (mappings non-executable in PC-Q14). No automatic source precedence.

---

## 16. PC-Q15 — Compatibility matrix + Rule 1 applicability overlay

### Layer 1 — Shared structural matrix (`governance/evidence/`)

**`compatibilityResult` (5):**

- `COMPATIBILITY_NOT_EVALUATED`
- `COMPATIBLE_UNDER_EXPLICIT_POLICY`
- `CONDITIONALLY_COMPATIBLE_UNDER_EXPLICIT_POLICY`
- `INCOMPATIBLE_UNDER_EXPLICIT_POLICY`
- `COMPATIBILITY_UNDETERMINED`

Explicit matrix rows only — **no Cartesian default**, no uncontrolled wildcards (`ANY`, `ALL`, `DEFAULT`, `OTHERWISE_ALLOW`, `UNKNOWN_AS_ALLOWED`).

Structural compatibility ≠ verified/sufficient/axis/medicine/PASS.

### Layer 2 — Rule 1 clinical-applicability overlay (`rule1/`)

Axis applicability, temperament support link, disease/organ relevance, Q3D contribution — **not** substitute for shared compatibility.

Q3D counting rules require future validation (compatibility + applicability + verification/freshness + independence + conflict/uncertainty + classes + context); **evaluator not authorized**.

---

## 17. PC-Q16 — Typed provenance completeness

**Supersedes PC-Q8 `provenanceComplete` boolean.**

### `provenanceCompletenessStatus` (4)

- `PROVENANCE_COMPLETENESS_NOT_EVALUATED`
- `PROVENANCE_COMPLETE_UNDER_APPLICABLE_POLICY`
- `PROVENANCE_INCOMPLETE_UNDER_APPLICABLE_POLICY`
- `PROVENANCE_COMPLETENESS_UNDETERMINED`

### `provenanceIncompletenessReasonCategories` (13)

- `MISSING_EVIDENCE_SOURCE_TYPE`
- `MISSING_OPAQUE_SOURCE_REFERENCE`
- `MISSING_EVIDENCE_ORIGIN_MODE`
- `MISSING_EVIDENCE_RECORDER_ROLE`
- `MISSING_VERIFICATION_AUTHORITY_TYPE`
- `MISSING_VERIFICATION_STATUS`
- `MISSING_TEMPORAL_PROVENANCE`
- `MISSING_CLINICAL_EPISODE_REFERENCE`
- `MISSING_PROTECTED_BINDING_CONFIRMATION`
- `MISSING_POLICY_OR_VERSION_REFERENCE`
- `MISSING_RELATIONSHIP_OR_LINEAGE_METADATA`
- `CONFLICTING_PROVENANCE_METADATA`
- `PROVENANCE_INCOMPLETENESS_REASON_UNDETERMINED`

Incomplete status requires non-empty reason list (unless future explicit policy exception). No synthetic completion/backfill.

≠ `verificationStatus`; ≠ PC-Q15 compatibility; ≠ Q2 `evidenceStatus` (no automatic whole-assessment mapping).

---

## 18. Namespace ownership map (future — not created by this record)

| Path | Owns |
|------|------|
| `packages/clinical-contracts/src/governance/evidence/` | Evidence status/class; provenance; freshness; verification; origin; recorder/authority; source; relationships; conflict/uncertainty; compatibility; completeness |
| `packages/clinical-contracts/src/governance/actions/` | Four required actions |
| `packages/clinical-contracts/src/governance/safety/` | Four red-flag statuses |
| `packages/clinical-contracts/src/governance/workflow/` | Eleven workflow states |
| `packages/clinical-contracts/src/rule1/` | Q3 foundation; axis values; tie; min-combination; structured gaps; red-flag category metadata; provenance binding; clinical-applicability overlay |

---

## 19. Cross-domain collision prohibitions

- Do **not** alias Q2/Q3 governance tokens with Rule 4 slot `evidenceStatus`, Rule 5 `R5_*` / `RULE5_*` codes, persistence finding verification enums, or `ClinicalRuleStatus` without explicit adapter + version gate.
- Do **not** treat `RULE_SET_VERSION` as schema version for Q3 pre-contract surfaces.
- Do **not** merge assessment-level `evidenceStatus`, item-level freshness/verification/completeness, workflow states, required actions, or red-flag statuses.
- Do **not** use `MIXED` as equal-tie **fallback** for unresolved programming ties; Rule 1 **v1** equal highest scores after eligibility are a valid **`MIXED_TEMPERAMENT`** co-dominant profile per `OWNER-FREEZE-OD-R1-IMPL-07-MIXED-TEMPERAMENT-v1` (prior equal-top → `UNRESOLVED_TIE` **superseded** for that profile case). Interactive question bank remains forbidden (Q3G-TIE).
- Do **not** implement boolean `provenanceComplete` as authority (PC-Q16 supersedes).

---

## 20. Validation and privacy posture (future)

Fail-closed validators: unknown vocabulary; field swaps; true posture/executable flags; non-null clinical fingerprint; question-bank fields; raw PHI/clinical bodies; caller-value echo in errors; incompatible versions; uncontrolled matrix wildcards; duplicate reason categories; independent count for same-chain/duplicate/superseded items.

Logs, CI, fingerprints, and reason-code strings: **no** raw PHI.

---

## 21. Explicit non-authorization (this record)

Does **not** authorize: folders/files; TypeScript/JSON contracts; fixtures; validators/tests (executable); serializers; migration adapters; package exports; evidence catalogs; extractors; evaluators; Rule 1/5/6 implementation; medicine selection; potency/dosage; UI/runtime; DB; deployment.

---

## 22. Implementation prerequisites (planning)

1. Documentation alignment (R1-T10–T12) and this owner record merged to main.
2. Owner-approved implementation allowlist per milestone (vocabulary-only foundation before validators before evaluators).
3. Separate owner decisions for deferred version ids (actions, gaps, workflow, red-flag catalog, provenance sub-vocabularies, compatibility rows, completeness policies, photo source type, binding status vocabulary).
4. R1-T* executable tests only when Rule 1 implementation explicitly authorized.

---

## 23. Decision-count and literal-count audit appendix

| Audit item | Count |
|------------|------:|
| Owner decisions (PC-Q3 … PC-Q16) | **14** |
| PC-Q3 version identifiers | **6** |
| Required actions (PC-Q5) | **4** |
| Red-flag statuses (PC-Q6) | **4** |
| Workflow states (PC-Q7) | **11** |
| Freshness statuses (PC-Q9) | **4** |
| Verification statuses (PC-Q10) | **5** |
| Origin modes (PC-Q10) | **7** |
| Recorder roles (PC-Q11) | **3** |
| Verification authority types (PC-Q11) | **5** |
| Source types (PC-Q12) | **9** |
| Relationship status literals (PC-Q13, 4×3) | **12** |
| Conflict statuses (PC-Q14) | **4** |
| Conflict reason categories (PC-Q14) | **10** |
| Uncertainty statuses (PC-Q14) | **4** |
| Uncertainty reason categories (PC-Q14) | **8** |
| Compatibility results (PC-Q15) | **5** |
| Completeness statuses (PC-Q16) | **4** |
| Incompleteness reason categories (PC-Q16) | **13** |

**Authority tag:** OWNER_APPROVED_GOVERNANCE_BASELINE · **Runtime:** NOT_CONNECTED · **Clinical selection:** NOT_AUTHORIZED
