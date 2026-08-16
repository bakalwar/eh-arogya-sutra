# Rule 3 — Organ-System Affinity Engine implementation evidence (post-merge)

## 1. Document control

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** (post-merge implementation evidence) |
| **Document class detail** | Technical synthetic-shadow evidence only — **not** clinical validation; **not** clinical correctness; **not** a real organ-system catalog; **not** real mapping evidence; **not** a candidate-to-active clinical promotion policy; **not** Rule 4 integration; **not** orchestration/activation/Rx authority; **not** production readiness |
| **Authorization (this documentation)** | **`R3_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_AUTHORIZED`** |
| **Owner governance directive** | **`ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`** |
| **Independent technical review (pre-merge)** | **`R3_INDEPENDENT_SYNTHETIC_SHADOW_REVIEW_PASS`** |
| **Owner merge readiness (pre-merge)** | **`EHAS2_PR104_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR104_OWNER_MERGE_AUTHORIZED`** (executed) |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |
| **Canonical `origin/main` (post PR #104)** | `6fbafad7e664c766c8ea1d7d37800e6e2a413512` |
| **Companion canonical contract** | [rule-03-organ-system-affinity-contract.md](./rule-03-organ-system-affinity-contract.md) |
| **Companion frozen clinical specification** | [rule-03-organ-system-affinity.md](./rule-03-organ-system-affinity.md) (body preserved) |
| **Cross-rule authority pointer** | [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md) |

This document records **post-merge** evidence that the Rule 3 **synthetic-only shadow** evaluator (`@ehas2/rule3`, `evaluateRule3Shadow`, identity `ORGAN_SYSTEM_AFFINITY`) was merged to canonical `main` via PR #104, independently reviewed for technical compliance, and remains **non-clinical** / **non-orchestrated**.

It does **not** claim Electrohomeopathy clinical correctness, invent or approve any real closed organ-system catalog or real organ-system mappings, create an evidence catalog, connect orchestration/runtime, activate clinical selection, grant medicine/prescription influence, mutate formulas, integrate Rule 4, resume Rule 5 C3E, or modify legacy.

**Review/merge tokens do not prove clinical correctness** — they attest technical shadow-evaluator review and owner merge authority only. **Technical PASS is not clinical validation. Technical implementation does not mean clinically activated Rule 3.**

Facts below that cite CI, pre-merge independent review, or prior local gates are **recorded evidence**, not freshly re-executed in this documentation-only tranche.

---

## 2. Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

| Layer | Holds |
|-------|--------|
| Owner clinical authority | Organ/system clinical meanings; candidate→active clinical promotion; closed real catalog approval; evidence that may activate real annotations; review/blocking meaning; future downstream influence; clinical activation / orch / production Rx |
| Technical engineering (documented here) | Package schemas; fail-closed validation; empty registry mechanics; synthetic fixtures; deterministic ordering/fingerprinting; tests/CI; metadata alignment |

Technical engineering evidence **cannot** create clinical authority. Owner approval remains required before real organ-system catalog/mappings, clinical thresholds/weights, candidate→active clinical promotion, medicine selection, formula mutation, potency/electricity, Rule 4 live integration, orchestration, clinical activation, or production Rx effect.

---

## 3. Identity and governance

| Item | Value |
|------|--------|
| Rule number | **3** |
| Machine identity | `ORGAN_SYSTEM_AFFINITY` (`R3-ID-01`) |
| Canonical display | **Organ-System Affinity Engine** (`R3-ID-02`) |
| Approved UI label | **Rule 3 — Active Organ Systems** |
| Historical / non-authoritative alias | **Organ / System Affinity** (dashboard / clinical-engine / Python still retain this alias) |
| Owner decisions | `R3-ID-01` … `R3-ID-05` (`R3_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`) |
| Stage A identity | `IDENTITY_OWNER_LOCKED` (PR #103 Stage A matrix reconciliation) |

---

## 4. Canonical current status tokens

| Token | Meaning |
|-------|---------|
| `RULE3_IDENTITY_ORGAN_SYSTEM_AFFINITY` | Machine identity `ORGAN_SYSTEM_AFFINITY` / display **Organ-System Affinity Engine** |
| `RULE3_CANONICAL_CONTRACT_DOCUMENTED` | Focused contract documented (PR #103) |
| `RULE3_SHADOW_EVALUATOR_IMPLEMENTED` | Synthetic shadow package present on main (PR #104) |
| `RULE3_TECHNICAL_READY_FOR_VALIDATION` | `nineRules` technical `READY_FOR_VALIDATION` only — **not** clinical readiness |
| `RULE3_REAL_ORGAN_SYSTEM_MAPPINGS_0` | Real validated organ-system mappings **0** |
| `RULE3_EVIDENCE_CATALOG_NOT_CREATED` | Evidence catalog not created |
| `RULE3_PRODUCTION_REGISTRY_EMPTY` | Production registry empty (`entries: []`) |
| `RULE3_NO_CLOSED_REAL_SYSTEM_CATALOG` | No approved closed real organ-system vocabulary |
| `RULE3_SYNTHETIC_FIXTURES_NON_PROMOTABLE` | Synthetic fixtures technical-only / non-promotable |
| `RULE3_UNKNOWN_REAL_TOKENS_FAIL_CLOSED` | Unknown / non-`SYS_SYN_*` tokens fail closed |
| `RULE3_CANDIDATE_TO_ACTIVE_CLINICAL_PROMOTION_NONE` | No clinical candidate→active promotion policy |
| `RULE3_CLINICAL_THRESHOLDS_NONE` | No normative `3.0` / `1.5` / `0.82` thresholds |
| `RULE3_MEDICINE_SELECTION_INFLUENCE_NONE` | Medicine-selection influence **NONE** |
| `RULE3_FORMULA_MUTATION_NONE` | Formula mutation **NONE** |
| `RULE3_RULE4_NOT_CONNECTED` | Rule 4 binding port untouched / not connected |
| `RULE3_ORCHESTRATION_NOT_CONNECTED` | Orchestration **NOT_CONNECTED** |
| `RULE3_CLINICAL_ACTIVATION_NONE` | Clinical activation **NONE** |
| `RULE3_PRESCRIPTION_EFFECT_NONE` | Prescription/Rx effect **NONE** |
| `RULE3_NOT_CLINICALLY_ACTIVATED_PRESCRIPTION` | Not a clinically activated prescription |
| `RULE3_PRODUCTION_POSTURE_UNCHANGED` | Production Rx / clinical production posture unchanged |
| `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` | No paid dependency |

Also retained (current): `RULE3_IDENTITY_OWNER_LOCKED` · `RULE3_EMPTY_REGISTRY_FAIL_CLOSED` · `RULE3_INDEPENDENT_OF_RULE5_C3E` · `RULE3_PRODUCTION_RX_UNCHANGED`.

**Historical (superseded for current package readiness):** contract-tranche tokens `RULE3_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE3_IMPLEMENTATION_NOT_AUTHORIZED`, and current-facing “evaluator **NOT_IMPLEMENTED**” / “impl **NOT_AUTHORIZED**” / “`packages/rule3` **absent**” / “do not execute proofs” / “do not create `packages/rule3`” wording prior to PR #104 — do **not** read as current post-merge **package** status without this document and companion pointer updates. Clinical prohibitions, mappings **0**, catalog **NOT_CREATED**, no closed real catalog, influence/mutation/orch/activation/Rx **NONE**, and C3E pause remain **current**.

---

## 5. Three-stage delivery chain

### 5.1 Contract PR #103

| Item | Value |
|------|--------|
| **PR** | [#103](https://github.com/bakalwar/EH_AROGYA_SUTRA_2/pull/103) |
| **Base** | `32f652caa0c0dd090d4f33f21c572dbf08ec77f2` |
| **Initial head** | `7103e3350759e767a8a1c6358e7e1f018228b6d3` |
| **Corrected reviewed head** | `9d114d0097a974d930ebe58c6c70279724017385` |
| **Merge** | `81d521a37a02a7cda4014b4960817e186dbc49f5` |
| **Parents** | `32f652caa0c0dd090d4f33f21c572dbf08ec77f2` + `9d114d0097a974d930ebe58c6c70279724017385` |
| **Reviewed-head / merge tree** | `12063a9498f89fd8b71f90a0e63af457878a7a44` |
| **Scope** | 11 docs, `+643/−14`; contract **595** lines |
| **Corrected-head CI** | `31900957133` success on `9d114d0…` |
| **Merge style** | Normal two-parent merge; branch not deleted |
| **Token** | `RULE3_ORGAN_SYSTEM_AFFINITY_CANONICAL_CONTRACT_MERGED_TO_MAIN` |

Docs-only; no package in PR #103.

### 5.2 Implementation PR #104

| Item | Value |
|------|--------|
| **Repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **PR** | [#104](https://github.com/bakalwar/EH_AROGYA_SUTRA_2/pull/104) |
| **Branch** | `feat/rule3-organ-system-affinity-shadow` (**not deleted**; tip still reviewed head) |
| **State** | **MERGED** |
| **Authorized base / Parent 1** | `81d521a37a02a7cda4014b4960817e186dbc49f5` |
| **Reviewed head / Parent 2** | `64143ed3ab3cee8a83aa2817100ba7e515b26196` |
| **Merge commit (`origin/main`)** | `6fbafad7e664c766c8ea1d7d37800e6e2a413512` |
| **Merge style** | Normal two-parent merge (not squash/rebase; no admin bypass; no auto-merge; branch not deleted) |
| **Reviewed-head tree** | `95044c42d7234c40d48c2504a0c8c5d4087f74f2` |
| **Merge-commit tree** | `95044c42d7234c40d48c2504a0c8c5d4087f74f2` |
| **Tree equality** | **YES** |
| **Implementation commits on PR** | Exactly **1**; **no** post-CI commit |
| **Scope** | **exactly 17 paths**, **`+2172/−4`** |
| **CI on reviewed head** | GitHub Actions run **`31967134688`** — **success** on exact head `64143ed3ab3cee8a83aa2817100ba7e515b26196` |

### 5.3 Delivery / review / merge tokens (technical only)

- `R3_ORGAN_SYSTEM_AFFINITY_SYNTHETIC_SHADOW_IMPLEMENTATION_DELIVERED_FOR_INDEPENDENT_REVIEW`
- `R3_INDEPENDENT_SYNTHETIC_SHADOW_REVIEW_PASS`
- `EHAS2_PR104_READY_FOR_OWNER_MERGE_APPROVAL`
- `EHAS2_PR104_OWNER_MERGE_AUTHORIZED`
- `RULE3_ORGAN_SYSTEM_AFFINITY_SYNTHETIC_SHADOW_MERGED_TO_CANONICAL_MAIN`

These prove **authorized technical shadow delivery and owner merge** only — **not** clinical validation, real catalog/mappings, Rule 4 integration, orchestration, activation, or production readiness.

### 5.4 Implementation path inventory (PR #104)

1. `packages/rule3/package.json`
2. `packages/rule3/tsconfig.json`
3. `packages/rule3/src/constants.ts`
4. `packages/rule3/src/errors.ts`
5. `packages/rule3/src/evaluate.ts`
6. `packages/rule3/src/freeze.ts`
7. `packages/rule3/src/index.ts`
8. `packages/rule3/src/types.ts`
9. `packages/rule3/src/validateInput.ts`
10. `packages/rule3/src/version.ts`
11. `packages/rule3/tests/rule3-shadow-proofs.test.ts`
12. `package-lock.json` (Rule 3 workspace registration only)
13. `scripts/typecheck-all.mjs`
14. `vitest.config.ts`
15. `packages/clinical-contracts/src/nineRules.ts` (Rule 3 entry only)
16. `tests/unit/phase5b-clinical-packages.test.ts` (Rule 3 assertions only)
17. `tests/unit/phase5c-nine-rule-orchestration.test.ts` (Rule 3 assertions only)

No documentation, workflows, apps/dashboard, clinical datasets/mappings, Rule 4, orchestration/runtime source, protected-source, C3E/SAC, legacy, or deploy paths were in PR #104.

---

## 6. Package surface (from merged code)

| Item | Recorded fact | Evidence class |
|------|----------------|----------------|
| Package | `@ehas2/rule3@0.1.0-shadow` | Direct code inspection on merge tip |
| Public evaluator | `evaluateRule3Shadow` | Direct code inspection |
| Error type | `Rule3EvaluationError` (`message === failureCode`) | Direct code inspection |
| Machine identity | `ORGAN_SYSTEM_AFFINITY` | Direct code inspection |
| Display | **Organ-System Affinity Engine** | Direct code inspection |
| Contract / input / output versions | `ehas2-rule3-contract-v1` / `ehas2-rule3-input-v1` / `ehas2-rule3-output-v1` | Direct code inspection |
| Runtime dependencies | `dependencies: {}` | Direct code inspection |
| Input keys | **exactly 9** ordered top-level | Direct code inspection |
| Registry keys | **exactly 3** | Direct code inspection |
| Evidence-entry keys | **exactly 12** | Direct code inspection |
| Output keys | **exactly 18** ordered top-level | Direct code inspection |
| Annotation keys | **exactly 11** | Direct code inspection |
| Outcomes | **exactly 7** | Direct code inspection |
| Failure codes | **exactly 5** | Direct code inspection |
| Proofs | **P01–P18** (exactly 18; sequential; unique; no P19) | Committed test structure |
| Adversarial regressions | **R01–R08** (exactly 8) | Committed test structure |
| Focused tests | **26** (18 + 8); zero skips/todos | Committed test structure |
| Rule-package imports | **none** (`@ehas2/rule1/2/4/6/7/9`) | Direct code inspection |
| App caller | **none** | Direct search on merge tip |

---

## 7. Registry, catalog and evidence boundary

| Boundary | Current fact |
|----------|----------------|
| Production registry | `entries: []` · `activeRealMappingCount: 0` · recursively frozen |
| Real organ-system mappings | **0** |
| Evidence catalog | `NOT_CREATED` |
| Closed real organ-system vocabulary | **not approved** |
| Synthetic namespaces | `SYS_SYN_*` / `EVID_SYN_*` required for technical positive; `CASE_SYN_*` is a **fixture convention** for `requestId` and is **not** schema-enforced |
| Synthetic fixtures | technical-only; non-promotable; indication `SHADOW_ACTIVE_TECHNICAL` ≠ clinical active |
| Unknown / historical / real-looking tokens | fail closed (`INVALID_EVIDENCE_REGISTRY`) |
| Non-synthetic approved-looking evidence | cannot bypass empty production registry |
| Caller assertion | cannot create clinical authority |
| Empty registry | does **not** prove clinical absence of organ/system affinity in nature |

---

## 8. Frozen behavior evidence (technical enforcement)

Recorded from production source + prior independent review:

- Structured evidence requirement; chief-complaint anchor posture where represented
- Keyword-only → `LOW_CONFIDENCE_CANDIDATE` / `CANDIDATE_ONLY` + doctor review
- Co-involvement remains candidate without independent confirmation
- No default/fallback system; no METABOLIC fallback; no GYNE→METABOLIC coercion
- No BP-as-gender; no global OCR/photo override; no dictionary-order clinical winner; no silent exception fallback
- No Rule 1 temperament mutation; no Rule 2 polarity conversion; no Triad absorption
- No normative clinical thresholds/weights; no candidate→active **clinical** promotion
- Synthetic positive remains `SHADOW_ACTIVE_TECHNICAL` (shadow/technical only)

---

## 9. Cross-rule and production boundary

| Boundary | Current fact |
|----------|----------------|
| Rule 1 | Separate SoT; no merge/mutation |
| Rule 2 | Separate; no polarity conversion |
| Rule 4 | `rule3BindingPort.ts` **untouched**; not connected as Rule 3 consumer/activator |
| Rules 6 / 7 | Opaque refs only; mappings not consumed |
| Rule 9 | Not called / not reinterpreted by Rule 3 |
| Triad | Explicitly separate |
| App / Python orchestration caller | **None** |
| Orchestration / runtime | `NOT_CONNECTED` |
| Medicine influence / formula mutation / clinical activation / Rx | **NONE** |
| Production | Unchanged |

---

## 10. Safety and mechanical evidence

| Control | Recorded posture | Evidence class |
|---------|------------------|----------------|
| Exact-key validation | Enforced | Code + committed tests |
| Proxy / getter | Fail-closed; trap/getter hits **0** before reject | Independent-review probes (prior) |
| Cycle / sparse / symbol / non-plain | Rejected | Independent-review + committed P16 |
| Duplicate IDs / unsupported versions | Rejected | Committed tests |
| PHI / path / raw bytes / legacy / cross-rule keys | Rejected | Committed tests |
| Input non-mutation / defensive clone / deep freeze | Enforced | Committed P15 |
| Deterministic key order / fingerprint | Enforced | Committed P14 |
| Fixed `message === failureCode` | Enforced | Code + tests |
| Unexpected → `INTERNAL_FAILURE` | Catch wrapper present | Code (no dedicated forced fixture — residual) |
| No fs/net/DB/env/telemetry/`console.*` | Absent in package src | Code scan |
| Root typecheck / Vitest registration | Present | Code |
| Production audit high+ | **0** vulnerabilities | Exact-head CI / prior local audit |
| `nanoid@3.3.18` | Root override intact | Code |

Technical safety proof is **not** clinical validation.

---

## 11. Proof matrix summary

| Surface | Count / result | Evidence class |
|---------|----------------|----------------|
| P01–P18 | 18 sequential unique | Committed tests on PR #104 |
| R01–R08 | 8 | Committed tests |
| Focused suite | 26; zero skips/todos | Committed tests + exact-head CI |
| External behavioral probes | **50/50 PASS** | Independent-review evidence (not re-run here) |
| Negative typecheck probe | Fail then restore | Independent-review evidence |
| Negative P01 Vitest probe | Fail then restore | Independent-review evidence |
| Exact-head CI | `31967134688` success | CI-recorded |

**Honest weak/static portions (unresolved technical residuals):** P08/P12/P14/P17/R06 are partly static, loosely titled, or supplementary; they do not replace production enforcement where present.

---

## 12. Residual inventory (unresolved; not fixed in this tranche)

1. Dashboard / clinical-engine / Python surfaces retain historical **`Organ / System Affinity`**
2. Data-contract field-semantics freeze still distinguishes technical package presence from clinical/runtime SoT consumption (“when implemented” / promotion **IMPLEMENTATION-PENDING**)
3. `CASE_SYN_*` is **not** enforced on `requestId` by current schema
4. Native `Rule3EvaluationError.stack` exists; `JSON.stringify(error)` does not include stack; no app caller found
5. P08/P12/P14/P17/R06 partly static / loosely titled / supplementary
6. No dedicated forced `INTERNAL_FAILURE` behavioral fixture
7. Additional nested engineering exact-key locks beyond top-level contract counts (binding/doctor/finding/versions)
8. Local full-phase5b `better-sqlite3` / CRLF fingerprint noise (environment; CI/Rule-3-filtered assertions passed)
9. Temporary-worktree boundary folder-name warning during review

Stale companion-doc statements that claimed package **absent** / evaluator **NOT_IMPLEMENTED** / proofs **not executed** are **reconciled in this documentation tranche** (see companion pointer updates) and are **not** listed as unresolved package-status residuals after reconciliation.

---

## 13. Explicit non-claims and continuing STOP

This evidence document does **not** authorize:

- Clinical correctness
- Real organ-system catalog
- Real mappings / evidence rows
- Candidate-to-active clinical promotion
- Clinical thresholds / weights
- Medicine selection / formula mutation
- Potency / dosage / electricity / Tablet / external treatment
- Rule 4 integration
- Rule 6 / 7 / 9 orchestration
- Clinical activation / production Rx
- C3E / protected access
- Legacy mutation
- Paid services
- Deployment
- Residual “fixes” listed in §12

**STOP** before all of the above.

---

## 14. Cross-document posture (required agreement)

| Surface | Required posture |
| -------- | ---------------- |
| Contract | Documented |
| Technical package | Implemented (PR #104) |
| Metadata | Technical `READY_FOR_VALIDATION` · `affectsClinicalSelection: false` |
| Clinical correctness | Not established |
| Real mappings | `0` |
| Catalog | `NOT_CREATED` |
| Closed real vocabulary | Not approved |
| Registry | Empty / frozen |
| Candidate promotion | None |
| Thresholds | None |
| Rule 4 | Not connected |
| Orchestration | `NOT_CONNECTED` |
| Influence / mutation / activation / Rx | `NONE` |
| Dashboard alias | Historical, unchanged |
| Production | Unchanged |

No document may equate technical implementation with clinical readiness.
