# Rule 5 — R5-M6B Medicine Evidence Audit: S6 (Scrofoloso-6)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 30 of 38 |
| **Medicine code** | S6 |
| **Authoritative normalized header** | **`MED=S6`** |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-10 |
| **Repository base (EHAS2)** | `32578cf38b8b9c1f87d424ea7770257c57b3193e` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `S6_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series single occurrence **A** @ **L245**) |

**Mandatory normalizer posture:** Canonical code **`S6`** maps to owner normalized header **`MED=S6`**. Owner display **SCROFOLOSO-6 (S6)** / “Kidney Specialist” / “Uric Acid Neutralizer”. Registry mirror **Scrofoloso-6** — **`DERIVED_UNVERIFIED`**. **`^MED=S6`** header **count 1** (entire normalized corpus file); supplementary dev/API/mock strings are **`QUARANTINED_NO_OWNER_MERGE`** — **not** co-primary with occurrence **A**.

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Category** | **Scrofoloso** (renal / urinary / uric-acid / water-balance framing) |
| **Canonical sequence** | **S5 → S6 → S10** (**no S7–S9** in v2 38-set) |
| **Physical corpus order vs audit order** | **`MED=S5` L201 → `MED=S6` L245 → `MED=S10` L288** in normalized 019c walk — **immediate chain matches** canonical **S5→S6→S10**; **`MED=SLASS` L408** and canonical **S-Lass-before-S1** geography remain **OPEN** (**CF-S6-001**, **CF-S6-008**) |
| **Registry identity (S6 code in 38-set)** | **VERIFIED** — code `S6` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **POSITIVE** — metadata only; **not** owner §4 inline band verification |
| **Registry temperament field** | **`temperament_affinity`** present in v2 (incl. registry **S5 pairing** on gout) — **`DERIVED_UNVERIFIED`** vs owner block (temperament **silent** in bounded §1–4) |
| **Owner medicine number** | Owner-only metadata (**5** — SCROFOLOSO-6 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only) |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof (A)** | **PENDING** — jsonl line **1095** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length (A)** | **2663** — **OPEN** |
| **S6 inner wrapper (occurrence A)** | **`text` L247** · **`<user_query>` opens L248** · **closing `</user_query>` absent** before separator **L287** — **OPEN** (**CF-S6-003**) |
| **Physical predecessor** | **`MED=S5` L201** — **matches** canonical audit predecessor **S5** |
| **Physical immediate successor** | **`MED=S10` L288** — **matches** canonical audit successor **S10** |
| **Canonical audit predecessor** | **S5** — merged formal audit on main (**provisional** occurrence A) |
| **Canonical audit successor** | **S10** — **not** started or targeted |
| **Prior S5 artifact** | Merged **S5** artifact documents physical successor **`MED=S6` L245** — **aligned**; **S5 artifact unchanged** by this PR |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **S6** (`MED=S6`). It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate S6, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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

## 4. S6 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L245) | Notes |
|-------|------------------------|----------------------------------------|--------|
| **Code** | S6 | S6 (`MED=S6`) | 38-set identity **VERIFIED** |
| **Display name** | Scrofoloso-6 | **S6 (Scrofoloso-6)** / Kidney Specialist / Uric Acid Neutralizer | Registry nickname aligned — **inventory only** |
| **Group** | Scrofoloso | Scrofoloso | Label-level alignment |
| **Polarity field** | POSITIVE | §4 **D1–D5 Positive**, **D10–D200 Negative** | **Inventory only** (**TGC-S6-004**, **CF-S6-005**); **not** dosage authority |

---

## 5. All `MED=S6` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L245** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1095** | **2663** | potency | **`PROVISIONAL_OWNER_PRIMARY`** — normalized owner-session materia master |

**Pattern search:** **`^MED=S6`** → **count 1** (entire normalized corpus file).

**No occurrence B header** located. Developer/API/mock **S6** / kidney / uric-acid / selector strings are **rejected** as S6 owner materia authority — **`QUARANTINED_NO_OWNER_MERGE`** (**CF-S6-011**, **TGC-S6-009**).

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **Separator before header** | **L244** | Block boundary (`====`) | Boundary only |
| **`MED=S6` header** | **L245** | Transcript pointer (1095 / 2663) | **Authoritative** metadata line |
| **Label** | **L247** | `text` | Boundary only |
| **Inner wrapper open** | **L248** | `<user_query>` | Boundary only |
| **Blank after open** | **L249** | Empty line inside wrapper | Boundary only |
| **Meta / Cursor save** | **L250–L252** | Intro + developer persistence + owner med #5 label | **Excluded** — non-clinical (**CF-S6-012**) |
| **§1 philosophy** | **L254–L255** | Water balance, filtration, urea/creatinine/uric acid; gout framing | **Provisional inventory only** |
| **§2 affinity** | **L256–L260** | Kidneys, ureter/bladder, joints (uric crystals), blood nitrogen waste | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L261–L276** | Renal, UTI, metabolic/gout, puffiness clusters | **Provisional inventory only** |
| **§4 potency** | **L277–L279** | D1–D5 Positive; D10–D200 Negative | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L280–L281** | Keyword workflow label | **Excluded** — non-operational (**CF-S6-012**) |
| **Expert tip (clinical inventory boundary)** | **L282–L283** | Mandatory **priority** on Kidney/Urea/Creatinine/Stone/Gout; **S5+S6** when uric acid ↑ | **Provisional inventory only** (**TGC-S6-005**, **TGC-S6-007**) — **not** selector activation |
| **Post-tip agent tail** | — | **None** before separator (**L284** blank) | **No** post-tip contamination |
| **Wrapper close** | — | **`</user_query>` absent** before **L287** separator | **OPEN** (**CF-S6-003**) — **no silent repair** |
| **Physical predecessor** | **`MED=S5` L201** | Prior owner block | **Matches** canonical **S5** |
| **Physical immediate successor** | **`MED=S10` L288** | Next normalized owner block | **Matches** canonical **S10** |
| **Canonical audit predecessor** | **S5** | Index §2 order | Formal audit on main (**provisional**) |
| **Canonical audit successor** | **S10** | Index §2 order | **Not** started or targeted |

**Bounded primary block:** **L245–L287** (clinical inventory **L254–L283**; exclusions as marked).

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-S6-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=S6` **L245** · bounded **L254–L283** · wrapper **L247–L286** (close **OPEN**) · line **1095** | Located · byte proof **pending** |
| **SRC-S6-MM1E-IDX** | Normalized index | jsonl **1095** / len **2663** (A) | Aligned mirror · metadata only |
| **SRC-S6-REG-V2** | Registry v2 | `medicines.v2.json` **S6** | **`DERIVED_UNVERIFIED`** |
| **SRC-S6-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-S6-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **S6** | **Derived-unverified mirror** |
| **SRC-S6-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S6 tier review |
| **SRC-S6-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S6 tier review |
| **SRC-S6-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S6 tier review |
| **SRC-S6-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone S6 tier review |
| **SRC-S6-LEGACY-DUMP** | Legacy stub | Expected dump path | **`SOURCE_NOT_FOUND`** — gap **OPEN** |
| **SRC-S6-DEV-API** | Dev/API/mock | Kidney/uric selectors, AI prose | **`QUARANTINED_NO_OWNER_MERGE`** |
| **SRC-S6-CROSS-S5** | Prior merged S5 artifact | S5→S6 boundary context only | **Quarantined inventory** — **S5 artifact unchanged** |

**No derived tier may be merged into owner-primary clinical truth.**

**Unavailable-tier posture (MM2/MM2C/MM3/BOOK/OCR/UCKB):** **`NOT_LOCATED_IN_AVAILABLE_TREES — not substantively reviewed; no Rule 5 credit; no clinical authority; no owner merge`**.

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-S6-001** | `OWNER_PRIMARY_PROVISIONAL_019C_L245_SINGLE_HEADER_S5_PHYSICAL_CANONICAL_PREDECESSOR_S10_PHYSICAL_CANONICAL_SUCCESSOR_SLASS_L408_LATER_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-S6-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_S6_BLOCK_A_DEV_SELECTOR_KIDNEY_URIC_STRINGS_QUARANTINED` |
| **TGC-S6-003** | `IDENTITY_SCROFOLOSO_6_KIDNEY_URIC_ACID_REGISTRY_POSITIVE_TEMPERAMENT_DERIVED_UNVERIFIED` |
| **TGC-S6-004** | `POTENCY_DILUTION_INVENTORY_ONLY_D1_D5_POSITIVE_D10_D200_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-S6-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_EXPERT_TIP_MANDATORY_PRIORITY_S5_S6_PAIRING_REJECTED_FOR_ACTIVATION` |
| **TGC-S6-006** | `APPLICATION_ROUTE_AUTHORITY_NONE_OWNER_ROUTE_SILENT` |
| **TGC-S6-007** | `RULE6_COMBINATION_INVENTORY_ONLY_S5_S6_MANDATORY_TIP_NO_RUNTIME_EDGE` |
| **TGC-S6-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-S6-009** | `NO_DUPLICATE_MED_S6_HEADER_DEV_TIER_S6_STRINGS_QUARANTINED_NOT_CO_PRIMARY` |
| **TGC-S6-010** | `EARLY_SCROFOLOSO_WALK_S6_BEFORE_SLASS_L408_VS_INDEX_S_LASS_BEFORE_S1_OPEN_NOT_RUNTIME_ACTIVATION` |

**TGC-S6-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** S6 tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-S6-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No `EOD-S6` table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Scrofoloso-6 / kidney specialist / uric-acid neutralizer; filtration and water-balance framing
- Renal, urinary tract, joint uric-crystal, blood urea/creatinine clearance clusters
- **Potency §4:** **D1–D5 Positive**, **D10–D200 Negative** — inventory only
- Keywords (**L280–L281**) — **non-operational**
- Expert tip **L282–L283:** mandatory **priority** + **S5+S6** when uric acid ↑ — inventory only (**TGC-S6-005**, **TGC-S6-010**)

---

## 11. High-stakes source claims (inventory only)

Nephritis, renal calculi, creatinine/urea elevation, CKD support/atrophy language, UTI, hematuria/albuminuria, gout, retention, and periorbital puffiness are **provisional historical/source inventory** only.

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
| **Rule 4** | **NONE** in located S6 owner block **A**; dev/engine Rule strings — **quarantined** (**TGC-S6-002**) |
| **Rule 5 safety** | **`SOURCE_NOT_FOUND`** for S6-specific verified safety text; unavailable tiers **zero credit**; **`rule5SafetyCoverageComplete: false`** |
| **Rule 6** | Expert-tip **S5+S6** mandatory pairing + dev selector strings — **inventory only**; **no runtime relationship edge** (**TGC-S6-007**) |

**Clinical / safety / evidence:** **NO / NO / NONE**

---

## 14. Conflict register (`CF-S6`)

| ID | Status | Summary |
|----|--------|---------|
| **CF-S6-001** | **OPEN** | Canonical **S5→S6→S10** immediate chain **matches** physical **L201→L245→L288**; **global** **S-Lass-before-S1** vs **SLASS @ L408** geography **OPEN** |
| **CF-S6-002** | **OPEN** | Jsonl **1095** / len **2663** — byte proof **not verified** |
| **CF-S6-003** | **OPEN** | Wrapper **`</user_query>`** absent before separator **L287** |
| **CF-S6-004** | **OPEN** | Expert tip **mandatory priority** + **S5+S6** when uric acid ↑ vs fail-closed activation |
| **CF-S6-005** | **OPEN** | Owner §4 bands vs registry **POSITIVE** / `potency_logic` |
| **CF-S6-006** | **OPEN** | Registry **`temperament_affinity`** (incl. S5 pairing) vs owner §1–4 silence |
| **CF-S6-007** | **OPEN** | Owner label “औषधि संख्या **5**” vs audit sequence **30/38** — numbering tension (documentation) |
| **CF-S6-008** | **OPEN** | **S6 @ L245** hundreds of lines **before** **`MED=SLASS` L408** vs canonical index **S-Lass** placement before **S1** |
| **CF-S6-009** | **OPEN** | Dev-tier kidney/uric selector prose vs materia-only **A** boundary |
| **CF-S6-010** | **OPEN** | High-stakes renal/CKD/creatinine/stone language vs standard care (documentation tension) |
| **CF-S6-011** | **CLOSED** | Dev/mock/API/selectors/116k map strings — **activation rejected** (governance) |
| **CF-S6-012** | **CLOSED** | Cursor-save **L250–252**, §5 keywords **L280–281** — **excluded** from owner merge (governance exclusion only) |

**Mandatory CF summary:** CF: 001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections/exclusions only)

---

## 15. Missing-evidence register (`ME-S6`)

| ID | Status | Summary |
|----|--------|---------|
| **ME-S6-001** | **OPEN** | Transcript bytes / jsonl **1095** / declared **2663** — **not verified** |
| **ME-S6-002** | **OPEN** | License / publication / redistribution provenance for primary text |
| **ME-S6-003** | **OPEN** | Owner-primary **Rule 5 safety** text for renal/high-stakes indications |
| **ME-S6-004** | **OPEN** | Verified **route** / application evidence |
| **ME-S6-005** | **OPEN** | **Potency / dilution** ceilings vs registry normalization |
| **ME-S6-006** | **OPEN** | **Temperament** / S5 pairing (registry vs owner silence) |
| **ME-S6-007** | **OPEN** | **Rule 6** / S5+S6 tip vs validated relationships |
| **ME-S6-008** | **OPEN** | High-stakes renal claims vs standard care |
| **ME-S6-009** | **OPEN** | Registry / owner reconciliation (nickname, clusters, temperament field) |
| **ME-S6-010** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB bibliographic location — **not located** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 16. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | S6 (30/38) · header **`MED=S6`** |
| Canonical main SHA | `32578cf38b8b9c1f87d424ea7770257c57b3193e` |
| Verdict | `S6_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · single occurrence **A** @ **L245** |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-S6-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections/exclusions only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **S10** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **S6 blocked · MED=S6 provisional single occurrence A · S5 pred/S10 succ aligned · no S7–S9 in 38-set · SLASS geography OPEN · missing wrapper close OPEN · no post-tip agent tail · expert tip S5+S6 inventory only · MM2/MM2C/MM3/BOOK/UCKB not located · dev/mock quarantined · zero essential owner clinical decisions · no runtime authority**
