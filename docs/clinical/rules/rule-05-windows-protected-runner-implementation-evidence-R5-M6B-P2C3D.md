# Rule 5 — R5-M6B P2-C3D synthetic Windows protected-runner implementation evidence (post-merge)

## 1. Document control

| Field | Value |
|-------|--------|
| **Phase** | **R5-M6B Track B — P2-C3D** |
| **Classification** | **DOCUMENTATION_ONLY** (post-merge implementation evidence) |
| **Authorization token (this documentation)** | **`R5_P2C3D_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_AUTHORIZED`** |
| **Independent native security-review token** | **`R5_P2C3D_INDEPENDENT_NATIVE_SECURITY_REVIEW_PASS`** |
| **Owner merge readiness token (pre-merge)** | **`EHAS2_PR81_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR81_OWNER_MERGE_AUTHORIZED`** (executed) |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |
| **Canonical `origin/main` (post PR #81)** | `e9560ee2c457af2439f0b664f9f766446b636171` |
| **Companion C3D contract** | [rule-05-windows-protected-runner-implementation-contract-R5-M6B-P2C3D.md](./rule-05-windows-protected-runner-implementation-contract-R5-M6B-P2C3D.md) |
| **Companion C3A architecture** | [rule-05-windows-protected-runner-contract-R5-M6B-P2C3A.md](./rule-05-windows-protected-runner-contract-R5-M6B-P2C3A.md) |
| **Companion C3C spike evidence** | [rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md) |
| **Companion P2-A policy** | [rule-05-byte-verification-policy-R5-M6B-P2.md](./rule-05-byte-verification-policy-R5-M6B-P2.md) |
| **Companion inventory** | [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md) |

This document records **post-merge** evidence that the P2-C3D synthetic Windows protected-runner **implementation** was merged to canonical `main` via PR #81, independently native-security-reviewed, and remains bounded as a **synthetic-fixtures-only** out-of-process helper.

It does **not** authorize C3E, protected-source discovery/access/execution, hashing, manifest persistence, catalog/runtime integration, deployment, or clinical validation.

---

## 2. Canonical identity

| Item | Value |
|------|--------|
| **Repository** | `bakalwar/EH_AROGYA_SUTRA_2` |
| **Merge commit (`origin/main`)** | `e9560ee2c457af2439f0b664f9f766446b636171` |
| **Merge parent 1 (pre-merge `main`)** | `7561d61be800d7220d33390f17b2be28bcf6da6a` |
| **Merge parent 2 (reviewed PR head)** | `03f232e3edf52c45017891af1ba83283541f39d7` |
| **Reviewed-head tree == merge tree** | `278fbee25dcfa86f952a55839045a96f32730652` |
| **Merge style** | Normal merge commit (not squash/rebase) |

---

## 3. PR #81 identity

| Item | Value |
|------|--------|
| **PR** | [#81](https://github.com/bakalwar/EH_AROGYA_SUTRA_2/pull/81) |
| **Branch** | `feat/p2-c3d-windows-protected-runner` |
| **State** | **MERGED** |
| **Reviewed / merged head** | `03f232e3edf52c45017891af1ba83283541f39d7` |
| **Linear implementation commits on PR** | Exactly **one** |
| **Independent native security review** | **`R5_P2C3D_INDEPENDENT_NATIVE_SECURITY_REVIEW_PASS`** |
| **Owner merge readiness (pre-merge)** | **`EHAS2_PR81_READY_FOR_OWNER_MERGE_APPROVAL`** |
| **Owner merge authorization** | **`EHAS2_PR81_OWNER_MERGE_AUTHORIZED`** |

---

## 4. Exact implementation scope

All tracked implementation content under `tools/provenance/windowsProtectedRunner/` (exactly **14** paths; cumulative base..reviewed-head **+2096/−0**):

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
12. `src/stdin_channel.rs`
13. `src/volume.rs`
14. `tests/mandatory_proofs.rs`

| Boundary | Record |
|----------|--------|
| **Binary name** | `ehas2-windows-protected-runner` |
| **Crate name** | `ehas2_windows_protected_runner` |
| **C3C spike tree** | `tools/provenance/windowsHandleSpike/` **unchanged** by PR #81 |
| **Docs / workflows / README / install scripts** | **Not** in PR #81 |
| **Committed `target/` / exe / dll / pdb** | **None** |
| **Protected fixtures / manifests / JS-TS / catalog / runtime / DB** | **None** |

---

## 5. Architecture and C3C separation

| Boundary | Status |
|----------|--------|
| **Helper form** | Separate out-of-process Rust binary + library under `tools/provenance/windowsProtectedRunner/` |
| **Not a rename of C3C spike** | Distinct component and **`RULE5_PROTECTED_RUNNER_*`** namespace (C3D-Q01 / Q27) |
| **C3C reuse** | Security-reviewed algorithms reused with provenance comments (C3D-Q13 / Q33); spike authority not promoted |
| **Input** | One UTF-8 absolute drive-letter path on **stdin** only (not argv/env/registry) |
| **Output** | Exactly one JSON line (`code` then `outcome`) + LF; stderr empty for expected failures and unwindable-panic redaction |
| **Filesystem scope** | Synthetic owned temp trees / synthetic proofs only |
| **Protected clinical corpus** | **Not accessed** |
| **Hash / digest / manifest** | **Not performed / not persisted** |
| **Catalog / Rule 5 runtime** | **Not connected** (`CATALOG_ROW_COUNT_0`, `CLI_RUNTIME_NOT_CONNECTED`) |

---

## 6. Q01–Q33 status

Normative C3D-Q01–Q33 remain in the companion **contract** document. Post-merge implementation evidence status:

| Class | Decisions |
|-------|-----------|
| **Implemented / enforced on `main`** | Q01–Q04, Q07–Q22, Q26–Q29, Q33 (component, stdin selection, Win11/NTFS, open/read controls, envelope, taxonomy, 21 proofs, no-paid, provenance) |
| **Prohibition enforced / unchanged** | Q05–Q06, Q23–Q25, Q31 (no C3E/clinical/DB/OPV/deploy; C3D completion ≠ C3E) |
| **Review / documentation gates** | Q30 satisfied by independent native security review; Q32 allowlist tree created under separate implementation authorization and merged via PR #81 |

This evidence document does **not** rewrite or weaken Q-register normative text.

---

## 7. Secure native procedure

Documented production posture on the merged crate:

- Windows 11 x64 gate; local fixed NTFS only
- Handle-relative single-component walk after volume-root open
- Parent and final reparse rejection
- Unnamed default data stream only (safe B1 ADS parser)
- `NumberOfLinks === 1` (hard-link rejection)
- Read sharing allowed; write/delete sharing denied structurally
- Authoritative identity tuple: `(volume_serial: u64, file_id: u128, number_of_links: u32)`
- Same-handle bounded read; maximum accepted bytes **262144**
- Same-handle post-read identity recheck → `IDENTITY_CHANGED` on mismatch
- Mandatory cleanup; cleanup failure is non-success (taxonomy + T14; see §12 residuals)
- No bytes/content/hash returned or persisted in the fixed envelope

---

## 8. Fifteen-code taxonomy

Exactly **15** unique fixed failure codes under `RULE5_PROTECTED_RUNNER_*` in `RunnerCode::ALL`. Success code **`RULE5_PROTECTED_RUNNER_OK`** is **outside** the failure set.

Failure set (exact):

1. `RULE5_PROTECTED_RUNNER_UNSUPPORTED_PLATFORM`
2. `RULE5_PROTECTED_RUNNER_INVALID_SELECTION`
3. `RULE5_PROTECTED_RUNNER_UNSUPPORTED_VOLUME`
4. `RULE5_PROTECTED_RUNNER_UNSAFE_PATH_COMPONENT`
5. `RULE5_PROTECTED_RUNNER_REPARSE_REJECTED`
6. `RULE5_PROTECTED_RUNNER_ADS_REJECTED`
7. `RULE5_PROTECTED_RUNNER_HARDLINK_REJECTED`
8. `RULE5_PROTECTED_RUNNER_IDENTITY_UNAVAILABLE`
9. `RULE5_PROTECTED_RUNNER_IDENTITY_CHANGED`
10. `RULE5_PROTECTED_RUNNER_SHARE_POLICY_FAILED`
11. `RULE5_PROTECTED_RUNNER_OVERSIZE`
12. `RULE5_PROTECTED_RUNNER_READ_FAILED`
13. `RULE5_PROTECTED_RUNNER_CLEANUP_FAILED`
14. `RULE5_PROTECTED_RUNNER_INPUT_CONTROL_FAILED`
15. `RULE5_PROTECTED_RUNNER_INTERNAL`

Outcomes: `PROCEDURE_COMPLETED` / `PROCEDURE_NON_SUCCESS`. When an error object is defined, `message === failureCode`. No C3C spike codes leak into C3D.

---

## 9. T01–T21 evidence

Mandatory synthetic proofs **C3D-T01–T21** are present in `tests/mandatory_proofs.rs` (exactly **21** unique IDs). Committed **`#[ignore]`** count: **0**.

| ID | Mandatory synthetic proof |
|----|---------------------------|
| **C3D-T01** | Valid regular-file procedure (`PROCEDURE_COMPLETED`) |
| **C3D-T02** | Oversize rejection |
| **C3D-T03** | Final reparse rejection |
| **C3D-T04** | Parent reparse rejection |
| **C3D-T05** | Hard-link rejection |
| **C3D-T06** | ADS rejection |
| **C3D-T07** | UNC / device / reserved-name lexical rejection |
| **C3D-T08** | Fixed NTFS positive classification |
| **C3D-T09** | Deterministic negative volume classification |
| **C3D-T10** | Share denial (write/delete share posture) |
| **C3D-T11** | Same-handle identity stability |
| **C3D-T12** | Retained-original coexistence identity distinction |
| **C3D-T13** | Identity mismatch decision mapping → `IDENTITY_CHANGED` |
| **C3D-T14** | Cleanup failure as non-success |
| **C3D-T15** | Component-relative walk evidence |
| **C3D-T16** | Exact JSON key order and one-line output |
| **C3D-T17** | Stderr redaction for expected errors and unwindable panic |
| **C3D-T18** | Stdin-only selection (no argv path authority) |
| **C3D-T19** | No path / byte / native-value leakage |
| **C3D-T20** | No protected-source fixture or reference |
| **C3D-T21** | No hash / manifest activity |

B1 ADS malformed-buffer unit regressions and B2 panic-redaction unit tests are security regressions — **not** additional mandatory proof IDs.

---

## 10. Privilege / elevation accounting

Do **not** claim all 21 freshly passed as standard user.

| Class | Evidence |
|-------|----------|
| **T03** (final file symlink / reparse) | Fresh owner-approved **elevated DIRECT** synthetic fixture evidence |
| **T01–T02 and T04–T21** | Fresh **standard-user** DIRECT/pure evidence as applicable |
| **Full elevated suite (delivery)** | **21** passed, **0** failed, **0** ignored |
| **Independent standard-user security review** | **20** passed; **T03** command-filtered only (`--skip c3d_t03_…`) because symlink privilege was unavailable |
| **Aggregate mandatory evidence supported** | **21/21** |
| **Committed skip / `#[ignore]`** | **None** |
| **Developer Mode** | Remained **disabled** |
| **Persistent elevation** | **Not** retained |
| **Production runner elevation** | Does **not** require routine elevation |

---

## 11. Independent security review

| Token / result | Meaning |
|----------------|---------|
| **`R5_P2C3D_INDEPENDENT_NATIVE_SECURITY_REVIEW_PASS`** | Independent native security review found **no blockers** on exact head `03f232e3…` |
| **`EHAS2_PR81_READY_FOR_OWNER_MERGE_APPROVAL`** | Pre-merge readiness on exact reviewed head |
| **Reviewed CI** | Run **`31631462857`** — **success** on `03f232e3edf52c45017891af1ba83283541f39d7` |

The review did **not** perform protected-source access, hashing, manifest work, or C3E.

---

## 12. Honest residual disclosures (NON_BLOCKING)

These reviewed **NON_BLOCKING** facts are preserved; they are **not** blockers and were **not** “fixed” by this documentation:

1. **`SharePolicyFailed`** is in the closed taxonomy but is not directly returned by the present production mapping; share posture is enforced structurally (`FILE_SHARE_READ` only). T10 proves write-open denial externally.
2. Cleanup taxonomy/test proves cleanup non-success (**T14**), but `OwnedHandle::drop` cannot report a `CloseHandle` failure into `CleanupFailed`.
3. Empty stream name is treated as the default unnamed stream in the OS-sourced ADS buffer (alongside `::$DATA` / `:$DATA`).
4. Abort / OOM remains outside unwindable-panic protection (honest limitation).
5. Write-share denial has direct evidence; delete-share denial is structurally enforced (`FILE_SHARE_DELETE` unset) but not separately asserted.

---

## 13. Toolchain / dependency / license evidence

| Lock | Recorded value |
|------|----------------|
| **rust-toolchain.toml** | channel **1.97.1**; target **`x86_64-pc-windows-msvc`**; profile **minimal** |
| **Direct production dependency** | `windows-sys = "=0.61.2"` (`default-features = false`; documented Win32/Wdk feature set only) |
| **Resolved graph** | local crate → **windows-sys 0.61.2** → **windows-link 0.2.1** |
| **Registry** | crates.io only (`registry+https://github.com/rust-lang/crates.io-index`) |
| **Checksums** | Present in `Cargo.lock` |
| **Licenses (declared)** | MIT OR Apache-2.0 |
| **Build form** | Source-only local unsigned build; no prebuilt repository binary |
| **Paid dependency / paid CI / paid certificate** | **Rejected** |

---

## 14. No-paid / security boundary

**`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** remains satisfied for the merged crate.

Additional permanent boundaries recorded for this stage:

- **`NO_HASH_COMPUTATION`**
- **`NO_MANIFEST_PERSISTENCE`**
- **`BYTE_PROOF_PENDING`**
- **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`**
- **`CATALOG_ROW_COUNT_0`**
- **`CLI_RUNTIME_NOT_CONNECTED`**
- **`PROTECTED_SOURCE_DISCOVERY_NOT_AUTHORIZED`**
- **`PROTECTED_SOURCE_ACCESS_NOT_AUTHORIZED`**
- **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`**
- **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`**
- **`SECURITY_ACCESS_FULL_RUN_NOT_AUTHORIZED`**
- **`C3E_NOT_AUTHORIZED`**

---

## 15. Explicit non-claims

PR #81 and this documentation do **not** prove or authorize:

- protected-source discovery, access, or execution
- C3E security-access dry run or full run
- hash / digest generation of protected material
- manifest creation or persistence
- Rule Engine comparison / clinical correctness
- **`ownerPrimaryVerified`** advancement
- catalog/runtime integration
- deployment
- global Windows filesystem race freedom
- universal NTFS file-ID non-reuse
- paid service/API/dependency/CI/certificate

C3D remains a **synthetic** protected-runner implementation stage. It is **not** C3E.

---

## 16. Current governance status

| Token | Meaning |
|-------|---------|
| **`P2_C3D_SYNTHETIC_PROTECTED_RUNNER_IMPLEMENTATION_MERGED`** | Implementation merged to canonical `main` via PR #81 |
| **`C3D_MANDATORY_SYNTHETIC_EVIDENCE_21_OF_21_SUPPORTED`** | Aggregate mandatory evidence accounting **21/21** as in §9–§10 |
| **`POST_C3D_INDEPENDENT_NATIVE_SECURITY_REVIEW_PASS`** | Independent native security review passed on reviewed head |
| **`C3D_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTED`** | This post-merge evidence document |
| **`C3E_NOT_AUTHORIZED`** | Security-access dry run stage not authorized |
| **`PROTECTED_SOURCE_DISCOVERY_NOT_AUTHORIZED`** | No discovery |
| **`PROTECTED_SOURCE_ACCESS_NOT_AUTHORIZED`** | No access |
| **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** | No execution |
| **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** | No dry run |
| **`SECURITY_ACCESS_FULL_RUN_NOT_AUTHORIZED`** | No full run |
| **`NO_HASH_COMPUTATION`** | No hash |
| **`NO_MANIFEST_PERSISTENCE`** | No manifest |
| **`BYTE_PROOF_PENDING`** | Owner corpus byte proof pending |
| **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** | Not advanced |
| **`CATALOG_ROW_COUNT_0`** | Catalog remains empty |
| **`CLI_RUNTIME_NOT_CONNECTED`** | Rule 5 runtime not connected |
| **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** | Permanent lock |

**Historical** contract-stage tokens such as `C3D_IMPLEMENTATION_NOT_AUTHORIZED`, `C3D_SYNTHETIC_IMPLEMENTATION_NOT_EXECUTED`, and `C3D_DOCUMENTATION_ONLY` remain valid as **pre-PR #81 / contract-documentation-tranche** status and must not be read as current post-merge implementation status without the supersession notes in companion pointers.

---

## 17. C3E checkpoint

**C3D merge and this evidence documentation do not authorize C3E.**

C3E requires, at minimum:

- separate explicit owner authorization
- one owner-selected protected artifact
- owner-visible checkpoint immediately before access
- no automatic discovery
- no directory / bulk / recursive access

Even a future C3E authorization does **not** automatically authorize hashing, manifest persistence, full run, Rule Engine comparison, **`ownerPrimaryVerified`**, catalog/runtime connection, or deployment.

This document does **not** name or discover any protected path or artifact.

---

## 18. STOP

**Stop after post-merge implementation evidence documentation.**

Do **not**, under this authorization:

- implement or re-implement C3D
- start C3E
- discover / access / read protected sources
- compute hashes or persist manifests
- advance `ownerPrimaryVerified`
- connect catalog/runtime or deploy
- alter Rust/Cargo/toolchain/workflows
- mark this documentation PR Ready or merge without owner process

---

## 19. Verdict

| Field | Value |
|-------|--------|
| **Verdict label** | **`C3D_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTED`** |
| **Meaning** | PR #81 synthetic protected-runner implementation merge + independent native security review PASS are recorded as documentation |
| **Does not imply** | C3E authorized; protected source accessible; byte proof complete; clinical correctness; `ownerPrimaryVerified` |

Evidence activation: **NONE**. Clinical validation: **0**. Runtime: **NOT_CONNECTED**. **`BYTE_PROOF_PENDING`**. **`CATALOG_ROW_COUNT_0`**.

**Delivery token (documentation PR):** **`R5_P2C3D_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTATION_DELIVERED_FOR_REVIEW`**
