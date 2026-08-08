# Rule 5 — R5-M6B Medicine Evidence Audit: C2 (Canceroso-2)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 7 of 38 |
| **Medicine code** | C2 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `327c7b61273b6e2e730edce2102479d88e6a30d8` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `C2_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series normalized `MED=C2` corpus block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`) |
| **Registry identity (C2 code in 38-set)** | **VERIFIED** — code `C2` present in v2 registry; **not** owner-source verification |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** only; **no** full provenance or clinical verification claim |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1241** not byte-verified in EHAS2 |
| **Open wrapper** | **OPEN** — no closing `</user_query>` before **`MED=C3`** @ L531 in normalized corpus |
| **Length mismatch** | **OPEN** — declared len **3070** vs normalized inner text (incl. agent tail L527–528) |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **C2**. It:

- Inventories and compares sources; records **essential owner decisions (EOD)** and **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate C2, authorize potency/dosage, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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

## 4. C2 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (`MED=C2` 019c @ L488) | Notes |
|-------|----------------------|--------------------------------------|--------|
| **Code** | `C2` | `C2` | 38-set identity **VERIFIED** |
| **Display name** | Canceroso-2 | CANCEROSO-2 (C2) | Spelling variant |
| **Group** | Canceroso | C-Group (Canceroso) / lower body | Aligned |
| **Medicine number** | Not in v2 row | **11** (औषधि संख्या 11) | Owner-only metadata |
| **Polarity field** | NEGATIVE | Dilution-band Positive/Negative language in §4 potency | **Inventory only** — see EOD-C2-02 |

---

## 5. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-C2-OWNER** | **`PROVISIONAL_OWNER_PRIMARY`** | Legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` · `MED=C2` · L488 header · clinical inventory L491–526 (§1–5 + C2 expert tip) · **exclude L527–528** agent/workflow tail · transcript `019c5012-fbb1-4582-a4af-af8484d1bc5f.jsonl` line **1241** | **Located** · byte proof **pending** |
| **SRC-C2-OWNER-REJECT** | **Non-primary dev/API** | Same corpus · **`MED=C2` @ L4103** · `a984cda7-e825-469a-a314-103933ba44e3.jsonl` line **566**, len **13631** | **Rejected** — not materia (EOD-C2-01) |
| **SRC-C2-MM1E-IDX** | Normalized index | `_doctor_corpus_index.json` · `primary_code: C2`, line 1241, len 3070 | Metadata mirror |
| **SRC-C2-MM2** | Parsed owner copy | `S5MM2_MASTER_MATERIA_MEDICA.json` · `PRIMARY_DOCTOR_BLOCK_FOUND` | Aligns with 019c pointer · spurious **kidney** external **rejected** (EOD-C2-06) |
| **SRC-C2-REG-V2** | Registry v2 | `medicines.v2.json` C2 object | **DERIVED_UNVERIFIED** |
| **SRC-C2-ENGINE** | Legacy engine | `engine_medicines_38.py` | **DERIVED_UNVERIFIED** |
| **SRC-C2-MM3** | MM3/BOOK | `S5_MM3_MASTER_MATERIA_MEDICA.json` | **`UNVERIFIED_BOOK_DERIVED_TEXT`** · quarantine |
| **SRC-C2-UCKB** | Parallel | `UCKB_DATASET_v1.json` | **NOT_ACTIVATED** · external/electricity staging not owner-anchored |

### 5.1 Provisional owner-primary anchor (019c series)

- Normalized corpus contains a **contiguous** `MED=C2` master block (Canceroso-2 / pelvic lower-body glandular narrative).
- **Clinical inventory boundary:** sections **1–5** and **C2 expert tip** (S6/S11 structural support wording) only; **L527–528** (update-only / defer multi-disease test / do not verify named cases) is **workflow/agent tier** — **excluded** from clinical inventory.
- **Duplicate `MED=C2` @ L4103** is Python API/dev mock content — **explicitly rejected** as non-primary.
- **Transcript jsonl** file is **not** present in tracked EHAS2/legacy workspace for line-**1241** byte verification.
- **No** claim of full provenance verification, license sign-off, or clinical validation.

---

## 6. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

These are **EHAS2 documentation governance tokens** — **not** repetitive owner clinical question IDs.

| ID | Token |
|----|--------|
| **TGC-C2-001** | `OWNER_PRIMARY_LOCATED_CORPUS_DUPLICATE_DEV_MED_TAG_REJECTED_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-C2-002** | `RULE4_C2_REFERENCE_ZERO_AUTHORITY` |
| **TGC-C2-003** | `SEPARATE_TRACKS_NO_C2_POTENCY_DILUTION_AUTHORITY` |
| **TGC-C2-004** | `RE_C2_COADMINISTRATION_ZERO_AUTHORITY` |
| **TGC-C2-005** | `DISEASE_INDICATION_MAPPING_ZERO_AUTHORITY` |
| **TGC-C2-006** | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| **TGC-C2-007** | `RULE6_C2_RELATIONSHIP_ZERO_AUTHORITY` |
| **TGC-C2-008** | `QUARANTINE_INVENTORY_ONLY` |
| **TGC-C2-009** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY` |
| **TGC-C2-010** | `KEYWORD_DEFAULT_SELECTION_REJECTED` |

**Index `RECORDED_6`:** counts **essential owner decisions (EOD-C2-01–06)** only — **not** TGC rows. **Do not use `RECORDED_16`.**

---

## 7. Essential owner decisions (EOD-C2-01–06)

| Decision ID | Option | Recorded scope |
|-------------|--------|----------------|
| **EOD-C2-01** | **A** | Accept 019c **`MED=C2` L488** as **`PROVISIONAL_OWNER_PRIMARY`** for §1–5 + C2 expert tip; **exclude L527–528** from clinical inventory; **reject** `a984…` **L4103** duplicate `MED=C2` API/dev block as non-primary; transcript byte proof, open wrapper, and length mismatch **remain open** |
| **EOD-C2-02** | **A** | Owner dilution **Positive/Negative bands** separate from registry medicine-level **`NEGATIVE`** metadata; **descriptive inventory only**; conflict **preserved**; **no** runtime polarity or potency selector |
| **EOD-C2-03** | **A** | Registry **Lymphatic / S6 / S11** affinity = **`DERIVED_UNVERIFIED_AFFINITY_METADATA`**; owner **S6/S11** expert tip **inventory only**; **S6/S11** narrative **inventory only**; **zero** Rule 6 edge |
| **EOD-C2-04** | **A** | **chronic UTI mucosa** in registry/legacy = **`DERIVED_UNVERIFIED`** conflict (exact phrase **absent** from owner block); **no** clinical truth, mapping, efficacy, or selector authority |
| **EOD-C2-05** | **A** | High-dilution **fibroid** / **“cancer possibility”** wording = **descriptive historical source text only**; **no** oncology efficacy, cancer prevention/treatment validation, disease mapping, automatic selection, or safety authorization |
| **EOD-C2-06** | **A** | **Reject** MM2 **kidney** and external/body-point attribution and **UCKB** external staging unless authentic owner-primary route text is produced; **`APPLICATION_ROUTE_AUTHORITY_NONE`** |

These decisions are **documentation of owner authorization** for audit posture — **not** clinical validation or implementation approval.

---

## 8. Disease / Indication Mapping Status

Source-tier inventory (owner §3, keywords, expert tip; registry/engine; MM2; MM3 BOOK; UCKB staging; dev keyword tier; **excluded** agent tail L527–528; **rejected** L4103 dev block) is **preserved** for traceability only.

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

**No** keyword priority, 116k DB mandatory inclusion, or expert-tip selector authority (TGC-C2-010).

---

## 9. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

Includes English `when_to_give`, `disease_clusters` (incl. **chronic UTI mucosa** — EOD-C2-04), `potency_logic`, `temperament_affinity` (incl. **Lymphatic / S6 / S11** — EOD-C2-03), `search_tags`. **No** clinical or selector authority.

---

## 10. MM3 / BOOK quarantine

**TGC-C2-008** — **`UNVERIFIED_BOOK_DERIVED_TEXT`**; inventory only; **`no_merge_with_owner_primary`**; zero Rule 5, route, potency, disease-mapping, combination, or runtime credit.

---

## 11. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4 / BP / mandatory** | **TGC-C2-002** — zero authority in owner block |
| **Potency / dilution** | **TGC-C2-003** — no potency/dosage authority |
| **RE never-mix** | **TGC-C2-004** — zero C2-specific enforcement |
| **Route / application** | **TGC-C2-006** — none; MM2 kidney/external and UCKB staging **rejected** (EOD-C2-06) |
| **Rule 6 / pairs** | **TGC-C2-007** — none; **S6/S11** tip inventory only |
| **Polarity / temperament** | **TGC-C2-009** — inventory only |
| **Oncology / cancer-possibility wording** | **EOD-C2-05** — historical descriptive text only |
| **Duplicate dev `MED=C2`** | **EOD-C2-01** / **CF-C2-008** — rejected non-primary |

---

## 12. Rule 5 safety matrix (summary)

**Incomplete / blocked** — contraindications, pregnancy, interactions, monitoring largely **SOURCE_NOT_FOUND** in owner-primary; BOOK rows quarantined. **`rule5SafetyCoverageComplete: false`**.

---

## 13. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-C2-001** | **OPEN** — length / transcript line **1241** / byte proof |
| **CF-C2-002** | **OPEN** — polarity semantics (EOD-C2-02 preserved) |
| **CF-C2-003** | **OPEN** — BOOK dilution/indications (quarantine) |
| **CF-C2-004** | **OPEN** — UCKB staging vs owner bands |
| **CF-C2-005** | **OPEN** — chronic UTI mucosa derived (EOD-C2-04) |
| **CF-C2-006** | **OPEN** — MM2 kidney / external attribution (EOD-C2-06) |
| **CF-C2-007** | **CLOSED** — keyword/default selection **REJECTED_BY_EXISTING_GOVERNANCE** (TGC-C2-010) |
| **CF-C2-008** | **OPEN** — duplicate **`MED=C2`** dev block @ L4103 |
| **CF-C2-009** | **OPEN** — agent tail L527–528 + open `<user_query>` boundary |

**No silent reconciliation or derived-source promotion.**

---

## 14. Missing-evidence register

**ME-C2-001–006** — all **OPEN** (transcript bytes, license, owner-primary safety text, verified external route, tablet protocol, BOOK integrity).

---

## 15. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | C2 (7/38) |
| Verdict | `C2_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · **`LOCATED_REVIEWED`** (index, provisional qualification) |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner decisions | **EOD-C2-01–06 = A** (**`RECORDED_6`**) |
| Technical governance classifications | **TGC-C2-001–010** · **count 10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Next canonical medicine (sequence) | **C3** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **C2 blocked · provisional primary · agent tail excluded · dev duplicate rejected · no clinical or selector authority**
