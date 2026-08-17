-- F3B: open-source OCR adapter foundation (candidates only, not production activation).
-- Adds written-report content intent gate, extraction methods, locator hardening, retention bounds.

ALTER TABLE clinical_evidence_items
  ADD COLUMN IF NOT EXISTS content_intent text NOT NULL DEFAULT 'UNCLASSIFIED'
    CHECK (content_intent IN (
      'WRITTEN_REPORT_DOCUMENT',
      'WRITTEN_REPORT_PAGE_IMAGE',
      'DIAGNOSTIC_IMAGE',
      'PATIENT_PHOTO',
      'UNCLASSIFIED'
    ));

COMMENT ON COLUMN clinical_evidence_items.content_intent IS
  'Fail-closed extraction intent. F3B: only set via authorized test/admin paths; never from client filename.';

ALTER TABLE clinical_evidence_extraction_runs
  DROP CONSTRAINT IF EXISTS clinical_evidence_extraction_runs_method_check;

ALTER TABLE clinical_evidence_extraction_runs
  ADD CONSTRAINT clinical_evidence_extraction_runs_method_check
    CHECK (method IN ('DETERMINISTIC_FIXTURE', 'PDF_TEXT_LAYER', 'TESSERACT_OCR', 'TWO_STAGE_PIPELINE'));

ALTER TABLE clinical_evidence_extraction_candidates
  DROP CONSTRAINT IF EXISTS clinical_evidence_extraction_candidates_method_check;

ALTER TABLE clinical_evidence_extraction_candidates
  ADD CONSTRAINT clinical_evidence_extraction_candidates_method_check
    CHECK (method IN ('DETERMINISTIC_FIXTURE', 'PDF_TEXT_LAYER', 'TESSERACT_OCR', 'TWO_STAGE_PIPELINE'));

ALTER TABLE clinical_evidence_extraction_candidates
  DROP CONSTRAINT IF EXISTS clinical_evidence_extraction_candidates_locator_ok;

ALTER TABLE clinical_evidence_extraction_candidates
  ADD CONSTRAINT clinical_evidence_extraction_candidates_locator_ok CHECK (
    jsonb_typeof(source_locator) = 'object'
    AND source_locator <> '{}'::jsonb
    AND (source_locator ? 'page')
    AND jsonb_typeof(source_locator->'page') = 'number'
    AND (source_locator->>'page')::int BETWEEN 1 AND 20
    AND NOT (source_locator ?| ARRAY[
      'object_key', 'objectKey', 'object_url', 'path', 'url', 'filename',
      'storage', 'bucket', 'public_url', 'presigned_url'
    ])
    AND (
      NOT (source_locator ? 'blockIndex')
      OR (
        jsonb_typeof(source_locator->'blockIndex') = 'number'
        AND (source_locator->>'blockIndex')::int BETWEEN 0 AND 9999
      )
    )
    AND (
      NOT (source_locator ? 'bbox')
      OR (
        jsonb_typeof(source_locator->'bbox') = 'object'
        AND (source_locator->'bbox' ?& ARRAY['x','y','w','h'])
        AND jsonb_typeof(source_locator->'bbox'->'x') = 'number'
        AND jsonb_typeof(source_locator->'bbox'->'y') = 'number'
        AND jsonb_typeof(source_locator->'bbox'->'w') = 'number'
        AND jsonb_typeof(source_locator->'bbox'->'h') = 'number'
        AND (source_locator->'bbox'->>'x')::numeric >= 0
        AND (source_locator->'bbox'->>'y')::numeric >= 0
        AND (source_locator->'bbox'->>'w')::numeric > 0
        AND (source_locator->'bbox'->>'h')::numeric > 0
        AND (source_locator->'bbox'->>'w')::numeric <= 1
        AND (source_locator->'bbox'->>'h')::numeric <= 1
      )
    )
  );

ALTER TABLE clinical_evidence_extraction_runs
  DROP CONSTRAINT IF EXISTS clinical_evidence_extraction_runs_limits_ok;

ALTER TABLE clinical_evidence_extraction_runs
  ADD CONSTRAINT clinical_evidence_extraction_runs_limits_ok CHECK (
    limitation_codes <@ ARRAY[
      'SCANNER_NOT_CLEAN',
      'EXTRACTION_NOT_CONNECTED',
      'MALFORMED_DOCUMENT',
      'UNSUPPORTED_TYPE',
      'PHOTO_DIAGNOSIS_FORBIDDEN',
      'IMAGE_INTERPRETATION_FORBIDDEN',
      'DOCUMENT_INTENT_REQUIRED',
      'TIMEOUT',
      'LOW_CONFIDENCE',
      'PARTIAL_EXTRACTION',
      'ORIGINAL_UNAVAILABLE',
      'BYTE_LIMIT',
      'PAGE_LIMIT',
      'TEXT_LIMIT',
      'DUPLICATE_RUN',
      'SUPERSEDED_BY_NEWER_EXTRACTOR',
      'SYNTHETIC_FIXTURE_ONLY',
      'NOT_AUTHORITATIVE',
      'NO_TRANSLATION',
      'UNSUPPORTED_LANGUAGE',
      'CANDIDATE_RETENTION_PRUNED'
    ]::text[]
  );

ALTER TABLE clinical_evidence_extraction_candidates
  DROP CONSTRAINT IF EXISTS clinical_evidence_extraction_candidates_limits_ok;

ALTER TABLE clinical_evidence_extraction_candidates
  ADD CONSTRAINT clinical_evidence_extraction_candidates_limits_ok CHECK (
    limitation_codes <@ ARRAY[
      'SCANNER_NOT_CLEAN',
      'EXTRACTION_NOT_CONNECTED',
      'MALFORMED_DOCUMENT',
      'UNSUPPORTED_TYPE',
      'PHOTO_DIAGNOSIS_FORBIDDEN',
      'IMAGE_INTERPRETATION_FORBIDDEN',
      'DOCUMENT_INTENT_REQUIRED',
      'TIMEOUT',
      'LOW_CONFIDENCE',
      'PARTIAL_EXTRACTION',
      'ORIGINAL_UNAVAILABLE',
      'BYTE_LIMIT',
      'PAGE_LIMIT',
      'TEXT_LIMIT',
      'DUPLICATE_RUN',
      'SUPERSEDED_BY_NEWER_EXTRACTOR',
      'SYNTHETIC_FIXTURE_ONLY',
      'NOT_AUTHORITATIVE',
      'NO_TRANSLATION',
      'UNSUPPORTED_LANGUAGE',
      'CANDIDATE_RETENTION_PRUNED'
    ]::text[]
  );

CREATE INDEX IF NOT EXISTS clinical_evidence_extraction_candidates_retention_idx
  ON clinical_evidence_extraction_candidates (
    organization_id, clinic_id, evidence_item_id, status, created_at DESC
  );
