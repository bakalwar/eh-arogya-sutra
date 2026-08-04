# Phase 5R-4 Rule 4 Phase 10 — doctor review, final approval & Q18 issuance (planning closeout)

**Worktree:** `C:\Users\zero error\AppData\Local\Temp\ehas2_rule4_planning_phase10_wt`
**Branch:** `phase-5r/rule4-implementation-phase10`
**Baseline commit:** `182e0d85cd8be4cb96fad3dc6c4bf6a085b7b712`
**Mode:** Planning documentation only — **no implementation in this pass**

## Exact file modified (this pass)

| Action | Path |
|--------|------|
| **Created** | `docs/phase-reports/PHASE_5R_4_RULE4_PHASE10_PLANNING_CLOSEOUT.md` |

**Not modified:** `docs/clinical/rules/*` (frozen Rule 4 clinical bodies unchanged)
**Not created:** application code, fixtures, tests, registry JSON, migrations, commits, pushes, merges, deploys

---

## Owner decisions register (1–13)

### 1. Approval authority

| Rule | Decision |
|------|----------|
| **Who may clinically approve** | **Authorized treating Doctor only** |
| **Requirements** | Doctor role · active clinic/organization membership · exact consultation assignment/binding · same tenant · current authenticated session · reviewed draft fingerprint match |
| **ClinicAdmin** | **Must not** clinically approve, modify, or issue prescriptions — administrative access/workflow only |
| **Professional registration** | **Required for production issuance** (verified registration) |
| **Phase 10 shadow** | If registration verification unavailable → record **`PROFESSIONAL_REGISTRATION_VERIFICATION_NOT_CONNECTED`** — **production activation blocker**, **not** a shadow-contract blocker |

**Frozen alignment:** **Q18-R** (doctor role) · **Q18-C/J** (approval + gates) · **5R-DRG** — extended by owner policy above (ClinicAdmin exclusion explicit).

### 2. Doctor actions

**Approved actions (canonical):** `APPROVE` · `MODIFY` · `EXCLUDE_UNRESOLVED_SLOT` · `REJECT` · `REQUEST_REASSESSMENT`

| Doctor action | Persistence / flow mapping |
|---------------|----------------------------|
| **APPROVE** | → **`ACCEPTED`** (pre-issue; shadow eligibility evaluation follows gates) |
| **MODIFY** | → **`MODIFIED`** + **`REVALIDATION_REQUIRED`** (`engine_revalidation_status = REQUIRED_PENDING`) |
| **EXCLUDE_UNRESOLVED_SLOT** | → new **slot manifest** + **full revalidation** of remaining prescription |
| **REJECT** | → **`REJECTED`** (terminal for that draft version) |
| **REQUEST_REASSESSMENT** | → **`NEEDS_CLARIFICATION`** / **new analysis version required** (no issuance on stale draft) |

**Prohibited:** mid-run doctor potency/medicine/formula branch selection (**5R-SDG** · **Q18-D**).

### 3. Modification authority

Doctor may **propose** structured modifications to: medicine/formula · cascade · dilution · dose · frequency · duration · clinical instructions.

| Rule | Decision |
|------|----------|
| Direct-to-final clinical change | **Forbidden** |
| Each modification | New **immutable draft version** · structured reason/justification · **full Rule 2–4 revalidation** · re-check safety, evidence, polarity, phase, severity, eligibility, numeric selection, pediatric overlay · **fresh doctor approval** after pass |
| Limited revalidation in Phase 10 | **None** — full chain always |
| Free-text-only clinical override | **Not allowed** |
| Formatting/spelling on clinical-facing fields | Treated through **full integrity/revalidation workflow** in Phase 10 (no ambiguity shortcut) |

**Frozen alignment:** **Q18-D/H/P** — owner tightens to **always full** revalidation for Phase 10.

### 4. Non-overridable blocks

Doctor **cannot** override ( **no exceptions** ):

- **Q06C** crisis
- **D13-HS**
- Patient-wide hold
- Pediatric **PROHIBIT**
- Invalid/unresolved age
- Invalid/stale evidence
- Formula isolation failure
- Registry quarantine
- Stale fingerprint
- Failed revalidation
- Unauthorized tenant/role
- Phase 8/9 authentication failure

**Frozen alignment:** **Q18-E** Option D · **Q18-I** · Phase 9 overlay outcomes.

### 5. Partial-slot behavior

| Rule | Decision |
|------|----------|
| Mixed prescription (resolved + unresolved/blocked slot) | **Cannot issue directly** — whole prescription issuance **blocked** |
| Remediation | Doctor may **`EXCLUDE_UNRESOLVED_SLOT`** → new slot manifest/fingerprint → **full revalidation** of remainder → **fresh approval** |
| Patient-wide hold or **D13-HS** | Slot exclusion **does not** unlock issuance — case remains blocked |

**Frozen alignment:** **Q18-F/G** — owner clarifies **no direct partial issue** without exclude + revalidate + re-approve.

### 6. Phase 10 deliverable (shadow/internal only)

Phase 10 implements **contracts and shadow evaluation only**:

- Doctor review decision validation
- Modification envelope validation
- Revalidation status
- **Q18 issuance gate ledger**
- **`ISSUANCE_ELIGIBLE`** or **`BLOCKED`** decision
- Immutable **audit-event payloads/fingerprints** (synthetic)

**Explicitly out of scope for Phase 10:**

- Real **`ISSUED`** prescription record
- DB persistence wiring
- API/UI activation
- Patient visibility
- Print / share / message
- Dispensing
- External actions

### 7. Issuance separation

Distinct states (must not conflate):

1. Doctor approval **recorded**
2. Modification **revalidated**
3. **Issuance eligible** (shadow)
4. Prescription **issued** (future)
5. Patient **received** (future)

Phase 10 shadow evaluates **(1–3)** only. **`ISSUED`** and immutable production prescription creation require **separate owner approval** after Phase 10.

### 8. Patient visibility

- **No** patient-visible prescription in Phase 10
- **No** doctor-visible final **production** prescription activation
- **Public `Rule4Result` unchanged** (null public cascade/dilution on shadow paths)

### 9. Electronic signature

- **No** cryptographic/electronic signature in Phase 10
- Shadow approval **identity binding:** `doctor_id` · clinic/tenant_id · `consultation_id` · authenticated role · timestamp · draft/version fingerprints · structured action · justification · **review decision fingerprint**
- Production e-signature policy → **future legal/security phase** — **no signing keys or secrets** in Phase 10

### 10. Revoke/amend

- Phase 10: **N/A** (no actual issuance)
- Future: **no silent mutation** of issued records; amendment/revocation → new immutable version/event · original preserved · **separate owner/legal approval**

### 11. Retention/audit

- Phase 10: **immutable synthetic audit-event contract** (IDs · versions · hashes · reason codes · actor/tenant · timestamp — **minimal PHI**)
- **Statutory retention duration:** **`OWNER_DECISION_PENDING`** — **production activation blocker**, **not** shadow-contract blocker

### 12. Concurrency / idempotency (planning + Phase 10 tests)

| Mechanism | Policy |
|-----------|--------|
| Optimistic version check | Required on approve |
| Compare-and-swap transition | Valid transition only |
| Idempotency key | Required |
| Same key + same payload | Same result (replay-safe) |
| Same key + different payload | **Blocked** |
| Approvals | One winning approval per **exact draft version** |
| New analysis version | **Supersedes** prior approval |
| Slot add/remove | **Invalidates** prior approval |
| Global mutable “last approval” | **Forbidden** |

Phase 10 **tests simulate** concurrency; **no DB wiring** in Phase 10.

### 13. Runtime boundary (Phase 10 invariants)

| Field / behavior | Value |
|------------------|--------|
| `execution_status` | **`NOT_IMPLEMENTED`** |
| `automatic_issuance_runtime` | **`false`** |
| `prescription_issue_allowed` | **`false`** |
| `final_doctor_approval_required` | **`true`** |
| Production review/issuance | **Not connected** |
| Shadow output | May emit **`ISSUANCE_ELIGIBLE`** — **must not** perform prescription issue |

---

## Existing Phase 3 state-machine reuse map

**Source:** `packages/database/src/reviewTransitions.ts` · `PgPrescriptionRepository` · `consultationService` (patterns only — **not wired in Phase 10**).

| Phase 3 `ReviewState` | Phase 10 doctor action / note |
|----------------------|-------------------------------|
| `GENERATED_PENDING_REVIEW` | Draft ready — maps to **READY_FOR_DOCTOR_REVIEW** (issuance layer) |
| `NEEDS_CLARIFICATION` | **`REQUEST_REASSESSMENT`** |
| `ACCEPTED` | **`APPROVE`** (after gates; pre-issue) |
| `MODIFIED` | **`MODIFY`** / post-exclude manifest |
| `REJECTED` | **`REJECT`** |
| `ISSUED` | **Deferred** — not Phase 10 |
| `SUPERSEDED` | New analysis version / slot manifest change / stale fingerprints |

**Issuance-layer statuses (Q18-O, planning):** `prescription_status` · `patient_resolution_status` · `engine_revalidation_status` · `prescription_issue_allowed` · `issuance_block_reason_codes[]` · `hold_reason_codes[]` — computed in **shadow**, not persisted in Phase 10.

---

## Final doctor-action → state mapping

```text
SYSTEM_SINGLE_PASS_COMPLETE (Rule 4 Ph 1–9 shadow chain)
  → GENERATED_PENDING_REVIEW / PROPOSED_PENDING_DOCTOR_REVIEW
  → DOCTOR_REVIEW
       APPROVE → ACCEPTED → (gate ledger) → ISSUANCE_ELIGIBLE | BLOCKED
       MODIFY → MODIFIED → REVALIDATION_REQUIRED → full re-run → fresh APPROVE
       EXCLUDE_UNRESOLVED_SLOT → new slot manifest → full revalidation → fresh APPROVE
       REJECT → REJECTED
       REQUEST_REASSESSMENT → NEEDS_CLARIFICATION → new analysis version (supersedes)
  → (Phase 10 stops before ISSUED)
```

---

## Mandatory Q18 issuance gate table (Phase 10 shadow ledger)

| Gate ID | Source | Required input | PASS | FAIL | Missing input | Doctor override | Scope |
|---------|--------|----------------|------|------|---------------|-----------------|-------|
| TREATING_DOCTOR_AUTH | Owner §1 | Doctor role + consultation bind + tenant session | Authorized | Wrong role/tenant | **FAIL** | **No** | Case |
| PROFESSIONAL_REG (prod only) | Owner §1 | Verified registration | Verified | Not connected / invalid | Shadow: **NOT_CONNECTED** code; prod: **FAIL** | **No** | Case |
| DRAFT_FP_MATCH | Owner §1 · Ph 8/9 | Reviewed draft fingerprint bundle | Match | Mismatch | **FAIL** | **No** | Case |
| FINAL_DOCTOR_APPROVAL | Q18-C/R | Recorded APPROVE on current version | Present | Missing | **FAIL** | **No** | Case |
| GATE_REVALIDATION | Q18-H · Owner §3 | After MODIFY/EXCLUDE | `PASSED` | `FAILED`/pending | **FAIL** | **No** | Case |
| Q18-E_HOLDS | Q18-E | Hold flags | None active | Any hard hold | **FAIL** | **No** | Case |
| Q06C_CRISIS | Q18-E | Crisis state | Cleared per policy | Active | **FAIL** | **No** | Case |
| D13_HS | Q18-E | Age | Not HS-blocked | HS active | **FAIL** | **No** | Case |
| Q15_PATIENT_HOLD | Q18-E | Patient-wide hold | Clear | Hold | **FAIL** | **No** | Case |
| PEDIATRIC_PROHIBIT | Ph 9 · Owner §4 | Overlay slot | Not PROHIBIT block | PROHIBIT | **FAIL** | **No** | Slot |
| PHASE8_9_AUTH | Ph 8/9 | Selection + overlay auth | Pass | Auth fail | **FAIL** | **No** | Slot |
| RULE3_ISSUE | Q18-J | Rule 3 flag | Allowed | Blocked | **FAIL** | **No** | Case |
| STRICT_FINAL_LINES | Q18-G · Owner §5 | All included slots | No UNRESOLVED medicated lines | Violation | **FAIL** | Exclude path only | Case |
| D13_RESTRICT_D13D | Q18-I | RESTRICT slots | D13-D + gates | Missing | **FAIL** | **No** | Slot |
| EVIDENCE_FP_CURRENT | Q18-J/Q16 | Evidence pool FP | Current | Stale | **FAIL** | **No** | Case |
| SUMMARY_FP_CURRENT | Planning | Complete summary FP | Match | Stale | **FAIL** | **No** | Case |
| FORMULA_ISOLATION | Q7–Q17 | Per-slot | Pass | Fail | **FAIL** | **No** | Slot |
| REGISTRY_RULESET | Q18-N/T | Versions | Compatible | Quarantine/mismatch | **FAIL** | **No** | Case |
| LEGACY_QUARANTINE | Q18-L | Authority path | Rule 4 shadow only | Legacy/MDE | **FAIL** | **No** | Case |

**Policy:** missing mandatory gate → **never default PASS**.

---

## Modification / revalidation policy (owner §3)

1. Modification envelope captures structured deltas + justification + target draft version + slot manifest.
2. Engine runs **full Rule 2–4** chain (including pediatric overlay where applicable).
3. `engine_revalidation_status`: `REQUIRED_PENDING` → `PASSED` | `FAILED`.
4. On `PASSED`, prior approval **invalid** until new **`APPROVE`** on new draft version.
5. On `FAILED`, **`ISSUANCE_BLOCKED`** with revalidation reason codes.

---

## Partial-slot exclusion workflow (owner §5)

```text
PARTIALLY_RESOLVED draft (≥1 UNRESOLVED/blocked slot)
  → issuance BLOCKED (whole Rx)
  → optional: EXCLUDE_UNRESOLVED_SLOT
       → new slot_manifest + manifest_fingerprint
       → full revalidation (remaining slots)
       → if case-level D13-HS or patient-wide hold → still BLOCKED
       → else if revalidation PASSED → fresh APPROVE → gate ledger → ELIGIBLE | BLOCKED
```

---

## Concurrency / idempotency policy (owner §12)

- **Approve:** `(consultation_id, draft_version, idempotency_key, payload_hash)` → at-most-once semantic winner.
- **Supersede:** any change to upstream analysis fingerprint bundle or slot manifest → **`APPROVAL_SUPERSEDED`** audit event (synthetic).
- **Tests:** duplicate approve, conflicting idempotency payload, concurrent modify+approve, stale version — **simulated in fixtures**, no DB.

---

## Shadow / runtime boundary summary

| Layer | Phase 10 |
|-------|----------|
| Rule 4 Ph 1–9 shadow adapters | Unchanged — draft only |
| Phase 10 shadow module | Review validation + gate ledger + eligibility |
| Public API / UI | **Not connected** |
| `prescription_issue_allowed` (production) | **`false`** |
| `ISSUED` | **Not emitted** |

---

## Production blockers (post–Phase 10 implementation)

| Blocker | Notes |
|---------|--------|
| **`PROFESSIONAL_REGISTRATION_VERIFICATION_NOT_CONNECTED`** | Until verification wired |
| **Statutory retention duration** | **`OWNER_DECISION_PENDING`** |
| **Separate owner approval** | Persistence · API · UI · real **`ISSUED`** · patient visibility · e-signature |
| **Q18-T** | Production issuance runtime remains **`NOT_IMPLEMENTED`** until explicit gate |

Shadow Phase 10 may proceed when **implementation approval** is granted.

---

## Proposed contract and registry names (implementation phase — not created here)

| Artifact | Name |
|----------|------|
| Contract version | `ehas2-rule4-contract-v1-phase10-doctor-review-issuance` |
| Registry scope | `PHASE10_DOCTOR_REVIEW_ISSUANCE_SUBSET` |
| Registry metadata | `complete = false` · `unknownCodePolicy = REJECT_UNKNOWN_CODE` · `clinicalRegistryStatus = REVIEW_AND_ISSUANCE_DECISION_NOT_PRODUCTION_ACTIVE` |

**Proposed types (TS/Python parity):**
`Rule4DoctorReviewInput` · `Rule4DoctorReviewDecision` · `Rule4ModificationEnvelope` · `Rule4ModificationRevalidationResult` · `Rule4IssuanceGateLedger` · `Rule4IssuanceDecision` · `Rule4ReviewAuditEvent`

**Planned fixture (future):** `fixtures/rule4/doctor-review-issuance-scenarios.v1.json` — synthetic only · read-only tests · pinned SHA · fixed fingerprint refs.

---

## Minimum 60-scenario plan (synthetic matrix)

| # | Scenario | Expected shadow eligibility | Primary block / note |
|---|----------|---------------------------|----------------------|
| 1 | Approve unchanged adult draft | ELIGIBLE after gates | — |
| 2 | Approve unchanged pediatric overlay draft | ELIGIBLE after gates | D13-D if RESTRICT |
| 3 | ClinicAdmin approve attempt | BLOCKED | UNAUTHORIZED_REVIEWER |
| 4 | Wrong tenant doctor | BLOCKED | UNAUTHORIZED_REVIEWER |
| 5 | Wrong consultation binding | BLOCKED | CONSULTATION_BIND_MISMATCH |
| 6 | Draft FP mismatch | BLOCKED | DRAFT_FP_MISMATCH |
| 7 | Missing approval | BLOCKED | APPROVAL_MISSING |
| 8 | Under-one (D13-HS) approve | BLOCKED | D13_HS |
| 9 | Crisis active approve | BLOCKED | Q06C / PRESCRIPTION_HOLD |
| 10 | Patient-wide hold | BLOCKED | PATIENT_WIDE_HOLD |
| 11 | Phase 8 auth fail slot | BLOCKED | PHASE8_AUTH_FAILED |
| 12 | Phase 9 PROHIBIT slot | BLOCKED | PEDIATRIC_PROHIBIT |
| 13 | Partial unresolved — direct issue | BLOCKED | STRICT_FINAL / PARTIAL |
| 14 | Exclude unresolved then revalidate pass | ELIGIBLE after fresh APPROVE | Full chain |
| 15 | Exclude unresolved under D13-HS | BLOCKED | D13-HS (exclusion no unlock) |
| 16 | MODIFY dilution D3→D5 | BLOCKED until reval PASS | REVALIDATION_REQUIRED |
| 17 | MODIFY without justification | BLOCKED | JUSTIFICATION_MISSING |
| 18 | Revalidation FAIL | BLOCKED | REVALIDATION_FAILED |
| 19 | REJECT | BLOCKED (terminal) | REJECTED |
| 20 | REQUEST_REASSESSMENT | BLOCKED | NEEDS_CLARIFICATION |
| 21 | Evidence FP stale after approve | BLOCKED | EVIDENCE_FP_STALE |
| 22 | Summary FP stale | BLOCKED | SUMMARY_FP_STALE |
| 23 | Ruleset/registry drift | BLOCKED | REGISTRY_INCOMPATIBLE |
| 24 | Formula isolation fail | BLOCKED | FORMULA_ISOLATION |
| 25 | Registry quarantine | BLOCKED | REGISTRY_QUARANTINE |
| 26 | Legacy always-D* path | BLOCKED | LEGACY_QUARANTINE |
| 27 | Shadow reg not connected (prod sim) | BLOCKED | PROFESSIONAL_REGISTRATION_VERIFICATION_NOT_CONNECTED |
| 28 | Idempotency replay same payload | Same ELIGIBLE/BLOCKED | Idempotent |
| 29 | Idempotency key payload mismatch | BLOCKED | IDEMPOTENCY_PAYLOAD_MISMATCH |
| 30 | Double approve concurrent | One wins | VERSION_CONFLICT |
| 31 | Approve after new analysis version | BLOCKED | APPROVAL_SUPERSEDED |
| 32 | Slot added post-approval | BLOCKED | SLOT_MANIFEST_STALE |
| 33 | Slot removed post-approval | BLOCKED | SLOT_MANIFEST_STALE |
| 34 | MODIFY medicine/formula | BLOCKED until reval | Full Rule 2–4 |
| 35 | MODIFY dose/frequency | BLOCKED until reval | Full Rule 2–4 |
| 36 | MODIFY duration/instructions | BLOCKED until reval | Full Rule 2–4 |
| 37 | Spelling change clinical instruction | BLOCKED until reval | Owner §3 |
| 38 | Free-text-only override attempt | BLOCKED | STRUCTURED_MODIFICATION_REQUIRED |
| 39 | D13 RESTRICT missing D13-D | BLOCKED | PEDIATRIC_RESTRICT_JUSTIFICATION_MISSING |
| 40 | Rule 3 prescription_issue_allowed false | BLOCKED | RULE3_BLOCK |
| 41 | Q10 NEUTRAL slot — no medicated line | ELIGIBLE per slot rules | Q18-K |
| 42 | Successful gate ledger all PASS | ELIGIBLE | — |
| 43 | One gate FAIL in ledger | BLOCKED | Specific gate code |
| 44 | APPROVE + MODIFY same version race | BLOCKED | CAS failure |
| 45 | EXCLUDE then skip revalidation | BLOCKED | REVALIDATION_REQUIRED |
| 46 | EXCLUDE then skip fresh APPROVE | BLOCKED | APPROVAL_MISSING |
| 47 | Unauthorized role (Patient) | BLOCKED | UNAUTHORIZED_REVIEWER |
| 48 | Session missing | BLOCKED | SESSION_INVALID |
| 49 | Multi-slot all resolved approve | ELIGIBLE | — |
| 50 | Multi-slot one PHASE8 fail | BLOCKED | Slot-level |
| 51 | Audit event fingerprint stable | N/A | Golden FP test |
| 52 | Review decision FP changes on action change | N/A | FP parity |
| 53 | Production label adapter | BLOCKED | PRODUCTION_NOT_CONNECTED |
| 54 | Public Rule4Result after shadow review | null dilution | No leak |
| 55 | ISSUED state attempted in Phase 10 | BLOCKED | PHASE10_NO_ISSUED |
| 56 | DB persistence attempted | Out of scope | Not in Phase 10 |
| 57 | Patient visibility flag | Not set | Phase 10 |
| 58 | E-signature field present | Not required | Future |
| 59 | Revoke/amend call | N/A | Phase 10 |
| 60 | Hold + exclude slot | BLOCKED | Q18-E precedence |
| 61 | Successful ISSUANCE_ELIGIBLE shadow | ELIGIBLE | No issue side-effect |
| 62 | BLOCKED with full reason code list | BLOCKED | Audit payload |

---

## Confirmation

| Item | Status |
|------|--------|
| Owner decisions **1–13** recorded | **Yes** (this document) |
| Frozen clinical docs changed | **No** |
| Implementation code | **Not created** |
| Fixtures / tests / registry / migration | **Not created** |
| Commit / push / merge / deploy | **No** |

---

## Final verdict

**`PHASE_10_PLANNING_READY_FOR_IMPLEMENTATION`**

Unresolved items (**statutory retention duration**, **production e-signature**, **real ISSUED/persistence**) are **production activation blockers** or **later phases** — they **do not** block Phase 10 shadow contract implementation per owner §6–11.

**STOP — RULE 4 PHASE 10 OWNER DECISIONS RECORDED · WAIT FOR IMPLEMENTATION APPROVAL**
