# Disease extraction procedure (Phase 5B)

## Command (offline only)

```bash
node tools/clinical-extract/extract-diseases.mjs \
  --source "<explicit-readonly-sqlite-path>" \
  --out data/clinical-artifacts/disease-package-v1
```

Optional: `--expected-sha <SHA256>` (defaults to Phase 5A verified source checksum), `--expected-count N`.

## Guarantees

1. Source opened with `better-sqlite3` `{ readonly: true }`
2. Write probe must fail
3. Checksum mismatch → fail closed
4. Count mismatch → fail closed
5. Only `diseases` table + approved fields selected
6. Denylist tables (e.g. `consultations`) never written to output
7. Never runs at application startup
8. Production/runtime must not retain the old laptop path

## CI fixture

Synthetic source: `fixtures/synthetic/clinical/synthetic-source.sqlite`  
Tiny package: `fixtures/synthetic/clinical/disease-package-tiny/`
