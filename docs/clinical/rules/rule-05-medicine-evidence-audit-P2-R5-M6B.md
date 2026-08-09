# Rule 5 — R5-M6B Medicine Evidence Audit: P2 (Pectorals-2)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 21 of 38 |
| **Medicine code** | P2 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `7004cdc65744e6c077c0322d8de1aac938d643f5` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `P2_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series occurrence **A** only — single normalized `MED=P2` master block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Canonical sequence** | **P1 → P2 → P3** |
| **Physical corpus order vs audit order** | **`MED=P1` L1013 → `MED=P2` L1053 → `MED=P3` L1092** locally matches canonical **P1→P2→P3**; entire P-group block **precedes `MED=L1` L1336** in normalized 019c walk |
| **Registry identity (P2 code in 38-set)** | **VERIFIED** — code `P2` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **POSITIVE** — metadata only; **not** owner §4 band verification |
| **Owner medicine number** | Owner-only metadata (**25** — PECTORALS-2 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only); **no** duplicate normalized `MED=P2` header |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1506** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length** | **2785** — **OPEN**; MM3 `doctor_chars` **not located** for P2 in available trees |
| **P2 inner wrapper (occurrence A)** | `<user_query>` opens **L1056** and **closes at L1090** |
| **Physical predecessor (38-set at P2)** | **`MED=P1` L1013** (inner close **L1050**) |
| **Physical immediate successor** | **`MED=P3` L1092** (~**L1096** open) — **matches** canonical audit successor **P3** |
| **Canonical audit predecessor** | **P1** |
| **Canonical audit successor** | **P3** — **not** started or targeted |
| **Duplicate owner-primary P2 block** | **None** — negative search **`^MED=P2`** → **one** match |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **P2**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate P2, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM2/MM3/BOOK/UCKB strings, **desktop phase-s5 CSV discovery**, or **developer/API/mock strings** as owner-verified clinical truth.
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

## 4. P2 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L1053) | Notes |
|-------|----------------------|--------------------------------------------|--------|
| **Code** | P2 | P2 | 38-set identity **VERIFIED** |
| **Display name** | Pettorale-2 | PECTORALS-2 (P2) / Pectorals-2 | Spelling/group variant **OPEN** (CF-P2-004) |
| **Group** | Pettorale | P-Group / deep chronic lung specialist | Label-level alignment only |
| **Polarity field** | POSITIVE | §4 **D1–D5 Positive** / **D10–D500 Negative** bands | **Inventory only** (TGC-P2-009); registry **D10–D200** wording **OPEN** (CF-P2-005) |

---

## 5. All `MED=P2` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L1053** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1506** | **2785** | potency | **`PROVISIONAL_OWNER_PRIMARY`** — **only** normalized owner-session candidate |

**Negative search:** pattern **`^MED=P2`** → **count 1** (entire normalized corpus file).

Developer/API/mock **P2** strings elsewhere in corpus (selectors, disease maps, mixture enums, **WE/BE** electricity lists) are **rejected** as P2 owner materia authority — **not** co-primary (**CF-P2-007**).

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **`MED=P2` header** | **L1053** | Transcript pointer (1506 / 2785) | Metadata only |
| **Inner wrapper open** | **L1056** | `<user_query>` (blank **L1057**) | Boundary only |
| **Cursor/Database save** | **L1059–1060** | Developer persistence instruction | **Excluded** — non-clinical |
| **§1 philosophy / P1-vs-P2 depth** | **L1062–1063** | Core philosophy and escalation framing | **Provisional inventory only** |
| **§2 affinity** | **L1064–1068** | Affinity | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L1069–1081** | Clinical/disease inventory | **Provisional inventory only** |
| **§4 potency** | **L1082–1084** | Potency / dilution bands | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L1085–1086** | Keyword workflow label | **Excluded** — non-operational |
| **Expert tip** | **L1087–1088** | **C5+P2** priority; P1-stop/P2-start escalation; healing wording | **Provisional inventory only** — **no post-tip agent tail** |
| **Wrapper close** | **L1090** | `</user_query>` | Boundary only |
| **Physical predecessor** | **P1** — close **L1050** | Prior P1 master block | Adjacency only |
| **Physical immediate successor** | **`MED=P3` L1092** | Next P-group block | **Matches** canonical successor **P3** |
| **Canonical audit predecessor** | **P1** | Index §2 order | Physically adjacent |
| **Canonical audit successor** | **P3** | Index §2 order | **Not** started or targeted |
| **Broader physical order** | P-group **before L1** | **`MED=L1` L1336** later in file | Canonical **L1** precedes **P1** in audit order only |

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-P2-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=P2` **L1053** · bounded **L1062–1084** + expert tip **L1087–1088** · wrapper **L1056–1090** · line **1506** | Located · byte proof **pending** |
| **SRC-P2-MM1E-IDX** | Normalized index | jsonl **1506** / len **2785** | Aligned mirror · metadata only |
| **SRC-P2-REG-V2** | Registry v2 | `medicines.v2.json` **P2** | **`DERIVED_UNVERIFIED`** |
| **SRC-P2-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-P2-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **P2** | **Derived-unverified mirror** |
| **SRC-P2-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive P2 tier review |
| **SRC-P2-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive P2 tier review |
| **SRC-P2-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive P2 tier review |
| **SRC-P2-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone P2 tier review |
| **SRC-P2-LEGACY-DUMP** | Legacy stub | Expected dump path | **`NOT_LOCATED`** — gap **OPEN** |
| **SRC-P2-DEV-API** | Dev/API/mock | Selector/mixture/routing strings in corpus | **Rejected** — not owner materia authority |
| **SRC-P2-PHASE-S5-CSV** | Desktop phase-s5 CSV/manifest (external) | Secondary line-1506 pointers | **Secondary / unverified** — **no** owner merge |
| **SRC-P2-CROSS-P1** | Prior merged P1 artifact | P1-vs-P2 boundary context only | **Quarantined inventory** — not P2 block authority |

**No derived tier may be merged into owner-primary clinical truth.**

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-P2-001** | `OWNER_PRIMARY_LOCATED_019C_L1053_P1_PHYSICAL_PREDECESSOR_P3_PHYSICAL_SUCCESSOR_P1_CANONICAL_PREDECESSOR_P3_CANONICAL_SUCCESSOR_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-P2-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_P2_BLOCK_A` |
| **TGC-P2-003** | `POTENCY_DILUTION_INVENTORY_ONLY_D1_D5_POSITIVE_D10_D500_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-P2-004** | `ELECTRICITY_COADMIN_AUTHORITY_NONE_P2_DEEP_RESPIRATORY_ORAL_MASTER_ONLY` |
| **TGC-P2-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_C5_PLUS_P2_PRIORITY_TIP_REJECTED_FOR_ACTIVATION` |
| **TGC-P2-006** | `APPLICATION_ROUTE_AUTHORITY_NONE_OWNER_ROUTE_SILENT` |
| **TGC-P2-007** | `RULE6_COMBINATION_INVENTORY_ONLY_P1_VERSUS_P2_ESCALATION_C5_PLUS_P2_A2_HAEMOPTYSIS_NO_RUNTIME_EDGE` |
| **TGC-P2-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-P2-009** | `IDENTITY_CONFLICT_PECTORALS_OWNER_VS_PETTORALE_REGISTRY_POSITIVE_VS_OWNER_BANDS` |
| **TGC-P2-010** | `KEYWORD_CURE_HEALING_PRIORITY_RUNTIME_ACTIVATION_REJECTED` |

**TGC-P2-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** P2 tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-P2-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No EOD-P2 table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Pectorals-2 / deep-lung chronic specialist; pulmonary parenchyma; bronchi; mucous glands; diaphragm
- Chronic cough; whooping cough; bronchiectasis; lung abscess; **TB with C5**; chronic asthma; smoker’s lung
- **Haemoptysis with A2**; chronic pleurisy
- **P1-versus-P2 depth/escalation** (§1 philosophy) — inventory only
- **Potency §4:** **D1–D5 Positive**, **D10–D500 Negative** — inventory only
- Keywords including **TB-Support-Medicine**, **Deep-Cough-Remedy**, cure/support tags (**L1085–1086**) — **non-operational**
- Expert tip: **C5+P2** priority; “where **P1** stops, **P2** starts”; healing/प्रभावी wording — inventory only (**TGC-P2-005**, **TGC-P2-007**, **TGC-P2-010**)
- Developer **WE/BE** electricity enums in respiratory selectors — **rejected** (**CF-P2-007**)

---

## 11. High-stakes source claims (inventory only)

TB, lung abscess, haemoptysis, whooping cough, severe asthma, bronchiectasis, healing/guaranteed-result wording, and cure/support keywords are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure** authority
- No **TB or lung-abscess management** authority
- No **haemoptysis management** authority
- No **respiratory-emergency** authority
- No **pediatric safety** authority (whooping cough mentioned without safety evidence)
- No **standard-care substitution**
- No **potency/dosage authorization**
- No **route/electricity authority**
- No **disease mapping** or **116k activation**
- No **keyword/priority selector** activation authority
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

**Explicitly inactive:** no 116k mapping; no C5+P2 priority default; no P1-stop/P2-start selector activation; no runtime activation (TGC-P2-005, TGC-P2-010).

---

## 13. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

English deep-lung/TB/haemoptysis/bronchiectasis narrative; search tags — **inventory only**; **no** clinical or selector authority.

**Legacy dump:** **`NOT_LOCATED`** at audit time — **ME/CF gap** (not silently closed).

---

## 14. MM2 / MM2C — unavailable tiers (fail-closed)

**TGC-P2-008** — **MM2** and **MM2C** P2 sources: **`NOT_LOCATED_IN_AVAILABLE_TREES`**. **Zero** Rule 5, route, potency, disease-mapping, electricity, or runtime credit. **No** substantive P2 MM2/MM2C content was reviewed or described in this record.

---

## 15. MM3 / BOOK / OCR — unavailable tier (fail-closed)

**TGC-P2-008** — MM3/BOOK/OCR **P2 source: `NOT_LOCATED_IN_AVAILABLE_TREES`**. **Fail-closed no-merge with owner-primary** only. **No** substantive P2 BOOK/OCR content was reviewed or described in this record.

---

## 16. UCKB — unavailable tier (fail-closed)

**TGC-P2-008** — UCKB standalone **P2 tier: `NOT_LOCATED_IN_AVAILABLE_TREES`**. **Fail-closed** — **not** activated; **not** reviewed for P2-specific content in this audit.

---

## 17. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4** | **TGC-P2-002** — **NONE**; zero Rule 4 medicine reference in owner P2 block **A** |
| **Potency / dilution** | **TGC-P2-003** — owner §4 inventory only; unavailable tiers **no credit** |
| **Electricity / co-administration** | **TGC-P2-004** — **NONE** for P2 deep respiratory oral master |
| **Route / application** | **TGC-P2-006** — **`APPLICATION_ROUTE_AUTHORITY_NONE`** |
| **Rule 6 / P1↔P2 / C5+P2 / A2+haemoptysis** | **TGC-P2-007** — **inventory only**; **no runtime relationship edge** |
| **Identity / polarity** | **TGC-P2-009** — inventory only |
| **Keyword / cure / healing / priority** | **TGC-P2-010** — rejected |

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
| TB/abscess/haemoptysis/asthma escalation | **SOURCE_NOT_FOUND** (inventory text **not** safety evidence) |
| Standard-care substitution limits | **SOURCE_NOT_FOUND** |

**Rule 5 safety evidence:** **SOURCE_NOT_FOUND** across required domains. Unavailable MM2/MM2C/MM3/BOOK/UCKB tiers: **zero Rule 5 credit**. **`rule5SafetyCoverageComplete: false`**.

---

## 19. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-P2-001** | **OPEN** — jsonl **1506** / len **2785** / byte proof **pending** |
| **CF-P2-002** | **OPEN** — declared **2785** vs MM3 character count **not located** |
| **CF-P2-003** | **OPEN** — canonical **L1→P1→P2** vs physical **P2 before L1** |
| **CF-P2-004** | **OPEN** — **Pectorals/Pettorale** identity and owner №**25** vs registry naming |
| **CF-P2-005** | **OPEN** — registry **D10–D200** vs owner **D10–D500** negative bands |
| **CF-P2-006** | **OPEN** — owner **TB/abscess/haemoptysis** vs registry cluster strings |
| **CF-P2-007** | **OPEN** — developer selector/disease-map **P2** vs single owner block **A** |
| **CF-P2-008** | **OPEN** — **P1-versus-P2** escalation vs unverified Rule 6 evidence |
| **CF-P2-009** | **OPEN** — legacy dump **`NOT_LOCATED`** |
| **CF-P2-010** | **OPEN** — healing / **C5+P2** priority / “P1 stops” language (inventory preserved) |
| **CF-P2-011** | **OPEN** — high-stakes respiratory inventory (TB, abscess, haemoptysis, whooping cough) |
| **CF-P2-012** | **CLOSED** — Cursor/database-save **L1059–1060** **excluded** (non-clinical) |
| **CF-P2-013** | **CLOSED** — 116k/keyword/priority activation **REJECTED** (TGC-P2-010); wording remains inventory |

**No silent reconciliation.** A **CLOSED** rejection does **not** imply clinical validation.

**Mandatory CF summary:** CF: 001–011 OPEN (11 entries) · 012–013 CLOSED (2 entries; governance rejections only)

---

## 20. Missing-evidence register

| ID | Topic | Status |
|----|--------|--------|
| **ME-P2-001** | Transcript bytes and **2785** declared length | **OPEN** |
| **ME-P2-002** | License/publication/redistribution provenance | **OPEN** |
| **ME-P2-003** | Owner-primary Rule 5 safety text | **OPEN** |
| **ME-P2-004** | Verified route/application evidence | **OPEN** |
| **ME-P2-005** | Potency/dosage protocol ceilings | **OPEN** |
| **ME-P2-006** | MM2/MM2C and MM3/BOOK/OCR bibliographic evidence — **not located** | **OPEN** |
| **ME-P2-007** | **P1↔P2**, **C5+P2**, and **A2+haemoptysis** relationship evidence | **OPEN** |
| **ME-P2-008** | TB/abscess/haemoptysis/asthma escalation and standard-care limits | **OPEN** |
| **ME-P2-009** | Registry/MM2/MM3 reconciliation for **P2** | **OPEN** |
| **ME-P2-010** | Legacy-dump location | **OPEN** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 21. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | P2 (21/38) |
| Canonical main SHA | `7004cdc65744e6c077c0322d8de1aac938d643f5` |
| Verdict | `P2_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** @ **`MED=P2` L1053**) · **`LOCATED_REVIEWED`** (provisional) |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-P2-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–011 OPEN (11 entries) · 012–013 CLOSED (2 entries; governance rejections only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **P3** — **not** started or targeted |
| Registry / runtime changed | **NO** |
| PHI / secrets / database | **NONE** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **P2 blocked · P1→P3 sequence documented · P-group before L1 physically · MM2/MM2C/MM3/BOOK/UCKB not located · zero essential owner clinical decisions**
