# Rule 3 — Owner Decisions (Phase 5R-3F Freeze)

**Authority:** OWNER-APPROVED
**EHAS2 code:** NOT_IMPLEMENTED
**Forensic basis:** Phase 5R-3 (`%TEMP%\ehas2_rule3_forensic_audit\`)

---

## Identity

| Item | Decision | Tag |
|------|----------|-----|
| Rule number | 3 | OWNER-APPROVED |
| Canonical name | Organ-System Affinity Engine | OWNER-APPROVED |
| UI name | Rule 3 — Active Organ Systems | OWNER-APPROVED |
| Implementation | NOT_IMPLEMENTED | IMPLEMENTATION-PENDING |
| Legacy status | LIVE_AND_AUTHORITATIVE_BUT_CONFLICTED | LEGACY-PROVEN |
| Clinical authority | OWNER-APPROVED specification | OWNER-APPROVED |
| Organ-System Triad rule number | AUDIT_PENDING (not Rule 3) | OWNER-APPROVED |

---

## Q1 — Orchestration order vs Rule 1

| Decision | Value | Tag |
|----------|-------|-----|
| Model | Parallel independent processing from normalized evidence | OWNER-APPROVED |
| Sequence | Rule 1 Temperament Engine then Rule 3 Organ-System Affinity Engine (both consume normalized evidence; no mutating cross-write) | OWNER-APPROVED |
| Legacy MDE order (Rule 3 before Rule 1) | **Rejected** for EHAS2 | OWNER-APPROVED |
| Rule 1 SoT | Temperament | OWNER-APPROVED |
| Rule 3 SoT | Organ/system | OWNER-APPROVED |
| Cross-mutation | **Prohibited** | OWNER-APPROVED |

---

## Q2 — UNRESOLVED vs METABOLIC fallback

| Decision | Value | Tag |
|----------|-------|-----|
| Empty / insufficient evidence | `active_systems = []`, `status = UNRESOLVED` | OWNER-APPROVED |
| Reason code | `INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE` | OWNER-APPROVED |
| `doctor_review_required` | true | OWNER-APPROVED |
| `prescription_issue_allowed` | false | OWNER-APPROVED |
| Automatic METABOLIC fallback | **Prohibited** | OWNER-APPROVED |
| Unsupported mixture/external when UNRESOLVED | **Prohibited** | OWNER-APPROVED |

---

## Q3 — report_analyzer gender/BP bug

| Decision | Value | Tag |
|----------|-------|-----|
| BP passed as gender (`report_analyzer`) | **Rejected** — do not migrate path | OWNER-APPROVED |
| EHAS2 parity with bug | **Prohibited** | OWNER-APPROVED |

---

## Q4 — Multimodal OCR vs Rule 3

| Decision | Value | Tag |
|----------|-------|-----|
| Report/photo text in global symptom blob | **Prohibited** | OWNER-APPROVED |
| Evidence model | Structured `verified_report_findings` / `verified_local_image_findings` with provenance | OWNER-APPROVED |
| Per-finding system binding | Required | OWNER-APPROVED |

---

## Q5 — Naming: Organ Affinity vs Organ-System Triad

| Decision | Value | Tag |
|----------|-------|-----|
| Rule 3 product name | Organ-System Affinity Engine | OWNER-APPROVED |
| UI section | Rule 3 — Active Organ Systems | OWNER-APPROVED |
| “Organ-System Triad” | Separate concept; not Rule 3; rule number AUDIT_PENDING | OWNER-APPROVED |
| Marketing triad in freeze docs | Kept separate from Rule 3 numbering | OWNER-APPROVED |

---

## Q6 — Consensus `_EH_RULE_MAP` “Rule 3”

| Decision | Value | Tag |
|----------|-------|-----|
| Import life-threat as Rule 3 | **Prohibited** | OWNER-APPROVED |
| EHAS2 clinical SoT | EH_9 / owner Rule 3 organ affinity only | OWNER-APPROVED |
| Legacy consensus map | Not EHAS2 SoT | OWNER-APPROVED |

---

## Co-involvement and keyword fallback

| Decision | Value | Tag |
|----------|-------|-----|
| Co-involvement default | Candidate only | OWNER-APPROVED |
| Confirmation | Independent evidence required | OWNER-APPROVED |
| Keyword-only hits | `LOW_CONFIDENCE_CANDIDATE`; not “Confirmed Organ Systems” authority | OWNER-APPROVED |

---

## Responsibility boundary

| May supply evidence to | Must not directly select |
|------------------------|---------------------------|
| Disease candidates, formula planning, oral planning, Tablet A/B scoring, external targeting, summary display | Medicine, potency, electricity, dosage, final prescription |

| Frontend inference | **Prohibited** | OWNER-APPROVED |

---

## Determinism

| Requirement | Tag |
|-------------|-----|
| Same input + dataset + rule version → same systems and fingerprint | OWNER-APPROVED |
| Nondeterministic ML/global leakage/cross-case contamination | **Prohibited** | OWNER-APPROVED |
