# Rule 8 — Disease-level Prakruti Inference implementation evidence (post-merge)

## 1. Document control

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** (post-merge implementation evidence) |
| **Document class detail** | Technical shadow-evaluator evidence only — **not** clinical validation; **not** orchestration or production activation |
| **Authorization (this documentation)** | **`R8_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_AUTHORIZED`** |
| **Owner governance directive** | **`ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`** |
| **Independent technical review (pre-merge)** | **`R8_INDEPENDENT_SHADOW_EVALUATOR_REVIEW_PASS`** |
| **Owner merge readiness (pre-merge)** | **`EHAS2_PR92_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR92_OWNER_MERGE_AUTHORIZED`** (executed) |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |
| **Canonical `origin/main` (post PR #92)** | `39a2c2e9cc2e522f3b5524d86595575849ae3139` |
| **Companion canonical contract** | [rule-08-disease-level-prakruti-inference-contract.md](./rule-08-disease-level-prakruti-inference-contract.md) |
| **Cross-rule authority pointer** | [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md) (§ Owner clinical authority vs technical engineering) |

This document records **post-merge** evidence that the Rule 8 **shadow-only** evaluator (`@ehas2/rule8`, `evaluateRule8Shadow`) was merged to canonical `main` via PR #92, independently reviewed for technical compliance, and remains **non-clinical** / **non-orchestrated**.

It does **not** claim Electrohomeopathy clinical correctness, invent or approve any disease→prakriti mapping or prakriti-category clinical meaning, connect orchestration/runtime, activate clinical selection, grant medicine/prescription influence, resume Rule 5 C3E, alter Rule 6/7 clinical data, or modify legacy.

**Review tokens do not prove clinical correctness** — they attest technical shadow-evaluator review and owner merge authority only. **Technical PASS is not clinical validation.**

---

## 2. Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

This evidence tranche documents **technical engineering facts** only. Owner approval remains required before any Electrohomeopathy clinical disease→prakriti mapping, prakriti-category clinical vocabulary, Rule 1 ↔ Rule 8 reconciliation beyond fail-closed STOP, medicine-selection influence, formula/potency/dosage/electricity, Tablet A/B, clinical activation, or production Rx effect.

---

## 3. Canonical identity (post PR #92)

| Item | Value |
|------|--------|
| **Repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Merge commit (`origin/main`)** | `39a2c2e9cc2e522f3b5524d86595575849ae3139` |
| **Merge parent 1 (pre-merge `main`)** | `b957d30855c3205699a3a4ccc18b3ab533a0dc18` |
| **Merge parent 2 (reviewed PR head)** | `05b70328201bf5f7fddfa26e35a2a0da339fcfec` |
| **Reviewed-head tree == merge tree** | `182f545fb374f76b0aaceb4436231ff79681ce2d` |
| **Merge style** | Normal merge commit (not squash/rebase; no admin bypass; branch not deleted by merge procedure) |
| **Package** | `@ehas2/rule8` |
| **Public evaluator** | `evaluateRule8Shadow` |
| **Rule identity** | `DISEASE_LEVEL_PRAKRUTI_INFERENCE` |
| **Contract / input / output versions** | `ehas2-rule8-contract-v1` / `ehas2-rule8-input-v1` / `ehas2-rule8-output-v1` |

---

## 4. PR #92 identity

| Item | Value |
|------|--------|
| **PR** | [#92](https://github.com/bakalwar/EH_AROGYA_SUTRA_2/pull/92) |
| **Branch** | `feat/rule8-disease-level-prakruti-shadow` |
| **State** | **MERGED** |
| **Base (pre-merge `main` / PR base)** | `b957d30855c3205699a3a4ccc18b3ab533a0dc18` |
| **Reviewed head** | `05b70328201bf5f7fddfa26e35a2a0da339fcfec` |
| **Initial implementation commit** | `cf08c9b996db37dfdbf1ddf06a13699d15a6ba90` |
| **Correction commit (reviewed head)** | `05b70328201bf5f7fddfa26e35a2a0da339fcfec` (parent = `cf08c9b…`) |
| **Merge commit** | `39a2c2e9cc2e522f3b5524d86595575849ae3139` |
| **Independent technical review** | **`R8_INDEPENDENT_SHADOW_EVALUATOR_REVIEW_PASS`** |
| **Owner merge readiness** | **`EHAS2_PR92_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR92_OWNER_MERGE_AUTHORIZED`** |
| **CI on reviewed head** | GitHub Actions run **`31735394906`** — **success** on exact head `05b70328201bf5f7fddfa26e35a2a0da339fcfec` |

### 4.1 Implementation scope (PR #92)

Base `b957d30…` → reviewed head `05b7032…` (and merge tree): **exactly 17 paths**, **`+1810/−8`**.

**Package paths**

1. `packages/rule8/package.json`
2. `packages/rule8/tsconfig.json`
3. `packages/rule8/src/constants.ts`
4. `packages/rule8/src/errors.ts`
5. `packages/rule8/src/evaluate.ts`
6. `packages/rule8/src/freeze.ts`
7. `packages/rule8/src/index.ts`
8. `packages/rule8/src/types.ts`
9. `packages/rule8/src/validateInput.ts`
10. `packages/rule8/src/version.ts`
11. `packages/rule8/tests/rule8-shadow-proofs.test.ts`

**Mechanical root / metadata / authorized test-alignment paths**

12. `scripts/typecheck-all.mjs`
13. `vitest.config.ts`
14. `package-lock.json` (Rule 8 workspace link/entry; incidental reviewed `fsevents` `"dev": true` normalization accepted as non-blocking)
15. `packages/clinical-contracts/src/nineRules.ts` (Rule 8 entry only)
16. `tests/unit/phase5b-clinical-packages.test.ts` (status-assertion alignment only)
17. `tests/unit/phase5c-nine-rule-orchestration.test.ts` (status-assertion alignment only; dashboard `NOT_IMPLEMENTED` retained)

No documentation, workflows, apps, clinical datasets, other Rules’ clinical data, orchestration/runtime source, protected-source, or legacy paths were in PR #92.

### 4.2 Correction commit (`cf08c9b…05b7032`)

Exactly two files, **`+10/−5`**:

| Path | Numstat |
|------|---------|
| `tests/unit/phase5b-clinical-packages.test.ts` | `+6/−3` |
| `tests/unit/phase5c-nine-rule-orchestration.test.ts` | `+4/−2` |

Only Rule 8 `nineRules.ts`-sourced status assertions were aligned to technical `READY_FOR_VALIDATION`. `affectsClinicalSelection === false`, orchestration `NOT_CONNECTED`, and clinical dashboard `rule8Implementation === 'NOT_IMPLEMENTED'` were preserved. `READY_FOR_VALIDATION` means **technical shadow validation only** — not clinical or production readiness.

---

## 5. Package and schema evidence

| Item | Recorded fact |
|------|----------------|
| Runtime surface | Local TypeScript package; Vitest proofs; **`dependencies: {}`**; no external production dependency |
| Input schema | **7** ordered keys (`ehas2-rule8-input-v1`) |
| Output schema | **18** ordered keys (`ehas2-rule8-output-v1`) |
| Indication schema | **6** ordered fields |
| Outcomes | **6** closed outcomes (§6.3) |
| Errors | **5** closed failure codes; `message === failureCode` |
| Eligibility states | **4** closed tokens |
| Rule 1 comparison states | **5** closed tokens |
| Unknown keys | Explicit rejection at contract-controlled object levels |
| Always | `shadowOnly: true`; `clinicalActivation: 'NONE'`; `medicineSelectionInfluence: 'NONE'`; `notRequiredForPrescription: true` |
| Package posture constants | `RULE8_ORCHESTRATION_STATUS = 'NOT_CONNECTED'`; `RULE8_RUNTIME_STATUS = 'NOT_CONNECTED'`; `RULE8_PRESCRIPTION_EFFECT = 'NONE'` (intentionally **not** evaluator output-schema keys) |

---

## 6. Proof and mechanical evidence

| Item | Recorded fact |
|------|----------------|
| Mandatory proofs | **P01–P16** sequential, unique; **no** P17/P18; **zero** skipped/ignored mandatory proofs |
| Additional regressions | **R01–R12** |
| Focused suite | **28/28 PASS** on reviewed head |
| Proxy / getter probes | Instrumented **0** get traps / **0** getter invocations before fail-closed rejection |
| P09 | Behaviorally proves §9.2.1 no-medicine / no-formula / no-treatment / no-Rx-effect / no-runtime obligations on evaluated output + package posture |
| Rule 1 conflict | `BLOCKED_BY_RULE1_CONTRADICTION`; no positive indication; no overwrite / silent merge |
| Root typecheck | `@ehas2/rule8` registered in `scripts/typecheck-all.mjs`; root typecheck invokes Rule 8 |
| Vitest collection | `packages/rule8/tests/**/*.test.ts` included |
| Negative probes | Injected Rule 8 type failure failed typecheck then restored; injected P01 failure failed Vitest then restored |
| CI | Run `31735394906` **success** on exact reviewed head (includes tests, clinical-engine, production build, production audit) |

**Honest separation:** Unrelated local Windows CRLF / Prettier / Rule 4 fixture-hash noise on some developer machines is **not** Rule 8 failure evidence. Authoritative full-suite evidence for PR #92 is Linux CI on the reviewed head.

---

## 7. Security behavior (technical)

Recorded on the reviewed implementation:

- Proxy / getter rejection occurs **before** trap or accessor invocation (hit count **0**)
- Cycles, sparse arrays, symbol keys, accessors rejected
- PHI-like keys and unknown keys rejected
- Deterministic evaluation; input non-mutation; canonical independent copy; deep-frozen independent output
- Fixed code-only failure messages (`message === failureCode`)
- No oral / Rule 6 / Rule 7 / legacy inference authority path
- No runtime / network / DB / paid coupling in the Rule 8 package
- Production mapping registry empty and frozen (`RULE8_PRODUCTION_MAPPING_REGISTRY`)

**Future runtime/logging contract requirement:** user-facing and clinical outputs must **never** serialize raw `Error.stack`. Fixed `failureCode` / `message` only.

---

## 8. Clinical boundary and current Rule 8 status

| Boundary | Current fact |
|----------|----------------|
| Shadow evaluator | **IMPLEMENTED** (`RULE8_SHADOW_EVALUATOR_IMPLEMENTED`) |
| Technical interface / `nineRules.ts` | `phase5bStatus: READY_FOR_VALIDATION` · `affectsClinicalSelection: false` |
| Clinical dashboard | **`rule8Implementation: 'NOT_IMPLEMENTED'`** (production/clinical posture; **unchanged** by PR #92) |
| Real disease→prakriti mappings | **`0`** |
| Owner-approved clinical vocabulary | **absent** |
| Production mapping registry | **empty** |
| Orchestration | **`NOT_CONNECTED`** |
| Clinical activation | **`NONE`** |
| Medicine-selection influence | **`NONE`** |
| Prescription effect | **`NONE`** |
| Prescription requirement | **`NOT_REQUIRED_FOR_PRESCRIPTION`** |
| Rule 1 | Separate; no overwrite / redefine / silent merge |
| Rule 6 active real relationships | **0** |
| Rule 7 real route/site mappings | **0** |
| Rule 5 C3E | Paused / `C3E_NOT_AUTHORIZED`; Rule 8 independent |
| Synthetic identifiers / CI fixtures | **not** clinical evidence / authority |
| Technical PASS | **not** clinical correctness / clinical validation |

Also: `RULE8_RULE1_SEPARATION_PRESERVED` · `RULE8_CLINICAL_EVIDENCE_PENDING` · `RULE8_NO_MEDICINE_FORMULA_OR_TREATMENT_AUTHORITY` · `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`.

Security at merge: `nanoid@3.3.18`; production audit **zero** high+ vulnerabilities on CI; no-paid lock intact; legacy untouched.

---

## 9. Non-blocking residuals (honest; not fixed in this tranche)

Preserved from independent review / merge record. **Do not** treat as corrected by this documentation PR:

1. Input object **insertion order** is set-based (semantic acceptance does not require insertion order); output/indication serialized order is enforced.
2. Evidence-entry field list is an **engineering-closed** schema under contract §7 gates (contract does not enumerate exact entry keys).
3. Incidental `fsevents` `"dev": true` lockfile normalization accompanied the Rule 8 workspace link (reviewed non-blocking).
4. Eligibility tokens `REJECTED` / `UNRESOLVED` / `EVIDENCE_INSUFFICIENT` are defined; positive indication emission uses `ELIGIBLE`.
5. Caller-declared Rule 1 `CONSISTENT` posture is **not** content reconciliation (no owner reconciliation policy yet).
6. Early Proxy/accessor rejection may map to **`INVALID_INPUT`** rather than `INVALID_EVIDENCE_REGISTRY` (still fail-closed; zero traps).
7. JavaScript `Error.stack` may contain local paths if an **external caller** serializes the entire Error object — must never be exposed in runtime/logging (see §7).
8. Windows CRLF / Prettier checkout noise; Linux exact-head CI format gate passed.
9. P07 includes partial absence/identity testing; stronger Rule 1 separation is in evaluate precedence + P08 + conflict path.

These residuals do **not** authorize a correction PR in this documentation task.

---

## 10. Current status tokens

Unambiguous **current** tokens after PR #92 merge:

- `RULE8_IDENTITY_OWNER_LOCKED`
- `RULE8_SCOPE_OWNER_LOCKED`
- `RULE8_CANONICAL_CONTRACT_DOCUMENTED`
- `RULE8_SHADOW_EVALUATOR_IMPLEMENTED`
- `RULE8_MANDATORY_PROOFS_PASS`
- `RULE8_INDEPENDENT_TECHNICAL_REVIEW_PASS`
- `RULE8_REAL_DISEASE_PRAKRUTI_MAPPINGS_0`
- `RULE8_PRODUCTION_MAPPING_REGISTRY_EMPTY`
- `RULE8_ORCHESTRATION_NOT_CONNECTED`
- `RULE8_CLINICAL_ACTIVATION_NONE`
- `RULE8_MEDICINE_SELECTION_INFLUENCE_NONE`
- `RULE8_PRESCRIPTION_EFFECT_NONE`
- `RULE8_NOT_REQUIRED_FOR_PRESCRIPTION`
- `RULE8_CLINICAL_EVIDENCE_PENDING`
- `RULE8_RULE1_SEPARATION_PRESERVED`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`

Also retained (current): `RULE8_PRODUCTION_RX_UNCHANGED` · `RULE8_NO_MEDICINE_FORMULA_OR_TREATMENT_AUTHORITY` · `RULE8_INDEPENDENT_OF_RULE5_C3E` · `RULE8_INDEPENDENT_OF_RULE6_RELATIONSHIP_DATA` · `RULE8_INDEPENDENT_OF_RULE7_ROUTE_MAPPINGS`.

**Historical (superseded for current implementation readiness):** contract-documentation-tranche tokens `RULE8_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE8_IMPLEMENTATION_NOT_AUTHORIZED`, and current-facing “evaluator **NOT_IMPLEMENTED**” / “impl **NOT_AUTHORIZED**” / “**no** impl” pointer wording in status matrices prior to this evidence document — do **not** read as current post-merge **package** status without this document and companion pointer updates.

**Historical (Phase 5B / dashboard distinction):** technical `READY_FOR_VALIDATION` on Rule 8 in `nineRules.ts` is a scaffold/interface label for the shadow package only (`affectsClinicalSelection: false`). The clinical validation dashboard remains **`rule8Implementation: 'NOT_IMPLEMENTED'`** and must **not** be read as production clinical implementation.

---

## 11. Explicit non-claims / STOP

This evidence documentation does **not** authorize:

- real disease→prakriti mappings or owner clinical vocabulary
- Rule 1 alteration, overwrite, or silent merge
- medicine / formula / treatment / Rx influence
- clinical correctness claims
- orchestration/runtime connection
- clinical activation
- production prescription effect
- protected-source access, hashes, or manifests
- Rule 5 C3E / SAC changes
- Rule 6 / Rule 7 clinical data changes
- legacy mutation
- paid services
- deployment
- Rule 9 work

**Separate owner authorizations required** before: validated disease→prakriti evidence data; owner prakriti-category vocabulary; Rule 1 reconciliation contract (if ever); independent clinical review of concrete mappings; orchestration connection; production activation.

---

## 12. Delivery token (documentation tranche)

When this documentation Draft PR is delivered for independent review:

`R8_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_DELIVERED_FOR_REVIEW`
