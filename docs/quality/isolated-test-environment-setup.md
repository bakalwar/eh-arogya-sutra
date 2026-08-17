# Isolated test environment setup (EHAS2)

This document describes **safe** local and CI setup for PostgreSQL integration tests, Phase 5B clinical extraction tests, and Python clinical-engine tests. It does **not** authorize production activation or live PHI.

## PostgreSQL isolated tests

### Requirements

| Setting | Value |
|---------|--------|
| Host | `127.0.0.1` or `localhost` only |
| Port | **`55432`** only (default app port **5432 is rejected**) |
| User | `ehas2` |
| Databases (exact allowlist) | `ehas2_phase3a_test`, `ehas2_phase3b_test`, `ehas2_phase3c_test`, `ehas2_phase3d_test`, `ehas2_phase4a_preflight`, `ehas2_phase_evidence_test`, `ehas2_phase_extract_test` |
| SSL | `EHAS2_DATABASE_SSL_MODE=disable` |
| Node env | `EHAS2_NODE_ENV=test` (or `NODE_ENV=test`) |

### Destructive reset warning

Integration tests call `resetDatabaseSchema()` which executes **`DROP SCHEMA public CASCADE`** on the **target database only**.

Before **`resetDatabaseSchema()`** (and test-only **`migrateDownLastForIsolatedTest()`**), `@ehas2/database` enforces **`assertDestructiveTestDatabaseOperationAllowed`**, which requires:

```text
EHAS2_ALLOW_DESTRUCTIVE_TEST_DB_RESET=true
```

**Never** point test env vars at a developer or production database on port 5432. The guard rejects port 5432, non-local hosts, production-like hostnames, system databases (`postgres`, `template0`, `template1`), and databases outside the allowlist.

Optional password (CI / Docker):

```text
EHAS2_TEST_PG_PASSWORD=ehas2_isolated_test_only
```

### Docker (optional, if Docker is already installed)

From repository root:

```bash
docker compose -f docker/postgres-isolated-test.compose.yml up -d
```

Uses PostgreSQL **16**, maps **`127.0.0.1:55432`**, ephemeral `tmpfs` storage (no shared production volumes), test-only labels.

### Manual PostgreSQL 15/16 (no Docker install)

If PostgreSQL is already installed locally, create a **separate** instance or listener on port **55432**, user **`ehas2`**, and the five databases above. Example (adjust paths for your install):

```bash
# Illustrative — run only against a dedicated test cluster, not production.
createuser ehas2
createdb -O ehas2 ehas2_phase3a_test
createdb -O ehas2 ehas2_phase3b_test
createdb -O ehas2 ehas2_phase3c_test
createdb -O ehas2 ehas2_phase3d_test
createdb -O ehas2 ehas2_phase4a_preflight
```

Configure `postgresql.conf` / `pg_hba.conf` for local trust or password auth on port 55432.

### Running integration tests locally

```bash
set EHAS2_ALLOW_DESTRUCTIVE_TEST_DB_RESET=true
set EHAS2_TEST_PG_PASSWORD=ehas2_isolated_test_only
npm test
```

Test helpers set opt-in and isolated URLs automatically when PostgreSQL is reachable on `127.0.0.1:55432`. If PostgreSQL is unavailable, integration tests remain **BLOCKED** (not redirected to port 5432).

## Local setup order (root)

1. `npm ci` — root workspaces only (no clinical-extract native build)
2. `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build` as needed
3. Before Phase 5B or tests that need SQLite extract tools: **`npm run bootstrap:clinical-extract`** (Node **20.x** + native toolchain)
4. Before PostgreSQL integration tests: isolated Postgres on **55432** + `EHAS2_ALLOW_DESTRUCTIVE_TEST_DB_RESET=true`
5. `npm test` (CI runs bootstrap explicitly after `npm ci`, before tests)

Normal **`migrateUp()`** is **not** gated by the destructive test guard; production and CI migrations do not require port 55432 or destructive opt-in.

## Phase 5B clinical extract (`better-sqlite3`)

Root `npm ci` does **not** install `tools/clinical-extract` dependencies (that folder is outside npm workspaces).

After root install:

```bash
npm run bootstrap:clinical-extract
```

This runs lockfile-based `npm ci` in `tools/clinical-extract/`. Requires **Node 20.x** and a native build toolchain for `better-sqlite3` on your OS.

## Python clinical-engine tests

Do **not** rely on a hardcoded Windows `.venv\\Scripts\\python.exe` path.

```bash
cd apps/clinical-engine
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # Linux/macOS
cd ../..
npm run test:clinical-engine
```

`npm run test:clinical-engine` invokes `scripts/run-clinical-engine-tests.mjs`, which prefers the venv interpreter, then `PYTHON`, then `py -3` / `python3`.

## CI behavior

GitHub Actions `ci.yml`:

- Starts PostgreSQL **16** service on host port **55432**
- Creates the five allowlisted databases
- Sets synthetic test credentials (not repository secrets)
- Sets `EHAS2_ALLOW_DESTRUCTIVE_TEST_DB_RESET=true` for the test job
- Runs `npm run bootstrap:clinical-extract` before `npm test`

## Rule 4

Rule 4 shadow clinical contracts are **not** modified by this test-environment setup.
