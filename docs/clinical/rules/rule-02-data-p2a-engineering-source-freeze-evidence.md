# Rule 2 — R2-DATA-P2A engineering source-freeze evidence

## 1. Document control

| Field | Value |
|-------|--------|
| **Classification** | **DOCUMENTATION_ONLY** (engineering identity freeze) |
| **Phase** | `R2-DATA-P2A` |
| **Owner authorization** | `R2-DATA-P2A: AUTHORIZE_ENGINEERING_SOURCE_FREEZE_MANIFEST_PR` |
| **Binding declaration** | `MAPPED.JSON GENERATOR/PROVENANCE UNKNOWN` |
| **Manifest purpose** | `ENGINEERING_IDENTITY_ONLY` |
| **Clinical authority** | **NONE** |
| **Registry population authorized** | **false** |
| **Runtime activation authorized** | **false** |
| **Canonical base SHA** | `8216522d3232541b6863b164a0f2b1fe0b41f9f5` |
| **Companion machine-readable manifest** | [rule-02-data-p2a-engineering-source-freeze.manifest.json](./rule-02-data-p2a-engineering-source-freeze.manifest.json) |
| **Rule 2 decisions (referenced, not redefined)** | R2-ID-01 … R2-ID-05 |

This tranche pins **exact engineering evidence identifiers** (paths, hashes, counts, schemas, exclusions). It does **not** approve disease polarity, populate a real Rule 2 registry, import legacy datasets into EHAS2, or authorize orchestration / API / UI / Rx / deployment.

---

## 2. Why this freeze is engineering-only

The Phase 1 lineage/bridge audit established that disease **codes and names** can be matched technically, while polarity **meaning** cannot be reproduced from a recoverable generator. Owner direction therefore separates:

- **Engineering identity freeze** — prove which bytes and schemas were inspected.
- **Clinical authority freeze** — requires validated Electrohomeopathy sources and explicit owner clinical approval per mapping.

R2-DATA-P2A authorizes only the first. `clinicalAuthority = NONE`.

---

## 3. Why dirty whole-worktree freeze is excluded

The inspected legacy snapshot (`bakalwar/eh-arogya-sutra`, HEAD `b9ec3f6986c402afee13241673b954fe3564f169`, branch `main`, ahead of origin by **32**) has a **dirty** worktree. A whole-worktree byte freeze is therefore **`NOT_REPRODUCIBLE`**.

File-level evidence remains **`REPRODUCIBLE_BY_HASH`** for the pinned artifacts (notably `mapped.json`, which matched its Git blob at that HEAD). The manifest discloses dirty state and refuses to claim a clean full-tree snapshot.

Absolute local user paths are intentionally omitted.

---

## 4. Why `mapped.json` bytes are reproducible but clinical meaning is not

Verified engineering identity (see manifest for full hashes):

| Item | Value |
|------|--------|
| Path | `eh-api/data/raw/mapped.json` |
| Git blob SHA | `bded56b37df01925e94db21dea9ee38a42371717` |
| SHA-256 | `80b5d26cd06dec087350a64643933c3889f3553790653cb9dbc1f48b3531bda6` |
| Size (bytes) | `54597079` |
| Rows | `102320` |
| Introducing commit | `b432b25d8a19f560ddad01554fd390ac94b4e045` |

Bytes and schema keys are pinable. The polarity field is **not** clinical authority: generator status is `EXACT_GENERATOR_NOT_FOUND`, provenance is `UNKNOWN`, and polarity clinical authority is `NONE`.

The dataset is **not** copied into EHAS2 by this PR.

---

## 5. Why generator / provenance unknown matters

Without an exact generator, polarity assignment cannot be replayed. Therefore:

1. Legacy polarity values must not be blindly imported or activated.
2. Missing evidence must remain `UNKNOWN` / `UNRESOLVED` (fail-closed).
3. Future real mappings require authoritative evidence, deterministic representation, and owner clinical approval.

This is the binding declaration: **`MAPPED.JSON GENERATOR/PROVENANCE UNKNOWN`**.

---

## 6. Why ~91.3% MIXED cannot be trusted clinically

Phase 1 found the large majority of mapped polarity values are `MIXED`, with high confidence that many are **default / unclassified placeholders** (especially OMIM-heavy slices). Row-level clinical status of any specific `MIXED` entry is **not determinable** from repository evidence alone.

Under R2-ID-02, genuine clinical MIXED requires explicit evidence and owner policy handling; default/legacy MIXED must not be promoted as clinical truth and must not invent therapeutic opposites.

Manifest MIXED-origin status:

`DEFAULT_PLACEHOLDER_HIGH_CONFIDENCE_ROW_LEVEL_CLINICAL_STATUS_NOT_DETERMINABLE`

---

## 7. Why the technical bridge is useful

Prior external audit artifact `R2_BRIDGE_CANDIDATES_V3.jsonl` (SHA-256 in manifest; **not committed**) accounts for **50,544** unique mapped keys against EH disease identity:

| Disposition | Count |
|-------------|------:|
| Exact unique match | 33,070 |
| Exact multiple match | 17,181 |
| Owner-review polarity conflict | 257 |
| No match | 36 |

This supports future **identity ledgers** (planned P2B) without adopting polarity.

Technical code match ≈ **99.93%** is an **identity** axis statistic only. It is **not** clinical coverage.

---

## 8. Why technical matching is not clinical approval

A namespaced code match proves engineering candidate identity. It does **not**:

- validate Electrohomeopathy polarity,
- resolve conflicted polarity counts,
- authorize registry activation,
- or replace owner clinical approval.

Coverage axes remain separate in the manifest: identity · source-linked polarity · clinically reviewed · owner-approved · active registry. Known posture for clinical axes: **0** reviewed, **0** owner-approved, **0** active real Rule 2 mappings (empty registry / fail-closed; R2-ID-03).

---

## 9. Why the registry remains empty

R2-ID-03 keeps the real Rule 2 evidence registry empty and fail-closed until owner-approved rows exist. This PR creates **no** registry entries, loaders, or activation paths. Medicine-registry polarity axes remain unrelated to Rule 2 disease polarity.

---

## 10. How future P2B–P2F may build on this baseline

| Future phase | Builds on P2A by… | Still not authorized by P2A |
|--------------|-------------------|-----------------------------|
| **P2B** | Canonical disease identity ledger from pinned bridge/DB identity facts | Polarity adoption |
| **P2C** | Evidence schema / reviewer sheets against pinned vocabularies | Registry activation |
| **P2D** | Authoritative source intake | Auto-approval |
| **P2E** | Conflict / MIXED triage | Silent MIXED resolution |
| **P2F+** | Owner-approved registry batches | Loading unapproved legacy polarity |

Each remains a separate owner gate.

---

## 11. Explicitly not authorized

- Data adoption / import of `mapped.json`, `eh_arogya.db`, raw ICD/OMIM/Orphanet/MeSH, inventory, or bridge files into EHAS2
- Polarity approval or generation (including AI clinical mapping)
- Keyword classifier promotion to authority
- Registry population
- Rule 2 evaluator / package / test reimplementation
- Orchestration, AnalyzeComplete, API/UI activation
- Medicine / formula / potency / electricity / Rx influence
- Migration 019, production, deployment
- Legacy repository mutation
- Claiming clinical correctness from engineering hashes

---

## 12. Privacy and reproducibility notes

- Manifest stores identifiers, hashes, counts, schemas, status, and exclusions only.
- No absolute Windows user paths, PHI/PII, consultation content, secrets, or copyrighted source excerpts.
- Prior inventory/bridge artifacts remain `TEMPORARY_EXTERNAL_NOT_COMMITTED`.
- Database WAL/SHM and consultation/runtime data are excluded; DB clinical polarity authority is `NONE` (no polarity column on `diseases`).

---

## 13. Final posture

**Engineering identity pinned. Clinical authority unchanged (`NONE`). Real Rule 2 mappings remain `0`.**
