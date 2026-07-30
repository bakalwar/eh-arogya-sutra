# Rule 8 decision (Phase 5C)

## Exact name

**Disease-level Prakruti Inference**

## Intended responsibility

Infer prakriti/temperament from disease-level / registry votes (`infer_disease_prakruti` / `resolve_prakriti` in legacy docs).

## Required inputs (legacy intent)

Disease name / disease-pack prakruti votes.

## Expected outputs (legacy intent)

Temperament / prakriti label for selection boost.

## Why legacy runtime did not wire it

Live `MultiDiseaseEngine` path did **not** call Rule 8 APIs (Phase 5A audit). Docs claimed clinical effect; runtime did not.

## Affects prescription selection?

Docs claim yes; live MDE: **no**. Wiring would change selection vs proven live path and may conflict with full-pool Tablet A/B and multimodal evidence policy.

## Owner-policy conflicts

- Historical unwired vs docs-as-authority  
- Potential conflict with later full-pool tablet reconstruction  
- Risk of inventing disease→prakriti mapping without verified authority  

## Phase 5C status

**NOT_IMPLEMENTED**

Allowed alternatives considered and rejected for this phase:

- Dummy pass-through — forbidden  
- Marking EXECUTED without tests — forbidden  
- `READY_FOR_VALIDATION` without proven implementation — deferred  

Defer deliberate Rule 8 wiring to a later owner-approved phase (with prescription-engine policy alignment).
