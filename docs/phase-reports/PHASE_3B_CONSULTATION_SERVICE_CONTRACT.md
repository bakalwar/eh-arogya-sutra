# PHASE 3B CONSULTATION SERVICE CONTRACT

Trusted TenantContext required.

Operations:

- create for same-tenant ACTIVE patient
- get/list patient/tenant scoped
- update draft fields only in DRAFT/IN_PROGRESS/AWAITING_REPORT_VERIFICATION
- transition consultation statuses via accepted graph
- addStructuredFindings (batch ≤ 50, structured only)
- addSummaryRevision / addPrescriptionRevision (immutable; revisions only)
- transitionReview using Phase 3A review states
- list prescription/summary revision history

No clinical generation; persists validated caller payloads only.
