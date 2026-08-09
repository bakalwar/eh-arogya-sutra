# Rule 5 — R5-M6B Medicine Evidence Audit: S-Lass (Scrofoloso-Lassative)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 25 of 38 |
| **Medicine code** | S-Lass |
| **Authoritative normalized header** | **`MED=SLASS`** (not `MED=S-LASS`) |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `c196cb8c69c35f97d3c0b261b58609ccf6c9b6f8` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `S_LASS_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series occurrence **A** only — single normalized **`MED=SLASS`** master block) |

**Mandatory normalizer posture:** Canonical index/registry code **`S-Lass`** maps to owner normalized header **`MED=SLASS`** @ **L408**. Owner display name **`S-LASS (Scrofoloso-Lassative)`**. Registry mirror **`Scrofoloso-Lassativo`** — **`DERIVED_UNVERIFIED`**. **Do not fabricate** `MED=S-LASS` or alternate headers.

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Category** | **Scrofoloso** (colon / bowel evacuator framing) |
| **Canonical sequence** | **RE → S-Lass → S1** |
| **Physical corpus order vs audit order** | **`MED=S12` L367 → `MED=SLASS` L408 → `MED=C1` L446** in normalized 019c walk; **canonical audit predecessor RE** has **no** located owner-primary block; **canonical audit successor S1** is **not** the physical immediate successor **C1** — **OPEN** sequence tension (**CF-SLASS-001**, **CF-SLASS-010**) |
| **Registry identity (S-Lass code in 38-set)** | **VERIFIED** — code `S-Lass` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **POSITIVE** — metadata only; **not** owner §4 dilution-band verification |
| **Owner medicine number** | Owner-only metadata (**9** — S-LASS framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only); **no** duplicate normalized **`MED=SLASS`** header |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1202** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length** | **2762** — **OPEN** |
| **S-Lass inner wrapper (occurrence A)** | **`text` L410** · **`<user_query>` opens L411** · **closing `</user_query>` absent** before separator **L444** — **OPEN** (**CF-SLASS-003**) |
| **Physical predecessor (38-set at SLASS)** | **`MED=S12` L367** (inner close **`</user_query>` L405**) |
| **Physical immediate successor** | **`MED=C1` L446** (~**L451** open) — **does not match** canonical audit successor **S1** |
| **Canonical audit predecessor** | **RE** — owner-primary **`NOT_LOCATED`** for RE (**no `MED=RE`**) |
| **Canonical audit successor** | **S1** — **not** started or targeted |
| **Duplicate owner-primary SLASS block** | **None** — negative search **`^MED=SLASS`** → **one** match |
| **Prior RE artifact pointer** | Merged **RE** artifact cites **`MED=SLASS` L408** early vs canonical seq **25** — **OPEN** (**CF-RE-003** preserved; **RE artifact unchanged**) |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **S-Lass** (`MED=SLASS`). It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate S-Lass, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM2/MM3/BOOK/UCKB strings, **desktop phase-s5 CSV discovery**, or **developer/API/mock strings** as owner-verified clinical truth.
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

## 4. S-Lass canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L408) | Notes |
|-------|----------------------|----------------------------------------|--------|
| **Code** | S-Lass | **SLASS** (`MED=SLASS`) | 38-set identity **VERIFIED**; header token **SLASS** |
| **Display name** | Scrofoloso-Lassativo | **S-LASS (Scrofoloso-Lassative)** | Spelling **Lassative** vs **Lassativo** **OPEN** (**CF-SLASS-005**) |
| **Group** | Scrofoloso | Scrofoloso-Lassative | Label-level alignment |
| **Polarity field** | POSITIVE | §4 **D1–D5 Positive**, **D10–D200 Negative** | **Inventory only** (**TGC-SLASS-004**); **not** dosage authority |
| **Temperament** | Lymphatic (primary), Balanced | **Not stated** in owner §1–§4 | **OPEN** (**CF-SLASS-006**) |

---

## 5. All `MED=SLASS` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L408** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1202** | **2762** | potency, bodyloc | **`PROVISIONAL_OWNER_PRIMARY`** — **only** normalized owner-session candidate |

**Negative search:** pattern **`^MED=SLASS`** → **count 1** (entire normalized corpus file).

Developer/API/mock **S-Lass** strings elsewhere in corpus (CONSTIPATION selectors, mixture rules **S10 vs S-Lass**, **C13+S-Lass+A2**, **Ver1+S-Lass**, **YE+S-Lass** tips) are **rejected** as S-Lass owner materia authority — **`QUARANTINED_NO_OWNER_MERGE`** (**CF-SLASS-007**, **CF-SLASS-011**).

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **Separator before header** | **L407** | Block boundary (`====`) | Boundary only |
| **`MED=SLASS` header** | **L408** | Transcript pointer (1202 / 2762) | **Authoritative** metadata line |
| **Label** | **L410** | `text` | Boundary only |
| **Inner wrapper open** | **L411** | `<user_query>` | Boundary only |
| **Cursor/Database save** | **L413** | Developer persistence instruction | **Excluded** — non-clinical |
| **§1 philosophy** | **L415–L417** | Colon tonic / peristalsis; not habit-forming laxative framing | **Provisional inventory only** |
| **§2 affinity** | **L418–L422** | Colon, rectum, mucosa, bowel nerves | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L423–L435** | Clinical/disease inventory | **Provisional inventory only** |
| **§4 potency** | **L436–L438** | Potency / dilution bands | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L439–L440** | Keyword workflow label | **Excluded** — non-operational |
| **Expert tip** | **L441–L442** | Bedtime / warm water; mandatory keyword inclusion wording | **Provisional inventory only** — **no post-tip agent tail** before **L444** |
| **Wrapper close** | — | **`</user_query>` absent** before **L444** separator | **OPEN** (**CF-SLASS-003**) — **no silent repair** |
| **Physical predecessor** | **S12** — close **L405** | Prior S12 master block | Adjacency only |
| **Physical immediate successor** | **`MED=C1` L446** | Next normalized owner block in file | **OPEN** vs canonical successor **S1** (**CF-SLASS-001**) |
| **Canonical audit predecessor** | **RE** | Index §2 order | RE owner-primary **not located** |
| **Canonical audit successor** | **S1** | Index §2 order | **Not** started or targeted |

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-SLASS-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=SLASS` **L408** · bounded **L415–L438** + expert tip **L441–L442** · wrapper **L410–L443** (close **OPEN**) · line **1202** | Located · byte proof **pending** |
| **SRC-SLASS-MM1E-IDX** | Normalized index | jsonl **1202** / len **2762** | Aligned mirror · metadata only |
| **SRC-SLASS-REG-V2** | Registry v2 | `medicines.v2.json` **S-Lass** | **`DERIVED_UNVERIFIED`** |
| **SRC-SLASS-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-SLASS-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **S-Lass** | **Derived-unverified mirror** |
| **SRC-SLASS-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S-Lass tier review |
| **SRC-SLASS-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S-Lass tier review |
| **SRC-SLASS-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S-Lass tier review |
| **SRC-SLASS-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone S-Lass tier review |
| **SRC-SLASS-LEGACY-DUMP** | Legacy stub | Expected dump path | **`SOURCE_NOT_FOUND`** — gap **OPEN** |
| **SRC-SLASS-DEV-API** | Dev/API/mock | Selector/mixture/routing/formula strings in corpus | **`QUARANTINED_NO_OWNER_MERGE`** |
| **SRC-SLASS-CROSS-RE** | Prior merged RE artifact | RE→S-Lass boundary context only | **Quarantined inventory** — **RE artifact unchanged** |

**No derived tier may be merged into owner-primary clinical truth.**

**Unavailable-tier posture (MM2/MM2C/MM3/BOOK/OCR/UCKB):** **`NOT_LOCATED_IN_AVAILABLE_TREES — not substantively reviewed; no Rule 5 credit; no clinical authority; no owner merge`**.

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-SLASS-001** | `OWNER_PRIMARY_PROVISIONAL_019C_L408_OCCURRENCE_A_MED_SLASS_CANONICAL_CODE_S_LASS_PHYSICAL_S12_TO_C1_CANONICAL_RE_TO_S1_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-SLASS-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_SLASS_BLOCK_A` |
| **TGC-SLASS-003** | `IDENTITY_SCROFOLOSO_GROUP_LASSATIVE_OWNER_VS_LASSATIVO_REGISTRY_POSITIVE_POLARITY_INVENTORY_ONLY` |
| **TGC-SLASS-004** | `POTENCY_DILUTION_INVENTORY_ONLY_D1_D5_POSITIVE_D10_D200_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-SLASS-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_EXPERT_TIP_KEYWORD_MANDATE_REJECTED_FOR_ACTIVATION` |
| **TGC-SLASS-006** | `APPLICATION_ROUTE_AUTHORITY_NONE_BEDTIME_WARM_WATER_INVENTORY_ONLY` |
| **TGC-SLASS-007** | `RULE6_COMBINATION_INVENTORY_ONLY_C13_VER1_YE_S10_MIXTURE_RULES_NO_RUNTIME_EDGE` |
| **TGC-SLASS-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-SLASS-009** | `REGISTRY_OWNER_TEMPERAMENT_AND_SPELLING_CONFLICTS_DERIVED_UNVERIFIED` |
| **TGC-SLASS-010** | `MANDATORY_INCLUSION_COMPLETE_EVACUATION_FAST_RESULTS_LANGUAGE_RUNTIME_AND_CURE_ACTIVATION_REJECTED` |

**TGC-SLASS-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** S-Lass tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-SLASS-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No `EOD-SLASS` table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Scrofoloso-Lassative / “Great Evacuator” / colon peristalsis tonic framing
- Colon, rectum, intestinal mucosa, bowel nerves (peristalsis)
- Chronic constipation, hard stool, incomplete evacuation, intestinal atony; piles/fissure/prolapse **support**; detox/skin via bowel clearance
- **Potency §4:** **D1–D5 Positive** (strong / warm water for hard stool); **D10–D200 Negative** (spastic/sensitive nerves) — inventory only
- Keywords (**L439–L440**) — **non-operational**
- Expert tip: bedtime dose, warm water, **mandatory** inclusion on constipation/IBS/piles keywords — inventory only (**TGC-SLASS-005**, **TGC-SLASS-010**)
- Cross-block tips (**C13+S-Lass+A2** fast results, **Ver1** / **YE** + S-Lass, **S10 vs S-Lass** mixture split) — **inventory only** (**TGC-SLASS-007**)
- Developer **CONSTIPATION** selector / **YE+WE** electricity enums — **quarantined** (**CF-SLASS-007**, **CF-SLASS-011**)

---

## 11. High-stakes source claims (inventory only)

Mandatory inclusion (**अनिवार्य**), complete morning evacuation, fast-results language in **other** blocks, and laxative/cure-adjacent keywords are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure** authority
- No **efficacy** or **rapid result** authority
- No **emergency bowel obstruction** management authority
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
| **Rule 4** | **NONE** in located S-Lass owner block **A**; corpus dev Rule 4 strings — **quarantined** (**TGC-SLASS-002**) |
| **Rule 5 safety** | **`SOURCE_NOT_FOUND`** for S-Lass-specific verified safety text; unavailable tiers **zero credit**; **`rule5SafetyCoverageComplete: false`** |
| **Rule 6** | Mixture/cross-med **S-Lass** strings — **inventory only**; **no runtime relationship edge** (**TGC-SLASS-007**) |

**Clinical / safety / evidence:** **NO / NO / NONE**

---

## 14. Conflict register (`CF-SLASS`)

| ID | Status | Summary |
|----|--------|---------|
| **CF-SLASS-001** | **OPEN** | Canonical **RE → S-Lass → S1** vs physical **S12 → SLASS → C1** early placement |
| **CF-SLASS-002** | **OPEN** | **`MED=SLASS`** vs index **`S-Lass`** normalizer mapping (documented; not silently rewritten) |
| **CF-SLASS-003** | **OPEN** | Wrapper **`</user_query>`** absent before separator **L444** |
| **CF-SLASS-004** | **OPEN** | Jsonl **line=1202**, **len=2762** — byte proof **not verified** (jsonl **not located**) |
| **CF-SLASS-005** | **OPEN** | **Scrofoloso-Lassative** (owner) vs **Scrofoloso-Lassativo** (registry) |
| **CF-SLASS-006** | **OPEN** | Temperament **silent** in owner §1–§4 vs registry **Lymphatic/Balanced** |
| **CF-SLASS-007** | **OPEN** | Dev CONSTIPATION / S-Lass priority / mixture enums vs unverified owner Rule 6 |
| **CF-SLASS-008** | **OPEN** | MM2/MM2C/MM3/BOOK/OCR/UCKB **not located** for S-Lass tier review |
| **CF-SLASS-009** | **OPEN** | Cross-block high-stakes tips (C13 fast results, mandatory bedtime inclusion) vs single-block authority |
| **CF-SLASS-010** | **OPEN** | Canonical predecessor **RE** **`NOT_LOCATED`** owner-primary vs S-Lass block **located** — chain integrity |
| **CF-SLASS-011** | **CLOSED** | Dev/mock **116k priority / selector / engine defaults** for S-Lass — **activation rejected** (governance) |
| **CF-SLASS-012** | **CLOSED** | Cursor-save, database-save, **116k keyword** sections — **excluded** from owner-primary merge (governance exclusion only) |

**Mandatory CF summary:** CF: 001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections only)

---

## 15. Missing-evidence register (`ME-SLASS`)

| ID | Status | Summary |
|----|--------|---------|
| **ME-SLASS-001** | **OPEN** | Transcript bytes / jsonl **1202** / declared **2762** — **not verified** |
| **ME-SLASS-002** | **OPEN** | License / publication / redistribution provenance for primary text |
| **ME-SLASS-003** | **OPEN** | Owner-primary **Rule 5 safety** text for bowel laxative use |
| **ME-SLASS-004** | **OPEN** | Verified **route** (oral vs other) and **bedtime/warm-water** protocol evidence |
| **ME-SLASS-005** | **OPEN** | **Potency / dilution** ceilings and **“Strong”** dose definition |
| **ME-SLASS-006** | **OPEN** | **Electricity** co-administration (dev YE/WE maps) — evidence absent in owner block |
| **ME-SLASS-007** | **OPEN** | **Rule 6** / mixture splits (**S10 vs S-Lass**) and combo tips — evidence not validated |
| **ME-SLASS-008** | **OPEN** | High-stakes escalation (piles, prolapse, IBS) vs standard care limits |
| **ME-SLASS-009** | **OPEN** | Registry / owner reconciliation (**name, temperament, clusters**) |
| **ME-SLASS-010** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB bibliographic location — **not located** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 16. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | S-Lass (25/38) · header **`MED=SLASS`** |
| Canonical main SHA | `c196cb8c69c35f97d3c0b261b58609ccf6c9b6f8` |
| Verdict | `S_LASS_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · occurrence **A** @ **L408** |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-SLASS-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **S1** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **S-Lass blocked · MED=SLASS provisional primary · RE owner-primary not located · physical S12→C1 vs canonical RE→S1 OPEN · missing wrapper close OPEN · MM2/MM2C/MM3/BOOK/UCKB not located · zero essential owner clinical decisions · no runtime authority**
