# Rule 4 — Unresolved clinical questions (**DOCUMENTATION FROZEN**)

**Phase:** 5R-4D · **RULE 4 CLINICAL DOCUMENTATION SPECIFICATION:** **OWNER_APPROVED** · **FROZEN** · **NOT_IMPLEMENTED**  
**Purpose:** Authoritative index of Rule 4 owner policy rows **1–19**. **Documentation frozen**; **runtime implementation not started** — no automatic potency, report wiring, phase, severity, temperament, or issuance runtime active. Pending **data assets** and **Q1–Q6 wiring** complete on **separate engineering tracks** after this freeze. **Execution gate:** no clinical follow-up during analysis — see **5R-SDG** and **5R-DRG** in [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md).  
**Authoritative closure summary:** **Q7** **FULLY_RESOLVED** · **Q8–Q18** **CLOSED** · runtime **NOT_IMPLEMENTED**  
**Legacy code is forensic reference only — not clinical endorsement.**

Columns: legacy behavior · source · inputs · output · formula-specific · conflict with frozen Rules 1–3 · owner answer required · status

---

| # | Topic | Current legacy behavior | Exact source | Clinical input used | Output dilution (legacy) | Formula-specific? | Conflict with frozen Rules 1–3 | Owner answer required | Status |
|---|--------|-------------------------|--------------|---------------------|--------------------------|-------------------|--------------------------------|----------------------|--------|
| 1 | Pediatric age ≤5 | **Legacy (rejected):** If age ≤5: POSITIVE → D30, else D10; early return ignores pathology/phase/severity/reports/serious branches | `potency_engine.py` L40–41 | Legacy: `age`, coerced `polarity` | Legacy: D30 or D10 | Per mixture call in legacy | Conflicts Rule 2 UNRESOLVED truth + Q4 no defaults | **EHAS2 Q01F** + **Q07C-CLOSE-D13** (**D13-HS** **&lt;1y**; **D13-C** **P13-C**+; **D13-B-EXEC**) | **OWNER_DECISION_RECORDED** (Q1) · **Q7 FULLY_RESOLVED** (decisions **14/14** **CLOSED** · Rule 4 **NOT_IMPLEMENTED**) |
| 2 | Pediatric age 6–12 | **Legacy (rejected):** If age >5 and ≤12: POSITIVE → D60, else D5; early return ignores phase/severity/pathology/system/reports/emergency | `potency_engine.py` L42–43 | Legacy: `age`, coerced `polarity` | Legacy: D60 or D5 | Per mixture | Same as Q1 + Rule 2 coercion | **EHAS2 Q02F** + **Q07C-D60F** + **Q07C-CLOSE-D13** (**P13-D** matrix; **D13-B-EXEC**) | **OWNER_DECISION_RECORDED** (Q2) · **Q7 FULLY_RESOLVED** (decisions **14/14** **CLOSED** · Rule 4 **NOT_IMPLEMENTED**) |
| 3 | Cancer/tumor keywords | **Legacy (rejected):** `cancer`/`tumor` in global+sys text → D500; substring; no verification | `potency_engine.py` L46–47 | Global `symptoms` + `sys_text_full` | D500 | **Partial** — global leaks to all mixtures | Rule 3/report isolation; Q1–Q2 no leakage | **EHAS2:** no auto-D500; D500 not on scale; classify evidence; safety/red-flag only; per-formula potency; negation + isolation — Q3F | **OWNER_DECISION_RECORDED** (classification/negation wiring **NOT_FROZEN**) |
| 4 | Paralysis/lakwa keywords | **Legacy (rejected):** `paralysis`/`lakwa` in text → D500 (L46–47 shared with cancer/tumor) | Same L46–47 | Global + sys text | D500 | **Partial** — global leak | Q3 pattern; Rule 2 NEGATIVE/D1 direction vs legacy D500 | **EHAS2:** reject auto-D500; classify evidence; acute **URGENT_ESCALATION**; chronic no auto-potency; D1 candidate not automatic; isolation + negation — Q4F | **OWNER_DECISION_RECORDED** (wiring **NOT_FROZEN**) |
| 5 | Stone/pathri/bone-spur keywords | **Legacy (rejected):** `bone spur`, `kanta`, `stone`, `pathri`, `spur` in global+sys text → D200; substring; no verification; negation fails | `potency_engine.py` L48–49 | Global `symptoms` + `sys_text_full` | D200 | **Partial** — global leaks to all mixtures | Rule 3/report isolation; Q1–Q2; owner scale has no D200 | **EHAS2:** reject auto-D200; D200 not on scale; type-specific classification; verified report binds target only; per-formula potency; no stone→D200 hardcoding; isolation + negation — Q5F | **OWNER_DECISION_RECORDED** (classification/organ binding **NOT_FROZEN**) |
| 6 | BP / Cardiovascular | **Legacy (rejected):** `bp_sys > 175` + POSITIVE or CARDIAC → D500; global BP; missing→120 | L52–54 | Global `bp_sys`, polarity, `sys_key` | D500 | **Partial** / global leak | Rule 2 BP isolation; off-scale D500 | **EHAS2 (Q06C):** **A3 COMBINED_MINIMUM_EVIDENCE** — scale D1–D60 only; D100/D200/D500 **prohibited**; BP alone **no**; targets CARDIAC/VASCULAR/**BP_REGULATION**; verified BP + related formula evidence; Stage1→**D10 candidate** (140–159/90–99); Stage2→**D30 candidate** (160–179/100–109); crisis ≥180/≥110→**UNRESOLVED**+escalation; mild BP no auto-D5; scoped D1 prohibition; no BP=120; Rule1 temperament not D30 alone | **OWNER_DECISION_RECORDED** (implementation **NOT_FROZEN**) |
| 7 | POSITIVE disease-state ladder | **Legacy (quarantined):** (bp>160 OR sev≥8)→D200; (bp>140 OR chronic)→D100; else D60 — global BP; single scoring polarity | L56–61 | `scoring_polarity`, global `bp_sys`, `sys_severity`, `sys_duration` | D200/D100/D60 | Per-mixture polarity; **global BP leak** | Off-scale D100/D200 | **Q7** + **CLOSE-D01–D12** + **Q07C-D07P-*** + **Q07C-D07P-MICRO** + **Q07C-CLOSE-D13** + **Q07C-CLOSE-D14** (**D14-A**–**D14-N**) | **FULLY_RESOLVED** (decisions **14/14** **CLOSED** · **Q07C-CLOSE-D07**–**Q07C-CLOSE-D14**; legacy ladder **quarantined** · runtime **NOT_IMPLEMENTED**) |
| 8 | NEGATIVE disease-state ladder | **Legacy (quarantined):** (sev≥8 OR bp<95)→D1; chronic→D3; sub_acute→D5; else D10 | L63–70 | Same + phase | D1 / D3 / D5 / D10 | Per mixture | Legacy **D3/D5/D10** on NEGATIVE branch conflicts **PB** | **Q08-CLOSE** (**Q8-A**–**Q8-P**) · **5R-4D-PB** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| 9 | MIXED disease-state ladder | **Legacy (quarantined):** MIXED (incl. empty→MIXED): chronic→D30; sub_acute→D10; else D2 | L72–76; L23 default | `polarity` default MIXED, `norm_phase` | D30 / D10 / D2 | Per mixture | Legacy ladder + empty→MIXED conflicts **PB** + **Q4** | **Q09-CLOSE** (**Q9-A**–**Q9-Q**) · **5R-4D-PB** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| 10 | NEUTRAL disease-state ladder | **No separate NEUTRAL branch in legacy** — only POSITIVE / NEGATIVE / MIXED | — | — | — | — | Legacy none; **PB** + **Q10** non-potency | **Q10-CLOSE** (**Q10-A**–**Q10-Q**) · **5R-4D-PB** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| 11 | UNRESOLVED disease-state behavior | Empty polarity → treated as **MIXED**; engine always returns a dilution if called | L23 | Missing polarity | MIXED ladder outputs | Per mixture | **Conflicts Rule 2 + Q4 draft**; **PB:** UNRESOLVED/SUPPORT_ONLY — no coerce | **Q11-CLOSE** (**Q11-A**–**Q11-R**) · **5R-4D-PB** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| 12 | ACUTE / SUB_ACUTE / CHRONIC phase | Phase string normalized via keyword lists; drives branches in each polarity ladder | L27–32, branches | `phase` / duration string (MDE: `sys_duration`) | Various | Per mixture plan duration | Missing phase → **acute** in legacy — **conflicts Q4 draft** | **Q12-CLOSE** (**Q12-A**–**Q12-W**) integrates **Q07C-CLOSE-D02** · **D09** · **D11** · **≠ Q07C-CLOSE-D12** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| 13 | Severity thresholds | severity_score ≥8 triggers D200 (POS) or D1 (NEG); default 5 if missing | L36, L57–58, L64–65 | `severity_score` (mixture max in MDE) | Branch-dependent | Per mixture (`sys_severity`) | **Q4:** missing severity must not become 5 | **Q13-CLOSE** (**Q13-A**–**Q13-X**) integrates **Q07C-CLOSE-D10** · **≠ Q07C-CLOSE-D13** · **≠ D13-G** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| 14 | Age effects (non-pediatric) | Only pediatric special-casing; adult uses polarity ladders (implicit adult if age>12) | L40–43 vs later | `age` | Ladder outputs | Global patient age per analyze | Verified age required under Q4 draft | **Q14-CLOSE** (**Q14-A**–**Q14-U**) · **P13-E final** · **no adult potency overlay** · **≠ Q07C-CLOSE-D14** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| 15 | Per-formula independence | MDE calls potency **once per mixture** with mixture-specific polarity, phase, severity, sys_key, texts | `multi_disease_engine.py` ~710–812 | Mixture-scoped fields | Independent dilution per mixture | **Yes** — legacy is per mixture | Aligns with Q2 draft | **Q15-CLOSE** (**Q15-A**–**Q15-U**) · Options **A+B+C** · **≠ Rule 4 Question 16** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| 16 | Formula-specific report evidence | Legacy passes aggregated `global_text` + `sys_text_full`; **no isolated report object** in potency_engine | MDE loop + `potency_engine.py` | Concatenated text | Keyword hits | **Weak** — not per-report field | **Conflicts Rule 3 / report isolation** and Q3 formula-scoped report draft | **Q16-CLOSE** (**Q16-A**–**Q16-U**) · **Q07C-CLOSE-D04** + **Q07C-CLOSE-D08** · **≠ Rule 4 Question 15** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| 17 | Rule 1 temperament supporting weight | **Not read** by `get_unified_clinical_potency` in legacy | — | — | — | — | **Q3 draft** requires SUPPORTING_EVIDENCE_ONLY — **implementation pending** | **Q17-CLOSE** (**Q17-A**–**Q17-U**) · **Q07C-CLOSE-D12** + **Q08-CLOSE** **Q8-G** by reference · **≠ Rule 4 Question 12** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| 18 | Doctor-review requirements | Legacy always emits dilution when mixture exists; no `doctor_review_required` on potency | MDE + potency_engine | — | Always numeric D* | — | **5R-DRG / 5R-SDG:** `doctor_review_required` = **FINAL_DOCTOR_APPROVAL_REQUIRED** after system completes draft; **no** follow-up questions during analysis; UNRESOLVED = system null dilution + preserved uncertainty | **Q18-CLOSE** (**Q18-A**–**Q18-U**) · **Option A + D** · strict partial finalization · **`prescription_issue_allowed`** integration | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| 19 | Follow-up questions during analysis | Legacy N/A — potency always returns numeric D* when invoked | — | — | — | — | **5R-SDG:** clinical follow-up during execution **PROHIBITED**; no `additional_information_needed` / `follow_up_question` / `doctor_must_choose_potency` | Platform single-pass gate applies to all engines | **OWNER_DECISION_RECORDED** |

---

## Count

| Category | Count |
|----------|-------|
| **OWNER_DECISION_RECORDED** | **6** (Questions **1–6** complete) |
| **FULLY_RESOLVED** (Question **7** — decision closure **14/14** · decisions **1–14** **CLOSED** · **NOT_IMPLEMENTED**) | **1** |
| **CLOSED** (Question **8** — **Q08-CLOSE** · **OWNER_DECISION_RECORDED** · **NOT IMPLEMENTED**) | **1** |
| **CLOSED** (Question **9** — **Q09-CLOSE** · **NOT IMPLEMENTED**) | **1** |
| **CLOSED** (Question **10** — **Q10-CLOSE** · **OWNER_DECISION_RECORDED** · **NOT IMPLEMENTED**) | **1** |
| **CLOSED** (Question **11** — **Q11-CLOSE** · **OWNER_DECISION_RECORDED** · **NOT IMPLEMENTED**) | **1** |
| **CLOSED** (Question **12** — **Q12-CLOSE** · **OWNER_DECISION_RECORDED** · **NOT IMPLEMENTED**) | **1** |
| **CLOSED** (Question **13** — **Q13-CLOSE** · **OWNER_DECISION_RECORDED** · **NOT IMPLEMENTED**) | **1** |
| **CLOSED** (Question **14** — **Q14-CLOSE** · **OWNER_DECISION_RECORDED** · **NOT IMPLEMENTED**) | **1** |
| **CLOSED** (Question **15** — **Q15-CLOSE** · **OWNER_DECISION_RECORDED** · **NOT IMPLEMENTED**) | **1** |
| **CLOSED** (Question **16** — **Q16-CLOSE** · **OWNER_DECISION_RECORDED** · **NOT IMPLEMENTED**) | **1** |
| **CLOSED** (Question **17** — **Q17-CLOSE** · **OWNER_DECISION_RECORDED** · **NOT IMPLEMENTED**) | **1** |
| **CLOSED** (Question **18** — **Q18-CLOSE** · **OWNER_DECISION_RECORDED** · **NOT IMPLEMENTED**) | **1** |
| **OWNER_DECISION_RECORDED** (platform **5R-SDG** — row **19**) | **1** |

**Rule 4 documentation freeze (metadata):** **OWNER_APPROVED** · **FROZEN** · **NOT_IMPLEMENTED** · **`execution_status = NOT_IMPLEMENTED`** · all documented **`automatic_*_runtime = FALSE`** · **`current_runtime_*_delta = NONE`** · registry selectors **`NOT_EXECUTABLE`** where specified · **`automatic_issuance = FALSE`**.

**Q1–Q6 tranche:** Rows **1–6** record early owner policy; **clinical text unchanged in this pass.** Row metadata may show wiring **NOT_FROZEN** / **IMPLEMENTATION_PENDING** — **not executable selector authority**; **Q7–Q18** closed contracts govern potency runtime design.

**Rule 4 precedence index (pointer-only):** identity/age → crisis/holds → Rule 2 polarity → Rule 3 target → D04/D08 evidence → phase → severity → potency pathway → temperament tie-break → pediatric overlay → per-formula isolation → issuance/doctor approval — detail table in [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Rule 4 documentation freeze**.

**Deferred data assets (non-blocking for doc freeze; runtime non-executable until separate engineering):** Tier 3 pathology mapping · non-BP critical safety catalog · phase/severity multilingual lexicons · lab/vital-to-severity mapping · registry audits · **D13-G** source validation — register in owner-decisions freeze section.

**STOP — WAIT FOR RULE 4 FINAL CROSS-QUESTION INTEGRATION VALIDATION** *(superseded — documentation freeze recorded.)*

**STOP — RULE 4 DOCUMENTATION FROZEN · IMPLEMENTATION NOT STARTED · WAIT FOR OWNER APPROVAL BEFORE IMPLEMENTATION PLANNING**

## **Q07C-CLOSE-D13** scenario reference (**D13-F** · **D13-HS**)

Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md). **P13-A/B:** **D13-HS** only. **P13-C/D:** **D13-C** overlay. **ALLOW**/**RESTRICT** post **Decisions 1–12** gates only.

| # | Scenario | Band | **D13-C** / note |
|---|----------|------|------------------|
| **1** | 6-month infant | **P13-B** | **D13-HS** · no prescription path |
| **1b** | 14-day neonate · crisis | **P13-A** | **D13-HS** + **Q06C** |
| **2** | 3-year · qualified **D5** | **P13-C** | **D5** **ALLOW** |
| **3** | 5-year · qualified **D10** | **P13-C** | **D10** **RESTRICT** |
| **4** | 8-year · **D30** incomplete cascade | **P13-D** | **D30** **RESTRICT** · cascade **UNRESOLVED** |
| **5** | 10-year · **D30** complete cascade | **P13-D** | **D30** **RESTRICT** · **Q07C-D30F** + **D13-D** |
| **6** | 4-year · **D60** triple pass | **P13-C** | **D60** **PROHIBIT** |
| **7** | 11-year · **D60** complete | **P13-D** | **D60** **PROHIBIT** |
| **8** | Age missing | — | **UNRESOLVED** — no under-one inference |
| **9** | Weight missing | Any | **`OWNER_DECISION_NOT_RECORDED`** (not **D13** gate) |
| **10** | Parent vs doctor contradiction | Any | **UNRESOLVED** |
| **11** | Crisis (**Q06C**) | Any | **UNRESOLVED** · blocked pre-overlay |
| **12** | **D60** + **EXTREME_HYPERSENSITIVITY** | **P13-C/D** | **D60** **PROHIBIT** |
| **13** | Multi-formula | Per formula | **D09-1** isolation |

## **Q07C-CLOSE-D13** administration dose (**D13-G**)

**Classification:** **`OWNER_APPROVED_CLINIC_POSOLOGY`** · **`SOURCE_VALIDATION_PENDING`**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **D13-G**. **Separate** from **D13-C** potency overlay. **Decision 13:** **CLOSED** · **13/14** · **NOT_IMPLEMENTED**.

| Age | Administration rule | Silent default |
|-----|---------------------|----------------|
| **&lt; 1 year** | **D13-HS** — **`PROHIBITED_BY_OWNER_HARD_STOP`** | **None** — no outputs |
| **1–5 years** | **2** drops; frequency = doctor; max proposed **2×/day** | **No** frequency inference |
| **6–12 years** | **5** drops; **2** or **3×/day** per doctor | **No** auto **2 vs 3** |
| **&gt;12 years** | **7**/**8** drops + **3×/day** + water per verified sensitivity | **No** silent **7/8** if sensitivity bad/missing |

**Global:** Crisis **`URGENT_ESCALATION`** + **`PRESCRIPTION_HOLD`**. Dose rules **must not** change potency. **`final_doctor_approval_required = true`**.

## **Q07C-CLOSE-D14** — Tier 3 Rule 3 pathology mapping (**D14-A**–**D14-N**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md).

| Topic | Summary |
|-------|---------|
| **Not D08-D** | OCR tier ≠ mapping Tier 3 |
| **Role** | **FUNCTIONAL_CANDIDATE** suggester only |
| **Runtime** | **`TIER3_PATHOLOGY_MAPPING_DATA_ASSET = SEPARATE_DATA_FREEZE_PENDING`** · **`execution_status = NOT_EXECUTABLE`** · **`tier3_mapping_applied = FALSE`** · **`current_potency_delta = NONE`**. **`SEPARATE_FREEZE_PENDING`** = **`LEGACY_ALIAS_OF_SEPARATE_DATA_FREEZE_PENDING`** |
| **N/R** | Direct evidence only — not mapping |

## Owner action

Questions **1–6** recorded (Phases **5R-4D-Q01F** … **Q06C**). **5R-4D-PB** polarity boundary recorded. **5R-DRG** and **5R-SDG** execution/approval gates recorded (row **19**). Question **7**: **FULLY_RESOLVED** · decision closure **14/14** — **Q07C-CLOSE-D07** through **Q07C-CLOSE-D14** **CLOSED**. Question **8**: **Q08-CLOSE** (**Q8-A**–**Q8-P**) **CLOSED** · **NOT_IMPLEMENTED**. Question **9**: **Q09-CLOSE** (**Q9-A**–**Q9-Q**) **CLOSED** · **NOT_IMPLEMENTED**. Question **10**: **Q10-CLOSE** (**Q10-A**–**Q10-Q**) **CLOSED** · **NOT_IMPLEMENTED** (**`automatic_neutral_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`**). Question **11**: **Q11-CLOSE** (**Q11-A**–**Q11-R**) **CLOSED** · **NOT_IMPLEMENTED** (**`automatic_unresolved_potency_runtime = FALSE`** · **`automatic_support_only_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`**). Question **12**: **Q12-CLOSE** (**Q12-A**–**Q12-W**) **CLOSED** · **NOT_IMPLEMENTED** (**`automatic_phase_runtime = FALSE`** · **`automatic_flare_split_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** · **`PHASE_MULTILINGUAL_TIMELINE_LEXICON = SEPARATE_FREEZE_PENDING`**). Question **13**: **Q13-CLOSE** (**Q13-A**–**Q13-X**) **CLOSED** · **NOT_IMPLEMENTED** (**`automatic_severity_runtime = FALSE`** · **`automatic_free_text_severity_runtime = FALSE`** · **`automatic_lab_vital_severity_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** · **`SEVERITY_MULTILINGUAL_LEXICON = SEPARATE_FREEZE_PENDING`** · **`LAB_VITAL_TO_SEVERITY_MAPPING = SEPARATE_FREEZE_PENDING`**). Question **14**: **Q14-CLOSE** (**Q14-A**–**Q14-U**) **CLOSED** · **NOT_IMPLEMENTED** (**`automatic_adult_age_runtime = FALSE`** · **`adult_potency_overlay = NONE`** · **`adult_overlay_applied = FALSE`** · **`age_based_potency_adjustment = FALSE`** · **`current_runtime_potency_delta = NONE`**). Question **15**: **Q15-CLOSE** (**Q15-A**–**Q15-U**) **CLOSED** · **NOT_IMPLEMENTED** (**`automatic_multi_formula_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`**). Question **16**: **Q16-CLOSE** (**Q16-A**–**Q16-U**) **CLOSED** · **NOT_IMPLEMENTED** (**`execution_status = NOT_IMPLEMENTED`** · **`automatic_report_wiring_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** · **`registry_q16_selector_status = NOT_EXECUTABLE_AS_Q16_SELECTOR`** · **`non_bp_critical_safety_catalog_status = SEPARATE_SAFETY_DATA_FREEZE_PENDING`**). Question **17**: **Q17-CLOSE** (**Q17-A**–**Q17-U**) **CLOSED** · **NOT_IMPLEMENTED** (**`execution_status = NOT_IMPLEMENTED`** · **`automatic_temperament_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** · **`registry_q17_selector_status = NOT_EXECUTABLE_AS_Q17_SELECTOR`**). Question **18**: **Q18-CLOSE** (**Q18-A**–**Q18-U**) **CLOSED** · **NOT_IMPLEMENTED** (**`execution_status = NOT_IMPLEMENTED`** · **`automatic_prescription_issuance_runtime = FALSE`** · **`current_runtime_issuance_delta = NONE`** · **`registry_q18_selector_status = NOT_EXECUTABLE_AS_Q18_SELECTOR`** · **`automatic_issuance = FALSE`** · **`final_doctor_approval_required = TRUE`** · **Option A + D**). **Rule 4 documentation** **FROZEN** · runtime **NOT_IMPLEMENTED**. Row **19** (**5R-SDG**) **OWNER_DECISION_RECORDED** (**Q18-S** index).

## **Q08-CLOSE** — NEGATIVE D1/D2 (**Q8-A**–**Q8-P**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md).

| Topic | Summary |
|-------|---------|
| **Polarity** | **D1/D2** only **verified NEGATIVE** · **`required_therapeutic_polarity` = POSITIVE** |
| **Selector** | Combined gates · **Q8-B**; legacy shortcuts **rejected** (**Q8-K**) |
| **Pediatric** | **D13-HS** + **Q8-H**; **D13-G** dose separate (**Q8-I**) |
| **Runtime** | **NOT_IMPLEMENTED** · **`current_runtime_potency_delta = NONE`** (**Q8-P**) |

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 9 READ-ONLY AUDIT** *(superseded — Q09-CLOSE owner specification recorded below.)*

## **Q09-CLOSE** — MIXED controlled split (**Q9-A**–**Q9-Q**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md).

**Formal closure:** **Q09-CLOSE** · post-blocker **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded.

| Topic | Summary |
|-------|---------|
| **Split** | Full → **`RESOLVED_BY_CONTROLLED_SPLIT`**; partial → **`PARTIALLY_RESOLVED_BY_CONTROLLED_SPLIT`** (**Q9-N**) |
| **Rule 2** | Upstream polarity only (**Q9-O**) |
| **Registry** | **`NOT_EXECUTABLE_AS_Q9_SELECTOR`** (**Q9-P**) |
| **Enums / matrix** | **Q9-Q** (`split_status`, `slot_resolution_status`, failure table) |
| **Contradiction** | Same target POS+NEG not splittable → **`POLARITY_CONTRADICTORY`** |
| **Legacy** | **MIXED→D2/D10/D30** · missing→MIXED **rejected** |
| **SUPPORT_ONLY** | **Deferred to Q11** |
| **Runtime** | **NOT_IMPLEMENTED** · **`automatic_mixed_split_runtime = FALSE`** |

**STOP — WAIT FOR QUESTION 9 POST-BLOCKER FINAL VALIDATION** *(superseded — Q09-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 10 READ-ONLY AUDIT** *(superseded — Q10-CLOSE owner specification recorded below.)*

## **Q10-CLOSE** — NEUTRAL non-potency (**Q10-A**–**Q10-Q**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md).

**Formal closure:** **Q10-CLOSE** · final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded.

| Topic | Summary |
|-------|---------|
| **Scope** | Rule 2 **RESOLVED NEUTRAL** + therapeutic **NEUTRAL** only |
| **Outcome** | **`POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET`** · no **D1–D60** |
| **Not D2/D5** | Resolved **NEUTRAL disease** ≠ automatic **D2** or **D5** |
| **Deferred** | **UNRESOLVED** / **SUPPORT_ONLY** → **Q11-CLOSE** (**Q11-A**–**Q11-R**) recorded |
| **Runtime** | **NOT_IMPLEMENTED** · **`automatic_neutral_potency_runtime = FALSE`** |

**STOP — WAIT FOR QUESTION 10 FINAL CLOSURE VALIDATION** *(superseded — Q10-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 11 READ-ONLY AUDIT** *(superseded — Q11-CLOSE owner specification recorded below.)*

## **Q11-CLOSE** — UNRESOLVED / SUPPORT_ONLY potency safety (**Q11-A**–**Q11-R**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md).

**Formal closure:** **Q11-CLOSE** · final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded.

| Topic | Summary |
|-------|---------|
| **UNRESOLVED** | **`potency_status` = UNRESOLVED** · **`selected_dilution` = null** (**Q11-B**) |
| **SUPPORT_ONLY** | **`POTENCY_NOT_APPLICABLE_FOR_SUPPORT_ONLY_SLOT`** · no independent candidates (**Q11-C**) |
| **Not D2/D5** | Therapeutic **NEUTRAL** fallback ≠ **D2/D5** (**Q11-E/F**) |
| **Partial slots** | **Q9-N** + **Q11-I** |
| **Registry** | **`NOT_EXECUTABLE_AS_Q11_SELECTOR`** (**Q11-L**) |
| **Runtime** | **NOT_IMPLEMENTED** · dual runtime flags **FALSE** (**Q11-Q**) |

**STOP — WAIT FOR QUESTION 11 FINAL CLOSURE VALIDATION** *(superseded — Q11-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 12 READ-ONLY AUDIT** *(superseded — Q12-CLOSE owner specification recorded below.)*

## **Q12-CLOSE** — Formula-specific disease phase integration (**Q12-A**–**Q12-W**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q12-CLOSE**.

**Naming:** **Rule 4 Question 12** (phase integration) **≠** **Q7 Decision 12** / **Q07C-CLOSE-D12** (temperament).

**Formal closure:** **Q12-CLOSE** · final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded.

| Topic | Summary |
|-------|---------|
| **Authority** | **D02** · **D09** · **D11** — **no rewrite** (**Q12-A**) |
| **Per slot** | Formula-specific phase fields · no cross-formula leakage (**Q12-B**) |
| **Day bands** | **D11**/**D09** preserved · duration = fallback not vote (**Q12-C**) |
| **Phase ≠ potency** | **Q12-F** — cascade gates only |
| **Flare split** | **`CURRENT_ACUTE_FLARE`** + **`UNDERLYING_CHRONIC_TARGET`** (**Q12-K/L**) |
| **Lexicon** | **`PHASE_MULTILINGUAL_TIMELINE_LEXICON = SEPARATE_FREEZE_PENDING`** (**Q12-N**) |
| **Registry** | **`NOT_EXECUTABLE_AS_Q12_SELECTOR`** (**Q12-Q**) |
| **Runtime** | **`automatic_phase_runtime = FALSE`** · **`automatic_flare_split_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q12-V**) |

**STOP — WAIT FOR QUESTION 12 FINAL CLOSURE VALIDATION** *(superseded — Q12-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 13 READ-ONLY AUDIT** *(superseded — Q13-CLOSE owner specification recorded below.)*

## **Q13-CLOSE** — Formula-specific severity integration (**Q13-A**–**Q13-X**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q13-CLOSE**.

**Naming:** **Rule 4 Question 13** (severity integration) **≠** **Q7 Decision 10** (**D10**) **≠** **Q7 Decision 13** (**D13**) **≠** **D13-G** (dose).

**Formal closure:** **Q13-CLOSE** · final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded.

| Topic | Summary |
|-------|---------|
| **Authority** | **D10-A**–**D10-M** — **no rewrite** (**Q13-A**) |
| **Per slot** | Formula-specific severity · no cross-formula leakage (**Q13-B**) |
| **Scale** | **1–10** bands per **D10-A** · no default **5** (**Q13-C**) |
| **Severity ≠ potency** | **Q13-F** — cascade gates only |
| **Fail-closed** | Required paths → **Q13-G** |
| **Dual-slot** | **Q13-L** + **Q12-K** alignment |
| **Lexicon/lab** | **`SEPARATE_FREEZE_PENDING`** (**Q13-N**) |
| **Registry** | **`NOT_EXECUTABLE_AS_Q13_SELECTOR`** (**Q13-R**) |
| **Runtime** | **`automatic_severity_runtime = FALSE`** (+ free-text/lab flags **FALSE**) (**Q13-W**) |

**STOP — WAIT FOR QUESTION 13 FINAL CLOSURE VALIDATION** *(superseded — Q13-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 14 READ-ONLY AUDIT** *(superseded — Q14-CLOSE owner specification recorded below.)*

## **Q14-CLOSE** — Verified non-pediatric adult age (**Q14-A**–**Q14-U**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q14-CLOSE**.

**Naming:** **Rule 4 Question 14** (adult age) **≠** **Q7 Decision 14** / **Q07C-CLOSE-D14** (Tier 3 mapping) **≠** **Q7 Decision 13** / **D13** (pediatric) **≠** **D13-G** (dose).

**Formal closure:** **Q14-CLOSE** · final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded.

| Topic | Summary |
|-------|---------|
| **Scope** | Verified age **≥13** · **P13-E** **ADULT** (**Q14-A**) |
| **No overlay** | **`adult_potency_overlay = NONE`** · no geriatric sub-bands (**Q14-B**) |
| **Age ≠ potency** | **Q14-C** · legacy geriatric shortcuts **rejected** (**Q14-D**) |
| **Authorities** | **Q7–Q13** + **Q06C** unchanged (**Q14-E/F**) |
| **Frailty/weight** | Not inferred from age (**Q14-G**) |
| **Age failures** | **Q14-I** · boundary **Q14-J** |
| **Dose** | **D13-G-C** separate (**Q14-K**) |
| **Isolation** | **Q14-L** · **Q14-M** precedence · **Q14-N** routes |
| **Registry** | **`NOT_EXECUTABLE_AS_Q14_SELECTOR`** (**Q14-O**) |
| **Runtime** | **`automatic_adult_age_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q14-T**) |

**STOP — WAIT FOR QUESTION 14 FINAL CLOSURE VALIDATION** *(superseded — Q14-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 15 READ-ONLY AUDIT** *(superseded — Q15-CLOSE owner specification recorded below.)*

## **Q15-CLOSE** — Per-formula potency isolation (**Q15-A**–**Q15-U**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q15-CLOSE**.

**Naming:** **Rule 4 Question 15** (multi-slot isolation) **≠** **Rule 4 Question 16** (formula-specific report / **`global_text`** wiring).

**Formal closure:** **Q15-CLOSE** · final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded.

| Topic | Summary |
|-------|---------|
| **Policy** | **Option A + B + C** combined (**Q15-R**) |
| **Pass** | One Rule 4 pass per oral **`formula_slot_id`** (**Q15-B**) |
| **Leakage** | Cross-formula evidence · polarity · phase · severity · sensitivity · pathology · BP **blocked** (**Q15-C**) |
| **Partial** | **Q9-N** mandatory — valid slots preserved (**Q15-D**) |
| **Whole-Rx fail-close** | **Q06C** · hold · **D13-HS** only (**Q15-E**) |
| **No global D\*** | **Q15-F** · slot-bound **`selected_dilution`** |
| **Dedupe** | **Q-L** same target; contradiction → slot **UNRESOLVED** (**Q15-H**) |
| **Registry** | **`NOT_EXECUTABLE_AS_Q15_SELECTOR`** (**Q15-M**) |
| **Runtime** | **`automatic_multi_formula_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q15-T**) |

**STOP — WAIT FOR QUESTION 15 FINAL CLOSURE VALIDATION** *(superseded — Q15-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 16 READ-ONLY AUDIT** *(superseded — Q16-CLOSE owner specification recorded below.)*

## **Q16-CLOSE** — Formula-specific structured report evidence (**Q16-A**–**Q16-U**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q16-CLOSE**.

**Naming:** **Rule 4 Question 16** (report / item wiring) **≠** **Rule 4 Question 15** (multi-slot isolation).

**Formal closure:** **Q16-CLOSE** · final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded.

| Topic | Summary |
|-------|---------|
| **Decomposition** | Reports → **item-level** findings; **`global_text`** / **`sys_text_full`** potency selectors **prohibited** (**Q16-B**) |
| **Binding** | **`report_id`** · **`finding_id`** · slot/target · organ/site/pathology · assertion · verification · **DIRECT** · **D08** confidence (**Q16-C/D**) |
| **Siblings** | Missing mandatory field → item **`IGNORED_NOT_USABLE`**; valid siblings **preserved** (**Q16-E**) |
| **Multi-formula** | Same report **may** feed multiple slots when **each** finding passes **D04/Q-D** independently (**Q16-F**) |
| **History** | Newer verified same-site supersedes for current decision; append-only history (**Q16-G**) |
| **Patient-wide** | Source critical + frozen crisis/red flags → **`URGENT_ESCALATION`** + **`PRESCRIPTION_HOLD`**; non-BP catalog **`SEPARATE_SAFETY_DATA_FREEZE_PENDING`** (**Q16-H**) |
| **Chief complaint** | Tier **4A** **supporting only** — not independent corroboration (**Q16-I**) |
| **Q3/Q4/Q5** | Controlled versioned extensible codes — no free-text executable class (**Q16-J**) |
| **Photos/vision** | No selector from raw/auto vision; doctor site-bound Tier **1** only (**Q16-K**) |
| **Labels** | **CONFIRMED_VERIFIED** → safety/referral/evidence — **not** label-alone potency (**Q16-L**) |
| **Registry** | **`NOT_EXECUTABLE_AS_Q16_SELECTOR`** (**Q16-M**) |
| **Runtime** | **`automatic_report_wiring_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q16-T**) |

**STOP — WAIT FOR QUESTION 16 FINAL CLOSURE VALIDATION** *(superseded — Q16-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 17 READ-ONLY AUDIT** *(superseded — Q17-CLOSE owner specification recorded below.)*

## **Q17-CLOSE** — Rule 1 temperament integration (**Q17-A**–**Q17-U**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q17-CLOSE**.

**Formal closure:** **Q17-CLOSE** · final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded.

**Closure note (Rule 1 impact matrix — metadata only):** Generic Rule 1 “scoring/modifier” potency wording is **limited/superseded** for EHAS2 Rule 4 by **Q17-B** · **Q17-C** and **D12-A** (by reference) — **no** authorized **numerical potency scoring**.

**Closure note (**UNRESOLVED_TIE**):** **`primary_temperament_consultation_confirmed`** does **not** confer potency preference eligibility — **NO_PREFERENCE** per **Q17-I** / **Q8-G**.

**Naming:** **Rule 4 Question 17** (Rule 1 wiring) **≠** **Q7 Decision 12** (**Q07C-CLOSE-D12**) **≠** **Rule 4 Question 12** (phase).

| Topic | Summary |
|-------|---------|
| **Weights** | **No** numerical potency weights; Rule 1 scores **temperament-only** (**Q17-B**) |
| **Role** | **SUPPORTING_EVIDENCE_ONLY** — no create/promote/demote/override (**Q17-C**) |
| **Input** | **Current consultation** confirmed **`primary_temperament`** only; no stale snapshot (**Q17-D**) |
| **Unresolved** | Missing/low-confidence/**ADDITIONAL_INFORMATION_REQUIRED**/**FOLLOW_UP_REQUIRED** → **NO_PREFERENCE** (**Q17-E**) |
| **NEGATIVE tie** | After **Q8** gates · **both D1+D2** → **Q8-G** table (**Q17-G**) |
| **POSITIVE D3/D5** | **D12-B-EXEC NO-OP** · **CLOSE-D05** unchanged (**Q17-J**) |
| **NERVOUS-alone** | No **D1–D60** / sensitivity / pathology class qualify (**Q17-L**) |
| **Slots** | Patient context per slot · independent tie-break · no cross-slot copy (**Q17-M**) |
| **Registry** | **`NOT_EXECUTABLE_AS_Q17_SELECTOR`** (**Q17-N**) |
| **Runtime** | **`automatic_temperament_potency_runtime = FALSE`** (**Q17-T**) |
| **Matrix audit** | **Q17-Q** rows **9–10** (**MIXED** · **UNRESOLVED_TIE** → **NO_PREFERENCE**) — additive; **Q17-I** / **Q8-G** unchanged |

**STOP — WAIT FOR QUESTION 17 FINAL CLOSURE VALIDATION** *(superseded — Q17-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 18 READ-ONLY AUDIT** *(superseded — Q18-CLOSE owner specification recorded below.)*

## **Q18-CLOSE** — Prescription issuance and final doctor approval (**Q18-A**–**Q18-U**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**. Canonical spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q18-CLOSE**.

**Formal closure:** **Q18-CLOSE** · final validation **READY_TO_CLOSE** accepted; prior **CLOSURE_VALIDATION_PENDING** superseded.

**Row 19 index:** **5R-SDG** — **Q18-S** additive cross-reference only; **Phase 5R-SDG** body **unchanged**.

**Owner policy:** **Option A + Option D** · strict partial-prescription finalization.

**Naming:** **Rule 4 Question 18** (issuance integration) **≠** row **19** (**5R-SDG**) **≠** rewrite of **5R-DRG** / **5R-SDG** bodies.

| Topic | Summary |
|-------|---------|
| **Draft** | Full summary + draft Rx after single pass (**Q18-B**) |
| **Flags** | **`automatic_issuance = false`** always · **`final_doctor_approval_required = true`** · **`prescription_issue_allowed = false`** until approval + all gates (**Q18-E**, **Q18-J**) |
| **Doctor** | Approve/Modify after full summary — **no** mid-analysis potency (**Q18-D**) |
| **Holds** | **PRESCRIPTION_HOLD** · **Q06C** · **D13-HS** · Rule 3 block — **no** silent auto-clear (**Q18-E**) |
| **Partial** | **`PARTIALLY_RESOLVED`** · **`PROPOSED_PENDING_DOCTOR_REVIEW`** · siblings preserved (**Q18-F**) |
| **Final Rx** | No UNRESOLVED/null dilution lines — exclude or re-run (**Q18-G/H**) |
| **D13 RESTRICT** | **D13-D** required before issue (**Q18-I**) |
| **Cross-engine** | Case-level AND (**Q18-J**) |
| **Q10/Q11** | Non-potency slots — no medicated lines (**Q18-K**) |
| **Quarantine** | Legacy always-D* · MDE · registry · **global_text** (**Q18-L**) |
| **Runtime** | **`automatic_prescription_issuance_runtime = FALSE`** (**Q18-T**) |

**STOP — WAIT FOR RULE 4 FINAL CROSS-QUESTION INTEGRATION VALIDATION** *(superseded — documentation freeze recorded in header / count section.)*

**STOP — RULE 4 DOCUMENTATION FROZEN · IMPLEMENTATION NOT STARTED · WAIT FOR OWNER APPROVAL BEFORE IMPLEMENTATION PLANNING**
