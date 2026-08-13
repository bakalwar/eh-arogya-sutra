# Rule 7 — External Use Routes implementation evidence (post-merge)

## 1. Document control

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** (post-merge implementation evidence) |
| **Document class detail** | Technical shadow-evaluator evidence only — **not** clinical validation; **not** orchestration or production activation |
| **Authorization (this documentation)** | **`R7_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_AUTHORIZED`** |
| **Owner governance directive** | **`ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`** |
| **Independent technical review (pre-merge)** | **`R7_INDEPENDENT_SHADOW_EVALUATOR_REVIEW_PASS`** |
| **Owner merge readiness (pre-merge)** | **`EHAS2_PR88_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR88_OWNER_MERGE_AUTHORIZED`** (executed) |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |
| **Canonical `origin/main` (post PR #88)** | `4220afb66a8dcbab6fd76365784fcac6b12f4387` |
| **Companion canonical contract** | [rule-07-external-use-routes-contract.md](./rule-07-external-use-routes-contract.md) |
| **Cross-rule authority pointer** | [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md) (§ Owner clinical authority vs technical engineering) |

This document records **post-merge** evidence that the Rule 7 **shadow-only** evaluator (`@ehas2/rule7`, `evaluateRule7Shadow`) was merged to canonical `main` via PR #88, independently reviewed for technical compliance, and remains **non-clinical** / **non-orchestrated**.

It does **not** claim Electrohomeopathy clinical correctness, invent or approve any clinical route/site meaning, authorize real route/site mappings, connect orchestration/runtime, activate production prescription, resume Rule 5 C3E, alter Rule 6 relationships, or modify legacy.

**Review tokens do not prove clinical correctness** — they attest technical shadow-evaluator review and owner merge authority only.

---

## 2. Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

This evidence tranche documents **technical engineering facts** only. Owner approval remains required before any Electrohomeopathy clinical route/site meaning, real mappings, external medicines, formulas, application instructions, clinical activation, or production Rx effect.

---

## 3. Canonical identity (post PR #88)

| Item | Value |
|------|--------|
| **Repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Merge commit (`origin/main`)** | `4220afb66a8dcbab6fd76365784fcac6b12f4387` |
| **Merge parent 1 (pre-merge `main`)** | `7c5b5783bf307457e92ec7fb6b46382b3378ea0e` |
| **Merge parent 2 (reviewed PR head)** | `97a352c841a3598dec79d328b5ef9bbd10751e1f` |
| **Reviewed-head tree == merge tree** | `2cea2785a837e044691b66c3765e743c7ee97c47` |
| **Merge style** | Normal merge commit (not squash/rebase; no admin bypass; branch not deleted by merge procedure) |
| **Package** | `@ehas2/rule7` |
| **Public evaluator** | `evaluateRule7Shadow` |
| **Rule identity** | `EXTERNAL_USE_ROUTES` |
| **Contract / input / output versions** | `ehas2-rule7-contract-v1` / `ehas2-rule7-input-v1` / `ehas2-rule7-output-v1` |

---

## 4. PR #88 identity

| Item | Value |
|------|--------|
| **PR** | [#88](https://github.com/bakalwar/EH_AROGYA_SUTRA_2/pull/88) |
| **Branch** | `feat/rule7-external-use-routes-shadow` |
| **State** | **MERGED** |
| **Base (pre-merge `main` / PR base)** | `7c5b5783bf307457e92ec7fb6b46382b3378ea0e` |
| **Reviewed head** | `97a352c841a3598dec79d328b5ef9bbd10751e1f` |
| **Merge commit** | `4220afb66a8dcbab6fd76365784fcac6b12f4387` |
| **History** | One linear feature commit; head parent equals exact base |
| **Independent technical review** | **`R7_INDEPENDENT_SHADOW_EVALUATOR_REVIEW_PASS`** |
| **Owner merge readiness** | **`EHAS2_PR88_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR88_OWNER_MERGE_AUTHORIZED`** |
| **CI on reviewed head** | GitHub Actions run **`31690134872`** — **success** on exact head `97a352c841a3598dec79d328b5ef9bbd10751e1f` |

### 4.1 Implementation scope (PR #88)

Base `7c5b578…` → reviewed head `97a352c…` (and merge tree): **exactly 15 paths**, **`+1425/−1`**.

**Package paths**

1. `packages/rule7/package.json`
2. `packages/rule7/tsconfig.json`
3. `packages/rule7/src/constants.ts`
4. `packages/rule7/src/errors.ts`
5. `packages/rule7/src/evaluate.ts`
6. `packages/rule7/src/freeze.ts`
7. `packages/rule7/src/index.ts`
8. `packages/rule7/src/types.ts`
9. `packages/rule7/src/validateInput.ts`
10. `packages/rule7/src/version.ts`
11. `packages/rule7/tests/rule7-shadow-proofs.test.ts`

**Mechanical root / metadata paths**

12. `scripts/typecheck-all.mjs`
13. `vitest.config.ts`
14. `package-lock.json` (Rule 7 workspace link/entry only)
15. `packages/clinical-contracts/src/nineRules.ts` (Rule 7 entry only: `affectsClinicalSelection: false`)

No documentation, workflows, apps, clinical datasets, other Rules’ clinical data, orchestration/runtime, protected-source, or legacy paths were in PR #88.

**Single deletion (−1):** stale Rule 7 `affectsClinicalSelection: true` → `false` (plus clarifying comment). Does **not** grant production clinical selection authority.

---

## 5. Package and schema evidence

| Item | Recorded fact |
|------|----------------|
| Runtime surface | Local TypeScript package; Vitest proofs; **`dependencies: {}`**; no external production dependency |
| Input schema | **10** ordered keys (`ehas2-rule7-input-v1`) |
| Output schema | **15** ordered keys (`ehas2-rule7-output-v1`) |
| Indication schema | **6** ordered fields |
| Outcomes | **6** closed outcomes (§6.3) |
| Errors | **5** closed failure codes; `message === failureCode` |
| Unknown keys | Explicit rejection at contract-controlled object levels |
| Always | `shadowOnly: true`; `clinicalActivation: 'NONE'` |

---

## 6. Proof and mechanical evidence

| Item | Recorded fact |
|------|----------------|
| Mandatory proofs | **P01–P16** sequential, unique; **zero** skipped/ignored mandatory proofs |
| Additional regressions | **R01–R10** |
| Focused suite | **26/26 PASS** on reviewed head |
| Root typecheck | `@ehas2/rule7` registered in `scripts/typecheck-all.mjs`; root typecheck invokes Rule 7 |
| Vitest collection | `packages/rule7/tests/**/*.test.ts` included |
| Negative probes | Injected Rule 7 type failure failed root typecheck then restored; injected P01 failure failed root Vitest collection for that case then restored |
| CI | Run `31690134872` **success** on exact reviewed head |

**Honest separation:** Unrelated local environment-dependent Vitest failures (for example auth DB / clinical-extract path issues on some developer machines) are **not** Rule 7 failures and are **not** claimed as Rule 7 passes. Authoritative full-suite evidence for PR #88 is CI on the reviewed head.

---

## 7. Security behavior (technical)

Recorded on the reviewed implementation:

- Proxy / getter rejection occurs **before** trap or accessor invocation (instrumented hit count **0**)
- Cycles and accessors rejected
- PHI-like keys and unknown keys rejected
- Deterministic evaluation; input non-mutation; canonical independent copy; deep-frozen independent output
- Fixed code-only failure messages (`message === failureCode`)
- No oral-copy authority path; no Rule 6 influence as clinical authority
- No legacy / runtime / network / DB / paid coupling in the Rule 7 package

---

## 8. Clinical boundary (current)

| Boundary | Current fact |
|----------|----------------|
| Real clinical route mappings | **`0`** |
| Real site mappings | **`0`** |
| External medicines / formulas / instructions | **none** under this stage |
| Orchestration | **`NOT_CONNECTED`** / `RULE7_ORCHESTRATION_NOT_CONNECTED` |
| Clinical activation | **`NONE`** / `RULE7_CLINICAL_ACTIVATION_NONE` |
| Production Rx | **unchanged** |
| `nineRules.ts` Rule 7 | `affectsClinicalSelection: false` |
| Synthetic identifiers / CI fixtures | **not** clinical evidence / authority |
| Technical PASS | **not** clinical correctness |

Also: `RULE7_NO_ORAL_COPY` · `RULE7_INDEPENDENT_OF_RULE5_C3E` · `RULE7_INDEPENDENT_OF_RULE6_RELATIONSHIP_DATA` · `RULE7_CLINICAL_EVIDENCE_PENDING` · `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`.

Rule 6 active real relationships remain **0**. Rule 5 C3E remains paused / `C3E_NOT_AUTHORIZED`.

---

## 9. Non-blocking residuals (honest; not fixed in this tranche)

Preserved from independent review / merge record. **Do not** treat as corrected by this documentation PR:

1. Input object **insertion order** is set-based (semantic acceptance does not require insertion order); output/indication serialized order is enforced.
2. Early Proxy/accessor rejection may map to **`INVALID_INPUT`** (still fail-closed; zero traps).
3. `notClinicallyIndicated` reason-object may be reused for some non-`NOT_CLINICALLY_INDICATED` statuses.
4. `ORAL_COPY_FORBIDDEN` reason constant is unused in evaluate; oral/Rule-6-shaped inputs are rejected at validation.
5. Unrelated local Vitest environment failures may appear outside CI.
6. JavaScript `Error.stack` may contain local paths if an **external caller** serializes the entire Error object.

**Future runtime/logging contract requirement:** user-facing and clinical outputs must **never** serialize raw `Error.stack`. Fixed `failureCode` / `message` only.

These residuals do **not** authorize a correction PR in this documentation task.

---

## 10. Current status tokens

Unambiguous **current** tokens after PR #88 merge:

- `RULE7_IDENTITY_OWNER_LOCKED`
- `RULE7_SCOPE_OWNER_LOCKED`
- `RULE7_CANONICAL_CONTRACT_DOCUMENTED`
- `RULE7_SHADOW_EVALUATOR_IMPLEMENTED`
- `RULE7_MANDATORY_PROOFS_PASS`
- `RULE7_INDEPENDENT_TECHNICAL_REVIEW_PASS`
- `RULE7_REAL_CLINICAL_ROUTE_MAPPINGS_0`
- `RULE7_REAL_SITE_MAPPINGS_0`
- `RULE7_ORCHESTRATION_NOT_CONNECTED`
- `RULE7_CLINICAL_ACTIVATION_NONE`
- `RULE7_PRODUCTION_RX_UNCHANGED`
- `RULE7_CLINICAL_EVIDENCE_PENDING`
- `RULE7_NO_ORAL_COPY`
- `RULE7_EXTERNAL_MEDICINE_RULES_NOT_AUTHORIZED`
- `RULE7_INDEPENDENT_OF_RULE5_C3E`
- `RULE7_INDEPENDENT_OF_RULE6_RELATIONSHIP_DATA`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`

**Historical (superseded for current implementation readiness):** contract-documentation-tranche tokens `RULE7_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE7_IMPLEMENTATION_NOT_AUTHORIZED`, and current-facing “evaluator **NOT_IMPLEMENTED**” / “impl **NOT_AUTHORIZED**” / “**no** impl” pointer wording in status matrices prior to this evidence document — do **not** read as current post-merge status without this document and companion pointer updates.

**Historical (Phase 5B interface label):** `READY_FOR_VALIDATION` on Rule 7 remains a scaffold/interface label only and must **not** be read as live clinical selection (`affectsClinicalSelection: false` on main).

---

## 11. Explicit non-claims / STOP

This evidence documentation does **not** authorize:

- real route/site evidence or mappings
- external medicines, formulas, or application instructions
- clinical correctness claims
- orchestration/runtime connection
- clinical activation
- production prescription effect
- protected-source access, hashes, or manifests
- Rule 5 C3E / SAC changes
- Rule 6 relationship changes
- legacy mutation
- paid services
- deployment

**Separate owner authorizations required** before: validated route/site clinical evidence data; external-medicine clinical rules (if ever); independent clinical review of concrete mappings; orchestration connection; production activation.

---

## 12. Delivery token (documentation tranche)

When this documentation Draft PR is delivered for independent review:

`R7_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_DELIVERED_FOR_REVIEW`
