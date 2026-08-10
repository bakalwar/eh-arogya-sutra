# Rule 5 — R5-M6B Track B evidence catalog contract specification (T1)

## 1. Identity and scope

| Field | Value |
|-------|--------|
| **Phase** | **R5-M6B Track B — T1** |
| **Classification** | **DOCUMENTATION_ONLY** |
| **Persistence base (canonical `main`)** | `f81af652a5dbe7cedac10279f9c6096c11e75c76` |
| **Companion inventory** | [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md) (R5-M6A) |
| **Track A (medicine documentation audits)** | **COMPLETE** — **38/38** ([master index](./rule-05-medicine-evidence-audit-index-R5-M6B.md)) |
| **Rule 5 runtime** | **NOT_IMPLEMENTED** / **NOT_CONNECTED** (M6A §1; `packages/clinical-contracts/src/nineRules.ts`) |
| **Evidence activated** | **NONE** |
| **Clinically validated medicines (program rollups)** | **0** |

This document is a **documentation contract specification only**. It does **not** create catalog rows, fixtures, schemas, validators, tests, runtime wiring, or clinical authority.

---

## 2. Layered Track B status

| Layer | Status | Notes |
|-------|--------|--------|
| Track B scoping audit (read-only) | **COMPLETE** | Governance analysis only; not implementation |
| **T1 documentation specification (this document)** | **DOCUMENTATION_SPEC_RECORDED** | On `main` after authorized T1 merge |
| **CA-1 empty structural contract (coherent artifact)** | **EMPTY_STRUCTURAL_CONTRACT_PRESENT** — runtime **NOT_IMPLEMENTED** / **NOT_CONNECTED** | Single coherent tranche fulfilling prior split T2/T3 **structural** intent only (see §2.1); **not** separate T2 then T3 PRs |
| T2 contract types + `RULE5_EVIDENCE_CATALOG_VERSION` (historical layer label) | **Fulfilled structurally by CA-1** — not a separately executed T2 tranche | Historical T1 design preserved |
| T3 empty fixture, validator, tests (historical layer label) | **Fulfilled structurally by CA-1** — not a separately executed T3 tranche | Empty JSON + validator + serializer + tests in CA-1 only |
| T4 populated evidence catalog | **BLOCKED** | CQ/provenance/clinical gates |
| T5 activation / runtime integration | **NOT_AUTHORIZED** and **BLOCKED** | §12 activation prerequisites; orchestration not connected |

Track B as a whole is **not** clinically authorized and **not** runtime-connected. **CA-1** is a **metadata-only empty structural module** — **zero catalog rows**, **zero ACTIVE rows**, **no clinical authority**.

### 2.1 CA-1 scope (authorized structural contract only)

**Authorization token:** `R5_TRACK_B_CA1_EMPTY_STRUCTURAL_CONTRACT_AUTHORIZED` (owner decision).

CA-1 on `main` after merge contains **only**: `RULE5_EVIDENCE_CATALOG_VERSION`, empty envelope TypeScript, physical empty JSON fixture, strict validator, serializer, unit tests, and Rule 5 barrel export. **Does not** implement Rule 5 clinical engine behavior.

- Prior split **T2/T3 execution** is **not** separately implemented; the **single coherent CA-1** tranche fulfills the **structural** intent of both historical layers.
- **Catalog row count** remains **0**; **CATALOG_ROW_ID_NAMESPACE** remains **OWNER_DECISION_REQUIRED** (TB-OD-02).
- **T4** remains **BLOCKED**; **T5** remains **NOT_AUTHORIZED** / **BLOCKED**.
- **No** populated rows, **no** evidence activation, **no** medicine data, **no** runtime integration.

---

## 3. Classification legend (repository-backed)

| Label | Meaning |
|-------|---------|
| **EXISTING_AUTHORIZED_LITERAL** | Closed vocabulary or policy literal already recorded in owner governance or M6A inventory |
| **EXISTING_PATTERN_FOR_REFERENCE_ONLY** | Observed in M3/M4/M5 artifacts; **not** automatically approved as Track B catalog schema fields |
| **PROPOSED_T1_CONTRACT_FIELD** | Named axis or envelope field proposed for **future** T2+ contract design only |
| **OWNER_DECISION_REQUIRED** | No authoritative repository decision yet |
| **FORBIDDEN** | Must not appear in T1 rows, T1 examples, or T1-implied authority |

---

## 4. Existing literals and proposed fields

| Name | Classification | Authoritative source (on `main`) |
|------|----------------|----------------------------------|
| **lifecycleState** | **EXISTING_AUTHORIZED_LITERAL** (allowed values) | OD-R5-M0-017; M6A §4: ACTIVE, EXPIRED, SUSPENDED, WITHDRAWN, SUPERSEDED, NOT_VERIFIED, MISSING |
| **sourcePresent** | **PROPOSED_T1_CONTRACT_FIELD** (axis name) | M6A §5 multi-axis table |
| **provenanceVerified** | **PROPOSED_T1_CONTRACT_FIELD** | M6A §5 |
| **licenseVerified** | **PROPOSED_T1_CONTRACT_FIELD** | M6A §5 |
| **schemaValidated** | **PROPOSED_T1_CONTRACT_FIELD** | M6A §5 |
| **clinicallyValidated** | **PROPOSED_T1_CONTRACT_FIELD** | M6A §5 |
| **ownerApproved** | **PROPOSED_T1_CONTRACT_FIELD** | M6A §5 |
| **activationApproved** | **PROPOSED_T1_CONTRACT_FIELD** | M6A §5 |
| **connected** | **EXISTING_PATTERN_FOR_REFERENCE_ONLY** | M5 monitoring-plan schema (`connected: false`); **not** T1 schema |
| **evidencePolicy** | **EXISTING_AUTHORIZED_LITERAL** | `EVIDENCE_AUDIT_REQUIRED_BEFORE_ACTIVATION` — M3 matrix / M5 fixture |
| **thresholdPolicy** | **EXISTING_AUTHORIZED_LITERAL** | `NO_THRESHOLD_AUTHORIZED` — M3 / EV-GATE-002 |
| **executable** | **EXISTING_PATTERN_FOR_REFERENCE_ONLY** | M3/M4/M5 `executable: false` patterns |
| **deterministicFingerprint** | **EXISTING_PATTERN_FOR_REFERENCE_ONLY** | M4/M5 `deterministicFingerprint: null` |
| **Catalog row ID** | **OWNER_DECISION_REQUIRED** | See §5 |

No executable contract or JSON schema is created in T1.

---

## 5. Catalog ID namespace

| Token | Value |
|-------|--------|
| **CATALOG_ROW_ID_NAMESPACE** | **OWNER_DECISION_REQUIRED** |
| **CATALOG_ROW_COUNT** | **0** |

- M6A §3 **EV-*** identifiers are **inventory evidence IDs**, not proven catalog row IDs.
- Do **not** reuse **EV-*** as catalog row IDs (owner decision **TB-OD-02** deferred).
- Do **not** invent **EV-CAT-*** or any other namespace in T1.
- Do **not** create `entries`, example rows, or sample clinical records.

---

## 6. Fail-closed invariants (documentation only)

These are **T1 documentation invariants**, not implemented schema defaults on `main`:

- **Zero catalog rows**; **zero ACTIVE rows**; **ACTIVE is never a default**.
- Missing provenance **blocks activation** (M6A §12).
- Missing safety evidence **blocks activation** (FG-003, CQ-007; M6A §12).
- Transcript or registry **presence does not** create owner verification.
- Catalog **presence does not** create clinical validation.
- Documented future-default posture for axes (when rows exist later): **activationApproved** false; **clinicallyValidated** false; **connected** false.
- **No clinical-selection effect**; **no `nineRules.ts` change**.
- **evidencePolicy** remains **`EVIDENCE_AUDIT_REQUIRED_BEFORE_ACTIVATION`**.
- **No threshold authority** (`NO_THRESHOLD_AUTHORIZED`).
- **No** route, potency, dosage, electricity, timing, monitoring, or treatment authority from this document.

---

## 7. FG dependencies (all remain OPEN)

| Finding | T1 posture |
|---------|------------|
| **FG-001** | **OPEN** — no catalog module on `main`; T1 spec does **not** close FG-001 |
| **FG-004** | **OPEN** — blocks populated materia/evidence rows |
| **FG-005** | **OPEN** — Rule 4 TH/DA excluded from Rule 5 |
| **FG-007** | **OPEN** — no lifecycle assigners; no ACTIVE catalog rows |
| **FG-009** | **OPEN** — blocks verified provenance/license flags on rows |

---

## 8. CQ dependencies (all unresolved)

CQ-001 through CQ-008 (M6A §14) remain **unresolved**. **No assumption permitted.** T1 resolves none. Populated rows, activation, and R5-M7 remain blocked as documented in M6A. This document records **no clinical answers**.

---

## 9. Rule 4 Limited Freeze boundary

- [rule-04-SAC-003-freeze-clarification.md](./rule-04-SAC-003-freeze-clarification.md): TH-01–TH-04 and DA-01–DA-07 remain **excluded** from Rule 5 clinical use without separate owner approval.
- **No** Rule 4 threshold or data-asset references in catalog design.
- **No** Rule 4 or Rule 5 clinical behavior changes from T1.

---

## 10. T2–T5 authorization barriers

| Tranche | Barrier |
|---------|---------|
| **T2** | **Separate explicit owner authorization** mandatory before contract types or `RULE5_EVIDENCE_CATALOG_VERSION` |
| **T3** | **Separate explicit owner authorization**; medicine-code references **forbidden** until later owner decision |
| **T4** | **BLOCKED** — requires CQ/provenance/clinical owner decisions |
| **T5** | **NOT_AUTHORIZED** — separate activation approval and M6A §12 gates |

- **No lifecycle assigners** (deferred; TB-OD-06).
- **T1 merge does not authorize** any later tranche.

---

## 11. Mandatory non-claims

This T1 document does **not** authorize or create:

- Documentation contract only — **not** implementation.
- **Zero catalog rows**; **zero ACTIVE rows**.
- **No** populated medicine records.
- **No** clinical facts approved.
- **No** owner-primary verification.
- **No** provenance or license verification.
- **No** Rule 4 TH/DA use.
- **No** route, potency, dosage, electricity, timing, threshold, safety, or monitoring authority.
- **No** clinical-selection effect.
- **No** `nineRules` change.
- **No** fixture, schema, validator, or test implementation.
- **No** FG or CQ closure.
- **No** T2/T3 authorization.
- **No** activation or runtime authorization.

---

## 12. STOP boundary

Stop before:

- Populated catalog rows or medicine references
- Catalog row-ID namespace decision (TB-OD-02) and row/item types
- FG/CQ closure
- Rule engine comparison implementation
- Runtime connection or R5-M7
- T4 populated catalog or T5 activation

---

## Document footer (mandatory)

| Item | Value |
|------|--------|
| **Catalog rows** | **0** |
| **CATALOG_ROW_ID_NAMESPACE** | **OWNER_DECISION_REQUIRED** |
| **CA-1 structural contract** | **EMPTY_STRUCTURAL_CONTRACT_PRESENT** (after CA-1 merge) — runtime **NOT_IMPLEMENTED** / **NOT_CONNECTED** |
| **FG-001** | **OPEN** |
| **Evidence activated** | **NONE** |
| **Rule 5 implemented** | **NO** |
| **T4/T5 authorized** | **NO** |

**Authority tag:** DOCUMENTATION_ONLY_TRACK_B_T1_SPEC · **Clinical validation claim:** NONE
