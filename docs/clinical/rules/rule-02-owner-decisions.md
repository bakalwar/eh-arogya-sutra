# Rule 2 — Owner Decisions (Phase 5R-2F Freeze)

**Authority:** OWNER-APPROVED
**EHAS2 code (current technical package):** `RULE2_SHADOW_EVALUATOR_IMPLEMENTED` (`@ehas2/rule2@0.1.0-shadow` / `evaluateRule2Shadow`; merged PR #101); canonical identity `POLARITY_ENGINE` / display **Polarity Engine**; canonical contract documented; technical `READY_FOR_VALIDATION` only — **not** clinical validation; real mappings **0**; catalog `NOT_CREATED`; production registry empty; Rule 4 not connected; orch `NOT_CONNECTED`; medicine-selection influence `NONE`; formula mutation `NONE`; clinical activation `NONE`; prescription/Rx effect `NONE`; production posture unchanged
**Historical (superseded by PR #101 for the synthetic technical shadow package only):** `NOT_IMPLEMENTED` / `NOT_AUTHORIZED`. That historical package/evaluator status does not supersede or weaken continuing clinical/runtime prohibitions.

**Current-facing canonical contract:** [rule-02-polarity-engine-contract.md](./rule-02-polarity-engine-contract.md) (`R2_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED` · `R2_POLARITY_ENGINE_CANONICAL_CONTRACT_DOCUMENTATION_AUTHORIZED`)

---

## R2-ID-01 … R2-ID-05 register (current owner lock)

Combined token: `R2_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`

| ID | Approval token | Locked effect | Does not authorize |
|----|----------------|---------------|--------------------|
| **R2-ID-01** | `R2_ID01_ACCEPT_POLARITY_ENGINE_TOKEN` | Machine identity `POLARITY_ENGINE`; display **Polarity Engine** | Package / mappings / orch / Rx |
| **R2-ID-02** | `R2_ID02_MIXED_THERAPEUTIC_POLICY_LOCKED` | MIXED → UNRESOLVED + therapeutic NEUTRAL + doctor review; no opposite invented; no legacy coerce | Potency MIXED ladders / selection |
| **R2-ID-03** | `R2_ID03_EMPTY_REGISTRY_FAIL_CLOSED_SYNTHETIC_ONLY` | Real registry empty; mappings **0**; synthetic-only; medicine-registry `.polarity` ≠ Rule 2 disease evidence | Catalog / inventing rows / auto-promotion |
| **R2-ID-04** | `R2_ID04_SHADOW_INFLUENCE_NONE` | Annotation-only; medicine influence **NONE**; formula mutation **NONE**; orch **NOT_CONNECTED**; activation/Rx **NONE** | Live selection / production effect |
| **R2-ID-05** | `R2_ID05_POLARITY_ENGINE_DISPLAY_ALIAS_POLICY` | Canonical display Polarity Engine; short “Polarity” = historical/interface alias | Dashboard rename in contract docs tranche |

Full normative register: [rule-02-polarity-engine-contract.md](./rule-02-polarity-engine-contract.md) §2.

---

## Identity

| Item | Decision | Tag |
|------|----------|-----|
| Rule number | 2 | OWNER-APPROVED |
| Canonical name | Polarity Engine | OWNER-APPROVED |
| Machine identity | `POLARITY_ENGINE` | OWNER-APPROVED (`R2-ID-01`) |
| Clinical authority | Formula-specific policy engine | OWNER-APPROVED |
| Legacy status | LIVE_BUT_PARTIAL | LEGACY-PROVEN |
| EHAS2 implementation | Synthetic shadow **IMPLEMENTED** (`@ehas2/rule2` / `evaluateRule2Shadow`; PR #101); technical `READY_FOR_VALIDATION`; clinical activation **NONE**; orch `NOT_CONNECTED`; mappings **0**; catalog `NOT_CREATED`; influence/mutation/Rx `NONE` | TECHNICAL-SHADOW (historical: `NOT_IMPLEMENTED` / `NOT_AUTHORIZED` superseded by PR #101 for synthetic package only) |
| mutates_mixtures | false | OWNER-APPROVED |

---

## Strict responsibility (prohibitions)

Rule 2 must **not**: select primary medicine; mutate medicine; select potency; select RE/BE/YE/GE/WE; change mixture count; change target pathology; issue prescription.

Rule 2 provides **immutable polarity annotation only** (OWNER-APPROVED).

---

## Law of opposites

| disease_polarity | required_therapeutic_polarity | Tag |
|------------------|-------------------------------|-----|
| POSITIVE | NEGATIVE | OWNER-APPROVED |
| NEGATIVE | POSITIVE | OWNER-APPROVED |
| RESOLVED NEUTRAL support | NEUTRAL | OWNER-APPROVED |

---

## Unresolved policy

| Field / behavior | Value | Tag |
|------------------|-------|-----|
| disease_polarity | UNRESOLVED | OWNER-APPROVED |
| required_therapeutic_polarity | NEUTRAL | OWNER-APPROVED |
| fallback_policy | OWNER_APPROVED_NEUTRAL_FALLBACK | OWNER-APPROVED |
| doctor_review_required | true | OWNER-APPROVED |
| Overwrite uncertainty as proven Neutral disease | **Prohibited** | OWNER-APPROVED |
| Draft analysis may complete | Yes | OWNER-APPROVED |
| Final prescription without doctor approval | **No** when unresolved policy applies | OWNER-APPROVED |

---

## SUPPORT_ONLY

| Field | Value | Tag |
|-------|-------|-----|
| disease_polarity | SUPPORT_ONLY | OWNER-APPROVED |
| required_therapeutic_polarity | NEUTRAL | OWNER-APPROVED |
| status | RESOLVED_SUPPORT_ROLE | OWNER-APPROVED |
| Distinct from UNRESOLVED | Always | OWNER-APPROVED |

---

## Isolation policies

| Policy | Tag |
|--------|-----|
| Formula-specific evidence only; no global case polarity on all formulas | OWNER-APPROVED |
| BP supporting only for cardiac/vascular/BP-target formulas | OWNER-APPROVED |
| Report findings slot-aligned only | OWNER-APPROVED |
| Photo: no ordinary face; local verified observation only; no global override | OWNER-APPROVED |
| case_polarity_summary display-only | OWNER-APPROVED |
| formula_polarities authoritative for downstream annotation use | OWNER-APPROVED |

---

## Engine separation

| Engine | Tag |
|--------|-----|
| Rule 2 — polarity annotation only | OWNER-APPROVED |
| Potency — separate audit before selection | AUDIT_PENDING |
| Electricity — separate audit before selection | AUDIT_PENDING |
| Medicine selection — 39-pool + other engines; Rule 2 NO_DIRECT_EFFECT | OWNER-APPROVED |

---

## Electricity reference (not Rule 2 selection)

RE→POSITIVE, BE/YE/GE→NEGATIVE, WE→NEUTRAL — **reference only** | OWNER-APPROVED |

---

## Numbering

Rule 1 Temperament; Rule 2 Polarity; “Rule 2 Organ System” typo **rejected** | OWNER-APPROVED |

Organ-System rule number | AUDIT_PENDING |

---

## Supersedes legacy for EHAS2 direction

Legacy UNRESOLVED→MIXED scoring coerce, global detect_polarity, case polarity as driver — **rejected** per [rule-02-legacy-conflicts.md](./rule-02-legacy-conflicts.md).
