# Rule 5 — R5-M6B Medicine Evidence Audit: S5 (Scrofoloso-5)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 29 of 38 |
| **Medicine code** | S5 |
| **Authoritative normalized header** | **`MED=S5`** |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-10 |
| **Repository base (EHAS2)** | `e1c9130040984ad1c7f15896b126d5964922137d` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `S5_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series occurrence **A** @ **L201**) |

**Mandatory normalizer posture:** Canonical code **`S5`** maps to owner normalized header **`MED=S5`**. Owner display **SCROFOLOSO-5 (S5)** / “Tissue Constructor” / “Liver-Muscle Master”. Registry mirror **Scrofoloso-5** — **`DERIVED_UNVERIFIED`**. **`^MED=S5`** header **count 4** in normalized corpus file; **019c owner-session materia walk** carries **one** authoritative header (**A** @ **L201**). Occurrences **B/C/D** (**e39c** session) are **`QUARANTINED_NO_OWNER_MERGE`** — **not** co-primary with **A**.

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Category** | **Scrofoloso** (deep tissue / structural / advanced liver framing) |
| **Canonical sequence** | **S3 → S5 → S6** (**no S4** in v2 38-set) |
| **Physical corpus order vs audit order** | **`MED=S3` L160 → `MED=S5` L201 → `MED=S6` L245** in normalized 019c walk — **immediate chain matches** canonical **S3→S5→S6**; **`MED=SLASS` L408** and canonical **S-Lass-before-S1** geography remain **OPEN** (**CF-S5-001**, **CF-S5-007**) |
| **Registry identity (S5 code in 38-set)** | **VERIFIED** — code `S5` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **POSITIVE** — metadata only; **not** owner §4 inline band verification |
| **Registry temperament field** | **`temperament_affinity`** present in v2 — **`DERIVED_UNVERIFIED`** vs owner block (temperament **silent** in bounded §1–4) |
| **Owner medicine number** | Owner-only metadata (**4** — SCROFOLOSO-5 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only) |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof (A)** | **PENDING** — jsonl line **1061** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length (A)** | **2832** — **OPEN** |
| **S5 inner wrapper (occurrence A)** | **`text` L203** · **`<user_query>` opens L204** · **closing `</user_query>` present L242** before separator **L244** — **CLOSED** (**CF-S5-003** governance resolution) |
| **Physical predecessor** | **`MED=S3` L160** — **matches** canonical audit predecessor **S3** |
| **Physical immediate successor** | **`MED=S6` L245** — **matches** canonical audit successor **S6** |
| **Canonical audit predecessor** | **S3** — merged formal audit on main (**provisional** occurrence A) |
| **Canonical audit successor** | **S6** — **not** started or targeted |
| **Prior S3 artifact** | Merged **S3** artifact documents physical successor **`MED=S5` L201** — **aligned**; **S3 artifact unchanged** by this PR |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **S5** (`MED=S5`). It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate S5, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM2/MM3/BOOK/UCKB strings or **developer/API/mock strings** as owner-verified clinical truth.
- Preserves disease/indication **source-tier inventory** with **zero** mapping or selection authority.
- **Documentation completion creates no clinical authority.**

**Posture flags (final):**

| Flag | Value |
|------|--------|
| `clinicallyValidated` | `false` |
| `rule5SafetyCoverageComplete` | `false` |
| `ownerPrimaryVerified` | `false` |
| `ownerSourceStatus` | **`LOCATED_REVIEWED`** (index) · artifact **`PROVISIONAL_OWNER_PRIMARY`** — **provisional, not fully verified** |
| `provenanceStatus` | **`INCOMPLETE_NOT_VERIFIED`** |
| `routeAuthority` | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| `potencyAuthorized` | `false` |
| `dosageAuthorized` | `false` |
| `electricityAuthorized` | `false` |
| `evidenceActivated` | `false` |
| `rule6MedicineRelationshipAuthority` | `NONE` |
| `runtimeAuthorized` | `false` |
| Mapping flags (all) | **`false`** |

---

## 4. S5 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L201) | Notes |
|-------|------------------------|----------------------------------------|--------|
| **Code** | S5 | S5 (`MED=S5`) | 38-set identity **VERIFIED** |
| **Display name** | Scrofoloso-5 | **S5 (Scrofoloso-5)** / Tissue Constructor / Liver-Muscle Master | Registry nickname aligned — **inventory only** |
| **Group** | Scrofoloso | Scrofoloso | Label-level alignment |
| **Polarity field** | POSITIVE | §4 **D1–D5 Positive**, **D30–D200 Negative** | **Inventory only** (**TGC-S5-004**, **CF-S5-004**); **not** dosage authority |

---

## 5. All `MED=S5` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L201** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1061** | **2832** | potency, bodyloc | **`PROVISIONAL_OWNER_PRIMARY`** — normalized owner-session materia master |
| **B** | **L4423** | `e39c411b-fba5-4f32-a72d-98af4bcc6cad\…jsonl` | **1911** | **10724** | potency, tablet, external, electricity | **`QUARANTINED_NO_OWNER_MERGE`** — PHASE S5-MM0 schema / audit-design block |
| **C** | **L4860** | `e39c411b-fba5-4f32-a72d-98af4bcc6cad\…jsonl` | **1932** | **6201** | potency, tablet, external, electricity | **`QUARANTINED_NO_OWNER_MERGE`** — post–S5-MM0 session tier |
| **D** | **L5101** | `e39c411b-fba5-4f32-a72d-98af4bcc6cad\…jsonl` | **1944** | **11652** | potency, tablet, external, electricity | **`QUARANTINED_NO_OWNER_MERGE`** — post–S5-MM1 session tier |

**Pattern search:** **`^MED=S5`** → **count 4** (entire normalized corpus file). **019c Scrofoloso walk** (**S3→S5→S6**): **count 1** authoritative materia header (**A** only).

**Occurrences B/C/D** are **rejected** as S5 owner materia co-primary — **`QUARANTINED_NO_OWNER_MERGE`** (**CF-S5-011**, **TGC-S5-009**). Tablet/external/electricity markers on **B/C/D** do **not** authorize route or electricity for owner block **A**.

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **Separator before header** | **L200** | Block boundary (`====`) | Boundary only |
| **`MED=S5` header** | **L201** | Transcript pointer (1061 / 2832) | **Authoritative** metadata line |
| **Label** | **L203** | `text` | Boundary only |
| **Inner wrapper open** | **L204** | `<user_query>` | Boundary only |
| **Blank line after open** | **L205** | Empty line inside wrapper | Boundary only |
| **Meta / Cursor save** | **L206–L208** | Intro + developer persistence + owner med #4 label | **Excluded** — non-clinical (**CF-S5-012**) |
| **§1 philosophy** | **L210–L211** | Deep tissue / connective tissue / gland rebuild | **Provisional inventory only** |
| **§2 affinity** | **L212–L216** | Liver cells, bone/joint, glands, pancreas/gallbladder | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L217–L234** | Advanced liver, structural/joint, glandular, chronic skin clusters | **Provisional inventory only** |
| **§4 potency** | **L235–L237** | D1–D5 Positive; D30–D200 Negative | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L238–L239** | Keyword workflow label | **Excluded** — non-operational (**CF-S5-012**) |
| **Expert tip (clinical inventory boundary)** | **L240–L241** | Mandatory **Mixture B or C** for Bone/Cartilage/Disc/Cirrhosis/Chronic Glandular keywords | **Provisional inventory only** (**TGC-S5-005**, **TGC-S5-007**) — **not** selector activation |
| **Post-tip agent tail** | — | **None** before wrapper close | **No** post-tip contamination (contrast S3 L197) |
| **Wrapper close** | **L242** | **`</user_query>` present** before **L244** separator | **CLOSED** (**CF-S5-003**) — documented governance resolution |
| **Physical predecessor** | **`MED=S3` L160** | Prior owner block | **Matches** canonical **S3** |
| **Physical immediate successor** | **`MED=S6` L245** | Next normalized owner block | **Matches** canonical **S6** |
| **Canonical audit predecessor** | **S3** | Index §2 order | Formal audit on main (**provisional**) |
| **Canonical audit successor** | **S6** | Index §2 order | **Not** started or targeted |

**Bounded primary block:** **L201–L244** (clinical inventory **L210–L241** + expert tip; exclusions as marked).

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-S5-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=S5` **L201** · bounded **L210–L241** · wrapper **L203–L242** (close **present**) · line **1061** | Located · byte proof **pending** |
| **SRC-S5-OWNER-BCD** | **`QUARANTINED_NO_OWNER_MERGE`** | **B** L4423 · **C** L4860 · **D** L5101 (**e39c**) | Located · **not** owner-primary merge |
| **SRC-S5-MM1E-IDX** | Normalized index | jsonl **1061** / len **2832** (A) | Aligned mirror · metadata only |
| **SRC-S5-REG-V2** | Registry v2 | `medicines.v2.json` **S5** | **`DERIVED_UNVERIFIED`** |
| **SRC-S5-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-S5-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **S5** | **Derived-unverified mirror** |
| **SRC-S5-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S5 tier review |
| **SRC-S5-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S5 tier review |
| **SRC-S5-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S5 tier review |
| **SRC-S5-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone S5 tier review |
| **SRC-S5-LEGACY-DUMP** | Legacy stub | Expected dump path | **`SOURCE_NOT_FOUND`** — gap **OPEN** |
| **SRC-S5-DEV-API** | Dev/API/mock | Mixture B/C selectors, e39c route strings, AI prose | **`QUARANTINED_NO_OWNER_MERGE`** |
| **SRC-S5-CROSS-S3** | Prior merged S3 artifact | S3→S5 boundary context only | **Quarantined inventory** — **S3 artifact unchanged** |

**No derived tier may be merged into owner-primary clinical truth.**

**Unavailable-tier posture (MM2/MM2C/MM3/BOOK/OCR/UCKB):** **`NOT_LOCATED_IN_AVAILABLE_TREES — not substantively reviewed; no Rule 5 credit; no clinical authority; no owner merge`**.

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-S5-001** | `OWNER_PRIMARY_PROVISIONAL_019C_L201_SINGLE_HEADER_S3_PHYSICAL_CANONICAL_PREDECESSOR_S6_PHYSICAL_CANONICAL_SUCCESSOR_SLASS_L408_LATER_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-S5-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_S5_BLOCK_A_E39C_DUPLICATE_HEADERS_QUARANTINED` |
| **TGC-S5-003** | `IDENTITY_SCROFOLOSO_5_TISSUE_CONSTRUCTOR_LIVER_MUSCLE_MASTER_REGISTRY_POSITIVE_TEMPERAMENT_DERIVED_UNVERIFIED` |
| **TGC-S5-004** | `POTENCY_DILUTION_INVENTORY_ONLY_D1_D5_POSITIVE_D30_D200_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-S5-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_EXPERT_TIP_MIXTURE_BC_MANDATORY_REJECTED_FOR_ACTIVATION` |
| **TGC-S5-006** | `APPLICATION_ROUTE_AUTHORITY_NONE_OWNER_ROUTE_SILENT_BODYLOC_MARKER_METADATA_ONLY` |
| **TGC-S5-007** | `RULE6_COMBINATION_INVENTORY_ONLY_MIXTURE_B_C_DEV_FORMULA_HINTS_NO_RUNTIME_EDGE` |
| **TGC-S5-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-S5-009** | `DUPLICATE_MED_S5_HEADERS_B_C_D_E39C_QUARANTINED_NOT_CO_PRIMARY` |
| **TGC-S5-010** | `EARLY_SCROFOLOSO_WALK_S5_BEFORE_SLASS_L408_VS_INDEX_S_LASS_BEFORE_S1_OPEN_NOT_RUNTIME_ACTIVATION` |

**TGC-S5-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** S5 tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-S5-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No `EOD-S5` table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Scrofoloso-5 / tissue constructor / liver-muscle master; deep-acting structural repair framing
- Liver (advanced), bone/joint/connective tissue, glandular, pancreas/biliary clusters
- **Potency §4:** **D1–D5 Positive**, **D30–D200 Negative** — inventory only
- Keywords (**L238–L239**) — **non-operational**
- Expert tip **L240–L241:** mandatory **Mixture B/C** on structural/cirrhosis/glandular keywords — inventory only (**TGC-S5-005**, **TGC-S5-010**)

---

## 11. High-stakes source claims (inventory only)

Cirrhosis, hepatomegaly, abscess, arthritis/spondylosis, gout, sciatica, goiter, BPH, hernia, chronic ulcers/fistula, and tumor-language in potency framing are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure** authority
- No **efficacy** or **rapid result** authority
- No **standard-care substitution**
- No **potency/dosage authorization**
- No **route/electricity authority** (including **B/C/D** tablet/external/electricity tiers)
- No **disease mapping** or **116k activation**
- No **Mixture B/C** or **selector** activation authority
- No **Rule 6 combination** authority (inventory only)

---

## 12. Disease / Indication Mapping Status

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

---

## 13. Rule 4 / Rule 5 / Rule 6 posture

| Rule | Posture |
|------|---------|
| **Rule 4** | **NONE** in located S5 owner block **A**; dev/engine Rule strings — **quarantined** (**TGC-S5-002**) |
| **Rule 5 safety** | **`SOURCE_NOT_FOUND`** for S5-specific verified safety text; unavailable tiers **zero credit**; **`rule5SafetyCoverageComplete: false`** |
| **Rule 6** | Expert-tip **Mixture B/C** + dev mixture prose — **inventory only**; **no runtime relationship edge** (**TGC-S5-007**) |

**Clinical / safety / evidence:** **NO / NO / NONE**

---

## 14. Conflict register (`CF-S5`)

| ID | Status | Summary |
|----|--------|---------|
| **CF-S5-001** | **OPEN** | Canonical **S3→S5→S6** immediate chain **matches** physical **L160→L201→L245**; **global** **S-Lass-before-S1** vs **SLASS @ L408** geography **OPEN** |
| **CF-S5-002** | **OPEN** | Jsonl **1061** / len **2832** — byte proof **not verified** |
| **CF-S5-003** | **CLOSED** | Inner wrapper **`</user_query>` present L242** before separator **L244** — governance resolution (contrast missing-close pattern on S3) |
| **CF-S5-004** | **OPEN** | Owner §4 bands vs registry **POSITIVE** / `potency_logic` (**D30–D200** high band) |
| **CF-S5-005** | **OPEN** | Registry **`temperament_affinity`** vs owner §1–4 silence |
| **CF-S5-006** | **OPEN** | Owner label “औषधि संख्या **4**” vs audit sequence **29/38** — numbering tension (documentation) |
| **CF-S5-007** | **OPEN** | **S5 @ L201** hundreds of lines **before** **`MED=SLASS` L408** vs canonical index **S-Lass** placement before **S1** |
| **CF-S5-008** | **OPEN** | MM2/MM2C/MM3/BOOK/OCR/UCKB **not located** for S5 tier review |
| **CF-S5-009** | **OPEN** | **e39c** occurrences **B/C/D** (tablet/external/electricity) vs materia-only **A** boundary |
| **CF-S5-010** | **OPEN** | Expert tip **mandatory Mixture B/C** vs fail-closed activation posture (documentation tension) |
| **CF-S5-011** | **CLOSED** | Dev/mock/API/e39c/selectors/116k map strings — **activation rejected** (governance) |
| **CF-S5-012** | **CLOSED** | Cursor-save **L206–208**, §5 keywords **L238–239** — **excluded** from owner merge (governance exclusion only) |

**Mandatory CF summary:** CF: 001–002, 004–010 OPEN (9 entries) · 003, 011–012 CLOSED (3 entries; governance resolution/rejections/exclusions only)

---

## 15. Missing-evidence register (`ME-S5`)

| ID | Status | Summary |
|----|--------|---------|
| **ME-S5-001** | **OPEN** | Transcript bytes / jsonl **1061** / declared **2832** — **not verified** |
| **ME-S5-002** | **OPEN** | License / publication / redistribution provenance for primary text |
| **ME-S5-003** | **OPEN** | Owner-primary **Rule 5 safety** text for liver/structural/high-stakes indications |
| **ME-S5-004** | **OPEN** | Verified **route** / application evidence |
| **ME-S5-005** | **OPEN** | **Potency / dilution** ceilings vs registry normalization |
| **ME-S5-006** | **OPEN** | **Temperament** mapping (registry vs owner silence) |
| **ME-S5-007** | **OPEN** | **Rule 6** / Mixture B/C vs validated relationships |
| **ME-S5-008** | **OPEN** | High-stakes liver/structural claims vs standard care |
| **ME-S5-009** | **OPEN** | Registry / owner reconciliation (nickname, clusters, temperament field) |
| **ME-S5-010** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB bibliographic location — **not located** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 16. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | S5 (29/38) · header **`MED=S5`** |
| Canonical main SHA | `e1c9130040984ad1c7f15896b126d5964922137d` |
| Verdict | `S5_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · occurrence **A** @ **L201** · **B/C/D quarantined** |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-S5-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–002, 004–010 OPEN (9 entries) · 003, 011–012 CLOSED (3 entries; governance resolution/rejections/exclusions only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **S6** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **S5 blocked · MED=S5 provisional occurrence A · B/C/D e39c quarantined · S3 pred/S6 succ aligned · no S4 in 38-set · SLASS geography OPEN · wrapper close L242 CLOSED · no post-tip agent tail · expert tip Mixture B/C inventory only · MM2/MM2C/MM3/BOOK/UCKB not located · dev/mock quarantined · zero essential owner clinical decisions · no runtime authority**
