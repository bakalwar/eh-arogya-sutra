# Rule 5 — Owner Decision Record (R5-M0)

| Field | Value |
|-------|--------|
| **Product** | E.H. AROGYA SUTRA 2 |
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M0 — Owner Decision Record |
| **Document type** | Owner Decision Record |
| **Canonical base** | `main` @ `e6862fb09021b41cffef1cf195a32ea44f94d977` |
| **Status** | **OWNER_APPROVED_DECISIONS_RECORDED** |
| **Runtime** | **NOT_IMPLEMENTED** · **NOT_CONNECTED** |

This document is **normative governance for owner-approved decisions only**. It does **not** claim that Rule 5 clinical logic is implemented. It does **not** authorize **R5-M1** or any later phase.

**Provenance (truthful):** Decisions below were relayed and authorized in the **R5-M0 owner authorization session** (consolidated recording). Earlier candidate commits (`0508e52`, `b1ccfb5`) and agent-expanded draft specification **did not** contain a complete in-repo verbatim owner Q/A register; this file is the **consolidated auditable record on canonical `main`**.

---

## Mandatory non-claims

- Rule 5 **identity and governance decisions** recorded here are **owner-approved**.
- Rule 5 **clinical implementation** is **NOT_IMPLEMENTED**.
- Rule 5 **production** is **NOT_CONNECTED**.
- **No** evidence asset is installed or activated by this document.
- **No** clinical threshold is approved for automated execution by this document.
- **No** database, migration, or persistence is approved.
- **R5-M1** and later phases are **not** approved by this document.
- **No** candidate commit is merged or replayed by this document.
- **No** Rule 4 or Rules 6–9 change is authorized.
- **No** Stage B or Phase 5D authorization.
- **No** deployment or production activation.
- **SAC-001** documentation resolution on canonical `main` becomes authoritative for these decisions **only after** this documentation PR is **separately reviewed and merged** (not merged by this task).

---

## Decision register

Each entry includes: **ID**, **owner-approved status**, **decision date/order**, **source**, **scope**, **explicit exclusions**, **future gate**.

---

### OD-R5-M0-001 — Canonical identity

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **001** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | EH Rule 5 naming and legacy dosage disposition |
| **Explicit exclusions** | Does not implement runtime; does not approve dosage engine |
| **Future gate** | **R5-M1** (identity labels on `main`) separately authorized |

**Decision:**

- Rule 5 = **Monitoring, Follow-up & Post-Release Safety Surveillance**.
- Rule 5 is **not** Dosage.
- Dosage remains separate **`DOSAGE_ENGINE_AUDIT_PENDING`**.
- Dosage remains **unnumbered** and **non-authoritative** until its own audit.
- Dosage must **not** be transferred or merged into Rules **6–9**.
- Legacy **`calc_dosage`** is **not** EHAS2 clinical authority.

---

### OD-R5-M0-002 — Clinical responsibility

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **002** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Post-release Rule 5 responsibilities |
| **Explicit exclusions** | No selection engines; no issuance |
| **Future gate** | Clinical evaluators **R5-M5+** with separate authorization |

**Decision:** Rule 5 covers **post-release**:

1. Monitoring
2. Follow-up
3. Adverse-event processing
4. Treatment-state tracking
5. Safety surveillance

Rule 5 must **not** independently select or change **medicine, mixture, potency, or dosage**.

---

### OD-R5-M0-003 — Monitoring plan

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **003** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Required monitoring plan fields and missing-plan behavior |
| **Explicit exclusions** | No invented thresholds; Rule 4 **TH-01–TH-04** not approved here |
| **Future gate** | **R5-M5** monitoring-plan contract; threshold approval separate |

**Decision:** Every **clinician-approved released** prescription requires a **versioned monitoring plan** containing:

1. Baseline requirements
2. Monitored symptoms / vitals / labs / events
3. Follow-up window
4. Warning thresholds
5. Responsible clinician
6. Patient instructions
7. Pause criteria
8. Stop criteria
9. Emergency criteria and escalation path
10. Evidence version
11. Monitoring-plan version / fingerprint

**Missing plan:**

- Treatment state: **`STATUS_NOT_EVALUABLE`**
- Reason code: **`R5_REQUIRED_MONITORING_DATA_MISSING`**
- Required action: **`DOCTOR_REVIEW_REQUIRED`**
- **No PASS**

No threshold may be invented or used without **validated evidence** and **separate approval**. Rule 4 **TH-01–TH-04** are **not** approved by this decision.

---

### OD-R5-M0-004 — Outputs

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **004** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Permitted Rule 5 outputs |
| **Explicit exclusions** | No prescription/medicine/mixture/potency/dosage mutation |
| **Future gate** | **R5-M11–M13** implementation separately authorized |

**Decision:** Rule 5 **may emit**:

- Full-plan **revalidation request**
- **Truthful failure** reporting
- Deterministic **monitoring-plan fingerprint**

Rule 5 must **not** itself modify **prescription, medicine, mixture, potency, or dosage**.

---

### OD-R5-M0-005 — Follow-up triggers

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **005** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Trigger families and fail-closed presentation |
| **Explicit exclusions** | Timing/threshold values not fixed in R5-M0 |
| **Future gate** | **R5-M7** follow-up triggers after evidence audit (**R5-M6**) |

**Approved trigger families:**

- **TIME**
- **RESULT**
- **SYMPTOM**
- **EVENT**
- **EXPOSURE**

Missing, stale, contradictory, or overdue information must **not** be presented as **PASS** or **stable**. Timing and thresholds must come **only** from **approved plans** and **validated evidence**.

---

### OD-R5-M0-006 — Treatment states

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **006** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Pause / stop / restart semantics (governance) |
| **Explicit exclusions** | Full transition table implementation **not** authorized in R5-M0 |
| **Future gate** | **R5-M10** state machine |

**Decision:**

- **Pause** = temporary safety hold.
- **Stop** = permanent for affected exposure **inside that plan version**.
- **Restart** requires a **new clinician-reviewed plan** and **full safety revalidation**.
- **Acknowledgment** is **not** safety PASS.
- Approved **non-overridable blockers** cannot be bypassed.
- Full transition implementation is **not** authorized in R5-M0.

---

### OD-R5-M0-007 — Modified adverse-event workflow

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **007** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Ten-step AE structure and emergency behavior |
| **Explicit exclusions** | No medicine/potency/dosage change; no runtime in R5-M0 |
| **Future gate** | **R5-M8** AE workflow implementation |

**Approved ten-step structure:**

1. Emergency / red-flag screening
2. Seriousness assessment
3. Affected-exposure identification
4. Allergy / interaction / condition / route recheck
5. Active-plan risk evaluation
6. Safety-state decision
7. Approved patient-safety instructions
8. Full-plan revalidation request
9. Required reporting workflow
10. Follow-up information request

**Emergency behavior:**

- Immediate **`EMERGENCY_ESCALATION`**
- **No PASS** / **no automatic continuation**
- **Urgent clinician alert**
- **Approved emergency instruction**
- Steps **8–10** must **not** delay **immediate** emergency action
- Criteria must use **validated evidence**
- Rule 5 must **not** change prescription / medicine / potency / dosage

---

### OD-R5-M0-008 — Hard-blocker evidence governance

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **008** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Blocker executability and evidence gates |
| **Explicit exclusions** | No executable blockers in R5-M0; Rule 4 **TH-01–TH-04**, **DA-01–DA-07** not auto-used |
| **Future gate** | **R5-M3** blocker matrix; separate activation approval per blocker class |

**Decision:**

- Exact draft hard-blocker **condition count** corrected: **16** candidate safety conditions (not 17).
- **Unknown severity** is a **separate meta-rule** (not a 17th bullet).
- **No blocker is executable** without:
  - validated **`EVIDENCE_ACTIVE`**;
  - approved data / threshold where required;
  - exact state / action mapping;
  - tests;
  - **separate owner activation approval**.

**Non-active / missing evidence:**

- **`STATUS_NOT_EVALUABLE`**
- **`DOCTOR_REVIEW_REQUIRED`**
- **No PASS**
- **No auto-continue**

Rule 4 excluded **TH-01–TH-04** and **DA-01–DA-07** must **not** be used automatically. **Acknowledgment cannot clear a blocker.**

---

### OD-R5-M0-009 — Four-group safety mapping

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **009** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Grouping of 16 conditions + meta-rule |
| **Explicit exclusions** | Permanent STOP requires clinician confirmation; no Rx change by Rule 5 |
| **Future gate** | **R5-M3** codes and tests |

**Group 1 — Immediate emergency:**

- Emergency red flag
- Severe allergic reaction
- Acute clinical deterioration
- Confirmed / suspected overdose

**Group 2 — Conditional emergency or immediate pause / not-evaluable:**

- Suspected serious adverse event
- Dangerous vital / laboratory result
- Uncomputable exposure

**Group 3 — Immediate pause; clinician confirmation before stop:**

- Confirmed applicable allergy
- Absolute contraindication
- Prohibited interaction
- Formulation-route mismatch
- Maximum duration / cumulative exposure exceeded
- Product-quality / identity uncertainty
- Unsafe concurrent medicine change
- Patient-facing instructions not delivered

**Group 4 — Fail-closed / not-evaluable:**

- Mandatory monitoring unavailable / overdue
- Critical follow-up contradiction
- Unknown severity (meta-rule)
- Missing threshold / evidence for conditional conditions

**Permanent STOP** requires **clinician confirmation**. Rule 5 **cannot** change clinical prescription.

---

### OD-R5-M0-010 — Doctor authority

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **010** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Doctor vs Rule 5 automation boundary |
| **Explicit exclusions** | Rule 5 does not emit replacement medicine IDs |
| **Future gate** | **R5-M11** doctor-review gates |

Rule 5 **may emit:**

- Safety state
- Pause
- Escalation
- Revalidation scope
- Reason codes

**Replacement** medicine / mixture / potency / dosage comes **only** from applicable **upstream evaluation**. Every **new or modified plan** requires **clinician approval**. **Restart** requires **new reviewed plan** and **full revalidation**. **Acknowledgment** does **not** clear blockers. Every clinician decision must have a **versioned audit record**.

---

### OD-R5-M0-011 — Post-release 3 / 4 / 5 policy

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **011** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Oral mixture count after pause/stop |
| **Explicit exclusions** | No filler mixtures; no false success prescription |
| **Future gate** | **R5-M11–M12** with upstream Rules 1–5 revalidation wiring |

- Paused / stopped mixtures do **not** count as **active** oral mixtures.
- **No filler** or unsupported replacement.
- If active count falls below required **3 / 4 / 5**:
  - do **not** represent treatment as successful final prescription;
  - **typed safety hold**;
  - **`DOCTOR_REVIEW_REQUIRED`**.
- Replacement requires **full upstream evaluation**, **clinical evidence**, **Rules 1–5 revalidation**, and **clinician approval**.
- Insufficient evidence → **`INSUFFICIENT_CLINICAL_EVIDENCE`** (governance term; implementation in later phase).
- **No** fake / partial / filler prescription may be presented as success.

---

### OD-R5-M0-012 — Dosage boundary

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **012** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Read vs generate dosage |
| **Explicit exclusions** | Dosage generation remains **`DOSAGE_ENGINE_AUDIT_PENDING`** |
| **Future gate** | Separate dosage engine audit |

Rule 5 **may read, record, and compare**:

- Existing prescribed dosage
- Patient-reported exposure

Rule 5 must **not** calculate, recommend, change, fabricate, or replace: **dose, drops, quantity, frequency, duration**.

Missing / unverified dosage evidence → **NOT_EVALUABLE / BLOCKED**, **`DOCTOR_REVIEW_REQUIRED`**. Dosage **generation** remains **`DOSAGE_ENGINE_AUDIT_PENDING`**.

---

### OD-R5-M0-013 — Reason-code governance

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **013** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Namespaces and typing |
| **Explicit exclusions** | **No code migration** in R5-M0 |
| **Future gate** | **R5-M2** registry redesign |

- **Treatment state**, **reason code**, and **required action** are **separate typed fields**.
- Clinical codes: **`R5_`**
- Engineering gates: **`RULE5_`**
- Phase-1 limitations: **`PHASE1_`**
- **No** reason code means PASS / safe / stable.
- Every clinical output includes **state, reason, action, plan version, evidence version, audit context**.
- Unknown code → **fail closed**.
- **Future controlled rename (not executed in R5-M0):**
  `R5_ADVERSE_EVENT_REPORTED` → **`R5_ADVERSE_EVENT_INTAKE_RECORDED`**
  — intake recorded only, **not** safety success.

---

### OD-R5-M0-014 — Existing clinical-code meanings

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **014** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Twelve clinical reason codes (approved meanings) |
| **Explicit exclusions** | None imply PASS; none change medicine/potency/dosage |
| **Future gate** | **R5-M2** registry encoding |

| Code | Approved meaning | Fail-closed action |
|------|------------------|-------------------|
| **`R5_ADVERSE_EVENT_INTAKE_RECORDED`** | AE intake logged; **not** clinical success | Continue workflow only; **no PASS**; doctor review as required by AE step |
| **`R5_ADVERSE_EVENT_DATA_INCOMPLETE`** | AE payload insufficient to assess | **`STATUS_NOT_EVALUABLE`**; **`DOCTOR_REVIEW_REQUIRED`**; **no PASS** |
| **`R5_SERIOUS_ADVERSE_EVENT_SUSPECTED`** | Seriousness triage positive / suspected | Emergency or pause path per **OD-R5-M0-009**; **no auto-continue** |
| **`R5_SEVERE_REACTION_SUSPECTED`** | Severe reaction suspected | Emergency / pause; **no PASS** |
| **`R5_CAUSALITY_NOT_ASSESSED`** | Causality not determined | **`DOCTOR_REVIEW_REQUIRED`**; **no PASS** |
| **`R5_EMERGENCY_EVALUATION_REQUIRED`** | Emergency gate triggered | **`EMERGENCY_ESCALATION`**; urgent alert; **no PASS** |
| **`R5_ADVERSE_EVENT_FOLLOW_UP_REQUIRED`** | AE follow-up owed | Hold auto-continue; **`DOCTOR_REVIEW_REQUIRED`** as needed |
| **`R5_PRODUCT_QUALITY_ISSUE_SUSPECTED`** | Product quality / identity concern | Pause path; **`DOCTOR_REVIEW_REQUIRED`** |
| **`R5_DUPLICATE_EVENT_REPORT_DETECTED`** | Duplicate AE report | No auto-continue; clinician review of record |
| **`R5_REGULATORY_REPORTABILITY_REVIEW_REQUIRED`** | Reporting review needed | Reporting workflow; **no PASS** until reviewed |
| **`R5_REPORT_SUBMISSION_FAILED`** | Report submission failed (truthful) | Surface failure; **`DOCTOR_REVIEW_REQUIRED`**; **no silent PASS** |
| **`R5_REQUIRED_MONITORING_DATA_MISSING`** | Monitoring not evaluable | **`STATUS_NOT_EVALUABLE`**; **`DOCTOR_REVIEW_REQUIRED`**; **no PASS** |

---

### OD-R5-M0-015 — Nine new core reason codes (governance only)

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **015** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Approved future codes — **not implemented in R5-M0** |
| **Explicit exclusions** | No runtime registry migration in R5-M0 |
| **Future gate** | **R5-M2** |

Approved future codes:

- `R5_EVIDENCE_MISSING_OR_UNVERIFIED`
- `R5_FOLLOW_UP_DATA_STALE`
- `R5_FOLLOW_UP_DATA_CONTRADICTORY`
- `R5_FOLLOW_UP_OVERDUE`
- `R5_UNKNOWN_SEVERITY`
- `R5_ACTIVE_ORAL_COUNT_BELOW_REQUIRED`
- `R5_REPLACEMENT_CLINICAL_EVIDENCE_INSUFFICIENT`
- `R5_DOSAGE_EVIDENCE_MISSING_OR_UNVERIFIED`
- `R5_MATERIAL_SAFETY_EVENT_REQUIRES_FULL_PLAN_REVALIDATION`

---

### OD-R5-M0-016 — Hard-blocker code mapping

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **016** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Map 16 conditions to reason codes (**17 codes** — overdose vs uncomputable split) |
| **Explicit exclusions** | Codes **non-executable** until later gates |
| **Future gate** | **R5-M3** |

**Existing mappings:**

- Serious AE → **`R5_SERIOUS_ADVERSE_EVENT_SUSPECTED`**
- Severe reaction → **`R5_SEVERE_REACTION_SUSPECTED`**
- Monitoring missing → **`R5_REQUIRED_MONITORING_DATA_MISSING`**
- Product-quality concern → **`R5_PRODUCT_QUALITY_ISSUE_SUSPECTED`**

**Approved future codes:**

- `R5_EMERGENCY_RED_FLAG_DETECTED`
- `R5_CONFIRMED_APPLICABLE_ALLERGY`
- `R5_ABSOLUTE_CONTRAINDICATION_DETECTED`
- `R5_PROHIBITED_INTERACTION_DETECTED`
- `R5_DANGEROUS_VITAL_OR_LAB_RESULT`
- `R5_ACUTE_CLINICAL_DETERIORATION`
- `R5_FORMULATION_ROUTE_MISMATCH`
- `R5_OVERDOSE_SUSPECTED`
- `R5_EXPOSURE_UNCOMPUTABLE`
- `R5_MAXIMUM_DURATION_OR_CUMULATIVE_EXPOSURE_EXCEEDED`
- `R5_UNSAFE_CONCURRENT_MEDICINE_CHANGE`
- `R5_PATIENT_INSTRUCTIONS_NOT_DELIVERED`
- `R5_CRITICAL_FOLLOW_UP_CONTRADICTION`

**16 conditions** map to **17 codes** because **overdose** and **uncomputable exposure** are **separate codes**. These codes remain **non-executable** until later gates.

---

### OD-R5-M0-017 — Evidence lifecycle

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **017** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Evidence states and automation permission |
| **Explicit exclusions** | Unvalidated automated mapping prohibited |
| **Future gate** | **R5-M6** evidence/data audit |

**Approved states:** ACTIVE, EXPIRED, SUSPENDED, WITHDRAWN, SUPERSEDED, NOT_VERIFIED, MISSING.

Only validated, owner-approved **ACTIVE** evidence may drive **automated triggers / thresholds**.

All other states → **NOT_EVALUABLE**, **`DOCTOR_REVIEW_REQUIRED`**, **no PASS**, **no auto-continue**.

Directly observed / clinician-confirmed emergencies may **immediately escalate**. **Unvalidated automated mapping is prohibited.** Evidence source and uncertainty must be **audited**.

---

### OD-R5-M0-018 — Privacy and persistence

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **018** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Privacy principles; **no DB in R5-M0** |
| **Explicit exclusions** | Retention/export/delete need separate legal/consent review |
| **Future gate** | **R5-M14** persistence separate owner gate |

- Tenant isolation
- PostgreSQL RLS
- Role-based access
- Encryption
- Minimum necessary data
- Versioned / auditable records
- **No PHI** in logs, CI, errors, or fingerprints
- **No DB / migration / persistence** authorized in R5-M0
- **Shadow** mode must **not** persist identifiable patient data
- Synthetic tests only — clearly labelled fake data

---

### OD-R5-M0-019 — Runtime

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **019** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Engine modes |
| **Explicit exclusions** | Env var alone cannot activate Rule 5 |
| **Future gate** | **R5-M15–M19**; active/pilot needs separate approval |

- **Default mode:** off
- **Shadow:** non-clinical, non-persistent, production-disconnected
- **Active:** **NOT_IMPLEMENTED** and **blocked**
- **Invalid mode:** fail-closed
- **Active / pilot / production** requires **separate owner approval** and **complete gates**

---

### OD-R5-M0-020 — Cross-rule boundaries

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **020** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Rules 1–4, 6–9; 5R-SDG |
| **Explicit exclusions** | Rule 4 potency / TH / DA assets not auto-imported |
| **Future gate** | **R5-M11–M12** conflict signals |

- Rule 5 does **not** mutate Rules **1–4** or **6–9** results, identity, or numbering.
- Rule 4 potency and **excluded thresholds / assets** remain **separate**.
- Rule 5 emits **safety state** and **revalidation request** only.
- Replacement uses **upstream rules** and **doctor-approved prescription process**.
- **Row 19 / 5R-SDG** is **not** EHAS2 Rule 5.
- Conflict → **typed conflict** + **`DOCTOR_REVIEW_REQUIRED`**.
- **No silent precedence.**

---

### OD-R5-M0-021 — Corrected roadmap

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **021** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Phase sequence **R5-M0–R5-M19** |
| **Explicit exclusions** | Candidate branch must **not** merge/replay directly |
| **Future gate** | **Each phase** separate authorization, branch, PR, review; starts from **then-current canonical main** |

| Phase | Name |
|-------|------|
| **M0** | Decision record |
| **M1** | Identity / orchestration labels |
| **M2** | Reason-code redesign |
| **M3** | Hard-blocker / evidence matrix |
| **M4** | Contract foundation refresh |
| **M5** | Monitoring-plan contract |
| **M6** | Evidence / data audit before clinical triggers |
| **M7** | Follow-up triggers |
| **M8** | Modified AE workflow |
| **M9** | Exposure–plan binding |
| **M10** | State machine |
| **M11** | Doctor-review gates |
| **M12** | Revalidation / conflict signals |
| **M13** | Reporting |
| **M14** | Persistence / privacy separate gate |
| **M15** | Non-persistent shadow validation |
| **M16** | Security / privacy / rollback drills |
| **M17** | Synthetic surveillance contracts |
| **M18** | Cross-phase validation; active blocked |
| **M19** | Optional future controlled pilot |

---

### OD-R5-M0-022 — Version policy

| Field | Value |
|-------|--------|
| **Owner-approved status** | **RECORDED** |
| **Decision date/order** | R5-M0 session · order **022** |
| **Source** | Owner decision relay — R5-M0 authorization session |
| **Scope** | Version identifiers (governance) |
| **Explicit exclusions** | Code migration only in separately authorized **R5-M1+** |
| **Future gate** | **R5-M1** for `nineRules` identity baseline |

**Approved planned identity baseline:**

`RULE_SET_VERSION = ehas2-nine-rule-interfaces-v2-rule5-monitoring`

— Rule 5 **identity / interface migration** label only.

**Separate identifiers required:**

- RULE5_SPEC_VERSION
- RULE5_CONTRACT_VERSION
- RULE5_REASON_REGISTRY_VERSION
- RULE5_MONITORING_PLAN_SCHEMA_VERSION
- RULE5_EVIDENCE_CATALOG_VERSION
- RULE5_FINGERPRINT_VERSION

**v1** remains historical. Unknown / incompatible version → **fail closed**. Actual code / version migration belongs only to separately authorized **R5-M1**.

---

## R5-M0 completion status

| Item | Status |
|------|--------|
| **Phase** | R5-M0 documentation only |
| **Decision entries** | **22** (OD-R5-M0-001 through OD-R5-M0-022) |
| **Runtime** | **NOT_IMPLEMENTED** · **NOT_CONNECTED** |
| **Next authorized phase** | **None** until owner authorizes **R5-M1** separately |

---

## Document control

| Field | Value |
|-------|--------|
| **Candidate evidence (read-only; not merged)** | `0508e52`, `b1ccfb5` |
| **This record supersedes** | In-repo owner Q/A completeness for Rule 5 on **`main`** prior to this merge |
| **Edits in R5-M0** | **This file only** |
