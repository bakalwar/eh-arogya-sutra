# Report transient processing

Lifecycle:

`Selected` → `Validated` → `TemporarilyReceived` → `MalwareCheck` → `OcrExtraction` → `StructuredFindings` → `DoctorVerification` → `ClinicalAnalysis` → `OriginalDeleted` → `DeletionVerified` → `ProcessingClosed`

Requirements: encrypted transit/temp storage, random IDs, MIME/size limits, tenant scope, short TTL, no public URL, no permanent thumbnail, no browser persistence, no report content in logs, cleanup on success/error/timeout/cancel, orphan cleanup, deletion verification, cleanup audit.

Storage/OCR are **NOT_IMPLEMENTED** in Phase 2A-D.
