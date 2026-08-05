# Stage A — Rule number identity matrix

**Baseline:** `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7` (`origin/main`)  
**Rule:** Do not invent canonical identity without authority evidence.

## Matrix (every distinct name/responsibility found on baseline)

| Rule | Candidate name | Candidate responsibility | Source | Authority | Runtime mode | Conflict |
|------|----------------|------------------------|--------|-----------|--------------|----------|
| 1 | Temperament Engine | Prakriti/temperament evidence; no direct medicine selection | Constitution §D; `rule-01-temperament-engine.md` | **OWNER_APPROVED** spec | Production **NOT_IMPLEMENTED**; 5C synthetic interpretation only | vs legacy `detect_prakriti` (matrix) |
| 1 | Temperament (Prakriti) | Interface label / READY_FOR_VALIDATION stub | `nineRules.ts` L36–39 | **IMPLEMENTATION_CURRENT** | **CONTRACT_ONLY** | Name aligns; status contradicts spec NOT_IMPLEMENTED |
| 2 | Polarity Engine | Formula-specific polarity annotation; no selection | Constitution §D; `rule-02-polarity-engine.md` | **OWNER_APPROVED** | Production **NOT_IMPLEMENTED** | vs legacy dual-path polarity (matrix) |
| 2 | Polarity | Interface stub | `nineRules.ts` L42–45 | **IMPLEMENTATION_CURRENT** | **CONTRACT_ONLY** | 5C synthetic ≠ owner spec (status doc L10) |
| 3 | Organ-System Affinity Engine | Organ/system affinity; parallel with R1 model | Constitution §D; `rule-03-organ-system-affinity.md` | **OWNER_APPROVED** | Production **NOT_IMPLEMENTED** | vs MDE order systems-before-prakriti (legacy) |
| 3 | Organ / System Affinity | Interface stub | `nineRules.ts` L48–51 | **IMPLEMENTATION_CURRENT** | 5C **EXECUTED/UNRESOLVED** synthetic only | Triad rule number **AUDIT_PENDING** (status doc L11) |
| 4 | Potency | Dilution/potency issuance boundary | Constitution; `rule-04-potency-engine-DRAFT.md`; `rule-by-rule-implementation-status.md` | **FORMALLY_FROZEN_SPEC** (DRAFT path) + **IMPLEMENTATION_CURRENT** contracts | Evaluator **NOT_IMPLEMENTED**; mode **off** | Spec says NOT_FROZEN in places inside owner-decisions DRAFT |
| 4 | Potency | TS rule4 package (phases 1–10 contracts) | `packages/clinical-contracts/src/rule4/**` | **IMPLEMENTATION_CURRENT** | **SHADOW_ONLY** / **NON_PRODUCTION_CONNECTED** | — |
| 5 | **Dosage** | Drops/schedule prescription boundary | `nineRules.ts` L59–63; status doc L13; matrix EH_9 #5 | **IMPLEMENTATION_CURRENT** + **LEGACY_REFERENCE_ONLY** (matrix MDE) | **READY_FOR_VALIDATION** stub; **not issued** | **SAC-001** — monitoring identity **not on `main`** |
| 5 | Monitoring, Follow-up & Post-Release Safety Surveillance | Post-release surveillance (not dosage) | **Not present** in tracked files at `658f3fd` | **NOT_FOUND** on baseline | N/A | Unmerged branch `phase-5r/rule5-phase1` **out of Stage A checkout scope** — **OWNER_DECISION_REQUIRED** for canonical Rule 5 on `main` |
| 6 | Multi-Disease / Organ-System Triad | Mixture planning / candidate ranking | `nineRules.ts` L66–69; matrix; status doc L14 | **IMPLEMENTATION_CURRENT** + **LEGACY_REFERENCE_ONLY** | 5C synthetic **EXECUTED** only | “Triad” vs Rule 3 organ engine numbering |
| 7 | External Use Routes | External route selection boundary | `nineRules.ts` L72–75; matrix | **IMPLEMENTATION_CURRENT** | Stub **READY_FOR_VALIDATION**; not issued | — |
| 8 | Disease-level Prakruti Inference | Disease-level prakruti (≠ Rule 1) | Constitution; `nineRules.ts` L78–82; rule-8 docs | **OWNER_APPROVED** readiness doc + **NOT_IMPLEMENTED** | **NOT_IMPLEMENTED** | Legacy matrix claimed clinical effect unwired |
| 9 | Master Pipeline | Orchestration wrapper | `nineRules.ts` L85–88; status doc L17 | **IMPLEMENTATION_CURRENT** | 5C validation wrapper; AnalyzeComplete **NOT_CONNECTED** | — |

## Per-rule Stage A identity status

| Rule | Stage A status | Rationale |
|------|----------------|-----------|
| 1 | **IDENTITY_OWNER_APPROVED** | Constitution + rule-01 spec + owner decisions |
| 2 | **IDENTITY_OWNER_APPROVED** | Constitution + rule-02 spec |
| 3 | **IDENTITY_OWNER_APPROVED** | Constitution + rule-03 spec; triad numbering separate **AUDIT_PENDING** |
| 4 | **IDENTITY_CANDIDATE_ONLY** | Strong spec + contracts; **DRAFT** filename and internal NOT_FROZEN flags in owner-decisions |
| 5 | **IDENTITY_CONFLICT** | **`main` only documents Dosage**; monitoring Rule 5 spec **absent** at baseline |
| 6 | **IDENTITY_CANDIDATE_ONLY** | EH_9 name in contracts; legacy triad semantics in matrix |
| 7 | **IDENTITY_CANDIDATE_ONLY** | Name in EH_9 list; limited owner spec on `main` |
| 8 | **IDENTITY_OWNER_APPROVED** (name) · **NOT_IMPLEMENTED** (runtime) | Spec/readiness docs; explicit NOT_IMPLEMENTED |
| 9 | **IDENTITY_CANDIDATE_ONLY** | “Master Pipeline” label; orchestrator ≠ production analyze |

## Unresolved identity questions (for owner / Stage B)

1. **Rule 5:** Canonical identity on **`main`** — remain **Dosage** (EH_9 / 5C stub) or adopt **Monitoring** spec from unmerged 5R branch?
2. **Rule 3 vs Rule 6:** Confirm numbering for Organ-System **Triad** vs Organ-System **Affinity** engine.
3. **Rule 4:** Confirm whether `rule-04-potency-engine-DRAFT.md` is **FORMALLY_FROZEN** or still **DRAFT** for governance purposes.

## Implementation vs identity

Stage A **does not** conflate “identity frozen” with “implementation complete.” Rules 1–3 are **owner-approved identities** with **NOT_IMPLEMENTED** production paths on baseline.
