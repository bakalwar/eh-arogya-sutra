# Rule 5 — R5-M6B Medicine Evidence Audit: A3 (Angioitico-3)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 3 of 38 |
| **Medicine code** | A3 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-08 |
| **Repository base (EHAS2)** | `44125592d832db110a40b15397557b17b098da6d` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`) |
| **Owner decision CQ-001A** | Canonical 38-code identity only — not clinical approval |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` · git blob `5bba8d6fe05effc775e88ddfba93c1e572f069cb` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` · `artifactSha256`: `1C29F194B4B8EF6B45DBE75FE82EA7F660A51F48952BB7050B9A0BD86990B814` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **A3**. It:

- Inventories and compares sources; records conflicts and owner decisions **as documentation**.
- Does **not** clinically validate A3, authorize potency/dosage, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** endorse cure, guarantee, default medicine, or keyword-priority selection authority.
- Treats owner-provided text **existence** as provenance fact — **not** as clinical truth.

**Posture flags (final):**

| Flag | Value |
|------|--------|
| `clinicallyValidated` | `false` |
| `rule5SafetyCoverageComplete` | `false` |
| `potencyAuthorized` | `false` |
| `dosageAuthorized` | `false` |
| `evidenceActivated` | `false` |
| `runtimeAuthorized` | `false` |

---

## 4. A3 canonical identity

| Field | Registry v2 | Owner-primary block | Notes |
|-------|-------------|---------------------|--------|
| **Code** | `A3` | `A3` | Matches CQ-001A set |
| **Display name** | `Angioitico-3` | `ANGIOTICOS-3 (A3)` | Spelling variant only |
| **Group** | `Angioitico` | A-Group (Angioticos) | Consistent |
| **Medicine number** | Not in v2 row | `23` | Owner-only metadata |
| **C11 remap** | **No** | **No** | C11 not used for A3 |
| **Medicine-level polarity field** | `MIXED` | Owner philosophy: **Mixed (संतुलित)** blending A1 + A2 | **Descriptive alignment only** — see CQ-001 / CQ-004 |

**No-remap confirmation:** A3 remains code `A3`; no substitution from excluded C11.

---

## 5. Sources and provenance table

| Source ID | Classification (framework §3) | Reference | Tracked in EHAS2 Git | Blob / status | Provenance | License |
|-----------|------------------------------|-----------|----------------------|---------------|------------|---------|
| **SRC-A3-OWNER** | `OWNER_PROVIDED_SOURCE_CANDIDATE` | Cursor transcript session `019c5012-fbb1-4582-a4af-af8484d1bc5f` (user message ~line 1451); normalized corpus `MED=A3` | Corpus: **NOT_GIT_TRACKED** in EHAS2 | See **§5.1 corpus integrity** · primary narrative lines **975–1009** | **Located, not verified** | **Not verified** |
| **SRC-A3-MM1E** | `NORMALIZED_OWNER_TEXT_COPY` | Legacy project `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (`MED=A3` … before `MED=P1`) | **WORKTREE_ONLY** (legacy repo) | Same byte anchor as §5.1 A3-block scope | Derived copy of owner block | N/A |
| **SRC-A3-REG-V2** | `CURRENT_EHAS2_REGISTRY_V2` | `packages/medicine-registry/src/medicines.v2.json` (A3 object) | **Tracked @ 44125592** | Blob `5bba8d6…` (whole file) | Identity/metadata structure | N/A |
| **SRC-A3-ENGINE** | `LEGACY_NORMALIZED_ENGINE_COPY` | Legacy `eh-api/data/engine_medicines_38.py` (`MEDICINES_38` A3 dict) | Legacy repo tracked lineage | Comparison only | Developer normalization | N/A |
| **SRC-A3-MM2** | `NORMALIZED_OWNER_TEXT_COPY` | Legacy `docs/phase-s5-mm2/S5MM2_MASTER_MATERIA_MEDICA.json` (A3 entry) | **WORKTREE_ONLY** | MM2 `temperament_affinity`: **UNKNOWN**; `polarity_affinity`: **MIXED** | Parsed from owner corpus | N/A |
| **SRC-A3-MM3** | `HISTORICAL_OR_CONFLICTING_LEGACY_SOURCE` | Legacy `docs/phase-s5-mm3/S5_MM3_MASTER_MATERIA_MEDICA.json` (`A3` row) | **WORKTREE_ONLY** | BOOK + doctor segments; OCR-derived | **UNVERIFIED_BOOK_DERIVED_TEXT** | **Not verified** |
| **SRC-A3-BOOK** | `HISTORICAL_OR_CONFLICTING_LEGACY_SOURCE` | BOOK chain via MM3 `evidence: BOOK` / `EH_BOOK_MASTER_HINDI.txt` segments | **WORKTREE_ONLY** | Extended disease lists, dilution OCR, external-use OCR | **UNVERIFIED_BOOK_DERIVED_TEXT** | **Not verified** |

Untracked legacy sources are **not** merged Git authority for EHAS2.

### 5.1 Corpus integrity (read-only recompute)

Legacy normalized corpus (untracked working tree). **No legacy files edited.** Methods: `git hash-object` (Git blob SHA-1); `SHA-256` over **on-disk bytes** (Node `crypto.createHash('sha256')`).

| Scope | Relative path / boundary | Byte length | Line endings (on disk) | Git tracking | Git blob SHA-1 | SHA-256 (raw bytes) |
|-------|--------------------------|------------:|------------------------|--------------|----------------|---------------------|
| **Whole file** | `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` | 424,565 | **CRLF** throughout | **NOT_GIT_TRACKED** (legacy repo) | `f4bc49f70d8482824bc06f8d21dae673cba8ee9e` | `9ecd7e87bf0ed5865df70c1bd49adcd093f557d3cdb5a0f56c9a0e85bc82e4c1` |
| **A3 normalized block** | From first `MED=A3` through byte before `MED=P1` (includes section headers + `<user_query>` … `</user_query>`) | 6,338 | **CRLF** (substring of whole file) | **NOT_GIT_TRACKED** | `17e7a3c015bfc5d4aa52031a4cd4f288eb20f22f` | `2cb48cf85e921d17c794836581079ae3736ec8126e8b877b2b8181ec1a728779` |

**Statement inventory check:** Primary owner narrative (lines 975–1009 / `<user_query>` body) **unchanged** vs pre-audit read-only inventory; audit **continues** (no content drift blocker).

---

## 6. Source lineage / independence

| Relationship | Assessment |
|--------------|------------|
| Owner → MM1E corpus | **Duplicate / normalized copy** |
| Owner → MM2 | **Derived** from owner block; structured metadata |
| Engine → Registry v2 A3 row | **Near-identical English fields** (legacy normalization copied into v2) |
| MM3 BOOK → Owner | **Independent BOOK chain** with OCR noise; **must not merge** with owner-primary (CQ-003) |
| Expert tip (S1+A3) → `temperament_affinity` | **Conflation** in engine/registry — combo folded into temperament field |
| A1 / A2 / A3 | **Distinct owner blocks**; A3 philosophy references A1+A2 blend — **not** a code remap |

**First appearance of Balanced/Lymphatic/S1+A3 on A3:** legacy engine + registry v2; **not** as structured `temperament_affinity` in owner-primary block.

---

## 7. Owner-primary statement inventory

**Label:** `EXHAUSTIVE_PRIMARY_BLOCK_STATEMENT_INVENTORY` — **37** distinct statement rows (**A3-CLM-001** through **A3-CLM-037**) covering the verified primary block (corpus lines 975–1009). Rows are **inventory references**, not atomic clinical validations.

| ID | Category | Short paraphrase (owner-primary) |
|----|----------|----------------------------------|
| A3-CLM-001 | Identity | Heart and vital-force protector framing for A3 |
| A3-CLM-002 | Identity | Master for whole circulation and blood quality |
| A3-CLM-003 | Identity | Medicine number 23: ANGIOTICOS-3 (A3) |
| A3-CLM-004 | Identity | Aliases: Holo Circulation Master; Anemia Specialist; Vital Force Builder |
| A3-CLM-005 | Philosophy | **Mixed** medicine embodying **A1 + A2** properties |
| A3-CLM-006 | Philosophy | Improves blood composition and heart function, not vessels alone |
| A3-CLM-007 | Philosophy | Key for new blood formation and vital force |
| A3-CLM-008 | Affinity | Heart muscle strength and valve function |
| A3-CLM-009 | Affinity | Blood cells — hemoglobin / RBC production |
| A3-CLM-010 | Affinity | Capillaries / whole vasculature |
| A3-CLM-011 | Affinity | Respiration/nutrition — oxygen and nutrients to organs |
| A3-CLM-012 | Indication | Weak heart, early fatigue |
| A3-CLM-013 | Indication | Valvular disease — obstruction/regurgitation |
| A3-CLM-014 | Indication | Arrhythmia |
| A3-CLM-015 | Indication | Cardiomegaly |
| A3-CLM-016 | Indication | Anemia — pallor, debility |
| A3-CLM-017 | Indication | Child growth failure from anemia |
| A3-CLM-018 | Indication | Post-illness general debility |
| A3-CLM-019 | Indication | Low blood pressure — dizziness |
| A3-CLM-020 | Indication | Fluctuating BP |
| A3-CLM-021 | Indication | Edema from weak heart |
| A3-CLM-022 | Indication | Dyspnea / cardiac asthma on exertion |
| A3-CLM-023 | Potency narrative | Low D1–D3 **Positive** — Hb, low BP, heart strength |
| A3-CLM-024 | Potency narrative | **D5 NEUTRAL** in low band |
| A3-CLM-025 | Potency narrative | High **D10–D500 Negative** — myocarditis, internal hemorrhage, acute palpitation |
| A3-CLM-026 | Tags | Keyword tag: Heart-Pump-Master |
| A3-CLM-027 | Tags | Keyword tag: Anemia-Remedy |
| A3-CLM-028 | Tags | Keyword tag: Low-BP-Support |
| A3-CLM-029 | Tags | Keyword tag: Hemoglobin-Booster |
| A3-CLM-030 | Tags | Keyword tag: Cardiac-Valvular-Care |
| A3-CLM-031 | Tags | Keyword tag: Vitality-Tonic |
| A3-CLM-032 | Tags | Keyword tag: Total-Circulation-Regulator |
| A3-CLM-033 | Expert tip | Keyword priority for anemia/low BP/valve/weak heart/general weakness |
| A3-CLM-034 | Expert tip | **S1+A3** described as premier “health tonic” for weakness |
| A3-CLM-035 | Instruction | Save as A3 master DB block |
| A3-CLM-036 | Mapping | Disease sections A–D for 116k authoring |
| A3-CLM-037 | Group | Explicit **Mixed / A1+A2** blend within Angioticos series |

**Temperament:** No owner-primary row for Lymphatic, Balanced, or `temperament_affinity` as structured metadata.

---

## 8. Registry / legacy comparison

| Field | Owner-primary | Registry v2 / legacy engine | Conflict |
|-------|---------------|------------------------------|----------|
| **Mixed / polarity** | Philosophy: **Mixed**, A1+A2 blend | `polarity`: **`MIXED`** | **Descriptive alignment only** — not clinical or selector authority |
| `potency_logic` | D5 **NEUTRAL**; high **D10–D500** | D1–D5 POSITIVE; high **D10–D200** | **Yes** — band ceiling + D5 polarity |
| `temperament_affinity` | **Absent** | Balanced (mixed A1+A2), Lymphatic (anemia); S1+A3 expert clause | **Yes** — derived addition |
| English normalization | Hindi/Hinglish primary | Condensed English strings | Expected normalization; not clinical upgrade |
| Expert tip | Separate prose | Embedded in `temperament_affinity` / `description` | **Conflation** |

Registry v2 A3 row matches legacy `engine_medicines_38.py` on compared fields (string parity on sampled fields).

---

## 9. Potency scope separation (CQ-001 / CQ-002)

| Track | Authority | A3 fact |
|-------|-----------|---------|
| **Rule 4 formula-selection potency** | Merged Rule 4 governance (automatic scale D1–D60; D100/D200/D500 auto **prohibited**) | **Unchanged** by this audit |
| **A3 medicine-specific potency narrative** | Owner-primary descriptive text only | D5 **NEUTRAL**; D10–D500 **Negative** band in owner text |
| **Registry/legacy potency_logic** | Descriptive conflict reference | D5 **Positive** grouping; **D10–D200** ceiling |

**Owner decisions recorded (documentation):**

- **`R5-M6B-A3-CQ-001 = A`** — Separate tracks; Rule 4 D5 Positive group unchanged; owner D5 Neutral preserved as source text; registry/legacy D5 Positive conflict preserved; owner/registry **MIXED** wording **`descriptive_alignment_only`**; no selector, potency, or clinical authority.
- **`R5-M6B-A3-CQ-002 = A`** — `descriptive_source_text_only`; owner `D10–D500` preserved; Rule 4 automatic selection limits unchanged; registry `D10–D200` conflict preserved; MM3 BOOK high-potency fragments quarantined; no potency/dosage authorization.

---

## 10. BOOK quarantine (CQ-003)

MM3/BOOK-derived A3 material (extended disease OCR lists, dilution fragments, cautions, external/ointment/compress mentions, `high_potency`: **`D30; D10`**) is classified:

- **`UNVERIFIED_BOOK_DERIVED_TEXT`**
- **`inventory_reference_allowed`**
- **`zero_clinical_authority`**
- **`no_merge_with_owner_primary`**

Bibliographic identity, license, page binding, and OCR integrity for BOOK sources: **NOT_VERIFIED**. BOOK evidence does **not** count toward Rule 5 safety completion.

**Owner decision:** **`R5-M6B-A3-CQ-003 = A`** (scopes above).

---

## 11. Temperament-affinity quarantine (CQ-004)

| Concept | Owner-primary | Registry/legacy |
|---------|---------------|-----------------|
| Balanced (mixed A1+A2) | Philosophy only — **no** temperament column | Present in `temperament_affinity` |
| Lymphatic (anemia) | **Silent** as structured metadata | Present |
| S1 + A3 pairing | Expert tip (separate) | Appended inside `temperament_affinity` |
| Keyword priority | Expert tip (separate) | Not verbatim in registry field |
| MIXED polarity | Philosophy + owner Mixed label | `polarity: MIXED` | **Descriptive alignment only** |

MM2 A3: `temperament_affinity`: **UNKNOWN**; `polarity_affinity`: **MIXED**. MM3 A3: `temperament`: **UNKNOWN**.

**Owner decision:** **`R5-M6B-A3-CQ-004 = A`** — `DERIVED_UNVERIFIED_AFFINITY_METADATA`; owner-primary **silent on Balanced/Lymphatic temperament metadata**; owner/registry **MIXED** remains **`descriptive_alignment_only`**; expert tip and **S1+A3** remain **separate inventory concepts**; keyword priority **`REJECTED_BY_EXISTING_GOVERNANCE`**; Rule 6 scaffold **`READY_FOR_VALIDATION`** ≠ A3 relationship approval; **A3 Rule 6 relationship zero authority**; no default/priority/candidate effect from registry presence.

---

## 12. Rule 5 fourteen-domain safety gap register

Domains use framework §5.7 vocabulary only. **BOOK-only** rows marked quarantined — **zero safety-completion credit**.

| # | Domain | Owner-primary | Registry/legacy | MM3 BOOK-derived | Status |
|---|--------|---------------|---------------|------------------|--------|
| 1 | Contraindications | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | OCR caution fragments | **OWNER_REVIEW_REQUIRED** · BOOK = UNVERIFIED |
| 2 | Allergy / hypersensitivity | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 3 | Adverse effects | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | Caution/route OCR | **OWNER_REVIEW_REQUIRED** · BOOK quarantined |
| 4 | Medicine–medicine interactions | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | Combination OCR | **OWNER_REVIEW_REQUIRED** · BOOK quarantined |
| 5 | Medicine–condition interactions | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | Partial BOOK lists | **OWNER_REVIEW_REQUIRED** |
| 6 | Route incompatibility | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | Internal/external/ointment OCR | **OWNER_REVIEW_REQUIRED** · BOOK quarantined |
| 7 | Overdose / exposure | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 8 | Duration / cumulative use | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 9 | Monitoring targets | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 10 | Pause criteria | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 11 | Stop criteria | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 12 | Emergency / red-flag criteria | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 13 | Follow-up timing | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 14 | Special populations | Child growth in **indications** only | **SOURCE_NOT_FOUND** | BOOK OCR lists (possible pregnancy-related noise) | **OWNER_REVIEW_REQUIRED** · BOOK quarantined |

**Rule 5 implementation posture (EHAS2):** `NOT_IMPLEMENTED` (framework/index). No domain reaches `OWNER_APPROVED`.

---

## 13. Conflict register

| Conflict ID | Summary | Resolution posture |
|-------------|---------|-------------------|
| **CF-A3-001** | Owner D5 NEUTRAL vs registry/legacy D5 in Positive low band | **Preserved** — CQ-001 = A |
| **CF-A3-002** | Owner D10–D500 vs registry D10–D200 | **Preserved** — CQ-002 = A |
| **CF-A3-003** | MM3 BOOK `D30; D10` vs owner/registry bands | **Quarantine** — CQ-002 = A, CQ-003 = A |
| **CF-A3-004** | Registry `temperament_affinity` vs owner silence | **Preserved** — CQ-004 = A |
| **CF-A3-005** | MM3 BOOK safety/disease OCR vs owner-primary absence | **Quarantine** — CQ-003 = A |
| **CF-A3-006** | Expert tip keyword priority vs no-default medicine governance | **Closed** — `REJECTED_BY_EXISTING_GOVERNANCE`; historical source narrative preserved; no selector/default/candidate authority |
| **CF-A3-007** | S1+A3 in registry field vs separate expert tip | **Preserved** — CQ-004 = A |
| **CF-A3-008** | Owner/registry MIXED alignment vs potency band narrative | **Descriptive alignment only** — CQ-001 / CQ-004 = A |

No silent merge applied in this audit record.

---

## 14. Owner decisions — four full IDs

| Decision ID | Option | Scope (summary) |
|-------------|--------|-----------------|
| **R5-M6B-A3-CQ-001** | **A** | Rule 4 selection vs A3 potency narrative **separate tracks**; Rule 4 D5 Positive group unchanged; owner D5 Neutral as source text; registry D5 Positive conflict preserved; owner/registry **MIXED** **`descriptive_alignment_only`**; **no** selector, potency, or clinical authority |
| **R5-M6B-A3-CQ-002** | **A** | `descriptive_source_text_only`; owner D10–D500 preserved; Rule 4 auto scale unchanged; D100/D200/D500 auto selection prohibited; registry D10–D200 conflict preserved; MM3 quarantined; **no potency/dosage authorization** |
| **R5-M6B-A3-CQ-003** | **A** | `UNVERIFIED_BOOK_DERIVED_TEXT`; inventory reference allowed; zero clinical authority; no merge with owner-primary; BOOK does not complete Rule 5 safety |
| **R5-M6B-A3-CQ-004** | **A** | `DERIVED_UNVERIFIED_AFFINITY_METADATA`; owner-primary silent on Balanced/Lymphatic temperament metadata; MIXED **descriptive_alignment_only**; expert tip / **S1+A3** separate; keyword priority **REJECTED_BY_EXISTING_GOVERNANCE**; Rule 6 scaffold **READY_FOR_VALIDATION** ≠ approval; **A3 Rule 6 relationship zero authority** |

These decisions are **documentation of owner authorization** for audit posture — **not** clinical validation or implementation approval.

---

## 15. Rule 1 / 4 / 5 / 6 boundaries

### Rule 1 (patient temperament)

- Registry/materia narrative **non-authoritative** as patient temperament evidence where governance lists it.
- A3 registry `temperament_affinity` **must not** be read as Rule 1 patient-temperament evidence.

### Rule 4 (potency selection)

- Automatic dilution selection: merged frozen scale **D1–D60**; **D100/D200/D500** automatic selection **prohibited**.
- A3 owner potency bands remain **descriptive materia-medica text** unless separately authorized.

### Rule 5 (dosage / safety)

- **NOT_IMPLEMENTED**; this audit **does not** complete safety domains.

### Rule 6 (medicine relationships)

| Layer | Posture @ audit base `44125592` |
|-------|----------------------------------|
| **Scaffold / code** | Rule 6 **`READY_FOR_VALIDATION`** — scaffold readiness only, **not** medicine-level approval |
| **A3 medicine-level relationship (incl. S1+A3)** | **`NOT_APPROVED` / `ZERO_AUTHORITY`** |
| **Clinical activation** | **None** |

---

## 16. Final classification

| Dimension | Classification |
|-----------|----------------|
| **Canonical identity** | **VERIFIED** (CQ-001A / registry v2) |
| **Owner-primary materia block** | **LOCATED** — `OWNER_PROVIDED_SOURCE_CANDIDATE` |
| **Clinical validation** | **NOT_VALIDATED** |
| **Registry descriptive metadata** | **LEGACY_NORMALIZED_ENGINE_COPY** alignment |
| **Temperament affinity** | **DERIVED_UNVERIFIED_AFFINITY_METADATA** |
| **BOOK/MM3 adjunct** | **UNVERIFIED_BOOK_DERIVED_TEXT** |
| **Mixed polarity wording** | **`descriptive_alignment_only`** |
| **Rule 5 safety** | **INCOMPLETE / BLOCKED** |
| **Evidence lifecycle** | **NONE activated** |

**Verdict code:** `A3_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED`

---

## 17. Remaining blockers

1. Rule 5 fourteen-domain completion requires **complete source provenance**, applicable **owner governance review**, and **independent clinical validation** where required.
2. BOOK bibliographic verification gate before any BOOK text adoption.
3. Explicit owner decisions if registry descriptive fields should ever supersede or reconcile with owner-primary (beyond documented CQ-001–004 preservation posture).
4. Rule 6 medicine-level relationship authorization (including **S1+A3**) — **separate future owner phase**; not implied by this audit.
5. Provenance/license verification for owner transcript and normalized corpus in EHAS2 tracked artifacts.
6. **Closed boundary:** keyword-priority expert tip is **rejected** for current EHAS2 selector use (`REJECTED_BY_EXISTING_GOVERNANCE`).

**Next eligible medicine in canonical sequence (index §2/§3):** **APP — NOT_STARTED; no audit target authorization in this PR.** No APP audit file in this task.

---

## 18. Mandatory footer (audit record)

| Item | Value |
|------|--------|
| Medicine audited (documentation) | A3 |
| Clinically validated | NO |
| Rule 5 safety complete | NO |
| Evidence activated | NONE |
| Potency authorized | NO |
| Dosage authorized | NO |
| Rule 6 A3 relationship approved | NO |
| Registry JSON changed | NO |
| C11 implicated | NO |
| Runtime changed | NO |

**Authority tag:** `DOCUMENTATION_ONLY_MEDICINE_AUDIT` · **Owner decisions recorded as documentation · not implementation approval**
