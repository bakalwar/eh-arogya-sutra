# Rule 5 — R5-M6B Medicine Evidence Audit: Ver2 (Vermifugo-2)

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Audit sequence** | 36 of 38 |
| **Medicine code** | Ver2 |
| **Expected normalized header form** | **`MED=VER2`** |
| **Actual normalized owner header** | **ABSENT** |
| **Classification** | DOCUMENTATION_ONLY_MEDICINE_AUDIT |
| **Audit record version** | 1.0 |
| **Audit date** | 2026-08-10 |
| **Repository base (EHAS2)** | `1b8560f59a556dbfaf8ea442d952277cc981045d` |
| **Framework** | [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md) |
| **Index** | [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md) |
| **Audit sequence authority** | Index §2 / §3 canonical order (not registry JSON array order where it differs) |
| **Verdict code** | `VER2_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| **Primary blocker** | `OWNER_PRIMARY_CORPUS_NOT_LOCATED` |

**Mandatory normalizer posture:** Canonical index/registry display code **`Ver2`** maps to **expected** normalized header form **`MED=VER2`**. **`^MED=VER2` count = 0** in the available normalized owner corpus. **No occurrence A** — **do not invent** jsonl anchor, declared length, markers, wrapper, §1–§5 owner block, or expert tip. **No `PROVISIONAL_OWNER_PRIMARY`** for Ver2. Dedicated Ver2 owner-primary block **was not located**. **Registry is not owner-primary.**

---

## 2. Repository / base / registry identity

| Item | Value |
|------|--------|
| **Canonical repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Registry version** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded (`registry.v2.manifest.json` → `excludedCodes: ["C11"]`) |
| **Registry identity (Ver2 code in 38-set)** | **VERIFIED** — code `Ver2` present in v2 registry; **not** owner-source verification |
| **Registry mirror** | **Vermifugo-2** · **`DERIVED_UNVERIFIED`** — **inventory only** |
| **Owner-primary verification** | **NO** — **`OWNER_PRIMARY_CORPUS_NOT_LOCATED`** |
| **Provenance (index vocabulary)** | **`INCOMPLETE_NOT_VERIFIED`** |
| **Canonical sequence slot** | **Ver1 → Ver2 → WE** |
| **Physical observation after Ver1 close** | **`MED=VER1` closes L1333** · **observed next header `MED=L1` L1336** — **no Ver2 owner block** between them |
| **Canonical geography tension** | **Canonical Ver1→Ver2→WE slot** vs **observed Ver1→L1→later WE (`MED=None`) geography** — **OPEN** (**CF-VER2-002**, **CF-VER2-010**) |
| **Prior Ver1 artifact** | Merged **Ver1** documents physical **L1** vs canonical **Ver2** successor — **aligned tension**; **Ver1 artifact unchanged** by this record |

---

## 3. Audit scope and non-authorization banner

This record is a **documentation-only** source and governance audit for **Ver2** (expected code **`MED=VER2`**; **owner header absent**). It:

- Inventories and compares sources; records **technical governance classifications (TGC)** **as documentation**.
- Does **not** clinically validate Ver2, authorize potency/dosage/route/timing, activate evidence, connect orchestration, or approve Rule 6 medicine relationships.
- Does **not** treat registry/legacy/dev/API/mock strings as owner-verified clinical truth.
- Preserves disease/indication **source-tier inventory** with **zero** mapping or selection authority.
- **Documentation completion creates no clinical authority.**

**Posture flags (final):**

| Flag | Value |
|------|--------|
| `clinicallyValidated` | `false` |
| `rule5SafetyCoverageComplete` | `false` |
| `ownerPrimaryVerified` | `false` |
| `ownerSourceStatus` | **`NOT_LOCATED`** · **`OWNER_PRIMARY_CORPUS_NOT_LOCATED`** |
| `provenanceStatus` | **`INCOMPLETE_NOT_VERIFIED`** |
| `routeAuthority` | `APPLICATION_ROUTE_AUTHORITY_NONE` |
| `routeAuthorized` | `false` |
| `administrationTimingAuthorized` | `false` |
| `potencyAuthorized` | `false` |
| `dosageAuthorized` | `false` |
| `electricityAuthorized` | `false` |
| `evidenceActivated` | `false` |
| `rule6MedicineRelationshipAuthority` | `NONE` |
| `runtimeAuthorized` | `false` |
| Mapping flags (all) | **`false`** |

**Route / timing / dosage note:** **No owner-primary block exists** — **no** owner route, administration timing, or dosage wording. Registry external/internal/oil–lotion language is **inventory only** — **not** verified route/application evidence (**TGC-VER2-006**).

---

## 4. Ver2 canonical identity (typed tracks)

| Field | Registry v2 / legacy | Owner-primary | Notes |
|-------|------------------------|---------------|--------|
| **Code** | Ver2 | **NOT LOCATED** | 38-set identity **VERIFIED** only |
| **Display name** | Vermifugo-2 | **NOT LOCATED** | **`DERIVED_UNVERIFIED`** |
| **Group** | Vermifugo | **NOT LOCATED** | Label-level registry mirror only |
| **Expected normalized header** | — | **`MED=VER2` expected · ABSENT** | **`^MED=VER2` count 0** |
| **Route / timing / dosage (owner)** | — | **Not applicable** | **No bounded §1–§4** |

---

## 5. Complete exact-header scan (`^MED=VER2`)

Reference: legacy normalized `docs/phase-s5-mm1e/_doctor_medicine_corpus.txt` (read-only pointer; not modified; outside EHAS2 tree).

| Check | Result |
|-------|--------|
| Pattern **`^MED=VER2`** | **Count 0** (entire normalized corpus file) |
| **Occurrence A** | **None** — **not fabricated** |
| **Jsonl anchor / declared length / markers** | **None** — no header |
| **Owner wrapper / §1–§5 / expert tip** | **None** |
| **Post-tip agent tail classification** | **N/A** |
| **`PROVISIONAL_OWNER_PRIMARY`** | **Must not apply** — no materia owner block |

**Observed physical walk (boundary context only):** **`MED=VER1` L1295** … closes **L1333** → **`MED=L1` L1336** — **no `MED=VER2` header** in walk.

Developer/API/mock **Ver2** strings (external-route audit tasks, polarity/completeness lists, formula selectors) are **rejected** as Ver2 owner materia authority — **`QUARANTINED_NO_OWNER_MERGE`** (**CF-VER2-011**, **TGC-VER2-009**).

---

## 6. Owner-primary boundary map

**No Ver2 owner-primary block exists** — **no fabricated boundaries.**

| Boundary element | Status |
|------------------|--------|
| **Canonical predecessor** | **Ver1** (merged formal audit — provisional occurrence A) |
| **Canonical slot** | **Ver2** (seq 36) — **no normalized owner block located** |
| **Canonical successor** | **WE** (seq 37) — **not** started or targeted; **no WE corpus audit** |
| **Ver1 wrapper close (context)** | **L1333** (`</user_query>`) — Ver1 artifact **CF-VER1-003 CLOSED** |
| **Observed physical next header after Ver1** | **`MED=L1` L1336** — **not** Ver2; **not** a Ver2 predecessor/successor pair |
| **WE boundary context only** | Later **`MED=None`** block with **WHITE ELECTRICITY (WE)** prose (~L1388) — **not audited** |

---

## 7. Sources and provenance

| Source ID | Classification | Reference | Status |
|-----------|----------------|-----------|--------|
| **SRC-VER2-OWNER** | Owner-primary | Normalized corpus | **`OWNER_PRIMARY_CORPUS_NOT_LOCATED`** — **no `^MED=VER2`** |
| **SRC-VER2-REG-V2** | Registry v2 | `medicines.v2.json` **Ver2** | **`DERIVED_UNVERIFIED`** — **not** owner-primary |
| **SRC-VER2-MANIFEST** | Manifest | `registry.v2.manifest.json` | Canonical **identity inventory only** |
| **SRC-VER2-LEGACY-V1** | Legacy v1 | `medicines.v1.json` **Ver2** | **Derived-unverified mirror** |
| **SRC-VER2-MM2** | MM2 parsed | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** |
| **SRC-VER2-MM2C** | MM2 clinical classification | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** |
| **SRC-VER2-MM3-BOOK-OCR** | MM3/BOOK/OCR | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** |
| **SRC-VER2-UCKB** | UCKB standalone | — | **`NOT_LOCATED_IN_AVAILABLE_TREES`** |
| **SRC-VER2-LEGACY-DUMP** | Legacy stub | Expected dump path | **`SOURCE_NOT_FOUND`** |
| **SRC-VER2-DEV-API** | Dev/API/mock | Topical-route tasks, selectors, formula maps | **`QUARANTINED_NO_OWNER_MERGE`** |
| **SRC-VER2-CROSS-VER1** | Prior merged Ver1 artifact | Ver1→L1 vs canonical Ver2 boundary | **Quarantined inventory** — **Ver1 artifact unchanged** |
| **SRC-VER2-WE-BOUNDARY** | Successor boundary only | **`MED=None` WE prose** (~L1381+) | **Not audited** — **no WE corpus review** |

**No derived tier may be merged into owner-primary clinical truth.**

**Unavailable-tier posture:** **`NOT_LOCATED_IN_AVAILABLE_TREES — not substantively reviewed; no Rule 5 credit; no clinical authority; no owner merge`**.

---

## 8. Technical governance classification (`TECHNICAL_GOVERNANCE_CLASSIFICATION`)

**`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`**

| ID | Token |
|----|--------|
| **TGC-VER2-001** | `OWNER_PRIMARY_CORPUS_NOT_LOCATED_NO_MED_VER2_HEADER_VER1_L1333_PHYSICAL_IMMEDIATE_L1_L1336_CANONICAL_PREDECESSOR_VER1_SUCCESSOR_WE_TRANSCRIPT_ANCHOR_ABSENT` |
| **TGC-VER2-002** | `RULE4_AUTHORITY_NONE_VER2_OWNER_BLOCK_ABSENT_DEV_EXTERNAL_ROUTE_POLARITY_TASK_STRINGS_QUARANTINED` |
| **TGC-VER2-003** | `IDENTITY_VERMIFUGO_2_VER2_REGISTRY_VERMIFUGO_2_DERIVED_UNVERIFIED` |
| **TGC-VER2-004** | `POTENCY_REGISTRY_INVENTORY_ONLY_D1_D5_OIL_GLYCERIN_POSITIVE_D10_D500_NEGATIVE_NO_DOSAGE_AUTHORITY` |
| **TGC-VER2-005** | `DISEASE_116K_MAPPING_AUTHORITY_NONE_REGISTRY_CLUSTERS_DEV_SELECTORS_REJECTED_FOR_ACTIVATION` |
| **TGC-VER2-006** | `ROUTE_TIMING_REGISTRY_EXTERNAL_INTERNAL_LANGUAGE_INVENTORY_ONLY_NO_OWNER_BOUNDED_BLOCK_APPLICATION_ROUTE_AUTHORITY_NONE_NOT_VERIFIED_ROUTE_EVIDENCE` |
| **TGC-VER2-007** | `RULE6_COMBINATION_INVENTORY_ONLY_VER2_VER1_S10_VER2_EXTERNAL_TIP_NO_RUNTIME_EDGE` |
| **TGC-VER2-008** | `MM2_MM2C_MM3_BOOK_OCR_UCKB_NOT_LOCATED_FAIL_CLOSED_NO_MERGE_WITH_OWNER_PRIMARY` |
| **TGC-VER2-009** | `DEV_TIER_VER2_TOPICAL_POLARITY_COMPLETENESS_STRINGS_QUARANTINED_NOT_CO_PRIMARY` |
| **TGC-VER2-010** | `PHYSICAL_VER1_L1_GAP_VS_CANONICAL_VER2_PLACEMENT_AND_WE_SUCCESSOR_GEOGRAPHY_OPEN_NOT_RUNTIME_ACTIVATION` |

**TGC-VER2-008 note:** Unavailable tiers were **not located** in available read-only EHAS2 trees. **Fail-closed no-merge** only — **not** substantive review credit.

**Index `RECORDED_0`:** documentation audit **complete**; **zero** essential owner clinical decisions; **TGC-VER2-001–010** recorded **separately** (count **10**).

---

## 9. Essential owner clinical decisions

**`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**

- **Essential owner clinical decision count:** **0**
- **No `EOD-VER2` table**
- Registry/dev/cross-tier derivations are **TGC/CF/ME** — **not** owner clinical approval questions.

---

## 10. Registry-derived inventory (`DERIVED_UNVERIFIED` only)

Registry v2 **Ver2** mirror (inventory only): Vermifugo-2; stubborn tapeworm; lice/scabies/external parasites; parasitic ringworm; worm dysentery with eggs; parasitic urticaria; cysticercosis support wording; **external** EH medicine (oil/lotion) and **internal** tapeworm/cyst framing in registry text; **`potency_logic`** bands (D1–D5 oil/glycerin Positive; D10–D500 Negative); **`temperament_affinity`** Ver2+Ver1+S10 and external oil/lotion tips — **inventory only**.

**Zero** treatment/cure/efficacy/standard-care substitution, mapping, selector, route, timing, dosage, or runtime authority from registry strings alone.

---

## 11. Quarantined dev/API/mock inventory (not co-primary)

Non-exhaustive — **rejected** for activation:

- External-route evidence audit task lists naming **Ver2** (with APP/S12)
- Polarity / completeness / medicine-matrix agent prose referencing **Ver2**
- Dev formula / 116k selector strings — **`QUARANTINED_NO_OWNER_MERGE`**

---

## 12. Route / timing / dosage posture (mandated distinction)

| Concept | Ver2 posture |
|---------|----------------|
| **Owner bounded §1–§4** | **Does not exist** — **no** owner route/timing/dosage wording |
| **Registry mirror** | External/internal/oil–lotion language — **inventory only** |
| **Verified route/application evidence** | **Absent** |
| **`APPLICATION_ROUTE_AUTHORITY_NONE`** | **Yes** |
| **`routeAuthorized` / `administrationTimingAuthorized` / `dosageAuthorized`** | **`false` / `false` / `false`** |

---

## 13. Rule 4 / Rule 5 / Rule 6 posture

| Rule | Posture |
|------|---------|
| **Rule 4** | **`RULE4_AUTHORITY_NONE`** — **no Ver2 owner-primary block is located**; dev/registry Rule strings remain **quarantined** or **derived-unverified** |
| **Rule 5 safety** | **`SOURCE_NOT_FOUND`** for Ver2-specific verified owner safety text; unavailable tiers **zero credit**; **`rule5SafetyCoverageComplete: false`** |
| **Rule 6** | Registry **Ver2+Ver1+S10** / external tips — **inventory only**; **no runtime relationship edge** |

**Clinical / safety / evidence:** **NO / NO / NONE**

---

## 14. Conflict register (`CF-VER2`)

| ID | Status | Summary |
|----|--------|---------|
| **CF-VER2-001** | **OPEN** | No **`^MED=VER2`** in normalized corpus |
| **CF-VER2-002** | **OPEN** | Canonical **Ver1→Ver2** slot vs observed **Ver1→L1 L1336** after **L1333** |
| **CF-VER2-003** | **OPEN** | **No owner wrapper** — **no** wrapper-close event to verify (contrast Ver1 **CF-VER1-003 CLOSED**) |
| **CF-VER2-004** | **OPEN** | Registry **Vermifugo-2** / external parasiticide mirror vs missing owner master |
| **CF-VER2-005** | **OPEN** | Registry external/internal **potency_logic** vs absent owner §4 bands |
| **CF-VER2-006** | **OPEN** | Dev **APP/Ver2/S12** topical-route audit tasks vs no Ver2 owner anchor |
| **CF-VER2-007** | **OPEN** | Registry **Ver2+Ver1+S10** combination tips vs Rule 6 **none** |
| **CF-VER2-008** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB **not located** |
| **CF-VER2-009** | **OPEN** | High-stakes registry clusters (tapeworm, lice/scabies, cyst support) — inventory only |
| **CF-VER2-010** | **OPEN** | Canonical **Ver2→WE** vs observed **L1 → MED=None (WE)** geography |
| **CF-VER2-011** | **CLOSED** | Dev/mock/116k **Ver2** selector and topical-audit activation **rejected** (governance) |
| **CF-VER2-012** | **CLOSED** | Agent task / completeness-list **Ver2** mentions **excluded** from owner merge (governance exclusion only) |

**Mandatory CF summary:** CF: 001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections/exclusions only)

---

## 15. Missing-evidence register (`ME-VER2`)

| ID | Status | Summary |
|----|--------|---------|
| **ME-VER2-001** | **OPEN** | Owner-primary **`MED=VER2`** materia block, jsonl anchor, declared length — **not located** |
| **ME-VER2-002** | **OPEN** | License / publication / redistribution for any future located primary |
| **ME-VER2-003** | **OPEN** | Ver2-specific **Rule 5** owner safety for parasitic / external high-stakes wording |
| **ME-VER2-004** | **OPEN** | Owner route/timing/dosage evidence — **no owner-primary block**; registry external/internal language **unverified** |
| **ME-VER2-005** | **OPEN** | Potency / oil–glycerin / dilution registry vs future owner reconciliation |
| **ME-VER2-006** | **OPEN** | **Ver2+Ver1+S10** / external-combo tips vs validated Rule 6 edges |
| **ME-VER2-007** | **OPEN** | **Ver1→L1** observed gap vs canonical **Ver2** slot and **Ver2→WE** chain |
| **ME-VER2-008** | **OPEN** | High-stakes tapeworm / external parasite / cyst wording vs standard care (documentation) |
| **ME-VER2-009** | **OPEN** | Registry–owner identity reconciliation if primary ever located |
| **ME-VER2-010** | **OPEN** | MM2/MM2C/MM3/BOOK/UCKB bibliographic location — **not located** |

Evidence gaps only — **not** EODs.

**Mandatory ME summary:** ME: 001–010 OPEN (10 entries)

---

## 16. Audit footer (mandatory)

| Item | Value |
|------|--------|
| Medicine | Ver2 (36/38) · expected **`MED=VER2`** · **owner header absent** |
| Canonical main SHA | `1b8560f59a556dbfaf8ea442d952277cc981045d` |
| Verdict | `VER2_DOCUMENTATION_AUDIT_COMPLETE_CLINICAL_AND_SAFETY_BLOCKED` |
| Owner-primary | **`OWNER_PRIMARY_CORPUS_NOT_LOCATED`** · **`NOT_LOCATED`** · **`^MED=VER2` count 0** |
| `ownerPrimaryVerified` | **`false`** |
| Provenance | **`INCOMPLETE_NOT_VERIFIED`** |
| Essential owner clinical decisions | **NONE — BLOCKED…** (**count 0** · **`RECORDED_0`**) |
| TGC | **TGC-VER2-001–010** · count **10** |
| Clinical / safety / evidence | **NO / NO / NONE** |
| Mapping flags | **all false** |
| Route / timing / dosage | **No owner block** · registry language **inventory only** · **`APPLICATION_ROUTE_AUTHORITY_NONE`** · **all authorized flags false** |
| Potency / electricity / Rule 6 / runtime | **false / false / NONE / false** |
| CF | **001–010 OPEN (10 entries) · 011–012 CLOSED (2 entries; governance rejections/exclusions only)** |
| ME | **001–010 OPEN (10 entries)** |
| Next canonical medicine (sequence) | **WE** — **not** started or targeted |
| Registry / runtime / deployment changed | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_MEDICINE_AUDIT · **Ver2 blocked · expected normalized code MED=VER2 · owner header absent · OWNER_PRIMARY_CORPUS_NOT_LOCATED · ^MED=VER2 count 0 · no occurrence A · canonical Ver1→Ver2→WE slot vs observed Ver1→L1→later WE geography OPEN · dev/mock quarantined · registry Vermifugo-2 derived-unverified inventory only not owner-primary · MM2/MM2C/MM3/BOOK/UCKB not located · zero essential owner clinical decisions · no runtime authority**
