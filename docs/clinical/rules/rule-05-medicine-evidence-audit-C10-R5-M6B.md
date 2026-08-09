# Rule 5 — R5-M6B Medicine Evidence Audit: C10 (Canceroso-10)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 12 of 38 |
| **Medicine code** | C10 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `354f99009ac41e21aff9990214234a8d1698d05d` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `C10_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series normalized single `MED=C10` corpus block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **physical C11 corpus block** L731–767 is **boundary context only** — **not** a canonical audit target |
| **Registry identity (C10 code in 38-set)** | **VERIFIED** — code `C10` present in v2 registry; **not** owner-source verification |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** only; **no** full provenance or clinical verification claim |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1313** not byte-verified in EHAS2 |
| **Declared transcript length** | **2676** — **OPEN** vs MM3 `doctor_chars: 2672` (4-char delta unresolved) |
| **Upstream corpus segmentation** | **C6 inner `</user_query>` at L690** — **no bleed into C10** |
| **C10 inner wrapper** | C10 `<user_query>` opens **L696** and **closes at L728** |
| **Physical next block** | **`MED=C11` L731** (excluded 38-set; L731–767) |
| **Canonical audit successor** | **`MED=C13` L770** (opens **~L773**) |
| **Duplicate `MED=C10` blocks** | **None found** (single normalized tag) |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **C10**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate C10, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM3 BOOK/UCKB strings as owner-verified clinical truth.
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

## 4. C10 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (`MED=C10` 019c @ L693) | Notes |
|-------|----------------------|----------------------------------------|--------|
| **Code** | C10 | C10 | 38-set identity **VERIFIED** |
| **Display name** | Canceroso-10 | CANCEROSO-10 (C10) | Spelling variant |
| **Group** | Canceroso | C-Group (Canceroso) / alimentary structure | Aligned |
| **Medicine number** | Not in v2 row | **16** (औषधि संख्या 16) | Owner-only metadata |
| **Polarity field** | NEGATIVE | Dilution-band Positive/Negative language in §4 potency | **Inventory only** (TGC-C10-009) |

---

## 5. Provisional owner-primary boundary and line-level inventory map

Normalized corpus reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (EHAS2 read-only pointer; not modified in this phase).

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **`MED=C10` header** | **L693** | Transcript pointer (1313 / 2676) | Metadata only |
| **Rule separator (normalized view)** | **L692** | Section delimiter | **Not** a second C10 block |
| **Inner wrapper open** | **L696** | `<user_query>` | Boundary only |
| **Cursor/Database save** | **L698–699** | Developer persistence instruction | **Excluded** — non-clinical |
| **§1–5 clinical sections** | **L701–725** | Philosophy, affinity, disease clusters, potency bands, keyword list header context | **Provisional inventory only** |
| **116k mapping heading** | **L724–725** (§5 workflow framing) | Keyword workflow label | **Excluded** — non-operational |
| **Expert tip** | **L726–727** | S10+C10 pairing + keyword triggers | **Provisional inventory only** — **no C6-style agent tail** on expert-tip line |
| **Wrapper close** | **L728** | `</user_query>` | Boundary only |
| **Physical next medicine** | **`MED=C11` L731–767** | Excluded v2 code | **Not** C10 evidence; **not** canonical successor |
| **Canonical successor** | **`MED=C13` L770** | Next audit-sequence block | Not C11 |

**Preceding C6:** closes **L690**; **`MED=C10` header L693** — no C6 bleed into C10 clinical inventory.

### 5.1 Line-anchor drift vs prior C6 record (CF-C10-001)

| Item | Prior C6 audit record | Fresh C10 audit observation |
|------|----------------------|----------------------------|
| **`MED=C10` pointer in C6 status/artifact** | **`MED=C10` @ ~L692** (successor pointer after C6 wrapper) | **`MED=C10` header @ L693** in current normalized corpus |
| **L692 in normalized view** | Referenced as following-medicine anchor | **Section separator line** — **not** a duplicate `MED=C10` header |
| **Disposition** | **Do not rewrite** merged C6 artifact | **OPEN** metadata/line-anchor drift pending transcript **byte-level proof**; **single** `MED=C10` block only |

---

## 6. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-C10-OWNER** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=C10` **L693** · bounded inventory **L701–725** + expert tip **L726–727** · wrapper **L696–728** · transcript line **1313** | Located · byte proof **pending** |
| **SRC-C10-MM1E-IDX** | Normalized index | `primary_code: C10`, line 1313, len 2676 | Metadata mirror |
| **SRC-C10-MM2** | Parsed owner copy | `S5MM2_MASTER_MATERIA_MEDICA.json` · `PRIMARY_DOCTOR_BLOCK_FOUND` | **Secondary** parsed inventory · title truncation · false external route parse |
| **SRC-C10-MM2C** | Clinical classification | `S5MM2C_CLINICAL_CLASSIFICATION.json` | **`INTERNAL_ONLY`** · mapping **review_required** |
| **SRC-C10-REG-V2** | Registry v2 | `medicines.v2.json` C10 | **`DERIVED_UNVERIFIED`** |
| **SRC-C10-LEGACY-DUMP** | Legacy stub | `_electrohomeo_medicines_dump.json` | Tooling/**derived** tier |
| **SRC-C10-MM3** | MM3/BOOK | `S5_MM3_MASTER_MATERIA_MEDICA.json` | **`UNVERIFIED_BOOK_DERIVED_TEXT`** · quarantine |
| **SRC-C10-UCKB** | Parallel | `UCKB_DATASET_v1.json` | **`NOT_ACTIVATED`** · external routes + YE/BE/RE staged |
| **SRC-C10-C11-CORPUS** | Physical interstitial | `MED=C11` L731–767 | **Excluded** 38-set · **zero** C10 clinical authority |

---

## 7. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-C10-001** | `OWNER_PRIMARY_LOCATED_WRAPPER_C11_INTERSTITIAL_C13_CANONICAL_SUCCESSOR_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-C10-002** | `RULE4_C10_REFERENCE_ZERO_AUTHORITY_IN_OWNER_BLOCK` |
| **TGC-C10-003** | `SEPARATE_TRACKS_NO_C10_POTENCY_DILUTION_AUTHORITY_MM3_UCKB_BOOK_CONFLICT` |
| **TGC-C10-004** | `RE_ELECTRICITY_COADMINISTRATION_ZERO_AUTHORITY_UCKB_QUARANTINED` |
| **TGC-C10-005** | `DISEASE_INDICATION_MAPPING_ZERO_AUTHORITY` |
| **TGC-C10-006** | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| **TGC-C10-007** | `RULE6_C10_S10_STRUCTURE_FUNCTION_TIP_INVENTORY_ONLY` |
| **TGC-C10-008** | `MM3_BOOK_OCR_QUARANTINE_NO_OWNER_MERGE` |
| **TGC-C10-009** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY` |
| **TGC-C10-010** | `KEYWORD_DEFAULT_PRIORITY_AND_HEALING_AGENT_LANGUAGE_REJECTED` |

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-C10-001–010** recorded **separately** (count **10**).

---

## 8. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No EOD-C10 table**
- Registry/MM2/MM3/UCKB/C11-boundary derivations are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 9. High-stakes source claims (inventory only)

Owner-source §3, keywords, and expert-tip tokens reference **Crohn’s disease**, **ulcerative colitis**, **colon/intestinal cancer**, **liver cirrhosis**, **pancreatitis**, severe GI ulcer/bleeding language, and registry/MM2 keyword tokens including **Chronic-Diarrhea-Cure** and **Anti-Malignancy-Gut**. Preserved as **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure validation**
- No **cancer efficacy** claim
- No **prevention** or **prognosis** claim
- No **safety authorization**
- No **potency/dosage authorization** (including owner §4 bands and quarantined BOOK/UCKB ladders)
- No **automatic disease mapping** or **116k** catalog activation
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

**Explicitly inactive:** no disease→C10 or symptom→C10 selection; no keyword/default priority; no efficacy approval; no runtime effect (TGC-C10-005, TGC-C10-010).

---

## 11. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

English GI narrative, disease clusters, potency_logic, temperament S10+C10 pairing strings, and search tags — **inventory only**; **no** clinical or selector authority.

---

## 12. MM3 / BOOK quarantine

**TGC-C10-008** — **`UNVERIFIED_BOOK_DERIVED_TEXT`**; **`no_merge_with_owner_primary`**; Blood-primary organ label, OCR disease flood, external compress/ointment/tablet — zero Rule 5, route, potency, disease-mapping, electricity, or runtime credit.

---

## 13. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4** | **TGC-C10-002** — zero Rule 4 medicine reference in owner C10 block |
| **Potency / dilution** | **TGC-C10-003** — owner §4 inventory only; MM3/UCKB **rejected** for authority |
| **RE / electricity** | **TGC-C10-004** — UCKB YE/BE/RE **quarantined** |
| **Route** | **TGC-C10-006** — none; MM2 false external parse **rejected** (CF-C10-011) |
| **Rule 6 / S10+C10** | **TGC-C10-007** — **inventory only** |
| **C5 adjacency** | Cirrhosis co-mention in §3 — **historical inventory only**; not validated combination protocol |
| **Polarity / temperament** | **TGC-C10-009** — inventory only |
| **Keyword / healing agent** | **TGC-C10-010** — rejected |

---

## 14. Rule 5 safety matrix (summary)

**Incomplete / blocked** — contraindications, pregnancy, interactions, monitoring, overdose, emergency exclusions **SOURCE_NOT_FOUND** in bounded owner-primary; BOOK/UCKB **no credit**. **`rule5SafetyCoverageComplete: false`**.

---

## 15. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-C10-001** | **OPEN** — transcript **1313** / len **2676** / byte proof; **L692 vs L693** anchor drift vs prior C6 **`MED=C10` ~L692** pointer (separator at L692; header at L693) |
| **CF-C10-002** | **OPEN** — index **2676** vs MM3 **2672** |
| **CF-C10-003** | **OPEN** — MM2 title truncation `औषधि संख्या 16: C` |
| **CF-C10-004** | **OPEN** — **C11 interstitial block** L731–767 between C10 and canonical **C13** |
| **CF-C10-005** | **OPEN** — BOOK vs owner polarity/indications/organ labels |
| **CF-C10-006** | **OPEN** — BOOK OCR disease flood vs owner §3 |
| **CF-C10-007** | **OPEN** — BOOK/UCKB external + tablet vs silent owner route |
| **CF-C10-008** | **OPEN** — legacy dump “Mixed” vs owner alimentary narrative |
| **CF-C10-009** | **OPEN** — MM2C/registry mapping suggestions staged, not authorized |
| **CF-C10-010** | **CLOSED** — keyword priority + **healing-agent / Cure-tag** activation **REJECTED** (TGC-C10-010); wording remains inventory |
| **CF-C10-011** | **CLOSED** — MM2 false **external_use** parse **REJECTED**; **`routeAuthority` remains none** |

**No silent reconciliation.**

---

## 16. Missing-evidence register

| ID | Topic | Status |
|----|--------|--------|
| **ME-C10-001** | Transcript byte and declared-length verification | **OPEN** |
| **ME-C10-002** | License, publication, and redistribution provenance | **OPEN** |
| **ME-C10-003** | Owner-primary Rule 5 safety text | **OPEN** |
| **ME-C10-004** | Verified owner-primary route/application evidence | **OPEN** |
| **ME-C10-005** | Verified potency/dosage protocol, ceilings, high-dilution safety | **OPEN** |
| **ME-C10-006** | MM3/BOOK bibliographic provenance and OCR integrity | **OPEN** |
| **ME-C10-007** | Verified S10/combination/electricity relationship evidence | **OPEN** |

Evidence gaps only — **not** EODs.

---

## 17. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | C10 (12/38) |
| Verdict | `C10_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · **`LOCATED_REVIEWED`** (provisional) |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-C10-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Next canonical medicine (sequence) | **C13** — **not** started or targeted |
| C11 | Excluded 38-set · physical corpus only |
| Registry / runtime changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **C10 blocked · C11 interstitial documented · L692/L693 drift preserved · zero essential owner clinical decisions**
