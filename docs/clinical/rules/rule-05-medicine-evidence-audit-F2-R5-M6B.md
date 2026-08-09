# Rule 5 — R5-M6B Medicine Evidence Audit: F2 (Febrifugo-2)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 17 of 38 |
| **Medicine code** | F2 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `2506afb2ec5ccd2846fe5fe033655effd8379a4c` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `F2_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series occurrence **A** only — single normalized `MED=F2` master block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Canonical sequence** | **F1 → F2 → GE** — **no C16** in v2 38-set |
| **Physical corpus order vs audit order** | After **F2**, corpus continues **`MED=VEN1` L1252** (~L1255) before any **`MED=GE`** block; **no normalized owner `MED=GE`** located in 019c corpus — differs from canonical audit successor **GE** |
| **Registry identity (F2 code in 38-set)** | **VERIFIED** — code `F2` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **NEUTRAL** — metadata only; **not** owner §4 band verification |
| **Owner medicine number** | Owner-only metadata (Febrifugo-2 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only); **no** duplicate normalized `MED=F2` header |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1611** not byte-verified; original jsonl **not located** for byte verification in available read-only trees |
| **Declared transcript length** | **2814** — **OPEN** vs MM3 `doctor_chars: 2810` (4-char delta unresolved) |
| **F2 inner wrapper (occurrence A)** | `<user_query>` opens **L1213** and **closes at L1249** |
| **Physical predecessor (38-set at F2)** | **F1** (inner close **L1207**) — **no F1 bleed** into F2 inventory beyond sequence adjacency |
| **Physical immediate successor** | **`MED=VEN1` L1252** (opens **~L1255**) — **not** canonical audit successor |
| **Canonical audit successor** | **GE** — **not** started or targeted; **no** `MED=GE` owner block found in normalized 019c corpus |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **F2**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate F2, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM3 BOOK/UCKB strings or **developer/API/mock strings** as owner-verified clinical truth.
- Preserves disease/indication **source-tier inventory** with **zero** mapping or selection authority.
- **Documentation completion creates no clinical authority.**
- Does **not** substitute for emergency, neurology, pediatrics, infectious-disease, or standard medical care.

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

## 4. F2 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L1210) | Notes |
|-------|----------------------|--------------------------------------------|--------|
| **Code** | F2 | F2 | 38-set identity **VERIFIED** |
| **Display name** | Febrifugo-2 | FEBRIFUGO-2 (F2) | Spelling variant |
| **Group** | Febrifugo | Febrifugo / sedative–nerve master framing | Aligned at label level |
| **Polarity field** | NEUTRAL | Dilution-band Positive/Negative language in §4 potency | **Inventory only** (TGC-F2-009) |

---

## 5. All `MED=F2` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L1210** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1611** | **2814** | potency, bodyloc, electricity | **`PROVISIONAL_OWNER_PRIMARY`** — **only** normalized owner-session candidate |

**No duplicate `MED=F2` owner block** located in normalized 019c corpus. Developer/API/mock **`MED=F2`** strings (if any elsewhere) are **rejected** as F2 owner materia authority — **not** co-primary.

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **`MED=F2` header** | **L1210** | Transcript pointer (1611 / 2814) | Metadata only |
| **Inner wrapper open** | **L1213** | `<user_query>` | Boundary only |
| **Cursor/Database save** | **L1216–1217** | Developer persistence instruction | **Excluded** — non-clinical |
| **§1–4 clinical sections** | **L1219–1243** | Philosophy, affinity, disease clusters, potency §4 | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L1244–1245** | Keyword workflow label | **Excluded** — non-operational |
| **Expert tip** | **L1246–1247** | F2-over-F1 priority + **F2+S1** sedative wording | **Provisional inventory only** — **no post-tip agent tail** |
| **Wrapper close** | **L1249** | `</user_query>` | Boundary only |
| **Physical predecessor** | **F1** — inner close **L1207** | Prior Febrifugo master block | Adjacency documented; **no F1 bleed** |
| **Physical immediate successor** | **`MED=VEN1` L1252** (~L1255) | Next corpus medicine block | **Not** canonical audit successor **GE** |
| **Canonical audit successor** | **GE** | Index §2 order | **Not** started or targeted |

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-F2-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=F2` **L1210** · bounded **L1219–1243** + expert tip **L1246–1247** · wrapper **L1213–1249** · line **1611** | Located · byte proof **pending** |
| **SRC-F2-MM1E-IDX** | Normalized index | `primary_code: F2` @ 1611 | Aligned mirror · metadata only |
| **SRC-F2-MM2** | Parsed owner copy | `S5MM2_MASTER_MATERIA_MEDICA.json` | **Secondary** · truncated title · route conflict |
| **SRC-F2-MM2C** | Clinical classification | `S5MM2C_CLINICAL_CLASSIFICATION.json` | **`INTERNAL_ONLY`** · ICD examples **`review_required`** |
| **SRC-F2-REG-V2** | Registry v2 | `medicines.v2.json` F2 | **`DERIVED_UNVERIFIED`** · **NEUTRAL** polarity |
| **SRC-F2-LEGACY-DUMP** | Legacy stub | `_electrohomeo_medicines_dump.json` (expected path) | **Not located** — gap **OPEN** |
| **SRC-F2-MM3** | MM3/BOOK | `S5_MM3_MASTER_MATERIA_MEDICA.json` | **`UNVERIFIED_BOOK_DERIVED_TEXT`** · quarantine |
| **SRC-F2-UCKB** | Parallel | `UCKB_DATASET_v1.json` | **`NOT_ACTIVATED`** · external-route/electricity staging only |
| **SRC-F2-DEV-API** | Dev/API/mock | Non-owner strings | **Rejected** — not owner materia authority |

**No derived tier may be merged into owner-primary clinical truth.**

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-F2-001** | `OWNER_PRIMARY_LOCATED_019C_L1210_F1_PREDECESSOR_VEN1_PHYSICAL_SUCCESSOR_GE_CANONICAL_SUCCESSOR_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-F2-002** | `RULE4_F2_REFERENCE_ZERO_AUTHORITY_IN_OWNER_BLOCK` |
| **TGC-F2-003** | `SEPARATE_TRACKS_NO_F2_POTENCY_DILUTION_AUTHORITY_MM3_UCKB_BOOK_D500_AND_TABLET_QUARANTINE` |
| **TGC-F2-004** | `RE_ELECTRICITY_COADMINISTRATION_ZERO_AUTHORITY_UCKB_MM3_F2_WE_BE_RE_YE_STAGING_QUARANTINED` |
| **TGC-F2-005** | `DISEASE_INDICATION_MAPPING_ZERO_AUTHORITY` |
| **TGC-F2-006** | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| **TGC-F2-007** | `RULE6_F2_S1_F1_PRIORITY_TIP_INVENTORY_ONLY` |
| **TGC-F2-008** | `MM3_BOOK_OCR_QUARANTINE_NO_OWNER_MERGE` |
| **TGC-F2-009** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY_REGISTRY_NEUTRAL_VS_OWNER_BANDS_VS_MM3_POSITIVE` |
| **TGC-F2-010** | `KEYWORD_DEFAULT_F2_OVER_F1_CURE_HYSTERIA_CONVULSION_SEDATIVE_GUARANTEE_LANGUAGE_REJECTED` |

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-F2-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No EOD-F2 table**
- Registry/MM2/MM3/UCKB/dev derivations are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry/MM2 where noted):

- **Pediatric convulsions** framing (inventory only)
- **Anxiety, fear, and hysteria** language
- **Mild fever** wording
- **Neuralgia** and **sensitive-patient** wording
- **PMS** and **insomnia** wording
- **Potency §4:** **D1–D3** / **Positive D5** / **D10–D500** dilution bands — inventory only
- **F2-over-F1 priority** language (expert tip region)
- **F2+S1** “safest and most effective” sedative wording — inventory only (TGC-F2-007)
- **Remedy/support keyword tags** (116k region **excluded** from operational authority)

---

## 11. High-stakes source claims (inventory only)

Pediatric convulsions, anxiety/fear/hysteria, mild fever, neuralgia, PMS, insomnia, **F2-over-F1** default priority, **F2+S1** sedative guarantee language, cure/hysteria/convulsion keyword tags, and dilution-band text are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure** authority
- No **efficacy** authority
- No **pediatric safety** authority
- No **convulsion/epilepsy treatment** authority
- No **fever treatment** or **antipyretic** authority
- No **emergency** or **standard-care substitution**
- No **prevention** or **prognosis** claim
- No **potency/dosage authorization** (including **D500** ceiling vs quarantined BOOK/tablet text)
- No **route/electricity authority**
- No **disease mapping** or **116k activation**
- No **selector/default F2-over-F1 activation**
- No **runtime effect**

---

## 12. Disease / Indication Mapping Status

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

**Explicitly inactive:** no 116k mapping; no keyword priority; no F2-over-F1 default selection; no selector activation; no runtime activation (TGC-F2-005, TGC-F2-010).

---

## 13. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

English sedative/nerve/anxiety/neuralgia/fever-adjunct narrative; pediatric and hysteria clusters; **D-band** strings; **F2+S1** pairing hints; remedy/support tags — **inventory only**; **no** clinical or selector authority.

**Legacy dump:** **not located** at audit time — **ME/CF gap** (not silently closed).

---

## 14. MM3 / BOOK quarantine

**TGC-F2-008** — **`UNVERIFIED_BOOK_DERIVED_TEXT`**; **`no_merge_with_owner_primary`**; OCR/tablet/malaria/polarity fragments — **zero** Rule 5, route, potency, disease-mapping, electricity, or runtime credit.

---

## 15. UCKB staging (`NOT_ACTIVATED`)

Hepatobiliary/chronic-fever staging strings vs owner nerve-block pediatric/autonomic narrative — **conflict preserved OPEN** (**CF-F2-005**); external routes and **F2/WE/BE/RE/YE** electricity pairings — **quarantined**; **TGC-F2-004**.

---

## 16. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4** | **TGC-F2-002** — zero Rule 4 medicine reference in owner F2 block **A** |
| **Potency / dilution** | **TGC-F2-003** — owner §4 inventory only (incl. **D500** band text); MM3/UCKB/BOOK bands/tablets **rejected** for authority |
| **RE / electricity** | **TGC-F2-004** — UCKB/MM3 staging **quarantined**; **F2+S1** tips **inventory only** |
| **Route** | **TGC-F2-006** — **`APPLICATION_ROUTE_AUTHORITY_NONE`**; MM2/BOOK/UCKB external claims **rejected** |
| **Rule 6 / F2+S1 / F1-vs-F2 priority** | **TGC-F2-007** — **inventory only**; **no Rule 6 combination edge**; **no runtime relationship** |
| **Polarity / temperament** | **TGC-F2-009** — inventory only |
| **Keyword / F2-over-F1 / cure / hysteria / convulsion / sedative guarantee** | **TGC-F2-010** — rejected |

---

## 17. Rule 5 safety matrix (summary)

| Domain | Status |
|--------|--------|
| Contraindications | **SOURCE_NOT_FOUND** (owner block **A**; BOOK text **no credit**) |
| Allergy / hypersensitivity | **SOURCE_NOT_FOUND** |
| Adverse effects | **SOURCE_NOT_FOUND** |
| Medicine interactions | **SOURCE_NOT_FOUND** |
| Condition interactions | **SOURCE_NOT_FOUND** |
| Pregnancy / lactation / special populations | **SOURCE_NOT_FOUND** |
| Pediatric / geriatric considerations | **SOURCE_NOT_FOUND** |
| Route incompatibility | **SOURCE_NOT_FOUND** (owner route silent) |
| Overdose / exposure | **SOURCE_NOT_FOUND** |
| Duration / cumulative risk | **SOURCE_NOT_FOUND** |
| Monitoring | **SOURCE_NOT_FOUND** |
| Pause/stop criteria | **SOURCE_NOT_FOUND** |
| Emergency / red-flag criteria | **SOURCE_NOT_FOUND** |
| Follow-up timing | **SOURCE_NOT_FOUND** |
| Pediatric convulsion / fever escalation | **SOURCE_NOT_FOUND** (inventory text **not** safety evidence) |
| Anxiety/hysteria psychiatric escalation | **SOURCE_NOT_FOUND** |
| Neuralgia / pain escalation | **SOURCE_NOT_FOUND** |

**Rule 5 safety evidence:** source **not found** across required domains. BOOK/MM3/UCKB: **zero Rule 5 credit**. **`rule5SafetyCoverageComplete: false`**.

---

## 18. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-F2-001** | **OPEN** — transcript **1611** / len **2814** / byte proof; wrapper **L1213–1249** |
| **CF-F2-002** | **OPEN** — **2814** vs MM3 **2810** |
| **CF-F2-003** | **OPEN** — MM2 title truncation |
| **CF-F2-004** | **OPEN** — physical **`MED=VEN1` L1252** successor vs canonical audit successor **GE** |
| **CF-F2-005** | **OPEN** — UCKB organ/fever conflict vs owner pediatric/autonomic nerve narrative |
| **CF-F2-006** | **OPEN** — MM3/BOOK polarity/OCR/tablet/malaria conflict |
| **CF-F2-007** | **OPEN** — MM2/MM2C/owner route conflict |
| **CF-F2-008** | **OPEN** — MM2C/registry ICD **review_required** staging |
| **CF-F2-009** | **OPEN** — **F2+S1** “safest/most effective” wording reconciliation |
| **CF-F2-010** | **OPEN** — missing legacy dump location |
| **CF-F2-011** | **CLOSED** — keyword/default/remedy/sedative activation **REJECTED** (TGC-F2-010); wording remains inventory |
| **CF-F2-012** | **CLOSED** — BOOK/MM3/UCKB **external-route** activation **REJECTED**; **`routeAuthority` remains none** |

**No silent reconciliation.** A **CLOSED** rejection does **not** imply clinical validation.

**Mandatory CF summary:** CF: 001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections only)

---

## 19. Missing-evidence register

| ID | Topic | Status |
|----|--------|--------|
| **ME-F2-001** | Transcript bytes and declared length | **OPEN** |
| **ME-F2-002** | License/publication/redistribution provenance | **OPEN** |
| **ME-F2-003** | Owner-primary Rule 5 safety text | **OPEN** |
| **ME-F2-004** | Verified route/application evidence | **OPEN** |
| **ME-F2-005** | Potency/dosage protocol and D500 ceiling | **OPEN** |
| **ME-F2-006** | MM3/BOOK/UCKB OCR and bibliographic integrity | **OPEN** |
| **ME-F2-007** | F2+S1 and F1-vs-F2 relationship evidence | **OPEN** |
| **ME-F2-008** | Pediatric convulsion/fever/anxiety escalation boundaries | **OPEN** |
| **ME-F2-009** | UCKB hepatobiliary/chronic-fever vs owner nerve-block disambiguation | **OPEN** |
| **ME-F2-010** | Legacy-dump location and source reconciliation | **OPEN** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 20. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | F2 (17/38) |
| Canonical main SHA | `2506afb2ec5ccd2846fe5fe033655effd8379a4c` |
| Verdict | `F2_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only) · **`LOCATED_REVIEWED`** (provisional) |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-F2-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **GE** — **not** started or targeted |
| Registry / runtime changed | **NO** |
| PHI / secrets / database | **NONE** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **F2 blocked · F1→GE sequence documented · VEN1 physical successor noted · zero essential owner clinical decisions**
