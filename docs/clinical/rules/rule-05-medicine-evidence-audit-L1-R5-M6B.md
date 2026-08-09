# Rule 5 — R5-M6B Medicine Evidence Audit: L1 (Lymphatico-1)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 19 of 38 |
| **Medicine code** | L1 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `c33a6d6b9cdb7c4ef51cc7dc433f9a1bd497fe1b` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `L1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series occurrence **A** only — single normalized `MED=L1` master block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Canonical sequence** | **GE → L1 → P1** |
| **Physical corpus order vs audit order** | **`MED=L1` L1336** precedes **`MED=None` GE ~L1467** in normalized 019c walk; **`MED=P1` L1013** precedes **L1** physically — differs from canonical **GE→L1→P1** audit order |
| **Registry identity (L1 code in 38-set)** | **VERIFIED** — code `L1` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **NEUTRAL** — metadata only; **not** owner §4 band verification |
| **Owner medicine number** | Owner-only metadata (**33** — LYMPHATICO-1 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only); **no** duplicate normalized `MED=L1` header |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1704** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length** | **2984** — **OPEN**; MM3 `doctor_chars` **not located** for L1 in available trees |
| **L1 inner wrapper (occurrence A)** | `<user_query>` opens **L1339** and **closes at L1378** |
| **Physical predecessor (38-set at L1)** | **`MED=VER1` L1295** (inner close **L1333**) |
| **Physical immediate successor** | **`MED=None` L1381** (White Electricity master — **WE**) — **not** canonical audit successor |
| **Canonical audit predecessor** | **GE** — **not physically adjacent**; GE block **after** L1 in file walk |
| **Canonical audit successor** | **P1** — **`MED=P1` L1013** physically **before** L1; **not** started or targeted |
| **Duplicate owner-primary L1 block** | **None** — negative search **`^MED=L1`** → **one** match |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **L1**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate L1, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM3 BOOK/UCKB strings or **developer/API/mock strings** as owner-verified clinical truth.
- Preserves disease/indication **source-tier inventory** with **zero** mapping or selection authority.
- **Documentation completion creates no clinical authority.**
- Does **not** substitute for oncology, infectious-disease, nephrology/hepatology, surgical, emergency, pediatric, or standard medical care.

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

## 4. L1 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L1336) | Notes |
|-------|----------------------|--------------------------------------------|--------|
| **Code** | L1 | L1 | 38-set identity **VERIFIED** |
| **Display name** | Linfatico-1 | LYMPHATICO-1 (L1) / Lymphatico-1 | Spelling variant **OPEN** (CF-L1-005) |
| **Group** | Linfatico | Lymphatic master / water regulator framing | Label-level alignment only |
| **Polarity field** | NEUTRAL | §4 **Positive / Neutral / Negative** dilution bands | **Inventory only** (TGC-L1-009) |

---

## 5. All `MED=L1` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L1336** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1704** | **2984** | potency, bodyloc | **`PROVISIONAL_OWNER_PRIMARY`** — **only** normalized owner-session candidate |

**Negative search:** pattern **`^MED=L1`** → **count 1** (entire normalized corpus file).

Developer/API/mock **L1** strings elsewhere in corpus (selectors, mixtures, CSV rows, temperament appenders) are **rejected** as L1 owner materia authority — **not** co-primary (**CF-L1-008**).

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **`MED=L1` header** | **L1336** | Transcript pointer (1704 / 2984) | Metadata only |
| **Inner wrapper open** | **L1339** | `<user_query>` | Boundary only |
| **Cursor/Database save** | **L1342–1343** | Developer persistence instruction | **Excluded** — non-clinical |
| **§1 philosophy** | **L1345–1346** | Core philosophy | **Provisional inventory only** |
| **§2 affinity** | **L1347–1351** | Affinity | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L1352–1369** | Clinical/disease inventory | **Provisional inventory only** |
| **§4 potency** | **L1370–1372** | Potency / dilution bands | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L1374–1375** | Keyword workflow label | **Excluded** — non-operational |
| **Expert tip** | **L1375–1376** | Mandatory 116k inclusion + **S1+L1** universal tonic | **Provisional inventory only** — **no post-tip agent tail** |
| **Wrapper close** | **L1378** | `</user_query>` | Boundary only |
| **Physical predecessor** | **Ver1** — close **L1333** | Prior Vermifugo master block | Adjacency only |
| **Physical immediate successor** | **`MED=None` L1381** | WE electricity master | **Not** canonical audit successor **P1** |
| **Canonical audit predecessor** | **GE** | Index §2 order | **Not adjacent** — GE **after** L1 in file |
| **Canonical audit successor** | **P1** | Index §2 order · **L1013** physically earlier | **Not** started or targeted |

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-L1-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=L1` **L1336** · bounded **L1345–1372** + expert tip **L1375–1376** · wrapper **L1339–1378** · line **1704** | Located · byte proof **pending** |
| **SRC-L1-MM1E-IDX** | Normalized index | jsonl **1704** / len **2984** | Aligned mirror · metadata only |
| **SRC-L1-REG-V2** | Registry v2 | `medicines.v2.json` **L1** | **`DERIVED_UNVERIFIED`** |
| **SRC-L1-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-L1-REG-NARRATIVE** | Registry/MM2-style English fields | Same JSON blob | **Secondary / unverified** — **no** owner merge |
| **SRC-L1-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **L1** | **Derived-unverified mirror** |
| **SRC-L1-LEGACY-DUMP** | Legacy stub | Expected dump path | **`NOT_LOCATED`** — gap **OPEN** |
| **SRC-L1-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive L1 tier review performed |
| **SRC-L1-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone L1 tier review performed |
| **SRC-L1-DEV-API** | Dev/API/mock | Selector/mixture/routing strings in corpus | **Rejected** — not owner materia authority |
| **SRC-L1-CROSS-TIP** | Adjacent owner tips | Ven1 **L1290** **C5+Ven1+L1** triangle | **Quarantined inventory only** — not L1 block authority |

**No derived tier may be merged into owner-primary clinical truth.**

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-L1-001** | `OWNER_PRIMARY_LOCATED_019C_L1336_VER1_PHYSICAL_PREDECESSOR_WE_ELECTRICITY_PHYSICAL_SUCCESSOR_GE_CANONICAL_PREDECESSOR_P1_CANONICAL_SUCCESSOR_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-L1-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_L1_BLOCK_A` |
| **TGC-L1-003** | `POTENCY_DILUTION_INVENTORY_ONLY_POSITIVE_NEUTRAL_NEGATIVE_BANDS_NO_DOSAGE_AUTHORITY` |
| **TGC-L1-004** | `ELECTRICITY_COADMIN_AUTHORITY_NONE_L1_ORAL_LYMPH_MASTER_ONLY` |
| **TGC-L1-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_MANDATORY_TIP_WORDING_REJECTED_FOR_ACTIVATION` |
| **TGC-L1-006** | `APPLICATION_ROUTE_AUTHORITY_NONE_OWNER_ROUTE_SILENT` |
| **TGC-L1-007** | `RULE6_COMBINATION_INVENTORY_ONLY_S1_PLUS_L1_AND_C5_VEN1_L1_NO_RUNTIME_EDGE` |
| **TGC-L1-008** | `MM3_BOOK_OCR_UCKB_QUARANTINE_NOT_MERGED_WITH_OWNER_PRIMARY` |
| **TGC-L1-009** | `POLARITY_TEMPERATURE_CONFLICT_REGISTRY_NEUTRAL_VS_OWNER_POSITIVE_NEGATIVE_BANDS` |
| **TGC-L1-010** | `KEYWORD_DEFAULT_CURE_UNIVERSAL_TONIC_RUNTIME_ACTIVATION_REJECTED` |

**TGC-L1-008 note:** MM3/BOOK/OCR and UCKB **L1 tiers were not located** in available read-only trees. **Quarantine / no-merge** is **fail-closed governance** for unavailable tiers — **not** evidence that those sources were reviewed or characterized.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-L1-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No EOD-L1 table**
- Registry/dev/cross-tip derivations and unavailable MM3/UCKB tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Lymphatic system, spleen, serous membranes, skin/connective fluid, water balance, immunity foundation
- Lymphadenitis, tonsillitis, adenoids, filariasis/elephantiasis, edema, chronic catarrh, boils/skin “impurity” wording
- Ascites (liver/kidney failure wording), hydrocele, joint effusion, obesity/water retention
- Pediatric recurrent-illness wording
- **Cancer and lumps** adjunct with **C5 and Ven1** (**L1368**) — inventory only
- **Potency §4:** **D1–D3 Positive**, **D5 Neutral**, **D10–D500 Negative** bands — inventory only
- Mandatory **116k** inclusion expert tip; **`*-Cure`** keyword strings (**L1374–1375**) — **non-operational**
- **S1+L1** “universal tonic” and registry **C5+Ven1+L1** malignancy triangle strings — inventory only (**TGC-L1-007**)

---

## 11. High-stakes source claims (inventory only)

Filariasis/elephantiasis, ascites, cancer adjunct language, mandatory keyword inclusion, universal tonic wording, cure-tagged keywords, and organ-failure fluid overload text are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure** authority
- No **cancer efficacy** authority
- No **filariasis/ascites management** authority
- No **pediatric safety** authority
- No **emergency** or **standard-care substitution**
- No **prevention** or **prognosis** claim
- No **potency/dosage authorization**
- No **route/electricity authority**
- No **disease mapping** or **116k activation**
- No **keyword/default/mandatory selection** authority
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

**Explicitly inactive:** no 116k mapping; no mandatory L1 inclusion; no universal-tonic default; no selector activation; no runtime activation (TGC-L1-005, TGC-L1-010).

---

## 13. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

English lymphatic/edema/immunity narrative; filariasis/ascites clusters; **S1+L1** and **C5+Ven1+L1** hints; search tags — **inventory only**; **no** clinical or selector authority.

**Legacy dump:** **`NOT_LOCATED`** at audit time — **ME/CF gap** (not silently closed).

---

## 14. MM3 / BOOK / OCR — unavailable tier (fail-closed)

**TGC-L1-008** — MM3/BOOK/OCR **L1 source: `NOT_LOCATED_IN_AVAILABLE_TREES`**. Classification is **quarantine / no-merge with owner-primary** only. **Zero** Rule 5, route, potency, disease-mapping, electricity, or runtime credit. **No** substantive L1 BOOK/OCR content was reviewed or described in this record.

---

## 15. UCKB — unavailable tier (fail-closed)

**TGC-L1-008** — UCKB standalone **L1 tier: `NOT_LOCATED_IN_AVAILABLE_TREES`**. **Fail-closed quarantine** — **not** activated; **not** reviewed for L1-specific content in this audit.

---

## 16. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4** | **TGC-L1-002** — **NONE**; zero Rule 4 medicine reference in owner L1 block **A** |
| **Potency / dilution** | **TGC-L1-003** — owner §4 inventory only; unavailable MM3/BOOK tiers **no credit** |
| **Electricity / co-administration** | **TGC-L1-004** — **NONE** for L1 oral lymph master |
| **Route / application** | **TGC-L1-006** — **`APPLICATION_ROUTE_AUTHORITY_NONE`** |
| **Rule 6 / S1+L1 / C5+Ven1+L1** | **TGC-L1-007** — **inventory only**; **no runtime relationship edge** |
| **Polarity / registry NEUTRAL vs owner bands** | **TGC-L1-009** — inventory only |
| **Keyword / mandatory 116k / cure / universal tonic** | **TGC-L1-010** — rejected |

---

## 17. Rule 5 safety matrix (summary)

| Domain | Status |
|--------|--------|
| Contraindications | **SOURCE_NOT_FOUND** (owner block **A**) |
| Allergy / hypersensitivity | **SOURCE_NOT_FOUND** |
| Adverse effects | **SOURCE_NOT_FOUND** |
| Medicine interactions | **SOURCE_NOT_FOUND** |
| Condition interactions | **SOURCE_NOT_FOUND** |
| Pregnancy / lactation / special populations | **SOURCE_NOT_FOUND** |
| Pediatric / geriatric considerations | **SOURCE_NOT_FOUND** |
| Renal / hepatic cautions | **SOURCE_NOT_FOUND** (ascites wording **not** safety evidence) |
| Route incompatibility | **SOURCE_NOT_FOUND** (owner route silent) |
| Application-site safety | **SOURCE_NOT_FOUND** |
| Overdose / exposure | **SOURCE_NOT_FOUND** |
| Duration / cumulative risk | **SOURCE_NOT_FOUND** |
| Monitoring | **SOURCE_NOT_FOUND** |
| Pause/stop criteria | **SOURCE_NOT_FOUND** |
| Emergency / red-flag criteria | **SOURCE_NOT_FOUND** |
| Filariasis / ascites / cancer adjunct escalation | **SOURCE_NOT_FOUND** (inventory text **not** safety evidence) |
| Standard-care substitution limits | **SOURCE_NOT_FOUND** |

**Rule 5 safety evidence:** **SOURCE_NOT_FOUND** across required domains. Unavailable MM3/BOOK/UCKB tiers: **zero Rule 5 credit**. **`rule5SafetyCoverageComplete: false`**.

---

## 18. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-L1-001** | **OPEN** — jsonl **1704** / len **2984** / byte proof **pending** |
| **CF-L1-002** | **OPEN** — declared **2984** vs MM3 character count **not located** |
| **CF-L1-003** | **OPEN** — canonical **GE→L1** vs physical **L1 before GE** |
| **CF-L1-004** | **OPEN** — canonical **L1→P1** vs physical **P1 @ L1013 before L1** |
| **CF-L1-005** | **OPEN** — **Lymphatico-1** vs registry **`Linfatico-1`** spelling |
| **CF-L1-006** | **OPEN** — owner §4 Positive/Neutral/Negative bands vs registry **`polarity: NEUTRAL`** |
| **CF-L1-007** | **OPEN** — owner cancer adjunct (**C5/Ven1**) vs registry **C5+Ven1+L1** triangle strings |
| **CF-L1-008** | **OPEN** — developer selector/routing strings vs single owner block **A** |
| **CF-L1-009** | **OPEN** — Ven1 cross-tip **C5+Ven1+L1** triangle vs unverified Rule 6 |
| **CF-L1-010** | **OPEN** — legacy dump **`NOT_LOCATED`** |
| **CF-L1-011** | **OPEN** — duplicate **`MED=VEN1` L1656** corpus-walk integrity (boundary context) |
| **CF-L1-012** | **CLOSED** — Cursor/database-save **L1342–1343** **excluded** (non-clinical) |
| **CF-L1-013** | **CLOSED** — 116k mandatory / universal-tonic activation **REJECTED** (TGC-L1-010); wording remains inventory |

**No silent reconciliation.** A **CLOSED** rejection does **not** imply clinical validation.

**Mandatory CF summary:** CF: 001–011 OPEN (11 entries) · 012–013 CLOSED (2 entries; governance rejections only)

---

## 19. Missing-evidence register

| ID | Topic | Status |
|----|--------|--------|
| **ME-L1-001** | Transcript bytes and **2984** declared length | **OPEN** |
| **ME-L1-002** | License/publication/redistribution provenance | **OPEN** |
| **ME-L1-003** | Owner-primary Rule 5 safety text | **OPEN** |
| **ME-L1-004** | Verified route/application evidence | **OPEN** |
| **ME-L1-005** | Potency/dosage protocol ceilings | **OPEN** |
| **ME-L1-006** | MM3/BOOK/OCR bibliographic evidence — **not located** in available trees | **OPEN** |
| **ME-L1-007** | **S1+L1**, **C5+Ven1+L1**, and 116k priority relationship evidence | **OPEN** |
| **ME-L1-008** | Filariasis/ascites/cancer escalation and standard-care limits | **OPEN** |
| **ME-L1-009** | Registry/MM2/MM3 reconciliation for **L1** | **OPEN** |
| **ME-L1-010** | Legacy-dump location | **OPEN** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 20. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | L1 (19/38) |
| Canonical main SHA | `c33a6d6b9cdb7c4ef51cc7dc433f9a1bd497fe1b` |
| Verdict | `L1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** @ **`MED=L1` L1336**) · **`LOCATED_REVIEWED`** (provisional) |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-L1-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–011 OPEN (11 entries) · 012–013 CLOSED (2 entries; governance rejections only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **P1** — **not** started or targeted |
| Registry / runtime changed | **NO** |
| PHI / secrets / database | **NONE** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **L1 blocked · GE→P1 sequence documented · physical order conflicts preserved · MM3/BOOK/UCKB not located · zero essential owner clinical decisions**
