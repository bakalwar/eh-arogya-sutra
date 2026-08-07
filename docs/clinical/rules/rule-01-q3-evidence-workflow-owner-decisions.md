# Rule 1 — Q3 Evidence / Workflow Owner Decisions (R1-CP-Q3)

## 1. Document control

| Field | Value |
|-------|--------|
| **Title** | Rule 1 — Q3 Evidence / Workflow Owner Decisions (R1-CP-Q3) |
| **Phase** | R1-CP-Q3 |
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Canonical base SHA** | `ddfcc4e51ed753c34f1fa447ccf40b449e1d7078` |
| **Status** | OWNER_APPROVED_GOVERNANCE_BASELINE |
| **Decision count** | Q3A, Q3B, Q3C, Q3D, Q3E, Q3F, Q3G (revised final), Q3G-TIE, Q3H |
| **Implementation** | NOT_IMPLEMENTED |
| **Runtime** | NOT_CONNECTED |
| **Clinical selection** | NOT_AUTHORIZED |
| **Evidence catalog** | NOT_CREATED |
| **Rule 6** | NOT_STARTED |
| **Rule 5** | NOT_IMPLEMENTED |
| **Production / deployment** | NONE |

This file records **owner-approved governance decisions** only. It does not activate engines, contracts, scoring, catalogs, extractors, UI, or prescription behavior.

---

## 2. Authority relationship

- [rule-01-blood-lymph-owner-decisions.md](./rule-01-blood-lymph-owner-decisions.md) (**R1-CP-Q2**) remains valid for integrated SANGUINE/Blood and LYMPHATIC/Lymph axes, fail-closed vocabulary, and no-fixed-medicine boundaries.
- **R1-CP-Q3** extends Q2 with typed Blood/Lymph axis **clinical values**, evidence **classes**, minimum **combination** rules, **freshness/conflict** governance, **revised workflow** (no interactive questions), **tie supersession**, and **red-flag** governance vocabulary.
- **Medicine registry:** `ehas2-medicine-registry-v2` — exactly **38** medicines; **C11 excluded**; **no** replacement or remapping.
- Frozen [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) **historical body** is **not** silently rewritten; **Q3G-TIE** supersedes **future implementation** behavior for equal-tie follow-up questions (see §12).
- **Supersession:** The initial R1-CP-Q3G proposal (**D+A question bank**) is **rejected / superseded**. Current authority: **no** interactive clinical questions; **no** question bank; system evaluates doctor-supplied available evidence; missing evidence → structured gaps and fail-closed results.

---

## 3. R1-CP-Q3A — Blood typed clinical values (Decision **A**)

**Owner decision:** **A** — Separate typed Blood-axis clinical values.

Approved values (governance vocabulary only — **not** runtime enums):

| Value | Meaning (governance) |
|-------|----------------------|
| `BLOOD_AXIS_INVOLVEMENT_SUPPORTED` | Complete verified assessment supports Blood/circulation axis involvement under future owner-approved catalogs and Q3D minimum rules. |
| `NO_SUPPORTED_BLOOD_AXIS_INVOLVEMENT` | Complete verified assessment supports absence of supported Blood-axis involvement (requires completed assessment — not default). |
| `BLOOD_AXIS_UNDETERMINED` | Insufficient, incomplete, stale, unverified, contradictory, or clinically uncertain evidence for a supported or no-supported conclusion. |

Preserved boundaries:

- **Clinical value** is separate from **evidence status** (Q2/Q3 governance states).
- **SANGUINE** is integrated with the Blood axis but **insufficient alone** (Q2A).
- **BP alone is insufficient** for Blood-axis typing or for SANGUINE resolution without separate approved non-BP evidence (Rule 1 freeze).
- `NO_SUPPORTED_*` requires a **complete verified assessment** — not inference from absence of one report or keyword.
- **No** diagnosis claim, **no** medicine-selection claim, **no** guaranteed efficacy.
- **Future subdomains** (severity bands, arterial vs venous subtypes, etc.) are **not approved** in this record.

---

## 4. R1-CP-Q3B — Lymph typed clinical values (Decision **A**)

**Owner decision:** **A** — Separate typed Lymph-axis clinical values.

Approved values (governance vocabulary only):

| Value | Meaning (governance) |
|-------|----------------------|
| `LYMPH_AXIS_INVOLVEMENT_SUPPORTED` | Complete verified assessment supports Lymph-axis involvement under future catalogs and Q3D minimum rules. |
| `NO_SUPPORTED_LYMPH_AXIS_INVOLVEMENT` | Complete verified assessment supports absence of supported Lymph-axis involvement. |
| `LYMPH_AXIS_UNDETERMINED` | Evidence inadequate for supported or no-supported conclusion. |

Preserved boundaries:

- **LYMPHATIC** temperament is integrated but **insufficient alone** (Q2B).
- A **single** edema, swelling, or gland keyword is **insufficient** (Q2B).
- Suspicious or emergency findings **must not** be reduced to “lymph stagnation” or routine axis support without appropriate clinical review (Q2D).
- **No** medicine-selection claim; **future subdomains not approved**.

---

## 5. R1-CP-Q3C — Evidence-class matrix (Decision **A**)

**Owner decision:** **A** — Owner-signed evidence-class matrix (governance classes only).

Approved evidence classes:

| Class | Role |
|-------|------|
| `DOCTOR_RECORDED_SYMPTOM` | Symptom/complaint recorded in consultation input (patient-reported or clinician-recorded narrative). |
| `CLINICIAN_OBSERVED_SIGN` | Sign or examination finding observed by clinician (distinct from patient-reported symptom). |
| `VERIFIED_VITAL` | Vital measurement with approved verification metadata (e.g. BP, pulse — verification rules not numeric here). |
| `CLINICIAN_CONFIRMED_CONDITION` | Diagnosis or condition explicitly confirmed by clinician (not keyword or title alone). |
| `VALIDATED_INVESTIGATION` | Investigation/report with approved provenance and validation metadata. |
| `DISEASE_ORGAN_CONTEXT` | Disease, organ, or system context linking evidence to clinical target (mandatory separate role in Q3D). |
| `TEMPERAMENT_SUPPORT` | EH temperament support item (SANGUINE for Blood axis; LYMPHATIC for Lymph axis) — **support only**. |
| `SAFETY_RED_FLAG` | Safety/emergency candidate signal — **not** ordinary candidate evidence. |

Rules:

- Classes **do not** imply weights, priority, or scoring.
- `SAFETY_RED_FLAG` is **not** ordinary candidate evidence; it uses the **separate** red-flag path (Q3H).
- Blood-axis evaluation may use **SANGUINE** under `TEMPERAMENT_SUPPORT`; Lymph-axis may use **LYMPHATIC** under `TEMPERAMENT_SUPPORT`.
- **Patient-reported ≠ clinician-observed** — do not double-count the same fact across `DOCTOR_RECORDED_SYMPTOM` and `CLINICIAN_OBSERVED_SIGN`.
- **No single class alone** creates candidate eligibility or axis SUPPORT/NO_SUPPORTED conclusions.

Approved **provenance metadata fields** (governance record — **not** a live schema):

- `evidence_class`
- `source_kind` (consultation input, examination, vital device, imaging report, laboratory report, pathology report, history, photograph metadata, etc.)
- `recorder_role` (e.g. treating clinician)
- `recorded_at` / `effective_at` (temporal metadata — see Q3F)
- `verification_status` (governance vocabulary; not numeric)
- `report_or_study_reference` (internal identifier — **no** raw PHI in logs, CI, or reason-code strings)
- `version_or_revision`
- `supersedes_reference` (prior evidence id — audit trail)
- `axis_link` (Blood, Lymph, cross-cutting, or none)

---

## 6. R1-CP-Q3D — Minimum combination (Decision **A**)

**Owner decision:** **A** — Minimum evidence combination for axis **assessment** (not candidate eligibility).

For `BLOOD_AXIS_*` or `LYMPH_AXIS_*` supported / no-supported conclusions (future implementation), **all** of the following governance rules apply:

1. **At least two independent clinical evidence items** (distinct facts or distinct validated observations).
2. **At least two different ordinary evidence classes** from: `DOCTOR_RECORDED_SYMPTOM`, `CLINICIAN_OBSERVED_SIGN`, `VERIFIED_VITAL`, `CLINICIAN_CONFIRMED_CONDITION`, `VALIDATED_INVESTIGATION` (temperament and disease-context classes excluded from this pair).
3. **At least one corroborating verified/objective class** among: `CLINICIAN_OBSERVED_SIGN`, `VERIFIED_VITAL`, `VALIDATED_INVESTIGATION`, or `CLINICIAN_CONFIRMED_CONDITION` with explicit clinician confirmation (not keyword-only).
4. **`DISEASE_ORGAN_CONTEXT` is mandatory and separate** — it does **not** substitute for either of the two ordinary classes above.
5. Evidence must be **current, verified, internally consistent**, and **axis-linked** under future catalogs.
6. **No unresolved material contradiction** and **no unaddressed verified red flag** on the safety path (Q3F, Q3H).

**Independent evidence / no double-counting (examples — governance only):**

- The same complaint copied as both “symptom” and “sign” without separate observation → **one** item.
- Report title keyword without validated finding → **not** `VALIDATED_INVESTIGATION`.
- Diagnosis label and disease keyword from the **same** unverified phrase → **one** chain (see Q3E).
- `TEMPERAMENT_SUPPORT` **does not** replace objective corroboration.
- `DISEASE_ORGAN_CONTEXT` **cannot** be one of the two substitute ordinary classes.

Preserved:

- **Temperament does not replace** objective evidence.
- **Candidate eligibility is not created** by this minimum — only axis typing governance.
- `NO_SUPPORTED_*` requires **completed** assessment per catalogs — not default when data is sparse.
- **No** numerical scoring or thresholds approved here.

---

## 7. R1-CP-Q3E — Diagnosis / investigation policy (Decision **B+A**)

**Owner decision:** **B+A** — No blanket single-source substitution; diagnosis/investigation may contribute **one** verified/objective class when provenance rules are met.

Recorded rules:

- **No blanket** rule that one diagnosis or one report **alone** satisfies the full Q3D minimum.
- `CLINICIAN_CONFIRMED_CONDITION` or `VALIDATED_INVESTIGATION` may contribute **one** item toward the corroborating/objective requirement when separately proven.
- **Same investigation and derived diagnosis** from one chain count as **one** evidence chain unless **independently justified** by separate provenance.
- Disease **name**, report **title**, or **keyword** is **not** clinician confirmation or validated investigation.
- Validated report requires **approved provenance** (source, time, verification — future catalog).
- **No future exception** to substitution rules unless **separately owner-approved**.
- **Negative or normal** investigation result **alone** does **not** establish `NO_SUPPORTED_*` without complete assessment.
- **Red flags** use the **separate** safety path (Q3H), not ordinary axis substitution.

---

## 8. R1-CP-Q3F — Freshness, conflict, uncertainty (Decision **A**)

**Owner decision:** **A** — Evidence-specific freshness and conflict governance (no universal expiry duration).

Recorded rules:

- **Freshness is evidence-specific** — no single universal expiry duration is approved.
- **Required temporal and version metadata** per evidence item (see Q3C provenance).
- **Missing time** does **not** imply “current” by default.
- **Superseded** evidence is preserved in audit history but **not** counted as current support.
- **Material contradiction** → fail-closed (`CONTRADICTORY_EVIDENCE`, `NOT_EVALUABLE`, `DOCTOR_REVIEW_REQUIRED` per Q2/Q3) — **no** automatic winner.
- **No automatic source precedence matrix** — precedence catalog **not approved**.
- **Duplicate** (same fact, same source) vs **contradictory** (incompatible claims) must be distinguished in audit.
- **`CLINICALLY_UNCERTAIN`** → fail-closed for axis SUPPORT/NO_SUPPORTED; structured gaps; **no** guessing.
- After resolution, **complete versioned reassessment** of affected axes (future implementation).
- Clinician **acknowledgment** of uncertainty is **not** PASS or sufficient evidence.
- **No numerical freshness durations** approved in this record.

---

## 9. R1-CP-Q3G — Revised final workflow (Decision **REVISED FINAL**)

**Owner decision:** **REVISED FINAL** — Doctor-supplied input; system-led analysis; **no** interactive clinical questions.

### 9.1 Doctor input (available evidence)

At consultation start the doctor supplies **available** clinical information, including as applicable:

- all current problems/complaints;
- symptoms and available clinical context;
- duration, severity, progression (when available);
- doctor-observed clinical findings;
- vitals;
- suspected or confirmed disease/diagnosis;
- patient photograph when clinically applicable and **consent** exists;
- available MRI, CT, USG, X-ray, blood reports, pathology reports, and other laboratory/imaging/clinical reports;
- relevant medical history and current treatment information.

**Not every report type is mandatory** for every case. The system uses **only** doctor-supplied available evidence.

### 9.2 No interactive questioning

The system **does not** ask clinical questions during analysis. **Not permitted:**

- popup clinical questions;
- conversational follow-up questions;
- mandatory question bank;
- hidden questionnaire;
- medicine-directed questions;
- answer-dependent interrogation sequences.

The **initial Q3G D+A question-bank proposal is superseded.**

### 9.3 System-led processing

The system **evaluates authorized available evidence itself** (parse, classify, validate, source-bind, deduplicate, freshness-check, contradiction-check, relate to disease/organ-system, evaluate under future owner-approved EH principles) — **only** under future evidence catalogs, report extractors, clinical contracts, Rules 1–9, and versioned policies.

The system **never invents** missing symptoms, report values, diagnoses, indications, or medicines.

**Structured missing-evidence output** is **not** a question.

### 9.4 Outcomes

- **Sufficient** verified current consistent evidence → applicable typed clinical results; evidence-supported **candidate evaluation** under **future approved** Rules 1–9; **highest-supported** approved **draft** with reason and evidence trace.
- **Insufficient** incomplete stale unverified contradictory or clinically uncertain evidence → **fail-closed** (e.g. axis `*_UNDETERMINED`, `NOT_EVALUABLE`, `INSUFFICIENT_CLINICAL_EVIDENCE` where applicable, `ADDITIONAL_INFORMATION_REQUIRED`, `DOCTOR_REVIEW_REQUIRED`); **no** PASS; **no** guessing; **no** filler; **no** unsupported replacement; **no** successful final prescription.

**“Best”** means **highest-supported under available verified evidence** — **not** guaranteed cure, absolute certainty, or universal best for every case.

### 9.5 Professional summary (future intended content)

When authorized and implemented, the system generates a **professional clinical summary** including (future approved scope): supplied information; report-derived findings; disease/condition interpretation; active organ/system findings; EH temperament; Blood/Lymph assessment; evidence quality and limitations; medicine-selection reasoning; proposed formulas; proposed potency/dosage; per-formula clinical target; approved EH principle basis for each formula; conflicts, warnings, safety holds; monitoring/review requirements; versioned audit information.

**No** unsupported cure or guaranteed outcome language.

**Approved draft closing statement (Hindi):**

> यह clinical summary डॉक्टर द्वारा उपलब्ध कराई गई मरीज की जानकारी, clinical findings और reports के आधार पर system द्वारा तैयार की गई है। डॉक्टर इसे पढ़कर clinical review और approval करें। उपलब्ध जानकारी में कमी, बदलाव या त्रुटि होने पर system result बदल सकता है।

Final patient-facing / legal wording remains subject to **separate** privacy, legal, and clinical review.

### 9.6 Doctor-gated state machine

Canonical workflow states:

1. `INPUT_RECORDED`
2. `SYSTEM_ANALYSIS_COMPLETED`
3. `SYSTEM_DRAFT_SUMMARY_CREATED`
4. `DOCTOR_SUMMARY_REVIEW_REQUIRED`
5. `DOCTOR_SUMMARY_APPROVED`
6. `DRAFT_PRESCRIPTION_CREATED`
7. `DOCTOR_PRESCRIPTION_REVIEW_REQUIRED`
8. `DOCTOR_CORRECTION_RECORDED` (if applicable)
9. `FULL_SAFETY_REVALIDATION_REQUIRED` (if clinical content changed)
10. `FINAL_DOCTOR_APPROVAL`
11. `FINAL_PRESCRIPTION_CREATED`

Preserved:

- **No** draft prescription before **summary approval**.
- Draft prescription **≠** final prescription.
- **No** prescription release before **final doctor approval**.
- Material doctor corrections trigger **full applicable** clinical and safety **revalidation**.
- Doctor acknowledgment **cannot** clear a **hard safety blocker**, turn insufficient evidence into PASS, or validate unsupported medicine.
- **OD-014** applies when required **3/4/5** clinically justified mixtures cannot be completed without filler.

### 9.7 Medicine boundary (workflow)

- Pool: **registry-v2**, **38**, **C11 excluded**.
- **No** fixed, mandatory, default, or guaranteed medicine.
- **A1, A2, L1, S1** illustrative only (Q2).
- Dynamic selection only under **future approved Rule 6** and evidence — **not** authorized by this Q3 record.

### 9.8 Photograph and reports

- Consent and authorized clinical purpose; tenant isolation and access control.
- **No** raw patient data in logs, CI, fingerprints, or reason-code strings.
- Report/photo **absence** is **not** replaced by fabricated results.
- **Photo alone** cannot establish temperament, diagnosis, or medicine selection.
- Photo analysis remains **NOT_IMPLEMENTED** until separate owner approval.

---

## 10. R1-CP-Q3G-TIE — Equal-tie supersession (Decision **A**)

**Owner decision:** **A** — Supersede future interactive tie follow-up; exact tie → `UNRESOLVED_TIE`.

Explicit supersession:

- Frozen historical text in [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) describing **one follow-up question** on equal tie is **superseded for future EHAS2 implementation** by this Q3G-TIE record.
- Frozen historical body is **not** silently rewritten in place.

Future implementation behavior (governance):

- Process **all available doctor-supplied evidence first**.
- Apply **deterministic owner-approved tie rules** where such rules exist and are separately approved.
- **Exact remaining tie** → **`UNRESOLVED_TIE`** (not resolved via interactive question).
- **No** random, dictionary, first-key, or default temperament selection.
- **`MIXED` only when genuinely supported** by evidence — **not** as tie fallback.
- Present **typed gaps** and fail-closed states — **not** questions.
- Temperament-dependent prescription paths **blocked** when tie/unresolved blocks temperament-dependent requirements.
- **Independent** evidence paths (not temperament-blocked) may continue where owner rules allow.
- **OD-014** if required **3/4/5** mixtures cannot be justified.

---

## 11. R1-CP-Q3H — Red-flag governance (Decision **D+A**)

**Owner decision:** **D+A** — Owner-signed red-flag governance vocabulary and category-level candidates; exact catalog and thresholds deferred.

### 11.1 Status vocabulary (governance only — not executable)

| Status | Meaning (governance) |
|--------|----------------------|
| `RED_FLAG_NOT_EVALUATED` | Red-flag assessment not completed (e.g. insufficient safety inputs). |
| `RED_FLAG_SUSPECTED` | Suspicion raised; **not** verified emergency. |
| `RED_FLAG_VERIFIED` | Verified red flag per future catalog/rules. |
| `NO_RED_FLAG_SUPPORTED_AFTER_COMPLETE_ASSESSMENT` | Complete assessment found no supported red flag. |

### 11.2 Category-level candidates (metadata only — **not** executable catalog)

**Blood / circulation axis candidates (labels only):**

- severe bleeding / hemorrhage concern;
- acute circulatory deterioration;
- hypertensive crisis pattern (verification deferred);
- hypotensive shock concern (verification deferred).

**Lymph axis candidates (labels only):**

- unexplained persistent swelling or edema;
- suspicious lymphadenopathy;
- acute severe edema pattern (verification deferred).

**Cross-axis candidates (labels only):**

- acute systemic deterioration;
- severe inflammation with systemic concern;
- suspected malignancy or serious infection requiring urgent evaluation;
- material contradiction involving critical safety findings.

**Rules:**

- **Metadata only** — exact catalog, thresholds, and actions **deferred**.
- **Single keyword**, **photo alone**, or **report title alone** does **not** verify a red flag.
- `RED_FLAG_SUSPECTED` → **hold ordinary flow** + **urgent doctor review** (no interactive questions).
- `RED_FLAG_VERIFIED` → **immediate emergency escalation** governance state; **no** routine processing delay.
- **No** medicine, potency, or dosage change authorized by red-flag status alone.
- **No** final prescription on verified emergency path without separate owner-approved emergency workflow.
- **No** interactive questions.
- Future **Rule 5** / global safety engine responsibility remains **separate** and **NOT_IMPLEMENTED**.

---

## 12. Privacy and audit (Q3)

Future audit records should support (governance field list — **not** a live contract):

- axis and typed axis value;
- evidence class and provenance fields (§5);
- evidence governance status (Q2 vocabulary);
- temperament evidence (EH tokens);
- disease/organ context;
- conflicts and contradiction notes;
- reason and required action;
- red-flag status (§11);
- doctor-review requirement;
- workflow state (§9.6);
- evidence/version identifiers;
- deterministic audit context (inputs hash, rule/governance version stamps).

**No** raw PHI in logs, fingerprints, CI artifacts, or reason-code strings. Photo/report handling per §9.8. Superseded evidence preserved in audit trail.

---

## 13. Medicine boundary (Q3)

- **Registry-v2**; **38** medicines; **C11 excluded**; no replacement/remapping.
- **No** fixed, default, mandatory, or guaranteed medicine.
- **Q3 axis result does not select medicine.**
- Medicine-level evidence mappings and **Rule 6** require **separate** owner approval and activation.

---

## 14. Explicit unresolved / not authorized

**Not approved or implemented** by this record:

- symptom/sign catalogs;
- exact Blood/Lymph subdomains beyond the three values each;
- numeric thresholds and laboratory reference ranges;
- freshness durations;
- source-precedence matrix;
- contradiction resolution catalog;
- exact red-flag catalog and escalation actions;
- automated photo/report extraction;
- medicine-level evidence mappings;
- scoring weights;
- potency/dosage engine;
- Rule 1 implementation;
- Rule 6 implementation;
- Rule 5 activation;
- UI/runtime connection;
- production deployment;
- question bank;
- evidence catalog files.

---

## Decision index

| ID | Topic | Option recorded |
|----|--------|-----------------|
| R1-CP-Q3A | Blood typed values | **A** |
| R1-CP-Q3B | Lymph typed values | **A** |
| R1-CP-Q3C | Evidence classes | **A** |
| R1-CP-Q3D | Minimum combination | **A** |
| R1-CP-Q3E | Diagnosis/investigation | **B+A** |
| R1-CP-Q3F | Freshness/conflict | **A** |
| R1-CP-Q3G | Workflow (no questions) | **REVISED FINAL** |
| R1-CP-Q3G-TIE | Equal tie | **A** (`UNRESOLVED_TIE`; no follow-up question) |
| R1-CP-Q3H | Red flags | **D+A** |

**Authority tag:** OWNER_APPROVED_GOVERNANCE_BASELINE · **Runtime:** NOT_CONNECTED · **Clinical selection:** NOT_AUTHORIZED
