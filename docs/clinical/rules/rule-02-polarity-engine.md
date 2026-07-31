# Rule 2 — Polarity Engine (Owner-Approved Specification)

**Status:** OWNER-APPROVED · **EHAS2 runtime:** IMPLEMENTATION-PENDING · **Legacy:** LIVE_BUT_PARTIAL (forensic reference only)

**Rule number:** 2
**Canonical name:** Polarity Engine
**Clinical authority:** Formula-specific policy engine (conceptual SoT when implemented)
**Legacy reference:** `formula_polarity_policy_engine.resolve_formula_specific_polarity` — **LEGACY-PROVEN**; EHAS2 must implement owner rules below, not silent legacy scoring coerce.

---

## Scope per formula

Rule 2 assesses **each formula slot independently** and produces **immutable polarity annotation only**. It does **not** mutate mixtures, select medicines, potency, electricity, mixture count, or target pathology, and does **not** issue prescriptions.

**`mutates_mixtures` = false** (OWNER-APPROVED)

### Per-formula assessment outputs (contract target — IMPLEMENTATION-PENDING)

| Field | Role |
|-------|------|
| `target_pathology` | Reference to bound pathology label for the slot |
| `disease_state` | Structured disease state descriptor (e.g. acute hyper, unresolved) |
| `disease_polarity` | Observed disease polarity: POSITIVE, NEGATIVE, NEUTRAL, MIXED, UNRESOLVED, SUPPORT_ONLY |
| `required_therapeutic_polarity` | Law-of-opposites therapeutic direction (see below) |
| `status` | e.g. RESOLVED, RESOLVED_SUPPORT_ROLE, NEUTRAL_FALLBACK_PENDING_REVIEW |
| `evidence` / `evidence_sources` | Structured supporting items |
| `confidence` | Nullable when unresolved |
| `uncertainty_flags` | Explicit ambiguity markers |
| `fallback_policy` | When applicable (e.g. OWNER_APPROVED_NEUTRAL_FALLBACK) |
| `doctor_review_required` | Boolean gate for prescription issuance |

Do **not** embed selected potency, selected electricity codes, or medicine IDs in Rule 2 output.

---

## Law of opposites (OWNER-APPROVED)

| `disease_polarity` (resolved disease state) | `required_therapeutic_polarity` |
|---------------------------------------------|----------------------------------|
| POSITIVE | NEGATIVE |
| NEGATIVE | POSITIVE |
| RESOLVED NEUTRAL (support context) | NEUTRAL |

MIXED disease polarity handling for therapeutic direction is **AUDIT_PENDING** unless owner extends this freeze (legacy used MIXED as scoring bucket — **rejected for EHAS2** silent overwrite of UNRESOLVED).

---

## Unresolved policy (OWNER-APPROVED)

When evidence is insufficient or ambiguous:

- `disease_polarity` = **UNRESOLVED**
- `required_therapeutic_polarity` = **NEUTRAL**
- `fallback_policy` = **OWNER_APPROVED_NEUTRAL_FALLBACK**
- `doctor_review_required` = **true**
- `status` may be **NEUTRAL_FALLBACK_PENDING_REVIEW**

Raw uncertainty **must not** be clinically overwritten as proven Neutral disease state. Neutral here is **therapeutic fallback pending review**, not a false-positive disease classification.

Single-pass analysis draft may complete, but **final prescription must not issue without doctor approval** when this policy applies.

**LEGACY-PROVEN defect rejected:** `polarity_for_legacy_scoring` mapping UNRESOLVED/SUPPORT_ONLY → MIXED for medicine scoring (**IMPLEMENTATION-PENDING** replacement with owner neutral fallback + review gate).

---

## SUPPORT_ONLY policy (OWNER-APPROVED)

For temperament / constitution **support** formulas:

- `disease_polarity` = **SUPPORT_ONLY**
- `required_therapeutic_polarity` = **NEUTRAL**
- `status` = **RESOLVED_SUPPORT_ROLE**

SUPPORT_ONLY and UNRESOLVED **must always remain distinct**.

---

## Formula-specific isolation (OWNER-APPROVED)

Each formula polarity is derived only from **that formula’s** evidence:

- target pathology binding
- slot-bound symptoms
- related disease evidence for the slot
- verified related report findings (slot-aligned)
- phase / severity as **supporting** evidence only
- relevant vitals as **supporting** evidence only (see BP isolation)

**Global case polarity must not apply to all formulas.**

**LEGACY-PROVEN:** Policy engine excludes global symptoms from slot proof (`formula_polarity_policy_engine.py`); legacy `detect_polarity` uses global text — **rejected** for EHAS2.

---

## BP isolation (OWNER-APPROVED)

- BP is **supporting evidence only** for **cardiac, vascular, or BP-target** formulas.
- BP **must not** affect unrelated formulas (digestive, nervous, skin, renal, hepatic, joints, other unrelated targets).
- Abnormal BP also feeds a **separate** safety / red-flag system (not Rule 2 disease polarity alone).

**LEGACY-PROVEN:** Legacy `detect_polarity` applies BP globally before symptoms — **rejected** for EHAS2.

---

## Report isolation (OWNER-APPROVED)

Verified report findings may influence **only** the related disease, organ/system, and formula slot. **Cross-slot report leakage is prohibited.**

---

## Photo policy (OWNER-APPROVED)

- Ordinary patient photos **must not** determine polarity.
- Only supported clinical image types, quality-checked, clinically verified, **local affected-site** observations may supply **supporting** evidence to the **related local formula**.
- **Global photo polarity override is prohibited.**

---

## Case vs formula polarity (OWNER-APPROVED)

| Artifact | Authority |
|----------|-----------|
| `formula_polarities[]` | **Authoritative** for downstream polarity **annotation consumption** by other engines (not direct selection by Rule 2) |
| `case_polarity_summary` | **Display-only** overview |

`case_polarity_summary` **must not** drive medicine, potency, or electricity selection.

**LEGACY-PROVEN:** Case-level `result["polarity"]` = mixture A raw — **rejected** as selection authority for EHAS2; display-only summary may derive from formula list with explicit labeling.

---

## Separation of engines (OWNER-APPROVED)

| Engine | Responsibility |
|--------|----------------|
| **Rule 2 Polarity Engine** | Disease polarity + required therapeutic polarity annotation only |
| **Potency Engine** | Potency selection — **AUDIT_PENDING** / separate forensic audit |
| **Electricity Engine** | RE/BE/YE/GE/WE selection — **AUDIT_PENDING** |
| **Primary Medicine Selection** | 39-medicine pool using Organ-System Engine, target pathology alignment, disease evidence, Rule 1 temperament, other audited rules |

Rule 2: **NO_DIRECT_EFFECT** on primary medicine selection (OWNER-APPROVED).

---

## Electricity reference only (OWNER-APPROVED — not selection permission)

Reference mapping for documentation cross-walk (electricity engine owns selection):

| Code | Reference polarity |
|------|-------------------|
| RE | POSITIVE |
| BE | NEGATIVE |
| YE | NEGATIVE |
| GE | NEGATIVE |
| WE | NEUTRAL |

Rule 2 **must not** select electricity codes.

---

## Canonical numbering (OWNER-APPROVED)

- Rule 1 = Temperament Engine
- Rule 2 = Polarity Engine

“Rule 2 Organ System” was a **typographical error** — **rejected**. Organ-System Engine is separate; exact rule number **AUDIT_PENDING** (Rule 3 forensic phase).

**LEGACY_CONFLICT:** PDF/summary numbering (Rule 1 = Polarity in legacy summary text) — see [rule-02-legacy-conflicts.md](./rule-02-legacy-conflicts.md).

---

## Related documents

- [rule-02-owner-decisions.md](./rule-02-owner-decisions.md)
- [rule-02-legacy-conflicts.md](./rule-02-legacy-conflicts.md)
- [rule-02-data-contract.md](./rule-02-data-contract.md)
- [rule-02-test-requirements.md](./rule-02-test-requirements.md)
- Forensic audit: `%TEMP%\ehas2_rule2_forensic_audit\` (Phase 5R-2, read-only)
