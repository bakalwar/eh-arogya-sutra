# Rule 1 — Implementation-Boundary Owner Freezes (OD-R1-IMPL-01 … OD-R1-IMPL-06)

| Field | Value |
|-------|--------|
| **Authority** | Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE |
| **Document class** | Append-only owner decision record |
| **Canonical base** | `b7855c9386541382a28fb1a1721f3602182c1b1e` |
| **Runtime activation** | **NONE** — documentation / future-implementation boundary only |
| **Prerequisite** | All 37 keyword rows owner-approved (Batches 1–4) · readiness audit decision **B** |
| **Supersedes / clarifies** | Incomplete percentage algorithm under R1-OD-03 · `BILIOUS_HEPATIC` as primary token · interactive / secondary-dosha tie paths for Rule 1 **v1** |

This document records owner-approved **implementation-boundary** decisions that close blockers identified in the Rule 1 frozen-contract implementation-readiness audit. It does **not** activate Rule 1 runtime, set `clinically_used=true`, add migration **019**, bind E2 production, expose API/readiness, grant diagnosis authority, or grant medicine / Rx influence.

**Document token:** `OWNER-FREEZE-R1-IMPL-BOUNDARY-01-06-v1`

---

## OD-R1-IMPL-01 — Percentage output from deduped scores

**Approval token:** `OWNER-FREEZE-OD-R1-IMPL-01-v1`

**Clarifies / completes:** `OWNER-FREEZE-R1-OD-03-v1` (percentage intent remains; algorithm now frozen).

### Eligibility before percentages

```text
RULE1_PERCENTAGE_ELIGIBILITY_V1 =
  Require BOTH:
  1. independent_accepted_normalized_concept_count >= 2
  2. T = sum of four temperament deduped scores > 0
```

- **Zero evidence** (`T == 0`) or fewer than **two** independent accepted normalized concepts → status **`TEMPERAMENT_INSUFFICIENT_EVIDENCE`** (alias display: **INSUFFICIENT**). Do **not** force percentages.
- **Equal top score** among two or more temperaments with `S_max > 0` and eligibility otherwise met → status **`UNRESOLVED_TIE`**. Do **not** select a primary temperament. Percentages **may** still emit when eligibility is met (ties remain visible).

### Formula (deterministic)

After all owner-approved caps and dedupe (see OD-R1-IMPL-04):

```text
PRIMARY_TEMPERAMENTS_ORDER =
  SANGUINE | LYMPHATIC | NERVOUS | BILIOUS

S_t = sum of accepted feature weights for temperament t
T   = S_SANGUINE + S_LYMPHATIC + S_NERVOUS + S_BILIOUS

raw_pct_t = (S_t / T) * 100

RULE1_PERCENTAGE_ROUNDING_V1 =
  1. Round each raw_pct_t to ONE decimal place using half-even (IEEE 754 roundTiesToEven).
  2. If sum of rounded values ≠ 100.0, apply largest-remainder adjustment
     in PRIMARY_TEMPERAMENTS_ORDER until sum == 100.0 exactly.
  3. Emit percentages with display precision ONE decimal (e.g. 70.0, 30.0, 0.0, 0.0).
```

```text
RULE1_PERCENTAGE_SUM_CONTRACT_V1 =
  When eligibility is met: sum(pct) == 100.0 always.
```

**Not authorized by this freeze:** inventing weights, changing batch-approved feature weights, or using legacy `verified_legacy_weight` as numerator input.

---

## OD-R1-IMPL-02 — Canonical Bilious token

**Approval token:** `OWNER-FREEZE-OD-R1-IMPL-02-v1`

**Affirms:** `OWNER-FREEZE-R1-OD-01-v1` / `OWNER-FREEZE-R1-OD-02-v1`.

```text
RULE1_V1_CANONICAL_BILIOUS_TOKEN =
  BILIOUS

FORBIDDEN_AS_PRIMARY_OUTPUT_TOKEN_V1 =
  BILIOUS_HEPATIC
```

- Canonical primary temperament token for Rule 1 **v1** is **`BILIOUS` only**.
- `BILIOUS_HEPATIC` is **superseded** for Rule 1 v1 primary / percentage / status output. It may remain only as forensic / historical label in older docs or pre-rewrite code paths until those paths are updated; it must **not** be emitted as the canonical primary.
- Future implementation that still internally aliases must map alias → **`BILIOUS`** before any shadow output.

---

## OD-R1-IMPL-03 — First implementation source plane

**Approval token:** `OWNER-FREEZE-OD-R1-IMPL-03-v1`

```text
RULE1_V1_FIRST_IMPLEMENTATION_SCOPE =
  PURE_NON_PERSISTENT_SYNTHETIC_SHADOW_EVALUATOR_ONLY
```

**Authorized (when a later engineering authorization explicitly scopes code work):**

- Pure in-memory / non-persistent Rules-shadow evaluator consuming **synthetic** `Rule1Input` (or equivalent test fixture plane)
- Encoding owner-approved feature catalog constants for shadow / tests
- Fail-closed empty production mapping registry until a later owner freeze authorizes binding

**Explicitly NOT authorized by this freeze:**

| Prohibited | Posture |
|------------|---------|
| Raw-text / free-text parsing inside Rule 1 | Forbidden |
| E2 production binding of temperament features | Deferred |
| Migration **019** | Not required; not authorized |
| Public API / orchestration callers | Forbidden |
| `/ready` or readiness changes | Forbidden |
| Medicine selection / potency / dose / route / Rx | Forbidden |
| Persisted Rule 1 clinical results | Forbidden |
| Setting `clinically_used=true` | Forbidden |

Implementation must **not** bypass F3D / D5 / E1 / E2 authority for any production-linked path. Synthetic shadow remains **disconnected** from production E2 until a future owner freeze.

---

## OD-R1-IMPL-04 — Independent evidence and dedupe identity

**Approval token:** `OWNER-FREEZE-OD-R1-IMPL-04-v1`

```text
RULE1_INDEPENDENT_EVIDENCE_DEDUPE_V1 =
  Two evidence items are NOT independent (contribute at most once as the same contribution)
  when EITHER is true:
  A. same canonical normalized concept ID
  B. same source-fact / content fingerprint
```

- Dedupe applies **both** axes (concept ID **and** source-fact/content fingerprint).
- Distinct concept IDs **and** distinct fingerprints may contribute separately only when owner batch freezes already allow distinct clinical meanings (e.g. anxiety vs restlessness with independent evidence).
- Synonym surfaces that normalize to one concept ID contribute **once**.
- Repeated mentions with the same fingerprint contribute **once**.
- Cross-rule R2/R3 ownership does **not** create a second Rule 1 contribution from the same concept or fingerprint.

**Fail-closed:** if fingerprint or concept ID is missing/malformed for a candidate contribution → do not score that candidate.

---

## OD-R1-IMPL-05 — Heat–cold thermal contradiction

**Approval token:** `OWNER-FREEZE-OD-R1-IMPL-05-v1`

When accepted Sanguine heat-tendency evidence and accepted Lymphatic cold-tendency evidence are **both** present after dedupe:

```text
RULE1_THERMAL_CONTRADICTION_V1 =
  1. Retain and expose BOTH heat and cold evidence in the explanation / evidence trace.
  2. Do NOT select a primary temperament.
  3. Status = TEMPERAMENT_CONTRADICTORY
  4. Do NOT cancel, net, or silently drop either thermal contribution for “resolve to winner”.
  5. Percentages: do not force a primary; eligibility for percentage emission follows OD-R1-IMPL-01
     only if concept-count and T rules are met — primary remains unset.
```

Safety / medical evaluation pathways remain **separate** and are not converted into temperament authority.

---

## OD-R1-IMPL-06 — Bilious secondary-dosha excluded from Rule 1 v1

**Approval token:** `OWNER-FREEZE-OD-R1-IMPL-06-v1`

```text
RULE1_V1_BILIOUS_SECONDARY_DOSHA_LOGIC =
  EXCLUDED_AND_SUPERSEDED
```

- Any historical / engineering path that treated Bilious as a **secondary dosha modifier**, required secondary resolution to pick a winner, or emitted `R1_BILIOUS_SECONDARY_UNRESOLVED` as a blocking clinical resolution step is **excluded** from Rule 1 **v1**.
- Rule 1 v1 treats **`BILIOUS`** as an independent primary temperament (R1-OD-01 / R1-OD-02 / OD-R1-IMPL-02).
- Equal top scores use **`UNRESOLVED_TIE`** (OD-R1-IMPL-01 / Q3G-TIE), not secondary-dosha follow-up.
- Interactive question-bank tie resolution remains **not** authorized for future implementation.

---

## Cross-cutting posture (all six decisions)

| Constraint | Value |
|------------|--------|
| Clinical activation | **NONE** |
| Medicine / Rx influence | **NONE** |
| Migration tip | Remains **018**; **no 019** |
| Disease DB as clinical authority | **Forbidden** |
| Legacy `verified_legacy_weight` | Forensic only |
| Owner keyword / batch freezes | Unchanged; this tranche does not re-open row dispositions |

---

## Status tokens

- `OWNER-FREEZE-R1-IMPL-BOUNDARY-01-06-v1`
- `OWNER-FREEZE-OD-R1-IMPL-01-v1` … `OWNER-FREEZE-OD-R1-IMPL-06-v1`
- `RULE1_IMPL_BOUNDARY_OWNER_APPROVED_DOCUMENTATION_ONLY`
- `RULE1_CLINICAL_ACTIVATION_NONE`
- `RULE1_MEDICINE_INFLUENCE_NONE`
- `RULE1_MIGRATION_019_NOT_AUTHORIZED`
- `RULE1_V1_PURE_SYNTHETIC_SHADOW_SCOPE_ONLY`
