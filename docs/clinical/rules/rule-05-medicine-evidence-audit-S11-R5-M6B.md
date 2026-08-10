# Rule 5 — R5-M6B Medicine Evidence Audit: S11 (Scrofoloso-11)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 32 of 38 |
| **Medicine code** | S11 |
| **Authoritative normalized header** | **`MED=S11`** |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-10 |
| **Repository base (EHAS2)** | `3cac4c554bbf809168135ac4e6122f2e09008c40` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `S11_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series single occurrence **A** @ **L328**) |

**Mandatory normalizer posture:** Canonical code **`S11`** maps to owner normalized header **`MED=S11`**. Owner display **SCROFOLOSO-11 (S11)** / Gynecology Specialist / Anti-Emetic / “स्त्री रोग विशेषज्ञ”. Registry mirror **Scrofoloso-11** — **`DERIVED_UNVERIFIED`**. **`^MED=S11`** header **count 1** (entire normalized corpus file); supplementary dev/API/mock/formula strings are **`QUARANTINED_NO_OWNER_MERGE`** — **not** co-primary with occurrence **A**.

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Category** | **Scrofoloso** (gynecology / equilibrium / anti-emetic framing) |
| **Canonical sequence** | **S10 → S11 → S12** (**no S7–S9** in v2 38-set) |
| **Physical corpus order vs audit order** | **`MED=S10` L288 → `MED=S11` L328 → `MED=S12` L367** in normalized 019c walk — **immediate chain matches** canonical **S10→S11→S12**; **`MED=SLASS` L408** and canonical **S-Lass-before-S1** geography remain **OPEN** (**CF-S11-001**, **CF-S11-010**) |
| **Registry identity (S11 code in 38-set)** | **VERIFIED** — code `S11` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **POSITIVE** — metadata only; **not** owner §4 inline band verification |
| **Registry temperament field** | **`temperament_affinity`** present in v2 (incl. **BE/WE** motion-sickness pairing on expert tip) — **`DERIVED_UNVERIFIED`** vs owner block (temperament **silent** in bounded §1–4) |
| **Owner medicine number** | Owner-only metadata (**7** — SCROFOLOSO-11 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only) |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof (A)** | **PENDING** — jsonl line **1155** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length (A)** | **2771** — **OPEN** |
| **S11 inner wrapper (occurrence A)** | **`text` L330** · **`<user_query>` opens L331** · **closing `</user_query>` present L364** before separator **L366** — **CLOSED** (**CF-S11-003**) |
| **Physical predecessor** | **`MED=S10` L288** — **matches** canonical audit predecessor **S10** |
| **Physical immediate successor** | **`MED=S12` L367** — **matches** canonical audit successor **S12** |
| **Canonical audit predecessor** | **S10** — merged formal audit on main (**provisional** occurrence A) |
| **Canonical audit successor** | **S12** — **not** started or targeted |
| **Prior S10 artifact** | Merged **S10** artifact documents physical successor **`MED=S11` L328** — **aligned**; **S10 artifact unchanged** by this PR |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **S11** (`MED=S11`). It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate S11, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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

## 4. S11 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L328) | Notes |
|-------|------------------------|----------------------------------------|--------|
| **Code** | S11 | S11 (`MED=S11`) | 38-set identity **VERIFIED** |
| **Display name** | Scrofoloso-11 | **S11 (Scrofoloso-11)** / Gynecology Specialist / Anti-Emetic | Registry nickname aligned — **inventory only** |
| **Group** | Scrofoloso | Scrofoloso | Label-level alignment |
| **Polarity field** | POSITIVE | §4 **D1–D5 Positive**, **D30–D200 Negative** | **Inventory only** (**TGC-S11-004**, **CF-S11-008**); **not** dosage authority |

---

## 5. All `MED=S11` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L328** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1155** | **2771** | potency | **`PROVISIONAL_OWNER_PRIMARY`** — normalized owner-session materia master |

**Pattern search:** **`^MED=S11`** → **count 1** (entire normalized corpus file).

**No occurrence B header** located. Developer/API/mock **S11** / formula / selector strings elsewhere in corpus are **rejected** as S11 owner materia authority — **`QUARANTINED_NO_OWNER_MERGE`** (**CF-S11-011**, **TGC-S11-009**).

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **Separator before header** | **L327** | Block boundary (`====`) | Boundary only |
| **`MED=S11` header** | **L328** | Transcript pointer (1155 / 2771) | **Authoritative** metadata line |
| **Label** | **L330** | `text` | Boundary only |
| **Inner wrapper open** | **L331** | `<user_query>` | Boundary only |
| **Blank after open** | **L332** | Empty line inside wrapper | Boundary only |
| **Meta / Cursor save** | **L334–L335** | Intro + developer persistence + owner med #7 label | **Excluded** — non-clinical (**CF-S11-012**) |
| **§1 philosophy** | **L337–L338** | Dual gynecology + cerebellar anti-emetic; pregnancy framing | **Provisional inventory only** (**high-stakes inventory only**) |
| **§2 affinity** | **L339–L343** | Uterus/ovaries, cerebellum, gastric/vagus nausea, pelvis | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L344–L356** | Gynecology, pregnancy, motion sickness/vertigo clusters | **Provisional inventory only** |
| **§4 potency** | **L357–L359** | D1–D5 Positive; D30–D200 Negative | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L360–L361** | Keyword workflow label | **Excluded** — non-operational (**CF-S11-012**) |
| **Expert tip (clinical inventory boundary)** | **L362–L363** | Mandatory **priority**; **S11+BE** or **S11+WE** for travel vomiting | **Provisional inventory only** (**TGC-S11-005**, **TGC-S11-007**) — **not** selector activation |
| **Post-tip agent tail** | — | **None** before wrapper close (**L364**) | **No** post-tip contamination |
| **Wrapper close** | **L364** | **`</user_query>` present** before separator **L366** | **CLOSED** (**CF-S11-003**) |
| **Physical predecessor** | **`MED=S10` L288** | Prior owner block | **Matches** canonical **S10** |
| **Physical immediate successor** | **`MED=S12` L367** | Next normalized owner block | **Matches** canonical **S12** |
| **Canonical audit predecessor** | **S10** | Index §2 order | Formal audit on main (**provisional**) |
| **Canonical audit successor** | **S12** | Index §2 order | **Not** started or targeted |

**Bounded primary block:** **L328–L366** (clinical inventory **L337–L363**; exclusions as marked).

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-S11-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=S11` **L328** · bounded **L337–L363** · wrapper **L330–L364** (close **present**) · line **1155** | Located · byte proof **pending** |
| **SRC-S11-MM1E-IDX** | Normalized index | jsonl **1155** / len **2771** (A) | Aligned mirror · metadata only |
| **SRC-S11-REG-V2** | Registry v2 | `medicines.v2.json` **S11** | **`DERIVED_UNVERIFIED`** |
| **SRC-S11-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-S11-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **S11** | **Derived-unverified mirror** |
| **SRC-S11-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S11 tier review |
| **SRC-S11-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S11 tier review |
| **SRC-S11-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S11 tier review |
| **SRC-S11-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone S11 tier review |
| **SRC-S11-LEGACY-DUMP** | Legacy stub | Expected dump path | **`SOURCE_NOT_FOUND`** — gap **OPEN** |
| **SRC-S11-DEV-API** | Dev/API/mock | Formula maps, ICD strings, selectors | **`QUARANTINED_NO_OWNER_MERGE`** |
| **SRC-S11-CROSS-S10** | Prior merged S10 artifact | S10→S11 boundary context only | **Quarantined inventory** — **S10 artifact unchanged** |

**No derived tier may be merged into owner-primary clinical truth.**

**Unavailable-tier posture (MM2/MM2C/MM3/BOOK/OCR/UCKB):** **`NOT_LOCATED_IN_AVAILABLE_TREES — not substantively reviewed; no Rule 5 credit; no clinical authority; no owner merge`**.

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-S11-001** | `OWNER_PRIMARY_PROVISIONAL_019C_L328_SINGLE_HEADER_S10_PHYSICAL_CANONICAL_PREDECESSOR_S12_PHYSICAL_CANONICAL_SUCCESSOR_SLASS_L408_LATER_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-S11-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_S11_BLOCK_A_DEV_FORMULA_API_SELECTOR_STRINGS_QUARANTINED` |
| **TGC-S11-003** | `IDENTITY_SCROFOLOSO_11_GYNECOLOGY_ANTI_EMETIC_REGISTRY_POSITIVE_TEMPERAMENT_BE_WE_PAIRING_DERIVED_UNVERIFIED` |
| **TGC-S11-004** | `POTENCY_DILUTION_INVENTORY_ONLY_D1_D5_POSITIVE_D30_D200_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-S11-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_EXPERT_TIP_MANDATORY_PRIORITY_REJECTED_FOR_ACTIVATION` |
| **TGC-S11-006** | `APPLICATION_ROUTE_AUTHORITY_NONE_OWNER_ROUTE_SILENT_ORAL_BLOCK_ONLY` |
| **TGC-S11-007** | `RULE6_COMBINATION_INVENTORY_ONLY_S11_BE_WE_MOTION_SICKNESS_TIP_NO_RUNTIME_EDGE` |
| **TGC-S11-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-S11-009** | `NO_DUPLICATE_MED_S11_HEADER_DEV_TIER_S11_STRINGS_QUARANTINED_NOT_CO_PRIMARY` |
| **TGC-S11-010** | `EARLY_SCROFOLOSO_WALK_S11_BEFORE_SLASS_L408_VS_INDEX_S_LASS_BEFORE_S1_OPEN_NOT_RUNTIME_ACTIVATION` |

**TGC-S11-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** S11 tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-S11-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No `EOD-S11` table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Scrofoloso-11 / gynecology equilibrium / anti-emetic framing
- Leucorrhoea, menstrual disorders, PCOD/PCOS **support**, prolapse, infertility **support**, morning sickness, pregnancy dizziness, motion sickness, vertigo
- **Potency §4:** **D1–D5 Positive**, **D30–D200 Negative** — inventory only
- Keywords (**L360–L361**) — **non-operational**
- Expert tip **L362–L363:** mandatory **priority** + **S11+BE/WE** for travel vomiting — inventory only (**TGC-S11-005**, **TGC-S11-007**)

**High-stakes pregnancy/gynecology language** in §1/§3 — **inventory only**; **no** clinical authority.

---

## 11. High-stakes source claims (inventory only)

Pregnancy “safest/effective” framing, infertility, PCOD/PCOS **support**, prolapse, leucorrhoea, and motion-sickness combination mandates are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure** authority
- No **efficacy** or **rapid result** authority
- No **standard-care substitution**
- No **potency/dosage authorization**
- No **route/electricity authority**
- No **disease mapping** or **116k activation**
- No **keyword/priority selector** activation authority
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
| **Rule 4** | **NONE** in located S11 owner block **A**; dev/engine Rule strings — **quarantined** (**TGC-S11-002**) |
| **Rule 5 safety** | **`SOURCE_NOT_FOUND`** for S11-specific verified safety text; unavailable tiers **zero credit**; **`rule5SafetyCoverageComplete: false`** |
| **Rule 6** | Expert-tip **S11+BE/WE** + dev formula strings — **inventory only**; **no runtime relationship edge** (**TGC-S11-007**) |

**Clinical / safety / evidence:** **NO / NO / NONE**

---

## 14. Conflict register (`CF-S11`)

| ID | Status | Summary |
|----|--------|---------|
| **CF-S11-001** | **OPEN** | Canonical **S10→S11→S12** immediate chain **matches** physical **L288→L328→L367**; **global** **S-Lass-before-S1** vs **SLASS @ L408** geography **OPEN** |
| **CF-S11-002** | **OPEN** | Jsonl **1155** / len **2771** — byte proof **not verified** |
| **CF-S11-003** | **CLOSED** | Wrapper **`</user_query>` present L364** before separator **L366** |
| **CF-S11-004** | **OPEN** | Expert tip **mandatory priority** vs fail-closed activation |
| **CF-S11-005** | **OPEN** | Expert tip **S11+BE/WE** combination language vs Rule 6 **none** |
| **CF-S11-006** | **OPEN** | Owner label “औषधि संख्या **7**” vs audit sequence **32/38** — numbering tension (documentation) |
| **CF-S11-007** | **OPEN** | Registry **`temperament_affinity`** (BE/WE motion pairing) vs owner §1–4 silence |
| **CF-S11-008** | **OPEN** | Owner §4 bands vs registry **POSITIVE** / `potency_logic` |
| **CF-S11-009** | **OPEN** | High-stakes pregnancy/gynecology/infertility language vs standard care (documentation tension) |
| **CF-S11-010** | **OPEN** | **S11 @ L328** before **`MED=SLASS` L408** vs canonical index **S-Lass** placement before **S1** |
| **CF-S11-011** | **CLOSED** | Dev/mock/API/formula/116k selector **S11** strings — **activation rejected** (governance) |
| **CF-S11-012** | **CLOSED** | Cursor-save **L334–335**, §5 keywords **L360–361** — **excluded** from owner merge (governance exclusion only) |

**Mandatory CF summary:** CF: 001–002, 004–010 OPEN (9 entries) · 003, 011–012 CLOSED (3 entries; governance rejections/exclusions only)

---

## 15. Missing-evidence register (`ME-S11`)

| ID | Status | Summary |
|----|--------|---------|
| **ME-S11-001** | **OPEN** | Transcript bytes / jsonl **1155** / declared **2771** — **not verified** |
| **ME-S11-002** | **OPEN** | License / publication / redistribution provenance for primary text |
| **ME-S11-003** | **OPEN** | Owner-primary **Rule 5 safety** text for pregnancy/gynecology high-stakes indications |
| **ME-S11-004** | **OPEN** | Verified **route** / application evidence |
| **ME-S11-005** | **OPEN** | **Potency / dilution** ceilings vs registry normalization |
| **ME-S11-006** | **OPEN** | **Temperament** / **BE+WE** pairing (registry vs owner silence) |
| **ME-S11-007** | **OPEN** | **Rule 6** / **S11+BE/WE** tip vs validated relationships |
| **ME-S11-008** | **OPEN** | High-stakes pregnancy/gynecology claims vs standard care |
| **ME-S11-009** | **OPEN** | Registry / owner reconciliation (nickname, clusters, temperament field) |
| **ME-S11-010** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB bibliographic location — **not located** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 16. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | S11 (32/38) · header **`MED=S11`** |
| Canonical main SHA | `3cac4c554bbf809168135ac4e6122f2e09008c40` |
| Verdict | `S11_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · single occurrence **A** @ **L328** |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-S11-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–002, 004–010 OPEN (9 entries) · 003, 011–012 CLOSED (3 entries; governance rejections/exclusions only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **S12** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **S11 blocked · MED=S11 provisional single occurrence A · S10 pred/S12 succ aligned · no S7–S9 in 38-set · SLASS geography OPEN · wrapper close L364 CLOSED · no post-tip agent tail · expert tip priority and S11+BE/WE inventory only · high-stakes pregnancy/gynecology inventory only · MM2/MM2C/MM3/BOOK/UCKB not located · dev/mock quarantined · zero essential owner clinical decisions · no runtime authority**
