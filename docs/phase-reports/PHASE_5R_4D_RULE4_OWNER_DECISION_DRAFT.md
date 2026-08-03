# Phase 5R-4D — Rule 4 owner decision draft manifest

**Mode:** **RULE 4 CLINICAL DOCUMENTATION SPECIFICATION** · **OWNER_APPROVED** · **FROZEN** · **NOT_IMPLEMENTED**  
**Question 7:** **FULLY_RESOLVED** · decision closures **14/14 CLOSED** · Rule 4 documentation **FROZEN** · runtime **NOT_IMPLEMENTED**  
**Question 8:** **Q08-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**  
**Question 9:** **Q09-CLOSE** · **CLOSED** · **NOT_IMPLEMENTED**  
**Question 10:** **Q10-CLOSE** (**Q10-A**–**Q10-Q**) · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**
**Question 11:** **Q11-CLOSE** (**Q11-A**–**Q11-R**) · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**
**Question 12:** **Q12-CLOSE** (**Q12-A**–**Q12-W**) · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**
**Question 13:** **Q13-CLOSE** (**Q13-A**–**Q13-X**) · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**
**Question 14:** **Q14-CLOSE** (**Q14-A**–**Q14-U**) · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**
**Question 15:** **Q15-CLOSE** (**Q15-A**–**Q15-U**) · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**
**Question 16:** **Q16-CLOSE** (**Q16-A**–**Q16-U**) · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**
**Question 17:** **Q17-CLOSE** (**Q17-A**–**Q17-U**) · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**
**Question 18:** **Q18-CLOSE** (**Q18-A**–**Q18-U**) · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**
**Worktree:** `%TEMP%\ehas2_rule_freeze_integration_wt`  
**HEAD:** `a82eca1fac0449530b663dd3162696c512dadc32`  
**Branch:** `phase-5r/rule-1-2-freeze`

## Question 7 closure (14 decisions)

| # | Phase | Status |
|---|--------|--------|
| **1–6** | **Q07C-CLOSE-D01** … **Q07C-CLOSE-D06** | **OWNER_DECISION_RECORDED** |
| **7** | **Q07C-CLOSE-D07** — D60 pathology class resolution contract | **OWNER_DECISION_RECORDED** · **CLOSED** |
| **8** | **Q07C-CLOSE-D08** — SOURCE-TYPE CONFIDENCE THRESHOLD ENGINE (**D08-A**–**D08-K** + **Option C** guard) | **OWNER_DECISION_RECORDED** · **CLOSED** |
| **9** | **Q07C-CLOSE-D09** — DEEP_CHRONIC VS CHRONIC_MODERATE PHASE ADJUDICATION (**D09-1**–**D09-10**) | **OWNER_DECISION_RECORDED** · **CLOSED** |
| **10** | **Q07C-CLOSE-D10** — FORMULA-SPECIFIC SEVERITY RESOLUTION ENGINE (**D10-A**–**D10-M**) | **OWNER_DECISION_RECORDED** · **CLOSED** |
| **11** | **Q07C-CLOSE-D11** — ACUTE VS SUB_ACUTE PHASE ADJUDICATION (**D11-A**–**D11-D**) | **OWNER_DECISION_RECORDED** · **CLOSED** |
| **12** | **Q07C-CLOSE-D12** — TEMPERAMENT CONTROLLED QUALITATIVE PREFERENCE MATRIX (**D12-A**–**D12-D**, **D12-B-EXEC**) | **OWNER_DECISION_RECORDED** · **CLOSED** |
| **13** | **Q07C-CLOSE-D13** — PEDIATRIC POTENCY BOUNDARY AND SAFETY CONTRACT (**D13-A**–**D13-G**, **D13-HS**, **D13-B-EXEC**) | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **14** | **Q07C-CLOSE-D14** — TIER 3 RULE 3 PATHOLOGY MAPPING FREEZE AND EXECUTION BOUNDARY (**D14-A**–**D14-N**) | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |

### Decision 10 — **Q07C-CLOSE-D10** (closed)

**Subject:** **FORMULA-SPECIFIC SEVERITY RESOLUTION ENGINE** — see owner-decisions **D10-A**–**D10-M**.

### Decision 11 — **Q07C-CLOSE-D11** (closed)

**Subject:** **ACUTE VS SUB_ACUTE PHASE ADJUDICATION**

| Sub-decision | Topic |
|--------------|--------|
| **D11-A** | Day bands **1–14 ACUTE** · **15–45 SUB_ACUTE**; fallback-only |
| **D11-B** | Symmetric cross-boundary **Option A**; **D08** + **Q-L** |
| **D11-C** | Phase vs severity; **`phase_status`** / **`limitation_code`** |
| **D11-D** | Isolation · potency · lexicon pending · case table **1–16** |

**Authority:** For **ACUTE ↔ SUB_ACUTE**, **D11** is specific authoritative contract; **CLOSE-D02** verified-over-days interpreted via **D11-B** (non-mutating cross-ref in **CLOSE-D02**).

### Decision 12 — **Q07C-CLOSE-D12** (closed)

**Subject:** **TEMPERAMENT CONTROLLED QUALITATIVE PREFERENCE MATRIX**

**Owner choice:** **Option D** — dual-qualified qualitative preference only (**not** standalone selector; **no** numeric weights).

| Sub-decision | Topic |
|--------------|--------|
| **D12-A** | Authority · dual-qualified gate · single-candidate no-op · global prohibitions · **no CLOSE-D05 override** |
| **D12-B** | Matrix **LYMPHATIC** · **SANGUINE** · **NERVOUS** · **BILIOUS_HEPATIC** · **MIXED** / **UNKNOWN** |
| **D12-B-EXEC** | **D3↔D5** on current POSITIVE cascade: **`CURRENT_CASCADE_NO_OP`** · **`temperament_preference_applied = FALSE`** · **`NOT_EXECUTABLE_WITH_CURRENT_FROZEN_CASCADE`**; bilious matrix spec preserved |
| **D12-C** | **D1/D2** **Q08-CLOSE** **Q8-G** temperament order after primary selector; **D3↔D5** per **D12-B-EXEC** |
| **D12-D** | Explainability / audit sketch |

**Execution (current cascade):** **D3 ↔ D5** temperament preference = **NO-OP**; **CLOSE-D05** remains sole **D3/D5** selector. **Dual-candidate hook** = **separate owner decision** (not approved). **Decisions 1–11** clinical rules **unchanged**.

### Decision 13 — **Q07C-CLOSE-D13** (**CLOSED**)

**Subject:** **PEDIATRIC POTENCY BOUNDARY AND SAFETY CONTRACT**

| Sub-decision | Topic |
|--------------|--------|
| **D13-A** | Overlay authority · crisis first · age-alone ban · missing age **UNRESOLVED**; weight **`OWNER_DECISION_NOT_RECORDED`** |
| **D13-B** | Bands **P13-A**–**P13-E**; **D13-HS** hard stop **P13-A** / **P13-B** |
| **D13-HS** | Verified **&lt; 1 year** — no clinical analysis output / prescription / summary |
| **D13-C** | **ALLOW/RESTRICT/PROHIBIT** matrix (exact owner values) · post-cascade only · **PROHIBIT** → **UNRESOLVED** (no auto-demotion) |
| **D13-D** | **RESTRICT** = documented pediatric justification |
| **D13-B-EXEC** | **`PEDIATRIC_D60` → `CURRENT_PEDIATRIC_NO_OP`** |
| **D13-E** | Overlay audit fields (**NOT_FROZEN**) |
| **D13-F** | Scenario table **1–13** (corrected **potency** matrix) |
| **D13-G** | **ADMINISTRATION DOSE CONTRACT** — **`OWNER_APPROVED_CLINIC_POSOLOGY`** · **`SOURCE_VALIDATION_PENDING`** · separate from **D13-C** |

**Weight:** **`OWNER_DECISION_NOT_RECORDED`** — not a **D13** potency gate. **Missing age:** **UNRESOLVED** per **Q01F**/**Q02F**.

**D13-G administration-dose (owner-approved snapshot):**

| Age band | Dose | Frequency | Status / notes |
|----------|------|-----------|----------------|
| **&lt; 1 year** | — | — | **`PROHIBITED_BY_OWNER_HARD_STOP`** · **`NOT_APPLICABLE_UNDER_HARD_STOP`** · **D13-HS** safety notice (not clinical summary) |
| **1–5 years** | **2** drops | Doctor-defined; no silent guess; max proposed **2×/day** pending confirmation | Hindi limitation text · **D13-G-A** |
| **6–12 years** | **5** drops | **2** or **3×/day** — no auto **2 vs 3** | **D13-G-B** |
| **&gt;12 years** | **7** (high) / **8** (normal) sensitivity | **3×/day** · half cup water | Sensitivity unresolved → **`administration_dose_status = UNRESOLVED`** · **D13-G-C** |

**Potency vs dose:** **D13-C** matrix — **P13-D** **D30** = **RESTRICT** (owner correction); **D13-G** unchanged; dose **must not** alter **Selected_Potency**. **Crisis:** **D13-G** suspended under **`PRESCRIPTION_HOLD`**.

**D13-C (owner-approved snapshot):**

| Band | D3 | D5 | D10 | D30 | D60 |
|------|----|----|-----|-----|-----|
| 0–28d | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP |
| 29d–&lt;1y | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP |
| 1–5y | RESTRICT | ALLOW | RESTRICT | PROHIBIT | PROHIBIT |
| 6–12y | RESTRICT | ALLOW | RESTRICT | RESTRICT | PROHIBIT |
| &gt;12y | Adult cascade only — no pediatric overlay |

**D13-F scenarios (1–13):**

| # | Scenario | Band | **D13-C** / outcome |
|---|----------|------|---------------------|
| **1** | 6-month infant | **P13-B** | **D13-HS** · blocked |
| **1b** | 14-day + crisis | **P13-A** | **D13-HS** + escalation · no summary |
| **2** | 3-year · **D5** | **P13-C** | **ALLOW** |
| **3** | 5-year · **D10** | **P13-C** | **RESTRICT** |
| **4** | 8-year · **D30** incomplete | **P13-D** | **D30** **RESTRICT** · cascade **UNRESOLVED** |
| **5** | 10-year · **D30** complete | **P13-D** | **D30** **RESTRICT** · **Q07C-D30F** + **D13-D** + approval |
| **6** | 4-year · **D60** pass | **P13-C** | **D60** **PROHIBIT** |
| **7** | 11-year · **D60** complete | **P13-D** | **D60** **PROHIBIT** |
| **8** | Age missing | — | **UNRESOLVED** |
| **9** | Weight missing | Any | **`OWNER_DECISION_NOT_RECORDED`** |
| **10** | Parent/doctor contradiction | Any | **UNRESOLVED** |
| **11** | **Q06C** crisis | Any | **UNRESOLVED** (pre-overlay) |
| **12** | **D60** + hypersensitivity | **P13-C/D** | **D60** **PROHIBIT** |
| **13** | Two formulas | Per formula | **D09-1** |

**Formal closure:** **Q07C-CLOSE-D13** · **13/14** · **CLOSED** · **1** decision remains (**14** — validation pending).

### Decision 14 — **Q07C-CLOSE-D14** (**CLOSED**)

**Subject:** **TIER 3 RULE 3 PATHOLOGY MAPPING FREEZE AND EXECUTION BOUNDARY**

| Sub-decision | Topic |
|--------------|--------|
| **D14-A** | Purpose — suggester only; not class/**D60** authority |
| **D14-B** | **FUNCTIONAL_CANDIDATE** only; explicit exclusion evaluation |
| **D14-C** | Formula isolation |
| **D14-D** | OCR minimum fields → **`IGNORED_NOT_USABLE_FOR_TIER3_MAPPING`** |
| **D14-E** | Precedence T1 > T2 > T3; **`PATHOLOGY_CLASS_CONTRADICTORY`** |
| **D14-F** | **RECURRENT** boundary |
| **D14-G** | **NERVOUS** boundary |
| **D14-H** | Structural/exclusion outcomes; **D10** fallback / **UNRESOLVED** |
| **D14-I** | Unknown row / empty table |
| **D14-J** | Engine vs doctor; **FINAL_DOCTOR_APPROVAL_REQUIRED** |
| **D14-K** | Mapping table schema + immutable versions |
| **D14-L** | **`NOT_EXECUTABLE`** · **`SEPARATE_DATA_FREEZE_PENDING`** |
| **D14-M** | No paid API (future constraint) |
| **D14-N** | Reason codes |

**D08-D vs D14:** OCR tier ≠ Rule 3 mapping Tier 3.

**Formal closure:** **Q07C-CLOSE-D14** · **14/14** · **CLOSED** · **Question 7 decisions:** **ALL 14 CLOSED**.

| Field | Value |
|-------|--------|
| **Decision closure count** | **14/14 CLOSED** |
| **Decision 14** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **Mapping data asset** | **`TIER3_PATHOLOGY_MAPPING_DATA_ASSET = SEPARATE_DATA_FREEZE_PENDING`** · **`execution_status = NOT_EXECUTABLE`** · **`tier3_mapping_applied = FALSE`** · **`current_potency_delta = NONE`** (**D14-L**). **`SEPARATE_FREEZE_PENDING`** = **`LEGACY_ALIAS_OF_SEPARATE_DATA_FREEZE_PENDING`** |
| **Question 7 overall** | **FULLY_RESOLVED** |
| **Question 7 fully resolved** | **YES** |

## Question 8 — **Q08-CLOSE** (**CLOSED** · **NOT_IMPLEMENTED**)

**Subject:** **NEGATIVE PATHWAY — D1 VS D2 SELECTION AND SAFETY CONTRACT** (**Q8-A**–**Q8-P**)

| Field | Value |
|-------|--------|
| **Question 8** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`current_runtime_potency_delta`** | **NONE** |
| **`automatic_D1_D2_selection`** | **FALSE** |
| **Registry (`potency_logic`)** | **`REGISTRY_POTENCY_LOGIC_AUDIT_PENDING`** · **`NOT_EXECUTABLE_AS_Q8_SELECTOR`** |
| **Question 10+** | **NOT_STARTED** / **PENDING** |

**Summary blocks:** **Q8-A** polarity · **Q8-B** combined selector · **Q8-C/D** eligibility · **Q8-E/F** severity & cardiac · **Q8-G** temperament order · **Q8-H/I** pediatric & dose · **Q8-J** exclusivity · **Q8-K/L** legacy & neuro · **Q8-M/N** routes & registry · **Q8-O** reason codes · **Q8-P** execution.

**Formal closure:** **Q08-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** (owner **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded).

## Question 9 — **Q09-CLOSE** (**CLOSED** · **NOT_IMPLEMENTED**)

**Subject:** **MIXED DISEASE-STATE CONTROLLED AUTOMATIC SPLIT AND POLARITY-CONTRADICTION CONTRACT** (**Q9-A**–**Q9-Q**)

| Field | Value |
|-------|--------|
| **Question 9** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_mixed_split_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **`registry_q9_selector_status`** | **`NOT_EXECUTABLE_AS_Q9_SELECTOR`** (**Q9-P**) |
| **Question 10+** | **NOT_STARTED** / **PENDING** |

**Summary blocks:** **Q9-A**–**Q9-M** (base contract) · **Q9-N** partial-slot · **Q9-O** Rule 2 upstream · **Q9-P** registry quarantine · **Q9-Q** enums + failure matrix.

**Formal closure:** **Q09-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** (post-blocker **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded).

## Question 10 — **Q10-CLOSE** (**CLOSED** · **NOT_IMPLEMENTED**)

**Subject:** **RESOLVED NEUTRAL DISEASE-STATE NON-POTENCY CONTRACT** (**Q10-A**–**Q10-Q**)

| Field | Value |
|-------|--------|
| **Question 10** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_neutral_potency_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **`registry_q10_selector_status`** | **`NOT_EXECUTABLE_AS_Q10_SELECTOR`** (**Q10-L**) |
| **Question 11+** | **NOT_STARTED** / **PENDING** |

**Summary blocks:** **Q10-A** scope · **Q10-B** non-potency outcome · **Q10-C/D** no ladder / not D2 · **Q10-E** fluctuation · **Q10-F** Q11 separation · **Q10-G** Rule 2 upstream · **Q10-H** multi-formula · **Q10-I–K** gates/routes · **Q10-L** registry · **Q10-M–O** schema/matrix · **Q10-P/Q** execution / no paid API.

**Formal closure:** **Q10-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** (final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded).

## Question 11 — **Q11-CLOSE** (**CLOSED** · **NOT_IMPLEMENTED**)

**Subject:** **UNRESOLVED AND SUPPORT_ONLY POTENCY SAFETY BOUNDARY** (**Q11-A**–**Q11-R**)

| Field | Value |
|-------|--------|
| **Question 11** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_unresolved_potency_runtime`** | **FALSE** |
| **`automatic_support_only_potency_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **`registry_q11_selector_status`** | **`NOT_EXECUTABLE_AS_Q11_SELECTOR`** (**Q11-L**) |
| **Question 12+** | **NOT_STARTED** / **PENDING** |

**Summary blocks:** **Q11-A** scope · **Q11-B/C** outcomes · **Q11-D** controlled support · **Q11-E/F** no D2/D5/ladder · **Q11-G/H** input separation + audit · **Q11-I** partial slots · **Q11-J–K** safety/routes · **Q11-L** registry · **Q11-M–O** schema/matrix · **Q11-P/R** review / no paid API · **Q11-Q** execution.

**Formal closure:** **Q11-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** (final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded).

## Question 12 — **Q12-CLOSE** (**CLOSED** · **NOT_IMPLEMENTED**)

**Subject:** **FORMULA-SPECIFIC DISEASE PHASE INTEGRATION AND ACUTE-FLARE-ON-CHRONIC POTENCY CONTRACT** (**Q12-A**–**Q12-W**)

| Field | Value |
|-------|--------|
| **Question 12** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_phase_runtime`** | **FALSE** |
| **`automatic_flare_split_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **`PHASE_MULTILINGUAL_TIMELINE_LEXICON`** | **`SEPARATE_FREEZE_PENDING`** |
| **`registry_q12_selector_status`** | **`NOT_EXECUTABLE_AS_Q12_SELECTOR`** (**Q12-Q**) |
| **Naming** | **≠ Q07C-CLOSE-D12** (temperament — **Q7 Decision 12**) |
| **Question 14+** | **NOT_STARTED** / **PENDING** |

**Summary blocks:** **Q12-A** canonical **D02/D09/D11** integration · **Q12-B** per-slot phase · **Q12-C** day bands · **Q12-D/E** override/contradiction/missing · **Q12-F** phase-not-potency · **Q12-G/H** POS/NEG paths · **Q12-I** Q9–Q11 cross-refs · **Q12-J/K/L** baseline/manifestation/flare split · **Q12-M** partial · **Q12-N** lexicon pending · **Q12-O/P** safety/routes · **Q12-Q** registry · **Q12-R/S/T** schema/status/matrix · **Q12-U/V/W** roles/execution/no paid API.

**Formal closure:** **Q12-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** (final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded).

## Question 13 — **Q13-CLOSE** (**CLOSED** · **NOT_IMPLEMENTED**)

**Subject:** **FORMULA-SPECIFIC SEVERITY RESOLUTION AND POTENCY CASCADE INTEGRATION CONTRACT** (**Q13-A**–**Q13-X**)

| Field | Value |
|-------|--------|
| **Question 13** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_severity_runtime`** | **FALSE** |
| **`automatic_free_text_severity_runtime`** | **FALSE** |
| **`automatic_lab_vital_severity_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **`SEVERITY_MULTILINGUAL_LEXICON`** | **`SEPARATE_FREEZE_PENDING`** |
| **`LAB_VITAL_TO_SEVERITY_MAPPING`** | **`SEPARATE_FREEZE_PENDING`** |
| **`registry_q13_selector_status`** | **`NOT_EXECUTABLE_AS_Q13_SELECTOR`** (**Q13-R**) |
| **Naming** | **≠ Q07C-CLOSE-D10** (Q7 Decision 10) · **≠ Q07C-CLOSE-D13** · **≠ D13-G** |
| **Question 14+** | **NOT_STARTED** / **PENDING** |

**Summary blocks:** **Q13-A** **D10** integration · **Q13-B** per-slot severity · **Q13-C** scale · **Q13-D/E** corroboration/failures · **Q13-F/G** severity-not-potency / fail-closed · **Q13-H/I** POS/NEG paths · **Q13-J** Q9–Q11 · **Q13-K/L** baseline/manifestation/dual-slot · **Q13-M** partial · **Q13-N** lexicon/lab pending · **Q13-O/P** safety/pediatric · **Q13-Q** routes · **Q13-R** registry · **Q13-S/T/U** schema/matrix · **Q13-V/W/X** roles/execution/no paid API.

**Formal closure:** **Q13-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** (final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded).

## Question 14 — **Q14-CLOSE** (**CLOSED** · **NOT_IMPLEMENTED**)

**Subject:** **VERIFIED NON-PEDIATRIC ADULT AGE INTEGRATION AND NO AGE-BASED POTENCY OVERLAY CONTRACT** (**Q14-A**–**Q14-U**)

| Field | Value |
|-------|--------|
| **Question 14** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_adult_age_runtime`** | **FALSE** |
| **`adult_potency_overlay`** | **`NONE`** |
| **`adult_overlay_applied`** | **FALSE** |
| **`age_based_potency_adjustment`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **`registry_q14_selector_status`** | **`NOT_EXECUTABLE_AS_Q14_SELECTOR`** (**Q14-O**) |
| **`REGISTRY_ADULT_AGE_LOGIC_AUDIT_PENDING`** | **true** |
| **Naming** | **≠ Q07C-CLOSE-D14** (Q7 Decision 14 — Tier 3 mapping) · **≠ Q07C-CLOSE-D13** (pediatric) · **≠ D13-G** (dose) |
| **Question 15+** | **NOT_STARTED** / **PENDING** |

**Summary blocks:** **Q14-A** scope **P13-E** · **Q14-B** no overlay · **Q14-C/D** age-not-potency + legacy quarantine · **Q14-E/F** Q7–Q13 authorities · **Q14-G** frailty/weight boundary · **Q14-H/I** verification/failures · **Q14-J** 12/13 boundary · **Q14-K** dose separation · **Q14-L/M/N** isolation/precedence/routes · **Q14-O** registry · **Q14-P/Q** schema/status · **Q14-R** outcome matrix (**20** rows) · **Q14-S** roles · **Q14-T** execution · **Q14-U** no paid API.

**Formal closure:** **Q14-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** (final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded).

## Question 15 — **Q15-CLOSE** (**CLOSED** · **NOT_IMPLEMENTED**)

**Subject:** **PER-FORMULA POTENCY ISOLATION AND MULTI-SLOT RULE 4 EXECUTION CONTRACT** (**Q15-A**–**Q15-U**)

| Field | Value |
|-------|--------|
| **Question 15** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_multi_formula_potency_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **`registry_q15_selector_status`** | **`NOT_EXECUTABLE_AS_Q15_SELECTOR`** (**Q15-M**) |
| **`REGISTRY_MULTI_FORMULA_POTENCY_LOGIC_AUDIT_PENDING`** | **true** |
| **Owner policy** | **Option A + B + C** combined (**Q15-R**) |
| **Naming** | **≠ Rule 4 Question 16** (report evidence / **`global_text`**) |
| **Question 16+** | **NOT_STARTED** / **PENDING** |

**Summary blocks:** **Q15-A** scope · **Q15-B** per-slot pass · **Q15-C** leakage · **Q15-D** **Q9-N** partial · **Q15-E** patient-wide hold · **Q15-F** no global dilution · **Q15-G** **Q7–Q14** · **Q15-H** **Q-L** dedupe · **Q15-I/J/K** evidence/special cases/precedence · **Q15-L** routes · **Q15-M** registry · **Q15-N/O/P** schema/status/matrix · **Q15-R** options · **Q15-S** roles · **Q15-T/U** execution/no paid API.

**Formal closure:** **Q15-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** (final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded).

## Question 16 — **Q16-CLOSE** (**CLOSED** · **NOT_IMPLEMENTED**)

**Subject:** **FORMULA-SPECIFIC STRUCTURED REPORT EVIDENCE AND D04/D08 WIRING CONTRACT** (**Q16-A**–**Q16-U**)

| Field | Value |
|-------|--------|
| **Question 16** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_report_wiring_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **`registry_q16_selector_status`** | **`NOT_EXECUTABLE_AS_Q16_SELECTOR`** (**Q16-M**) |
| **`non_bp_critical_safety_catalog_status`** | **`SEPARATE_SAFETY_DATA_FREEZE_PENDING`** (**Q16-H**) |
| **Naming** | **≠ Rule 4 Question 15** (multi-slot isolation) |
| **Question 17+** | **NOT_STARTED** / **PENDING** |

**Summary blocks:** **Q16-A** scope · **Q16-B** item decomposition / **`global_text`** ban · **Q16-C/D** mandatory/conditional fields · **Q16-E** sibling preservation · **Q16-F** multi-formula binding · **Q16-G** supersession/historical · **Q16-H** patient-wide escalation · **Q16-I** chief complaint · **Q16-J** Q3/Q4/Q5 codes · **Q16-K** photos/vision · **Q16-L** verified labels · **Q16-M** registry quarantine · **Q16-N** D04/D08/Q15 integration · **Q16-O/P/Q** schema/status/matrix · **Q16-R** roles · **Q16-S** precedence · **Q16-T** execution · **Q16-U** no paid API.

**Formal closure:** **Q16-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** (final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded).

## Question 17 — **Q17-CLOSE** (**CLOSED** · **NOT_IMPLEMENTED**)

**Subject:** **RULE 1 TEMPERAMENT SUPPORTING-WEIGHT INTEGRATION CONTRACT** (**Q17-A**–**Q17-U**)

| Field | Value |
|-------|--------|
| **Question 17** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_temperament_potency_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **`registry_q17_selector_status`** | **`NOT_EXECUTABLE_AS_Q17_SELECTOR`** (**Q17-N**) |
| **Naming** | **≠ Q07C-CLOSE-D12** · **≠ Rule 4 Question 12** (phase) |
| **Question 18+** | **Q18 CLOSED** · row **19** **5R-SDG** indexed (**Q18-S**) |

**Summary blocks:** **Q17-A** scope · **Q17-B** no numeric weights · **Q17-C** supporting only · **Q17-D/E** primary + unresolved mapping · **Q17-F** secondary annotation · **Q17-G/H/I** NEGATIVE tie-break · **Q17-J/K** POSITIVE NO-OP · bilious annotation · **Q17-L** Nervous-alone · **Q17-M** per-slot · **Q17-N/O/P/Q** quarantine/schema/matrix (**Q17-Q** rows **9–10** additive audit) · **Q17-R** roles · **Q17-S** precedence · **Q17-T/U** execution/no paid API.

**Formal closure:** **Q17-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** (final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded).

**Closure notes (metadata only):** Rule 1 impact matrix generic “scoring/modifier” potency wording **limited/superseded** by **Q17-B/C** + **D12-A** — no authorized numerical potency scoring. **`UNRESOLVED_TIE`:** **`primary_temperament_consultation_confirmed`** **not** potency preference eligibility — **NO_PREFERENCE**.

## Question 18 — **Q18-CLOSE** (**CLOSED** · **NOT_IMPLEMENTED**)

**Subject:** **PRESCRIPTION ISSUANCE AND FINAL DOCTOR-APPROVAL INTEGRATION CONTRACT** (**Q18-A**–**Q18-U**)

| Field | Value |
|-------|--------|
| **Question 18** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **Owner policy** | **Option A + Option D** · strict partial-prescription finalization |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_prescription_issuance_runtime`** | **FALSE** |
| **`current_runtime_issuance_delta`** | **NONE** |
| **`registry_q18_selector_status`** | **`NOT_EXECUTABLE_AS_Q18_SELECTOR`** (**Q18-L**) |
| **`automatic_issuance`** | **`FALSE`** (always) |
| **`final_doctor_approval_required`** | **`TRUE`** (normal Rule 4 draft paths) |
| **Naming** | **≠ row 19** (**5R-SDG**) · **5R-DRG** / **5R-SDG** by reference only |
| **Row 19 / Rule 5** | **5R-SDG** **OWNER_DECISION_RECORDED** (**Q18-S** index) · Rule 5 **NOT STARTED** |

**Summary blocks:** **Q18-A** scope · **Q18-B** draft outputs · **Q18-C** issuance flags · **Q18-D** doctor workflow · **Q18-E** holds Option D · **Q18-F/G/H** partial + strict final · **Q18-I** D13 RESTRICT · **Q18-J** cross-engine AND · **Q18-K** Q10/Q11 · **Q18-L** quarantine · **Q18-M** UI mapping · **Q18-N/O/P** schema/status/flow · **Q18-Q** matrix · **Q18-R/S** roles/precedence (**Q18-S** row **19** index) · **Q18-T/U** execution/no paid API.

**Formal closure:** **Q18-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** (final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded; § cross-ref corrections **Q18-C/D/G** metadata-only).

**Next gate:** **RULE 4 DOCUMENTATION FROZEN** · **IMPLEMENTATION NOT STARTED** — **WAIT FOR OWNER APPROVAL BEFORE IMPLEMENTATION PLANNING**.

**Rule 4 precedence index (pointer-only):** identity/age → crisis/holds → Rule 2 polarity → Rule 3 target → D04/D08 → phase → severity → potency pathway → temperament tie-break → pediatric overlay → per-formula isolation → issuance — full table in [rule-04-owner-decisions-DRAFT.md](../clinical/rules/rule-04-owner-decisions-DRAFT.md).

**Deferred data assets (non-blocking for doc freeze):** Tier 3 pathology mapping · non-BP critical safety catalog · phase/severity multilingual lexicons · lab/vital-to-severity mapping · registry audits · **D13-G** source validation.

**Q1–Q6:** owner policy tranche recorded; wiring may remain **IMPLEMENTATION_PENDING**; not executable selectors.

## Production gates

| Gate | Value |
|------|--------|
| Question 7 decisions closed | **YES** (**14/14**) · **FULLY_RESOLVED** |
| Rule 4 documentation frozen | **YES** · **OWNER_APPROVED** · **NOT_IMPLEMENTED** |
| Rule 4 runtime implemented | **NO** · **NOT_STARTED** |
| Question 8 | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| Question 9 | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| Question 10 | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| Question 11 | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| Question 12 | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| Question 13 | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| Question 14 | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| Question 15 | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| Question 16 | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| Question 17 | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| Question 18 | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| Row 19 / Rule 5 | **5R-SDG** **OWNER_DECISION_RECORDED** (**Q18-S** index) / Rule 5 **NOT STARTED** |
| Rule 4 documentation freeze | **YES** — **OWNER_APPROVED** · **FROZEN** · **NOT_IMPLEMENTED** |
| Decision 14 | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** (mapping data **`SEPARATE_DATA_FREEZE_PENDING`**) |
| Question 7 integration | **FULLY_RESOLVED** (decisions **14/14** **CLOSED**; documentation **FROZEN**) |
| Commit/push/deploy | **NO** (documentation commit only when owner requests) |

**STOP — WAIT FOR RULE 4 FINAL CROSS-QUESTION INTEGRATION VALIDATION** *(superseded — **READY_TO_FREEZE_DOCUMENTATION** accepted.)*

**STOP — RULE 4 DOCUMENTATION FROZEN · IMPLEMENTATION NOT STARTED · WAIT FOR OWNER APPROVAL BEFORE IMPLEMENTATION PLANNING**
