# Rule 2 — Test Requirements (Post-Freeze)

**Rule 2 EHAS2 runtime:** NOT_IMPLEMENTED
**Legacy direct tests:** 16 in `test_formula_polarity_policy_engine.py` — **LEGACY-PROVEN** (partial; does not prove EHAS2 owner spec)

---

## Required before Rule 2 implementation sign-off

### Contract & prohibition (R2-T01–R2-T08)

| ID | Scenario | Expected |
|----|----------|----------|
| R2-T01 | Rule 2 output | No `selected_potency`, `selected_electricity`, medicine IDs |
| R2-T02 | mutates_mixtures | Always false |
| R2-T03 | disease_polarity vs required_therapeutic_polarity | Both present; POSITIVE→NEGATIVE therapeutic |
| R2-T04 | UNRESOLVED evidence | disease_polarity UNRESOLVED; therapeutic NEUTRAL; doctor_review_required true |
| R2-T05 | No MIXED coerce from UNRESOLVED | Must not silently become MIXED for therapeutic (legacy defect) |
| R2-T06 | SUPPORT_ONLY | NEUTRAL therapeutic; RESOLVED_SUPPORT_ROLE; ≠ UNRESOLVED |
| R2-T07 | case_polarity_summary | must_not_drive_selection true |
| R2-T08 | Rule 2 run | No change to mixture count or target_pathology |

### Isolation (R2-T10–R2-T18)

| ID | Scenario |
|----|----------|
| R2-T10 | Formula A evidence does not set Formula B polarity |
| R2-T11 | Global symptoms excluded from slot proof |
| R2-T12 | BP high affects cardiac/BP-target formula support only |
| R2-T13 | BP high does not change digestive-only formula polarity |
| R2-T14 | Report finding bound to renal slot only affects renal formula |
| R2-T15 | Cross-slot report leakage test must fail if introduced |
| R2-T16 | Ordinary photo does not set global polarity |
| R2-T17 | Verified local lesion image may support local formula only |
| R2-T18 | Hindi slot keywords deterministic |

### Downstream boundary (R2-T20–R2-T24)

| ID | Scenario |
|----|----------|
| R2-T20 | Medicine engine callable without Rule 2 performing selection |
| R2-T21 | Potency engine not invoked inside Rule 2 module |
| R2-T22 | Electricity engine not invoked inside Rule 2 module |
| R2-T23 | Unresolved + doctor_review_required blocks prescription issuance (integration) |
| R2-T24 | Draft analysis may return unresolved annotations |

### Rejected legacy (must fail if reintroduced)

| ID | Must not happen |
|----|-----------------|
| R2-X01 | polarity_for_legacy_scoring UNRESOLVED→MIXED |
| R2-X02 | detect_polarity global BP-first on all formulas |
| R2-X03 | Photo global override of all formula polarities |
| R2-X04 | Summary Rule 2 labeled as Potency in EHAS2 product UI |

---

## Tags

| Section | Tag |
|---------|-----|
| Owner scenarios | OWNER-APPROVED |
| Legacy test file count | LEGACY-PROVEN |
| EHAS2 test implementation | IMPLEMENTATION-PENDING |

Test PASS ≠ clinical correctness.
