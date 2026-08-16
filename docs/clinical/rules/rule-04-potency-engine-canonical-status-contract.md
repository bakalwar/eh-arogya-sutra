# Rule 4 — Potency Engine (Canonical Identity / Status Contract)

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** — focused canonical **identity/status** contract |
| **Rule number** | **4** |
| **Canonical machine identity** | `POTENCY_ENGINE` (`R4-ID-01`) |
| **Canonical display name** | **Potency Engine** (`R4-ID-02`) |
| **Historical / non-authoritative aliases** | `Potency` · `Rule 4 — Potency` · legacy function labels (e.g. `get_unified_clinical_potency`) · existing `*-DRAFT.md` filenames (`R4-ID-03`) |
| **Authority token (this tranche)** | `R4_ID01_TO_R4_ID07_OWNER_DECISIONS_ACCEPTED` |
| **Owner governance directive** | `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED` |
| **Documentation freeze (clinical Q bodies)** | `LIMITED_FREEZE` — Q1–Q18 per SAC-003 (unchanged by this document) |
| **Technical implementation posture** | `SHADOW_IMPLEMENTED_PHASES_1_TO_10` (retained packaging; not rebuilt here) |
| **Technical metadata status** | technical `READY_FOR_VALIDATION` — **not** clinical validation · **not** production readiness |
| **Canonical shadow selection posture** | `affectsClinicalSelection: false` (`R4-ID-06`) |
| **Standalone package** | `packages/rule4` **absent** · `@ehas2/rule4` **not** authorized |
| **Existing shadow home** | `packages/clinical-contracts/src/rule4/**` + Python mirror/hook under `apps/clinical-engine/.../rule4/` |
| **Paid services** | `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` |
| **Canonical `origin/main` base (this documentation tranche)** | `82cdfe1dadd4e8f0a9eff0358b1d55f70b6fe6c8` |

**Read-only clinical / freeze authority (not amended here):**

- [rule-04-SAC-003-freeze-clarification.md](./rule-04-SAC-003-freeze-clarification.md)
- [rule-04-owner-decisions-DRAFT.md](./rule-04-owner-decisions-DRAFT.md)
- [rule-04-potency-engine-DRAFT.md](./rule-04-potency-engine-DRAFT.md)
- [rule-04-unresolved-clinical-questions-DRAFT.md](./rule-04-unresolved-clinical-questions-DRAFT.md)

This document locks **identity and status vocabulary** only. It does **not** rebuild Rule 4, invent schemas/proofs/thresholds/data assets, connect orchestration, activate clinical selection, or authorize production Rx.

---

## 1. Documentation-only classification

| This document is | This document is not |
|------------------|----------------------|
| Focused identity/status contract | Clinical validation |
| Owner-locked naming / status tokens | Production readiness |
| Pointer into Limited Freeze + existing shadow packaging | A new `@ehas2/rule4` package authorization |
| Reconciliation of status surfaces | Q1–Q18 body rewrite |
| Record of metadata drift | A fix to `nineRules.ts` / dashboard code |

**Technical PASS / technical `READY_FOR_VALIDATION` ≠ clinical readiness. Identity lock ≠ clinical activation.**

---

## 2. Authority precedence

1. Permanent directive: `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`
2. This tranche’s owner decisions **R4-ID-01…R4-ID-07** (`R4_ID01_TO_R4_ID07_OWNER_DECISIONS_ACCEPTED`)
3. SAC-003 Limited Freeze clarification (Q1–Q18 frozen; TH/DA excluded)
4. Existing frozen Q1–Q18 clinical decision bodies (unchanged)
5. Existing Phase 1–10 shadow implementation / phase reports (technical evidence; not clinical activation)
6. Interface / dashboard / Stage A historical labels (non-authoritative where they conflict)

---

## 3. Owner decisions R4-ID-01 … R4-ID-07

| ID | Decision | Meaning |
|----|----------|---------|
| **R4-ID-01** | Accept machine token **`POTENCY_ENGINE`** | Canonical identity for Rule 4 |
| **R4-ID-02** | Canonical display **Potency Engine** | Owner-locked product name |
| **R4-ID-03** | Alias policy | `Potency`, `Rule 4 — Potency`, legacy function labels, and existing `*-DRAFT.md` filenames are **historical / non-authoritative**; **no rename** in this tranche |
| **R4-ID-04** | Packaging retention | Keep Phases 1–10 in `packages/clinical-contracts/src/rule4/**` + Python mirror/hook; **do not** create `packages/rule4` / `@ehas2/rule4`; **do not** rebuild/relocate/duplicate evaluators |
| **R4-ID-05** | Technical status tokens | `LIMITED_FREEZE` · `SHADOW_IMPLEMENTED_PHASES_1_TO_10` · technical `READY_FOR_VALIDATION` — **not** clinical validation / production readiness |
| **R4-ID-06** | Shadow selection posture | Canonical **`affectsClinicalSelection: false`**; existing code metadata `true` is **unresolved mechanical drift** (not edited here) |
| **R4-ID-07** | Scope lock | Reconcile **identity/status documentation surfaces only**; do **not** change Q1–Q18 bodies or technical implementation |

---

## 4. Canonical identity

| Item | Value |
|------|--------|
| Rule number | 4 |
| Machine identity | `POTENCY_ENGINE` |
| Display | **Potency Engine** |
| Identity status | `IDENTITY_OWNER_LOCKED` |

---

## 5. Historical / non-authoritative aliases

| Alias | Status |
|-------|--------|
| `Potency` (dashboard / Phase 5B / matrix short name) | Historical / non-authoritative |
| `Rule 4 — Potency` | Historical / non-authoritative |
| Legacy `potency_engine.get_unified_clinical_potency` | LEGACY_REFERENCE_ONLY — not EHAS2 clinical SoT |
| Filenames `rule-04-*-DRAFT.md` | Filename metadata only — does **not** override DOCUMENTATION FROZEN / Limited Freeze headers |

Dashboard / `nineRules.ts` rename is **not** authorized by this documentation tranche.

---

## 6. Existing packaging model (R4-ID-04)

| Surface | Posture |
|---------|---------|
| `packages/rule4` | **Absent** (still) |
| `@ehas2/rule4` | **Not** created / **not** authorized |
| TypeScript shadow | Present under `packages/clinical-contracts/src/rule4/**` (Phases 1–10) |
| Python mirror / orchestrator hook | Present under `apps/clinical-engine/.../rule4/` |
| Rebuild / relocate / duplicate | **Prohibited** in this tranche |

Standalone package-absent wording must be read with this distinction: absence of `@ehas2/rule4` does **not** mean Rule 4 shadow code is absent from the repository.

---

## 7. Limited Freeze boundary

Per SAC-003 (unchanged):

- **Q1–Q18** clinical decision bodies remain the frozen documentation baseline
- This identity/status contract **does not expand** the Limited Freeze
- Mid-file historical `NOT_FROZEN` markers remain classified per SAC-003 (runtime / intermediate), not as reopening Q bodies

---

## 8. TH-01 … TH-04 (pending)

| ID | Posture |
|----|---------|
| TH-01 … TH-04 | **Pending separate owner approval** · **not frozen** · **no clinical-selection authority** from this document |

No numeric threshold invent / approve / change in this tranche. Shadow structural constants in existing code are **not** promoted to owner-approved TH authority here.

---

## 9. DA-01 … DA-07 (pending / not executable)

| ID | Posture |
|----|---------|
| DA-01 … DA-07 | **Pending / not executable** until separately frozen and implemented |

No fabricated, legacy, AI-generated, or interface-asserted substitute creates DA clinical authority in this tranche.

---

## 10. Current engine modes

| Mode | Posture |
|------|---------|
| Default | `RULE4_ENGINE_MODE=off` / `RULE4_DEFAULT_ENGINE_MODE = 'off'` |
| `shadow` | Collector / annotation-only when enabled; **no** new authority from this document |
| `active` | **Not authorized** · throws / `RULE4_ENGINE_MODE_ACTIVE_NOT_IMPLEMENTED` |

This documentation does **not** change environment mode behavior.

---

## 11. Rule 3 binding boundary

- Local Rule 3 binding-port types/validators may exist under Rule 4 evidence modules
- Binding-port **existence ≠** live `@ehas2/rule3` / `evaluateRule3Shadow` coupling
- Rule 3 remains separately owner-locked; this tranche does **not** authorize Rule 3↔Rule 4 evaluator integration

---

## 12. Orchestration / activation / Rx posture

| Surface | Current required reading |
|---------|--------------------------|
| Orchestration default | **`off`** — public analyze result unchanged when mode off |
| Clinical activation | **NONE** / **not authorized** |
| Production issuance | **Blocked** · not authorized by this document |
| Prescription effect | **NONE** as production authority |

No new orchestration, activation, or Rx authority is granted here.

---

## 13. Canonical `affectsClinicalSelection: false` (R4-ID-06)

Owner-approved **canonical shadow posture** for Rule 4 documentation/status surfaces:

`affectsClinicalSelection: false`

---

## 14. Existing code metadata drift (unresolved; not fixed here)

Current mechanical metadata in code/interface (e.g. `packages/clinical-contracts/src/nineRules.ts` Rule 4 entry and/or dashboard) may still show `affectsClinicalSelection: true` and/or short alias **Potency**.

| Classification | Value |
|----------------|--------|
| Status | **Unresolved mechanical metadata drift** |
| Clinical authority | **None** — drift does **not** override R4-ID-06 |
| This tranche | Documents only — **does not** edit `nineRules.ts`, dashboard, or apps |

---

## 15. Technical `READY_FOR_VALIDATION` ≠ clinical readiness

`READY_FOR_VALIDATION` here means technical shadow packaging / identity readiness for further owner-gated validation work only.

It does **not** mean:

- clinical correctness established
- TH/DA approved
- production connected
- prescriptions issuable

---

## 16. Non-claims and continuing STOP

This document does **not** authorize:

- Q1–Q18 body modification
- TH-01…TH-04 values
- DA-01…DA-07 creation/population
- D3/D5/D10/D30/D60 clinical selection changes
- D100/D200 revival
- `packages/rule4` / `@ehas2/rule4` creation
- evaluator rebuild/tests/code changes
- Rule 3 live evaluator connection
- orchestration behavior / env-mode changes
- `active` mode implementation
- medicine / formula / potency / electricity / Rx production authority
- C3E / protected access / paid APIs / legacy mutation / deployment

**STOP** before all of the above.

---

## 17. Future work requiring separate authorization

Examples (not granted here):

1. Documentation rename of `*-DRAFT.md` filenames (hygiene only)
2. `nineRules.ts` / dashboard metadata alignment to `affectsClinicalSelection: false`
3. TH-01…TH-04 owner-decision process
4. DA-01…DA-07 evidence acquisition / freeze
5. Live Rule 3 envelope binding policy
6. Orchestration / activation / production reviews
7. Any `@ehas2/rule4` packaging migration (only if separately authorized)

---

## Status tokens (current)

- `RULE4_IDENTITY_POTENCY_ENGINE`
- `RULE4_IDENTITY_OWNER_LOCKED`
- `RULE4_CANONICAL_IDENTITY_STATUS_CONTRACT_DOCUMENTED`
- `RULE4_LIMITED_FREEZE`
- `RULE4_SHADOW_IMPLEMENTED_PHASES_1_TO_10`
- `RULE4_TECHNICAL_READY_FOR_VALIDATION`
- `RULE4_AFFECTS_CLINICAL_SELECTION_FALSE_CANONICAL`
- `RULE4_PACKAGES_RULE4_ABSENT`
- `RULE4_CLINICAL_CONTRACTS_SHADOW_HOME`
- `RULE4_TH_01_TO_TH_04_PENDING`
- `RULE4_DA_01_TO_DA_07_NOT_EXECUTABLE`
- `RULE4_ENGINE_MODE_DEFAULT_OFF`
- `RULE4_ACTIVE_NOT_AUTHORIZED`
- `RULE4_ORCHESTRATION_PRODUCTION_NOT_AUTHORIZED`
- `RULE4_PRESCRIPTION_ISSUANCE_NOT_AUTHORIZED`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`

**Historical (superseded for identity readiness by R4-ID-01…R4-ID-07):** Stage A `IDENTITY_CANDIDATE_ONLY` + `FREEZE_STATUS_CONFLICT` labels for Rule 4 identity/freeze governance — retain as superseded history; SAC-003 Limited Freeze + this contract govern current identity/status reading.
