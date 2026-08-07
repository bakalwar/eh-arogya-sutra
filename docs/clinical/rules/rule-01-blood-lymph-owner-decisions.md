# Rule 1 — Blood / Lymph Owner Decisions (R1-CP-Q2)

## 1. Document control

| Field | Value |
|-------|--------|
| **Title** | Rule 1 — Blood / Lymph Owner Decisions (R1-CP-Q2) |
| **Decision phase** | R1-CP-Q2 |
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Canonical base SHA** | `a14b1c3d203a57f72440f996a3807190c208dbb6` |
| **Status** | OWNER_APPROVED_GOVERNANCE_BASELINE |
| **Implementation status** | NOT_IMPLEMENTED |
| **Runtime status** | NOT_CONNECTED |
| **Clinical selection activation** | NOT_AUTHORIZED |

This file records **owner-approved governance decisions** only. It does not activate engines, contracts, scoring, or prescription behavior.

---

## 2. Scope and non-claims

This document is **documentation and governance only**.

It explicitly does **not** authorize or imply:

- clinical code changes;
- scoring weights;
- numeric thresholds;
- lab ranges or lab interpretation rules;
- medicine selection or recommendation;
- potency or dosage decisions;
- Rule 5 evidence activation;
- production or runtime connection.

No statement herein claims clinical efficacy for any medicine, measurable “purification” unless separately owner-defined, or Vata/Pitta/Kapha-based medicine-selection rules.

Legacy temperament-to-medicine shortcuts are **not** authority for EHAS2.

---

## 3. R1-CP-Q2A — Integrated SANGUINE / Blood axis (Decision **B**)

**Owner decision:** **B** — Integrated SANGUINE/Blood axis.

Recorded meaning (faithful; not expanded):

- Under the approved Electrohomeopathy (EH) principle, **SANGUINE** is clinically related to **Blood, arteries, and circulation**.
- **SANGUINE alone does not prove Blood pathology.** SANGUINE is an EH temperament token, not a disease diagnosis.
- **BP alone is supporting evidence only** (consistent with frozen Rule 1 temperament boundaries).
- **SANGUINE plus sufficient Blood/arterial/circulatory evidence** may support **future candidate eligibility** (Rule 6 and downstream consumers remain **NOT_AUTHORIZED** until separately approved).
- **A1** and **A2** are **illustrative examples only**.
- **No direct or automatic SANGUINE → A1/A2 shortcut** is approved.

---

## 4. R1-CP-Q2B — Integrated LYMPHATIC / Lymph axis (Decision **B**)

**Owner decision:** **B** — Integrated LYMPHATIC/Lymph axis.

Recorded meaning (faithful; not expanded):

- Under the approved EH principle, **LYMPHATIC** is clinically related to the **Lymph axis**.
- **LYMPHATIC alone does not prove lymph pathology.** LYMPHATIC is an EH temperament token, not lymph disease by itself.
- A **single** edema, swelling, or gland keyword is **insufficient** to establish lymph-axis clinical support.
- **LYMPHATIC plus sufficient verified lymph-related evidence** may support **future candidate eligibility** (Rule 6 and downstream consumers remain **NOT_AUTHORIZED** until separately approved).
- **L1**, **S1**, and **Scrofoloso** references are **illustrative only**.
- **No direct or automatic LYMPHATIC → L1/S1 shortcut** is approved.

---

## 5. R1-CP-Q2C — Structured Blood / circulation evidence model (Decision **A**)

**Owner decision:** **A** — Structured Blood/circulation evidence model.

Approved **multi-source categories** (governance vocabulary; not an executable catalog):

- doctor-recorded symptoms;
- doctor-observed signs;
- supporting vitals;
- clinician-confirmed diagnosis/condition;
- validated investigations;
- disease and organ/system context.

Explicit boundaries:

- **No single** symptom, vital, diagnosis keyword, or temperament is **sufficient** on its own.
- **Exact** evidence combinations, field definitions, lab interpretations, weights, and thresholds remain **OWNER_DECISION_REQUIRED**.
- This section is **metadata/governance only** — not a runtime schema or scoring table.

---

## 6. R1-CP-Q2D — Structured Lymph evidence model (Decision **A**)

**Owner decision:** **A** — Structured Lymph evidence model.

Approved **multi-source categories** (governance vocabulary; not an executable catalog):

- doctor-recorded symptoms;
- doctor-observed examination findings;
- clinician-confirmed condition;
- validated investigations;
- disease/organ context;
- safety and alternative-cause review.

**Safety rule (preserved):**

Unexplained persistent swelling, suspicious lymph nodes, acute deterioration, severe inflammation, systemic red flags, or contradictory findings **must not** be reduced to “lymph stagnation” or treated as routine lymph-axis evidence without appropriate clinical review.

As with Q2C:

- **No single** source category is sufficient alone.
- Exact combinations, definitions, and thresholds remain **OWNER_DECISION_REQUIRED**.
- Governance/metadata only — **not** implementation.

---

## 7. R1-CP-Q2E — Evidence governance vocabulary (Decision **A+D**)

**Owner decision:** **A+D** — Fail-closed policy plus **additional-information** policy.

Approved **governance evidence states** (vocabulary only):

- `SUFFICIENT_VERIFIED_EVIDENCE`
- `MISSING_EVIDENCE`
- `INCOMPLETE_EVIDENCE`
- `STALE_EVIDENCE`
- `UNVERIFIED_EVIDENCE`
- `CONTRADICTORY_EVIDENCE`
- `CLINICALLY_UNCERTAIN`
- `NOT_EVALUABLE`

These tokens are **governance vocabulary only**.

**No** enum, API contract, database field, or runtime implementation is authorized by this record.

---

## 8. Fail-closed policy

When Blood/Lymph-related evidence is **missing, incomplete, stale, unverified, contradictory, or clinically uncertain**, the governance baseline records:

- `NOT_EVALUABLE`;
- `ADDITIONAL_INFORMATION_REQUIRED`;
- `DOCTOR_REVIEW_REQUIRED`;
- **no** PASS;
- **no** default;
- **no** guessing;
- **no** automatic medicine candidate;
- **no** auto-prescription.

This aligns with frozen Rule 1 no-guess behavior for temperament and extends the same governance intent to future Blood/Lymph integration — **without** implementing that integration here.

---

## 9. Selection boundary

Recorded precisely:

- If a **candidate relationship** depends on Blood/Lymph evidence, **insufficient** evidence **prevents that candidate relationship** (candidate eligibility is not prescription authorization).
- Blood/Lymph **`NOT_EVALUABLE`** does **not** automatically block **every** prescription when **independent sufficient owner-approved evidence** exists for other candidates or mixture slots.
- **OD-014** applies if clinically justified required **3/4/5** oral mixtures cannot be completed under owner-approved mixture policy.
- **No filler** or unsupported replacement is allowed.

Rule 1 and future Rule 6 must not treat integrated-axis decisions as permission to bypass mixture evidence safety policy.

---

## 10. Emergency boundary

- Verified **emergency / red-flag** handling must **not** wait for missing-data processing paths intended for non-urgent evidence gaps.
- Rule 1 and Rule 6 do **not**, by themselves, alter medicine, potency, or dosage **because of an emergency**; emergency workflows remain separate owner-approved safety paths.

---

## 11. No-fixed-medicine rule

Unambiguous baseline:

- **A1**, **A2**, **L1**, and **S1** are **examples only**.
- **No** medicine is fixed, mandatory, default, or guaranteed.
- Any medicine from the canonical **38-medicine** registry (`ehas2-medicine-registry-v2`, **C11 excluded**) may become a **future Rule 6 candidate** only when applicable **owner-approved clinical evidence** supports it.
- **Candidate eligibility is not prescription authorization.**

No medicine beyond registry v2; **C11** is not added, replaced, or remapped by this record.

---

## 12. Future audit fields

When Blood/Lymph integration is implemented in a future owner-approved phase, audit records should be capable of capturing at least:

- axis (Blood/circulation vs Lymph);
- evidence status (governance vocabulary above);
- evidence sources (by approved category, not free-form legacy shortcuts);
- temperament evidence (EH tokens, separate from pathology claims);
- disease/organ context;
- conflicts;
- reason;
- required action;
- evidence/version identifiers;
- doctor-review requirement;
- deterministic audit context (stable inputs + rule/governance version references).

Listing these fields is **documentation only** — not a contract freeze.

---

## 13. Unresolved future decisions

The following remain **not approved** by this record:

- exact symptom/sign catalogs;
- exact Blood/Lymph typed clinical values;
- minimum evidence combinations;
- lab/imaging interpretation;
- numeric thresholds;
- scoring weights;
- medicine-level relationships;
- conflict precedence rules;
- Rule 6 contracts and implementation;
- clinical activation in runtime or production.

---

## 14. Relationship to existing authority

- The existing frozen Rule 1 temperament specification ([rule-01-temperament-engine.md](./rule-01-temperament-engine.md), [rule-01-owner-decisions.md](./rule-01-owner-decisions.md)) remains **unchanged** by this delivery.
- This file adds an **owner-approved governance baseline** for **future** Blood/Lymph integration alongside Rule 1 — it does **not** silently modify those frozen documents.
- **Medicine registry v2** remains exactly **38** medicines with **C11 excluded**; C11 is **not** replaced or remapped.
- **Rule 5** remains **NOT_IMPLEMENTED**.

---

## Decision index

| ID | Decision | Option recorded |
|----|----------|-----------------|
| R1-CP-Q2A | SANGUINE / Blood axis | **B** — Integrated axis |
| R1-CP-Q2B | LYMPHATIC / Lymph axis | **B** — Integrated axis |
| R1-CP-Q2C | Blood/circulation evidence | **A** — Structured multi-source categories |
| R1-CP-Q2D | Lymph evidence | **A** — Structured multi-source categories |
| R1-CP-Q2E | Missing/uncertain evidence | **A+D** — Fail-closed + additional-information |

**Authority tag:** OWNER_APPROVED_GOVERNANCE_BASELINE · **EHAS2 runtime:** NOT_CONNECTED · **Clinical selection:** NOT_AUTHORIZED
