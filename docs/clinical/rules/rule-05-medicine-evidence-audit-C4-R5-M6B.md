# Rule 5 — R5-M6B Medicine Evidence Audit: C4 (Canceroso-4)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 9 of 38 |
| **Medicine code** | C4 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `9a27f66bd5fe38dd88c96e5e1f03b9db4acd7bd1` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `C4_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series normalized `MED=C4` corpus block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`) |
| **Registry identity (C4 code in 38-set)** | **VERIFIED** — code `C4` present in v2 registry; **not** owner-source verification |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** only; **no** full provenance or clinical verification claim |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1266** not byte-verified in EHAS2 |
| **Declared transcript length** | **2842** — **OPEN** mismatch vs normalized inner text (not reconciled) |
| **Upstream corpus segmentation** | **C3 inner `</user_query>` at L569** — **no open-wrapper bleed into C4** |
| **C4 inner wrapper** | C4 `<user_query>` opens L575 and **closes at L610** before **`MED=C5`** @ L612 |
| **Duplicate `MED=C4` blocks** | **None found** (single 019c-series tag) |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **C4**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate C4, authorize potency/dosage, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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

## 4. C4 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (`MED=C4` 019c @ L572) | Notes |
|-------|----------------------|--------------------------------------|--------|
| **Code** | `C4` | `C4` | 38-set identity **VERIFIED** |
| **Display name** | Canceroso-4 | CANCEROSO-4 (C4) | Spelling variant |
| **Group** | Canceroso | C-Group (Canceroso) / periosteum–dental | Aligned |
| **Medicine number** | Not in v2 row | **13** (औषधि संख्या 13) | Owner-only metadata |
| **Polarity field** | NEGATIVE | Dilution-band Positive/Negative language in §4 potency | **Inventory only** (TGC-C4-003, TGC-C4-009) |

---

## 5. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-C4-OWNER** | **`PROVISIONAL_OWNER_PRIMARY`** | Legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` · `MED=C4` · L572 header · clinical inventory **L576–608** (§1–5 + C4 expert tip) · inner wrapper closes **L610** · transcript `019c5012-fbb1-4582-a4af-af8484d1bc5f.jsonl` line **1266** | **Located** · byte proof **pending** |
| **SRC-C4-MM1E-IDX** | Normalized index | `_doctor_corpus_index.json` · `primary_code: C4`, line 1266, len 2842 | Metadata mirror |
| **SRC-C4-MM2** | Parsed owner copy | `S5MM2_MASTER_MATERIA_MEDICA.json` · `PRIMARY_DOCTOR_BLOCK_FOUND` | Aligns with 019c pointer · parse defects preserved (e.g. truncated title “13: C”) |
| **SRC-C4-MM2C** | Clinical classification | `S5MM2C_CLINICAL_CLASSIFICATION.json` | **`INTERNAL_ONLY`** · registry mapping samples **review_required** — inventory only |
| **SRC-C4-REG-V2** | Registry v2 | `medicines.v2.json` C4 object | **DERIVED_UNVERIFIED** |
| **SRC-C4-ENGINE** | Legacy engine | `engine_medicines_38.py` | **DERIVED_UNVERIFIED** |
| **SRC-C4-MM3** | MM3/BOOK | `S5_MM3_MASTER_MATERIA_MEDICA.json` | **`UNVERIFIED_BOOK_DERIVED_TEXT`** · quarantine |
| **SRC-C4-UCKB** | Parallel | `UCKB_DATASET_v1.json` | **NOT_ACTIVATED** · external/electricity staging not owner-anchored |
| **SRC-C4-BUILD** | Tooling metadata | `_build_artifacts.py` C4 row (“Nervous-Tissue Remedy”) | **Mis-tagged** vs owner periosteum/dental — **no clinical authority** |
| **SRC-C4-DEV** | Embedded selector | Corpus file `get_tissue_remedy(GYNE→C4)` fragment (outside MED=C4 block) | **Rejected developer fragment** |

### 5.1 Provisional owner-primary anchor (019c series)

- Normalized corpus contains a **single** `MED=C4` master block (Canceroso-4 / periosteum–dental narrative).
- **Clinical inventory boundary:** sections **1–5** and **C4 expert tip** only (**L576–608**); Cursor/Database save lines (**L577–578**) and keyword-priority tip language are **non-operational inventory**.
- **Preceding C3** closes **L569**; **C5** begins **L612** — **no** second `MED=C4`.
- **Transcript jsonl** is **not** byte-verified in EHAS2 for line **1266**.
- **No** claim of full provenance verification, license sign-off, or clinical validation.

---

## 6. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

These are **EHAS2 documentation governance tokens** — **not** owner clinical question IDs and **not** counted in **`RECORDED_0`**.

| ID | Token |
|----|--------|
| **TGC-C4-001** | `OWNER_PRIMARY_LOCATED_CORPUS_CLEAN_WRAPPER_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-C4-002** | `RULE4_C4_REFERENCE_ZERO_AUTHORITY` |
| **TGC-C4-003** | `SEPARATE_TRACKS_NO_C4_POTENCY_DILUTION_AUTHORITY` |
| **TGC-C4-004** | `RE_C4_COADMINISTRATION_ZERO_AUTHORITY` |
| **TGC-C4-005** | `DISEASE_INDICATION_MAPPING_ZERO_AUTHORITY` |
| **TGC-C4-006** | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| **TGC-C4-007** | `RULE6_C4_RELATIONSHIP_ZERO_AUTHORITY` |
| **TGC-C4-008** | `QUARANTINE_INVENTORY_ONLY` |
| **TGC-C4-009** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY` |
| **TGC-C4-010** | `KEYWORD_DEFAULT_SELECTION_REJECTED` |

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions recorded; **TGC-C4-001–010** recorded **separately** (count **10**); **no** clinical authority created. **Do not use `PENDING`, `RECORDED_6`, `RECORDED_10`, or `RECORDED_16`.**

---

## 7. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- Fail-closed technical classifications (provisional primary integrity, build-tool mis-tags, dev GYNE→C4 fragment, polarity tracks, derived registry strings, keyword rejection, route/electricity rejection, quarantine) are recorded under **TGC** and **conflict/missing-evidence registers** — **not** as owner clinical approval questions.
- **S1+C4** expert-tip wording remains **authentic-source inventory** and an **unresolved future clinical relationship** question only — **no** Rule 6 edge, **no** combination authority, **no** pairing authorization, **no** runtime effect.

---

## 8. Disease / Indication Mapping Status

Source-tier inventory preserved for traceability:

| Tier | C4 content (summary) | Authority/posture |
|------|----------------------|-------------------|
| **Owner 019c (provisional)** | Periosteum; teeth and gums; cartilage; synovial membrane; rickets; teething; delayed walking; toothache/caries; gingivitis/pyorrhea; loose teeth; periostitis; exostosis; fracture/callus; surface rheumatism; keywords; expert tip (**S1+C4** inventory wording) | Provisional traceable inventory; not clinically validated |
| **Registry/engine** | English mirror + additions (e.g. periodontitis, osteitis surface, pediatric bone weakness labels) | **`DERIVED_UNVERIFIED`** |
| **MM2 parsed** | Section 3 + keywords + tip | Aligns to owner pointer; parsed/secondary inventory only |
| **MM3/BOOK** | OCR/tablets; primary organ “Nerves”; unrelated organ lists | **`UNVERIFIED_BOOK_DERIVED_TEXT`**; quarantined |
| **UCKB** | External routes + electricity staging + extended potency ladder | Staging / **`NOT_ACTIVATED`** |
| **Developer/116k tier** | Cursor save; `_build_artifacts.py` Nervous-Tissue mis-label; embedded **GYNE→C4** rule; keyword priority language | Non-operational; no selector/mapping authority |

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

**Explicitly inactive:** no disease→C4 selection; no symptom→C4 selection; no keyword/default priority; no efficacy approval; no mapping into the **116k** disease catalog; no runtime or prescription effect (TGC-C4-005, TGC-C4-010).

---

## 9. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

Includes English `when_to_give`, `disease_clusters`, `potency_logic`, `temperament_affinity` (Balanced / Lymphatic / Sanguine / **S1** synergy strings), `search_tags`. **No** clinical or selector authority.

---

## 10. MM3 / BOOK quarantine

**TGC-C4-008** — **`UNVERIFIED_BOOK_DERIVED_TEXT`**; inventory only; **`no_merge_with_owner_primary`**; zero Rule 5, route, potency, disease-mapping, combination, or runtime credit.

---

## 11. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4 / BP / mandatory** | **TGC-C4-002** — zero authority in owner block |
| **Potency / dilution** | **TGC-C4-003** — no potency/dosage authority |
| **RE never-mix** | **TGC-C4-004** — zero C4-specific enforcement |
| **Route / application** | **TGC-C4-006** — none; UCKB external/electricity **rejected** |
| **Rule 6 / pairs** | **TGC-C4-007** — none; **S1+C4** tip **inventory only** |
| **Polarity / temperament** | **TGC-C4-009** — inventory only |
| **Keyword / default selection** | **TGC-C4-010** — rejected |

---

## 12. Rule 5 safety matrix (summary)

**Incomplete / blocked** — contraindications, pregnancy, interactions, monitoring largely **SOURCE_NOT_FOUND** in owner-primary; BOOK/UCKB rows quarantined or not activated. **`rule5SafetyCoverageComplete: false`**.

---

## 13. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-C4-001** | **OPEN** — transcript line **1266** / len **2842** / byte proof |
| **CF-C4-002** | **OPEN** — polarity semantics (registry **`NEGATIVE`** vs dilution bands; BOOK Positive) |
| **CF-C4-003** | **OPEN** — BOOK vs owner indications/organs (quarantine) |
| **CF-C4-004** | **OPEN** — UCKB external/electricity/marrow vs owner oral master |
| **CF-C4-005** | **OPEN** — registry cluster deltas (e.g. periodontitis) vs owner §3 |
| **CF-C4-006** | **OPEN** — `_build_artifacts.py` **Nervous-Tissue** mis-label vs owner C4 |
| **CF-C4-007** | **OPEN** — embedded **`GYNE → C4`** dev rule vs owner periosteum/dental anatomy |
| **CF-C4-008** | **OPEN** — MM2 identity parse truncation (“औषधि संख्या 13: C”) |
| **CF-C4-009** | **OPEN** — MM3 BOOK primary organ (Nerves) vs owner bone/dental §2 |
| **CF-C4-010** | **CLOSED** — keyword/default **selection activation** **REJECTED_BY_EXISTING_GOVERNANCE** (TGC-C4-010); historical wording may remain inventory |

**No silent reconciliation or derived-source promotion.**

---

## 14. Missing-evidence register

**ME-C4-001–006** — all **OPEN** (transcript bytes, license, owner-primary safety text, verified external route, tablet/compress protocol, BOOK integrity).

---

## 15. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | C4 (9/38) |
| Verdict | `C4_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · **`LOCATED_REVIEWED`** (index, provisional qualification) |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE** (**count 0** · index **`RECORDED_0`**) |
| Technical governance classifications | **TGC-C4-001–010** · **count 10** (separate from owner-decision column) |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Next canonical medicine (sequence) | **C5** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **C4 blocked · provisional primary · zero essential owner clinical decisions · no clinical or selector authority**
