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
  - **SUPERSEDED for Rule 1 v1 equal-top profile outcomes** by `OWNER-FREEZE-OD-R1-IMPL-07-MIXED-TEMPERAMENT-v1` → `MIXED_TEMPERAMENT` (see Append Correction C). Historical `UNRESOLVED_TIE` wording retained as forensic only.

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
  - **SUPERSEDED for Rule 1 v1 equal-top profile outcomes** by `OWNER-FREEZE-OD-R1-IMPL-07-MIXED-TEMPERAMENT-v1` → `MIXED_TEMPERAMENT`. Q3G-TIE remains authority that interactive question-bank tie resolution is **not** authorized.
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

---

## Append — Correction A: percentage residual + primary ranking (docs only)

| Field | Value |
|-------|--------|
| **Authority** | Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE |
| **Document class** | Append-only correction |
| **Closes** | `BLOCKING_PERCENTAGE_ALGORITHM_UNDERSPECIFIED` |
| **Runtime activation** | **NONE** |

**Approval token:** `OWNER-FREEZE-OD-R1-IMPL-01-CORR-v1`

### Supersession

The block labeled `RULE1_PERCENTAGE_ROUNDING_V1` in OD-R1-IMPL-01 above (half-even + underspecified residual) is **SUPERSEDED** for Rule 1 **v1**. Do **not** implement that wording.

Eligibility (`RULE1_PERCENTAGE_ELIGIBILITY_V1`), sum contract (`RULE1_PERCENTAGE_SUM_CONTRACT_V1`), insufficient outcomes, and four-temperament score inputs remain in force. Equal-top **profile** outcome is governed by OD-R1-IMPL-07 (`MIXED_TEMPERAMENT`), not `UNRESOLVED_TIE`.

### Frozen algorithm — 0.1%-unit Hamilton / largest-remainder

After owner-approved caps and dedupe, when percentage eligibility is met:

```text
RULE1_PERCENTAGE_HAMILTON_V1 =

  TEMPERAMENTS = { BILIOUS, SANGUINE, LYMPHATIC, NERVOUS }

  S_t = deduped accepted weight sum for temperament t
  T   = S_BILIOUS + S_SANGUINE + S_LYMPHATIC + S_NERVOUS   # T > 0 by eligibility

  REPRESENTATION_ORDER_EQUAL_REMAINDER =
    BILIOUS → SANGUINE → LYMPHATIC → NERVOUS
  // Representation / residual tie-break ONLY.
  // NEVER a clinical primary/secondary tie-breaker.

  For each t in TEMPERAMENTS:
    if S_t == 0:
      units_t = 0
      // published pct_t = 0.0
    else:
      exact_quota_t = (S_t / T) * 1000
      // 1000 units ≡ 100.0% at 0.1% resolution
      floor_t = floor(exact_quota_t)          // integer 0.1%-units
      frac_t  = exact_quota_t - floor_t       // in [0, 1)

  units_t := floor_t for each t (zeros stay 0)
  remaining_units = 1000 - sum(units_t)      // in 0..3 for four temperaments

  Award the remaining_units residual +1 awards by selecting temperaments with
  S_t > 0, ordered by:
      1. descending frac_t
      2. if frac_t equal: REPRESENTATION_ORDER_EQUAL_REMAINDER
         (BILIOUS before SANGUINE before LYMPHATIC before NERVOUS)
  Give +1 unit to each of the first remaining_units temperaments in that order.
  Each temperament receives at most one residual unit per evaluation.

  pct_t = units_t / 10.0
  // one decimal place; sum(pct_t) == 100.0 exactly when eligibility met
```

```text
RULE1_PERCENTAGE_ZERO_SCORE_V1 =
  S_t == 0 → pct_t == 0.0 always (no residual award).
```

```text
RULE1_PERCENTAGE_SUM_CONTRACT_V1 =
  When eligibility is met: sum(pct) == 100.0 always.
  (Unchanged; now satisfied by Hamilton units totaling 1000.)
```

### Primary ranking (no singular secondary field)

**Approval token:** `OWNER-FREEZE-OD-R1-IMPL-01-PRIMARY-RANK-v1`

```text
RULE1_V1_PRIMARY_SELECTION =
  if unique temperament has strictly highest S_t (S_max unique, S_max > 0):
    primaryTemperament = that temperament
    // status TEMPERAMENT_PROFILE_RESOLVED — see OD-R1-IMPL-07
  else if two or more temperaments share S_max > 0:
    primaryTemperament = null
    status = UNRESOLVED_TIE
    // SUPERSEDED for Rule 1 v1 equal-top: see OD-R1-IMPL-07 → MIXED_TEMPERAMENT
  // REPRESENTATION_ORDER_EQUAL_REMAINDER must NOT break clinical ties /
  // must NOT rank one co-dominant as clinically superior.
```

```text
RULE1_V1_NO_SINGULAR_SECONDARY_FIELD =
  Do not emit a singular secondaryTemperament winner field for Rule 1 v1.
  Positive temperaments (pct_t > 0, or S_t > 0) are shown as a deterministic
  ranked percentage list:
    1. descending pct_t
    2. if pct_t tied: REPRESENTATION_ORDER_EQUAL_REMAINDER
  Zero-score temperaments remain visible at 0.0 when percentages are emitted.
```

This clarifies R1-OD-03 “identify leading temperament / show secondary tendencies” without a singular secondary slot.

**Status:** `RULE1_PERCENTAGE_HAMILTON_V1_OWNER_FROZEN` · `RULE1_V1_PRIMARY_RANK_OWNER_FROZEN`

---

## Append — Correction B: thermal contradiction scope (docs only)

| Field | Value |
|-------|--------|
| **Authority** | Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE |
| **Document class** | Append-only correction |
| **Closes** | `BLOCKING_THERMAL_CONTRADICTION_SCOPE_UNDERSPECIFIED` |
| **Runtime activation** | **NONE** |

**Approval token:** `OWNER-FREEZE-OD-R1-IMPL-05-CORR-v1`

### Supersession / narrowing of OD-R1-IMPL-05

The outcome tokens in OD-R1-IMPL-05 (`TEMPERAMENT_CONTRADICTORY`, both evidence visible, no primary, no net-cancel) remain in force. The **trigger scope** is now frozen as follows (narrowing any broader reading):

```text
RULE1_THERMAL_CONTRADICTION_SCOPE_V1 =

  TRIGGER only when ALL are true after dedupe:
  1. Accepted Sanguine heat-tendency evidence AND accepted Lymphatic
     cold-tendency evidence are both present.
  2. Each side is non-negated.
  3. Each side is current (not historical-only).
  4. Both sides belong to the same consultation / same clinical episode.
  5. Both sides are systemic thermal tendency evidence
     (not unrelated local-site findings).

  DOES form contradiction:
  - Opposing subjective vs objective systemic heat vs cold evidence
    in the same consultation/episode (both remain visible).

  DOES NOT form a contradiction pair:
  - Historical-only heat or historical-only cold (alone or vs current opposite)
  - Unrelated local-site findings (e.g. local warm limb vs unrelated cold
    extremity without systemic thermal-tendency acceptance)
  - Negated evidence on either side
```

```text
RULE1_THERMAL_CONTRADICTION_OUTCOME_V1 =
  When TRIGGER fires:
  1. Retain and expose BOTH heat and cold evidence in the explanation trace.
  2. primaryTemperament = null
  3. status = TEMPERAMENT_CONTRADICTORY
  4. Do NOT cancel, net, or silently drop either contribution.
  5. Percentage emission still follows OD-R1-IMPL-01 eligibility + Hamilton;
     percentages are evidence-distribution only while primary remains null.
```

**Status:** `RULE1_THERMAL_CONTRADICTION_SCOPE_V1_OWNER_FROZEN`

---

## Correction status tokens

- `OWNER-FREEZE-OD-R1-IMPL-01-CORR-v1`
- `OWNER-FREEZE-OD-R1-IMPL-01-PRIMARY-RANK-v1`
- `OWNER-FREEZE-OD-R1-IMPL-05-CORR-v1`
- `OWNER-FREEZE-OD-R1-IMPL-07-MIXED-TEMPERAMENT-v1`
- `RULE1_IMPL_BOUNDARY_CORRECTION_A_B_DOCUMENTATION_ONLY`
- `RULE1_IMPL_BOUNDARY_CORRECTION_C_MIXED_TEMPERAMENT_DOCUMENTATION_ONLY`
- `RULE1_CLINICAL_ACTIVATION_NONE`
- `RULE1_MIGRATION_019_NOT_AUTHORIZED`

---

## Append — Correction C: OD-R1-IMPL-07 Mixed / Dual Temperament (docs only)

| Field | Value |
|-------|--------|
| **Authority** | Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE |
| **Document class** | Append-only correction |
| **Decision ID** | **OD-R1-IMPL-07** |
| **Approval token** | `OWNER-FREEZE-OD-R1-IMPL-07-MIXED-TEMPERAMENT-v1` |
| **Canonical base (PR tip before this append)** | `afb45ccfde938ca7a66b332f5993b9b1ead704ec` |
| **Runtime activation** | **NONE** |

### Clinical meaning

A patient may have **more than one simultaneously dominant temperament**.

Numerical equality between sufficiently supported highest temperament scores is **not** an error and must **not** be labelled an unresolved programming tie.

### Supersession (Rule 1 v1 equal-top outcomes)

For Rule 1 **v1** numerical equal-top temperament-profile outcomes after eligibility:

| Prior instruction | Disposition |
|-------------------|-------------|
| OD-R1-IMPL-01 equal-top → `UNRESOLVED_TIE` | **SUPERSEDED** |
| `OWNER-FREEZE-OD-R1-IMPL-01-PRIMARY-RANK-v1` equal-top → `UNRESOLVED_TIE` | **SUPERSEDED** for equal-top branch only (unique-max primary selection remains) |
| Q3G-TIE “exact remaining tie → `UNRESOLVED_TIE`” as Rule 1 **v1 profile outcome** | **SUPERSEDED** by this decision for equal highest **scores** after caps/dedupe/eligibility |
| Historical / forensic mentions of `UNRESOLVED_TIE` | May remain in place **only** as superseded/forensic text |

```text
RULE1_V1_EQUAL_TOP_OUTCOME =
  MIXED_TEMPERAMENT
  // NOT UNRESOLVED_TIE
```

Hamilton (`RULE1_PERCENTAGE_HAMILTON_V1`), thermal contradiction scope (`OWNER-FREEZE-OD-R1-IMPL-05-CORR-v1`), dedupe, BP gates, and 37-row freezes are **unchanged**.

### Deterministic outcome precedence

```text
RULE1_V1_OUTCOME_PRECEDENCE =
  1. Validate source / evidence authority
  2. Apply exclusions, caps, and dedupe
  3. If insufficient (T == 0 OR independent_accepted_normalized_concept_count < 2)
       → TEMPERAMENT_INSUFFICIENT_EVIDENCE
         (no primary; no MIXED outcome)
  4. If RULE1_THERMAL_CONTRADICTION_SCOPE_V1 trigger is met
       → TEMPERAMENT_CONTRADICTORY
         (primaryTemperament = null; retain both evidence + scores for audit;
          do NOT emit MIXED_TEMPERAMENT as the resolution;
          percentages only as contradictory evidence distribution if eligibility met)
  5. Else compute Hamilton percentages (unchanged algorithm)
  6. Let S_max = maximum of four temperament scores
     - if exactly one temperament has S_t == S_max and S_max > 0
         → TEMPERAMENT_PROFILE_RESOLVED
           primaryTemperament = that temperament
     - if two or more temperaments have S_t == S_max and S_max > 0
         → MIXED_TEMPERAMENT
           primaryTemperament = null
           dominantTemperaments = all temperaments with S_t == S_max
  7. Emit deterministic ranked percentage profile + explanation
```

Contradiction is **higher precedence** than Mixed. Mixed must **not** hide contradictory, malformed, stale, or insufficient evidence.

### Mixed / Dual / Multi output contract

```text
RULE1_V1_MIXED_TEMPERAMENT_CONTRACT =

  When MIXED_TEMPERAMENT (step 6 equal maxima):

  If |dominantTemperaments| == 2:
    mixedSubtype = DUAL_TEMPERAMENT
  If |dominantTemperaments| == 3 OR 4:
    mixedSubtype = MULTI_TEMPERAMENT

  primaryTemperament = null
  dominantTemperaments ordered ONLY by REPRESENTATION_ORDER_EQUAL_REMAINDER:
    BILIOUS → SANGUINE → LYMPHATIC → NERVOUS
  // Stable output order ONLY — does NOT make one co-dominant clinically superior.

  Both / all dominantTemperaments are clinically co-dominant for Rule 1 representation.
  Hamilton percentage profile remains visible (deterministic; sum 100.0 when eligible).
  Lower positive scores remain in the ranked percentage profile but are NOT in
  dominantTemperaments unless they equal S_max.
  No singular secondaryTemperament field.
```

### Valid Mixed vs contradiction

| | Valid `MIXED_TEMPERAMENT` | `TEMPERAMENT_CONTRADICTORY` |
|--|---------------------------|----------------------------|
| Meaning | Valid co-dominant temperament **profile** | Evidence conflict requiring review |
| Requires ≥2 independent accepted concepts | Yes | Trigger uses accepted systemic heat+cold per IMPL-05-CORR |
| Equal highest scores | Yes (defining) | May or may not; status is contradiction, **not** Mixed |
| Error / programming tie? | **No** | **No** — bounded clinical conflict status |

### Authority boundary

`MIXED_TEMPERAMENT` / `DUAL_TEMPERAMENT` / `MULTI_TEMPERAMENT` mean **only** a Rule 1 temperament-profile outcome. They do **not** mean diagnosis, disease confirmation, Rules 2–9 passed, medicine/formula/potency/dose/Rx, or `clinically_used=true`. Doctor-facing use remains separately authorized.

### Deterministic examples (score order SANGUINE, LYMPHATIC, NERVOUS, BILIOUS)

Assume concept-count eligibility met unless noted. Hamilton per `RULE1_PERCENTAGE_HAMILTON_V1`.

| Scores (S,L,N,B) | pct (S,L,N,B) | Status | Subtype / primary | `dominantTemperaments` |
|------------------|---------------|--------|-------------------|------------------------|
| 2,2,0,0 | 50.0, 50.0, 0.0, 0.0 | `MIXED_TEMPERAMENT` | `DUAL_TEMPERAMENT` | SANGUINE, LYMPHATIC |
| 3,3,2,1 | 33.4, 33.3, 22.2, 11.1 | `MIXED_TEMPERAMENT` | `DUAL_TEMPERAMENT` | SANGUINE, LYMPHATIC |
| 1,1,1,0 | 33.4, 33.3, 33.3, 0.0 | `MIXED_TEMPERAMENT` | `MULTI_TEMPERAMENT` | SANGUINE, LYMPHATIC, NERVOUS |
| 1,1,1,1 | 25.0, 25.0, 25.0, 25.0 | `MIXED_TEMPERAMENT` | `MULTI_TEMPERAMENT` | BILIOUS, SANGUINE, LYMPHATIC, NERVOUS |
| 3,2,1,0 | 50.0, 33.3, 16.7, 0.0 | `TEMPERAMENT_PROFILE_RESOLVED` | primary **SANGUINE** | (n/a — unique max) |
| T=0 or concepts&lt;2 | (none forced) | `TEMPERAMENT_INSUFFICIENT_EVIDENCE` | — | not Mixed |
| Qualifying systemic heat+cold contradiction | evidence-distribution % only if eligible | `TEMPERAMENT_CONTRADICTORY` | primary null | **not** Mixed |

For `1,1,1,1`, representation order lists all four co-dominants as BILIOUS → SANGUINE → LYMPHATIC → NERVOUS.

**Status tokens:** `OWNER-FREEZE-OD-R1-IMPL-07-MIXED-TEMPERAMENT-v1` · `RULE1_V1_MIXED_TEMPERAMENT_OWNER_FROZEN` · `RULE1_V1_UNRESOLVED_TIE_SUPERSEDED_FOR_EQUAL_TOP` · `RULE1_CLINICAL_ACTIVATION_NONE` · `RULE1_MIGRATION_019_NOT_AUTHORIZED`
