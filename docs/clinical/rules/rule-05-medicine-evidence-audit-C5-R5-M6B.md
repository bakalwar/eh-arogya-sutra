# Rule 5 — R5-M6B Medicine Evidence Audit: C5 (Canceroso-5)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 10 of 38 |
| **Medicine code** | C5 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `d5e9d5d001ee0d8505a5e00a0b178ba483886580` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `C5_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series normalized `MED=C5` corpus block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`) |
| **Registry identity (C5 code in 38-set)** | **VERIFIED** — code `C5` present in v2 registry; **not** owner-source verification |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** only; **no** full provenance or clinical verification claim |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1275** not byte-verified in EHAS2 |
| **Declared transcript length** | **2919** — **OPEN** vs MM3 `doctor_chars: 2915` (4-char delta unresolved) |
| **Upstream corpus segmentation** | **C4 inner `</user_query>` at L610** — **no bleed into C5** |
| **C5 inner wrapper** | C5 `<user_query>` opens **L615** and **closes at L652** before **`MED=C6`** @ **L655** |
| **Duplicate `MED=C5` blocks** | **None found** (single 019c-series tag) |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **C5**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate C5, authorize potency/dosage, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM3 BOOK strings as owner-verified clinical truth.
- Preserves disease/indication **source-tier inventory** with **zero** mapping or selection authority.

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
| `evidenceActivated` | `false` |
| `rule6MedicineRelationshipAuthority` | `NONE` |
| `runtimeAuthorized` | `false` |

---

## 4. C5 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (`MED=C5` 019c @ L613) | Notes |
|-------|----------------------|--------------------------------------|--------|
| **Code** | `C5` | `C5` | 38-set identity **VERIFIED** |
| **Display name** | Canceroso-5 | CANCEROSO-5 (C5) | Spelling variant |
| **Group** | Canceroso | C-Group (Canceroso) / deep tissue–necrosis | Aligned |
| **Medicine number** | Not in v2 row | **14** (औषधि संख्या 14) | Owner-only metadata |
| **Polarity field** | NEGATIVE | Dilution-band Positive/Negative language in §4 potency | **Inventory only** (TGC-C5-003, TGC-C5-009) |

---

## 5. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-C5-OWNER** | **`PROVISIONAL_OWNER_PRIMARY`** | Legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` · `MED=C5` · **L613** header · clinical inventory **L621–650** (§1–5 + C5 expert tip) · inner wrapper **L615–652** · transcript `019c5012-fbb1-4582-a4af-af8484d1bc5f.jsonl` line **1275** | **Located** · byte proof **pending** |
| **SRC-C5-MM1E-IDX** | Normalized index | `_doctor_corpus_index.json` · `primary_code: C5`, line 1275, len 2919 | Metadata mirror |
| **SRC-C5-MM2** | Parsed owner copy | `S5MM2_MASTER_MATERIA_MEDICA.json` · `PRIMARY_DOCTOR_BLOCK_FOUND` | Aligns with 019c pointer · parse defects preserved (e.g. truncated title “14: C”; false external route from “liver” token) |
| **SRC-C5-MM2C** | Clinical classification | `S5MM2C_CLINICAL_CLASSIFICATION.json` | **`INTERNAL_ONLY`** · registry mapping samples **review_required** — inventory only |
| **SRC-C5-REG-V2** | Registry v2 | `medicines.v2.json` C5 object | **DERIVED_UNVERIFIED** (e.g. melanoma/lymphoma cluster expansions) |
| **SRC-C5-LEGACY-DUMP** | Legacy stub | `_electrohomeo_medicines_dump.json` | **DERIVED_UNVERIFIED** · biliary/portal labels |
| **SRC-C5-MM3** | MM3/BOOK | `S5_MM3_MASTER_MATERIA_MEDICA.json` | **`UNVERIFIED_BOOK_DERIVED_TEXT`** · quarantine |
| **SRC-C5-UCKB** | Parallel | `UCKB_DATASET_v1.json` | **NOT_ACTIVATED** · external/electricity staging not owner-anchored in C5 block |
| **SRC-C5-BUILD** | Tooling metadata | `_build_artifacts.py` C5 row (“Anti-Cancer Tissue / Ulcer”, Biliary/Mixed) | **Tooling conflict** vs owner deep-necrosis narrative — **no clinical authority** |
| **SRC-C5-DEV-APP** | Developer selector | `MED=APP` corpus `EH_Medicine_Engine` Ulcer/Cancer → **C5** | **Rejected developer fragment** |
| **SRC-C5-DEV-RX** | Prescription fragment | Distant corpus `S5 + C5 + F2 + RE` dev string | **Quarantined** — outside `MED=C5` block |

### 5.1 Provisional owner-primary anchor (019c series)

- Normalized corpus contains a **single** `MED=C5` master block (Canceroso-5 / deep tissue restorer narrative).
- **Clinical inventory boundary:** sections **1–5** and **C5 expert tip** only (**L621–650**); Cursor/Database save lines (**L617–618**) and **116k DB Mapping** keyword workflow (**L647–648**, expert-tip mandatory inclusion language) are **non-operational inventory**.
- **Preceding C4** closes **L610**; **following `MED=C6`** begins **L655** — **no** second `MED=C5`.
- **C6 agent/workflow tail** (potency-sort instruction after C6 expert tip) is **not** attributed to C5.
- **Transcript jsonl** is **not** byte-verified in EHAS2 for line **1275**.
- **No** claim of full provenance verification, license sign-off, or clinical validation.

---

## 6. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

These are **EHAS2 documentation governance tokens** — **not** owner clinical question IDs and **not** counted in **`RECORDED_0`**.

| ID | Token |
|----|--------|
| **TGC-C5-001** | `OWNER_PRIMARY_LOCATED_CORPUS_CLEAN_WRAPPER_C4_CLOSES_L610_C6_STARTS_L655_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-C5-002** | `RULE4_C5_REFERENCE_ZERO_AUTHORITY_IN_OWNER_BLOCK` |
| **TGC-C5-003** | `SEPARATE_TRACKS_NO_C5_POTENCY_DILUTION_AUTHORITY` |
| **TGC-C5-004** | `RE_AND_ELECTRICITY_COADMINISTRATION_ZERO_AUTHORITY_UCKB_QUARANTINED` |
| **TGC-C5-005** | `DISEASE_INDICATION_MAPPING_ZERO_AUTHORITY` |
| **TGC-C5-006** | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| **TGC-C5-007** | `RULE6_C5_VEN1_L1_TIP_INVENTORY_ONLY` |
| **TGC-C5-008** | `MM3_BOOK_OCR_QUARANTINE_NO_OWNER_MERGE` |
| **TGC-C5-009** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY` |
| **TGC-C5-010** | `KEYWORD_DEFAULT_MANDATORY_SELECTION_REJECTED` |

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions recorded; **TGC-C5-001–010** recorded **separately** (count **10**); **no** clinical authority created. **Do not use `PENDING`, `RECORDED_6`, `RECORDED_10`, or `RECORDED_16`.**

---

## 7. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- Fail-closed technical classifications (provisional primary integrity, transcript/length gaps, MM2 parse defects, build/dump mis-labels, APP engine selector, BOOK/UCKB quarantine, keyword rejection, route/electricity rejection) are recorded under **TGC** and **conflict/missing-evidence registers** — **not** as owner clinical approval questions.
- **Ven1+L1** expert-tip wording and **S5/C5** function/structure contrast remain **authentic-source inventory** only — **no** Rule 6 edge, **no** combination authority, **no** pairing authorization, **no** runtime effect.
- **No EOD-C5 table** — do not ask the owner to approve derived or quarantined material.

---

## 8. High-stakes source claims (inventory only)

Owner-source wording in the provisional primary block references **cancer**, **malignancy**, **gangrene**, **leprosy**, **tuberculosis** tissue loss, **liver cirrhosis/cancer**, **chronic/deep ulcers**, **osteomyelitis**, **severe osteoarthritis**, and related conditions. These are preserved as **historical/provisional source claims** only.

**Explicitly not asserted by this audit record:**

- No **cancer-treatment validation**
- No **anti-cancer efficacy approval**
- No **infection-treatment efficacy approval**
- No **leprosy** or **tuberculosis treatment validation**
- No **cure**, **prevention**, **prognosis**, or **safety claim**
- No **disease→C5 clinical mapping**
- No **automatic prescription** or **runtime selection**
- No **high-potency clinical authorization** (including D30–D1000 bands in owner text)

---

## 9. Disease / Indication Mapping Status

Source-tier inventory preserved for traceability:

| Tier | C5 content (summary) | Authority/posture |
|------|----------------------|-------------------|
| **Owner 019c (provisional)** | Deep tissue anti-necrosis philosophy; liver/skin/muscle/marrow/glands; malignant/necrotic, liver, ulcer, bone/joint clusters; potency bands; keywords; expert tip (**Ven1+L1** inventory wording) | Provisional traceable inventory; not clinically validated |
| **Registry/engine** | English mirror + **`DERIVED_UNVERIFIED`** additions (e.g. melanoma, lymphoma in clusters) | No clinical authority |
| **MM2 parsed** | Section 3 + keywords + tip; title/route parse defects | Secondary inventory only |
| **MM3/BOOK** | OCR disease flood; external route prose; polarity **Positive** vs owner dual-band | **`UNVERIFIED_BOOK_DERIVED_TEXT`**; quarantined |
| **UCKB** | External routes + **GE/RE/BE** electricity staging | **`NOT_ACTIVATED`**; zero Rule 5 credit |
| **Developer tier** | APP Ulcer/Cancer→C5; `_build_artifacts.py` biliary/portal; distant `S5+C5+F2+RE`; 116k priority/mandatory language | Rejected/quarantined; no selector authority |

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

**Explicitly inactive:** no disease→C5 selection; no symptom→C5 selection; no keyword/default priority; no efficacy approval; no mapping into the **116k** disease catalog; no runtime or prescription effect (TGC-C5-005, TGC-C5-010).

---

## 10. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

Includes English `when_to_give`, `disease_clusters`, `potency_logic`, `temperament_affinity`, `search_tags`, and cross-medicine expert-tip strings on **GE/L1/P2/Ven1** rows referencing C5. **No** clinical or selector authority.

---

## 11. MM3 / BOOK quarantine

**TGC-C5-008** — **`UNVERIFIED_BOOK_DERIVED_TEXT`**; inventory only; **`no_merge_with_owner_primary`**; zero Rule 5, route, potency, disease-mapping, combination, or runtime credit.

---

## 12. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4 / mandatory formulas** | **TGC-C5-002** — zero authority in owner C5 block |
| **Potency / dilution** | **TGC-C5-003** — no potency/dosage authority |
| **RE / electricity co-administration** | **TGC-C5-004** — zero C5-specific enforcement; UCKB/GE strings **quarantined** |
| **Route / application** | **TGC-C5-006** — none; BOOK/UCKB external methods **rejected** |
| **Rule 6 / pairs** | **TGC-C5-007** — none; **Ven1+L1** tip **inventory only**; **S5/C5** contrast **doctrine inventory only** |
| **Polarity / temperament** | **TGC-C5-009** — inventory only |
| **Keyword / default selection** | **TGC-C5-010** — rejected |

---

## 13. Rule 5 safety matrix (summary)

**Incomplete / blocked** — contraindications, pregnancy, interactions, monitoring, overdose, and emergency exclusions largely **SOURCE_NOT_FOUND** in owner-primary; BOOK/UCKB rows quarantined or not activated. **`rule5SafetyCoverageComplete: false`**.

---

## 14. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-C5-001** | **OPEN** — transcript line **1275** / len **2919** / byte proof |
| **CF-C5-002** | **OPEN** — length metadata index **2919** vs MM3 doctor **2915** |
| **CF-C5-003** | **OPEN** — MM2 identity parse truncation (“औषधि संख्या 14: C”) |
| **CF-C5-004** | **CLOSED** — MM2 false **external route** parse from organ token “liver” **REJECTED**; **`routeAuthority` remains none** |
| **CF-C5-005** | **OPEN** — BOOK vs owner polarity/indications (quarantine) |
| **CF-C5-006** | **OPEN** — BOOK OCR disease flood vs owner §3 |
| **CF-C5-007** | **OPEN** — build/dump biliary/portal labels vs owner deep-necrosis narrative |
| **CF-C5-008** | **OPEN** — registry cluster expansion (melanoma/lymphoma etc.) vs owner enum |
| **CF-C5-009** | **OPEN** — UCKB electricity/external routes vs silent owner C5 block |
| **CF-C5-010** | **CLOSED** — keyword/default **mandatory selection** **REJECTED_BY_EXISTING_GOVERNANCE** (TGC-C5-010); historical wording remains inventory |

**No silent reconciliation or derived-source promotion.**

---

## 15. Missing-evidence register

| ID | Topic | Status |
|----|--------|--------|
| **ME-C5-001** | Transcript byte and declared-length verification | **OPEN** |
| **ME-C5-002** | License, publication, and redistribution provenance | **OPEN** |
| **ME-C5-003** | Owner-primary Rule 5 safety text (contraindications, pregnancy, interactions, monitoring, overdose, emergency exclusions) | **OPEN** |
| **ME-C5-004** | Verified owner-primary route/application evidence | **OPEN** |
| **ME-C5-005** | Verified owner-primary potency/dosage protocol, ceilings, and high-dilution safety | **OPEN** |
| **ME-C5-006** | MM3/BOOK bibliographic provenance and OCR integrity sufficient to lift quarantine | **OPEN** |
| **ME-C5-007** | Verified owner-primary clinical relationship/compatibility evidence for Ven1, L1, S5, and electricity references | **OPEN** |

These are **evidence gaps**, not new owner clinical questions. **No EODs** created from this register.

---

## 16. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | C5 (10/38) |
| Verdict | `C5_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · **`LOCATED_REVIEWED`** (index, provisional qualification) |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE** (**count 0** · index **`RECORDED_0`**) |
| Technical governance classifications | **TGC-C5-001–010** · **count 10** (separate from owner-decision column) |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Next canonical medicine (sequence) | **C6** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **C5 blocked · provisional primary · zero essential owner clinical decisions · no clinical or selector authority**
