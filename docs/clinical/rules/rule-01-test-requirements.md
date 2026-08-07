# Rule 1 — Test Requirements (Post-Freeze)

**Rule 1 runtime in EHAS2:** NOT_IMPLEMENTED
**Legacy coverage verdict (Phase 5R-1):** FAIL — no dedicated `detect_prakriti` unit tests
**This document:** IMPLEMENTATION-PENDING test plan aligned to owner-approved spec

Tests must not be treated as clinical proof until owner accepts scenarios.

---

## Required before Rule 1 implementation sign-off

### Direct unit tests (Temperament Engine module)

| ID | Scenario | Expected (owner spec) |
|----|----------|------------------------|
| R1-T01 | No symptom/clinical evidence; BP neutral | UNKNOWN; ADDITIONAL_INFORMATION_REQUIRED |
| R1-T02 | No default to Lymphatic on empty | UNKNOWN (not LYMPHATIC) |
| R1-T03 | No default to Mixed on empty | UNKNOWN (not MIXED) |
| R1-T04 | No default to Balanced | UNKNOWN or explicit UNRESOLVED (not silent Balanced) |
| R1-T05 | Hindi keyword hits | Deterministic mapped temperament |
| R1-T06 | English keyword hits | Deterministic mapped temperament |
| R1-T07 | Systolic ≥ 140 with **no** other evidence | BP does **not** alone resolve (UNKNOWN or non-resolved) |
| R1-T08 | Systolic ≥ 140 **with** approved symptom evidence | SANGUINE supporting +3 contributes to resolved result |
| R1-T09 | Systolic < 100 with approved non-BP evidence | LYMPHATIC supporting +2 contributes |
| R1-T10 | Equal scores and equal evidence strength after **all available authorized evidence** evaluated first | Deterministic owner-approved tie rules only; **no** random order; **no** dictionary/first-key fallback; **no** hidden default temperament |
| R1-T11 | Exact material temperament tie remains after full evidence pass (Q3G-TIE future impl) | `temperamentResolution` = **UNRESOLVED_TIE**; **no** interactive follow-up question; **no** popup/chatbot/question bank; structured `missingEvidenceRequirements`; `ADDITIONAL_INFORMATION_REQUIRED` and/or `DOCTOR_REVIEW_REQUIRED` as applicable; **no** automatic medicine candidate; **no** auto-prescription |
| R1-T12 | Verified evidence genuinely supports multiple temperaments (not tie fallback) | **MIXED** / **BALANCED_MIXED** only when multi-temperament support is evidence-backed; **not** unresolved equal-tie fallback; exact equal tie remains **UNRESOLVED_TIE**; doctor may add information via ordinary workflow; system reruns **complete versioned reassessment**; system asks **no** clinical question |
| R1-T13 | Three+ way tie | TRIDOSHAJA path; mixed_components |
| R1-T14 | Determinism — repeat same input | Identical fingerprint + outputs |
| R1-T15 | Contract fields present when implemented | All frozen contract keys populated or explicitly null |

### Integration tests (orchestration — when wired)

| ID | Scenario |
|----|----------|
| R1-I01 | Rule 1 does not select Formula 1 disease slot by itself |
| R1-I02 | Formula 2 receives primary temperament evidence only when spec allows |
| R1-I03 | Interpreter/v4 path cannot skip Temperament Engine without audit flag |
| R1-I04 | Photo observation without symptoms → cannot resolve temperament alone |
| R1-I05 | Summary displays UNKNOWN reason when ADDITIONAL_INFORMATION_REQUIRED |

### Rejected behavior tests (must fail if reintroduced)

| ID | Must not happen |
|----|-----------------|
| R1-X01 | Lymphatic wins because first in dictionary order on tie |
| R1-X02 | Hardcoded L1/S1/A3/F1 for Formula 2/3 from temperament alone |
| R1-X03 | Single merged `prakriti` string without separate dosha_mapping |
| R1-X04 | Equal-tie resolved via interactive follow-up question, question bank, or dictionary/first-key default |

---

## Q3G / Q3G-TIE supersession (owner-approved future implementation)

Historical [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) equal-tie body (follow-up question; MIXED if no answer) remains **frozen and preserved**.

**Future EHAS2 implementation** is governed by [rule-01-q3-evidence-workflow-owner-decisions.md](./rule-01-q3-evidence-workflow-owner-decisions.md) (**Q3G revised final**, **Q3G-TIE**) and [rule-01-q3-precontract-owner-decisions.md](./rule-01-q3-precontract-owner-decisions.md).

**R1-T10–R1-T12** above describe **future** test expectations under that authority — not legacy interactive tie resolution.

---

## Phase 5C synthetic orchestrator

Phase 5C nine-rule validation used an **isolated** Python orchestrator with interpretation-only Rule 1 — **not** this owner specification. When EHAS2 implements Rule 1, golden cases must be re-baselined against this doc.

---

## Legacy gap record (LEGACY-PROVEN)

From Phase 5R-1 forensic audit:

- No dedicated `detect_prakriti` unit tests in old `eh-api/tests`
- Incidental MDE integration only
- v4 interpreter bypass untested

EHAS2 must not ship Rule 1 without R1-T* coverage above.

---

## Tags

| Section | Tag |
|---------|-----|
| Owner rules in scenarios | OWNER-APPROVED |
| Legacy missing tests | LEGACY-PROVEN |
| Test implementation | IMPLEMENTATION-PENDING |
