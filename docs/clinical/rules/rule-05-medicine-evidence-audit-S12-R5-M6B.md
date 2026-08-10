# Rule 5 — R5-M6B Medicine Evidence Audit: S12 (Scrofoloso-12)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 33 of 38 |
| **Medicine code** | S12 |
| **Authoritative normalized header** | **`MED=S12`** |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-10 |
| **Repository base (EHAS2)** | `fd7d44e5f97b100922313b6e4324dc15023cd63d` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `S12_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series single occurrence **A** @ **L367**) |

**Mandatory normalizer posture:** Canonical code **`S12`** maps to owner normalized header **`MED=S12`**. Owner display **SCROFOLOSO-12 (S12)** / Ophthalmic Specialist / Sensory Nerve Tonic / “नेत्र रक्षक”. Registry mirror **Scrofoloso-12** — **`DERIVED_UNVERIFIED`**. **`^MED=S12`** header **count 1** (entire normalized corpus file); supplementary dev/API/mock/formula strings are **`QUARANTINED_NO_OWNER_MERGE`** — **not** co-primary with occurrence **A**.

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Category** | **Scrofoloso** (ophthalmic / sensory organ framing) |
| **Canonical sequence** | **S11 → S12 → Ven1** (**no S7–S9** in v2 38-set) |
| **Physical corpus order vs audit order** | **`MED=S11` L328 → `MED=S12` L367 → `MED=SLASS` L408** in normalized 019c walk — **predecessor S11 aligned**; **canonical successor Ven1** vs **physical immediate `MED=SLASS` L408** — **OPEN** (**CF-S12-001**); **`MED=SLASS` L408** and canonical **S-Lass-before-S1** geography remain **OPEN** (**CF-S12-010**) |
| **Registry identity (S12 code in 38-set)** | **VERIFIED** — code `S12` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **POSITIVE** — metadata only; **not** owner §4 inline band verification |
| **Registry route/topical field** | Description includes **oral and topical (eye drops)** — **`DERIVED_UNVERIFIED`** |
| **Registry temperament field** | **`temperament_affinity`** (incl. A3+WE vision pairing) — **`DERIVED_UNVERIFIED`** |
| **Owner medicine number** | Owner-only metadata (**8** — SCROFOLOSO-12 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only) |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof (A)** | **PENDING** — jsonl line **1183** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length (A)** | **2693** — **OPEN** |
| **S12 inner wrapper (occurrence A)** | **`text` L369** · **`<user_query>` opens L370** · **closing `</user_query>` present L405** before separator **L406** — **CLOSED** (**CF-S12-003**) |
| **Physical predecessor** | **`MED=S11` L328** — **matches** canonical audit predecessor **S11** |
| **Physical immediate successor** | **`MED=SLASS` L408** — **does not match** canonical audit successor **Ven1** (owner **`MED=VEN1` L1252** later in 019c walk — **boundary context only**; **Ven1 corpus not audited**) |
| **Canonical audit predecessor** | **S11** — merged formal audit on main (**provisional** occurrence A) |
| **Canonical audit successor** | **Ven1** — **not** started or targeted |
| **Prior S11 artifact** | Merged **S11** artifact documents physical successor **`MED=S12` L367** — **aligned**; **S11 artifact unchanged** by this PR |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **S12** (`MED=S12`). It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate S12, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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

**Route note:** Owner **§1 L375–L376** **locates** topical eye-drop and oral route **wording** as **provisional inventory only** — **not** verified route evidence and **not** route/application authority.

---

## 4. S12 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L367) | Notes |
|-------|------------------------|----------------------------------------|--------|
| **Code** | S12 | S12 (`MED=S12`) | 38-set identity **VERIFIED** |
| **Display name** | Scrofoloso-12 | **S12 (Scrofoloso-12)** / Ophthalmic Specialist / Sensory Nerve Tonic | Registry nickname aligned — **inventory only** |
| **Group** | Scrofoloso | Scrofoloso | Label-level alignment |
| **Route wording** | oral + topical (eye drops) in registry description | §1 **topical (आई ड्रॉप्स) + oral (आंतरिक सेवन)** | **Located inventory only** (**TGC-S12-003**, **TGC-S12-006**, **CF-S12-007**); **`APPLICATION_ROUTE_AUTHORITY_NONE`** |
| **Polarity field** | POSITIVE | §4 **D1–D5 Positive**, **D10–D500 Negative** | **Inventory only** (**TGC-S12-004**, **CF-S12-008**); **not** dosage authority |

---

## 5. All `MED=S12` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L367** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1183** | **2693** | potency | **`PROVISIONAL_OWNER_PRIMARY`** — normalized owner-session materia master |

**Pattern search:** **`^MED=S12`** → **count 1** (entire normalized corpus file).

**No occurrence B header** located. Developer/API/mock **S12** / formula / selector strings elsewhere in corpus are **rejected** as S12 owner materia authority — **`QUARANTINED_NO_OWNER_MERGE`** (**CF-S12-011**, **TGC-S12-009**).

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **Separator before header** | **L366** | Block boundary (`====`) | Boundary only |
| **`MED=S12` header** | **L367** | Transcript pointer (1183 / 2693) | **Authoritative** metadata line |
| **Label** | **L369** | `text` | Boundary only |
| **Inner wrapper open** | **L370** | `<user_query>` | Boundary only |
| **Meta / Cursor save** | **L371–L372** | Intro + developer persistence + owner med #8 label | **Excluded** — non-clinical (**CF-S12-012**) |
| **§1 philosophy** | **L375–L376** | Eyes/optic nerve; **topical eye drops + oral** route wording **located** | **Provisional inventory only** — **not** verified route evidence (**TGC-S12-006**) |
| **§2 affinity** | **L377–L381** | Eyes, optic nerve, lacrimal, sensory nerves | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L382–L396** | Ophthalmic, vision, sensory clusters | **Provisional inventory only** (**high-stakes inventory only**) |
| **§4 potency** | **L397–L399** | D1–D5 Positive; D10–D500 Negative | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L400–L401** | Keyword workflow label | **Excluded** — non-operational (**CF-S12-012**) |
| **Expert tip (clinical inventory boundary)** | **L402–L403** | Mandatory formula inclusion; **S12+A3+WE** for vision | **Provisional inventory only** (**TGC-S12-005**, **TGC-S12-007**) — **not** selector activation |
| **Post-tip agent tail** | — | **None** before wrapper close (**L405**) | **No** post-tip contamination |
| **Wrapper close** | **L405** | **`</user_query>` present** before separator **L406** | **CLOSED** (**CF-S12-003**) |
| **Physical predecessor** | **`MED=S11` L328** | Prior owner block | **Matches** canonical **S11** |
| **Physical immediate successor** | **`MED=SLASS` L408** | Next normalized owner block | **Mismatch** vs canonical **Ven1** (**CF-S12-001**) |
| **Canonical audit predecessor** | **S11** | Index §2 order | Formal audit on main (**provisional**) |
| **Canonical audit successor** | **Ven1** | Index §2 order · **`MED=VEN1` L1252** (later walk) | **Not** started or targeted |

**Bounded primary block:** **L367–L407** (clinical inventory **L375–L403**; exclusions as marked).

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-S12-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=S12` **L367** · bounded **L375–L403** · wrapper **L369–L405** (close **present**) · line **1183** | Located · byte proof **pending** |
| **SRC-S12-MM1E-IDX** | Normalized index | jsonl **1183** / len **2693** (A) | Aligned mirror · metadata only |
| **SRC-S12-REG-V2** | Registry v2 | `medicines.v2.json` **S12** | **`DERIVED_UNVERIFIED`** |
| **SRC-S12-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-S12-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **S12** | **Derived-unverified mirror** |
| **SRC-S12-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S12 tier review |
| **SRC-S12-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S12 tier review |
| **SRC-S12-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S12 tier review |
| **SRC-S12-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone S12 tier review |
| **SRC-S12-LEGACY-DUMP** | Legacy stub | Expected dump path | **`SOURCE_NOT_FOUND`** — gap **OPEN** |
| **SRC-S12-DEV-API** | Dev/API/mock | Formula maps, ICD strings, selectors | **`QUARANTINED_NO_OWNER_MERGE`** |
| **SRC-S12-CROSS-S11** | Prior merged S11 artifact | S11→S12 boundary context only | **Quarantined inventory** — **S11 artifact unchanged** |
| **SRC-S12-VEN1-BOUNDARY** | Successor boundary only | **`MED=VEN1` L1252** (canonical successor; not immediate physical) | **Not audited** — **no Ven1 corpus review** |

**No derived tier may be merged into owner-primary clinical truth.**

**Unavailable-tier posture (MM2/MM2C/MM3/BOOK/OCR/UCKB):** **`NOT_LOCATED_IN_AVAILABLE_TREES — not substantively reviewed; no Rule 5 credit; no clinical authority; no owner merge`**.

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-S12-001** | `OWNER_PRIMARY_PROVISIONAL_019C_L367_SINGLE_HEADER_S11_PHYSICAL_CANONICAL_PREDECESSOR_VEN1_CANONICAL_SUCCESSOR_SLASS_L408_PHYSICAL_IMMEDIATE_SLASS_GEOGRAPHY_OPEN_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-S12-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_S12_BLOCK_A_DEV_FORMULA_API_SELECTOR_STRINGS_QUARANTINED` |
| **TGC-S12-003** | `IDENTITY_SCROFOLOSO_12_OPHTHALMIC_SENSORY_OWNER_ROUTE_WORDING_LOCATED_TOPICAL_ORAL_INVENTORY_REGISTRY_TOPICAL_ORAL_DERIVED_UNVERIFIED` |
| **TGC-S12-004** | `POTENCY_DILUTION_INVENTORY_ONLY_D1_D5_POSITIVE_D10_D500_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-S12-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_EXPERT_TIP_MANDATORY_FORMULA_INCLUSION_REJECTED_FOR_ACTIVATION` |
| **TGC-S12-006** | `OWNER_ROUTE_WORDING_LOCATED_TOPICAL_EYE_DROP_AND_ORAL_INVENTORY_ONLY_APPLICATION_ROUTE_AUTHORITY_NONE_NOT_VERIFIED_ROUTE_EVIDENCE` |
| **TGC-S12-007** | `RULE6_COMBINATION_INVENTORY_ONLY_S12_A3_WE_VISION_TIP_NO_RUNTIME_EDGE` |
| **TGC-S12-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-S12-009** | `NO_DUPLICATE_MED_S12_HEADER_DEV_TIER_S12_STRINGS_QUARANTINED_NOT_CO_PRIMARY` |
| **TGC-S12-010** | `EARLY_SCROFOLOSO_WALK_S12_BEFORE_SLASS_L408_VS_INDEX_S_LASS_BEFORE_S1_OPEN_NOT_RUNTIME_ACTIVATION` |

**TGC-S12-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** S12 tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-S12-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No `EOD-S12` table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Scrofoloso-12 / ophthalmic / sensory nerve framing
- Conjunctivitis, cataract (early), glaucoma support, watery/dry eyes, stye, weak eyesight, eye strain, night blindness, anosmia, tinnitus
- **Potency §4:** **D1–D5 Positive**, **D10–D500 Negative** — inventory only
- Keywords (**L400–L401**) — **non-operational**
- Expert tip **L402–L403:** mandatory formula inclusion + **S12+A3+WE** — inventory only (**TGC-S12-005**, **TGC-S12-007**)

**High-stakes ophthalmic language** (cataract, glaucoma, vision) in §1/§3 — **inventory only**; **no** clinical authority.

---

## 11. High-stakes source claims (inventory only)

Cataract, glaucoma, vision correction, and sensory claims are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure** authority
- No **efficacy** authority
- No **standard-care substitution**
- No **potency/dosage authorization**
- No **verified route/application authority** (owner route **wording located** ≠ route **evidence**)
- No **disease mapping** or **116k activation**
- No **keyword/mandatory selector** activation authority
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
| **Rule 4** | **NONE** in located S12 owner block **A**; dev/engine Rule strings — **quarantined** (**TGC-S12-002**) |
| **Rule 5 safety** | **`SOURCE_NOT_FOUND`** for S12-specific verified safety text; unavailable tiers **zero credit**; **`rule5SafetyCoverageComplete: false`** |
| **Rule 6** | Expert-tip **S12+A3+WE** + dev formula strings — **inventory only**; **no runtime relationship edge** (**TGC-S12-007**) |

**Clinical / safety / evidence:** **NO / NO / NONE**

---

## 14. Conflict register (`CF-S12`)

| ID | Status | Summary |
|----|--------|---------|
| **CF-S12-001** | **OPEN** | **S11→S12** predecessor **aligned**; **canonical successor Ven1** vs **physical immediate `MED=SLASS` L408**; global **S-Lass-before-S1** vs **SLASS @ L408** geography **OPEN** |
| **CF-S12-002** | **OPEN** | Jsonl **1183** / len **2693** — byte proof **not verified** |
| **CF-S12-003** | **CLOSED** | Wrapper **`</user_query>` present L405** before separator **L406** |
| **CF-S12-004** | **OPEN** | Expert tip **mandatory formula inclusion** vs fail-closed activation |
| **CF-S12-005** | **OPEN** | Expert tip **S12+A3+WE** combination language vs Rule 6 **none** |
| **CF-S12-006** | **OPEN** | Owner label “औषधि संख्या **8**” vs audit sequence **33/38** — numbering tension (documentation) |
| **CF-S12-007** | **OPEN** | Owner §1 topical eye-drop plus oral route wording and expert-tip A3+WE inventory vs registry topical/oral and temperament normalization — provenance and activation authority unresolved |
| **CF-S12-008** | **OPEN** | Owner §4 **D10–D500** high band vs registry **`potency_logic` D10–D200** |
| **CF-S12-009** | **OPEN** | High-stakes **cataract / glaucoma / vision** language vs standard care (documentation tension) |
| **CF-S12-010** | **OPEN** | **S12 @ L367** before **`MED=SLASS` L408** vs canonical index **S-Lass** placement before **S1** |
| **CF-S12-011** | **CLOSED** | Dev/mock/API/formula/116k selector **S12** strings — **activation rejected** (governance) |
| **CF-S12-012** | **CLOSED** | Cursor-save **L371–372**, §5 keywords **L400–401** — **excluded** from owner merge (governance exclusion only) |

**Mandatory CF summary:** CF: 001–002, 004–010 OPEN (9 entries) · 003, 011–012 CLOSED (3 entries; governance rejections/exclusions only)

---

## 15. Missing-evidence register (`ME-S12`)

| ID | Status | Summary |
|----|--------|---------|
| **ME-S12-001** | **OPEN** | Transcript bytes / jsonl **1183** / declared **2693** — **not verified** |
| **ME-S12-002** | **OPEN** | License / publication / redistribution provenance for primary text |
| **ME-S12-003** | **OPEN** | Owner-primary **Rule 5 safety** text for ophthalmic/high-stakes indications |
| **ME-S12-004** | **OPEN** | Owner **topical/oral route wording located** in §1 — **not** verified as **route/application evidence**; no route authority implied |
| **ME-S12-005** | **OPEN** | **Potency / dilution** ceilings (**D500** vs registry **D200** normalization) |
| **ME-S12-006** | **OPEN** | Expert-tip **S12+A3+WE** as **inventory-only** relationship language vs registry **temperament_affinity** normalization — **not** validated temperament or Rule 6 authority |
| **ME-S12-007** | **OPEN** | **Rule 6** / **S12+A3+WE** tip vs validated relationships |
| **ME-S12-008** | **OPEN** | High-stakes cataract/glaucoma/vision claims vs standard care |
| **ME-S12-009** | **OPEN** | Registry / owner reconciliation (topical/oral, clusters, tags) |
| **ME-S12-010** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB bibliographic location — **not located** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 16. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | S12 (33/38) · header **`MED=S12`** |
| Canonical main SHA | `fd7d44e5f97b100922313b6e4324dc15023cd63d` |
| Verdict | `S12_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · single occurrence **A** @ **L367** |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-S12-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route | Owner route wording **located** (§1 topical + oral) — **inventory only** · **`APPLICATION_ROUTE_AUTHORITY_NONE`** · **`routeAuthorized: false`** |
| Potency / dosage / electricity / Rule 6 / runtime | **false / false / false / NONE / false** |
| CF | **001–002, 004–010 OPEN (9 entries) · 003, 011–012 CLOSED (3 entries; governance rejections/exclusions only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **Ven1** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **S12 blocked · MED=S12 provisional single occurrence A · S11 pred aligned · Ven1 canonical succ vs SLASS L408 physical immediate OPEN · no S7–S9 in 38-set · SLASS geography OPEN · wrapper close L405 CLOSED · no post-tip agent tail · owner §1 topical/oral route wording inventory only not verified route evidence · expert tip mandatory formula and S12+A3+WE inventory only · high-stakes ophthalmic inventory only · MM2/MM2C/MM3/BOOK/UCKB not located · dev/mock quarantined · zero essential owner clinical decisions · no runtime authority**
