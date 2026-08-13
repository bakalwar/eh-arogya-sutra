# Rule 6 — Multi-Disease / Organ-System Triad (Canonical Contract)

| Field | Value |
|-------|--------|
| **Rule number** | 6 |
| **Canonical identity token** | `MULTI_DISEASE_ORGAN_SYSTEM_TRIAD` |
| **Display title** | Multi-Disease / Organ-System Triad |
| **Document class** | OWNER_LOCKED canonical contract |
| **Authority tokens** | `R6_ID01_TO_ID05_RECOMMENDED_OWNER_DECISIONS_APPROVED` · `R6_CANONICAL_CONTRACT_DOCUMENTATION_AUTHORIZED` |
| **Contract version** | `ehas2-rule6-contract-v1` |
| **Implementation (current)** | `RULE6_SHADOW_EVALUATOR_IMPLEMENTED` · evidence: [rule-06-multi-disease-organ-system-triad-implementation-evidence.md](./rule-06-multi-disease-organ-system-triad-implementation-evidence.md) |
| **Runtime** | `RULE6_ORCHESTRATION_NOT_CONNECTED` · `RULE6_CLINICAL_ACTIVATION_NONE` |
| **Paid services** | `NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE` |
| **Rule 5 C3E** | `RULE6_INDEPENDENT_OF_RULE5_C3E` (C3E remains paused separately) |
| **Owner governance** | `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED` |

**Status tokens (current):**

- `RULE6_IDENTITY_OWNER_LOCKED`
- `RULE6_SCOPE_OWNER_LOCKED`
- `RULE6_CANONICAL_CONTRACT_DOCUMENTED`
- `RULE6_SHADOW_EVALUATOR_IMPLEMENTED`
- `RULE6_MANDATORY_PROOFS_20_OF_20_PASS`
- `RULE6_ADDITIONAL_REGRESSIONS_24_PASS`
- `RULE6_INDEPENDENT_IMPLEMENTATION_REVIEW_PASS`
- `RULE6_ORCHESTRATION_NOT_CONNECTED`
- `RULE6_CLINICAL_ACTIVATION_NONE`
- `RULE6_REAL_MEDICINE_RELATIONSHIPS_0`
- `RULE6_VALIDATED_RELATIONSHIP_DATA_PENDING`
- `RULE6_PRODUCTION_OUTPUT_UNCHANGED`
- `RULE6_INDEPENDENT_OF_RULE5_C3E`

**Historical (superseded for current identity readiness):** Stage A `IDENTITY_CANDIDATE_ONLY` for Rule 6 — retained only as pre-owner-decision history.

**Historical (superseded for current implementation readiness):** contract-documentation-tranche tokens `RULE6_IMPLEMENTATION_NOT_AUTHORIZED` · `RULE6_SHADOW_EVALUATOR_NOT_IMPLEMENTED` — superseded by PR #84 merge evidence; do not read as current status without the evidence document.

This document is the authoritative EHAS2 Rule 6 **contract**. Shadow evaluator implementation evidence (post PR #84) is recorded separately. This contract still does **not** authorize orchestration connection, clinical activation, real medicine edges, or production prescription changes.

---

## 0. Owner clinical authority vs technical engineering

**Directive:** `ELECTROHOMEOPATHY_CLINICAL_RULES_REQUIRE_OWNER_APPROVAL_TECHNICAL_ENGINEERING_DELEGATED`

Clinical meaning for Electrohomeopathy rules (सिद्धांत, eligibility, relationships, formulas, contraindications, mixture-count clinical policy, potency/dosage/electricity/tablet/external/monitoring/emergency clinical behavior, thresholds/weights, and evidence/clinical approval status) requires **explicit owner approval** (Dr. Ghanshyam Bakalwar). Engineering must not invent these decisions; unresolved clinical questions → **STOP** and ask owner.

Within this locked contract, technical engineering may implement schemas, deterministic validation, immutability, fixed errors, tests/CI, and package integration that preserve clinical meaning. Cost, security-policy change, protected-data access, production/runtime connection, external deploy, and legacy modification still require owner approval.

Canonical cross-rule pointer: [../CLINICAL_PRODUCT_CONSTITUTION.md](../CLINICAL_PRODUCT_CONSTITUTION.md). Post-merge package evidence: [rule-06-multi-disease-organ-system-triad-implementation-evidence.md](./rule-06-multi-disease-organ-system-triad-implementation-evidence.md).

---

## 1. Provenance

| Source | Role |
|--------|------|
| EH_9 / Phase 5A nine-rule vocabulary | Name and number |
| Owner decisions R6-ID-01–R6-ID-05 | Identity and scope lock |
| [Clinical Product Constitution §F](../CLINICAL_PRODUCT_CONSTITUTION.md#f-dynamic-prescription) | Final oral mixture-count / packaging constraints (not owned by Rule 6) |
| [mixture-evidence-safety-policy.md](../mixture-evidence-safety-policy.md) | OD-013 / OD-014 owner-approved mixture safety (Rule 9 / §F layer) |
| R5-M6B medicine evidence audits | Inventory / evidence *inputs only* — not activated Rule 6 edges |
| Stage A identity matrix (historical) | Pre-lock `IDENTITY_CANDIDATE_ONLY` |

**Not Rule 6 identity:** mixture-count policy alone; medicine-relationship-only engine; electricity engine; potency engine; monitoring engine.

Medicine relationships may be **one controlled function** inside Rule 6, not its complete identity (**R6-ID-01**, **R6-ID-03**).

---

## 2. Locked owner decisions (R6-ID-01–R6-ID-05)

### R6-ID-01 — Canonical identity

- Identity: `MULTI_DISEASE_ORGAN_SYSTEM_TRIAD`
- Display: `Multi-Disease / Organ-System Triad`
- Supersedes current-facing Stage A **IDENTITY_CANDIDATE_ONLY** for Rule 6

### R6-ID-02 — Mixture-count ownership

- Owner-approved **3 / 4 / 5** oral mixture-count and insufficient-evidence fail-closed constraints remain owned by **Constitution §F** and **Master Pipeline / Rule 9** constraint layer.
- Rule 6 **must not** independently determine or override final mixture count.
- Rule 6 may propose evidence-supported **composition candidates**; Rule 9 / §F validates final count and packaging.

### R6-ID-03 — Medicine relationships

- Relationship / combination edges may influence Rule 6 **only** when each edge carries: canonical stable ID; validated evidence status; source/provenance; directionality; applicability conditions; prohibited conditions; version; owner/clinical approval status.
- Unvalidated, unresolved, missing, stale, or contradictory edges **must never activate**.
- R5-M6B relationship material remains **inventory / evidence input only** until separately validated and approved (`RULE6_VALIDATED_RELATIONSHIP_DATA_PENDING`).

### R6-ID-04 — Clinical influence (shadow)

Rule 6 **may**, in shadow mode only:

- rank candidate medicines
- select eligible candidate medicines
- reject / invalidate candidates
- propose formula composition candidates

**only** when supported by approved evidence.

Rule 6 **must**:

- be evidence-gated, deterministic, and fail-closed
- provide reason and evidence references
- remain shadow-only
- not alter current production prescription
- not silently fall back to legacy mappings
- not manufacture relationships or medicines

### R6-ID-05 — Electricity exclusion

- Electricity is **not** owned by Rule 6.
- Electricity remains a **separate unresolved / pending sibling track**.
- Any current-facing claim that electricity ownership is `RULE_6_AUDIT_PENDING` is **superseded** by this contract for EHAS2 Rule 6 authority. Historical Rule 4 wording that used that token remains **historical text** and is **not** edited in this tranche (Rule 4 normative files out of allowlist).
- Rule 6 must **not** select, change, or validate electricity.

---

## 3. Decision register (`R6-Q01` … `R6-Q35`)

Mechanical count: **35** unique sequential IDs.

| ID | Decision (locked) |
|----|-------------------|
| **R6-Q01** | Canonical identity is `MULTI_DISEASE_ORGAN_SYSTEM_TRIAD` / display title Multi-Disease / Organ-System Triad |
| **R6-Q02** | Authority is **shadow-only** until separate activation authorization |
| **R6-Q03** | Evaluation must be **deterministic** for identical canonical inputs + versions |
| **R6-Q04** | Evaluation is **fail-closed** on insufficient / missing / contradictory evidence |
| **R6-Q05** | **No legacy fallback** (no silent MDE / Complexis / PDF mapping rescue) |
| **R6-Q06** | **No hardcoded** disease→medicine mapping as selector authority |
| **R6-Q07** | **No fixed** medicine or fixed formula output |
| **R6-Q08** | Only **approved / active** evidence edges may influence evaluation |
| **R6-Q09** | Missing, stale, or contradictory evidence → `NOT_EVALUABLE` or non-success clinical outcome — never speculative selection |
| **R6-Q10** | Rule 1 temperament is **consumed by reference**, never redefined |
| **R6-Q11** | Rule 3 organ-system evidence is **consumed by reference**, never redefined |
| **R6-Q12** | Disease / clinical-target inputs consumed only from **canonical upstream representation** |
| **R6-Q13** | Rule 4 potency is **excluded** |
| **R6-Q14** | Rule 5 monitoring / follow-up is **excluded** |
| **R6-Q15** | Electricity is **excluded** (sibling pending track) |
| **R6-Q16** | Dosage is **excluded** (separate governed track) |
| **R6-Q17** | Rule 7 external applications are **excluded** |
| **R6-Q18** | Tablet A/B selection is **excluded** |
| **R6-Q19** | Emergency escalation **cannot** directly force medicine selection |
| **R6-Q20** | Rule 9 / Constitution §F owns **final mixture-count validation** |
| **R6-Q21** | Rule 6 may rank / select / reject / propose composition **only** under validated evidence (shadow) |
| **R6-Q22** | Full supplied candidate pool must be **considered** (no premature subsetting by favorites / templates) |
| **R6-Q23** | Every selection / rejection carries **reason code** + **evidence IDs** |
| **R6-Q24** | **No duplicate medicine** within a proposed composition |
| **R6-Q25** | **No unresolved** relationship edge activation |
| **R6-Q26** | Evaluator operates on an **immutable canonical input copy** |
| **R6-Q27** | Output shape and **key order** are deterministic |
| **R6-Q28** | Result is **deep-frozen** (immutable) after emission |
| **R6-Q29** | Upstream inputs are **not mutated** |
| **R6-Q30** | **No production connection** under this contract |
| **R6-Q31** | **No protected-source** dependency |
| **R6-Q32** | **Independent of Rule 5 C3E** |
| **R6-Q33** | **No paid** API / service / dependency / certificate |
| **R6-Q34** | Separate **implementation authorization** required before code |
| **R6-Q35** | Separate **independent clinical review** required before orchestration |

---

## 4. Rule ownership matrix

| Capability | Owner |
|------------|--------|
| Temperament | Rule 1 |
| Organ/system affinity input | Rule 3 |
| Potency | Rule 4 |
| Monitoring / follow-up | Rule 5 |
| Multi-disease / organ-system triad candidate evaluation | **Rule 6** |
| External applications | Rule 7 |
| Final packaging / mixture-count validation | Rule 9 / Constitution §F |
| Electricity | Separate pending sibling track |
| Dosage | Separate governed track |
| Tablet A/B | Separate governed track |

Unresolved capabilities must **not** be silently assigned to Rule 6.

---

## 5. Input contract (`ehas2-rule6-input-v1`)

Plain-data, versioned schema. Identifiers are **canonical references**, not raw legacy engine structures. **No PHI** (no patient name, contact, address). **No** protected clinical source file path. **No** direct database access. **No** environment / config fallback as clinical authority.

### 5.1 Required top-level keys (deterministic order)

1. `contractVersion` — must equal `ehas2-rule6-input-v1` (or a later owner-approved version explicitly supported by the evaluator)
2. `requestId` — non-PHI synthetic evaluation / request identifier
3. `diseaseConditionRefs` — ordered list of canonical disease / condition references
4. `clinicalTargetRefs` — chief-complaint / clinical-target references (canonical IDs only)
5. `rule1TemperamentRef` — reference to Rule 1 result envelope (identity + version + status)
6. `rule3OrganSystemRef` — reference to Rule 3 result envelope (identity + version + status)
7. `severityRef` — canonical approved severity reference **or** explicit `{ "status": "UNAVAILABLE" }`
8. `candidateMedicinePool` — complete permitted candidate medicine ID list for this evaluation
9. `relationshipEvidenceRegistry` — validated medicine-relationship evidence registry document (may be empty list of **active** edges)
10. `safetyExclusionRefs` — contraindication / safety exclusions **only** from approved upstream source
11. `evidenceDataVersions` — medicine / disease / evidence / contract version identifiers
12. `upstreamApplicability` — upstream applicability / status values required for gate logic

### 5.2 Validation rules

| Rule | Behavior |
|------|----------|
| Unknown keys | **Rejected** → implementation error `INVALID_INPUT` |
| Malformed / wrong types | `INVALID_INPUT` |
| Unsupported `contractVersion` | `UNSUPPORTED_CONTRACT_VERSION` |
| Invalid / unusable evidence registry shape | `INVALID_EVIDENCE_REGISTRY` |
| Contradictory upstream status combination | `CONTRADICTORY_UPSTREAM_STATE` |
| Missing mandatory clinical evidence for evaluation | Clinical outcome `NOT_EVALUABLE` (not speculative selection) |
| Rule 4 `TH-01`–`TH-04` / `DA-01`–`DA-07` | **Must not** be used |
| Protected sources | **Must not** appear |

### 5.3 Canonical copy

Before evaluation, the implementation **must** deep-copy the validated input into an immutable canonical working copy (**R6-Q26**). The caller’s object graph must not be mutated (**R6-Q29**).

---

## 6. Output contract (`ehas2-rule6-output-v1`)

Shadow-only deterministic result. Deep-frozen after construction (**R6-Q28**).

### 6.1 Required top-level keys (deterministic order)

1. `contractVersion` — `ehas2-rule6-output-v1`
2. `ruleNumber` — `6`
3. `ruleIdentity` — `MULTI_DISEASE_ORGAN_SYSTEM_TRIAD`
4. `requestId` — echo of input `requestId`
5. `status` — clinical outcome vocabulary token (§7)
6. `applicability` — applicability / gate summary
7. `evaluatedSystemsOrConditions` — systems / conditions actually evaluated
8. `candidateEvaluations` — per-medicine consideration results (full pool coverage)
9. `selectedEligibleCandidates` — ordered eligible selections (may be empty)
10. `rejectedCandidates` — ordered rejections with reasons
11. `proposedCompositionCandidates` — zero or more composition proposals
12. `evidenceRefs` — evidence IDs used
13. `reasonCodes` — ordered reason codes
14. `blockersOrUnresolvedEvidence` — blockers / unresolved items
15. `rule9SectionFValidationRequired` — always `true` when any composition is proposed; otherwise deterministic boolean per §6.4
16. `deterministicFingerprint` — nullable until implementation defines fingerprint algorithm under separate auth
17. `shadowOnly` — always `true` under this contract
18. `clinicalActivation` — always `NONE`

### 6.2 Per-candidate evaluation states (closed)

Within `candidateEvaluations`, each medicine ID must appear exactly once from the supplied pool, with exactly one of:

- `CONSIDERED`
- `EVIDENCE_INSUFFICIENT`
- `ELIGIBLE`
- `REJECTED`
- `UNRESOLVED`
- `SELECTED_FOR_SHADOW_PROPOSAL`

### 6.3 Composition candidate object (key order)

When present, each `proposedCompositionCandidates[]` entry uses this key order:

1. `compositionId`
2. `medicineIds` (sorted ascending by medicine ID string; duplicates forbidden)
3. `evidenceIds`
4. `relationshipEdgeIds` (only approved/active; empty allowed if composition does not depend on edges)
5. `targetOrSystemReasons`
6. `rejectionOrBlockerInfo`
7. `rule9ValidationRequired` — must be `true`

### 6.4 Omission / sentinel policy

| Situation | Representation |
|-----------|----------------|
| Capability not in Rule 6 scope | **Omit** from output (do not invent fields for potency, dosage, electricity, tablet, external, monitoring, emergency directive, production Rx) |
| Gate says rule does not apply | `status` = `NOT_APPLICABLE` |
| Mandatory evidence missing | `status` = `NOT_EVALUABLE` |
| Evaluated but none eligible | `status` = `EVALUATED_NO_ELIGIBLE_CANDIDATE` |
| Tie unresolved by evidence | `status` = `UNRESOLVED_EVIDENCE` (no arbitrary winner) |

### 6.5 Sorting and ties

- Candidate lists sort by medicine ID ascending unless a later owner-approved rank field is present; if ranks equal and evidence does not resolve, emit `UNRESOLVED_EVIDENCE` — **do not** invent a clinical tie-breaker.
- Duplicate medicine IDs in a composition → invalid composition (must not emit); fail closed to non-success clinical outcome or `INTERNAL_FAILURE` if emitted by bug.

### 6.6 Forbidden output content

Final production prescription; final mixture-count **approval**; potency; dosage; electricity; tablet A/B; external applications; monitoring plan; emergency treatment directive; protected-source content; OPV / catalog / runtime effects; PHI.

---

## 7. Clinical outcome vocabulary (closed)

Mechanical count: **6**

| Token | Meaning |
|-------|---------|
| `NOT_APPLICABLE` | Rule 6 gate: evaluation not applicable |
| `NOT_EVALUABLE` | Mandatory evidence / upstream refs insufficient |
| `EVALUATED_NO_ELIGIBLE_CANDIDATE` | Full evaluation completed; zero eligible |
| `SHADOW_CANDIDATES_PROPOSED` | One or more shadow candidates / compositions proposed |
| `BLOCKED_BY_SAFETY` | Safety exclusion blocked evaluation / selection |
| `UNRESOLVED_EVIDENCE` | Tie or contradictory / incomplete evidence without speculative resolve |

**`PASS` is not a Rule 6 clinical outcome** and must not mean clinical correctness.

### 7.1 Outcome precedence (highest first)

1. Implementation / configuration failure (§8) — emitted as **error class**, not clinical `status`
2. `NOT_APPLICABLE`
3. `BLOCKED_BY_SAFETY`
4. `NOT_EVALUABLE`
5. `UNRESOLVED_EVIDENCE`
6. `EVALUATED_NO_ELIGIBLE_CANDIDATE`
7. `SHADOW_CANDIDATES_PROPOSED`

---

## 8. Implementation / configuration error classes (closed)

Mechanical count: **5**

| Token | Meaning |
|-------|---------|
| `INVALID_INPUT` | Schema / type / unknown-key / malformed input |
| `INVALID_EVIDENCE_REGISTRY` | Registry document invalid for evaluation |
| `UNSUPPORTED_CONTRACT_VERSION` | Unsupported input or output contract version |
| `CONTRADICTORY_UPSTREAM_STATE` | Upstream envelopes contradict fixed gate rules |
| `INTERNAL_FAILURE` | Unexpected evaluator fault |

Errors use **code-only** fixed messages suitable for logs (no PHI, no protected paths, no medicine content dumps). Clinical outcomes and implementation errors remain separate.

---

## 9. Medicine-relationship evidence schema (schema only)

No medicine relationships are added by this document.

### 9.1 Required edge fields (key order)

1. `edgeId`
2. `sourceMedicineId`
3. `targetMedicineIdOrSet`
4. `directionality` — `DIRECTED` | `UNDIRECTED`
5. `relationshipType`
6. `applicabilityConditions`
7. `prohibitionConditions`
8. `evidenceSourceId`
9. `evidenceValidationStatus`
10. `ownerClinicalApprovalStatus`
11. `version`
12. `effectiveStatus`
13. `supersessionMetadata`

### 9.2 Activation rule

Only an edge with **explicitly approved and active** effective status may influence evaluation.

### 9.3 Non-activating / rejected states

`draft` · `inventory-only` · `unvalidated` · `disputed` · `stale` · `superseded` · `missing evidence` · `owner-unapproved`

**No edge may be inferred** from co-occurrence in legacy formulas.

---

## 10. Full medicine-pool boundary

Rule 6 evaluates the **complete** permitted candidate medicine pool supplied in `candidateMedicinePool`.

Rule 6 **must not** restrict consideration only to:

- medicines already selected by another formula
- fixed disease lists
- hardcoded favorite medicines
- legacy mixture templates
- tablet / external selections
- static one-to-one disease mappings

Rule 6 **must not** activate medicines lacking approved evidence. Distinctions in §6.2 remain mandatory.

---

## 11. Formula composition boundary

Rule 6 may propose **zero or more** evidence-supported composition candidates.

It **must not**:

- approve the final prescription
- choose final 3 / 4 / 5 count
- bypass §F / Rule 9
- duplicate medicines
- include an unresolved edge
- force a composition when evidence is insufficient
- copy a legacy formula
- use a fixed formula template

Every proposed composition must include medicine IDs, evidence / relationship IDs, target / system reasons, rejection / blocker information, and `rule9ValidationRequired: true`.

---

## 12. Clinical-safety and fail-closed rules

1. Safety exclusions **precede** positive ranking.
2. A contraindicated candidate **cannot** be restored by score.
3. Missing evidence is **not** neutral approval.
4. Contradictory evidence **cannot** be averaged into approval.
5. Incomplete relationship sets **cannot** yield a confident composition.
6. Upstream `NOT_EVALUABLE` propagates per §7.1.
7. Emergency status **cannot** independently select medicine.
8. Shadow output **never** clinically activates medicine / potency / dosage recommendations.
9. No “100% correct” or clinical-outcome claim is authorized by this contract.

**Future validated clinical evidence required before:** activating any medicine-relationship edge; scoring weights / thresholds; disease-specific composition recipes; any move from shadow to orchestration.

---

## 13. Implementation plan (historical contract-doc note; superseded by PR #84 for package creation)

Suggested package: `packages/rule6/` — **now present on canonical main** (see post-merge evidence). The subsections below retain the original proof-matrix wording from the contract-documentation tranche.

### 13.1 Package paths (now implemented under separate auth; recorded post-merge)

- `packages/rule6/package.json`
- `packages/rule6/tsconfig.json`
- `packages/rule6/src/**/*.ts`
- `packages/rule6/tests/**/*.test.ts`

Mechanical root registration (typecheck / Vitest / lockfile) was limited to PR #84 allowlist. Do **not** connect orchestration or production without explicit extension.

### 13.2 Mandatory proof matrix

Mechanical count: **20**

| # | Proof category |
|---|----------------|
| P01 | Strict schema validation |
| P02 | Deterministic canonical copy |
| P03 | Full candidate-pool consideration |
| P04 | Approved edge activation |
| P05 | Unvalidated edge rejection |
| P06 | Missing evidence → `NOT_EVALUABLE` |
| P07 | Contradictory evidence fail-closed |
| P08 | Safety exclusion precedence |
| P09 | No fixed medicine / formula |
| P10 | No duplicate medicine |
| P11 | Deterministic tie / unresolved behavior |
| P12 | Rule 9 mixture-count ownership respected |
| P13 | Potency / dosage / electricity / tablet / external / monitoring exclusions |
| P14 | Input non-mutation |
| P15 | Deep-freeze output |
| P16 | Exact key order |
| P17 | Code-only errors |
| P18 | No PHI leakage |
| P19 | No legacy / runtime connection |
| P20 | Outcome / error vocabulary closed-set enforcement |

Do **not** treat the proof matrix above as unexecuted: post-merge evidence records P01–P20 + 24 additional regressions on main (PR #84).

---

## 14. STOP boundaries

Under this contract:

- Do **not** connect orchestration / runtime or activate clinical selection
- Do **not** alter production prescription
- Do **not** resume Rule 5 C3E or depend on protected sources / hashes / manifests
- Do **not** change Smart App Control
- Do **not** modify the legacy repository
- Do **not** invent thresholds, weights, medicine edges, or formula recipes
- Do **not** use paid APIs / services / certificates

**Historical (contract-documentation tranche only):** the prior STOP lines “Do not implement Rule 6 code or create `packages/rule6`” applied before PR #84. Shadow evaluator implementation is now recorded in [rule-06-multi-disease-organ-system-triad-implementation-evidence.md](./rule-06-multi-disease-organ-system-triad-implementation-evidence.md).

**Separate authorizations required:** validated relationship data; independent clinical review; orchestration connection; production activation.
