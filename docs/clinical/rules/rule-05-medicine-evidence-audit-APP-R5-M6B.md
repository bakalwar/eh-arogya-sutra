# Rule 5 — R5-M6B Medicine Evidence Audit: APP (Aqua Perla Pelli)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 4 of 38 |
| **Medicine code** | APP |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-08 |
| **Repository base (EHAS2)** | `ec2c30023784bf0083782f496d28d57177496fcc` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `APP_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`) |
| **Registry identity (APP code in 38-set)** | **VERIFIED** — code `APP` present in v2 registry; **not** owner-source verification |
| **Owner-primary verification** | **NO** — `OWNER_PRIMARY_NOT_LOCATED` |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` · git blob `5bba8d6fe05effc775e88ddfba93c1e572f069cb` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` · `artifactSha256`: `1C29F194B4B8EF6B45DBE75FE82EA7F660A51F48952BB7050B9A0BD86990B814` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **APP**. It:

- Inventories and compares sources; records conflicts and owner decisions **as documentation**.
- Does **not** clinically validate APP, authorize potency/dosage, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** endorse cure, guarantee, default medicine, or keyword-priority selection authority.
- Does **not** treat registry/legacy clinical strings as owner-verified clinical truth.

**Posture flags (final):**

| Flag | Value |
|------|--------|
| `clinicallyValidated` | `false` |
| `rule5SafetyCoverageComplete` | `false` |
| `ownerPrimaryVerified` | `false` |
| `ownerSourceStatus` | `NOT_LOCATED` |
| `routeAuthority` | `ROUTE_AUTHORITY_NONE` |
| `potencyAuthorized` | `false` |
| `dosageAuthorized` | `false` |
| `evidenceActivated` | `false` |
| `rule6MedicineRelationshipAuthority` | `NONE` |
| `runtimeAuthorized` | `false` |

---

## 4. APP canonical identity (registry vs owner-primary)

| Field | Registry v2 / legacy engine | Owner-primary | Notes |
|-------|------------------------------|---------------|--------|
| **Code** | `APP` | **NOT_LOCATED** | 38-set identity **VERIFIED** only |
| **Display name** | `Aqua Perla Pelli` | **NOT_LOCATED** | Registry label only — **DERIVED_UNVERIFIED** clinical framing |
| **Group** | `Fluid` | **NOT_LOCATED** | |
| **Polarity field** | `NEUTRAL` | **NOT_LOCATED** | Inventory only — CQ-006 |
| **Route** | Wording **external use only** in registry fields | **NOT_LOCATED** | **ROUTE_AUTHORITY_NONE** — CQ-002 |
| **Medicine number** | Not in sampled v2 row | **NOT_LOCATED** | **ME-APP-002** |

**No-remap confirmation:** APP remains code `APP`; no substitution from excluded C11 or A-series codes.

---

## 5. Sources and provenance table

| Source ID | Classification (framework) | Reference | Tracked in EHAS2 Git | Status | Provenance | License |
|-----------|---------------------------|-----------|----------------------|--------|------------|---------|
| **SRC-APP-OWNER** | `OWNER_PROVIDED_SOURCE_CANDIDATE` | Legacy normalized corpus `MED=APP` blocks (10 headers); MM2 primary pointer transcript `019c5012…` line **907** | Corpus: **NOT_GIT_TRACKED** in EHAS2 | **REJECTED as owner-primary** (CQ-001) | **NOT_LOCATED** | **Not verified** |
| **SRC-APP-MM1E** | `NORMALIZED_OWNER_TEXT_COPY` | Legacy `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` | **WORKTREE_ONLY** (legacy repo) | Mis-tagged engine/dev/prescription/agent blocks | Not primary authority | N/A |
| **SRC-APP-MM2** | `NORMALIZED_OWNER_TEXT_COPY` | Legacy `docs/phase-s5-mm2/S5MM2_MASTER_MATERIA_MEDICA.json` (APP entry) | **WORKTREE_ONLY** | Primary @ L907 = Mattei Engine pseudocode | **Mis-tag** — CF-APP-001 closed | N/A |
| **SRC-APP-REG-V2** | `CURRENT_EHAS2_REGISTRY_V2` | `packages/medicine-registry/src/medicines.v2.json` (APP object) | **Tracked @ ec2c300** | Identity + English metadata | **DERIVED_UNVERIFIED** clinical strings | N/A |
| **SRC-APP-ENGINE** | `LEGACY_NORMALIZED_ENGINE_COPY` | Legacy `eh-api/data/engine_medicines_38.py` (`APP` dict) | Legacy repo | Near-identical to v2 APP row | Developer normalization | N/A |
| **SRC-APP-TABLET-REG** | `RUNTIME_CLASSIFICATION_REFERENCE` | Legacy `eh-api/core/tablet_full_pool_registry.py` (`EXTERNAL_ONLY` for APP) | Legacy repo | Engineering hint only | **Not** route authority (CQ-002) | N/A |
| **SRC-APP-MM3** | `HISTORICAL_OR_CONFLICTING_LEGACY_SOURCE` | Legacy `docs/phase-s5-mm3/S5_MM3_MASTER_MATERIA_MEDICA.json` (`APP` row) | **WORKTREE_ONLY** | BOOK + polluted doctor segment | **`UNVERIFIED_BOOK_DERIVED_TEXT`** | **Not verified** |
| **SRC-APP-UCKB** | `PARALLEL_PROGRAM_DATASET` | Legacy `docs/uckb-validation/normalized/UCKB_DATASET_v1.json` (`medicine_id: APP`) | **WORKTREE_ONLY** | **`production_uckb_status: NOT_ACTIVATED`** | Parallel reference only | N/A |

Untracked legacy sources are **not** merged Git authority for EHAS2.

### 5.1 Owner-primary not located (CQ-001)

**Decision:** **`R5-M6B-APP-CQ-001 = A`** — scope: **`OWNER_PRIMARY_NOT_LOCATED`**.

- **Reject** MM2-designated primary at corpus line **907** (content: `# EH SYSTEM LOGIC: "The Mattei Engine"` — generic triad/electricity pseudocode; **no** APP materia narrative).
- **Reject** all current **`MED=APP`** corpus tags as owner-primary (engine requirements, prescription mocks, Python refactor logs, agent artifacts).
- **UCKB MM1F note (read-only):** `NO BLOCK FOUND (any transcript)` for APP — aligns with **NOT_LOCATED** posture.
- **Future authentic APP primary** requires **separate explicit owner designation** — not inference from registry, MM2, or MM3.

**Owner-primary statement inventory:** **NONE** — no `EXHAUSTIVE_PRIMARY_BLOCK_STATEMENT_INVENTORY` for APP in this record.

---

## 6. Source lineage / independence

| Relationship | Assessment |
|--------------|------------|
| Owner-primary → MM1E / MM2 | **No valid owner block located** — MM2 `PRIMARY_DOCTOR_BLOCK_FOUND` **incorrect** for APP |
| Registry v2 APP ↔ legacy engine | **Near-identical English fields** — **DERIVED_UNVERIFIED** |
| MM3 BOOK → owner | **No merge** — **`UNVERIFIED_BOOK_DERIVED_TEXT`** (CQ-005) |
| MM3 doctor segment → APP teaching | **Polluted** (multi-disease engine text) — **not doctor evidence** (CQ-005) |
| Registry S3/C3 strings → Rule 6 | **Metadata inventory only** — **ZERO_AUTHORITY** (CQ-004) |
| UCKB APP dataset → R5-M6B primary | **Parallel, NOT_ACTIVATED** — **CF-APP-008** |
| A1 / A2 / A3 | **Methodology pattern only** — **no** A-series clinical content copied into APP inventory |

---

## 7. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

Rows are **inventory references**, not clinical validations.

| ID | Category | Short paraphrase (registry/legacy) |
|----|----------|-------------------------------------|
| APP-R-001 | Identity | Code **APP**; name **Aqua Perla Pelli** |
| APP-R-002 | Group | **Fluid** |
| APP-R-003 | Polarity field | **NEUTRAL** |
| APP-R-004 | Route wording | **External use only** |
| APP-R-005 | Target | Epidermis, facial skin, blemishes, acne-prone areas |
| APP-R-006 | Description | Topical skin radiance, blemish control, acne management |
| APP-R-007 | Organ action | External application; blemishes, pigmentation, acne, mild fungal/itch, complexion |
| APP-R-008 | When to give | Acne, blemishes, dull complexion, mild eczema/dermatitis, ringworm/scabies support **alongside oral S3** (combo metadata — CQ-004) |
| APP-R-009 | Disease clusters | Acne, melasma, rosacea, tinea, scabies, pigmentation, cosmetic radiance, etc. |
| APP-R-010 | Potency (descriptive) | Dry/dull → topical **D1–D3**; acute → **D5–D10**; **external cap D10** (CQ-003 inventory only) |
| APP-R-011 | Temperament metadata | **Lymphatic (skin), Balanced** (CQ-006 inventory only) |
| APP-R-012 | Combination metadata | **External adjunct to S3/C3 on SKIN** (CQ-004 — no Rule 6 edge) |
| APP-R-013 | Search tags | External-Skin, Topical-Only, Aqua-Perla, Skin-Radiance, etc. |

---

## 8. Rejected MM2 mis-tag artifacts (not APP clinical claims)

| ID | Content (MM2 / rejected corpus primary) |
|----|----------------------------------------|
| APP-M2-001 | Global Mattei Engine potency triad (D100+, D10/D30, D3/D6) |
| APP-M2-002 | Generic S/C/A/L selection rules |
| APP-M2-003 | Electricity map GE/BE/RE/YE/WE |
| APP-M2-004 | Sample combos **A1 + S1 + BE**, **A1 + S1 + RE** |

---

## 9. MM3 / BOOK quarantine inventory (`UNVERIFIED_BOOK_DERIVED_TEXT`)

**Decision:** **`R5-M6B-APP-CQ-005 = A`** — scope: **`QUARANTINE_INVENTORY_ONLY`**.

| ID | Topic | Authority |
|----|--------|-----------|
| APP-B-001 | BOOK Hindi: external skin drug framing | Inventory only — **zero Rule 5 credit** |
| APP-B-002 | BOOK **internal use** / anti-inflammatory prose | **Not** route authority (CQ-002) |
| APP-B-003 | Component table (Arnica, Evonymus, Pinus, …) | No clinical adoption |
| APP-B-004 | Eye-area / vaseline / spray **20–40 drops/L** | No dosage authority |
| APP-B-005 | Skin indications OCR | Quarantined |
| APP-B-006 | **`combination_rules`** e.g. **C5+GE** | Quarantined (CQ-004) |
| APP-B-007 | **`primary_organ: Blood`** vs registry skin | **CF-APP-004** |
| APP-B-008 | Polluted **doctor** segment (engine D30–D500 chart) | **Not doctor evidence** |

Bibliographic identity, license, page binding, OCR integrity: **NOT_VERIFIED**.

---

## 10. Route authority (CQ-002)

**Decision:** **`R5-M6B-APP-CQ-002 = A`** — scope: **`ROUTE_AUTHORITY_NONE`**.

- No validated APP administration route (external, internal, or mixed).
- Registry/legacy **external-only** strings and legacy **`EXTERNAL_ONLY`** tablet classifier → **DERIVED_UNVERIFIED engineering hint only**.
- MM2 `internal_use: YES (topical fluid)` → **ambiguous / quarantined**.
- MM3/BOOK internal-use OCR → **`UNVERIFIED_BOOK_DERIVED_TEXT`**.
- **No** route selector, Rule 5 route closure, or dosage authority from this record.

---

## 11. Potency / dosage scope (CQ-003)

**Decision:** **`R5-M6B-APP-CQ-003 = A`** — scope: **`SEPARATE_TRACKS_NO_APP_POTENCY_AUTHORITY`**.

| Track | Authority | APP fact |
|-------|-----------|----------|
| **Rule 4 oral formula-selection potency** | Merged Rule 4 governance | **Unchanged** — **not applied to APP** |
| **Registry/legacy topical D strings** | **`descriptive_source_text_only`** inventory | D1–D3; D5–D10 cap D10 — **DERIVED_UNVERIFIED** |
| **MM2 / MM3 / BOOK potency fragments** | Quarantined | **No** potency or dosage authorization |

---

## 12. Rule 6 / combinations (CQ-004)

**Decision:** **`R5-M6B-APP-CQ-004 = A`** — scope: **`RULE6_APP_RELATIONSHIP_ZERO_AUTHORITY`**.

- **S3**, **C3**, and all other codes remain **separate medicines**.
- Registry/legacy S3/C3 adjacency strings → **DERIVED_UNVERIFIED metadata inventory only**.
- MM2 **A1+S1+BE / A1+S1+RE** and MM3 **C5+GE** / OCR combos → **quarantined**.
- **No** default pairing, keyword priority, selector hint, or Rule 6 relationship edge for APP.

---

## 13. Polarity / temperament (CQ-006)

**Decision:** **`R5-M6B-APP-CQ-006 = A`** — scope: **`POLARITY_TEMPERAMENT_INVENTORY_ONLY`**.

- Registry/legacy **NEUTRAL** and **Lymphatic/Balanced** → **DERIVED_UNVERIFIED** inventory only.
- **No** polarity or temperament selector, priority, or patient-temperament evidence authority.
- Legacy UI/seed **Sanguine/Mixed** and **Special-group** strings → **separate unverified references** — **CF-APP-009**; **no** silent merge.

---

## 14. UCKB parallel reference (non-activated)

| Item | Status |
|------|--------|
| `production_uckb_status` | **NOT_ACTIVATED** |
| Extended “doctor summary” actions | **Parallel inventory only** — **CF-APP-008** |
| MM1F | **NO BLOCK FOUND** — supports **NOT_LOCATED** |

---

## 15. Rule 5 safety-domain matrix

Domains use framework vocabulary. **BOOK-only** rows: **zero safety-completion credit**.

| # | Domain | Owner-primary | Registry/legacy | MM3 BOOK | Status |
|---|--------|---------------|-----------------|----------|--------|
| 1 | Contraindications | **SOURCE_NOT_FOUND** | **Silent** | OCR fragments | **INCOMPLETE** · **ME-APP-003** |
| 2 | Pregnancy / lactation | N/A | N/A | N/A | **OPEN** (UCKB flag reference only) |
| 3 | Route safety | N/A | Derived external-only text | Internal OCR | **BLOCKED** · **ROUTE_AUTHORITY_NONE** |
| 4 | Pediatric / elderly topical | N/A | N/A | N/A | **SOURCE_NOT_FOUND** |
| 5 | Eye / mucosa | N/A | N/A | BOOK eye-area | **Quarantined** |
| 6 | Adverse effects | **SOURCE_NOT_FOUND** | **Silent** | N/A | **INCOMPLETE** |

**Rule 5 safety-complete:** **NO**.

---

## 16. Conflict register

| ID | Conflict | Disposition |
|----|----------|-------------|
| **CF-APP-001** | MM2 primary @ L907 mis-tag | **CLOSED** — CQ-001 = A |
| **CF-APP-002** | No owner-primary vs registry/legacy copy | **OPEN** — preserved |
| **CF-APP-003** | External-only vs BOOK internal | **OPEN** — CQ-002 |
| **CF-APP-004** | Skin vs MM3 Blood organ | **OPEN** |
| **CF-APP-005** | MM2 internal_use ambiguity | **OPEN** |
| **CF-APP-006** | Topical D vs quarantined oral-scale | **OPEN** — CQ-003 |
| **CF-APP-007** | S3/C3 adjacency vs no combo authority | **OPEN** — CQ-004 |
| **CF-APP-008** | UCKB extended vs registry narrow | **OPEN** |
| **CF-APP-009** | Lymphatic/Balanced vs legacy Sanguine/Mixed | **OPEN** — CQ-006 |

**No silent merge** applied in this audit record.

---

## 17. Missing-evidence register

| ID | Gap | Status |
|----|-----|--------|
| **ME-APP-001** | Authentic owner-primary materia designation | **OPEN** |
| **ME-APP-002** | Medicine number / full title | **OPEN** |
| **ME-APP-003** | Owner contraindications; pregnancy/lactation | **OPEN** |
| **ME-APP-004** | Owner-confirmed combination rules (S3/C3/etc.) | **OPEN** |
| **ME-APP-005** | BOOK bibliographic provenance + OCR integrity | **OPEN** |
| **ME-APP-006** | Owner topical potency/dosage table (distinct from Rule 4 oral) | **OPEN** |

---

## 18. Owner decision queue (recorded)

| ID | Decision | Scope token |
|----|----------|-------------|
| **R5-M6B-APP-CQ-001** | **A** | `OWNER_PRIMARY_NOT_LOCATED` |
| **R5-M6B-APP-CQ-002** | **A** | `ROUTE_AUTHORITY_NONE` |
| **R5-M6B-APP-CQ-003** | **A** | `SEPARATE_TRACKS_NO_APP_POTENCY_AUTHORITY` |
| **R5-M6B-APP-CQ-004** | **A** | `RULE6_APP_RELATIONSHIP_ZERO_AUTHORITY` |
| **R5-M6B-APP-CQ-005** | **A** | `QUARANTINE_INVENTORY_ONLY` |
| **R5-M6B-APP-CQ-006** | **A** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY` |

**Owner decision count:** **RECORDED_6**

---

## 19. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | APP (4/38) |
| Verdict | `APP_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **NOT_LOCATED** |
| Registry APP code identity | **VERIFIED** (38-set only) |
| Clinically validated | **NO** |
| Rule 5 safety-complete | **NO** |
| Evidence activated | **NONE** |
| Potency / dosage authorized | **NO / NO** |
| Rule 6 APP authority | **NONE** |
| Next canonical medicine (sequence) | **BE** — **not** started or targeted by this record |
| Registry / runtime / deployment changed | **NO** |
| PHI / secrets / database | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **APP blocked · no clinical or selector authority**
