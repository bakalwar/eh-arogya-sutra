# Rule 4 — Potency Engine (**DOCUMENTATION FROZEN**)

**RULE 4 CLINICAL DOCUMENTATION SPECIFICATION:** **OWNER_APPROVED** · **FROZEN** · **NOT_IMPLEMENTED**

**Status:** **OWNER_APPROVED** · **FROZEN** · **NOT_IMPLEMENTED** (Phase 5R-4D)  
**Rule number:** 4  
**Canonical name:** Rule 4 — Potency Engine  
**EHAS2 runtime:** **NOT_STARTED** · **NOT_IMPLEMENTED** — no automatic potency · report wiring · phase · severity · temperament · or issuance runtime active  
**Question 7 (POSITIVE cascade contract):** **FULLY_RESOLVED** · decisions **14/14 CLOSED** · Rule 4 documentation **FROZEN**  
**Question 8 (NEGATIVE D1/D2):** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**  
**Question 9 (MIXED disease-state):** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**  
**Question 10 (NEUTRAL disease-state):** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**  
**Question 11 (UNRESOLVED / SUPPORT_ONLY):** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**  
**Question 12 (disease phase integration):** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**  
**Question 13 (severity integration):** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**  
**Question 14 (non-pediatric adult age):** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**  
**Question 15 (per-formula isolation):** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**  
**Question 16 (formula-specific report evidence):** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**  
**Question 17 (Rule 1 temperament wiring):** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**  
**Question 18 (prescription issuance / doctor approval):** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**  
**Legacy reference:** `eh-api/core/potency_engine.py` (forensic only — **not** clinical endorsement)

**Rule 4 precedence index (pointer-only):** identity/age → crisis/holds → Rule 2 polarity → Rule 3 target → D04/D08 → phase → severity → potency pathway → temperament tie-break → pediatric overlay → per-formula isolation → issuance — [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) freeze section.

**Deferred assets (doc-freeze non-blockers):** Tier 3 mapping · non-BP safety catalog · phase/severity lexicons · lab/vital severity mapping · registry audits · **D13-G** — see owner-decisions register.

---

## Purpose (provisional)

For **each oral formula/mixture independently**, Rule 4 evaluates and annotates a **potency/dilution decision** from authorized inputs (**SYSTEM_DECISION** within Rule 4 scope). Rule 4 does **not** issue **final** prescriptions. **`doctor_review_required`** = **FINAL_DOCTOR_APPROVAL_REQUIRED** after the platform **single-pass** analysis completes — not doctor selection of potency during execution. See [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-DRG** and **Phase 5R-SDG**.

**5R-SDG (Rule 4 slice):** no follow-up clinical questions during analysis; no `additional_information_needed` / `follow_up_question` / `doctor_must_choose_potency`; complete pass with preserved uncertainty/evidence fields when inputs are limited.

---

## Scope — may

- Produce per-mixture **`potency_decision`** (canonical envelope) including explicit **selected dilution** when clinically resolved under owner-approved rules (future).
- Record input provenance, uncertainty, and review flags per frozen evidence policy (Q4 draft).

## Scope — must not

See [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) Q2 (medicines, composition, mixture count, electricity, tablet/external creation, overwriting Rules 1–3).

---

## Input authority (summary)

Draft taxonomy from owner decisions Q3 — full table in owner-decisions draft. Highlights:

- Rule 2 polarities: **authoritative** (disease vs therapeutic stored separately).
- Rule 3 system: **formula scoping** only.
- Rule 1 temperament: **supporting evidence only** — qualitative preference per **Q07C-CLOSE-D12** (**CLOSED** · **D12-B-EXEC** current-cascade **NO-OP** for **D3↔D5**); see temperament section below.
- BP: **formula-scoped** for CARDIAC/VASCULAR targets only.
- Report findings: **formula-scoped** only — structured items per **Q07C-CLOSE-D04**.

---

## Verified clinical evidence (**Q07C-CLOSE-D04** — OWNER_DECISION_RECORDED)

**Option C — doctor approval verification.** Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **CLOSE-D04**.

| Topic | Rule |
|-------|------|
| Draft analysis | **`SUPPORTED`** or **`VERIFIED`** + **DIRECT** + formula-matched; ≥1 item where gate requires |
| After doctor **Approve** | Items **used in approved draft** → **`VERIFIED`** (append-only audit) |
| Processing | **Local** parser/OCR/NLP only; **paid API prohibited** |
| Reports/photos | **No** permanent PDF/photo; structured findings only after verified deletion |
| Invalid | Keyword-only, negated/suspected, family-only, unrelated report, ordinary face photo, leakage, temperament-only, defaults, fabrication |
| Confidence / **`confidence_score`** | **Q07C-CLOSE-D08** (**D08-A**–**D08-K**, **Option C** guard) · **CLOSED** · **NOT_IMPLEMENTED** |

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Q07C-CLOSE-D08**.

---

## Missing evidence (draft)

No silent substitution of MIXED / 40 / 120 / 5 / ACUTE for missing fields. Use UNKNOWN / MISSING / UNRESOLVED; optional documented fallback object must not overwrite raw uncertainty.

When verified age or required formula-specific evidence is missing, the **system deterministically** completes the pass and sets:

- `potency_status` = **UNRESOLVED**
- `selected_dilution` = **null**
- `reason_codes` / `uncertainty_flags` / `evidence_status` / `evidence_limitations` / `confidence` as applicable (**Phase 5R-SDG**)
- `safety_flags` / `safety_status` as resolved
- `doctor_review_required` = **true** (**FINAL_DOCTOR_APPROVAL_REQUIRED** — issuance blocked; **not** doctor branch selection during execution)

**Prohibited (5R-SDG):** `additional_information_needed` · `follow_up_question` · `doctor_must_choose_potency` · pausing for manual clinical input · fabricating missing data · silent defaults · cross-formula evidence copy.

**Prohibited:** coercing **UNRESOLVED** or **SUPPORT_ONLY** to MIXED (or any dilution) to emit D5/D60/D10/D30 — per Q2F owner decision.

---

## Pediatric age 0–5 (OWNER_DECISION_RECORDED — Q1)

**Legacy rejected:** `get_unified_clinical_potency` age ≤5 POSITIVE→D30 / else→D10 early return is **not** EHAS2 policy.

| Principle | Decision |
|-----------|----------|
| Age alone | **Must never** select potency |
| Verified age | Safety/context input only |
| Policy shape | **Dedicated pediatric 0–5 policy** per formula with full formula-scoped evidence (pathology, Rule 3 system, phase, severity, Rule 2 disease + therapeutic polarity, formula-scoped reports/symptoms, Rule 1 temperament supporting only) |
| D30 | **Candidate only** when owner-defined eligible pattern is verified for **that formula** (hypersensitive/allergic; chronic hyper-reactive; deep neurological — **controlled vocabulary IMPLEMENTATION_PENDING**) |
| D30 blocked | Age ≤5 alone; POSITIVE alone; global leakage; unrelated report; general photo; missing/unresolved formula evidence |
| Emergency/red flags | **Must not** be suppressed by pediatric policy; safety gate before issuance; no auto-potency unless separately approved |
| Issuance | Draft allowed; **FINAL_DOCTOR_APPROVAL_REQUIRED** (**5R-DRG**) |

**Decision 13 overlay:** **Q07C-CLOSE-D13** (**D13-A**–**D13-G**, **D13-B-EXEC**) — potency **D13-C**–**D13-F** + administration dose **D13-G**; **`PEDIATRIC_D60` → `CURRENT_PEDIATRIC_NO_OP`**. Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md).

---

## Pediatric age 6–12 (OWNER_DECISION_RECORDED — Q2)

**Legacy rejected:** `get_unified_clinical_potency` age >5 and ≤12 POSITIVE→D60 / else→D5 early return is **not** EHAS2 policy.

Same structural principles as **Q1** (dedicated per-formula pediatric policy; age as safety/context modifier only; no age-only or POSITIVE-only D60; emergency not suppressed; **FINAL_DOCTOR_APPROVAL_REQUIRED** (**5R-DRG**) for issuance).

| Item | Decision |
|------|----------|
| **D60** | Recognized on owner scale as **evidence-conditioned candidate** (**Q07C-D60F**) — **DEEP_CHRONIC** + triple gate; **not** age 6–12 or POSITIVE alone |
| **D5 / D10 / D30 / D60** | **HIGH-NEGATIVE group** — exact ladder **NOT_FROZEN** / **OWNER_DECISION_PENDING** |
| **UNRESOLVED → MIXED → D5/D60** | **Prohibited** |

**Decision 13:** Same overlay as **0–5** — **P13-D** matrix row; dilutions remain **POSITIVE** group per **5R-4D-PB** (supersedes Q2 draft “HIGH-NEGATIVE group” shorthand for documentation alignment only).

---

## Pediatric potency overlay (**Q07C-CLOSE-D13** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Q07C-CLOSE-D13** (**D13-A**–**D13-G**, **D13-B-EXEC**).

| Topic | Rule |
|-------|------|
| Bands | **P13-A** 0–28d · **P13-B** 29d–&lt;1y (**D13-HS** hard stop) · **P13-C** 1–5y · **P13-D** 6–12y · **P13-E** &gt;12y (no overlay) |
| **&lt; 1 year** | **D13-HS** — **`PEDIATRIC_UNDER_ONE_NOT_SUPPORTED`** · no medicine / formula / potency / dose / clinical summary |
| Precondition | **ALLOW** / **RESTRICT** only **after** **Decisions 1–12** cascade qualification (**P13-C** · **P13-D** only) |
| **RESTRICT** | **Documented pediatric justification** (**D13-D**) required |
| **PROHIBIT** | **No** auto-demotion · **no** silent fallback → **UNRESOLVED** unless another dilution independently qualified + **ALLOW**/**RESTRICT** |
| Weight | **`OWNER_DECISION_NOT_RECORDED`** — not a **D13** potency gate |
| **PEDIATRIC_D60** | **`CURRENT_PEDIATRIC_NO_OP`** |
| Missing age | **UNRESOLVED** (**Q01F** / **Q02F**) |

**D13-C matrix (active overlay — P13-A/P13-B = hard stop):**

| Band | D3 | D5 | D10 | D30 | D60 |
|------|----|----|-----|-----|-----|
| 0–28d | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP |
| 29d–&lt;1y | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP | NOT_APPLICABLE_UNDER_HARD_STOP |
| 1–5y | RESTRICT | ALLOW | RESTRICT | PROHIBIT | PROHIBIT |
| 6–12y | RESTRICT | ALLOW | RESTRICT | RESTRICT | PROHIBIT |

**D13-HS:** Verified **&lt; 1 year** → **`prescription_status = BLOCKED`**, all clinical outputs **NULL** / **NOT_GENERATED**, Hindi safety notice (not clinical summary).

Scenarios **1–13** (**D13-F**, corrected matrix):

| # | Scenario | Band | Cascade candidate | **D13-C** | Outcome |
|---|----------|------|-------------------|-----------|---------|
| **1** | 6-month infant | **P13-B** | — | **D13-HS** | **`PEDIATRIC_UNDER_ONE_NOT_SUPPORTED`** · blocked · safety notice only |
| **1b** | 14-day neonate + crisis | **P13-A** | — | **D13-HS** + **Q06C** | Escalation + hold · no clinical summary |
| **2** | 3-year · ACUTE · sensitivity qualified | **P13-C** | **D5** | **ALLOW** | **D5** if cascade qualified |
| **3** | 5-year · SUB_ACUTE · sev 5 | **P13-C** | **D10** | **RESTRICT** | **D10** only with **D13-D**; else **UNRESOLVED** |
| **4** | 8-year · sev 8 · **D30** gates incomplete | **P13-D** | — | **D30** **RESTRICT** | **UNRESOLVED** (cascade); overlay if **D30_CANDIDATE** only |
| **5** | 10-year · sev 8 · **D30** gates complete | **P13-D** | **D30** | **RESTRICT** | **D30** if **Q07C-D30F** + **D13-D** **P13-D · D30** + doctor approval |
| **6** | 4-year · **DEEP_CHRONIC** · **D60** triple pass | **P13-C** | **D60** | **PROHIBIT** | **UNRESOLVED** for **D60**; other dilution only if independent cascade + matrix |
| **7** | 11-year · **D60** triple complete | **P13-D** | **D60** | **PROHIBIT** | Same as **6** |
| **8** | Age missing | — | — | — | **UNRESOLVED** — no **D13-HS** inference |
| **9** | Weight missing | Any | Per cascade | Per matrix | **No D13 weight gate** — **`OWNER_DECISION_NOT_RECORDED`** |
| **10** | Parent vs doctor contradiction | Any | Any | — | **UNRESOLVED** (**D13-D**) |
| **11** | Pediatric crisis (**Q06C**) | Any | — | — | **UNRESOLVED** · issuance **BLOCKED** (pre-overlay) |
| **12** | **EXTREME_HYPERSENSITIVITY** · **D60** path | **P13-C/D** | **D60** | **PROHIBIT** | **D60** **UNRESOLVED**; **CLOSE-D06** does not override |
| **13** | Two formulas · different eligibility | Per formula | Per formula | Per formula | **D09-1** isolation |

---

## Administration dose contract (**D13-G** · **OWNER_APPROVED_CLINIC_POSOLOGY** · **SOURCE_VALIDATION_PENDING**)

**Status:** **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**

**Separation:** **Selected_Medicine** / **Selected_Formula** / **Selected_Potency** = **Decisions 1–12** + **D13-C** overlay only. **Administration_Dose** = **D13-G** only — **must not** promote, demote, or override potency. **`final_doctor_approval_required = true`** (**5R-DRG**).

| Band | Drops / administration | Frequency | Notes |
|------|------------------------|-----------|--------|
| **&lt; 1 year** (**P13-A/B**) | — | — | **`PEDIATRIC_UNDER_ONE_CLINICAL_GENERATION = PROHIBITED_BY_OWNER_HARD_STOP`** · **`administration_dose_status = NOT_APPLICABLE_UNDER_HARD_STOP`** · **D13-HS** |
| **1–5 years** (**P13-C**) | **2** drops per administration | Doctor-set; **no** silent frequency guess; max **proposed** routine **2×/day** pending confirmation | Limitation **`PEDIATRIC_1_5_POSOLOGY_LIMITATION`** (Hindi text in owner-decisions **D13-G-A**) |
| **6–12 years** (**P13-D**) | **5** drops | **2** or **3×/day** — doctor decision; **no** auto **2 vs 3** | **D30** **RESTRICT** overlay — **Q07C-D30F** + **D13-D**; dose **must not** change potency (**D13-G**) |
| **&gt;12 years** (**P13-E**) | **7** (**HIGH_SENSITIVITY**) or **8** (**NORMAL_SENSITIVITY**) | **3×/day** (doctor may reduce) | **Half cup** normal/lukewarm water; sensitivity missing/invalid/contradictory → **`administration_dose_status = UNRESOLVED`**, no silent **7/8** |

**Global:** Crisis → **`URGENT_ESCALATION`** + **`PRESCRIPTION_HOLD`** — **D13-G** not applied. Drops executable only with preparation + standardized dropper contract. Aggravation/adverse reaction → no auto-continue; doctor review. **No** Homeopathy **30X** ↔ Electro **D30** equivalence claims.

**Output fields (draft):** `age_band`, `verified_sensitivity_status`, `dose_per_administration_drops`, `frequency_per_day`, `administration_water`, `administration_dose_status`, `final_doctor_approval_required`, `limitation_code`, `audit_reason` — see **D13-G-OUT** in owner-decisions.

---

## Cancer / tumor evidence (OWNER_DECISION_RECORDED — Q3)

**Legacy rejected:** substring `cancer` / `tumor` → **D500** in `get_unified_clinical_potency` (L46–47).

| Principle | Decision |
|-----------|----------|
| **D500** | **Not** on owner D1–D60 scale; **automatic D500 prohibited** |
| Keyword diagnosis | **Prohibited** — classify evidence (`CONFIRMED_VERIFIED`, `SUSPECTED`, `RULE_OUT`, `NEGATED`, `HISTORICAL`, `FAMILY_HISTORY`, `UNVERIFIED`, `UNRELATED_REPORT`) |
| Clinical role | **Safety red flag** · **specialist review trigger** · **doctor review required** — **does not select potency** |
| Confirmed verified | Still **no** auto-dilution; per-formula Rule 4 evaluation (pathology, Rule 3, phase, severity, Rule 2, formula-scoped evidence, pediatric Q1–Q2) |
| Unverified / negated / etc. | **UNRESOLVED** potency when formula evidence insufficient |
| Isolation | No global leakage across unrelated mixtures |
| Negation | Required (see owner-decisions Q3F examples) |
| Claims | **No** treat/cure cancer claims |

---

## Paralysis / lakwa evidence (OWNER_DECISION_RECORDED — Q4)

**Legacy rejected:** substring `paralysis` / `lakwa` → **D500** (same L46–47 block as Q3 cancer/tumor — **rejected** for EHAS2).

| Principle | Decision |
|-----------|----------|
| **D500** | **Not recognized**; **automatic selection prohibited** |
| Classification | See owner-decisions Q4F taxonomy (acute red flag, chronic, residual, suspected, weakness, neuropathy, negated, historical, unverified, unrelated report) |
| **Acute neurological red flag** | **Urgent escalation** + **doctor review** — **no** auto-potency |
| **Confirmed chronic paralysis** | **No** auto-potency; full per-formula Rule 4 + pediatric policy |
| **D1 direction** | **OWNER_PROVIDED_DIRECTION** only — **no** `paralysis → D1` hardcoding |
| Unverified / ambiguous | **UNRESOLVED** |
| Isolation / negation | Required; no global leakage (align Q3 pattern) |
| Claims | **No** paralysis/stroke treat/cure claims |

---

## Stone / pathri / bone-spur evidence (OWNER_DECISION_RECORDED — Q5)

**Legacy rejected:** substring `bone spur`, `kanta`, `stone`, `pathri`, `spur` → **D200** (`potency_engine.py` L48–49).

| Principle | Decision |
|-----------|----------|
| **D200** | **Not recognized** on owner D1–D60 scale; **automatic D200 prohibited** |
| Keyword = verified pathology | **Prohibited** — classify by stone/spur type (renal, ureteric/urinary, gallbladder, salivary/other, bone spur, heel spur, foreign body/kanta, suspected, ruled out/negated, historical/removed, family history, unverified, unrelated report) |
| Verified imaging/report | Supports **related target pathology and formula only** — **no** auto-dilution |
| Confirmed stone/spur | **No** auto-potency; full per-formula Rule 4 + pediatric Q1–Q2 |
| Hardcoding | **No** `stone`/`pathri`/`bone spur`/`kanta` → D200 |
| Unverified / negated / insufficient | **UNRESOLVED** + **doctor_review_required** |
| Isolation / negation | Required; no global leakage (align Q3–Q4) |
| Claims | **No** stone/spur treat/cure claims |

**Separate legacy path:** POSITIVE ladder may emit D200 without stone keywords — **Question 7**, **NOT_FROZEN**.

---

## Blood pressure / cardiovascular vitals (OWNER_DECISION_RECORDED — Q6 · **Q06C**)

**Authoritative:** **OPTION A → A3 COMBINED_MINIMUM_EVIDENCE** · Official scale **D1–D60 only**; **D100/D200/D500 prohibited**

**Legacy rejected:** `bp_sys > 175` + POSITIVE or CARDIAC → **D500** (`potency_engine.py` L52–54).

| Principle | Decision |
|-----------|----------|
| BP alone | **Must not** select potency |
| Formula scope | **CARDIAC**, **VASCULAR**, **BP_REGULATION** only — supporting + band rules below; **no** unrelated formula leakage |
| BP verification for bands | **`VERIFIED_CURRENT_READING`** or **`REPEATED_CONFIRMED_READING`** |
| Related evidence | **Required** (symptom, phase, or severity on **same** formula) for Stage 1/2 candidates |
| Stage 1 (evidence-complete) | Sys **140–159** or dia **90–99** → **D10 candidate** |
| Stage 2 (evidence-complete) | Sys **160–179** or dia **100–109** → **D30 candidate** |
| Crisis | Sys **≥180** or dia **≥110** → **ACUTE_RED_FLAG**, potency **UNRESOLVED**, **urgent_escalation_required** — **no** auto D10/D30/D60 |
| Band without related evidence | **UNRESOLVED** + **doctor_review_required** |
| Mild BP (120–139 / 80–89) | Supporting only — **no** direct **D5** from BP |
| D1 | **Prohibited** only for CV/BP target + verified high-BP; **allowed** as candidate on unrelated hypo/chronic formulas per their evidence |
| Missing BP → 120 | **Prohibited**; serious BP/Cardiac target missing required BP → **doctor_review_required**; other formulas may use non-BP Rule 4 evidence |
| Rule 1 | Temperament **supporting only** — **Nervous Temperament alone must not select D30** |
| Rule 2 | **FORMULA_SCOPED_SUPPORTING_EVIDENCE_ONLY** |
| Examples A1/A3/BE | **Illustrative only** — not Rule 4 hardcoding |
| Pediatric Q1–Q2 | Authoritative |
| Claims | **No** high-BP treat/cure claims |

**Separate legacy paths:** POSITIVE ladder **D100/D200** (Q7) — **NOT_FROZEN**, **off-scale**; NEGATIVE `bp_sys < 95` (Q8) — **NOT_FROZEN**.

---

## POSITIVE ladder / D3 candidate (partial Q7 — **Q07B-F** recorded)

**Legacy (quarantined):** POSITIVE branch L56–61 → D200/D100/D60 — **off-scale D100/D200**; full Q7 **NOT_FROZEN**.

### Owner-approved D3 minimum evidence

**D3_CANDIDATE** when all of: Rule 3 **RESOLVED**; pathology **FORMULA_SPECIFIC**; Rule 2 **POSITIVE** disease + **NEGATIVE** therapeutic; formula phase **ACUTE**; ≥1 verified related symptom/report/exam finding; **STRICT_FORMULA_ISOLATION**; no global leakage.

Otherwise → **UNRESOLVED**, `selected_dilution = null`, **doctor_review_required**.

| Topic | Decision |
|-------|----------|
| Duration | **PHASE_SUPPORTING_EVIDENCE_ONLY** — must **not** set disease polarity |
| Polarity | **Rule 2 formula-specific evidence only** |
| Acute flare on chronic | Flare formula may qualify for **D3** when minimum evidence met; baseline vs flare **separate metadata** |
| **D6** | **EXCLUDED + PROHIBITED** |
| Chronic NEGATIVE selector | **SUPERSEDED** — **Q8 = D1 vs D2 only** (**5R-4D-PB**) |
| Contract/UI claims | No root/guaranteed cure, guaranteed recovery, 100% accuracy, universally safe |

---

## Potency polarity boundary (**5R-4D-PB** — OWNER_APPROVED)

| Rule 2 **disease_polarity** | Candidate dilutions (mutually exclusive) |
|-----------------------------|----------------------------------------|
| **NEGATIVE** | **D1**, **D2** only |
| **POSITIVE** | **D3**, **D5**, **D10**, **D30**, **D60** only |

Group opens only after **formula-specific resolved** Rule 2 disease polarity — **no** inference from duration, age, temperament, diagnosis name, or global symptoms. **Strict formula isolation.** **MIXED** (patient-level): **Q09-CLOSE**. **Resolved NEUTRAL** (**Rule 2** **RESOLVED** + therapeutic **NEUTRAL**): **Q10-CLOSE** — **`POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET`** · **`selected_dilution` = null** (**Q10-B**). **UNRESOLVED** / **SUPPORT_ONLY** / missing / contradictory (non-**Q10-A**): **Q11-CLOSE** — **`potency_status` = UNRESOLVED** or **`POTENCY_NOT_APPLICABLE_FOR_SUPPORT_ONLY_SLOT`** · **`selected_dilution` = null** · **no** **D1–D60** default · **no** **D2** default (**Q08-CLOSE** **Q8-A** · **Q11-E/F**). Scale **D1–D60**; **D6/D100/D200/D500 prohibited**.

---

## NEGATIVE D1/D2 selector (**Q08-CLOSE** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q08-CLOSE** (**Q8-A**–**Q8-P**).

| Topic | Rule |
|-------|------|
| **Scope** | **Verified NEGATIVE** disease formula only · **`required_therapeutic_polarity` = POSITIVE** |
| **POSITIVE disease** | **D1/D2 prohibited** — **Q7** cascade unchanged |
| **Selector** | **Combined** gates only — **no** phase/severity-alone shortcut (**Q8-B**) |
| **D1** | Positive-force + hypofunction evidence · sev **1–6** · **Q8-C** |
| **D2** | Moderating-force and/or independent path when **D1** prohibited · **not** silent fallback (**Q8-D**) |
| **Severity 7–10** | **D1 prohibited**; **D2** **`RESTRICTED_CANDIDATE`** only if **Q8-D** complete (**Q8-E**) |
| **Cardiac/high BP** | **D1 PROHIBIT** on target formula; **D2** only if **Q8-D** passes (**Q8-F**) |
| **Temperament** | After **Q8** selector; **D12-B** tie-break if both qualified (**Q8-G**) |
| **Pediatric** | **D13-HS** · **Q8-H** matrix (**D13-G** dose separate — **Q8-I**) |
| **Final** | **D1** xor **D2** xor **UNRESOLVED** (**Q8-J**) |
| **Registry** | **`REGISTRY_POTENCY_LOGIC_AUDIT_PENDING`** · **`NOT_EXECUTABLE_AS_Q8_SELECTOR`** (**Q8-N**) |
| **Runtime** | **`execution_status = NOT_IMPLEMENTED`** · **`current_runtime_potency_delta = NONE`** · **`automatic_D1_D2_selection = FALSE`** (**Q8-P**) |

**Reason codes (min):** **Q8-O** list in owner-decisions.

---

## MIXED disease-state split (**Q09-CLOSE** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q09-CLOSE** (**Q9-A**–**Q9-M** · **Q9-N**–**Q9-Q**).

| Topic | Rule |
|-------|------|
| **Subject** | **MIXED DISEASE-STATE CONTROLLED AUTOMATIC SPLIT AND POLARITY-CONTRADICTION CONTRACT** |
| **Split** | Distinct **POS** + **NEG** targets → **`automatic_formula_split`** · full pass → **`RESOLVED_BY_CONTROLLED_SPLIT`**; partial → **`PARTIALLY_RESOLVED_BY_CONTROLLED_SPLIT`** (**Q9-N**) |
| **Partial slot** | Valid slot → **`RESOLVED_DRAFT_CANDIDATE`**; failed slot → **`UNRESOLVED`** — valid slot **not** invalidated by sibling (**Q9-N**) |
| **Rule 2** | Polarity **upstream only** — **Q9** does not create/infer/mutate (**Q9-O**) |
| **Registry** | **`registry_q9_selector_status = NOT_EXECUTABLE_AS_Q9_SELECTOR`** · **`REGISTRY_Q9_SELECTOR_BLOCKED`** (**Q9-P**) |
| **State machine** | **`split_status`** · **`slot_resolution_status`** · **`patient_resolution_status`** · failure matrix (**Q9-Q**) |
| **Same target** | POS + NEG on **one** target, not safely splittable → **`POLARITY_CONTRADICTORY`** · **`potency_status` = UNRESOLVED** · **`selected_dilution` = null** · **no** auto **D1–D60** |
| **No ladder** | Legacy **MIXED→D2/D10/D30** · missing→MIXED · severity/max tie-break **rejected** (**Q9-C**) |
| **MIXED label** | Patient-level descriptive only — **`MIXED_LABEL_NOT_A_POTENCY_SELECTOR`** |
| **SUPPORT_ONLY** | **Not** MIXED · **deferred to Q11** — **no** Q9 potency fallback (**Q9-G**) |
| **Safety** | Crisis / **D13-HS** / pediatric / **Q06C** / contraindications **before** split (**Q9-H**) |
| **Routes** | Split = oral formula-target potency only — **no** auto tablet/electricity/external copy (**Q9-I**) |
| **Runtime** | **`execution_status = NOT_IMPLEMENTED`** · **`automatic_mixed_split_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q9-L**) |
| **Paid API** | **Prohibited** (**Q9-M**) |

**Reason codes (min):** **Q9-K** · failure matrix **Q9-Q** in owner-decisions.

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 10 READ-ONLY AUDIT** *(superseded — Q10-CLOSE owner specification recorded below.)*

---

## NEUTRAL disease-state non-potency (**Q10-CLOSE** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q10-CLOSE** (**Q10-A**–**Q10-Q**).

| Topic | Rule |
|-------|------|
| **Scope** | **`disease_polarity` = NEUTRAL** · **`disease_polarity_status` = RESOLVED** · **`required_therapeutic_polarity` = NEUTRAL** (**Q10-A**) |
| **Outcome** | **`POTENCY_NOT_APPLICABLE_FOR_NEUTRAL_TARGET`** · **`selected_cascade` = NONE** · **`selected_dilution` = null** (**Q10-B**) |
| **Not D2** | Disease **NEUTRAL** ≠ **D2** dilution-force (**Q10-D**) |
| **No ladder** | **NEUTRAL→D2/D5/D10/D30/…** rejected (**Q10-C**) |
| **Fluctuation** | **Q7/Q8** only when **POS/NEG** resolved — no **D5/D2** default (**Q10-E**) |
| **UNRESOLVED / SUPPORT_ONLY** | **Q11** — **Q11-CLOSE** (**Q11-A**–**Q11-R**) |
| **Registry** | **`NOT_EXECUTABLE_AS_Q10_SELECTOR`** (**Q10-L**) |
| **Runtime** | **`automatic_neutral_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q10-P**) |

**Reason codes (min):** **Q10-N** · matrix **Q10-O** in owner-decisions.

**STOP — WAIT FOR QUESTION 10 FINAL CLOSURE VALIDATION** *(superseded — Q10-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 11 READ-ONLY AUDIT** *(superseded — Q11-CLOSE owner specification recorded below.)*

---

## UNRESOLVED and SUPPORT_ONLY potency safety (**Q11-CLOSE** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q11-CLOSE** (**Q11-A**–**Q11-R**).

| Topic | Rule |
|-------|------|
| **UNRESOLVED** | **`unresolved_slot_status` = UNRESOLVED** · **`potency_status` = UNRESOLVED** · **`selected_dilution` = null** (**Q11-B**) |
| **SUPPORT_ONLY** | **`support_slot_status` = RESOLVED_SUPPORT_ROLE** · **`POTENCY_NOT_APPLICABLE_FOR_SUPPORT_ONLY_SLOT`** (**Q11-C**) |
| **Not D2/D5** | **Q11-E/F** — no silent **MIXED**/ladder shortcuts |
| **Evidence audit** | **Q11-H** (D08 · Q-L · binding) before safe stop |
| **Partial multi-formula** | **Q11-I** + **Q9-N** |
| **Registry** | **`NOT_EXECUTABLE_AS_Q11_SELECTOR`** (**Q11-L**) |
| **Runtime** | **`automatic_unresolved_potency_runtime = FALSE`** · **`automatic_support_only_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q11-Q**) |

**Reason codes / matrix:** **Q11-N** · **Q11-O** in owner-decisions.

**STOP — WAIT FOR QUESTION 11 FINAL CLOSURE VALIDATION** *(superseded — Q11-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 12 READ-ONLY AUDIT** *(superseded — Q12-CLOSE owner specification recorded below.)*

---

## Disease phase integration (**Q12-CLOSE** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q12-CLOSE** (**Q12-A**–**Q12-W**).

| Topic | Rule |
|-------|------|
| **Authority** | **Q07C-CLOSE-D02** · **D09** · **D11** integrated — **not** replaced (**Q12-A**) |
| **Per formula slot** | Independent **`resolved_phase`** · **`baseline_phase`** / **`current_manifestation_phase`** (**Q12-B/J**) |
| **Day bands** | **1–14 ACUTE** · **15–45 SUB_ACUTE** · **D09** chronic bands unchanged (**Q12-C**) |
| **Phase gate only** | No **ACUTE→D3/D5** etc. shortcuts (**Q12-F**) |
| **POS path** | **Q7** cascade after phase gate (**Q12-G**) |
| **NEG path** | **Q8** combined selector — phase one input (**Q12-H**) |
| **NEUTRAL/MIXED/UNRESOLVED** | **Q10/Q9/Q11** (**Q12-I**) |
| **Flare/chronic slots** | **Q12-K** separation · **Q12-L** failure → **UNRESOLVED** |
| **Partial multi-formula** | **Q9-N** + **Q12-M** |
| **Lexicon** | Vague timeline **NOT_EXECUTABLE** until separate freeze (**Q12-N**) |
| **Registry** | **`NOT_EXECUTABLE_AS_Q12_SELECTOR`** (**Q12-Q**) |
| **Runtime** | **`automatic_phase_runtime = FALSE`** · **`automatic_flare_split_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q12-V**) |

**Reason codes / matrix:** **Q12-S** · **Q12-T** in owner-decisions.

**STOP — WAIT FOR QUESTION 12 FINAL CLOSURE VALIDATION** *(superseded — Q12-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 13 READ-ONLY AUDIT** *(superseded — Q13-CLOSE owner specification recorded below.)*

---

## Severity cascade integration (**Q13-CLOSE** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q13-CLOSE** (**Q13-A**–**Q13-X**).

| Topic | Rule |
|-------|------|
| **Authority** | **Q07C-CLOSE-D10** integrated — **not** replaced (**Q13-A**) |
| **Per formula slot** | Independent **`severity_status`** / band / score (**Q13-B/K**) |
| **Scale** | **LOW/MODERATE/HIGH** per **D10-A** · no silent **5** (**Q13-C**) |
| **Severity gate only** | No sev-alone **D1–D60** shortcuts (**Q13-F**) |
| **Fail-closed** | Non-success **`severity_status`** → **UNRESOLVED** on required paths (**Q13-G**) |
| **POS path** | **Q7** after severity gate (**Q13-H**) |
| **NEG path** | **Q8** combined; sev **7–10** **D1** prohibited (**Q13-I**) |
| **NEUTRAL/MIXED/UNRESOLVED** | **Q10/Q9/Q11** (**Q13-J**) |
| **Flare/chronic slots** | **Q13-L** + **Q12-K** |
| **Partial multi-formula** | **Q9-N** + **Q13-M** |
| **Lexicon/lab** | **NOT_EXECUTABLE** until freeze (**Q13-N**) |
| **Registry** | **`NOT_EXECUTABLE_AS_Q13_SELECTOR`** (**Q13-R**) |
| **Runtime** | **`automatic_severity_runtime = FALSE`** · **`automatic_free_text_severity_runtime = FALSE`** · **`automatic_lab_vital_severity_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q13-W**) |

**Reason codes / matrix:** **Q13-T** · **Q13-U** in owner-decisions.

**STOP — WAIT FOR QUESTION 13 FINAL CLOSURE VALIDATION** *(superseded — Q13-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 14 READ-ONLY AUDIT** *(superseded — Q14-CLOSE owner specification recorded below.)*

---

## Verified non-pediatric adult age (**Q14-CLOSE** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q14-CLOSE** (**Q14-A**–**Q14-U**).

**Naming:** **Rule 4 Question 14** (adult age integration) **≠** **Q7 Decision 14** / **Q07C-CLOSE-D14** (Tier 3 mapping) **≠** **Q7 Decision 13** / **D13** (pediatric) **≠** **D13-G** (dose).

| Topic | Rule |
|-------|------|
| **Scope** | Verified age **`>12`** (**≥13**) · **P13-E** **ADULT** (**Q14-A**) |
| **Adult finality** | **No** additional adult potency sub-bands · **`adult_potency_overlay = NONE`** · **`adult_overlay_applied = false`** (**Q14-B**) |
| **Age ≠ potency** | Age alone **must not** select or adjust **D1–D60** (**Q14-C**) |
| **Legacy quarantine** | Elderly shortcuts · missing→**40** · age keywords **rejected** (**Q14-D**) |
| **Authorities** | **Q7–Q13** + **Q06C** only — age **must not** bypass (**Q14-E/F**) |
| **Frailty/weight/comorbidity** | **Not** inferred from age (**Q14-G**) |
| **Age evidence** | Verified DOB/numeric age · **D08** usability · **not** OCR/116k/registry (**Q14-H**) |
| **Failures** | Missing/invalid/contradictory → **UNRESOLVED** + reason codes (**Q14-I**) |
| **Boundary** | **12** = **P13-D** · **13** = **P13-E** · no **D13-C** at **13+** (**Q14-J**) |
| **Dose vs potency** | **D13-G-C** dose separate · sensitivity missing → dose **UNRESOLVED** (**Q14-K**) |
| **Multi-formula / routes** | **Q14-L** · **Q14-N** |
| **Precedence** | Crisis → age → **D13-HS** → … → pediatric overlay **≤12** → adult no-overlay **≥13** (**Q14-M**) |
| **Registry** | **`NOT_EXECUTABLE_AS_Q14_SELECTOR`** (**Q14-O**) |
| **Runtime** | **`automatic_adult_age_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q14-T**) |

**Reason codes / matrix:** **Q14-Q** · **Q14-R** in owner-decisions.

**STOP — WAIT FOR QUESTION 14 FINAL CLOSURE VALIDATION** *(superseded — Q14-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 15 READ-ONLY AUDIT** *(superseded — Q15-CLOSE owner specification recorded below.)*

---

## Per-formula potency isolation (**Q15-CLOSE** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q15-CLOSE** (**Q15-A**–**Q15-U**).

**Naming:** **Rule 4 Question 15** **≠** **Rule 4 Question 16** (report / **`global_text`** wiring).

| Topic | Rule |
|-------|------|
| **Policy** | **Option A + B + C** — integration · strict leakage block · **Q9-N** partial default (**Q15-R**) |
| **Per slot** | One Rule 4 pass per oral **`formula_slot_id`** (**Q15-B**) |
| **Leakage ban** | Evidence · polarity · phase · severity · sensitivity · pathology · cardiac/BP (**Q15-C**) |
| **Partial Rx** | Unresolved slot → **null** dilution only; **`PARTIALLY_RESOLVED`** (**Q15-D**) |
| **Whole-Rx hold** | Crisis · **PRESCRIPTION_HOLD** · **D13-HS** only (**Q15-E**) |
| **No global D\*** | Every **`selected_dilution`** bound to slot + target (**Q15-F**) |
| **Dedupe** | **Q-L** same target; contradiction → slot **UNRESOLVED** (**Q15-H**) |
| **Authorities** | **Q7–Q14** per slot — unchanged (**Q15-G**) |
| **Registry** | **`NOT_EXECUTABLE_AS_Q15_SELECTOR`** (**Q15-M**) |
| **Runtime** | **`automatic_multi_formula_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q15-T**) |

**Reason codes / matrix:** **Q15-O** · **Q15-P** in owner-decisions.

**STOP — WAIT FOR QUESTION 15 FINAL CLOSURE VALIDATION** *(superseded — Q15-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 16 READ-ONLY AUDIT** *(superseded — Q16-CLOSE owner specification recorded below.)*

---

## Formula-specific report evidence (**Q16-CLOSE** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q16-CLOSE** (**Q16-A**–**Q16-U**).

**Naming:** **Rule 4 Question 16** **≠** **Rule 4 Question 15** (per-slot orchestration).

| Topic | Rule |
|-------|------|
| **Items** | Report → structured findings; no **`global_text`** selector (**Q16-B**) |
| **Mandatory fields** | Report/finding identity · slot/target · organ/site/pathology · D04 + D08 (**Q16-C**) |
| **Integration** | **Q07C-CLOSE-D04** · **Q07C-CLOSE-D08** · **Q-L** · **Q15-C** (**Q16-N**) |
| **Escalation** | Critical / frozen crisis / red flags patient-wide; non-BP catalog pending (**Q16-H**) |
| **Registry** | **`NOT_EXECUTABLE_AS_Q16_SELECTOR`** (**Q16-M**) |
| **Runtime** | **`automatic_report_wiring_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q16-T**) |

**STOP — WAIT FOR QUESTION 16 FINAL CLOSURE VALIDATION** *(superseded — Q16-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 17 READ-ONLY AUDIT** *(superseded — Q17-CLOSE owner specification recorded below.)*

---

## Rule 1 temperament integration (**Q17-CLOSE** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q17-CLOSE** (**Q17-A**–**Q17-U**).

**Formal closure:** **Q17-CLOSE** · **READY_TO_CLOSE** accepted — Rule 1 generic potency scoring/modifier wording **superseded** by **Q17-B/C** + **D12-A** (by reference).

| Topic | Rule |
|-------|------|
| **Role** | Supporting + **Q8-G** dual **D1/D2** tie-break only (**Q17-C**, **Q17-G**) |
| **Input** | Confirmed **`primary_temperament`** · current consultation (**Q17-D**) |
| **POSITIVE** | **D12-B-EXEC** **NO-OP** · **CLOSE-D05** (**Q17-J**) |
| **Quarantine** | **`NOT_EXECUTABLE_AS_Q17_SELECTOR`** (**Q17-N**) |
| **Runtime** | **`automatic_temperament_potency_runtime = FALSE`** · **`current_runtime_potency_delta = NONE`** (**Q17-T**) |

**STOP — WAIT FOR QUESTION 17 FINAL CLOSURE VALIDATION** *(superseded — Q17-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR OWNER APPROVAL BEFORE QUESTION 18 READ-ONLY AUDIT** *(superseded — Q18-CLOSE owner specification recorded below.)*

---

## Prescription issuance and final doctor approval (**Q18-CLOSE** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Phase 5R-4D-Q18-CLOSE** (**Q18-A**–**Q18-U**). **Implements by reference** **5R-DRG** · **5R-SDG** (bodies **unchanged**).

**Formal closure:** **Q18-CLOSE** · **READY_TO_CLOSE** accepted — **Option A + D** · strict partial finalization.

| Topic | Rule |
|-------|------|
| **Policy** | **Option A + D** · strict partial finalization |
| **Issuance** | **`automatic_issuance = false`** · **`prescription_issue_allowed = false`** until approval + **Q18-E/J** gates |
| **Doctor** | Full summary → Approve/Modify — **FINAL_DOCTOR_APPROVAL_REQUIRED** |
| **Partial Rx** | Exclude unresolved slot or engine re-run — no null lines on final issue |
| **Quarantine** | **`NOT_EXECUTABLE_AS_Q18_SELECTOR`** · legacy always-D* not issuance authority |
| **Runtime** | **`automatic_prescription_issuance_runtime = FALSE`** · **`current_runtime_issuance_delta = NONE`** (**Q18-T**) |
| **Row 19** | **5R-SDG** indexed in **Q18-S** only |

**STOP — WAIT FOR QUESTION 18 FINAL CLOSURE VALIDATION** *(superseded — Q18-CLOSE **CLOSED** · **NOT_IMPLEMENTED**.)*

**STOP — WAIT FOR RULE 4 FINAL CROSS-QUESTION INTEGRATION VALIDATION** *(superseded — documentation freeze.)*

**STOP — RULE 4 DOCUMENTATION FROZEN · IMPLEMENTATION NOT STARTED · WAIT FOR OWNER APPROVAL BEFORE IMPLEMENTATION PLANNING**

---

## D5 selector (**Q07C-D5F** + **Q07C-CLOSE-D05** — OWNER_DECISION_RECORDED)

**Precondition:** **D3_MINIMUM_EVIDENCE_RULE = PASSED** (Q7B-F + **CLOSE-D04**).

**D5 promotion (**CLOSE-D05**):** qualified formula-specific allergy/hypersensitivity · `verification_status` **SUPPORTED** or **VERIFIED** · `formula_relevance` **DIRECT** · `assertion_status` **PRESENT/POSITIVE** · **`confidence_score` usable** per **Q07C-CLOSE-D08** · **not** Nervous Temperament alone.

| Branch | Result |
|--------|--------|
| Qualified sensitivity | **D5** final; **D3 superseded** |
| Else (incl. **MISSING**) | **D3** remains; preserve raw status; **no** D5 |
| **D3 + D5** both final | **Prohibited** |

**Invalid:** negated/rule-out · family history alone · vague “sensitive” · low-confidence OCR · ordinary photo · unrelated report/formula · fabricated default · temperament alone.

**Lifecycle:** draft **SUPPORTED** → approved draft **VERIFIED**; history preserved. **D5** only **POSITIVE** group (**PB**).

---

## Temperament qualitative preference (**Q07C-CLOSE-D12** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Q07C-CLOSE-D12** (**D12-A**–**D12-D**, **D12-B-EXEC**).

| Rule | Detail |
|------|--------|
| Role | **SUPPORTING_EVIDENCE_ONLY** — **no** new candidate; **no** override of polarity · phase · severity · pathology · crisis · **D30** / **D60** gates · **CLOSE-D05** **D5** selection |
| When (executable) | **Two** dilution candidates **both** pass all clinical gates → apply **Rule 1** qualitative preference matrix (**excluding** **D3 ↔ D5** on current POSITIVE cascade — **D12-B-EXEC**) |
| Single qualified | Temperament **must not** block · promote · or demote |
| **D3 ↔ D5** (POSITIVE · **LYMPHATIC** / **SANGUINE** / **NERVOUS** + **BILIOUS_HEPATIC** matrix) | **`execution_status = CURRENT_CASCADE_NO_OP`** · **`temperament_preference_applied = FALSE`** · **`implementation_status = NOT_EXECUTABLE_WITH_CURRENT_FROZEN_CASCADE`** — **CLOSE-D05**: sensitivity qualify → **D5** only; else → **D3** only; bilious context spec **preserved** · **not executable** today |
| **D1/D2** rows | **Q08-CLOSE** **CLOSED** — **D12-B** tie-break per **Q8-G** after primary **Q8** selector; **`execution_status = NOT_IMPLEMENTED`** · **`automatic_D1_D2_selection = FALSE`** |
| **MIXED** / **UNKNOWN** | Annotation only — **no** potency effect; **no** **UNKNOWN** → other token |
| Future **D3/D5** dual-candidate hook | **Separate owner decision** required — **not** approved by **D12-B-EXEC** clarification |
| Prohibited | **D10→D30** · **D30→D60** via temperament; numeric weights; medicine mapping; numerology linkage; **D6/D100/D200/D500** |
| Platform | **Q07C-CLOSE-D08** · **Q-L** · formula isolation · **5R-SDG** |

---

## Formula-specific severity resolution (**Q07C-CLOSE-D10** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full algorithm **Q07C-CLOSE-D10** (**D10-A**–**D10-M**) in [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md).

| Topic | Rule |
|-------|------|
| Scale | Integer **1–10**; **LOW 1–3** · **MODERATE 4–6** · **HIGH 7–10**; **no** default **5** |
| Success statuses | **`RESOLVED_NUMERIC`** · **`RESOLVED_BAND_ONLY`** |
| Missing | **`severity_status = MISSING_EVIDENCE`** · **`reason_code = SEVERITY_VALUE_MISSING`** |
| Invalid pool | **Case A:** valid usable remains → resolve on valid only · **Case B:** invalid-only → **`INVALID_EVIDENCE`** |
| No-doctor corroboration | **Option A:** ≥ **2** usable sources · **same band**; cross-band → **`SEVERITY_CONTRADICTORY`** — no majority/max/precedence |
| Failure statuses | **`INSUFFICIENT_CORROBORATION`**, **`SEVERITY_CONTRADICTORY`**, **`TARGET_BINDING_MISSING`**, etc. → **`potency_status = UNRESOLVED`** |
| Cases | **D10-M** table (10 scenarios) |
| Sources | **Q07C-CLOSE-D08** + **CLOSE-D04** + **Q-L** |
| Same-band numerics | Band resolves · **`resolved_severity_score = null`** · preserve raw values |
| Free-text / lab | **`SEVERITY_MULTILINGUAL_LEXICON`** · **`LAB_VITAL_TO_SEVERITY_MAPPING`** — **NOT_EXECUTABLE** until frozen; doctor structured numeric **usable** |
| Baseline / current | **`underlying_baseline_severity`** / **`current_manifestation_severity`** (**D09-8** alignment) |
| **D30** | **HIGH** band **alone** **must not** select **D30** — all **Q07C-D30F** gates required |

Downstream selectors consume **`resolved_severity_band`** / score per cascade (**D3**/**D5**/**D10**/**D30**/**D60**).

---

## D10 selector (**Q07C-D10F** — OWNER_DECISION_RECORDED)

**Polarity:** **POSITIVE** disease + **NEGATIVE** therapeutic only — **prohibited** for NEGATIVE / NEUTRAL / MIXED / SUPPORT_ONLY / UNRESOLVED.

**Common (8):** verified severity per **Q07C-CLOSE-D10** (**LOW**/**MODERATE** for D10 paths); Rule 3 **RESOLVED**; pathology **FORMULA_SPECIFIC**; ≥1 verified related evidence; strict isolation; no leakage. Non-success **`severity_status`** → **D10 UNRESOLVED** + review — **no** default severity **5**. **HIGH (7–10)** → **D10 prohibited** — see **Q07C-D30F** + **D10-I**.

| Pathway | Conditions |
|---------|------------|
| **A — Cardiac Stage-1** | **Q07C-CLOSE-D01:** CV/BP target + **Q6 A3** + verified **Stage 1** BP (sys 140–159 or dia 90–99) + mandatory formula-specific clinical evidence + common gates; **supersedes D3/D5 even when ACUTE**; **BP alone insufficient** |
| **B — SUB_ACUTE** | **`resolved_phase = SUB_ACUTE`** (+ **CLOSE-D02** common gates) |
| **C — CHRONIC_MODERATE** | **`resolved_phase = CHRONIC_MODERATE`** (+ **CLOSE-D02** common gates) |
| **D — DEEP_CHRONIC fallback** | **`resolved_phase = DEEP_CHRONIC`** + common gates + no crisis/**D30** on formula — triple gate pass → **D60**; else **`selected_candidate = D10`**, `fallback_policy = OWNER_APPROVED_DEEP_CHRONIC_D10_FALLBACK` (**Q07C-CLOSE-D03**); **D10** and **D60** not both final |

**Phase resolution (**Q07C-CLOSE-D02** + **Q07C-CLOSE-D09** **CLOSED** + **Q07C-CLOSE-D11** **CLOSED**):** **D09-1**–**D09-10** (moderate/deep **Option C**, flare enum); **D11-A**–**D11-D** (**ACUTE ↔ SUB_ACUTE** authoritative — **CLOSE-D02** verified-over-days read through **D11-B**). Day bands **1–14** / **15–45**; no silent **ACUTE** default. **`phase_status`** / **`limitation_code`**; case table **1–16**. **`ACUTE_EXACERBATION_ON_CHRONIC`** chronic baseline only (**D11-C**). **5R-SDG**.

**CLOSE-D01 outputs when Path A passes:** `selected_candidate = D10`; `D3_status` / `D5_status` = **SUPERSEDED_BY_CARDIAC_D10**. Missing/contradictory → deterministic status; **no** follow-up; **no** fabricate BP/phase/severity/polarity.

**Severity 7–10:** **D10 prohibited** → **D30** when evidence passes. **SUB_ACUTE** / **CHRONIC_MODERATE** bypass acute **D3/D5** when **D10** Path B/C applies.

---

## D30 selector & POSITIVE cascade (**Q07C-D30F** — OWNER_DECISION_RECORDED)

**Common POSITIVE preconditions (7):** POSITIVE disease + NEGATIVE therapeutic; Rule 3 **RESOLVED**; **FORMULA_SPECIFIC** pathology; verified evidence; isolation; no leakage.

**Crisis first:** sys **≥180** or dia **≥110** → **UNRESOLVED** + **ACUTE_RED_FLAG** + escalation — **no** auto potency.

| D30 path | Conditions → **D30_CANDIDATE** |
|----------|--------------------------------|
| **A — Cardiac Stage 2** | CV/BP target + verified Stage 2 BP (160–179 / 100–109) + **Q6 A3** related evidence |
| **B — High severity** | **`resolved_severity_band = HIGH`** (or verified **7–10** per **Q07C-CLOSE-D10**); **`resolved_phase`** **ACUTE** / **SUB_ACUTE** and/or **`Current_Manifestation = ACUTE_EXACERBATION_ON_CHRONIC`** (canonical — legacy **`CHRONIC_FLARE`** alias per **Q07C-CLOSE-D09** **D09-8**); duration alone **insufficient**; **severity alone must not** select **D30** (**D10-I**) |

**D30 supersedes D3, D5, D10.** High severity / Stage 2: sensitivity **does not** demote D30→D5. **Nervous Temperament alone:** no D30. Missing D30 evidence → **UNRESOLVED**.

**Cascade order (CLOSE-D01 + CLOSE-D02 + CLOSE-D03):** (1) Patient-wide crisis (2) Related **Cardiac Stage-2** → **D30** Path A (3) Related **Cardiac Stage-1** → **D10** (**CLOSE-D01**) (4) General: sev **7–10** → **D30** Path B; **SUB_ACUTE** → **D10** Path B; **CHRONIC_MODERATE** → **D10** Path C; **ACUTE** → **D5**/**D3** (5) **DEEP_CHRONIC** sev **1–6**: triple gate **pass** → **D60** · **fail** → **D10** fallback (**CLOSE-D03**); missing special data → preserve + **D10** if common complete.

---

## D60 selector (**Q07C-D60F** — OWNER_DECISION_RECORDED)

**Polarity:** **POSITIVE** disease + **NEGATIVE** therapeutic only.

**Common requirements (11):** … pathology class via **Q07C-D07P-CLASS-RES** + **Q07C-D07P-MICRO** (**Q-A–Q-L**); common **#5** = **SUPPORTED** or **VERIFIED** per **CLOSE-D04** (**Q-J**); **`EXTREME_HYPERSENSITIVITY`** per **CLOSE-D06**.

**Pathology class (**Q07C-CLOSE-D07** **CLOSED**):** **NERVOUS** / **RECURRENT** / **FUNCTIONAL** + structural hard-block (**Q-A–G**). **`pathology_class_status`** + **`primary_pathology_class`** (**Q-K**). Tier **1+2** active; **Rule 3 Tier 3 mapping** **NOT_EXECUTABLE** (**Q07C-CLOSE-D14** **D14-L** · **`TIER3_PATHOLOGY_MAPPING_DATA_ASSET = SEPARATE_DATA_FREEZE_PENDING`** · **`tier3_mapping_applied = FALSE`** · **`current_potency_delta = NONE`**). **`SEPARATE_FREEZE_PENDING`** = **`LEGACY_ALIAS_OF_SEPARATE_DATA_FREEZE_PENDING`**. **Not** **D08-D** OCR tier. **NERVOUS > RECURRENT > FUNCTIONAL**. **D14:** **FUNCTIONAL_CANDIDATE** suggester only — see owner-decisions **D14-A**–**D14-N**.

---

## Tier 3 Rule 3 pathology mapping (**Q07C-CLOSE-D14** — **OWNER_DECISION_RECORDED** · **CLOSED** · **NOT_IMPLEMENTED**)

Full spec: [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md) **Q07C-CLOSE-D14** (**D14-A**–**D14-N**).

| Topic | Rule |
|-------|------|
| **D08-D vs D14** | OCR **source tier** ≠ **Rule 3 mapping** Tier 3 |
| **Role** | Controlled **FUNCTIONAL_CANDIDATE** suggester only — **not** class authority · **not** **D60** alone |
| **NERVOUS / RECURRENT** | **Never** from mapping alone (**D14-F**, **D14-G**) |
| **Isolation** | Per-formula; no cross-formula leakage (**D14-C**) |
| **Runtime** | **`execution_status = NOT_EXECUTABLE`** · **`tier3_mapping_applied = FALSE`** · **`current_potency_delta = NONE`** until data rows frozen |
| **Data asset** | **`TIER3_PATHOLOGY_MAPPING_DATA_ASSET = SEPARATE_DATA_FREEZE_PENDING`** (**`SEPARATE_FREEZE_PENDING`** = **`LEGACY_ALIAS_OF_SEPARATE_DATA_FREEZE_PENDING`**) |
| **Paid APIs** | **Prohibited** (**D14-M**) |

**Reason codes (min):** **D14-N** list in owner-decisions.

---

**Triple gate:** **DEEP_CHRONIC** + **`QUALIFIED`** + **CLOSE-D06** → **D60**; else **D10** / **UNRESOLVED** (**Q-K**, **CLOSE-D03**). **5R-SDG** · **`PEDIATRIC_D60`** **`CURRENT_PEDIATRIC_NO_OP`** (**Q07C-CLOSE-D13** **D13-B-EXEC**) · **D60** never supersedes **D30**.

---

## Electricity and dosage (outside Rule 4)

| Item | Status |
|------|--------|
| Electricity selection / examples | **REFERENCE_ONLY** · **RULE_6_AUDIT_PENDING** |
| Drops, water, frequency, duration | **DOSAGE_ENGINE_AUDIT_PENDING** |

---

## Dosage (explicitly outside Rule 4)

Rule 4 does **not** set drops, water volume, frequency, or duration.

Owner-proposed administration text (“D30 की 1 बूंद आधा कप पानी में।”) is classified **OWNER_PROPOSED_DOSAGE_RULE** · **DOSAGE_ENGINE_AUDIT_PENDING** (Rule 5 / dosage engine territory).

---

## Owner potency nature (latest — supersedes earlier scale sketch)

**OWNER_PROVIDED_CLINICAL_SPECIFICATION** · **EXACT_THRESHOLDS_NOT_FROZEN** · **NOT_IMPLEMENTED**

See [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md). Remaining unresolved clinical questions **3–18** must define thresholds and interactions before any freeze.

---

## Route separation (draft)

| Route | Owner of potency/dilution |
|-------|---------------------------|
| Oral liquid mixture | **Rule 4** |
| Tablet A/B | Separate policy (audit pending) |
| External | Separate policy (audit pending) |

No automatic copy of oral dilution to tablet or external routes.

---

## Output contract (draft target — IMPLEMENTATION-PENDING)

```text
potency_decision {
  rule_number: 4
  rule_name: "Potency Engine"
  formula_id / mixture_label: ...
  potency_status: RESOLVED | UNRESOLVED | DRAFT
  selected_dilution: D* | null          // null when UNRESOLVED (5R-SDG)
  reason_codes: [...]
  uncertainty_flags: [...]              // preserve — do not erase (5R-SDG)
  evidence_status: optional
  evidence_limitations: optional
  confidence: optional
  safety_flags / safety_status: <resolved>
  doctor_review_required: boolean       // true => FINAL_DOCTOR_APPROVAL_REQUIRED (post-draft)
  // PROHIBITED (5R-SDG): additional_information_needed, follow_up_question, doctor_must_choose_potency
  raw_inputs: { ... UNKNOWN | MISSING allowed ... }
  authoritative_inputs: { rule2_disease_polarity, rule2_therapeutic_polarity, phase, ... }
  supporting_evidence: { severity, temperament, formula_scoped_bp, report_findings, ... }
  unresolved_reason: optional
  fallback_policy: optional (only if owner-approved operational fallback)
  deterministic_fingerprint: IMPLEMENTATION-PENDING
}
```

**5R-SDG workflow (platform):** `DOCTOR_PROVIDES_AVAILABLE_INFORMATION` → `SYSTEM_SINGLE_PASS_ANALYSIS` → … → `SYSTEM_SELECTS_FORMULA_SPECIFIC_POTENCIES` → draft summary/prescription → **DOCTOR_APPROVES_OR_MODIFIES** → **FINAL_PRESCRIPTION**. Doctor **does not** select potency during Rule 4 execution. **SUMMARY_REVIEW_FOOTER_REQUIREMENT** = **APPROVED** — see owner-decisions draft (Hindi exact text; production UI **not** modified in this documentation step).

Legacy mixture field `dilution` is **not** the EHAS2 canonical contract name; selected dilution lives **inside** `potency_decision` per Q6 draft.

---

## Clinical ladder

Owner-approved branch contracts are **FROZEN** in [rule-04-unresolved-clinical-questions-DRAFT.md](./rule-04-unresolved-clinical-questions-DRAFT.md) and [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md). **Runtime wiring is NOT_IMPLEMENTED** — legacy `potency_engine.py` thresholds are forensic only.

**Do not** treat legacy `get_unified_clinical_potency` outputs as clinically validated merely because they exist in code.

---

## Legacy forensic pointer

- Primary legacy function: `get_unified_clinical_potency` (`potency_engine.py`)  
- Live caller: `MultiDiseaseEngine.calculate_mixture_potency` / mixture loop  
- Audit pack: `%TEMP%\ehas2_rule4_forensic_audit\`
