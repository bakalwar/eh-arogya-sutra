# Rule 5 — R5-M6B Medicine Evidence Audit: C1 (Canceroso-1)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 6 of 38 |
| **Medicine code** | C1 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `26d4c677de275f9858700df5474e0cddba06a9cc` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `C1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (normalized `MED=C1` corpus block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`) |
| **Registry identity (C1 code in 38-set)** | **VERIFIED** — code `C1` present in v2 registry; **not** owner-source verification |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** only; **no** full provenance or clinical verification claim |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1217** not byte-verified in EHAS2 |
| **Length mismatch** | **OPEN** — declared len **2789** vs normalized inner text ~**2770** |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` · git blob `5bba8d6fe05effc775e88ddfba93c1e572f069cb` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` · `artifactSha256`: `1C29F194B4B8EF6B45DBE75FE82EA7F660A51F48952BB7050B9A0BD86990B814` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **C1**. It:

- Inventories and compares sources; records **essential owner decisions (EOD)** and **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate C1, authorize potency/dosage, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/MM3 BOOK strings as owner-verified clinical truth.
- Preserves disease/indication **source-tier inventory** with **zero** mapping or selection authority.

**Posture flags (final):**

| Flag | Value |
|------|--------|
| `clinicallyValidated` | `false` |
| `rule5SafetyCoverageComplete` | `false` |
| `ownerPrimaryVerified` | `false` |
| `ownerSourceStatus` | **`LOCATED_REVIEWED`** (index) · artifact **`PROVISIONAL_OWNER_PRIMARY`** |
| `provenanceStatus` | **`INCOMPLETE_NOT_VERIFIED`** |
| `routeAuthority` | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| `potencyAuthorized` | `false` |
| `dosageAuthorized` | `false` |
| `evidenceActivated` | `false` |
| `rule6MedicineRelationshipAuthority` | `NONE` |
| `runtimeAuthorized` | `false` |

---

## 4. C1 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (`MED=C1`) | Notes |
|-------|----------------------|---------------------------|--------|
| **Code** | `C1` | `C1` | 38-set identity **VERIFIED** |
| **Display name** | Canceroso-1 | CANCEROSO-1 (C1) | Spelling variant |
| **Group** | Canceroso | C-Group (Canceroso) | Aligned |
| **Medicine number** | Not in v2 row | **10** (औषधि संख्या 10) | Owner-only metadata |
| **Polarity field** | NEGATIVE | Dilution-band Positive/Negative language in §4 potency | **Inventory only** — see EOD-C1-02 |

---

## 5. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-C1-OWNER** | **`PROVISIONAL_OWNER_PRIMARY`** | Legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` · `MED=C1` · L446 header · body L448–484 · transcript `019c5012-fbb1-4582-a4af-af8484d1bc5f.jsonl` line **1217** | **Located** · byte proof **pending** |
| **SRC-C1-MM1E-IDX** | Normalized index | `_doctor_corpus_index.json` · `primary_code: C1`, line 1217, len 2789 | Metadata mirror |
| **SRC-C1-MM2** | Parsed owner copy | `S5MM2_MASTER_MATERIA_MEDICA.json` · `PRIMARY_DOCTOR_BLOCK_FOUND` | Aligns with corpus · external body points **rejected** (EOD-C1-06) |
| **SRC-C1-REG-V2** | Registry v2 | `medicines.v2.json` C1 object | **DERIVED_UNVERIFIED** |
| **SRC-C1-ENGINE** | Legacy engine | `engine_medicines_38.py` | **DERIVED_UNVERIFIED** |
| **SRC-C1-MM3** | MM3/BOOK | `S5_MM3_MASTER_MATERIA_MEDICA.json` | **`UNVERIFIED_BOOK_DERIVED_TEXT`** · quarantine |
| **SRC-C1-UCKB** | Parallel | `UCKB_DATASET_v1.json` | **NOT_ACTIVATED** |

### 5.1 Provisional owner-primary anchor

- Normalized corpus contains a **contiguous** `MED=C1` master block (Canceroso-1 / glandular master narrative).
- **Transcript jsonl** file is **not** present in tracked EHAS2/legacy workspace for line-**1217** byte verification.
- **No** claim of full provenance verification, license sign-off, or clinical validation.

---

## 6. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

These are **EHAS2 documentation governance tokens** — **not** repetitive owner clinical question IDs.

| ID | Token |
|----|--------|
| **TGC-C1-001** | `OWNER_PRIMARY_LOCATED_CORPUS_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-C1-002** | `RULE4_C1_REFERENCE_ZERO_AUTHORITY` |
| **TGC-C1-003** | `SEPARATE_TRACKS_NO_C1_POTENCY_DILUTION_AUTHORITY` |
| **TGC-C1-004** | `RE_C1_COADMINISTRATION_ZERO_AUTHORITY` |
| **TGC-C1-005** | `DISEASE_INDICATION_MAPPING_ZERO_AUTHORITY` |
| **TGC-C1-006** | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| **TGC-C1-007** | `RULE6_C1_RELATIONSHIP_ZERO_AUTHORITY` |
| **TGC-C1-008** | `QUARANTINE_INVENTORY_ONLY` |
| **TGC-C1-009** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY` |
| **TGC-C1-010** | `KEYWORD_DEFAULT_SELECTION_REJECTED` |

**Index `RECORDED_6`:** counts **essential owner decisions (EOD-C1-01–06)** only — **not** TGC rows.

---

## 7. Essential owner decisions (EOD-C1-01–06)

| Decision ID | Option | Recorded scope |
|-------------|--------|----------------|
| **EOD-C1-01** | **A** | Accept normalized **`MED=C1`** corpus block as **`PROVISIONAL_OWNER_PRIMARY`**; transcript jsonl line **1217** byte proof and length mismatch remain **open**; **no** full provenance verification claim |
| **EOD-C1-02** | **A** | Owner dilution **Positive/Negative bands** separate from registry medicine-level **`NEGATIVE`** metadata; **descriptive inventory only**; conflict **preserved**; **no** runtime polarity or potency selector |
| **EOD-C1-03** | **A** | Registry **Lymphatic/Balanced/S1** affinity = **`DERIVED_UNVERIFIED_AFFINITY_METADATA`**; owner-primary **silent** on structured temperament; **S1** narrative **inventory only**; **zero** Rule 6 edge |
| **EOD-C1-04** | **A** | **PCOD cysts** in registry/legacy = **`DERIVED_UNVERIFIED`** conflict (owner block **silent**); **no** clinical truth, mapping, efficacy, or selector authority |
| **EOD-C1-05** | **A** | High-dilution **“cancer-like conditions”** wording = **descriptive historical source text only**; **no** oncology efficacy, cancer-treatment validation, disease mapping, automatic selection, or safety authorization |
| **EOD-C1-06** | **A** | **Reject** MM2/CSV **abdomen** and **neck-occiput** external/body-point attribution unless authentic owner-primary text is produced; **`APPLICATION_ROUTE_AUTHORITY_NONE`** |

These decisions are **documentation of owner authorization** for audit posture — **not** clinical validation or implementation approval.

---

## 8. Disease / Indication Mapping Status

Source-tier inventory (owner §3, registry, MM2, MM3 BOOK, UCKB staging, dev keyword tier) is **preserved** for traceability only.

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

**No** keyword priority, 116k DB mandatory inclusion, or expert-tip selector authority (TGC-C1-010).

---

## 9. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

Includes English `when_to_give`, `disease_clusters`, `potency_logic`, `temperament_affinity` (incl. **PCOD cysts** — EOD-C1-04), `search_tags`. **No** clinical or selector authority.

---

## 10. MM3 / BOOK quarantine

**TGC-C1-008** — **`UNVERIFIED_BOOK_DERIVED_TEXT`**; inventory only; **`no_merge_with_owner_primary`**; zero Rule 5, route, potency, disease-mapping, combination, or runtime credit.

---

## 11. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4 / BP / mandatory** | **TGC-C1-002** — zero authority in owner block |
| **Potency / dilution** | **TGC-C1-003** — no potency/dosage authority |
| **RE never-mix** | **TGC-C1-004** — zero C1-specific enforcement |
| **Route / application** | **TGC-C1-006** — none; MM2 external points **rejected** (EOD-C1-06) |
| **Rule 6 / pairs** | **TGC-C1-007** — none; **S1** tip inventory only |
| **Polarity / temperament** | **TGC-C1-009** — inventory only |
| **Oncology / cancer-like wording** | **EOD-C1-05** — historical descriptive text only |

---

## 12. Rule 5 safety matrix (summary)

**Incomplete / blocked** — contraindications, pregnancy, interactions, monitoring largely **SOURCE_NOT_FOUND** in owner-primary; BOOK rows quarantined. **`rule5SafetyCoverageComplete: false`**.

---

## 13. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-C1-001** | **OPEN** — length / transcript line **1217** |
| **CF-C1-002** | **OPEN** — polarity semantics (EOD-C1-02 preserved) |
| **CF-C1-003** | **OPEN** — BOOK dilution (quarantine) |
| **CF-C1-004** | **OPEN** — UCKB staging vs owner bands |
| **CF-C1-005** | **OPEN** — PCOD derived (EOD-C1-04) |
| **CF-C1-006** | **OPEN** — bodyloc / external attribution (EOD-C1-06) |
| **CF-C1-007** | **CLOSED** — keyword/default selection **REJECTED_BY_EXISTING_GOVERNANCE** (TGC-C1-010) |

---

## 14. Missing-evidence register

**ME-C1-001–006** — all **OPEN** (transcript bytes, license, owner-primary safety text, verified external route, tablet protocol, BOOK integrity).

---

## 15. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | C1 (6/38) |
| Verdict | `C1_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · **`LOCATED_REVIEWED`** (index) |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner decisions | **EOD-C1-01–06 = A** (**`RECORDED_6`**) |
| Technical governance classifications | **TGC-C1-001–010** · **count 10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Next canonical medicine (sequence) | **C2** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **C1 blocked · provisional primary · no clinical or selector authority**
