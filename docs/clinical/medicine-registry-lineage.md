# Medicine registry lineage (Phase 5B + CQ-001A)

## Current canonical identity (owner CQ-001A — 2026-08-07)

- **Version:** `ehas2-medicine-registry-v2`
- **Count:** **38** electrohomeopathy medicine/electricity codes (**C11 excluded**)
- **Artifacts:** `medicines.v2.json`, `registry.v2.manifest.json`
- **Artifact SHA-256:** `1C29F194B4B8EF6B45DBE75FE82EA7F660A51F48952BB7050B9A0BD86990B814`
- **Historical v1 snapshot (immutable):** `medicines.v1.json`, `registry.v1.manifest.json` — 39 codes including C11

## Legacy extraction source (Phase 5B)

Verified Python Materia Medica module in the protected old project (legacy filename historically ended in `medicines_38`).  
**Canonical count = 39** including **C11**.  
Source fingerprint (SHA-256): `907AF5DB9A2450486649AC57F45B9C0BC99A1EE96A7F3D043BEACA26D6AEF703`

## EHAS2 package (historical v1 record)

- Package: `@ehas2/medicine-registry`
- Version: `ehas2-medicine-registry-v1` (**superseded by v2 for current identity**)
- Artifact: `packages/medicine-registry/src/medicines.v1.json`
- Artifact SHA-256: `12836991C5C55E42A06A5DBF518A2528E865C82A33FEF3939F98E2206C0356F2`

## Non-canonical

SQLite `medicines` seed = **38** rows, **missing C11** — rejected as canonical by tests.

## Extraction

```bash
node tools/clinical-extract/extract-medicines.mjs --source <explicit-py-path> --out <dir>
```
