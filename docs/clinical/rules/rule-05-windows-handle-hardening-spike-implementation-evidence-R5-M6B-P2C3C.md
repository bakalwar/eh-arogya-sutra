# Rule 5 — R5-M6B P2-C3C synthetic Windows handle-hardening spike implementation evidence (post-merge)

## 1. Document control and classification

| Field | Value |
|-------|--------|
| **Phase** | **R5-M6B Track B — P2-C3C** |
| **Classification** | **DOCUMENTATION_ONLY** (post-merge implementation evidence) |
| **Authorization token (this documentation)** | **`R5_P2C3C_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_AUTHORIZED`** |
| **Independent security-review token** | **`R5_P2C3C_INDEPENDENT_SECURITY_REVIEW_PASS`** |
| **Owner merge authorization** | **`EHAS2_PR78_OWNER_MERGE_AUTHORIZED`** (executed) |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |
| **Canonical `origin/main` (post PR #78)** | `39b5e8af27e280dc93515e8cc5361f265016b9ad` |
| **Companion C3C contract** | [rule-05-windows-handle-hardening-spike-contract-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-contract-R5-M6B-P2C3C.md) |
| **Companion zero-paid toolchain evidence** | [rule-05-windows-handle-hardening-spike-zero-paid-toolchain-license-evidence-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-zero-paid-toolchain-license-evidence-R5-M6B-P2C3C.md) |
| **Companion P2-A policy** | [rule-05-byte-verification-policy-R5-M6B-P2.md](./rule-05-byte-verification-policy-R5-M6B-P2.md) |
| **Companion inventory** | [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md) |

This document records **post-merge** evidence that the P2-C3C synthetic Windows handle-hardening spike **implementation** was merged to canonical `main` via PR #78, independently security-reviewed, and remains bounded as a **synthetic-only** feasibility/control spike.

It does **not** authorize C3D/C3E, protected-source execution, hashing, manifest work, catalog/runtime integration, deployment, or clinical validation.

---

## 2. Canonical repository / base identity

| Item | Value |
|------|--------|
| **Repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Merge commit (`origin/main`)** | `39b5e8af27e280dc93515e8cc5361f265016b9ad` |
| **Merge parent 1 (pre-merge `main`)** | `df3695fca1d9b772cc18083caa9c2c2406069480` |
| **Merge parent 2 (reviewed PR head)** | `8eb6732bdfe7902dc49a1f1d4330f97464cb2e8a` |
| **Reviewed-head tree == merge tree** | `df101f8e819c0f6fccc95310915d01782c548acb` |
| **Merge style** | Normal merge commit (not squash/rebase) |

---

## 3. PR #78 implementation identity

| Item | Value |
|------|--------|
| **PR** | [#78](https://github.com/bakalwar/EH_AROGYA_SUTRA_2/pull/78) |
| **Branch** | `feat/p2-c3c-windows-handle-hardening-spike` |
| **State** | **MERGED** |
| **Implementation commit** | `dcfcc4c6097da0065b8dcf799969a352052cc331` |
| **Security correction commit (B1/B2)** | `8eb6732bdfe7902dc49a1f1d4330f97464cb2e8a` |
| **Reviewed / merged head** | `8eb6732bdfe7902dc49a1f1d4330f97464cb2e8a` |
| **Independent security review** | **`R5_P2C3C_INDEPENDENT_SECURITY_REVIEW_PASS`** |
| **Owner merge readiness token (pre-merge)** | **`EHAS2_PR78_UPDATED_HEAD_READY_FOR_OWNER_MERGE_APPROVAL`** |

Linear history on the PR branch: implementation commit → B1/B2 correction commit → merge into `main`.

---

## 4. Exact 13-path implementation inventory summary

All tracked implementation content under `tools/provenance/windowsHandleSpike/` (exactly **13** paths; cumulative base..reviewed-head **+1894/−0**):

1. `Cargo.toml`
2. `Cargo.lock`
3. `rust-toolchain.toml`
4. `src/codes.rs`
5. `src/identity.rs`
6. `src/lib.rs`
7. `src/main.rs`
8. `src/outcome.rs`
9. `src/path_lex.rs`
10. `src/platform.rs`
11. `src/procedure.rs`
12. `src/volume.rs`
13. `tests/mandatory_proofs.rs`

No docs/workflows/README/JS/package fixtures, no committed `target/`, and no tracked `exe`/`dll`/`pdb`/`lib`/`obj` in the PR #78 tree.

---

## 5. Toolchain and Cargo dependency lock

| Lock | Recorded value |
|------|----------------|
| **rust-toolchain.toml** | channel **1.97.1**; target **`x86_64-pc-windows-msvc`**; profile **minimal** |
| **Direct production dependency** | `windows-sys = "=0.61.2"` (`default-features = false`; documented Win32/Wdk feature set only) |
| **Resolved graph** | local crate → **windows-sys 0.61.2** → **windows-link 0.2.1** |
| **Registry** | crates.io only (`registry+https://github.com/rust-lang/crates.io-index`) |
| **Licenses (declared)** | MIT OR Apache-2.0 |
| **Paid dependency / paid CI / paid certificate** | **Rejected** — **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |

---

## 6. Architecture and synthetic-only boundary

| Boundary | Status |
|----------|--------|
| **Helper form** | Out-of-process Rust binary + library under `tools/provenance/windowsHandleSpike/` |
| **Input contract** | Absolute drive-letter selection on **stdin** (not argv/env for path) |
| **Output contract** | Exactly one JSON line (`code`, then `outcome`) + LF; stderr empty for unwindable-panic redaction path |
| **Filesystem scope** | Synthetic owned temp trees / synthetic proofs only |
| **Protected clinical corpus** | **Not accessed** |
| **Hash / digest / manifest** | **Not performed / not persisted** |
| **Catalog / Rule 5 runtime** | **Not connected** (`CATALOG_ROW_COUNT_0`, `CLI_RUNTIME_NOT_CONNECTED`) |

---

## 7. Q01–Q24 / C02–C07 preservation

Normative owner-locked Q01–Q24 answers and C02–C07 corrections recorded in the C3C **contract** document remain the governance baseline. PR #78 implementation posture was reviewed as preserving those locks (path grammar, relative handle walk, reparse/ADS/share/identity/bounded-read, redacted codes, no-paid). This evidence document does **not** rewrite Q/C normative text.

---

## 8. Fourteen-code taxonomy confirmation

Exactly **14** unique fixed failure codes under the `RULE5_WINDOWS_HANDLE_SPIKE_*` prefix remain in `src/codes.rs` (`SpikeCode::ALL` length 14). Outcomes remain the locked set: `SPIKE_CONTROL_PROVEN` / `SPIKE_CONTROL_FAILED` / `C3C_BLOCKED`.

---

## 9. Identity tuple confirmation

Frozen production identity tuple:

`(volume_serial: u64, file_id: u128, number_of_links: u32)`

Sources: `FileIdInfo` + `FileStandardInfo` (with `BY_HANDLE_FILE_INFORMATION` as supporting evidence only). Size/timestamps are never sole identity.

---

## 10. B1 correction evidence

Prior independent review blocker **B1** (FileStreamInfo flexible-array / bounds risk) was corrected on head `8eb6732…` via safe byte-slice parser `parse_file_stream_info_default_only`:

- checked arithmetic and even `StreamNameLength`
- payload bounds vs full buffer **and** current `NextEntryOffset` entry boundary
- UTF-16 via safe chunks (no unvalidated `from_raw_parts` in ADS parse)
- malformed native stream data fail-closed to redacted `AdsRejected`
- colocated synthetic in-memory regression tests (not additional mandatory proof IDs)

Real mandatory **T06** named-ADS filesystem proof remains in the mandatory suite.

---

## 11. B2 correction evidence

Prior independent review blocker **B2** (unwindable panic → stderr) was corrected on the same head:

- silent panic hook before fallible work
- `catch_unwind` covering stdin acquisition, spike operation, and JSON envelope construction
- caught panic maps only to `RULE5_WINDOWS_HANDLE_SPIKE_INTERNAL` + `SPIKE_CONTROL_FAILED`
- single best-effort stdout write; write/flush failures do not print to stderr
- guarantee limited to **unwindable** Rust panics (abort/OOM not claimed)

---

## 12. Mandatory 17-proof accounting (exact)

Do **not** interpret the following as “fresh elevated full-suite 17/17” or “fresh T03 rerun after correction.”

| Class | Evidence |
|-------|----------|
| **T03** (final symlink/reparse) | Prior owner-approved **elevated DIRECT** synthetic fixture evidence **retained**; correction pass did **not** freshly rerun T03 |
| **Other 16 mandatory proof IDs** (T01–T02, T04–T14 including T10-POS/NEG and T12-A/B/C) | **Standard-user** DIRECT/pure evidence as applicable |
| **Aggregate mandatory evidence supported** | **17/17** |
| **Committed `#[ignore]` on mandatory proofs** | **None** |
| **B1/B2 unit regressions** | Security regression tests only — **not** additional mandatory proof IDs |

---

## 13. Elevation and Developer Mode disclosure

| Fact | Record |
|------|--------|
| Elevated execution purpose | Synthetic **test-fixture** evidence for real T03 file-symlink creation (and historically one elevated full-suite delivery run) |
| Developer Mode | Remained **disabled** (not used as the privilege path for this tranche) |
| Production helper elevation | Does **not** require elevation for ordinary supported T01-class operation |
| Persistent elevation / credentials | **Not** retained by this documentation tranche |
| Registry / policy change | **Not** authorized or claimed |

---

## 14. Independent security-review result

| Token / result | Meaning |
|----------------|---------|
| **`R5_P2C3C_INDEPENDENT_SECURITY_REVIEW_PASS`** | Focused re-review closed B1/B2; no remaining blockers for owner merge consideration |
| **`EHAS2_PR78_UPDATED_HEAD_READY_FOR_OWNER_MERGE_APPROVAL`** | Pre-merge readiness on exact reviewed head `8eb6732…` |
| **Reviewed CI (correction head)** | Run `31613993886` — success on `8eb6732…` |

---

## 15. No-paid verification

**`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** remains satisfied for the merged crate: crates.io MIT/Apache graph only; no paid API/service/dependency/CI/certificate introduced by PR #78.

---

## 16. Security and leakage boundaries

Documented production/output posture (synthetic spike):

- redacted fixed codes only; no native NTSTATUS/Win32 text in stdout JSON
- no path/component/filename echo in fixed envelopes
- no PHI / protected clinical content
- no protected-source hashes or manifests
- ADS parse and panic-redaction corrections remain on `main`

---

## 17. Explicit non-claims

PR #78 and this documentation do **not** prove or authorize:

- protected-source access or execution
- production protected runner readiness
- global Windows filesystem race freedom
- universal NTFS file-ID non-reuse
- hash or digest generation of protected material
- manifest persistence
- security-access dry run or full run
- clinical correctness or prescription correctness
- Rule Engine comparison completion
- **C3D** or **C3E**
- **`ownerPrimaryVerified`** advancement
- catalog/runtime integration
- deployment
- paid service/API/dependency/CI/certificate

P2-C3C remains a **synthetic** Windows handle-hardening feasibility/control implementation, **not** the full protected-source runner.

---

## 18. Current governance status

| Token | Meaning |
|-------|---------|
| **`P2_C3C_SYNTHETIC_WINDOWS_HANDLE_HARDENING_SPIKE_IMPLEMENTATION_MERGED`** | Implementation merged to canonical `main` via PR #78 |
| **`C3C_SYNTHETIC_SPIKE_MANDATORY_EVIDENCE_17_OF_17_SUPPORTED`** | Aggregate mandatory evidence accounting **17/17** as in §12 |
| **`POST_C3C_INDEPENDENT_SECURITY_REVIEW_PASS`** | Independent security review passed on reviewed head |
| **`C3C_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTED`** | This post-merge evidence document |
| **`C3D_NOT_AUTHORIZED`** | Protected-runner implementation not authorized |
| **`C3E_NOT_AUTHORIZED`** | Security-access dry run stage not authorized |
| **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** | No protected bytes |
| **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** | No dry run |
| **`SECURITY_ACCESS_FULL_RUN_NOT_AUTHORIZED`** | No full run |
| **`BYTE_PROOF_PENDING`** | Owner corpus byte proof pending |
| **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** | Not advanced |
| **`CATALOG_ROW_COUNT_0`** | Catalog remains empty |
| **`CLI_RUNTIME_NOT_CONNECTED`** | Rule 5 runtime not connected |
| **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** | Permanent lock |

**Historical** pre-implementation contract/toolchain tokens such as `C3C_IMPLEMENTATION_NOT_AUTHORIZED` and `C3C_SYNTHETIC_SPIKE_NOT_EXECUTED` remain valid as **pre-PR #78** status in earlier documents and must not be read as current post-merge status without the supersession notes in the companion pointers.

---

## 19. C3D authorization gate

**C3D** (protected-runner implementation) and **C3E** (security-access dry run) require **separate** owner authorization tokens. PR #78 merge and this documentation do **not** open those gates.

---

## 20. STOP boundary

**Stop after post-merge implementation evidence documentation.**

Do **not**, under this authorization:

- start C3D or C3E
- access or execute against protected source
- compute hashes or persist manifests
- run security-access dry/full runs
- advance `ownerPrimaryVerified`
- populate catalog or connect CLI/runtime
- deploy
- alter Rust/Cargo/toolchain/workflows
- perform native filesystem experiments beyond already-merged synthetic spike evidence

---

## 21. Verdict

| Field | Value |
|-------|--------|
| **Verdict label** | **`C3C_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTED`** |
| **Meaning** | PR #78 synthetic spike implementation merge + B1/B2 security corrections + independent review PASS are recorded as documentation |
| **Does not imply** | C3D/C3E authorized; protected runner ready; byte proof complete; clinical correctness; `ownerPrimaryVerified` |

Evidence activation: **NONE**. Clinical validation: **0**. Runtime: **NOT_CONNECTED**. **`BYTE_PROOF_PENDING`**. **`CATALOG_ROW_COUNT_0`**.
