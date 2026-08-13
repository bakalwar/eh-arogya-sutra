# Rule 7 — External Use Routes (Canonical Contract)

| Field | Value |
|-------|--------|
| **Rule number** | 7 |
| **Canonical identity token** | `EXTERNAL_USE_ROUTES` |
| **Display title** | External Use Routes |
| **Document class** | OWNER_LOCKED canonical contract |
| **Authority tokens** | `R7_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED` · `R7_EXTERNAL_USE_ROUTES_CANONICAL_CONTRACT_DOCUMENTATION_AUTHORIZED` |
| **Contract version** | `ehas2-rule7-contract-v1` |
| **Implementation (current)** | `RULE7_SHADOW_EVALUATOR_NOT_IMPLEMENTED` · `RULE7_IMPLEMENTATION_NOT_AUTHORIZED` |
| **Runtime** | `RULE7_ORCHESTRATION_NOT_CONNECTED` · `RULE7_CLINICAL_ACTIVATION_NONE` |
| **Paid services** | `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` |
| **Rule 5 C3E** | `RULE7_INDEPENDENT_OF_RULE5_C3E` (C3E remains paused separately) |
| **Owner governance** | `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED` |
| **Canonical `origin/main` base (at documentation start)** | `60d295cf99f0325bbec3239d40a66ee200f4292e` |

**Status tokens (current):**

- `RULE7_IDENTITY_OWNER_LOCKED`
- `RULE7_SCOPE_OWNER_LOCKED`
- `RULE7_CANONICAL_CONTRACT_DOCUMENTED`
- `RULE7_SHADOW_EVALUATOR_NOT_IMPLEMENTED`
- `RULE7_IMPLEMENTATION_NOT_AUTHORIZED`
- `RULE7_ORCHESTRATION_NOT_CONNECTED`
- `RULE7_CLINICAL_ACTIVATION_NONE`
- `RULE7_EXTERNAL_MEDICINE_RULES_NOT_AUTHORIZED`
- `RULE7_PRODUCTION_OUTPUT_UNCHANGED`
- `RULE7_INDEPENDENT_OF_RULE5_C3E`
- `RULE7_INDEPENDENT_OF_RULE6_RELATIONSHIP_DATA`
- `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`

**Historical (superseded for current identity readiness):** Stage A `IDENTITY_CANDIDATE_ONLY` for Rule 7 — retained only as pre-owner-decision history.

This document is the authoritative EHAS2 Rule 7 **contract**. It does **not** create `packages/rule7`, implement an evaluator, connect orchestration, activate clinical selection, authorize external medicines, or change production prescription output.

---

## 0. Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

Explicit owner approval is required before adding or changing: external medicine or combination; clinical route meaning; disease/symptom-to-route mapping; application-site clinical meaning; strength, quantity, frequency or duration; preparation or application instructions; potency, dosage or electricity; Tablet A/B; any production clinical effect.

Within this locked contract, technical engineering may design schemas/types, deterministic evaluation, validation, immutable outputs, fixed error handling, security/privacy controls, and tests that preserve clinical meaning. Cost/paid services, security-policy change, protected-data access, production/runtime connection, external deploy, and legacy modification still require owner approval.

Unresolved clinical decision → **STOP** and ask owner.

Canonical cross-rule pointer: [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md).

---

## 1. Locked owner decisions (R7-ID-01 … R7-ID-05)

| Decision ID | Owner disposition | Normative effect |
|-------------|-------------------|------------------|
| **R7-ID-01** | **`ACCEPT_EXTERNAL_USE_ROUTES`** | Canonical name **External Use Routes**; identity token **`EXTERNAL_USE_ROUTES`**. |
| **R7-ID-02** | **`SCOPE_EXTERNAL_ROUTES_ONLY`** | Scope limited to external/local application **route and site indication**. Does **not** decide oral medicine/ranking, oral formula, potency, dosage, electricity, Tablet A/B, monitoring/follow-up, emergency treatment selection, final mixture count, or Rule 9 packaging/final approval. |
| **R7-ID-03** | **`ROUTES_OR_NOT_INDICATED_FIRST`** | Initial shadow output is only eligible external route/site indication **or** `NOT_CLINICALLY_INDICATED`. No external medicine, formula, strength, quantity, frequency, duration, preparation method, or application instruction in this stage. External-medicine clinical rules require a later separate owner approval before contract extension. |
| **R7-ID-04** | **`SHADOW_ONLY_UNTIL_SEPARATE_ACTIVATION`** | First form is shadow-only contract → (later) evaluator + tests. Orchestration, runtime connection, production Rx effect, and clinical activation remain blocked until separate owner authorization. |
| **R7-ID-05** | **`FAIL_CLOSED_NO_ORAL_COPY`** | Clinically eligible route/site requires validated evidence **and** recorded explicit owner clinical approval. Legacy engine, oral formula/medicine, Rule 6 relationships, medicine inventory, synthetic tests, agent suggestions, and unvalidated docs are **not** clinical authority. Oral→external copy is **forbidden**. Missing/stale/contradictory/unvalidated/owner-unapproved evidence → fail-closed; **no** positive route selection. |

---

## 2. Provenance

| Source | Role |
|--------|------|
| EH_9 / Phase 5A nine-rule vocabulary | Name and number |
| Owner decisions R7-ID-01–R7-ID-05 | Identity and scope lock |
| [Clinical Product Constitution §F](../CLINICAL_PRODUCT_CONSTITUTION.md#f-dynamic-prescription) | External applications must be organ/site-specific, clinically justified, **not** oral-copy |
| Rule 6 ownership matrix | External applications owned by Rule 7; Rule 6 excludes them (R6-Q17) |
| Legacy `external_application_engine` | **LEGACY_REFERENCE_ONLY** — not EHAS2 clinical authority |

---

## 3. Scope and non-goals

### 3.1 In scope (this contract)

- Deterministic shadow evaluation of **external/local route and site indication** eligibility
- Emission of `NOT_CLINICALLY_INDICATED` when evidence does not support a positive indication
- Fail-closed handling of missing, stale, contradictory, unvalidated, or owner-unapproved evidence
- Explicit non-copy from oral outputs

### 3.2 Out of scope (this stage)

- External medicine selection, ranking, combination, or formula
- Strength, quantity, frequency, duration, preparation, or application instructions
- Oral medicine / oral formula / potency / dosage / electricity
- Tablet A/B
- Monitoring / follow-up / emergency treatment selection
- Final mixture count / Rule 9 packaging or final approval
- Orchestration / runtime / production prescription effect
- Protected-source access / Rule 5 C3E / hashes / manifests
- Legacy engine fill or silent port of clinical rules

---

## 4. Cross-rule ownership

| Capability | Owner |
|------------|--------|
| External / local route & site indication (shadow) | **Rule 7** |
| Oral multi-disease / triad candidates | Rule 6 |
| Potency | Rule 4 |
| Monitoring / follow-up | Rule 5 |
| Tablet A/B | Separate governed track |
| Electricity | Separate pending sibling track |
| Dosage | Separate governed track |
| Final packaging / mixture-count validation | Rule 9 / Constitution §F |

Rule 7 must **not** silently absorb out-of-scope capabilities.

---

## 5. Input vocabulary (`ehas2-rule7-input-v1`)

Plain-data, versioned schema. Identifiers are canonical references. **No PHI**. **No** protected clinical source paths. **No** direct database access as clinical authority.

### 5.1 Required top-level keys (deterministic order)

1. `contractVersion` — must equal `ehas2-rule7-input-v1` (or a later owner-approved version supported by the evaluator)
2. `requestId` — non-PHI synthetic evaluation / request identifier
3. `clinicalTargetRefs` — chief-complaint / clinical-target references (canonical IDs only)
4. `bodySiteRefs` — organ / body-site references relevant to external application
5. `rule3OrganSystemRef` — reference to Rule 3 result envelope (identity + version + status) **or** explicit `{ "status": "UNAVAILABLE" }`
6. `severityRef` — canonical severity reference **or** `{ "status": "UNAVAILABLE" }`
7. `phaseRef` — canonical phase reference **or** `{ "status": "UNAVAILABLE" }`
8. `routeEvidenceRegistry` — evidence registry for route/site indication (may contain **zero** activating entries)
9. `evidenceDataVersions` — version stamps for evidence corpora used
10. `upstreamApplicability` — upstream applicability envelope (e.g. applicable / not applicable / not evaluable)

### 5.2 Input prohibitions

- Oral formula objects or oral medicine selections as authority inputs
- Rule 6 relationship edges as automatic external eligibility
- Legacy engine structures as clinical authority
- PHI, protected paths, hashes, manifests
- Thresholds / weights invented by engineering

---

## 6. Output vocabulary (`ehas2-rule7-output-v1`)

Shadow-only deterministic result. Deep-frozen after construction. Key order fixed.

### 6.1 Required top-level keys (deterministic order)

1. `contractVersion`
2. `ruleNumber` — always `7`
3. `ruleIdentity` — always `EXTERNAL_USE_ROUTES`
4. `requestId`
5. `status` — closed clinical outcome (§7)
6. `applicability`
7. `evaluatedBodySites`
8. `routeIndications` — list of route/site indication records (empty allowed)
9. `notClinicallyIndicated` — boolean **or** structured reason block when status is `NOT_CLINICALLY_INDICATED`
10. `evidenceRefs`
11. `reasonCodes`
12. `blockersOrUnresolvedEvidence`
13. `deterministicFingerprint`
14. `shadowOnly` — always `true` under this contract
15. `clinicalActivation` — always `NONE`

### 6.2 Route indication record (when present; non-medicine)

Fields (key order):

1. `indicationId`
2. `routeCode` — canonical route code (vocabulary owner-approved; no medicine ID)
3. `bodySiteRef`
4. `eligibilityState` — `ELIGIBLE` | `REJECTED` | `UNRESOLVED` | `EVIDENCE_INSUFFICIENT`
5. `evidenceRefs`
6. `reasonCodes`

**Must not** include medicine IDs, formula IDs, strength, quantity, frequency, duration, preparation, or application instructions under this contract stage.

### 6.3 Closed clinical outcomes

1. `NOT_APPLICABLE`
2. `NOT_EVALUABLE`
3. `NOT_CLINICALLY_INDICATED`
4. `SHADOW_ROUTE_INDICATIONS_PROPOSED`
5. `BLOCKED_BY_SAFETY`
6. `UNRESOLVED_EVIDENCE`

### 6.4 Fixed implementation / configuration errors

`message === failureCode`:

1. `INVALID_INPUT`
2. `INVALID_EVIDENCE_REGISTRY`
3. `UNSUPPORTED_CONTRACT_VERSION`
4. `CONTRADICTORY_UPSTREAM_STATE`
5. `INTERNAL_FAILURE`

---

## 7. Fail-closed evidence requirements

An external route/site indication may be proposed as **ELIGIBLE** in shadow output **only if all** are true:

1. Present in `routeEvidenceRegistry` with required provenance fields
2. Evidence validation status = validated under owner-approved criteria
3. Owner clinical approval status = explicitly approved for that evidence version
4. Effective status = approved-and-active (or equivalent active token defined at later data-auth time)
5. Not draft / inventory-only / queued / disputed / stale / superseded / missing-evidence / owner-unapproved
6. Not derived by copying oral formula or oral medicine selection
7. Not derived from Rule 6 relationship edges, legacy engine output, synthetic tests, or agent invention

Otherwise: fail-closed → `NOT_CLINICALLY_INDICATED`, `NOT_EVALUABLE`, `UNRESOLVED_EVIDENCE`, or `BLOCKED_BY_SAFETY` as appropriate — **no** positive eligible indication.

### 7.1 Non-activating evidence sources (never authority alone)

- Legacy `external_application_engine` / old-project routes
- Oral formula output / oral medicine selection
- Rule 6 medicine relationships
- Medicine inventory / R5-M6B audits
- Synthetic CI fixtures
- Agent-generated suggestions
- Unvalidated documentation prose
- File presence, CI PASS, or schema PASS alone

### 7.2 Oral-copy prohibition

Rule 7 **must not** copy oral mixtures, oral medicines, oral rankings, or oral formulas into external route indications.

Constitution §F external policy (organ/site-specific; clinically justified; not blindly oral-copied) remains controlling product policy.

---

## 8. Determinism and immutability (future implementation)

When separately authorized to implement:

- Deep-copy validated input; do not mutate caller input
- Deterministic key order and lexicographic sorting of lists
- Deep-freeze output
- No arbitrary clinical tie-break; unresolved evidence → non-success outcome
- Code-only fixed errors (no PHI / protected paths / medicine dumps)

---

## 9. Future implementation plan (not authorized now)

### 9.1 Suggested package allowlist (unauthorized until separate auth)

- `packages/rule7/package.json`
- `packages/rule7/tsconfig.json`
- `packages/rule7/src/**/*.ts`
- `packages/rule7/tests/**/*.test.ts`

Mechanical root registration (typecheck / Vitest / lockfile) **only** if monorepo convention requires it under that separate implementation authorization.

Do **not** connect orchestration or production in the first implementation auth without explicit extension.

### 9.2 Mandatory future proof matrix

Mechanical count: **16**

| # | Proof category |
|---|----------------|
| P01 | Strict schema validation |
| P02 | Deterministic canonical copy |
| P03 | Positive route indication only with approved active evidence |
| P04 | Unvalidated / inventory evidence → non-activating |
| P05 | Missing evidence → `NOT_EVALUABLE` or `NOT_CLINICALLY_INDICATED` |
| P06 | Contradictory evidence fail-closed |
| P07 | Oral formula / oral medicine copy forbidden |
| P08 | Rule 6 relationship edges do not auto-activate routes |
| P09 | No external medicine / strength / instruction fields in output |
| P10 | `NOT_CLINICALLY_INDICATED` valid empty success-path outcome |
| P11 | Input non-mutation |
| P12 | Deep-freeze output |
| P13 | Exact key order |
| P14 | Code-only errors |
| P15 | No PHI / protected-path leakage |
| P16 | Outcome / error vocabulary closed-set enforcement |

Do **not** execute these tests in this documentation tranche.

---

## 10. Explicit STOP

Under **`R7_EXTERNAL_USE_ROUTES_CANONICAL_CONTRACT_DOCUMENTATION_AUTHORIZED`**:

- Do **not** implement Rule 7 code or create `packages/rule7`
- Do **not** add external medicine clinical rules, formulas, strengths, or instructions
- Do **not** connect orchestration / runtime or activate clinical selection
- Do **not** alter production prescription
- Do **not** resume Rule 5 C3E, change Smart App Control, access protected sources, or create hashes/manifests
- Do **not** modify the legacy repository
- Do **not** invent thresholds, weights, disease→route maps, or medicine selections
- Do **not** use paid APIs / services / certificates
- Do **not** deploy

**Separate authorizations required:** shadow implementation; validated route/site evidence data; external-medicine clinical rules (if ever); independent clinical review; orchestration connection; production activation.
