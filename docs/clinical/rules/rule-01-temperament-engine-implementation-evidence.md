# Rule 1 — Temperament Engine implementation evidence (post-merge)

## 1. Document control

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** (post-merge implementation evidence) |
| **Document class detail** | Technical synthetic shadow-evaluator evidence only — **not** clinical validation; **not** real temperament mapping evidence; **not** clinical correctness; **not** orchestration/activation authority; **not** production readiness |
| **Authorization (this documentation)** | **`R1_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_AUTHORIZED`** |
| **Owner governance directive** | **`ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`** |
| **Independent technical review (pre-merge)** | **`R1_INDEPENDENT_SYNTHETIC_SHADOW_REVIEW_PASS`** |
| **Owner merge readiness (pre-merge)** | **`EHAS2_PR98_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR98_OWNER_MERGE_AUTHORIZED`** (executed) |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |
| **Canonical `origin/main` (post PR #98)** | `478d94ac3c86de3880c0edc717fc8b5b35dcff86` |
| **Companion canonical contract** | [rule-01-temperament-engine-contract.md](./rule-01-temperament-engine-contract.md) |
| **Companion frozen clinical specification** | [rule-01-temperament-engine.md](./rule-01-temperament-engine.md) (body preserved) |
| **Cross-rule authority pointer** | [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md) |

This document records **post-merge** evidence that the Rule 1 **synthetic-only shadow** evaluator (`@ehas2/rule1`, `evaluateRule1Shadow`, identity `TEMPERAMENT_ENGINE`) was merged to canonical `main` via PR #98, independently reviewed for technical compliance, and remains **non-clinical** / **non-orchestrated**.

It does **not** claim Electrohomeopathy clinical correctness, invent or approve any symptom/case→temperament mapping, create an evidence catalog, connect orchestration/runtime, activate clinical selection, grant medicine/prescription influence, resolve Bilious secondary-dosha clinically, resume Rule 5 C3E, alter Rule 8, or modify legacy.

**Review/merge tokens do not prove clinical correctness** — they attest technical shadow-evaluator review and owner merge authority only. **Technical PASS is not clinical validation. Technical implementation does not mean clinically activated Rule 1.**

---

## 2. Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

This evidence tranche documents **technical engineering facts** only. Owner approval remains required before any Electrohomeopathy clinical symptom/case→temperament mapping, evidence catalog population, Bilious secondary-dosha clinical decision, Rule 1 ↔ Rule 8 reconciliation beyond fail-closed STOP, medicine-selection influence, formula/potency/dosage/electricity, Tablet A/B, clinical activation, or production Rx effect.

---

## 3. Canonical current status

Unambiguous **current** tokens after PR #98 merge (canonical spellings reused; aliases noted):

| Token | Meaning |
|-------|---------|
| `RULE1_IDENTITY_TEMPERAMENT_ENGINE` | Machine identity `TEMPERAMENT_ENGINE` / display **Temperament Engine** |
| `RULE1_CANONICAL_CONTRACT_DOCUMENTED` | Focused contract documented |
| `RULE1_SHADOW_EVALUATOR_IMPLEMENTED` | Synthetic shadow package present on main |
| `RULE1_TECHNICAL_READY_FOR_VALIDATION` | `nineRules` technical `READY_FOR_VALIDATION` only — **not** clinical readiness |
| `RULE1_REAL_VALIDATED_MAPPINGS_0` | Real validated symptom/case→temperament mappings **0** |
| `RULE1_EVIDENCE_CATALOG_NOT_CREATED` | Evidence catalog not created |
| `RULE1_PRODUCTION_REGISTRY_EMPTY` | Production mapping registry empty (`entries: []`) |
| `RULE1_EMPTY_REGISTRY_FAIL_CLOSED` | Empty-registry fail-closed posture (R1-ID-04) |
| `RULE1_RULE8_SEPARATION_LOCKED` | Canonical contract separation token |
| `RULE1_RULE8_SEPARATION_PRESERVED` | **Alias** of the locked separation posture (aligned with Rule 8 `RULE8_RULE1_SEPARATION_PRESERVED`) |
| `RULE1_MEDICINE_SELECTION_INFLUENCE_NONE` | Medicine influence **NONE** |
| `RULE1_ORCHESTRATION_NOT_CONNECTED` | Orchestration **NOT_CONNECTED** |
| `RULE1_CLINICAL_ACTIVATION_NONE` | Clinical activation **NONE** |
| `RULE1_PRESCRIPTION_EFFECT_NONE` | Package/output prescription effect **NONE** |
| `RULE1_PRODUCTION_RX_UNCHANGED` | Production Rx unchanged (retained companion token) |
| `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` | No paid dependency |

Also retained (current): `RULE1_IDENTITY_OWNER_LOCKED` · `RULE1_SCOPE_OWNER_LOCKED` · `RULE1_Q3G_TIE_NORMATIVE` · `RULE1_INDEPENDENT_OF_RULE5_C3E`.

**Historical (superseded for current implementation readiness):** contract-documentation-tranche tokens `RULE1_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE1_IMPLEMENTATION_NOT_AUTHORIZED`, and current-facing “evaluator **NOT_IMPLEMENTED**” / “impl **NOT_AUTHORIZED**” / “`packages/rule1` **absent**” wording in status matrices prior to this evidence document — do **not** read as current post-merge **package** status without this document and companion pointer updates.

---

## 4. PR #98 identity proof

| Item | Value |
|------|--------|
| **Repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **PR** | [#98](https://github.com/bakalwar/EH_AROGYA_SUTRA_2/pull/98) |
| **Branch** | `feat/rule1-temperament-engine-shadow` (**not deleted**) |
| **State** | **MERGED** |
| **Authorized base / Parent 1** | `978cfa67e052abee957e753f09a70748b843a620` |
| **Reviewed head / Parent 2** | `b7cfc7ef5a8da65c0cb1aad360abb4f081690f7a` |
| **Merge commit (`origin/main`)** | `478d94ac3c86de3880c0edc717fc8b5b35dcff86` |
| **Merge style** | Normal two-parent merge (not squash/rebase; no admin bypass; no auto-merge) |
| **Reviewed-head tree** | `db052dabca7557c5d5eb8a8684d756b0361e74b3` |
| **Merge-commit tree** | `db052dabca7557c5d5eb8a8684d756b0361e74b3` |
| **Tree equality** | **YES** |
| **Implementation commits on PR** | Exactly **1** (`b7cfc7e…`); **no** post-CI commit |
| **Scope** | **exactly 17 paths**, **`+1859/−6`** |
| **CI on reviewed head** | GitHub Actions run **`31815500526`** — **success** on exact head `b7cfc7ef5a8da65c0cb1aad360abb4f081690f7a` |

### 4.1 Delivery / review / merge tokens (technical only)

- `R1_TEMPERAMENT_ENGINE_SYNTHETIC_SHADOW_IMPLEMENTATION_DELIVERED_FOR_INDEPENDENT_REVIEW`
- `R1_INDEPENDENT_SYNTHETIC_SHADOW_REVIEW_PASS`
- `EHAS2_PR98_READY_FOR_OWNER_MERGE_APPROVAL`
- `EHAS2_PR98_OWNER_MERGE_AUTHORIZED`
- `RULE1_TEMPERAMENT_ENGINE_SYNTHETIC_SHADOW_MERGED_TO_MAIN`

These prove **technical review and owner merge** only — **not** clinical validation, mappings, catalog, orchestration, activation, or production readiness.

### 4.2 Implementation path inventory (PR #98)

1. `packages/rule1/package.json`
2. `packages/rule1/tsconfig.json`
3. `packages/rule1/src/constants.ts`
4. `packages/rule1/src/errors.ts`
5. `packages/rule1/src/evaluate.ts`
6. `packages/rule1/src/freeze.ts`
7. `packages/rule1/src/index.ts`
8. `packages/rule1/src/types.ts`
9. `packages/rule1/src/validateInput.ts`
10. `packages/rule1/src/version.ts`
11. `packages/rule1/tests/rule1-shadow-proofs.test.ts`
12. `package-lock.json` (Rule 1 workspace registration only)
13. `scripts/typecheck-all.mjs`
14. `vitest.config.ts`
15. `packages/clinical-contracts/src/nineRules.ts` (Rule 1 entry only)
16. `tests/unit/phase5b-clinical-packages.test.ts` (Rule 1 assertions only)
17. `tests/unit/phase5c-nine-rule-orchestration.test.ts` (Rule 1 assertions only)

No documentation, workflows, apps/dashboard, clinical datasets/mappings, other Rules’ packages, orchestration/runtime source, protected-source, C3E/SAC, legacy, or deploy paths were in PR #98.

---

## 5. Package identity

| Item | Recorded fact |
|------|----------------|
| Package | `@ehas2/rule1@0.1.0-shadow` |
| Public evaluator | `evaluateRule1Shadow` |
| Error type | `Rule1EvaluationError` (`message === failureCode`) |
| Rule identity | `TEMPERAMENT_ENGINE` |
| Contract / input / output versions | `ehas2-rule1-contract-v1` / `ehas2-rule1-input-v1` / `ehas2-rule1-output-v1` |
| Runtime dependencies | `dependencies: {}` |
| Rule 8 dependency | **none** (no `@ehas2/rule8` import/runtime call) |

---

## 6. Schema and vocabulary

| Item | Recorded fact |
|------|----------------|
| Input keys | **exactly 10** ordered top-level keys |
| Output keys | **exactly 20** ordered top-level keys |
| Outcomes | **exactly 7** closed clinical outcomes |
| Failure codes | **exactly 5**; `message === failureCode` |
| Temperament tokens | **exactly 6** owner-locked tokens |
| Validation | exact-key / unknown-key rejection; nested closed technical schemas; Proxy/`types.isProxy` + accessor rejection before unsafe access; cycles/sparse/symbol/non-plain rejection |

Schema validation is **technical input/output safety** — **not** clinical validation of temperament meaning or mappings.

---

## 7. Frozen clinical-rule fidelity (technical enforcement)

Production shadow evaluator technically enforces owner-frozen rules (mirror only; no expansion):

- six tokens: `LYMPHATIC`, `SANGUINE`, `BILIOUS_HEPATIC`, `NERVOUS`, `MIXED`, `UNKNOWN`
- separate EH / Tridosha (`doshaMapping`) fields — **no** merged `prakriti` field
- no evidence → `UNKNOWN` + `ADDITIONAL_INFORMATION_REQUIRED`
- no default Lymphatic / Mixed / Balanced
- exact tie → `UNRESOLVED_TIE`; `R1_NO_QUESTION_BANK`; no follow-up interaction
- BP systolic ≥140 → SANGUINE support **+3**; systolic &lt;100 → LYMPHATIC support **+2**
- BP alone cannot resolve; photo alone cannot resolve
- Blood/Lymph context is evidence context only — **not** a medicine shortcut
- Bilious secondary-dosha remains unresolved / fail-closed (no guess)

These technical tests **do not** establish clinical validity of temperament diagnosis or mappings.

---

## 8. Rule 1 / Rule 8 separation

- Rule 1 = patient/case/symptom-level EH temperament
- Rule 8 = disease-level prakriti
- `rule8ComparisonRef` optional typed comparison only; default absence posture `NOT_SUPPLIED`
- no Rule 8 runtime dependency / evaluator call
- no merge / copy / average / overwrite / shared weights
- `CONSISTENT` records comparison only
- `CONFLICT` → `BLOCKED_BY_RULE8_CONTRADICTION`; clears/prevents positive indication
- reconciliation remains separately owner-gated

---

## 9. Evidence and registry boundary

| Boundary | Current fact |
|----------|----------------|
| Production registry | `entries: []` · `activeRealMappingCount: 0` · deeply frozen |
| Real positive mappings | **absent** |
| Evidence catalog | `NOT_CREATED` |
| Non-synthetic apparently approved/active entries | cannot produce a positive result (`NOT_EVALUABLE`) |
| Inventory / review / schema-valid / stale / disputed / superseded | cannot activate positive clinical indication |
| Synthetic fixtures | test-only / unmistakably synthetic / non-promotable |
| Synthetic shadow indication | **not** clinical evidence / authority |

No symptom→temperament mapping rows were added by PR #98 or by this documentation tranche.

---

## 10. Proof evidence

### 10.1 Test-run / CI-recorded facts

| Gate | Result |
|------|--------|
| P01–P18 | **exactly 18**; sequential; zero skips/todos; call production `evaluateRule1Shadow` |
| Focused regressions | **exactly 6** |
| Focused suite | **24/24** pass |
| Rule 1 typecheck / build | pass (implementation + pre-merge revalidation) |
| Root typecheck | pass (pre-merge revalidation) |
| Vitest discovery | Rule 1 test file listed |
| phase5b / phase5c Rule 1 assertions | pass |
| ESLint (touched) | pass |
| Touched-path Prettier | Linux exact-head CI authoritative (local Windows CRLF may warn) |
| Boundary checker | OK (worktree folder-name warn only where applicable) |
| `git diff --check` | clean |
| Production audit (`npm audit --omit=dev --audit-level=high`) | **0** |
| Negative typecheck probe | fail → restore |
| Negative P01 probe | fail → restore |
| Exact-head Linux CI | run **`31815500526`** success on `b7cfc7e…` |

### 10.2 Inspected / code-backed facts

- empty frozen production registry constant
- no `@ehas2/rule8` / fs / network / DB / env / Phase5C / orchestration imports in `packages/rule1/src`
- `nineRules` Rule 1 metadata: Temperament Engine · `READY_FOR_VALIDATION` · `affectsClinicalSelection: false`
- dashboard file unchanged (historical label retained)

---

## 11. Security and immutability

| Control | Recorded fact |
|---------|----------------|
| Proxy / getter independent probes | rejection with **zero** unsafe `get` / getter hits |
| Cycles / sparse / symbol / non-plain | rejected |
| PHI / protected paths / raw photo bytes | rejected / absent from contract input |
| fs / network / DB / env / telemetry | none as clinical authority |
| Input non-mutation / defensive clone | enforced |
| Recursive output freeze | enforced |
| Stable order / fingerprint | enforced |
| Mutable public registry / env override | none |
| Paid dependency | none |

---

## 12. Output and production invariants

Every reachable returned output remains:

- `shadowOnly: true`
- `medicineSelectionInfluence: 'NONE'`
- `clinicalActivation: 'NONE'`
- `prescriptionEffect: 'NONE'`

Package-level invariants:

- orchestration `NOT_CONNECTED`
- runtime `NOT_CONNECTED`
- `RULE1_NOT_CLINICALLY_ACTIVATED_PRESCRIPTION = true`

No medicine / formula / potency / dosage / electricity / Tablet A/B / external / monitoring / mixture-count / prescription fields in Rule 1 output.

---

## 13. Residual inventory (honest; unresolved)

Preserved from independent review / merge record. **Not fixed** by this documentation PR:

| # | Residual | State | Class | Blocks current shadow package? | Must fix before future orchestration? | Owner clinical authority required? |
|---|----------|-------|-------|--------------------------------|----------------------------------------|-------------------------------------|
| 1 | Local Windows Prettier may fail on CRLF checkout; exact-head Linux CI passed | unresolved | docs/tooling | No | No (CI is authority) | No |
| 2 | `MIXED` is not scored into a primary indication; fail-closed; not used as tie fallback | unresolved | technical | No | Prefer clarify before clinical MIXED emission | Yes for clinical MIXED meaning/path |
| 3 | `effectiveStatus` is identifier-shape validated rather than closed enum; unknowns cannot activate | unresolved | technical | No | Prefer closed enum before orch | No for current fail-closed |
| 4 | Committed P06 emphasizes `STALE`; full lifecycle matrix independently probed | unresolved | docs/tests | No | Prefer broader committed proofs before orch | No |
| 5 | Dashboard retains historical `Temperament (Prakriti)` label; unchanged by PR #98 | unresolved | docs/UI | No | Align display when owner authorizes UI tranche | No for identity (canonical is Temperament Engine) |
| 6 | Native `Rule1EvaluationError.stack` may exist if callers serialize the whole Error; returned output never includes stack | unresolved | security/logging | No | Yes — logging contract before orch | No |
| 7 | No dedicated top-level `testClassification` input key; synthetic classification via lifecycle/registry gates | unresolved | technical | No | Prefer explicit key if owner wants | Possibly for future clinical gates |
| 8 | `FOLLOW_UP_NOT_USED` remains a vestigial closed resolution token; does not authorize a question bank | unresolved | technical/docs | No | No | Yes before any follow-up interaction |
| 9 | Orchestration / not-clinically-activated posture is package invariants, not among the 20 output keys | unresolved | technical/docs | No | Prefer explicit orch fields only if owner requires | Yes for orch connection |

These residuals do **not** authorize clinical expansion, mappings, catalog, orchestration, or residual-correction work in this command.

---

## 14. Interface / dashboard distinction

| Surface | Current fact |
|---------|----------------|
| `nineRules` Rule 1 | **Temperament Engine** · technical `READY_FOR_VALIDATION` · `affectsClinicalSelection: false` · synthetic-shadow / not-production-connected comment |
| Clinical validation dashboard | **unchanged**; historical display label `Temperament (Prakriti)` may remain |
| Dashboard vs canonical identity | historical dashboard label does **not** override `TEMPERAMENT_ENGINE` / Temperament Engine |
| Dashboard readiness | does **not** prove production readiness |
| Prescription engine | remains disconnected / `NOT_CONNECTED` |

---

## 15. Explicit non-claims / STOP

This evidence documentation does **not** authorize or claim:

- real clinical symptom/case→temperament mappings
- evidence catalog creation
- clinically validated temperament resolution
- Bilious secondary-dosha clinical decision
- clinical correctness
- medicine selection / ranking / boost / demotion
- formula / potency / dosage / electricity
- Tablet A/B / external routes
- Rule 8 reconciliation beyond fail-closed STOP
- orchestration / runtime connection
- production Rx effect
- C3E / protected-source access
- legacy import/authority
- paid service
- deployment

**STOP before:** mapping/catalog creation; residual correction; clinical evidence intake; orchestration; activation; production connection; deployment.

**Separate owner authorizations required** before any of the above.

---

## 16. STOP (this tranche)

Under **`R1_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_AUTHORIZED`**: documentation-only evidence + stale current-facing status pointer reconciliation only.

Do **not** start residual correction, mappings, catalog, orchestration, activation, or deployment from this command.
