# SQL migrations (PostgreSQL)

- Apply base schema: `database/schema.sql`
- Incremental fixes for already-provisioned DBs: numbered files in this folder  
  - `001_patients_cdss_columns.sql` — patient CDSS columns  
  - `002_eh_library_symptoms.sql` — EH medicine library + `symptoms` + GIN indexes
