# Rule 5 — R5-M6B Medicine Evidence Audit: Ver1 (Vermifugo-1)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 35 of 38 |
| **Medicine code** | Ver1 |
| **Authoritative normalized header** | **`MED=VER1`** |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-10 |
| **Repository base (EHAS2)** | `b8093e3379f6ae8b0e953de74d91eb83a5362fd2` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `VER1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series single occurrence **A** @ **L1295**) |

**Mandatory normalizer posture:** Canonical index/registry code **`Ver1`** maps to owner normalized header **`MED=VER1`**. Owner display **Ver1 (Vermifugo-1)** / VERMIFUGO-1 / “परजीवियों का काल”. Registry mirror **Vermifugo-1** — **`DERIVED_UNVERIFIED`**. **`^MED=VER1`** header **count 1** (entire normalized corpus file); supplementary dev/API/mock/formula strings are **`QUARANTINED_NO_OWNER_MERGE`** — **not** co-primary with occurrence **A**. **Do not fabricate** `MED=Ver1` or alternate headers.

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Category** | **Vermifugo** (anti-parasitic / worm-expeller framing) |
| **Canonical sequence** | **Ven1 → Ver1 → Ver2** (**no S7–S9** in v2 38-set) |
| **Physical corpus order vs audit order** | **`MED=VEN1` L1252 → `MED=VER1` L1295 → `MED=L1` L1336** in normalized 019c walk — **predecessor Ven1 aligned**; **canonical successor Ver2** vs **physical immediate `MED=L1` L1336** — **OPEN** (**CF-VER1-001**, **CF-VER1-007**); **L1 index geography** vs late F-chain placement — **OPEN** (**CF-VER1-010**) |
| **Registry identity (Ver1 code in 38-set)** | **VERIFIED** — code `Ver1` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **NEUTRAL** — metadata only; **not** owner §4 inline band verification |
| **Registry temperament field** | **`temperament_affinity`** (Ver1+S10 / Ver1+S-Lass expert-tip pairing) — **`DERIVED_UNVERIFIED`** |
| **Owner medicine number** | Owner-only metadata (**31** — VERMIFUGO-1 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only) |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof (A)** | **PENDING** — jsonl line **1661** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length (A)** | **2731** — **OPEN** |
| **Ver1 inner wrapper (occurrence A)** | **`text` L1297** · **`<user_query>` opens L1298** · **closing `</user_query>` present L1333** before separator **L1335** / **`MED=L1` L1336** — **CLOSED** (**CF-VER1-003**) |
| **Physical predecessor** | **`MED=VEN1` L1252** (closes **L1292**) — **matches** canonical audit predecessor **Ven1** |
| **Physical immediate successor** | **`MED=L1` L1336** — **does not match** canonical audit successor **Ver2** (boundary only; **Ver2 corpus not audited**) |
| **Canonical audit predecessor** | **Ven1** — merged formal audit on main (**provisional** occurrence A) |
| **Canonical audit successor** | **Ver2** — **not** started or targeted |
| **Prior Ven1 artifact** | Merged **Ven1** artifact documents physical successor **`MED=VER1` L1295** — **aligned**; **Ven1 artifact unchanged** by this PR |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **Ver1** (`MED=VER1`). It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate Ver1, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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
| `administrationTimingAuthorized` | `false` |
| `potencyAuthorized` | `false` |
| `dosageAuthorized` | `false` |
| `electricityAuthorized` | `false` |
| `evidenceActivated` | `false` |
| `rule6MedicineRelationshipAuthority` | `NONE` |
| `runtimeAuthorized` | `false` |
| Mapping flags (all) | **`false`** |

**Administration timing vs route note:** Owner **§4 L1326** **locates** **empty-stomach / खाली पेट** **administration timing/condition wording** as **provisional inventory only** — **not** explicit topical/oral/inhaled **route** wording; **not** verified route/application evidence; **does not** infer oral (or any) route from timing wording (**TGC-VER1-006**, **ME-VER1-004**).

---

## 4. Ver1 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L1295) | Notes |
|-------|------------------------|----------------------------------------|--------|
| **Code** | Ver1 | Ver1 (`MED=VER1`) | 38-set identity **VERIFIED** |
| **Display name** | Vermifugo-1 | **Ver1 (Vermifugo-1)** / VERMIFUGO-1 | Registry aligned — **inventory only** |
| **Group** | Vermifugo | Vermifugo | Label-level alignment |
| **Administration timing wording** | (no verified timing field) | §4 **खाली पेट** / empty-stomach timing **located** | **Inventory only** (**TGC-VER1-006**) — **not** timing authority |
| **Explicit route wording** | — | **Not located** in bounded §1–§4 | **`APPLICATION_ROUTE_AUTHORITY_NONE`** |
| **Polarity field** | NEUTRAL | §4 **D1–D5 Positive/NEUTRAL**, **D10–D500 Negative** | **Inventory only** (**TGC-VER1-004**, **CF-VER1-008**); **not** dosage authority |

---

## 5. All `MED=VER1` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L1295** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1661** | **2731** | potency, bodyloc | **`PROVISIONAL_OWNER_PRIMARY`** — normalized owner-session materia master |

**Pattern search:** **`^MED=VER1`** → **count 1** (entire normalized corpus file).

**No occurrence B header** located. Developer/API/mock **Ver1** / formula / selector strings elsewhere in corpus are **rejected** as Ver1 owner materia authority — **`QUARANTINED_NO_OWNER_MERGE`** (**CF-VER1-011**, **TGC-VER1-009**).

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **Separator before header** | **L1294** | Block boundary (`====`) | Boundary only |
| **`MED=VER1` header** | **L1295** | Transcript pointer (1661 / 2731) | **Authoritative** metadata line |
| **Label** | **L1297** | `text` | Boundary only |
| **Inner wrapper open** | **L1298** | `<user_query>` | Boundary only |
| **Meta / Cursor save** | **L1300–L1303** | Intro + developer persistence + owner med #31 label | **Excluded** — non-clinical (**CF-VER1-012**) |
| **§1 philosophy** | **L1304–L1305** | Intestinal hostile environment / parasite framing | **Provisional inventory only** |
| **§2 affinity** | **L1306–L1310** | Intestines, rectum/anus, nerves, metabolism | **Provisional inventory only** — **not** route authority |
| **§3 disease mapping (116k label)** | **L1311–L1324** | Worms, pruritus ani, bruxism, bedwetting, pica, failure to thrive wording | **Provisional inventory only** (**high-stakes inventory only**) |
| **§4 potency** | **L1325–L1327** | D1–D3/D5 Positive/NEUTRAL; D10–D500 Negative; **“खाली पेट” / empty-stomach administration timing wording located** | **Provisional inventory only** — **not** explicit route wording; **not** timing/dosage authority (**TGC-VER1-006**) |
| **§5 keywords / 116k tags** | **L1328–L1329** | Keyword workflow label | **Excluded** — non-operational (**CF-VER1-012**) |
| **Expert tip (clinical inventory boundary)** | **L1330–L1331** | Primary priority; **Ver1+S10** / **Ver1+S-Lass** | **Provisional inventory only** (**TGC-VER1-005**, **TGC-VER1-007**) — **not** selector activation |
| **Post-tip agent tail** | — | **None** before wrapper close (**L1333**) | **No** post-tip contamination |
| **Wrapper close** | **L1333** | **`</user_query>` present** before **`MED=L1` L1336** | **CLOSED** (**CF-VER1-003**) |
| **Physical predecessor** | **`MED=VEN1` L1252** | Prior owner block | **Matches** canonical **Ven1** |
| **Physical immediate successor** | **`MED=L1` L1336** | Next normalized owner block | **Mismatch** vs canonical **Ver2** (**CF-VER1-007**) |
| **Canonical audit predecessor** | **Ven1** | Index §2 order | Formal audit on main (**provisional**) |
| **Canonical audit successor** | **Ver2** | Index §2 order | **Not** started or targeted |

**Bounded primary block:** **L1295–L1335** (clinical inventory **L1304–L1331**; exclusions as marked).

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-VER1-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=VER1` **L1295** · bounded **L1304–L1331** · wrapper **L1297–L1333** (close **present**) · line **1661** | Located · byte proof **pending** |
| **SRC-VER1-MM1E-IDX** | Normalized index | jsonl **1661** / len **2731** (A) | Aligned mirror · metadata only |
| **SRC-VER1-REG-V2** | Registry v2 | `medicines.v2.json` **Ver1** | **`DERIVED_UNVERIFIED`** |
| **SRC-VER1-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-VER1-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **Ver1** | **Derived-unverified mirror** |
| **SRC-VER1-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive Ver1 tier review |
| **SRC-VER1-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive Ver1 tier review |
| **SRC-VER1-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive Ver1 tier review |
| **SRC-VER1-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone Ver1 tier review |
| **SRC-VER1-LEGACY-DUMP** | Legacy stub | Expected dump path | **`SOURCE_NOT_FOUND`** — gap **OPEN** |
| **SRC-VER1-DEV-API** | Dev/API/mock | Formula maps, mixture selectors, cross-block tips | **`QUARANTINED_NO_OWNER_MERGE`** |
| **SRC-VER1-CROSS-VEN1** | Prior merged Ven1 artifact | Ven1→Ver1 boundary context only | **Quarantined inventory** — **Ven1 artifact unchanged** |
| **SRC-VER1-L1-BOUNDARY** | Physical successor boundary only | **`MED=L1` L1336** (not canonical **Ver2**) | **Not audited** — **no L1/Ver2 corpus review beyond boundary** |

**No derived tier may be merged into owner-primary clinical truth.**

**Unavailable-tier posture (MM2/MM2C/MM3/BOOK/OCR/UCKB):** **`NOT_LOCATED_IN_AVAILABLE_TREES — not substantively reviewed; no Rule 5 credit; no clinical authority; no owner merge`**.

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-VER1-001** | `OWNER_PRIMARY_PROVISIONAL_019C_L1295_SINGLE_HEADER_VEN1_L1252_PHYSICAL_CANONICAL_PREDECESSOR_L1_L1336_PHYSICAL_IMMEDIATE_VER2_CANONICAL_SUCCESSOR_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-VER1-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_VER1_BLOCK_A_DEV_FORMULA_API_SELECTOR_STRINGS_QUARANTINED` |
| **TGC-VER1-003** | `IDENTITY_VERMIFUGO_1_VER1_REGISTRY_VERMIFUGO_1_DERIVED_UNVERIFIED` |
| **TGC-VER1-004** | `POTENCY_DILUTION_INVENTORY_ONLY_D1_D5_POSITIVE_NEUTRAL_D10_D500_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-VER1-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_EXPERT_TIP_PRIORITY_AND_MANDATORY_SELECTOR_LANGUAGE_REJECTED_FOR_ACTIVATION` |
| **TGC-VER1-006** | `OWNER_EMPTY_STOMACH_ADMINISTRATION_TIMING_WORDING_LOCATED_INVENTORY_ONLY_EXPLICIT_ROUTE_WORDING_NOT_LOCATED_APPLICATION_ROUTE_AUTHORITY_NONE_NOT_VERIFIED_ROUTE_EVIDENCE` |
| **TGC-VER1-007** | `RULE6_COMBINATION_INVENTORY_ONLY_VER1_S10_VER1_S_LASS_TIP_NO_RUNTIME_EDGE` |
| **TGC-VER1-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-VER1-009** | `NO_DUPLICATE_MED_VER1_HEADER_DEV_TIER_VER1_STRINGS_QUARANTINED_NOT_CO_PRIMARY` |
| **TGC-VER1-010** | `PHYSICAL_VER1_L1295_L1_L1336_IMMEDIATE_VS_CANONICAL_VER2_SUCCESSOR_AND_L1_INDEX_GEOGRAPHY_OPEN_NOT_RUNTIME_ACTIVATION` |

**TGC-VER1-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** Ver1 tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-VER1-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No `EOD-VER1` table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Vermifugo-1 / anti-parasitic / worm-expeller framing
- Roundworm, tapeworm, pinworm, hookworm, pruritus ani, worm colic, bruxism, nose picking, bedwetting (worm-attributed), pica, appetite imbalance, failure to thrive wording
- **Potency §4:** low vs high dilution bands — inventory only; **खाली पेट** timing wording — inventory only (**TGC-VER1-006**)
- Keywords (**L1328–L1329**) — **non-operational**
- Expert tip **L1330–L1331:** priority + **Ver1+S10** / **Ver1+S-Lass** — inventory only (**TGC-VER1-005**, **TGC-VER1-007**)

**High-stakes pediatric/worm language** in §1/§3 — **inventory only**; **no** clinical authority.

---

## 11. High-stakes source claims (inventory only)

Worm infestations, pruritus ani, bruxism, bedwetting, pica, and failure-to-thrive wording are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure** authority
- No **efficacy** authority
- No **standard-care substitution**
- No **potency/dosage authorization**
- No **administration timing authorization**
- No **verified route/application authority** (empty-stomach timing wording **located** ≠ route evidence; **explicit route wording not located**)
- No **oral-route inference** from **खाली पेट**
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
| **Rule 4** | **NONE** in located Ver1 owner block **A**; dev/engine Rule strings — **quarantined** (**TGC-VER1-002**) |
| **Rule 5 safety** | **`SOURCE_NOT_FOUND`** for Ver1-specific verified safety text; unavailable tiers **zero credit**; **`rule5SafetyCoverageComplete: false`** |
| **Rule 6** | Expert-tip **Ver1+S10** / **Ver1+S-Lass** + registry combo tips + dev formula strings — **inventory only**; **no runtime relationship edge** (**TGC-VER1-007**) |

**Clinical / safety / evidence:** **NO / NO / NONE**

---

## 14. Route / application posture (mandated distinction)

| Concept | Ver1 posture |
|---------|----------------|
| **Administration timing wording** | **Present:** **खाली पेट** / empty-stomach condition in bounded **§4 L1326** — **inventory only** |
| **Explicit route wording** | **Not located** in bounded owner **§1–§4** |
| **Verified route/application evidence** | **Absent** |
| **Route authority** | **`APPLICATION_ROUTE_AUTHORITY_NONE`** |
| **`routeAuthorized`** | **`false`** |
| **Administration timing authorized** | **`false`** |
| **Dosage authorized** | **`false`** |

---

## 15. Conflict register (`CF-VER1`)

| ID | Status | Summary |
|----|--------|---------|
| **CF-VER1-001** | **OPEN** | **Ven1→Ver1→Ver2** canonical chain vs physical **VEN1→VER1→L1**; **L1 @ L1336** not **Ver2** |
| **CF-VER1-002** | **OPEN** | Jsonl **1661** / len **2731** — byte proof **not verified** |
| **CF-VER1-003** | **CLOSED** | Wrapper **`</user_query>` present L1333** before **`MED=L1` L1336** |
| **CF-VER1-004** | **OPEN** | Expert tip **primary priority** vs fail-closed activation |
| **CF-VER1-005** | **OPEN** | Expert tip **Ver1+S10** / **Ver1+S-Lass** combination language vs Rule 6 **none** |
| **CF-VER1-006** | **OPEN** | Owner label “औषधि संख्या **31**” vs audit sequence **35/38** — numbering tension (documentation) |
| **CF-VER1-007** | **OPEN** | **Physical immediate `MED=L1` L1336** vs **canonical successor Ver2** |
| **CF-VER1-008** | **OPEN** | Owner §4 Positive/Negative bands vs registry **`polarity: NEUTRAL`** / `potency_logic` |
| **CF-VER1-009** | **OPEN** | High-stakes **pediatric/worm** language vs standard care (documentation tension) |
| **CF-VER1-010** | **OPEN** | **Ver1 @ L1295** then **L1** vs index **L1 (seq 19)** / **Ver2** canonical successor geography |
| **CF-VER1-011** | **CLOSED** | Dev/mock/API/formula/116k selector **Ver1** strings — **activation rejected** (governance) |
| **CF-VER1-012** | **CLOSED** | Cursor-save **L1301–1303**, §5 keywords **L1328–1329** — **excluded** from owner merge (governance exclusion only) |

**Mandatory CF summary:** CF: 001–002, 004–010 OPEN (9 entries) · 003, 011–012 CLOSED (3 entries; governance rejections/exclusions only)

---

## 16. Missing-evidence register (`ME-VER1`)

| ID | Status | Summary |
|----|--------|---------|
| **ME-VER1-001** | **OPEN** | Transcript bytes / jsonl **1661** / declared **2731** — **not verified** |
| **ME-VER1-002** | **OPEN** | License / publication / redistribution provenance for primary text |
| **ME-VER1-003** | **OPEN** | Owner-primary **Rule 5 safety** text for pediatric/worm high-stakes **wording** |
| **ME-VER1-004** | **OPEN** | Empty-stomach administration timing wording located as inventory only; explicit route wording and verified route/application evidence not located |
| **ME-VER1-005** | **OPEN** | **Potency / dilution** ceilings vs registry normalization |
| **ME-VER1-006** | **OPEN** | **Rule 6** — **Ver1+S10** / **Ver1+S-Lass** tip vs validated relationship edges |
| **ME-VER1-007** | **OPEN** | **L1 L1336** physical successor vs **Ver2** canonical chain |
| **ME-VER1-008** | **OPEN** | High-stakes worm/pediatric claims vs standard care |
| **ME-VER1-009** | **OPEN** | Registry / owner reconciliation (clusters, temperament tips) |
| **ME-VER1-010** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB bibliographic location — **not located** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 17. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | Ver1 (35/38) · header **`MED=VER1`** |
| Canonical main SHA | `b8093e3379f6ae8b0e953de74d91eb83a5362fd2` |
| Verdict | `VER1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · single occurrence **A** @ **L1295** |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-VER1-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / timing | Empty-stomach administration timing wording **located (§4)** — **inventory only** · **explicit route wording not located** in bounded §1–§4 · **`APPLICATION_ROUTE_AUTHORITY_NONE`** · **`routeAuthorized: false`** · **administration timing authorized: false** · **dosage authorized: false** |
| Potency / electricity / Rule 6 / runtime | **false / false / NONE / false** |
| CF | **001–002, 004–010 OPEN (9 entries) · 003, 011–012 CLOSED (3 entries; governance rejections/exclusions only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **Ver2** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **Ver1 blocked · MED=VER1 provisional single occurrence A · Ven1 physical pred aligned · L1 physical succ vs Ver2 canonical OPEN · wrapper close L1333 CLOSED · no post-tip agent tail · empty-stomach administration timing wording inventory only explicit route wording not located not verified route evidence · no oral-route inference · expert tip priority and Ver1+S10/S-Lass inventory only · high-stakes worm/pediatric inventory only · MM2/MM2C/MM3/BOOK/UCKB not located · dev/mock quarantined · zero essential owner clinical decisions · no runtime authority**
