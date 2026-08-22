# Rule 1 — Legacy Keyword Row Clinical Review Docket

| Field | Value |
|-------|--------|
| **Authority** | Owner row review — **Bilious Batch 1 approved** (8/37); remaining batches pending |
| **Legacy source** | `bakalwar/eh-arogya-sutra` @ `b9ec3f6986c402afee13241673b954fe3564f169` |
| **Legacy symbol** | `PRAKRITI_KEYWORDS` in `eh-api/core/clinical_engines.py` |
| **Row count** | **37** (verified) |
| **Machine docket** | [rule-01-keyword-row-clinical-review-docket.csv](./rule-01-keyword-row-clinical-review-docket.csv) |
| **Verified legacy weight (Rule 1 path)** | **+2** per hit in `detect_prakriti` — see [rule-01-legacy-scoring-evidence-resolution.md](./rule-01-legacy-scoring-evidence-resolution.md) |
| **Runtime activation** | **NONE** |

Owner decision columns: **Bilious Batch 1 (8 rows) owner-approved** — see [rule-01-bilious-batch1-owner-approval-freeze.md](./rule-01-bilious-batch1-owner-approval-freeze.md). **29 rows remain blank.** Allowed owner actions when reviewing remaining batches: `APPROVE` · `APPROVE_AFTER_NORMALIZATION` · `MODIFY` · `MOVE_TO_R2` · `MOVE_TO_R3` · `CONTEXT_ONLY` · `REJECT` · `QUARANTINE` · `SPLIT`.

---

## Review batches (owner order)

### Batch 1 — Bilious (8 rows)

| Row ID | Keyword | Clinical review focus |
|--------|---------|----------------------|
| R1-KW-0001 | acidity | Direct digestive symptom vs disease label |
| R1-KW-0002 | bile | Hepatic/biliary sign vs fluid reference |
| R1-KW-0003 | jaundice | **Disease name** — R1-OD-04 conflict |
| R1-KW-0004 | liver | **Organ name** |
| R1-KW-0005 | liver dard | **Compound phrase** (HI-EN) |
| R1-KW-0006 | pila | Constitution-system colloquial |
| R1-KW-0007 | pitta | **Constitution-system term** (Tridosha cross-domain) |
| R1-KW-0008 | yellow | **Color term** vs icteric context |

**Status:** **Owner approved** — see [rule-01-bilious-batch1-owner-approval-freeze.md](./rule-01-bilious-batch1-owner-approval-freeze.md) · token `OWNER-FREEZE-R1-BILIOUS-BATCH1-v1`

### Batch 2 — Sanguine (10 rows)

| Row ID | Keyword | Clinical review focus |
|--------|---------|----------------------|
| R1-KW-0028 | arterial | Circulatory sign |
| R1-KW-0029 | bleeding | Symptom/sign; **R2 overlap** |
| R1-KW-0030 | circulation | Circulatory sign |
| R1-KW-0031 | fast heartbeat | Vital/cardiac; **R2 overlap** |
| R1-KW-0032 | flushing | Symptom/sign; heat cluster |
| R1-KW-0033 | garam | HI constitution colloquial |
| R1-KW-0034 | high bp | Vital + **disease-label** risk; **R2 overlap** |
| R1-KW-0035 | hot | Symptom/sign; synonym cluster |
| R1-KW-0036 | khoon | HI blood colloquial |
| R1-KW-0037 | rakt | HI-SA blood term; **synonym double-score** |

**Status:** Prepared for owner review — **0 approved**.

### Batch 3 — Lymphatic (11 rows)

| Row ID | Keyword | Clinical review focus |
|--------|---------|----------------------|
| R1-KW-0009 | cold | **R2 neg_terms overlap**; synonym `thanda` |
| R1-KW-0010 | constipation | **R2 neg_terms overlap**; synonym `kabz` |
| R1-KW-0011 | kabz | HI synonym; double-score risk |
| R1-KW-0012 | lymph | Organ/system substring |
| R1-KW-0013 | motapa | HI obesity colloquial |
| R1-KW-0014 | obesity | Synonym pair with motapa |
| R1-KW-0015 | sluggish | Constitutional sluggishness |
| R1-KW-0016 | sujan | **R2 pos_terms overlap** |
| R1-KW-0017 | swelling | **R2 pos_terms overlap** |
| R1-KW-0018 | thanda | **R2 neg_terms overlap** |
| R1-KW-0019 | white discharge | **R2 neg_terms cluster** |

**Status:** Prepared for owner review — **0 approved**.

### Batch 4 — Nervous (8 rows)

| Row ID | Keyword | Clinical review focus |
|--------|---------|----------------------|
| R1-KW-0020 | anxiety | Symptom/sign |
| R1-KW-0021 | bechaini | HI restlessness |
| R1-KW-0022 | nas | **Ambiguous short token** |
| R1-KW-0023 | nerve pain | Neural symptom phrase |
| R1-KW-0024 | nervous | Temperament label as keyword |
| R1-KW-0025 | sciatica | **Disease name** — R1-OD-04 conflict |
| R1-KW-0026 | shooting | Pain descriptor |
| R1-KW-0027 | tingling | Paresthesia sign |

**Status:** Prepared for owner review — **0 approved**.

### Batch 5 — Conflicts and missing coverage

| Topic | Docket posture |
|-------|----------------|
| Cross-rule overlaps | R2 `detect_polarity` pos/neg term lists overlap 12+ Rule 1 keywords — owner must decide MOVE_TO_R2 / CONTEXT_ONLY / normalized single-score |
| Duplicated synonyms | 7 synonym groups identified in CSV — owner must prevent double-score per R1-OD-05 |
| Missing symptom domains | **37 keywords do not provide universal disease coverage** — no silent expansion from 116,284-row disease DB (license/provenance unresolved) |
| Mixed temperament handling | Governed by R1-OD-03 — percentage model pending row weights |
| Unmapped-feature process | `UNMAPPED_FEATURE` fail-closed per completeness contract below |

**Status:** Documented — **pending owner decisions on all 37 rows**.

---

## Completeness / fail-closed contract

1. **Controlled clinical concept coverage** — versioned owner-reviewed additions only
2. **Hindi/English synonym coverage** — explicit synonym groups; no silent double-score
3. **Versioned addition process** — new rows require owner approval token
4. **Explicit `UNMAPPED_FEATURE`** — doctor input not silently dropped
5. **No silent dropping** of doctor-entered features
6. **No forced temperament** when evidence insufficient (`TEMPERAMENT_INSUFFICIENT_EVIDENCE`)
7. **Coverage reports by clinical domain** — future reporting; not implemented here
8. **Doctor-visible unmapped/contradictory evidence** — `TEMPERAMENT_CONTRADICTORY` · `MIXED_TEMPERAMENT_REVIEW_REQUIRED`
9. **Disease names and patient features kept separate** — R1-OD-04
10. **Continuous owner-reviewed expansion** — no autonomous catalog growth

---

## Integrity proof

| Check | Result |
|-------|--------|
| CSV data rows | **37** |
| Bilious rows owner-approved | **8** (`R1-KW-0001` … `R1-KW-0008`) |
| Remaining rows unapproved | **29** |
| Unique row IDs | **37** (`R1-KW-0001` … `R1-KW-0037`) |
| Legacy keyword parity | Matches verified `PRAKRITI_KEYWORDS` @ `b9ec3f6` |
| `verified_legacy_weight` | Preserved separately (forensic **2** on all legacy rows) |
| `owner_approved_weight` | Populated on **8** Bilious rows only |

---

## Cross-references

- Taxonomy owner freezes: [rule-01-temperament-taxonomy-owner-freeze-R1-OD-01-05.md](./rule-01-temperament-taxonomy-owner-freeze-R1-OD-01-05.md)
- Scoring evidence: [rule-01-legacy-scoring-evidence-resolution.md](./rule-01-legacy-scoring-evidence-resolution.md)
- Medicine identity freezes: [../legacy-adoption/owner-freeze-od-ext006-007-medicine-route-architecture.md](../legacy-adoption/owner-freeze-od-ext006-007-medicine-route-architecture.md)

---

## Status tokens

- `RULE1_37_ROW_DOCKET_PREPARED`
- `RULE1_BILIOUS_BATCH1_OWNER_APPROVED_DOCUMENTATION_ONLY`
- `RULE1_ROW_OWNER_DECISIONS_8_OF_37`
- `RULE1_CLINICAL_ACTIVATION_NONE`
