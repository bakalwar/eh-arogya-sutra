# Rule 5 — R5-M6B Medicine Evidence Audit: S1 (Scrofoloso-1)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 26 of 38 |
| **Medicine code** | S1 |
| **Authoritative normalized header** | **`MED=S1`** |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `ddbc3d69a27bd7de93a629e4dd25be61508a2708` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `S1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series occurrence **A** @ **L76** — **not** co-primary with occurrence **B**) |

**Mandatory normalizer posture:** Canonical code **`S1`** maps to owner normalized header **`MED=S1`**. Owner display **SCROFOLOSO-1 (S1)** / “King of Remedies” / “Universal Purifier”. Registry mirror **Scrofoloso-1** — **`DERIVED_UNVERIFIED`**. **Two** `^MED=S1` headers exist; occurrence **B** (**L3744**) is **`QUARANTINED_NO_OWNER_MERGE`** — **do not merge** into occurrence **A**.

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Category** | **Scrofoloso** (foundation lymph/metabolism framing) |
| **Canonical sequence** | **S-Lass → S1 → S2** |
| **Physical corpus order vs audit order** | **`MED=APP` L2 (dev engine) → `MED=S1` L76 → `MED=S2` L120** in normalized 019c walk; **S1 physically precedes `MED=SLASS` L408** by hundreds of lines vs canonical **S-Lass** predecessor — **OPEN** (**CF-S1-001**, **CF-S1-010**) |
| **Registry identity (S1 code in 38-set)** | **VERIFIED** — code `S1` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **POSITIVE** — metadata only; **not** owner §4 inline **D5 NEUTRAL** band verification |
| **Owner medicine number** | Owner-only metadata (**1** — SCROFOLOSO-1 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only) |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof (A)** | **PENDING** — jsonl line **984** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length (A)** | **2706** — **OPEN** |
| **S1 inner wrapper (occurrence A)** | **`text` L78** · **`<user_query>` opens L79** · **closing `</user_query>` absent** before separator **L118** — **OPEN** (**CF-S1-003**) |
| **Physical predecessor** | **`MED=APP` L2** — Python “Mattei Engine” dev block (closes **`</user_query>` L73**); **not** a 38-set canonical audit predecessor |
| **Physical immediate successor** | **`MED=S2` L120** — **matches** canonical audit successor **S2** |
| **Canonical audit predecessor** | **S-Lass** — **`MED=SLASS` L408** physically **later** in file |
| **Canonical audit successor** | **S2** — **not** started or targeted |
| **Prior S-Lass artifact** | Merged **S-Lass** artifact documents canonical successor **S1** vs physical **C1** after SLASS — **OPEN**; **S-Lass artifact unchanged** |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **S1** (`MED=S1`). It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate S1, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM2/MM3/BOOK/UCKB strings, **desktop phase-s5 CSV discovery**, or **developer/API/mock strings** (including occurrence **B**) as owner-verified clinical truth.
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

## 4. S1 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L76) | Notes |
|-------|----------------------|----------------------------------------|--------|
| **Code** | S1 | S1 (`MED=S1`) | 38-set identity **VERIFIED** |
| **Display name** | Scrofoloso-1 | **S1 (Scrofoloso-1)** / King / Universal Purifier | Registry nickname aligned — **inventory only** |
| **Group** | Scrofoloso | Scrofoloso | Label-level alignment |
| **Polarity field** | POSITIVE | §4 **D1–D3 Positive**, inline **D5 NEUTRAL**, **D10–D500 Negative** | **Inventory only** (**TGC-S1-004**, **CF-S1-007**); **not** dosage authority |

---

## 5. All `MED=S1` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L76** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **984** | **2706** | potency, bodyloc | **`PROVISIONAL_OWNER_PRIMARY`** — normalized owner-session materia master |
| **B** | **L3744** | `5d426b2e-140d-4ffb-8fe8-e878ea30a3d2\…jsonl` | **3352** | **4105** | potency, **external**, bodyloc, **electricity** | **`QUARANTINED_NO_OWNER_MERGE`** — Universal Rule Engine / Master Protocol dev block; **not** co-primary |

**Pattern search:** **`^MED=S1`** → **count 2** (entire normalized corpus file).

Developer/API/mock **S1** strings (APP engine **L2–72**, occurrence **B** engine steps, EH_DISEASE_MAP, selectors) are **rejected** as S1 owner materia authority — **`QUARANTINED_NO_OWNER_MERGE`** (**CF-S1-011**, **TGC-S1-009**).

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **Separator before header** | **L75** | Block boundary (`====`) | Boundary only |
| **`MED=S1` header** | **L76** | Transcript pointer (984 / 2706) | **Authoritative** metadata line |
| **Label** | **L78** | `text` | Boundary only |
| **Inner wrapper open** | **L79** | `<user_query>` | Boundary only |
| **Cursor/Database save** | **L82–L83** | Developer persistence instruction | **Excluded** — non-clinical (**CF-S1-012**) |
| **§1 philosophy** | **L85–L86** | Lymph/metabolism foundation; Mattei safe-start inventory | **Provisional inventory only** |
| **§2 affinity** | **L87–L91** | Lymph, stomach/absorption, nerves, metabolism | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L92–L109** | Digestive, glandular, nervous, general/immunity | **Provisional inventory only** |
| **§4 potency** | **L110–L112** | Dilution bands (inline **D5 NEUTRAL** in low band) | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L113–L114** | Keyword workflow label | **Excluded** — non-operational (**CF-S1-012**) |
| **Expert tip (clinical inventory boundary)** | **L115** | Weakness/metabolism → mandatory S1 in Mixture A/D wording | **Provisional inventory only** |
| **Same-line agent tail** | **L116** (suffix on expert-tip line) | `ese pado or jaha jarurt ho…` workflow contamination | **OPEN finding** (**CF-S1-004**) · **Excluded** from owner merge (**CF-S1-012** CLOSED governance) — **not** a contradiction |
| **Wrapper close** | — | **`</user_query>` absent** before **L118** separator | **OPEN** (**CF-S1-003**) — **no silent repair** |
| **Physical predecessor** | **APP L2** | Dev engine block | **OPEN** vs canonical **S-Lass** (**CF-S1-006**) |
| **Physical immediate successor** | **`MED=S2` L120** | Next normalized owner block | **Matches** canonical **S2** |
| **Canonical audit predecessor** | **S-Lass** | Index §2 order | Physical **SLASS L408** **later** in file |
| **Canonical audit successor** | **S2** | Index §2 order | **Not** started or targeted |

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-S1-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=S1` **L76** · bounded **L85–L112** + expert tip **L115** (tail **L116** excluded) · wrapper **L78–L117** (close **OPEN**) · line **984** | Located · byte proof **pending** |
| **SRC-S1-OWNER-B** | Dev/engine duplicate header | `MED=S1` **L3744** · alternate session | **`QUARANTINED_NO_OWNER_MERGE`** — **not** merged with **A** |
| **SRC-S1-MM1E-IDX** | Normalized index | jsonl **984** / len **2706** (A) | Aligned mirror · metadata only |
| **SRC-S1-REG-V2** | Registry v2 | `medicines.v2.json` **S1** | **`DERIVED_UNVERIFIED`** |
| **SRC-S1-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-S1-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **S1** | **Derived-unverified mirror** |
| **SRC-S1-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S1 tier review |
| **SRC-S1-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S1 tier review |
| **SRC-S1-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S1 tier review |
| **SRC-S1-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone S1 tier review |
| **SRC-S1-LEGACY-DUMP** | Legacy stub | Expected dump path | **`SOURCE_NOT_FOUND`** — gap **OPEN** |
| **SRC-S1-DEV-API** | Dev/API/mock | APP engine, occurrence **B**, selectors | **`QUARANTINED_NO_OWNER_MERGE`** |
| **SRC-S1-CROSS-SLASS** | Prior merged S-Lass artifact | S-Lass→S1 boundary context only | **Quarantined inventory** — **S-Lass artifact unchanged** |

**No derived tier may be merged into owner-primary clinical truth.**

**Unavailable-tier posture (MM2/MM2C/MM3/BOOK/OCR/UCKB):** **`NOT_LOCATED_IN_AVAILABLE_TREES — not substantively reviewed; no Rule 5 credit; no clinical authority; no owner merge`**.

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-S1-001** | `OWNER_PRIMARY_PROVISIONAL_019C_L76_OCCURRENCE_A_APP_DEV_PHYSICAL_PREDECESSOR_S2_PHYSICAL_SUCCESSOR_S_LASS_CANONICAL_PREDECESSOR_S2_CANONICAL_SUCCESSOR_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-S1-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_S1_BLOCK_A_DEV_ENGINE_STEPS_QUARANTINED` |
| **TGC-S1-003** | `IDENTITY_SCROFOLOSO_1_KING_UNIVERSAL_PURIFIER_REGISTRY_POSITIVE_INVENTORY_ONLY` |
| **TGC-S1-004** | `POTENCY_DILUTION_INVENTORY_ONLY_D1_D3_D5_NEUTRAL_D10_D500_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-S1-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_MANDATORY_MIXTURE_A_D_TIP_REJECTED_FOR_ACTIVATION` |
| **TGC-S1-006** | `APPLICATION_ROUTE_AUTHORITY_NONE_OWNER_ROUTE_SILENT` |
| **TGC-S1-007** | `RULE6_COMBINATION_INVENTORY_ONLY_MIXTURE_A_D_ENGINE_FORMULA_STRINGS_NO_RUNTIME_EDGE` |
| **TGC-S1-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-S1-009** | `DUPLICATE_MED_S1_OCCURRENCE_B_5D426B2E_UNIVERSAL_ENGINE_QUARANTINED_NOT_CO_PRIMARY` |
| **TGC-S1-010** | `KING_UNIVERSAL_100_PERCENT_ACCURATE_ENGINE_MANDATORY_INCLUSION_RUNTIME_AND_CURE_ACTIVATION_REJECTED` |

**TGC-S1-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** S1 tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-S1-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No `EOD-S1` table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Scrofoloso-1 / lymph purifier / metabolism foundation; Mattei safe-start framing
- Lymph glands, stomach absorption, nerves, metabolism, immunity/debility clusters
- **Potency §4:** **D1–D3 Positive**, inline **D5 NEUTRAL**, **D10–D500 Negative** — inventory only
- Keywords (**L113–L114**) — **non-operational**
- Expert tip **L115:** mandatory **Mixture A/D** inclusion on weakness/metabolism keywords — inventory only (**TGC-S1-005**, **TGC-S1-010**)
- Occurrence **B** engine “100% accurate” / emergency mandatory electricity strings — **quarantined** (**TGC-S1-009**, **TGC-S1-010**)

---

## 11. High-stakes source claims (inventory only)

“King of Remedies,” “Universal Purifier,” mandatory mixture inclusion, “100% accurate” universal engine (occurrence **B**), and cure/support keywords are **provisional historical/source inventory** only.

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
| **Rule 4** | **NONE** in located S1 owner block **A**; dev/engine Rule strings — **quarantined** (**TGC-S1-002**) |
| **Rule 5 safety** | **`SOURCE_NOT_FOUND`** for S1-specific verified safety text; unavailable tiers **zero credit**; **`rule5SafetyCoverageComplete: false`** |
| **Rule 6** | Mixture A/D mandatory tip + engine formula strings — **inventory only**; **no runtime relationship edge** (**TGC-S1-007**) |

**Clinical / safety / evidence:** **NO / NO / NONE**

---

## 14. Conflict register (`CF-S1`)

| ID | Status | Summary |
|----|--------|---------|
| **CF-S1-001** | **OPEN** | Canonical **S-Lass → S1 → S2** vs physical **APP(dev) → S1 → S2** early; **S-Lass @ L408** far later |
| **CF-S1-002** | **OPEN** | Duplicate header **B @ L3744** (alternate session/engine) vs **A** authority |
| **CF-S1-003** | **OPEN** | Wrapper **`</user_query>`** absent before separator **L118** |
| **CF-S1-004** | **OPEN** | **Same-line agent tail** contamination on **L116** (existence finding) |
| **CF-S1-005** | **OPEN** | Jsonl **984** / len **2706** — byte proof **not verified** |
| **CF-S1-006** | **OPEN** | **APP** dev block physical predecessor vs canonical **S-Lass** |
| **CF-S1-007** | **OPEN** | Owner §4 **D5 NEUTRAL** inline vs registry **POSITIVE** / potency_logic |
| **CF-S1-008** | **OPEN** | MM2/MM2C/MM3/BOOK/OCR/UCKB **not located** for S1 tier review |
| **CF-S1-009** | **OPEN** | Cross-tier engine **100% accurate** / emergency mandatory claims vs single-block authority |
| **CF-S1-010** | **OPEN** | S-Lass artifact canonical **S1** successor vs physical **S1** placement before **SLASS** |
| **CF-S1-011** | **CLOSED** | Dev/mock **occurrence B**, APP engine, selector/116k **activation rejected** (governance) |
| **CF-S1-012** | **CLOSED** | Cursor-save **L82–L83**, 116k keywords **L113–L114**, agent-tail **L116** content **excluded** from owner merge (governance exclusion only) |

**Mandatory CF summary:** CF: 001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections only)

---

## 15. Missing-evidence register (`ME-S1`)

| ID | Status | Summary |
|----|--------|---------|
| **ME-S1-001** | **OPEN** | Transcript bytes / jsonl **984** / declared **2706** — **not verified** |
| **ME-S1-002** | **OPEN** | License / publication / redistribution provenance for primary text |
| **ME-S1-003** | **OPEN** | Owner-primary **Rule 5 safety** text for foundation/universal remedy use |
| **ME-S1-004** | **OPEN** | Verified **route** / application evidence |
| **ME-S1-005** | **OPEN** | **Potency / dilution** ceilings (**D5 NEUTRAL** vs registry) |
| **ME-S1-006** | **OPEN** | **Electricity** co-administration (engine tiers only in quarantined blocks) |
| **ME-S1-007** | **OPEN** | **Rule 6** / Mixture A/D mandatory tip vs validated relationships |
| **ME-S1-008** | **OPEN** | High-stakes escalation (debility, immunity, thyroid support) vs standard care |
| **ME-S1-009** | **OPEN** | Registry / owner reconciliation (nickname, clusters, polarity) |
| **ME-S1-010** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB bibliographic location — **not located** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 16. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | S1 (26/38) · header **`MED=S1`** |
| Canonical main SHA | `ddbc3d69a27bd7de93a629e4dd25be61508a2708` |
| Verdict | `S1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · occurrence **A** @ **L76** · occurrence **B** **quarantined** |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-S1-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **S2** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **S1 blocked · MED=S1 provisional primary occurrence A · occurrence B quarantined · APP dev physical predecessor · S1 before SLASS vs canonical S-Lass predecessor OPEN · missing wrapper close OPEN · agent tail L116 OPEN/excluded · MM2/MM2C/MM3/BOOK/UCKB not located · zero essential owner clinical decisions · no runtime authority**
