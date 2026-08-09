# Rule 5 — R5-M6B Medicine Evidence Audit: C13 (Canceroso-13)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 13 of 38 |
| **Medicine code** | C13 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `2de7e3aa1519d4c42cfecb76d9e7278a1dd38aa9` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `C13_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series normalized single `MED=C13` corpus block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **physical C11 corpus block** L731–767 is **boundary context only** — **not** a canonical audit target |
| **Registry identity (C13 code in 38-set)** | **VERIFIED** — code `C13` present in v2 registry; **not** owner-source verification |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** only; **no** full provenance or clinical verification claim |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1354** not byte-verified in EHAS2 |
| **Declared transcript length** | **2691** — **OPEN** vs MM3 `doctor_chars: 2687` (4-char delta unresolved) |
| **C13 inner wrapper** | C13 `<user_query>` opens **L773** and **closes at L807** |
| **Physical predecessor** | **`MED=C11` L731–767** (excluded 38-set) |
| **Canonical predecessor (38-set)** | **C10** (physical **C11** interstitial between C10 and C13) |
| **Physical / canonical successor** | **`MED=C15` L810** (opens **~L813**) |
| **Duplicate `MED=C13` blocks** | **None found** (single normalized tag at **L770**) |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **C13**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate C13, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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

## 4. C13 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (`MED=C13` 019c @ L770) | Notes |
|-------|----------------------|----------------------------------------|--------|
| **Code** | C13 | C13 | 38-set identity **VERIFIED** |
| **Display name** | Canceroso-13 | CANCEROSO-13 (C13) | Spelling variant |
| **Group** | Canceroso | C-Group / throat–rectum mucosa specialist framing | Aligned at label level |
| **Medicine number** | Not in v2 row | **18** (औषधि संख्या 18) | Owner-only metadata |
| **Polarity field** | NEGATIVE | Dilution-band Positive/Negative language in §4 potency | **Inventory only** (TGC-C13-009) |

---

## 5. Provisional owner-primary boundary and line-level inventory map

Normalized corpus reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (EHAS2 read-only pointer; not modified in this phase).

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **`MED=C13` header** | **L770** | Transcript pointer (1354 / 2691) | Metadata only |
| **Inner wrapper open** | **L773** | `<user_query>` | Boundary only |
| **Cursor/Database save** | **L775–776** | Developer persistence instruction | **Excluded** — non-clinical |
| **§1–4 clinical sections** | **L779–801** | Philosophy, affinity, disease clusters, potency §4 | **Provisional inventory only** |
| **116k mapping heading + tags** | **L802–803** (§5 workflow framing) | Keyword workflow label | **Excluded** — non-operational |
| **Expert tip** | **L804–805** | Keyword priority + **C13 + S-Lass + A2** fast-result wording | **Provisional inventory only** — **no C6-style agent tail** appended |
| **Wrapper close** | **L807** | `</user_query>` | Boundary only — **not** a second C13 block |
| **Physical predecessor** | **`MED=C11` L731–767** | Excluded v2 code | **Zero** C13 clinical authority |
| **Canonical predecessor** | **C10** (38-set) | Prior completed audit sequence | C11 physical only between |
| **Physical / canonical successor** | **`MED=C15` L810** (~L813) | Next audit-sequence block | Not started / not targeted |

**Preceding C10 / C11:** C10 closes **L728**; **C11 L731–767** interstitial; **`MED=C13` header L770** — **no** duplicate `MED=C13`.

### 5.1 Line-anchor drift vs prior C10 record (CF-C13-001)

| Item | Prior C10 audit record | Fresh C13 audit observation |
|------|------------------------|----------------------------|
| **C13 pointer in C10 status/artifact** | **`MED=C13` L770** (~L773 open) | **Same header/open**; **wrapper close L807** documented in **this** C13 record only |
| **Disposition** | **Do not rewrite** merged C10 artifact | **OPEN** — close anchor **L807** added here without misrepresenting as second block |

---

## 6. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-C13-OWNER** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=C13` **L770** · bounded inventory **L779–801** + expert tip **L804–805** · wrapper **L773–807** · transcript line **1354** | Located · byte proof **pending** |
| **SRC-C13-MM1E-IDX** | Normalized index | `primary_code: C13`, line 1354, len 2691 | Metadata mirror |
| **SRC-C13-MM2** | Parsed owner copy | `S5MM2_MASTER_MATERIA_MEDICA.json` · `PRIMARY_DOCTOR_BLOCK_FOUND` | **Secondary** parsed inventory · title truncation |
| **SRC-C13-MM2C** | Clinical classification | `S5MM2C_CLINICAL_CLASSIFICATION.json` | **`INTERNAL_ONLY`** · mapping **review_required** |
| **SRC-C13-REG-V2** | Registry v2 | `medicines.v2.json` C13 | **`DERIVED_UNVERIFIED`** |
| **SRC-C13-LEGACY-DUMP** | Legacy stub | `_electrohomeo_medicines_dump.json` | **Rejected** mammary/breast label conflict |
| **SRC-C13-MM3** | MM3/BOOK | `S5_MM3_MASTER_MATERIA_MEDICA.json` | **`UNVERIFIED_BOOK_DERIVED_TEXT`** · quarantine |
| **SRC-C13-UCKB** | Parallel | `UCKB_DATASET_v1.json` | **`NOT_ACTIVATED`** · external routes + electricity staged |
| **SRC-C13-C11-CORPUS** | Physical interstitial | `MED=C11` L731–767 | **Excluded** 38-set · **zero** C13 clinical authority |

---

## 7. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-C13-001** | `OWNER_PRIMARY_LOCATED_WRAPPER_C11_INTERSTITIAL_C15_CANONICAL_SUCCESSOR_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-C13-002** | `RULE4_C13_REFERENCE_ZERO_AUTHORITY_IN_OWNER_BLOCK` |
| **TGC-C13-003** | `SEPARATE_TRACKS_NO_C13_POTENCY_DILUTION_AUTHORITY_MM3_UCKB_BOOK_D500_BAND_CONFLICT` |
| **TGC-C13-004** | `RE_ELECTRICITY_COADMINISTRATION_ZERO_AUTHORITY_UCKB_QUARANTINED` |
| **TGC-C13-005** | `DISEASE_INDICATION_MAPPING_ZERO_AUTHORITY` |
| **TGC-C13-006** | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| **TGC-C13-007** | `RULE6_C13_S_LASS_A2_COMBINATION_TIP_INVENTORY_ONLY` |
| **TGC-C13-008** | `MM3_BOOK_OCR_QUARANTINE_NO_OWNER_MERGE` |
| **TGC-C13-009** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY` |
| **TGC-C13-010** | `KEYWORD_DEFAULT_PRIORITY_AND_FAST_RESULT_LANGUAGE_REJECTED` |

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-C13-001–010** recorded **separately** (count **10**).

---

## 8. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No EOD-C13 table**
- Registry/MM2/MM3/UCKB/C11-boundary derivations are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 9. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded owner-primary (and mirrored registry/MM2 where noted):

- **Organs / affinity:** throat (pharynx, larynx, tonsils), esophagus, rectum/anus, upper trachea
- **Laryngitis / pharyngitis**
- **Tonsillitis** with **C1 co-mention** (adjacency inventory only)
- **Hoarseness**
- **Dysphagia**
- **Piles (hemorrhoids)**
- **Anal fissure**
- **Fistula-in-ano**
- **Rectal prolapse**
- **Painful chronic constipation**
- **Pruritus ani**
- **Expert tip:** **C13 + S-Lass + A2** combination and fast-result wording — **inventory only** (TGC-C13-007, TGC-C13-010)

---

## 10. High-stakes source claims (inventory only)

Owner §3, §5 keyword tokens (**Fissure-Cure**, **Piles-Remedy**, etc.), expert-tip **fast-result** language, and quarantined BOOK/OCR tokens (e.g. pneumonia, stupor, bleeding mucosa) are preserved as **provisional historical/source inventory** only.

**Explicitly not asserted:**

- **Fissure-Cure** and **fast-result** language are **historical tags/wording only**
- No **treatment** or **cure validation**
- No **bleeding / pneumonia / neurological efficacy** claim
- No **prevention** or **prognosis** claim
- No **safety authorization**
- No **emergency-care substitution**
- No **potency/dosage authorization** (including owner §4 **D10–D500** bands vs registry **D10–D200** conflict)
- No **automatic disease mapping** or **116k** catalog activation
- No **prescription/runtime** activation

---

## 11. Disease / Indication Mapping Status

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

**Explicitly inactive:** no disease→C13 or symptom→C13 selection; no keyword/default priority; no efficacy approval; no runtime effect (TGC-C13-005, TGC-C13-010).

---

## 12. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

English throat/rectal narrative, `when_to_give` list, potency_logic (**D10–D200** high band vs owner **D500** mention), temperament **C13 + S-Lass + A2** strings — **inventory only**; **no** clinical or selector authority.

**Legacy dump conflict:** mammary/breast lump label **rejected** as C13 identity (**CF-C13-005**).

---

## 13. MM3 / BOOK quarantine

**TGC-C13-008** — **`UNVERIFIED_BOOK_DERIVED_TEXT`**; **`no_merge_with_owner_primary`**; Blood-primary organ label, OCR disease flood (pneumonia, stupor, etc.), external gargle/sitz/compress/tablet — **zero** Rule 5, route, potency, disease-mapping, electricity, or runtime credit.

---

## 14. UCKB staging (`NOT_ACTIVATED`)

External application routes and **BE/YE/GE** electricity pairings — **quarantined**; **TGC-C13-004**.

---

## 15. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4** | **TGC-C13-002** — zero Rule 4 medicine reference in owner C13 block |
| **Potency / dilution** | **TGC-C13-003** — owner §4 inventory only (incl. **D500** band text); MM3/UCKB/registry bands **rejected** for authority |
| **RE / electricity** | **TGC-C13-004** — UCKB **quarantined** |
| **Route** | **TGC-C13-006** — none; BOOK/MM3 external claims **rejected** (CF-C13-011) |
| **Rule 6 / S-Lass + A2** | **TGC-C13-007** — **inventory only** |
| **C1 adjacency** | Tonsillitis co-mention — **historical inventory only** |
| **Polarity / temperament** | **TGC-C13-009** — inventory only |
| **Keyword / fast-result priority** | **TGC-C13-010** — rejected |

---

## 16. Rule 5 safety matrix (summary)

**Incomplete / blocked** — contraindications, pregnancy/lactation, interactions, monitoring, overdose, emergency exclusions **SOURCE_NOT_FOUND** in bounded owner-primary; BOOK/UCKB **no credit**. **`rule5SafetyCoverageComplete: false`**.

---

## 17. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-C13-001** | **OPEN** — transcript **1354** / len **2691** / byte proof; **C10 artifact C13 open-only pointer** vs **wrapper close L807** in this record (C10 **not rewritten**) |
| **CF-C13-002** | **OPEN** — index **2691** vs MM3 **2687** |
| **CF-C13-003** | **OPEN** — MM2 title truncation `औषधि संख्या 18: C` |
| **CF-C13-004** | **OPEN** — **C11 interstitial block** L731–767 between C10 and C13; canonical gap **C10→C13** |
| **CF-C13-005** | **OPEN** — legacy dump **mammary/breast** vs owner throat/rectum narrative |
| **CF-C13-006** | **OPEN** — BOOK vs owner polarity/indications/organ labels |
| **CF-C13-007** | **OPEN** — BOOK OCR disease flood vs owner §3 |
| **CF-C13-008** | **OPEN** — BOOK/UCKB external gargle/sitz/compress/tablet vs silent owner route |
| **CF-C13-009** | **OPEN** — owner **D10–D500** vs registry **D10–D200** high band |
| **CF-C13-010** | **CLOSED** — keyword priority + **fast-result** activation **REJECTED** (TGC-C13-010); wording remains inventory |
| **CF-C13-011** | **CLOSED** — BOOK/MM3 **external** route claims **REJECTED**; **`routeAuthority` remains none** |

**No silent reconciliation.**

---

## 18. Missing-evidence register

| ID | Topic | Status |
|----|--------|--------|
| **ME-C13-001** | Transcript byte and declared-length verification | **OPEN** |
| **ME-C13-002** | License, publication, and redistribution provenance | **OPEN** |
| **ME-C13-003** | Owner-primary Rule 5 safety text | **OPEN** |
| **ME-C13-004** | Verified owner-primary route/application evidence | **OPEN** |
| **ME-C13-005** | Verified potency/dosage protocol, ceilings (incl. D500 vs registry) | **OPEN** |
| **ME-C13-006** | MM3/BOOK bibliographic provenance and OCR integrity | **OPEN** |
| **ME-C13-007** | Verified S-Lass/A2/C1 combination and electricity relationship evidence | **OPEN** |

Evidence gaps only — **not** EODs.

---

## 19. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | C13 (13/38) |
| Verdict | `C13_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · **`LOCATED_REVIEWED`** (provisional) |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-C13-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Next canonical medicine (sequence) | **C15** — **not** started or targeted |
| C11 | Excluded 38-set · physical corpus only |
| Registry / runtime changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **C13 blocked · C11 interstitial documented · L807 close preserved vs C10 open-only pointer · zero essential owner clinical decisions**
