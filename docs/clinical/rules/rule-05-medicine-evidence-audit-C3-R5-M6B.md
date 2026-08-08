# Rule 5 — R5-M6B Medicine Evidence Audit: C3 (Canceroso-3)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 8 of 38 |
| **Medicine code** | C3 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `b6bca7f6a10ffcd3d703c7aab34be27aed53d922` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `C3_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series normalized `MED=C3` corpus block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`) |
| **Registry identity (C3 code in 38-set)** | **VERIFIED** — code `C3` present in v2 registry; **not** owner-source verification |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** only; **no** full provenance or clinical verification claim |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1254** not byte-verified in EHAS2 |
| **Declared transcript length** | **2828** — **OPEN** mismatch vs normalized inner text (not reconciled) |
| **Upstream corpus segmentation** | **OPEN** — prior **C2** block lacks closing `</user_query>` before **`MED=C3`** @ L531; **C2 L527–528 agent tail not attributed to C3** |
| **C3 inner wrapper** | C3 `<user_query>` opens L534 and **closes at L569** before **`MED=C4`** |
| **Duplicate `MED=C3` blocks** | **None found** (single 019c-series tag) |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **C3**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate C3, authorize potency/dosage, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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

## 4. C3 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (`MED=C3` 019c @ L531) | Notes |
|-------|----------------------|--------------------------------------|--------|
| **Code** | `C3` | `C3` | 38-set identity **VERIFIED** |
| **Display name** | Canceroso-3 | CANCEROSO-3 (C3) | Spelling variant |
| **Group** | Canceroso | C-Group (Canceroso) / skin structure | Aligned |
| **Medicine number** | Not in v2 row | **12** (औषधि संख्या 12) | Owner-only metadata |
| **Polarity field** | NEGATIVE | Dilution-band Positive/Negative language in §4 potency | **Inventory only** (TGC-C3-003, TGC-C3-009) |

---

## 5. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-C3-OWNER** | **`PROVISIONAL_OWNER_PRIMARY`** | Legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` · `MED=C3` · L531 header · clinical inventory **L535–568** (§1–5 + C3 expert tip) · inner wrapper closes **L569** · transcript `019c5012-fbb1-4582-a4af-af8484d1bc5f.jsonl` line **1254** | **Located** · byte proof **pending** |
| **SRC-C3-MM1E-IDX** | Normalized index | `_doctor_corpus_index.json` · `primary_code: C3`, line 1254, len 2828 | Metadata mirror |
| **SRC-C3-MM2** | Parsed owner copy | `S5MM2_MASTER_MATERIA_MEDICA.json` · `PRIMARY_DOCTOR_BLOCK_FOUND` | Aligns with 019c pointer · parse defects preserved (e.g. truncated title) |
| **SRC-C3-REG-V2** | Registry v2 | `medicines.v2.json` C3 object | **DERIVED_UNVERIFIED** |
| **SRC-C3-ENGINE** | Legacy engine | `engine_medicines_38.py` | **DERIVED_UNVERIFIED** |
| **SRC-C3-MM3** | MM3/BOOK | `S5_MM3_MASTER_MATERIA_MEDICA.json` | **`UNVERIFIED_BOOK_DERIVED_TEXT`** · quarantine |
| **SRC-C3-UCKB** | Parallel | `UCKB_DATASET_v1.json` | **NOT_ACTIVATED** · external/electricity staging not owner-anchored |

### 5.1 Provisional owner-primary anchor (019c series)

- Normalized corpus contains a **single** `MED=C3` master block (Canceroso-3 / dermal structure narrative).
- **Clinical inventory boundary:** sections **1–5** and **C3 expert tip** only (**L535–568**); **do not** attribute **C2 L527–528** workflow/agent tail to C3.
- **No** duplicate developer/API `MED=C3` block was located.
- **Transcript jsonl** is **not** present in tracked EHAS2/legacy workspace for line-**1254** byte verification.
- **No** claim of full provenance verification, license sign-off, or clinical validation.

---

## 6. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

These are **EHAS2 documentation governance tokens** — **not** owner clinical question IDs and **not** counted in **`RECORDED_0`**.

| ID | Token |
|----|--------|
| **TGC-C3-001** | `OWNER_PRIMARY_LOCATED_CORPUS_UPSTREAM_SEGMENTATION_OPEN_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-C3-002** | `RULE4_C3_REFERENCE_ZERO_AUTHORITY` |
| **TGC-C3-003** | `SEPARATE_TRACKS_NO_C3_POTENCY_DILUTION_AUTHORITY` |
| **TGC-C3-004** | `RE_C3_COADMINISTRATION_ZERO_AUTHORITY` |
| **TGC-C3-005** | `DISEASE_INDICATION_MAPPING_ZERO_AUTHORITY` |
| **TGC-C3-006** | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| **TGC-C3-007** | `RULE6_C3_RELATIONSHIP_ZERO_AUTHORITY` |
| **TGC-C3-008** | `QUARANTINE_INVENTORY_ONLY` |
| **TGC-C3-009** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY` |
| **TGC-C3-010** | `KEYWORD_DEFAULT_SELECTION_REJECTED` |

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions recorded; **TGC-C3-001–010** recorded **separately** (count **10**); **no** clinical authority created. **Do not use `PENDING`, `RECORDED_6`, `RECORDED_10`, or `RECORDED_16`.**

---

## 7. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- Fail-closed technical classifications (provisional primary integrity, polarity tracks, derived registry strings, keyword rejection, route/electricity rejection, quarantine) are recorded under **TGC** and **conflict/missing-evidence registers** — **not** as owner clinical approval questions.
- **C3+S3** expert-tip wording remains **authentic-source inventory** and an **unresolved future clinical relationship** question only — **no** Rule 6 edge, **no** combination authority, **no** pairing authorization, **no** runtime effect.

---

## 8. Disease / Indication Mapping Status

Source-tier inventory preserved for traceability:

| Tier | C3 content (summary) |
|------|----------------------|
| **Owner 019c (provisional)** | Skin structure vs **S3** function; abscess/boils; chronic eczema; psoriasis; deep fungal; severe acne/pustules; pigmentation; leucoderma; chronic ulcers; fistula; hair/nail fungal; keywords; expert tip (incl. **C3+S3** inventory wording) |
| **Registry/engine** | English mirror + additions (e.g. **cellulitis**, melasma/vitiligo labels, tinea profunda, alopecia, scalp infection) — **`DERIVED_UNVERIFIED`** |
| **MM2 parsed** | Section 3 + keywords + tip; aligns to owner pointer |
| **MM3/BOOK** | OCR/tablets/unrelated organ lists | **`UNVERIFIED_BOOK_DERIVED_TEXT`** |
| **UCKB** | External routes + electricity staging | **NOT_ACTIVATED** |
| **Developer/116k tier** | Cursor save + mandatory keyword priority language | **Non-operational inventory** only |

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

**Explicitly inactive:** no disease→C3 selection; no symptom→C3 selection; no keyword priority; no efficacy approval; no mapping into the **116k** disease catalog; no runtime or prescription effect (TGC-C3-005, TGC-C3-010).

---

## 9. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

Includes English `when_to_give`, `disease_clusters`, `potency_logic`, `temperament_affinity` (Lymphatic / Balanced / Nervous / **S3** synergy strings), `search_tags`. **No** clinical or selector authority.

---

## 10. MM3 / BOOK quarantine

**TGC-C3-008** — **`UNVERIFIED_BOOK_DERIVED_TEXT`**; inventory only; **`no_merge_with_owner_primary`**; zero Rule 5, route, potency, disease-mapping, combination, or runtime credit.

---

## 11. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4 / BP / mandatory** | **TGC-C3-002** — zero authority in owner block |
| **Potency / dilution** | **TGC-C3-003** — no potency/dosage authority |
| **RE never-mix** | **TGC-C3-004** — zero C3-specific enforcement |
| **Route / application** | **TGC-C3-006** — none; UCKB external/electricity **rejected** |
| **Rule 6 / pairs** | **TGC-C3-007** — none; **C3+S3** tip **inventory only** |
| **Polarity / temperament** | **TGC-C3-009** — inventory only |
| **Keyword / default selection** | **TGC-C3-010** — rejected |

---

## 12. Rule 5 safety matrix (summary)

**Incomplete / blocked** — contraindications, pregnancy, interactions, monitoring largely **SOURCE_NOT_FOUND** in owner-primary; BOOK/UCKB rows quarantined or not activated. **`rule5SafetyCoverageComplete: false`**.

---

## 13. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-C3-001** | **OPEN** — transcript line **1254** / len **2828** / byte proof |
| **CF-C3-002** | **OPEN** — polarity semantics (registry **`NEGATIVE`** vs dilution bands; BOOK Positive) |
| **CF-C3-003** | **OPEN** — BOOK vs owner indications/organs (quarantine) |
| **CF-C3-004** | **OPEN** — UCKB external/electricity vs owner oral master |
| **CF-C3-005** | **OPEN** — registry cluster deltas (e.g. cellulitis) vs owner §3 |
| **CF-C3-006** | **OPEN** — upstream C2 open-wrapper / segmentation before L531 |
| **CF-C3-007** | **CLOSED** — keyword/default **selection activation** **REJECTED_BY_EXISTING_GOVERNANCE** (TGC-C3-010); historical wording may remain inventory |
| **CF-C3-008** | **OPEN** — MM2 identity parse truncation (“औषधि संख्या 12: C”) |
| **CF-C3-009** | **OPEN** — MM3 BOOK primary organ (Nerves) vs owner skin-centric §2 |

**No silent reconciliation or derived-source promotion.**

---

## 14. Missing-evidence register

**ME-C3-001–006** — all **OPEN** (transcript bytes, license, owner-primary safety text, verified external route, tablet protocol, BOOK integrity).

---

## 15. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | C3 (8/38) |
| Verdict | `C3_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · **`LOCATED_REVIEWED`** (index, provisional qualification) |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE** (**count 0** · index **`RECORDED_0`**) |
| Technical governance classifications | **TGC-C3-001–010** · **count 10** (separate from owner-decision column) |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Next canonical medicine (sequence) | **C4** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **C3 blocked · provisional primary · zero essential owner clinical decisions · no clinical or selector authority**
