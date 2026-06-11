# Database seeds

- **MongoDB (default app DB):** from repo root  
  `npm run seed`  
  Uses `MONGODB_URI`, seeds medicines + demo doctor (`DEMO_DOCTOR_*` in `.env`).

- **PostgreSQL (Sequelize):**  
  `npm run seed:postgres`  
  Requires `DATABASE_URL` and applied `database/schema.sql` (+ `002_eh_library_symptoms.sql` if upgrading). Seeds EH sample medicines, symptom catalog, demo doctor; refreshes FTS `search_document`.

Run **both** while dual-writing or migrating: `npm run seed` then `npm run seed:postgres`.
