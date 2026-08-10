# Rule 5 — R5-M6B Medicine Evidence Audit: S10 (Scrofoloso-10)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 31 of 38 |
| **Medicine code** | S10 |
| **Authoritative normalized header** | **`MED=S10`** |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-10 |
| **Repository base (EHAS2)** | `2f98179fc2b2c000b3bd9f4a2669b9031c42ee24` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `S10_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series occurrence **A** @ **L288**) |

**Mandatory normalizer posture:** Canonical code **`S10`** maps to owner normalized header **`MED=S10`**. Owner display **SCROFOLOSO-10 (S10)** / “Gastro-Intestinal Master” / “पाचन का रक्षक”. Registry mirror **Scrofoloso-10** — **`DERIVED_UNVERIFIED`**. **`^MED=S10`** header **count 2** (entire normalized corpus file); **019c Scrofoloso walk** (**S6→S10→S11**): **count 1** authoritative materia header (**A** only). Occurrence **B** and supplementary dev/API/mixing-logic strings are **`QUARANTINED_NO_OWNER_MERGE`** — **not** co-primary with occurrence **A**.

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Category** | **Scrofoloso** (gastric / alimentary / stomach–intestine framing) |
| **Canonical sequence** | **S6 → S10 → S11** (**no S7–S9** in v2 38-set) |
| **Physical corpus order vs audit order** | **`MED=S6` L245 → `MED=S10` L288 → `MED=S11` L328** in normalized 019c walk — **immediate chain matches** canonical **S6→S10→S11**; **`MED=SLASS` L408** and canonical **S-Lass-before-S1** geography remain **OPEN** (**CF-S10-001**, **CF-S10-010**) |
| **Registry identity (S10 code in 38-set)** | **VERIFIED** — code `S10` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **POSITIVE** — metadata only; **not** owner §4 inline band verification |
| **Registry temperament field** | **`temperament_affinity`** present in v2 (incl. **F1** gastric-headache pairing on NEURO) — **`DERIVED_UNVERIFIED`** vs owner block (temperament **silent** in bounded §1–4) |
| **Owner medicine number** | Owner-only metadata (**6** — SCROFOLOSO-10 framing) |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** (occurrence **A** only) |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof (A)** | **PENDING** — jsonl line **1114** not byte-verified; source jsonl **not available** in read-only trees used for this audit |
| **Declared transcript length (A)** | **2887** — **OPEN** |
| **S10 inner wrapper (occurrence A)** | **`text` L290** · **`<user_query>` opens L291** (inline) · **closing `</user_query>` absent** before separator **L327** — **OPEN** (**CF-S10-003**) |
| **Physical predecessor** | **`MED=S6` L245** — **matches** canonical audit predecessor **S6** |
| **Physical immediate successor** | **`MED=S11` L328** — **matches** canonical audit successor **S11** |
| **Canonical audit predecessor** | **S6** — merged formal audit on main (**provisional** occurrence A) |
| **Canonical audit successor** | **S11** — **not** started or targeted |
| **Prior S6 artifact** | Merged **S6** artifact documents physical successor **`MED=S10` L288** — **aligned**; **S6 artifact unchanged** by this PR |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **S10** (`MED=S10`). It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate S10, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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

## 4. S10 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (occurrence **A** @ L288) | Notes |
|-------|------------------------|----------------------------------------|--------|
| **Code** | S10 | S10 (`MED=S10`) | 38-set identity **VERIFIED** |
| **Display name** | Scrofoloso-10 | **S10 (Scrofoloso-10)** / Gastro-Intestinal Master / पाचन का रक्षक | Registry nickname aligned — **inventory only** |
| **Group** | Scrofoloso | Scrofoloso | Label-level alignment |
| **Polarity field** | POSITIVE | §4 **D1–D5 Positive**, **D30–D200 Negative** | **Inventory only** (**TGC-S10-004**, **CF-S10-008**); **not** dosage authority |

---

## 5. All `MED=S10` occurrences (normalized corpus)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified).

| ID | Header line | Transcript | jsonl line | len | Markers | Classification |
|----|-------------|------------|------------|-----|---------|----------------|
| **A** | **L288** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1114** | **2887** | potency, bodyloc | **`PROVISIONAL_OWNER_PRIMARY`** — normalized owner-session materia master |
| **B** | **L1596** | `019c5012-fbb1-4582-a4af-af8484d1bc5f\…jsonl` | **1826** | **3208** | potency, electricity | **`QUARANTINED_NO_OWNER_MERGE`** — “Mixture Mixing Logic” / engine-AI block; **not** S10 materia |

**Pattern search:** **`^MED=S10`** → **count 2** (entire normalized corpus file). **019c Scrofoloso walk** (**S6→S10→S11**): **count 1** authoritative materia header (**A** only).

**Occurrence B** is **rejected** as S10 owner materia co-primary — **`QUARANTINED_NO_OWNER_MERGE`** (**CF-S10-011**, **TGC-S10-009**). **Electricity** markers on **B** do **not** authorize electricity for owner block **A**.

---

## 6. Occurrence A — provisional owner-primary boundary map

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **Separator before header** | **L287** | Block boundary (`====`) | Boundary only |
| **`MED=S10` header** | **L288** | Transcript pointer (1114 / 2887) | **Authoritative** metadata line |
| **Label** | **L290** | `text` | Boundary only |
| **Inner wrapper open** | **L291** | `<user_query>` (inline with body) | Boundary only |
| **Meta / Cursor save** | **L293–L294** | Intro + developer persistence + owner med #6 label | **Excluded** — non-clinical (**CF-S10-012**) |
| **§1 philosophy** | **L296–L297** | GI / stomach master; “पेट का S1” framing | **Provisional inventory only** |
| **§2 affinity** | **L298–L302** | Stomach, intestines, vagus, pancreas | **Provisional inventory only** |
| **§3 disease mapping (116k label)** | **L303–L316** | Gastric, intestinal/neuro, metabolic (incl. diabetes **supportive** wording) | **Provisional inventory only** |
| **§4 potency** | **L317–L319** | D1–D5 Positive; D30–D200 Negative | **Provisional inventory only** |
| **§5 keywords / 116k tags** | **L320–L321** | Keyword workflow label (incl. Gastritis-Cure tag) | **Excluded** — non-operational (**CF-S10-012**) |
| **Expert tip (clinical inventory boundary)** | **L322–L323** | Mandatory **Mixture A or C**; **S10+F1** for gas-headache | **Provisional inventory only** (**TGC-S10-005**, **TGC-S10-007**) — **not** selector activation |
| **Post-tip agent tail** | **L324–L325** | Extended potency-grid / mapping correction prose | **OPEN** (**CF-S10-004**) **excluded** from merge (contrast S6 no tail) |
| **Wrapper close** | — | **`</user_query>` absent** before **L327** separator | **OPEN** (**CF-S10-003**) — **no silent repair** |
| **Physical predecessor** | **`MED=S6` L245** | Prior owner block | **Matches** canonical **S6** |
| **Physical immediate successor** | **`MED=S11` L328** | Next normalized owner block | **Matches** canonical **S11** |
| **Canonical audit predecessor** | **S6** | Index §2 order | Formal audit on main (**provisional**) |
| **Canonical audit successor** | **S11** | Index §2 order | **Not** started or targeted |

**Bounded primary block:** **L288–L327** (clinical inventory **L296–L323**; exclusions as marked).

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-S10-OWNER-A** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=S10` **L288** · bounded **L296–L323** · wrapper **L290–L326** (close **OPEN**) · line **1114** | Located · byte proof **pending** |
| **SRC-S10-OWNER-B** | **`QUARANTINED_NO_OWNER_MERGE`** | **B** L1596 (mixing-logic block) | Located · **not** owner-primary merge |
| **SRC-S10-MM1E-IDX** | Normalized index | jsonl **1114** / len **2887** (A) | Aligned mirror · metadata only |
| **SRC-S10-REG-V2** | Registry v2 | `medicines.v2.json` **S10** | **`DERIVED_UNVERIFIED`** |
| **SRC-S10-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-S10-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **S10** | **Derived-unverified mirror** |
| **SRC-S10-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S10 tier review |
| **SRC-S10-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S10 tier review |
| **SRC-S10-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** substantive S10 tier review |
| **SRC-S10-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** — **no** standalone S10 tier review |
| **SRC-S10-LEGACY-DUMP** | Legacy stub | Expected dump path | **`SOURCE_NOT_FOUND`** — gap **OPEN** |
| **SRC-S10-DEV-API** | Dev/API/mock | Mixture A/C selectors, mixing engine, AI prose | **`QUARANTINED_NO_OWNER_MERGE`** |
| **SRC-S10-CROSS-S6** | Prior merged S6 artifact | S6→S10 boundary context only | **Quarantined inventory** — **S6 artifact unchanged** |

**No derived tier may be merged into owner-primary clinical truth.**

**Unavailable-tier posture (MM2/MM2C/MM3/BOOK/OCR/UCKB):** **`NOT_LOCATED_IN_AVAILABLE_TREES — not substantively reviewed; no Rule 5 credit; no clinical authority; no owner merge`**.

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-S10-001** | `OWNER_PRIMARY_PROVISIONAL_019C_L288_OCCURRENCE_A_S6_PHYSICAL_CANONICAL_PREDECESSOR_S11_PHYSICAL_CANONICAL_SUCCESSOR_SLASS_L408_LATER_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-S10-002** | `RULE4_AUTHORITY_NONE_IN_OWNER_S10_BLOCK_A_DEV_MIXING_LOGIC_API_STRINGS_QUARANTINED` |
| **TGC-S10-003** | `IDENTITY_SCROFOLOSO_10_GI_GASTRIC_MASTER_REGISTRY_POSITIVE_TEMPERAMENT_F1_PAIRING_DERIVED_UNVERIFIED` |
| **TGC-S10-004** | `POTENCY_DILUTION_INVENTORY_ONLY_D1_D5_POSITIVE_D30_D200_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-S10-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_EXPERT_TIP_MIXTURE_AC_MANDATORY_REJECTED_FOR_ACTIVATION` |
| **TGC-S10-006** | `APPLICATION_ROUTE_AUTHORITY_NONE_OWNER_ROUTE_SILENT_BODYLOC_MARKER_METADATA_ONLY` |
| **TGC-S10-007** | `RULE6_COMBINATION_INVENTORY_ONLY_S10_F1_MANDATORY_TIP_NO_RUNTIME_EDGE` |
| **TGC-S10-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-S10-009** | `DUPLICATE_MED_S10_HEADER_B_L1596_MIXING_LOGIC_019C_QUARANTINED_NOT_CO_PRIMARY` |
| **TGC-S10-010** | `EARLY_SCROFOLOSO_WALK_S10_BEFORE_SLASS_L408_VS_INDEX_S_LASS_BEFORE_S1_OPEN_NOT_RUNTIME_ACTIVATION` |

**TGC-S10-008 note:** **MM2**, **MM2C**, **MM3/BOOK/OCR**, and **UCKB** S10 tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** applies to unavailable tiers only — **not** evidence that unavailable material was reviewed, characterized, or substantively quarantined.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-S10-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No `EOD-S10` table**
- Registry/dev/cross-tier derivations and unavailable tiers are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded occurrence **A** (and mirrored registry where noted):

- Scrofoloso-10 / gastric master / stomach–intestine framing; “पेट का S1” label — inventory only
- Gastritis, hyperacidity, dyspepsia, gastralgia, nausea/vomiting, gas-headache, hiccups, mild constipation, motion sickness, diabetes **supportive** wording
- **Potency §4:** **D1–D5 Positive**, **D30–D200 Negative** — inventory only
- Keywords (**L320–L321**) — **non-operational**
- Expert tip **L322–L323:** mandatory **Mixture A/C** + **S10+F1** for gas-headache — inventory only (**TGC-S10-005**, **TGC-S10-007**)

---

## 11. High-stakes source claims (inventory only)

Gastritis, hyperacidity, GERD framing, diabetes digestive **support**, “Gastritis-Cure” keyword label, ulcer/vomiting language, and mixture/combination mandates are **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure** authority
- No **efficacy** or **rapid result** authority
- No **standard-care substitution**
- No **potency/dosage authorization**
- No **route/electricity authority**
- No **disease mapping** or **116k activation**
- No **keyword/priority selector** activation authority
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
| **Rule 4** | **NONE** in located S10 owner block **A**; dev/engine Rule strings — **quarantined** (**TGC-S10-002**) |
| **Rule 5 safety** | **`SOURCE_NOT_FOUND`** for S10-specific verified safety text; unavailable tiers **zero credit**; **`rule5SafetyCoverageComplete: false`** |
| **Rule 6** | Expert-tip **Mixture A/C** + **S10+F1** pairing + dev mixing-logic strings — **inventory only**; **no runtime relationship edge** (**TGC-S10-007**) |

**Clinical / safety / evidence:** **NO / NO / NONE**

---

## 14. Conflict register (`CF-S10`)

| ID | Status | Summary |
|----|--------|---------|
| **CF-S10-001** | **OPEN** | Canonical **S6→S10→S11** immediate chain **matches** physical **L245→L288→L328**; **global** **S-Lass-before-S1** vs **SLASS @ L408** geography **OPEN** |
| **CF-S10-002** | **OPEN** | Jsonl **1114** / len **2887** — byte proof **not verified** |
| **CF-S10-003** | **OPEN** | Wrapper **`</user_query>`** absent before separator **L327** |
| **CF-S10-004** | **OPEN** | **Post-tip agent tail L324–L325** (extended potency-grid prose) — **excluded** from merge |
| **CF-S10-005** | **OPEN** | Expert tip **mandatory Mixture A/C** vs fail-closed activation |
| **CF-S10-006** | **OPEN** | Expert tip **S10+F1** combination language vs Rule 6 **none** |
| **CF-S10-007** | **OPEN** | Owner label “औषधि संख्या **6**” vs audit sequence **31/38** — numbering tension (documentation) |
| **CF-S10-008** | **OPEN** | Owner §4 **D30–D200** high band vs **agent-tail D5 NEUTRAL / D500 NEGATIVE** mapping instruction (tail excluded; documentation tension) |
| **CF-S10-009** | **OPEN** | Duplicate header **B L1596** (mixing-logic block) vs single primary **A** |
| **CF-S10-010** | **OPEN** | High-stakes gastric/diabetes/“cure”-tag language vs standard care (documentation tension) |
| **CF-S10-011** | **CLOSED** | Occurrence **B** + embedded mixing/engine/API strings — **`QUARANTINED_NO_OWNER_MERGE`** (governance rejection) |
| **CF-S10-012** | **CLOSED** | Cursor-save **L293–294**, §5 keywords **L320–321** — **excluded** from owner merge (governance exclusion only) |

**Mandatory CF summary:** CF: 001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections/exclusions only)

---

## 15. Missing-evidence register (`ME-S10`)

| ID | Status | Summary |
|----|--------|---------|
| **ME-S10-001** | **OPEN** | Transcript bytes / jsonl **1114** / declared **2887** — **not verified** |
| **ME-S10-002** | **OPEN** | License / publication / redistribution provenance for primary text |
| **ME-S10-003** | **OPEN** | Owner-primary **Rule 5 safety** text for GI/diabetes-high-stakes indications |
| **ME-S10-004** | **OPEN** | Verified **route** / application evidence |
| **ME-S10-005** | **OPEN** | **Potency / dilution** ceilings vs registry normalization and agent-tail mapping tension |
| **ME-S10-006** | **OPEN** | **Temperament** / **F1** pairing (registry vs owner §1–4 silence) |
| **ME-S10-007** | **OPEN** | **Rule 6** / mixture + **S10+F1** tip vs validated relationships |
| **ME-S10-008** | **OPEN** | High-stakes gastric/metabolic claims vs standard care |
| **ME-S10-009** | **OPEN** | Registry / owner reconciliation (nickname, clusters, potency_logic) |
| **ME-S10-010** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB bibliographic location — **not located** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 16. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | S10 (31/38) · header **`MED=S10`** |
| Canonical main SHA | `2f98179fc2b2c000b3bd9f4a2669b9031c42ee24` |
| Verdict | `S10_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · occurrence **A** @ **L288** · **B L1596 quarantined** |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-S10-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections/exclusions only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **S11** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **S10 blocked · MED=S10 provisional occurrence A · B L1596 quarantined · S6 pred/S11 succ aligned · no S7–S9 in 38-set · SLASS geography OPEN · missing wrapper close OPEN · post-tip agent tail L324–L325 OPEN/excluded · expert tip Mixture A/C and S10+F1 inventory only · MM2/MM2C/MM3/BOOK/UCKB not located · dev/mock quarantined · zero essential owner clinical decisions · no runtime authority**
