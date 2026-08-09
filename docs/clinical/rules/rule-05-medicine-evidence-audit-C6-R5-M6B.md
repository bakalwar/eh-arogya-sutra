# Rule 5 — R5-M6B Medicine Evidence Audit: C6 (Canceroso-6)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 11 of 38 |
| **Medicine code** | C6 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `6e0b8486aa7e2feb224a415f742973a1b9618fa9` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `C6_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series normalized `MED=C6` corpus block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`) |
| **Registry identity (C6 code in 38-set)** | **VERIFIED** — code `C6` present in v2 registry; **not** owner-source verification |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** only; **no** full provenance or clinical verification claim |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1290** not byte-verified in EHAS2 |
| **Declared transcript length** | **3169** — **OPEN** vs MM3 `doctor_chars: 3165` (4-char delta unresolved) |
| **Upstream corpus segmentation** | **C5 inner `</user_query>` at L652** — **no bleed into C6** |
| **C6 inner wrapper** | C6 `<user_query>` opens **L658** and **closes at L690** before **`MED=C10`** @ **L692** |
| **Following canonical medicine** | **C10** opens **~L696** (not C7) |
| **Duplicate `MED=C6` blocks** | **None found** (single 019c-series tag) |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **C6**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate C6, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM3 BOOK strings as owner-verified clinical truth.
- Preserves disease/indication **source-tier inventory** with **zero** mapping or selection authority.
- Does **not** substitute for emergency or specialist medical care.

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

---

## 4. C6 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (`MED=C6` 019c @ L655) | Notes |
|-------|----------------------|--------------------------------------|--------|
| **Code** | `C6` | `C6` | 38-set identity **VERIFIED** |
| **Display name** | Canceroso-6 | CANCEROSO-6 (C6) | Spelling variant |
| **Group** | Canceroso | C-Group (Canceroso) / renal–urinary structure | Aligned |
| **Medicine number** | Not in v2 row | **15** (औषधि संख्या 15) | Owner-only metadata |
| **Polarity field** | NEGATIVE | Dilution-band Positive/Negative language in §4 potency | **Inventory only** (TGC-C6-003, TGC-C6-009) |

---

## 5. Provisional owner-primary boundary and line-level inventory map

Normalized corpus reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (EHAS2 read-only pointer; not modified in this phase).

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **`MED=C6` header** | **L655** | Transcript pointer (1290 / 3169) | Metadata only |
| **Inner wrapper open** | **L658** | `<user_query>` | Boundary only |
| **Cursor/Database save** | **L660–661** | Developer persistence instruction | **Excluded** — non-clinical |
| **§1–5 clinical sections** | **L663–687** | Philosophy, affinity, disease clusters, potency bands, keyword list header context | **Provisional inventory only** |
| **116k mapping heading** | **L686–687** (§5 workflow framing) | Keyword workflow label | **Excluded** — non-operational |
| **Expert tip (authentic portion)** | **L688** + **L689** through **`Complete Cure) सुनिश्चित करता है।`** | S6+C6 pairing + keyword triggers | **Provisional inventory only** |
| **Agent/workflow tail (same line L689)** | From **` es me jo potency di gai hai…`** through **`ab kam kariye`** | Potency-sort / D-band ladder / save-all instruction | **Rejected contamination** — **zero** clinical authority |
| **Wrapper close** | **L690** | `</user_query>` | Boundary only |
| **Following medicine** | **`MED=C10` L692** | Next canonical block | Not C6 |

**Preceding C5:** closes **L652**; **`MED=C6` L655** — no C5 bleed.

### 5.1 Intra-line split — corpus line L689 (mandatory)

Corpus **line L689** is a **mixed line**. Line number alone does **not** confer clinical authority on the full physical line.

| Segment | Content (summary) | Classification |
|---------|-------------------|----------------|
| **L689-A (included in provisional clinical inventory)** | Expert-tip Hindi ending at **`Complete Cure) सुनिश्चित करता है।`** (S6 function + C6 structure pairing; keyword triggers for Kidney Failure, Albuminuria, PKD, Renal Cyst, Bladder Cancer; system priority language) | Authentic-source **expert-tip inventory only** — **not** cure authorization (TGC-C6-010) |
| **L689-B (excluded)** | Tail beginning **`es me jo potency di gai hai bo sort me hai…`** including agent D1/D2/D3 POSITIVE, D5 NEUTRAL, D10–D500 ladder and “save all information / ab kam kariye” | **Rejected workflow contamination** — **not** owner clinical doctrine; **not** copied into clinical inventory; **not** a potency protocol for EHAS2 |

**MM2 `doctor_notes`:** **contaminated** — ingests the **full** normalized block including **L689-B** and entire wrapper through L690. Treat as **parsed secondary** only; **CF-C6-004** **OPEN**.

---

## 6. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-C6-OWNER** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=C6` **L655** · bounded inventory **L663–687** + expert tip **L688–L689-A** · wrapper **L658–690** · transcript line **1290** | Located · byte proof **pending** |
| **SRC-C6-MM1E-IDX** | Normalized index | `primary_code: C6`, line 1290, len 3169 | Metadata mirror |
| **SRC-C6-MM2** | Parsed owner copy | `S5MM2_MASTER_MATERIA_MEDICA.json` · `PRIMARY_DOCTOR_BLOCK_FOUND` | **Contaminated** `doctor_notes` (agent tail) · title parse truncation · false external route |
| **SRC-C6-MM2C** | Clinical classification | `S5MM2C_CLINICAL_CLASSIFICATION.json` | **`INTERNAL_ONLY`** · mapping **review_required** |
| **SRC-C6-REG-V2** | Registry v2 | `medicines.v2.json` C6 · truncated `when_to_give` | **`DERIVED_UNVERIFIED`** |
| **SRC-C6-LEGACY-DUMP** | Legacy stub | `_electrohomeo_medicines_dump.json` | **`DERIVED_UNVERIFIED`** · Lymphatic label conflict |
| **SRC-C6-MM3** | MM3/BOOK | `S5_MM3_MASTER_MATERIA_MEDICA.json` | **`UNVERIFIED_BOOK_DERIVED_TEXT`** · quarantine |
| **SRC-C6-UCKB** | Parallel | `UCKB_DATASET_v1.json` | **`NOT_ACTIVATED`** · YE/BE/RE + external routes staged |
| **SRC-C6-BUILD** | Tooling | `_build_artifacts.py` C6 row | Lymphatic / creatinine wording — tooling conflict |

---

## 7. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-C6-001** | `OWNER_PRIMARY_LOCATED_WRAPPER_AGENT_TAIL_LINE_689_C10_FOLLOWS_MED692_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-C6-002** | `RULE4_C6_REFERENCE_ZERO_AUTHORITY_IN_OWNER_BLOCK` |
| **TGC-C6-003** | `SEPARATE_TRACKS_NO_C6_POTENCY_DILUTION_AUTHORITY_AGENT_LADDER_REJECTED` |
| **TGC-C6-004** | `RE_ELECTRICITY_COADMINISTRATION_ZERO_AUTHORITY_UCKB_QUARANTINED` |
| **TGC-C6-005** | `DISEASE_INDICATION_MAPPING_ZERO_AUTHORITY` |
| **TGC-C6-006** | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| **TGC-C6-007** | `RULE6_C6_S6_STRUCTURE_FUNCTION_TIP_INVENTORY_ONLY` |
| **TGC-C6-008** | `MM3_BOOK_OCR_QUARANTINE_NO_OWNER_MERGE` |
| **TGC-C6-009** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY` |
| **TGC-C6-010** | `KEYWORD_DEFAULT_PRIORITY_AND_COMPLETE_CURE_LANGUAGE_REJECTED` |

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-C6-001–010** recorded **separately** (count **10**).

---

## 8. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No EOD-C6 table**
- Agent contamination, MM2 ingestion, BOOK/UCKB quarantine, and registry derivations are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 9. High-stakes source claims (inventory only)

Owner-source §3 and expert-tip tokens reference **CKD**, **Bright’s disease**, **PKD**, **kidney tumour/cancer**, **bladder cancer**, **renal failure** keywords, **proteinuria/albuminuria**, **renal colic**, **hematuria**, **renal stones**, and related renal structural disease wording. Preserved as **provisional historical/source inventory** only.

**Explicitly not asserted:**

- **“Complete Cure”** is **historical source wording only** — **no cure authorization**
- No **CKD/renal-failure treatment validation**
- No **cancer-treatment** or **efficacy validation**
- No **prevention** or **prognosis** claim
- No **safety authorization**
- No **potency/dosage authorization** (including owner §4 bands and **rejected** agent D5–D500 ladder)
- No **disease mapping** or **116k** catalog activation
- No **prescription/runtime** activation
- No **emergency-care substitution**

---

## 10. Disease / Indication Mapping Status

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

**Explicitly inactive:** no disease→C6 or symptom→C6 selection; no keyword/default priority; no efficacy approval; no runtime effect (TGC-C6-005, TGC-C6-010).

---

## 11. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

Includes English fields where present; **`when_to_give`** truncated to **"CKD, Bright"** — **defect preserved**; temperament strings referencing S6+C6 — **inventory only**; **no** clinical or selector authority.

---

## 12. MM3 / BOOK quarantine

**TGC-C6-008** — **`UNVERIFIED_BOOK_DERIVED_TEXT`**; **`no_merge_with_owner_primary`**; zero Rule 5, route, potency, disease-mapping, electricity, or runtime credit.

---

## 13. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4** | **TGC-C6-002** — zero in owner C6 block |
| **Potency / dilution** | **TGC-C6-003** — owner §4 inventory only; **agent ladder rejected** |
| **RE / electricity** | **TGC-C6-004** — UCKB YE/BE/RE **quarantined** |
| **Route** | **TGC-C6-006** — none |
| **Rule 6 / S6+C6** | **TGC-C6-007** — **inventory only** |
| **Polarity / temperament** | **TGC-C6-009** — inventory only |
| **Keyword / Complete Cure** | **TGC-C6-010** — rejected |

---

## 14. Rule 5 safety matrix (summary)

**Incomplete / blocked** — contraindications, pregnancy, interactions, monitoring, overdose, emergency exclusions **SOURCE_NOT_FOUND** in bounded owner-primary; BOOK/UCKB **no credit**. **`rule5SafetyCoverageComplete: false`**.

---

## 15. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-C6-001** | **OPEN** — transcript **1290** / len **3169** / byte proof |
| **CF-C6-002** | **OPEN** — index **3169** vs MM3 **3165** |
| **CF-C6-003** | **OPEN** — **agent tail on L689** inside wrapper (**L689-B**) |
| **CF-C6-004** | **OPEN** — MM2 `doctor_notes` ingests full line/block including agent tail |
| **CF-C6-005** | **OPEN** — BOOK vs owner polarity/indications |
| **CF-C6-006** | **OPEN** — BOOK OCR disease flood vs owner §3 |
| **CF-C6-007** | **OPEN** — registry `when_to_give` truncation |
| **CF-C6-008** | **OPEN** — build/dump Lymphatic vs owner renal narrative |
| **CF-C6-009** | **OPEN** — UCKB electricity/external vs silent owner block |
| **CF-C6-010** | **CLOSED** — keyword priority + **Complete Cure** activation **REJECTED** (TGC-C6-010); wording remains inventory |
| **CF-C6-011** | **CLOSED** — MM2 false **external_use** parse **REJECTED**; **`routeAuthority` remains none** |

**No silent reconciliation.**

---

## 16. Missing-evidence register

| ID | Topic | Status |
|----|--------|--------|
| **ME-C6-001** | Transcript byte and declared-length verification | **OPEN** |
| **ME-C6-002** | License, publication, and redistribution provenance | **OPEN** |
| **ME-C6-003** | Owner-primary Rule 5 safety text | **OPEN** |
| **ME-C6-004** | Verified owner-primary route/application evidence | **OPEN** |
| **ME-C6-005** | Verified potency/dosage protocol, ceilings, high-dilution safety (incl. vs agent L689-B) | **OPEN** |
| **ME-C6-006** | MM3/BOOK bibliographic provenance and OCR integrity | **OPEN** |
| **ME-C6-007** | Verified S6/combination/electricity relationship evidence | **OPEN** |

Evidence gaps only — **not** EODs.

---

## 17. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | C6 (11/38) |
| Verdict | `C6_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · **`LOCATED_REVIEWED`** (provisional) |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-C6-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Next canonical medicine (sequence) | **C10** — **not** started or targeted |
| Registry / runtime changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **C6 blocked · L689 intra-line split documented · zero essential owner clinical decisions**
