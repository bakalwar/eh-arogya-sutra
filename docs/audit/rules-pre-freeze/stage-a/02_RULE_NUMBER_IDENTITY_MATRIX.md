# Stage A — Rule number identity matrix (micro-correction pass)

**Stage A base main:** `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7`
**Correction-pass reviewed head:** `d44375ea0234f73a0bc6172d24ca2685bd3e408a`
**Total conflicts:** **7** · **Stage B blockers:** SAC-001, SAC-003

## Rule 4 — unified Stage A classification (SAC-003)

| Field | Stage A value |
|-------|----------------|
| Identity | **IDENTITY_CANDIDATE_ONLY** |
| Specification authority | **NORMATIVE_CANDIDATE** |
| Freeze status | **FREEZE_STATUS_CONFLICT** |
| Owner decision | **OWNER_DECISION_REQUIRED** |
| Runtime | **SHADOW_ONLY** / **PRODUCTION_NOT_CONNECTED** |

Do **not** call Rule 4 formally frozen in Stage A conclusions. Status table “DOCUMENTATION FROZEN” = **CONFLICTING_HISTORICAL_STATUS_CLAIM**.

**Authority EOF read:** `docs/clinical/rules/rule-04-owner-decisions-DRAFT.md` — **complete** (5707 lines); internal **NOT_FROZEN** vs **FROZEN** markers documented in `01_…` (SAC-003).

## Rule 5 — main vs unmerged candidate (SAC-001)

| Source | Identity | Authority |
|--------|----------|-----------|
| `main` (`658f3fd`) — `nineRules.ts`, status doc, interface status | **Dosage** | **IMPLEMENTATION_CURRENT** / EH_9 stub |
| `main` | No `rule-05-*` files | **NO_CANONICAL_RULE_5_SPEC_ON_MAIN** |
| Unmerged `phase-5r/rule5-phase1-contract-foundation` @ `b1ccfb5` | **Monitoring, Follow-up & Post-Release Safety Surveillance** | **UNMERGED_CANDIDATE_EVIDENCE** — spec header **OWNER_APPROVED** / **DOCUMENTATION_FROZEN** on branch only; **not** treated as `main` owner approval |

Read-only branch facts (`git` on local objects):

| Check | Result |
|-------|--------|
| `0508e52`, `b1ccfb5` objects | **exist** |
| `b1ccfb5` ancestor of `origin/main` | **no** (`r5p1_in_main=1`) |
| `main...phase-5r/rule5-phase1` | **16** ahead, **2** behind |
| Rule 5 monitoring spec on branch | `docs/clinical/rules/rule-05-monitoring-follow-up-post-release-safety-surveillance.md` |
| Depends on Rule 4 line | Same branch stack includes Rule 4 phase commits |

**Stage A status:** **IDENTITY_CONFLICT** · **OWNER_DECISION_REQUIRED**

## Rule 8 — authority (correction)

| Question | Evidence-backed answer |
|----------|------------------------|
| Name in constitution §D? | Pointer added via Rule 8 canonical contract documentation tranche (see clinical constitution Rule 8 pointer) |
| Canonical name documented | **Disease-level Prakruti Inference** — [rule-08-disease-level-prakruti-inference-contract.md](../../../clinical/rules/rule-08-disease-level-prakruti-inference-contract.md) |
| Name owner-approved? | **Yes** — `R8_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED` / `ACCEPT_DISEASE_LEVEL_PRAKRUTI_INFERENCE` |
| Identity token | `DISEASE_LEVEL_PRAKRUTI_INFERENCE` |
| Implementation | **NOT_IMPLEMENTED** (`RULE8_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE8_IMPLEMENTATION_NOT_AUTHORIZED`) |
| Prescription requirement | **`NOT_REQUIRED_FOR_PRESCRIPTION`** until separate activation; medicine-selection influence **NONE** |
| Real approved mappings | **`0`** |
| Legacy overstatement | Matrix row: docs claim clinical effect; MDE unwired — **LEGACY_REFERENCE_ONLY** |

**Final Rule 8 identity status (current):** **IDENTITY_OWNER_LOCKED** (supersedes historical Stage A `IDENTITY_CANDIDATE_ONLY`)

## Matrix (baseline `main`)

| Rule | Primary name on `main` | Stage A status |
|------|------------------------|----------------|
| 1 | Temperament Engine | **IDENTITY_OWNER_APPROVED** |
| 2 | Polarity Engine | **IDENTITY_OWNER_APPROVED** |
| 3 | Organ-System Affinity Engine | **IDENTITY_OWNER_APPROVED** |
| 4 | Potency | **IDENTITY_CANDIDATE_ONLY** + **FREEZE_STATUS_CONFLICT** |
| 5 | Dosage (contracts) vs Monitoring (unmerged) | **IDENTITY_CONFLICT** |
| 6 | Multi-Disease / Organ-System Triad (MULTI_DISEASE_ORGAN_SYSTEM_TRIAD) | **IDENTITY_OWNER_LOCKED** (supersedes historical Stage A IDENTITY_CANDIDATE_ONLY) — canonical contract: docs/clinical/rules/rule-06-multi-disease-organ-system-triad-contract.md |
| 7 | External Use Routes (`EXTERNAL_USE_ROUTES`) | **IDENTITY_OWNER_LOCKED** (supersedes historical Stage A IDENTITY_CANDIDATE_ONLY) — canonical contract: docs/clinical/rules/rule-07-external-use-routes-contract.md |
| 8 | Disease-level Prakruti Inference (`DISEASE_LEVEL_PRAKRUTI_INFERENCE`) | **IDENTITY_OWNER_LOCKED** (supersedes historical Stage A IDENTITY_CANDIDATE_ONLY) — canonical contract: docs/clinical/rules/rule-08-disease-level-prakruti-inference-contract.md |
| 9 | Master Pipeline (`MASTER_PIPELINE`) | **IDENTITY_OWNER_LOCKED** (supersedes historical Stage A IDENTITY_CANDIDATE_ONLY) — canonical contract: docs/clinical/rules/rule-09-master-pipeline-contract.md |

## OD-013 / OD-014 (SAC-005)

- OD-013 **remains valid** for exactly 3/4/5 oral totals.
- OD-014 **controls current fail-closed policy** status (OWNER-APPROVED).
- OD-013 closing bullet (“does not approve fail-closed policy”) is **historical ordering**; does **not** reverse OD-014.
- Future tidy = **separate bounded doc task** (out of Stage A six-file scope).
