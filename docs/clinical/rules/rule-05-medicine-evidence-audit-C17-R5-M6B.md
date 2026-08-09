# Rule 5 — R5-M6B Medicine Evidence Audit: C17 (Canceroso-17)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 15 of 38 |
| **Medicine code** | C17 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `b61c2489a3c344b543879d5244a6051149ac5df4` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `C17_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series normalized single `MED=C17` corpus block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Canonical sequence** | **C15 → C17 → F1** — **no C16** in v2 38-set |
| **Physical corpus order after C17** | Continues **A1, A2, …** before first primary-series **`MED=F1`** (~**L1169**) — differs from canonical audit order |
| **Registry identity (C17 code in 38-set)** | **VERIFIED** — code `C17` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **NEGATIVE** — metadata only; **not** owner §4 band verification |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** only; **no** full provenance or clinical verification claim |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1396** not byte-verified; original jsonl **not located** for byte verification in available read-only trees |
| **Declared transcript length** | **2822** — **OPEN** vs MM3 `doctor_chars: 2818` (4-char delta unresolved) |
| **C17 inner wrapper** | C17 `<user_query>` opens **L851** and **closes at L884** |
| **Canonical predecessor** | **C15** (closes **L845**) — **no** physical interstitial between C15 and C17; **no C15 bleed** |
| **Physical immediate successor** | **`MED=A1` L886** (opens **~L891**) — not the canonical audit successor |
| **Canonical audit successor** | **F1** — first authentic **`MED=F1`** in normalized 019c walk **~L1169** (dev/API/alternate `MED=F1` tags rejected) |
| **Duplicate `MED=C17` blocks** | **None found** (single normalized tag at **L848**) |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **C17**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate C17, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM3 BOOK/UCKB strings as owner-verified clinical truth.
- Preserves disease/indication **source-tier inventory** with **zero** mapping or selection authority.
- Does **not** substitute for emergency, urology, infectious-disease, or specialist medical care.

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

## 4. C17 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (`MED=C17` 019c @ L848) | Notes |
|-------|----------------------|----------------------------------------|--------|
| **Code** | C17 | C17 | 38-set identity **VERIFIED** |
| **Display name** | Canceroso-17 | CANCEROSO-17 (C17) | Spelling variant |
| **Group** | Canceroso | C-Group / excretory-opening mucosa framing | Aligned at label level |
| **Medicine number** | Not in v2 row | **20** (औषधि संख्या 20) | Owner-only metadata |
| **Polarity field** | NEGATIVE | Dilution-band Positive/Negative language in §4 potency | **Inventory only** (TGC-C17-009) |

---

## 5. Provisional owner-primary boundary and line-level inventory map

Normalized corpus reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (EHAS2 read-only pointer; not modified in this phase).

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **`MED=C17` header** | **L848** | Transcript pointer (1396 / 2822) | Metadata only |
| **Inner wrapper open** | **L851** | `<user_query>` | Boundary only |
| **Cursor/Database save** | **L853–854** | Developer persistence instruction | **Excluded** — non-clinical |
| **§1–4 clinical sections** | **L857–878** | Philosophy, affinity, disease clusters, potency §4 | **Provisional inventory only** |
| **116k mapping heading + tags** | **L879–880** (§5 workflow framing) | Keyword workflow label | **Excluded** — non-operational |
| **Expert tip** | **L881–882** | Keyword priority + **C17 + A2 + S6** + surgery-avoidance wording | **Provisional inventory only** — **no post-tip agent ladder** |
| **Wrapper close** | **L884** | `</user_query>` | Boundary only — **not** a second C17 block |
| **Canonical predecessor** | **C15** — inner close **L845** | Prior completed audit sequence | **No C15 bleed** into C17 inventory |
| **Physical interstitial** | **None** between C15 and C17 | — | — |
| **Physical immediate successor** | **`MED=A1` L886** (~L891) | Corpus walk continues A-series before F1 | **Not** canonical audit successor |
| **Canonical audit successor** | **F1** (~L1169 first primary `MED=F1`) | Next audit-sequence medicine | **Not started / not targeted** |

**Mock/API corpus references** (e.g. remedy arrays, alternate `MED=F1` tags elsewhere) are **not** C17 owner-primary blocks.

---

## 6. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-C17-OWNER** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=C17` **L848** · bounded inventory **L857–878** + expert tip **L881–882** · wrapper **L851–884** · transcript line **1396** | Located · byte proof **pending** |
| **SRC-C17-MM1E-IDX** | Normalized index | `primary_code: C17`, line 1396, len 2822 | Metadata mirror |
| **SRC-C17-MM2** | Parsed owner copy | `S5MM2_MASTER_MATERIA_MEDICA.json` · `PRIMARY_DOCTOR_BLOCK_FOUND` | **Secondary** parsed inventory · title truncation · **`external_use: YES` / kidney** vs silent owner |
| **SRC-C17-MM2C** | Clinical classification | `S5MM2C_CLINICAL_CLASSIFICATION.json` | **`INTERNAL_ONLY`** · **Muscles** primary organ vs owner urethral/rectal affinity |
| **SRC-C17-REG-V2** | Registry v2 | `medicines.v2.json` C17 | **`DERIVED_UNVERIFIED`** · adds **bedwetting/enuresis** vs owner incontinence emphasis |
| **SRC-C17-LEGACY-DUMP** | Legacy stub | `_electrohomeo_medicines_dump.json` | **Derived/conflicting** — mucosal ulcer/erosion narrative |
| **SRC-C17-MM3** | MM3/BOOK | `S5_MM3_MASTER_MATERIA_MEDICA.json` | **`UNVERIFIED_BOOK_DERIVED_TEXT`** · quarantine |
| **SRC-C17-UCKB** | Parallel | `UCKB_DATASET_v1.json` | **`NOT_ACTIVATED`** · urogenital/prostate/gonorrhea-sequelae + external routes + **BE** electricity staged |
| **SRC-C17-DEV-API** | Developer/API mock | Normalized corpus remedy-list / alternate F1 fragments | **Rejected** / non-operational |

---

## 7. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-C17-001** | `OWNER_PRIMARY_LOCATED_WRAPPER_C15_PREDECESSOR_A1_PHYSICAL_INTERSTITIAL_F1_CANONICAL_SUCCESSOR_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-C17-002** | `RULE4_C17_REFERENCE_ZERO_AUTHORITY_IN_OWNER_BLOCK` |
| **TGC-C17-003** | `SEPARATE_TRACKS_NO_C17_POTENCY_DILUTION_AUTHORITY_MM3_UCKB_BOOK_D500_BAND_CONFLICT` |
| **TGC-C17-004** | `RE_ELECTRICITY_COADMINISTRATION_ZERO_AUTHORITY_UCKB_QUARANTINED` |
| **TGC-C17-005** | `DISEASE_INDICATION_MAPPING_ZERO_AUTHORITY` |
| **TGC-C17-006** | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| **TGC-C17-007** | `RULE6_C17_A2_S6_VEN1_COMBINATION_TIP_INVENTORY_ONLY` |
| **TGC-C17-008** | `MM3_BOOK_OCR_QUARANTINE_NO_OWNER_MERGE` |
| **TGC-C17-009** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY` |
| **TGC-C17-010** | `KEYWORD_DEFAULT_PRIORITY_CURE_HEALER_AND_SURGERY_AVOIDANCE_LANGUAGE_REJECTED` |

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-C17-001–010** recorded **separately** (count **10**).

---

## 8. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No EOD-C17 table**
- Registry/MM2/MM3/UCKB/dev derivations are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 9. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded owner-primary (and mirrored registry/MM2 where noted):

- **Urethra and urinary sphincters**
- **Hemorrhoidal veins**
- **Rectal/anal mucosa**
- **Urethral stricture**
- **Urethritis**
- **Incontinence**
- **Prostate pressure** wording (on urethra)
- **Piles/hemorrhoids**
- **Anal wounds/ulcers**
- **Rectal prolapse**
- **Gonorrhea with Ven1**
- **Pyuria**
- **Potency §4:** **D1–D3 + D5 NEUTRAL** low band; **D10–D500** high band — inventory only
- **A2 + S6** supplementary wording in §1 adjacency
- **Keywords:** **Urethritis-Cure**, **Excretory-Path-Healer**, etc.
- **Expert tip:** **C17 priority** + **C17 + A2 + S6** + surgery-avoidance / **“surgery की नौबत नहीं”** — **inventory only** (TGC-C17-007, TGC-C17-010)

---

## 10. High-stakes source claims (inventory only)

Owner §3, §5 keyword tokens (**Urethritis-Cure**, **Healer**, gonorrhea/Ven1, stricture, incontinence, piles, pyuria), expert-tip **C17 + A2 + S6** and **surgery-avoidance** language, and quarantined BOOK/UCKB STD/prostate/external-route tokens are preserved as **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure validation**
- No **gonorrhea/STD efficacy** claim
- No **antibiotic**, **urology**, or **surgery substitution**
- No **surgery-avoidance authorization**
- No **prevention** or **prognosis** claim
- No **emergency-care substitution**
- No **safety authorization**
- No **potency/dosage authorization** (including owner §4 **D10–D500** bands vs registry **D10–D200** conflict)
- No **automatic disease mapping** or **116k** catalog activation
- No **selector** or **prescription/runtime** activation

---

## 11. Disease / Indication Mapping Status

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

**Explicitly inactive:** no disease→C17 or symptom→C17 selection; no keyword/default priority; no MM2C/registry ICD staging authority; no runtime effect (TGC-C17-005, TGC-C17-010).

---

## 12. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

English urethra/sphincter/hemorrhoidal/rectal narrative, stricture/urethritis/incontinence/enuresis/bedwetting, pyuria, gonorrhea/Ven1, hemorrhoids, anal ulcer, prolapse; potency_logic (**D10–D200** high band vs owner **D500** mention); temperament **C17 + A2 + S6** / surgery-avoidance strings; **Urethritis-Cure**, **Excretory-Path-Healer** tags — **inventory only**; **no** clinical or selector authority.

**Legacy dump conflict:** mucosal ulcer / erosion narrative **conflicts** owner excretory-path story (**CF-C17-005**).

---

## 13. MM3 / BOOK quarantine

**TGC-C17-008** — **`UNVERIFIED_BOOK_DERIVED_TEXT`**; **`no_merge_with_owner_primary`**; kidney/urinary primary organ, **Positive** polarity, OCR/table garbage indications, ointment/bath/compress/tablet external routes — **zero** Rule 5, route, potency, disease-mapping, electricity, or runtime credit.

---

## 14. UCKB staging (`NOT_ACTIVATED`)

Chronic urogenital/prostate/gonorrhea-sequelae framing, sitz/compress/wash external routes, and **BE** electricity pairings — **quarantined**; **TGC-C17-004**.

---

## 15. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4** | **TGC-C17-002** — zero Rule 4 medicine reference in owner C17 block |
| **Potency / dilution** | **TGC-C17-003** — owner §4 inventory only (incl. **D500** band text); MM3/UCKB/registry bands **rejected** for authority |
| **RE / electricity** | **TGC-C17-004** — UCKB **quarantined** |
| **Route** | **TGC-C17-006** — none; MM2/BOOK/UCKB external claims **rejected** (CF-C17-012) |
| **Rule 6 / A2 + S6 + Ven1** | **TGC-C17-007** — **inventory only** |
| **Polarity / temperament** | **TGC-C17-009** — inventory only |
| **Keyword / cure / healer / surgery-avoidance priority** | **TGC-C17-010** — rejected |

---

## 16. Rule 5 safety matrix (summary)

| Domain | Status |
|--------|--------|
| Contraindications | **SOURCE_NOT_FOUND** |
| Allergy / hypersensitivity | **SOURCE_NOT_FOUND** |
| Adverse effects | **SOURCE_NOT_FOUND** |
| Medicine interactions | **SOURCE_NOT_FOUND** |
| Condition interactions | **SOURCE_NOT_FOUND** |
| Pregnancy / lactation / special populations | **SOURCE_NOT_FOUND** |
| Route incompatibility | **SOURCE_NOT_FOUND** (owner route silent) |
| Overdose / exposure | **SOURCE_NOT_FOUND** |
| Duration / cumulative risk | **SOURCE_NOT_FOUND** |
| Monitoring | **SOURCE_NOT_FOUND** |
| Pause/stop criteria | **SOURCE_NOT_FOUND** |
| Emergency / red-flag criteria | **SOURCE_NOT_FOUND** |
| Follow-up timing | **SOURCE_NOT_FOUND** |
| Infection/STD escalation and diagnostic boundaries | **SOURCE_NOT_FOUND** (gonorrhea text **inventory only**) |
| Urinary obstruction/retention and bleeding red flags | **SOURCE_NOT_FOUND** |

BOOK/OCR/UCKB: **no Rule 5 credit**. **`rule5SafetyCoverageComplete: false`**.

---

## 17. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-C17-001** | **OPEN** — transcript **1396** / len **2822** / byte proof; wrapper **L851–884** |
| **CF-C17-002** | **OPEN** — index **2822** vs MM3 **2818** |
| **CF-C17-003** | **OPEN** — MM2 title truncation `औषधि संख्या 20: C` |
| **CF-C17-004** | **OPEN** — **physical successor `MED=A1` L886** vs **canonical audit successor F1** (~L1169); corpus walk ≠ index audit order |
| **CF-C17-005** | **OPEN** — legacy dump **mucosal ulcer/erosion** vs owner urethral–rectal narrative |
| **CF-C17-006** | **OPEN** — MM3/BOOK organ/polarity/OCR disease table vs owner §3 |
| **CF-C17-007** | **OPEN** — UCKB chronic urogenital/prostate/gonorrhea sequelae vs bounded owner |
| **CF-C17-008** | **OPEN** — MM2 **`external_use: YES` (kidney)** vs MM2C **INTERNAL_ONLY** vs silent owner route |
| **CF-C17-009** | **OPEN** — MM2C **Muscles** primary organ vs owner urethra/sphincter/rectal veins; registry ICD staging **review_required** |
| **CF-C17-010** | **OPEN** — owner **D10–D500** vs registry **D10–D200** high band |
| **CF-C17-011** | **CLOSED** — keyword priority + **Cure/Healer** tags + **surgery-avoidance** activation **REJECTED** (TGC-C17-010); wording remains inventory |
| **CF-C17-012** | **CLOSED** — BOOK/MM3/UCKB/MM2 **external** route claims **REJECTED**; **`routeAuthority` remains none** |

**No silent reconciliation.**

**Mandatory CF summary:** CF: 001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections only)

---

## 18. Missing-evidence register

| ID | Topic | Status |
|----|--------|--------|
| **ME-C17-001** | Transcript bytes/declared length verification | **OPEN** |
| **ME-C17-002** | License/publication/redistribution provenance | **OPEN** |
| **ME-C17-003** | Owner-primary Rule 5 safety text | **OPEN** |
| **ME-C17-004** | Verified route/application evidence | **OPEN** |
| **ME-C17-005** | Verified potency/dosage protocol and ceilings (incl. D500 vs registry) | **OPEN** |
| **ME-C17-006** | MM3/BOOK/UCKB OCR/bibliographic integrity | **OPEN** |
| **ME-C17-007** | Verified A2+S6, Ven1 and electricity relationships | **OPEN** |
| **ME-C17-008** | Verified infection/STD escalation and surgery-avoidance boundaries | **OPEN** |

Evidence gaps only — **not** EODs.

---

## 19. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | C17 (15/38) |
| Canonical main SHA | `b61c2489a3c344b543879d5244a6051149ac5df4` |
| Verdict | `C17_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · **`LOCATED_REVIEWED`** (provisional) |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-C17-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections only)** |
| ME | **001–008 OPEN** |
| Next canonical medicine (sequence) | **F1** — **not** started or targeted |
| Registry / runtime changed | **NO** |
| PHI / secrets / database | **NONE** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **C17 blocked · C15→F1 sequence documented · zero essential owner clinical decisions**
