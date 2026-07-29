# Immutable clinical history

Issued prescriptions are never overwritten. Modifications create a new `prescription_versions` row; prior versions remain readable.

Each clinical analysis / prescription / summary snapshot stores:

- structured engine result (where applicable)
- readable snapshot
- input hash + content hash
- engine / rules / disease-data / medicine-data versions
- clinician decision and modification reason
- previous version reference
- timestamps and actor

Review states: `GENERATED_PENDING_REVIEW`, `NEEDS_CLARIFICATION`, `ACCEPTED`, `MODIFIED`, `REJECTED`, `ISSUED`, `SUPERSEDED`. Invalid transitions are rejected and audited.
