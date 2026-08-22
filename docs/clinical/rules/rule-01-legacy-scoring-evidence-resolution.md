# Rule 1 — Legacy Scoring Evidence and +1/+2 Discrepancy Resolution

| Field | Value |
|-------|--------|
| **Legacy repository** | `bakalwar/eh-arogya-sutra` |
| **Verified runtime commit** | `b9ec3f6986c402afee13241673b954fe3564f169` |
| **Primary source path** | `eh-api/core/clinical_engines.py` |
| **Symbols** | `PRAKRITI_KEYWORDS` · `detect_prakriti` · `infer_disease_prakruti` |
| **Runtime activation** | **NONE** |

---

## Verdict summary

| Finding | Value |
|---------|--------|
| **Rule 1 patient path keyword weight** | `LEGACY_RUNTIME_KEYWORD_HIT_WEIGHT = 2` (`detect_prakriti`) |
| **Rule 8 disease path keyword weight** | `+1` per `PRAKRITI_KEYWORDS` hit (`infer_disease_prakruti`) |
| **Cross-path status** | `LEGACY_SCORING_IMPLEMENTATION_CONFLICT` — **do not silently unify** |
| **EHAS2 owner-approved final row weights** | **Not frozen** — remain row-by-row clinical approval subject |

Prior reports conflicted (+1 vs +2). Verified legacy source proves **both weights exist in different production paths**.

---

## Exact legacy evidence — `detect_prakriti` (Rule 1 patient temperament)

**File:** `eh-api/core/clinical_engines.py`  
**Commit:** `b9ec3f6986c402afee13241673b954fe3564f169`  
**Symbol:** `detect_prakriti(symptoms: str, bp_sys: int) -> str`

**Surrounding logic (verified):**

```python
def detect_prakriti(symptoms: str, bp_sys: int) -> str:
    text = (symptoms or "").lower()
    scores = {k: 0 for k in PRAKRITI_KEYWORDS}
    for p, kws in PRAKRITI_KEYWORDS.items():
        for kw in kws:
            if kw in text: scores[p] += 2
    if bp_sys >= 140: scores["Sanguine"] += 3
    elif bp_sys < 100: scores["Lymphatic"] += 2
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "UNKNOWN"
```

| Behavior | Verified value |
|----------|----------------|
| Keyword contribution (Rule 1 path) | **+2** per matching keyword |
| High-BP contribution | Systolic **≥ 140** → Sanguine **+3** |
| Low-BP contribution | Systolic **< 100** → Lymphatic **+2** |
| Matching model | Substring `kw in text`; **once per keyword** in loop (not occurrence-counted beyond single `in` test) |
| Duplicate synonyms | **Can double-score** same temperament if both synonyms present (e.g. `constipation` + `kabz`) |
| Tie-breaking | `max(scores, key=scores.get)` — **dict insertion order** (Lymphatic → Sanguine → Bilious → Nervous) |
| Zero-evidence fallback | Returns **`UNKNOWN`** (not Lymphatic default) |
| Malformed/missing BP | `bp_sys` is typed `int`; no explicit guard — caller-supplied integer used directly |

**Runtime caller:** MultiDiseaseEngine patient temperament path (`runtimeUsed: true` in extraction pack).

---

## Exact legacy evidence — `infer_disease_prakruti` (Rule 8 disease temperament)

**Same file/commit.**  
**Symbol:** `infer_disease_prakruti(...)`

**Surrounding logic (verified excerpt):**

```python
scores = {k: 0 for k in PRAKRITI_KEYWORDS}
for prak, kws in PRAKRITI_KEYWORDS.items():
    for kw in kws:
        if kw in text:
            scores[prak] += 1
for prak, kws in DISEASE_NAME_PRAKRUTI_KEYWORDS.items():
    for kw in kws:
        if kw in text:
            scores[prak] += 2
```

| Behavior | Verified value |
|----------|----------------|
| `PRAKRITI_KEYWORDS` hit | **+1** |
| `DISEASE_NAME_PRAKRUTI_KEYWORDS` hit | **+2** |
| Zero score | Returns **`Balanced`** (different fallback from Rule 1) |
| EHAS2 wiring | Rule 8 separation locked — see [rule-08-disease-level-prakruti-inference-contract.md](./rule-08-disease-level-prakruti-inference-contract.md) |

---

## `LEGACY_SCORING_IMPLEMENTATION_CONFLICT`

Two verified production paths use **different weights** for the same keyword registry:

| Path | Function | Keyword weight | Zero fallback |
|------|----------|----------------|---------------|
| Rule 1 (patient) | `detect_prakriti` | **+2** | `UNKNOWN` |
| Rule 8 (disease) | `infer_disease_prakruti` | **+1** (+ separate disease-name map) | `Balanced` |

**Required handling:**

1. Record conflict — **done** (this document).
2. For Rule 1 **37-row clinical docket**, use **`LEGACY_RUNTIME_KEYWORD_HIT_WEIGHT = 2`** (patient path only).
3. Do **not** rewrite historical source evidence.
4. Do **not** choose silently between paths for EHAS2 owner-approved final weights.
5. Row-by-row EHAS2 weights remain **`EHAS2_OWNER_APPROVED_FINAL_FEATURE_WEIGHT`** — pending owner clinical row review.

---

## BP scoring verdict (Rule 1 path)

| Condition | Temperament | Weight | Role |
|-----------|-------------|--------|------|
| `bp_sys >= 140` | Sanguine | +3 | Supporting evidence (legacy); owner R1-OD-05 requires bounded explicit rules in EHAS2 |
| `bp_sys < 100` | Lymphatic | +2 | Supporting evidence (legacy) |
| `100 <= bp_sys < 140` | — | 0 | No BP contribution in legacy Rule 1 path |
| Missing/malformed | — | Undefined guard | Legacy assumes valid int; EHAS2 must fail-closed under approved contracts |

Owner Phase 5R-1F register already frozen BP supporting posture; see [rule-01-owner-decisions.md](./rule-01-owner-decisions.md) BP section — preserved, not activated here.

---

## Tests and fixtures (legacy)

Legacy tests/fixtures referencing temperament scoring should be read at `b9ec3f6` only. This EHAS2 tranche does **not** import or execute legacy scoring.

---

## Correction applied in this tranche

Any **new** owner-decision documentation in this PR tranche that incorrectly stated keyword hit **+1** for the Rule 1 patient path is corrected to **+2**, with conflict explicitly recorded.

Historical evidence excerpts retain exact legacy values (+1 in Rule 8 path).

---

## Status tokens

- `LEGACY_RUNTIME_KEYWORD_HIT_WEIGHT_2_RULE1_PATH`
- `LEGACY_SCORING_IMPLEMENTATION_CONFLICT_RECORDED`
- `EHAS2_OWNER_APPROVED_FINAL_FEATURE_WEIGHTS_PENDING_ROW_REVIEW`
- `RULE1_LEGACY_SCORING_DISCREPANCY_RESOLVED_FOR_DOCUMENTATION`
