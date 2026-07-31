# Rule 1 — Legacy Conflicts and Rejected Defects

**Purpose:** Record **LEGACY-PROVEN** behavior and defects **explicitly rejected** for EHAS2.
**Old project:** Read-only reference; not modified by Phase 5R-1F.

---

## Explicitly rejected for EHAS2 (OWNER-APPROVED)

| Defect | Legacy evidence | EHAS2 stance |
|--------|-----------------|--------------|
| Dictionary-order Lymphatic winner on tie | `PRAKRITI_KEYWORDS` iteration order; first max key wins (`rule1_fallbacks_and_conflicts.md` C6 tie note) | **REJECTED** — use UNRESOLVED_TIE / follow-up / BALANCED_MIXED |
| Ambiguous `prakriti` mixing EH Temperament and Tridosha | API/UI `prakriti` string; VATA in some tests vs Mattei set | **REJECTED** — separate typed fields |
| Silent Mixed/Balanced fallback | API paths default `Mixed`; Rule 8 `Balanced`; interpreter Mixed | **REJECTED** — UNKNOWN + ADDITIONAL_INFORMATION_REQUIRED |
| Photo-only temperament authority | `photo_temperament`, report_analyzer override | **REJECTED** — supporting only |
| Duplicate uncoordinated implementations | `clinical_engines.detect_prakriti` + `MultiDiseaseEngine.detect_prakriti` | **REJECTED** — single versioned SoT when implemented |
| Interpreter pre-fill bypassing canonical Rule 1 | v4 `interpreter._infer_temperament` skips MDE detect when Lymphatic/Sanguine set | **REJECTED** for EHAS2 |
| Missing dedicated Rule 1 tests | Zero `detect_prakriti` unit tests (Phase 5R-1 test audit) | **REJECTED** — see test requirements |
| Fixed medicine inference from temperament | Clarification examples only; legacy affinity boosts exist | **REJECTED** — no shortcuts |

---

## Documented conflicts (legacy — do not copy)

### C1 — Mixed vs UNKNOWN

- **LEGACY-PROVEN:** `detect_prakriti` returns **UNKNOWN** when all scores zero.
- **LEGACY-PROVEN:** Some docs/API defaults say **Mixed** or **Balanced**.
- **EHAS2:** UNKNOWN + ADDITIONAL_INFORMATION_REQUIRED (owner freeze).

### C2 — v4 interpreter vs Rule 1

- **LEGACY-PROVEN:** Interpreter can pre-fill prakriti and skip `detect_prakriti`.
- **EHAS2:** Rejected — Temperament Engine spec is authoritative when implemented.

### C3 — PDF Rule 1 = Polarity vs code Rule 1 = Temperament

- **LEGACY-PROVEN:** Summary/PDF numbering mismatch.
- **EHAS2:** EH_9 Temperament = Rule 1 (documentation policy; separate from Rule 2 Polarity freeze).

### C4 — Photo vs symptoms

- **LEGACY-PROVEN:** Report path photo override then MDE recompute.
- **EHAS2:** Photo supporting-only rule.

### C5 — Rule 8 disease prakruti

- **LEGACY-PROVEN:** `infer_disease_prakruti` / `resolve_prakriti` not MDE Rule 1.
- **EHAS2:** Rule 8 tracked separately; not conflated with Rule 1 freeze.

### C6 — EH_9 name “Temperament (Prakriti)”

- **LEGACY-PROVEN:** Audit used EH_9 label.
- **EHAS2 canonical name:** **Temperament Engine** (owner freeze); prakriti string deprecated for merged meaning.

---

## Legacy live path (reference only)

| Component | Path | Tag |
|-----------|------|-----|
| Primary detect | `eh-api/core/multi_disease_engine.py` `detect_prakriti` | LEGACY-PROVEN |
| Twin | `eh-api/core/clinical_engines.py` `detect_prakriti` | LEGACY-PROVEN |
| Keywords | `PRAKRITI_KEYWORDS` | LEGACY-PROVEN |
| BP weights +3 / +2 | Same functions | LEGACY-PROVEN (aligned with owner BP supporting rule) |

No legacy code was changed in Phase 5R-1F.
