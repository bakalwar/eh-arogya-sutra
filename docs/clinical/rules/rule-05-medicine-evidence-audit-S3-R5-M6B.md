# Rule 5 — R5-M6B Medicine Evidence Audit: S3 (Scrofoloso-3)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 28 of 38 |
| **Medicine code** | S3 |
| **Authoritative normalized header** | **`MED=S3`** |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-10 |
| **Repository base (EHAS2)** | `99b6321e44a86b1a9b508756bcd3f89ae8c8c5d2` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `S3_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series single occurrence **A** @ **L160**) |

**Mandatory normalizer posture:** Canonical code **`S3`** maps to owner normalized header **`MED=S3`**. Owner display **SCROFOLOSO-3 (S3)** / “Skin Specialist” / “Muscular Remedy”. Registry mirror **Scrofoloso-3** — **`DERIVED_UNVERIFIED`**. **`^MED=S3`** header **count 1**; supplementary dev/API/mock strings are **`QUARANTINED_NO_OWNER_MERGE`** — **not** co-primary with occurrence **A**.

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Category** | **Scrofoloso** (exterior skin / muscle / integument framing) |
| **Canonical sequence** | **S2 → S3 → S5** (**no S4** in v2 38-set) |
| **Physical corpus order vs audit order** | **`MED=S2` L120 → `MED=S3` L160 → `MED=S5` L201** in normalized 019c walk — **immediate chain matches** canonical **S2→S3→S5**; **`MED=SLASS` L408** and canonical **S-Lass-before-S1** geography remain **OPEN** (**CF-S3-001**, **CF-S3-006**) |
| **Registry identity (S3 code in 38-set)** | **VERIFIED** — code `S3` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **POSITIVE** — metadata only; **not** owner §4 inline band verification |
| **Registry temperament field** | **`temperament_affinity`** present in v2 — **`DERIVED_UNVERIFIED`** vs owner block (temperament **silent** in bounded §1–4) |
| **Owner medicine number** | Owner-only metadata (**3** — SCROFOLOSO-3 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only) |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof (A)** | **PENDING** — jsonl line **1029** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length (A)** | **2685** — **OPEN** |
| **S3 inner wrapper (occurrence A)** | **`text` L162** · **`<user_query>` opens L163** · **closing `</user_query>` absent** before separator **L200** — **OPEN** (**CF-S3-003**) |
| **Physical predecessor** | **`MED=S2` L120** — **matches** canonical audit predecessor **S2** |
| **Physical immediate successor** | **`MED=S5` L201** — **matches** canonical audit successor **S5** |
| **Canonical audit predecessor** | **S2** — merged formal audit on main (**provisional** occurrence A) |
| **Canonical audit successor** | **S5** — **not** started or targeted |
| **Prior S2 artifact** | Merged **S2** artifact documents physical successor **`MED=S3` L160** — **aligned**; **S2 artifact unchanged** by this PR |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **S3** (`MED=S3`). It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate S3, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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

## 4. S3 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L160) | Notes |
|-------|------------------------|----------------------------------------|--------|
| **Code** | S3 | S3 (`MED=S3`) | 38-set identity **VERIFIED** |
| **Display name** | Scrofoloso-3 | **S3 (Scrofoloso-3)** / Skin Specialist / Muscular Remedy | Registry nickname aligned — **inventory only** |
| **Group** | Scrofoloso | Scrofoloso | Label-level alignment |
| **Polarity field** | POSITIVE | §4 **D1–D5 Positive**, **D10–D200 Negative** | **Inventory only** (**TGC-S3-004**, **CF-S3-005**); **not** dosage authority |

---

## 5. All `MED=S3` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L160** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1029** | **2685** | potency | **`PROVISIONAL_OWNER_PRIMARY`** — normalized owner-session materia master |

**Pattern search:** **`^MED=S3`** → **count 1** (entire normalized corpus file).

**No occurrence B header** located. Developer/API/mock **S3** strings (selector **SKIN→S3**, medicine lists, **C3+S3** combo hints, AI prose) are **rejected** as S3 owner materia authority — **`QUARANTINED_NO_OWNER_MERGE`** (**CF-S3-011**, **TGC-S3-009**).

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **Separator before header** | **L159** | Block boundary (`====`) | Boundary only |
| **`MED=S3` header** | **L160** | Transcript pointer (1029 / 2685) | **Authoritative** metadata line |
| **Label** | **L162** | `text` | Boundary only |
| **Inner wrapper open** | **L163** | `<user_query>` | Boundary only |
| **Meta / Cursor save** | **L164–L166** | Intro + developer persistence + owner med #3 label | **Excluded** — non-clinical (**CF-S3-012**) |
| **§1 philosophy** | **L168–L169** | Exterior skin/muscle repair and purification | **Provisional inventory only** |
| **§2 affinity** | **L170–L174** | Skin, muscles, periosteum, hair/nails | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L175–L189** | Skin, muscular, integumentary clusters | **Provisional inventory only** |
| **§4 potency** | **L190–L192** | D1–D5 Positive; D10–D200 Negative | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L193–L194** | Keyword workflow label | **Excluded** — non-operational (**CF-S3-012**) |
| **Expert tip (clinical inventory boundary)** | **L195–L196** | Mandatory **priority** for Skin/Hair/Nails/Muscular Pain keywords; construction/cleaning wording | **Provisional inventory only** (**TGC-S3-005**, **TGC-S3-007**) — **not** selector activation |
| **Post-tip agent tail** | **L197** | Temperament-mapping workflow contamination (`ab ese bhi dekho… temperament…`) | **OPEN finding** (**CF-S3-004**) · **Excluded** from owner merge (**CF-S3-012** CLOSED governance) — **not** a contradiction |
| **Wrapper close** | — | **`</user_query>` absent** before **L200** separator | **OPEN** (**CF-S3-003**) — **no silent repair** |
| **Physical predecessor** | **`MED=S2` L120** | Prior owner block | **Matches** canonical **S2** |
| **Physical immediate successor** | **`MED=S5` L201** | Next normalized owner block | **Matches** canonical **S5** |
| **Canonical audit predecessor** | **S2** | Index §2 order | Formal audit on main (**provisional**) |
| **Canonical audit successor** | **S5** | Index §2 order | **Not** started or targeted |

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-S3-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=S3` **L160** · bounded **L168–L192** + expert tip **L195–L196** (tail **L197** excluded) · wrapper **L162–L199** (close **OPEN**) · line **1029** | Located · byte proof **pending** |
| **SRC-S3-MM1E-IDX** | Normalized index | jsonl **1029** / len **2685** (A) | Aligned mirror · metadata only |
| **SRC-S3-REG-V2** | Registry v2 | `medicines.v2.json` **S3** | **`DERIVED_UNVERIFIED`** |
| **SRC-S3-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-S3-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **S3** | **Derived-unverified mirror** |
| **SRC-S3-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S3 tier review |
| **SRC-S3-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S3 tier review |
| **SRC-S3-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S3 tier review |
| **SRC-S3-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone S3 tier review |
| **SRC-S3-LEGACY-DUMP** | Legacy stub | Expected dump path | **`SOURCE_NOT_FOUND`** — gap **OPEN** |
| **SRC-S3-DEV-API** | Dev/API/mock | Selectors, C3+S3 hints, AI prose | **`QUARANTINED_NO_OWNER_MERGE`** |
| **SRC-S3-CROSS-S2** | Prior merged S2 artifact | S2→S3 boundary context only | **Quarantined inventory** — **S2 artifact unchanged** |

**No derived tier may be merged into owner-primary clinical truth.**

**Unavailable-tier posture (MM2/MM2C/MM3/BOOK/OCR/UCKB):** **`NOT_LOCATED_IN_AVAILABLE_TREES — not substantively reviewed; no Rule 5 credit; no clinical authority; no owner merge`**.

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-S3-001** | `OWNER_PRIMARY_PROVISIONAL_019C_L160_SINGLE_HEADER_S2_PHYSICAL_CANONICAL_PREDECESSOR_S5_PHYSICAL_CANONICAL_SUCCESSOR_SLASS_L408_LATER_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-S3-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_S3_BLOCK_A_DEV_SELECTOR_C3_COMBO_STRINGS_QUARANTINED` |
| **TGC-S3-003** | `IDENTITY_SCROFOLOSO_3_SKIN_MUSCULAR_REGISTRY_POSITIVE_TEMPERAMENT_DERIVED_UNVERIFIED` |
| **TGC-S3-004** | `POTENCY_DILUTION_INVENTORY_ONLY_D1_D5_POSITIVE_D10_D200_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-S3-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_EXPERT_TIP_MANDATORY_PRIORITY_REJECTED_FOR_ACTIVATION` |
| **TGC-S3-006** | `APPLICATION_ROUTE_AUTHORITY_NONE_OWNER_ROUTE_SILENT` |
| **TGC-S3-007** | `RULE6_COMBINATION_INVENTORY_ONLY_C3_S3_DEV_FORMULA_HINTS_NO_RUNTIME_EDGE` |
| **TGC-S3-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-S3-009** | `NO_DUPLICATE_MED_S3_HEADER_DEV_TIER_S3_STRINGS_QUARANTINED_NOT_CO_PRIMARY` |
| **TGC-S3-010** | `EARLY_SCROFOLOSO_WALK_S3_BEFORE_SLASS_L408_VS_INDEX_S_LASS_BEFORE_S1_OPEN_NOT_RUNTIME_ACTIVATION` |

**TGC-S3-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** S3 tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-S3-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No `EOD-S3` table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Scrofoloso-3 / skin specialist / muscular remedy; exterior tissue repair framing
- Skin, sweat glands/pores, muscles, periosteum, hair/nails clusters
- **Potency §4:** **D1–D5 Positive**, **D10–D200 Negative** — inventory only
- Keywords (**L193–L194**) — **non-operational**
- Expert tip **L195–L196:** mandatory **priority** on Skin/Hair/Nails/Muscular Pain — inventory only (**TGC-S3-005**, **TGC-S3-010**)

---

## 11. High-stakes source claims (inventory only)

Eczema, psoriasis, vitiligo (early), myalgia, infectious skin disease, and related support language are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure** authority
- No **efficacy** or **rapid result** authority
- No **standard-care substitution**
- No **potency/dosage authorization**
- No **route/electricity authority**
- No **disease mapping** or **116k activation**
- No **keyword/priority selector** activation authority
- No **selector** or **runtime** activation
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
| **Rule 4** | **NONE** in located S3 owner block **A**; dev/engine Rule strings — **quarantined** (**TGC-S3-002**) |
| **Rule 5 safety** | **`SOURCE_NOT_FOUND`** for S3-specific verified safety text; unavailable tiers **zero credit**; **`rule5SafetyCoverageComplete: false`** |
| **Rule 6** | Expert-tip mandatory priority + dev **C3+S3** / selector strings — **inventory only**; **no runtime relationship edge** (**TGC-S3-007**) |

**Clinical / safety / evidence:** **NO / NO / NONE**

---

## 14. Conflict register (`CF-S3`)

| ID | Status | Summary |
|----|--------|---------|
| **CF-S3-001** | **OPEN** | Canonical **S2→S3→S5** immediate chain **matches** physical **L120→L160→L201**; **global** **S-Lass-before-S1** vs **SLASS @ L408** geography **OPEN** |
| **CF-S3-002** | **OPEN** | Jsonl **1029** / len **2685** — byte proof **not verified** |
| **CF-S3-003** | **OPEN** | Wrapper **`</user_query>`** absent before separator **L200** |
| **CF-S3-004** | **OPEN** | **Post-tip agent tail** contamination on **L197** (existence finding) |
| **CF-S3-005** | **OPEN** | Owner §4 bands vs registry **POSITIVE** / `potency_logic`; registry **`temperament_affinity`** vs owner §1–4 silence |
| **CF-S3-006** | **OPEN** | **S3 @ L160** hundreds of lines **before** **`MED=SLASS` L408** vs canonical index **S-Lass** placement before **S1** |
| **CF-S3-007** | **OPEN** | Owner label “औषधि संख्या **3**” vs audit sequence **28/38** — numbering tension (documentation) |
| **CF-S3-008** | **OPEN** | MM2/MM2C/MM3/BOOK/OCR/UCKB **not located** for S3 tier review |
| **CF-S3-009** | **OPEN** | Dev-tier **SKIN→S3** / AI selector prose vs materia-only **A** boundary |
| **CF-S3-010** | **OPEN** | Expert tip **mandatory priority** / “अनिवार्य” vs fail-closed activation posture (documentation tension) |
| **CF-S3-011** | **CLOSED** | Dev/mock/API/selectors/116k map strings — **activation rejected** (governance) |
| **CF-S3-012** | **CLOSED** | Cursor-save **L165–166**, §5 keywords **L193–L194**, agent-tail **L197** content **excluded** from owner merge (governance exclusion only) |

**Mandatory CF summary:** CF: 001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections/exclusions only)

---

## 15. Missing-evidence register (`ME-S3`)

| ID | Status | Summary |
|----|--------|---------|
| **ME-S3-001** | **OPEN** | Transcript bytes / jsonl **1029** / declared **2685** — **not verified** |
| **ME-S3-002** | **OPEN** | License / publication / redistribution provenance for primary text |
| **ME-S3-003** | **OPEN** | Owner-primary **Rule 5 safety** text for dermatologic/muscular/high-stakes indications |
| **ME-S3-004** | **OPEN** | Verified **route** / application evidence |
| **ME-S3-005** | **OPEN** | **Potency / dilution** ceilings vs registry normalization |
| **ME-S3-006** | **OPEN** | **Temperament** mapping (registry vs owner; tail quarantined) |
| **ME-S3-007** | **OPEN** | **Rule 6** / C3+S3 / mandatory-priority tip vs validated relationships |
| **ME-S3-008** | **OPEN** | High-stakes skin/muscle claims vs standard care |
| **ME-S3-009** | **OPEN** | Registry / owner reconciliation (nickname, clusters, temperament field) |
| **ME-S3-010** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB bibliographic location — **not located** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 16. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | S3 (28/38) · header **`MED=S3`** |
| Canonical main SHA | `99b6321e44a86b1a9b508756bcd3f89ae8c8c5d2` |
| Verdict | `S3_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · single occurrence **A** @ **L160** |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-S3-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections/exclusions only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **S5** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **S3 blocked · MED=S3 provisional single occurrence A · S2 pred/S5 succ aligned · no S4 in 38-set · SLASS geography OPEN · missing wrapper close OPEN · agent tail L197 OPEN/excluded · expert tip inventory only · MM2/MM2C/MM3/BOOK/UCKB not located · dev/mock quarantined · zero essential owner clinical decisions · no runtime authority**
