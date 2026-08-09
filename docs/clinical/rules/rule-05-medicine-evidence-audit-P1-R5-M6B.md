# Rule 5 — R5-M6B Medicine Evidence Audit: P1 (Pectorals-1)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 20 of 38 |
| **Medicine code** | P1 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `c43aa5c034b6a101cb7752a4a253ccf19cf739b1` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `P1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series occurrence **A** only — single normalized `MED=P1` master block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Canonical sequence** | **L1 → P1 → P2** |
| **Physical corpus order vs audit order** | **`MED=P1` L1013** precedes **`MED=L1` L1336** in normalized 019c walk; **`MED=P2` L1053** is physically adjacent after P1 — differs from canonical **L1→P1** predecessor adjacency |
| **Registry identity (P1 code in 38-set)** | **VERIFIED** — code `P1` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **POSITIVE** — metadata only; **not** owner §4 band verification |
| **Owner medicine number** | Owner-only metadata (**24** — PECTORALS-1 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only); **no** duplicate normalized `MED=P1` header |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1477** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length** | **2774** — **OPEN**; MM3 `doctor_chars` **not located** for P1 in available trees |
| **P1 inner wrapper (occurrence A)** | `<user_query>` opens **L1016** and **closes at L1050** |
| **Physical predecessor (38-set at P1)** | **`MED=A3` L972** (inner close **L1010**) |
| **Physical immediate successor** | **`MED=P2` L1053** — **matches** canonical audit successor **P2** |
| **Canonical audit predecessor** | **L1** — **`MED=L1` L1336** physically **after** P1 in file walk |
| **Canonical audit successor** | **P2** — **not** started or targeted |
| **Duplicate owner-primary P1 block** | **None** — negative search **`^MED=P1`** → **one** match |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **P1**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate P1, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM2/MM3/BOOK/UCKB strings or **developer/API/mock strings** as owner-verified clinical truth.
- Preserves disease/indication **source-tier inventory** with **zero** mapping or selection authority.
- **Documentation completion creates no clinical authority.**
- Does **not** substitute for pulmonology, infectious-disease, oncology, emergency, pediatric, or standard medical care.

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

## 4. P1 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L1013) | Notes |
|-------|----------------------|--------------------------------------------|--------|
| **Code** | P1 | P1 | 38-set identity **VERIFIED** |
| **Display name** | Pettorale-1 | PECTORALS-1 (P1) / Pectorals-1 | Spelling/group variant **OPEN** (CF-P1-004) |
| **Group** | Pettorale | P-Group / Pectorals respiratory master | Label-level alignment only |
| **Polarity field** | POSITIVE | §4 **Positive / Neutral / Negative** dilution bands | **Inventory only** (TGC-P1-009) |

---

## 5. All `MED=P1` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L1013** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1477** | **2774** | potency, bodyloc | **`PROVISIONAL_OWNER_PRIMARY`** — **only** normalized owner-session candidate |

**Negative search:** pattern **`^MED=P1`** → **count 1** (entire normalized corpus file).

Developer/API/mock **P1** strings elsewhere in corpus (selectors, disease maps, mixture enums, API lists) are **rejected** as P1 owner materia authority — **not** co-primary (**CF-P1-007**).

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **`MED=P1` header** | **L1013** | Transcript pointer (1477 / 2774) | Metadata only |
| **Inner wrapper open** | **L1016** | `<user_query>` | Boundary only |
| **Cursor/Database save** | **L1018–1019** | Developer persistence instruction | **Excluded** — non-clinical |
| **§1 philosophy** | **L1021–1022** | Core philosophy | **Provisional inventory only** |
| **§2 affinity** | **L1023–1027** | Affinity | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L1028–1042** | Clinical/disease inventory | **Provisional inventory only** |
| **§4 potency** | **L1043–1045** | Potency / dilution bands | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L1046–1047** | Keyword workflow label | **Excluded** — non-operational |
| **Expert tip** | **L1048–1049** | Mandatory mixture inclusion + **S1+P1** pediatric cough wording | **Provisional inventory only** — **no post-tip agent tail** |
| **Wrapper close** | **L1050** | `</user_query>` | Boundary only |
| **Physical predecessor** | **A3** — close **L1010** | Prior A3 master block | Adjacency only |
| **Physical immediate successor** | **`MED=P2` L1053** | Next P-group block | **Matches** canonical successor **P2** |
| **Canonical audit predecessor** | **L1** | Index §2 order · **L1336** physically later | **Not adjacent** |
| **Canonical audit successor** | **P2** | Index §2 order | **Not** started or targeted |

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-P1-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=P1` **L1013** · bounded **L1021–1045** + expert tip **L1048–1049** · wrapper **L1016–1050** · line **1477** | Located · byte proof **pending** |
| **SRC-P1-MM1E-IDX** | Normalized index | jsonl **1477** / len **2774** | Aligned mirror · metadata only |
| **SRC-P1-REG-V2** | Registry v2 | `medicines.v2.json` **P1** | **`DERIVED_UNVERIFIED`** |
| **SRC-P1-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-P1-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **P1** (if present) | **Derived-unverified mirror** |
| **SRC-P1-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive P1 tier review |
| **SRC-P1-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive P1 tier review |
| **SRC-P1-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive P1 tier review |
| **SRC-P1-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone P1 tier review |
| **SRC-P1-LEGACY-DUMP** | Legacy stub | Expected dump path | **`NOT_LOCATED`** — gap **OPEN** |
| **SRC-P1-DEV-API** | Dev/API/mock | Selector/mixture/routing strings in corpus | **Rejected** — not owner materia authority |
| **SRC-P1-CROSS-P2** | Adjacent owner block | P2 **L1063** P1-vs-P2 depth narrative | **Quarantined inventory only** — not P1 block authority |

**No derived tier may be merged into owner-primary clinical truth.**

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-P1-001** | `OWNER_PRIMARY_LOCATED_019C_L1013_A3_PHYSICAL_PREDECESSOR_P2_PHYSICAL_SUCCESSOR_L1_CANONICAL_PREDECESSOR_L1_CANONICAL_SUCCESSOR_P2_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-P1-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_P1_BLOCK_A` |
| **TGC-P1-003** | `POTENCY_DILUTION_INVENTORY_ONLY_POSITIVE_NEUTRAL_NEGATIVE_BANDS_NO_DOSAGE_AUTHORITY` |
| **TGC-P1-004** | `ELECTRICITY_COADMIN_AUTHORITY_NONE_P1_RESPIRATORY_ORAL_MASTER_ONLY` |
| **TGC-P1-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_MANDATORY_MIXTURE_TIP_REJECTED_FOR_ACTIVATION` |
| **TGC-P1-006** | `APPLICATION_ROUTE_AUTHORITY_NONE_OWNER_ROUTE_SILENT` |
| **TGC-P1-007** | `RULE6_COMBINATION_INVENTORY_ONLY_S1_PLUS_P1_AND_C5_VEN1_LUNG_CANCER_NO_RUNTIME_EDGE` |
| **TGC-P1-008** | `MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-P1-009** | `IDENTITY_CONFLICT_PECTORALS_OWNER_VS_PETTORALE_REGISTRY_POSITIVE_VS_OWNER_BANDS` |
| **TGC-P1-010** | `KEYWORD_CURE_MIRACULOUS_MIXTURE_MANDATORY_RUNTIME_ACTIVATION_REJECTED` |

**TGC-P1-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** P1 tiers were **not located** in available read-only trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-P1-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No EOD-P1 table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Pectorals-1 / P1 respiratory master; lungs/alveoli; bronchi/trachea; pleura; throat/nose
- Dry/wet cough; bronchitis; pneumonia; influenza; asthma; **TB with C5**; COPD; congestion/wheezing
- Pleurisy; **lung cancer with C5 and Ven1**; foul breath from lung phlegm
- **Potency §4:** **D1–D3 Positive**, **D5 Neutral**, **D10–D500 Negative** bands — inventory only
- Keywords including **Bronchitis-Cure** and similar tags (**L1046–1047**) — **non-operational**
- Expert tip: mandatory **P1** inclusion in **Mixture A or Mixture B** for respiratory keywords; **S1+P1** miraculous/chamatkari pediatric chronic-cough wording — inventory only (**TGC-P1-007**, **TGC-P1-010**)
- P2 block cross-reference (P1 vs P2 depth) — **quarantined** (**CF-P1-008**)

---

## 11. High-stakes source claims (inventory only)

TB, pneumonia, asthma exacerbation, COPD, lung-cancer adjunct language, mandatory mixture inclusion, miraculous-result wording, and cure-tagged keywords are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure** authority
- No **TB or pneumonia management** authority
- No **asthma emergency** authority
- No **oncology** authority
- No **pediatric safety** authority
- No **emergency** or **standard-care substitution**
- No **prevention** or **prognosis** claim
- No **potency/dosage authorization**
- No **route/electricity authority**
- No **disease mapping** or **116k activation**
- No **keyword/default/mandatory mixture** activation authority
- No **selector** or **runtime** activation
- No **Rule 6 combination** authority

---

## 12. Disease / Indication Mapping Status

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

**Explicitly inactive:** no 116k mapping; no mandatory P1 mixture default; no miraculous-result selection; no selector activation; no runtime activation (TGC-P1-005, TGC-P1-010).

---

## 13. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

English respiratory/TB/asthma/COPD narrative; **S1+P1** children tip; search tags — **inventory only**; **no** clinical or selector authority.

**Legacy dump:** **`NOT_LOCATED`** at audit time — **ME/CF gap** (not silently closed).

---

## 14. MM2 / MM2C — unavailable tiers (fail-closed)

**TGC-P1-008** — **MM2** and **MM2C** P1 sources: **`NOT_LOCATED_IN_AVAILABLE_TREES`**. **Zero** Rule 5, route, potency, disease-mapping, electricity, or runtime credit. **No** substantive P1 MM2/MM2C content was reviewed or described in this record.

---

## 15. MM3 / BOOK / OCR — unavailable tier (fail-closed)

**TGC-P1-008** — MM3/BOOK/OCR **P1 source: `NOT_LOCATED_IN_AVAILABLE_TREES`**. Classification is **fail-closed no-merge with owner-primary** only. **No** substantive P1 BOOK/OCR content was reviewed or described in this record.

---

## 16. UCKB — unavailable tier (fail-closed)

**TGC-P1-008** — UCKB standalone **P1 tier: `NOT_LOCATED_IN_AVAILABLE_TREES`**. **Fail-closed** — **not** activated; **not** reviewed for P1-specific content in this audit.

---

## 17. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4** | **TGC-P1-002** — **NONE**; zero Rule 4 medicine reference in owner P1 block **A** |
| **Potency / dilution** | **TGC-P1-003** — owner §4 inventory only; unavailable tiers **no credit** |
| **Electricity / co-administration** | **TGC-P1-004** — **NONE** for P1 respiratory oral master |
| **Route / application** | **TGC-P1-006** — **`APPLICATION_ROUTE_AUTHORITY_NONE`** |
| **Rule 6 / S1+P1 / C5+Ven1 lung cancer** | **TGC-P1-007** — **inventory only**; **no runtime relationship edge** |
| **Identity / polarity** | **TGC-P1-009** — inventory only |
| **Keyword / mandatory mixture / cure / miraculous** | **TGC-P1-010** — rejected |

---

## 18. Rule 5 safety matrix (summary)

| Domain | Status |
|--------|--------|
| Contraindications | **SOURCE_NOT_FOUND** (owner block **A**) |
| Allergy / hypersensitivity | **SOURCE_NOT_FOUND** |
| Adverse effects | **SOURCE_NOT_FOUND** |
| Medicine interactions | **SOURCE_NOT_FOUND** |
| Condition interactions | **SOURCE_NOT_FOUND** |
| Pregnancy / lactation / special populations | **SOURCE_NOT_FOUND** |
| Pediatric / geriatric considerations | **SOURCE_NOT_FOUND** |
| Renal / hepatic cautions | **SOURCE_NOT_FOUND** |
| Route incompatibility | **SOURCE_NOT_FOUND** (owner route silent) |
| Application-site safety | **SOURCE_NOT_FOUND** |
| Overdose / exposure | **SOURCE_NOT_FOUND** |
| Duration / cumulative risk | **SOURCE_NOT_FOUND** |
| Monitoring | **SOURCE_NOT_FOUND** |
| Pause/stop criteria | **SOURCE_NOT_FOUND** |
| Emergency / red-flag criteria | **SOURCE_NOT_FOUND** |
| TB/pneumonia/asthma/cancer escalation | **SOURCE_NOT_FOUND** (inventory text **not** safety evidence) |
| Standard-care substitution limits | **SOURCE_NOT_FOUND** |

**Rule 5 safety evidence:** **SOURCE_NOT_FOUND** across required domains. Unavailable MM2/MM2C/MM3/BOOK/UCKB tiers: **zero Rule 5 credit**. **`rule5SafetyCoverageComplete: false`**.

---

## 19. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-P1-001** | **OPEN** — jsonl **1477** / len **2774** / byte proof **pending** |
| **CF-P1-002** | **OPEN** — declared **2774** vs MM3 character count **not located** |
| **CF-P1-003** | **OPEN** — canonical **L1→P1** vs physical **P1 before L1** |
| **CF-P1-004** | **OPEN** — **Pectorals/Pettorale** identity and owner №**24** vs registry naming |
| **CF-P1-005** | **OPEN** — registry **POSITIVE** vs owner §4 Positive/Neutral/Negative bands |
| **CF-P1-006** | **OPEN** — owner **TB/pneumonia/lung cancer** vs registry cluster strings |
| **CF-P1-007** | **OPEN** — developer selector/disease-map **P1** vs single owner block **A** |
| **CF-P1-008** | **OPEN** — P2 external **P1-vs-P2** depth narrative vs unverified Rule 6 |
| **CF-P1-009** | **OPEN** — legacy dump **`NOT_LOCATED`** |
| **CF-P1-010** | **OPEN** — P2 expert tip “where P1 stops, P2 starts” — relationship evidence **open** |
| **CF-P1-011** | **OPEN** — **miraculous/chamatkari** and mandatory mixture language (inventory preserved) |
| **CF-P1-012** | **CLOSED** — Cursor/database-save **L1018–1019** **excluded** (non-clinical) |
| **CF-P1-013** | **CLOSED** — 116k/mixture/cure-tag activation **REJECTED** (TGC-P1-010); wording remains inventory |

**No silent reconciliation.** A **CLOSED** rejection does **not** imply clinical validation.

**Mandatory CF summary:** CF: 001–011 OPEN (11 entries) · 012–013 CLOSED (2 entries; governance rejections only)

---

## 20. Missing-evidence register

| ID | Topic | Status |
|----|--------|--------|
| **ME-P1-001** | Transcript bytes and **2774** declared length | **OPEN** |
| **ME-P1-002** | License/publication/redistribution provenance | **OPEN** |
| **ME-P1-003** | Owner-primary Rule 5 safety text | **OPEN** |
| **ME-P1-004** | Verified route/application evidence | **OPEN** |
| **ME-P1-005** | Potency/dosage protocol ceilings | **OPEN** |
| **ME-P1-006** | MM2/MM2C and MM3/BOOK/OCR bibliographic evidence — **not located** | **OPEN** |
| **ME-P1-007** | **S1+P1**, **C5+Ven1**, and mixture-priority relationship evidence | **OPEN** |
| **ME-P1-008** | TB/pneumonia/asthma/cancer escalation and standard-care limits | **OPEN** |
| **ME-P1-009** | Registry/MM2/MM3 reconciliation for **P1** | **OPEN** |
| **ME-P1-010** | Legacy-dump location | **OPEN** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 21. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | P1 (20/38) |
| Canonical main SHA | `c43aa5c034b6a101cb7752a4a253ccf19cf739b1` |
| Verdict | `P1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** @ **`MED=P1` L1013**) · **`LOCATED_REVIEWED`** (provisional) |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-P1-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–011 OPEN (11 entries) · 012–013 CLOSED (2 entries; governance rejections only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **P2** — **not** started or targeted |
| Registry / runtime changed | **NO** |
| PHI / secrets / database | **NONE** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **P1 blocked · L1→P2 sequence documented · P1 before L1 physically · MM2/MM2C/MM3/BOOK/UCKB not located · zero essential owner clinical decisions**
