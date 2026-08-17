# EHAS2 — Canonical End-to-End Clinical Workflow Contract

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** — focused **target operating-model** contract |
| **Authority token (this tranche)** | `EHAS2_E2E_CANONICAL_WORKFLOW_CONTRACT_DOCUMENTATION_AUTHORIZED` |
| **Owner governance directive** | `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED` |
| **Canonical `origin/main` base (this documentation tranche)** | `3da7169b8a050e5faddcc18fc07222287a13a1d1` |
| **Activation / orchestration / Rx** | **Not authorized by this document** |
| **Paid services** | `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` |

This document records the **owner-accepted target clinical workflow** (**E2E-01** … **E2E-14**). It does **not** connect production orchestration, activate clinical selection, implement OCR, freeze dose, populate mappings, or authorize prescription issuance.

**Target contract ≠ current runtime. Documentation ≠ activation.**

---

## 0. Current-state vs target-state (must not be conflated)

| Axis | **Current state** (this `main` tip) | **Target state** (this contract) |
|------|--------------------------------------|----------------------------------|
| Rules 1–4 | Shadow / non-selecting packaging; technical `READY_FOR_VALIDATION` ≠ clinical readiness | System-led draft analysis using Rules 1–9 **after** separate evidence + activation authorizations |
| Rules 5–9 | Mixed: Rule 5 **NOT_IMPLEMENTED**; Rules 6–9 shadow packages; real mappings/catalogs **incomplete / empty** | Same rules in their locked scopes, with **future** owner-approved catalogs — **not** granted here |
| Medicine-selection influence | **NONE** (R1–R3, R7–R9 contracts); Rule 4 canonical `affectsClinicalSelection: false` | Draft selections remain **unauthorized** until separate activation |
| Metadata drift | `nineRules.ts` Rule 4 and Rule 6 `affectsClinicalSelection: true` is **unresolved mechanical drift**, not authority | This contract **does not** treat that `true` as clinical activation |
| Orchestration | **`NOT_CONNECTED`**; `POST /v1/analyze-complete` disconnected; synthetic validation orchestrator only | Future connected pipeline — **not** this tranche |
| Rule 4 engine | Default **`RULE4_ENGINE_MODE=off`**; `active` **not authorized** | Unchanged by this document |
| Prescription engine | **`PRESCRIPTION_ENGINE_NOT_CONNECTED`**; `prescription_issue_allowed = false` in shadow | Issue only after Confirm + final approval — **not** enabled here |
| DA / TH | DA-01…DA-07 **not executable**; TH pending where recorded | Unchanged; E2E-14 DA-07 adult proposal remains **NOT_EXECUTABLE** |

This documentation **itself activates nothing**.

---

## 1. Owner-locked operating decisions

### E2E-01 — System-led analysis

The doctor **submits** patient data. The system performs **complete analysis** and **draft selections** from Rules 1–9 and **validated, source-linked evidence**.

The doctor **must not** manually select, during analysis, Rule-by-Rule branches, medicines, formulas, potency, or administration dose.

This is **not** autonomous production prescribing. **Confirm** and **final approval** remain mandatory gates (**E2E-09**, **E2E-11**).

### E2E-02 — Inputs

Target inputs include:

- patient name
- age
- sex/gender where clinically relevant
- BP and other structured vitals
- complaints
- symptoms
- history
- duration
- severity-related observations
- patient photos, when available
- USG, CT, MRI, blood reports, and other investigation reports
- doctor structured observations

Photos and reports are **source-linked evidence items**. Raw image, OCR text, or keyword **alone** is **not** a diagnosis or clinical selector.

### E2E-03 — Clinical reasoning sequence

The system must reason, at minimum, in this order of concern (fail-closed at any step that cannot be supported):

1. safety / red flags
2. evidence completeness / conflicts
3. disease / condition candidates
4. positive / negative / mixed / unresolved disease polarity
5. patient temperament / constitution
6. affected organ / system
7. multi-disease and co-involvement
8. disease depth / chronicity / severity
9. medicine candidates
10. formula construction
11. potency proposal
12. administration-dose proposal
13. explanation and limitations

**Current:** these steps are specified across frozen/shadow contracts; they are **not** a live production pipeline.

### E2E-04 — Oral Mixtures A–E

The system performs **combined** analysis of the patient’s problems and proposes **dynamic** Oral Mixtures **A–E**.

Existing owner mixture-count rules are **preserved** (Constitution §F / Rule 9 / OD-014):

| Complexity posture | Required oral mixture count |
|--------------------|-----------------------------|
| Simple | **3** |
| Moderate | **4** |
| Complex / multi-system | **5** |

Additional locks:

- maximum slots **A–E**
- **no** fixed medicine
- **no** duplicate mixture
- **no** silent filler
- insufficient evidence → **UNRESOLVED** — **no** forced slot (OD-014: do not issue; do not fabricate formulas)

Each mixture must:

- have a distinct clinical target
- use patient-specific medicines from the **CQ-001A 38-code identity set** (see §2)
- explain formula composition
- carry an independently appropriate **potency proposal** (Rule 4 scope; not executable by this document)
- be traceable to polarity and organ/system evidence

**Rule 9** remains **validate / reject / package** only — it **must not** invent medicines to fill count. Mixture **construction** is a **future** authorized selector concern; this contract does **not** grant Rule 9 selection influence.

### E2E-05 — Tablet Section A

Tablet Section A:

- uses **dynamic** selection from the **CQ-001A canonical 38-code identity set** (see §2)
- is **not** limited to Oral Mixtures A–E
- **must not** copy oral formulas
- has **no** fixed tablet medicines
- builds a patient-specific formula from disease, symptoms, target, temperament, organ involvement, polarity, and severity **when those evidence gates pass**
- takes dose **only** from a **validated** administration-dose contract (unvalidated dose → fail-closed; see E2E-12 / E2E-14)

**Current:** tablet engine **NOT_IMPLEMENTED**; full-pool registry identity **AVAILABLE**; selection **DEFERRED**.

### E2E-06 — Tablet Section B

Tablet Section B:

- patient-specific **single-medicine** selection from the same **38-code** identity set
- before-food / after-food posture **only** from approved route/timing evidence
- **no** fixed medicine
- **no** silent copy from Oral or Tablet A
- must show medicine identity, timing, rationale, and limitations

**Current:** **NOT_IMPLEMENTED**.

### E2E-07 — External Formulas A–C

External section:

- dynamic formulas **A–C** from affected organ/site and **approved external-route evidence** (Rule 7 scope)
- **no** fixed medicine
- **no** photo-only selection
- **no** unsafe route/site inference
- missing route/site evidence → **UNRESOLVED**

**Current:** Rule 7 shadow; real route/site mappings **0**; clinical activation **NONE**.

### E2E-08 — Explainable summary

The summary must show, as applicable:

- patient-reported problems
- extracted report findings **with source**
- increased / decreased / abnormal findings
- confidence and unresolved findings
- safety / red-flag posture
- temperament
- polarity
- affected organ/system
- medicine-selection rationale
- Oral A–E rationale
- Tablet A rationale
- Tablet B rationale
- External A–C rationale
- potency rationale
- dose status
- expected therapeutic role
- limitations and required review

Every medicine / formula / potency / dose **proposal** must be **explainable**.

**Expected therapeutic role** is **educational / explanatory** only. **Prohibited:** guaranteed cure, guaranteed improvement, or fixed recovery-time claims.

### E2E-09 — Doctor confirmation

At the end of the complete summary, this message must appear:

> Doctor द्वारा दर्ज patient information और उपलब्ध evidence के आधार पर system ने यह clinical summary और draft selections तैयार किए हैं। Prescription draft पर जाने से पहले summary को review और confirm करें।

**Prescription draft must not proceed before doctor Confirm.**

This Confirm gate is **in addition to** existing 5R-DRG / Q18 final-approval semantics. This document **does not rewrite** 5R-DRG canonical footer text.

### E2E-10 — Prescription draft and correction

After Confirm:

- a **prescription draft** may be created
- the doctor may **correct** the draft
- the **original system proposal** is **retained**
- every edit is recorded on an **append-only** audit trail
- capture **who / when / what / why**
- each corrected draft is a **new immutable version**

**Current:** policy exists in Q18 / 5R-DRG shadow; **no** production versioned Rx store.

### E2E-11 — Final approval

**Final prescription issues only after doctor approval.**

Without final approval:

- **no** issuance
- **no** printable final Rx
- **no** production prescription status

**Current:** issuance engine **NOT_CONNECTED**; shadow `prescription_issue_allowed = false`.

### E2E-12 — Fail-closed

**No forced prescription** when any of the following apply:

- insufficient evidence
- contradictory evidence
- unsupported report
- low-confidence extraction
- unknown medicine mapping
- missing formula evidence
- unresolved polarity
- unresolved potency
- unvalidated dose
- emergency / red flag
- prohibited age / safety state (including D13-HS under-one hard stop)

Output the appropriate **`UNRESOLVED`**, **`DOCTOR_REVIEW_REQUIRED`**, **`HOLD`**, or **`ESCALATE`** posture.

Emergency / red flag → **HOLD / ESCALATE** — **not** dose increase. **No** silent defaults.

### E2E-13 — Current shadow boundaries

This target contract **does not** change:

- Rules **1–4** currently **shadow / non-selecting** for production
- remaining Rules’ **mixed shadow / not-implemented** posture
- incomplete real mappings / catalogs
- orchestration **not** production-connected
- activation / Rx **not** authorized

### E2E-14 — DA-07 adult administration-dose proposal (record only)

Recorded **only** as an owner clinic-protocol proposal:

| Item | Value |
|------|--------|
| Age scope | **`age >= 18`** |
| Drops per administration | **10–15** |
| Frequency | **3–4** times/day |
| Endpoint selection | **Doctor / manual only** — software **must not** auto-select 10 vs 15 or 3 vs 4 |
| Classification tokens | `OWNER_CLINIC_PROTOCOL_SOURCE_DECLARED` · `SOURCE_VALIDATION_PENDING` · `OWNER_RECORDED_UNVALIDATED` · `NOT_EXECUTABLE` |

**Must not** be called Count Mattei-verified, clinically validated, frozen, or executable.

**Must not** silently overwrite the existing recorded D13-G **13+** proposal (**7 / 8** drops by sensitivity · **3×/day** · half cup where recorded) — that proposal remains **OWNER_RECORDED_UNVALIDATED** / **SOURCE_VALIDATION_PENDING** on its own track. **13–17** stays on that recorded 13+ D13-G-C text until a **sourced** split is separately frozen.

---

## 2. Medicine identity (CQ-001A) — exact wording

Oral, Tablet A, Tablet B और External medicine identity CQ-001A canonical identity set के 38 codes (`ehas2-medicine-registry-v2`) पर आधारित होगी। C11 canonical identity से excluded है और केवल historical v1 snapshot में retained है; कोई replacement/remapping नहीं। Frozen pre-CQ-001A ‘39-medicine pool’ references historical हैं। Registry identity clinical selection या Rx authority नहीं देती।

---

## 3. Rules 1–9 — target responsibility vs current lock

| Rule | Target responsibility in this workflow | Current lock (unchanged here) |
|------|----------------------------------------|-------------------------------|
| **1** Temperament Engine | Temperament / constitution for analysis and (future) selection context | Shadow; influence **NONE**; mappings **0** |
| **2** Polarity Engine | Disease polarity (positive / negative / mixed / unresolved) | Shadow; influence **NONE**; formula mutation **NONE** |
| **3** Organ-System Affinity | Affected organ/system; medicine/formula affinity **when authorized** | Shadow; influence **NONE**; no closed real catalog |
| **4** Potency Engine | Per-formula potency proposal; **not** dose/water/frequency | Shadow Phases 1–10; default **off**; DA/TH pending; canonical `affectsClinicalSelection: false` |
| **5** Monitoring | Post-release safety **after** issuance — **not** a selector | **NOT_IMPLEMENTED** / **NOT_CONNECTED** |
| **6** Multi-disease triad | Co-involvement / relationship **when authorized** | Shadow; active relationship registry **empty** |
| **7** External Use Routes | External A–C route/site indication | Shadow; mappings **0** |
| **8** Disease-level prakriti | Supporting disease-level prakriti **when authorized**; **not** required for Rx until separately decided | Shadow; mappings **0**; `NOT_REQUIRED_FOR_PRESCRIPTION` |
| **9** Master Pipeline | Validate / reject / package; enforce 3/4/5 count; **no** new selection / no filler | Shadow validator; complexity classifier **NOT_IMPLEMENTED** |

---

## 4. Security / PHI

- **No** original photo/PDF stored permanently (Constitution §C).
- Extraction, if ever implemented, must be **source-linked** and **confidence-scored**; low-confidence → doctor review, not silent selector use.
- Identifiable clinical artifacts must not be committed as fixtures.
- Auth / PHI controls remain **SECURITY_REQUIRED** before production ingest.

This document does **not** implement ingest, OCR, or storage.

---

## 5. Implementation dependency order (after this contract — separate authorizations)

1. PHI-safe ingest and source-linked evidence items (still non-selecting)
2. Owner-approved catalogs / mappings (clinical evidence required)
3. Remaining Rule 4 DA/TH / dose **source** freezes (E2E-14 **not** executable until provenance)
4. Metadata-drift reconciliation (`nineRules.ts`) — separate auth
5. Non-issuing summary **Confirm** + append-only draft versions
6. Orchestration connect — separate auth; Rule 4 default **off** until separately authorized
7. Issuance — separate auth; still requires **final** doctor approval
8. Rule 5 post-release — after first-pass draft workflow, not instead of it

**Must exist before orchestration:** evidence gates, empty-catalog fail-closed, OD-014 no-filler, photo/OCR-not-selector, Confirm contract.

**Must exist before production Rx:** the above **plus** versioned edits, final approval, PHI, and source-validated dose.

---

## 6. Non-claims

This document does **not** authorize:

- clinical activation or medicine-selection influence
- orchestration / `AnalyzeComplete` / `RULE4_ENGINE_MODE=active`
- OCR / Tesseract / pdf implementation
- catalog or mapping population
- C11 restoration or remapping
- treating registry identity as selection or Rx authority
- executable DA-07 10–15 / 3–4× dose
- guaranteed cure or recovery-time claims
- Constitution / README / `nineRules.ts` / package / test / workflow edits
- Q1–Q18, TH, or other DA body rewrites
- production prescription issuance

**STOP** before all of the above.

---

## Status tokens (current)

- `EHAS2_E2E_CANONICAL_WORKFLOW_CONTRACT_DOCUMENTED`
- `EHAS2_E2E_TARGET_NOT_CURRENT_RUNTIME`
- `EHAS2_E2E_NO_ACTIVATION_ORCHESTRATION_OR_RX`
- `EHAS2_E2E_CONFIRM_BEFORE_PRESCRIPTION_DRAFT`
- `EHAS2_E2E_FINAL_APPROVAL_REQUIRED_FOR_ISSUE`
- `EHAS2_E2E_CQ001A_IDENTITY_38_C11_EXCLUDED`
- `EHAS2_E2E_DA07_ADULT_PROPOSAL_NOT_EXECUTABLE`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`
