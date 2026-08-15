# Clinical Product Constitution

Permanent product requirements for E.H. AROGYA SUTRA 2. Guard tests protect these strings. This document does **not** prove clinical correctness.

## Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

Electrohomeopathy **clinical** content and meaning (सिद्धांत; disease/symptom/target interpretation; temperament/constitution meaning; medicine eligibility/ranking/selection/rejection; relationship/combination edges; formula composition; contraindications/exclusions; mixture-count clinical policy; potency; dosage; electricity; Tablet A/B; external applications; monitoring/follow-up clinical rules; emergency clinical behavior; clinical thresholds/weights; evidence validation and clinical approval status) require **explicit owner approval** by Dr. Ghanshyam Bakalwar before addition or change. AI/engineering must not invent these decisions. Unresolved clinical decision → **STOP** and ask owner.

**Technical engineering** may proceed autonomously **within already approved clinical contracts** for architecture, schemas/types, canonicalization/validation, deterministic ordering, immutability, fixed error taxonomy, tests/CI, security/privacy, performance bounds, package/workspace integration, API/database/frontend engineering, PHI-free observability, and meaning-preserving refactors.

Owner approval remains required for technical work that introduces cost/paid services, changes security policy, accesses protected data, changes clinical meaning, connects production/runtime, deploys externally, or modifies the legacy system.

**Global cost lock:** `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`.

Rule 1 Temperament Engine canonical contract (`TEMPERAMENT_ENGINE`; identity/scope owner-locked; shadow medicine-selection influence **NONE**; synthetic shadow evaluator **IMPLEMENTED** (`@ehas2/rule1` / `evaluateRule1Shadow`; PR #98); technical `READY_FOR_VALIDATION`; real validated mappings **0**; evidence catalog **NOT_CREATED**; production registry empty/fail-closed; Rule 8 separation locked; orchestration **NOT_CONNECTED**; clinical activation **NONE**; prescription effect **NONE**): [rules/rule-01-temperament-engine-contract.md](./rules/rule-01-temperament-engine-contract.md) (`R1_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`). Post-merge shadow evidence: [rules/rule-01-temperament-engine-implementation-evidence.md](./rules/rule-01-temperament-engine-implementation-evidence.md) (`RULE1_SHADOW_EVALUATOR_IMPLEMENTED`). Frozen clinical specification (body preserved): [rules/rule-01-temperament-engine.md](./rules/rule-01-temperament-engine.md).

Rule 2 Polarity Engine canonical contract (`POLARITY_ENGINE`; identity/scope owner-locked; synthetic shadow evaluator **IMPLEMENTED** (`@ehas2/rule2` / `evaluateRule2Shadow`; PR #101); technical `READY_FOR_VALIDATION`; real polarity mappings **0**; evidence catalog **NOT_CREATED**; production registry empty/fail-closed; formula mutation **NONE**; medicine-selection influence **NONE**; Rule 4 **not** connected; orchestration **NOT_CONNECTED**; clinical activation **NONE**; prescription effect **NONE**): [rules/rule-02-polarity-engine-contract.md](./rules/rule-02-polarity-engine-contract.md) (`R2_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`). Post-merge shadow evidence: [rules/rule-02-polarity-engine-implementation-evidence.md](./rules/rule-02-polarity-engine-implementation-evidence.md) (`RULE2_SHADOW_EVALUATOR_IMPLEMENTED`). Frozen clinical specification (body preserved): [rules/rule-02-polarity-engine.md](./rules/rule-02-polarity-engine.md).

Rule 6 post-merge shadow evidence pointer: [rules/rule-06-multi-disease-organ-system-triad-implementation-evidence.md](./rules/rule-06-multi-disease-organ-system-triad-implementation-evidence.md).

Rule 6 relationship-data / evidence-intake contract (empty active registry; CE-OD-01…05; **no** real edges): [rules/rule-06-relationship-data-and-evidence-intake-contract.md](./rules/rule-06-relationship-data-and-evidence-intake-contract.md).

Rule 7 External Use Routes canonical contract (`EXTERNAL_USE_ROUTES`; shadow-only): [rules/rule-07-external-use-routes-contract.md](./rules/rule-07-external-use-routes-contract.md). Post-merge shadow evidence: [rules/rule-07-external-use-routes-implementation-evidence.md](./rules/rule-07-external-use-routes-implementation-evidence.md) (`RULE7_SHADOW_EVALUATOR_IMPLEMENTED`; orchestration **NOT_CONNECTED**; clinical activation **NONE**; real route/site mappings **0**).

Rule 8 Disease-level Prakruti Inference canonical contract (`DISEASE_LEVEL_PRAKRUTI_INFERENCE`; shadow-only): [rules/rule-08-disease-level-prakruti-inference-contract.md](./rules/rule-08-disease-level-prakruti-inference-contract.md). Post-merge shadow evidence: [rules/rule-08-disease-level-prakruti-inference-implementation-evidence.md](./rules/rule-08-disease-level-prakruti-inference-implementation-evidence.md) (`RULE8_SHADOW_EVALUATOR_IMPLEMENTED`; orchestration **NOT_CONNECTED**; clinical activation **NONE**; medicine-selection influence **NONE**; real disease→prakriti mappings **0**; separate from Rule 1; `NOT_REQUIRED_FOR_PRESCRIPTION`; clinical dashboard remains **`NOT_IMPLEMENTED`**).

Rule 9 Master Pipeline canonical contract (`MASTER_PIPELINE`; validate/reject/package-only; shadow-only): [rules/rule-09-master-pipeline-contract.md](./rules/rule-09-master-pipeline-contract.md). Post-merge shadow evidence: [rules/rule-09-master-pipeline-implementation-evidence.md](./rules/rule-09-master-pipeline-implementation-evidence.md) (`RULE9_SHADOW_VALIDATOR_IMPLEMENTED`; PR #95; orchestration **NOT_CONNECTED**; clinical activation **NONE**; medicine-selection influence **NONE**; prescription effect **NONE**; real clinical data/mappings **0**; technical `READY_FOR_VALIDATION` ≠ clinical readiness; complexity criteria **not** implemented).

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

### Rule 1 — Temperament Engine (Phase 5R-1F freeze + canonical contract)

**Status:** OWNER-APPROVED specification · identity token **`TEMPERAMENT_ENGINE`** owner-locked (`R1_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`) · focused canonical contract documented · EHAS2 synthetic shadow evaluator **IMPLEMENTED** (`@ehas2/rule1` / `evaluateRule1Shadow`; PR #98; `RULE1_SHADOW_EVALUATOR_IMPLEMENTED`) · technical `READY_FOR_VALIDATION` · `affectsClinicalSelection: false` · orchestration **NOT_CONNECTED** · clinical activation **NONE** · medicine-selection influence **NONE** · prescription effect **NONE** · production Rx **unchanged** · real validated mappings **`0`** · evidence catalog **NOT_CREATED** · production registry empty/fail-closed · legacy reference LIVE_BUT_PARTIAL only. Post-merge evidence: [rules/rule-01-temperament-engine-implementation-evidence.md](./rules/rule-01-temperament-engine-implementation-evidence.md).

- Canonical name: **Temperament Engine** (Rule 1); machine identity **`TEMPERAMENT_ENGINE`**. Historical interface/dashboard alias “Temperament (Prakriti)” is superseded for identity readiness and does not prove production readiness.
- Focused canonical contract: [rules/rule-01-temperament-engine-contract.md](./rules/rule-01-temperament-engine-contract.md).
- EH Temperament outputs: `LYMPHATIC`, `SANGUINE`, `BILIOUS_HEPATIC`, `NERVOUS`, `MIXED`, `UNKNOWN`.
- **EH Temperament** and **Tridosha mapping** (`dosha_mapping`, `dosha_classification`) are **separate fields** — do not collapse into one ambiguous `prakriti` string.
- Insufficient evidence → `UNKNOWN` and `ADDITIONAL_INFORMATION_REQUIRED` — no silent Lymphatic, Mixed, or Balanced default; no dictionary-order tie-break.
- Exact remaining equal tie → **`UNRESOLVED_TIE`** (Q3G-TIE normative for future implementation); no interactive question bank.
- BP (systolic ≥140 / <100) is **supporting evidence only** (+3 Sanguine / +2 Lymphatic) and requires separate approved symptom or observation evidence before a resolved temperament.
- Photos: supporting observation only; never sole authority; no skin-colour or ordinary-face automatic temperament.
- Rule 1 **must not** directly select medicine, formula, potency, electricity, tablet, or external application. First shadow medicine-selection influence is **`NONE`** (R1-ID-03); historical impact-matrix “YES” = future downstream evidence influence only.
- Separate from Rule 8 disease-level prakriti — no overwrite / silent merge; conflict fail-closed pending separate reconciliation contract.
- Full frozen clinical spec (body preserved): [rules/rule-01-temperament-engine.md](./rules/rule-01-temperament-engine.md).
- **Blood / Lymph governance (R1-CP-Q2):** Integrated SANGUINE/Blood and LYMPHATIC/Lymph axis decisions are recorded in [rules/rule-01-blood-lymph-owner-decisions.md](./rules/rule-01-blood-lymph-owner-decisions.md) — **governance-only**, **NOT_IMPLEMENTED**, **NOT_CONNECTED**; no direct or fixed medicine selection; future Rule 6 candidate use requires separate owner approval and evidence rules.
- **Evidence / workflow governance (R1-CP-Q3):** Typed Blood/Lymph axis values, evidence classes, minimum combination rules, no-interactive-question workflow, tie supersession, and red-flag vocabulary are recorded in [rules/rule-01-q3-evidence-workflow-owner-decisions.md](./rules/rule-01-q3-evidence-workflow-owner-decisions.md) — **governance-only**, **NOT_IMPLEMENTED**, **NOT_CONNECTED**; no direct medicine selection; future Rule 6 and separate owner activation required.

### Rule 2 — Polarity Engine (Phase 5R-2F freeze)

**Status:** OWNER-APPROVED specification · identity/scope **OWNER_LOCKED** (`POLARITY_ENGINE`) · focused canonical contract **documented** · EHAS2 synthetic shadow evaluator **IMPLEMENTED** (`@ehas2/rule2` / `evaluateRule2Shadow`; PR #101; `RULE2_SHADOW_EVALUATOR_IMPLEMENTED`) · technical `READY_FOR_VALIDATION` · `affectsClinicalSelection: false` · mappings **0** · catalog **NOT_CREATED** · medicine influence **NONE** · formula mutation **NONE** · orch **NOT_CONNECTED** · activation/Rx **NONE** · legacy reference LIVE_BUT_PARTIAL only. Post-merge evidence: [rules/rule-02-polarity-engine-implementation-evidence.md](./rules/rule-02-polarity-engine-implementation-evidence.md).

- Canonical name: **Polarity Engine** (Rule 2); machine identity **`POLARITY_ENGINE`** (`R2_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`). Short EH_9/interface label “Polarity” = historical alias only.
- **Formula-specific** disease polarity + **required therapeutic polarity** per formula; **`mutates_mixtures` = false** — annotation only.
- Rule 2 **must not** select medicine, potency, electricity, mixture count, or target pathology, or issue prescriptions.
- Law of opposites: POSITIVE disease → NEGATIVE therapeutic; NEGATIVE disease → POSITIVE therapeutic; resolved neutral support → NEUTRAL therapeutic. **MIXED** → UNRESOLVED + therapeutic NEUTRAL + doctor review (`R2-ID-02`); no legacy coerce.
- UNRESOLVED → `required_therapeutic_polarity` NEUTRAL, `OWNER_APPROVED_NEUTRAL_FALLBACK`, `doctor_review_required`; do not overwrite raw uncertainty as proven neutral disease state.
- SUPPORT_ONLY distinct from UNRESOLVED; support formulas → NEUTRAL therapeutic, `RESOLVED_SUPPORT_ROLE`.
- No global case polarity on all formulas; BP/report/photo isolation per owner spec.
- `case_polarity_summary` display-only; `formula_polarities` authoritative for downstream annotation consumers (not direct selection by Rule 2).
- Empty real registry / fail-closed; medicine-registry `.polarity` is **not** Rule 2 disease-polarity evidence.
- Potency and electricity selection: separate engines (**AUDIT_PENDING**).
- Focused canonical contract: [rules/rule-02-polarity-engine-contract.md](./rules/rule-02-polarity-engine-contract.md). Post-merge shadow evidence: [rules/rule-02-polarity-engine-implementation-evidence.md](./rules/rule-02-polarity-engine-implementation-evidence.md). Frozen clinical body: [rules/rule-02-polarity-engine.md](./rules/rule-02-polarity-engine.md).

### Rule 3 — Organ-System Affinity Engine (Phase 5R-3F freeze)

**Status:** OWNER-APPROVED specification · identity/scope **OWNER_LOCKED** (`ORGAN_SYSTEM_AFFINITY`) · focused canonical contract **documented** · EHAS2 runtime evaluator **NOT_IMPLEMENTED** / **NOT_AUTHORIZED** · package absent · mappings **0** · catalog **NOT_CREATED** · no closed real organ-system catalog · medicine influence **NONE** · orch **NOT_CONNECTED** · activation/Rx **NONE** · legacy reference LIVE_AND_AUTHORITATIVE_BUT_CONFLICTED only.

- Canonical name: **Organ-System Affinity Engine** (Rule 3).
- Machine identity: **`ORGAN_SYSTEM_AFFINITY`** (`R3-ID-01`).
- UI name: **Rule 3 — Active Organ Systems**.
- Historical / non-authoritative interface alias: **Organ / System Affinity** (`R3-ID-02`).
- **Organ-System Triad** is a separate concept — rule number **AUDIT_PENDING** (not Rule 3).
- Parallel model: normalized evidence → **Rule 1 Temperament Engine** and **Rule 3 Organ-System Affinity Engine**; neither mutates the other’s frozen result.
- Structured evidence only — no concatenating report/photo text into a global symptom blob.
- UNRESOLVED: `active_systems = []`, `INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE`, `prescription_issue_allowed = false`; **no automatic METABOLIC fallback**.
- Report/photo isolation per owner spec; ordinary photo must not set organ system.
- Rule 3 may supply evidence downstream; it **must not** select medicine, potency, electricity, dosage, or final prescription.
- Focused canonical contract: [rules/rule-03-organ-system-affinity-contract.md](./rules/rule-03-organ-system-affinity-contract.md) (`R3_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`). Frozen clinical body: [rules/rule-03-organ-system-affinity.md](./rules/rule-03-organ-system-affinity.md).

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
