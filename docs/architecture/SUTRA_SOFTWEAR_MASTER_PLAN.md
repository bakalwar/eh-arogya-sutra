# SUTRA SOFTWEAR

## Professional Master Engineering Plan for E.H. AROGYA SUTRA 2

**Document type:** Long-term architecture, governance, delivery and quality roadmap  
**Owner:** Dr. Ghanshyam Bakalwar  
**Product:** E.H. AROGYA SUTRA 2 (EHAS2)  
**Planning baseline:** `main` after PR #2, merge commit `0aa4948f5962660a5aa362a80ce0648739f3b200`  
**Status:** Planning document only — not a clinical specification freeze, implementation approval or deployment approval  
**Date:** 2026-08-05

---

## 1. Purpose

This file is the controlling engineering map for building EHAS2 in a disciplined, professional and auditable manner. Every future phase must begin from the current verified repository state, have a written scope, use an isolated branch, pass its quality gates, receive the required approval, and merge through a reviewed pull request.

This roadmap does not replace the owner-approved Clinical Product Constitution, rule specifications, security policies, ADRs, phase reports or acceptance criteria. When documents conflict, the hierarchy in section 3 applies.

## 2. Product outcome

EHAS2 will become a secure, responsive, multi-tenant clinical SaaS platform for doctors, with:

- doctor and clinic identity, profiles, roles and tenant isolation;
- patient and consultation workflows;
- temporary report/image processing with explicit retention controls;
- a versioned and evidence-based nine-rule clinical assessment pipeline;
- dynamic prescription generation only after all clinical rules and safety gates are approved and implemented;
- immutable generated results, doctor review, amendments with reasons, and audit history;
- mobile, tablet and desktop user interfaces;
- operational monitoring, backup, recovery and controlled production delivery;
- measurable capacity planning toward the long-term 100,000 registered-doctor target.

The 100,000-doctor target is a scale objective, not a current readiness claim. Registered, active and concurrent doctors must be measured separately.

## 3. Authority hierarchy

If two instructions disagree, use this order and stop for owner clarification when the conflict cannot be resolved safely:

1. Explicit current owner approval and recorded owner decisions.
2. `docs/clinical/CLINICAL_PRODUCT_CONSTITUTION.md` and formally approved/frozen rule specifications.
3. Security, privacy, patient-data and legal/compliance requirements.
4. Accepted architecture decision records and data contracts.
5. This master plan and approved phase plan.
6. Implementation notes, tickets, Cursor prompts and preview fixtures.

Preview data, tests, old prompts, comments and legacy behavior are evidence only unless an authoritative document explicitly adopts them.

## 4. Non-negotiable boundaries

- EHAS2 remains separate from the legacy repository and legacy runtime.
- The legacy engine is reference-only and must not be modified without a separate explicit owner instruction.
- No patient-name hardcoding, fixed prescription, fake clinical success or silent fallback.
- No identifiable clinical data in source, fixtures, logs, screenshots, reports or pull requests.
- No secrets, `.env` files, tokens, database strings or private keys in Git.
- Original medical reports/images must not be permanently retained.
- Clinical uncertainty must return typed `UNKNOWN`, `UNRESOLVED`, `NOT_IMPLEMENTED`, `NOT_CONNECTED` or another approved fail-closed state.
- No phase may claim production readiness merely because local tests pass.
- No direct work on `main`; use an isolated branch and pull request.
- No deployment, external provider activation, database migration in production or irreversible action without explicit approval.
- Formal specification freeze and Phase 5D implementation are separate gates.

## 5. Current verified baseline

### Completed or present

- Engineering foundation, dependency hardening, CI and boundary checks.
- Responsive Jupiter design/AppShell and local UX flows.
- Identity, tenancy, roles, permissions and management foundations.
- PostgreSQL persistence foundations and patient/consultation/profile services.
- Authentication/session core; real OTP provider is not configured.
- Local-only preview and browser QA foundation.
- Phase 5A clinical forensic audit.
- Phase 5B sanitized data-package and isolated engine foundation.
- Phase 5C synthetic nine-rule validation foundation.
- Owner-approved OD-013 documentation merged through PR #2.

### Still not active

- No production clinical engine connection.
- No live prescription engine.
- Rule 8 remains not implemented according to the current repository baseline.
- No production OTP provider or passkey connection.
- No production patient database deployment.
- No payment integration.
- No production deployment, WAF, monitoring or alerting.
- Phase 5D has not started.
- Nine-rule formal specification freeze has not been performed in this work.

## 6. Target system architecture

### Experience layer

- Responsive web application for mobile, tablet and desktop.
- Doctor workspace, patient/case workflow, report upload, clinical review, prescription, history and print views.
- Management and Super Admin surfaces isolated by role and policy.
- Accessibility, localization and clear clinical uncertainty states.

### Application/API layer

- Versioned API namespace (`/api/eh-as-2/v1`).
- Typed request/response contracts and stable error envelope.
- Request IDs, authentication, authorization, tenant context, rate limiting and audit events.
- Idempotency for write operations where retries could duplicate clinical or billing actions.

### Domain layer

- Identity and tenancy.
- Doctor/clinic profiles and memberships.
- Patient and consultation records.
- Report findings and temporary media-processing metadata.
- Clinical assessment and nine-rule evidence records.
- Generated prescription, review, amendment and issuance lifecycle.
- Operations, feedback, notifications and later subscription/billing boundaries.

### Clinical intelligence layer

- Versioned disease data and canonical **38**-medicine registry (`ehas2-medicine-registry-v2`, CQ-001A; **C11 excluded**; identity package only — not clinical validation or production connection).
- Evidence normalization before rule execution.
- Nine rule engines with explicit contracts and no hidden cross-rule mutation.
- Deterministic orchestration, confidence, provenance and unresolved reasons.
- Prescription engine separated from assessment rules and enabled only after approval.
- Patient summary renderer consumes structured output and must never invent clinical facts.

### Data layer

- PostgreSQL with tenant isolation, migrations, constraints and transactional integrity.
- Immutable/versioned clinical artifacts and explicit audit trail.
- Object storage only for approved temporary workflows with lifecycle deletion.
- Cache/queue introduced only with measured need, namespaced keys and safe retry semantics.
- Encryption in transit and at rest; key rotation and least privilege.

### Platform and operations

- Reproducible builds and environment separation: local, test, staging and production.
- CI quality gates, dependency scanning, secret scanning and artifact retention.
- Infrastructure as code before production.
- Central structured logs without patient data, metrics, traces, alerts and runbooks.
- Backups, restore testing, disaster-recovery objectives and incident response.

## 7. End-to-end operating flow

1. Doctor authenticates through an approved production provider.
2. Server establishes identity, clinic membership, role and tenant context.
3. Doctor selects or creates a tenant-scoped patient and consultation.
4. Input is validated and normalized; report/image types are classified and handled temporarily.
5. Red flags and emergency evidence are checked before ordinary clinical output.
6. Versioned disease retrieval and nine-rule assessment run with evidence and confidence.
7. If required evidence/specification/engine is unavailable, the system fails closed and issues no prescription.
8. After Phase 5D is separately approved and implemented, the prescription engine evaluates all authorized inputs and medicine candidates.
9. Structured assessment and prescription outputs are stored immutably with versions and input hash.
10. The renderer produces the doctor-facing summary without inventing data.
11. Doctor reviews, accepts, modifies with reason, rejects or requests clarification.
12. Issuance creates an auditable version; follow-up links to the prior consultation without rewriting history.

## 8. Controlled phase roadmap

### Gate 0 — Repository and baseline integrity

Maintain clean boundaries, lockfile reproducibility, typed truthful endpoints, secret/patient-data scans and CI. Any regression blocks later work.

### Gate 1 — Formal specification readiness and freeze

Prepare the complete nine-rule bundle, evidence citations, unresolved-decision register, terminology, input/output contracts, invariants and guard tests. Formal freeze occurs only after a separate explicit owner approval and recorded sign-off. This plan does not perform that freeze.

### Gate 2 — Phase 5D start authorization

Resolve and record all independent Phase 5D blockers, including fail-closed/insufficient-evidence wording and readiness rows cited by the repository. Produce a bounded implementation plan, threat model and rollback plan. Start only after separate owner approval.

### Gate 3 — Phase 5D controlled prescription-engine implementation

Implement in small rule/contract increments. Preserve assessment/prescription separation, full evidence provenance, deterministic tests, no filler medicines, authorized oral totals, independent tablet/external sections and no default electricity fallback. Production AnalyzeComplete remains disconnected throughout development.

### Gate 4 — Clinical verification and safety validation

Run golden cases, synthetic boundary cases, mutation tests, reproducibility checks, cross-rule conflict tests, unresolved/fail-closed tests, version migration tests and clinician review. Record defects and do not tune against identifiable individuals.

### Gate 5 — Secure integration

Connect the verified engine to the API behind feature flags in a non-production environment. Add timeouts, resource limits, idempotency, audit logs, rate limits and circuit breakers. Verify no clinical output can bypass doctor review.

### Gate 6 — Production platform completion

Complete approved OTP/passkey provider, production database architecture, temporary object-storage lifecycle, WAF/rate limiting, observability, backup/restore, incident response, privacy controls and administrative separation.

### Gate 7 — Staging and operational readiness

Use synthetic/de-identified data. Perform end-to-end, accessibility, browser/device, security, recovery and controlled load tests. Establish SLOs, capacity model, escalation ownership and go-live/rollback runbooks.

### Gate 8 — Controlled deployment

Require an explicit deployment approval, signed release manifest, exact image/artifact versions, migration backup and rollback evidence. Begin with an internal/canary cohort, monitor safety and operations, and expand only on measured success.

### Gate 9 — Scale progression

Increase capacity through measured tiers. Never extrapolate directly to 100,000 doctors. Load-test realistic active/concurrent usage, clinical-engine latency, database contention, queues, storage lifecycle and failure recovery at every tier.

## 9. Standard workflow for every future step

1. Read this plan, current repository status and applicable authoritative documents.
2. State exact scope, exclusions, starting branch/SHA and acceptance criteria.
3. Create an isolated branch/worktree; confirm clean baseline.
4. Perform audit/design before mutation when the phase requires decisions.
5. Implement the smallest coherent change; do not mix unrelated cleanup.
6. Add/update tests, documentation, migrations and rollback notes together.
7. Run boundary, format, lint, typecheck, tests, build, security and dependency gates.
8. Inspect the complete diff for secrets, patient data, dead code, duplicates and misleading claims.
9. Commit intentionally and open a draft PR with evidence.
10. Resolve review and CI; never suppress a finding merely to obtain PASS.
11. Ask for owner approval when the next action is an external, clinical, destructive, freeze, merge or deployment gate.
12. Merge only the approved scope; verify `main`; update the phase manifest and stop at the next gate.

## 10. Definition of Done

A phase is complete only when:

- scope and exclusions match the approved phase plan;
- requirements map to implementation and tests;
- code is typed, maintainable, modular and free of duplicate/dead paths;
- migrations have safe up/down or documented recovery behavior;
- security, privacy, tenancy and patient-data boundaries pass;
- errors and unavailable features are truthful and fail closed;
- tests cover happy paths, edge cases, authorization and failure paths;
- clean install, lint, typecheck, test and production build pass;
- dependency/security findings are documented and handled by policy;
- documentation, ADRs and phase report match reality;
- PR review and CI are complete;
- owner approval is recorded where required;
- no deployment or next phase has started implicitly.

## 11. Change-control rules

- This file may be changed only through a dedicated planning/documentation PR.
- Every change must record rationale, affected phases and owner approval when it changes scope or gates.
- Clinical requirements belong in clinical authority documents, not only in this roadmap.
- A Cursor prompt may operationalize this plan but cannot override it.
- If Cursor finds repository evidence that conflicts with this file, it must stop, cite both sources and request resolution.
- Completed phase evidence is append-only in reports; do not rewrite history to make the project appear cleaner.

## 12. Immediate next authorized state

PR #2 is merged. The next permissible work is planning/review only unless the owner separately authorizes another action.

The following remain explicitly stopped:

- formal nine-rule specification freeze;
- Phase 5D implementation;
- production clinical-engine connection;
- deployment;
- legacy-engine mutation.

---

**Controlling principle:** one approved phase, one bounded branch, one evidence-backed PR, one explicit gate at a time.
