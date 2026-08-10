# Rule 5 — R5-M6B Medicine Evidence Audit: Ven1 (Venereo-1)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 34 of 38 |
| **Medicine code** | Ven1 |
| **Authoritative normalized header** | **`MED=VEN1`** |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-10 |
| **Repository base (EHAS2)** | `915df8d77d6dd214ea8821ae60c672dde34a50f2` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `VEN1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series occurrence **A** @ **L1252** — sole materia owner-primary) |

**Mandatory normalizer posture:** Canonical index/registry code **`Ven1`** maps to owner normalized header **`MED=VEN1`**. Owner display **Ven1 (Venereos-1)** / VENEREOS-1 / “शरीर का शोधक योद्धा”. Registry mirror **Venereo-1** — **`DERIVED_UNVERIFIED`**. **`^MED=VEN1`** header **count 2** (entire normalized corpus file); occurrence **B** and supplementary dev/API/mock/formula strings are **`QUARANTINED_NO_OWNER_MERGE`** — **not** co-primary with occurrence **A**. **Do not fabricate** `MED=Ven1` or alternate headers.

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Category** | **Venereo** (deep infection / morbid-matter purifier framing) |
| **Canonical sequence** | **S12 → Ven1 → Ver1** (**no S7–S9** in v2 38-set) |
| **Physical corpus order vs audit order** | **`MED=F2` L1210 → `MED=VEN1` L1252 → `MED=VER1` L1295** in normalized 019c walk — **physical immediate successor Ver1 aligned**; **canonical predecessor S12** vs **physical immediate predecessor F2 L1210** — **OPEN** (**CF-VEN1-001**); **S12→Ven1** geography vs **SLASS @ L408** — **OPEN** (**CF-VEN1-010**) |
| **Registry identity (Ven1 code in 38-set)** | **VERIFIED** — code `Ven1` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **NEUTRAL** — metadata only; **not** owner §4 inline band verification |
| **Registry temperament / combo tips** | **`temperament_affinity`** (C5+Ven1+L1; S11+Ven1 leucorrhoea) — **`DERIVED_UNVERIFIED`** |
| **Owner medicine number** | Owner-only metadata (**30** — VENEREOS-1 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only; **B** quarantined) |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof (A)** | **PENDING** — jsonl line **1630** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length (A)** | **2910** — **OPEN** |
| **Ven1 inner wrapper (occurrence A)** | **`text` L1254** · **`<user_query>` opens L1255** · **closing `</user_query>` present L1292** before separator **L1294** / **`MED=VER1` L1295** — **CLOSED** (**CF-VEN1-003**) |
| **Physical predecessor** | **`MED=F2` L1210** — **does not match** canonical audit predecessor **S12** (**S12 @ L367** non-immediate) |
| **Physical immediate successor** | **`MED=VER1` L1295** — **matches** canonical audit successor **Ver1** (boundary proof only; **Ver1 corpus not audited**) |
| **Canonical audit predecessor** | **S12** — merged formal audit on main (**provisional** occurrence A) |
| **Canonical audit successor** | **Ver1** — **not** started or targeted |
| **Prior S12 artifact** | Merged **S12** artifact documents canonical successor **`MED=VEN1` L1252** — **boundary context**; **S12 artifact unchanged** by this PR |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **Ven1** (`MED=VEN1`). It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate Ven1, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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
| `routeAuthorized` | `false` |
| `potencyAuthorized` | `false` |
| `dosageAuthorized` | `false` |
| `electricityAuthorized` | `false` |
| `evidenceActivated` | `false` |
| `rule6MedicineRelationshipAuthority` | `NONE` |
| `runtimeAuthorized` | `false` |
| Mapping flags (all) | **`false`** |

**Route note:** Bounded owner **§1–§4 (L1260–L1286)** does **not** locate administration-route wording (topical/oral/eye-drop/**आंतरिक**). Organ “depth” and affinity language are **not** route authority. Quarantined Golden Concept **“Each oral mixture”** (L1652) is **not** attributed to Ven1 owner §1–§4.

---

## 4. Ven1 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L1252) | Notes |
|-------|------------------------|----------------------------------------|--------|
| **Code** | Ven1 | Ven1 (`MED=VEN1`) | 38-set identity **VERIFIED** |
| **Display name** | Venereo-1 | **Ven1 (Venereos-1)** / VENEREOS-1 | **Venereos** vs **Venereo** spelling **OPEN** (**TGC-VEN1-003**, **CF-VEN1-008**) |
| **Group** | Venereo | Venereo / infection–malignancy framing | Label-level alignment |
| **Route wording** | (no verified route field) | **Administration route wording not located** in bounded §1–§4 | **`APPLICATION_ROUTE_AUTHORITY_NONE`** (**TGC-VEN1-006**, **ME-VEN1-004**) |
| **Polarity field** | NEUTRAL | §4 **D1–D5 Positive/NEUTRAL**, **D10–D500 Negative** | **Inventory only** (**TGC-VEN1-004**, **CF-VEN1-008**); **not** dosage authority |

---

## 5. All `MED=VEN1` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L1252** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1630** | **2910** | potency, bodyloc | **`PROVISIONAL_OWNER_PRIMARY`** — normalized owner-session materia master (sole materia co-primary) |
| **B** | **L1656** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **2445** | **1915** | (none) | **`QUARANTINED_NO_OWNER_MERGE`** — English dev/API unified-pipeline fix (`eh-api`, ICD/formula); **not** Ven1 materia |

**Pattern search:** **`^MED=VEN1`** → **count 2** (entire normalized corpus file). **019c materia walk (F-chain):** **count 1** authoritative materia header (**A** only).

**Occurrence B** is **rejected** as Ven1 owner materia co-primary — **`QUARANTINED_NO_OWNER_MERGE`** (**CF-VEN1-007**, **CF-VEN1-011**, **TGC-VEN1-009**). **No silent A/B merge.**

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **Separator before header** | **L1251** | Block boundary (`====`) | Boundary only |
| **`MED=VEN1` header** | **L1252** | Transcript pointer (1630 / 2910) | **Authoritative** metadata line |
| **Label** | **L1254** | `text` | Boundary only |
| **Inner wrapper open** | **L1255** | `<user_query>` | Boundary only |
| **Meta / Cursor save** | **L1256–L1258** | Intro + developer persistence + owner med #30 label | **Excluded** — non-clinical (**CF-VEN1-012**) |
| **§1 philosophy** | **L1260–L1261** | Morbid matter, immunity, reproductive/gland depth **wording** | **Provisional inventory only** — **not** route evidence |
| **§2 affinity** | **L1262–L1266** | Reproductive organs, glands, deep skin, blood/lymph | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L1267–L1283** | Cancer, PCOD, leucorrhoea, gonorrhea/syphilis, UTI, fistula, leprosy, skin, worms vs Ver1 mention | **Provisional inventory only** (**high-stakes inventory only**) |
| **§4 potency** | **L1284–L1286** | D1–D3 / D5 Positive/NEUTRAL; D10–D500 Negative | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L1287–L1288** | Keyword workflow label | **Excluded** — non-operational (**CF-VEN1-012**) |
| **Expert tip (clinical inventory boundary)** | **L1289–L1290** | Mandatory inclusion; **C5 + Ven1 + L1** triangle | **Provisional inventory only** (**TGC-VEN1-005**, **TGC-VEN1-007**) — **not** selector activation |
| **Post-tip agent tail** | — | **None** before wrapper close (**L1292**) | **No** post-tip contamination |
| **Wrapper close** | **L1292** | **`</user_query>` present** before **`MED=VER1` L1295** | **CLOSED** (**CF-VEN1-003**) |
| **Physical predecessor** | **`MED=F2` L1210** | Prior owner block | **Mismatch** vs canonical **S12** (**CF-VEN1-001**) |
| **Physical immediate successor** | **`MED=VER1` L1295** | Next normalized owner block | **Matches** canonical **Ver1** (boundary only) |
| **Canonical audit predecessor** | **S12** | Index §2 order | Formal audit on main (**provisional**) |
| **Canonical audit successor** | **Ver1** | Index §2 order | **Not** started or targeted |

**Bounded primary block:** **L1252–L1294** (clinical inventory **L1260–L1290**; exclusions as marked).

---

## 7. Occurrence B — quarantined boundary (not owner-primary)

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **`MED=VEN1` header (B)** | **L1656** | Transcript pointer (2445 / 1915) | **Quarantined** — dev tier only |
| **Inner wrapper** | **L1659–L1701** | English EH API unified pipeline specification | **`QUARANTINED_NO_OWNER_MERGE`** |
| **Next separator / header** | **L1704** | **`MED=APP`** | Boundary only |

**No §1–§5 owner materia.** **Not** merged with occurrence **A**.

---

## 8. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-VEN1-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=VEN1` **L1252** · bounded **L1260–L1290** · wrapper **L1254–L1292** (close **present**) · line **1630** | Located · byte proof **pending** |
| **SRC-VEN1-OWNER-B** | **`QUARANTINED_NO_OWNER_MERGE`** | **B** L1656 (dev/API block) | Located · **not** owner-primary merge |
| **SRC-VEN1-MM1E-IDX** | Normalized index | jsonl **1630** / len **2910** (A) | Aligned mirror · metadata only |
| **SRC-VEN1-REG-V2** | Registry v2 | `medicines.v2.json` **Ven1** | **`DERIVED_UNVERIFIED`** |
| **SRC-VEN1-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-VEN1-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **Ven1** | **Derived-unverified mirror** |
| **SRC-VEN1-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive Ven1 tier review |
| **SRC-VEN1-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive Ven1 tier review |
| **SRC-VEN1-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive Ven1 tier review |
| **SRC-VEN1-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone Ven1 tier review |
| **SRC-VEN1-LEGACY-DUMP** | Legacy stub | Expected dump path | **`SOURCE_NOT_FOUND`** — gap **OPEN** |
| **SRC-VEN1-DEV-API** | Dev/API/mock | Formula maps, Golden Concept L1652, prescribe examples | **`QUARANTINED_NO_OWNER_MERGE`** |
| **SRC-VEN1-CROSS-S12** | Prior merged S12 artifact | S12→Ven1 boundary context only | **Quarantined inventory** — **S12 artifact unchanged** |
| **SRC-VEN1-VER1-BOUNDARY** | Successor boundary only | **`MED=VER1` L1295** | **Not audited** — **no Ver1 corpus review** |

**No derived tier may be merged into owner-primary clinical truth.**

**Unavailable-tier posture (MM2/MM2C/MM3/BOOK/OCR/UCKB):** **`NOT_LOCATED_IN_AVAILABLE_TREES — not substantively reviewed; no Rule 5 credit; no clinical authority; no owner merge`**.

---

## 9. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-VEN1-001** | `OWNER_PRIMARY_PROVISIONAL_019C_L1252_SINGLE_MATERIA_HEADER_S12_CANONICAL_PREDECESSOR_F2_L1210_PHYSICAL_IMMEDIATE_VER1_L1295_PHYSICAL_SUCCESSOR_ALIGNED_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-VEN1-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_BLOCK_A_DEV_API_FORMULA_116K_STRINGS_QUARANTINED` |
| **TGC-VEN1-003** | `IDENTITY_VENEREO_1_VEN1_VENEREOS_SPELLING_REGISTRY_VENEREO_1_DERIVED_UNVERIFIED` |
| **TGC-VEN1-004** | `POTENCY_DILUTION_INVENTORY_ONLY_D1_D5_POSITIVE_NEUTRAL_D10_D500_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-VEN1-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_EXPERT_TIP_MANDATORY_INCLUSION_REJECTED_FOR_ACTIVATION` |
| **TGC-VEN1-006** | `OWNER_ADMIN_ROUTE_WORDING_NOT_LOCATED_IN_BOUNDED_S1_S4_APPLICATION_ROUTE_AUTHORITY_NONE_NOT_VERIFIED_ROUTE_EVIDENCE` |
| **TGC-VEN1-007** | `RULE6_COMBINATION_INVENTORY_ONLY_C5_VEN1_L1_TRIANGLE_S11_VEN1_REGISTRY_TIP_NO_RUNTIME_EDGE` |
| **TGC-VEN1-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-VEN1-009** | `DUPLICATE_MED_VEN1_HEADER_B_L1656_DEV_TIER_QUARANTINED_NOT_CO_PRIMARY` |
| **TGC-VEN1-010** | `PHYSICAL_F_CHAIN_VEN1_L1252_VS_CANONICAL_S12_PRED_AND_SLASS_L408_GEOGRAPHY_OPEN_NOT_RUNTIME_ACTIVATION` |

**TGC-VEN1-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** Ven1 tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-VEN1-001–010** recorded **separately** (count **10**).

---

## 10. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No `EOD-VEN1` table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 11. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Venereo-1 / morbid-matter purifier / reproductive–gland deep cleanse framing
- Cancer, tumor/fibroid/PCOD/cyst, leucorrhoea, gonorrhea/syphilis, UTI, fistula, leprosy, chronic eczema/psoriasis, worms (vs Ver1 mention), alopecia with infection **wording**
- **Potency §4:** low **Positive/NEUTRAL** vs high **Negative** bands — inventory only
- Keywords (**L1287–L1288**) — **non-operational**
- Expert tip **L1289–L1290:** mandatory inclusion + **C5+Ven1+L1** triangle — inventory only (**TGC-VEN1-005**, **TGC-VEN1-007**)

**High-stakes malignancy / venereal / leprosy language** in §1/§3 — **inventory only**; **no** clinical authority.

---

## 12. High-stakes source claims (inventory only)

Cancer, gonorrhea, syphilis, leprosy, PCOD/fibroid, and anti-malignancy keyword labels are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure** authority
- No **efficacy** authority
- No **standard-care substitution**
- No **potency/dosage authorization**
- No **verified route/application authority** (admin route wording **not located** in bounded §1–§4)
- No **disease mapping** or **116k activation**
- No **keyword/mandatory selector** activation authority
- No **Rule 6 combination** authority (inventory only)

---

## 13. Disease / Indication Mapping Status

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

---

## 14. Rule 4 / Rule 5 / Rule 6 posture

| Rule | Posture |
|------|---------|
| **Rule 4** | **NONE** in located Ven1 owner block **A**; dev/engine Rule strings — **quarantined** (**TGC-VEN1-002**) |
| **Rule 5 safety** | **`SOURCE_NOT_FOUND`** for Ven1-specific verified safety text; unavailable tiers **zero credit**; **`rule5SafetyCoverageComplete: false`** |
| **Rule 6** | Expert-tip **C5+Ven1+L1** + registry combo tips + dev formula strings — **inventory only**; **no runtime relationship edge** (**TGC-VEN1-007**) |

**Clinical / safety / evidence:** **NO / NO / NONE**

---

## 15. Conflict register (`CF-VEN1`)

| ID | Status | Summary |
|----|--------|---------|
| **CF-VEN1-001** | **OPEN** | **S12→Ven1→Ver1** canonical chain vs physical **F2→VEN1→VER1**; **S12 @ L367** not immediate predecessor |
| **CF-VEN1-002** | **OPEN** | Jsonl **1630** / len **2910** — byte proof **not verified** |
| **CF-VEN1-003** | **CLOSED** | Wrapper **`</user_query>` present L1292** before **`MED=VER1` L1295** |
| **CF-VEN1-004** | **OPEN** | Expert tip **mandatory inclusion** vs fail-closed activation |
| **CF-VEN1-005** | **OPEN** | Expert tip **C5+Ven1+L1** combination language vs Rule 6 **none** |
| **CF-VEN1-006** | **OPEN** | Owner label “औषधि संख्या **30**” vs audit sequence **34/38** — numbering tension (documentation) |
| **CF-VEN1-007** | **OPEN** | **Two** exact **`^MED=VEN1`** headers — **A** materia vs **B** dev tier (**different tiers**; **no silent merge**) |
| **CF-VEN1-008** | **OPEN** | Owner §4 Positive/Negative bands vs registry **`polarity: NEUTRAL`** / `potency_logic` |
| **CF-VEN1-009** | **OPEN** | High-stakes **cancer / venereal / leprosy** language vs standard care (documentation tension) |
| **CF-VEN1-010** | **OPEN** | **Ven1 @ L1252** late F-chain vs **SLASS @ L408** / global **S-Lass-before-S1** geography |
| **CF-VEN1-011** | **CLOSED** | Occurrence **B** / dev/API/formula **Ven1** strings — **activation rejected** (governance) |
| **CF-VEN1-012** | **CLOSED** | Cursor-save **L1257–1258**, §5 keywords **L1287–1288** — **excluded** from owner merge (governance exclusion only) |

**Mandatory CF summary:** CF: 001–002, 004–010 OPEN (9 entries) · 003, 011–012 CLOSED (3 entries; governance rejections/exclusions only)

---

## 16. Missing-evidence register (`ME-VEN1`)

| ID | Status | Summary |
|----|--------|---------|
| **ME-VEN1-001** | **OPEN** | Transcript bytes / jsonl **1630** / declared **2910** — **not verified** |
| **ME-VEN1-002** | **OPEN** | License / publication / redistribution provenance for primary text |
| **ME-VEN1-003** | **OPEN** | Owner-primary **Rule 5 safety** text for cancer/venereal/leprosy high-stakes **wording** |
| **ME-VEN1-004** | **OPEN** | Verified **route / application** evidence (admin route wording **not located** in bounded §1–§4) |
| **ME-VEN1-005** | **OPEN** | **Potency / dilution** ceilings vs registry normalization |
| **ME-VEN1-006** | **OPEN** | **Rule 6** — **C5+Ven1+L1** tip vs validated relationship edges |
| **ME-VEN1-007** | **OPEN** | Duplicate header **B** provenance / dedup governance |
| **ME-VEN1-008** | **OPEN** | High-stakes malignancy/infection claims vs standard care |
| **ME-VEN1-009** | **OPEN** | Registry / owner reconciliation (nickname, clusters, **Venereos** vs **Venereo**, temperament tips) |
| **ME-VEN1-010** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB bibliographic location — **not located** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 17. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | Ven1 (34/38) · header **`MED=VEN1`** |
| Canonical main SHA | `915df8d77d6dd214ea8821ae60c672dde34a50f2` |
| Verdict | `VEN1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · occurrence **A** @ **L1252** · **B quarantined** |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-VEN1-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route | Owner admin route wording **not located** in bounded §1–§4 · **`APPLICATION_ROUTE_AUTHORITY_NONE`** · **`routeAuthorized: false`** |
| Potency / dosage / electricity / Rule 6 / runtime | **false / false / false / NONE / false** |
| CF | **001–002, 004–010 OPEN (9 entries) · 003, 011–012 CLOSED (3 entries; governance rejections/exclusions only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **Ver1** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **Ven1 blocked · MED=VEN1 provisional single materia A · duplicate header B quarantined · F2 physical pred / S12 canonical pred OPEN · Ver1 physical succ aligned · wrapper close L1292 CLOSED · no post-tip agent tail · mandatory tip + C5+VEN1+L1 inventory only · high-stakes cancer/venereal/leprosy inventory only · owner admin route wording not located in bounded §1–§4 · MM2/MM2C/MM3/BOOK/UCKB not located · dev/API quarantined · zero essential owner clinical decisions · no runtime authority**
