# Clinical snapshot versioning

Prescriptions are **immutable versions**.

On modification:

- do not overwrite the prior version
- create a new version with `previousVersionId`
- record modification reason, actor, timestamp, content hash, audit reference

Each version carries structured prescription + readable snapshot + engine/rule/data versions + clinician decision.

See `@ehas2/clinical-contracts` (`PrescriptionSnapshot`, `createNextPrescriptionVersion`).
