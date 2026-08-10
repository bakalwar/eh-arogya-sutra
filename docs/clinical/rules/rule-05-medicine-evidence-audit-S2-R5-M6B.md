# Rule 5 — R5-M6B Medicine Evidence Audit: S2 (Scrofoloso-2)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 27 of 38 |
| **Medicine code** | S2 |
| **Authoritative normalized header** | **`MED=S2`** |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-10 |
| **Repository base (EHAS2)** | `89e6b14d8742f86d071788920d0071ea5eb81967` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `S2_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series single occurrence **A** @ **L120**) |

**Mandatory normalizer posture:** Canonical code **`S2`** maps to owner normalized header **`MED=S2`**. Owner display **SCROFOLOSO-2 (S2)** / “Liver Remedy” / “Drainage Agent”. Registry mirror **Scrofoloso-2** — **`DERIVED_UNVERIFIED`**. **`^MED=S2`** header **count 1**; supplementary dev/API/mock strings are **`QUARANTINED_NO_OWNER_MERGE`** — **not** co-primary with occurrence **A**.

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Category** | **Scrofoloso** (liver / excretory drainage framing) |
| **Canonical sequence** | **S1 → S2 → S3** |
| **Physical corpus order vs audit order** | **`MED=S1` L76 → `MED=S2` L120 → `MED=S3` L160** in normalized 019c walk — **immediate chain matches** canonical **S1→S2→S3**; **`MED=SLASS` L408** and canonical **S-Lass-before-S1** geography remain **OPEN** (**CF-S2-001**, **CF-S2-006**) |
| **Registry identity (S2 code in 38-set)** | **VERIFIED** — code `S2` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **POSITIVE** — metadata only; **not** owner §4 inline band verification |
| **Owner medicine number** | Owner-only metadata (**2** — SCROFOLOSO-2 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only) |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof (A)** | **PENDING** — jsonl line **1010** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length (A)** | **2415** — **OPEN** |
| **S2 inner wrapper (occurrence A)** | **`text` L122** · **`<user_query>` opens L123** · **closing `</user_query>` absent** before separator **L159** — **OPEN** (**CF-S2-003**) |
| **Physical predecessor** | **`MED=S1` L76** — **matches** canonical audit predecessor **S1** |
| **Physical immediate successor** | **`MED=S3` L160** — **matches** canonical audit successor **S3** |
| **Canonical audit predecessor** | **S1** — merged formal audit on main (**provisional** occurrence A) |
| **Canonical audit successor** | **S3** — **not** started or targeted |
| **Prior S1 artifact** | Merged **S1** artifact documents physical successor **`MED=S2` L120** — **aligned**; **S1 artifact unchanged** by this PR |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **S2** (`MED=S2`). It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate S2, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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

## 4. S2 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L120) | Notes |
|-------|------------------------|----------------------------------------|--------|
| **Code** | S2 | S2 (`MED=S2`) | 38-set identity **VERIFIED** |
| **Display name** | Scrofoloso-2 | **S2 (Scrofoloso-2)** / Liver Remedy / Drainage Agent | Registry nickname aligned — **inventory only** |
| **Group** | Scrofoloso | Scrofoloso | Label-level alignment |
| **Polarity field** | POSITIVE | §4 **D1–D5 Positive**, **D10–D200 Negative** | **Inventory only** (**TGC-S2-004**, **CF-S2-005**); **not** dosage authority |

---

## 5. All `MED=S2` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L120** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1010** | **2415** | potency, bodyloc | **`PROVISIONAL_OWNER_PRIMARY`** — normalized owner-session materia master |

**Pattern search:** **`^MED=S2`** → **count 1** (entire normalized corpus file).

**No occurrence B header** located. Developer/API/mock **S2** strings (APP engine, selector maps, EH_DISEASE_MAP tuples, formula strings, medicine list enums) are **rejected** as S2 owner materia authority — **`QUARANTINED_NO_OWNER_MERGE`** (**CF-S2-011**, **TGC-S2-009**).

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **Separator before header** | **L119** | Block boundary (`====`) | Boundary only |
| **`MED=S2` header** | **L120** | Transcript pointer (1010 / 2415) | **Authoritative** metadata line |
| **Label** | **L122** | `text` | Boundary only |
| **Inner wrapper open** | **L123** | `<user_query>` | Boundary only |
| **Meta / Cursor save** | **L124–L126** | S1 praise + developer persistence + owner med #2 label | **Excluded** — non-clinical (**CF-S2-012**) |
| **§1 philosophy** | **L128–L129** | Elimination; liver/urinary depth; right-side affinity | **Provisional inventory only** |
| **§2 affinity** | **L130–L134** | Liver/bile, urinary, serous membranes, skin | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L135–L151** | Hepatobiliary, urinary, dropsy/edema, skin | **Provisional inventory only** |
| **§4 potency** | **L152–L154** | D1–D5 Positive; D10–D200 Negative | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L155–L156** | Keyword list + **same-line agent tail** | **Excluded** — non-operational (**CF-S2-012**) |
| **Dedicated expert tip section** | — | **Absent** (contrast S1 L115–116) | **OPEN** documentation asymmetry (**CF-S2-010**) |
| **Same-line agent tail** | **L156** (suffix on keyword line) | `ab ese pado or batao pehle hame…` workflow contamination | **OPEN finding** (**CF-S2-004**) · **Excluded** from owner merge (**CF-S2-012** CLOSED governance) — **not** a contradiction |
| **Wrapper close** | — | **`</user_query>` absent** before **L159** separator | **OPEN** (**CF-S2-003**) — **no silent repair** |
| **Physical predecessor** | **`MED=S1` L76** | Prior owner block | **Matches** canonical **S1** |
| **Physical immediate successor** | **`MED=S3` L160** | Next normalized owner block | **Matches** canonical **S3** |
| **Canonical audit predecessor** | **S1** | Index §2 order | Formal audit on main (**provisional**) |
| **Canonical audit successor** | **S3** | Index §2 order | **Not** started or targeted |

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-S2-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=S2` **L120** · bounded **L128–L154** (keywords/tail **L155–L156** excluded) · wrapper **L122–L157** (close **OPEN**) · line **1010** | Located · byte proof **pending** |
| **SRC-S2-MM1E-IDX** | Normalized index | jsonl **1010** / len **2415** (A) | Aligned mirror · metadata only |
| **SRC-S2-REG-V2** | Registry v2 | `medicines.v2.json` **S2** | **`DERIVED_UNVERIFIED`** |
| **SRC-S2-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-S2-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **S2** | **Derived-unverified mirror** |
| **SRC-S2-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S2 tier review |
| **SRC-S2-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S2 tier review |
| **SRC-S2-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S2 tier review |
| **SRC-S2-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone S2 tier review |
| **SRC-S2-LEGACY-DUMP** | Legacy stub | Expected dump path | **`SOURCE_NOT_FOUND`** — gap **OPEN** |
| **SRC-S2-DEV-API** | Dev/API/mock | Selectors, maps, formula strings, APP engine | **`QUARANTINED_NO_OWNER_MERGE`** |
| **SRC-S2-CROSS-S1** | Prior merged S1 artifact | S1→S2 boundary context only | **Quarantined inventory** — **S1 artifact unchanged** |

**No derived tier may be merged into owner-primary clinical truth.**

**Unavailable-tier posture (MM2/MM2C/MM3/BOOK/OCR/UCKB):** **`NOT_LOCATED_IN_AVAILABLE_TREES — not substantively reviewed; no Rule 5 credit; no clinical authority; no owner merge`**.

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-S2-001** | `OWNER_PRIMARY_PROVISIONAL_019C_L120_SINGLE_HEADER_S1_PHYSICAL_CANONICAL_PREDECESSOR_S3_PHYSICAL_CANONICAL_SUCCESSOR_SLASS_L408_LATER_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-S2-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_S2_BLOCK_A_DEV_ENGINE_SELECTOR_FORMULAS_QUARANTINED` |
| **TGC-S2-003** | `IDENTITY_SCROFOLOSO_2_LIVER_DRAINAGE_AGENT_REGISTRY_POSITIVE_INVENTORY_ONLY` |
| **TGC-S2-004** | `POTENCY_DILUTION_INVENTORY_ONLY_D1_D5_POSITIVE_D10_D200_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-S2-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_KEYWORDS_AND_AGENT_TAIL_REJECTED_FOR_ACTIVATION` |
| **TGC-S2-006** | `APPLICATION_ROUTE_AUTHORITY_NONE_OWNER_ROUTE_SILENT` |
| **TGC-S2-007** | `RULE6_COMBINATION_INVENTORY_ONLY_DEV_FORMULA_STRINGS_NO_RUNTIME_EDGE_NO_OWNER_MIXTURE_TIP` |
| **TGC-S2-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-S2-009** | `NO_DUPLICATE_MED_S2_HEADER_DEV_TIER_S2_STRINGS_QUARANTINED_NOT_CO_PRIMARY` |
| **TGC-S2-010** | `EARLY_SCROFOLOSO_WALK_S2_BEFORE_SLASS_L408_VS_INDEX_S_LASS_BEFORE_S1_OPEN_NOT_RUNTIME_ACTIVATION` |

**TGC-S2-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** S2 tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-S2-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No `EOD-S2` table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Scrofoloso-2 / liver remedy / drainage agent; elimination organs; right-side affinity framing
- Liver/bile, urinary tract, serous membranes, skin (liver-origin) clusters
- **Potency §4:** **D1–D5 Positive**, **D10–D200 Negative** — inventory only
- Keywords (**L155–L156**) — **non-operational**; agent tail **excluded**
- **No** dedicated expert tip / mandatory mixture wording in owner block **A**

---

## 11. High-stakes source claims (inventory only)

Jaundice, hepatitis, renal colic, ascites, and related support language are **provisional historical/source inventory** only.

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
| **Rule 4** | **NONE** in located S2 owner block **A**; dev/engine Rule strings — **quarantined** (**TGC-S2-002**) |
| **Rule 5 safety** | **`SOURCE_NOT_FOUND`** for S2-specific verified safety text; unavailable tiers **zero credit**; **`rule5SafetyCoverageComplete: false`** |
| **Rule 6** | Dev formula strings — **inventory only**; **no** owner mandatory mixture tip; **no runtime relationship edge** (**TGC-S2-007**) |

**Clinical / safety / evidence:** **NO / NO / NONE**

---

## 14. Conflict register (`CF-S2`)

| ID | Status | Summary |
|----|--------|---------|
| **CF-S2-001** | **OPEN** | Canonical **S1→S2→S3** immediate chain **matches** physical **L76→L120→L160**; **global** **S-Lass-before-S1** vs **SLASS @ L408** geography **OPEN** |
| **CF-S2-002** | **OPEN** | Jsonl **1010** / len **2415** — byte proof **not verified** |
| **CF-S2-003** | **OPEN** | Wrapper **`</user_query>`** absent before separator **L159** |
| **CF-S2-004** | **OPEN** | **Same-line agent tail** contamination on **L156** (existence finding) |
| **CF-S2-005** | **OPEN** | Owner §4 bands vs registry **POSITIVE** / `potency_logic` — not fully reconciled |
| **CF-S2-006** | **OPEN** | **S2 @ L120** hundreds of lines **before** **`MED=SLASS` L408** vs canonical index **S-Lass** placement before **S1** |
| **CF-S2-007** | **OPEN** | Owner label “औषधि संख्या **2**” vs audit sequence **27/38** — numbering tension (documentation) |
| **CF-S2-008** | **OPEN** | MM2/MM2C/MM3/BOOK/OCR/UCKB **not located** for S2 tier review |
| **CF-S2-009** | **OPEN** | Dev-tier **CARDIAC/METABOLIC/RENAL** S2 selectors vs materia-only **A** boundary |
| **CF-S2-010** | **OPEN** | **No** dedicated Expert Tip section (vs S1 pattern) — documentation asymmetry only |
| **CF-S2-011** | **CLOSED** | Dev/mock/API/selectors/116k map strings — **activation rejected** (governance) |
| **CF-S2-012** | **CLOSED** | Cursor-save **L125–126**, §5 keywords **L155–156**, agent-tail **L156** content **excluded** from owner merge (governance exclusion only) |

**Mandatory CF summary:** CF: 001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections/exclusions only)

---

## 15. Missing-evidence register (`ME-S2`)

| ID | Status | Summary |
|----|--------|---------|
| **ME-S2-001** | **OPEN** | Transcript bytes / jsonl **1010** / declared **2415** — **not verified** |
| **ME-S2-002** | **OPEN** | License / publication / redistribution provenance for primary text |
| **ME-S2-003** | **OPEN** | Owner-primary **Rule 5 safety** text for hepatobiliary/renal/high-stakes indications |
| **ME-S2-004** | **OPEN** | Verified **route** / application evidence |
| **ME-S2-005** | **OPEN** | **Potency / dilution** ceilings vs registry normalization |
| **ME-S2-006** | **OPEN** | **Electricity** co-administration (dev maps only — quarantined) |
| **ME-S2-007** | **OPEN** | **Rule 6** / dev formula strings vs validated relationships |
| **ME-S2-008** | **OPEN** | High-stakes claims (ascites, renal colic, hepatitis support) vs standard care |
| **ME-S2-009** | **OPEN** | Registry / owner reconciliation (nickname, clusters, missing temperament field) |
| **ME-S2-010** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB bibliographic location — **not located** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 16. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | S2 (27/38) · header **`MED=S2`** |
| Canonical main SHA | `89e6b14d8742f86d071788920d0071ea5eb81967` |
| Verdict | `S2_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · single occurrence **A** @ **L120** |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-S2-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections/exclusions only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **S3** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **S2 blocked · MED=S2 provisional single occurrence A · S1 pred/S3 succ aligned · SLASS geography OPEN · missing wrapper close OPEN · agent tail L156 OPEN/excluded · no Expert Tip section · MM2/MM2C/MM3/BOOK/UCKB not located · dev/mock quarantined · zero essential owner clinical decisions · no runtime authority**
