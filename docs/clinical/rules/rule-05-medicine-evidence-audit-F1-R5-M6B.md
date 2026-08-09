# Rule 5 — R5-M6B Medicine Evidence Audit: F1 (Febrifugo-1)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 16 of 38 |
| **Medicine code** | F1 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `d02942213f152d5106854684b195799e163c27f3` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `F1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series occurrence **A** only — full Febrifugo-1 master block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Canonical sequence** | **C17 → F1 → F2** — **no C16** in v2 38-set |
| **Physical corpus order vs audit order** | After **C17**, corpus continues **A1, A2, … → P4 → F1**; **not** C17→F1 adjacency — differs from canonical audit order |
| **Registry identity (F1 code in 38-set)** | **VERIFIED** — code `F1` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **NEUTRAL** — metadata only; **not** owner §4 band verification |
| **Owner medicine number** | **28** (औषधि संख्या 28) — owner-only metadata |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only); **no** full provenance or clinical verification claim |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1594** not byte-verified; original jsonl **not located** for byte verification in available read-only trees |
| **Declared transcript length** | **2916** — **OPEN** vs MM3 `doctor_chars: 2912` (4-char delta unresolved) |
| **F1 inner wrapper (occurrence A)** | `<user_query>` opens **L1172** and **closes at L1207** |
| **Physical predecessor (38-set at F1)** | **P4** (closes **L1166**) — **no P4 bleed** into F1 inventory |
| **Physical immediate successor** | **`MED=F2` L1210** (opens **~L1213**) — canonical audit successor **F2** |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **F1**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate F1, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM3 BOOK/UCKB strings or **dev/API/alternate `MED=F1` blocks (B–E)** as owner-verified clinical truth.
- Preserves disease/indication **source-tier inventory** with **zero** mapping or selection authority.
- Does **not** substitute for emergency, infectious-disease, neurology, or standard medical care.

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

## 4. F1 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L1169) | Notes |
|-------|----------------------|--------------------------------------------|--------|
| **Code** | F1 | F1 | 38-set identity **VERIFIED** |
| **Display name** | Febrifugo-1 | FEBRIFUGO-1 (F1) | Spelling variant |
| **Group** | Febrifugo | Febrifugo / nerve + fever master framing | Aligned at label level |
| **Polarity field** | NEUTRAL | Dilution-band Positive/Negative language in §4 potency | **Inventory only** (TGC-F1-009) |

---

## 5. All `MED=F1` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L1169** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1594** | **2916** | potency, bodyloc, electricity | **`PROVISIONAL_OWNER_PRIMARY`** — only canonical full owner-session candidate |
| **B** | L1645 | same 019c | 2417 | 547 | (none) | **Rejected / dev-API** — EH Golden Concept, pain→F1 routing |
| **C** | L1839 | same 019c | 2558 | 769 | (none) | **Rejected / dev-API** — rogi match / summary / 116k training complaint |
| **D** | L1853 | same 019c | 2751 | 1262 | potency | **Rejected / dev-API** — BP tier / multi-disease potency-engine training |
| **E** | L4391 | `c382baf1-fae4-4198-b1e1-a4d5a2b21218\…jsonl` | 529 | 1931 | potency, electricity | **Rejected / alternate-session UI mock** |

**Corpus index** mirrors **A** and also lists **B–E** as `primary_code: F1` — metadata **spurious** for governance; **not** co-primary evidence (**CF-F1-005**).

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **`MED=F1` header** | **L1169** | Transcript pointer (1594 / 2916) | Metadata only |
| **Inner wrapper open** | **L1172** | `<user_query>` | Boundary only |
| **Cursor/Database save** | **L1174–1175** | Developer persistence instruction | **Excluded** — non-clinical |
| **§1–4 clinical sections** | **L1177–1201** | Philosophy, affinity, disease clusters, potency §4 | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L1202–1203** | Keyword workflow label | **Excluded** — non-operational |
| **Expert tip** | **L1204–1205** | Mandatory F1 + nerve principle + **F1+WE** wording | **Provisional inventory only** — **no post-tip agent ladder** |
| **Wrapper close** | **L1207** | `</user_query>` | Boundary only |
| **Physical predecessor** | **P4** — inner close **L1166** | Prior block in corpus walk | **No P4 bleed** (P4 expert tip mentions **P4+F1+BE** — adjacent inventory only) |
| **Physical immediate successor** | **`MED=F2` L1210** (~L1213) | Next Febrifugo master block | Canonical audit successor **F2** — not started / not targeted |

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-F1-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=F1` **L1169** · bounded **L1177–1201** + expert tip **L1204–1205** · wrapper **L1172–1207** · line **1594** | Located · byte proof **pending** |
| **SRC-F1-MM1E-IDX** | Normalized index | `primary_code: F1` @ 1594 + spurious rows @ 2417, 2558, 2751, 529 | Metadata mirror + **conflict** |
| **SRC-F1-MM2** | Parsed owner copy | `S5MM2_MASTER_MATERIA_MEDICA.json` · `PRIMARY_DOCTOR_BLOCK_FOUND` | **Secondary** · title truncation · **`external_use: YES`** (abdomen/spine) · **`electricity_compatibility: RE, WE`** |
| **SRC-F1-MM2C** | Clinical classification | `S5MM2C_CLINICAL_CLASSIFICATION.json` | **`INTERNAL_ONLY`** · **Brain** / **Blood** · ICD samples **review_required** |
| **SRC-F1-REG-V2** | Registry v2 | `medicines.v2.json` F1 | **`DERIVED_UNVERIFIED`** · **NEUTRAL** polarity · **D10–D1000** · **F1+WE universal pain relief** string |
| **SRC-F1-LEGACY-DUMP** | Legacy stub | `_electrohomeo_medicines_dump.json` (expected path) | **Not located** in available EHAS2 read-only search — gap **OPEN** |
| **SRC-F1-MM3** | MM3/BOOK | `S5_MM3_MASTER_MATERIA_MEDICA.json` | **`UNVERIFIED_BOOK_DERIVED_TEXT`** · blood primary · **Positive** polarity · tablet/globule/contraindication — **quarantine** |
| **SRC-F1-UCKB** | Parallel | `UCKB_DATASET_v1.json` | **`NOT_ACTIVATED`** · external compress/massage/bath · **WE/BE/RE** staging |
| **SRC-F1-DEV-B-E** | Dev/API/alternate | Occurrences **B–E** | **Rejected** / non-operational |

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-F1-001** | `OWNER_PRIMARY_LOCATED_019C_L1169_P4_PREDECESSOR_F2_SUCCESSOR_CORPUS_ORDER_VS_CANONICAL_C17_F1_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-F1-002** | `RULE4_F1_REFERENCE_ZERO_AUTHORITY_IN_OWNER_BLOCK` |
| **TGC-F1-003** | `SEPARATE_TRACKS_NO_F1_POTENCY_DILUTION_AUTHORITY_MM3_UCKB_BOOK_D1000_AND_TABLET_QUARANTINE` |
| **TGC-F1-004** | `RE_ELECTRICITY_COADMINISTRATION_ZERO_AUTHORITY_UCKB_MM2_WE_RE_BE_STAGING_QUARANTINED` |
| **TGC-F1-005** | `DISEASE_INDICATION_MAPPING_ZERO_AUTHORITY` |
| **TGC-F1-006** | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| **TGC-F1-007** | `RULE6_F1_WE_RE_S10_P4_BE_COMBINATION_TIP_INVENTORY_ONLY` |
| **TGC-F1-008** | `MM3_BOOK_OCR_QUARANTINE_NO_OWNER_MERGE` |
| **TGC-F1-009** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY_REGISTRY_NEUTRAL_VS_OWNER_BANDS_VS_MM3_POSITIVE` |
| **TGC-F1-010** | `KEYWORD_DEFAULT_MANDATORY_F1_CURE_FEVER_REMEDY_UNIVERSAL_WE_PAIN_LANGUAGE_REJECTED` |

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-F1-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No EOD-F1 table**
- Registry/MM2/MM3/UCKB/dev derivations are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry/MM2 where noted):

- **CNS / peripheral nerves** — brain, spinal cord, body-wide nerves
- **Spleen / Splenico** framing; **vagus nerve**
- **Temperature / fever** master role; **anti-pyretic** nickname (inventory only)
- **Neuralgia** (incl. trigeminal), **sciatica**, **migraine**
- **Insomnia / anxiety / hysteria**; **epilepsy / convulsions**; **tremors** (Parkinson wording)
- **Paralysis** (with **RE** adjacency — inventory only); **gastric headache** (with **S10**)
- **Malaria, typhoid, influenza**, “all fevers”; **splenomegaly**; nerve fever with pain/restlessness
- **Potency §4:** **D1–D5 Positive**; **D10–D1000 Negative** — inventory only
- **Keywords:** Nervous-System-Regulator, Neuralgia-Relief, **Fever-Remedy**, **Sciatica-Cure**, Migraine-Support, **Insomnia-Treatment**, Spleen-Specialist, Anti-Spasmodic
- **Expert tip:** mandatory inclusion on Pain/Fever/Nerves/Migraine/Sciatica; **“जहाँ नस है, वहाँ F1”**; **F1+WE** “very successful” / universal pain-relief wording — **inventory only** (TGC-F1-007, TGC-F1-010)

---

## 11. High-stakes source claims (inventory only)

Fever, malaria, typhoid, influenza, epilepsy, convulsions, paralysis, **Fever-Remedy**, **Sciatica-Cure**, mandatory-F1/default-selection, **F1+WE** universal pain-relief, and anti-pyretic framing are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **fever** or **anti-pyretic validation**
- No **malaria/typhoid/influenza treatment** claim
- No **antimicrobial** or **standard-care substitution**
- No **epilepsy/convulsion efficacy** claim
- No **paralysis recovery** claim
- No **cure**, **universal-relief**, or **guarantee authorization**
- No **emergency-care substitution**
- No **prevention** or **prognosis** claim
- No **safety authorization**
- No **potency/dosage authorization** (including **D1000** band vs quarantined BOOK/tablet text)
- No **automatic disease mapping** or **116k** catalog activation
- No **selector** or **prescription/runtime** activation

---

## 12. Disease / Indication Mapping Status

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

**Explicitly inactive:** no disease→F1 or symptom→F1 selection; no keyword/default/mandatory F1 priority; no MM2C/registry ICD staging authority; no runtime effect (TGC-F1-005, TGC-F1-010).

---

## 13. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

English nerve/fever/spleen/vagus narrative; neuralgia, sciatica, migraine, insomnia, anxiety, epilepsy, hysteria, malaria, typhoid, influenza, splenomegaly, paralysis, tremors; **D1–D5 / D10–D1000**; **all temperaments**; **F1+WE universal pain relief**; cure/remedy tags — **inventory only**; **no** clinical or selector authority.

**Legacy dump:** **not located** at audit time — **ME/CF gap** (not silently closed).

---

## 14. MM3 / BOOK quarantine

**TGC-F1-008** — **`UNVERIFIED_BOOK_DERIVED_TEXT`**; **`no_merge_with_owner_primary`**; **Blood** primary organ, **Positive** polarity, OCR disease table garbage, **tablet/globule** malaria dosing, **contraindication** fragments — **zero** Rule 5, route, potency, disease-mapping, electricity, or runtime credit.

---

## 15. UCKB staging (`NOT_ACTIVATED`)

Fever-regulator narrative, **compress/massage/bath** external routes, and **WE/BE/RE** electricity pairings — **quarantined**; **TGC-F1-004**.

---

## 16. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4** | **TGC-F1-002** — zero Rule 4 medicine reference in owner F1 block **A** |
| **Potency / dilution** | **TGC-F1-003** — owner §4 inventory only (incl. **D1000** band text); MM3/UCKB/BOOK bands/tablets **rejected** for authority |
| **RE / electricity** | **TGC-F1-004** — UCKB/MM2 staging **quarantined**; **F1+WE/RE** tips **inventory only** |
| **Route** | **TGC-F1-006** — none; MM2/BOOK/UCKB external claims **rejected** (CF-F1-013) |
| **Rule 6 / WE, RE, S10, P4+BE** | **TGC-F1-007** — **inventory only** |
| **Polarity / temperament** | **TGC-F1-009** — inventory only |
| **Keyword / mandatory F1 / cure / fever-remedy / universal WE pain** | **TGC-F1-010** — rejected |

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
| Fever/infection escalation | **SOURCE_NOT_FOUND** (fever/malaria text **inventory only**) |
| Seizure/neurological escalation | **SOURCE_NOT_FOUND** |
| Paralysis/stroke differentiation | **SOURCE_NOT_FOUND** |
| Malaria/typhoid diagnostic and referral boundaries | **SOURCE_NOT_FOUND** |

BOOK/OCR/UCKB: **no Rule 5 credit**. **`rule5SafetyCoverageComplete: false`**.

---

## 18. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-F1-001** | **OPEN** — transcript **1594** / len **2916** / byte proof; wrapper **L1172–1207** |
| **CF-F1-002** | **OPEN** — **2916** vs MM3 **2912** |
| **CF-F1-003** | **OPEN** — MM2 title truncation `औषधि संख्या 28: F` |
| **CF-F1-004** | **OPEN** — physical corpus **C17→A1…→P4→F1** vs canonical audit **C17→F1** |
| **CF-F1-005** | **OPEN** — **four** additional `MED=F1` headers (**B–E**) vs single 019c master **A** |
| **CF-F1-006** | **OPEN** — MM3/BOOK organ (**Blood**), **Positive** polarity, OCR vs owner CNS/spleen |
| **CF-F1-007** | **OPEN** — UCKB external routes + electricity vs bounded owner block |
| **CF-F1-008** | **OPEN** — MM2 **`external_use: YES`** (abdomen/spine) vs MM2C **INTERNAL_ONLY** vs silent owner |
| **CF-F1-009** | **OPEN** — MM2C **Brain/Blood** vs owner vagus/spleen emphasis; registry ICD staging **review_required** |
| **CF-F1-010** | **OPEN** — registry **“All temperaments; F1+WE universal pain relief”** vs expert-tip inventory (unverified merge) |
| **CF-F1-011** | **OPEN** — MM3 BOOK **contraindication/tablet/globule** malaria dosing vs absent owner Rule 5 |
| **CF-F1-012** | **CLOSED** — mandatory F1 + **Cure/Fever-Remedy/universal WE pain** default activation **REJECTED** (TGC-F1-010); wording remains inventory |
| **CF-F1-013** | **CLOSED** — BOOK/MM3/UCKB/MM2 **external** route claims **REJECTED**; **`routeAuthority` remains none** |

**No silent reconciliation.**

**Mandatory CF summary:** CF: 001–011 OPEN (11 entries) · 012–013 CLOSED (2 entries; governance rejections only)

---

## 19. Missing-evidence register

| ID | Topic | Status |
|----|--------|--------|
| **ME-F1-001** | Transcript bytes/declared length verification | **OPEN** |
| **ME-F1-002** | License/publication/redistribution provenance | **OPEN** |
| **ME-F1-003** | Owner-primary Rule 5 safety text | **OPEN** |
| **ME-F1-004** | Verified route/application evidence | **OPEN** |
| **ME-F1-005** | Verified potency/dosage protocol and ceilings (incl. **D1000** band) | **OPEN** |
| **ME-F1-006** | MM3/BOOK/UCKB OCR/bibliographic integrity | **OPEN** |
| **ME-F1-007** | Verified **F1+WE/RE/S10** and **P4+F1+BE** / electricity relationships | **OPEN** |
| **ME-F1-008** | Verified fever/malaria/typhoid/infection escalation boundaries | **OPEN** |
| **ME-F1-009** | Verified neurology/seizure/paralysis/stroke differentiation evidence | **OPEN** |
| **ME-F1-010** | Duplicate/dev/alternate **MED=F1** disambiguation and index hygiene | **OPEN** |

Evidence gaps only — **not** EODs.

---

## 20. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | F1 (16/38) |
| Canonical main SHA | `d02942213f152d5106854684b195799e163c27f3` |
| Verdict | `F1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only) · **`LOCATED_REVIEWED`** (provisional) |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-F1-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–011 OPEN (11 entries) · 012–013 CLOSED (2 entries; governance rejections only)** |
| ME | **001–010 OPEN** |
| Next canonical medicine (sequence) | **F2** — **not** started or targeted |
| Registry / runtime changed | **NO** |
| PHI / secrets / database | **NONE** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **F1 blocked · C17→F2 sequence documented · zero essential owner clinical decisions**
