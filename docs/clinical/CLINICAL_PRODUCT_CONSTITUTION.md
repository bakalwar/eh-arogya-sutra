# Clinical Product Constitution

Permanent product requirements for E.H. AROGYA SUTRA 2. Guard tests protect these strings. This document does **not** prove clinical correctness.

## A. Scale

- Target up to **100,000 registered doctors**
- Registered, active, and concurrent doctors are **separate metrics**
- No free-server 100,000-doctor claim
- Load testing required before production

## B. Patient input

Future verified engine will process:

- chief complaint
- complete symptoms
- vitals
- duration
- severity
- phase
- affected organ/body site
- doctor-entered clinical context
- lifestyle evidence
- verified structured report findings
- supported clinical/report images through temporary processing
- emergency/red-flag evidence

## C. Image safety

Do not claim that an ordinary patient photo can reliably determine every disease, prakriti, or temperament.

Separate:

- ordinary patient photo
- lesion/skin image
- medical-report photo
- radiology image
- prescription photo

Only validated supported image types may influence analysis.

**No original photo/PDF may be stored permanently.**

## D. Nine-rule engine

Future integration must use the verified versioned **nine-rule engine**.

### Rule 1 — Temperament Engine (Phase 5R-1F freeze)

**Status:** OWNER-APPROVED specification · EHAS2 **NOT_IMPLEMENTED** · legacy reference LIVE_BUT_PARTIAL only.

- Canonical name: **Temperament Engine** (Rule 1).
- EH Temperament outputs: `LYMPHATIC`, `SANGUINE`, `BILIOUS_HEPATIC`, `NERVOUS`, `MIXED`, `UNKNOWN`.
- **EH Temperament** and **Tridosha mapping** (`dosha_mapping`, `dosha_classification`) are **separate fields** — do not collapse into one ambiguous `prakriti` string.
- Insufficient evidence → `UNKNOWN` and `ADDITIONAL_INFORMATION_REQUIRED` — no silent Lymphatic, Mixed, or Balanced default; no dictionary-order tie-break.
- BP (systolic ≥140 / <100) is **supporting evidence only** (+3 Sanguine / +2 Lymphatic) and requires separate approved symptom or observation evidence before a resolved temperament.
- Photos: supporting observation only; never sole authority; no skin-colour or ordinary-face automatic temperament.
- Rule 1 supplies evidence to downstream engines; it **must not** directly select medicine, formula, potency, electricity, tablet, or external application.
- Full spec: [rules/rule-01-temperament-engine.md](./rules/rule-01-temperament-engine.md).

### Rule 2 — Polarity Engine (Phase 5R-2F freeze)

**Status:** OWNER-APPROVED specification · EHAS2 **NOT_IMPLEMENTED** · legacy reference LIVE_BUT_PARTIAL only.

- Canonical name: **Polarity Engine** (Rule 2).
- **Formula-specific** disease polarity + **required therapeutic polarity** per formula; **`mutates_mixtures` = false** — annotation only.
- Rule 2 **must not** select medicine, potency, electricity, mixture count, or target pathology, or issue prescriptions.
- Law of opposites: POSITIVE disease → NEGATIVE therapeutic; NEGATIVE disease → POSITIVE therapeutic; resolved neutral support → NEUTRAL therapeutic.
- UNRESOLVED → `required_therapeutic_polarity` NEUTRAL, `OWNER_APPROVED_NEUTRAL_FALLBACK`, `doctor_review_required`; do not overwrite raw uncertainty as proven neutral disease state.
- SUPPORT_ONLY distinct from UNRESOLVED; support formulas → NEUTRAL therapeutic, `RESOLVED_SUPPORT_ROLE`.
- No global case polarity on all formulas; BP/report/photo isolation per owner spec.
- `case_polarity_summary` display-only; `formula_polarities` authoritative for downstream annotation consumers (not direct selection by Rule 2).
- Potency and electricity selection: separate engines (**AUDIT_PENDING**).
- Full spec: [rules/rule-02-polarity-engine.md](./rules/rule-02-polarity-engine.md).

### Rule 3 — Organ-System Affinity Engine (Phase 5R-3F freeze)

**Status:** OWNER-APPROVED specification · EHAS2 **NOT_IMPLEMENTED** · legacy reference LIVE_AND_AUTHORITATIVE_BUT_CONFLICTED only.

- Canonical name: **Organ-System Affinity Engine** (Rule 3).
- UI name: **Rule 3 — Active Organ Systems**.
- **Organ-System Triad** is a separate concept — rule number **AUDIT_PENDING** (not Rule 3).
- Parallel model: normalized evidence → **Rule 1 Temperament Engine** and **Rule 3 Organ-System Affinity Engine**; neither mutates the other’s frozen result.
- Structured evidence only — no concatenating report/photo text into a global symptom blob.
- UNRESOLVED: `active_systems = []`, `INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE`, `prescription_issue_allowed = false`; **no automatic METABOLIC fallback**.
- Report/photo isolation per owner spec; ordinary photo must not set organ system.
- Rule 3 may supply evidence downstream; it **must not** select medicine, potency, electricity, dosage, or final prescription.
- Full spec: [rules/rule-03-organ-system-affinity.md](./rules/rule-03-organ-system-affinity.md).

Every result must record:

- engine version
- rules version
- disease-data version
- medicine-data version
- input hash
- evidence
- confidence
- unresolved reason

## E. Automatic clinical assessment

System will recommend:

- disease candidates
- affected systems/organs
- primary target
- root cause
- polarity
- temperament (EH Temperament Engine — Rule 1; owner-frozen tokens)
- dosha mapping (Tridosha — separate from temperament)
- constitution
- severity/phase
- emergency warning

Every derived value needs evidence and confidence.

Do not force a result when evidence is insufficient or conflicting. Return UNKNOWN/UNRESOLVED with reason.

## F. Dynamic prescription

- no patient-name hardcoding
- no fixed medicine/formula
- no frontend medicine selection
- no silent clinical fallback

Oral formulas:

- Simple → **3**
- Moderate → **4**
- Complex/multi-system → **5**
- never only 1 or 2
- no unjustified repetition
- formula-specific potency
- formula-specific electricity
- **no default WE**

#### OD-013 — Oral mixture count clarification

**Status:** OWNER-APPROVED clarification · recorded 2026-08-05 · documentation only.

- EHAS2 uses one total oral-mixture count per complexity tier: Simple → exactly **3**, Moderate → exactly **4**, Complex/multi-system → exactly **5**.
- “3+1”, “4+1”, and “5+1” are not authorized EHAS2 oral-mixture-count variants, composition rules, or presentation labels.
- Tablet A, Tablet B, and external treatment are separate prescription sections; none is the “+1” in an oral-mixture count.
- `SUPPORT_ONLY` / `RESOLVED_SUPPORT_ROLE` is a Rule 2 polarity classification and must not add an oral mixture or change the settled count.
- Formula 1 / Formula 2 / Formula 3 temperament-evidence roles do not define oral-mixture composition.
- Implementers must not generate an extra oral mixture from undefined “+1” shorthand, change the settled 3/4/5 totals, add filler or unsupported medicines, or count tablet/external sections as oral mixtures.
- The separate fail-closed / insufficient-evidence policy remains subject to its own documented Phase 5D sign-off; this clarification does not approve or alter that policy.

#### OD-014 — Insufficient-evidence fail-closed policy

**Status:** OWNER-APPROVED safety policy · recorded 2026-08-05 · documentation only.

When the available clinical evidence cannot justify the required 3/4/5 oral mixtures without filler or unsupported medicines:

- EHAS2 must not issue a prescription or represent generation as successful.
- EHAS2 must not add filler, fixed, weakly supported, or fabricated medicines merely to satisfy the required count.
- The result must return the typed state `INSUFFICIENT_CLINICAL_EVIDENCE`.
- The result must set `DOCTOR_REVIEW_REQUIRED` and identify the additional information/evidence required.
- The result must emit zero fake or partial oral formulas; an empty formula set must not be presented as successful generation.
- After additional evidence is supplied, the complete clinical assessment and prescription evaluation must run again under the applicable versioned rules.
- This policy resolves the safety conflict between mandatory 3/4/5 totals and the prohibition on unsupported fillers by failing closed rather than fabricating treatment.

This approval closes the policy decision only. It does not formally freeze the nine-rule bundle, start Phase 5D implementation, connect the production clinical engine, authorize prescription issuance, deploy the system, or modify the legacy engine.

Tablet A/B:

- independent selection from verified full **38**-medicine pool (CQ-001A; `ehas2-medicine-registry-v2`)
- not copied from oral formulas
- disease, symptoms, organ, clinical target, temperament, constitution, severity, phase and polarity evidence
- empty Section B slot: `NO_CLINICALLY_JUSTIFIED_CANDIDATE`

External applications:

- organ/body-site specific
- clinically justified
- not blindly copied from oral formulas
- no forced formula only to reach a count

## G. Patient-specific summary

Summary must come from structured engine output and contain:

- report findings
- clinical assessment
- polarity
- prakriti
- temperament
- constitution
- root cause/systems
- oral formulas
- potency/electricity
- Tablet A/B
- external applications
- diet/guidance
- safety/follow-up
- Stage 2–6
- evidence and versions

Renderer must never invent clinical information.

## H. Doctor review

System generates the recommendation automatically.

Doctor does not manually select medicines during generation.

Before the recommendation becomes an issued prescription, doctor must:

- review
- accept
- modify with reason
- reject
- or request clarification

Modification creates a new version. The original generated result remains preserved as immutable versioned clinical history.
