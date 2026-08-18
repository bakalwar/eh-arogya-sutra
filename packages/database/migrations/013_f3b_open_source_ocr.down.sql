DROP INDEX IF EXISTS clinical_evidence_extraction_candidates_retention_idx;

ALTER TABLE clinical_evidence_extraction_candidates
  DROP CONSTRAINT IF EXISTS clinical_evidence_extraction_candidates_limits_ok;

ALTER TABLE clinical_evidence_extraction_candidates
  ADD CONSTRAINT clinical_evidence_extraction_candidates_limits_ok CHECK (
    limitation_codes <@ ARRAY[
      'SCANNER_NOT_CLEAN', 'EXTRACTION_NOT_CONNECTED', 'MALFORMED_DOCUMENT', 'UNSUPPORTED_TYPE',
      'PHOTO_DIAGNOSIS_FORBIDDEN', 'IMAGE_INTERPRETATION_FORBIDDEN', 'TIMEOUT', 'LOW_CONFIDENCE',
      'PARTIAL_EXTRACTION', 'ORIGINAL_UNAVAILABLE', 'BYTE_LIMIT', 'PAGE_LIMIT', 'TEXT_LIMIT',
      'DUPLICATE_RUN', 'SUPERSEDED_BY_NEWER_EXTRACTOR', 'SYNTHETIC_FIXTURE_ONLY', 'NOT_AUTHORITATIVE',
      'NO_TRANSLATION', 'UNSUPPORTED_LANGUAGE'
    ]::text[]
  );

ALTER TABLE clinical_evidence_extraction_runs
  DROP CONSTRAINT IF EXISTS clinical_evidence_extraction_runs_limits_ok;

ALTER TABLE clinical_evidence_extraction_runs
  ADD CONSTRAINT clinical_evidence_extraction_runs_limits_ok CHECK (
    limitation_codes <@ ARRAY[
      'SCANNER_NOT_CLEAN', 'EXTRACTION_NOT_CONNECTED', 'MALFORMED_DOCUMENT', 'UNSUPPORTED_TYPE',
      'PHOTO_DIAGNOSIS_FORBIDDEN', 'IMAGE_INTERPRETATION_FORBIDDEN', 'TIMEOUT', 'LOW_CONFIDENCE',
      'PARTIAL_EXTRACTION', 'ORIGINAL_UNAVAILABLE', 'BYTE_LIMIT', 'PAGE_LIMIT', 'TEXT_LIMIT',
      'DUPLICATE_RUN', 'SUPERSEDED_BY_NEWER_EXTRACTOR', 'SYNTHETIC_FIXTURE_ONLY', 'NOT_AUTHORITATIVE',
      'NO_TRANSLATION', 'UNSUPPORTED_LANGUAGE'
    ]::text[]
  );

ALTER TABLE clinical_evidence_extraction_candidates
  DROP CONSTRAINT IF EXISTS clinical_evidence_extraction_candidates_locator_ok;

ALTER TABLE clinical_evidence_extraction_candidates
  ADD CONSTRAINT clinical_evidence_extraction_candidates_locator_ok CHECK (
    jsonb_typeof(source_locator) = 'object'
    AND (source_locator ? 'page')
    AND jsonb_typeof(source_locator->'page') = 'number'
    AND (source_locator->>'page')::int BETWEEN 1 AND 20
    AND NOT (source_locator ?| ARRAY[
      'object_key', 'objectKey', 'object_url', 'path', 'url', 'filename',
      'storage', 'bucket', 'public_url', 'presigned_url'
    ])
  );

ALTER TABLE clinical_evidence_extraction_candidates
  DROP CONSTRAINT IF EXISTS clinical_evidence_extraction_candidates_method_check;

ALTER TABLE clinical_evidence_extraction_candidates
  ADD CONSTRAINT clinical_evidence_extraction_candidates_method_check
    CHECK (method IN ('DETERMINISTIC_FIXTURE'));

ALTER TABLE clinical_evidence_extraction_runs
  DROP CONSTRAINT IF EXISTS clinical_evidence_extraction_runs_method_check;

ALTER TABLE clinical_evidence_extraction_runs
  ADD CONSTRAINT clinical_evidence_extraction_runs_method_check
    CHECK (method IN ('DETERMINISTIC_FIXTURE'));

ALTER TABLE clinical_evidence_items
  DROP COLUMN IF EXISTS content_intent;
