# Rule 5 — R5-M6B Medicine Evidence Audit: C15 (Canceroso-15)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 14 of 38 |
| **Medicine code** | C15 |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-09 |
| **Repository base (EHAS2)** | `599f30ccb7ff317588b6f78807e3917b37646baa` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `C15_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Owner-primary posture** | **`PROVISIONAL_OWNER_PRIMARY`** (019c-series normalized single `MED=C15` corpus block) |

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded from v2 38-set (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`); **not** remapped or replaced |
| **Canonical sequence** | **C13 → C15 → C17** — **no C16** in v2 38-set |
| **Registry identity (C15 code in 38-set)** | **VERIFIED** — code `C15` present in v2 registry; **not** owner-source verification |
| **Registry polarity field** | **NEGATIVE** — metadata only; **not** owner §4 band verification |
| **Owner-primary verification** | **PARTIAL** — **`PROVISIONAL_OWNER_PRIMARY`** only; **no** full provenance or clinical verification claim |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Transcript byte proof** | **PENDING** — jsonl line **1374** not byte-verified; original jsonl **not located** for byte verification in available read-only trees |
| **Declared transcript length** | **2688** — **OPEN** vs MM3 `doctor_chars: 2684` (4-char delta unresolved) |
| **C15 inner wrapper** | C15 `<user_query>` opens **L813** and **closes at L845** |
| **Canonical predecessor** | **C13** (closes **L807**) — **no** physical interstitial between C13 and C15 |
| **Canonical successor** | **`MED=C17` L848** (opens **~L851**) |
| **Duplicate `MED=C15` blocks** | **None found** (single normalized tag at **L810**) |
| **Registry v2 blob (@ base)** | `packages/medicine-registry/src/medicines.v2.json` |
| **Manifest (@ base)** | `packages/medicine-registry/src/registry.v2.manifest.json` |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **C15**. It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate C15, authorize potency/dosage/electricity, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
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

## 4. C15 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary (`MED=C15` 019c @ L810) | Notes |
|-------|----------------------|----------------------------------------|--------|
| **Code** | C15 | C15 | 38-set identity **VERIFIED** |
| **Display name** | Canceroso-15 | CANCEROSO-15 (C15) | Spelling variant |
| **Group** | Canceroso | C-Group / intestinal gland specialist framing | Aligned at label level |
| **Medicine number** | Not in v2 row | **19** (औषधि संख्या 19) | Owner-only metadata |
| **Polarity field** | NEGATIVE | Dilution-band Positive/Negative language in §4 potency | **Inventory only** (TGC-C15-009) |

---

## 5. Provisional owner-primary boundary and line-level inventory map

Normalized corpus reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (EHAS2 read-only pointer; not modified in this phase).

| Corpus region | Lines | Role | Clinical authority |
|---------------|-------|------|--------------------|
| **`MED=C15` header** | **L810** | Transcript pointer (1374 / 2688) | Metadata only |
| **Inner wrapper open** | **L813** | `<user_query>` | Boundary only |
| **Cursor/Database save** | **L815–816** | Developer persistence instruction | **Excluded** — non-clinical |
| **§1–4 clinical sections** | **L819–839** | Philosophy, affinity, disease clusters, potency §4 | **Provisional inventory only** |
| **116k mapping heading + tags** | **L840–841** (§5 workflow framing) | Keyword workflow label | **Excluded** — non-operational |
| **Expert tip** | **L842–843** | Keyword priority + **C15 + S10** “magical effect” wording | **Provisional inventory only** — **no C6-style agent tail** appended |
| **Wrapper close** | **L845** | `</user_query>` | Boundary only — **not** a second C15 block |
| **Canonical predecessor** | **C13** — inner close **L807** | Prior completed audit sequence | **No C13 bleed** into C15 inventory |
| **Physical interstitial** | **None** between C13 and C15 | — | — |
| **Canonical successor** | **`MED=C17` L848** (~L851) | Next audit-sequence block | Not started / not targeted |

**Mock/API corpus references** (e.g. remedy arrays elsewhere in normalized corpus) are **not** second owner-primary blocks.

---

## 6. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-C15-OWNER** | **`PROVISIONAL_OWNER_PRIMARY`** | `MED=C15` **L810** · bounded inventory **L819–839** + expert tip **L842–843** · wrapper **L813–845** · transcript line **1374** | Located · byte proof **pending** |
| **SRC-C15-MM1E-IDX** | Normalized index | `primary_code: C15`, line 1374, len 2688 | Metadata mirror |
| **SRC-C15-MM2** | Parsed owner copy | `S5MM2_MASTER_MATERIA_MEDICA.json` · `PRIMARY_DOCTOR_BLOCK_FOUND` | **Secondary** parsed inventory · title truncation · **`external_use: YES` / abdomen** |
| **SRC-C15-MM2C** | Clinical classification | `S5MM2C_CLINICAL_CLASSIFICATION.json` | **`INTERNAL_ONLY`** · registry ICD mapping samples **review_required** |
| **SRC-C15-REG-V2** | Registry v2 | `medicines.v2.json` C15 | **`DERIVED_UNVERIFIED`** |
| **SRC-C15-LEGACY-DUMP** | Legacy stub | `_electrohomeo_medicines_dump.json` | **Rejected** connective-tissue identity conflict |
| **SRC-C15-MM3** | MM3/BOOK | `S5_MM3_MASTER_MATERIA_MEDICA.json` | **`UNVERIFIED_BOOK_DERIVED_TEXT`** · quarantine |
| **SRC-C15-UCKB** | Parallel | `UCKB_DATASET_v1.json` | **`NOT_ACTIVATED`** · stomach/gastric narrative + electricity staged |
| **SRC-C15-DEV-API** | Developer/API mock | Normalized corpus remedy-list fragments | **Rejected** / non-operational |

---

## 7. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-C15-001** | `OWNER_PRIMARY_LOCATED_WRAPPER_C13_PREDECESSOR_C17_CANONICAL_SUCCESSOR_TRANSCRIPT_BYTE_PROOF_PENDING` |
| **TGC-C15-002** | `RULE4_C15_REFERENCE_ZERO_AUTHORITY_IN_OWNER_BLOCK` |
| **TGC-C15-003** | `SEPARATE_TRACKS_NO_C15_POTENCY_DILUTION_AUTHORITY_MM3_UCKB_BOOK_D500_BAND_CONFLICT` |
| **TGC-C15-004** | `RE_ELECTRICITY_COADMINISTRATION_ZERO_AUTHORITY_UCKB_STOMACH_NARRATIVE_QUARANTINED` |
| **TGC-C15-005** | `DISEASE_INDICATION_MAPPING_ZERO_AUTHORITY` |
| **TGC-C15-006** | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| **TGC-C15-007** | `RULE6_C15_S10_COMBINATION_TIP_INVENTORY_ONLY` |
| **TGC-C15-008** | `MM3_BOOK_OCR_QUARANTINE_NO_OWNER_MERGE` |
| **TGC-C15-009** | `POLARITY_TEMPERAMENT_INVENTORY_ONLY` |
| **TGC-C15-010** | `KEYWORD_DEFAULT_PRIORITY_CURE_TAG_AND_MAGICAL_EFFECT_LANGUAGE_REJECTED` |

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-C15-001–010** recorded **separately** (count **10**).

---

## 8. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No EOD-C15 table**
- Registry/MM2/MM3/UCKB/dev derivations are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 9. Provisional owner-source disease / organ inventory (mapping inactive)

Preserved **only** as historical/source-tier inventory from bounded owner-primary (and mirrored registry/MM2 where noted):

- **Organs / affinity:** intestinal glands, villi, mucosal secretion, lymphatic absorption, lower GI mucosa
- **Chronic diarrhea**
- **Dysentery** (mucus/blood-stool wording)
- **Cholera** (**supportive** wording in owner §3)
- **IBS / malabsorption**
- **Marasmus**
- **Vitamin/mineral malabsorption**
- **Iron-deficiency / anemia absorption framing**
- **Intestinal colic**
- **Intestinal decay** wording
- **Potency §4:** **D1–D3 + D5 NEUTRAL** low band; **D10–D500** high band — inventory only
- **Keywords:** **Dysentery-Cure**, Diarrhea-Remedy, Mucus-Stool-Treatment, Absorption-Booster, etc.
- **S15-unavailable** historical placeholder in §1 — **not** combination authority
- **Expert tip:** **C15 priority** language + **C15 + S10** “magical effect” — **inventory only** (TGC-C15-007, TGC-C15-010)

---

## 10. High-stakes source claims (inventory only)

Owner §3, §5 keyword tokens (**Dysentery-Cure**, cholera support, marasmus, intestinal decay, etc.), expert-tip **magical effect** language, and quarantined BOOK/UCKB tokens are preserved as **provisional historical/source inventory** only.

**Explicitly not asserted:**

- No **treatment** or **cure validation**
- No **efficacy**, **prevention**, or **prognosis** claim
- No **safety authorization**
- No **emergency-care substitution**
- No **potency/dosage authorization** (including owner §4 **D10–D500** bands vs registry **D10–D200** conflict)
- No **automatic disease mapping** or **116k** catalog activation
- No **selector** or **prescription/runtime** activation

---

## 11. Disease / Indication Mapping Status

| Flag | Value |
|------|--------|
| `diseaseClaimsClinicallyValidated` | `false` |
| `diseaseMedicineMappingAuthorized` | `false` |
| `diseaseMedicineMappingImplemented` | `false` |
| `affectsClinicalSelection` | `false` |

**Explicitly inactive:** no disease→C15 or symptom→C15 selection; no keyword/default priority; no MM2C/registry ICD staging authority; no runtime effect (TGC-C15-005, TGC-C15-010).

---

## 12. Registry / legacy derived inventory (`DERIVED_UNVERIFIED`)

English intestinal-gland narrative, disease clusters, potency_logic (**D10–D200** high band vs owner **D500** mention), temperament **S10+C15** pairing strings, and search tags — **inventory only**; **no** clinical or selector authority.

**Legacy dump conflict:** connective-tissue / tissue-degeneration label **rejected** as C15 identity (**CF-C15-005**).

---

## 13. MM3 / BOOK quarantine

**TGC-C15-008** — **`UNVERIFIED_BOOK_DERIVED_TEXT`**; **`no_merge_with_owner_primary`**; stomach/digestion primary organ, **Positive** polarity, OCR/table garbage indications, ointment/compress/globule/tablet external routes — **zero** Rule 5, route, potency, disease-mapping, electricity, or runtime credit.

---

## 14. UCKB staging (`NOT_ACTIVATED`)

Stomach/gastric narrative, external compress/massage/lotion routes, and **BE/YE/WE** electricity pairings — **quarantined**; **TGC-C15-004**.

---

## 15. Authority boundaries (consolidated)

| Domain | Classification |
|--------|----------------|
| **Rule 4** | **TGC-C15-002** — zero Rule 4 medicine reference in owner C15 block |
| **Potency / dilution** | **TGC-C15-003** — owner §4 inventory only (incl. **D500** band text); MM3/UCKB/registry bands **rejected** for authority |
| **RE / electricity** | **TGC-C15-004** — UCKB **quarantined** |
| **Route** | **TGC-C15-006** — none; MM2/BOOK/UCKB external claims **rejected** (CF-C15-011) |
| **Rule 6 / S10 + C15** | **TGC-C15-007** — **inventory only** |
| **Polarity / temperament** | **TGC-C15-009** — inventory only |
| **Keyword / cure / magical-effect priority** | **TGC-C15-010** — rejected |

---

## 16. Rule 5 safety matrix (summary)

| Domain | Status |
|--------|--------|
| Contraindications | **SOURCE_NOT_FOUND** |
| Allergy / hypersensitivity | **SOURCE_NOT_FOUND** |
| Adverse effects | **SOURCE_NOT_FOUND** |
| Medicine interactions | **SOURCE_NOT_FOUND** |
| Condition interactions | **SOURCE_NOT_FOUND** |
| Pregnancy / lactation / special populations | **SOURCE_NOT_FOUND** |
| Route incompatibility | **SOURCE_NOT_FOUND** (owner route silent) |
| Overdose / exposure | **SOURCE_NOT_FOUND** |
| Duration / cumulative risk | **SOURCE_NOT_FOUND** |
| Monitoring | **SOURCE_NOT_FOUND** |
| Pause/stop criteria | **SOURCE_NOT_FOUND** |
| Emergency / red-flag criteria | **SOURCE_NOT_FOUND** |
| Follow-up timing | **SOURCE_NOT_FOUND** |

BOOK/OCR/UCKB: **no Rule 5 credit**. **`rule5SafetyCoverageComplete: false`**.

---

## 17. Conflict register

| ID | Disposition |
|----|-------------|
| **CF-C15-001** | **OPEN** — transcript **1374** / len **2688** / byte proof; wrapper **L813–845** |
| **CF-C15-002** | **OPEN** — index **2688** vs MM3 **2684** |
| **CF-C15-003** | **OPEN** — MM2 title truncation `औषधि संख्या 19: C` |
| **CF-C15-004** | **OPEN** — owner **D10–D500** vs registry **D10–D200** high band |
| **CF-C15-005** | **OPEN** — legacy dump **connective tissue** vs owner intestinal-gland narrative |
| **CF-C15-006** | **OPEN** — MM3/BOOK organ/polarity/OCR disease table vs owner §3 |
| **CF-C15-007** | **OPEN** — UCKB **stomach/gastric** narrative vs owner **intestinal** block |
| **CF-C15-008** | **OPEN** — MM2 **`external_use: YES` (abdomen)** vs MM2C **INTERNAL_ONLY** vs silent owner route |
| **CF-C15-009** | **OPEN** — MM2C/registry ICD mapping samples (e.g. Cholera similarity staging) — **not authorized** |
| **CF-C15-010** | **CLOSED** — keyword priority + **Dysentery-Cure** + **magical-effect** activation **REJECTED** (TGC-C15-010); wording remains inventory |
| **CF-C15-011** | **CLOSED** — BOOK/MM3/UCKB **external** route claims **REJECTED**; **`routeAuthority` remains none** |

**No silent reconciliation.**

---

## 18. Missing-evidence register

| ID | Topic | Status |
|----|--------|--------|
| **ME-C15-001** | Transcript byte and declared-length verification | **OPEN** |
| **ME-C15-002** | License, publication, and redistribution provenance | **OPEN** |
| **ME-C15-003** | Owner-primary Rule 5 safety text | **OPEN** |
| **ME-C15-004** | Verified owner-primary route/application evidence | **OPEN** |
| **ME-C15-005** | Verified potency/dosage protocol, ceilings (incl. D500 vs registry) | **OPEN** |
| **ME-C15-006** | MM3/BOOK/UCKB OCR and bibliographic provenance integrity | **OPEN** |
| **ME-C15-007** | Verified **S10+C15** combination and electricity relationship evidence | **OPEN** |

Evidence gaps only — **not** EODs.

---

## 19. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | C15 (14/38) |
| Canonical main SHA | `599f30ccb7ff317588b6f78807e3917b37646baa` |
| Verdict | `C15_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`PROVISIONAL_OWNER_PRIMARY`** · **`LOCATED_REVIEWED`** (provisional) |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-C15-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / potency / dosage / electricity / Rule 6 | **NONE / false / false / false / NONE** |
| CF | **001–009 OPEN** · **010–011 CLOSED** (governance rejections only) |
| ME | **001–007 OPEN** |
| Next canonical medicine (sequence) | **C17** — **not** started or targeted |
| Registry / runtime changed | **NO** |
| PHI / secrets / database | **NONE** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **C15 blocked · C13→C17 sequence documented · zero essential owner clinical decisions**
