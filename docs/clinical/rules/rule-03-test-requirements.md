# Rule 3 — Test Requirements (Post-Freeze)

**Rule 3 EHAS2 runtime:** NOT_IMPLEMENTED
**Legacy direct tests:** Partial — `test_s1_gender_anatomy_gate.py`, `test_s1_safe_keyword_policy.py` exercise `detect_systems` only; **LEGACY-PROVEN** (does not prove EHAS2 owner spec)

---

## Required before Rule 3 implementation sign-off

### Contract and UNRESOLVED (R3-T01–R3-T12)

| ID | Scenario | Expected |
|----|----------|----------|
| R3-T01 | Insufficient evidence | `active_systems = []`, `status = UNRESOLVED`, `reason = INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE` |
| R3-T02 | UNRESOLVED prescription gate | `prescription_issue_allowed = false`, `doctor_review_required = true` |
| R3-T03 | No METABOLIC auto-fill | Empty evidence must not set `active_systems = ["METABOLIC"]` |
| R3-T04 | Candidate vs active | `LOW_CONFIDENCE_CANDIDATE` stays in `candidate_systems` until confirmed |
| R3-T05 | Co-involvement | Co-involvement alone does not promote to active without independent evidence |
| R3-T06 | Chief complaint anchor | CC sets primary when verified; does not erase other verified findings |
| R3-T07 | CC prohibition | CC does not invent unrelated system |
| R3-T08 | Evidence payload | Every hit has source, verification_status, provenance |
| R3-T09 | No dictionary-order tie | Reordered internal lists must not change `primary_system` |
| R3-T10 | Fingerprint | Same input + versions → same `deterministic_fingerprint` |
| R3-T11 | Rule 3 output | No medicine, potency, electricity, dosage fields |
| R3-T12 | Cross-rule immutability | Rule 3 run does not mutate Rule 1 temperament payload |

### Report and photo isolation (R3-T20–R3-T28)

| ID | Scenario | Expected |
|----|----------|----------|
| R3-T20 | Renal report finding | RENAL evidence only |
| R3-T21 | Hepatic report finding | HEPATIC/LIVER evidence only |
| R3-T22 | Cross-system report leakage | Must fail if cardiac finding activates unrelated GYNE |
| R3-T23 | No global blob | Report text not only in concatenated symptoms field |
| R3-T24 | Ordinary photo | Does not set `active_systems` |
| R3-T25 | Verified local lesion | Supports local system as supporting evidence only |
| R3-T26 | Global photo override | Must fail |

### Parallel Rule 1 / Rule 3 (R3-T30–R3-T34)

| ID | Scenario | Expected |
|----|----------|----------|
| R3-T30 | Parallel runs | Both consume normalized evidence; no cross-write |
| R3-T31 | Order independence | Result stable regardless of internal scheduling |
| R3-T32 | Temperament SoT | Rule 3 does not overwrite temperament |
| R3-T33 | Organ SoT | Rule 1 does not overwrite organ systems |

### Hindi / safety / determinism (R3-T40–R3-T45)

| ID | Scenario |
|----|----------|
| R3-T40 | Hindi symptom variants deterministic |
| R3-T41 | Male + GYNE incompatible evidence rejected |
| R3-T42 | Female reproductive markers with evidence |
| R3-T43 | Red flag elevates safety without inventing systems |
| R3-T44 | Repeat run stability (no global state) |
| R3-T45 | Dataset version change updates fingerprint |

### Rejected legacy (must fail if reintroduced)

| ID | Must not happen |
|----|-----------------|
| R3-X01 | BP passed as gender |
| R3-X02 | GYNE → METABOLIC silent remap |
| R3-X03 | METABOLIC default when UNRESOLVED |
| R3-X04 | Silent hybrid `except: pass` |
| R3-X05 | Wrapper drops `details` / evidence_sources |
| R3-X06 | Keyword-only shown as “Confirmed Organ Systems” |
| R3-X07 | Duplicate normalizer+MDE overwrite without SoT |
| R3-X08 | Migrate `report_analyzer` BP-as-gender path |

---

## Tags

| Section | Tag |
|---------|-----|
| Owner scenarios | OWNER-APPROVED |
| Legacy partial tests | LEGACY-PROVEN |
| EHAS2 test implementation | IMPLEMENTATION-PENDING |

Test PASS ≠ clinical correctness.
