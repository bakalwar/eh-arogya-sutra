DROP TRIGGER IF EXISTS clinical_fact_verification_normalizations_append_only
  ON clinical_fact_verification_normalizations;
DROP FUNCTION IF EXISTS ehas2_fact_verification_norm_append_only();
DROP TABLE IF EXISTS clinical_fact_verification_normalizations;

DROP TRIGGER IF EXISTS clinical_fact_verification_events_append_only
  ON clinical_fact_verification_events;
DROP FUNCTION IF EXISTS ehas2_fact_verification_event_append_only();
DROP TABLE IF EXISTS clinical_fact_verification_events;

DROP INDEX IF EXISTS clinical_fact_verification_events_017_child_parent_uq;
DROP INDEX IF EXISTS clinical_fact_normalizations_017_verification_norm_uq;
DROP INDEX IF EXISTS clinical_fact_candidates_017_verification_parent_uq;
