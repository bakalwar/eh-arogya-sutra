# Rule 4 — Owner Decisions (Phase 5R-4D · **DOCUMENTATION FROZEN**)

**RULE 4 CLINICAL DOCUMENTATION SPECIFICATION:** **OWNER_APPROVED** · **FROZEN** · **NOT_IMPLEMENTED**

**Authority:** Owner-approved clinical software specification (documentation)  
**EHAS2 runtime:** **NOT_IMPLEMENTED** — no automatic potency · report wiring · phase · severity · temperament · or issuance runtime active  
**Forensic basis:** `%TEMP%\ehas2_rule4_forensic_audit\` · Phase 5R-4Q display  
**Effective:** Frozen documentation only — **no** production runtime activation

> **Freeze scope:** Clinical/specification text for **Q7 Decisions 1–14** and **Questions 8–18** is frozen. **Q1–Q6** owner-policy tranche text is frozen as recorded; **implementation wiring** may remain **IMPLEMENTATION_PENDING**. Pending **data assets** and **engineering wiring** continue on **separate tracks** after this documentation freeze.

---

## Rule 4 documentation freeze (Phase 5R-4D-FREEZE — metadata only)

| Item | Status |
|------|--------|
| **Documentation / clinical specification** | **OWNER_APPROVED** · **FROZEN** |
| **Runtime implementation** | **NOT_STARTED** · **NOT_IMPLEMENTED** |
| **Question 7** | **FULLY_RESOLVED** · decisions **14/14 CLOSED** |
| **Questions 8–18** | **CLOSED** · **NOT_IMPLEMENTED** |
| **Row 19 / 5R-SDG** | **OWNER_DECISION_RECORDED** (**Q18-S** index) |

**Runtime truthfulness (unchanged):** **`execution_status = NOT_IMPLEMENTED`** · all documented **`automatic_*_runtime = FALSE`** · **`current_runtime_*_delta = NONE`** · registry issuance/potency selectors **`NOT_EXECUTABLE`** where specified · **`automatic_issuance = FALSE`**.

### Rule 4 precedence index (pointer-only — canonical contracts not duplicated)

| Order | Layer | Primary pointers |
|------:|-------|------------------|
| 1 | Identity / verified age | **Q01F** · **Q02F** · **Q14** · **D13-HS** |
| 2 | Crisis / patient-wide holds | **Q06C** · **Q15-E** · **Q18-E** |
| 3 | **Rule 2** disease / therapeutic polarity | **5R-4D-PB** · **Q9** · **Q10** · **Q11** |
| 4 | **Rule 3** organ/system · formula target | Rule 3 freeze · **Q16** wiring |
| 5 | **D04** / **D08** report evidence | **Q07C-CLOSE-D04** · **D08** · **Q16** |
| 6 | Phase | **Q12** · **D02** · **D09** · **D11** |
| 7 | Severity | **Q13** · **D10** |
| 8 | Potency pathway | **Q7** · **Q8** · **Q9** · **Q10** · **Q11** |
| 9 | Temperament tie-break | **Q17** · **D12** · **Q8-G** (**D3↔D5** **NO-OP**) |
| 10 | Pediatric overlay | **D13-C** / **D13-D** |
| 11 | Per-formula isolation | **Q15** |
| 12 | Issuance / doctor approval | **Q18** · **5R-DRG** · **5R-SDG** (bodies unchanged) |

### Q1–Q6 owner policy tranche (freeze note)

Rows **1–6** in [rule-04-unresolved-clinical-questions-DRAFT.md](./rule-04-unresolved-clinical-questions-DRAFT.md) record **early owner policy** (**Q01F**–**Q06C**). **Clinical/policy text in those sections is not rewritten in this freeze pass.** Wiring and classification binding for rows **3–6** may remain **IMPLEMENTATION_PENDING** / **NOT_FROZEN** in row metadata — **they do not claim executable selector authority**; authoritative selectors are **Q7–Q18** closed contracts.

### Deferred data assets register (documentation-freeze **non-blockers** · runtime **non-executable** until separate freeze/engineering)

| Asset | Contract flag | Doc freeze blocker? | Runtime without asset |
|-------|---------------|---------------------|------------------------|
| Tier 3 pathology mapping data | **`TIER3_PATHOLOGY_MAPPING_DATA_ASSET = SEPARATE_DATA_FREEZE_PENDING`** · **D14-L** **`NOT_EXECUTABLE`** | **No** | **Must not execute** Tier 3 selector |
| Non-BP critical safety catalog | **`non_bp_critical_safety_catalog_status = SEPARATE_SAFETY_DATA_FREEZE_PENDING`** (**Q16-H**) | **No** | Patient-wide catalog paths **not executable** |
| Phase multilingual timeline lexicon | **`PHASE_MULTILINGUAL_TIMELINE_LEXICON = SEPARATE_FREEZE_PENDING`** (**Q12-T**) | **No** | Lexicon-dependent automation **not executable** |
| Severity multilingual lexicon | **`SEVERITY_MULTILINGUAL_LEXICON = SEPARATE_FREEZE_PENDING`** (**Q13-T**) | **No** | Same |
| Lab/vital-to-severity mapping | **`LAB_VITAL_TO_SEVERITY_MAPPING = SEPARATE_FREEZE_PENDING`** (**Q13-T**) | **No** | Same |
| Registry potency / selector audits | **`REGISTRY_*_AUDIT_PENDING`** · **`NOT_EXECUTABLE_AS_Q*_SELECTOR`** | **No** | Legacy/registry shortcuts **blocked** |
| **D13-G** administration dose | **`SOURCE_VALIDATION_PENDING`** (**D13-G**) | **No** | Dose path separate from **D13-C** potency overlay |

**STOP — WAIT FOR RULE 4 FINAL CROSS-QUESTION INTEGRATION VALIDATION** *(superseded — **READY_TO_FREEZE_DOCUMENTATION** accepted.)*

**STOP — RULE 4 DOCUMENTATION FROZEN · IMPLEMENTATION NOT STARTED · WAIT FOR OWNER APPROVAL BEFORE IMPLEMENTATION PLANNING**

---

## Phase 5R-DRG — System decision and doctor approval gate

**Status:** **OWNER_DECISION_RECORDED** · **OWNER_APPROVED_CLINICAL_SOFTWARE_SPECIFICATION** · **NOT_IMPLEMENTED**  
**Note:** Platform-wide execution constraints in **Phase 5R-SDG** supersede this section where they differ (e.g. prohibited follow-up fields).

### System completes analysis (single deterministic pass)

The clinical engine **must** complete its full **deterministic single-pass** analysis **without** asking the doctor to choose during rule execution:

- disease polarity · organ/system · medicine · formula · potency · electricity · clinical branch · fallback branch

The **doctor supplies** patient information and evidence. The **system evaluates** all approved rules and produces (draft):

- clinical analysis · evidence trace · selected medicines · formula structure · formula-specific potency · uncertainty flags · safety flags · draft summary · draft prescription

**Tag:** **SYSTEM_DECISION_COMPLETE** (per run) — not “doctor must choose the engine result.”

### UNRESOLVED (system-selected, not doctor-selected)

When evidence is **insufficient**, **missing**, or **contradictory**, the system **deterministically** outputs (potency envelope example) — **without** asking the doctor any question (**5R-SDG**):

| Field | Value |
|-------|--------|
| `status` | **UNRESOLVED** (or other approved deterministic status) |
| `selected_value` / `selected_dilution` | **null** when no safe selection |
| `reason_codes` | `[...]` |
| `uncertainty_flags` | `[...]` |
| `evidence_status` / `evidence_limitations` | preserved as applicable (**5R-SDG**) |
| `confidence` | preserved as applicable (**5R-SDG**) |
| `safety_flags` / `safety_status` | resolved safety classification (may coexist with UNRESOLVED potency) |

**Prohibited outputs (5R-SDG):** `additional_information_needed` · `follow_up_question` · `doctor_must_choose_potency` · any UI/runtime prompt for clinical follow-up **during** analysis.

**Prohibited:** prompting the doctor to **manually select** a potency or other engine branch **during** rule execution. Raw uncertainty and safety status **must not** be erased.

### `doctor_review_required = true` (final approval gate)

| Meaning | Detail |
|---------|--------|
| **Yes** | System analysis **complete**; draft ready for review |
| **No** | Doctor does **not** select engine branches at runtime |
| **Yes** | **Final prescription issuance blocked** until doctor action |
| **Yes** | Doctor may **approve** or **modify** the draft prescription |

**Tag:** **FINAL_DOCTOR_APPROVAL_REQUIRED** — not “doctor must decide the potency.”

### Doctor approval workflow

```text
SYSTEM_ANALYSIS_COMPLETE
  → DRAFT_SUMMARY_CREATED
  → DRAFT_PRESCRIPTION_CREATED
  → DOCTOR_REVIEW
  → APPROVE OR MODIFY
  → FINAL_PRESCRIPTION_ISSUED
```

**No prescription** may be issued **before** doctor approval.

### Crisis / red-flag workflow

- System completes **safety analysis**
- System outputs **urgent escalation** status
- **Automated prescription issuance remains blocked**
- System **must not invent** a potency
- Doctor reviews the **completed** safety + draft result (**FINAL_DOCTOR_APPROVAL_REQUIRED**)

### Summary review footer — **SUMMARY_REVIEW_FOOTER_REQUIREMENT** = **APPROVED** (not production UI in this step)

**Mandatory Hindi (exact — do not alter, shorten, or paraphrase):**

```text
डॉक्टर द्वारा प्रदान की गई जानकारी के आधार पर सिस्टम ने यह ड्राफ्ट क्लिनिकल
विश्लेषण, औषधि चयन और प्रिस्क्रिप्शन तैयार किया है। कृपया इसकी समीक्षा करें।
सही होने पर Approve करके आगे बढ़ें; आवश्यक होने पर प्रिस्क्रिप्शन में संशोधन
करें।
```

**Placement (when implemented):** after the **complete** clinical summary · at the **bottom** · **before** the Approve/Modify action area.

**English (contract reference only — not a substitute for the mandatory Hindi footer):**

Based on the information provided by the doctor, the system prepared this draft clinical analysis, medicine selection and prescription. Please review it. Approve to continue if appropriate, or modify the prescription where required.

---

## Phase 5R-SDG — System-driven decision gate (platform execution)

**Status:** **OWNER_DECISION_RECORDED** · **OWNER_APPROVED_CLINICAL_SOFTWARE_SPECIFICATION** · **NOT_IMPLEMENTED**

The system **must never** ask the doctor any **clinical follow-up question during analysis**. The doctor provides available patient information **once**. The system uses **only** that information to independently perform (single deterministic pass):

- clinical analysis · temperament assessment · organ/system detection · disease polarity assessment · medicine selection · formula construction · formula-specific potency selection · later electricity selection · safety classification · clinical summary generation · draft prescription generation

### Prohibited during analysis

| Prohibition | Tag |
|-------------|-----|
| Ask doctor to choose medicine, formula, potency, or engine branch | **PROHIBITED** |
| Follow-up clinical questions during execution | **PROHIBITED** |
| Pause analysis for manual clinical input | **PROHIBITED** |
| Fabricate missing patient data | **PROHIBITED** |
| Silent defaults | **PROHIBITED** |
| Copy evidence between unrelated formulas | **PROHIBITED** |

### Missing or limited evidence

The system **must still complete** deterministic single-pass analysis. It **must not ask a question**. It **may preserve:** `evidence_status` · `evidence_limitations` · `uncertainty_flags` · `reason_codes` · `confidence` · `safety_flags`.

It **must not create:** `additional_information_needed` · `follow_up_question` · `doctor_must_choose_potency`.

If an exact value cannot be safely selected under an approved rule, the system **records the applicable deterministic status** (e.g. **UNRESOLVED**, null selection) — **without** asking the doctor.

### Doctor role

| Phase | Role |
|-------|------|
| **During engine execution** | **NONE** — no clinical decisions |
| **After full draft summary + prescription** | Read complete result · **approve** or **modify** prescription · then continue to final issuance |

**No final prescription** before doctor approval.

### Workflow (owner-approved)

```text
DOCTOR_PROVIDES_AVAILABLE_INFORMATION
  → SYSTEM_SINGLE_PASS_ANALYSIS
  → SYSTEM_SELECTS_MEDICINES
  → SYSTEM_BUILDS_FORMULAS
  → SYSTEM_SELECTS_FORMULA_SPECIFIC_POTENCIES
  → SYSTEM_CREATES_SUMMARY
  → SYSTEM_CREATES_DRAFT_PRESCRIPTION
  → DOCTOR_APPROVES_OR_MODIFIES
  → FINAL_PRESCRIPTION
```

**Rule 4 scope:** potency/dilution only — medicine/formula/electricity/summary belong to sibling engines but obey the same **5R-SDG** gate.

---

## Q1 — Canonical identity and numbering

| Item | Provisional decision | Tag |
|------|----------------------|-----|
| Rule number | 4 | PROVISIONALLY_ACCEPTED |
| Canonical name | **Rule 4 — Potency Engine** | PROVISIONALLY_ACCEPTED |
| MASTER_9 “Rule 4 Medicine Selection” | **Rejected** as EHAS2 canonical label | PROVISIONALLY_ACCEPTED |
| Medicine selection | Separate engine/rule; canonical number **TBD** in its own forensic audit | PROVISIONALLY_ACCEPTED |
| EH_9 / `9-rule-v4.0` Potency alignment | Adopted for Rule 4 identity | PROVISIONALLY_ACCEPTED |

---

## Q2 — Responsibility boundary

| Rule 4 **must** | Tag |
|-----------------|-----|
| For **each formula/mixture independently**, evaluate and annotate **potency/dilution** decision | PROVISIONALLY_ACCEPTED |

| Rule 4 **must not** | Tag |
|---------------------|-----|
| Select medicines | PROVISIONALLY_ACCEPTED |
| Change medicines | PROVISIONALLY_ACCEPTED |
| Change formula composition | PROVISIONALLY_ACCEPTED |
| Change mixture count | PROVISIONALLY_ACCEPTED |
| Select electricity | PROVISIONALLY_ACCEPTED |
| Create Tablet A/B candidates | PROVISIONALLY_ACCEPTED |
| Create external formulas | PROVISIONALLY_ACCEPTED |
| Overwrite Rule 1, Rule 2, or Rule 3 outputs | PROVISIONALLY_ACCEPTED |

---

## Q3 — Input authority (draft taxonomy)

| Input | Draft role | Tag |
|-------|------------|-----|
| Rule 2 formula-specific **disease polarity** | **AUTHORITATIVE_INPUT** | PROVISIONALLY_ACCEPTED |
| Rule 2 required **therapeutic polarity** | **AUTHORITATIVE_INPUT** (stored **separately** from disease polarity) | PROVISIONALLY_ACCEPTED |
| Target pathology + disease **phase** | **AUTHORITATIVE_CLINICAL_EVIDENCE** when resolved | PROVISIONALLY_ACCEPTED |
| **Severity** | **SUPPORTING_EVIDENCE** (unless owner later promotes) | PROVISIONALLY_ACCEPTED |
| **Verified age** | **PATIENT_CONTEXT / SAFETY_INPUT** | PROVISIONALLY_ACCEPTED |
| **Verified BP** | **FORMULA_SCOPED_SUPPORTING_EVIDENCE** only for relevant CARDIAC/VASCULAR targets; **no global leakage** | PROVISIONALLY_ACCEPTED |
| Rule 3 **target organ/system** | **FORMULA_SCOPING_INPUT** | PROVISIONALLY_ACCEPTED |
| **Verified report finding** | **FORMULA_SCOPED_SUPPORTING_EVIDENCE** only | PROVISIONALLY_ACCEPTED |
| Rule 1 **Temperament** | **SUPPORTING_EVIDENCE_ONLY** — may inform potency as evidence; **must not** independently or automatically select potency | PROVISIONALLY_ACCEPTED |

**Correction vs forensic shorthand:** Rule 1 is **not** “ignored”; it aligns with frozen [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) (downstream evidence, no direct potency selection).

---

## Q4 — Fabricated defaults prohibited

| Legacy substitution | EHAS2 draft | Tag |
|---------------------|-------------|-----|
| missing polarity → MIXED | **Prohibited** as observed fact | PROVISIONALLY_ACCEPTED |
| UNRESOLVED / SUPPORT_ONLY coerced to MIXED for potency (legacy) | **Prohibited** — must not yield silent D5/D60/D10/D30 | OWNER_DECISION_RECORDED (Q2F) |
| missing age → 40 | **Prohibited** | PROVISIONALLY_ACCEPTED |
| missing BP → 120 | **Prohibited** | PROVISIONALLY_ACCEPTED |
| missing severity → 5 | **Prohibited** | PROVISIONALLY_ACCEPTED |
| missing phase → ACUTE | **Prohibited** | PROVISIONALLY_ACCEPTED |

Raw missing/unresolved values remain: **UNKNOWN**, **MISSING**, **UNRESOLVED**.

If operational fallback is later approved, record separately:

`raw_value`, `resolved_value`, `fallback_policy`, `fallback_reason`, `confidence`, `doctor_review_required` — **without overwriting raw uncertainty**.

When required evidence is missing, Rule 4 may prepare an **unresolved draft** but **must not** silently claim clinically resolved potency. **`doctor_review_required = true`** marks **FINAL_DOCTOR_APPROVAL_REQUIRED** before issuance — not a request for the doctor to pick potency during engine execution.

---

## Q5 — Route-specific contracts

| Route | Draft contract | Tag |
|-------|----------------|-----|
| **Oral formula potency** | **Rule 4 — Potency Engine** | PROVISIONALLY_ACCEPTED |
| **Tablet Section A/B** | Separate route policy — **audit pending** | PROVISIONALLY_ACCEPTED |
| **External application potency/concentration** | Separate policy — **audit pending** | PROVISIONALLY_ACCEPTED |
| Auto-copy oral dilution → tablet/external | **Prohibited** | PROVISIONALLY_ACCEPTED |
| Tablet A/B medicine selection | Independent from oral formulas; full **39-medicine pool** per separately approved rules | PROVISIONALLY_ACCEPTED |

---

## Q6 — Terminology and legacy quarantine

| Item | EHAS2 draft | Tag |
|------|-------------|-----|
| Rule 4 label | **Potency Engine** only in product | PROVISIONALLY_ACCEPTED |
| Canonical output envelope | **`potency_decision`** | PROVISIONALLY_ACCEPTED |
| Selected dilution | Explicit field **inside** `potency_decision` | PROVISIONALLY_ACCEPTED |
| Electricity displayed as Rule 4 | **Prohibited** | PROVISIONALLY_ACCEPTED |
| Medicine Selection displayed as Rule 4 | **Prohibited** | PROVISIONALLY_ACCEPTED |
| Legacy `POTENCY_RULES_DATA` / seed table | **Non-authoritative** until reconciled | PROVISIONALLY_ACCEPTED |
| Legacy consensus `_EH_RULE_MAP` Rule 4 strings | **Migration metadata only** | PROVISIONALLY_ACCEPTED |
| `summary_engine` “Rule 4 (Elec)” | **Must not** be copied into EHAS2 | PROVISIONALLY_ACCEPTED |
| Shadow `potency` vs mixture `dilution` key mismatch | **Must not** become production contract | PROVISIONALLY_ACCEPTED |

---

---

## Unresolved clinical Q1 — Pediatric age 0–5 potency (Phase 5R-4D-Q01F)

**Status:** **OWNER_DECISION_RECORDED** · **NOT_FROZEN** (full Rule 4 spec / ladder still open)

| Item | Owner decision | Tag |
|------|----------------|-----|
| Legacy blanket rule (age ≤5: POSITIVE→D30, else→D10) | **REJECTED** for EHAS2 — ignores disease, pathology, phase, severity, reports, organ/system, serious evidence via early return | OWNER_DECISION_RECORDED |
| Age alone selects potency | **PROHIBITED** | OWNER_DECISION_RECORDED |
| Verified age | Pediatric **safety/context** input only | OWNER_DECISION_RECORDED |
| Dedicated pediatric policy (0–5) | **REQUIRED** — per-formula evaluation with formula-scoped evidence | OWNER_DECISION_RECORDED |
| Per-formula potency | **REQUIRED** — each oral mixture independent | OWNER_DECISION_RECORDED |
| D30 because age ≤5 or POSITIVE alone | **PROHIBITED** | OWNER_DECISION_RECORDED |
| D30 as evidence-conditioned **candidate** | **OWNER_APPROVED_IN_PRINCIPLE** — only with sufficient verified formula evidence for owner-defined eligible patterns (hypersensitive/allergic; chronic hyper-reactive; deep neurological target) — **not executable keywords yet**; vocabulary, thresholds, golden cases **IMPLEMENTATION_PENDING** | OWNER_DECISION_RECORDED |
| D30 prohibited sources | Global symptom leakage; unrelated report; ordinary/general photo; missing/unresolved formula evidence | OWNER_DECISION_RECORDED |
| Missing verified age or required formula evidence | System **UNRESOLVED** (`selected_dilution = null`, `reason_codes` / `uncertainty_flags` / `evidence_status` / `evidence_limitations` per **5R-SDG**); `doctor_review_required = true` (**FINAL_DOCTOR_APPROVAL_REQUIRED**) | OWNER_DECISION_RECORDED |
| Fabricated substitutes (40, 120, 5, MIXED, ACUTE) | **PROHIBITED** — raw uncertainty preserved | OWNER_DECISION_RECORDED |
| Emergency / red-flag precedence | Pediatric policy **must not suppress** detection; safety gate before final issuance; **must not** auto-select potency unless separately approved | OWNER_DECISION_RECORDED |
| Final issuance | **SYSTEM_DECISION_COMPLETE** → draft; **FINAL_DOCTOR_APPROVAL_REQUIRED** before prescription issue | OWNER_DECISION_RECORDED |

### Per-formula inputs (age 0–5 policy must evaluate)

Verified patient age; target pathology; Rule 3 target organ/system; disease phase; severity; Rule 2 `disease_polarity`; Rule 2 `required_therapeutic_polarity`; verified formula-related report findings; supported symptoms; Rule 1 temperament **SUPPORTING_EVIDENCE_ONLY**.

---

## Unresolved clinical Q2 — Pediatric age 6–12 potency (Phase 5R-4D-Q02F)

**Status:** **OWNER_DECISION_RECORDED** · **NOT_FROZEN** (exact D5/D10/D30/D60 ladder thresholds **OWNER_DECISION_PENDING**)

| Item | Owner decision | Tag |
|------|----------------|-----|
| Legacy blanket rule (age >5 and ≤12: POSITIVE→D60, else→D5) | **REJECTED** — ignores phase, severity, pathology, organ/system, reports, temperament, serious/emergency evidence via early return | OWNER_DECISION_RECORDED |
| Question 1 pediatric structure | **Extended** to age **6–12** | OWNER_DECISION_RECORDED |
| Age alone selects potency | **PROHIBITED** | OWNER_DECISION_RECORDED |
| Verified age | Pediatric **safety/context modifier** only | OWNER_DECISION_RECORDED |
| Per-formula potency | **REQUIRED** — independent evaluation per oral mixture | OWNER_DECISION_RECORDED |
| UNRESOLVED / SUPPORT_ONLY → MIXED → D5/D60 | **PROHIBITED** | OWNER_DECISION_RECORDED |
| D60 on owner scale | **Valid** as **evidence-conditioned candidate** only — **not** because age 6–12 or POSITIVE alone | OWNER_DECISION_RECORDED |
| D5 / D10 / D30 / D60 group | **HIGH-NEGATIVE dilution group** — exact selection thresholds **OWNER_DECISION_PENDING** · **NOT_FROZEN** · **NOT_IMPLEMENTED** | OWNER_DECISION_RECORDED |
| Missing / unresolved evidence | `potency_status = UNRESOLVED`, `selected_dilution = null`, preserve uncertainty/evidence fields per **5R-SDG** (no `additional_information_needed`); `doctor_review_required = true` (**FINAL_DOCTOR_APPROVAL_REQUIRED**) | OWNER_DECISION_RECORDED |
| Fabricated defaults (40, 120, 5, MIXED, ACUTE) | **PROHIBITED** | OWNER_DECISION_RECORDED |
| Emergency / red-flag | **Must not** be suppressed by pediatric early-return pattern | OWNER_DECISION_RECORDED |
| Final issuance | **SYSTEM_DECISION_COMPLETE** → draft; **FINAL_DOCTOR_APPROVAL_REQUIRED** before prescription issue (**5R-DRG**) | OWNER_DECISION_RECORDED |

### Per-formula inputs (age 6–12 policy must evaluate)

Verified age; target pathology; Rule 3 target organ/system; disease phase; severity; Rule 2 `disease_polarity`; Rule 2 `required_therapeutic_polarity`; formula-related symptoms; related **verified** report findings; Rule 1 temperament **SUPPORTING_EVIDENCE_ONLY**.

**Cross-reference (Decision 13 — non-mutating):** Per-formula pediatric overlay **Q07C-CLOSE-D13** (**D13-A**–**D13-G**, **D13-HS**, **D13-B-EXEC**) — **D13-HS** **&lt;1y** hard stop · potency **D13-C**–**D13-F** (**P13-C/D**) + administration dose **D13-G** — **does not** alter **Q01F** / **Q02F** recorded clinical rows above.

---

## Unresolved clinical Q3 — Cancer/tumor keyword → D500 (Phase 5R-4D-Q03F)

**Status:** **OWNER_DECISION_RECORDED** · **NOT_FROZEN** (classification vocabulary / negation rules **IMPLEMENTATION_PENDING**)

| Item | Owner decision | Tag |
|------|----------------|-----|
| Legacy rule (`cancer` / `tumor` substring → **D500**) | **REJECTED** | OWNER_DECISION_RECORDED |
| **D500** on current owner scale (D1–D3, D5/D10/D30/D60) | **NOT_RECOGNIZED_IN_CURRENT_OWNER_SCALE** | OWNER_DECISION_RECORDED |
| **D500_AUTO_SELECTION** | **PROHIBITED** | OWNER_DECISION_RECORDED |
| Keyword alone = confirmed diagnosis | **PROHIBITED** | OWNER_DECISION_RECORDED |
| Evidence must be classified | **REQUIRED** — `CONFIRMED_VERIFIED`, `SUSPECTED`, `RULE_OUT`, `NEGATED`, `HISTORICAL`, `FAMILY_HISTORY`, `UNVERIFIED`, `UNRELATED_REPORT` | OWNER_DECISION_RECORDED |
| Primary role of cancer/tumor evidence | **SAFETY_RED_FLAG** · **SPECIALIST_REVIEW_TRIGGER** · **DOCTOR_REVIEW_REQUIRED** — **must not directly select potency** | OWNER_DECISION_RECORDED |
| **CONFIRMED_VERIFIED** cancer/tumor | **Must not** auto-select D500 or any dilution — potency still per-formula from pathology, Rule 3 system, phase, severity, Rule 2 polarities, formula-scoped verified evidence, pediatric policy (Q1–Q2) | OWNER_DECISION_RECORDED |
| Suspected / negated / historical / family-history / unrelated / unverified | **Must not** select potency; if required formula evidence insufficient → `potency_status = UNRESOLVED`, `selected_dilution = null`, `doctor_review_required = true` | OWNER_DECISION_RECORDED |
| Formula isolation | Cancer/tumor for one target **must not** alter unrelated mixtures; **global symptom/OCR keyword leakage prohibited** | OWNER_DECISION_RECORDED |
| Negation examples (non-exhaustive) | `no tumor`, `rule out tumor`, `suspected tumor`, `family history of cancer`, `old history of cancer`, unrelated copied report text — **must not** become confirmed cancer evidence | OWNER_DECISION_RECORDED |
| Pediatric (Q1–Q2) | Cancer/tumor text **must not bypass** dedicated pediatric evidence and review policy | OWNER_DECISION_RECORDED |
| Treatment claim | EHAS2 **must not** claim any potency treats or cures cancer; decision-support drafts + **doctor review** only | OWNER_DECISION_RECORDED |

**Note:** Legacy `potency_engine.py` L46–47 combines cancer/tumor with paralysis/lakwa — Q3 and Q4 decisions are recorded **separately**.

---

## Unresolved clinical Q4 — Paralysis/lakwa keyword → D500 (Phase 5R-4D-Q04F)

**Status:** **OWNER_DECISION_RECORDED** · **NOT_FROZEN** (classification wiring / acute escalation paths **IMPLEMENTATION_PENDING**)

| Item | Owner decision | Tag |
|------|----------------|-----|
| Legacy rule (`paralysis` / `lakwa` substring → **D500**) | **REJECTED** | OWNER_DECISION_RECORDED |
| **D500_AUTO_SELECTION** | **PROHIBITED** — **D500** not on owner D1–D60 scale | OWNER_DECISION_RECORDED |
| Keyword alone = diagnosis | **PROHIBITED** | OWNER_DECISION_RECORDED |
| Evidence classification | **REQUIRED:** `ACUTE_NEUROLOGICAL_RED_FLAG`, `CONFIRMED_CHRONIC_PARALYSIS`, `RESIDUAL_POST_STROKE_DEFICIT`, `SUSPECTED`, `TEMPORARY_WEAKNESS`, `NUMBNESS_OR_NEUROPATHY`, `NEGATED`, `HISTORICAL`, `UNVERIFIED`, `UNRELATED_REPORT` | OWNER_DECISION_RECORDED |
| **Acute neurological red flags** | **URGENT safety escalation** + **mandatory doctor review** — **must not** auto-select D500 or any potency | OWNER_DECISION_RECORDED |
| **Confirmed chronic paralysis** | **Must not** auto-select potency; per-formula evaluation (pathology, Rule 3, phase, severity, Rule 2 polarities, formula-scoped verified evidence, pediatric Q1–Q2) | OWNER_DECISION_RECORDED |
| Owner direction (chronic/hypo/paralysis) | May align with **NEGATIVE** disease state + **POSITIVE** therapeutic force; **D1** as **candidate direction** only | **OWNER_PROVIDED_DIRECTION** · **NOT_AUTOMATIC_MAPPING** · **EXACT_LADDER_NOT_FROZEN** · **IMPLEMENTATION_PROHIBITED** |
| Hardcoding | **Prohibited:** no `paralysis → D1` automatic mapping | OWNER_DECISION_RECORDED |
| Unverified / ambiguous | `potency_status = UNRESOLVED`, `selected_dilution = null`, `doctor_review_required = true` | OWNER_DECISION_RECORDED |
| Negation / non-select phrases (examples) | `no paralysis`, `rule out paralysis`, `history of paralysis`, `suspected paralysis`, `temporary weakness`, unrelated copied report, `लकवा नहीं है` — **must not** select potency | OWNER_DECISION_RECORDED |
| Formula isolation | Paralysis evidence **only** for related neuro/target formulas; **global leakage prohibited** | OWNER_DECISION_RECORDED |
| Pediatric Q1–Q2 | **Remain authoritative** | OWNER_DECISION_RECORDED |
| Treatment claim | **No** paralysis/stroke treat or cure claims; decision-support + doctor review | OWNER_DECISION_RECORDED |

---

## Unresolved clinical Q5 — Stone/pathri/bone-spur keyword → D200 (Phase 5R-4D-Q05F)

**Status:** **OWNER_DECISION_RECORDED** · **NOT_FROZEN** (classification wiring / organ-specific binding **IMPLEMENTATION_PENDING**)

| Item | Owner decision | Tag |
|------|----------------|-----|
| Legacy rule (`bone spur`, `kanta`, `stone`, `pathri`, `spur` substring → **D200**) | **REJECTED** | OWNER_DECISION_RECORDED |
| **D200** on current owner scale (D1–D3, D5/D10/D30/D60) | **NOT_RECOGNIZED_IN_CURRENT_OWNER_SCALE** | OWNER_DECISION_RECORDED |
| **D200_AUTO_SELECTION** | **PROHIBITED** | OWNER_DECISION_RECORDED |
| Keyword alone = verified pathology | **PROHIBITED** | OWNER_DECISION_RECORDED |
| Evidence classification | **REQUIRED** — do **not** collapse stone/spur types: `CONFIRMED_RENAL_STONE`, `CONFIRMED_URETERIC_OR_URINARY_STONE`, `CONFIRMED_GALLBLADDER_STONE`, `CONFIRMED_SALIVARY_OR_OTHER_STONE`, `CONFIRMED_BONE_SPUR`, `CONFIRMED_HEEL_SPUR`, `FOREIGN_BODY_OR_KANTA`, `SUSPECTED`, `RULED_OUT_OR_NEGATED`, `HISTORICAL_OR_REMOVED`, `FAMILY_HISTORY`, `UNVERIFIED`, `UNRELATED_REPORT` | OWNER_DECISION_RECORDED |
| Verified imaging / report | May support **only** related target pathology and formula — **must not** auto-select **D200** or any dilution | OWNER_DECISION_RECORDED |
| **Confirmed** stone/spur (any class) | **Must not** auto-select potency; per-formula evaluation (pathology, Rule 3 organ/system, phase, severity, Rule 2 polarities, formula-scoped verified evidence, pediatric Q1–Q2) | OWNER_DECISION_RECORDED |
| Hardcoded mappings | **Prohibited:** `stone → D200`, `pathri → D200`, `bone spur → D200`, `kanta → D200` | OWNER_DECISION_RECORDED |
| Negated / unverified / insufficient evidence | **Must not** select potency; → `potency_status = UNRESOLVED`, `selected_dilution = null`, `doctor_review_required = true` | OWNER_DECISION_RECORDED |
| Negation examples (non-exhaustive) | `no stone`, `stone ruled out`, `suspected stone`, `history of stone`, `removed stone`, `family history`, unrelated scan, `पथरी नहीं है` | OWNER_DECISION_RECORDED |
| Formula isolation | Stone/spur evidence **only** for related target formulas; **global symptom / OCR / report leakage prohibited** | OWNER_DECISION_RECORDED |
| Pediatric Q1–Q2 | **Remain authoritative** | OWNER_DECISION_RECORDED |
| Treatment claim | **No** stone/spur treat or cure claims; decision-support + doctor review | OWNER_DECISION_RECORDED |

**Note:** Legacy `potency_engine.py` L48–49 is separate from L46–47 (Q3/Q4) and from POSITIVE-ladder **D200** (Q7, **NOT_FROZEN**).

---

## Unresolved clinical Q6 — BP / Cardiovascular potency (Phase 5R-4D-Q06F · **corrected Q06C**)

**Status:** **OWNER_DECISION_RECORDED** · **AUTHORITATIVE_OPTION = A (A3 COMBINED_MINIMUM_EVIDENCE)** · **NOT_FROZEN** (wiring **IMPLEMENTATION_PENDING**)

### Owner confirmation — official scale and rejected dilutions

| Item | Decision | Tag |
|------|----------|-----|
| **Official EHAS2 executable potency scale** | **D1, D2, D3, D5, D10, D30, D60** only | OWNER_DECISION_RECORDED |
| **D100 / D200 / D500** | **REJECTED** · **NOT_RECOGNIZED** · **AUTO_SELECTION PROHIBITED** | OWNER_DECISION_RECORDED |
| Part 2 high-potency material | **EDUCATIONAL_REFERENCE_ONLY** — **must not** become executable EHAS2 Rule 4 | OWNER_DECISION_RECORDED |

### Boundaries (Q6 context — Rules 1–3 freeze docs unchanged)

| Boundary | Decision |
|----------|----------|
| **Rule 1** | Temperament = **SUPPORTING_EVIDENCE_ONLY**; **Nervous Temperament alone must not select D30 or any potency** |
| **Rule 4** | Potency/dilution **only** — not medicine selection, electricity, drops, water quantity, frequency, duration |
| **Medicine/electricity examples** | **A1, A3, BE** = **ILLUSTRATIVE_REFERENCE_ONLY** — **no Rule 4 hardcoding** |

### Legacy rejected

| Item | Decision | Tag |
|------|----------|-----|
| Legacy (`bp_sys > 175` AND (`polarity == POSITIVE` OR `system == CARDIAC`) → **D500**) | **REJECTED** | OWNER_DECISION_RECORDED |
| **BP alone selects potency** | **PROHIBITED** | OWNER_DECISION_RECORDED |

### Option A3 — combined minimum evidence (authoritative)

**Required for any BP-influenced potency candidate on a formula:**

| # | Condition |
|---|-----------|
| 1 | `formula_target` ∈ **`CARDIAC`**, **`VASCULAR`**, **`BP_REGULATION`** |
| 2 | BP reading = **`VERIFIED_CURRENT_READING`** or **`REPEATED_CONFIRMED_READING`** |
| 3 | ≥1 **related clinical evidence** on the **same** Cardiac/Vascular/BP formula: formula-related symptom, relevant disease phase, or relevant severity evidence |
| — | **No global leakage** |

**Potency bands (evidence-complete only — candidates, not automatic final selection without full Rule 4 pass):**

| Stage | BP band (verified) + related clinical evidence | Candidate |
|-------|-----------------------------------------------|-----------|
| Stage 1 | Systolic **140–159** OR diastolic **90–99** | **D10 candidate** |
| Stage 2 | Systolic **160–179** OR diastolic **100–109** | **D30 candidate** |

Formula isolation **required** for all bands.

**BP crisis red flag (potency branch):**

| Condition | Output |
|-----------|--------|
| Systolic **≥180** OR diastolic **≥110** | `safety_status = ACUTE_RED_FLAG`, `potency_status = UNRESOLVED`, `selected_dilution = null`, `doctor_review_required = true`, `urgent_escalation_required = true` |
| — | **Do not** auto-select D10, D30, D60, or any other potency in crisis branch |

**Insufficient evidence:** BP band present but related clinical evidence **absent** → `potency_status = UNRESOLVED`, `selected_dilution = null`, `doctor_review_required = true`

**Missing BP:** **Do not** impute **BP=120**. Non-critical formulas may continue normal per-formula Rule 4 on other valid evidence. Serious **BP/Cardiac target** with required BP missing → `doctor_review_required = true`

**Mild band:** BP **120–139** OR **80–89** → **supporting context only**; **must not** directly select **D5**; D5 only via complete per-formula Rule 4 evidence, **not** BP alone

**D1 prohibition (scoped):** **D1 prohibited** only when `formula_target` ∈ CARDIAC/VASCULAR/BP_REGULATION **and** verified **high-BP** evidence exists. **D1 may remain a candidate** for unrelated hypo/chronic formulas per that formula’s own evidence

### Supporting policies (retained from Q06F)

| Item | Decision | Tag |
|------|----------|-----|
| Abnormal BP (non-crisis) | May drive safety/review/repeat statuses — **separate from potency selection** | OWNER_DECISION_RECORDED |
| BP evidence status taxonomy | `VERIFIED_CURRENT_READING`, `SINGLE_UNCONFIRMED_READING`, `REPEATED_CONFIRMED_READING`, `HISTORICAL_READING`, `DEVICE_OR_ENTRY_ERROR_SUSPECTED`, `MISSING`, `INVALID`, `CONTRADICTORY` | OWNER_DECISION_RECORDED |
| Unrelated formulas (gastric, bowel, joint, skin, renal, etc.) | BP **must not** change their potency | OWNER_DECISION_RECORDED |
| Preserve when available | Systolic, diastolic, measurement time, verification status, related symptoms/red flags, formula relevance | OWNER_DECISION_RECORDED |
| Rule 2 alignment | **FORMULA_SCOPED_SUPPORTING_EVIDENCE_ONLY** | OWNER_DECISION_RECORDED |
| Pediatric Q1–Q2 | **Remain authoritative** | OWNER_DECISION_RECORDED |
| Treatment claim | **No** high-BP treat or cure claims | OWNER_DECISION_RECORDED |

**Note:** Legacy L52–54 and POSITIVE-ladder legacy **D100/D200** (Q7, **NOT_FROZEN**) remain **quarantined forensic reference** only.

---

## Unresolved clinical Q7 — POSITIVE ladder (partial: **Q7B-F** recorded)

**Question 7 fully resolved:** **YES** · **Question 7 overall:** **FULLY_RESOLVED** · decision closure **14/14** (**Q07C-CLOSE-D07** through **Q07C-CLOSE-D14** **CLOSED**) · **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED**

### Phase 5R-4D-Q07B-F — D3 minimum evidence (OWNER_APPROVED)

**Status:** **OWNER_DECISION_RECORDED** · **NOT_IMPLEMENTED** · Applies to **D3_CANDIDATE** selection only (not full Q7 freeze)

**D3_CANDIDATE** only when **all** conditions satisfied:

| # | Condition |
|---|-----------|
| 1 | Rule 3 target organ/system = **RESOLVED** |
| 2 | Target pathology = **FORMULA_SPECIFIC** |
| 3 | Rule 2 `disease_polarity` = **POSITIVE** |
| 4 | Rule 2 `required_therapeutic_polarity` = **NEGATIVE** |
| 5 | Current formula `disease_phase` = **ACUTE** |
| 6 | ≥1 related usable clinical evidence per **Q07C-CLOSE-D04** (**SUPPORTED** or **VERIFIED**, **DIRECT**, formula-matched) |
| 7 | **STRICT_FORMULA_ISOLATION** = true |
| 8 | **No global evidence leakage** |

If evidence is **missing**, **unresolved**, or **contradictory** → `potency_status = UNRESOLVED`, `selected_dilution = null`, `doctor_review_required = true`

### Clarification 1 — Duration (Q7B)

| Item | Decision | Tag |
|------|----------|-----|
| Duration determines `disease_polarity` | **NO** | OWNER_DECISION_RECORDED |
| Duration role | **PHASE_SUPPORTING_EVIDENCE_ONLY** (e.g. duration 5 years may support `disease_phase = CHRONIC`) | OWNER_DECISION_RECORDED |
| Polarity authority | **RULE_2_FORMULA_SPECIFIC_EVIDENCE_ONLY** for `disease_polarity` and `required_therapeutic_polarity` | OWNER_DECISION_RECORDED |

### Clarification 2 — D6 (Q7B)

| Item | Decision | Tag |
|------|----------|-----|
| **D6** | **COMPLETELY_EXCLUDED** · **PROHIBITED** | OWNER_DECISION_RECORDED |
| Official executable scale | **D1, D2, D3, D5, D10, D30, D60** (unchanged) | OWNER_DECISION_RECORDED |

### Clarification 3 — Acute flare on chronic disease (Q7B)

| Item | Decision | Tag |
|------|----------|-----|
| Chronic disease with current acute flare | **Do not** force formula to NEGATIVE merely because duration is chronic | OWNER_DECISION_RECORDED |
| Flare formula D3 path | If flare formula satisfies: POSITIVE disease polarity + **ACUTE** current phase + NEGATIVE therapeutic polarity + **D3 minimum verified evidence** + formula isolation → **D3** may be **formula-specific candidate** | OWNER_DECISION_RECORDED |
| Evidence metadata | Chronic baseline and current acute flare **separately represented** | OWNER_DECISION_RECORDED |

### Clarification 4 — Chronic NEGATIVE ladder (Q7B)

| Item | Decision | Tag |
|------|----------|-----|
| Prior text: selection among **D1/D2/D3/D5** for chronic **NEGATIVE** | **SUPERSEDED** by Phase **5R-4D-PB** (see below) | SUPERSEDED |

### EHAS2 contract / UI claims (Q7B-F)

**Prohibited** in EHAS2 contracts and UI:

- root cure  
- guaranteed cure  
- guaranteed recovery  
- 100% clinical accuracy  
- universally safe  

---

## Separation — electricity and dosage (not Rule 4)

| Item | Classification |
|------|----------------|
| Electricity examples / selection | **REFERENCE_ONLY** · **RULE_6_AUDIT_PENDING** — Rule 4 does **not** select electricity |
| Drops, water quantity, frequency, duration | **DOSAGE_ENGINE_AUDIT_PENDING** |
| Rule 4 scope | **Potency/dilution only** |

---

## Dosage separation (owner note — not Rule 4)

| Item | Classification |
|------|----------------|
| Owner-proposed statement: “D30 की 1 बूंद आधा कप पानी में।” | **OWNER_PROPOSED_DOSAGE_RULE** · **DOSAGE_ENGINE_AUDIT_PENDING** |
| Rule 4 scope | Potency/dilution selection and annotation **only** — not drops, water quantity, frequency, or duration |

---

## Potency polarity boundary (Phase 5R-4D-PB)

**Status:** **OWNER_APPROVED_CLINICAL_SOFTWARE_SPECIFICATION** · **NOT_IMPLEMENTED** · **DOCUMENTATION FROZEN** (Question **8** **Q08-CLOSE** **CLOSED** · Question **9** **Q09-CLOSE** **CLOSED** · Question **10** **Q10-CLOSE** **CLOSED** · Question **11** **Q11-CLOSE** **CLOSED** · Question **12** **Q12-CLOSE** **CLOSED** · Question **13** **Q13-CLOSE** **CLOSED** · Question **14** **Q14-CLOSE** **CLOSED** · Question **15** **Q15-CLOSE** **CLOSED** · Question **16** **Q16-CLOSE** **CLOSED** · Question **17** **Q17-CLOSE** **CLOSED** · Question **18** **Q18-CLOSE** **CLOSED**)

### Mutually exclusive candidate groups (Rule 2 `disease_polarity`)

| Rule 2 resolved **disease_polarity** | Allowed potency **candidates** (group only — not auto-selection) |
|--------------------------------------|------------------------------------------------------------------|
| **NEGATIVE** | **D1**, **D2** only |
| **POSITIVE** | **D3**, **D5**, **D10**, **D30**, **D60** only |

Groups are **mutually exclusive**. **D3** and **D5** are **not** candidates when disease polarity is **NEGATIVE**. **D1** and **D2** are **not** candidates when disease polarity is **POSITIVE**.

### Question 7 / Question 8 / Question 9 / Question 10 / Question 11 / Question 12 / Question 13 scope (after PB)

| Topic | Scope |
|-------|--------|
| **Question 7** (POSITIVE disease selector) | **D3**, **D5**, **D10**, **D30**, **D60** + cascade; decision closure **14/14** (**Q07C-CLOSE-D07**–**Q07C-CLOSE-D14** **CLOSED**) · **Q7 overall** **FULLY_RESOLVED** · **Rule 4 documentation** **FROZEN** |
| **Question 8** (NEGATIVE disease selector) | **Q08-CLOSE** (**Q8-A**–**Q8-P**) — **D1 vs D2** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**; prior “NEGATIVE **D1/D2/D3/D5**” wording **fully superseded** |
| **Question 9** (MIXED disease-state) | **Q09-CLOSE** (**Q9-A**–**Q9-Q**) — **CONTROLLED AUTOMATIC SPLIT** + **POLARITY-CONTRADICTION** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **Question 10** (NEUTRAL disease-state) | **Q10-CLOSE** (**Q10-A**–**Q10-Q**) — **RESOLVED NEUTRAL DISEASE-STATE NON-POTENCY CONTRACT** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **Question 11** (UNRESOLVED / SUPPORT_ONLY) | **Q11-CLOSE** (**Q11-A**–**Q11-R**) — **UNRESOLVED AND SUPPORT_ONLY POTENCY SAFETY BOUNDARY** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **Question 12** (disease phase integration) | **Q12-CLOSE** (**Q12-A**–**Q12-W**) — **FORMULA-SPECIFIC DISEASE PHASE INTEGRATION AND ACUTE-FLARE-ON-CHRONIC POTENCY CONTRACT** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · **≠** **Q7 Decision 12** (**Q07C-CLOSE-D12** temperament) |
| **Question 13** (severity integration) | **Q13-CLOSE** (**Q13-A**–**Q13-X**) — **FORMULA-SPECIFIC SEVERITY RESOLUTION AND POTENCY CASCADE INTEGRATION CONTRACT** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · **≠** **Q7 Decision 10** (**Q07C-CLOSE-D10** engine) · **≠** **Q7 Decision 13** (**Q07C-CLOSE-D13** pediatric) · **≠** **D13-G** (dose) |
| **Question 14** (non-pediatric adult age) | **Q14-CLOSE** (**Q14-A**–**Q14-U**) — **VERIFIED NON-PEDIATRIC ADULT AGE INTEGRATION AND NO AGE-BASED POTENCY OVERLAY CONTRACT** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · **≠** **Q7 Decision 14** (**Q07C-CLOSE-D14** Tier 3 mapping) · **≠** **Q7 Decision 13** (**D13** pediatric) · **≠** **D13-G** (dose) |
| **Question 15** (per-formula isolation) | **Q15-CLOSE** (**Q15-A**–**Q15-U**) — **PER-FORMULA POTENCY ISOLATION AND MULTI-SLOT RULE 4 EXECUTION CONTRACT** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · **≠** **Rule 4 Question 16** (formula-specific report wiring) |
| **Question 16** (formula-specific report evidence) | **Q16-CLOSE** (**Q16-A**–**Q16-U**) — **FORMULA-SPECIFIC STRUCTURED REPORT EVIDENCE AND D04/D08 WIRING CONTRACT** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · **≠** **Rule 4 Question 15** (slot orchestration) · implements by reference **Q07C-CLOSE-D04** · **Q07C-CLOSE-D08** |
| **Question 17** (Rule 1 temperament wiring) | **Q17-CLOSE** (**Q17-A**–**Q17-U**) — **RULE 1 TEMPERAMENT SUPPORTING-WEIGHT INTEGRATION CONTRACT** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · **≠** **Q7 Decision 12** (**Q07C-CLOSE-D12** matrix — referenced, not rewritten) · **≠** **Rule 4 Question 12** (phase) |
| **Question 18** (prescription issuance / doctor approval) | **Q18-CLOSE** (**Q18-A**–**Q18-U**) — **PRESCRIPTION ISSUANCE AND FINAL DOCTOR-APPROVAL INTEGRATION CONTRACT** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · **Option A + Option D** + strict partial-prescription finalization · **≠** row **19** (**5R-SDG** — **Q18-S** index only) · **5R-DRG** / **5R-SDG** by reference |

### Rule 2 authority

Candidate group opens **only** after Rule 2 supplies **formula-specific resolved `disease_polarity`**.

**Prohibited** polarity inference from: duration, age, temperament, diagnosis name, global symptoms.

### Strict formula isolation

Each formula opens its candidate group from **its own** Rule 2 polarity. One formula’s polarity **must not** alter another formula’s candidate group.

### Unresolved polarity states (potency group / selector assignment)

| Rule 2 state | Rule 4 draft tag |
|--------------|------------------|
| **MIXED** (patient-level descriptive) | **Q09-CLOSE** **CLOSED** · **NOT_IMPLEMENTED** — see **Phase 5R-4D-Q09-CLOSE** (**Q9-A**–**Q9-Q**) |
| **NEUTRAL** (resolved disease target) | **Q10-CLOSE** **CLOSED** · **NOT_IMPLEMENTED** — see **Phase 5R-4D-Q10-CLOSE** (**Q10-A**–**Q10-Q**) |
| **UNRESOLVED** (slot-level) | **Q11-CLOSE** **CLOSED** · **NOT_IMPLEMENTED** — see **Phase 5R-4D-Q11-CLOSE** (**Q11-A**–**Q11-R**) |
| **SUPPORT_ONLY** (slot-level) | **Q11-CLOSE** **CLOSED** · **NOT_IMPLEMENTED** — see **Phase 5R-4D-Q11-CLOSE** (**Q11-A**–**Q11-R**) |

**Do not** coerce **SUPPORT_ONLY**, **UNRESOLVED**, or **missing** polarity to **POSITIVE** or **NEGATIVE** for candidate-group opening without an approved owner contract. **Do not** coerce uncertainty to **resolved NEUTRAL** (**Q10-F**).

**Cross-reference (**Q08-CLOSE** **Q8-A**):** For **MIXED** (non-split / contradictory slot), **unresolved NEUTRAL-boundary** slots (**Q10-F**), **SUPPORT_ONLY**, **missing**, **contradictory**, or **UNRESOLVED** slot polarity — **D1** and **D2** **must not** be selected; **`potency_status` = UNRESOLVED** (or **Q10** **`POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET`** when **Q10-A** scope met; or **Q11** **`POTENCY_NOT_APPLICABLE_FOR_SUPPORT_ONLY_SLOT`** when **Q11-C** scope met); **no** **D2** default (**Q8-A**–**Q8-P** clinical text **unchanged**).

**Cross-reference (**Q11-CLOSE**):** **`disease_polarity` = UNRESOLVED** → **`potency_status` = UNRESOLVED** · **`selected_dilution` = null** (**Q11-B**). **`disease_polarity` = SUPPORT_ONLY** → **`POTENCY_NOT_APPLICABLE_FOR_SUPPORT_ONLY_SLOT`** · **`selected_dilution` = null** · **no** independent formula/medicine/potency candidate (**Q11-C**) — **not** doctor potency-selection prompts during analysis (**5R-SDG**).

**Cross-reference (**Q10-CLOSE**):** Rule 2 **`disease_polarity` = NEUTRAL** · **`disease_polarity_status` = RESOLVED** · **`required_therapeutic_polarity` = NEUTRAL** → **`POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET`** · **`selected_dilution` = null** (**Q10-B**) — **not** a doctor potency-selection prompt.

**Cross-reference (**Q13-CLOSE**):** Formula-specific **`severity_status`** / band integrates **Q07C-CLOSE-D10** (**D10-A**–**D10-M**, case table **1–10**) · **Q07C-CLOSE-D08** · **CLOSE-D04** · **Q-L** — **severity alone must not** select dilution (**Q13-F**). **≠** **Q07C-CLOSE-D13** (pediatric overlay) · **≠** **D13-G** (administration dose).

**Cross-reference (**Q14-CLOSE**):** Verified age **>12 years** (**P13-E** **ADULT**) — **no adult potency overlay** (**Q14-B**); **age alone must not** select or adjust dilution (**Q14-C**); potency from **Q7–Q13** + **Q06C** only (**Q14-E/F**). **≠** **Q07C-CLOSE-D14** (Tier 3 pathology mapping) · **≠** **D13-C** (pediatric matrix — **P13-E** only) · **≠** **D13-G** (administration dose — **D13-G-C** preserved).

**Cross-reference (**Q15-CLOSE**):** One independent Rule 4 potency pass per oral **`formula_slot_id`** (**Q15-B**); **strict cross-formula leakage block** (**Q15-C**); **Q9-N** partial multi-formula default (**Q15-D**); **no patient-global dilution** (**Q15-F**). **≠** **Rule 4 Question 16** (report object / **`global_text`** wiring).

**Cross-reference (**Q16-CLOSE**):** Report ingestion → **item-level structured findings** bound to **`formula_slot_id`** + **`formula_target_id`**; **`global_text`** / **`sys_text_full`** **prohibited** as potency selectors; **Q07C-CLOSE-D04** + **Q07C-CLOSE-D08** + **Q-L** + **Q15-C** enforced at wiring layer — **does not alter** **Q15-A**–**U** or **Q7–Q14** clinical bodies.

**Cross-reference (**Q17-CLOSE**):** Rule 1 **`primary_temperament`** (current consultation **resolved/confirmed** only) wired as **SUPPORTING_EVIDENCE_ONLY** · **qualitative** **Q8-G** / **D12-B** tie-break after dual-qualified **D1/D2** gates · **D12-B-EXEC** **NO-OP** on **D3↔D5** — **does not alter** **Q07C-CLOSE-D12** · **Q08-CLOSE** **Q8-G** · **Rule 1** freeze text · **Q7–Q16** clinical bodies.

**Cross-reference (**Q18-CLOSE**):** Case-level **`prescription_issue_allowed`** · **`prescription_status`** · partial-Rx strict finalization — **implements by reference** **Phase 5R-DRG** · **Phase 5R-SDG** · **Q15-D/E** · **Q9-Q** · **Rule 3** `prescription_issue_allowed` AND policy · **D13-HS** · **Q06C** — **does not alter** **Q7–Q17** clinical bodies or **5R-DRG** / **5R-SDG** canonical text.

**Cross-reference (**Q12-CLOSE**):** Formula-specific **`resolved_phase`** integrates **Q07C-CLOSE-D02** · **Q07C-CLOSE-D09** (**D09-1**–**D09-10**) · **Q07C-CLOSE-D11** (**D11-A**–**D11-D**, case table **1–16**) — **phase alone must not** select dilution (**Q12-F**). **≠** **Q07C-CLOSE-D12** (temperament — **Q7 Decision 12**).

**Cross-reference (**Q09-CLOSE**):** Patient-wide **MIXED** **must not** select a common potency; separable targets → **controlled automatic split** per slot (**Q9-A**); same-target POS/NEG conflict → **`POLARITY_CONTRADICTORY`** (**Q9-B**).

### Official scale and prohibitions

| Item | Decision |
|------|----------|
| Executable scale | **D1, D2, D3, D5, D10, D30, D60** |
| **D6, D100, D200, D500** | **PROHIBITED** |

No medical correctness, guaranteed safety, or cure claims in this specification — **clinical software boundary only**.

---

## Question 7-C — D5 selector (Phase 5R-4D-Q07C-D5F + **Q07C-CLOSE-D05**)

**Status:** **OWNER_DECISION_RECORDED** · **NOT_IMPLEMENTED** · Sensitivity promotion criteria **CLOSE-D05** recorded; **`confidence_score` usability** per **Q07C-CLOSE-D08** (**CLOSED**)

**Question 7 fully resolved:** **YES** — decision closure **14/14** · **FULLY_RESOLVED**

### Precondition (mandatory)

**D3_MINIMUM_EVIDENCE_RULE = PASSED** (same eight conditions as **Q7B-F**, condition 6 per **Q07C-CLOSE-D04**).

If precondition **not** passed → D5 selector **does not run** (follow Q7B **UNRESOLVED** paths).

### Phase 5R-4D-Q07C-CLOSE-D05 — D5 sensitivity rule (**OWNER DECISION 5 of 14**)

**D5 promotion** only when **D3 minimum evidence** has passed **and** **qualified** allergy/hypersensitivity evidence exists for the **same formula**:

| Criterion | Required |
|-----------|----------|
| Evidence topic | Allergy / hypersensitivity **related to this formula** |
| `verification_status` | **SUPPORTED** (draft) or **VERIFIED** (after doctor approval on approved draft) |
| `formula_relevance` | **DIRECT** |
| Scope | **Formula-specific** evidence item(s) |
| `assertion_status` | **PRESENT** or **POSITIVE** |
| `confidence_score` | **Usable** per **Q07C-CLOSE-D08** tier matrix (**NOT_IMPLEMENTED**) |
| Temperament | **Nervous Temperament alone** → **D5 prohibited** |

**Qualified sensitivity present:**

- `selected_candidate` = **D5**
- `D3_status` = **SUPERSEDED_BY_D5**

**Qualified sensitivity absent** (incl. **MISSING** — Option A):

- `selected_candidate` = **D3**
- Preserve raw sensitivity status; **do not** fabricate **NORMAL**

**Verification lifecycle (**CLOSE-D04** alignment):** draft analysis may use **SUPPORTED** sensitivity items; after doctor **Approve**, items used in approved draft → **VERIFIED**. **Raw evidence history** preserved (append-only).

### Invalid sensitivity evidence (must not promote D5)

Negated / rule-out · family history alone · vague “sensitive” text · low-confidence OCR · ordinary photo · unrelated report or formula · fabricated default · **Nervous Temperament alone**

### Selector logic (summary)

When **D3_MINIMUM_EVIDENCE_RULE = PASSED**:

| Condition | Outcome |
|-----------|---------|
| **Qualified** formula-specific allergy/hypersensitivity per **CLOSE-D05** **and** not driven **only** by Nervous Temperament | `selected_candidate = D5`; **`D3_status = SUPERSEDED_BY_D5`** |
| Else | `selected_candidate = D3` |

**Mutual exclusivity:** **D3** and **D5** **must not** both remain **final** candidates for the same formula decision.

### Missing sensitivity — Owner Option A (unchanged)

| Item | Decision | Tag |
|------|----------|-----|
| Sensitivity data **MISSING** | `sensitivity_status = MISSING` — **do not** rewrite as NORMAL; **do not** fabricate negative allergy history | OWNER_DECISION_RECORDED |
| D3 minimum evidence passed | **D3 candidate remains** | OWNER_DECISION_RECORDED |
| D5 promotion | **Does not occur** when sensitivity missing | OWNER_DECISION_RECORDED |
| Doctor review / issuance | Normal policy remains applicable | OWNER_DECISION_RECORDED |

### Temperament boundary

| Item | Decision | Tag |
|------|----------|-----|
| Rule 1 temperament | **SUPPORTING_EVIDENCE_ONLY** | OWNER_DECISION_RECORDED |
| Nervous Temperament **alone** | **Must not** verify hypersensitivity, **select D5**, or **supersede D3** | OWNER_DECISION_RECORDED |

**Cross-reference (Decision 12 — non-mutating):** **Q07C-CLOSE-D12** applies temperament preference **only** when **two** candidates both pass all clinical gates; **does not** relax **Nervous Temperament alone** prohibitions above; **does not** alter **CLOSE-D05** recorded clinical text. **D3 ↔ D5** temperament rows: **`execution_status = CURRENT_CASCADE_NO_OP`** · **`temperament_preference_applied = FALSE`** · **`implementation_status = NOT_EXECUTABLE_WITH_CURRENT_FROZEN_CASCADE`** — temperament **must not** override **CLOSE-D05** **D5** selection.

### Formula isolation

Sensitivity/allergy evidence **bound** to same patient/formula decision. Unrelated report, photo, symptom, or **another formula** **must not** promote D3 → D5.

### Polarity boundary (5R-4D-PB)

**D5** remains **POSITIVE disease polarity group** candidate **only** — **prohibited** for **NEGATIVE** disease polarity.

---

## Question 7-C — D10 selector (Phase 5R-4D-Q07C-D10F)

**Status:** **OWNER_DECISION_RECORDED** · **NOT_IMPLEMENTED** · **NOT_FROZEN** (**Q07C-D60F** + **Q07C-CLOSE-D07** recorded)

**Question 7 fully resolved:** **YES** — decision closure **14/14** · **FULLY_RESOLVED**

### D10 polarity boundary

| Allowed | **Rule 2 `disease_polarity` = POSITIVE** **and** **`required_therapeutic_polarity` = NEGATIVE** |
| Prohibited | **NEGATIVE**, **NEUTRAL**, **MIXED**, **SUPPORT_ONLY**, **UNRESOLVED** |

### Common D10 requirements (all pathways — all must pass)

| # | Requirement |
|---|-------------|
| 1 | Rule 2 **`disease_polarity` = POSITIVE** |
| 2 | **`required_therapeutic_polarity` = NEGATIVE** |
| 3 | **Severity verified** per **Q07C-CLOSE-D10** (**`severity_status`** **`RESOLVED_NUMERIC`** or **`RESOLVED_BAND_ONLY`** with band **LOW**/**MODERATE** for D10 paths; **HIGH 7–10 → D10 prohibited**) |
| 4 | Rule 3 organ/system = **RESOLVED** |
| 5 | Target pathology = **FORMULA_SPECIFIC** |
| 6 | ≥1 related **verified** clinical evidence |
| 7 | **STRICT_FORMULA_ISOLATION** |
| 8 | **No global leakage** |

**Severity missing / invalid / contradictory:** `D10_status = UNRESOLVED`, `doctor_review_required = true` — **do not** fabricate **severity = 5**.

**Severity 7–10 (HIGH):** **D10 = PROHIBITED** — route to **D30 selector (Q07C-D30F)** when pathway evidence passes; else **UNRESOLVED** + review.

### Pathway A — Cardiac (Q6 A3 Stage 1)

Common requirements **and**:

- `formula_target` ∈ **CARDIAC**, **VASCULAR**, **BP_REGULATION**
- Verified BP band = **STAGE_1** (systolic **140–159** OR diastolic **90–99**)
- Related **formula-specific** clinical evidence **mandatory** — **BP alone insufficient**

(Aligns with recorded **Q06C A3** Stage 1 **D10 candidate** when evidence-complete.)

### Phase 5R-4D-Q07C-CLOSE-D01 — Cardiac Stage-1 precedence (**OPTION A**)

**Status:** **OWNER_DECISION_RECORDED** (Q7 closure **decision 1 of 14**) · **NOT_IMPLEMENTED**

**D10 Cardiac Stage-1 pathway** supersedes generic **ACUTE D3/D5** pathway **only** when **all** conditions pass:

| # | Condition |
|---|-----------|
| 1 | `formula_target` ∈ **CARDIAC**, **VASCULAR**, **BP_REGULATION** |
| 2 | Rule 3 organ/system = **RESOLVED** |
| 3 | Target pathology = **FORMULA_SPECIFIC** |
| 4 | Rule 2 **`disease_polarity` = POSITIVE** |
| 5 | **`required_therapeutic_polarity` = NEGATIVE** |
| 6 | Verified BP band = **STAGE_1**: systolic **140–159** OR diastolic **90–99** |
| 7 | Severity **verified** and **1–6** |
| 8 | ≥1 related **formula-specific verified** clinical evidence |
| 9 | **Strict formula isolation** |
| 10 | **No global leakage** |

When all pass:

- `selected_candidate` = **D10**
- `D3_status` = **SUPERSEDED_BY_CARDIAC_D10**
- `D5_status` = **SUPERSEDED_BY_CARDIAC_D10**

**Applies even when `resolved_phase` = ACUTE.** **BP alone** must **not** select **D10**. **Must not** affect **unrelated** formulas.

**Missing/contradictory evidence:** system completes run with deterministic evidence/status result; **no** follow-up question (**5R-SDG**); **no** fabrication of BP, phase, severity, or polarity.

No absolute safety, efficacy, or danger claims — **software specification only**.

### Phase 5R-4D-Q07C-CLOSE-D02 — D10 chronic-moderate extension (**OPTION A**)

**Status:** **OWNER_DECISION_RECORDED** (Q7 closure **decision 2 of 14**) · **NOT_IMPLEMENTED**

**D10** may be selected when **all common D10 requirements** pass:

| # | Requirement |
|---|-------------|
| 1 | Rule 2 **`disease_polarity` = POSITIVE** |
| 2 | **`required_therapeutic_polarity` = NEGATIVE** |
| 3 | Verified severity **1–6** |
| 4 | Rule 3 organ/system = **RESOLVED** |
| 5 | Target pathology = **FORMULA_SPECIFIC** |
| 6 | Related **verified** clinical evidence exists |
| 7 | **Strict formula isolation** |
| 8 | **No global leakage** |

**And** one pathway passes:

| Path | Condition |
|------|-----------|
| **A** | Related **Cardiac/Vascular/BP Stage-1 A3** rule (**Q07C-CLOSE-D01** — unchanged) |
| **B** | **`resolved_phase` = SUB_ACUTE** |
| **C** | **`resolved_phase` = CHRONIC_MODERATE** |

**Severity 7–10:** **D10 prohibited** — **D30** selector when its full evidence passes (**Q07C-D30F**).

**D10 precedence:** **CLOSE-D01** Cardiac Stage-1 precedence **unchanged**. **D30** supersedes **D10** when **D30** pathways pass on the **same** formula.

#### Fallback day ranges (**FALLBACK_GUIDANCE_ONLY**)

| Range | Fallback phase |
|-------|----------------|
| Day **1–14** | **ACUTE** |
| Day **15–45** | **SUB_ACUTE** |
| Day **46–90** (inclusive) | **CHRONIC_MODERATE** |
| Day **91** onward | **DEEP_CHRONIC** duration guidance |

**Day 90** belongs **only** to **CHRONIC_MODERATE** fallback. **Day 91** begins **DEEP_CHRONIC** duration guidance.

#### Verified phase precedence

Duration ranges are **FALLBACK_GUIDANCE_ONLY**. Resolve phase as:

```text
if verified_formula_specific_phase exists:
  resolved_phase = verified_formula_specific_phase
else:
  resolved_phase = fallback_phase_from_days
```

Verified formula-specific phase evidence **overrides** day count. **Duration must not** determine **disease polarity**.

**Cross-reference (Decision 11 — non-mutating):** For **ACUTE ↔ SUB_ACUTE** scenarios, **Q07C-CLOSE-D11** (**D11-A**–**D11-D**) is the **specific authoritative** phase adjudication contract. The generic **CLOSE-D02** “verified phase overrides days” rule **must be interpreted through** **Decision 11** corroboration (**D11-B**), **`phase_status`** / **`limitation_code`**, and case table **1–16** — **without** altering recorded **Decision 2** (**CLOSE-D02**) clinical text above.

| Example | Outcome |
|---------|---------|
| Day **120** + verified **CHRONIC_MODERATE** | **D10** may remain candidate if all **D10** requirements + Path **C** pass |
| Day **70** + verified **DEEP_CHRONIC** | **D60** may become candidate **only** if complete **D60** triple gate passes (**Q07C-D60F**) |

**D60:** Day **91** alone **must not** select **D60** — full **D60** triple gate remains **mandatory**.

**Missing/contradictory phase:** system records deterministic evidence/status; **no** follow-up question; **no** fabricated phase (**5R-SDG**).

No absolute efficacy, safety, or cure claims — **software specification only**.

### D10 pathways B and C — general POSITIVE (SUB_ACUTE / CHRONIC_MODERATE)

Common requirements (**CLOSE-D02**) **and**:

- **Path B:** **`resolved_phase` = SUB_ACUTE**
- **Path C:** **`resolved_phase` = CHRONIC_MODERATE** (**Q07C-CLOSE-D02**)

**Phase resolution:** per **CLOSE-D02** (verified formula-specific phase **priority**; else fallback from days — **1–14 ACUTE / 15–45 SUB_ACUTE / 46–90 CHRONIC_MODERATE / 91+ DEEP_CHRONIC guidance**). Phase fallback **must not** determine disease polarity.

### D3/D5 separation (Paths B / C)

For resolved **SUB_ACUTE** or **CHRONIC_MODERATE**, general **D10** pathways **bypass** acute **D3/D5** selectors for that resolved phase decision.

**Cardiac Stage-1 (CLOSE-D01):** on a **related** CV/BP formula, Pathway A may supersede **D3/D5** even when phase is **ACUTE** — evaluated in cascade **before** general ACUTE D3/D5 (see below).

**Prohibited:** **D3**, **D5**, and **D10** simultaneously as **final** candidates for the **same** resolved phase decision (unless **D30** supersedes per **Q07C-D30F**).

---

## Question 7-C — Common POSITIVE preconditions & cascade (Phase 5R-4D-Q07C-D30F)

**Status:** **OWNER_APPROVED_CLINICAL_SOFTWARE_SPECIFICATION** · **OWNER_DECISION_RECORDED** · **NOT_IMPLEMENTED**

### Common POSITIVE group preconditions (before D3/D5/D10/D30)

| # | Requirement |
|---|-------------|
| 1 | Rule 2 **`disease_polarity` = POSITIVE** |
| 2 | **`required_therapeutic_polarity` = NEGATIVE** |
| 3 | Rule 3 organ/system = **RESOLVED** |
| 4 | Target pathology = **FORMULA_SPECIFIC** |
| 5 | ≥1 related **verified** clinical evidence |
| 6 | **STRICT_FORMULA_ISOLATION** |
| 7 | **No global leakage** |

### Crisis precedence (overrides all POSITIVE selectors)

If systolic **≥180** OR diastolic **≥110**:

`safety_status = ACUTE_RED_FLAG`, `potency_status = UNRESOLVED`, `selected_dilution = null`, `urgent_escalation_required = true`, `doctor_review_required = true` — **no** automatic potency selection.

### D30 selector (Q07C-D30F)

**Pathway A — Cardiac Stage 2:** Common preconditions **and** `formula_target` ∈ **CARDIAC/VASCULAR/BP_REGULATION** **and** verified BP **Stage 2** (sys **160–179** or dia **100–109**) **and** **Q6 A3** related clinical evidence present → **`D30_CANDIDATE`** (BP alone insufficient).

**Pathway B — High severity:** Common preconditions **and** verified formula-specific severity **7–10**; **`resolved_phase`** may be **ACUTE** or **SUB_ACUTE**, **or** **`Current_Manifestation = ACUTE_EXACERBATION_ON_CHRONIC`** (canonical; legacy **`ACUTE_FLARE`** / **`CHRONIC_FLARE`** = migration aliases only) → **`D30_CANDIDATE`**. Chronic duration **alone** does **not** create **D30**; current verified high-severity manifestation **required**. **Severity alone must not** select **D30**.

**D30 precedence:** When Pathway A or B passes, **D30 supersedes D3, D5, D10** — **only D30** remains selected potency candidate for that formula.

**Sensitivity:** At severity **7–10** or valid Stage-2 BP path, verified sensitivity **does not demote D30 to D5**; preserve raw sensitivity status/evidence. **Nervous Temperament alone** must **not** select **D30**.

**Missing/contradictory D30 evidence:** `potency_status = UNRESOLVED`, `selected_dilution = null`, `doctor_review_required = true` — **do not** fabricate severity, BP, phase, or sensitivity.

### POSITIVE cascade (evaluation order — **Q07C-CLOSE-D01** + **Q07C-CLOSE-D02** + **Q07C-CLOSE-D03**)

| Order | Condition | Outcome |
|-------|-----------|---------|
| 1 | **Patient-wide crisis gate** (sys **≥180** or dia **≥110**) | **UNRESOLVED** + urgent escalation + issuance **BLOCKED** (**5R-SDG**) |
| 2 | **Related** formula **Cardiac Stage-2** + **Q6 A3** evidence (**Q07C-D30F** Path A) | **D30 candidate** (formula-scoped) |
| 3 | **Related** formula **Cardiac Stage-1** + **Q6 A3** evidence (**Q07C-CLOSE-D01**) | **D10 candidate**; **supersedes D3/D5** (including when **`resolved_phase` = ACUTE**) |
| 4 | **General severity/phase selectors** (per formula, if not already resolved) | **4a** Verified severity **7–10** → **D30** Path B · **4b** **SUB_ACUTE** + sev **1–6** → **D10** Path B · **4c** **CHRONIC_MODERATE** + sev **1–6** → **D10** Path C (**CLOSE-D02**) · **4d** **ACUTE** + sev **1–6** → **D5** or **D3** (**Q07C-D5F** + **CLOSE-D05**) |
| 5 | **DEEP_CHRONIC** + sev **1–6** (**Q07C-CLOSE-D03** + **Q07C-D60F**) | Triple gate **pass** → **D60** final candidate · triple gate **fail** (incl. missing special data) → **D10** final candidate (`fallback_policy = OWNER_APPROVED_DEEP_CHRONIC_D10_FALLBACK`) when common evidence complete · else deterministic **UNRESOLVED** |

**D30** (Path A or B when applicable) **supersedes D3, D5, D10** on the **same** formula when its pathway passes. **D60** never supersedes **D30**. **D10** and **D60** **must not** both remain **final** candidates for the same formula decision (**CLOSE-D03**).

No “100% safe”, guaranteed effective, cure, or treatment guarantee claims — **software specification only**.

**D60 selector:** **OWNER_DECISION_RECORDED** (**Q07C-D60F** + **CLOSE-D03** + **CLOSE-D06** + **Q07C-CLOSE-D07**) · **NOT_IMPLEMENTED**

---

## Question 7-C — D60 selector (Phase 5R-4D-Q07C-D60F)

**Status:** **OWNER_APPROVED_CLINICAL_SOFTWARE_SPECIFICATION** · **OWNER_DECISION_RECORDED** · **NOT_IMPLEMENTED**

**Polarity:** Rule 2 **`disease_polarity = POSITIVE`** and **`required_therapeutic_polarity = NEGATIVE`** only (**POSITIVE / NEGATIVE-therapeutic group**).

**D60 never supersedes D30.** **D60 does not apply** when **D30** precedence applies on the **same** formula.

### Patient-wide crisis gate (before every formula)

Evaluate **once per case**, **before** each formula’s potency selector:

If systolic BP **≥180** OR diastolic BP **≥110**:

| Field | Value |
|-------|--------|
| `case_status` | **UNRESOLVED** |
| `urgent_escalation_required` | **true** |
| `automated_prescription_issuance` | **BLOCKED** |

System completes its **safety summary** without asking the doctor any question (**5R-SDG**). Aligns with POSITIVE cascade **order 1** (crisis precedence).

### D60 common requirements (all must pass)

| # | Requirement |
|---|-------------|
| 1 | Rule 2 **`disease_polarity` = POSITIVE** |
| 2 | **`required_therapeutic_polarity` = NEGATIVE** |
| 3 | Rule 3 organ/system = **RESOLVED** |
| 4 | Target pathology = **FORMULA_SPECIFIC** |
| 5 | Related **usable** clinical evidence per **Q07C-CLOSE-D04** (**SUPPORTED** or **VERIFIED**, **DIRECT**, formula-matched) — **Q07C-D07P-MICRO Q-J** |
| 6 | Severity **verified** and **1–6** (inclusive) |
| 7 | **`resolved_phase` = DEEP_CHRONIC** |
| 8 | **`pathology_type`** triple-gate leg: qualifying class per **Q07C-D07P-CLASS-RES** from **`IS_NERVOUS_PATHOLOGY_CLASS`** (**Q07C-D07P-NERVOUS**), **`IS_RECURRENT_PATHOLOGY_CLASS`** (**Q07C-D07P-RECURRENT**), **`IS_FUNCTIONAL_PATHOLOGY_CLASS`** (**Q07C-D07P-FUNCTIONAL**) — **no keyword shortcuts** |
| 9 | **`EXTREME_HYPERSENSITIVITY` = TRUE** per **Q07C-CLOSE-D06** (Option C — combined evidence) |
| 10 | **Strict formula isolation** |
| 11 | **No global leakage** |

### DEEP_CHRONIC phase

| Item | Rule |
|------|------|
| Duration guideline (default) | **Day 91 onward** (**CLOSE-D02**); day **90** = **CHRONIC_MODERATE** fallback only |
| Duration role | **PHASE_SUPPORTING_GUIDANCE_ONLY** |
| Phase authority | **Verified formula-specific clinical evidence** is final for phase (**CLOSE-D02**) |
| Polarity | Duration **must not** determine disease polarity |
| Day 91 alone | **Must not** select **D60** — triple gate still **mandatory** |

### Triple gate (all three required for D60)

```text
DEEP_CHRONIC
AND pathology_class_status = QUALIFIED (Q07C-D07P-MICRO Q-K)
AND primary_pathology_class SET (Q07C-D07P-CLASS-RES)
AND EXTREME_HYPERSENSITIVITY (qualified — Q07C-CLOSE-D06)
```

When **all three** pass → **`D60_CANDIDATE`** / **`selected_candidate` = D60** (final candidate for that formula decision).

When **any** special gate fails → **do not** select **D60**; apply **Q07C-CLOSE-D03** **D10** fallback when common evidence complete (see below). **Do not** fabricate sensitivity; **no** follow-up questions during execution (**5R-SDG**).

### Phase 5R-4D-Q07C-CLOSE-D06 — EXTREME_HYPERSENSITIVITY (**OPTION C — combined evidence**)

**Status:** **OWNER_DECISION_RECORDED** (Q7 closure **decision 6 of 14**) · **NOT_IMPLEMENTED**

**`EXTREME_HYPERSENSITIVITY` = TRUE** only when **either** path qualifies:

#### Path 1 — Doctor structured authority

Doctor-provided **structured** entry explicitly records:

**`SEVERE_RECURRENT_HYPERSENSITIVITY`**

(for the evaluated formula context — **DIRECT**, formula-specific per **CLOSE-D04**).

#### Path 2 — Multi-source corroboration

≥**2** **independent**, **DIRECT**, **formula-specific** evidence sources corroborate extreme hypersensitivity, each with `verification_status` **SUPPORTED** or **VERIFIED** (draft / approved draft per **CLOSE-D04**).

| Rule | Detail |
|------|--------|
| Formula binding | Evidence **must** relate **directly** to the **evaluated formula** |
| Source counting | Duplicate representations of **one** source = **one** source |
| Leakage | **Global** evidence leakage **prohibited** |
| Processing | **Local** only; **paid APIs prohibited** |

#### Invalid for EXTREME_HYPERSENSITIVITY qualification

Nervous Temperament **alone** · family history **alone** · vague/ambiguous text · negated / suspected / rule-out · low-confidence OCR · ordinary/non-clinical photos · unrelated formula/report · fabricated values

#### Lifecycle (**CLOSE-D04** alignment)

| Phase | Rule |
|-------|------|
| Before doctor approval | **SUPPORTED** evidence may support draft **`D60_CANDIDATE`** evaluation |
| After doctor approves draft | Accepted items → **VERIFIED** |
| Audit | **Append-only** history preserved |

#### Selector effect (with **Q07C-D60F**, **CLOSE-D03**, cascade)

| Condition | Outcome |
|-----------|---------|
| D60 **common** gates + triple gate (incl. pathology class) + severity **1–6** + phase rules pass **and** **CLOSE-D06** qualifies | **`D60_CANDIDATE`** |
| **CLOSE-D06** does **not** qualify but **common** evidence **complete** | **CLOSE-D03** deep-chronic **D10** fallback |
| **D60** | **Never** supersedes **D30** |
| Crisis | Patient-wide hold (unchanged) |
| Stage-2 BP | Formula-scoped **D30** (unchanged) |

No cure, safety, or efficacy guarantee claims.

### Phase 5R-4D-Q07C-CLOSE-D03 — Deep-chronic D10 fallback (**OWNER DECISION 3 of 14**)

**Status:** **OWNER_DECISION_RECORDED** · **NOT_IMPLEMENTED**

On a **DEEP_CHRONIC** **POSITIVE** formula, when **D60** triple gate **does not** pass, **`selected_candidate` = D10** may be selected as **final candidate** subject to:

#### Common requirements (all mandatory)

| # | Requirement |
|---|-------------|
| 1 | Rule 2 **`disease_polarity` = POSITIVE** |
| 2 | **`required_therapeutic_polarity` = NEGATIVE** |
| 3 | Rule 3 organ/system = **RESOLVED** |
| 4 | Target pathology = **FORMULA_SPECIFIC** |
| 5 | Related **usable** clinical evidence per **Q07C-CLOSE-D04** (**SUPPORTED** or **VERIFIED**, **DIRECT**, formula-matched) — **Q07C-D07P-MICRO Q-J** |
| 6 | **`resolved_phase` = DEEP_CHRONIC** |
| 7 | Verified severity **1–6** |
| 8 | **Strict formula isolation** |
| 9 | **No global leakage** |
| 10 | **No** patient-wide **crisis** hold and **no** **D30** precedence on this formula |

#### Selector (when common requirements pass)

```text
IF pathology_class_status = QUALIFIED (Q07C-D07P-MICRO Q-K)
   AND primary_pathology_class IS SET (Q07C-D07P-CLASS-RES)
   AND EXTREME_HYPERSENSITIVITY = TRUE (Q07C-CLOSE-D06):
  selected_candidate = D60
ELSE IF common_requirements_complete (CLOSE-D03):
  selected_candidate = D10
  fallback_policy = OWNER_APPROVED_DEEP_CHRONIC_D10_FALLBACK
  (incl. NO_QUALIFYING / MISSING / CONTRADICTORY class-special per Q-K)
ELSE:
  potency_status = UNRESOLVED
```

**Mutual exclusivity:** **D10** and **D60** **must not** both remain **final** candidates.

#### Missing special data (pathology class / sensitivity)

- Set **`pathology_class_status`** per **Q07C-D07P-MICRO Q-K** (`QUALIFIED` · `NO_QUALIFYING_D60_CLASS` · `MISSING_EVIDENCE` · `CONTRADICTORY_EVIDENCE`)
- **Do not** fabricate **NORMAL** sensitivity or pathology class
- **Do not** select **D60**
- When **common** evidence is **complete** → **CLOSE-D03** **D10** fallback with **`evidence_limitations`** / reason codes as applicable (**Q-K**)

#### Missing / contradictory common evidence

System records deterministic status and **evidence_limitations**; **no** follow-up question (**5R-SDG**); **no** evidence fabrication.

#### Precedence (deep-chronic band, sev 1–6)

| Condition | Outcome |
|-----------|---------|
| Crisis | Patient-wide hold |
| Severity **7–10** or related **Stage-2** | **D30** |
| Triple gate **pass** | **D60** |
| Triple gate **fail** | **D10** (fallback) |

No cure, safety, or efficacy guarantee claims — **software specification only**.

### Formula-scoped BP Stage 2 (D30 precedence — unchanged Q07C-D30F)

Stage 2 BP: systolic **160–179** OR diastolic **100–109** — affects **only** a related **CARDIAC / VASCULAR / BP_REGULATION** formula.

| Formula scope | Outcome |
|---------------|---------|
| Related Cardiac Stage-2 formula | **D30** candidate (Q07C-D30F Path A) — **supersedes D60** on **that** formula |
| Unrelated formula with complete D60 evidence | **D60** candidate **not vetoed** by Stage-2 BP on another formula |

**Formula isolation example:** Cardiac formula + Stage-2 BP → **D30** candidate. Unrelated neurological formula + complete D60 evidence → **D60** candidate. Cardiac BP **must not leak** into the neurological formula.

### D60 precedence (evaluation relative to D30)

| Order | Condition | Outcome |
|-------|-----------|---------|
| 1 | **Crisis** (patient-wide) | Hold — **UNRESOLVED** + escalation; issuance **BLOCKED** |
| 2 | Severity **7–10** | **D30**, not **D60** |
| 3 | Related **Cardiac Stage-2** (same formula) | **D30** on that formula only |
| 4 | Severity **1–6** + **DEEP_CHRONIC** common evidence | Triple gate **pass** → **D60** · **fail** → **D10** (**CLOSE-D03**) |

### Pediatric (verified age **0–12**)

When **all** D60 requirements pass:

| Field | Value |
|-------|--------|
| D60 | **Draft candidate** only |
| `enhanced_review_flag` | **PEDIATRIC_D60** |
| `automatic_issuance` | **false** |

No follow-up question; completed draft → **FINAL_DOCTOR_APPROVAL_REQUIRED** (**5R-DRG** / **5R-SDG**).

**Cross-reference (Decision 13 — non-mutating):** **`PEDIATRIC_D60`** **`enhanced_review_flag`** execution on **current frozen cascade** = **`CURRENT_PEDIATRIC_NO_OP`** (**Q07C-CLOSE-D13** **D13-B-EXEC**) — matrix **D60** cells remain **OWNER_APPROVED** spec; **does not** alter **Q07C-D60F** recorded clinical gates above.

### Missing / contradictory evidence (common vs special)

| Case | Outcome |
|------|---------|
| **`pathology_class_status`** not **QUALIFIED** or **CLOSE-D06** not qualified | **No** **D60**; **`primary_pathology_class`** per **Q-K**; **D10** fallback if **common** complete (**CLOSE-D03**, **Q-K**) |
| **Common** evidence missing/contradictory | **`potency_status = UNRESOLVED`**; **`evidence_limitations`**; **no** follow-up; **no** fabrication (**Q-K**, **5R-SDG**) |

### Executable pathology class definitions (**Q07C-CLOSE-D07**)

| Class | Status |
|-------|--------|
| **NERVOUS** | **OWNER_DECISION_RECORDED** — **Q07C-D07P-NERVOUS** (below) |
| **RECURRENT** | **OWNER_DECISION_RECORDED** — **Q07C-D07P-RECURRENT** (below) |
| **FUNCTIONAL** | **OWNER_DECISION_RECORDED** — **Q07C-D07P-FUNCTIONAL** (below) |

### Phase 5R-4D-Q07C-CLOSE-D07 — D60 pathology class resolution contract (**OWNER DECISION 7 of 14**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **D60 PATHOLOGY CLASS RESOLUTION CONTRACT**

**Owner approval:** Decision 7 formal closure approved — recorded as closure **7/14**.

**Included contracts (by reference):**

| Area | Artifacts |
|------|-----------|
| Pathology classes | **Q07C-D07P-NERVOUS**, **Q07C-D07P-RECURRENT**, **Q07C-D07P-FUNCTIONAL** (standard + seasonal recurrence; explanatory structural hard-block) |
| Micro-audit | **Q07C-D07P-MICRO** **Q-A** … **Q-L** |
| Resolution | **Q07C-D07P-CLASS-RES** — Tier **1+2** collection; **NERVOUS > RECURRENT > FUNCTIONAL**; **`NO_QUALIFYING_D60_CLASS`** |
| Output | Decoupled **`pathology_class_status`** + **`primary_pathology_class`** (**Q-K**) |
| Evidence | Lifecycle (**Q-J/E**), deduplication (**Q-L**), **CLOSE-D04** alignment |
| Potency interaction | **D60** triple-gate boundaries; **CLOSE-D03** **D10** fallback; **no** class alone → **D60** |

**Tier 3 Rule 3 mapping:** **`TIER3_PATHOLOGY_MAPPING_DATA_ASSET = SEPARATE_DATA_FREEZE_PENDING`** · **`execution_status = NOT_EXECUTABLE`** · **`tier3_mapping_applied = FALSE`** · **`current_potency_delta = NONE`** — execution boundary **Q07C-CLOSE-D14** (**D14-A**–**D14-N**) **CLOSED** · **NOT_IMPLEMENTED** (**D14-L**). **Legacy alias:** **`SEPARATE_FREEZE_PENDING`** = **`LEGACY_ALIAS_OF_SEPARATE_DATA_FREEZE_PENDING`** (historical **Q-I** / cross-refs only — canonical name above).

- Does **not** prevent **Q07C-CLOSE-D07** closure
- While disabled: **must not** fabricate a pathology class from mapping alone (**Q-I**)

**Decisions 1–6:** **Unchanged** (this phase records **Decision 7** only).

### Phase 5R-4D-Q07C-CLOSE-D08 — SOURCE-TYPE CONFIDENCE THRESHOLD ENGINE (**OWNER DECISION 8 of 14**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **SOURCE-TYPE CONFIDENCE THRESHOLD ENGINE**

**Owner approval:** Decision **8** formal closure approved — recorded as closure **8/14** (sub-decisions **D08-A** … **D08-K** + **Option C** **`UNCALIBRATED_MODEL_RUNTIME_GUARD`** + hardening lines).

**Phase adjudication (Decision 9):** **Q07C-CLOSE-D09** — **CLOSED** (see below).

**Severity resolution (Decision 10):** **Q07C-CLOSE-D10** — **CLOSED** (see below).

**ACUTE vs SUB_ACUTE phase (Decision 11):** **Q07C-CLOSE-D11** — **CLOSED** (see below).

**Decisions 1–7:** **Unchanged** (this phase records **Decision 8** formal closure only).

#### **D08-A — Core separation (`confidence_score` vs `verification_status`)**

| Field | Meaning |
|-------|---------|
| **`confidence_score`** | Normalized **data-extraction / provenance quality** only · range **`0.00`–`1.00`** |
| **`verification_status`** | **`SUPPORTED`** during draft · **`VERIFIED`** only after doctor **Approve** on approved draft |

**Confidence must never automatically mean clinical truth.**

#### **D08-B — Tier 1 — `DOCTOR_STRUCTURED_ENTRY`**

| Rule | Detail |
|------|--------|
| **`confidence_score`** | **`1.00`** (frozen policy assignment — not a parser guess) |
| Draft | **`verification_status = SUPPORTED`** |
| After approval | Items used in approved draft → **`VERIFIED`** |
| Scope | Structured symptoms · examination findings · **manually entered vitals** |
| Clinical validity | **All** clinical validity gates still required (**CLOSE-D04**, negation, formula binding, etc.) |

#### **D08-C — Tier 2 — `DIGITAL_STRUCTURED_REPORT`**

**Sources:** HL7 / FHIR / JSON / LIMS / API · **valid native-text PDF** (machine-readable text layer).

| Gate | Threshold (inclusive **`>=`**) |
|------|--------------------------------|
| Document schema / integrity | **`>= 0.85`** |
| Individual item | **`confidence_score >= 0.90`** |

**Demotion:** Scanned-only · image-only · corrupt-text · unreliable-text PDFs → **Tier 3** (**D08-D**).

**PDF tier assignment (hardening — locked):**

- File extension **alone** must **never** determine **Tier 2**.
- **Tier 2** native PDF requires a **valid embedded digital text layer** **and** the recorded integrity gates (**document schema / integrity `>= 0.85`**, item **`>= 0.90`**).
- Scanned · image-only · corrupt-text · or unreliable-text PDF **must** use **Tier 3** OCR classification (**D08-D**).

#### **D08-D — Tier 3 — `OCR_EXTRACTED_DOCUMENT_IMAGE`**

**Sources:** Scanned report · mobile document photo · image-only PDF.

| Gate | Threshold (inclusive **`>=`**) |
|------|--------------------------------|
| Document readability | **`>= 0.80`** |
| Individual item | **`confidence_score >= 0.85`** |

#### **D08-E — Tier 4A — `DOCTOR_FREE_TEXT_NLP_EXTRACTION`**

| Rule | Detail |
|------|--------|
| Processing | Hindi / English / Hinglish **local** parsing only |
| Entity threshold | Extracted entity **`confidence_score >= 0.80`** |
| Output role | **`SUPPORTED_CLINICAL_EVIDENCE_CANDIDATE`** |
| Usability | Becomes **usable direct evidence** only after **assertion**, **negation**, **formula relevance**, **organ/pathology binding**, and **other gates** pass (**CLOSE-D04**) |

#### **D08-F — Tier 4B — `DATASET_TAXONOMY_ALIGNMENT`**

| Rule | Detail |
|------|--------|
| Source | **116,284** disease dataset / ontology alignment |
| Threshold | Normalized alignment **`>= 0.80`** |
| Output role | **`USABLE_SUPPORTING_ALIGNMENT_ONLY`** |
| Prohibition | **Cannot** independently establish disease · class · polarity · or potency |

#### **D08-G — Document + item evaluation**

1. **Document-level gate runs first.**
2. **Failed document** → **all** extracted items from that document **`IGNORED_NOT_USABLE`**.
3. **Passed document** → **every item** evaluated separately.
4. Item at **exact** threshold **passes** (**`>=`** inclusive).
5. **Below-threshold item** → **`IGNORED_NOT_USABLE`**.
6. **Preserve** raw item + reason in **append-only** audit history.

#### **D08-H — Vitals and examination**

| Source path | Tier |
|-------------|------|
| Manual structured entry | **Tier 1** (**D08-B**) |
| Device / LIMS / API | **Tier 2** (**D08-C**) |
| Free-text extraction | **Tier 4A** (**D08-E**) |

**Confidence does not establish physiological validity.**

Additional gates (mandatory where applicable): numeric format · units · plausible range · timestamp · current-case context · duplicates · contradictions.

| Outcome | Rule |
|---------|------|
| Invalid / impossible value | **`INVALID_NOT_USABLE`** |
| Missing BP default | **PROHIBITED** (no silent **BP=120** or similar) |
| Contradictory readings | **Must not** silently average — adjudicate per existing BP / vital policies |

**Separate vital adjudication** where applicable remains **pending** where not already frozen elsewhere.

#### **D08-I — Clinical photographs**

| Case | Status |
|------|--------|
| Raw clinical photo **alone** | **`NOT_USABLE_ALONE`** |
| Automated vision (unspecified local model) | **`NOT_EXECUTABLE`** until separate local-model audit/freeze |
| Doctor **site-matched structured observation** (from photo review) | **Tier 1** when entered as structured finding |
| Ordinary face / portrait photo | **Invalid** — **PROHIBITED** as selector evidence |
| Cross-formula leakage | **PROHIBITED** |
| Paid vision APIs | **PROHIBITED** |

**Photo storage (session-only raw):**

| Step | Rule |
|------|------|
| Raw photo | **Temporary during session only** |
| After structured entry captured | **Purge original permanently** |
| Retain | Structured finding · **SHA-256** hash · audit metadata |
| Permanent raw-image storage | **PROHIBITED** |

#### **D08-J — Unknown / missing confidence guard**

**Except frozen Tier 1** (**D08-B**):

When **any** of: unknown **`source_type`** · unsupported format · **missing** score · score outside **`0.00`–`1.00`** · **unnormalized** score:

→ **`IGNORED_NOT_USABLE`**  
→ preserve raw item + **reason code**  
→ continue with **other valid** evidence  
→ **no** fabricated tier/score  

#### **D08-K — Model calibration and uniform application**

**Calibration:**

- Every **local** OCR/NLP model version **must** be calibrated.
- Raw score maps through a **versioned calibration curve** → **`normalized_score`** (stored as **`confidence_score`**).
- **Only** calibrated, versioned local model scores may be used for threshold comparison.
- **Audit metadata (append-only):** `model_name` · `model_version` · `calibration_version` · `raw_score` · `normalized_score` · `threshold_version` · `decision_timestamp`
- **Local / self-hosted only** · **paid APIs prohibited**

**`UNCALIBRATED_MODEL_RUNTIME_GUARD` (Option C — locked runtime failsafe):**

1. **PRE-EXECUTION** — If model calibration status is **not** **`CALIBRATED_AND_VERIFIED`**:
   - `model.execution_state = NOT_EXECUTABLE`
   - Log reason: **`UNCALIBRATED_MODEL_BLOCKED_PRE_EXECUTION`**
   - **Halt** model inference
   - **Do not** generate usable clinical evidence

2. **POST-EXECUTION DEFENSIVE FAILSAFE** — If any output is produced despite the pre-execution block:
   - `item.status = IGNORED_NOT_USABLE`
   - Log reason: **`UNCALIBRATED_MODEL_VERSION_FAILSAFE_BLOCK`**
   - **Preserve** audit provenance
   - **Do not** allow the item into any selector or evidence count

**Deduplication (hardening — locked):**

- Decision **8** **must explicitly inherit and enforce** Decision **7** **Q-L Evidence Deduplication Contract** (**Q07C-D07P-MICRO Q-L**).
- Duplicate evidence **must not** inflate source count · **confidence** · corroboration · or selector eligibility.

**Locked threshold matrix (owner-frozen — do not alter without new closure):**

| Tier | Rule |
|------|------|
| **1** | **`confidence_score = 1.00`**; draft **`verification_status = SUPPORTED`** (approval → **VERIFIED** per **CLOSE-D04**) |
| **2** | Document **`>= 0.85`**; item **`>= 0.90`** |
| **3** | Document **`>= 0.80`**; item **`>= 0.85`** |
| **4A** | Entity **`>= 0.80`** |
| **4B** | Alignment **`>= 0.80`**; **`USABLE_SUPPORTING_ALIGNMENT_ONLY`** |

- Exact threshold boundary is **inclusive** (**`>=`**).
- **Uniform matrix** across **all** Rule **4** selectors and gates — **no** selector-specific confidence thresholds.
- **`confidence_score`** remains separate from **`verification_status`** and **clinical validity**.
- **No** silent defaults · **no** averaging · **no** fabricated scores.

**Uniform application (no selector-specific confidence thresholds):**

Same threshold matrix applies to: **D3**, **D5**, **D10**, **D30**, **D60** · **EXTREME_HYPERSENSITIVITY** (**CLOSE-D06**) · **NERVOUS** / **RECURRENT** / **FUNCTIONAL** classes · structural hard-block · **BP/vitals** · **phase** · **severity** evidence (**Q07C-CLOSE-D10** **D10-C**–**D10-G**).

| Separation | Rule |
|------------|------|
| Confidence | Determines **evidence usability only** |
| Potency | **Clinical potency cascade** determines potency (**CLOSE-D01**–**D07**, selectors) |

If threshold filtering removes **mandatory** evidence → apply already-approved **UNRESOLVED** / **fallback** matrix (**CLOSE-D03**, **Q-K**, **5R-SDG**). **Do not** fabricate evidence · **do not** ask follow-up questions.

**Cross-reference:** **Q07C-D07P-MICRO Q-F** below-threshold OCR/items per **Q07C-CLOSE-D08** → **`IGNORED_NOT_USABLE`**.

**Formal closure:** **Q07C-CLOSE-D08** · **8/14** · **CLOSED** · (**at Decision 8 closure:** **6** decisions remained **9–14**).

### Phase 5R-4D-Q07C-CLOSE-D09 — DEEP_CHRONIC VS CHRONIC_MODERATE PHASE ADJUDICATION (**OWNER DECISION 9 of 14**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **DEEP_CHRONIC VS CHRONIC_MODERATE PHASE ADJUDICATION**

**Owner approval:** Decision **9** formal closure approved — recorded as closure **9/14** (includes **D09-1**–**D09-10**, **Option C** corroboration, **`ACUTE_EXACERBATION_ON_CHRONIC`** canonical enum).

**Formally included (locked contract summary):**

- Formula-specific **`resolved_phase`** scope (**D09-1**)
- Valid duration bands; invalid duration → **`Fallback_Phase = null`**; **no** silent phase defaults (**D09-2**)
- Valid phase evidence sources + **Q07C-CLOSE-D08** + **CLOSE-D04** + **Q-L** (**D09-3**)
- **Option C** cross-boundary corroboration (**D09-4**)
- One-source-one-count; confidence eligibility-only (**D09-5**)
- Missing/contradictory phase behavior + limitation text (**D09-6**)
- Failed single cross-boundary override (**D09-7**)
- **`Underlying_Resolved_Phase`** / **`Current_Manifestation`** — canonical **`ACUTE_EXACERBATION_ON_CHRONIC`**; migration aliases **`ACUTE_FLARE`** / **`CHRONIC_FLARE`** only; **not** ICD-10/SNOMED without separate terminology audit (**D09-8**)
- **D30:** **`ACUTE_EXACERBATION_ON_CHRONIC`** + severity **7–10** + **all** D30 gates — **severity alone must not** select **D30**; preserve underlying phase
- Single-pass follow-up recalculation + immutable audit versions (**D09-9**)
- **D10** / **D30** / **D60** cascade boundaries (**D09-10**)

**Implements / extends (by reference, does not alter recorded clinical text of):** **CLOSE-D02** day bands · **Q07C-D60F** · **CLOSE-D03** · **Q07C-D30F** · **Q07C-D07P-MICRO Q-L** · **Q07C-CLOSE-D08** · **CLOSE-D04** · **5R-SDG**.

**Decisions 1–8:** **Unchanged** (this phase records **Decision 9** formal closure only).

#### **D09-1 — Formula-specific phase**

| Rule | Detail |
|------|--------|
| Scope | **`resolved_phase`** is **formula-specific** — **not** patient-global |
| Isolation | Different formulas **may** have different **`resolved_phase`** values · **strict formula isolation** mandatory |
| Polarity | **Duration never** determines **disease polarity** · **Rule 2** remains the **only** formula-specific polarity authority |
| Potency | **Phase alone never** selects potency — cascade + common gates + severity required |

#### **D09-2 — Valid day-band fallback**

Only a **valid positive integer** duration (days) may use **CLOSE-D02** fallback bands:

| Days (inclusive) | **`Fallback_Phase`** |
|------------------|----------------------|
| **1–14** | **ACUTE** |
| **15–45** | **SUB_ACUTE** |
| **46–90** | **CHRONIC_MODERATE** |
| **91** onward | **DEEP_CHRONIC** (duration **guidance** only — **not** D60 by days alone) |

**Invalid duration** (missing · zero · negative · corrupt · non-integer): **`Fallback_Phase = null`**.

**Prohibited:** silent default to **ACUTE** or any other phase.

#### **D09-3 — Valid phase evidence**

Evidence **must** pass **Q07C-CLOSE-D08** thresholds · **CLOSE-D04** gates · **formula relevance** · **Q-L** deduplication.

**Allowed sources (usable for phase assertions when gates pass):**

- Tier **1** doctor structured phase / timeline
- Tier **1** direct examination phase context
- Tier **2** digital structured report timeline
- Tier **3** qualified OCR report timeline
- Tier **4A** qualified doctor free-text phase extraction
- **Active** prior **formula-scoped** consultation timeline

**Excluded:**

- Tier **4B** dataset alignment **alone**
- Age · temperament · BP · bare disease name
- Vague “old/chronic” text **without** timeline/context
- **Fully resolved** historical timeline **alone**
- Duplicate extraction copies (**Q-L**)
- Cross-formula evidence leakage
- Low-confidence / **`IGNORED_NOT_USABLE`** items (**Q07C-CLOSE-D08**)

**Priority:** **Current active** evidence **over** fully resolved history.

#### **D09-4 — Option C cross-boundary corroboration**

When **valid duration** and **usable phase evidence** are **both** present:

**A — `Fallback_Phase = CHRONIC_MODERATE` (46–90 band) → override to `DEEP_CHRONIC`:**

- ≥ **2** unique independent usable **DEEP_CHRONIC** sources
- **Deep** count **must be greater than** opposing **CHRONIC_MODERATE** count

**B — `Fallback_Phase = DEEP_CHRONIC` guidance (91+ band) → override to `CHRONIC_MODERATE`:**

- Tier **1** doctor structured **CHRONIC_MODERATE** entry **OR** ≥ **2** unique independent usable **CHRONIC_MODERATE** sources
- **CHRONIC_MODERATE** count **must be greater than** opposing **DEEP_CHRONIC** count

**Duration** is **fallback guidance only** — it **does not** count as an independent clinical evidence **vote**.

#### **D09-5 — Evidence counting**

| Rule | Detail |
|------|--------|
| Confidence | Usability only (**Q07C-CLOSE-D08**) — **must not** weight votes or break ties |
| Count | Each **unique independent usable** source = **one** count |
| Dedupe | **Q-L** applies · same source OCR + structured extraction = **one** count |
| Tie | Exact opposing valid counts with **active** evidence → **`PHASE_CONTRADICTORY`** · **`potency_status = UNRESOLVED`** |

#### **D09-6 — Resolution cases**

| Case | Algorithm |
|------|-----------|
| **1 — Duration + evidence** | Apply **D09-4** cross-boundary corroboration when bands conflict; else derive **`resolved_phase`** from uncontradicted usable evidence and/or in-band fallback per **D09-2** |
| **2 — Valid duration only** | **`resolved_phase`** from day-band fallback (**D09-2**) |
| **3 — Usable phase evidence only** | One uncontradicted phase → **`resolved_phase`** from evidence; internally contradictory → **`PHASE_CONTRADICTORY`** · **`potency_status = UNRESOLVED`** |
| **4 — Neither** | **`resolved_phase = null`** · **`potency_status = UNRESOLVED`** · reason **`PHASE_MISSING_DURATION_AND_EVIDENCE_ABSENT`** |

**Limitation text (when Case 4):**

```text
Phase unresolved: valid duration and usable formula-specific phase evidence were not available.
```

**5R-SDG:** **Do not** ask the doctor a follow-up question during analysis.

#### **D09-7 — Failure of cross-boundary override**

- A **single** unsupported cross-boundary assertion **does not** override a **valid** day band
- If it **does not** create a true **active-evidence contradiction**, the **valid day-band fallback** remains
- **Irreconcilable** valid **current** evidence → **`PHASE_CONTRADICTORY`** · **no** fabricated phase

#### **D09-8 — Acute-flare separation**

Store **separately** (per formula):

| Field | Values |
|-------|--------|
| **`Underlying_Resolved_Phase`** | **ACUTE** · **SUB_ACUTE** · **CHRONIC_MODERATE** · **DEEP_CHRONIC** |
| **`Current_Manifestation`** | **`ACUTE_EXACERBATION_ON_CHRONIC`** · **`STABLE_BASELINE`** |

**EHAS2 internal enum (canonical — not ICD-10 / SNOMED without separate terminology audit):**

| Rule | Detail |
|------|--------|
| Canonical key | **`ACUTE_EXACERBATION_ON_CHRONIC`** · **`STABLE_BASELINE`** only on **new** persisted structured records and engine **outputs** |
| Migration aliases (input normalization **only**) | **`ACUTE_FLARE`** → **`ACUTE_EXACERBATION_ON_CHRONIC`** · **`CHRONIC_FLARE`** → **`ACUTE_EXACERBATION_ON_CHRONIC`** |
| Legacy audit | Preserve original alias value in migration / audit metadata |
| Clinical lock | Alias mapping **must not** change clinical meaning or potency rules |
| Runtime | **No** duplicate persisted enum — aliases **not** written on new records |

| Rule | Detail |
|------|--------|
| Flare | **Acute exacerbation on chronic** does **not** erase **`Underlying_Resolved_Phase`** |
| Scope | **`Current_Manifestation`** and **severity** remain **formula-specific** |
| **D30** | **If** **`Current_Manifestation = ACUTE_EXACERBATION_ON_CHRONIC`** **and** **`Current_Severity`** is **7–10** (inclusive) **and** **all existing D30** common/evidence gates pass (**Q07C-D30F**) **then** **`D30_CANDIDATE`** · **preserve** **`Underlying_Resolved_Phase`** · **severity alone must not** select **D30** |
| **D60** | **Never** supersedes **D30** |

**Cross-reference (**Q07C-D30F** Path B):** legacy draft text **`CHRONIC_FLARE`** is a **migration alias only** for **`ACUTE_EXACERBATION_ON_CHRONIC`**; **`resolved_phase`** **ACUTE** / **SUB_ACUTE** paths unchanged.

#### **D09-9 — Post-flare recalculation**

**Execution model:** **`SINGLE_PASS_DOCTOR_SUBMISSION_ONLY`**

| Prohibition | Detail |
|-------------|--------|
| Background monitoring | **None** — **no** autonomous background monitoring |
| Efficacy assumption | **No** automatic assumption of treatment efficacy |
| Silent alteration | **No** silent patient-state alteration |
| New run | A **new doctor follow-up submission** starts a **new** analysis run |
| Recalc | If new submission provides severity **&lt; 7** or **`STABLE_BASELINE`**, recalculate candidate potency using **current** evidence and **preserved** underlying phase |
| Audit | Preserve previous prescription · evidence · flare-state **versions** in **immutable** audit history |

#### **D09-10 — Cascade boundaries (unchanged substance — binding references)**

| Condition | Cascade |
|-----------|---------|
| **`CHRONIC_MODERATE`** + severity **1–6** + common evidence | **D10** Path **C** (**CLOSE-D02**) |
| **`DEEP_CHRONIC`** + severity **1–6** | **D60** **only** if **every** D60 triple/common gate passes (**Q07C-D60F**, **CLOSE-D06**, **Q07C-CLOSE-D07**) |
| **`DEEP_CHRONIC`** + D60 special gate **failure** + common evidence **complete** | Approved **D10** fallback (**CLOSE-D03**) |
| Severity **7–10** / **`Current_Manifestation = ACUTE_EXACERBATION_ON_CHRONIC`** | **D30** precedence when **complete** gates pass (**Q07C-D30F**) |
| Day **91** alone | **Must not** select **D60** |
| Other | Pediatric · crisis · formula-isolation rules **unchanged** (**Q1–Q2**, cascade **order 1**, **5R-SDG**) |

**Formal closure:** **Q07C-CLOSE-D09** · **9/14** · **CLOSED** · (**at Decision 9 closure:** **5** decisions remained **10–14**).

**Enum harmonization:** **`ACUTE_EXACERBATION_ON_CHRONIC`** canonical · **`ACUTE_FLARE`** / **`CHRONIC_FLARE`** migration aliases only · conflict **RESOLVED** (**D09-8**).

### Phase 5R-4D-Q07C-CLOSE-D10 — FORMULA-SPECIFIC SEVERITY RESOLUTION ENGINE (**OWNER DECISION 10 of 14**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **FORMULA-SPECIFIC SEVERITY RESOLUTION ENGINE**

**Owner approval:** Decision **10** formal closure approved — recorded as closure **10/14** (includes **D10-A**–**D10-M**, Option A no-doctor corroboration, **`reason_code`** schema, **D10-M** case table; pending lexicon/lab assets **SEPARATE_FREEZE_PENDING** / **NOT_EXECUTABLE** — do not block closure).

**Formally included (locked contract summary):**

- Integer severity scale **1–10** with bands **LOW** / **MODERATE** / **HIGH**; prohibited defaults and invalid numerics (**D10-A**, **D10-B**)
- No-doctor corroboration **Option A**: ≥ **2** usable sources **must share one band**; cross-band → **`SEVERITY_CONTRADICTORY`** — no majority · max · precedence (**D10-C**)
- Missing vs invalid: **`severity_status`** vs **`reason_code`** + evidence **`item_status`** (**D10-B**)
- Invalid-item pool **Cases A/B/C** + full resolution case table (**D10-M**)
- Same-band numeric disagreement → band resolves · **`resolved_severity_score = null`** · preserve raw values (**D10-E**)
- Free-text severity band extraction gated on **`SEVERITY_MULTILINGUAL_LEXICON`** freeze (**D10-F**, **D10-L**)
- Lab/vitals supporting only; no global severity; BP scope and crisis gate unchanged (**D10-G**)
- **`underlying_baseline_severity`** / **`current_manifestation_severity`** separation aligned with **D09-8** (**D10-H**)
- **D30** boundary: severity **7–10** alone **must not** select **D30**; crisis/emergency gate higher priority (**D10-I**)
- Upstream frozen formula target binding; co-primary band rules (**D10-J**)
- Output schema and failure → **UNRESOLVED**; **`reason_code`** taxonomy; resolution case table **D10-M**; **5R-SDG** no follow-up; preserve raw + audit (**D10-K**, **D10-M**)

**Implements / extends (by reference, does not alter recorded clinical text of):** **Q07C-CLOSE-D08** · **CLOSE-D04** · **Q07C-CLOSE-D09** (**D09-8**) · **Q07C-D10F** · **Q07C-D30F** · **Q07C-D60F** · **Q06C** (BP/crisis) · **Q07C-D07P-MICRO Q-L** · **5R-SDG**.

**Decisions 1–9:** **Unchanged** (this phase records **Decision 10** owner specification only).

**Reserved Q7 closure roadmap:** **12** = **TEMPERAMENT CONTROLLED QUALITATIVE PREFERENCE MATRIX** (**Q07C-CLOSE-D12** — **CLOSED**) · **13** = **PEDIATRIC POTENCY BOUNDARY AND SAFETY CONTRACT** (**Q07C-CLOSE-D13** — **CLOSED**) · **14** = **TIER 3 RULE 3 PATHOLOGY MAPPING FREEZE AND EXECUTION BOUNDARY** (**Q07C-CLOSE-D14** — **CLOSED**)

#### **D10-A — Severity scale**

| Rule | Detail |
|------|--------|
| Scale | **Integer 1–10** only |
| **LOW** | **1–3** (inclusive) |
| **MODERATE** | **4–6** (inclusive) |
| **HIGH** | **7–10** (inclusive) |
| **Prohibited** | Decimal · zero · negative · **>10** · silent default **5** · any fabricated numeric |

#### **D10-B — Missing vs invalid vs free text**

**Formula aggregate — missing (Case C):**

| Field | Value |
|-------|--------|
| **`severity_status`** | **`MISSING_EVIDENCE`** |
| **`reason_code`** | **`SEVERITY_VALUE_MISSING`** |
| **`resolved_severity_score`** | **`null`** |
| **`resolved_severity_band`** | **`null`** |
| **`potency_status`** | **`UNRESOLVED`** |

**Rule:** **`SEVERITY_VALUE_MISSING`** is a **diagnostic `reason_code` only** — **never** a **`severity_status`**.

**Evidence-item — invalid numeric:**

| Field | Value |
|-------|--------|
| **`item_status`** | **`INVALID_NOT_USABLE`** |
| **`reason_code`** | **`INVALID_SEVERITY_NUMERIC_VALUE`** |

Invalid items (decimal · zero · negative · **>10** · non-integer · corrupt) **must not** enter band/score resolution.

**Free-text severity mentions:** Route to Tier **4A** NLP pipeline — **not** the structured numeric validator (**D10-F**, **D10-L**).

**Formula aggregate — invalid pool (**Cases A / B**):**

| Case | Condition | Aggregate outcome |
|------|-----------|-------------------|
| **A** | ≥ **1** valid **usable** severity source exists | Exclude **`INVALID_NOT_USABLE`** items from resolution; continue with valid evidence only; preserve invalid items in audit **`evidence_limitations`** |
| **B** | **No** valid/usable severity source; ≥ **1** invalid severity item submitted | **`severity_status = INVALID_EVIDENCE`** · score/band **`null`** · **`potency_status = UNRESOLVED`** |

Invalid individual items **must not** destroy or discard other valid usable severity sources (**Case A**).

#### **D10-C — Source rule**

| Rule | Detail |
|------|--------|
| Doctor structured | Valid **formula-specific** doctor structured severity **may** resolve **`resolved_severity_band`** (and **`resolved_severity_score`** when a single consistent integer applies per **D10-E**) |
| Gates | **Q07C-CLOSE-D08** confidence thresholds · **CLOSE-D04** · **Q-L** deduplication |
| Isolation | **Strict formula isolation** — no patient-global severity leakage |

**When doctor structured severity is absent — corroboration Option A:**

| Rule | Detail |
|------|--------|
| Minimum sources | ≥ **2** **unique** **independent** **usable** severity sources (**Q-L** dedupe) |
| Unanimous band | **All** qualifying usable sources **must** support the **same** severity band (**LOW** / **MODERATE** / **HIGH**) |
| Cross-band | If usable sources span **different** bands → **`severity_status = SEVERITY_CONTRADICTORY`** · **`resolved_severity_score = null`** · **`resolved_severity_band = null`** · **`potency_status = UNRESOLVED`** |
| Prohibited | Majority voting · maximum severity selection · source-precedence guessing |
| Audit | Preserve **all** original values · bands · and source records |

**When only one non-doctor usable source exists (doctor absent):** → **`INSUFFICIENT_CORROBORATION`** (see **D10-M**).

#### **D10-D — Contradiction (doctor-led and cross-band)**

**A — Doctor structured vs opposing corroboration:**

When **doctor structured band** conflicts with **≥2** **independent** **usable** sources asserting an **opposing** band:

| Result | Detail |
|--------|--------|
| **`severity_status`** | **`SEVERITY_CONTRADICTORY`** |
| **`resolved_severity_score`** | **`null`** |
| **`resolved_severity_band`** | **`null`** |
| **`potency_status`** | **`UNRESOLVED`** |
| Override | **Prohibited** — no silent doctor or report override |

**B — No doctor — cross-band usable sources:** per **D10-C Option A** (same aggregate outcome as **A**).

#### **D10-E — Same-band scores**

Example: usable sources assert **4** and **6** (both **MODERATE**):

| Field | Value |
|-------|--------|
| **`resolved_severity_band`** | **MODERATE** |
| **`resolved_severity_score`** | **`null`** |
| Raw values | **Preserved** in audit |
| Aggregation | **Prohibited** — no average · max · median |

#### **D10-F — Free-text severity (band only)**

| Rule | Detail |
|------|--------|
| Output | Free-text may produce **`LOW`** / **`MODERATE`** / **`HIGH`** **only** |
| Numeric | **No** synthetic numeric score from free text |
| Lexicon | Requires versioned Hindi / English / Hinglish lexicon asset **`SEVERITY_MULTILINGUAL_LEXICON`** |
| NLP quality | Local calibrated NLP **≥0.80** when asset frozen |
| Binding | Negation · clinical context · **formula binding** mandatory |
| Until lexicon frozen | **No** automatic free-text severity (**D10-L**) |

#### **D10-G — Lab / vitals**

| Rule | Detail |
|------|--------|
| Role | **Formula-specific supporting evidence only** |
| Band mapping | Severity band **only** through separately frozen **`LAB_VITAL_TO_SEVERITY_MAPPING`** |
| Global severity | **Prohibited** |
| BP | **Q06C** formula-scoped BP evidence and crisis gate remain **separate** and **higher priority** for emergency branches |

#### **D10-H — Baseline / current separation**

| Field | Rule |
|-------|------|
| **`underlying_baseline_severity`** | Chronic / baseline severity context — **does not** overwrite **`current_manifestation_severity`** |
| **`current_manifestation_severity`** | Active manifestation severity (aligns **D09-8** **`Current_Severity`**) |
| Missing current | Baseline **must not** silently fill missing current |
| Recalculation | **New doctor submission** required for post-flare / follow-up recalc (**D09-9**) |

#### **D10-I — D30 boundary**

| Rule | Detail |
|------|--------|
| **HIGH band (7–10)** | **Alone** **must not** select **D30** |
| **D30** | Requires **POSITIVE** polarity · **NEGATIVE** therapeutic polarity · formula evidence · **all** existing **Q07C-D30F** gates |
| Emergency | Crisis / emergency safety gate (**Q06C**, cascade step **1**) **separate** and **higher priority** |

#### **D10-J — Target priority**

| Rule | Detail |
|------|--------|
| Upstream | Severity engine **reads** upstream **frozen** formula **target** binding |
| Prohibited | **Must not** select or change medicine · formula · target · mixture count |
| Secondary symptoms | **Must not** override **primary** target severity context |
| Missing target | **`TARGET_BINDING_MISSING`** · **`potency_status = UNRESOLVED`** |
| Co-primary same band | Band **may** resolve per **D10-C** / **D10-E** |
| Co-primary different bands | **`SEVERITY_CONTRADICTORY`** · **`potency_status = UNRESOLVED`** |

#### **D10-K — Output schema**

**`severity_status` enum (formula-scoped state machine — canonical):**

- **`RESOLVED_NUMERIC`**
- **`RESOLVED_BAND_ONLY`**
- **`MISSING_EVIDENCE`**
- **`INVALID_EVIDENCE`**
- **`INSUFFICIENT_CORROBORATION`**
- **`SEVERITY_CONTRADICTORY`**
- **`TARGET_BINDING_MISSING`**

**Diagnostic `reason_code` (when applicable — not a substitute for `severity_status`):**

| **`severity_status`** | Example **`reason_code`** |
|-----------------------|---------------------------|
| **`MISSING_EVIDENCE`** | **`SEVERITY_VALUE_MISSING`** |
| Evidence item invalid | **`INVALID_SEVERITY_NUMERIC_VALUE`** (item-level; pair with **`item_status = INVALID_NOT_USABLE`**) |

**Resolved fields:**

| Field | Type |
|-------|------|
| **`resolved_severity_score`** | Integer **1–10** **or** **`null`** |
| **`resolved_severity_band`** | **`LOW`** · **`MODERATE`** · **`HIGH`** **or** **`null`** |

| Failure | Behavior |
|---------|----------|
| Any non-success **`severity_status`** | **`potency_status = UNRESOLVED`** for affected formula |
| **5R-SDG** | **No** follow-up questions during analysis |
| Audit | Preserve **raw** source values · bands · sources · and **immutable** audit history |

**Resolution ordering (deterministic):**

1. **`TARGET_BINDING_MISSING`** (**D10-J**) if upstream target absent  
2. Build usable severity evidence pool per **D08** · **CLOSE-D04** · **Q-L**; apply **D10-B** **Cases A/B/C**  
3. Doctor structured path if present (**D10-C**, **D10-D**, **D10-E**)  
4. No-doctor **Option A** corroboration path (**D10-C**)  
5. Emit success **`severity_status`** or failure per **D10-M**

#### **D10-M — Severity resolution case table**

Assume formula target binding **present** unless row specifies otherwise. All paths preserve raw evidence; **no** follow-up during analysis (**5R-SDG**).

| # | Scenario | **`severity_status`** | **`reason_code`** (if any) | **`resolved_severity_score`** | **`resolved_severity_band`** | **`potency_status`** |
|---|----------|----------------------|----------------------------|-------------------------------|------------------------------|----------------------|
| **1** | Valid **formula-specific** doctor structured numeric (gates pass); single consistent integer | **`RESOLVED_NUMERIC`** | — | Integer **1–10** | Matching band | Per cascade |
| **2** | Doctor absent · **one** non-doctor usable source | **`INSUFFICIENT_CORROBORATION`** | — | **`null`** | **`null`** | **`UNRESOLVED`** |
| **3** | Doctor absent · ≥ **2** usable sources · **same band** · **same** integer | **`RESOLVED_NUMERIC`** | — | That integer | Matching band | Per cascade |
| **4** | Doctor absent · ≥ **2** usable sources · **same band** · **different** numerics (e.g. **4** and **6**) | **`RESOLVED_BAND_ONLY`** | — | **`null`** | Shared band (**D10-E**) | Per cascade |
| **5** | Doctor absent · usable sources span **≥2** different bands (**Option A**) | **`SEVERITY_CONTRADICTORY`** | — | **`null`** | **`null`** | **`UNRESOLVED`** |
| **6** | Doctor structured band vs **≥2** independent usable sources in **opposing** band | **`SEVERITY_CONTRADICTORY`** | — | **`null`** | **`null`** | **`UNRESOLVED`** |
| **7** | Mixed pool: ≥ **1** valid usable + ≥ **1** invalid numeric item (**Case A**) | Success per rows **1** / **3** / **4** if rules pass | — | Per success row | Per success row | Per cascade |
| **8** | Invalid-only pool: no usable severity; ≥ **1** invalid item (**Case B**) | **`INVALID_EVIDENCE`** | — | **`null`** | **`null`** | **`UNRESOLVED`** |
| **9** | No severity item submitted (**Case C**) | **`MISSING_EVIDENCE`** | **`SEVERITY_VALUE_MISSING`** | **`null`** | **`null`** | **`UNRESOLVED`** |
| **10** | Upstream formula target binding missing | **`TARGET_BINDING_MISSING`** | — | **`null`** | **`null`** | **`UNRESOLVED`** |

#### **D10-L — Pending assets (not executable until frozen)**

| Asset | Status |
|-------|--------|
| **`SEVERITY_MULTILINGUAL_LEXICON`** | **SEPARATE_FREEZE_PENDING** · **NOT_EXECUTABLE** |
| **`LAB_VITAL_TO_SEVERITY_MAPPING`** | **SEPARATE_FREEZE_PENDING** · **NOT_EXECUTABLE** |

**Until both assets frozen:**

- **No** automatic free-text severity
- **No** automatic lab/vital-derived severity
- **No** fabricated mappings
- **Doctor structured numeric severity** (per **D10-A**–**D10-C**) **remains usable**

**Documentation closure:** Pending assets **do not** block **Q07C-CLOSE-D10** formal closure; they **must not** execute or fabricate severity before separate owner freeze.

**Closure blockers (documentation):** **1–3** **RESOLVED** (recorded at pre-closure validation).

**Formal closure:** **Q07C-CLOSE-D10** · **10/14** · **CLOSED** · (**at Decision 10 closure:** **4** decisions remained **11–14**).

### Phase 5R-4D-Q07C-CLOSE-D11 — ACUTE VS SUB_ACUTE PHASE ADJUDICATION (**OWNER DECISION 11 of 14**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **ACUTE VS SUB_ACUTE PHASE ADJUDICATION**

**Owner approval:** Decision **11** formal closure approved — recorded as closure **11/14** (includes **D11-A**–**D11-D**, symmetric cross-boundary **Option A**, **`phase_status`** / **`limitation_code`**, case table **1–16**; **`PHASE_MULTILINGUAL_TIMELINE_LEXICON`** **SEPARATE_FREEZE_PENDING** / **NOT_EXECUTABLE** — does not block closure).

**Specific authority (ACUTE ↔ SUB_ACUTE):** **Q07C-CLOSE-D11** is the **specific authoritative** adjudication contract for **ACUTE ↔ SUB_ACUTE** scenarios. Generic **CLOSE-D02** “verified phase overrides days” **must be interpreted through** **D11-B** corroboration and **D11** case table **1–16** (cross-reference at **CLOSE-D02** — non-mutating).

**Scope:** **ACUTE ↔ SUB_ACUTE** boundary only — extends **CLOSE-D02** / **Q07C-CLOSE-D09** without altering **D09-4** (**CHRONIC_MODERATE ↔ DEEP_CHRONIC**) or **Decisions 1–10** recorded clinical text.

**Implements / extends (by reference):** **Q07C-CLOSE-D09** (**D09-1**–**D09-3**, **D09-5**–**D09-9**) · **Q07C-CLOSE-D08** · **CLOSE-D04** · **Q07C-D07P-MICRO Q-L** · **Q07C-CLOSE-D10** · **Q07C-D10F** · **Q07C-D30F** · **Q7B-F** · **Q06C** · **5R-SDG**.

**Decisions 1–10:** **Unchanged** (this phase records **Decision 11** formal closure only).

#### **D11-A — Day-band fallback (ACUTE / SUB_ACUTE)**

Only a **valid positive integer** duration (days) may set **`Fallback_Phase`** for the **ACUTE / SUB_ACUTE** boundary:

| Days (inclusive) | **`Fallback_Phase`** |
|------------------|----------------------|
| **1–14** | **ACUTE** |
| **15–45** | **SUB_ACUTE** |

| Rule | Detail |
|------|--------|
| Role | Duration is **fallback guidance only** — **not** an evidence **vote** |
| Polarity | Duration **never** determines **disease polarity** (**Rule 2** authority unchanged) |
| Missing duration | **No** silent default to **ACUTE** (align **D09-2**, **Q4**) |
| Other bands | **46–90** **CHRONIC_MODERATE** · **91+** **DEEP_CHRONIC** guidance remain per **CLOSE-D02** / **D09-2** (outside **D11** cross-boundary scope) |

#### **D11-B — Symmetric cross-boundary override (Option A)**

Applies when **valid duration** yields **`Fallback_Phase`** **ACUTE** or **SUB_ACUTE** **and** usable cross-boundary phase evidence exists per **D09-3** (**Q07C-CLOSE-D08** · **CLOSE-D04** · **Q-L**).

**A — `Fallback_Phase = ACUTE` (1–14) → override to `SUB_ACUTE`:**

- Tier **1** doctor structured **SUB_ACUTE** entry **OR** ≥ **2** unique independent usable **SUB_ACUTE** sources
- **SUB_ACUTE** count **must be greater than** opposing **ACUTE** count

**B — `Fallback_Phase = SUB_ACUTE` (15–45) → override to `ACUTE`:**

- Tier **1** doctor structured **ACUTE** entry **OR** ≥ **2** unique independent usable **ACUTE** sources
- **ACUTE** count **must be greater than** opposing **SUB_ACUTE** count

| Rule | Detail |
|------|--------|
| Confidence | **Q07C-CLOSE-D08** — usability only; **must not** weight votes or break ties |
| Counting | Each **unique independent usable** source = **one** count (**D09-5**, **Q-L**) |
| Tie | Equal opposing **active** usable counts → **`phase_status = PHASE_CONTRADICTORY`** · **`resolved_phase = null`** · **`potency_status = UNRESOLVED`** |
| Single cross-boundary source | **One** non-doctor cross-boundary source **without** true active contradiction **does not** override the valid day band (**align D09-7**) |
| Prohibited | Majority guessing **outside** the locked override conditions above |

#### **D11-C — Phase vs severity · output schema · status / limitation separation**

**Phase vs severity (independent axes):**

| **`Underlying_Resolved_Phase`** (ACUTE / SUB_ACUTE baseline) | Rule |
|--------------------------------------------------------------|------|
| Increased severity | **Must not** automatically change **`resolved_phase`** |
| Phase resolution | **Decision 11** evidence + day-band rules **alone** (with **D11-B** overrides) |
| Severity **7–10** | **May** yield **`D30_CANDIDATE`** only with **all** **Q07C-D30F** gates + **Q07C-CLOSE-D10** — **preserve** **`resolved_phase`** |
| **`Underlying_Resolved_Phase`** **CHRONIC_MODERATE** / **DEEP_CHRONIC** | Current acute worsening → **`Current_Manifestation = ACUTE_EXACERBATION_ON_CHRONIC`** (**D09-8**); **preserve** underlying chronic phase |
| **`ACUTE_EXACERBATION_ON_CHRONIC`** | **Must not** be used for **ACUTE** or **SUB_ACUTE** baselines |

**`phase_status` enum (formula-scoped state machine):**

- **`RESOLVED_BY_DAY_BAND`**
- **`RESOLVED_BY_EVIDENCE`**
- **`RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE`**
- **`MISSING_EVIDENCE`**
- **`INVALID_DURATION`**
- **`PHASE_CONTRADICTORY`**
- **`TARGET_BINDING_MISSING`**

**`resolved_phase`:** **ACUTE** · **SUB_ACUTE** · **CHRONIC_MODERATE** · **DEEP_CHRONIC** · **`null`**

**`limitation_code` (diagnostic — not a substitute for `phase_status`):**

| Situation | **`phase_status`** | **`resolved_phase`** | **`limitation_code`** (if any) |
|-----------|-------------------|----------------------|--------------------------------|
| Valid day-band + insufficient cross-boundary corroboration | **`RESOLVED_BY_DAY_BAND`** | Day-band fallback | **`INSUFFICIENT_CORROBORATION_FOR_CROSS_BOUNDARY_OVERRIDE`** |
| Invalid duration + valid uncontradicted usable phase evidence | **`RESOLVED_BY_EVIDENCE`** | From evidence | **`INVALID_DURATION_IGNORED`** |
| Invalid duration + no usable evidence | **`INVALID_DURATION`** | **`null`** | — · **`potency_status = UNRESOLVED`** |
| No duration + no usable evidence | **`MISSING_EVIDENCE`** | **`null`** | — · **`potency_status = UNRESOLVED`** |
| Opposing valid active evidence (incl. **D11-B** tie) | **`PHASE_CONTRADICTORY`** | **`null`** | — · **`potency_status = UNRESOLVED`** |
| Missing upstream formula target | **`TARGET_BINDING_MISSING`** | **`null`** | — · **`potency_status = UNRESOLVED`** |

**Rule:** **`INSUFFICIENT_CORROBORATION_FOR_CROSS_BOUNDARY_OVERRIDE`** is a **`limitation_code` only** — **never** a **`phase_status`** when a valid fallback phase exists.

**5R-SDG:** **No** follow-up questions during analysis; limitations appear in completed draft for final Approve/Modify.

#### **D11-D — Formula isolation · potency boundaries · pending asset · case table**

**Formula isolation:**

| Rule | Detail |
|------|--------|
| Scope | **`resolved_phase`** is **formula-specific** (**D09-1**) |
| Target | Phase engine **reads** upstream **frozen** formula target — **must not** select/change formula · medicine · target · mixture count |
| Leakage | Evidence from one formula **must not** affect another |
| History | Historical / fully resolved evidence **must not** override **current active** evidence (**D09-3**) |

**Potency boundaries (phase does not alone select potency — **D09-1**):**

| Condition | Cascade (when all gates pass) |
|-----------|-------------------------------|
| **`resolved_phase = ACUTE`** + severity **1–6** (**Q07C-CLOSE-D10**) | **D3** / **D5** pathway (**4d**, **CLOSE-D05**) |
| **`resolved_phase = SUB_ACUTE`** + severity **1–6** | **D10** Path **B** |
| Severity **7–10** | **Alone** **must not** select **D30** — **all** **Q07C-D30F** gates required |
| Crisis / emergency | **Q06C** / cascade step **1** — **separate**, **higher priority** |

**Pending data asset (Option B):**

| Asset | Status |
|-------|--------|
| **`PHASE_MULTILINGUAL_TIMELINE_LEXICON`** | **SEPARATE_FREEZE_PENDING** · **NOT_EXECUTABLE** |

**Until separately audited and frozen:**

- **No** automatic phase from vague free-text timeline
- **“Recent/new/कुछ दिनों से”** **cannot** create phase
- Exact structured duration **integer** remains usable
- Doctor structured phase remains usable
- Qualified explicit numeric report timeline remains usable
- **No** fabricated duration or phase

**Documentation closure:** Pending lexicon **does not** block **D11** owner specification; **must not** execute before separate freeze.

**D11 case table (deterministic — target binding present unless noted):**

| # | Scenario | **`phase_status`** | **`resolved_phase`** | **`limitation_code`** | **`potency_status`** |
|---|----------|-------------------|----------------------|------------------------|----------------------|
| **1** | Day **10** only (valid duration; no usable phase evidence) | **`RESOLVED_BY_DAY_BAND`** | **ACUTE** | — | Per cascade |
| **2** | Day **20** only | **`RESOLVED_BY_DAY_BAND`** | **SUB_ACUTE** | — | Per cascade |
| **3** | Day **10** + **one** non-doctor **SUB_ACUTE** usable source | **`RESOLVED_BY_DAY_BAND`** | **ACUTE** | **`INSUFFICIENT_CORROBORATION_FOR_CROSS_BOUNDARY_OVERRIDE`** | Per cascade |
| **4** | Day **10** + **two** **SUB_ACUTE** vs **zero** **ACUTE** | **`RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE`** | **SUB_ACUTE** | — | Per cascade |
| **5** | Day **10** + **two** **SUB_ACUTE** vs **one** **ACUTE** | **`RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE`** | **SUB_ACUTE** | — | Per cascade |
| **6** | Day **10** + **two** **SUB_ACUTE** vs **two** **ACUTE** | **`PHASE_CONTRADICTORY`** | **`null`** | — | **`UNRESOLVED`** |
| **7** | Day **20** + doctor structured **ACUTE** vs **zero** **SUB_ACUTE** | **`RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE`** | **ACUTE** | — | Per cascade |
| **8** | Day **20** + doctor structured **ACUTE** vs **one** **SUB_ACUTE** | **`RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE`** | **ACUTE** | — | Per cascade |
| **9** | Day **20** + **two** **ACUTE** vs **one** **SUB_ACUTE** | **`RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE`** | **ACUTE** | — | Per cascade |
| **10** | Day **14** only | **`RESOLVED_BY_DAY_BAND`** | **ACUTE** | — | Per cascade |
| **11** | Day **15** only | **`RESOLVED_BY_DAY_BAND`** | **SUB_ACUTE** | — | Per cascade |
| **12** | Invalid duration + valid uncontradicted phase evidence | **`RESOLVED_BY_EVIDENCE`** | From evidence | **`INVALID_DURATION_IGNORED`** | Per cascade |
| **13** | Invalid duration + no usable evidence | **`INVALID_DURATION`** | **`null`** | — | **`UNRESOLVED`** |
| **14** | Missing duration + missing usable evidence | **`MISSING_EVIDENCE`** | **`null`** | — | **`UNRESOLVED`** |
| **15** | Multiple formulas · different phase evidence per formula | Per-formula rows **1–14** | Per **D09-1** isolation | Per formula | Per formula |
| **16** | **`Underlying_Resolved_Phase`** chronic + **`ACUTE_EXACERBATION_ON_CHRONIC`** (**D09-8**) | Phase per **D11**/**D09**; manifestation separate | **Preserve** underlying chronic · **not** **`ACUTE_EXACERBATION_ON_CHRONIC`** on **ACUTE/SUB** baseline | — | **D30** only if **D09-8** + **D10** + **D30** gates |

**Formal closure:** **Q07C-CLOSE-D11** · **11/14** · **CLOSED** · **3** decisions remain (**12–14**).

### Phase 5R-4D-Q07C-CLOSE-D12 — TEMPERAMENT CONTROLLED QUALITATIVE PREFERENCE MATRIX (**OWNER DECISION 12 of 14**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **TEMPERAMENT CONTROLLED QUALITATIVE PREFERENCE MATRIX**

**Owner choice:** **Option D** — controlled **qualitative preference** among **dual-qualified** candidates only (**not** a standalone potency selector; **no** numeric weight table; **no** fixed medicine mapping).

**Owner approval:** Decision **12** formal closure approved — recorded as closure **12/14** (includes **D12-A**–**D12-D**, **D12-B-EXEC** **D3 ↔ D5** **`CURRENT_CASCADE_NO_OP`** on current frozen POSITIVE cascade, **D1/D2** **`NOT_EXECUTABLE_PENDING_CLINICAL_QUESTION_8`**, **MIXED** / **UNKNOWN** annotation-only; **CLOSE-D05** and **Decisions 1–11** clinical text **unchanged**).

**Formal closure:** **Q07C-CLOSE-D12** · **12/14** · **CLOSED** · **2** decisions remain (**13–14**).

**Scope:** Temperament **tie-break / preference** layer **after** the POSITIVE (and future NEGATIVE) cascade produces a candidate set — **does not** replace **CLOSE-D05**, **Q07C-CLOSE-D10**, **Q07C-CLOSE-D11**, **Q07C-D30F**, **Q07C-D60F**, **Q06C** crisis gate, or **Rule 2** polarity.

**Decisions 1–11:** Recorded clinical text **unchanged** (this phase records **Decision 12** formal closure only).

**Implements / extends (by reference):** Rule 1 [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) · **CLOSE-D05** · **CLOSE-D06** · **Q07C-D07P-NERVOUS** · **Q07C-CLOSE-D08** · **Q07C-CLOSE-D10** · **Q07C-CLOSE-D11** · **Q07C-D30F** · **Q07C-D60F** · **Q06C** · **Q07C-D07P-MICRO Q-L** · **5R-4D-PB** · **5R-SDG**.

#### **D12-A — Authority · preconditions · global prohibitions**

| Rule | Detail |
|------|--------|
| Temperament role | **SUPPORTING_EVIDENCE_ONLY** — **must not** create a new potency candidate |
| Override ban | **Must not** override **Rule 2** polarity · **Rule 3** organ/system / target pathology · phase (**D11**) · severity (**D10**) · formula target · **Q06C** crisis / emergency gate · **Q07C-D30F** · **Q07C-D60F** / **CLOSE-D06** · **CLOSE-D05** **D5** selection |
| Dual-qualified gate | Temperament preference applies **only** when **two** dilution candidates **both** pass **all** applicable clinical gates for the **same** formula-scoped decision |
| Single qualified | If **only one** candidate is qualified → temperament **must not** block · change · promote · or demote that candidate |
| Ladder promotions | Temperament **must not** promote **D10→D30** or **D30→D60** |
| Polarity group | Temperament **must not** move a candidate between **POSITIVE** vs **NEGATIVE** groups (**5R-4D-PB**) |
| Scale | Valid dilutions: **D1**, **D2**, **D3**, **D5**, **D10**, **D30**, **D60** only |
| Off-scale | **D6**, **D100**, **D200**, **D500** — **PROHIBITED** |
| Weights / mapping | **No** numeric temperament weight scores · **no** fixed medicine mapping from temperament · **no** numerology / name-number linkage to temperament or potency |
| Confidence / dedupe | **Q07C-CLOSE-D08** **`confidence_score` usability** · **Q-L** source deduplication — **mandatory** |
| Isolation | **STRICT_FORMULA_ISOLATION** — temperament preference **per formula** only |
| Analysis pass | **5R-SDG** — **no** follow-up questions during Rule 4 execution |

#### **D12-B — Qualitative preference matrix (dual-qualified only)**

Preference applies **only** when **both** listed candidates are already fully gated qualifiers for the active polarity group — **except** where **D12-B-EXEC** marks **D3 ↔ D5** rows **non-executable** on the **current frozen POSITIVE cascade**.

| **Rule 1 temperament** | **Both qualified** | **Preference** (clinical spec — preserved) |
|--------------------------|-------------------|----------------|
| **LYMPHATIC** | **D1** + **D2** | **D1** |
| **LYMPHATIC** | **D3** + **D5** | **D3** |
| **SANGUINE** | **D1** + **D2** | **D2** |
| **SANGUINE** | **D3** + **D5** | **D5** |
| **NERVOUS** | **D1** + **D2** | **D2** |
| **NERVOUS** | **D3** + **D5** | **D5** |

#### **D12-B-EXEC — Current frozen POSITIVE cascade · D3 ↔ D5 temperament rows**

The **current POSITIVE cascade** (step **4d**, **Q07C-D5F** + **CLOSE-D05**) exposes **no** dual-candidate decision point for **D3** vs **D5**:

| **CLOSE-D05** branch | Outcome |
|----------------------|---------|
| Qualified sensitivity (not Nervous-alone) | **`selected_candidate = D5`** only; **D3** **`SUPERSEDED_BY_D5`** |
| Sensitivity not qualified (incl. **MISSING**) | **`selected_candidate = D3`** only |

Therefore **all D12-B D3 ↔ D5 temperament preference rows** for **LYMPHATIC**, **SANGUINE**, and **NERVOUS**, and the **BILIOUS_HEPATIC D3/D5 context matrix** below, carry **identical execution labels** on the **current frozen cascade**:

| Label | Value |
|-------|--------|
| **`execution_status`** | **`CURRENT_CASCADE_NO_OP`** |
| **`temperament_preference_applied`** | **`FALSE`** |
| **`implementation_status`** | **`NOT_EXECUTABLE_WITH_CURRENT_FROZEN_CASCADE`** |

| Scope | Detail |
|-------|--------|
| **Clinical specification** | **D12-B** / **BILIOUS_HEPATIC** matrix text remains **OWNER_APPROVED_CLINICAL_SPECIFICATION** (not deleted) |
| **Runtime today** | **Must not** appear executable · **must not** override **CLOSE-D05** |
| **Future hook** | Introducing a **D3/D5 dual-candidate decision point** requires a **separate owner decision** — **not** approved by this clarification and **not** a cascade-refactor approval |

**NERVOUS — single-candidate rule:** When **only D3** is qualified → temperament **must not** block **D3** (consistent with **CLOSE-D05** **Else → D3** branch; **D12-B-EXEC** applies to **D3 ↔ D5** pair rows only).

**NERVOUS — alone prohibitions (extends existing gates — non-mutating):** **NERVOUS** temperament **alone** **must not** establish or verify: **D5** · **D10** · **D30** · **D60** · qualified formula hypersensitivity (**CLOSE-D05**) · **`IS_NERVOUS_PATHOLOGY_CLASS`** (**Q07C-D07P-NERVOUS**).

**BILIOUS_HEPATIC** (**OWNER_APPROVED_CLINICAL_SPECIFICATION** — **D3/D5 context matrix**; **D12-B-EXEC** labels apply — **not executable** on current cascade):

| Rule | Detail |
|------|--------|
| Precondition | **D3** and **D5** **both** already qualified — **mandatory** before any bilious preference (spec only until dual-candidate hook exists) |
| Secretory deficiency / sluggish hepatic function | Prefer **D3** |
| Hepatic inflammation / hyper-biliary / metabolic-clearing state | Prefer **D5** |
| Context missing · neutral · ambiguous · contradictory | **No** temperament preference — **original cascade outcome** stands |
| Silent defaults | **Prohibited** — **must not** silently default to **D3** or **D5** |

**MIXED** and **UNKNOWN:**

| Token | Potency effect |
|-------|----------------|
| **MIXED** | **Annotation / bypass only** — **no** potency preference |
| **UNKNOWN** | **Annotation / bypass only** — **no** potency preference; **must not** convert **UNKNOWN** to any other temperament token |

#### **D12-C — D1 / D2 boundary (NEGATIVE group · Clinical Question 8)**

| Item | Status |
|------|--------|
| **D1** / **D2** temperament preference rows in **D12-B** | **FUTURE CONDITIONAL** specification only |
| Executability (prior label) | **`NOT_EXECUTABLE_PENDING_CLINICAL_QUESTION_8`** |
| **Q08-CLOSE recorded** | Full **D1/D2** selector + safety contract **Q8-A**–**Q8-P** — see **Phase 5R-4D-Q08-CLOSE** below |
| **Temperament order (**Q8-G**)** | **Primary Q8 clinical selector first**; **D12-B** tie-break **only** when **both** **D1** and **D2** pass all clinical gates — **does not** alter **D12-A** / **D12-B** matrix clinical text above |
| Current **POSITIVE** cascade | **Unchanged** |
| **D3 ↔ D5** temperament rows | Per **D12-B-EXEC**: **`CURRENT_CASCADE_NO_OP`** · **`temperament_preference_applied = FALSE`** · **`NOT_EXECUTABLE_WITH_CURRENT_FROZEN_CASCADE`** — **CLOSE-D05** remains sole **D3/D5** selector on step **4d** |

#### **D12-D — Output · explainability (draft)**

When temperament preference selects between dual-qualified candidates (**when executable** — **not** **D3 ↔ D5** on current POSITIVE cascade per **D12-B-EXEC**):

- Record **`temperament_preference_applied`** (implementation field name **NOT_FROZEN**) with **Rule 1** token and **preferred** / **non-preferred** candidate ids
- Preserve **non-selected** qualified candidate in audit as **tie-break alternate** — **not** a second final dilution (**mutual exclusivity** unchanged)
- When **no** dual-qualified pair exists **or** **D12-B-EXEC** applies → **`temperament_preference_applied = FALSE`** · cascade result **unchanged** (**CLOSE-D05** outcome preserved)

**Formal closure:** **Q07C-CLOSE-D12** · **12/14** · **CLOSED** · **2** decisions remain (**13–14**).

### Phase 5R-4D-Q07C-CLOSE-D13 — PEDIATRIC POTENCY BOUNDARY AND SAFETY CONTRACT (**OWNER DECISION 13 of 14**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **PEDIATRIC POTENCY BOUNDARY AND SAFETY CONTRACT**

**Owner approval:** Pediatric **five-band ALLOW / RESTRICT / PROHIBIT** matrix approved for documentation — **Option C** shape (band × dilution overlay). **Owner correction (D13-C):** **P13-D** · **D30** = **RESTRICT** (was **PROHIBIT**) — **Q07C-D30F** preserved; **D13-G** unchanged. **Owner correction (under-one hard stop):** verified age **&lt; 1 year** (**P13-A** · **P13-B**) — **D13-HS**; active **D13-C** cells **NOT_APPLICABLE_UNDER_HARD_STOP**.

**Owner approval (formal closure):** Decision **13** final validation **READY_TO_CLOSE** accepted — **Q07C-CLOSE-D13** recorded **CLOSED** (includes **D13-A**–**D13-G**, **D13-HS**, **D13-B-EXEC** **PEDIATRIC_D60 NO-OP**; **Decisions 1–12** clinical text **unchanged**).

**Formal closure:** **Q07C-CLOSE-D13** · **13/14** · **CLOSED** · **1** decision remains (**14**).

**Scope:** Per-formula pediatric **overlay** applied **after** verified age band resolution and **after** **Decisions 1–12** cascade yields a dilution **candidate** — **does not** replace crisis hold, **Q07C-D30F**, **Q07C-D60F**, **CLOSE-D05**, phase (**D11**), severity (**D10**), or **Q01F** / **Q02F** principles. **Administration dose** (**D13-G**) is a **separate contract** — **must not** alter potency selection gates.

**Owner approval (administration-dose pass):** Owner-approved **Administration_Dose** rules recorded under **D13-G** (**OWNER_APPROVED_CLINIC_POSOLOGY** · **SOURCE_VALIDATION_PENDING**).

**Decisions 1–12:** Recorded clinical text **unchanged** (this phase records **Decision 13** owner specification only). **Q01F** / **Q02F** tables **unchanged** (cross-reference only).

**Implements / extends (by reference):** **Q01F** · **Q02F** · **Q06C** crisis gate · **Q07B-F** · **CLOSE-D05** · **Q07C-D10F** · **Q07C-D30F** · **Q07C-D60F** · **CLOSE-D03** · **CLOSE-D06** · **Q07C-CLOSE-D07** · **Q07C-CLOSE-D08** · **Q07C-CLOSE-D09** · **Q07C-CLOSE-D11** · **Q07C-CLOSE-D12** · **5R-4D-PB** · **5R-SDG** · **5R-DRG**.

#### **D13-A — Universal pediatric safety (overlay authority)**

| Rule | Detail |
|------|--------|
| Age alone | **PROHIBITED** as potency selector (**Q01F** / **Q02F** — preserved) |
| Overlay role | **ALLOW / RESTRICT / PROHIBIT** applies to **cascade-qualified** **D3/D5/D10/D30/D60** only (**5R-4D-PB** POSITIVE group) |
| Order | **(1)** Patient-wide **crisis / emergency hold** (**Q06C**, cascade step **1**) **(2)** **D13-HS** verified age **&lt; 1 year** hard stop (**P13-A** · **P13-B**) — **before** formula selection and potency cascade **(3)** Missing / invalid / contradictory verified age → **UNRESOLVED** per **Q01F** / **Q02F** (**no** silent under-one inference) **(4)** **Decisions 1–12** per-formula cascade **(5)** **D13-C** band matrix (**P13-C** · **P13-D** only — post-qualification) **(6)** **D13-D** documented justification for **RESTRICT** |
| Override ban | Pediatric overlay **must not** override **Rule 2** polarity · **Rule 3** target · **D11** phase · **D10** severity resolution · **CLOSE-D05** · **Q07C-D30F** · **Q07C-D60F** triple gate · **CLOSE-D06** |
| Missing verified age | **`potency_status = UNRESOLVED`**, `selected_dilution = null` — **no** silent default (**Q01F** / **Q02F**) |
| Weight | **Not** a potency gate — **`OWNER_DECISION_NOT_RECORDED`** (no pediatric weight rule added in **D13**) |
| Temperament · numerology · disease name | **Must not** select or promote potency (**D12**, **PB**, Q3–Q5) |
| Formula isolation | Band matrix **per formula** — **D09-1** |
| Confidence / dedupe | **Q07C-CLOSE-D08** · **Q-L** — mandatory for usable evidence |
| Issuance | **`automatic_issuance = false`** for pediatric paths; **FINAL_DOCTOR_APPROVAL_REQUIRED** (**5R-DRG**) |
| Potency vs dose | **Selected_Potency** = cascade + **D13-C** only; **Administration_Dose** = **D13-G** only — dose **must not** override potency |
| Scale | **D1–D60** only; **D6/D100/D200/D500 prohibited** |

#### **D13-B — Verified age bands**

| **Band ID** | **Age range (verified integer days / years)** | **Label** |
|-------------|-----------------------------------------------|-----------|
| **P13-A** | **0–28** days inclusive | **NEONATE** |
| **P13-B** | **29** days through **364** days (**&lt; 1 year**) | **INFANT** |
| **P13-C** | **1–5** years inclusive | **CHILD** |
| **P13-D** | **6–12** years inclusive | **JUVENILE** |
| **P13-E** | **&gt; 12** years (**age 13+**) | **ADULT** — **Decisions 1–12** cascade only · **no pediatric overlay** |

**Band resolution:** Use **verified patient age** only; **must not** infer band from disease name, temperament, or numerology. **Age 12** remains **P13-D** (**6–12** inclusive). **Verified age &lt; 1 year** → **D13-HS** (**not** selectable **D13-C** overlay).

#### **D13-HS — Verified age &lt; 1 year · owner hard stop (**P13-A** · **P13-B**)**

**`UNDER_ONE_YEAR_EXECUTION_RULE`** (**NOT_IMPLEMENTED** · documentation contract):

When **verified age** is **≥ 0 days** and **&lt; 1 year** (**P13-A** **0–28 days** or **P13-B** **29 days–364 days**):

| Field | Value |
|-------|--------|
| **`analysis_status`** | **`PEDIATRIC_UNDER_ONE_NOT_SUPPORTED`** |
| **`prescription_status`** | **`BLOCKED`** |
| **`selected_medicine`** | **`NULL`** |
| **`selected_formula`** | **`NULL`** |
| **`selected_potency`** | **`NULL`** |
| **`administration_dose`** | **`NULL`** |
| **`administration_frequency`** | **`NULL`** |
| **`clinical_prescription_summary`** | **`NOT_GENERATED`** |
| **`final_doctor_approval_required`** | **`TRUE`** |

**Display safety notice** ( **not** a clinical prescription summary):

> एक वर्ष से कम आयु के बच्चों के लिए यह सिस्टम औषधि, फॉर्मूला, potency, dose या clinical prescription summary तैयार नहीं करता। बच्चे का मूल्यांकन योग्य बाल-चिकित्सक द्वारा कराया जाए।

**Boundaries:**

- Safety notice **must not** be treated as **`clinical_prescription_summary`**.
- **No** partial formula · **no** draft prescription · **no** extrapolation from **1–5y**, **6–12y**, adult, or **D13-G** rules.
- **No** silent age, weight, medicine, potency, or dose default.
- **Formula selection**, **potency cascade**, **D30** / **D60** (and other dilution gates), **`PEDIATRIC_D60`** (**D13-B-EXEC**) — **must not start** for **P13-A** / **P13-B** (hard stop precedes cascade).
- **`PEDIATRIC_UNDER_ONE_CLINICAL_GENERATION`** = **`PROHIBITED_BY_OWNER_HARD_STOP`** (**D13-G-D**).

**Crisis / red flags (under-one):** **`URGENT_ESCALATION = TRUE`** · **`PRESCRIPTION_HOLD = TRUE`** — medicine / formula / potency / dose / summary **NOT_GENERATED**. Emergency escalation notice **may** display **in addition to** hard-stop safety notice — **still no** clinical prescription summary.

**Age validation:** Missing, invalid, or contradictory age → **existing** **Q01F** / **Q02F** rule — **`potency_status = UNRESOLVED`**, no medicine / formula / prescription, doctor review — **must not** infer **D13-HS** without verified **&lt; 1 year**.

#### **D13-C — ALLOW / RESTRICT / PROHIBIT matrix (owner-approved · active overlay bands)**

**Precondition (mandatory):** **D13-C** applies **only** when **D13-HS** does **not** apply (verified age **≥ 1 year**). **ALLOW** and **RESTRICT** apply **only** when the dilution is already a **cascade-qualified candidate** for the **same formula** — i.e. **all Decisions 1–12** clinical gates for that **D*** are satisfied. The matrix **must not** create or bypass cascade qualification.

| **Band** | **D3** | **D5** | **D10** | **D30** | **D60** |
|----------|--------|--------|---------|---------|---------|
| **P13-A** (0–28 days) | **NOT_APPLICABLE_UNDER_HARD_STOP** | **NOT_APPLICABLE_UNDER_HARD_STOP** | **NOT_APPLICABLE_UNDER_HARD_STOP** | **NOT_APPLICABLE_UNDER_HARD_STOP** | **NOT_APPLICABLE_UNDER_HARD_STOP** |
| **P13-B** (29 days–&lt;1 year) | **NOT_APPLICABLE_UNDER_HARD_STOP** | **NOT_APPLICABLE_UNDER_HARD_STOP** | **NOT_APPLICABLE_UNDER_HARD_STOP** | **NOT_APPLICABLE_UNDER_HARD_STOP** | **NOT_APPLICABLE_UNDER_HARD_STOP** |
| **P13-C** (1–5 years) | **RESTRICT** | **ALLOW** | **RESTRICT** | **PROHIBIT** | **PROHIBIT** |
| **P13-D** (6–12 years) | **RESTRICT** | **ALLOW** | **RESTRICT** | **RESTRICT** | **PROHIBIT** |
| **P13-E** (&gt;12 years) | — | — | — | — | — |

**Historical (non-executable — superseded by D13-HS):** Prior draft recorded **P13-A** · D3 **PROHIBIT** / D5 **RESTRICT** / D10 **RESTRICT** / D30·D60 **PROHIBIT** and **P13-B** · D3 **PROHIBIT** / D5 **RESTRICT** / D10 **ALLOW** / D30·D60 **PROHIBIT** — **not** selectable; **must not** be used as active runtime or closure-validation potency cells.

**Cell semantics:**

| Token | Meaning |
|-------|---------|
| **ALLOW** | After cascade qualification, band **does not block** final selection (**no** extra **D13-D** justification) |
| **RESTRICT** | After cascade qualification, candidate permitted **only** with **documented pediatric justification** per **D13-D** |
| **PROHIBIT** | Cascade-qualified candidate **must not** be selected for this band — **no automatic demotion** · **no silent fallback** to another dilution → **`potency_status = UNRESOLVED`**, `selected_dilution = null` **unless** the **existing frozen cascade** independently yields a **different** dilution that is **both** fully gated **and** **ALLOW** or **RESTRICT**-permitted (with **RESTRICT** justification when required) for the **same** formula |
| **NOT_APPLICABLE_UNDER_HARD_STOP** | **P13-A** / **P13-B** — **D13-HS** applies; **no** **D13-C** overlay evaluation · **no** potency / medicine / formula / dose / frequency / clinical summary generation |
| **—** | **P13-E:** pediatric matrix **not applied** |

**Severity / D30 / D60 preserved:** **D10-I** — severity **7–10 alone must not** select **D30**; **D60** still requires **DEEP_CHRONIC**, common gates, pathology class, **CLOSE-D06** — matrix **does not** waive **Q07C-D30F** or **Q07C-D60F** gates. **Overlay (active bands only):** **P13-C** · **D30** **PROHIBIT**; **P13-D** (6–12y) · **D30** **RESTRICT** (see **D13-D** · **P13-D · D30**); **P13-C**–**P13-D** · **D60** **PROHIBIT**. **P13-A** / **P13-B:** gates **not started** (**D13-HS**).

**P13-D · D30 = RESTRICT (owner correction — potency overlay only):** **D30** **must not** be selected from **age 6–12 alone**. **D30** may appear as **`D30_CANDIDATE`** / **`selected_dilution`** for this band **only** when **every** existing **Q07C-D30F** clinical and evidence gate passes for **that formula**, **plus** **D13-D** documented pediatric justification, **`automatic_issuance = false`**, **`final_doctor_approval_required = true`** (**FINAL_DOCTOR_APPROVAL_REQUIRED** · **5R-DRG**). Missing, invalid, incomplete, or contradictory required gates → **no** **D30** (**UNRESOLVED** per cascade). **Q06C** crisis / red flags → **`URGENT_ESCALATION`** + **`PRESCRIPTION_HOLD`** — **no** potency selection. **Does not** weaken **Q07C-D30F**; **does not** change other **D13-C** cells or **D13-G**.

#### **D13-D — RESTRICT · documented pediatric justification**

**Applies only** when **D13-HS** does **not** apply (verified age **≥ 1 year**) and **D13-C** cell is **RESTRICT** (not **NOT_APPLICABLE_UNDER_HARD_STOP**).

**RESTRICT** cells require **documented pediatric justification** (audit-visible; field names **NOT_FROZEN**) in addition to cascade qualification:

| **Band · dilution** | **Minimum justification** |
|---------------------|---------------------------|
| **P13-C · D3** | **Doctor structured** pediatric **D3** indication **or** **VERIFIED** objective exam aligned to formula target |
| **P13-C · D10** | **Doctor structured** pediatric **D10** indication **plus** **Q07C-D10F** gates |
| **P13-D · D3** | **Doctor structured** pediatric **D3** indication **or** **VERIFIED** exam |
| **P13-D · D10** | **Doctor structured** pediatric **D10** indication **plus** **Q07C-D10F** gates |
| **P13-D · D30** | **All Q07C-D30F** gates pass (**D30_CANDIDATE** only — **not** age **6–12** alone · **not** severity **7–10** alone) **plus** formula-scoped verified evidence per **D08** / **D09-1** **plus** **doctor structured** pediatric **D30** indication on **this formula**; **`final_doctor_approval_required = true`** |

**Parent report alone** **must not** satisfy **RESTRICT** justification. **Q07C-CLOSE-D08** · **Q-L** apply.

**Contradiction:** Parent vs doctor **CONTRADICTORY** on severity, phase, or dilution-supporting finding → **`potency_status = UNRESOLVED`** (**no** silent pick).

#### **D13-B-EXEC — `PEDIATRIC_D60` · current cascade execution**

Prior **Q07C-D60F** pediatric block documented **`enhanced_review_flag = PEDIATRIC_D60`** when age **0–12** and all **D60** requirements pass.

| Field | **Current frozen cascade** value |
|-------|----------------------------------|
| **`pediatric_d60_execution_status`** | **`CURRENT_PEDIATRIC_NO_OP`** |
| **`PEDIATRIC_D60` on P13-A / P13-B** | **Must not** be evaluated — **D13-HS** hard stop precedes **D60** path |
| **`selected_dilution` effect** | **`PEDIATRIC_D60` must not** alone change cascade **`selected_dilution`** (**NOT_IMPLEMENTED** overlay) |
| **Matrix **D60** **RESTRICT/PROHIBIT** cells** | **OWNER_APPROVED** clinical spec — enforced when pediatric overlay **executable**; today **documentation + audit annotation only** |
| **`automatic_issuance`** | Remains **false** when **D60** would qualify |

#### **D13-E — Overlay output (draft)**

When **D13** applies (**P13-C** · **P13-D** only — **not** **P13-A** / **P13-B**):

- Record **`pediatric_band`**, **`pediatric_cell_status`** per dilution evaluated (**ALLOW** / **RESTRICT** / **PROHIBIT** / **NOT_APPLICABLE** / **NOT_APPLICABLE_UNDER_HARD_STOP**)
- Record **`pediatric_overlay_applied`** (field name **NOT_FROZEN**) — **false** for **P13-E** and **false** for **P13-A** / **P13-B** (**D13-HS**)
- **`pediatric_justification`** when **RESTRICT** satisfied — append-only audit
- **PROHIBIT** on cascade-qualified candidate → **`pediatric_prohibition_reason`**; **`UNRESOLVED`** per **D13-C** (**no** auto-demotion · **no** silent fallback)

#### **D13-F — Scenario table (deterministic · corrected matrix · target binding present unless noted)**

Assumes **POSITIVE** group · per-formula isolation · **D13-HS** evaluated before cascade · scenarios **2–13** assume verified age **≥ 1 year** and crisis absent unless noted.

| # | Scenario | Band | Cascade candidate (if gated) | **D13-C** / rule | **`potency_status` / note** |
|---|----------|------|------------------------------|------------------|-----------------------------|
| **1** | **6-month** infant · any clinical inputs | **P13-B** | — | **D13-HS** | **`PEDIATRIC_UNDER_ONE_NOT_SUPPORTED`** · **`prescription_status = BLOCKED`** · no medicine / formula / potency / dose / frequency / **clinical_prescription_summary** · safety notice only |
| **1b** | **14-day** neonate · crisis vitals | **P13-A** | — | **D13-HS** + **Q06C** | **`URGENT_ESCALATION`** + **`PRESCRIPTION_HOLD`** · same **NOT_GENERATED** outputs · escalation notice allowed · **no** clinical summary |
| **2** | **3-year** · **ACUTE** · sensitivity **qualified** | **P13-C** | **D5** | **ALLOW** | **D5** if cascade + band **ALLOW** |
| **3** | **5-year** · **SUB_ACUTE** · sev **5** | **P13-C** | **D10** | **RESTRICT** | **D10** only with **D13-D** justification; else **UNRESOLVED** |
| **4** | **8-year** · sev **8** · **D30** gates **incomplete** | **P13-D** | — | **D30** **RESTRICT** | **UNRESOLVED** (cascade — **Q07C-D30F** incomplete); overlay **RESTRICT** applies only if **D30_CANDIDATE** |
| **5** | **10-year** · sev **8** · **D30** gates **complete** | **P13-D** | **D30** | **RESTRICT** | **D30** only if **Q07C-D30F** complete + **D13-D** **P13-D · D30** justification + **FINAL_DOCTOR_APPROVAL_REQUIRED** — **no** auto-demotion from **D30** without separate qualified path |
| **6** | **4-year** · **DEEP_CHRONIC** · **D60** triple **pass** | **P13-C** | **D60** | **PROHIBIT** | **UNRESOLVED** for **D60**; **D10** fallback only if **CLOSE-D03** + **D13-C** permits **D10** (**RESTRICT**) |
| **7** | **11-year** · **D60** triple **complete** | **P13-D** | **D60** | **PROHIBIT** | **UNRESOLVED** for **D60** (same as **6**) |
| **8** | **Age missing** | — | — | — | **UNRESOLVED** (**Q01F** / **Q02F**) — **no** **D13-HS** inference |
| **9** | **Weight missing** | Any | Per cascade | Per matrix | **No D13 weight gate** — **`OWNER_DECISION_NOT_RECORDED`** for weight |
| **10** | Parent vs doctor **contradiction** | Any | Any | — | **UNRESOLVED** (**D13-D**) |
| **11** | **Pediatric crisis** vitals (**Q06C**) | Any | — | — | Case **UNRESOLVED** · issuance **BLOCKED** — before overlay |
| **12** | **EXTREME_HYPERSENSITIVITY** · **D60** path | **P13-C/D** | **D60** | **PROHIBIT** | **D60** **UNRESOLVED** at overlay; **CLOSE-D06** does not override **PROHIBIT** |
| **13** | **Two formulas** · different eligibility | Per formula | Per formula | Per formula | **D09-1** isolation — rows **1–12** per formula |

#### **D13-G — ADMINISTRATION DOSE CONTRACT (separate from potency selection)**

**Classification:** **`OWNER_APPROVED_CLINIC_POSOLOGY`** · **`SOURCE_VALIDATION_PENDING`** — documented as **owner-approved clinic posology** only; **must not** be labeled universally book-proven or scientifically validated.

**Non-interference:** **D13-G** **must not** promote, demote, or override **Selected_Potency** or any **Decisions 1–12** / **D13-C** outcome. Potency overlay (**D13-C**–**D13-F**) and administration dose (**D13-G**) are **independent contracts** on the same prescription draft.

##### **D13-G-SEP — Canonical separation**

| Layer | Determined by |
|-------|----------------|
| **Selected_Medicine** · **Selected_Formula** · **Selected_Potency** | Existing disease-specific clinical cascade — phase (**D11**), severity (**D10**), polarity (**PB**), pathology, formula-scoped evidence (**D08**), safety gates (**Q06C**, **Q07C-D30F**, **Q07C-D60F**, **CLOSE-D05**, etc.) — then **D13-C** pediatric overlay on **potency** only |
| **Administration_Dose** | **D13-G** owner-approved rules — **verified age band** and **verified sensitivity** (where required) |
| **Age alone** | **Must not** select medicine, formula, or potency (**Q01F** / **Q02F** preserved). **D30** eligible **only** when existing **Q07C-D30F** clinical gates pass — age or severity **alone** **must not** imply **D30** |
| **Final prescription** | **`final_doctor_approval_required = true`** (**FINAL_DOCTOR_APPROVAL_REQUIRED** · **5R-DRG**) — unchanged |

##### **D13-G-A — Age 1–5 years (verified · **P13-C** · **1–5 years inclusive)**

**Scope:** Applies **only** to verified age **≥ 1 year** and **≤ 5 years**. **Must not** apply to **&lt; 1 year** (**P13-A** / **P13-B** — see **D13-G-D**).

| Rule | Value |
|------|--------|
| **`dose_per_administration_drops`** | **2** (proposed; not executable without dropper/preparation contract — **D13-G-GLOBAL**) |
| **`frequency_per_day`** | **Doctor-determined** from disease, severity, sensitivity, and clinical response — **no** system silent inference when structured frequency is absent |
| **Maximum proposed routine frequency** | **2** times daily — **subject to doctor confirmation**; exceeding proposed cap **requires** explicit doctor confirmation |
| **`administration_water`** | **Not specified** in this band — **`OWNER_DECISION_NOT_RECORDED`** for water volume in **D13-G-A** |
| **`administration_dose_status`** | **`PROPOSED_PENDING_DOCTOR_CONFIRMATION`** when age verified in band and crisis absent; **`frequency_per_day`** unset until doctor records structured frequency |
| **`limitation_code`** | **`PEDIATRIC_1_5_POSOLOGY_LIMITATION`** |

**Summary limitation text (display / audit — Hindi):**

> बाल चिकित्सा सावधानी—आयु 1 से 5 वर्ष: सिस्टम द्वारा सुझाई गई औषधि, फॉर्मूला और potency डॉक्टर की समीक्षा के लिए है। प्रस्तावित मात्रा 2 बूँद प्रति खुराक है। कितनी बार और कितने दिन दवा देनी है, इसका अंतिम निर्णय डॉक्टर बच्चे की आयु, वजन, रोग, गंभीरता, संवेदनशीलता और प्रतिक्रिया देखकर करें। डॉक्टर की स्वीकृति के बिना दवा न दें।

##### **D13-G-B — Age 6–12 years (verified · **P13-D** · **6–12 years inclusive**)

| Rule | Value |
|------|--------|
| **`dose_per_administration_drops`** | **5** (proposed; **D13-G-GLOBAL** executable gate) |
| **`frequency_per_day`** | **2** **OR** **3** times daily — exact count per disease pattern and **doctor review** |
| **2 vs 3 selection** | If verified clinical decision for **2** vs **3** is **not** available → system **must not** auto-select → **`frequency_per_day = null`** · **`administration_dose_status = UNRESOLVED`** until doctor confirms |
| **Potency note** | **D30** only if existing **Q07C-D30F** gates pass; age or severity **alone** **must not** select **D30** (potency path unchanged from **D13-C**) |
| **`administration_water`** | **Not specified** in this band — **`OWNER_DECISION_NOT_RECORDED`** |
| **`limitation_code`** | **`PEDIATRIC_6_12_POSOLOGY_LIMITATION`** |

##### **D13-G-C — Age above 12 years (verified · **P13-E** · age **13+**)

**Precondition:** **Verified sensitivity** status required for drop count proposal.

| **Verified sensitivity** | **`dose_per_administration_drops`** | **`frequency_per_day`** (default proposal) | **`administration_water`** |
|--------------------------|-----------------------------------|--------------------------------------------|----------------------------|
| **`HIGH_SENSITIVITY`** (qualified per **CLOSE-D05** / owner sensitivity contract) | **7** | **3** (doctor may reduce per disease, response, sensitivity) | **Half cup** normal or lukewarm water |
| **`NORMAL_SENSITIVITY`** (qualified) | **8** | **3** (doctor may reduce) | **Half cup** normal or lukewarm water |

| Failure mode | Outcome |
|--------------|---------|
| Sensitivity **missing**, **invalid**, or **contradictory** | **`administration_dose_status = UNRESOLVED`** · **`dose_per_administration_drops = null`** · **`frequency_per_day = null`** — system **must not** silently assume **7** or **8** drops |
| Doctor review flag | **`final_doctor_approval_required = true`** (**FINAL_DOCTOR_APPROVAL_REQUIRED**) |

**Potency:** Adult **Decisions 1–12** cascade only (**P13-E** — no **D13-C** overlay). **D13-G-C** does **not** alter dilution selection.

##### **D13-G-D — Age below 1 year (**P13-A** · **P13-B** · verified **&lt; 1 year**)**

| Field | Value |
|-------|--------|
| **`PEDIATRIC_UNDER_ONE_CLINICAL_GENERATION`** | **`PROHIBITED_BY_OWNER_HARD_STOP`** |
| **`administration_dose_status`** | **`NOT_APPLICABLE_UNDER_HARD_STOP`** |
| **`PEDIATRIC_UNDER_ONE_POSOLOGY`** | **Superseded** — **must not** use **`OWNER_DECISION_PENDING`** for active documentation |
| **Clinical outputs** | **None** — see **D13-HS** (**`clinical_prescription_summary = NOT_GENERATED`**) |
| **Invented dose / extrapolation** | **Prohibited** — **must not** extrapolate **D13-G-A** (2-drop) or any other band rule |

**Potency / overlay:** **D13-C** active cells for **P13-A** / **P13-B** = **NOT_APPLICABLE_UNDER_HARD_STOP** — **not** a separate parallel potency path.

##### **D13-G-GLOBAL — Administration safety (all bands)**

| Rule | Detail |
|------|--------|
| **Crisis / red flags** | **`URGENT_ESCALATION`** + **`PRESCRIPTION_HOLD`** — normal **D13-G** administration-dose rules **must not** apply until hold cleared per **Q06C** |
| **Executable drops** | Exact drop counts **executable** only when medicine **preparation/concentration** and **standardized dropper contract** are available — otherwise document **`audit_reason`** = preparation/dropper contract pending |
| **Aggravation / adverse reaction / intolerance** | **No** automatic continuation of prior dose; **doctor review required** |
| **Potency isolation** | Dose rules **must not** promote, demote, or override **Selected_Potency** |
| **Equivalence ban** | **Must not** document Homeopathy **30X** as equivalent evidence for Electrohomeopathy **D30** |
| **Silent defaults** | **No** silent dose count, frequency, or sensitivity assumption anywhere in **D13-G** |

##### **D13-G-OUT — Administration dose output schema (draft · field names NOT_FROZEN)**

When **Administration_Dose** is evaluated (post potency draft, same prescription context):

| Field | Description |
|-------|-------------|
| **`age_band`** | **P13-A** … **P13-E** or **`UNRESOLVED`** |
| **`verified_sensitivity_status`** | Qualified sensitivity token or **`MISSING`** / **`INVALID`** / **`CONTRADICTORY`** |
| **`dose_per_administration_drops`** | Integer proposal or **`null`** when **UNRESOLVED** |
| **`frequency_per_day`** | Integer proposal or **`null`** when doctor confirmation / 2-vs-3 decision pending |
| **`administration_water`** | Text (e.g. half cup lukewarm) or **`null`** when not specified for band |
| **`administration_dose_status`** | **`PROPOSED_PENDING_DOCTOR_CONFIRMATION`** · **`UNRESOLVED`** · etc. |
| **`final_doctor_approval_required`** | **`true`** for all **D13-G** paths (**5R-DRG**) |
| **`limitation_code`** | e.g. **`PEDIATRIC_1_5_POSOLOGY_LIMITATION`** · **`PEDIATRIC_UNDER_ONE_HARD_STOP`** |
| **`audit_reason`** | Append-only trace (missing frequency, sensitivity unresolved, crisis hold, dropper contract pending, etc.) |

**Formal closure recorded:** Four-draft consistency validated (**READY_TO_CLOSE**); **no** implementation sign-off.

**STOP — WAIT FOR OWNER APPROVAL BEFORE DECISION 14** *(superseded — Decision 14 owner specification recorded below.)*

### Phase 5R-4D-Q07C-CLOSE-D14 — TIER 3 RULE 3 PATHOLOGY MAPPING FREEZE AND EXECUTION BOUNDARY (**OWNER DECISION 14 of 14**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **TIER 3 RULE 3 PATHOLOGY MAPPING FREEZE AND EXECUTION BOUNDARY**

**Naming (mandatory distinction):**

| Term | Meaning |
|------|---------|
| **D08-D “Tier 3”** | **`OCR_EXTRACTED_DOCUMENT_IMAGE`** — source-type / confidence tier (**Q07C-CLOSE-D08**) |
| **D14 “Tier 3”** | **Rule 3 pathology mapping** fallback suggester (**Q-I** execution boundary) — **not** OCR tier authority |

**Owner approval:** Tier 3 **Rule 3** mapping **clinical contract** recorded (**D14-A**–**D14-N**). **Mapping data rows** **not** populated/frozen in this pass (**D14-L**).

**Owner approval (formal closure):** Decision **14** final validation **READY_TO_CLOSE** accepted — **Q07C-CLOSE-D14** recorded **CLOSED** (includes **D14-A**–**D14-N**; **`TIER3_PATHOLOGY_MAPPING_DATA_ASSET = SEPARATE_DATA_FREEZE_PENDING`** · **`execution_status = NOT_EXECUTABLE`** unchanged; **Decisions 1–13** clinical text **unchanged**).

**Formal closure:** **Q07C-CLOSE-D14** · **14/14** · **CLOSED** · **Question 7 decisions:** **ALL 14 CLOSED** · **Question 7 overall:** **FULLY_RESOLVED** (owner final cross-decision integration recorded — **Rule 4** **NOT_FROZEN** · **NOT_IMPLEMENTED**)

**Decisions 1–13:** Recorded clinical text **unchanged** (this phase records **Decision 14** owner specification only). **Q07C-CLOSE-D07** **Q-I** / **Q-H** intent preserved — **non-mutating cross-reference** to **D14** for execution boundary and **NOT_EXECUTABLE** status.

#### **D14-A — Purpose and authority**

| Rule | Detail |
|------|--------|
| Role | Tier 3 pathology mapping is **not** final pathology-class authority — **controlled candidate suggester only** |
| Prohibited alone | Mapping **must not** alone **qualify** pathology class · **create** **D60** eligibility · act as independent **evidence** · **vote** · **corroboration** · **confidence multiplier** |
| Insufficient alone | Pathology **name** · **keyword** · **OCR label** · **116k dataset alignment** (**D08-F** supporting-only) |
| Preserved | **Tier 1** and **Tier 2** **direct** evidence authority (**Q-H**, **CLOSE-D04**, **Q07C-CLOSE-D08**) |

#### **D14-B — Controlled FUNCTIONAL-only support**

Tier 3 mapping may suggest **`FUNCTIONAL_CANDIDATE`** only.

Tier 3 mapping **must never** alone create: **NERVOUS** · **RECURRENT** · **STRUCTURAL** · **`QUALIFIED_D60_CLASS`**.

**`FUNCTIONAL_CANDIDATE`** requires **all**:

- **Explicit functional dysfunction**
- **Formula-target match**
- **Organ/system match**
- **Anatomical-site match**
- **Direct usable formula-specific evidence**
- **Decision 8** confidence / usability gates
- **Decision 7** **FUNCTIONAL** gates (**Q07C-D07P-FUNCTIONAL**, **Q-G** hard-block evaluated)
- **Structural pathology absent** (verified — not inferred from silence)
- **Inflammatory** · **infectious** · **neoplastic** · **degenerative** · **obstructive** pathology **absent** (each **explicitly evaluated**)

**Critical:** No mention of structural (or other exclusion) pathology **≠** verified absence — **exclusion status must be explicitly evaluated**.

| Failure | Outcome |
|---------|---------|
| Missing / invalid / contradictory **exclusion status** | **`FUNCTIONAL_CANDIDATE = REJECTED`** · Tier 3 mapping **not applied** · **no** silent assumption |

#### **D14-C — Formula isolation**

Tier 3 mapping runs **per formula target** (mandatory keys: **`formula_id`**, **`formula_target`**, organ/system, anatomical site, pathology ID/group, **independent usable evidence**).

- Formula **A** evidence **must not** be used in Formula **B**
- Evidence count · confidence · corroboration · **D60** eligibility **must not** cross-formula transfer
- **Secondary/co-involved** system evaluated **only** with **separate** formula target + **independent** evidence
- **Patient-global** pathology class **prohibited**
- **Cross-formula leakage prohibited** (**CLOSE-D04**, **D09-1**)

#### **D14-D — OCR minimum contract (Tier 3 mapping evaluation input)**

For **OCR-derived** Tier 3 mapping evaluation, **all** fields **required**:

`normalized_pathology_id_or_label` · organ/system · anatomical site · **active/current assertion** · **negation status** · **formula-target binding** · **calibrated confidence** · **source identity** · **Decision 8** usability status · **explicit functional dysfunction** · **structural exclusion status** · **inflammatory exclusion status** · **infectious exclusion status** · **neoplastic exclusion status** · **degenerative exclusion status** · **obstructive exclusion status**

| Failure | Outcome |
|---------|---------|
| Any required field **missing**, **invalid**, or **contradictory** | **`tier3_mapping_item_status = IGNORED_NOT_USABLE_FOR_TIER3_MAPPING`** |

**No** field inference · **no** class fabrication · **no** **D60** promotion.

#### **D14-E — Evidence precedence and contradiction**

| Order | Authority |
|-------|-----------|
| **1** | **Tier 1** doctor structured evidence |
| **2** | **Tier 2** direct clinical evidence |
| **3** | **Tier 3** controlled mapping **candidate** (suggester only) |

Tier 3 **must not**: override Tier 1/2 · become independent **vote** · **corroborating source** · **confidence multiplier**.

- **Valid current structural** (or exclusion-category) evidence → **reject** **FUNCTIONAL** candidate
- **Valid current direct** evidence shows **real contradiction** (functional vs structural, etc.) → **`pathology_class_status = PATHOLOGY_CLASS_CONTRADICTORY`** · **`potency_status = UNRESOLVED`** · **no** silent precedence override · **final doctor review required** (**5R-DRG**)

#### **D14-F — RECURRENT boundary**

Tier 3 mapping **must not**: create **RECURRENT** class · **episode count** · qualify on **“recurrent”** / **“बार-बार”** / **“पुराना”** / bare disease label · vague timeline alone.

**RECURRENT** qualification **only** via **verified doctor-structured recurrent history** **or** **explicit independent usable** report timelines/episode counts under **Decision 7** gates (**Q07C-D07P-RECURRENT**).

OCR **explicit dates/counts** may enter as **separate evidence items** for the **existing RECURRENT engine** — **not** via mapping-alone qualification.

**Q07C-D07P-MICRO Q-L** deduplication **mandatory** (duplicate copies = one source/episode; duplicate text **must not** inflate counts).

#### **D14-G — NERVOUS boundary**

Tier 3 mapping **must not**: create **NERVOUS** class · qualify on nervous-system organ mapping alone · **pain** / **tingling** / **“nerve”** keyword alone · **MRI disc finding alone**.

**NERVOUS** qualification requires **explicit current nerve involvement** **or** **neurological dysfunction** **or** **neuropathic manifestation** **plus** formula-specific **direct usable** evidence · **Decision 8** gates · **Decision 7 NERVOUS** gates (**Q07C-D07P-NERVOUS**). Missing/vague/contradictory nerve evidence → **NERVOUS not qualified**.

#### **D14-H — Structural and exclusion-category outcomes**

Valid **structural** / **inflammatory** / **infectious** / **neoplastic** / **degenerative** / **obstructive** evidence:

- **Blocks FUNCTIONAL** (candidate / class path)
- **Must not** alone create **NERVOUS** or **RECURRENT**
- **Must not** create **STRUCTURAL D60 class** (**Q-G** — no fabricated structural class)

| Situation | Outcome |
|-----------|---------|
| No **NERVOUS** / **RECURRENT** / **FUNCTIONAL** qualifies | **`pathology_class_status = NO_QUALIFYING_D60_CLASS`** (**Q-K**) |
| Other **D60 common** gates complete | Existing **Q07C-CLOSE-D03** **D10** fallback |
| Required **common** evidence missing/invalid/contradictory | **`potency_status = UNRESOLVED`** · **no** fabricated fallback |

#### **D14-I — Unknown mapping and empty row**

Unknown pathology ID · **missing mapping row** · unsupported group:

- **No** mapping inference · **no** **116k** nearest-match class · dataset alignment remains **supporting-only** (**D08-F**)
- **`NO_QUALIFYING_D60_CLASS`** **only** when **common** evidence otherwise complete per **Q-K**
- Missing/contradictory **required** evidence → **`UNRESOLVED`**

#### **D14-J — Automated engine and doctor boundary**

- Engine resolves **candidate potency** via **deterministic** rules only
- Doctor **must not** arbitrarily select class/potency **between** engine steps in place of rules
- Each result exposes **reason codes** + **evidence trace**
- **`FINAL_DOCTOR_APPROVAL_REQUIRED = TRUE`** (**5R-DRG**) for final prescription issuance
- Mapping **alone** **must never** issue final prescription

#### **D14-K — Versioning and recalculation (mapping table schema — draft)**

| Field | Purpose |
|-------|---------|
| **`mapping_version`** | Immutable version id |
| **`pathology_id/group`** | Row key |
| **`organ/system`** · **`anatomical_site`** | Binding |
| **`allowed_candidate_class`** | **`FUNCTIONAL_CANDIDATE`** only (when row active) |
| **`required_evidence`** · **`exclusions`** · **`source`** · **`status`** | Audit |
| **`effective_from`** · **`superseded_by`** | Lifecycle |

- Mapping versions **immutable**; prior prescription/evidence/mapping versions **preserved** in audit trail
- Version update **must not** trigger automatic background recalculation
- New version applies **only** on **new doctor-submitted single-pass** analysis run (**5R-SDG**)
- **Silent data alteration prohibited**

#### **D14-L — Current execution status**

| Field | Value |
|-------|--------|
| **`TIER3_PATHOLOGY_MAPPING_DATA_ASSET`** | **`SEPARATE_DATA_FREEZE_PENDING`** |
| **`execution_status`** | **`NOT_EXECUTABLE`** |
| **`tier3_mapping_applied`** | **`FALSE`** |
| **`current_potency_delta`** | **`NONE`** |

**Tier 3 naming alias (active cross-references):** **`SEPARATE_FREEZE_PENDING`** = **`LEGACY_ALIAS_OF_SEPARATE_DATA_FREEZE_PENDING`**. Canonical data-asset status is **`TIER3_PATHOLOGY_MAPPING_DATA_ASSET = SEPARATE_DATA_FREEZE_PENDING`** (table above). Historical **Q-I** / closure-era text that uses **`SEPARATE_FREEZE_PENDING`** alone is **not** rewritten.

Until **owner-reviewed versioned rows** are **separately audited and frozen**:

- Tier 3 mapping **must not** run at runtime
- **Tier 1 / Tier 2** rules **unchanged**
- Existing **`NO_QUALIFYING_D60_CLASS`** / **D10** fallback / **`UNRESOLVED`** behavior **unchanged**
- **Empty table** **must not** be treated as successful mapping
- **No** **116k** automatic bulk classification

#### **D14-M — No-paid-API implementation constraint (future)**

**Prohibited:** paid API · per-request paid AI · hidden paid OCR dependency · trial-only production dependency.

**Future implementation (documentation constraint only — no install in this pass):** approved **local/self-hosted** OCR · local/self-hosted language models where needed · open-source processing · **versioned local datasets**.

#### **D14-N — Required reason codes (minimum documented set)**

`TIER3_MAPPING_NOT_EXECUTABLE` · `TIER3_MAPPING_ROW_NOT_FOUND` · `TIER3_MAPPING_ITEM_INCOMPLETE` · `TIER3_MAPPING_ITEM_CONTRADICTORY` · `FUNCTIONAL_EXCLUSION_NOT_VERIFIED` · `FUNCTIONAL_BLOCKED_BY_STRUCTURAL_EVIDENCE` · `NERVOUS_DIRECT_EVIDENCE_REQUIRED` · `RECURRENT_TIMELINE_EVIDENCE_REQUIRED` · `CROSS_FORMULA_MAPPING_LEAKAGE_BLOCKED` · `PATHOLOGY_CLASS_CONTRADICTORY` · `NO_QUALIFYING_D60_CLASS` · `TIER3_MAPPING_CANNOT_INDEPENDENTLY_QUALIFY_D60`

**Formal closure recorded:** Four-draft consistency validated (**READY_TO_CLOSE**); mapping **data asset** remains **`SEPARATE_DATA_FREEZE_PENDING`** · **`NOT_EXECUTABLE`**; **no** implementation sign-off.

**Owner resolution (Question 7):** Decisions **1–14** final cross-decision integration **clinically coherent** — **Question 7** = **FULLY_RESOLVED** · decision closures **14/14 CLOSED**. **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED** (Clinical Question **8** **CLOSED** · **NOT_IMPLEMENTED**; Clinical Questions **9+** **NOT_STARTED** / **PENDING**).

**STOP — WAIT FOR QUESTION 8 FINAL CLOSURE VALIDATION** *(superseded — Q08-CLOSE formal closure recorded below.)*

### Phase 5R-4D-Q08-CLOSE — NEGATIVE PATHWAY — D1 VS D2 SELECTION AND SAFETY CONTRACT (**Clinical Question 8**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **NEGATIVE PATHWAY — D1 VS D2 SELECTION AND SAFETY CONTRACT**

**Owner approval:** Question **8** clinical specification recorded (**Q8-A**–**Q8-P**). **Decisions 1–14** recorded clinical text **unchanged**. **Question 7** remains **FULLY_RESOLVED**. **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED**.

**Owner approval (formal closure):** Question **8** final validation **READY_TO_CLOSE** accepted — **Q08-CLOSE** recorded **CLOSED** (**Q8-A**–**Q8-P** clinical text **unchanged**; **`execution_status = NOT_IMPLEMENTED`** · **`automatic_D1_D2_selection = FALSE`** · **`current_runtime_potency_delta = NONE`** unchanged).

**Formal closure:** **Q08-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · prior **CLOSURE_VALIDATION_PENDING** superseded by owner acceptance.

#### **Q8-A — Polarity boundary**

**D1** and **D2** are potency candidates **only** for a **verified NEGATIVE disease** formula.

**Required (Rule 2):**

- **`disease_polarity` = NEGATIVE**
- **`required_therapeutic_polarity` = POSITIVE**

**POSITIVE disease formula:**

- **D1** **prohibited**
- **D2** **prohibited**
- Existing **D3/D5/D10/D30/D60** cascade (**Question 7**) **unchanged**

**MIXED**, **NEUTRAL**, **SUPPORT_ONLY**, **missing**, **contradictory**, or **UNRESOLVED** polarity:

- **D1** **not** selected
- **D2** **not** selected
- **`potency_status` = UNRESOLVED**
- **No** **D2** default

**Glossary (mandatory distinction):**

| Term | Meaning |
|------|---------|
| **D1** | **POSITIVE dilution-force direction** (NEGATIVE disease group) |
| **D2** | **NEUTRAL / MODERATING dilution-force direction** (NEGATIVE disease group) |
| **Dilution-force label** | **Not** the same as Rule 2 **`required_therapeutic_polarity`** label |
| **Homeopathy** | Equivalence to Homeopathic potency scale **prohibited** |

#### **Q8-B — Primary combined selector**

**D1/D2** selection **must not** use any **single axis** alone.

**Mandatory combined evaluation (all applicable per formula):**

Verified **NEGATIVE** formula polarity · formula target · resolved organ/system · formula-specific pathology · **direct usable** evidence · **Q07C-CLOSE-D04** lifecycle · **Q07C-CLOSE-D08** confidence · **Q-L** deduplication · **formula isolation** · **`resolved_phase`** · **`resolved_severity`** · **sensitivity status** · **contraindications** · **crisis gate** (**Q06C**)

**Phase or severity alone must not** select **D1** or **D2**.

**Missing / invalid / contradictory required input:**

- **`selected_dilution` = NULL**
- **`potency_status` = UNRESOLVED**

#### **Q8-C — D1 eligibility**

**`D1_CANDIDATE`** only when **all** pass:

- **Q8-A** and **Q8-B** complete
- **Explicit positive-force indication**
- **Explicit formula-specific** hypofunction / hypotonic / sluggish / deficient-function evidence (**not** keyword-only)
- **Severity 1–6** (verified per **Q07C-CLOSE-D10** when severity required)
- **High sensitivity absent** (no **D1** when high-sensitivity prohibition applies)
- **Formula-specific cardiac/high-BP D1 prohibition absent** (**Q8-F** / **Q06C** scope)
- **Pediatric boundary** permits **D1** (**Q8-H**)
- **No** crisis / red flag
- **D1 minimum evidence** complete (**CLOSE-D04**-aligned)

**D1 must never** be selected from: disease name · weakness keyword · paralysis keyword · severity alone · phase alone · low BP alone · temperament alone · age alone · **116k** dataset alignment alone

#### **Q8-D — D2 eligibility**

**`D2_CANDIDATE`** only when **all** pass:

- **Q8-A** and **Q8-B** complete
- **Neutral/moderating-force indication** explicitly supported **OR** **D1** safety prohibition present **and** **D2** independent gates complete
- **Formula-specific direct usable** evidence
- **Pediatric boundary** permits **D2** (**Q8-H**)
- **No** crisis / red flag

**D2 is not:**

- Silent fallback · missing-evidence default · neutral-polarity default · **MIXED/UNRESOLVED** formula default

**D1 prohibited alone does not** finalize **D2** — **D2** gates **must** complete independently.

#### **Q8-E — Severity 7–10**

**Order:**

1. Crisis / red-flag gate  
2. If crisis → **`URGENT_ESCALATION`** · **`PRESCRIPTION_HOLD`** · **`selected_dilution` = NULL**  
3. If **no** crisis and severity **7–10** → **D1 prohibited** · severity **alone must not** select **D2** · **D2** may become **`RESTRICTED_CANDIDATE`** only when **all Q8-D** gates pass  
4. Otherwise → **`potency_status` = UNRESOLVED**

#### **Q8-F — Cardiac / high-BP boundary**

**NEGATIVE** formula targeting **CARDIAC** · **VASCULAR** · **BP_REGULATION** with **verified high BP**:

- **D1** = **PROHIBIT**
- **D2** may remain candidate **only** if **all Q8-D** gates pass
- **No** automatic **D2** fallback
- Crisis BP **overrides** all potency selection (**Q06C**)

**No** cross-formula cardiac evidence leakage.

#### **Q8-G — Temperament order**

1. **Primary Q8** clinical selector runs first.  
2. If **both D1** and **D2** pass **all** clinical gates → **D12-B** temperament tie-break (**Q07C-CLOSE-D12** — matrix text **unchanged**):

| Temperament | Supports |
|-------------|----------|
| **LYMPHATIC** | **D1** |
| **SANGUINE** | **D2** |
| **NERVOUS** | **D2** |
| **BILIOUS_HEPATIC** | **D2** |
| **MIXED** / **UNKNOWN** | **No** preference |

Temperament **must not:** invent candidates · override clinical gates · override polarity / phase / severity / crisis.

**Unresolved tie:** **`potency_status` = UNRESOLVED** · **`selected_dilution` = NULL**

#### **Q8-H — Pediatric D1/D2 matrix**

| Band | **D1** | **D2** |
|------|--------|--------|
| **Verified age &lt; 1 year** (**D13-HS**) | **NOT_APPLICABLE** | **NOT_APPLICABLE** — complete hard stop; no medicine/formula/potency/dose/summary |
| **1–5 years** | **PROHIBIT** | **RESTRICT** — **D2** only with **all Q8-D** gates + **FINAL_DOCTOR_APPROVAL_REQUIRED** |
| **6–12 years** | **RESTRICT** | **ALLOW** — both require full **Q8-C** / **Q8-D** gates; age **alone** selects neither |
| **&gt; 12 years** | Adult **Q8** rules | Adult **Q8** rules |

**Age missing / invalid / contradictory:** no pediatric band · **D1/D2 unresolved** · **no** silent age default

#### **Q8-I — Administration dose separation**

**Potency** and **administration dose** are **separate** contracts.

**Selected oral D1/D2** formula: existing **D13-G** age-dose contract applies (**2** drops **1–5y**; **5** drops **6–12y**; **7/8** drops **&gt;12y** by sensitivity; frequency doctor-confirmed; **3×/day** **&gt;12y** where documented; water per **D13-G**).

**Dose must not:** promote/demote potency · change **D1/D2** qualification · silent **7/8** when sensitivity missing

#### **Q8-J — Mutual exclusivity**

**Final:** exactly one of **D1** · **D2** · **UNRESOLVED**. **D1** and **D2** **co-final prohibited**.

**Resolution order:** (1) **Q8** clinical gates (2) safety prohibitions (3) pediatric boundary (4) **D12** tie-break if both qualified (5) remaining tie → **UNRESOLVED**. **No D2 default.**

#### **Q8-K — Legacy quarantine**

**Rejected as selector authority:** legacy severity ≥8→**D1** · BP&lt;95→**D1** · legacy chronic/sub-acute **NEGATIVE** branches · missing severity=**5** · missing BP=**120** · missing age=**40** · missing polarity=**MIXED** · legacy pediatric **D10/D5** shortcuts. Legacy `potency_engine.py` = **forensic history only**.

#### **Q8-L — Paralysis / weakness safety**

Keywords alone (**paralysis**, **weakness**, **hypotonic**, **chronic**) **must not** create **D1**. **Explicit formula-specific confirmed hypofunction** evidence required. **Acute neurological red flag** → **`URGENT_ESCALATION`** + **`PRESCRIPTION_HOLD`**. **No** disease-name hardcoding. Otherwise same **Q8** rules as all **NEGATIVE** formulas.

#### **Q8-M — Output-route isolation**

**Q8** determines **oral Rule 4** selected dilution **only**. **Do not** auto-copy oral **D1/D2** to electricity · tablet A/B · external — separate route contracts.

**Clinical summary (draft contract):** selected **D1** or **D2** · formula target · evidence · phase · severity · sensitivity · safety gates · why alternate rejected · limitation/reason code · **FINAL_DOCTOR_APPROVAL_REQUIRED**. **No** cure guarantee or fabricated mechanism.

#### **Q8-N — Registry conflict**

**`medicines.v1.json`** **`potency_logic`** strings = **`REGISTRY_POTENCY_LOGIC_AUDIT_PENDING`** · **`NOT_EXECUTABLE_AS_Q8_SELECTOR`** when conflicting with **Q08-CLOSE** / **5R-4D-PB**. **No** registry string may override **Q8** clinical contract.

#### **Q8-O — Required statuses / reason codes (minimum)**

`NEGATIVE_D1_D2_GROUP_OPEN` · `NEGATIVE_POLARITY_NOT_VERIFIED` · `D1_MINIMUM_EVIDENCE_INCOMPLETE` · `D2_MINIMUM_EVIDENCE_INCOMPLETE` · `D1_POSITIVE_FORCE_INDICATION_ABSENT` · `D2_MODERATING_FORCE_INDICATION_ABSENT` · `D1_PROHIBITED_HIGH_SENSITIVITY` · `D1_PROHIBITED_CARDIAC_HIGH_BP` · `D1_PROHIBITED_SEVERITY_7_10` · `D2_RESTRICTED_HIGH_SEVERITY` · `PEDIATRIC_D1_PROHIBITED` · `PEDIATRIC_D1_RESTRICTED` · `PEDIATRIC_D2_RESTRICTED` · `D1_D2_TIE_UNRESOLVED` · `D1_D2_COFINAL_PROHIBITED` · `LEGACY_D1_D2_SHORTCUT_REJECTED` · `CROSS_FORMULA_D1_D2_LEAKAGE_BLOCKED` · `D1_D2_REQUIRED_INPUT_MISSING` · `D1_D2_REQUIRED_INPUT_CONTRADICTORY`

#### **Q8-P — Current execution status**

| Field | Value |
|-------|--------|
| **Question 8** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`current_runtime_potency_delta`** | **NONE** |
| **`automatic_D1_D2_selection`** | **FALSE** |
| **Registry (`potency_logic`)** | **`REGISTRY_POTENCY_LOGIC_AUDIT_PENDING`** · **`NOT_EXECUTABLE_AS_Q8_SELECTOR`** |
| **Paid API** | **Prohibited** |

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 9 READ-ONLY AUDIT** *(superseded — Question **9** owner specification recorded below.)*

### Phase 5R-4D-Q09-CLOSE — MIXED DISEASE-STATE CONTROLLED AUTOMATIC SPLIT AND POLARITY-CONTRADICTION CONTRACT (**Clinical Question 9**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **MIXED DISEASE-STATE CONTROLLED AUTOMATIC SPLIT AND POLARITY-CONTRADICTION CONTRACT**

**Owner approval:** Question **9** clinical specification recorded (**Q9-A**–**Q9-M**; blocker resolution **Q9-N**–**Q9-Q**). **Question 7** remains **FULLY_RESOLVED** (**Decisions 1–14** clinical bodies **unchanged**). **Question 8** remains **CLOSED** · **NOT_IMPLEMENTED** (**Q8-A**–**Q8-P** **unchanged**). **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED**.

**Owner approval (formal closure):** Question **9** post-blocker validation **READY_TO_CLOSE** accepted — **Q09-CLOSE** recorded **CLOSED** (**Q9-A**–**Q9-Q** clinical text **unchanged**; **`execution_status = NOT_IMPLEMENTED`** · **`automatic_mixed_split_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** unchanged).

**Formal closure:** **Q09-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · prior **CLOSURE_VALIDATION_PENDING** superseded by owner acceptance.

#### **Q9-A — Controlled automatic split**

When a **patient** has **distinct POSITIVE and NEGATIVE clinical targets** and **each target** has **independent**, **usable**, **formula-specific** evidence, the system **must** perform **controlled automatic formula-target split**:

| Split slot polarity | Potency cascade (documentation contract) |
|---------------------|------------------------------------------|
| **POSITIVE** target / formula slot | Question **7** frozen cascade: **D3**, **D5**, **D10**, **D30**, **D60** (per **Q07C-CLOSE** decisions — **NOT_IMPLEMENTED** at runtime) |
| **NEGATIVE** target / formula slot | Question **8** closed cascade: **D1**, **D2** (per **Q08-CLOSE** **Q8-A**–**Q8-P** — **NOT_IMPLEMENTED** at runtime) |

**No** common potency **must** be selected from a **patient-wide MIXED** label alone.

#### **Q9-B — Same-target contradiction**

When **POSITIVE** and **NEGATIVE** evidence relate to the **same** clinical / formula **target** and evidence **cannot** be safely split into **separate targets**:

| Field | Value |
|-------|--------|
| **`disease_polarity_status`** | **`POLARITY_CONTRADICTORY`** |
| **`potency_status`** | **UNRESOLVED** |
| **`selected_dilution`** | **null** |
| **`automatic_formula_split`** | **false** |
| **`final_doctor_approval_required`** | **true** |

**Prohibited:** automatic selection of **D1**, **D2**, **D3**, **D5**, **D10**, **D30**, or **D60** in this state.

#### **Q9-C — No MIXED potency ladder**

**Prohibited** potency selection based **only** on: **MIXED** label · keyword · disease name · phase · severity · temperament · constitution · age · legacy mapping.

**Prohibited silent defaults (legacy quarantine — forensic only):**

| Legacy shortcut | Status |
|-----------------|--------|
| **MIXED → D2** | **REJECTED** |
| **MIXED + SUB_ACUTE → D10** | **REJECTED** |
| **MIXED + CHRONIC → D30** | **REJECTED** |
| **missing polarity → MIXED** | **REJECTED** (align **Q4** / **Q09-CLOSE**) |
| **equal POSITIVE/NEGATIVE evidence → default potency** | **REJECTED** |
| **highest severity** or **maximum potency** as tie-breaker | **REJECTED** |

#### **Q9-D — Formula-specific isolation (per split slot record)**

Each split formula slot **must** maintain an **independent** record including at minimum:

`formula_target_id` · `target_symptom_or_pathology` · `target_disease_polarity` · `required_therapeutic_polarity` · `evidence_item_ids` · `evidence_source_ids` · `organ_system_binding` · `site_binding` · `phase` · `severity` · `selected_cascade` · `selected_dilution` · `resolution_status` · **`slot_resolution_status`** · **`slot_potency_status`** · `reason_codes`

Formula **A** evidence **must not** qualify Formula **B** polarity, formula identity, or potency. **Cross-formula evidence leakage** **prohibited**.

#### **Q9-E — Split eligibility gates**

**Automatic split** **only** when **all** pass:

- ≥ **2** distinct clinical / formula **targets**
- Each target polarity **independently resolved** (**POSITIVE** or **NEGATIVE** — not **MIXED** as slot selector)
- Evidence **usable** and **target-bound**
- **Target binding** not **missing** or **ambiguous**
- Negation and context validation **pass**
- Duplicate evidence treated as one source per **Q-L** deduplication
- **Q07C-CLOSE-D08** evidence-quality rules **pass**
- Targets are **not** duplicate wording only
- Each slot passes its respective **Q7** or **Q8** gates **independently**

**Any required gate failure for full split:** **no silent split** — apply **Q9-N** (partial slot) · **Q9-B** (same-target) · **Q9-Q** failure matrix · explicit **`reason_codes`**. **Full **`RESOLVED_BY_CONTROLLED_SPLIT`** requires every distinct slot to pass **all** bullets above (**Q9-E** unchanged); partial outcomes **Q9-N** + **Q9-Q**.

#### **Q9-F — MIXED label resolution**

**MIXED** may exist only as a **patient-level descriptive** state — **not** a potency selector.

| Condition | Outcome |
|-----------|---------|
| Evidence **safely separable** | **`patient_polarity_summary` = MIXED** · per-slot **resolved polarity** · **`automatic_formula_split` = true** · each slot runs **Q7** or **Q8** cascade **independently** |
| Evidence **not safely separable** | **`disease_polarity_status` = POLARITY_CONTRADICTORY** · **`automatic_formula_split` = false** · **`potency_status` = UNRESOLVED** · **`selected_dilution` = null** |

#### **Q9-G — SUPPORT_ONLY separation**

**SUPPORT_ONLY** **is not** **MIXED** disease polarity.

- **SUPPORT_ONLY** evidence **must not** create an independent formula / potency candidate under **Q9**
- Final **SUPPORT_ONLY** potency behavior = Clinical Question **11** (**NOT_STARTED** / **PENDING**)
- **Q9** creates **no** potency rule or silent fallback for **SUPPORT_ONLY** — use **`SUPPORT_ONLY_DEFERRED_TO_Q11`** where applicable

#### **Q9-H — Safety precedence (independent of Q9 split logic)**

**Precedence above Question 9:**

- Emergency / crisis safety gate (**Q06C**)
- **D13-HS** verified age **&lt; 1 year** hard stop
- Pediatric potency boundaries (**Q07C-CLOSE-D13**)
- **Q06C** cardiac / BP safety
- Formula isolation
- Contraindication gates
- **Final doctor approval** (**5R-DRG** / **5R-SDG**)

**Crisis before** automatic split or potency selection:

- **`URGENT_ESCALATION`**
- **`PRESCRIPTION_HOLD`**
- **`selected_dilution` = null**

#### **Q9-I — Downstream separation**

Controlled automatic split resolves **formula-target oral potency** documentation only.

**Must not** automatically:

- Copy oral formula → tablet Section **A/B**
- Select electricity
- Create external-application formulas
- Bypass medicine selection rules
- Copy one route’s formula into another route

Each route retains **independent** clinical selection and evidence binding (**Q5** / **Q8-M** alignment).

#### **Q9-J — Output schema (minimum fields)**

`question_9_status` · `patient_polarity_summary` · **`patient_resolution_status`** · `automatic_formula_split` · `split_status` · `formula_slot_id` · `formula_target_id` · `target_disease_polarity` · `required_therapeutic_polarity` · `selected_cascade` · `potency_status` · **`slot_potency_status`** · `selected_dilution` · `evidence_item_ids` · `evidence_source_ids` · `resolution_status` · **`slot_resolution_status`** · **`prescription_status`** · **`registry_q9_selector_status`** · `limitation_codes` · `reason_codes` · `final_doctor_approval_required` · `execution_status` · `current_runtime_potency_delta`

**Namespace separation:** **`question_9_status`** / **`split_status`** / **`slot_resolution_status`** / **`patient_resolution_status`** = lifecycle / outcome state machines; **`reason_codes`** = audit/limitation codes only — **must not** substitute for status enums (**Q9-Q**).

**Prescription cross-reference (**5R-DRG** / **D13-HS**):** Q9 **`prescription_status`** values below are **Rule 4 Q9 slice** labels. Existing platform fields (**`doctor_review_required`**, **`final_doctor_approval_required`**, **`prescription_status = BLOCKED`** under **D13-HS**) **unchanged** — map at integration time; **do not** mutate **D13** or **5R-DRG** canonical enums in this pass.

#### **Q9-K — Canonical reason codes (minimum — audit/limitation only)**

`RESOLVED_BY_CONTROLLED_SPLIT` · `PARTIAL_SPLIT_REQUIRES_DOCTOR_REVIEW` · `POLARITY_CONTRADICTORY` · `UPSTREAM_TARGET_POLARITY_NOT_RESOLVED` · `REGISTRY_Q9_SELECTOR_BLOCKED` · `TARGET_BINDING_MISSING` · `INSUFFICIENT_TARGET_SEPARATION` · `INSUFFICIENT_CORROBORATION` · `CROSS_FORMULA_POLARITY_LEAKAGE_BLOCKED` · `DUPLICATE_TARGET_NOT_SPLIT` · `MIXED_LABEL_NOT_A_POTENCY_SELECTOR` · `SUPPORT_ONLY_DEFERRED_TO_Q11` · `PRESCRIPTION_HOLD` · `UNRESOLVED`

Evidence-level invalid items **must** be audited **separately** — one invalid item **must not** destroy the entire valid evidence pool (**Q9-N** §10 · **Q9-K** preserved).

#### **Q9-L — Execution boundary**

| Field | Value |
|-------|--------|
| **Question 9** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_mixed_split_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **Rule 4** | **NOT_FROZEN** · **NOT_IMPLEMENTED** |
| **Question 10+** | **NOT_STARTED** / **PENDING** |

#### **Q9-M — No paid API**

Question **9** logic **must not** require or permit **paid API**, **paid LLM**, **paid OCR**, or **paid clinical service** dependencies.

Future implementation: **deterministic local rules**, **versioned data assets**, **approved local / self-hosted open-source** components only.

#### **Q9-N — Safe partial-slot resolution (Blocker 1 — owner-approved)**

When ≥ **2** **genuinely distinct** formula targets exist for controlled split evaluation but **not all** slots resolve together, a **valid** slot **must not** be destroyed because another slot is invalid / unresolved.

1. **Each formula slot evaluated independently.**

2. **Resolved draft candidate slot** — when **all** pass for **that slot only**:
   - target binding valid
   - polarity **independently resolved** (upstream **Rule 2** — **Q9-O**)
   - evidence usable and formula-specific
   - **Q07C-CLOSE-D08** and **Q-L** pass
   - context and negation validation pass
   - organ / site binding valid
   - applicable **Q7** or **Q8** gates pass
   - no slot-specific contraindication

   **Slot outputs:**
   - **`slot_resolution_status` = `RESOLVED_DRAFT_CANDIDATE`**
   - **`slot_potency_status`** = applicable **Q7** / **Q8** outcome
   - **`selected_cascade` = `Q7`** or **`Q8`**
   - **`selected_dilution`** = cascade resolved outcome (draft — **not** final issuance)
   - **`final_doctor_approval_required` = true**

3. **Unresolved slot** — missing / invalid / ambiguous / contradictory / insufficient evidence:
   - **`slot_resolution_status` = `UNRESOLVED`**
   - **`slot_potency_status` = `UNRESOLVED`**
   - **`selected_cascade` = null** when polarity / cascade binding unresolved
   - **`selected_dilution` = null**
   - appropriate **`reason_codes`** (**Q9-K** / **Q9-Q**)
   - **`final_doctor_approval_required` = true**

4. An **unresolved** slot **must not** automatically invalidate a **valid** slot.

5. Valid-slot evidence **must not** qualify an unresolved slot.

6. **Patient-level** when ≥ **1** slot resolved and ≥ **1** slot unresolved:
   - **`automatic_formula_split` = true**
   - **`split_status` = `PARTIALLY_RESOLVED_BY_CONTROLLED_SPLIT`**
   - **`patient_resolution_status` = `PARTIALLY_RESOLVED`**
   - **`prescription_status` = `PROPOSED_PENDING_DOCTOR_REVIEW`**
   - **`final_doctor_approval_required` = true**

7. Partial resolution **≠** final prescription issuance — **doctor-facing draft candidate only**.

8. **Patient-wide gates** (supersede valid-slot draft for **all** prescription outputs when active):
   - Emergency / crisis safety gate (**Q06C**)
   - patient-wide contraindication
   - **D13-HS** verified age **&lt; 1 year**
   - unsafe or unresolved identity / age required for applicable safety rule
   - any existing patient-wide prescription-hold gate

   When active:
   - **`prescription_status` = `PRESCRIPTION_HOLD`**
   - **`automatic_issuance` = false**
   - **`selected_dilution`** **not** usable for final issuance
   - **`URGENT_ESCALATION`** where applicable (**Q9-H**)

9. **Same-target polarity contradiction** is **not** partial split (**Q9-B**):
   - **`disease_polarity_status` = `POLARITY_CONTRADICTORY`**
   - **`slot_resolution_status` = `UNRESOLVED`**
   - **`slot_potency_status` = `UNRESOLVED`**
   - **`selected_dilution` = null**

10. **Invalid-item isolation:** invalid item logged in audit; resolution **re-runs** on usable pool only — valid pool **not** destroyed.

#### **Q9-O — Rule 2 upstream authority (Blocker 2 — owner-approved)**

1. **Rule 2** disease-polarity engine is the **sole upstream authority** for target / formula-slot **`disease_polarity`** and **`required_therapeutic_polarity`** annotation (**5R-4D-PB** · [rule-02-polarity-engine.md](./rule-02-polarity-engine.md) — **Rule 2 clinical body not mutated in this pass**).

2. **Question 9 must not:** create · infer · mutate polarity; bypass **Rule 2**; coerce patient-level **MIXED** label into slot-level **POSITIVE** / **NEGATIVE**.

3. **Q9** split / evaluate **only** slots whose polarity **Rule 2** already resolved **independently**.

4. When target polarity is **missing** · **invalid** · **ambiguous** · **contradictory** · **MIXED without separable target evidence** — **Q7** / **Q8** cascade **must not** open for that slot:

   | Field | Value |
   |-------|--------|
   | **`target_disease_polarity`** | **null** or upstream unresolved value **preserved** |
   | **`slot_resolution_status`** | **`UNRESOLVED`** |
   | **`selected_cascade`** | **null** |
   | **`selected_dilution`** | **null** |
   | **`reason_codes`** | **`UPSTREAM_TARGET_POLARITY_NOT_RESOLVED`** (minimum) |

5. Patient-level **MIXED** = **descriptive summary only** — **not** a formula-slot polarity selector (**Q9-F** preserved).

#### **Q9-P — Registry and legacy selector quarantine (Blocker 3 — owner-approved)**

| Field | Value |
|-------|--------|
| **`REGISTRY_POTENCY_LOGIC_AUDIT_PENDING`** | **true** (continues **Q8-N** global audit) |
| **`registry_q9_selector_status`** | **`NOT_EXECUTABLE_AS_Q9_SELECTOR`** |

**Prohibited as independent Q9 authority** (automatic split · polarity · potency select/override):

- **`medicines.v1.json`** **`potency_logic`**
- disease-name lookup · keyword mapping · historical **MIXED** ladder
- legacy formula registry · **116k** dataset alignment · nearest-match pathology/disease row · static disease→potency mapping

Registry / data may supply **supporting metadata only** — **must not:** resolve target polarity; split **MIXED** into **POS** / **NEG**; open **Q7** / **Q8**; set **`selected_dilution`**; override **Rule 2** or **Q9-E** gates.

On conflict: **Q09-CLOSE** + **Rule 2** authority prevail. Minimum **`reason_codes`:** **`REGISTRY_Q9_SELECTOR_BLOCKED`**.

#### **Q9-Q — Canonical state machines and failure matrix (Blocker 4 — owner-approved)**

**A. `question_9_status` (documentation lifecycle — do not conflate with runtime potency outcome):**

`NOT_STARTED` · `OWNER_DECISION_RECORDED` · `CLOSURE_VALIDATION_PENDING` · `CLOSED` · `NOT_IMPLEMENTED`

**B. `split_status`:**

`NOT_EVALUATED` · `RESOLVED_BY_CONTROLLED_SPLIT` · `PARTIALLY_RESOLVED_BY_CONTROLLED_SPLIT` · `POLARITY_CONTRADICTORY` · `INSUFFICIENT_TARGET_SEPARATION` · `TARGET_BINDING_MISSING` · `SPLIT_NOT_APPLICABLE` · `UNRESOLVED` · `BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE`

**C. `slot_resolution_status`:**

`NOT_EVALUATED` · `RESOLVED_DRAFT_CANDIDATE` · `UNRESOLVED` · `POLARITY_CONTRADICTORY` · `TARGET_BINDING_MISSING` · `INSUFFICIENT_CORROBORATION` · `INVALID_EVIDENCE` · `BLOCKED_BY_SAFETY_GATE`

**D. `patient_resolution_status`:**

`RESOLVED` · `PARTIALLY_RESOLVED` · `UNRESOLVED` · `BLOCKED`

**E. `prescription_status` (Q9 slice — cross-ref existing gates):**

`PROPOSED_PENDING_DOCTOR_REVIEW` · `PRESCRIPTION_HOLD` · `NOT_GENERATED` · **`FINAL_DOCTOR_APPROVAL_REQUIRED`** (aligns with **`final_doctor_approval_required`** / **5R-DRG** — integration maps to existing **`doctor_review_required`**; **does not** replace **D13-HS** **`prescription_status = BLOCKED`**)

**Deterministic failure matrix:**

| Condition | `split_status` | Slot outcome | Minimum `reason_codes` |
|-----------|----------------|--------------|-------------------------|
| All distinct slots pass **Q9-E** | `RESOLVED_BY_CONTROLLED_SPLIT` | Each slot per **Q7** / **Q8** | `RESOLVED_BY_CONTROLLED_SPLIT` |
| Some slots pass, some fail | `PARTIALLY_RESOLVED_BY_CONTROLLED_SPLIT` | Valid → `RESOLVED_DRAFT_CANDIDATE`; failed → `UNRESOLVED` | `PARTIAL_SPLIT_REQUIRES_DOCTOR_REVIEW` |
| Same-target POS/NEG conflict | `POLARITY_CONTRADICTORY` | `UNRESOLVED` | `POLARITY_CONTRADICTORY` |
| Fewer than 2 distinct targets | `INSUFFICIENT_TARGET_SEPARATION` | No automatic split | `INSUFFICIENT_TARGET_SEPARATION` |
| Duplicate wording / target | `INSUFFICIENT_TARGET_SEPARATION` | Duplicate not separately resolved | `DUPLICATE_TARGET_NOT_SPLIT` |
| Target binding missing | `TARGET_BINDING_MISSING` | Affected slot `UNRESOLVED` | `TARGET_BINDING_MISSING` |
| Polarity not resolved by **Rule 2** | `UNRESOLVED` | Affected slot `UNRESOLVED` | `UPSTREAM_TARGET_POLARITY_NOT_RESOLVED` |
| Cross-formula evidence leakage | `UNRESOLVED` | Affected slot `UNRESOLVED` | `CROSS_FORMULA_POLARITY_LEAKAGE_BLOCKED` |
| Registry attempts selection | `SPLIT_NOT_APPLICABLE` or prior split state unchanged | Registry ignored | `REGISTRY_Q9_SELECTOR_BLOCKED` |
| Patient-wide crisis / safety hold | `BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE` | All issuance blocked | `PRESCRIPTION_HOLD` |
| **MIXED** label only | `UNRESOLVED` | No cascade | `MIXED_LABEL_NOT_A_POTENCY_SELECTOR` |
| **SUPPORT_ONLY** only | `SPLIT_NOT_APPLICABLE` | Deferred | `SUPPORT_ONLY_DEFERRED_TO_Q11` |

**Owner approval (blocker resolution):** **Q9-N** · **Q9-O** · **Q9-P** · **Q9-Q** recorded — **Decisions 1–14** and **Q8-A**–**Q8-P** clinical text **unchanged**.

**STOP — WAIT FOR QUESTION 9 POST-BLOCKER FINAL VALIDATION** *(superseded — Q09-CLOSE formal closure recorded above.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 10 READ-ONLY AUDIT** *(superseded — Question **10** owner specification recorded below.)*

### Phase 5R-4D-Q10-CLOSE — RESOLVED NEUTRAL DISEASE-STATE NON-POTENCY CONTRACT (**Clinical Question 10**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **RESOLVED NEUTRAL DISEASE-STATE NON-POTENCY CONTRACT**

**Owner approval:** Question **10** clinical specification recorded (**Q10-A**–**Q10-Q**). **Question 7** remains **FULLY_RESOLVED** (**Decisions 1–14** unchanged). **Question 8** / **Question 9** remain **CLOSED** · **NOT_IMPLEMENTED** (**Q8-A**–**Q8-P** · **Q9-A**–**Q9-Q** unchanged). **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED**. **SUPPORT_ONLY** final potency rule remains **Question 11** (**deferred**).

**Owner approval (formal closure):** Question **10** final validation **READY_TO_CLOSE** accepted — **Q10-CLOSE** recorded **CLOSED** (**Q10-A**–**Q10-Q** clinical text **unchanged**; **`execution_status = NOT_IMPLEMENTED`** · **`automatic_neutral_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** unchanged).

**Formal closure:** **Q10-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · prior **CLOSURE_VALIDATION_PENDING** superseded by owner acceptance.

#### **Q10-A — Canonical scope**

**Applies only** when upstream **Rule 2** has recorded for **that formula-target slot**:

- **`disease_polarity` = NEUTRAL**
- **`disease_polarity_status` = RESOLVED**
- **`required_therapeutic_polarity` = NEUTRAL**

**Does not apply** when:

- disease polarity **missing** · **invalid** · **ambiguous** · **contradictory**
- **`disease_polarity` = UNRESOLVED**
- **SUPPORT_ONLY** evidence / slot
- patient-level **MIXED** label (without **Q9** separable **POS/NEG** targets per slot)
- **Q9** separable **POSITIVE** / **NEGATIVE** targets (those slots use **Q7** / **Q8** / **Q9** — not **Q10**)
- **“neutral”**, **“balanced”**, or **“fluctuating”** keyword alone

#### **Q10-B — Automated system outcome (resolved NEUTRAL slot)**

Deterministic Rule 4 potency annotation for **Q10-A** scope:

| Field | Value |
|-------|--------|
| **`neutral_slot_status`** | **`RESOLVED_NEUTRAL_NON_POTENCY`** |
| **`potency_status`** | **`POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET`** |
| **`selected_cascade`** | **`NONE`** |
| **`selected_dilution`** | **null** |
| **`automatic_potency_selection`** | **false** |
| **`neutral_slot_role`** | **`NON_POTENCY_ANNOTATION`** |
| **`final_doctor_approval_required`** | **true** |

**`POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET`** is the **automated Rule 4 potency outcome** — **not** a request for the doctor to choose dilution during engine execution (**5R-SDG**).

**Q10** sets **potency boundary only** — **must not** auto-determine medicine selection, formula composition, or other-route therapy.

#### **Q10-C — No neutral dilution ladder**

**Prohibited** automatic dilution for resolved **NEUTRAL** target: **D1**, **D2**, **D3**, **D5**, **D10**, **D30**, **D60**.

**Prohibited shortcuts (legacy / inference — rejected):**

| Shortcut | Status |
|--------|--------|
| **NEUTRAL → D2** · **NEUTRAL → D5** | **REJECTED** |
| **NEUTRAL + ACUTE → D3/D5** · **NEUTRAL + SUB_ACUTE → D10** | **REJECTED** |
| **NEUTRAL + CHRONIC → D30** · **NEUTRAL + DEEP_CHRONIC → D60** | **REJECTED** |
| **missing polarity → NEUTRAL** · **contradictory → NEUTRAL** | **REJECTED** |
| **SUPPORT_ONLY → NEUTRAL disease** | **REJECTED** |
| **WE electricity → oral neutral potency** | **REJECTED** (**Q10-K**) |
| registry / disease name → neutral potency | **REJECTED** (**Q10-L**) |
| forced non-null dilution | **REJECTED** |

#### **Q10-D — NEUTRAL is not D2**

- **D2** = **dilution-force** label (**NEUTRAL/MODERATING** direction) on **verified NEGATIVE disease** (**Q08-CLOSE** **Q8-A**–**Q8-P** — text **unchanged**).
- **`disease_polarity` = NEUTRAL** **must not** open **D2** or any **D1–D60** candidate.
- Homonym **“NEUTRAL”** (disease polarity vs **D2** dilution-force) **must not** be treated as equivalent.

#### **Q10-E — Fluctuation separation**

Clinical **fluctuation** **≠** **NEUTRAL** disease polarity.

| Case | Path |
|------|------|
| **POSITIVE** polarity + fluctuating symptoms | **Q7** cascade only — **no** automatic **D5** default |
| **NEGATIVE** polarity + fluctuating symptoms | **Q8** cascade only — **no** automatic **D2** default |
| Same target contemporaneous **POS + NEG** contradiction | **`disease_polarity_status` = POLARITY_CONTRADICTORY** · **`potency_status` = UNRESOLVED** · **`selected_cascade` = null** · **`selected_dilution` = null** · **Q9-B** same-target contract |
| Distinct verified **POS** + **NEG** targets | **Q9** controlled automatic split |
| Polarity change over time | **No** historical overwrite · resolve **current** manifestation from **new time-stamped** evidence only · **no** transition infer without new evidence |

#### **Q10-F — UNRESOLVED and SUPPORT_ONLY separation**

| Case | Q10 | Potency |
|------|-----|---------|
| **1 — Resolved NEUTRAL** disease target | **Q10 applies** | **`POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET`** · **`selected_dilution` = null** |
| **2 — Missing / invalid / ambiguous / contradictory** disease polarity | **Q10 does not apply** | **`potency_status` = UNRESOLVED** · **`selected_dilution` = null** · **Question 11** boundary |
| **3 — SUPPORT_ONLY** | **Not** NEUTRAL disease · **no** independent formula/potency candidate | **Question 11** deferred · **`SUPPORT_ONLY_DEFERRED_TO_Q11`** |

Uncertainty **must not** be overwritten as **resolved NEUTRAL**.

#### **Q10-G — Rule 2 upstream authority**

**Rule 2** remains sole upstream authority for target **`disease_polarity`** / **`required_therapeutic_polarity`** ([rule-02-polarity-engine.md](./rule-02-polarity-engine.md) — **Rule 2 clinical body not mutated**).

**Q10 must not:** create · infer · mutate polarity; bypass **Rule 2**; assign **NEUTRAL** from keyword; coerce **UNRESOLVED → NEUTRAL**.

**Q10 applies only** non-potency outcome on **Rule 2-verified RESOLVED NEUTRAL** slots (**Q10-A**).

#### **Q10-H — Multi-formula isolation**

Per slot (same patient):

| Slot polarity | Contract |
|---------------|----------|
| **POSITIVE** | **Q7** |
| **NEGATIVE** | **Q8** |
| **MIXED** (separable) | **Q9** |
| **Resolved NEUTRAL** | **Q10** non-potency |
| **SUPPORT_ONLY** / **UNRESOLVED** | **Q11** pending |

**NEUTRAL** slot **must not** block valid **POS/NEG** siblings · **must not** borrow sibling evidence · **must not** leak evidence · **must not** set patient-global potency.

**Cross-formula evidence leakage** **prohibited** — **`CROSS_FORMULA_NEUTRAL_LEAKAGE_BLOCKED`**.

#### **Q10-I — Phase, severity, temperament, age**

**None** of the following **alone** may select numeric potency for **resolved NEUTRAL** target: phase · duration · severity · temperament · constitution · age · disease name · organ/system · pathology keyword · report keyword.

Temperament **must not** invent a **NEUTRAL** dilution candidate. **D13-C** pediatric matrix applies only when a numeric cascade candidate exists — **Q10** creates **none**. **D13-HS** verified **&lt; 1 year** **supersedes** all paths.

#### **Q10-J — Safety precedence**

**Precedence above Q10:** Emergency/crisis (**Q06C**) · **D13-HS** · **Q06C** cardiac/BP · contraindications · identity/age safety · prescription-hold rules.

**Crisis:** **`URGENT_ESCALATION`** · **`PRESCRIPTION_HOLD`** · **`selected_dilution` = null** · **no** clinical prescription issuance. **`POTENCY_NOT_APPLICABLE`** **must not** override crisis hold.

#### **Q10-K — Electricity and route separation**

**WE = NEUTRAL** (electricity reference) **≠** oral Rule 4 potency.

**Q10 must not** auto: create oral medicine/formula · copy to Tablet **A/B** · select electricity · create external application · fix medicine on any route. Each route: independent engine + evidence binding (**Q5** / **Q9-I** alignment).

#### **Q10-L — Registry quarantine**

| Field | Value |
|-------|--------|
| **`registry_q10_selector_status`** | **`NOT_EXECUTABLE_AS_Q10_SELECTOR`** |
| **`REGISTRY_POTENCY_LOGIC_AUDIT_PENDING`** | continues (**Q9-P** / **Q8-N** global audit) |

**Prohibited as Q10 selector authority:** **`medicines.v1.json`** **`potency_logic`** · disease-name lookup · keyword mapping · legacy **MIXED/NEUTRAL** fallback · legacy formula registry · **116k** alignment · nearest-match disease/pathology · static disease→potency mapping · **WE** electricity mapping.

Registry **must not** select **D1–D60** for **NEUTRAL** target. Minimum **`reason_codes`:** **`REGISTRY_Q10_SELECTOR_BLOCKED`**.

#### **Q10-M — Output schema (minimum fields)**

`question_10_status` · `formula_slot_id` · `formula_target_id` · `disease_polarity` · `disease_polarity_status` · `required_therapeutic_polarity` · `neutral_slot_status` · `neutral_slot_role` · `potency_status` · `selected_cascade` · `selected_dilution` · `evidence_item_ids` · `evidence_source_ids` · `resolution_status` · `limitation_codes` · `reason_codes` · `registry_q10_selector_status` · `final_doctor_approval_required` · `prescription_status` · `execution_status` · `automatic_neutral_potency_runtime` · `current_runtime_potency_delta`

**Namespaces:** status / limitation / reason-code fields **separate** (**Q10-N**).

#### **Q10-N — Canonical statuses and reason codes**

**`question_10_status`:** `NOT_STARTED` · `OWNER_DECISION_RECORDED` · `CLOSURE_VALIDATION_PENDING` · `CLOSED` · `NOT_IMPLEMENTED`

**`neutral_slot_status`:** `NOT_EVALUATED` · `RESOLVED_NEUTRAL_NON_POTENCY` · `NOT_APPLICABLE` · `BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE`

**`potency_status` (Q10-relevant):** `POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET` · `UNRESOLVED` · `BLOCKED_BY_SAFETY_GATE`

**Reason codes (minimum):** `RESOLVED_NEUTRAL_NON_POTENCY` · `NEUTRAL_LABEL_NOT_A_NUMERIC_POTENCY_SELECTOR` · `NEUTRAL_D2_EQUIVALENCE_REJECTED` · `NEUTRAL_D5_DEFAULT_REJECTED` · `FLUCTUATION_NOT_NEUTRAL_POLARITY` · `FLUCTUATION_NOT_A_POTENCY_SELECTOR` · `UPSTREAM_NEUTRAL_POLARITY_NOT_VERIFIED` · `UNRESOLVED_POLARITY_NOT_NEUTRAL` · `SUPPORT_ONLY_NOT_NEUTRAL_DISEASE` · `SUPPORT_ONLY_DEFERRED_TO_Q11` · `CROSS_FORMULA_NEUTRAL_LEAKAGE_BLOCKED` · `REGISTRY_Q10_SELECTOR_BLOCKED` · `ELECTRICITY_NEUTRAL_NOT_ORAL_POTENCY` · `PRESCRIPTION_HOLD`

#### **Q10-O — Failure / outcome matrix**

| Condition | Q10 outcome | Potency outcome | Minimum reason code |
|-----------|-------------|-----------------|---------------------|
| Rule 2 resolved **NEUTRAL** target (**Q10-A**) | **`RESOLVED_NEUTRAL_NON_POTENCY`** | **`POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET`**, **null** | **`RESOLVED_NEUTRAL_NON_POTENCY`** |
| “Neutral” keyword only | Not evaluated / unresolved upstream | **UNRESOLVED**, **null** | **`NEUTRAL_LABEL_NOT_A_NUMERIC_POTENCY_SELECTOR`** |
| Polarity missing/invalid | **Q10 N/A** | **UNRESOLVED**, **null** | **`UPSTREAM_NEUTRAL_POLARITY_NOT_VERIFIED`** |
| Same-target contradiction | **Q9** path | **UNRESOLVED**, **null** | **`POLARITY_CONTRADICTORY`** |
| **SUPPORT_ONLY** | Deferred **Q11** | No **Q10** potency | **`SUPPORT_ONLY_DEFERRED_TO_Q11`** |
| **POSITIVE** + fluctuation | **Q7** only | Per **Q7**, no **D5** default | **`FLUCTUATION_NOT_A_POTENCY_SELECTOR`** |
| **NEGATIVE** + fluctuation | **Q8** only | Per **Q8**, no **D2** default | **`FLUCTUATION_NOT_A_POTENCY_SELECTOR`** |
| Registry attempts **D2/D5** | Registry blocked | **Q10** unchanged | **`REGISTRY_Q10_SELECTOR_BLOCKED`** |
| **WE** electricity present | Route isolated | No oral potency | **`ELECTRICITY_NEUTRAL_NOT_ORAL_POTENCY`** |
| **NEUTRAL** sibling + valid **POS/NEG** | Per-slot independent | Neutral **null**; siblings **Q7/Q8** | isolation (**Q10-H**) |
| Crisis / under-one hard stop | Safety blocked | No issuance | **`PRESCRIPTION_HOLD`** |

#### **Q10-P — Execution boundary**

| Field | Value |
|-------|--------|
| **Question 10** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_neutral_potency_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **Rule 4** | **NOT_FROZEN** · **NOT_IMPLEMENTED** |
| **Question 11+** | **NOT_STARTED** / **PENDING** |

#### **Q10-Q — No paid API**

Question **10** **must not** require or permit **paid API**, **paid LLM**, **paid OCR**, or **paid clinical service** dependencies. Future implementation: deterministic local rules · versioned data assets · approved local/self-hosted open-source components only.

**STOP — WAIT FOR QUESTION 10 FINAL CLOSURE VALIDATION** *(superseded — Q10-CLOSE formal closure recorded above.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 11 READ-ONLY AUDIT** *(superseded — Question **11** owner specification recorded below.)*

### Phase 5R-4D-Q11-CLOSE — UNRESOLVED AND SUPPORT_ONLY POTENCY SAFETY BOUNDARY (**Clinical Question 11**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **UNRESOLVED AND SUPPORT_ONLY POTENCY SAFETY BOUNDARY**

**Owner approval:** Question **11** clinical specification recorded (**Q11-A**–**Q11-R**). **Question 7** remains **FULLY_RESOLVED** (**Decisions 1–14** unchanged). **Questions 8–10** remain **CLOSED** · **NOT_IMPLEMENTED** (**Q8-A**–**Q8-P** · **Q9-A**–**Q9-Q** · **Q10-A**–**Q10-Q** unchanged). **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED**. **Rule 2** clinical body **not mutated** — additive authority cross-reference only ([rule-02-polarity-engine.md](./rule-02-polarity-engine.md)).

**Owner approval (formal closure):** Question **11** final validation **READY_TO_CLOSE** accepted — **Q11-CLOSE** recorded **CLOSED** (**Q11-A**–**Q11-R** clinical text **unchanged**; **`execution_status = NOT_IMPLEMENTED`** · **`automatic_unresolved_potency_runtime = FALSE`** · **`automatic_support_only_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** unchanged).

**Formal closure:** **Q11-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · prior **CLOSURE_VALIDATION_PENDING** superseded by owner acceptance.

#### **Q11-A — Canonical scope**

Question **11** handles **two distinct** Rule 2 outcomes — **must not** conflate with each other or with **resolved NEUTRAL** disease (**Q10**):

| Input state | Clinical meaning | Q11 / other contract |
|-------------|------------------|----------------------|
| **UNRESOLVED** | Disease polarity not determinable — evidence **missing**, **invalid**, **ambiguous**, or **contradictory** (non–**Q9-B** path where applicable) | **Q11** — potency **UNRESOLVED** |
| **SUPPORT_ONLY** | **Resolved** supporting role; **not** an independent disease target | **Q11** — potency **NOT_APPLICABLE** |
| **Resolved NEUTRAL** disease | Verified neutral disease state | **Q10** |
| **Same-target POS/NEG contradiction** | Polarity conflict on one target | **Q9-B** |
| **Separable POS/NEG targets** | Controlled split | **Q9** |

#### **Q11-B — UNRESOLVED automated outcome**

When target **disease polarity** is **missing**, **invalid**, **ambiguous**, or **unresolved**, and **no** more specific **closed** rule applies (**Q9-B**, **Q10**, etc.), deterministic Rule 4 potency annotation:

| Field | Value |
|-------|--------|
| **`unresolved_slot_status`** | **`UNRESOLVED`** |
| **`potency_status`** | **`UNRESOLVED`** |
| **`selected_cascade`** | **null** |
| **`selected_dilution`** | **null** |
| **`automatic_potency_selection`** | **false** |
| **`prescription_candidate_status`** | **`NOT_GENERATED_FOR_UNRESOLVED_SLOT`** |
| **`final_doctor_approval_required`** | **true** |

**Automated safety outcome** — **not** a request for the doctor to choose dilution **during** engine execution (**5R-SDG**). **No** interactive potency follow-up during analysis; reasons appear in the **complete summary**; doctor may review/correct **after** analysis completes.

#### **Q11-C — SUPPORT_ONLY automated outcome**

For Rule 2–verified **`disease_polarity` = SUPPORT_ONLY**:

| Field | Value |
|-------|--------|
| **`support_slot_status`** | **`RESOLVED_SUPPORT_ROLE`** |
| **`potency_status`** | **`POTENCY_NOT_APPLICABLE_FOR_SUPPORT_ONLY_SLOT`** |
| **`selected_cascade`** | **`NONE`** |
| **`selected_dilution`** | **null** |
| **`automatic_potency_selection`** | **false** |
| **`independent_formula_candidate`** | **false** |
| **`independent_medicine_candidate`** | **false** |
| **`independent_potency_candidate`** | **false** |
| **`final_doctor_approval_required`** | **true** |

**Must not** label **SUPPORT_ONLY** as **UNRESOLVED** — support role is **resolved**.

**SUPPORT_ONLY must not:** create independent disease target · select independent medicine · create independent formula · select independent potency · open **Q7/Q8/Q9/Q10** cascade · set patient-global polarity.

#### **Q11-D — Controlled support participation**

**SUPPORT_ONLY** evidence may **support** a **pre-existing qualified** formula/target **only** when:

- an **existing frozen rule** explicitly permits that support dimension;
- formula-target binding **valid**;
- evidence **usable**;
- **Q07C-CLOSE-D08** source-quality rules **pass**;
- **Q07C-D07P-MICRO Q-L** deduplication applies;
- context and negation validation **pass**;
- **no** cross-formula leakage.

**SUPPORT_ONLY evidence must not:** replace primary disease evidence · resolve missing polarity · open candidate groups · create **D1–D60** candidates · auto-pass phase/severity/pathology gates · mutate primary target · exceed explicitly permitted roles (e.g. frozen temperament tie-breaker scope).

If **no** frozen rule permits support use → **audit annotation only**.

#### **Q11-E — Therapeutic NEUTRAL fallback is not a potency**

Rule 2 may set **`required_therapeutic_polarity` = NEUTRAL** for **UNRESOLVED** or **SUPPORT_ONLY**.

This **is not:** resolved **NEUTRAL** disease · **Q10** eligibility · **D2** selection · **D5** selection · any neutral numeric ladder.

**Owner-confirmed dose semantics (unchanged):**

| Disease pathway | Therapeutic pathway | Active / balancing doses |
|-----------------|---------------------|---------------------------|
| **NEGATIVE** disease | **POSITIVE** treatment | **D1** = FAST_OR_ACTIVE · **D2** = NEUTRAL_BALANCING (**Q8**) |
| **POSITIVE** disease | **NEGATIVE** treatment | **D3** = FIRST_OR_ACTIVE · **D5** = NEUTRAL_BALANCING (**Q7/CLOSE-D05**) |

**UNRESOLVED/SUPPORT_ONLY** open **no** **POSITIVE/NEGATIVE** candidate group → **D2/D5** balancing doses **must not** open.

#### **Q11-F — No silent default**

**Prohibited mappings (legacy / inference — rejected):**

| Shortcut | Status |
|--------|--------|
| missing polarity → **MIXED** · missing → **NEUTRAL** disease | **REJECTED** |
| **UNRESOLVED → D2/D5** · **UNRESOLVED + phase → D10/D30/D60** | **REJECTED** |
| **SUPPORT_ONLY → D2/D5** · independent formula · patient-global polarity | **REJECTED** |
| ambiguity → maximum potency · contradiction → arbitrary “safer” dilution | **REJECTED** |
| engine **must always** return numeric dilution | **REJECTED** |

**Null dilution** is a **valid** automated safety outcome.

#### **Q11-G — Input-failure separation**

Distinct **`reason_codes`** even when final potency is **null**:

| Case | Outcome | Minimum **`reason_codes`** |
|------|---------|----------------------------|
| **1 — Missing polarity** | **`potency_status` = UNRESOLVED** · **`selected_dilution` = null** | **`DISEASE_POLARITY_MISSING`** |
| **2 — Invalid polarity** | Invalid item **preserved** in audit; re-evaluate on **valid pool** if present; if still unresolved → **UNRESOLVED** | **`DISEASE_POLARITY_INVALID`** |
| **3 — Ambiguous polarity** | Usable evidence but no definite classification → **UNRESOLVED** | **`DISEASE_POLARITY_AMBIGUOUS`** |
| **4 — Generic contradictory polarity** | **UNRESOLVED** | **`DISEASE_POLARITY_CONTRADICTORY`** |
| **Same-target POS/NEG** | **Q9-B** path | **`POLARITY_CONTRADICTORY`** (canonical) |

One invalid evidence item **must not** destroy the remaining **valid** pool (**Q9-N** §10 alignment).

#### **Q11-H — Evidence audit before safe stop**

Before **UNRESOLVED** potency outcome, run applicable audit pipeline:

**Rule 2** authority · **Q07C-CLOSE-D08** · **Q-L** deduplication · formula-target binding · organ/site binding · context validation · negation validation · doctor structured evidence · applicable non-doctor corroboration.

When polarity remains **UNRESOLVED:**

- **Q7/Q8** candidate groups **must not** open;
- potency pipeline **safely stops** at **null**;
- **no** mid-analysis doctor potency questions;
- complete evidence/reason audit in summary.

**SUPPORT_ONLY:** **D08/Q-L** may run for **support-role validity only** — **not** to create potency candidates.

#### **Q11-I — Multi-formula partial resolution**

Per **Q9-N** (clinical text **unchanged**): each formula slot resolves **independently**.

| Patient mix | Valid treatment slot | UNRESOLVED sibling | SUPPORT_ONLY sibling |
|-------------|----------------------|--------------------|----------------------|
| Partial | **`RESOLVED_DRAFT_CANDIDATE`** per **Q7/Q8** | **`UNRESOLVED`** · **`selected_dilution` = null** | **`RESOLVED_SUPPORT_ROLE`** · **null** dilution · **not** unresolved failure |
| Patient-level | **`patient_resolution_status` = PARTIALLY_RESOLVED** when mix of resolved + unresolved | | |
| Prescription slice | **`prescription_status` = PROPOSED_PENDING_DOCTOR_REVIEW** · **`final_doctor_approval_required` = true** | | |

Valid slot **must not** be destroyed by unresolved/support sibling. **No** evidence borrowing · **no** cross-formula leakage.

#### **Q11-J — Patient-wide safety precedence**

**Precedence above Q11 slot outcomes:** Emergency/crisis (**Q06C**) · **D13-HS** verified **&lt; 1 year** · patient-wide contraindication · required identity/age safety failure · **Q06C** cardiac/BP · prescription-hold gates.

When active:

- **`patient_resolution_status` = BLOCKED**
- **`prescription_status` = PRESCRIPTION_HOLD** (or existing **D13-HS** **BLOCKED**)
- **`automatic_issuance` = false**
- **`selected_dilution`** not usable for final issuance
- **`URGENT_ESCALATION`** where applicable

#### **Q11-K — Route isolation**

**UNRESOLVED** or **SUPPORT_ONLY** oral slot **must not** automatically:

- create Tablet Section **A/B** medicine/formula;
- select **electricity**;
- create **external application** formula;
- copy potency across routes.

Each route: independent clinical selection and evidence binding (**Q5** / **Q8-M** / **Q9-I** / **Q10-K** alignment). **SUPPORT_ONLY** on one route **must not** become an independent candidate on another (**`CROSS_ROUTE_SUPPORT_LEAKAGE_BLOCKED`**).

#### **Q11-L — Registry and legacy quarantine**

| Field | Value |
|-------|--------|
| **`registry_q11_selector_status`** | **`NOT_EXECUTABLE_AS_Q11_SELECTOR`** |
| **`REGISTRY_POTENCY_LOGIC_AUDIT_PENDING`** | continues (**Q8-N** / **Q9-P** / **Q10-L**) |

**Prohibited as Q11 selector authority:** **`medicines.v1.json`** **`potency_logic`** · disease-name lookup · keyword mapping · historical **empty→MIXED** fallback · legacy **MIXED** ladder · static disease→potency mapping · historical formula registry · **116k** alignment · nearest-match disease/pathology · **WE** electricity · phase/severity-only shortcut · temperament-only shortcut.

Registry **must not** coerce uncertainty to resolved polarity or **SUPPORT_ONLY** to independent candidate. Minimum **`reason_codes`:** **`REGISTRY_Q11_SELECTOR_BLOCKED`**.

#### **Q11-M — Output schema (minimum fields)**

`question_11_status` · `formula_slot_id` · `formula_target_id` · `disease_polarity` · `disease_polarity_status` · `required_therapeutic_polarity` · `unresolved_slot_status` · `support_slot_status` · `support_role` · `independent_formula_candidate` · `independent_medicine_candidate` · `independent_potency_candidate` · `potency_status` · `selected_cascade` · `selected_dilution` · `evidence_item_ids` · `evidence_source_ids` · `resolution_status` · `patient_resolution_status` · `prescription_status` · `limitation_codes` · `reason_codes` · `registry_q11_selector_status` · `final_doctor_approval_required` · `automatic_issuance` · `execution_status` · `automatic_unresolved_potency_runtime` · `automatic_support_only_potency_runtime` · `current_runtime_potency_delta`

**Namespaces:** lifecycle status · clinical status · limitation codes · reason codes **separate** (**Q11-N**).

#### **Q11-N — Canonical statuses and reason codes**

**`question_11_status`:** `NOT_STARTED` · `OWNER_DECISION_RECORDED` · `CLOSURE_VALIDATION_PENDING` · `CLOSED` · `NOT_IMPLEMENTED`

**`unresolved_slot_status`:** `NOT_EVALUATED` · `UNRESOLVED` · `BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE`

**`support_slot_status`:** `NOT_EVALUATED` · `RESOLVED_SUPPORT_ROLE` · `INVALID_SUPPORT_EVIDENCE` · `BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE`

**`potency_status` (Q11-relevant):** `UNRESOLVED` · `POTENCY_NOT_APPLICABLE_FOR_SUPPORT_ONLY_SLOT` · `BLOCKED_BY_SAFETY_GATE`

**Reason codes (minimum):** `DISEASE_POLARITY_MISSING` · `DISEASE_POLARITY_INVALID` · `DISEASE_POLARITY_AMBIGUOUS` · `DISEASE_POLARITY_CONTRADICTORY` · `UPSTREAM_TARGET_POLARITY_NOT_RESOLVED` · `SUPPORT_ONLY_RESOLVED_SUPPORT_ROLE` · `SUPPORT_ONLY_NOT_A_DISEASE_TARGET` · `SUPPORT_ONLY_NOT_AN_INDEPENDENT_FORMULA` · `SUPPORT_ONLY_NOT_AN_INDEPENDENT_MEDICINE` · `SUPPORT_ONLY_NOT_AN_INDEPENDENT_POTENCY` · `THERAPEUTIC_NEUTRAL_FALLBACK_NOT_A_DILUTION` · `UNRESOLVED_D2_DEFAULT_REJECTED` · `UNRESOLVED_D5_DEFAULT_REJECTED` · `CROSS_FORMULA_SUPPORT_LEAKAGE_BLOCKED` · `CROSS_ROUTE_SUPPORT_LEAKAGE_BLOCKED` · `REGISTRY_Q11_SELECTOR_BLOCKED` · `PARTIAL_RESOLUTION_REQUIRES_DOCTOR_REVIEW` · `PRESCRIPTION_HOLD`

#### **Q11-O — Deterministic outcome matrix**

| Condition | Slot status | Potency outcome | Minimum reason code |
|-----------|-------------|-----------------|---------------------|
| Missing polarity | **`UNRESOLVED`** | **null** | **`DISEASE_POLARITY_MISSING`** |
| Invalid polarity, no usable pool | **`UNRESOLVED`** | **null** | **`DISEASE_POLARITY_INVALID`** |
| Invalid item + usable valid pool | Re-evaluate valid pool | Per resolved result or **UNRESOLVED** | **`DISEASE_POLARITY_INVALID`** (audit) |
| Ambiguous evidence | **`UNRESOLVED`** | **null** | **`DISEASE_POLARITY_AMBIGUOUS`** |
| Generic contradiction | **`UNRESOLVED`** | **null** | **`DISEASE_POLARITY_CONTRADICTORY`** |
| Same-target POS/NEG contradiction | **Q9-B** | **null** | **`POLARITY_CONTRADICTORY`** |
| **SUPPORT_ONLY** valid | **`RESOLVED_SUPPORT_ROLE`** | **NOT_APPLICABLE**, **null** | **`SUPPORT_ONLY_RESOLVED_SUPPORT_ROLE`** |
| **SUPPORT_ONLY** invalid | **`INVALID_SUPPORT_EVIDENCE`** | **null** | appropriate invalid-evidence code |
| Valid treatment slot + unresolved sibling | Partial resolution | Valid per **Q7/Q8**; sibling **null** | **`PARTIAL_RESOLUTION_REQUIRES_DOCTOR_REVIEW`** |
| Valid treatment slot + support sibling | Treatment independent | Support **null** | **`SUPPORT_ONLY_NOT_AN_INDEPENDENT_POTENCY`** |
| Registry attempts fallback | Registry ignored | Outcome unchanged | **`REGISTRY_Q11_SELECTOR_BLOCKED`** |
| Crisis / under-one hard stop | Safety blocked | No issuance | **`PRESCRIPTION_HOLD`** |

#### **Q11-P — System behavior and doctor review**

**System (deterministic single pass):** evidence audit · polarity resolution · resolve valid formula slots · **null** potency for unresolved slots · non-potency status for support-only role · complete reasoning summary.

**Doctor:** **not** compelled to choose potency **during** analysis; reads completed summary; final approval or required correction. **No** automatic prescription issuance without required doctor approval.

#### **Q11-Q — Execution boundary**

| Field | Value |
|-------|--------|
| **Question 11** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_unresolved_potency_runtime`** | **FALSE** |
| **`automatic_support_only_potency_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **Rule 4** | **NOT_FROZEN** · **NOT_IMPLEMENTED** |
| **Question 12+** | **NOT_STARTED** / **PENDING** |

#### **Q11-R — No paid API**

Question **11** **must not** require or permit **paid API**, **paid LLM**, **paid OCR**, or **paid clinical service** dependencies. Future implementation: deterministic local rules · versioned data assets · approved local/self-hosted open-source components only.

**STOP — WAIT FOR QUESTION 11 FINAL CLOSURE VALIDATION** *(superseded — Q11-CLOSE formal closure recorded above.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 12 READ-ONLY AUDIT** *(superseded — Question **12** owner specification recorded below.)*

### Phase 5R-4D-Q12-CLOSE — FORMULA-SPECIFIC DISEASE PHASE INTEGRATION AND ACUTE-FLARE-ON-CHRONIC POTENCY CONTRACT (**Clinical Question 12**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **FORMULA-SPECIFIC DISEASE PHASE INTEGRATION AND ACUTE-FLARE-ON-CHRONIC POTENCY CONTRACT**

**Important naming:** **Rule 4 Question 12** = **disease phase integration**. **Q7 Decision 12** / **Q07C-CLOSE-D12** = **temperament matrix** — **must not** be conflated.

**Owner approval:** Question **12** clinical specification recorded (**Q12-A**–**Q12-W**). **Question 7** remains **FULLY_RESOLVED** (**Decisions 1–14** unchanged). **Questions 8–11** remain **CLOSED** · **NOT_IMPLEMENTED**. **Q07C-CLOSE-D09** / **Q07C-CLOSE-D11** clinical text **not rewritten** — **Q12** additive Rule 4 integration only. **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED**.

**Owner approval (formal closure):** Question **12** final validation **READY_TO_CLOSE** accepted — **Q12-CLOSE** recorded **CLOSED** (**Q12-A**–**Q12-W** clinical text **unchanged**; **`execution_status = NOT_IMPLEMENTED`** · **`automatic_phase_runtime = FALSE`** · **`automatic_flare_split_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** · **`PHASE_MULTILINGUAL_TIMELINE_LEXICON = SEPARATE_FREEZE_PENDING`** unchanged).

**Formal closure:** **Q12-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · prior **CLOSURE_VALIDATION_PENDING** superseded by owner acceptance.

#### **Q12-A — Canonical authority**

Question **12** **must not** create a new independent phase engine.

**Canonical phase authorities (unchanged substance):**

- **Q07C-CLOSE-D02** (**CLOSE-D02**)
- **Q07C-CLOSE-D09** (**D09-1**–**D09-10**)
- **Q07C-CLOSE-D11** (**D11-A**–**D11-D** · case table **1–16**)

**Q12** integrates these into the **Rule 4 potency pipeline** only — **must not** rewrite · weaken · or bypass **D09** / **D11**.

#### **Q12-B — Formula-specific phase**

Each **formula-target slot** resolves phase **independently**.

**Minimum fields:** `formula_slot_id` · `formula_target_id` · `target_symptom_or_pathology` · `baseline_phase` · `current_manifestation_phase` · `resolved_phase` · `phase_status` · `phase_resolution_source` · `raw_duration_days` · `phase_evidence_item_ids` · `phase_evidence_source_ids` · `limitation_codes` · `reason_codes`

**Prohibited:** patient-global phase driving all formulas · Formula **A** phase evidence qualifying Formula **B**.

#### **Q12-C — Day-band resolution preserved**

Existing **D11** / **D09** day-band rules **unchanged:**

| Duration (days) | Band |
|-----------------|------|
| **1–14** | **ACUTE** |
| **15–45** | **SUB_ACUTE** |
| **46–90** | **CHRONIC_MODERATE** (**D09-2**) |
| **91+** | **DEEP_CHRONIC** guidance (**D09-2**) — **not** auto **D60** |

Duration = **fallback guidance**, **not** an evidence **vote**. **No** silent **ACUTE** on missing duration.

When **exact structured duration** is valid and **no** contradictory usable phase evidence: **`phase_status` = `RESOLVED_BY_DAY_BAND`** · **`resolved_phase`** = applicable band (per **D11**).

#### **Q12-D — Evidence override and contradiction**

Preserve **D09/D11** corroboration: doctor structured phase authority · non-doctor independent usable evidence when doctor absent · **Q07C-CLOSE-D08** · **Q-L** dedupe · formula / organ-site binding · context · negation · duration **not** a vote.

| Outcome | Fields |
|---------|--------|
| Cross-boundary override gates pass | **`phase_status` = `RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE`** |
| Equal/opposing phase evidence — no deterministic resolution | **`phase_status` = `PHASE_CONTRADICTORY`** · **`resolved_phase` = null** · **`potency_status` = UNRESOLVED** · **`selected_dilution` = null** · **`final_doctor_approval_required` = true** |

#### **Q12-E — Missing, invalid and ambiguous phase**

| Case | `phase_status` | Potency | Minimum `reason_codes` |
|------|----------------|---------|-------------------------|
| **Missing** | **`MISSING_EVIDENCE`** | **UNRESOLVED**, **null** | **`PHASE_EVIDENCE_MISSING`** |
| **Invalid** | Invalid item in audit; re-evaluate **valid pool**; if none → **`INVALID_EVIDENCE`** | **UNRESOLVED**, **null** | **`PHASE_EVIDENCE_INVALID`** |
| **Ambiguous** | **`PHASE_AMBIGUOUS`** | **UNRESOLVED**, **null** | **`PHASE_EVIDENCE_AMBIGUOUS`** |

One invalid item **must not** destroy the valid evidence pool.

#### **Q12-F — Phase alone never selects potency**

**Phase** is **one gate** in the cascade — **must not** alone select numeric dilution.

**Prohibited shortcuts:**

| Shortcut | Status |
|--------|--------|
| **ACUTE alone → D3/D5** · **SUB_ACUTE alone → D10** · **CHRONIC alone → D10** · **DEEP_CHRONIC alone → D60** · **Flare alone → D30** | **REJECTED** |
| **Missing phase → ACUTE** · vague timeline keywords (**Q12-N**) | **REJECTED** |
| Phase → disease / therapeutic polarity · severity · temperament | **REJECTED** |

All dilution outcomes require applicable **Q7/Q8/Q9–Q11**, severity, polarity, evidence, and safety gates.

#### **Q12-G — POSITIVE disease phase paths**

Verified **POSITIVE** disease + **NEGATIVE** therapeutic — existing **Q7** cascade **unchanged**:

| `resolved_phase` / condition | Path (when all gates pass) |
|------------------------------|----------------------------|
| **ACUTE** + sev **1–6** | **D3/D5** via **CLOSE-D05** |
| **SUB_ACUTE** | **D10** Path **B** |
| **CHRONIC_MODERATE** | **D10** Path **C** |
| **DEEP_CHRONIC** | **D60** only after complete common + triple gates; gate fail + common complete → **D10** fallback (**CLOSE-D03**); common missing/contradictory → **UNRESOLVED** (no **D10** fallback) |
| Sev **7–10** | **D30** only after complete **Q07C-D30F**; sev alone **≠ D30**; crisis first |

#### **Q12-H — NEGATIVE disease path**

**Q08-CLOSE** combined selector: **D1** = POSITIVE therapeutic **FAST_OR_ACTIVE** · **D2** = POSITIVE therapeutic **NEUTRAL_BALANCING**.

**Phase** = one **Q8-B** input only — **must not** alone select **D1/D2**. Resolved phase **must not** override **Q8-C/D**, cardiac/BP, severity, sensitivity, pediatric boundaries.

#### **Q12-I — NEUTRAL, MIXED, UNRESOLVED and SUPPORT_ONLY**

| Slot state | Contract |
|------------|----------|
| Resolved **NEUTRAL** | **Q10** |
| Separable **POS/NEG** | **Q9** |
| Same-target contradiction | **Q9-B** |
| **UNRESOLVED** polarity | **Q11** |
| **SUPPORT_ONLY** | **Q11** |

Valid phase **must not** convert blocked / non-potency states to numeric dilution.

#### **Q12-J — Baseline and current manifestation separation**

**`baseline_phase`** and **`current_manifestation_phase`** stored **separately**.

- Acute flare **must not** overwrite chronic **baseline**
- Chronic baseline **must not** suppress current acute manifestation
- **No** system infer of flare end — new follow-up evidence required (**D09-9** alignment)
- Historical versions in **immutable audit**

**Canonical flare enum:** **`ACUTE_EXACERBATION_ON_CHRONIC`** — **only** on **verified chronic baseline** — **not** “acute-on-acute” on **ACUTE/SUB_ACUTE** baseline.

#### **Q12-K — Acute flare and chronic target slot separation**

When **chronic disease** has **current acute flare** and targets **safely separable**:

**1 — CURRENT ACUTE FLARE slot**

| Field | Value |
|-------|--------|
| **`target_role`** | **`CURRENT_ACUTE_FLARE`** |
| **`current_manifestation_phase`** | **`ACUTE_EXACERBATION_ON_CHRONIC`** |
| **`baseline_phase`** | Preserved chronic phase |
| Evidence / binding | Acute manifestation · current flare target |

**Potency:** Sev **1–6** → **D3/D5** acute pathway **only** after full **Q7** + **CLOSE-D05** gates (**no** auto default) · Sev **7–10** → **D30** only if **Q07C-D30F** complete (**flare/sev alone ≠ D30**).

**2 — UNDERLYING CHRONIC slot**

| Field | Value |
|-------|--------|
| **`target_role`** | **`UNDERLYING_CHRONIC_TARGET`** |
| **`baseline_phase`** | **CHRONIC_MODERATE** or **DEEP_CHRONIC** |
| Flare evidence | **Must not** overwrite chronic baseline binding |

**Potency:** **CHRONIC_MODERATE → D10** · **DEEP_CHRONIC → D60** or **D10** fallback per **Q12-G** / **D09-10**.

**3 — Isolation:** no cross-qualification · no dilution copy · independent polarity/phase/severity/potency · **Q-L** dedupe · **no** false split on duplicate wording alone.

#### **Q12-L — Unsafe or impossible flare split**

If acute flare + underlying chronic **cannot** be safely bound separately:

| Field | Value |
|-------|--------|
| **`automatic_phase_target_split`** | **false** |
| **`phase_status`** | **`PHASE_TARGET_CONTRADICTORY`** |
| **`potency_status`** | **UNRESOLVED** |
| **`selected_dilution`** | **null** |
| **`prescription_status`** | **`PROPOSED_PENDING_DOCTOR_REVIEW`** or safety hold |
| **`final_doctor_approval_required`** | **true** |
| **`reason_codes`** | **`ACUTE_CHRONIC_TARGET_SEPARATION_FAILED`** (minimum) |

**No** inferred **D3/D5/D10/D30/D60**. Same formula name or organ **alone** **≠** two slots — distinct clinical target + evidence binding required.

#### **Q12-M — Partial multi-formula behavior**

Per **Q9-N** (unchanged): safely resolved acute and/or chronic slot may **`RESOLVED_DRAFT_CANDIDATE`** while sibling **UNRESOLVED** · failed sibling **`selected_dilution` = null** · **`patient_resolution_status` = PARTIALLY_RESOLVED** · **`prescription_status` = PROPOSED_PENDING_DOCTOR_REVIEW** · **`final_doctor_approval_required` = true**.

Patient-wide crisis / contraindication / **D13-HS** blocks issuance for **all** slots.

#### **Q12-N — Multilingual timeline lexicon**

| Asset | Status |
|-------|--------|
| **`PHASE_MULTILINGUAL_TIMELINE_LEXICON`** | **`SEPARATE_FREEZE_PENDING`** |
| Vague timeline execution | **`NOT_EXECUTABLE_FOR_VAGUE_TIMELINE_TEXT`** |

Until freeze, **must not** derive phase from: **recent** · **पुराना** · **कुछ दिन** · **कई दिनों से** · **काफी समय से** · **recently worsened** · vague Hindi/English/Hinglish timeline.

**Usable:** exact structured duration integer · doctor structured phase · qualified reports with explicit numeric timeline (existing gates).

Vague timeline: preserve in audit · **`reason_codes` = `VAGUE_TIMELINE_NOT_EXECUTABLE`**.

#### **Q12-O — Safety precedence**

**Order:** (1) Crisis (**Q06C**) (2) **D13-HS** &lt;1y (3) Patient-wide contraindications / holds (4) **Rule 2** polarity (5) Formula-target binding (6) Phase resolution (7) Severity + potency gates (8) Pediatric overlay (9) Final doctor approval.

**Crisis:** **`URGENT_ESCALATION`** · **`PRESCRIPTION_HOLD`** · **`automatic_phase_target_split` = false** · **`selected_dilution` = null** · no prescription issuance.

#### **Q12-P — Route isolation**

Phase-resolved **oral** outcome **must not** auto: Tablet **A/B** · electricity · external application · cross-route potency copy. Each route: independent target, evidence, selection (**Q8-M** / **Q9-I** / **Q10-K** / **Q11-K** alignment).

#### **Q12-Q — Registry and legacy quarantine**

| Field | Value |
|-------|--------|
| **`registry_q12_selector_status`** | **`NOT_EXECUTABLE_AS_Q12_SELECTOR`** |
| **`REGISTRY_PHASE_LOGIC_AUDIT_PENDING`** | **true** |

**Prohibited selectors:** legacy phase keyword lists · missing phase → **ACUTE** · disease-name mapping · **`medicines.v1.json`** **`potency_logic`** · historical formula registry · **116k** alignment · nearest-match · phase string alone · vague OCR timeline phrase.

**Reason codes:** **`REGISTRY_Q12_SELECTOR_BLOCKED`** · **`LEGACY_MISSING_PHASE_ACUTE_DEFAULT_REJECTED`** · **`LEGACY_PHASE_KEYWORD_SELECTOR_BLOCKED`**.

#### **Q12-R — Output schema (minimum fields)**

`question_12_status` · `formula_slot_id` · `formula_target_id` · `target_role` · `baseline_phase` · `current_manifestation_phase` · `resolved_phase` · `phase_status` · `phase_resolution_source` · `raw_duration_days` · `automatic_phase_target_split` · `phase_evidence_item_ids` · `phase_evidence_source_ids` · `potency_status` · `selected_cascade` · `selected_dilution` · `patient_resolution_status` · `prescription_status` · `limitation_codes` · `reason_codes` · `registry_q12_selector_status` · `final_doctor_approval_required` · `automatic_issuance` · `execution_status` · `automatic_phase_runtime` · `automatic_flare_split_runtime` · `current_runtime_potency_delta`

**Namespaces:** lifecycle · clinical status · limitation · reason codes **separate** (**Q12-S**).

#### **Q12-S — Canonical statuses and reason codes**

**`question_12_status`:** `NOT_STARTED` · `OWNER_DECISION_RECORDED` · `CLOSURE_VALIDATION_PENDING` · `CLOSED` · `NOT_IMPLEMENTED`

**`phase_status`:** `NOT_EVALUATED` · `RESOLVED_BY_DAY_BAND` · `RESOLVED_BY_EVIDENCE` · `RESOLVED_BY_CROSS_BOUNDARY_OVERRIDE` · `PHASE_AMBIGUOUS` · `PHASE_CONTRADICTORY` · `PHASE_TARGET_CONTRADICTORY` · `MISSING_EVIDENCE` · `INVALID_EVIDENCE` · `BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE`

**`target_role`:** `STANDARD_FORMULA_TARGET` · `CURRENT_ACUTE_FLARE` · `UNDERLYING_CHRONIC_TARGET`

**Reason codes (minimum):** `PHASE_EVIDENCE_MISSING` · `PHASE_EVIDENCE_INVALID` · `PHASE_EVIDENCE_AMBIGUOUS` · `PHASE_CONTRADICTORY` · `ACUTE_CHRONIC_TARGET_SEPARATION_FAILED` · `DUPLICATE_PHASE_TARGET_NOT_SPLIT` · `CROSS_FORMULA_PHASE_LEAKAGE_BLOCKED` · `CROSS_ACUTE_CHRONIC_EVIDENCE_LEAKAGE_BLOCKED` · `PHASE_ALONE_NOT_A_POTENCY_SELECTOR` · `VAGUE_TIMELINE_NOT_EXECUTABLE` · `REGISTRY_Q12_SELECTOR_BLOCKED` · `LEGACY_MISSING_PHASE_ACUTE_DEFAULT_REJECTED` · `LEGACY_PHASE_KEYWORD_SELECTOR_BLOCKED` · `PARTIAL_PHASE_RESOLUTION_REQUIRES_DOCTOR_REVIEW` · `PRESCRIPTION_HOLD`

#### **Q12-T — Outcome matrix**

| # | Condition | Phase / slot | Potency | Min reason | Doctor approval |
|---|-----------|--------------|---------|------------|-----------------|
| 1 | Valid day **10** | **`RESOLVED_BY_DAY_BAND`**, **ACUTE** | Per cascade only | — | **true** |
| 2 | Valid day **20** | **SUB_ACUTE** band | Per cascade | — | **true** |
| 3 | Missing duration/evidence | **`MISSING_EVIDENCE`**, **null** | **UNRESOLVED**, **null** | **`PHASE_EVIDENCE_MISSING`** | **true** |
| 4 | Invalid duration, no pool | **`INVALID_EVIDENCE`**, **null** | **UNRESOLVED** | **`PHASE_EVIDENCE_INVALID`** | **true** |
| 5 | Invalid item + valid pool | Re-evaluate | Per result or **UNRESOLVED** | **`PHASE_EVIDENCE_INVALID`** | **true** |
| 6 | Ambiguous phase | **`PHASE_AMBIGUOUS`**, **null** | **UNRESOLVED** | **`PHASE_EVIDENCE_AMBIGUOUS`** | **true** |
| 7 | Contradictory phase | **`PHASE_CONTRADICTORY`**, **null** | **UNRESOLVED** | **`PHASE_CONTRADICTORY`** | **true** |
| 8 | Vague timeline only | Not executable | **UNRESOLVED** | **`VAGUE_TIMELINE_NOT_EXECUTABLE`** | **true** |
| 9 | **POS ACUTE** sev **1–6** | Resolved phase | **Q7 D3/D5** gates | **`PHASE_ALONE_NOT_A_POTENCY_SELECTOR`** if shortcut attempted | **true** |
| 10 | **NEG** + resolved phase | — | **Q8** combined; no phase-only **D1/D2** | same | **true** |
| 11 | **DEEP_CHRONIC** **D60** pass | — | **D60** candidate | — | **true** |
| 12 | **D60** fail + common complete | — | **D10** fallback | — | **true** |
| 13 | **DEEP_CHRONIC** common incomplete | — | **UNRESOLVED** | — | **true** |
| 14 | Safe flare split sev **1–6** | Acute + chronic slots | Per **Q12-K** | isolation codes if leak | **true** |
| 15 | Flare sev **7–10** | — | **D30** if **D30F** complete | — | **true** |
| 16 | Split fails | **`PHASE_TARGET_CONTRADICTORY`** | **null** | **`ACUTE_CHRONIC_TARGET_SEPARATION_FAILED`** | **true** |
| 17 | Valid + unresolved sibling | Partial | Per slot | **`PARTIAL_PHASE_RESOLUTION_REQUIRES_DOCTOR_REVIEW`** | **true** |
| 18 | Crisis | Blocked | **null** | **`PRESCRIPTION_HOLD`** | **true** |
| 19 | Verified **&lt;1y** | **D13-HS** | blocked | **`PRESCRIPTION_HOLD`** | **true** |
| 20 | Registry/legacy keyword | Ignored | unchanged | **`REGISTRY_Q12_SELECTOR_BLOCKED`** / legacy codes | **true** |

#### **Q12-U — System and doctor roles**

**System:** audit duration/phase evidence · formula-specific phase · baseline/manifestation separation · safe acute/chronic split · applicable **Q7/Q8** cascades · null on unsafe slots · complete reasoning summary (**5R-SDG**).

**Doctor:** **not** compelled to choose phase/potency **during** analysis; reads completed summary; final approval/correction. **No** automatic prescription issuance without required approval.

#### **Q12-V — Execution boundary**

| Field | Value |
|-------|--------|
| **Question 12** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_phase_runtime`** | **FALSE** |
| **`automatic_flare_split_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **`PHASE_MULTILINGUAL_TIMELINE_LEXICON`** | **`SEPARATE_FREEZE_PENDING`** |
| **Rule 4** | **NOT_FROZEN** · **NOT_IMPLEMENTED** |
| **Question 13+** | **NOT_STARTED** / **PENDING** |

#### **Q12-W — No paid API**

Question **12** **must not** require or permit **paid API**, **paid LLM**, **paid OCR**, or **paid clinical service** dependencies. Future implementation: deterministic local rules · versioned data assets · approved local/self-hosted open-source components only.

**STOP — WAIT FOR QUESTION 12 FINAL CLOSURE VALIDATION** *(superseded — Q12-CLOSE formal closure recorded above.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 13 READ-ONLY AUDIT** *(superseded — Question **13** owner specification recorded below.)*

### Phase 5R-4D-Q13-CLOSE — FORMULA-SPECIFIC SEVERITY RESOLUTION AND POTENCY CASCADE INTEGRATION CONTRACT (**Clinical Question 13**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **FORMULA-SPECIFIC SEVERITY RESOLUTION AND POTENCY CASCADE INTEGRATION CONTRACT**

**Important naming:** **Rule 4 Question 13** = **severity integration**. **Q7 Decision 10** / **Q07C-CLOSE-D10** = **formula-specific severity resolution engine**. **Q7 Decision 13** / **Q07C-CLOSE-D13** = **pediatric potency boundary**. **D13-G** = **administration dose** — **must not** be conflated.

**Owner approval:** Question **13** clinical specification recorded (**Q13-A**–**Q13-X**). **Question 7** remains **FULLY_RESOLVED** (**Decisions 1–14** unchanged). **Questions 8–12** remain **CLOSED** · **NOT_IMPLEMENTED**. **Q07C-CLOSE-D10** (**D10-A**–**D10-M**) clinical text **not rewritten** — **Q13** additive Rule 4 integration only. **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED**.

**Owner approval (formal closure):** Question **13** final validation **READY_TO_CLOSE** accepted — **Q13-CLOSE** recorded **CLOSED** (**Q13-A**–**Q13-X** clinical text **unchanged**; **`execution_status = NOT_IMPLEMENTED`** · **`automatic_severity_runtime = FALSE`** · **`automatic_free_text_severity_runtime = FALSE`** · **`automatic_lab_vital_severity_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** · **`SEVERITY_MULTILINGUAL_LEXICON = SEPARATE_FREEZE_PENDING`** · **`LAB_VITAL_TO_SEVERITY_MAPPING = SEPARATE_FREEZE_PENDING`** unchanged).

**Formal closure:** **Q13-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · prior **CLOSURE_VALIDATION_PENDING** superseded by owner acceptance.

#### **Q13-A — Canonical authority**

Question **13** **must not** create a new severity engine.

**Canonical severity authorities (unchanged substance):**

- **Q07C-CLOSE-D10** (**D10-A**–**D10-M** · case table **1–10**)
- **Q07C-CLOSE-D08** · **CLOSE-D04** · **Q07C-D07P-MICRO Q-L**

**Q13** integrates **D10** into the **Rule 4 potency pipeline** only — **must not** rewrite · weaken · or bypass **D10**.

#### **Q13-B — Formula-specific severity**

Each **formula-target slot** resolves severity **independently**.

**Minimum fields:** `formula_slot_id` · `formula_target_id` · `target_role` · `baseline_severity` · `current_manifestation_severity` · `severity_score` · `severity_band` · `severity_status` · `severity_resolution_source` · `severity_evidence_item_ids` · `severity_evidence_source_ids` · `reason_codes` · `limitation_codes`

**Prohibited:** patient-global or mixture-max severity driving all formulas · Formula **A** severity evidence qualifying Formula **B**.

#### **Q13-C — Scale and bands**

Existing **D10-A** scale **unchanged:**

| Band | Range |
|------|--------|
| **LOW** | **1–3** |
| **MODERATE** | **4–6** |
| **HIGH** | **7–10** |

**Prohibited:** decimals · **0** · **>10** · silent default **5** · synthetic numeric from text.

When exact integer available: preserve **score** and **band**. Band-only evidence: **`severity_score = null`** · **`severity_band`** resolved · **`severity_status = RESOLVED_BAND_ONLY`** (**D10-E**).

#### **Q13-D — Source and corroboration**

Preserve **D10-C** / **D10-D**:

| Path | Rule |
|------|------|
| Doctor structured | Formula-specific · **D08** + **CLOSE-D04** gates |
| Doctor absent | ≥ **2** independent usable sources · **same band** → resolve; **cross-band** → **`SEVERITY_CONTRADICTORY`** |
| Prohibited | Majority vote · max severity · fixed source precedence |
| Dedupe | **Q-L** — one count per source |
| One non-doctor source | **`INSUFFICIENT_CORROBORATION`** · **`potency_status = UNRESOLVED`** · **`selected_dilution = null`** |

#### **Q13-E — Missing, invalid, ambiguous and contradictory**

| Case | Outcome (minimum) |
|------|-------------------|
| **Missing** | **`severity_status = MISSING_EVIDENCE`** · score/band **null** · **`potency_status = UNRESOLVED`** · **`reason_code = SEVERITY_VALUE_MISSING`** |
| **Invalid-only pool** | **`INVALID_EVIDENCE`** · **`reason_code = INVALID_SEVERITY_NUMERIC_VALUE`** · **UNRESOLVED**, **null** dilution |
| **Invalid item + valid pool** | Audit invalid · re-resolve on valid pool (**D10-B** Case A) |
| **Ambiguous** | **`potency_status = UNRESOLVED`** · **`reason_code = SEVERITY_EVIDENCE_AMBIGUOUS`** · **`limitation_codes`** may include **`SEVERITY_AMBIGUOUS`** — **D10-K** enum **not mutated** (**Q13-T**) |
| **Contradictory** | **`SEVERITY_CONTRADICTORY`** · score/band **null** · **UNRESOLVED**, **null** dilution |
| **Target binding missing** | **`TARGET_BINDING_MISSING`** · **UNRESOLVED**, **null** dilution |

Invalid item **must not** destroy the valid evidence pool.

#### **Q13-F — Severity alone never selects potency**

**Severity** is **one gate/input** in the cascade — **must not** alone select numeric dilution.

**Prohibited shortcuts:**

| Shortcut | Status |
|--------|--------|
| Sev **1–6** alone → **D1/D2/D3/D5/D10/D60** | **REJECTED** |
| Sev **7–10** alone → **D30** · legacy **≥8 → D1/D200** | **REJECTED** |
| Missing → **5** · disease name · keyword · global max | **REJECTED** |
| Severity → phase · disease/therapeutic polarity · temperament | **REJECTED** |

#### **Q13-G — Required-severity fail-closed**

When a potency path requires verified severity and **`severity_status`** is not success:

| Field | Value |
|-------|--------|
| **`potency_status`** | **UNRESOLVED** |
| **`selected_cascade`** | **null** or blocked |
| **`selected_dilution`** | **null** |
| **`automatic_issuance`** | **false** |
| **`final_doctor_approval_required`** | **true** |

**Success:** **`RESOLVED_NUMERIC`** · **`RESOLVED_BAND_ONLY`**. **Non-success:** **`MISSING_EVIDENCE`** · **`INVALID_EVIDENCE`** · **`INSUFFICIENT_CORROBORATION`** · **`SEVERITY_CONTRADICTORY`** · **`TARGET_BINDING_MISSING`** (+ ambiguous via **Q13-E** reason). Phase or polarity **must not** bypass missing severity on required paths.

#### **Q13-H — POSITIVE disease potency paths**

Verified **POSITIVE** disease + **NEGATIVE** therapeutic — **Q7** cascade **unchanged**:

| Condition | Path (all gates) |
|-----------|------------------|
| **ACUTE** + sev **1–6** | **D3/D5** via **CLOSE-D05** |
| **SUB_ACUTE** + sev **1–6** | **D10** Path **B** |
| **CHRONIC_MODERATE** + sev **1–6** | **D10** Path **C** |
| **DEEP_CHRONIC** + sev **1–6** | **D60** common + triple; fail + common complete → **D10** fallback; common incomplete/contradictory → **UNRESOLVED** |
| **Current manifestation** sev **7–10** | **D30** only after complete **Q07C-D30F**; sev alone **≠ D30**; crisis first; **no** **D10/D60** high-sev shortcut |

#### **Q13-I — NEGATIVE disease potency paths**

**Q08-CLOSE** combined selector:

| Severity | Path |
|----------|------|
| **1–6** | **D1** (**FAST_OR_ACTIVE**) or **D2** (**NEUTRAL_BALANCING**) — **Q8** combined gates only |
| **7–10** | **D1 prohibited** · **D2** **`RESTRICTED_CANDIDATE`** only if complete **Q8-D**; else **UNRESOLVED** · sev alone **≠ D2** |

#### **Q13-J — Other polarity states**

| State | Contract |
|-------|----------|
| Resolved **NEUTRAL** | **Q10** |
| Separable **POS/NEG** | **Q9** |
| Same-target contradiction | **Q9-B** |
| **UNRESOLVED** / **SUPPORT_ONLY** | **Q11** |

Resolved severity **must not** convert blocked / non-potency states to numeric dilution.

#### **Q13-K — Baseline vs current manifestation severity**

**`baseline_severity`** and **`current_manifestation_severity`** stored **separately** (**D10-H**, **D09-8** alignment).

- Flare **must not** overwrite baseline · baseline **must not** suppress current acute severity
- **No** inferred flare end — new follow-up evidence required
- **D30** uses **current manifestation severity** · chronic pathways use appropriate chronic-slot severity
- Historical versions in **immutable audit**

#### **Q13-L — Q12 acute/chronic dual-slot severity**

Per **Q12-K** safely separated slots:

**CURRENT_ACUTE_FLARE:** own **`current_manifestation_severity`** · acute evidence · sev **1–6** → **D3/D5** gates · sev **7–10** → **D30F** gates.

**UNDERLYING_CHRONIC_TARGET:** chronic-context / baseline severity · chronic evidence · **CHRONIC_MODERATE → D10** · **DEEP_CHRONIC → D60/D10** fallback.

**Isolation:** no cross-copy · no patient-global max override · independent resolution · **`CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED`** if leak. Unsafe bind → **`TARGET_BINDING_MISSING`** or **`SEVERITY_CONTRADICTORY`** · affected slot **UNRESOLVED**, **null** dilution.

#### **Q13-M — Partial multi-formula resolution**

Per **Q9-N** (unchanged): valid slot **`RESOLVED_DRAFT_CANDIDATE`** · failed sibling **UNRESOLVED** · **`selected_dilution = null`** on failed slot · **`patient_resolution_status = PARTIALLY_RESOLVED`** · **`prescription_status = PROPOSED_PENDING_DOCTOR_REVIEW`** · **`final_doctor_approval_required = true`**. Crisis / contraindication / **D13-HS** blocks all slots.

#### **Q13-N — Free-text and lab/vital assets**

| Asset | Status |
|-------|--------|
| **`SEVERITY_MULTILINGUAL_LEXICON`** | **`SEPARATE_FREEZE_PENDING`** |
| **`LAB_VITAL_TO_SEVERITY_MAPPING`** | **`SEPARATE_FREEZE_PENDING`** |
| **`free_text_severity_execution_status`** | **`NOT_EXECUTABLE`** |
| **`lab_vital_severity_execution_status`** | **`NOT_EXECUTABLE`** |

Until freeze, vague severity phrases (e.g. **बहुत दर्द**, **हल्का**, **असहनीय**) and abnormal lab/vital values **must not** auto-map to **LOW/MODERATE/HIGH**. Doctor structured numeric and qualified structured sources per **D10** remain usable. Raw free-text/lab preserved in audit. **Q06C** crisis vitals **independent** — mapping freeze **does not** disable crisis gate.

#### **Q13-O — Safety precedence**

**Order:** (1) Crisis (**Q06C**) (2) **D13-HS** &lt;1y (3) Patient-wide holds (4) **Rule 2** (5) Formula binding (6) **Q12** phase (7) Formula-specific severity (**Q13**) (8) Remaining potency gates (9) **D13-C** pediatric overlay (10) Final doctor approval.

**Crisis:** **`URGENT_ESCALATION`** · **`PRESCRIPTION_HOLD`** · **`selected_dilution = null`** · no issuance. Sev **7–10** **does not** replace crisis gate.

#### **Q13-P — Pediatric and dose separation**

**D13-C** overlay **after** cascade candidate. **PROHIBIT** → no final candidate · **RESTRICT** → **D13-D** justification. **D13-HS** hard stop. **D13-G** dose **must not** alter **Selected_Potency** or severity resolution.

#### **Q13-Q — Route isolation**

Oral severity outcome **must not** auto: Tablet **A/B** · electricity · external application · cross-route copy. Each route: independent target and evidence (**Q12-P** / **Q8-M** / **Q9-I** / **Q10-K** / **Q11-K** alignment).

#### **Q13-R — Registry and legacy quarantine**

| Field | Value |
|-------|--------|
| **`registry_q13_selector_status`** | **`NOT_EXECUTABLE_AS_Q13_SELECTOR`** |
| **`REGISTRY_SEVERITY_LOGIC_AUDIT_PENDING`** | **true** |

**Prohibited:** legacy **sev≥8 → D200/D1** · missing → **5** · global mixture max · disease-name / keyword severity · **`medicines.v1.json`** · registry · **116k** · nearest-match · phase-only · temperament-only severity selectors.

**Reason codes (minimum):** **`REGISTRY_Q13_SELECTOR_BLOCKED`** · **`LEGACY_SEVERITY_HIGH_DILUTION_SHORTCUT_REJECTED`** · **`LEGACY_MISSING_SEVERITY_DEFAULT_5_REJECTED`** · **`GLOBAL_SEVERITY_LEAKAGE_BLOCKED`**.

#### **Q13-S — Output schema (minimum fields)**

`question_13_status` · `formula_slot_id` · `formula_target_id` · `target_role` · `baseline_severity` · `current_manifestation_severity` · `severity_score` · `severity_band` · `severity_status` · `severity_resolution_source` · `severity_evidence_item_ids` · `severity_evidence_source_ids` · `potency_status` · `selected_cascade` · `selected_dilution` · `patient_resolution_status` · `prescription_status` · `limitation_codes` · `reason_codes` · `registry_q13_selector_status` · `final_doctor_approval_required` · `automatic_issuance` · `execution_status` · `automatic_severity_runtime` · `automatic_free_text_severity_runtime` · `automatic_lab_vital_severity_runtime` · `current_runtime_potency_delta`

**Namespaces:** lifecycle · clinical status · limitation · reason codes **separate** (**Q13-T**).

#### **Q13-T — Status and reason-code reuse**

Reuse **D10-K** **`severity_status`** enum — **no** parallel conflicting enum · **D10-K** text **unchanged**.

**Required statuses (from D10-K):** **`RESOLVED_NUMERIC`** · **`RESOLVED_BAND_ONLY`** · **`INSUFFICIENT_CORROBORATION`** · **`MISSING_EVIDENCE`** · **`INVALID_EVIDENCE`** · **`SEVERITY_CONTRADICTORY`** · **`TARGET_BINDING_MISSING`**

**Ambiguous:** **`reason_code = SEVERITY_EVIDENCE_AMBIGUOUS`** · **`limitation_codes`** may include **`SEVERITY_AMBIGUOUS`** — **do not** add **`SEVERITY_AMBIGUOUS`** to **D10-K** without separate Q7 amendment.

**Reason codes (minimum):** **`SEVERITY_VALUE_MISSING`** · **`INVALID_SEVERITY_NUMERIC_VALUE`** · **`SEVERITY_EVIDENCE_AMBIGUOUS`** · **`INSUFFICIENT_CORROBORATION`** · **`SEVERITY_CONTRADICTORY`** · **`TARGET_BINDING_MISSING`** · **`SEVERITY_ALONE_NOT_A_POTENCY_SELECTOR`** · **`CROSS_FORMULA_SEVERITY_LEAKAGE_BLOCKED`** · **`CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED`** · registry/legacy codes (**Q13-R**) · **`PARTIAL_SEVERITY_RESOLUTION_REQUIRES_DOCTOR_REVIEW`** · **`PRESCRIPTION_HOLD`**

#### **Q13-U — Outcome matrix**

| # | Condition | Severity / potency | Min reason | Dr approval |
|---|-----------|-------------------|------------|-------------|
| 1 | Doctor **4**, **POS ACUTE**, gates pass | MODERATE · **D3/D5** gates | — | **true** |
| 2 | Doctor **8**, **D30F** incomplete | HIGH · **UNRESOLVED** | — | **true** |
| 3 | Doctor **8**, **D30F** complete | **D30** candidate | — | **true** |
| 4 | Missing severity | **`MISSING_EVIDENCE`**, null | **`SEVERITY_VALUE_MISSING`** | **true** |
| 5 | Invalid-only pool | **`INVALID_EVIDENCE`**, null | **`INVALID_SEVERITY_NUMERIC_VALUE`** | **true** |
| 6 | Invalid + valid pool | Re-evaluate valid | **`INVALID_SEVERITY_NUMERIC_VALUE`** | **true** |
| 7 | One non-doctor source | **`INSUFFICIENT_CORROBORATION`**, null | same | **true** |
| 8 | Two same-band reports | **`RESOLVED_BAND_ONLY`** | — | **true** |
| 9 | Cross-band reports | **`SEVERITY_CONTRADICTORY`**, null | same | **true** |
| 10 | **NEG** sev **1–6** | **Q8 D1/D2** gates | — | **true** |
| 11 | **NEG** sev **7–10**, **Q8-D** complete | **D2** restricted | — | **true** |
| 12 | **NEG** sev **7–10**, **Q8-D** incomplete | **UNRESOLVED** | — | **true** |
| 13 | **SUB_ACUTE POS** sev **1–6** | **D10** gates | — | **true** |
| 14 | **DEEP_CHRONIC** sev **1–6**, **D60** pass | **D60** candidate | — | **true** |
| 15 | **D60** fail, common complete | **D10** fallback | — | **true** |
| 16 | Flare sev **8**, **D30F** complete | **D30** on flare slot | — | **true** |
| 17 | Chronic sibling sev **3** | Separate **D10/D60** path | isolation if leak | **true** |
| 18 | Free-text only pre-freeze | Not executable, null | **`SEVERITY_EVIDENCE_AMBIGUOUS`** | **true** |
| 19 | Lab/vital only pre-freeze | No band, null | — | **true** |
| 20 | Crisis vital | **Q06C** hold | **`PRESCRIPTION_HOLD`** | **true** |
| 21 | Pediatric candidate | **D13-C** overlay | per **D13** | **true** |
| 22 | Valid + unresolved sibling | Partial draft | **`PARTIAL_SEVERITY_RESOLUTION_REQUIRES_DOCTOR_REVIEW`** | **true** |
| 23 | Verified **&lt;1y** | **D13-HS** block | **`PRESCRIPTION_HOLD`** | **true** |
| 24 | Registry/legacy attempt | Blocked | **`REGISTRY_Q13_SELECTOR_BLOCKED`** / legacy | **true** |

#### **Q13-V — System and doctor roles**

**System:** audit formula-specific severity · baseline/current separation · numeric/band resolution · applicable **Q7/Q8** cascades · null on unsafe slots · complete reasoning summary (**5R-SDG**).

**Doctor:** **not** compelled to choose severity/potency **during** analysis; reads completed summary; final approval/correction. **No** automatic prescription issuance without required approval.

#### **Q13-W — Execution boundary**

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
| **Rule 4** | **NOT_FROZEN** · **NOT_IMPLEMENTED** |
| **Question 14+** | **NOT_STARTED** / **PENDING** |

#### **Q13-X — No paid API**

Question **13** **must not** require or permit **paid API**, **paid LLM**, **paid OCR**, or **paid clinical service** dependencies. Future implementation: deterministic local rules · versioned data assets · approved local/self-hosted open-source components only.

**STOP — WAIT FOR QUESTION 13 FINAL CLOSURE VALIDATION** *(superseded — Q13-CLOSE formal closure recorded above.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 14 READ-ONLY AUDIT** *(superseded — Q14-CLOSE owner specification recorded below.)*

### Phase 5R-4D-Q14-CLOSE — VERIFIED NON-PEDIATRIC ADULT AGE INTEGRATION AND NO AGE-BASED POTENCY OVERLAY CONTRACT (**Clinical Question 14**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **VERIFIED NON-PEDIATRIC ADULT AGE INTEGRATION AND NO AGE-BASED POTENCY OVERLAY CONTRACT**

**Important naming (mandatory distinction):**

| Term | Meaning |
|------|---------|
| **Rule 4 Question 14** | Non-pediatric / **verified adult age** integration in Rule 4 pipeline — **no age-based potency overlay** |
| **Q7 Decision 14 / Q07C-CLOSE-D14** | **Tier 3 Rule 3 pathology mapping** freeze and execution boundary (**D14-A**–**D14-N**) — **CLOSED** · **NOT_IMPLEMENTED** |
| **Q7 Decision 13 / Q07C-CLOSE-D13** | **Pediatric potency boundary** (**D13-A**–**D13-G**, **D13-HS**) — **CLOSED** · **NOT_IMPLEMENTED** |
| **D13-G** | **Administration dose** contract — **separate** from **Selected_Potency** |

**Owner approval:** Question **14** clinical specification recorded (**Q14-A**–**Q14-U**). **Question 7** remains **FULLY_RESOLVED** (**Decisions 1–14** clinical text **unchanged**). **Questions 8–13** remain **CLOSED** · **NOT_IMPLEMENTED** (clinical bodies **unchanged**). **Q07C-CLOSE-D13** / **D13-G-C** clinical text **not rewritten** — **Q14** additive Rule 4 integration only. **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED**.

**Owner approval (formal closure):** Question **14** final validation **READY_TO_CLOSE** accepted — **Q14-CLOSE** recorded **CLOSED** (**Q14-A**–**Q14-U** clinical text **unchanged**; **`execution_status = NOT_IMPLEMENTED`** · **`automatic_adult_age_runtime = FALSE`** · **`adult_potency_overlay = NONE`** · **`adult_overlay_applied = FALSE`** · **`age_based_potency_adjustment = FALSE`** · **`current_runtime_potency_delta = NONE`** unchanged).

**Formal closure:** **Q14-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · prior **CLOSURE_VALIDATION_PENDING** superseded by owner acceptance.

#### **Q14-A — Canonical scope**

Question **14** applies to verified age **`>12 years`** (minimum **13 years** inclusive).

| Item | Rule |
|------|------|
| **Canonical adult band** | **P13-E** = **ADULT** (per **D13-B** — **not rewritten**) |
| **Minimum age** | **13 years** |
| **Pediatric overlay** | **None** for **P13-E** |
| **Cascade** | Existing **Q7–Q13** potency authorities **unchanged** |
| **Prohibited scope** | **No** new adult potency engine · **no** geriatric dilution ladder |

#### **Q14-B — Adult band finality**

| Field | Value |
|-------|--------|
| **Owner rule** | **P13-E** adult band is **sufficient** and **final** |
| **Additional adult potency sub-bands** | **None** — including **13–39**, **40–64**, **65+**, geriatric/elderly |
| **Audit/context sub-bands** | May appear in audit/context fields **only** — **must not** alter **`Selected_Potency`** |
| **`adult_potency_overlay`** | **`NONE`** |
| **`adult_overlay_applied`** | **`false`** |
| **`age_based_potency_adjustment`** | **`false`** |

#### **Q14-C — Age alone never selects potency**

Verified adult age **alone** **must not**:

- Select **D1**, **D2**, **D3**, **D5**, **D10**, **D30**, or **D60**
- **Create**, **promote**, **demote**, **prohibit**, or **restrict** potency candidates
- Create or infer **disease polarity**, **therapeutic polarity**, **dose character**, **phase**, **severity**, **temperament**, or **formula target**

#### **Q14-D — Legacy adult/geriatric shortcuts prohibited**

**Fully prohibited:** Elderly→**D5** · Elderly→**D10** · Elderly→**D30** · Elderly→**D60** · Weakness+elderly→**D1** · Adult age→default polarity ladder · Missing age→default **40** · Age keyword→potency · Geriatric disease name→lower/higher potency · Maximum age→maximum/minimum dilution · Age alone→sensitivity · Age alone→frailty · Age alone→contraindication.

#### **Q14-E — Existing potency authorities**

For **P13-E** patients, **`Selected_Potency`** is determined **only** through:

| Authority | Contract |
|-----------|----------|
| Disease polarity | **Rule 2** |
| **POSITIVE** pathway | **Q7** |
| **NEGATIVE** pathway | **Q8** |
| **MIXED** targets | **Q9** |
| Resolved **NEUTRAL** disease | **Q10** |
| **UNRESOLVED** / **SUPPORT_ONLY** | **Q11** |
| Phase | **Q12** |
| Severity | **Q13** |
| Crisis | **Q06C** |
| Contraindications | Existing patient/formula safety gates |
| Final approval | **5R-DRG** |

Age **must not** bypass or override any of the above.

#### **Q14-F — Adult potency paths unchanged**

On verified **P13-E** age:

| Dilution | Gates only |
|----------|------------|
| **D1/D2** | **Q8** gates |
| **D3/D5** | **Q7** / **CLOSE-D05** gates |
| **D10** | Phase / severity / polarity and relevant **D10** cascade gates |
| **D30** | Complete **Q07C-D30F** only |
| **D60** | Complete **D60** common + triple gates only |

Adult/elderly age **must not** open or close these paths.

#### **Q14-G — Frailty, weight, comorbidity and organ function**

**Must not** infer frailty, weight, sensitivity, liver function, kidney function, or comorbidities from age alone.

These are **separate structured clinical inputs**. Effects apply **only** when an **existing frozen** safety/contraindication/sensitivity rule permits.

Question **14** **must not**: create frailty score · create weight-based potency rule · create renal/hepatic potency rule · derive safety status from **“elderly”** label alone.

Future frailty/weight/comorbidity contracts = **separate owner decision/data contract** — **no silent rules in Q14**.

#### **Q14-H — Age verification**

Age from **verified** sources only: structured date of birth · verified numeric age · approved identity/clinical registration source.

For age evidence apply as required: **Q07C-CLOSE-D08** source usability · context validation · contradiction checking · audit preservation.

**Not** age authority: age keyword · disease name · report narrative · OCR guess · **116k** dataset · registry.

#### **Q14-I — Missing, invalid and contradictory age**

| Case | **`adult_age_status`** | **`age_band`** | Potency | **`reason_code`** (minimum) |
|------|------------------------|----------------|---------|-------------------------------|
| **Missing age** | **`MISSING_EVIDENCE`** | **`null`** | **`potency_status = UNRESOLVED`** where verified age is required safety input · **`selected_dilution = null`** | **`VERIFIED_AGE_MISSING`** — **no** default age **40** |
| **Invalid age** | **`INVALID_EVIDENCE`** | **`null`** | **`UNRESOLVED`**, **`selected_dilution = null`** | **`VERIFIED_AGE_INVALID`** |
| **Contradictory age/DOB** | **`AGE_CONTRADICTORY`** | **`null`** | **`UNRESOLVED`**, **`selected_dilution = null`** | **`VERIFIED_AGE_CONTRADICTORY`** |

Invalid age item **must not** destroy the remainder of the valid evidence pool. Re-evaluate when a valid verified source is available.

#### **Q14-J — Age 12/13 boundary**

| Verified age | Band / rule |
|--------------|-------------|
| **≤12 years** | **D13** pediatric rules |
| **= 12** | **P13-D** |
| **= 13** | **P13-E** **ADULT** |
| **>12** | **P13-E** **ADULT** |

At age **13**, pediatric **D13-C** potency matrix **must not** apply. At age **12**, adult **P13-E** **must not** apply.

**No rounding:** resolve **12.9 years** (and sub-year precision) per verified DOB/day precision and existing pediatric boundary contract — **no** silent adult assignment from approximate age.

**Additive cross-reference only** — **do not** rewrite **D13-B** bands or age-verification semantics.

#### **Q14-K — Adult administration dose vs potency**

**D13-G-C** administration dose and Rule 4 **Selected_Potency** remain **separate dimensions**.

**D13-G-C preserved (unchanged substance):** **HIGH_SENSITIVITY** → **7** drops · **NORMAL_SENSITIVITY** → **8** drops · **3** times/day · half cup normal/lukewarm water · doctor may reduce frequency.

| Rule | Detail |
|------|--------|
| Dose | **Must not** change **Selected_Potency** |
| Potency | **Must not** set dose/frequency |
| Missing/invalid/contradictory sensitivity | **No** silent **7/8** drops · **`administration_dose_status = UNRESOLVED`** |
| Independence | Potency may complete **Q7–Q13** cascade when other required safety inputs are complete |

#### **Q14-L — Multi-formula isolation**

Verified adult age may be **patient-level** safety/context input; potency evaluation remains **formula-specific**.

- Formula **A** potency independent of Formula **B**
- Same verified age context may apply to all slots
- Age **must not** copy polarity/phase/severity across slots
- Valid slot **must not** be destroyed by unresolved sibling (**Q9-N**)
- **Q12** acute/chronic slots independent · **Q13** slot-specific severity independent
- **No** cross-formula evidence leakage

#### **Q14-M — Safety precedence**

**Order (preserve):**

1. Emergency/Crisis Safety Gate (**Q06C**)
2. Verified age resolution
3. **D13-HS** under-one hard stop
4. Patient-wide contraindication/prescription hold
5. **Rule 2** polarity
6. Formula-target binding
7. **Q12** phase
8. **Q13** severity
9. Remaining potency gates
10. Pediatric overlay **only** for age **≤12**
11. Adult **P13-E** no-overlay confirmation for age **≥13**
12. Final doctor approval

**Crisis:** **`URGENT_ESCALATION`** · **`PRESCRIPTION_HOLD`** · **`selected_dilution = null`** · no automatic issuance. Adult status **must not** override crisis.

#### **Q14-N — Route isolation**

Adult age/oral potency outcome **must not** automatically: copy to Tablet Section **A/B** · select electricity · create external application formula · copy potency/dose across routes. Each route requires independent clinical target/evidence contract (**Q8-M** / **Q12-P** / **Q13-Q** alignment).

#### **Q14-O — Registry and legacy quarantine**

| Field | Value |
|-------|--------|
| **`registry_q14_selector_status`** | **`NOT_EXECUTABLE_AS_Q14_SELECTOR`** |
| **`REGISTRY_ADULT_AGE_LOGIC_AUDIT_PENDING`** | **true** |

**Prohibited adult potency selectors:** age keyword · **“elderly”** keyword · disease name · **`medicines.v1`** potency_logic · historical formula registry · **116k** alignment · nearest-match disease/pathology · missing age default **40** · static age-to-potency mapping · legacy adult polarity ladder · frailty inferred from age.

**Reason codes (minimum):** **`REGISTRY_Q14_SELECTOR_BLOCKED`** · **`LEGACY_MISSING_AGE_DEFAULT_40_REJECTED`** · **`ADULT_AGE_ALONE_POTENCY_BLOCKED`** · **`GERIATRIC_POTENCY_SHORTCUT_REJECTED`** · **`AGE_INFERRED_FRAILTY_REJECTED`**

#### **Q14-P — Output schema (minimum fields)**

`question_14_status` · `verified_age_years` · `verified_date_of_birth` · `age_verification_source` · `adult_age_status` · `age_band` · `pediatric_overlay_applied` · `adult_potency_overlay` · `adult_overlay_applied` · `age_based_potency_adjustment` · `formula_slot_id` · `formula_target_id` · `potency_status` · `selected_cascade` · `selected_dilution` · `administration_dose_status` · `limitation_codes` · `reason_codes` · `registry_q14_selector_status` · `patient_resolution_status` · `prescription_status` · `final_doctor_approval_required` · `automatic_issuance` · `execution_status` · `automatic_adult_age_runtime` · `current_runtime_potency_delta`

Lifecycle · age-resolution · clinical status · reason-code namespaces **separate**.

#### **Q14-Q — Canonical statuses and reason codes**

**`question_14_status`:** **`NOT_STARTED`** · **`OWNER_DECISION_RECORDED`** · **`CLOSURE_VALIDATION_PENDING`** · **`CLOSED`** · **`NOT_IMPLEMENTED`**

**`adult_age_status`:** **`NOT_EVALUATED`** · **`RESOLVED_ADULT`** · **`MISSING_EVIDENCE`** · **`INVALID_EVIDENCE`** · **`AGE_CONTRADICTORY`** · **`BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE`**

**`age_band`:** **`P13-A`** · **`P13-B`** · **`P13-C`** · **`P13-D`** · **`P13-E`** — Question **14** applies clinically to **`P13-E`**; earlier bands referenced for boundary validation only.

**Canonical reason codes:** **`VERIFIED_AGE_MISSING`** · **`VERIFIED_AGE_INVALID`** · **`VERIFIED_AGE_CONTRADICTORY`** · **`ADULT_AGE_RESOLVED_NO_POTENCY_OVERLAY`** · **`ADULT_AGE_ALONE_POTENCY_BLOCKED`** · **`GERIATRIC_POTENCY_SHORTCUT_REJECTED`** · **`LEGACY_MISSING_AGE_DEFAULT_40_REJECTED`** · **`AGE_INFERRED_FRAILTY_REJECTED`** · **`CROSS_FORMULA_AGE_POTENCY_LEAKAGE_BLOCKED`** · **`CROSS_ROUTE_AGE_POTENCY_LEAKAGE_BLOCKED`** · **`REGISTRY_Q14_SELECTOR_BLOCKED`** · **`PRESCRIPTION_HOLD`**

#### **Q14-R — Outcome matrix**

| # | Condition | **`adult_age_status`** | **`age_band`** | **`adult_overlay_applied`** | Potency effect | **`selected_dilution`** | Prescription | Min reason | Dr approval |
|---|-----------|------------------------|----------------|-----------------------------|----------------|-------------------------|--------------|------------|-------------|
| 1 | Verified age **45** | **`RESOLVED_ADULT`** | **P13-E** | **false** | Cascade unchanged | Per **Q7–Q13** | Draft if gates pass | **`ADULT_AGE_RESOLVED_NO_POTENCY_OVERLAY`** | **true** |
| 2 | Age **12** | per **D13** | **P13-D** | per **D13-C** if qualified | Pediatric overlay path | Per cascade + **D13-C** | per **D13** | per **D13** | **true** |
| 3 | Age **13** | **`RESOLVED_ADULT`** | **P13-E** | **false** | No pediatric overlay | Per **Q7–Q13** | Draft if gates pass | **`ADULT_AGE_RESOLVED_NO_POTENCY_OVERLAY`** | **true** |
| 4 | Missing age | **`MISSING_EVIDENCE`** | **null** | **false** | **UNRESOLVED** | **null** | Hold / no issue | **`VERIFIED_AGE_MISSING`** | **true** |
| 5 | Invalid age | **`INVALID_EVIDENCE`** | **null** | **false** | **UNRESOLVED** | **null** | Hold | **`VERIFIED_AGE_INVALID`** | **true** |
| 6 | Contradictory age/DOB | **`AGE_CONTRADICTORY`** | **null** | **false** | **UNRESOLVED** | **null** | Hold | **`VERIFIED_AGE_CONTRADICTORY`** | **true** |
| 7 | Invalid age item + valid DOB | Re-evaluate valid pool | Resolved per **D13-B** | per band | Per valid resolution | Per gates | per outcome | **`VERIFIED_AGE_INVALID`** (invalid item) | **true** |
| 8 | Age **78** + **D60** qualified | **`RESOLVED_ADULT`** | **P13-E** | **false** | **D60** via **D60** gates only | **D60** candidate if pass | Draft if pass | **`ADULT_AGE_RESOLVED_NO_POTENCY_OVERLAY`** | **true** |
| 9 | Age **78** + **D30** candidate | **`RESOLVED_ADULT`** | **P13-E** | **false** | **D30** via **D30F** only | **D30** or **null** | per **D30F** | **`ADULT_AGE_RESOLVED_NO_POTENCY_OVERLAY`** | **true** |
| 10 | Age **65** **NEG** **D1** candidate | **`RESOLVED_ADULT`** | **P13-E** | **false** | **D1** via **Q8** only | **D1** or **null** | per **Q8** | **`ADULT_AGE_RESOLVED_NO_POTENCY_OVERLAY`** | **true** |
| 11 | Age **70** **ACUTE** | **`RESOLVED_ADULT`** | **P13-E** | **false** | Phase from **Q12**, not age | Per cascade | Draft if pass | **`ADULT_AGE_RESOLVED_NO_POTENCY_OVERLAY`** | **true** |
| 12 | Age **70** + crisis | **`RESOLVED_ADULT`** or hold | **P13-E** | **false** | **Q06C** hold | **null** | **`PRESCRIPTION_HOLD`** | **`PRESCRIPTION_HOLD`** | **true** |
| 13 | Age **40** multi-formula | **`RESOLVED_ADULT`** | **P13-E** | **false** | Independent slots | Per slot | Partial allowed (**Q9-N**) | **`ADULT_AGE_RESOLVED_NO_POTENCY_OVERLAY`** | **true** |
| 14 | Age **55** **Q9** split | **`RESOLVED_ADULT`** | **P13-E** | **false** | Per-slot cascade; age no group opening | Per slot | per **Q9** | **`ADULT_AGE_RESOLVED_NO_POTENCY_OVERLAY`** | **true** |
| 15 | Age **80** sensitivity missing | **`RESOLVED_ADULT`** | **P13-E** | **false** | Potency may resolve independently | Per **Q7–Q13** | Dose **UNRESOLVED** | **`ADULT_AGE_RESOLVED_NO_POTENCY_OVERLAY`** + dose codes | **true** |
| 16 | Registry elderly→**D5/D10** attempt | **`RESOLVED_ADULT`** | **P13-E** | **false** | Blocked | **null** or prior safe | Hold | **`GERIATRIC_POTENCY_SHORTCUT_REJECTED`** / **`REGISTRY_Q14_SELECTOR_BLOCKED`** | **true** |
| 17 | Missing age→**40** attempt | **`MISSING_EVIDENCE`** | **null** | **false** | **UNRESOLVED** | **null** | Hold | **`LEGACY_MISSING_AGE_DEFAULT_40_REJECTED`** | **true** |
| 18 | Age-inferred frailty attempt | **`RESOLVED_ADULT`** | **P13-E** | **false** | No frailty potency | Per gates | per outcome | **`AGE_INFERRED_FRAILTY_REJECTED`** | **true** |
| 19 | Age **&lt;1** | per **D13-HS** | **P13-A/B** | **false** | Hard stop | **null** | **`NOT_GENERATED`** | **`PRESCRIPTION_HOLD`** / **D13-HS** | **true** |
| 20 | Adult oral copied to other route | **`RESOLVED_ADULT`** | **P13-E** | **false** | Oral only | Per oral slot | Block cross-route | **`CROSS_ROUTE_AGE_POTENCY_LEAKAGE_BLOCKED`** | **true** |

#### **Q14-S — System and doctor roles**

**System:** resolve verified age · determine pediatric/adult boundary · apply adult **no-overlay** status · run existing **Q7–Q13** cascade · safe stop on missing/invalid age · complete reasoning summary (**5R-SDG**).

**Doctor:** **not** compelled to choose age band or potency **during** analysis · reads completed summary · final approval or correction. **No** automatic prescription issuance without required approval.

#### **Q14-T — Execution boundary**

| Field | Value |
|-------|--------|
| **Question 14** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_adult_age_runtime`** | **FALSE** |
| **`adult_potency_overlay`** | **`NONE`** |
| **`adult_overlay_applied`** | **FALSE** |
| **`age_based_potency_adjustment`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **Rule 4** | **NOT_FROZEN** · **NOT_IMPLEMENTED** |
| **Question 15+** | **NOT_STARTED** / **PENDING** |

#### **Q14-U — No paid API**

Question **14** **must not** require or permit **paid API**, **paid LLM**, **paid OCR**, or **paid clinical service** dependencies. Future implementation: deterministic local rules · versioned data assets · approved local/self-hosted open-source components only.

**STOP — WAIT FOR QUESTION 14 FINAL CLOSURE VALIDATION** *(superseded — Q14-CLOSE formal closure recorded above.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 15 READ-ONLY AUDIT** *(superseded — Q15-CLOSE owner specification recorded below.)*

### Phase 5R-4D-Q15-CLOSE — PER-FORMULA POTENCY ISOLATION AND MULTI-SLOT RULE 4 EXECUTION CONTRACT (**Clinical Question 15**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **PER-FORMULA POTENCY ISOLATION AND MULTI-SLOT RULE 4 EXECUTION CONTRACT**

**Important naming (mandatory distinction):**

| Term | Meaning |
|------|---------|
| **Rule 4 Question 15** | Per-oral-slot Rule 4 execution · cross-formula leakage prohibition · multi-formula partial resolution |
| **Rule 4 Question 16** | Formula-specific **report** evidence / **`global_text`** wiring — **not** slot orchestration |
| **Q9-N** | Safe partial-slot resolution — **preserved** · **implemented by reference** in **Q15-D** |
| **Q12-B / Q13-B / Q14-L** | Per-slot phase · severity · age context — **unchanged** · **non-mutating** |

**Owner approval:** Question **15** clinical specification recorded (**Q15-A**–**Q15-U**). **Owner policy shape:** **Option A** (integration-only Rule 4 orchestration) **+ Option B** (strict leakage block) **+ Option C** (mandatory **Q9-N** partial multi-formula default) — **combined**. **Question 7** remains **FULLY_RESOLVED**. **Questions 8–14** remain **CLOSED** · **NOT_IMPLEMENTED** (clinical bodies **unchanged**). **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED**.

**Owner approval (formal closure):** Question **15** final validation **READY_TO_CLOSE** accepted — **Q15-CLOSE** recorded **CLOSED** (**Q15-A**–**Q15-U** clinical text **unchanged**; **`execution_status = NOT_IMPLEMENTED`** · **`automatic_multi_formula_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** unchanged).

**Formal closure:** **Q15-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · prior **CLOSURE_VALIDATION_PENDING** superseded by owner acceptance.

#### **Q15-A — Canonical scope**

Question **15** defines how Rule 4 runs **per oral formula slot** in multi-formula analysis.

| Item | Rule |
|------|------|
| **Scope** | **Oral** Rule 4 **`formula_slot_id`** passes only |
| **Pass count** | **One** independent Rule 4 potency evaluation **per** **`formula_slot_id`** |
| **Does not create** | New dilution ladder · new pathology engine · patient-global potency selector |
| **Integrates** | **Q2** responsibility · **5R-4D-PB** · **Q9-N** · **Q12** · **Q13** · **Q14** · **Q7–Q11** cascades **per slot** |

#### **Q15-B — Independent Rule 4 pass per slot**

For each **oral** **`formula_slot_id`**:

1. Bind **`formula_target_id`** (and mandatory Rule 3 scoping keys per upstream contracts).
2. Run **slot-local** Rule 2 polarity → **Q7–Q13** (and **Q8–Q11** as applicable) → pediatric overlay when age **≤12** (**D13-C**) after slot cascade gates.
3. Emit **slot-local** **`potency_status`**, **`selected_cascade`**, **`selected_dilution`**, reason/limitation codes.
4. **Must not** read sibling slot **`selected_dilution`** as input to this slot’s cascade.

**Patient-level inputs allowed (context only):** verified age (**Q14**), crisis/hold gates (**Q06C**, contraindications, **D13-HS**) — **must not** substitute for slot-local polarity · phase · severity · evidence.

#### **Q15-C — Cross-formula leakage prohibited (Option B — strict block)**

The following **must not** cross **`formula_slot_id`** boundaries to select · promote · demote · restrict · or prohibit potency:

| Category | Prohibited leakage |
|----------|-------------------|
| **Evidence** | Formula-scoped reports · symptoms · OCR items · corroboration counts |
| **Polarity** | Disease polarity · therapeutic polarity |
| **Phase** | **`resolved_phase`** · baseline/current manifestation phase |
| **Severity** | **`severity_score`** · **`severity_band`** · **`severity_status`** |
| **Sensitivity** | Hypersensitivity / **CLOSE-D05** qualification |
| **Pathology** | Pathology class · **D60** eligibility · Tier 3 mapping suggestions (**D14**) |
| **Cardiac/BP** | **`bp_sys`** / cardiovascular supporting evidence (**formula-scoped targets only** — **no** global BP promotion) |

**On detected leakage attempt (evaluation or implementation guard):**

- Receiving slot **`potency_status` = UNRESOLVED**
- **`selected_dilution` = null**
- **`reason_codes`** include minimum **`CROSS_FORMULA_POTENCY_LEAKAGE_BLOCKED`** (and domain-specific codes where applicable — **Q15-O**)
- **Must not** silently apply sibling slot outcomes

Valid slot evidence **must not** qualify an unresolved sibling slot (**Q9-N** §5 preserved).

#### **Q15-D — Partial multi-formula resolution (Option C — mandatory Q9-N default)**

When ≥ **2** distinct oral formula slots exist:

| Case | Outcome |
|------|---------|
| Slot **resolved** draft candidate | **`slot_resolution_status` = `RESOLVED_DRAFT_CANDIDATE`** · slot **`selected_dilution`** per **Q15-B** · **`final_doctor_approval_required` = true** |
| Slot **UNRESOLVED** | **That slot only:** **`slot_potency_status` = UNRESOLVED** · **`selected_dilution` = null** · appropriate **`reason_codes`** |
| Sibling effect | Unresolved slot **must not** nullify valid sibling draft potency (**Q9-N** §4) |
| Patient aggregate | When ≥ **1** resolved and ≥ **1** unresolved: **`patient_resolution_status` = `PARTIALLY_RESOLVED`** · **`split_status` = `PARTIALLY_RESOLVED_BY_CONTROLLED_SPLIT`** (when split context applies per **Q9**) · **`prescription_status` = `PROPOSED_PENDING_DOCTOR_REVIEW`** |

**Whole-prescription fail-close** **only** for **patient-wide** safety gates (**Q15-E**) — **not** because one slot is UNRESOLVED.

#### **Q15-E — Patient-wide gates (whole-prescription fail-close only)**

When **any** active patient-wide gate applies, **all** prescription outputs supersede per-slot drafts:

| Gate | Minimum outcome |
|------|-----------------|
| **Q06C** crisis / emergency | **`URGENT_ESCALATION`** · **`PRESCRIPTION_HOLD`** · **`selected_dilution` = null** (all slots) · no automatic issuance |
| Patient-wide contraindication / prescription hold | **`PRESCRIPTION_HOLD`** |
| **D13-HS** verified age **&lt; 1 year** | Hard stop per **D13-HS** — no clinical prescription path |
| Unsafe / unresolved identity or age when required for applicable safety rule | Hold per existing gates |

**Prohibited:** one sibling slot **UNRESOLVED** → force **all** slots **`selected_dilution` = null** (unless patient-wide gate **Q15-E**).

#### **Q15-F — No patient-global potency output**

**Prohibited outputs:**

- Patient-global **“recommended dilution”** (binding or display-as-selected)
- **One potency for all formulas**
- **Highest** / **lowest** dilution across slots as the prescription dilution
- Mixture-max / patient-global severity-driven dilution shortcut

Every emitted **`selected_dilution`** **must** be bound to **`formula_slot_id`** **and** **`formula_target_id`**.

#### **Q15-G — Slot binding and cascade authorities**

Per slot, **`Selected_Potency`** follows existing authorities only (**non-mutating**):

**Rule 2** · **Q7** · **Q8** · **Q9** · **Q10** · **Q11** · **Q12** · **Q13** · **Q06C** · **Q14** (age context) · **D13-C** (when **≤12**) · formula safety gates · **5R-DRG**

Question **15** **must not** bypass or rewrite **Q7–Q14** clinical rules.

#### **Q15-H — Same formula target · deduplication and contradiction**

| Case | Rule |
|------|------|
| Duplicate evidence entries for **same** **`formula_target_id`** | Merge/deduplicate per **Q-L** (**Q07C-D07P-MICRO**) before slot usability evaluation |
| Valid contradiction after dedupe | **That slot** **`potency_status` = UNRESOLVED** · **`selected_dilution` = null** · contradiction **`reason_codes`** |
| Distinct slots · distinct targets | Independent outcomes — **Q15-B** |

#### **Q15-I — Evidence audit (per slot)**

Each slot evaluation **must** apply as required:

- **Q07C-CLOSE-D08** source usability
- **CLOSE-D04** lifecycle / formula match
- **Q-L** deduplication
- Formula-target · organ/site binding
- Context and negation validation

Missing · invalid · ambiguous · contradictory slot evidence → slot **UNRESOLVED** (fail-closed for **that slot** only unless **Q15-E**).

#### **Q15-J — Multi-slot special cases (by reference)**

| Topic | Contract |
|-------|----------|
| **Q9** controlled split / polarity contradiction | **Q9-A**–**Q9-Q** — **unchanged** |
| **Q12** flare/chronic dual slots | **Q12-K/L** — independent phase per slot |
| **Q13** severity | **Q13-B** — no cross-formula severity |
| **Q14** age | Patient context · per-slot cascade |
| **Q11** SUPPORT_ONLY / UNRESOLVED siblings | Valid slot preserved (**Q11-I** + **Q9-N**) |

#### **Q15-K — Safety precedence (Rule 4 multi-slot)**

**Order (preserve):**

1. **Q06C** crisis / emergency
2. Verified age resolution · **D13-HS**
3. Patient-wide contraindication / hold (**Q15-E**)
4. Per-slot **Rule 2** polarity
5. Formula-target binding
6. **Q12** phase (slot)
7. **Q13** severity (slot)
8. Remaining slot potency gates (**Q7–Q11**)
9. **D13-C** pediatric overlay when applicable
10. **Q15-C** leakage block enforcement
11. **Q15-D** partial aggregation
12. Final doctor approval (**5R-DRG**)

#### **Q15-L — Route isolation**

Oral slot potency outcomes **must not** automatically copy to Tablet Section **A/B** · electricity · external application · cross-route potency/dose. Align **Q8-M** · **Q12-P** · **Q13-Q** · **Q14-N**.

#### **Q15-M — Registry and legacy quarantine**

| Field | Value |
|-------|--------|
| **`registry_q15_selector_status`** | **`NOT_EXECUTABLE_AS_Q15_SELECTOR`** |
| **`REGISTRY_MULTI_FORMULA_POTENCY_LOGIC_AUDIT_PENDING`** | **true** |

**Non-executable selectors (minimum):**

- **`global_text`** keyword potency for all mixtures
- Mixture-max / patient-global **severity** → dilution
- **Highest** / **lowest** dilution across formulas
- **One dilution for all** disease names / registry rows
- **`medicines.v1`** multi-formula potency_logic
- **116k** / nearest-match cross-formula promotion
- Legacy MDE “copy slot A dilution to slot B”

**Reason codes (minimum):** **`REGISTRY_Q15_SELECTOR_BLOCKED`** · **`CROSS_FORMULA_POTENCY_LEAKAGE_BLOCKED`** · **`PATIENT_GLOBAL_POTENCY_OUTPUT_PROHIBITED`** · **`MIXTURE_MAX_SEVERITY_SHORTCUT_REJECTED`** · **`GLOBAL_TEXT_POTENCY_LEAKAGE_BLOCKED`** · **`LEGACY_ONE_POTENCY_FOR_ALL_FORMULAS_REJECTED`**

#### **Q15-N — Output schema (minimum fields)**

`question_15_status` · `formula_slot_id` · `formula_target_id` · `slot_resolution_status` · `slot_potency_status` · `potency_status` · `selected_cascade` · `selected_dilution` · `patient_resolution_status` · `split_status` · `prescription_status` · `potency_evidence_item_ids` · `potency_evidence_source_ids` · `limitation_codes` · `reason_codes` · `registry_q15_selector_status` · `final_doctor_approval_required` · `automatic_issuance` · `execution_status` · `automatic_multi_formula_potency_runtime` · `current_runtime_potency_delta`

Lifecycle · slot status · patient aggregate · reason-code namespaces **separate**.

#### **Q15-O — Canonical statuses and reason codes**

**`question_15_status`:** **`NOT_STARTED`** · **`OWNER_DECISION_RECORDED`** · **`CLOSURE_VALIDATION_PENDING`** · **`CLOSED`** · **`NOT_IMPLEMENTED`**

**`slot_resolution_status`:** reuse **Q9-Q** enums where applicable · **`RESOLVED_DRAFT_CANDIDATE`** · **`UNRESOLVED`**

**`patient_resolution_status`:** **`PARTIALLY_RESOLVED`** · **`RESOLVED`** · **`UNRESOLVED`** · **`PRESCRIPTION_HOLD`** (per **Q9-N** / **Q15-E**)

**Canonical reason codes (minimum):** **`CROSS_FORMULA_POTENCY_LEAKAGE_BLOCKED`** · **`PATIENT_GLOBAL_POTENCY_OUTPUT_PROHIBITED`** · **`MIXTURE_MAX_SEVERITY_SHORTCUT_REJECTED`** · **`GLOBAL_TEXT_POTENCY_LEAKAGE_BLOCKED`** · **`LEGACY_ONE_POTENCY_FOR_ALL_FORMULAS_REJECTED`** · **`REGISTRY_Q15_SELECTOR_BLOCKED`** · **`PARTIAL_SLOT_RESOLUTION_REQUIRES_DOCTOR_REVIEW`** · **`PRESCRIPTION_HOLD`**

#### **Q15-P — Outcome matrix**

| # | Condition | Slot A | Slot B | Patient | Min reason | Dr approval |
|---|-----------|--------|--------|---------|------------|-------------|
| 1 | Two slots · both gates pass · different **D5** / **D10** | **D5** draft | **D10** draft | **`PARTIALLY_RESOLVED`** or **`RESOLVED`** | — | **true** |
| 2 | A resolved · B missing polarity | Draft | **UNRESOLVED** null | **`PARTIALLY_RESOLVED`** | **Q11** / **Q9** codes | **true** |
| 3 | Leakage attempt (B uses A severity) | Draft | **UNRESOLVED** | **`PARTIALLY_RESOLVED`** | **`CROSS_FORMULA_POTENCY_LEAKAGE_BLOCKED`** | **true** |
| 4 | **Q9-N** valid + unresolved sibling | Preserved draft | **UNRESOLVED** | **`PARTIALLY_RESOLVED`** | **`PARTIAL_SLOT_RESOLUTION_REQUIRES_DOCTOR_REVIEW`** | **true** |
| 5 | Crisis active | **null** | **null** | **`PRESCRIPTION_HOLD`** | **`PRESCRIPTION_HOLD`** | **true** |
| 6 | **D13-HS** | **null** | **null** | Blocked | **D13-HS** | **true** |
| 7 | One-potency-for-all attempt | Blocked | Blocked | Hold / null | **`LEGACY_ONE_POTENCY_FOR_ALL_FORMULAS_REJECTED`** | **true** |
| 8 | Mixture-max severity shortcut | Per-slot **Q13** | Per-slot **Q13** | Per **Q13** | **`MIXTURE_MAX_SEVERITY_SHORTCUT_REJECTED`** if attempted | **true** |
| 9 | **global_text** keyword → all slots | Per-slot fail or block | Same | Partial/null | **`GLOBAL_TEXT_POTENCY_LEAKAGE_BLOCKED`** | **true** |
| 10 | Same target duplicate evidence | **Q-L** merge | — | Per slot | — | **true** |
| 11 | Same target valid contradiction | **UNRESOLVED** | — | Per slot | Contradiction codes | **true** |
| 12 | Flare + chronic slots (**Q12-K**) | Independent phase path | Independent | Per **Q12** | Isolation codes if leak | **true** |
| 13 | **Q14** adult · two slots | Same age context | Independent **D\*** | Per **Q14-L** | **`ADULT_AGE_RESOLVED_NO_POTENCY_OVERLAY`** | **true** |
| 14 | Registry selector attempt | **null** | **null** | Hold | **`REGISTRY_Q15_SELECTOR_BLOCKED`** | **true** |
| 15 | Route copy oral → tablet | Oral only | — | Block cross-route | Route leakage codes | **true** |
| 16 | Single formula slot | Full slot pass | N/A | **`RESOLVED`** or **UNRESOLVED** | Per gates | **true** |

#### **Q15-R — Owner approved policy combination**

| Option | Recorded effect |
|--------|-----------------|
| **A** | Integration-only Rule 4 multi-slot orchestration — **no** new dilution ladder |
| **B** | Strict cross-formula leakage block (**Q15-C**) |
| **C** | Mandatory **Q9-N** partial multi-formula default (**Q15-D**) |

**Combined** per owner approval — **Q7–Q14** clinical bodies **unchanged**.

#### **Q15-S — System and doctor roles**

**System:** run **Q15-B** per oral **`formula_slot_id`**; enforce **Q15-C** leakage block; aggregate **Q15-D** partial status; apply **Q15-E** patient-wide holds; produce complete multi-formula draft + explanatory summary (**5R-SDG**).

**Doctor:** **not** compelled to choose potency **during** analysis; reads completed summary; final approval or correction (**5R-DRG**). **No** automatic prescription issuance without required approval.

#### **Q15-T — Execution boundary**

| Field | Value |
|-------|--------|
| **Question 15** | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_multi_formula_potency_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **Rule 4** | **NOT_FROZEN** · **NOT_IMPLEMENTED** |
| **Question 16+** | **NOT_STARTED** / **PENDING** |

#### **Q15-U — No paid API**

Question **15** **must not** require or permit **paid API**, **paid LLM**, **paid OCR**, or **paid clinical service** dependencies. Future implementation: deterministic local rules · versioned data assets · approved local/self-hosted open-source components only.

**STOP — WAIT FOR QUESTION 15 FINAL CLOSURE VALIDATION** *(superseded — Q15-CLOSE formal closure recorded above.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 16 READ-ONLY AUDIT** *(superseded — Q16-CLOSE owner specification recorded below.)*

### Phase 5R-4D-Q16-CLOSE — FORMULA-SPECIFIC STRUCTURED REPORT EVIDENCE AND D04/D08 WIRING CONTRACT (**Clinical Question 16**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **FORMULA-SPECIFIC STRUCTURED REPORT EVIDENCE AND D04/D08 WIRING CONTRACT**

**Important naming (mandatory distinction):**

| Term | Meaning |
|------|---------|
| **Rule 4 Question 16** | Report-object / item-level finding wiring · **`global_text`** quarantine · slot-bound evidence pools |
| **Rule 4 Question 15** | Multi-slot Rule 4 orchestration — **not** report ingestion |
| **Q07C-CLOSE-D04** | Verified clinical evidence lifecycle — **referenced**, **not rewritten** |
| **Q07C-CLOSE-D08** | Source-type confidence engine — **referenced**, **not rewritten** |
| **Q3F / Q4F / Q5F** | Keyword classification rows — **consumed** by wiring; bodies **unchanged** |

**Owner approval:** Question **16** clinical specification recorded (**Q16-A**–**Q16-U**). **Question 7** remains **FULLY_RESOLVED**. **Questions 8–15** remain **CLOSED** · **NOT_IMPLEMENTED** (clinical bodies **unchanged**). **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED**.

**Owner approval (formal closure):** Question **16** final validation **READY_TO_CLOSE** accepted — **Q16-CLOSE** recorded **CLOSED** (**Q16-A**–**Q16-U** clinical text **unchanged**; **`execution_status = NOT_IMPLEMENTED`** · **`automatic_report_wiring_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** · **`registry_q16_selector_status = NOT_EXECUTABLE_AS_Q16_SELECTOR`** · **`non_bp_critical_safety_catalog_status = SEPARATE_SAFETY_DATA_FREEZE_PENDING`** unchanged).

**Formal closure:** **Q16-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · prior **CLOSURE_VALIDATION_PENDING** superseded by owner acceptance.

**Closure interpretation (**Q16-G** — metadata only, non-mutating):** “Newer verified” in **Q16-G** means **current-case evidence selection** among usable items per **D04** (**`SUPPORTED`** / **`VERIFIED`**) — **not** a separate verification lifecycle; **D04** **SUPPORTED → VERIFIED** on doctor **Approve** **unchanged**.

#### **Q16-A — Canonical scope**

Question **16** defines how **diagnostic reports** (imaging · laboratory · pathology · structured clinical documents · qualified OCR outputs) enter Rule 4 as **formula-specific structured evidence** — replacing legacy **`global_text`** + **`sys_text_full`** concatenation.

| Item | Rule |
|------|------|
| **Scope** | Report ingestion · item extraction · slot/target binding · selector input wiring |
| **Does not create** | New dilution ladder · new pathology class engine · new confidence tiers |
| **Implements by reference** | **Q07C-CLOSE-D04** · **Q07C-CLOSE-D08** · **Q07C-D07P-MICRO Q-L** · **Q07C-D07P-MICRO Q-D** · **Q15-C** · **Q15-I** |
| **Integrates** | **Q3F** · **Q4F** · **Q5F** classification · **Q06C** / **Q15-E** patient-wide gates · **5R-SDG** · **5R-DRG** |

#### **Q16-B — Item-level report decomposition · global text quarantine**

| Rule | Detail |
|------|--------|
| **Decomposition** | Every clinical **report document** **must** be split into **one or more** structured **`evidence_item`** findings before Rule 4 selector evaluation |
| **Prohibited inputs** | Aggregated **`global_text`**, **`sys_text_full`**, or any **report-global concatenated string** as a **potency selector** input |
| **Legacy** | Keyword hits on global/sys text paths (**Q3**–**Q5** legacy · row **16** forensic) **rejected** — **NOT_EXECUTABLE** |
| **Rule 3 alignment** | Report findings **must not** exist only as global symptom text — structured items required |
| **Audit** | Raw document processing may use temporary buffers; **D04** retention rules apply (structured findings only after verified deletion of originals) |

#### **Q16-C — Mandatory fields (usable finding minimum)**

A finding **may** enter slot-local usable pools **only** when **all** mandatory fields are present and valid:

| Field group | Mandatory keys (minimum) |
|-------------|---------------------------|
| **Identity** | **`report_id`** (or equivalent document identity) · **`finding_id`** (stable item identity within report) |
| **Provenance** | **`source_type`** per **Q07C-CLOSE-D08** · **`source_reference`** · **`timestamp_or_case_context`** |
| **Slot binding** | **`formula_slot_id`** · **`formula_target_id`** |
| **Anatomy / pathology** | **`target_organ_system`** (Rule 3 organ/system) · **`anatomical_site`** · **`target_pathology`** (pathology identity / approved group per **Q-D**) |
| **Clinical assertion** | **`assertion_status`** · **`verification_status`** · **`formula_relevance`** (**DIRECT** required for selector use) |
| **Confidence** | **`confidence_score`** (**0.00**–**1.00**) per **Q07C-CLOSE-D08** |

**D04 alignment:** Usable draft items require **PRESENT/POSITIVE** assertion · **SUPPORTED/VERIFIED** verification · **DIRECT** relevance · organ/pathology **match** to bound formula target.

#### **Q16-D — Conditional mandatory interpretation fields**

When **clinical interpretation** of the finding **requires** them for safe binding or cascade gates, the following **become mandatory** for that item (otherwise **`IGNORED_NOT_USABLE`**):

| Field class | Examples (non-exhaustive) |
|-------------|---------------------------|
| **Quantitative** | **`value`** · **`unit`** · reference range context where applicable |
| **Localization** | **`laterality`** · **`segment`** · **`anatomical_subsite`** |
| **Staging / grading** | **`grade`** · **`stage`** · **`severity_descriptor`** on report (distinct from **Q13** **`severity_score`**) |

**Separation:** Extracted **finding text** ≠ **clinical diagnosis** ≠ **potency selection** — OCR/NLP output remains **`SUPPORTED`** candidate until **D04** + binding gates pass.

#### **Q16-E — Missing binding · invalid item · sibling preservation**

| Case | Outcome |
|------|---------|
| **Missing any essential mandatory field** (**Q16-C**) | Item → **`IGNORED_NOT_USABLE`** · append-only reason · **must not** block unrelated items from same report |
| **Document fails D08-G document gate** | **All** items from that document **`IGNORED_NOT_USABLE`** |
| **Below D08 item threshold** | That item only **`IGNORED_NOT_USABLE`** |
| **Valid sibling findings** | **Preserved** · may support **other** slots/targets independently (**Q16-F**) |
| **Slot mandatory gate starved** | **That slot** may → **`potency_status = UNRESOLVED`** per **Q15-I** / **5R-SDG** — **must not** nullify valid sibling slot drafts (**Q15-D** · **Q9-N**) unless **Q16-H** patient-wide gate |

#### **Q16-F — One report · multiple formulas · cross-formula prohibition**

| Rule | Detail |
|------|--------|
| **Multi-target report** | **Allowed** — one **`report_id`** **may** produce findings bound to **different** **`formula_slot_id`** / **`formula_target_id`** pairs |
| **Per-finding gate** | **Each** finding **must independently** pass **Q07C-CLOSE-D04** · **Q-D** organ/site/pathology/causal alignment · **D08** usability |
| **Prohibited** | **Cross-formula propagation** — one finding’s binding **must not** auto-qualify another slot; **keyword** · **global_text** · **shared OCR blob** shortcuts **prohibited** (**Q15-C**) |
| **Dedupe** | **Q-L** — same parent source ≠ independent corroboration; duplicate copies **must not** inflate counts |

#### **Q16-G — Supersession · historical-only evidence**

| Rule | Detail |
|------|--------|
| **Historical-only** | Findings marked or adjudicated **historical-only** per **CLOSE-D04** exclusions **must not** alone select current potency |
| **Supersession** | When **newer verified** evidence exists for the **same test/site/pathology binding** (same **`formula_target_id`** + matching organ/site/pathology identity + comparable **`source_type`** class), **current decision** uses **newer** item; **older** retained **append-only** in audit history |
| **Prohibited** | Silent discard of superseded raw history; fabricated merge of contradictory values |
| **Phase context** | **D09-3** priority (**current active** over fully resolved history) **preserved** |

#### **Q16-H — Patient-wide escalation · critical findings catalog boundary**

Patient-wide gates **supersede** per-slot drafts (**Q15-E** · **Q06C**):

| Trigger class | Minimum outcome |
|---------------|-----------------|
| **Source-declared critical / life-threatening / urgent** finding (structured flag on report/item where present) | **`URGENT_ESCALATION`** · **`PRESCRIPTION_HOLD`** · all slots **`selected_dilution` = null** |
| **Frozen crisis vital** policies (**Q06C** BP crisis bands · applicable **D08-H** vital rules already frozen) | Same patient-wide hold / escalation |
| **Frozen red-flag** classes already recorded (**Q3F** · **Q4F** acute neurological red flag · etc.) | Escalation + review — **not** auto-potency |

**Non-BP critical lab/imaging numeric thresholds:**

| Field | Value |
|-------|--------|
| **`NON_BP_CRITICAL_SAFETY_CATALOG_STATUS`** | **`SEPARATE_SAFETY_DATA_FREEZE_PENDING`** |
| **Runtime rule** | **Must not** invent or assume threshold values until separate owner freeze — wiring **must** accept catalog when frozen |
| **Until frozen** | Source-declared critical flags + **Q06C** + existing frozen red-flag enums **only** — no inferred lab panic thresholds |

#### **Q16-I — Unstructured chief complaint**

| Rule | Detail |
|------|--------|
| **Tier** | Unstructured chief complaint extraction → **Tier 4A** (**D08-E**) **`SUPPORTED_CLINICAL_EVIDENCE_CANDIDATE`** **supporting role only** |
| **Prohibited** | Treating chief complaint as **independent corroborating source** for multi-source gates (**Q-L** · **D09-5** · **D10** minimum source counts) |
| **Usability** | Becomes **usable DIRECT** evidence **only** after full **D04** + binding gates — **never** alone for potency |

#### **Q16-J — Q3 / Q4 / Q5 classification codes**

| Rule | Detail |
|------|--------|
| **Codes** | **Controlled** · **versioned** · **extensible** taxonomy — aligns with recorded **Q3F** · **Q4F** · **Q5F** enums |
| **Prohibited** | Free-text or OCR label **instantiating** a **new executable** classification at runtime |
| **Extension process** | New codes require **owner documentation** + version bump — **not** silent NLP invention |
| **Potency** | Classified items follow **Q3F**–**Q5F** — labels **must not** auto-select dilution |

#### **Q16-K — Clinical photographs · local vision boundary**

| Rule | Detail |
|------|--------|
| **Raw photo / automatic vision output** | **Must not** become potency or diagnosis **selector** input |
| **Usable path** | Doctor **site-bound structured observation** entered after review → **Tier 1** (**D08-I** + **D08-B**) |
| **Local photo inference** | **`NOT_EXECUTABLE`** until **separate** local-model audit/freeze — **unchanged** from **D08-I** |
| **Paid vision API** | **PROHIBITED** |

#### **Q16-L — CONFIRMED_VERIFIED disease / report labels**

| Rule | Detail |
|------|--------|
| **Allowed** | **Safety** · **referral** · **specialist review** triggers · **formula-scoped DIRECT** evidence when full **D04** + **Q-D** binding passes |
| **Prohibited** | **Label alone** selecting **medicine** · **formula** · **potency** / dilution |
| **Oncology / red-flag text** | **Q3F** policy preserved — decision-support + **FINAL_DOCTOR_APPROVAL_REQUIRED** |

#### **Q16-M — Registry and legacy selector quarantine**

| Field | Value |
|-------|--------|
| **`registry_q16_selector_status`** | **`NOT_EXECUTABLE_AS_Q16_SELECTOR`** |

**Non-executable selector paths (minimum):**

- **`global_text`** / **`sys_text_full`** report-global keyword potency
- **Registry** report-keyword shortcuts
- **116k** / **nearest-match** cross-formula promotion (**D08-F** supporting-only preserved)
- **Keyword-alone** · **substring** legacy paths (**Q3**–**Q5**)
- **Mixture-global** OCR hit → all slots

**Reason codes (minimum):** **`GLOBAL_TEXT_POTENCY_LEAKAGE_BLOCKED`** · **`REGISTRY_Q16_SELECTOR_BLOCKED`** · **`REPORT_KEYWORD_SELECTOR_BLOCKED`** · **`CROSS_FORMULA_REPORT_LEAKAGE_BLOCKED`**

#### **Q16-N — Wiring integration (non-mutating references)**

Per **`formula_slot_id`** evidence audit **must** apply (**Q15-I** preserved):

1. **Q16-B** decomposition → slot-filtered item set  
2. **Q07C-CLOSE-D08** document-then-item gates  
3. **Q07C-CLOSE-D04** lifecycle and validity  
4. **Q-L** deduplication  
5. **Q07C-D07P-MICRO Q-D** binding  
6. **Q12** / **Q13** / **Q7–Q11** cascades unchanged  
7. **Q15-C** leakage block on any cross-slot read  

#### **Q16-O — Minimum output schema (report wiring layer)**

`question_16_status` · `report_id` · `finding_id` · `formula_slot_id` · `formula_target_id` · `target_organ_system` · `anatomical_site` · `target_pathology` · `source_type` · `assertion_status` · `verification_status` · `formula_relevance` · `confidence_score` · `classification_code` · `classification_version` · `item_usability_status` · `superseded_by_finding_id` · `report_evidence_item_ids` · `report_evidence_source_ids` · `limitation_codes` · `reason_codes` · `registry_q16_selector_status` · `non_bp_critical_safety_catalog_status` · `execution_status` · `current_runtime_potency_delta`

Slot-level **`potency_evidence_item_ids`** (**Q15-N**) **must** reference only items passing **Q16** wiring.

#### **Q16-P — Canonical statuses and reason codes**

**`question_16_status`:** **`NOT_STARTED`** · **`OWNER_DECISION_RECORDED`** · **`CLOSURE_VALIDATION_PENDING`** · **`CLOSED`** · **`NOT_IMPLEMENTED`**

**`item_usability_status`:** **`USABLE_DIRECT_CANDIDATE`** · **`IGNORED_NOT_USABLE`** · **`INVALID_NOT_USABLE`** · **`SUPERSEDED_HISTORICAL`**

**`execution_status`:** **`NOT_IMPLEMENTED`**

**`current_runtime_potency_delta`:** **`NONE`** (unchanged)

**Canonical reason codes (minimum — harmonized additively with **Q16-Q** matrix; clinical meaning unchanged):** **`GLOBAL_TEXT_POTENCY_LEAKAGE_BLOCKED`** · **`REGISTRY_Q16_SELECTOR_BLOCKED`** · **`REPORT_KEYWORD_SELECTOR_BLOCKED`** · **`CROSS_FORMULA_REPORT_LEAKAGE_BLOCKED`** · **`MISSING_MANDATORY_BINDING_FIELD`** · **`EVIDENCE_SUPERSEDED`** · **`HISTORICAL_ONLY_EXCLUDED`** · **`CHIEF_COMPLAINT_SUPPORTING_ONLY`** · **`URGENT_ESCALATION`**

#### **Q16-Q — Outcome matrix (representative)**

| # | Condition | Slot A | Slot B | Patient | Min reason | Dr approval |
|---|-----------|--------|--------|---------|------------|-------------|
| 1 | One report · two findings · each binds one slot · both pass D04/D08 | Usable pool | Usable pool | Partial/resolved per **Q15-D** | — | **true** |
| 2 | Same report · finding B missing **`anatomical_site`** | Usable | B item **`IGNORED_NOT_USABLE`** | Partial if A ok | **`MISSING_MANDATORY_BINDING_FIELD`** | **true** |
| 3 | **global_text** keyword path attempted | Blocked | Blocked | Hold/null | **`GLOBAL_TEXT_POTENCY_LEAKAGE_BLOCKED`** | **true** |
| 4 | Newer verified same-site lab supersedes older | Uses newer | — | — | **`EVIDENCE_SUPERSEDED`** (audit) | **true** |
| 5 | Historical-only finding alone | No potency from item | — | — | **`HISTORICAL_ONLY_EXCLUDED`** | **true** |
| 6 | Source-declared critical flag | **null** | **null** | **`PRESCRIPTION_HOLD`** | **`URGENT_ESCALATION`** | **true** |
| 7 | Chief complaint only · no corroboration | No extra source count | — | — | **`CHIEF_COMPLAINT_SUPPORTING_ONLY`** | **true** |
| 8 | **116k** nearest-match shortcut | Blocked | — | — | **`REGISTRY_Q16_SELECTOR_BLOCKED`** | **true** |

#### **Q16-R — System and doctor roles**

**System:** ingest reports → extract items → assign **Q16-C** fields → apply **D08** + **D04** + **Q-L** → bind to slot pools → complete **single-pass** analysis + draft summary (**5R-SDG** — no follow-up questions).

**Doctor:** review · approve · correct draft → **`VERIFIED`** on items used in approved draft (**CLOSE-D04**); **`final_doctor_approval_required = true`** (**5R-DRG** / **FINAL_DOCTOR_APPROVAL_REQUIRED**).

#### **Q16-S — Precedence (report wiring layer)**

**Order (preserve **Q15-K** + cascade):**

1. **Q16-H** / **Q06C** / **D13-HS** / **Q15-E** patient-wide  
2. **Q16-B** quarantine — reject global_text selector paths  
3. **D08-G** document gate → per-item thresholds  
4. **Q16-C/D** mandatory + conditional fields  
5. **Q16-J** classification assignment (controlled codes)  
6. **D04** validity + **Q-D** binding  
7. **Q-L** dedupe · **Q16-G** supersession  
8. Slot-local **Q7–Q15** cascade (unchanged)  

#### **Q16-T — Execution boundary**

| Field | Value |
|-------|--------|
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_report_wiring_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **Question 17+** | **NOT_STARTED** / **PENDING** |
| **Rule 4** | **NOT_FROZEN** · **NOT_IMPLEMENTED** |

#### **Q16-U — No paid API**

Question **16** **must not** require or permit **paid API**, **paid LLM**, **paid OCR**, **paid translation**, or **paid clinical/vision** dependencies. **Local** / **self-hosted** processing only — consistent with **D04** · **D08-K**.

**STOP — WAIT FOR QUESTION 16 FINAL CLOSURE VALIDATION** *(superseded — Q16-CLOSE formal closure recorded above.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 17 READ-ONLY AUDIT** *(superseded — Q17-CLOSE owner specification recorded below.)*

### Phase 5R-4D-Q17-CLOSE — RULE 1 TEMPERAMENT SUPPORTING-WEIGHT INTEGRATION CONTRACT (**Clinical Question 17**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **RULE 1 TEMPERAMENT SUPPORTING-WEIGHT INTEGRATION CONTRACT**

**Important naming (mandatory distinction):**

| Term | Meaning |
|------|---------|
| **Rule 4 Question 17** | Rule 1 → Rule 4 **wiring** · supporting / tie-break only |
| **Q7 Decision 12** / **Q07C-CLOSE-D12** | Temperament **qualitative preference matrix** — **referenced**, **not rewritten** |
| **Q08-CLOSE Q8-G** | **NEGATIVE** **D1/D2** temperament order — **referenced**, **not rewritten** |
| **Rule 4 Question 12** | Disease **phase** integration — **not** temperament |

**Owner approval:** Question **17** clinical specification recorded (**Q17-A**–**Q17-U**). **Question 7** remains **FULLY_RESOLVED**. **Questions 8–16** remain **CLOSED** · **NOT_IMPLEMENTED** (clinical bodies **unchanged**). **Rule 1** freeze · **D12** · **Q8-G** clinical text **unchanged**. **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED**.

**Owner approval (formal closure):** Question **17** final validation **READY_TO_CLOSE** accepted — **Q17-CLOSE** recorded **CLOSED** (**Q17-A**–**Q17-U** clinical text **unchanged**; **`execution_status = NOT_IMPLEMENTED`** · **`automatic_temperament_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** · **`registry_q17_selector_status = NOT_EXECUTABLE_AS_Q17_SELECTOR`** unchanged).

**Formal closure:** **Q17-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · prior **CLOSURE_VALIDATION_PENDING** superseded by owner acceptance.

**Closure note (Rule 1 impact matrix — metadata only, non-mutating):** Generic Rule 1 “scoring/modifier” wording for potency in [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) is **limited/superseded for EHAS2 Rule 4 potency** by **Q17-B** · **Q17-C** and **D12-A** (by reference) — **no** authorized **numerical potency scoring** from temperament.

**Closure note (**UNRESOLVED_TIE** · **`primary_temperament_consultation_confirmed`** — metadata only, non-mutating):** When Rule 1 emits **`UNRESOLVED_TIE`**, **`primary_temperament_consultation_confirmed`** **must not** be treated as potency preference eligibility — tie-break status remains **NO_PREFERENCE** per **Q17-I** / **Q8-G** (dual-qualified **D1/D2** only).

#### **Q17-A — Canonical scope**

Question **17** defines how **Rule 1** temperament outputs attach to Rule 4 per **`formula_slot_id`** as **supporting evidence** and **qualitative tie-break** only — **not** a standalone potency selector or numeric weight engine.

| Item | Rule |
|------|------|
| **Scope** | Integration contract · orchestration inputs · tie-break eligibility · quarantine |
| **Does not create** | New dilution ladder · numeric temperament potency scores · dual **D3/D5** candidate hook |
| **Implements by reference** | [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) · **Q07C-CLOSE-D12** (**D12-A**–**D12-D**, **D12-B-EXEC**) · **Q08-CLOSE** **Q8-G** · **CLOSE-D05** · **Q15-C** · **5R-SDG** · **5R-DRG** |

#### **Q17-B — No numerical potency weights · Rule 1 score boundary**

| Rule | Detail |
|------|--------|
| **Prohibited** | Any **numerical temperament potency weight** for Rule 4 dilution scoring |
| **Rule 1 `individual_scores`** | **Temperament resolution only** — **must not** feed dilution scoring |
| **Rule 1 BP supporting scores** | **Temperament inference only** — **must not** feed dilution scoring |
| **D12-A preserved** | **No** numeric temperament weight scores (by reference) |

#### **Q17-C — SUPPORTING_EVIDENCE_ONLY · no candidate mutation**

Temperament **must not:**

- **Create** any **D1–D60** candidate  
- **Promote** · **demote** · or **override** any cascade outcome  
- Override **Rule 2** polarity · **Rule 3** target · **D11** phase · **D10** severity · **CLOSE-D05** · **Q06C** · **D30/D60** gates  

Role: **supporting evidence** + **dual-qualified tie-break** only (**Q17-G**, **Q17-J**).

#### **Q17-D — Primary temperament input · current consultation · no stale snapshot**

| Rule | Detail |
|------|--------|
| **Tie-break token** | **`primary_temperament`** only — **current consultation** **resolved** or **doctor-confirmed** |
| **Prohibited** | Prior **doctor-verified** temperament **snapshot** for potency tie-break **without** **reconfirm** in **current consultation** |
| **Wiring default** | Missing reconfirm → treat as **UNKNOWN** / **NO_PREFERENCE** (**Q17-E**) |

#### **Q17-E — Unresolved Rule 1 states → UNKNOWN / NO_PREFERENCE**

For **Q17** wiring, map to **NO_PREFERENCE** (no temperament tie-break):

- **Missing** temperament payload  
- **Low-confidence** Rule 1 result (per Rule 1 contract thresholds when implemented)  
- **`resolution_status = ADDITIONAL_INFORMATION_REQUIRED`**  
- **`resolution_status = FOLLOW_UP_REQUIRED`**  
- **`primary_temperament = UNKNOWN`**  

**Must not** coerce to **LYMPHATIC** / **SANGUINE** / etc. for potency.

#### **Q17-F — Secondary · mixed components · annotation only**

| Field | Potency tie-break |
|-------|-------------------|
| **`secondary_temperament`** | **Summary / annotation only** — **prohibited** |
| **`mixed_components`** | **Summary / annotation only** — **prohibited** |

#### **Q17-G — NEGATIVE pathway · Q8-G tie-break (after all Q8 gates)**

**Preconditions (all mandatory):**

1. **Q08-CLOSE** primary **D1/D2** selector completed for the slot  
2. **Both** **D1** **and** **D2** pass **all** applicable **Q8** clinical gates for that slot  

**Then** apply owner **Q8-G** temperament preference (**D12-B** matrix text **unchanged** by reference):

| **`primary_temperament`** | Preference |
|---------------------------|------------|
| **LYMPHATIC** | **D1** |
| **SANGUINE** | **D2** |
| **NERVOUS** | **D2** |
| **BILIOUS_HEPATIC** | **D2** |
| **MIXED** · **UNKNOWN** · **NO_PREFERENCE** states (**Q17-E**, **Q17-I**) | **No** preference |

**If tie-break cannot resolve (incl. NO_PREFERENCE):** **`potency_status` = UNRESOLVED** · **`selected_dilution` = null** · appropriate **`reason_codes`** (**Q8-O** / **Q17-P**).

#### **Q17-H — Single qualified D1 or D2 only**

When **exactly one** of **D1** / **D2** is qualified for the slot, temperament **must not** block · change · promote · or demote that outcome (**D12-A** by reference).

#### **Q17-I — UNRESOLVED_TIE**

**Rule 1 `UNRESOLVED_TIE`:** treat as **NO_PREFERENCE** for temperament tie-break.

| Scope | Rule |
|-------|------|
| **Does not** | Fail entire cascade by temperament alone |
| **Does** | Leave **dual-qualified D1/D2** tie **unresolved** → **`potency_status` = UNRESOLVED** · **`selected_dilution` = null** when no preference applies |

#### **Q17-J — POSITIVE pathway · D3 ↔ D5 · D12-B-EXEC · CLOSE-D05**

| Field | Value |
|-------|--------|
| **D12-B-EXEC** | **`CURRENT_CASCADE_NO_OP`** — **unchanged** |
| **`temperament_preference_applied`** | **`FALSE`** on **D3↔D5** path — **unchanged** |
| **Selector** | **CLOSE-D05** remains sole **D3/D5** authority — temperament **must not** override |

#### **Q17-K — BILIOUS_HEPATIC D3/D5 context · no dual-candidate hook**

| Rule | Detail |
|------|--------|
| **BILIOUS_HEPATIC** secretory vs inflammatory **D3/D5** context matrix | **Annotation-only** in **Q17** wiring — **not** executable selector input |
| **Dual-candidate D3/D5 hook** | **Not** part of **Q17-CLOSE** — **future** owner decision only (**D12-B-EXEC** preserved) |

#### **Q17-L — NERVOUS temperament alone · qualification ban**

**NERVOUS** temperament **alone** **must not** qualify or verify:

**D1** · **D2** · **D3** · **D5** · **D10** · **D30** · **D60** · formula hypersensitivity (**CLOSE-D05**) · **`IS_NERVOUS_PATHOLOGY_CLASS`** (**Q07C-D07P-NERVOUS**)

*(Does not relax **Q17-G**: when **both** **D1** and **D2** are clinically qualified by **Q8**, **NERVOUS** may prefer **D2** in tie-break — **not** Nervous-alone qualification.)*

#### **Q17-M — Patient context · per-slot tie-break · no cross-slot copy**

| Rule | Detail |
|------|--------|
| **Patient-level** **`primary_temperament`** | May be supplied as **context** to **each** **`formula_slot_id`** |
| **Tie-break** | Runs **independently per slot** after **that slot’s** dual-qualified pair (if any) |
| **Prohibited** | Copy **`selected_dilution`** · **D1/D2** qualification · or temperament tie outcome across slots (**Q15-C**, **Q8-M**) |

#### **Q17-N — Registry and legacy selector quarantine**

| Field | Value |
|-------|--------|
| **`registry_q17_selector_status`** | **`NOT_EXECUTABLE_AS_Q17_SELECTOR`** |

**Non-executable paths (minimum):** registry **`potency_logic`** · disease-name lookup · keyword mapping · numerology · legacy **`prakriti`** string shortcuts · fixed temperament→medicine mapping · fixed temperament→potency mapping · legacy Mixed/Balanced defaults

**Reason codes (minimum):** **`REGISTRY_Q17_SELECTOR_BLOCKED`** · **`TEMPERAMENT_POTENCY_WEIGHT_PROHIBITED`** · **`TEMPERAMENT_CANDIDATE_CREATION_PROHIBITED`** · **`STALE_TEMPERAMENT_SNAPSHOT_REJECTED`** · **`TEMPERAMENT_NO_PREFERENCE`** · **`TEMPERAMENT_D1_D2_TIE_UNRESOLVED`** · **`CROSS_FORMULA_TEMPERAMENT_LEAKAGE_BLOCKED`** · **`NERVOUS_TEMPERAMENT_ALONE_QUALIFICATION_BLOCKED`**

#### **Q17-O — Minimum output schema (wiring layer)**

`question_17_status` · `formula_slot_id` · `primary_temperament` · `primary_temperament_consultation_confirmed` · `temperament_resolution_status` · `temperament_preference_applied` · `temperament_tie_break_eligible` · `preferred_dilution_candidate` · `alternate_dilution_candidate` · `limitation_codes` · `reason_codes` · `registry_q17_selector_status` · `execution_status` · `automatic_temperament_potency_runtime` · `current_runtime_potency_delta`

#### **Q17-P — Canonical statuses**

**`question_17_status`:** **`NOT_STARTED`** · **`OWNER_DECISION_RECORDED`** · **`CLOSURE_VALIDATION_PENDING`** · **`CLOSED`** · **`NOT_IMPLEMENTED`**

**`temperament_tie_break_eligible`:** **`TRUE`** · **`FALSE`**

**`execution_status`:** **`NOT_IMPLEMENTED`**

**`automatic_temperament_potency_runtime`:** **`FALSE`**

**`current_runtime_potency_delta`:** **`NONE`**

#### **Q17-Q — Outcome matrix (representative)**

| # | Condition | Outcome | Min reason |
|---|-----------|---------|------------|
| 1 | **Both D1+D2** qualified · **LYMPHATIC** confirmed | Prefer **D1** | — |
| 2 | **Both D1+D2** qualified · **SANGUINE** confirmed | Prefer **D2** | — |
| 3 | **Both D1+D2** qualified · **UNKNOWN** / **NO_PREFERENCE** | **UNRESOLVED** · null | **`TEMPERAMENT_NO_PREFERENCE`** |
| 4 | **Only D2** qualified | **D2** unchanged by temperament | — |
| 5 | **POSITIVE** slot · **CLOSE-D05** branch | **D3** or **D5** only · **`temperament_preference_applied = FALSE`** | **`CURRENT_CASCADE_NO_OP`** (audit) |
| 6 | Stale snapshot without reconfirm | No tie-break | **`STALE_TEMPERAMENT_SNAPSHOT_REJECTED`** |
| 7 | **NERVOUS-alone** hypersensitivity attempt | Block qualification | **`NERVOUS_TEMPERAMENT_ALONE_QUALIFICATION_BLOCKED`** |
| 8 | Registry temperament shortcut | Blocked | **`REGISTRY_Q17_SELECTOR_BLOCKED`** |
| 9 | **Both D1+D2** qualified · **MIXED** | **NO_PREFERENCE** · **UNRESOLVED** · null | **`TEMPERAMENT_NO_PREFERENCE`** |
| 10 | **Both D1+D2** qualified · **UNRESOLVED_TIE** | **NO_PREFERENCE** · **UNRESOLVED** · null | **`TEMPERAMENT_NO_PREFERENCE`** |

*(Rows **9–10** additive audit clarity — same clinical meaning as **Q17-G** / **Q17-I** / **Q8-G**; no change to frozen matrix text.)*

#### **Q17-R — System and doctor roles**

**System:** single-pass analysis (**5R-SDG**) · apply **Q17** wiring after per-slot cascade gates · emit explanatory summary including temperament **annotation** and tie-break audit when applicable.

**Doctor:** review · approve · correct final summary (**5R-DRG**); **`final_doctor_approval_required = true`** · **FINAL_DOCTOR_APPROVAL_REQUIRED**; temperament **reconfirm** in **current consultation** when used for tie-break.

#### **Q17-S — Precedence (integration layer)**

1. **Q06C** / **D13-HS** / **Q15-E** patient-wide  
2. Per-slot **Rule 2** · pathology · **D04/D08** · **D11/D10** · **CLOSE-D05** / **D30/D60** cascade  
3. **Q08-CLOSE** primary **D1/D2** selector  
4. **Q17-G** temperament tie-break (**dual-qualified only**)  
5. **Q17-J** — **no** **D3↔D5** temperament step  
6. **Q15-C** — no cross-slot copy  

#### **Q17-T — Execution boundary**

| Field | Value |
|-------|--------|
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_temperament_potency_runtime`** | **FALSE** |
| **`current_runtime_potency_delta`** | **NONE** |
| **Question 18+** | **Q18 CLOSED** · **RULE 4 FINAL CROSS-QUESTION INTEGRATION VALIDATION** pending |
| **Rule 4** | **NOT_FROZEN** · **NOT_IMPLEMENTED** |

#### **Q17-U — No paid API**

Question **17** **must not** require or permit **paid API**, **paid LLM**, **paid OCR**, or **paid clinical/vision** dependencies. **Local** / **self-hosted** Rule 1 processing only — consistent with **Rule 1** freeze.

**STOP — WAIT FOR QUESTION 17 FINAL CLOSURE VALIDATION** *(superseded — Q17-CLOSE formal closure recorded above.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 18 READ-ONLY AUDIT** *(superseded — Q18-CLOSE owner specification recorded below.)*

### Phase 5R-4D-Q18-CLOSE — PRESCRIPTION ISSUANCE AND FINAL DOCTOR-APPROVAL INTEGRATION CONTRACT (**Clinical Question 18**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Canonical subject:** **PRESCRIPTION ISSUANCE AND FINAL DOCTOR-APPROVAL INTEGRATION CONTRACT**

**Owner policy (recorded):** **Option A** (integration matrix · Rule 3-style case-level **`prescription_issue_allowed`**) **+ Option D** (**PRESCRIPTION_HOLD** never silent auto-clear) **+ strict partial-prescription finalization**

**Important naming (mandatory distinction):**

| Term | Meaning |
|------|---------|
| **Rule 4 Question 18** | Issuance / approval **integration** · **`prescription_issue_allowed`** · final Rx lifecycle |
| **Unresolved row 19** | **5R-SDG** — no follow-up during analysis — **referenced**, **not rewritten** |
| **Phase 5R-DRG** | Final doctor approval workflow · Hindi footer — **referenced**, **not rewritten** |
| **Rule 4 Questions 8–17** | Potency/dilution **selection** contracts — **unchanged** |
| **Q7 Decisions 1–14** | POSITIVE/NEGATIVE cascade · **D13** · **D14** — **unchanged** |

**Owner approval:** Question **18** clinical specification recorded (**Q18-A**–**Q18-U**). **Question 7** remains **FULLY_RESOLVED**. **Questions 8–17** remain **CLOSED** · **NOT_IMPLEMENTED** (clinical bodies **unchanged**). **Phase 5R-DRG** and **Phase 5R-SDG** bodies **unchanged**. **Rule 4** remains **NOT_FROZEN** · **NOT_IMPLEMENTED**.

**Owner approval (formal closure):** Question **18** final validation **READY_TO_CLOSE** accepted — **Q18-CLOSE** recorded **CLOSED** (**Q18-A**–**Q18-U** clinical text **unchanged** except documentation § cross-ref corrections below; runtime flags unchanged).

**Formal closure:** **Q18-CLOSE** · **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** · prior **CLOSURE_VALIDATION_PENDING** superseded by owner acceptance.

**Closure metadata (documentation § cross-ref corrections only — non-mutating):** **Q18-C** gate refs **(Q18-E, Q18-J)**; **Q18-D** Modify → **Q18-H** / **Q18-P** **`GATE_REVALIDATION`**; **Q18-D** unresolved manual-fill → **Q18-H**; **Q18-G** keep-and-resolve → **Q18-H**.

#### **Q18-A — Canonical scope**

Question **18** defines how Rule 4 and sibling engine outputs bind to **draft prescription issuance**, **`prescription_issue_allowed`**, and **final doctor approval** — **without** new D1–D60 selection rules.

| Item | Rule |
|------|------|
| **Scope** | Post–**5R-SDG** single-pass · draft Rx · case-level gates · Approve/Modify/Issue lifecycle |
| **Does not create** | New potency ladder · new polarity rules · new report ingestion |
| **Implements by reference** | **5R-DRG** · **5R-SDG** · **Q15-D/E** · **Q9-Q** · **Q06C** · **D13-HS** · **D13-C/D** · **Rule 2** · **Rule 3** `prescription_issue_allowed` |
| **Owner options** | **A + D** + strict partial finalization (this pass) |

#### **Q18-B — Post single-pass system outputs**

After **SYSTEM_SINGLE_PASS_COMPLETE** (**5R-SDG**):

| Output | Rule |
|--------|------|
| **Draft prescription** | Full multi-slot draft bound to **`formula_slot_id`** / targets |
| **Clinical summary** | Complete explanatory summary — **all** slots · uncertainty · safety · evidence limitations |
| **Footer** | **SUMMARY_REVIEW_FOOTER_REQUIREMENT** per **5R-DRG** (mandatory Hindi — **not** paraphrased in this contract) |
| **Prohibited** | Treating analysis completion as final issuance authority |

#### **Q18-C — Issuance flags (canonical defaults)**

| Field | Value |
|-------|--------|
| **`automatic_issuance`** | **`false`** — **always** on all Rule 4 draft paths |
| **`final_doctor_approval_required`** | **`true`** — **all** normal Rule 4 draft paths |
| **`prescription_issue_allowed`** | **`false`** until **recorded final doctor approval** **and** all applicable gates pass (**Q18-E**, **Q18-J**) |
| **Fully resolved, no-hold draft** | Still **`prescription_issue_allowed = false`** until doctor approval recorded — approval alone **insufficient** if any gate fails |

#### **Q18-D — Doctor role · no mid-analysis potency selection**

| Phase | Doctor |
|-------|--------|
| **During analysis** | **No** potency · medicine · formula branch selection (**5R-SDG**) |
| **After full summary** | Read **entire** summary + draft · **Approve** or **Modify** |
| **Modify (resolved potency correction)** | Allowed **only** with **`doctor_modification_justification`**, audit trail, and **GATE_REVALIDATION** per **Q18-H** / **Q18-P** — **no** raw silent overwrite |
| **Unresolved slot dilution** | **Prohibited:** direct manual **`selected_dilution`** fill + issue **without** required evidence fix + engine re-run + validation (**Q18-H**) |

#### **Q18-E — Hold and hard safety blocks (Option D)**

While **any** active hard block applies → **`prescription_issue_allowed = false`**.

| Block (minimum) | Outcome |
|-----------------|---------|
| **`PRESCRIPTION_HOLD`** (**Q06C** crisis · **Q15-E** patient-wide) | Issue **false** · **`hold_reason_codes`** populated |
| **Q06C** urgent escalation (active) | Same — **no** silent auto-clear |
| **D13-HS** verified **&lt; 1 year** | **`D13_HS_BLOCKED`** / **`NOT_GENERATED`** branch — **not** normal Approve path |
| Patient-wide contraindication hold | Issue **false** |
| **Rule 3** mandatory **`prescription_issue_allowed = false`** (UNRESOLVED organ SoT) | Case-level issue **false** |
| Other recorded hard safety blocks | Issue **false** |

**Option D:** **`PRESCRIPTION_HOLD`** (and equivalent holds) **must never** silent auto-clear — explicit owner/doctor clearance workflow only (**implementation** maps to UI; clinical rule: **no** auto-clear).

#### **Q18-F — Partial multi-formula draft**

When ≥ **1** slot has valid draft potency and ≥ **1** slot is **UNRESOLVED** (**Q15-D**):

| Field | Value |
|-------|--------|
| Valid sibling slots | **Preserved** — **must not** re-nullify because of sibling **UNRESOLVED** |
| Unresolved slot | **`selected_dilution` = null** · appropriate **`reason_codes`** |
| **`patient_resolution_status`** | **`PARTIALLY_RESOLVED`** |
| **`prescription_status`** | **`PROPOSED_PENDING_DOCTOR_REVIEW`** |

#### **Q18-G — Strict final prescription (partial finalization)**

**Final issued prescription** rules:

| Rule | Detail |
|------|--------|
| **No UNRESOLVED medicated lines** | **No** slot on **final issued Rx** with **`slot_potency_status` = UNRESOLVED** requiring numeric dilution |
| **No null dilution lines** | **No** **`selected_dilution = null`** on issued medicated oral potency lines |
| **Exclude path** | Doctor **may remove/exclude** unresolved slot from **final** Rx and **Approve** remaining **resolved** slots — valid siblings **unchanged** |
| **Keep + resolve path** | To **retain** slot: fix missing/contradictory evidence → **engine re-run** → validation → then issue path (**Q18-H**) |

#### **Q18-H — Engine revalidation**

| Field | Rule |
|-------|------|
| **`engine_revalidation_status`** | **`NOT_REQUIRED`** · **`REQUIRED_PENDING`** · **`PASSED`** · **`FAILED`** |
| **Re-run required when** | Doctor keeps previously **UNRESOLVED** slot intending medicated dilution |
| **Prohibited** | Issue with doctor-typed dilution **without** **`engine_revalidation_status = PASSED`** after re-run |

#### **Q18-I — D13-C RESTRICT before final issue**

**D13-C** **`RESTRICT`** potency on a slot:

| Requirement | Rule |
|-------------|------|
| **D13-D** | Documented pediatric justification **before** final issue |
| **Gates** | All applicable **Q7–Q17** + **D13-C** gates for that slot |
| **Approval** | **`final_doctor_approval_required`** satisfied |
| **Missing justification** | **`issuance_block_reason_codes`** include minimum **`PEDIATRIC_RESTRICT_JUSTIFICATION_MISSING`** · issue **blocked** |

#### **Q18-J — Cross-engine AND issuance policy (case-level)**

**`prescription_issue_allowed = true`** only when **all** required pass (**AND**):

| Engine / gate | Minimum |
|---------------|---------|
| **Rule 2** | No mandatory unresolved block on required polarity for issuable slots |
| **Rule 3** | **`prescription_issue_allowed`** not **false** by Rule 3 contract |
| **Rule 4** | Per **Q18-G** final line rules · **Q15-D/E** · slot statuses |
| **Patient identity / age** | Required safety identity/age gates satisfied (**Q01F** / **Q02F** / **D13-HS** as applicable) |
| **Patient-wide safety** | No active **Q18-E** hard block |
| **Doctor** | Recorded approval · **GATE_REVALIDATION** **PASSED** when Modify/re-run paths apply |

Any mandatory hard block → **`prescription_issue_allowed = false`**.

#### **Q18-K — Q10 NEUTRAL · Q11 SUPPORT_ONLY slots**

| Slot type | Final Rx |
|-----------|----------|
| **Q10** resolved **NEUTRAL** non-potency | **No** numeric dilution required · **must not** become independent medicated/potency lines on final Rx |
| **Q11** **SUPPORT_ONLY** | Same — annotation/support role only |
| **Sibling effect** | Valid **treatment** slots **must not** be blocked solely because NEUTRAL/SUPPORT_ONLY siblings exist |

#### **Q18-L — Legacy and registry issuance quarantine**

**Must not** treat as issuance authority:

- Legacy always-**D\*** output · MDE completion alone · **`get_unified_clinical_potency`** forensic path
- Registry **`potency_logic`** · **`global_text`** · disease keyword · **116k** · nearest-match · one-potency-for-all

| Field | Value |
|-------|--------|
| **`registry_q18_selector_status`** | **`NOT_EXECUTABLE_AS_Q18_SELECTOR`** |
| Minimum **`reason_codes`** | **`LEGACY_AUTO_DILUTION_NOT_ISSUANCE_AUTHORITY`** · **`REGISTRY_Q18_SELECTOR_BLOCKED`** · **`MDE_COMPLETION_NOT_ISSUANCE_AUTHORITY`** |

#### **Q18-M — UI/API field mapping**

| Field | Mapping |
|-------|---------|
| **`doctor_review_required`** (UI/API) | Canonical meaning = **`FINAL_DOCTOR_APPROVAL_REQUIRED`** (**5R-DRG**) — **not** “pick potency during run” |
| **Separate** | **`issuance_block_reason_codes[]`** vs “review required” display — **distinct** fields |
| **`hold_reason_codes[]`** | Active **PRESCRIPTION_HOLD** / **D13-HS** / crisis — separate from approval pending |

#### **Q18-N — Minimum output schema**

**Minimum fields (issuance layer):**

`question_18_status` · `prescription_issue_allowed` · `final_doctor_approval_required` · `automatic_issuance` · `prescription_status` · `patient_resolution_status` · per-slot **`slot_potency_status`** · `hold_reason_codes[]` · `issuance_block_reason_codes[]` · `doctor_action` · `doctor_modification_justification` · `engine_revalidation_status` · `execution_status` · `automatic_prescription_issuance_runtime` · `current_runtime_issuance_delta` · `registry_q18_selector_status`

Reuse **Q9-Q** / **Q15-O** enums where applicable — **namespaces separate**.

#### **Q18-O — Canonical statuses**

**`question_18_status`:** **`NOT_STARTED`** · **`OWNER_DECISION_RECORDED`** · **`CLOSURE_VALIDATION_PENDING`** · **`CLOSED`** · **`NOT_IMPLEMENTED`**

**`prescription_status` (Q18 slice — align Q9-Q / Q15):** `PROPOSED_PENDING_DOCTOR_REVIEW` · `PRESCRIPTION_HOLD` · `NOT_GENERATED` · `D13_HS_BLOCKED` · **`FINAL_DOCTOR_APPROVAL_REQUIRED`** (pre-approval) · post-approval issuance states (**implementation**-pending labels)

**`doctor_action`:** `NONE` · `APPROVE` · `MODIFY` · `EXCLUDE_UNRESOLVED_SLOT` · `REQUEST_REVALIDATION`

**`engine_revalidation_status`:** **`NOT_REQUIRED`** · **`REQUIRED_PENDING`** · **`PASSED`** · **`FAILED`**

**`execution_status`:** **`NOT_IMPLEMENTED`**

**`automatic_prescription_issuance_runtime`:** **`FALSE`**

**`current_runtime_issuance_delta`:** **`NONE`**

#### **Q18-P — State flow**

**Normal path:**

```text
SYSTEM_SINGLE_PASS_COMPLETE
  → DRAFT_CREATED
  → DOCTOR_REVIEW
  → APPROVED | MODIFIED
  → GATE_REVALIDATION
  → FINAL_PRESCRIPTION_ISSUED
```

**Hard hold branch (issue false until cleared per Option D):**

`PRESCRIPTION_HOLD` · **`D13_HS_BLOCKED`** · **`NOT_GENERATED`**

#### **Q18-Q — Outcome matrix (representative)**

| # | Condition | `prescription_issue_allowed` (pre-approval) | Final issue |
|---|-----------|---------------------------------------------|-------------|
| 1 | All slots draft-resolved · no hold | **false** until Approve + gates | Allowed after **Q18-J** |
| 2 | **PARTIALLY_RESOLVED** · exclude unresolved | **false** until Approve | Allowed if **Q18-G** satisfied |
| 3 | Keep unresolved slot without re-run | **false** | **Blocked** |
| 4 | **PRESCRIPTION_HOLD** active | **false** | **Blocked** — no silent clear |
| 5 | **D13-HS** | **false** | **`NOT_GENERATED`** |
| 6 | **D13-C RESTRICT** · no **D13-D** | **false** | **Blocked** |
| 7 | Rule 3 UNRESOLVED SoT | **false** | **Blocked** |
| 8 | Legacy always-D* only | **false** | **Blocked** |
| 9 | Q10 NEUTRAL + resolved treatment slot | Per slot | NEUTRAL not medicated line |
| 10 | Doctor Modify without justification | **false** | **Blocked** until revalidation |

#### **Q18-R — System and doctor roles**

**System:** complete **5R-SDG** pass · emit draft + full summary + flags · compute **`prescription_issue_allowed`** per **Q18-J** · never auto-issue.

**Doctor:** read full summary (footer per **5R-DRG**) · Approve/Modify/Exclude per **Q18-D/G** · **no** mid-analysis potency selection · clinical responsibility on issued Rx.

#### **Q18-S — Precedence (issuance layer)**

1. **Q18-E** hard holds (**PRESCRIPTION_HOLD** · **D13-HS** · **Q06C** · Rule 3 block)  
2. **Q18-J** cross-engine AND  
3. **Q18-G** strict final line rules  
4. **Q18-I** **D13-C RESTRICT** / **D13-D**  
5. Per-slot **Q7–Q17** outcomes (unchanged)  
6. **5R-DRG** final approval  

**Row 19 / Phase 5R-SDG index (additive — body unchanged):** Unresolved table row **19** · **Phase 5R-SDG** (**OWNER_DECISION_RECORDED**) governs **during-analysis** prohibitions (no follow-up questions · single-pass completion). **Q18** issuance layer applies **after** **SYSTEM_SINGLE_PASS_COMPLETE** — see **Phase 5R-SDG** section at document top; **do not** mutate **5R-SDG** canonical text from **Q18-S**.

#### **Q18-T — Execution boundary**

| Field | Value |
|-------|--------|
| **`execution_status`** | **NOT_IMPLEMENTED** |
| **`automatic_issuance`** | **`FALSE`** |
| **`final_doctor_approval_required`** | **`TRUE`** (normal Rule 4 draft paths) |
| **`automatic_prescription_issuance_runtime`** | **FALSE** |
| **`current_runtime_issuance_delta`** | **NONE** |
| **`registry_q18_selector_status`** | **`NOT_EXECUTABLE_AS_Q18_SELECTOR`** |
| **Rule 4** | **DOCUMENTATION FROZEN** · **NOT_IMPLEMENTED** |
| **Row 19 / 5R-SDG** | **OWNER_DECISION_RECORDED** — canonical body **unchanged** (**Q18-S** index) |

#### **Q18-U — No paid API**

Question **18** **must not** require or permit **paid API**, **paid LLM**, **paid OCR**, or **paid clinical/vision** dependencies. **Local** / **self-hosted** deterministic gates only.

**STOP — WAIT FOR QUESTION 18 FINAL CLOSURE VALIDATION** *(superseded — Q18-CLOSE formal closure recorded above.)*

**STOP — WAIT FOR RULE 4 FINAL CROSS-QUESTION INTEGRATION VALIDATION** *(superseded — documentation freeze recorded above.)*

**STOP — RULE 4 DOCUMENTATION FROZEN · IMPLEMENTATION NOT STARTED · WAIT FOR OWNER APPROVAL BEFORE IMPLEMENTATION PLANNING**

### Phase 5R-4D-Q07C-D07P-MICRO — Decision 7 micro-audit (**Q-A** … **Q-L**)

**Status:** **OWNER_DECISION_RECORDED** · **NOT_IMPLEMENTED** · **CLOSED** (included in **Q07C-CLOSE-D07**)

#### **Q-A — Structural hard-block threshold (Option C)**

**`Has_Explanatory_Structural_Pathology = TRUE`** only when structural evidence qualifies through **any** of:

1. **One decisive objective diagnostic report** (formula-bound per **Q-D**)
2. Doctor **explicit structured structural confirmation**
3. ≥ **2** **independent**, **DIRECT**, **SUPPORTED** or **VERIFIED** sources

Formula target binding (**Q-D**) and standard exclusions remain **mandatory**.

#### **Q-B — Active / historical structural findings (Option C)**

| Case | Blocks **FUNCTIONAL**? |
|------|-------------------------|
| **Current active** explanatory lesion | **Yes** |
| **Historical** lesion | **Only** when **current** evidence proves **ongoing defect / sequelae** |
| **Fully resolved**, healed, or **removed** lesion **alone** | **No** |

#### **Q-C — Explanatory vs incidental (Option C)**

**Explanatory** structural finding **only** through:

1. Objective report/exam **causal link** to formula target dysfunction
2. Doctor **structured causal link**
3. ≥ **2** **independent** **causal-aligned** sources

**Same organ alone** is **insufficient**. **Incidental / unrelated** finding **does not** block **FUNCTIONAL**.

#### **Q-D — Formula target binding (Option C)**

All **mandatory** for structural qualification:

- Rule 3 **organ/system match**
- **Anatomical site match**
- **Exact pathology ID** or **frozen approved parent/related group**
- **Q-C** causal alignment
- **No** vague keyword binding · **no** cross-formula leakage

#### **Q-E — Structural block lifecycle (Option C)**

| Phase | Rule |
|-------|------|
| Draft | Qualified **SUPPORTED** evidence → **provisional** structural block |
| Approve | Accepted items → **VERIFIED** |
| Reject/modify | **New version**; full **recalculation** |
| Summary | Display **provisional structural-block reason** when applicable |

#### **Q-F — Negated / suspected / unreliable (Option B)**

**NEGATED**, **SUSPECTED**, **RULE_OUT**, and **below-threshold** OCR/items per **Q07C-CLOSE-D08** → **`IGNORED_NOT_USABLE`**

- Establish **neither** TRUE **nor** FALSE for structural (or class) qualification
- **Preserve** raw assertion in **append-only** audit
- Continue with **other valid** evidence

#### **Q-G — Structural block scope and conflict (Option C, corrected)**

| Rule | Detail |
|------|--------|
| Order | Evaluate qualified structural hard-block **before** class resolution |
| Scope | Blocks **`IS_FUNCTIONAL_PATHOLOGY_CLASS` only** |
| **NERVOUS** / **RECURRENT** | **Always** evaluate **independently** — structural block **never** auto-blocks them |
| Potency | Structural block **never** directly selects **D3/D10/D30** — existing **cascade** selects potency |
| Doctor change | Modification/rejection → **versioning** + **recalculation** |

**Do not fabricate STRUCTURAL** pathology class for D60 triple gate.

#### **Q-H — Tier resolution (Option C)**

1. Collect **all valid Tier 1 and Tier 2** class signals (per class **`IS_*`** predicates)
2. **Log contradictions** with structured **reason codes**
3. Apply precedence **NERVOUS > RECURRENT > FUNCTIONAL**
4. **Preserve** source tier + **rejected secondary signals** in audit
5. If **no usable Tier 1/2** signal → evaluate **gated Tier 3** fallback (**Q-I**)

#### **Q-I — Tier 3 authority (Option C)**

| Rule | Detail |
|------|--------|
| When | Tier 3 runs **only** when Tier 1 **and** Tier 2 yield **no valid class** |
| Mapping alone | **Cannot** manufacture a class |
| Patient evidence | ≥ **1** **DIRECT**, formula-specific **SUPPORTED** or **VERIFIED** item **required** |
| Freeze | Separate future audit/freeze: organ/system, anatomy/site, pathology ID/group, allowed class, required evidence, prohibited shortcuts, **version**, **source** |
| Until frozen | **`Tier_3 = NOT_EXECUTABLE`** (**`SEPARATE_FREEZE_PENDING`**) |

#### **Q-J — D60 evidence lifecycle (Option B)**

- Qualified **SUPPORTED** or **VERIFIED** usable for **draft D60** evaluation
- Approval upgrades accepted evidence → **VERIFIED**
- Modification/rejection → **new evidence version** + **recalculate complete potency pipeline**
- **D60 common requirement #5** aligned with **Q07C-CLOSE-D04** (same row in **CLOSE-D03** common list)

#### **Q-K — Decoupled output schema**

**`pathology_class_status`:**

| Value | Meaning |
|-------|---------|
| **`QUALIFIED`** | Valid **`primary_pathology_class`** for triple-gate pathology leg |
| **`NO_QUALIFYING_D60_CLASS`** | No N/R/F proven; not missing/contradictory input |
| **`MISSING_EVIDENCE`** | Required class-special data absent |
| **`CONTRADICTORY_EVIDENCE`** | Class-special data conflict |

**`primary_pathology_class`:** **`NERVOUS`** · **`RECURRENT`** · **`FUNCTIONAL`** · **`null`**

| Execution | Outcome |
|-----------|---------|
| **`QUALIFIED`** + all **D60** gates | **D60** candidate |
| **`NO_QUALIFYING_D60_CLASS`** + common complete | **D10** fallback (**CLOSE-D03**) |
| **`MISSING_EVIDENCE`** or **`CONTRADICTORY_EVIDENCE`** (class-special) + common complete | **D10** fallback + raw limitation/reason codes |
| Mandatory **common** missing/contradictory | **`potency_status = UNRESOLVED`**; **no** fabricated fallback |
| Follow-up | **None** during engine execution (**5R-SDG**) |

**Note:** **`NO_QUALIFYING_D60_CLASS`** ≠ **`MISSING_EVIDENCE`** / **`CONTRADICTORY_EVIDENCE`** — distinct statuses and reason codes.

#### **Q-L — Deduplication**

- Duplicate report/photo/exam copies = **one source**
- OCR / structured extraction from **same parent source** ≠ independent sources
- Repeated assertion across fields counts **once**
- Doctor observation vs objective report = **separate** only when **genuinely independent** clinical observations
- **Preserve** duplicate provenance in audit; duplicates **must not** inflate count, confidence, or corroboration
- **NERVOUS:** baseline ≥ **1** valid **DIRECT** evidence after dedupe (**unchanged** minimum)

---

### Phase 5R-4D-Q07C-D07P-CLASS-RES — Pathology class resolution (**Decision 7**)

**Status:** **OWNER_DECISION_RECORDED** · **NOT_IMPLEMENTED** · **CLOSED** (included in **Q07C-CLOSE-D07**)

**Supersedes informal tier wording** with **Q-H** / **Q-I** (above).

| Tier | Source |
|------|--------|
| **1** | Doctor **structured** evidence |
| **2** | **Direct** clinical evidence |
| **3** | **Frozen Rule 3** mapping — **`NOT_EXECUTABLE`** until separate freeze (**Q-I**) |

**Within Tier 1+2 collected signals**, assign **`primary_pathology_class`** by:

**NERVOUS** > **RECURRENT** > **FUNCTIONAL**

(Apply only to classes whose **`IS_*_PATHOLOGY_CLASS`** predicates pass.)

| Outcome | **`pathology_class_status`** / class |
|---------|--------------------------------------|
| Class proven | **`QUALIFIED`** + **`primary_pathology_class`** |
| No class proven (evaluated, insufficient) | **`NO_QUALIFYING_D60_CLASS`** · **`primary_pathology_class = null`** |
| Missing / contradictory class-special input | **`MISSING_EVIDENCE`** / **`CONTRADICTORY_EVIDENCE`** per **Q-K** |

Triple gate pathology leg: **`pathology_class_status = QUALIFIED`** and **`primary_pathology_class`** set → **`qualifying_pathology_class`**; else leg **fails** → **CLOSE-D03** per **Q-K**.

**STRUCTURAL:** **Do not fabricate** structural class for D60; structural block affects **FUNCTIONAL** only (**Q-G**).

### Phase 5R-4D-Q07C-D07P-NERVOUS — NERVOUS pathology class

**Status:** **OWNER_DECISION_RECORDED** · **NOT_IMPLEMENTED**

**`IS_NERVOUS_PATHOLOGY_CLASS = TRUE`** only when **all** apply:

#### 1. Formula target gate

Evaluated formula **directly associated** with:

- **NERVOUS_SYSTEM**
- **AUTONOMIC_NERVES**
- **NEURAL_TISSUE**

Rule 3 organ/system = **RESOLVED**. Target pathology and evidence = **formula-specific** (**CLOSE-D04**, strict isolation).

#### 2. Evidence gate

≥1 **DIRECT**, formula-specific, **usable** clinical evidence item (**SUPPORTED** or **VERIFIED** per **CLOSE-D04**) establishes **any** of:

**A — Neuropathic symptom:** shooting/electric pain · numbness · tingling/paresthesia · neuralgic burning · spasms or twitching

**B — Neurological examination/report:** EMG/NCS finding · MRI-**confirmed nerve compression** · reflex deficit · clinically recorded neuropathy · another **directly relevant** neurological finding

**C — Central/autonomic dysfunction:** formula-targeted visceral neuralgia · formula-targeted autonomic dysfunction · clinically supported severe chronic insomnia · vasomotor instability · another **directly related** central/autonomic finding

**Deduplication (Q07C-D07P-MICRO Q-L):** apply global dedupe rules; after dedupe, ≥ **1** valid **DIRECT** item **required**.

**Lifecycle:** **SUPPORTED** usable for draft; after doctor **Approve** → **VERIFIED** for accepted items; **append-only** audit history preserved.

#### 3. Exclusions (must **not** establish NERVOUS pathology)

Rule 1 **Nervous Temperament alone** · general stress/anxiety **without** direct formula relevance · disease name/keyword alone · negated/suspected/rule-out · family history alone · vague text · low-confidence OCR · ordinary/non-clinical photographs · unrelated reports / global leakage · **MRI disc finding without nerve involvement evidence**

#### 4. Boundaries

- **NERVOUS pathology class alone** must **not** select **D60** — all **D60** common gates, **DEEP_CHRONIC**, severity **1–6**, **CLOSE-D06** Option C, cascade **precedence** (**D30**, crisis, **CLOSE-D03** fallback, pediatric **PEDIATRIC_D60**) **unchanged**.
- Rule 1 temperament = **SUPPORTING_EVIDENCE_ONLY** only.
- **Strict formula isolation** mandatory · **paid APIs prohibited** · local processing per **CLOSE-D04**.

**Do not** create keyword shortcuts beyond this owner operational definition.

---

### Phase 5R-4D-Q07C-D07P-RECURRENT — RECURRENT pathology class

**Status:** **OWNER_DECISION_RECORDED** · **NOT_IMPLEMENTED**

**`IS_RECURRENT_PATHOLOGY_CLASS = TRUE`** only if **Branch 1** **or** **Branch 2** passes, then **all common exclusions** apply.

#### Branch 1 — Standard non-seasonal recurrence

**All** required:

- ≥ **3 proven distinct episodes** within **12 months**
- **Remission gap** between episodes ≥ **7 days**
- **No maximum** remission-gap limit inside the 12-month window
- Doctor **structured history** or **combined medical reports** prove a timeline with ≥ **3 distinct episodes**
- Multiple documents describing the **same episode** count **once** (**Q07C-D07P-MICRO Q-L**)

#### Branch 2 — Verified seasonal recurrence

**All** required:

- **Verified seasonal pattern**
- ≥ **2 proven distinct episodes** within **24 months**
- Episodes occur in **different seasonal cycles**
- **Remission gap** between episodes ≥ **7 days**
- Doctor **structured history** or **combined medical reports** prove ≥ **2 distinct seasonal episodes**
- Multiple documents describing the **same episode** count **once** (**Q07C-D07P-MICRO Q-L**)
- **Bare disease name** must **not** establish a seasonal pattern

#### Common evidence requirements

- Evidence = **DIRECT** and **formula-specific**
- Evidence must **match** the formula **target pathology**
- Draft evidence status may be **SUPPORTED**
- Evidence accepted during **final approval** becomes **VERIFIED**
- **Append-only** audit history preserved
- **Strict formula isolation** mandatory · **no global evidence leakage**
- **Local processing only** · **paid APIs prohibited** (**CLOSE-D04**, **5R-SDG**)

#### Common exclusions (must **not** qualify RECURRENT pathology)

Continuous **24/7** chronic disease **without remission** · temporary **flare** of continuously active disease · vague “बार-बार” / “frequent” **without** episode count/timeline · family history alone · bare disease name alone · low-confidence OCR · negated/suspected/rule-out findings · unrelated reports or **another formula’s** evidence

#### Boundaries

- **RECURRENT pathology class alone** must **not** select **D60** — all **D60** common gates, **DEEP_CHRONIC**, severity **1–6**, **CLOSE-D06** Option C, **D30** precedence, **CLOSE-D03** fallback, formula isolation **unchanged**
- **Continuous Chronic** must **not** be fabricated as **RECURRENT**
- If **no** qualifying D60 class: **`pathology_class_status = NO_QUALIFYING_D60_CLASS`** (**Q-K**)
- When **common** evidence remains **complete**, apply approved **D10** fallback (**CLOSE-D03**)
- **Do not** ask doctor follow-up questions during engine execution (**5R-SDG**)

**Do not** create keyword shortcuts beyond this owner operational definition.

---

### Phase 5R-4D-Q07C-D07P-FUNCTIONAL — FUNCTIONAL pathology class

**Status:** **OWNER_DECISION_RECORDED** · **NOT_IMPLEMENTED**

#### FUNCTIONAL hard-block rule (absolute) — **`Has_Explanatory_Structural_Pathology`**

**Evaluate before class resolution (Q07C-D07P-MICRO Q-G).** Predicate defined by **Q-A** … **Q-G** (threshold **Q-A**, active/historical **Q-B**, explanatory **Q-C**, binding **Q-D**, lifecycle **Q-E**, ignored assertions **Q-F**).

```text
IF Has_Explanatory_Structural_Pathology = TRUE:
  IS_FUNCTIONAL_PATHOLOGY_CLASS = FALSE
```

**Explanatory structural pathology** blocks **FUNCTIONAL only** — **never** auto-blocks **NERVOUS** or **RECURRENT**.

If explanatory structural pathology is **absent**, or finding is **strictly incidental and unrelated** (**Q-C**), evaluate **FUNCTIONAL** eligibility.

#### Eligibility — **`IS_FUNCTIONAL_PATHOLOGY_CLASS = TRUE`** only when

**All** required (and hard-block **false**):

- Rule 3 target organ/system = **RESOLVED**
- **Active dysfunction** is **formula-specific**
- **Current active** evidence is **present**
- Dysfunction is **explicitly described**, **not** inferred from a label alone
- **Strict formula isolation** enforced

**And either:**

**Path 1 — Doctor structured functional entry:** **DIRECT** + **FORMULA_SPECIFIC** + **SUPPORTED** or **VERIFIED** (per **CLOSE-D04**)

**Path 2 — Multi-source corroboration:** ≥ **2** **unique**, **independent**, **DIRECT**, formula-specific **SUPPORTED** or **VERIFIED** sources corroborate the **active dysfunction** · **Q07C-D07P-MICRO Q-L** dedupe

#### Strict exclusions (must **not** establish FUNCTIONAL pathology)

Normal report **alone** · bare **“functional disorder”** label · bare disease name · Rule 1 **Temperament alone** · generic stress or anxiety **alone** · vague weakness/fatigue **alone** · negated/suspected/rule-out · **resolved/history-only** finding · family history alone · low-confidence OCR · ordinary/non-clinical photograph · unrelated report / global leakage

#### Boundaries

- **Continuous dysfunction** may qualify if **currently active** and all evidence requirements pass
- **Symptom-free interval** is **not** required for **FUNCTIONAL**
- **FUNCTIONAL pathology class alone** must **not** select **D60** — all **D60** common gates, **DEEP_CHRONIC**, severity **1–6**, **CLOSE-D06** Option C, **D30** precedence, **PEDIATRIC_D60**, formula isolation **unchanged**
- If **no** qualifying D60 class: **`pathology_class_status = NO_QUALIFYING_D60_CLASS`** (**Q-K**)
- When **common** evidence **complete** → approved **D10** fallback (**CLOSE-D03**)
- **No** follow-up doctor questions during engine execution (**5R-SDG**)
- **Paid APIs prohibited** · **local processing** required (**CLOSE-D04**)

**Do not** create keyword shortcuts beyond this owner operational definition.

---

## Phase 5R-4D-Q07C-CLOSE-D04 — Verified clinical evidence (**OPTION C — doctor approval verification**)

**Status:** **OWNER_DECISION_RECORDED** (Q7 closure **decision 4 of 14**) · **NOT_IMPLEMENTED**

Defines **verified / usable clinical evidence** for Rule 4 selectors (Q7 common gates, Q06 A3, etc.) and platform draft analysis. Aligns with **5R-SDG** (no questions during analysis) and **5R-DRG** (approval after draft).

### Valid evidence sources

| Source | Allowed |
|--------|---------|
| Doctor-provided symptoms | **Yes** |
| Examination findings | **Yes** |
| Structured vitals | **Yes** |
| Report-derived **structured** findings | **Yes** |
| Site-matched clinical-image findings | **Yes** |
| **116,284** disease dataset alignment | **Only** with symptom/pathology alignment — not standalone authority |

### Mandatory evidence item fields

Each structured evidence item **must** carry:

`source_type` · `source_reference` · `target_organ_system` · `target_pathology` · `assertion_status` · `verification_status` · `formula_relevance` · **`confidence_score`** (**0.00–1.00**, **Q07C-CLOSE-D08**) · `timestamp_or_case_context`

### Usable for **system draft** analysis (single pass)

Evidence counts toward selectors (e.g. “≥1 related verified clinical evidence”) **only when**:

| Criterion | Required value |
|-----------|----------------|
| `assertion_status` | **PRESENT** or **POSITIVE** |
| `verification_status` | **SUPPORTED** or **VERIFIED** |
| `formula_relevance` | **DIRECT** |
| Organ/pathology | **Matches** formula target |
| Exclusions | **Not** negated, unrelated, historical-only, or below **Q07C-CLOSE-D08** thresholds (see invalid list) |

**Minimum:** ≥1 **DIRECT** formula-specific usable item per gate that requires clinical evidence.

**Parser/OCR initial status:** **`verification_status = SUPPORTED`** after local processing.

**Supported evidence usable for draft:** **YES** (subject to table above).

**Doctor questions during analysis:** **NO** (**5R-SDG**).

### Local processing

| Item | Rule |
|------|------|
| Doctor input languages | Hindi / English / Hinglish |
| Processing | **Local** parser / OCR / NLP → structured evidence |
| **Paid translation/clinical API** | **PROHIBITED** |
| Local / self-hosted processing | **REQUIRED** |

**Lifecycle:**

```text
Raw input / OCR
  → Local parser
  → verification_status = SUPPORTED
  → System completes draft (single pass)
  → Doctor reviews draft
  → Doctor Approve (or Modify → new version → new approval)
  → Evidence used in approved draft → verification_status = VERIFIED
```

### Approval transition (**approved draft only**)

Only evidence items **used in the approved draft** become **`VERIFIED`** on approval.

**Record (append-only, auditable):** `verified_by` · `verified_at` · `approval_event_id` · `draft_version` · `evidence_version`

**Must not** delete/overwrite original **SUPPORTED** history, confidence, provenance, or parser output. Status transitions **append-only**.

### Modification workflow

When doctor **modifies** draft:

- **New** draft version created
- **Previous** version retained
- **Final** verification / issuance only after approval of the **modified** version

### Invalid evidence (never usable as verified clinical evidence)

| Invalid | Tag |
|---------|-----|
| Keyword alone | **PROHIBITED** |
| No / rule-out / suspected (as positive selector evidence) | **PROHIBITED** |
| Family history alone | **PROHIBITED** |
| Unrelated report | **PROHIBITED** |
| Ordinary face photo | **PROHIBITED** |
| Below-threshold OCR/items (**Q07C-CLOSE-D08**) | **PROHIBITED** / **`IGNORED_NOT_USABLE`** |
| Unrelated formula leakage | **PROHIBITED** |
| Temperament alone | **PROHIBITED** |
| Silent default | **PROHIBITED** |
| Fabricated value | **PROHIBITED** |

### Report / photo retention

| Item | Rule |
|------|------|
| Original PDF / photo permanent storage | **PROHIBITED** |
| After temporary processing | Retain **structured findings** only; **verify** original deletion |

### Confidence threshold engine (**Q07C-CLOSE-D08**)

| Item | Status |
|------|--------|
| Source-type tier matrix + sub-decisions **D08-A**–**D08-K** + **Option C** guard | **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED** |

Full spec: **Q07C-CLOSE-D08** (above). **No** zero-OCR-risk or guaranteed-accuracy claims.

---

## Owner potency nature (latest specification — supersedes earlier proposed scale)

**Status:** **OWNER_PROVIDED_CLINICAL_SPECIFICATION** · **EXACT_THRESHOLDS_NOT_FROZEN** · **NOT_IMPLEMENTED** · **Polarity candidate groups: 5R-4D-PB**

Not independently scientifically proven or universally safe. Code existence is not clinical validation.

| Dilution | Owner specification (candidate direction — thresholds pending) |
|----------|----------------------------------------------------------------|
| **D1** | **NEGATIVE disease polarity group** — **POSITIVE dilution-force direction**; selector **Q08-CLOSE** (**Q8-A**–**Q8-P**) |
| **D2** | **NEGATIVE disease polarity group** — **NEUTRAL/MODERATING dilution-force direction**; selector **Q08-CLOSE** (**Q8-A**–**Q8-P**) |
| **D3** | **POSITIVE group** — **Q7B-F**; superseded by **D5** (Q07C-D5F) or **D30** (Q07C-D30F) when rules pass |
| **D5** | **POSITIVE group** — **Q07C-D5F** + **CLOSE-D05**; superseded by **D30** when Q07C-D30F passes |
| **D10** | **POSITIVE group** — **Q07C-D10F**; superseded by **D30** when Q07C-D30F passes |
| **D30** | **POSITIVE group** — **Q07C-D30F** Path A (Cardiac Stage 2 + A3 evidence) or Path B (severity **7–10** + formula evidence; **`ACUTE_EXACERBATION_ON_CHRONIC`** manifestation and/or **ACUTE**/**SUB_ACUTE** **`resolved_phase`** — legacy **`CHRONIC_FLARE`**/**`ACUTE_FLARE`** aliases per **Q07C-CLOSE-D09** **D09-8**) |
| **D60** | **POSITIVE group** — **Q07C-D60F** + **CLOSE-D03** + **CLOSE-D06** + **Q07C-CLOSE-D07**; triple gate → **D60** / fail → **D10**; sev **1–6**; **never supersedes D30**; **PEDIATRIC_D60** |
| **D10** (deep-chronic) | **CLOSE-D03** `OWNER_APPROVED_DEEP_CHRONIC_D10_FALLBACK` when triple gate fails and common evidence complete |
| **D6** | **COMPLETELY_EXCLUDED** · **PROHIBITED** (Q7B-F) |
| **D100** | **NOT_RECOGNIZED_IN_CURRENT_OWNER_SCALE** · **D100_AUTO_SELECTION = PROHIBITED** (Q6C; legacy POSITIVE ladder) |
| **D200** | **NOT_RECOGNIZED_IN_CURRENT_OWNER_SCALE** · **D200_AUTO_SELECTION = PROHIBITED** (Q5F) |
| **D500** | **NOT_RECOGNIZED_IN_CURRENT_OWNER_SCALE** · **D500_AUTO_SELECTION = PROHIBITED** (Q3F–Q4F keyword; Q6 legacy BP) |
| Part 2 high-potency references | **EDUCATIONAL_REFERENCE_ONLY** — not executable Rule 4 (Q6C) |

Earlier Phase 5R-4D “owner-proposed scale sketch” table is **superseded** by this specification.

---

## Related draft artifacts

- [rule-04-potency-engine-DRAFT.md](./rule-04-potency-engine-DRAFT.md) — scope, contract sketch, **5R-DRG** / **5R-SDG** output fields  
- [rule-04-unresolved-clinical-questions-DRAFT.md](./rule-04-unresolved-clinical-questions-DRAFT.md) — Q1–Q6 recorded; Q7 **FULLY_RESOLVED**; Q8–Q18 **CLOSED** · **NOT_IMPLEMENTED**; row **19** **5R-SDG** **OWNER_DECISION_RECORDED** · Rule 4 documentation **FROZEN**

**Rule 4 documentation formally frozen:** **YES** · **OWNER_APPROVED** · **NOT_IMPLEMENTED**  
**Clinical readiness (EHAS2 runtime):** **FALSE** · **Prescription engine:** **NOT_CONNECTED** · **Medicine output:** **0**
