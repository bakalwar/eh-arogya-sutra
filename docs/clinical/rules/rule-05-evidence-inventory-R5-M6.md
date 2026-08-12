# Rule 5 — R5-M6A evidence / data inventory (documentation only)

## 1. Document control

| Field | Value |
|-------|--------|
| **Repository** | `https://github.com/bakalwar/EH_AROGYA_SUTRA_2` |
| **Canonical base SHA** | `0516808773d85438ba5c64f1faa6c6fe61f4caea` (merge of PR #13 — R5-M5 monitoring-plan schema) |
| **Phase** | **R5-M6A** |
| **Status** | **DOCUMENTATION_ONLY** |
| **evidenceActivated** | **NONE** |
| **thresholdsAuthorized** | **NONE** |
| **Rule 5 runtime** | **NOT_IMPLEMENTED** (`packages/clinical-contracts/src/nineRules.ts` — `phase5bStatus: NOT_IMPLEMENTED`, `affectsClinicalSelection: false`) |
| **AnalyzeComplete / orchestration** | **NOT_CONNECTED** (`ORCHESTRATION_STATUS = NOT_CONNECTED` in `nineRules.ts`) |
| **Owner** | Dr. Ghanshyam Bakalwar (product owner; governance via `rule-05-owner-decisions-R5-M0.md`) |
| **Document date** | 2026-08-06 |
| **Source audit status** | R5-M6 controlled read-only evidence/data audit completed; verdict **`R5_M6_AUDIT_COMPLETE_EVIDENCE_NOT_ACTIVATED`**; this file is the formal **M6A** inventory record only |

### Mandatory non-claims (this document)

| Claim | Value |
|-------|--------|
| Evidence activated | **NONE** |
| Thresholds authorized | **NONE** |
| Clinical sources approved by this document | **NONE** |
| Runtime behavior changed | **NO** |
| Rule 5 implemented | **NO** |
| Rule 5 connected | **NO** |
| R5-M7 started | **NO** |
| Clinical trigger authorized | **NO** |

### Separation principles (authoritative for readers)

- **File presence ≠ clinical validation** — an artifact on disk or in git does not prove clinical correctness.
- **Schema validation ≠ clinical validation** — contract/fixture tests prove structure, not medical truth.
- **Owner governance approval ≠ evidence activation** — OD-R5-M0 field lists and policies do not activate monitoring evidence.
- **CI PASS ≠ clinical correctness** — automated tests do not substitute for clinical review.
- **M6 audit / M6A documentation completion ≠ ACTIVE evidence** — no source in this inventory is marked ACTIVE for automation.
- **No clinical trigger is authorized** — follow-up, pause/stop, emergency, AE, or threshold automation remains blocked until later authorized milestones and gates.

---

## 2. Authority hierarchy

| Classification | Meaning | May drive Rule 5 automation? |
|----------------|---------|------------------------------|
| **OWNER_APPROVED_GOVERNANCE** | Owner-recorded policy, roadmap, lifecycle vocabulary, matrix gates | **No** (policy only) |
| **CLINICALLY_VALIDATED_EVIDENCE** | Independently clinically reviewed evidence with documented provenance and version | **Only** after separate activation approval and all gates |
| **STRUCTURE_VALIDATED_ONLY** | Passes schema/contract tests; no clinical truth claim | **No** |
| **SOURCE_PRESENT_UNVALIDATED** | Bytes exist; provenance/clinical review incomplete or not proven | **No** |
| **SYNTHETIC_VALIDATION_ONLY** | Test/CI fixtures; not a clinical corpus | **No** |
| **IMPLEMENTATION_REFERENCE_ONLY** | Code/tooling scaffolds; not clinical authority | **No** |
| **LEGACY_REFERENCE_ONLY** | Non-canonical or quarantined legacy references | **No** |
| **PLACEHOLDER** | Named slots without bound evidence | **No** |
| **MISSING** | Required body not present or not installed | **No** |
| **CONFLICTING** | Candidate/unmerged content vs canonical main | **No** (not authority) |
| **EXCLUDED_BY_SAC_003** | Rule 4 TH/DA assets excluded from clinical selection without separate approval | **No** |
| **AUTHORITY_UNKNOWN** | Provenance, license, or owner clinical anchor not established | **No** |

Do **not** classify an asset as **CLINICALLY_VALIDATED_EVIDENCE** merely because: the file exists, tests pass, schema validates, a candidate branch used it, legacy code used it, the owner approved a **field name**, or CI is green.

---

## 3. Complete evidence inventory

**Inventory count:** **22** evidence rows (21 audit-minimum IDs plus **EV-R5-001** for canonical Rule 5 interface posture on `main`).

| Evidence ID | Exact path / source | Type | Purpose (Rule 5) | Version | Provenance | License status | Owner authority | Schema validation | Clinical validation | Activation approval | Connectivity | Lifecycle state | PHI risk | Final classification |
|-------------|---------------------|------|------------------|---------|------------|----------------|-----------------|-------------------|---------------------|---------------------|--------------|-----------------|----------|------------------------|
| **EV-GOV-001** | `docs/clinical/rules/rule-05-owner-decisions-R5-M0.md` | Governance doc | Reason registry, matrix gates, monitoring fields, lifecycle, roadmap (OD-R5-M0-003–022) | R5-M0 consolidated register | Owner relay session recorded in file header | Internal product governance | **Yes** (governance) | N/A (markdown) | N/A (policy) | **No** | None | **NOT_VERIFIED** (vocabulary only) | Low | **OWNER_APPROVED_GOVERNANCE** |
| **EV-GOV-002** | `docs/clinical/CLINICAL_PRODUCT_CONSTITUTION.md` (OD-013, OD-014) | Constitution | 3/4/5 oral-mixture context; insufficient-evidence fail-closed framing | Constitution baseline on `main` | Product constitution | Internal | **Yes** (policy) | N/A | Policy context only | **No** | None | **NOT_VERIFIED** | Low | **OWNER_APPROVED_GOVERNANCE** |
| **EV-R5M2-001** | `fixtures/rule5/reason-code-registry.clinical.v2.json` + `packages/clinical-contracts/src/rule5/reasonCodes.ts` | Contract fixture + TS | 34 clinical `R5_*` reason codes | Registry v2 | M2 merge on `main` | Internal | Owner via M0/M2 scope | **Yes** (unit tests) | **Not proven** | **No** | Package import only | **NOT_VERIFIED** | Low | **STRUCTURE_VALIDATED_ONLY** |
| **EV-R5M3-001** | `fixtures/rule5/hard-blocker-matrix.v1.json` + `hardBlockerMatrix.ts` | Contract fixture | 16 conditions / 17 mappings; safety groups; evidence/threshold policy markers | Matrix v1 | M3 merge | Internal | OD-R5-M0-008/009 | **Yes** | **Not proven** (blocker semantics) | **No** | None | **NOT_VERIFIED** | Low | **STRUCTURE_VALIDATED_ONLY** |
| **EV-R5M4-001** | `fixtures/rule5/contract-foundation.v1.json` + Rule 5 contract modules | Contract fixture | Envelope posture; `deterministicFingerprint: null` | Contract foundation v1 | M4 merge | Internal | M4 scope | **Yes** | **Not proven** | **No** | None | **NOT_VERIFIED** | Low | **STRUCTURE_VALIDATED_ONLY** |
| **EV-R5M5-001** | `fixtures/rule5/monitoring-plan-schema.v1.json` + monitoring-plan modules | Schema definition | 11 MPF reference-only fields; missing-plan policy metadata | `ehas2-rule5-monitoring-plan-schema-v1` | M5 merge (PR #13) | Internal | OD-R5-M0-003/006 | **Yes** | **No** (`clinicalValuesAuthorized: false`) | **No** | None | **NOT_VERIFIED** | Low | **STRUCTURE_VALIDATED_ONLY** |
| **EV-GATE-001** | M3 matrix `evidenceGate` / cross-cutting governance | Policy literal | `EVIDENCE_AUDIT_REQUIRED_BEFORE_ACTIVATION` | Matrix v1 | M3 fixture | Internal | OD-R5-M0-008 | N/A | N/A | **No** | None | **NOT_VERIFIED** | None | **OWNER_APPROVED_GOVERNANCE** |
| **EV-GATE-002** | M3 `thresholdPolicy`; M5 `thresholdPolicy` | Policy literal | `NO_THRESHOLD_AUTHORIZED` | v1 | M3/M5 | Internal | OD-R5-M0-003/008 | N/A | No numeric values authorized | **No** | None | **NOT_VERIFIED** | None | **OWNER_APPROVED_GOVERNANCE** |
| **EV-MED-001** | `packages/medicine-registry/src/medicines.v1.json`, `registry.manifest.json`, `index.ts` | Structured registry | Medicine identity and descriptive metadata (not Rule 5 safety graph) | `ehas2-medicine-registry-v1` | Package manifest fingerprints (`sourceFingerprint`, `artifactSha256`) | **UNKNOWN** (not stated in manifest) | Structure/count only | **Yes** (count, C11, SHA) | **Not proven** | **No** | Build/test import | **NOT_VERIFIED** | Low (no PHI in JSON) | **SOURCE_PRESENT_UNVALIDATED** |
| **EV-MED-002** | SQLite medicines seed (referenced in manifest notes) | Legacy seed | Anti-pattern: 38 rows without C11 | N/A | Documented non-canonical in manifest | N/A | **Explicitly rejected** | N/A | N/A | **No** | Must not be canonical | **WITHDRAWN** (for canonical use) | Low | **LEGACY_REFERENCE_ONLY** |
| **EV-DS-001** | `packages/clinical-data-manifest/src/index.ts`; path `data/clinical-artifacts/disease-package-v1` (gitignored) | Manifest + policy | Expected full disease corpus **116,284** records | `ehas2-disease-v1` | Phase 5B; `EXPECTED_SOURCE_DB_SHA256` constant | **UNKNOWN** | Engineering expectation | **Partial** (constants only) | **Not proven** | **No** | **Not installed on canonical clone by default** | **MISSING** (full artifact) | Low if synthetic source only | **SOURCE_PRESENT_UNVALIDATED** / **MISSING** |
| **EV-DS-002** | `fixtures/synthetic/clinical/disease-package-tiny/` | Synthetic fixture | CI disease extraction smoke test | `ehas2-disease-v1` tiny | `SYNTHETIC-CI-ONLY` fingerprint in manifest | Internal test | **No** clinical corpus | **Yes** (11 records per manifest/jsonl) | **No** | **No** | Test-only | **NOT_VERIFIED** | Low | **SYNTHETIC_VALIDATION_ONLY** |
| **EV-DS-003** | `tools/clinical-extract/` (`extract-diseases.mjs`, `extract-medicines.mjs`, etc.) | Tooling | Offline package generation | Phase 5B scripts | Repo tooling | Internal | **No** | N/A | **No** | **No** | Dev/CI | **NOT_VERIFIED** | Low | **IMPLEMENTATION_REFERENCE_ONLY** |
| **EV-R4-TH** | `docs/clinical/rules/rule-04-SAC-003-freeze-clarification.md` §4; `rule-04-owner-decisions-DRAFT.md` (pointers only) | Excluded thresholds register | TH-01–TH-04 potency/threshold topics | **NOT_FROZEN** / pending | Rule 4 owner docs | N/A | Excluded per SAC-003 | N/A | **NOT_AUTHORIZED_FOR_CLINICAL_USE** | **No** | Rule 4 shadow-only | **NOT_VERIFIED** | N/A | **EXCLUDED_BY_SAC_003** |
| **EV-R4-DA** | `rule-04-SAC-003-freeze-clarification.md` §5 | Excluded data assets | DA-01–DA-07 deferred assets | **SEPARATE_*_FREEZE_PENDING** | Rule 4 register | **UNKNOWN** | Excluded per SAC-003 | N/A | **NOT_AUTHORIZED_FOR_CLINICAL_USE** | **No** | Not executable | **NOT_VERIFIED** | N/A | **EXCLUDED_BY_SAC_003** |
| **EV-R4-EDU** | `rule-04-owner-decisions-DRAFT.md` (educational potency material) | Educational reference | Must not become executable Rule 4/5 evidence | DRAFT | Rule 4 doc | N/A | Owner recorded EDUCATIONAL_REFERENCE_ONLY | N/A | **No** | **No** | None | **NOT_VERIFIED** | Low | **IMPLEMENTATION_REFERENCE_ONLY** |
| **EV-MON-001** | M5 MPF-001–MPF-011 field keys in `monitoring-plan-schema.v1.json` | Schema labels | Names **what could** be monitored; all `reference: null` | M5 schema v1 | OD-R5-M0-003 | Internal field names | **Yes** (labels only) | **Yes** | **No** targets chosen | **No** | None | **MISSING** (no bound evidence) | None | **PLACEHOLDER** |
| **EV-CAND-001** | Git commits `0508e52`, `b1ccfb5` (not on `main`; OD-R5-M0-021) | Candidate branch history | Prior Rule 5 shapes | Candidate | **Not merged** | **UNKNOWN** | **Not authority** | Stale vs M4/M5 | **No** | **No** | N/A | **NOT_VERIFIED** | Unknown | **CONFLICTING** / **LEGACY_REFERENCE_ONLY** |
| **EV-SYN-001** | `fixtures/synthetic/clinical/golden/cases.json` (+ related synthetic clinical fixtures) | Synthetic golden | Orchestrator/engine CI | Synthetic | Phase docs | Internal test | **No** | **Yes** (CI) | **No** | **No** | Test harness | **NOT_VERIFIED** | Low (synthetic) | **SYNTHETIC_VALIDATION_ONLY** |
| **EV-ENG-001** | `apps/clinical-engine/` (orchestrator scaffold) | Runtime scaffold | Nine-rule orchestration; Rule 5 not wired | `ehas2-clinical-engine-scaffold-v1` | Repo | Internal | **No** Rule 5 evaluator | N/A | **No** | **No** | Synthetic path only | **NOT_VERIFIED** | Low | **IMPLEMENTATION_REFERENCE_ONLY** |
| **EV-LIFE-001** | OD-R5-M0-017 in `rule-05-owner-decisions-R5-M0.md` | Governance vocabulary | ACTIVE, EXPIRED, SUSPENDED, … | M0 | Owner | Internal | **Yes** (labels) | N/A | N/A | **No** | **Not implemented in code on `main`** | **NOT_VERIFIED** (no catalog rows) | None | **OWNER_APPROVED_GOVERNANCE** |
| **EV-R5-001** | `packages/clinical-contracts/src/nineRules.ts` | Interface registry | Rule 5 `NOT_IMPLEMENTED`, `affectsClinicalSelection: false`; orchestration `NOT_CONNECTED` | `RULE_SET_VERSION` on `main` | Canonical contracts | Internal | Product posture | **Yes** (type/tests) | N/A | **No** | **Not connected** | **NOT_VERIFIED** | None | **OWNER_APPROVED_GOVERNANCE** / **IMPLEMENTATION_REFERENCE_ONLY** |

---

## 4. Evidence lifecycle vocabulary

Owner-approved states (OD-R5-M0-017):

| State | Meaning (documentation) |
|-------|-------------------------|
| **ACTIVE** | Validated, owner-approved, and separately activation-approved for use in triggers/thresholds |
| **EXPIRED** | Time-bound validity ended; must not drive automation |
| **SUSPENDED** | Temporarily withheld; fail-closed |
| **WITHDRAWN** | Retired; must not drive automation |
| **SUPERSEDED** | Replaced by a newer evidence version |
| **NOT_VERIFIED** | Provenance/clinical/activation path incomplete |
| **MISSING** | Required evidence body absent |

**Clarifications**

- **This document does not set any source to ACTIVE.**
- Transition rules, assigners, persistence, and audit records for lifecycle changes are **deferred to R5-M14+** (and related legal/privacy work).
- Only future **validated + owner-approved + separately activation-approved** evidence may become **ACTIVE** for automation.

---

## 5. Multi-axis evidence status

Record these **independent** axes (no single composite “safe” flag):

| Axis | Description |
|------|-------------|
| **sourcePresent** | Bytes or governance text exists in repo or approved artifact path |
| **provenanceVerified** | Authoritative chain documented and verified |
| **licenseVerified** | Legal permission to use/store/process confirmed |
| **schemaValidated** | Contract/schema tests pass |
| **clinicallyValidated** | Independent clinical review documented |
| **ownerApproved** | Owner governance decision recorded |
| **activationApproved** | Separate approval for runtime/trigger use |
| **connected** | Wired into live clinical evaluator path |
| **lifecycleState** | One of §4 states |

### Truth table / examples

| Example | sourcePresent | schemaValidated | clinicallyValidated | ownerApproved | activationApproved | connected | lifecycleState | May be ACTIVE? |
|---------|---------------|-------------------|---------------------|---------------|--------------------|-----------|----------------|----------------|
| EV-R5M5-001 M5 schema | true | true | false | true (field names) | false | false | NOT_VERIFIED | **No** |
| EV-MED-001 registry JSON | true | true (count/SHA) | false | false (clinical) | false | false | NOT_VERIFIED | **No** |
| EV-GOV-001 M0 doc | true | N/A | N/A | true | false | false | NOT_VERIFIED | **No** |
| EV-DS-001 full 116k artifact | false (typical clone) | partial | false | false | false | false | MISSING | **No** |
| Hypothetical future corpus | true | true | true | true | **false** | false | NOT_VERIFIED | **No** |

**Mandatory rule:** If **any** mandatory activation axis fails, the source **must not** be treated as **ACTIVE**, must not yield automation **PASS**, and must not **auto-continue** clinical flows.

---

## 6. Rule 4 exclusions (TH / DA)

Rule 5 use authorized = **false** for all rows. **ACTIVE** = **false**. Do not copy numeric thresholds or excluded clinical contents into Rule 5 artifacts.

| ID | Exact source anchor | Current freeze / exclusion status | Rule 5 use authorized | ACTIVE | Required future approval | Leakage-prevention requirement |
|----|---------------------|-----------------------------------|----------------------|--------|--------------------------|--------------------------------|
| **TH-01** | SAC-003 §4; `rule-04-owner-decisions-DRAFT.md` § Owner potency nature | **EXACT_THRESHOLDS_NOT_FROZEN** | **false** | **false** | Separate owner approval for exact thresholds | M5/M3 validators forbid TH keys; future catalog must reject TH binding |
| **TH-02** | SAC-003 §4; owner-decisions Q7 / ladder (D5/D10/D30/D60) | **OWNER_DECISION_PENDING** | **false** | **false** | Separate owner approval | No import into Rule 5 matrix or monitoring refs |
| **TH-03** | SAC-003 §4; Q04F / NEGATIVE ladder notes | **EXACT_LADDER_NOT_FROZEN** | **false** | **false** | Separate owner approval | Candidate-only values not authoritative |
| **TH-04** | SAC-003 §4; Q7 legacy D100/D200 forensic notes | **Not applicable to EHAS2 scale**; not owner-approved selectors | **false** | **false** | Explicit quarantine if ever referenced | Must not become Rule 5 threshold evidence |
| **DA-01** | SAC-003 §5; `TIER3_PATHOLOGY_MAPPING_DATA_ASSET` | **SEPARATE_DATA_FREEZE_PENDING** | **false** | **false** | Separate data freeze + validation | No silent cross-rule import |
| **DA-02** | SAC-003 §5; `non_bp_critical_safety_catalog_status` (Q16-H) | **SEPARATE_SAFETY_DATA_FREEZE_PENDING** | **false** | **false** | Separate safety data freeze | No AE catalog auto-bind |
| **DA-03** | SAC-003 §5; `PHASE_MULTILINGUAL_TIMELINE_LEXICON` (Q12-T) | **SEPARATE_FREEZE_PENDING** | **false** | **false** | Separate freeze | No timing lexicon auto-use |
| **DA-04** | SAC-003 §5; `SEVERITY_MULTILINGUAL_LEXICON` (Q13-T) | **SEPARATE_FREEZE_PENDING** | **false** | **false** | Separate freeze | No severity mapping auto-use |
| **DA-05** | SAC-003 §5; `LAB_VITAL_TO_SEVERITY_MAPPING` (Q13-T) | **SEPARATE_FREEZE_PENDING** | **false** | **false** | Separate freeze | No lab/vital threshold copy |
| **DA-06** | SAC-003 §5; registry potency/selector audits | **REGISTRY_*_AUDIT_PENDING** / **NOT_EXECUTABLE_AS_Q*_SELECTOR** | **false** | **false** | Registry audit closure | No potency selector reuse for Rule 5 |
| **DA-07** | SAC-003 §5; D13-G posology | **SOURCE_VALIDATION_PENDING** | **false** | **false** | Source validation + separate approval | No dose/posology leakage into Rule 5 monitoring |

**Rule 4 exclusion count:** **11** (TH-01–TH-04, DA-01–DA-07).

---

## 7. 39-medicine registry assessment

| Item | Record |
|------|--------|
| **Exact path** | `packages/medicine-registry/src/medicines.v1.json`, `registry.manifest.json`, `index.ts` |
| **Version** | `ehas2-medicine-registry-v1` |
| **Count** | **39** (`medicineCount` in manifest; `EXPECTED_MEDICINE_COUNT = 39`) |
| **C11 presence** | **Yes** — `requiredCodePresent: "C11"`; record present in `medicines.v1.json` |
| **Manifest / fingerprint** | `sourceFingerprint` and `artifactSha256` present in manifest |
| **Field categories** (per `MedicineRecord` type) | `id`, `name`, optional descriptive fields: `group_type`, `polarity`, `nickname`, `target_organ`, `description`, `organ_action`, `when_to_give`, `disease_clusters`, `potency_logic`, `temperament_affinity`, `search_tags`, `medicine_number` |
| **Missing safety relationships** | No structured interaction, allergy, contraindication, exposure-duration, or AE linkage graph in registry schema |
| **Provenance / license gaps** | Clinical author/publication not recorded in manifest; **license status UNKNOWN** |
| **Clinical validation** | **Absent / not proven** on `main` |
| **Rule 5 connectivity** | **Absent** — no Rule 5 evaluator binding |
| **Final classification** | **SOURCE_PRESENT_UNVALIDATED** (structure/count **STRUCTURE_VALIDATED_ONLY** via tests) |

**This document does not declare the registry clinically safe for Rule 5.**

### CQ-001A append-only clarification (2026-08-07)

| Item | Record |
|------|--------|
| **Historical observation (PR #14 merge / §7 above)** | **39** with **C11 required** — `ehas2-medicine-registry-v1` |
| **Current owner-approved identity (CQ-001A)** | **38** without **C11** — `ehas2-medicine-registry-v2` (`medicines.v2.json`, `registry.v2.manifest.json`) |
| **Evidence activation** | **None** — inventory unchanged in clinical authority |
| **Rule 5 clinical change** | **None** — Rule 5 remains **NOT_IMPLEMENTED** / **NOT_CONNECTED** |

---

## 8. Disease / symptom data assessment

| Item | Record |
|------|--------|
| **Manifest expectation** | **116,284** (`EXPECTED_DISEASE_COUNT` in `clinical-data-manifest`) |
| **Full artifact installation** | Path `data/clinical-artifacts/disease-package-v1` — **gitignored**; default clone status **NOT_GENERATED / NOT_INSTALLED** (`installedLive: false` in manifest types) |
| **Full artifact clinical validation** | **Not proven** |
| **Synthetic fixture** | `fixtures/synthetic/clinical/disease-package-tiny/` — **11** records in `diseases.v1.jsonl` (manifest `recordCount: 11`); **not** the full corpus |
| **Extraction tooling** | `tools/clinical-extract/` |
| **Provenance / license gaps** | Full corpus license and clinical curation **UNKNOWN**; synthetic fixture explicitly CI-only |
| **Monitoring-target suitability** | **Not proven** — symptom lists exist as fields but no owner-approved monitoring target set |
| **Rule 5 connectivity** | **Absent** |

**Do not describe the expected 116,284 count as an installed live clinical corpus on canonical `main`.**

---

## 9. Electrohomeopathy evidence gap

| Statement | Status |
|-----------|--------|
| Validated, versioned, licensed Rule 5 Electrohomeopathy **materia medica** evidence package on `main` | **Not proven — MISSING** |
| Medicine registry descriptive text substitutes for clinically validated safety corpus | **No** — insufficient |
| Owner must later identify authoritative EH sources | **Required** |
| Source licensing, provenance, and clinical review before catalog activation | **Required** |

Recommendation for activation paths without owner sources: **`NEED_MORE_VALIDATED_EVIDENCE`**.

---

## 10. Threshold / timing register

All unapproved items: **status = NOT_AUTHORIZED_FOR_CLINICAL_USE**. Numeric values are **not** reproduced here.

| Register ID | Value / definition location (anchor only) | Clinical purpose (intended) | Source authority | Validated evidence | Owner approval | Rule 4 dependency | Current status |
|-------------|-------------------------------------------|----------------------------|------------------|-------------------|----------------|-------------------|----------------|
| **TT-TH-01–04** | SAC-003 §4; Rule 4 owner-decisions pointers | Potency / ladder thresholds | Rule 4 (excluded) | **No** | **Pending separate** | **Yes** (TH) | **NOT_AUTHORIZED_FOR_CLINICAL_USE** |
| **TT-M3-TP** | M3 matrix `thresholdPolicy: NO_THRESHOLD_AUTHORIZED` | Block numeric automation | OD-R5-M0-008 | N/A (policy) | Governance only | **No** values | Policy marker only |
| **TT-M5-WARN** | M5 MPF-004 `warningThresholds` — `reference: null` | Warning thresholds slot | OD-R5-M0-003 | **No** | Field name only | **No** | **NOT_AUTHORIZED_FOR_CLINICAL_USE** |
| **TT-M5-FU** | M5 MPF-003 `followUpWindow` — `reference: null` | Follow-up timing | OD-R5-M0-003 | **No** | Field name only | **No** | **NOT_AUTHORIZED_FOR_CLINICAL_USE** |
| **TT-M5-PAUSE/STOP/EM** | MPF-007–MPF-009 — `reference: null` | Pause / stop / emergency criteria | OD-R5-M0-003 | **No** | Field name only | **No** | **NOT_AUTHORIZED_FOR_CLINICAL_USE** |
| **TT-CAND** | Commits `0508e52`, `b1ccfb5` | Any threshold/timing in candidate branches | **Not authority** | **No** | **No** | Unknown | **NOT_AUTHORIZED_FOR_CLINICAL_USE** |

---

## 11. Complete conflict / gap register

**Gap count:** **16** findings (**FG-001** through **FG-016**).

| Finding ID | Evidence IDs | Finding | Severity | Blocks milestone | Required resolution | Owner clinical decision required? | Current status |
|------------|--------------|---------|----------|------------------|---------------------|-----------------------------------|----------------|
| **FG-001** | EV-LIFE-001, (no catalog module) | Rule 5 evidence catalog missing on `main` (OD-R5-M0-022 planned; no `RULE5_EVIDENCE_CATALOG_VERSION` in contracts) | High | M6B, M7+ | Authorized M6B metadata catalog or approved inventory update | No (technical) | Open |
| **FG-002** | EV-DS-001 | Full 116k disease artifact unavailable/unvalidated on typical clone | High | M7, monitoring symptom binding | Generate/install artifact + validate | **Yes** (clinical use) | Open |
| **FG-003** | EV-MED-001 | Medicine safety relationships (interaction/allergy/contraindication/exposure) absent | High | M8, M9, blockers | Curated validated dataset | **Yes** | Open |
| **FG-004** | (none on main) | Validated EH materia-medica package missing | High | All medicine-linked safety evidence | Owner-identified sources + license + review | **Yes** | Open |
| **FG-005** | EV-R4-TH, EV-R4-DA | Rule 4 excluded TH/DA assets must not leak into Rule 5 | Medium | M6B+, M7+ | Exclusion flags + tests; separate approvals | Partial | Open |
| **FG-006** | EV-CAND-001 | Candidate branch authority conflict vs canonical M4/M5 | Medium | Any merge/replay | Do not treat candidates as authority | No | Open |
| **FG-007** | EV-LIFE-001 | ACTIVE vocabulary in M0 without catalog rows or assigners | Medium | M6B, activation | Implement metadata-only catalog with fail-closed defaults | No | Open |
| **FG-008** | EV-MON-001 | Monitoring targets (symptoms/vitals/labs/events) unspecified | High | M7, M5 reference fill | Owner enumerates clinically correct targets | **Yes** | Open |
| **FG-009** | EV-MED-001, EV-DS-001 | Provenance/license gaps for data packages | Medium | External evidence use | Legal review + documented provenance | Partial | Open |
| **FG-010** | EV-LIFE-001 | Lifecycle persistence and audit trail dependency | Medium | M14 | RLS, retention, audit storage | Partial | Open |
| **FG-011** | EV-GATE-002, TT-M5-WARN | Missing owner-approved clinical thresholds | High | M7+ triggers | Per-target approval + evidence | **Yes** | Open |
| **FG-012** | TT-M5-FU | Missing approved follow-up timing | High | M7 | Owner timing + evidence | **Yes** | Open |
| **FG-013** | TT-M5-PAUSE/STOP/EM | Missing clinical pause/stop/emergency predicates | High | M7, M10 | Owner criteria + evidence | **Yes** | Open |
| **FG-014** | EV-R4-DA (DA-02) | Missing adverse-event source authority for Rule 5 | High | M8 | Validated AE corpus + approval | **Yes** | Open |
| **FG-015** | EV-MED-001 | Missing interaction/allergy/contraindication dataset | High | M3 blockers, M9 | Curated safety graph | **Yes** | Open |
| **FG-016** | (none) | Missing product-quality / identity evidence source for Rule 5 | Medium | Exposure/safety surveillance | Owner source + validation | **Yes** | Open |

---

## 12. Activation prerequisites (future; not satisfied today)

Evidence may become **ACTIVE** in a **future**, separately authorized phase **only if all** required gates pass:

1. Source present  
2. Provenance verified  
3. License / permission verified  
4. Schema validated  
5. Clinically validated  
6. Owner approved  
7. **Separate** activation approved  
8. Applicable version current  
9. Lifecycle usable (not EXPIRED / SUSPENDED / WITHDRAWN / SUPERSEDED / MISSING)  
10. Exact condition / reason code mapping  
11. Threshold separately approved where relevant  
12. Tests passed  
13. Rollback documented  
14. Audit trail available  
15. Privacy / security review passed  

If **any** gate is missing:

- **No ACTIVE**  
- **No PASS** / **no auto-continue**  
- **DOCTOR_REVIEW_REQUIRED** where applicable (per M0/M5 missing-plan policy pattern)

---

## 13. Privacy / security / legal boundary

| Topic | M6A record |
|-------|------------|
| PHI accessed for this inventory | **No** |
| Patient / clinician data stored in this document | **No** |
| `.env` / secrets accessed | **No** |
| Persistence implemented | **No** (M6A doc only) |
| **M14** deferred controls | RLS, retention, consent, export/delete, tenant isolation, audit storage |
| Future external evidence | License and legal review required before activation |
| Supply-chain / tamper | Provenance integrity and tamper detection required before trusting external corpora |

---

## 14. Clinical owner-decision queue

**Queue count:** **8** items (record only — **no resolution**, **no assumption permitted**).

| Queue ID | Clinical question | Current evidence gap | Blocked milestone | Assumption permitted? |
|----------|-------------------|----------------------|-------------------|------------------------|
| **CQ-001** | Authoritative Electrohomeopathy sources for monitoring and safety | FG-004; no validated materia medica package | M6B activation, M7+ | **No** |
| **CQ-002** | Clinically correct monitoring targets (symptoms, vitals, labs, events) | FG-008; MPF slots empty | M7, M5 reference binding | **No** |
| **CQ-003** | Follow-up timing windows | FG-012; MPF-003 null | M7 | **No** |
| **CQ-004** | Warning / action thresholds | FG-011; NO_THRESHOLD_AUTHORIZED | M7+ | **No** |
| **CQ-005** | Emergency criteria and escalation | FG-013; MPF-009 null | M7, M10 | **No** |
| **CQ-006** | Pause / stop criteria | FG-013; MPF-007/008 null | M7, M10 | **No** |
| **CQ-007** | Medicine / exposure safety semantics | FG-003, FG-015; registry descriptive only | M9, blockers | **No** |
| **CQ-008** | Adverse-event source authority | FG-014; DA-02 excluded | M8 | **No** |

Where evidence is insufficient for a recommendation: **`NEED_MORE_VALIDATED_EVIDENCE`**.

---

## 15. Roadmap / non-claims

**R5-M6B disambiguation (two tracks — do not conflate):**

| Track | Milestone | Status (medicine audit sequence reconciled on canonical `main`; historical base SHA in table below unchanged) |
|-------|-----------|-------------------------------------------------------------------------------------------------------------|
| **A** | R5-M6B **medicine documentation-audit** (per-medicine formal audit records + [master index](./rule-05-medicine-evidence-audit-index-R5-M6B.md)) | **COMPLETE** — **38/38**; next medicine **NONE — DOCUMENTATION_AUDIT_SEQUENCE_COMPLETE** |
| **B** | R5-M6B **metadata catalog contracts** (FG-001; OD-R5-M0-022) | **Layered (current `main` after CA-1):** Scoping **COMPLETE** (read-only); T1 spec **DOCUMENTATION_SPEC_RECORDED**; **CA-1** **EMPTY_STRUCTURAL_CONTRACT_PRESENT** — runtime **NOT_IMPLEMENTED** / **NOT_CONNECTED** (`RULE5_EVIDENCE_CATALOG_VERSION` + empty fixture/validator; **zero rows**); T4 **BLOCKED**; T5 **NOT_AUTHORIZED** / **BLOCKED**. **FG-001 OPEN** (empty structural catalog module present; populated catalog and activation remain gated). |

Track **A** completion does **not** authorize, implement, or complete track **B**. FG-001, owner CQ resolution (§14), provenance acquisition, clinical evidence validation, Rule 5 safety evidence validation, evidence activation, and runtime activation remain separately gated; no assumption permitted.

**Current-main note (does not alter the historical snapshot in the table below):** Track B T1 documentation specification is recorded via [rule-05-evidence-catalog-contract-R5-M6B.md](./rule-05-evidence-catalog-contract-R5-M6B.md). **CA-1** (authorized coherent empty structural contract) adds version, empty envelope, fixture, validator, serializer, tests and export only — **catalog row count 0**, **CATALOG_ROW_ID_NAMESPACE OWNER_DECISION_REQUIRED**, **evidence activation NONE**, **clinical validation 0**, **Rule 5 runtime NOT_IMPLEMENTED / NOT_CONNECTED**. **P1 provenance charter** (documentation only): [rule-05-provenance-authority-charter-R5-M6B.md](./rule-05-provenance-authority-charter-R5-M6B.md) — **DOCUMENTATION_RECORDED** (owner declarations PROV-OD-01–14; **no** byte verification, **no** catalog rows/IDs, **no** `ownerPrimaryVerified`, **no** FG/CQ closure). **P2-A byte-verification policy**: [rule-05-byte-verification-policy-R5-M6B-P2.md](./rule-05-byte-verification-policy-R5-M6B-P2.md) — **P2-B1** **`PURE_IN_MEMORY_CORE_PRESENT`** / **`SYNTHETIC_IN_MEMORY_TESTS_PRESENT`**; **P2-B2A** **`PURE_STRUCTURAL_COMPARATOR_PRESENT`** / **`SYNTHETIC_OBSERVATION_TESTS_PRESENT`**; **P2-B2B** **`BASIC_IN_MEMORY_HEADER_LINE_PARSER_PRESENT`** / **`SYNTHETIC_BYTE_TESTS_PRESENT`**; **P2-B2C** **`FIXED_WRAPPER_TOKEN_PARSER_PRESENT`** / **`WRAPPER_AMBIGUITY_FAIL_CLOSED`** / **`WRAPPER_TOKENS_FIXED_USER_QUERY_V1`** / **`WRAPPER_BOUNDARY_DOCUMENT_END_ONLY`**; **P2-B3** **`P2-B3 CONFINED_SYNTHETIC_CLI_PRESENT`** / **`FILESYSTEM_ACCESS_SYNTHETIC_ONLY`** / **`SYNTHETIC_ROOT_MARKER_INTERLOCK_PRESENT`** / **`SYNTHETIC_CONTENT_NOT_CRYPTOGRAPHICALLY_PROVEN`** / **`PARSER_ONLY_CLI_PRESENT`** / **`COMPARATOR_CLI_NOT_IMPLEMENTED`** / **`CLI_RUNTIME_NOT_CONNECTED`**; **`JSONL_ANCHOR_DERIVATION_NOT_IMPLEMENTED`**; **`QUARANTINE_ASSIGNMENT_NOT_IMPLEMENTED`**; **`EXCLUSION_INFERENCE_NOT_IMPLEMENTED`**; **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`**; **`BYTE_PROOF_PENDING`**; **`MANIFEST_PERSISTENCE_NOT_AUTHORIZED`**). **P2-C1 protected-source security contract** (documentation only): [rule-05-protected-source-security-contract-R5-M6B-P2C1.md](./rule-05-protected-source-security-contract-R5-M6B-P2C1.md) — **`P2-C1 SECURITY_CONTRACT_DOCUMENTATION_RECORDED`** / **`P2_C1_DOCUMENTATION_ONLY_SECURITY_CONTRACT`** (trust zones, manifest field classes, checkpoints; **no** protected-source access, **no** hashing, **no** dry/full run, **no** manifest persistence; B3 remains synthetic-only). **P2-C2 synthetic repo-safe manifest schema** (implementation): [rule-05-byte-verification-policy-R5-M6B-P2.md](./rule-05-byte-verification-policy-R5-M6B-P2.md) §25.7 — **`P2-C2 SYNTHETIC_REPO_SAFE_MANIFEST_SCHEMA_VALIDATOR_PRESENT`** / **`IN_MEMORY_ONLY`** / **`NO_COMMITTED_JSON_FIXTURE`** / **`NO_DIGEST_FIELD`** / **`NO_HASH_COMPUTATION`** / **`NO_FILESYSTEM`** / **`NO_CLI`** / **`NO_MANIFEST_PERSISTENCE`** / **`OWNER_PRIMARY_VERIFIED_FALSE_ONLY`** (protected-local manifest schema **unimplemented**). **P2-C3A Windows protected-runner technical contract** (documentation only): [rule-05-windows-protected-runner-contract-R5-M6B-P2C3A.md](./rule-05-windows-protected-runner-contract-R5-M6B-P2C3A.md) — **`P2-C3A WINDOWS_PROTECTED_RUNNER_TECHNICAL_CONTRACT_DOCUMENTATION_RECORDED`** / **`PURE_NODE_PROTECTED_FILE_OPEN_NOT_AUTHORIZED`** / **`NATIVE_OR_VERIFIED_OS_HANDLE_HARDENING_REQUIRED`** / **`PROTECTED_RUNNER_NOT_IMPLEMENTED`** / **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** (no hash, digest comparison, structural assessment, or **`ownerPrimaryVerified`** advancement through C3A–C3E initial checkpoint). **P2-C3B synthetic in-memory orchestration** (implementation + contract documentation): [rule-05-synthetic-orchestration-contract-R5-M6B-P2C3B.md](./rule-05-synthetic-orchestration-contract-R5-M6B-P2C3B.md) — **`P2-C3B SYNTHETIC_IN_MEMORY_ORCHESTRATION_IMPLEMENTED`** / **`P2-C3B SYNTHETIC_IN_MEMORY_ORCHESTRATION_TESTS_PRESENT`** / **`POST_C3B_INDEPENDENT_SECURITY_REVIEW_PASS`** / **`SYNTHETIC_CALLER_OWNED_BYTES_ONLY`** / **`NO_HASH_COMPUTATION`** / **`NO_FILESYSTEM`** / **`NO_CLI`** / **`MANIFEST_COMPLETELY_EXCLUDED_FROM_C3B_V1`** / **`EXCLUDED_RANGES_ELEMENT_CAP_NOT_SET_TRUSTED_IN_PROCESS_ONLY`** / **`C3C_NOT_AUTHORIZED`** (no protected-source access, no dry run, no manifest persistence, no runtime connection). **P2-C3C Windows handle-hardening synthetic spike contract** (documentation only): [rule-05-windows-handle-hardening-spike-contract-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-contract-R5-M6B-P2C3C.md) — **`P2-C3C WINDOWS_HANDLE_HARDENING_SPIKE_CONTRACT_DOCUMENTATION_RECORDED`** / **`DOCUMENTATION_ONLY`** / **`C3C_IMPLEMENTATION_NOT_AUTHORIZED`** / **`C3C_SYNTHETIC_SPIKE_NOT_EXECUTED`** / **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** / **`C3D_NOT_AUTHORIZED`** / **`C3E_NOT_AUTHORIZED`** (no native implementation, no spike execution, no protected-source access, no dry run). **Catalog row count 0**; **`ownerPrimaryVerified` not set**; **`BYTE_PROOF_PENDING`**; **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`**; **`MANIFEST_PERSISTENCE_NOT_AUTHORIZED`**; **`CLI_RUNTIME_NOT_CONNECTED`**; **evidence activation NONE**; **clinical validation 0**; **FG-001** status remains **OPEN**; narrative: empty structural catalog module present; populated catalog and activation remain gated. **FG-004/005/007/009 OPEN**. **CQ-001–CQ-008 unresolved**.

| Milestone | Status on base `05168087` |
|-----------|---------------------------|
| R5-M0–M5 | **Complete** on `main` |
| **R5-M6A** | **This documentation record only** |
| R5-M6B (metadata catalog contracts) | **Not started** — track **B** above; **not** implied complete by track **A** |
| Evidence activation | **Not started** |
| R5-M7–M19 | **Not started** |
| Runtime change from M6A | **None** |
| Production / pilot / deployment | **Not authorized** |

---

## 16. Final verdict

**`R5_M6A_DOCUMENTATION_COMPLETE_EVIDENCE_NOT_ACTIVATED`**

---

## Document footer (mandatory)

| Item | Value |
|------|--------|
| Files changed by M6A (intended) | **One:** this file only |
| Evidence activated | **NONE** |
| Thresholds authorized | **NONE** |
| Clinical sources approved by this document | **NONE** |
| Runtime behavior changed | **NO** |
| Rule 5 implemented | **NO** |
| Rule 5 connected | **NO** |
| R5-M7 started | **NO** |
