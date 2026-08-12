# Mixture evidence safety policy (Phase 5C-G)

## Owner rules (final EHAS2 target)

- Simple → exactly **3** oral mixtures  
- Moderate → exactly **4**  
- Complex / multi-system → exactly **5**  
- Never 1 or 2 mixtures  
- Do **not** add unsupported medicines only to fill count  
- No fixed formula / fixed temperament triad  
- No unjustified repetition  
- Formula-specific potency and electricity  
- No default WE; unresolved electricity must state reason  
- Tablet A/B from full 38 pool independently (not oral-copy)  
- Section B without evidence → `NO_CLINICALLY_JUSTIFIED_CANDIDATE`  
- External by organ/site evidence (not oral-copy)  
- Frontend: no medicine inference  
- No prescription issue without doctor review  

## Conflict

**Minimum 3 mixtures** vs **do not add unsupported medicines to fill count**.

These conflict when ranked evidence supports fewer than the required mixture count.

## Owner-approved fail-closed behavior (OD-014)

When evidence cannot support the required 3/4/5 mixtures without fillers:

1. **Do not issue** a prescription  
2. Return `INSUFFICIENT_CLINICAL_EVIDENCE`  
3. Set `DOCTOR_REVIEW_REQUIRED`  
4. Emit **zero** fake/filler formulas  
5. Do **not** return empty arrays as successful generation  

Legacy `decide_mixture_count` may return **0** when untreatable; this is reference evidence only. EHAS2 independently adopts the fail-closed posture above and must not fabricate mixtures.

## Owner approval (OD-014)

The owner approved this fail-closed safety policy on 2026-08-05:

- Insufficient evidence for the required 3/4/5 clinically justified oral mixtures returns `INSUFFICIENT_CLINICAL_EVIDENCE`.
- `DOCTOR_REVIEW_REQUIRED` is mandatory and the response must identify the additional information/evidence required.
- No filler, unsupported, fake, or partial prescription may be issued or presented as successful.
- The formula result contains zero fake formulas until sufficient evidence is supplied and the complete versioned evaluation is run again.

This approval closes the policy decision only. It does not freeze all nine rules, start Phase 5D implementation, connect production analysis or prescription issuance, authorize deployment, or change the legacy engine.

## Owner clarification (OD-013)

The owner approved this documentation clarification on 2026-08-05:

- Simple, Moderate, and Complex/multi-system cases use exactly **3**, **4**, and **5** total oral mixtures respectively.
- “3+1”, “4+1”, and “5+1” are not authorized oral-mixture-count rules.
- Tablet A/B, external treatment, Rule 2 support polarity, and Rule 1 Formula 1/2/3 evidence roles do not add a “+1” oral mixture.
- No filler or unsupported medicine may be added, and no settled tier total may be increased or reduced through undefined shorthand.

This records and disambiguates the existing 3/4/5 rule only. It does not approve the separate fail-closed behavior below, start Phase 5D, freeze the nine-rule specification, authorize deployment, or change the legacy engine.

Primary normative record: [Clinical Product Constitution §F](./CLINICAL_PRODUCT_CONSTITUTION.md#f-dynamic-prescription).

## Ownership clarification (R6-ID-02)

OD-013 (exact **3 / 4 / 5** oral mixture totals) and OD-014 (insufficient-evidence fail-closed) are owned by **Constitution §F** and the **Master Pipeline / Rule 9** constraint layer.

They are **not** the Rule 6 engine identity and must **not** be treated as authorizing Rule 6 to set or override final mixture count. Rule 6 may propose evidence-supported composition candidates only; final count/packaging validation remains Rule 9 / §F.

Authoritative Rule 6 contract: [rules/rule-06-multi-disease-organ-system-triad-contract.md](./rules/rule-06-multi-disease-organ-system-triad-contract.md).

Historical inventory labels that described this file as “Rule 6 mixture evidence policy” are **scope-misaligned** relative to this lock and do not change OD-013/OD-014 substance.

## Status

The OD-013 oral-mixture-count clarification is **OWNER_APPROVED** and recorded.

The separate fail-closed clarification is **OWNER_APPROVED** as OD-014 and is a required safety constraint for any future Phase 5D specification or implementation. Phase 5D itself remains **NOT_STARTED** and requires a separate authorization.
