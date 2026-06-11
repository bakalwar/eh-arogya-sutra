# pgAdmin / standalone SQL

## `medicines_and_system_settings_eh_arogyaa_sutra_db.sql`

Use when your database is **`eh_arogyaa_sutra_db`** (or any empty Postgres DB) and you want:

- **`medicines`**: `id` (UUID PK), `medicine_name`, `medicine_group`, `dilution`, `indications`, timestamps  
- **Indexes**: btree + **GIN (`pg_trgm`)** on name and indications for fast / fuzzy search at scale  
- **`system_settings`**: default **`clinic_name`** = `E.H. AROGYA SUTRA`, **`clinic_phone`** = `9098791989`

### How to run

1. In **pgAdmin**: connect → select database **`eh_arogyaa_sutra_db`** → **Tools → Query Tool** → open this `.sql` file → **Execute** (F5).  
2. Or from a machine with **`psql`** in PATH:

```bash
psql "postgresql://USER:PASSWORD@localhost:5432/eh_arogyaa_sutra_db" -f database/pgadmin/medicines_and_system_settings_eh_arogyaa_sutra_db.sql
```

### Note vs repo `database/schema.sql`

The root **`schema.sql`** defines a different `medicines` layout (`name`, `system`, …) for the **Node Sequelize** app.  
**Do not** apply both definitions to the same table. Use either:

- **This file** for your pgAdmin EH catalog (`medicine_name` columns), **or**  
- **`database/schema.sql`** for full app sync with the current backend models.

Backend default branding (reports / API) matches this file via **`backend/config/branding.js`** and env **`CLINIC_NAME`** / **`CLINIC_PHONE`**.
