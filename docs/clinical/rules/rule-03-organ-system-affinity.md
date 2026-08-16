# Rule 3 — Organ-System Affinity Engine (Owner-Approved Specification)

**Status:** OWNER-APPROVED · **EHAS2 identity/scope:** OWNER_LOCKED (`ORGAN_SYSTEM_AFFINITY`) · **EHAS2 canonical contract:** DOCUMENTED ([rule-03-organ-system-affinity-contract.md](./rule-03-organ-system-affinity-contract.md); `R3_ID01_TO_ID05_RECOMMENDED_DECISIONS_APPROVED`) · **EHAS2 synthetic shadow evaluator:** **IMPLEMENTED** (`@ehas2/rule3` / `evaluateRule3Shadow`; PR #104; `RULE3_SHADOW_EVALUATOR_IMPLEMENTED`) · technical `READY_FOR_VALIDATION` · `affectsClinicalSelection: false` · mappings **0** · catalog **NOT_CREATED** · no closed real organ-system catalog · medicine influence **NONE** · formula mutation **NONE** · orch **NOT_CONNECTED** · activation/Rx **NONE** · clinical/runtime integration **NOT_AUTHORIZED** · **Legacy:** LIVE_AND_AUTHORITATIVE_BUT_CONFLICTED (forensic reference only). Post-merge evidence: [rule-03-organ-system-affinity-implementation-evidence.md](./rule-03-organ-system-affinity-implementation-evidence.md).

**Current-facing contract pointer (does not rewrite frozen body below):** [rule-03-organ-system-affinity-contract.md](./rule-03-organ-system-affinity-contract.md)

**Rule number:** 3
**Canonical name:** Organ-System Affinity Engine
**Machine identity:** `ORGAN_SYSTEM_AFFINITY`
**UI name:** Rule 3 — Active Organ Systems
**Historical interface alias:** Organ / System Affinity (non-authoritative)
**Clinical authority:** OWNER-APPROVED specification (this document)
**Organ-System Triad:** separate clinical/marketing concept — **rule number AUDIT_PENDING** (not Rule 3)

---

## Parallel processing with Rule 1 (OWNER-APPROVED)

From normalized patient evidence:

```
Normalized Patient Evidence
  → Rule 1 Temperament Engine
  → Rule 3 Organ-System Affinity Engine
```

- Rule 1 is **Temperament Single Source of Truth**.
- Rule 3 is **Organ/System Single Source of Truth**.
- Rule 1 and Rule 3 **must not mutate** each other’s frozen results.
- Legacy order (systems before prakriti in MDE) is **not** the EHAS2 orchestration model — **rejected** for production.

---

## Scope

Rule 3 detects and documents **which organ systems are clinically active** from structured evidence. It **may supply evidence** to disease candidates, disease formula planning, oral planning, Tablet A/B scoring, external application targeting, and summary display.

Rule 3 **must not** directly select: medicine, potency, electricity, dosage, or final prescription.

**Frontend clinical inference prohibited** — UI displays engine output only.

---

## Structured inputs (IMPLEMENTATION-PENDING wiring)

| Input | Role |
|-------|------|
| `chief_complaint` | Primary anchor (see priority policy) |
| `reported_symptoms` | Supporting evidence |
| `affected_sites` | Supporting / anatomical evidence |
| `doctor_diagnosis` | Structured clinician context |
| `gender` / `anatomy_context` | Safety and anatomy gates |
| `verified_report_findings` | Per-finding, isolated (not concatenated into global symptom blob) |
| `verified_local_image_findings` | Local site/system support only |
| `disease-dataset evidence` | Hybrid / registry lookups with provenance |

**Prohibited:** concatenating report or photo text into a global symptom blob for Rule 3.

Each evidence item carries: **source**, **target organ/system**, **verification status**, **confidence**, **provenance**.

---

## Detection output (contract target)

Rule 3 output must support:

| Field | Purpose |
|-------|---------|
| `active_systems` | Confirmed systems only (may be empty when UNRESOLVED) |
| `candidate_systems` | Including co-involvement candidates not yet confirmed |
| `primary_system` | Single primary when resolved |
| `secondary_systems` | Ordered list with explicit roles |
| `system_role` | PRIMARY / SECONDARY / CANDIDATE / CO_INVOLVEMENT_CANDIDATE |
| `score` | Internal ranking score per hit |
| `confidence` | Nullable; required semantics when confirmed |
| `evidence_sources` | Structured list (never dropped by wrapper) |
| `matched_disease_ids` | When dataset match |
| `detection_method` | e.g. anchor, keyword, hybrid, chief_complaint, co_involvement_candidate |
| `verification_status` | VERIFIED / UNVERIFIED / LOW_CONFIDENCE_CANDIDATE |
| `unresolved_reason` | When status UNRESOLVED |
| `deterministic_fingerprint` | Same inputs + versions → same fingerprint |
| `doctor_review_required` | Boolean gate |

**Dictionary-order system selection is prohibited.**

---

## Chief complaint priority (OWNER-APPROVED)

- Chief complaint = **primary anchor**.
- Verified disease/report finding = **strong evidence**.
- Symptoms / body site = **supporting evidence**.
- Red flag = **safety priority** (does not bypass evidence model).

Chief complaint must **not**:

- invent an unrelated system;
- remove verified serious evidence;
- blindly override all other case evidence.

---

## UNRESOLVED policy (OWNER-APPROVED)

When organ/system evidence is insufficient:

| Field | Value |
|-------|-------|
| `active_systems` | `[]` |
| `status` | `UNRESOLVED` |
| `reason` | `INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE` |
| `doctor_review_required` | `true` |
| `prescription_issue_allowed` | `false` |

**Automatic METABOLIC fallback prohibited.**

No unsupported mixture, external route, or formula may be issued solely because systems were empty.

---

## Report and photo isolation (OWNER-APPROVED)

- Verified report finding affects **only** the related system (e.g. renal → RENAL, liver → HEPATIC, cardiac → CARDIAC).
- **Cross-system leakage prohibited.**
- Ordinary patient photo **must not** determine organ system.
- Supported verified local image may give **supporting** evidence for that local site/system only.
- **Global photo override prohibited.**

---

## Co-involvement and keyword fallback (OWNER-APPROVED)

**Co-involvement:**

- Candidate only until independent evidence confirms.
- Must expose source, score, and confidence.
- Must not silently promote to `active_systems`.

**Keyword fallback:**

- Tagged `LOW_CONFIDENCE_CANDIDATE`.
- Not silent confirmed authority.
- `doctor_review_required` where unresolved or low confidence.

---

## Determinism (OWNER-APPROVED)

Future implementation must prove:

```
same structured input + same dataset versions + same rule version
  ⇒ same active_systems / fingerprint
```

ML/vector nondeterminism, global state leakage, and cross-case contamination are **prohibited** (implementation must document mitigation or avoid nondeterministic paths in SoT).

---

## Legacy reference (do not implement verbatim)

| Legacy | Path | EHAS2 |
|--------|------|-------|
| Live detector | `integrated_engine.detect_systems` | Replace with owner spec |
| Wrapper | `clinical_engines.detect_active_systems` | Rejected (drops details) |
| MDE caller | `multi_disease_engine._analyze_once` | Order + fallback rejected |

Full rejected behaviors: [rule-03-legacy-conflicts.md](./rule-03-legacy-conflicts.md).

---

## Related documents

- [rule-03-owner-decisions.md](./rule-03-owner-decisions.md)
- [rule-03-data-contract.md](./rule-03-data-contract.md)
- [rule-03-test-requirements.md](./rule-03-test-requirements.md)
