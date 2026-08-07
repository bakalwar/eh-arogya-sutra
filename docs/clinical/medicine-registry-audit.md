# Medicine registry audit (Phase 5A)

> **Current state (CQ-001A, PR #15 — read first):** Owner-approved canonical identity is **`ehas2-medicine-registry-v2`** — **38** medicine/electricity codes, **C11 excluded** (no replacement or remapping). Registry package availability does **not** imply clinical validation, indication proof, or selection readiness. **§ below is the historical Phase 5A audit** when canonical EHAS2 package identity was **v1 / 39 / C11 present**; historical C11 mentions are **not** current candidate eligibility.

## Naming inconsistency — resolved

| Source | Count | Verdict |
|--------|-------|---------|
| File `eh-api/data/engine_medicines_38.py` dict `MEDICINES_38` | **39** unique `id`s | PROVEN |
| File header intent | “38 … + APP (39 total)” | PROVEN |
| `ALLOWED_39` in `clinical_engines.py` | 39 (includes **C11**) | PROVEN (code) |
| SQLite `medicines` table | **38** — **missing C11** | PROVEN |
| Alias `ALLOWED_38 = ALLOWED_39` | naming drift | PROVEN |

**Canonical clinical registry = 39 medicines.**  
`MEDICINES_38` / `engine_medicines_38.py` are **legacy filenames**.  
SQLite seed is **non-canonical** (stale vs Python MM).

**MM file SHA-256:** `907AF5DB9A2450486649AC57F45B9C0BC99A1EE96A7F3D043BEACA26D6AEF703`

## Canonical IDs (39)

```
A1 A2 A3 APP BE C1 C2 C3 C4 C5 C6 C10 C11 C13 C15 C17
F1 F2 GE L1 P1 P2 P3 P4 RE S1 S2 S3 S5 S6 S10 S11 S12
S-Lass Ven1 Ver1 Ver2 WE YE
```

Route classes (from registry + audits): **33** oral liquids (incl. C11) · **5** electricity (`RE BE WE YE GE`) · **1** external fluid (`APP`).

## Field model (Python MM — do not alter clinical content in 5A)

Present keys typically include: `id`, `name`, `group_type`, `polarity`, `nickname`, `target_organ`, `description`, `organ_action`, `when_to_give`, `disease_clusters`, `potency_logic`, `temperament_affinity`, `search_tags` (+ optional `medicine_number`).

| Concern | Status |
|---------|--------|
| Stable code / canonical name / group | PROVEN |
| Materia Medica narrative fields | PROVEN |
| Organ/system affinity | PROVEN (`target_organ`, `organ_action`) |
| Polarity / potency metadata | PROVEN (structured polarity + free-text potency_logic) |
| Temperament/constitution relevance | PROVEN (`temperament_affinity`) |
| Internal eligibility | PROVEN (liquid pool) |
| External eligibility | PARTIAL (APP explicit; some narrative external mentions; no formal route enum) |
| Structured contraindication keys | NOT_FOUND (narrative only) |
| Duplicate/alias | nicknames + tablet alias map (`S-LASS`→`S-Lass`, etc.) |

## DB vs file drift examples

- C11 present in MM / ALLOWED_39; **absent** in SQLite `medicines`  
- Polarity mismatches possible (e.g. A3 documented drift in forensic notes)

## EHAS2 recommendation

Package `packages/medicine-registry/` should:

1. Import from Python MM (39), not SQLite seed  
2. Rename artifact to `medicines_39` / `medicine-registry-v1`  
3. Version stamp echoed by AnalyzeComplete  
4. Add structured `route_eligibility` + safety fields in a **later** non-clinical-content-change schema phase only after owner approval

---

## CQ-001A supersession note (2026-08-07)

**Historical (Phase 5A / PR #14 merge on `main`):** canonical EHAS2 package identity was **39** codes including **C11** (`ehas2-medicine-registry-v1`).

**Current owner-approved identity:** **38** codes, **C11 excluded** — `ehas2-medicine-registry-v2` (`medicines.v2.json`). Identity/count only; **not** a clinical replacement or indication decision. Historical v1 artifacts remain in-repo unchanged.
