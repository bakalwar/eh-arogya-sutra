Local LLM — 1000‑word Clinical Summary Logic (Design)
====================================================

Goal
- Produce a 1000‑word clinical summary from patient input + KB lookups that is clear, clinically useful, and traceable to the E.H. Arogya Sutra book mapping.

High‑level output structure (approx. word counts)
- Header / demographics (50–80 words)
- Temperament inference (120–150 words)
- Pathology synthesis (350–400 words) — organ systems, acute vs chronic, severity
- Potency / dilution rationale (200–250 words) — Law of Polarity, recommended ladder
- Electricity selection rationale (120–150 words) — body polarity + point selection
- Suggested plan + cautions (100–150 words)

Inputs required
- Patient: age, sex, weight, chief complaint (free text), symptoms (list), vitals (BP/HR/temp), affected_organs (optional), lab_reports (optional), phase (ACUTE/CHRONIC), temperament (optional)
- KB: medicine_knowledge_base.json (all mapped sections)

Pipeline (preprocessing)
1. Normalize text (unicode, remove OCR garbage)
2. Tokenize and sentence‑segment (use language model tokenizer)
3. Extract structured entities:
   - symptoms (map to KB symptoms)
   - organs (map via organ aliases)
   - red flags (high BP, severe tachycardia, anuria)
4. Infer temperament (call KB suggestConstitution/inferTemperament)

Reasoning modules (local LLM + deterministic rules)
- Module A (Temperament): inferTemperament(input) → returns canonical temperament or null
- Module B (Scoring & Top medicines): use existing knowledgeBasedSelector.scoreMedicine logic (deterministic) to get top 6 meds and reasons
- Module C (Potency advisor): rules:
   - If phase == ACUTE → start D4–D8 (strong/positive dosing as per law)
   - If phase == CHRONIC → follow posology ladder (D10 → D30 → D100 → D200 → D1000) and KB.high_dilution refs
   - If inferred polarity == positive → recommend negative (thin) dose ladder
   - If inferred polarity == negative → recommend positive (strong) dose ladder
- Module D (Electricity advisor): use body_attraction_polarity + electricity_ointment_points:
   - Map affected organ → suggested external points
   - Apply polarity rule: negative site → positive electricity; positive site → negative electricity; fallback W.E.

Prompt templates (for local LLM — concise)
1) Temperament summary prompt:
   "Given patient: {age,sex,symptoms,...} and KB evidence {top_symptom_matches}, infer temperament (Lymphatic/Sanguine/Nervous/Bilious/Mixed). Provide 2–3 bullet reasons and matching KB references (page IDs)."

2) Pathology synthesis prompt:
   "Write a clinical synthesis (3–4 paragraphs) describing the patient's likely pathophysiology, affected organs, severity, and KD (knowledge) matches. Use deterministic reasons from scoring list: {medReasons}. Include explicit references to KB entries (e.g., 'Ch.11 p9241: Diarrhoea — S10 after each stool')."

3) Potency rationale prompt:
   "Based on phase={phase} and inferred polarity={polarity}, produce a dosing rationale paragraph: starting potency, escalation ladder, when to switch, and safety cautions. Cite KB rules (Law of Similarity, dose types)."

4) Electricity selection prompt:
   "Given affected organs and body side, propose external electricity selection and points (1–45). Explain polarity choice and fallback to W.E. Link to KB points (numbers/pages)."

Implementation pseudocode (Node.js style)
```js
async function makeClinicalSummary(input){
  const kb = loadKB();
  const temperament = inferTemperament(input) || await callLLM('temperament', {input,kb});
  const selector = selectFromKnowledgeBase(input, temperament, input.isHyper);
  const potency = computePotencyAdvice(input, selector, kb);
  const elect = computeElectricityAdvice(input, kb);
  const prompt = buildSummaryPrompt({input, temperament, selector, potency, elect});
  const summary = await localLLM.generate(prompt, {maxTokens: 2000});
  return {summary, structured: {temperament, selector, potency, elect}};
}
```

Safety & guardrails
- Never output prescriptive dosing above/in conflict with KB rules without flagging "clinician review required".
- If vital red flags detected (BP>180, anuria, severe dyspnea) return concise emergency note and stop.
- Include explicit citations to KB pages for all clinical recommendations.

Evaluation & QA
- Generate summary for sample 10 test cases and compare to human‑authored target (F1 / clinician review).
- Logging: keep deterministic structured extract (selector / dosage_map / points) alongside natural language summary for auditability.

Deliverables
- Prompt templates (above) and pseudocode.
- Example output (can be generated after you approve clinical checklist).

