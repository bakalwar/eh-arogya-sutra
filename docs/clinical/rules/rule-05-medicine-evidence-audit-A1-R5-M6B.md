# Rule 5 — R5-M6B Medicine Evidence Audit: A1 (Angioitico-1)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 1 of 38 |
| **Medicine code** | A1 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-08 |
| **Repository base (EHAS2)** | `e762537baa85d342ff8aaaa9d9f0199334217a87` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |

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

This record is a **documentation-only** source and governance audit for **A1**. It:

- Inventories and compares sources; records conflicts and owner decisions **as documentation**.
- Does **not** clinically validate A1, authorize potency/dosage, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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

## 4. A1 canonical identity

| Field | Registry v2 | Owner-primary block | Notes |
|-------|-------------|---------------------|--------|
| **Code** | `A1` | `A1` | Matches CQ-001A set |
| **Display name** | `Angioitico-1` | `ANGIOTICOS-1 (A1)` | Spelling variant only |
| **Group** | `Angioitico` | A-Group (Angioticos) | Consistent |
| **Medicine number** | Not in v2 row | `21` | Owner-only metadata |
| **C11 remap** | **No** | **No** | C11 not used for A1 |

**No-remap confirmation:** A1 remains code `A1`; no substitution from excluded C11.

---

## 5. Sources and provenance table

| Source ID | Classification (framework §3) | Reference | Tracked in EHAS2 Git | Blob / status | Provenance | License |
|-----------|------------------------------|-----------|----------------------|---------------|------------|---------|
| **SRC-A1-OWNER** | `OWNER_PROVIDED_SOURCE_CANDIDATE` | Cursor transcript session `019c5012-fbb1-4582-a4af-af8484d1bc5f` (user message ~line 1415); normalized corpus `MED=A1` | Corpus: **NOT_GIT_TRACKED** in EHAS2 | See **§5.1 corpus integrity** (scope-specific hashes; not a merged Git blob) · primary narrative lines **887–926** | **Located, not verified** | **Not verified** |
| **SRC-A1-MM1E** | `NORMALIZED_OWNER_TEXT_COPY` | Legacy project `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (`MED=A1` … before `MED=A2`) | **WORKTREE_ONLY** (legacy repo) | Same byte anchor as §5.1 A1-block scope | Derived copy of owner block | N/A |
| **SRC-A1-REG-V2** | `CURRENT_EHAS2_REGISTRY_V2` | `packages/medicine-registry/src/medicines.v2.json` (first object) | **Tracked @ e762537** | Blob `5bba8d6…` | Identity/metadata structure | N/A |
| **SRC-A1-ENGINE** | `LEGACY_NORMALIZED_ENGINE_COPY` | Legacy `eh-api/data/engine_medicines_38.py` (`MEDICINES_38` A1 dict) | Legacy repo tracked @ `c4232ec` lineage; blob `6e3d87e…` @ legacy HEAD | Comparison only | Developer normalization | N/A |
| **SRC-A1-MM2** | `NORMALIZED_OWNER_TEXT_COPY` | Legacy `docs/phase-s5-mm2/S5MM2_MASTER_MATERIA_MEDICA.json` (A1 entry) | **WORKTREE_ONLY** | MM2 `temperament_affinity`: `UNKNOWN` | Parsed from owner corpus | N/A |
| **SRC-A1-MM3** | `HISTORICAL_OR_CONFLICTING_LEGACY_SOURCE` | Legacy `docs/phase-s5-mm3/S5_MM3_MASTER_MATERIA_MEDICA.json` (`A1` row) | **WORKTREE_ONLY** | BOOK + doctor segments; OCR-derived | **UNVERIFIED_BOOK_DERIVED_TEXT** | **Not verified** |
| **SRC-A1-BOOK** | `HISTORICAL_OR_CONFLICTING_LEGACY_SOURCE` | BOOK master Hindi OCR (`EH_BOOK_MASTER_HINDI.txt`) — A-group doctrine | **WORKTREE_ONLY** | Group-level blood-nature text; not English Sanguine on A1 row | **UNVERIFIED_BOOK_DERIVED_TEXT** | **Not verified** |

Untracked legacy sources are **not** merged Git authority for EHAS2.

### 5.1 Corpus integrity (read-only recompute)

Legacy normalized corpus (untracked working tree). **No legacy files edited.** Methods: `git hash-object` (Git blob SHA-1, with/without `--no-filters`); `SHA-256` over **on-disk bytes** (Node `crypto.createHash('sha256')`).

| Scope | Relative path / boundary | Byte length | Line endings (on disk) | Git tracking | Git blob SHA-1 (`--no-filters`) | Git blob SHA-1 (default filters) | SHA-256 (raw bytes) |
|-------|--------------------------|------------:|------------------------|--------------|--------------------------------|----------------------------------|---------------------|
| **Whole file** | `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` | 424,565 | **CRLF** throughout (5,677 `\n`-split records; 4,899 non-empty logical lines via `Measure-Object -Line`) | **NOT_GIT_TRACKED** (legacy repo) | `f4bc49f70d8482824bc06f8d21dae673cba8ee9e` | `51ba285e302d7490f37f1cf73b69c953f59c2f87` | `9ecd7e87bf0ed5865df70c1bd49adcd093f557d3cdb5a0f56c9a0e85bc82e4c1` |
| **A1 normalized block** | From first `MED=A1` through byte before `MED=A2` (includes section headers + `<user_query>` … `</user_query>`) | 6,244 | **CRLF** (substring of whole file) | **NOT_GIT_TRACKED** | `dbd2788dbfa1459abe20a68f693be280eb5d669e` | `d3696362e1b7837fbe05b61192238cdda1a5e200` | `49377158a0a03716e7b9537dceb3e2b6098ca8728cb7feea2dedc85513893cf5` |

**Prior hash reconciliation (not merged Git authority):**

- **`51ba285e…`** — reproducible as **whole-file** `git hash-object` **without** `--no-filters` (Git default filter path on this host). **Not** the on-disk raw-byte blob SHA-1.
- **`f4bc49f…`** — reproducible as **whole-file** `git hash-object --no-filters` (raw working-tree bytes). Used in PR #21 initial draft; **scope was whole file**, not A1-only.
- **A1-block hashes** (`dbd2788…` / `d3696362…`) — **distinct scopes**; neither prior report hash applied to this boundary.

**Statement inventory check:** Primary owner narrative (lines 887–926 / `<user_query>` body) **unchanged** vs pre-audit read-only inventory; audit **continues** (no content drift blocker).

---

## 6. Source lineage / independence

| Relationship | Assessment |
|--------------|------------|
| Owner → MM1E corpus | **Duplicate / normalized copy** |
| Owner → MM2 | **Derived** from owner block; adds structure, not new primary temperament labels |
| Engine → Registry v2 A1 row | **Near-identical English fields** (legacy normalization copied into v2) |
| MM3 BOOK → Owner | **Independent BOOK chain** with OCR noise; **must not merge** with owner-primary (CQ-003) |
| BOOK A-group → Registry `temperament_affinity` | **Possible inference path** (blood-nature / Mattei labels in other legacy rows); **not owner-verbatim on A1** |
| Expert tip (A1+BE) → `temperament_affinity` | **Conflation** in engine/registry — pairing folded into temperament field |

**First appearance of `Sanguine (primary), Bilious` on A1:** legacy engine + registry v2; **not** in owner-primary block. Introducing commit beyond `c4232ec` for engine field: **UNKNOWN** (fine-grained bisect not performed in this audit).

---

## 7. Owner-primary statement inventory

**Label:** `EXHAUSTIVE_PRIMARY_BLOCK_STATEMENT_INVENTORY` — **36** distinct statement rows (**A1-CLM-001** through **A1-CLM-036**) covering the verified primary block (corpus lines 887–926). Rows include composite materia-medica statements (identity, affinity, condition associations, potency bands, tags, expert tips); they are **inventory references**, not atomic clinical validations.

| ID | Category | Short paraphrase (owner-primary) |
|----|----------|----------------------------------|
| A1-CLM-001 | Identity | A1 is the first prominent medicine of A-Group (Angioticos). |
| A1-CLM-002 | Identity | Called protector of arteries / medicine of red (arterial) blood. |
| A1-CLM-003 | Identity | Medicine number 21: ANGIOTICOS-1 (A1). |
| A1-CLM-004 | Identity | Aliases: Arterial Master; Hypertension Regulator. |
| A1-CLM-005 | Philosophy | Main role: control arteries and arterial blood circulation. |
| A1-CLM-006 | Philosophy | Acts on vessels carrying pure blood from heart to body. |
| A1-CLM-007 | Philosophy | Among EH medicines affecting BP and left-side diseases. |
| A1-CLM-008 | Affinity | Arteries — wall tone and elasticity. |
| A1-CLM-009 | Affinity | Heart — beat and muscle strength. |
| A1-CLM-010 | Affinity | Cerebral (brain) blood circulation. |
| A1-CLM-011 | Affinity | Left side — circulation to left-sided organs. |
| A1-CLM-012 | Indication | High blood pressure — reduce and normalize. |
| A1-CLM-013 | Indication | Palpitations. |
| A1-CLM-014 | Indication | Angina pectoris (arterial obstruction chest pain). |
| A1-CLM-015 | Indication | Arteriosclerosis (hardening of arteries). |
| A1-CLM-016 | Indication | Arterial bleeding (bright red, rapid flow). |
| A1-CLM-017 | Indication | Epistaxis (nosebleed). |
| A1-CLM-018 | Indication | Injury/bruising with coagulated or contracted blood. |
| A1-CLM-019 | Indication | Congestive headache (pressure sensation in head). |
| A1-CLM-020 | Indication | Vertigo from cerebral circulation disturbance. |
| A1-CLM-021 | Indication | Left arm/shoulder pain when linked to heart/arteries. |
| A1-CLM-022 | Indication | Inflammatory fever with very fast, hard pulse. |
| A1-CLM-023 | Potency narrative | Low dilution D1–D3 **Positive** — low BP, weak arteries, boost circulation. |
| A1-CLM-024 | Potency narrative | **D5 NEUTRAL** within low-band narrative. |
| A1-CLM-025 | Potency narrative | High dilution **D10–D500 Negative** — high BP, palpitation, bleeding control. |
| A1-CLM-026 | Tags | Keyword tag: Arterial-Master. |
| A1-CLM-027 | Tags | Keyword tag: High-BP-Remedy. |
| A1-CLM-028 | Tags | Keyword tag: Heart-Palpitation-Support. |
| A1-CLM-029 | Tags | Keyword tag: Circulation-Booster. |
| A1-CLM-030 | Tags | Keyword tag: Arteriosclerosis-Treatment. |
| A1-CLM-031 | Tags | Keyword tag: Left-Side-Affinity. |
| A1-CLM-032 | Tags | Keyword tag: Arterial-Bleeding-Control. |
| A1-CLM-033 | Expert tip | If DB keywords include BP/heart/palpitation/artery/left-side pain → prioritize A1. |
| A1-CLM-034 | Expert tip | High BP cases: A1 with BE (Blue Electricity) described as rapid calming. |
| A1-CLM-035 | Instruction | Save block as A1 master data for database (authoring instruction). |
| A1-CLM-036 | Group context | Opens A-Group Angioticos series with A1 as lead medicine. |

**Temperament:** No owner-primary row for Sanguine, Bilious, or `temperament_affinity`.

---

## 8. Registry / legacy comparison

| Field | Owner-primary | Registry v2 / legacy engine | Conflict |
|-------|---------------|------------------------------|----------|
| `polarity` (medicine-level) | Low band Positive; high band Negative narrative | `POSITIVE` (single field) | **Wording model mismatch** |
| `potency_logic` | D5 **NEUTRAL**; high **D10–D500** | D1–D5 POSITIVE; high **D10–D200** | **Yes** — band ceiling + D5 polarity |
| `temperament_affinity` | **Absent** | Sanguine (primary), Bilious; A1+BE expert clause | **Yes** — derived addition |
| English normalization | Hindi/Hinglish primary | Condensed English strings | Expected normalization; not clinical upgrade |
| Expert tip | Separate prose | Embedded in `temperament_affinity` | **Conflation** |

Registry v2 A1 row matches legacy `engine_medicines_38.py` on compared fields (byte-level string parity on sampled fields).

---

## 9. Potency scope separation (CQ-001 / CQ-002)

| Track | Authority | A1 fact |
|-------|-----------|---------|
| **Rule 4 formula-selection potency** | Merged Rule 4 governance (automatic scale D1–D60; D100/D200/D500 auto **prohibited**) | **Unchanged** by this audit |
| **A1 medicine-specific potency narrative** | Owner-primary descriptive text only | D5 **NEUTRAL**; D10–D500 **Negative** band in owner text |
| **Registry/legacy potency_logic** | Descriptive conflict reference | D5 **Positive** grouping; **D10–D200** ceiling |

**Owner decisions recorded (documentation):**

- **`R5-M6B-A1-CQ-001 = A`** — Separate tracks; Rule 4 D5 Positive group unchanged; owner D5 Neutral preserved as source text; registry/legacy D5 Positive conflict preserved; no executable potency authority.
- **`R5-M6B-A1-CQ-002 = A`** — `descriptive_source_text_only`; owner `D10–D500` preserved; Rule 4 automatic selection limits unchanged; registry `D10–D200` conflict preserved; no potency/dosage authorization.

---

## 10. BOOK quarantine (CQ-003)

MM3/BOOK-derived A1 material (contraindications, cautions, dilution fragments, extended disease lists) is classified:

- **`UNVERIFIED_BOOK_DERIVED_TEXT`**
- **`inventory_reference_allowed`**
- **`zero_clinical_authority`**
- **`no_merge_with_owner_primary`**

Bibliographic identity, license, page binding, and OCR integrity for BOOK sources: **NOT_VERIFIED**. BOOK evidence does **not** count toward Rule 5 safety completion.

**Owner decision:** **`R5-M6B-A1-CQ-003 = A`** (scopes above).

---

## 11. Temperament-affinity quarantine (CQ-004)

| Concept | Owner-primary | Registry/legacy |
|---------|---------------|-----------------|
| Sanguine (primary) | **Silent** | Present in `temperament_affinity` |
| Bilious | **Silent** | Present |
| A1 + BE pairing | Expert tip (separate) | Appended inside `temperament_affinity` |
| Keyword priority | Expert tip (separate) | Not verbatim in registry field |

MM2 A1: `temperament_affinity`: **`UNKNOWN`**. MM3 A1: `temperament`: **`UNKNOWN`**.

**Owner decision:** **`R5-M6B-A1-CQ-004 = A`** — `DERIVED_UNVERIFIED_AFFINITY_METADATA`; expert tip and BE pairing remain **separate inventory concepts**; **zero** Rule 6 medicine-level relationship authority; no default/priority/candidate effect from registry presence.

---

## 12. Rule 5 fourteen-domain safety gap register

Domains use framework §5.7 vocabulary only. **BOOK-only** rows marked quarantined — **zero safety-completion credit**.

| # | Domain | Owner-primary | Registry/legacy | MM3 BOOK-derived | Status |
|---|--------|---------------|---------------|------------------|--------|
| 1 | Contraindications | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | Text present (OCR) | **OWNER_REVIEW_REQUIRED** · BOOK = UNVERIFIED |
| 2 | Allergy / hypersensitivity | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 3 | Adverse effects | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | Caution text (OCR) | **OWNER_REVIEW_REQUIRED** · BOOK quarantined |
| 4 | Medicine–medicine interactions | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | Combination fragments | **OWNER_REVIEW_REQUIRED** · BOOK quarantined |
| 5 | Medicine–condition interactions | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | Partial | **OWNER_REVIEW_REQUIRED** |
| 6 | Route incompatibility | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | Lotion/route mentions (OCR) | **OWNER_REVIEW_REQUIRED** · BOOK quarantined |
| 7 | Overdose / exposure | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | Overuse caution (OCR) | **OWNER_REVIEW_REQUIRED** · BOOK quarantined |
| 8 | Duration / cumulative use | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 9 | Monitoring targets | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 10 | Pause criteria | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 11 | Stop criteria | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 12 | Emergency / red-flag criteria | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 13 | Follow-up timing | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** |
| 14 | Special populations | **SOURCE_NOT_FOUND** | **SOURCE_NOT_FOUND** | Pregnancy mention in OCR cautions | **OWNER_REVIEW_REQUIRED** · BOOK quarantined |

**`OWNER_REVIEW_REQUIRED` meaning (this audit):** required **action / governance status** only — **not** Rule 5 safety completion. It does **not** verify BOOK OCR text, does **not** close contraindication / adverse-effect / interaction / monitoring / emergency / special-population gaps, and does **not** assign `OWNER_APPROVED`, `VALIDATED`, or `ACTIVE`. Applicable **independent clinical evidence** (and complete provenance where required) remains necessary before any future safety-completion claim.

**Rule 5 implementation posture (EHAS2):** `NOT_IMPLEMENTED` (framework/index). No domain reaches `OWNER_APPROVED`.

---

## 13. Conflict register

| Conflict ID | Summary | Resolution posture |
|-------------|---------|-------------------|
| **CF-A1-001** | Owner D5 NEUTRAL vs registry/legacy D5 in Positive low band | **Preserved** — CQ-001 = A |
| **CF-A1-002** | Owner D10–D500 vs registry D10–D200 | **Preserved** — CQ-002 = A |
| **CF-A1-003** | Registry `temperament_affinity` vs owner silence | **Preserved** — CQ-004 = A |
| **CF-A1-004** | MM3 BOOK safety text vs owner-primary absence | **Quarantine** — CQ-003 = A |
| **CF-A1-005** | Expert tip keyword priority vs no-default medicine governance | **Closed** — `REJECTED_BY_EXISTING_GOVERNANCE`; historical source narrative preserved; no selector/default/candidate authority |
| **CF-A1-006** | Medicine-level `polarity: POSITIVE` vs bidirectional potency narrative | **Preserved** — descriptive conflict |

No silent merge applied in this audit record.

---

## 14. Owner decisions — four full IDs

| Decision ID | Option | Scope (summary) |
|-------------|--------|-----------------|
| **R5-M6B-A1-CQ-001** | **A** | Rule 4 selection vs A1 potency narrative **separate tracks**; Rule 4 D5 Positive group unchanged; owner D5 Neutral as source text; registry D5 Positive conflict preserved; **no executable potency authority** |
| **R5-M6B-A1-CQ-002** | **A** | `descriptive_source_text_only`; owner D10–D500 preserved; Rule 4 auto scale unchanged; D100/D200/D500 auto selection prohibited; registry D10–D200 conflict preserved; **no potency/dosage authorization** |
| **R5-M6B-A1-CQ-003** | **A** | `UNVERIFIED_BOOK_DERIVED_TEXT`; inventory reference allowed; zero clinical authority; no merge with owner-primary; BOOK does not complete Rule 5 safety |
| **R5-M6B-A1-CQ-004** | **A** | `DERIVED_UNVERIFIED_AFFINITY_METADATA`; owner silent on Sanguine/Bilious; expert tip / A1+BE separate; **zero** Rule 6 medicine relationship authority |

These decisions are **documentation of owner authorization** for audit posture — **not** clinical validation or implementation approval.

---

## 15. Rule 1 / 4 / 5 / 6 boundaries

### Rule 1 (patient temperament)

- Frozen temperament logic separate from disease ranking and final medicine selection (`rule-01-temperament-engine.md`).
- Q3G-TIE / **`UNRESOLVED_TIE`** — no default medicine from equal tie (`rule-01-q3-precontract-owner-decisions.md`).
- Registry/materia narrative **non-authoritative** as patient evidence where governance lists it.
- A1 appears only as **example** in blood/lymph future candidacy language — **not** from `temperament_affinity` column.

### Rule 4 (potency selection)

- Automatic dilution selection: merged frozen scale **D1–D60**; **D100/D200/D500** automatic selection **prohibited**.
- A1 owner potency bands remain **descriptive materia-medica text** unless separately authorized.

### Rule 5 (dosage / safety)

- **NOT_IMPLEMENTED**; this audit **does not** complete safety domains.

### Rule 6 (medicine relationships)

| Layer | Posture @ audit base `e762537` |
|-------|--------------------------------|
| **Scaffold / code (`nineRules.ts`)** | Rule 6 `phase5bStatus`: **`READY_FOR_VALIDATION`**; `ORCHESTRATION_STATUS`: **`NOT_CONNECTED`**; `VALIDATION_ORCHESTRATION_STATUS`: **`READY_FOR_VALIDATION`** (synthetic validation only) |
| **R5-M6B framework/index wording** | Rule 6 documented as **`NOT_STARTED`** for medicine-evidence program |
| **Audit note** | **Wording mismatch** between M6B docs (`NOT_STARTED`) and contracts (`READY_FOR_VALIDATION` = interface/scaffold readiness, not clinical activation) — **not edited in this PR** |
| **A1 medicine-level relationship** | **`NOT_APPROVED` / `ZERO_AUTHORITY`** — registry presence creates **no** eligibility, priority, or default |
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
| **Rule 5 safety** | **INCOMPLETE / BLOCKED** |
| **Evidence lifecycle** | **NONE activated** |

**Verdict code:** `A1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED`

---

## 17. Remaining blockers

1. Rule 5 fourteen-domain completion requires **complete source provenance**, applicable **owner governance review**, and **independent clinical validation** where required; **owner acknowledgment/approval alone does not** make missing safety evidence verified, sufficient, or complete.
2. BOOK bibliographic verification gate before any BOOK text adoption.
3. Explicit owner decisions if registry descriptive fields should ever supersede or reconcile with owner-primary (beyond documented CQ-001–004 preservation posture).
4. Rule 6 medicine-level relationship authorization — **separate future owner phase**; not implied by this audit.
5. Provenance/license verification for owner transcript and normalized corpus in EHAS2 tracked artifacts.
6. **Closed boundary (not an open blocker):** keyword-priority expert tip is **rejected** for current EHAS2 selector use (`REJECTED_BY_EXISTING_GOVERNANCE`); future reconsideration requires a **new explicit owner supersession decision**. Historical owner text remains in §7 inventory only.

**Next eligible medicine in canonical sequence:** **A2 — NOT_STARTED; no audit target authorization in this PR.** No A2 audit file in this task.

---

## 18. Mandatory footer (audit record)

| Item | Value |
|------|--------|
| Medicine audited (documentation) | A1 |
| Clinically validated | NO |
| Rule 5 safety complete | NO |
| Evidence activated | NONE |
| Potency authorized | NO |
| Dosage authorized | NO |
| Rule 6 A1 relationship approved | NO |
| Registry JSON changed | NO |
| C11 implicated | NO |
| Runtime changed | NO |

**Authority tag:** `DOCUMENTATION_ONLY_MEDICINE_AUDIT` · **Owner decisions recorded as documentation · not implementation approval**
