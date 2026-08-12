# P2-C3D — Windows Protected-Runner Implementation Contract (R5-M6B)

| Field | Value |
|-------|--------|
| **Stage** | **C3D** = protected-runner **implementation** stage |
| **This document** | Records the **C3D implementation contract only** |
| **Classification (contract tranche)** | **`C3D_DOCUMENTATION_ONLY`** (historical for this contract document) |
| **Authorization (contract tranche)** | **`R5_P2C3D_PROTECTED_RUNNER_CONTRACT_DOCUMENTATION_AUTHORIZED`** |
| **Implementation (historical contract-facing)** | **`C3D_IMPLEMENTATION_NOT_AUTHORIZED`** / **`C3D_SYNTHETIC_IMPLEMENTATION_NOT_EXECUTED`** — valid for the **contract-documentation** tranche only |
| **Status token (contract)** | **`P2_C3D_PROTECTED_RUNNER_IMPLEMENTATION_CONTRACT_DOCUMENTED`** |
| **Companion post-merge implementation evidence** | [rule-05-windows-protected-runner-implementation-evidence-R5-M6B-P2C3D.md](./rule-05-windows-protected-runner-implementation-evidence-R5-M6B-P2C3D.md) |
| **Current canonical `main` (post PR #81)** | `e9560ee2c457af2439f0b664f9f766446b636171` |
| **Cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** / **`ZERO_PAID_ROUTE_AVAILABLE`** |
| **C3E** | **`C3E_NOT_AUTHORIZED`** |
| **Protected source** | **`PROTECTED_SOURCE_DISCOVERY_NOT_AUTHORIZED`** / **`PROTECTED_SOURCE_ACCESS_NOT_AUTHORIZED`** / **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| **Security-access** | **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** / **`SECURITY_ACCESS_FULL_RUN_NOT_AUTHORIZED`** |
| **Hash / manifest** | **`NO_HASH_COMPUTATION`** / **`NO_MANIFEST_PERSISTENCE`** |
| **Byte proof** | **`BYTE_PROOF_PENDING`** |
| **`ownerPrimaryVerified`** | **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** |
| **Catalog / runtime** | **`CATALOG_ROW_COUNT_0`** / **`CLI_RUNTIME_NOT_CONNECTED`** |

**Permanent lock:** Approval of this C3D **contract** did **not** by itself authorize C3D **implementation** or C3E. A **later**, separately authorized synthetic implementation was merged via **PR #81**; see the companion post-merge implementation evidence. Protected-source bytes remain inaccessible until a separate owner **C3E** authorization after an owner-visible checkpoint immediately before access.

**Current post-merge status (supersedes stale “implementation not authorized / not executed” current-facing readings for synthetic C3D implementation only):** **`P2_C3D_SYNTHETIC_PROTECTED_RUNNER_IMPLEMENTATION_MERGED`** / **`C3D_MANDATORY_SYNTHETIC_EVIDENCE_21_OF_21_SUPPORTED`** / **`POST_C3D_INDEPENDENT_NATIVE_SECURITY_REVIEW_PASS`** / **`C3D_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTED`**. **C3E**, protected-source discovery/access/execution, dry/full run, hashing, manifest, `ownerPrimaryVerified`, catalog, and runtime remain **not** authorized.

---

## 1. Purpose and non-goals

### 1.1 Purpose

Define the exact, security-locked implementation contract for a **separate EHAS2 Windows protected-runner** component so a later, separately authorized C3D implementation can proceed without reopening settled C3A–C3C decisions.

### 1.2 Non-goals (contract tranche; protected/C3E boundaries remain)

| Forbidden / not authorized by this contract document alone | Token / note |
|---------------|--------------|
| C3D implementation via **this** contract tranche | Historical: **`C3D_IMPLEMENTATION_NOT_AUTHORIZED`** — later separately authorized and merged via PR #81; see [implementation evidence](./rule-05-windows-protected-runner-implementation-evidence-R5-M6B-P2C3D.md) |
| Synthetic C3D native execution via **this** contract tranche | Historical: **`C3D_SYNTHETIC_IMPLEMENTATION_NOT_EXECUTED`** — later executed under separate authorization (PR #81 evidence) |
| Protected-source discovery / open / read | **`PROTECTED_SOURCE_*_NOT_AUTHORIZED`** (**current**) |
| C3E dry or full security-access run | **`C3E_NOT_AUTHORIZED`** (**current**) |
| Hash / digest / byte proof | **`NO_HASH_COMPUTATION`** / **`BYTE_PROOF_PENDING`** (**current**) |
| Manifest creation or persistence | **`NO_MANIFEST_PERSISTENCE`** (**current**) |
| Catalog / CLI / runtime connection | **`CATALOG_ROW_COUNT_0`** / **`CLI_RUNTIME_NOT_CONNECTED`** (**current**) |
| `ownerPrimaryVerified` advancement | **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** (**current**) |
| Deployment / legacy project mutation | Explicit STOP (**current**) |
| Paid API / SaaS / CI / certificate / commercial native lib | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** (**current**) |

### 1.3 Authoritative inputs (preserve; do not redesign)

- [P2-C3A protected-runner architecture contract](./rule-05-windows-protected-runner-contract-R5-M6B-P2C3A.md) (P2C3-OD-01–20; §25 ladder)
- [P2-C3B synthetic orchestration contract](./rule-05-synthetic-orchestration-contract-R5-M6B-P2C3B.md)
- [P2-C3C handle-hardening spike contract](./rule-05-windows-handle-hardening-spike-contract-R5-M6B-P2C3C.md) (C3C-Q01–Q24; C3C-C02–C07)
- [P2-C3C implementation evidence](./rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md)
- [P2 byte-verification policy](./rule-05-byte-verification-policy-R5-M6B-P2.md) §25
- [Rule 5 evidence inventory](./rule-05-evidence-inventory-R5-M6.md) §15
- Especially **C3C-Q20**, **C3C-Q24**, and corrections **C3C-C02–C07**

Settled C3A–C3C decisions are **not** reopened here. C3C proves synthetic handle controls; it is **not** the protected runner (**C3C-Q24**). C3D requires this separate contract and separate implementation authorization (**C3C-Q20**).

---

## 2. Stage identity

| Stage | Authority | Bytes | Role |
|-------|-----------|-------|------|
| **C3C** | Spike namespace `RULE5_WINDOWS_HANDLE_SPIKE_*` | Synthetic temp only | Feasibility spike — **merged** (PR #78); evidence documented (PR #79) |
| **C3D** | Protected-runner namespace `RULE5_PROTECTED_RUNNER_*` (this contract) | Synthetic fixtures only during implementation/testing | Implement the **protected-runner** component — **contract only** in this tranche |
| **C3E** | Same runner + separate owner dry-run token | One owner-selected protected artifact | Security-access dry run — **not authorized** |

**Distinction (mandatory):**

- **C3C synthetic spike codes** prove feasibility; they are **not** production protected-runner outcomes.
- **C3D protected-runner codes** are the implementation/test vocabulary for the separate runner (synthetic only until C3E).
- **C3E access-run evidence** is a later, separately authorized evidence class and must not be claimed by C3D contract approval or C3D synthetic PASS.

---

## 3. C3D decision register (C3D-Q01…)

Sequential unique IDs. Each ID appears once.

| ID | Decision token | Summary |
|----|----------------|---------|
| **C3D-Q01** | **`SEPARATE_EHAS2_PROTECTED_RUNNER_COMPONENT`** | C3D implements a separate EHAS2 protected-runner component; it must not rename or automatically promote the C3C spike binary as the protected runner. |
| **C3D-Q02** | **`SOURCE_ONLY_OUT_OF_PROCESS_WINDOWS_HELPER`** | Source-only, out-of-process Windows helper; local unsigned build; no prebuilt repository binary. |
| **C3D-Q03** | **`C3D_SYNTHETIC_FIXTURES_ONLY`** | C3D implementation and testing use **synthetic fixtures only**. Real protected files are forbidden as test fixtures. |
| **C3D-Q04** | **`NO_PROTECTED_SOURCE_DISCOVERY_OPEN_OR_READ_IN_C3D`** | No protected-source discovery, opening, or byte reading in C3D. |
| **C3D-Q05** | **`NO_C3E_EXECUTION_AUTHORITY`** | C3D contract and future C3D implementation do not grant C3E execution authority. |
| **C3D-Q06** | **`NO_CLINICAL_DECISION_AUTHORITY`** | No clinical decision authority; no Rule Engine invocation; no medicine/formula/potency/dosage changes. |
| **C3D-Q07** | **`WINDOWS_11_X64_ONLY`** | Target platform: Windows 11 x64 only. |
| **C3D-Q08** | **`LOCAL_FIXED_NTFS_ONLY`** | Local fixed NTFS only; reject UNC, device namespace, GUID volume, network, and removable volume. |
| **C3D-Q09** | **`ONE_OWNER_ABSOLUTE_DRIVE_LETTER_FILE_SELECTION`** | Exactly one owner-controlled absolute drive-letter file selection per process. |
| **C3D-Q10** | **`PATH_VIA_STDIN_NOT_ARGV`** | Path supplied through stdin only — not argv, not environment, not registry. |
| **C3D-Q11** | **`NO_DIRECTORY_BATCH_GLOB_RECURSIVE_INPUT`** | No directory, batch, glob, or recursive input. |
| **C3D-Q12** | **`DO_NOT_LOG_OR_ECHO_SELECTED_PATH`** | Do not log or echo the selected path (stdout, stderr, diagnostics). |
| **C3D-Q13** | **`REUSE_C3C_SECURITY_REVIEWED_OPEN_READ_TECHNIQUES`** | Reuse security-reviewed C3C techniques: handle-relative component walk; reject parent and final reparse points; unnamed default data stream only; `NumberOfLinks === 1`; allow read sharing only; deny write/delete sharing; authoritative identity tuple; same-handle identity recheck; same-handle bounded read; max **262144** bytes; fail closed; mandatory cleanup (cleanup failure is non-success). |
| **C3D-Q14** | **`AUTHORITATIVE_IDENTITY_TUPLE`** | Authoritative identity tuple: `(volume_serial: u64, file_id: u128, number_of_links: u32)`. |
| **C3D-Q15** | **`FAIL_CLOSED_UNAVAILABLE_OR_CONTRADICTORY_CONTROL`** | Fail closed on every unavailable or contradictory control. |
| **C3D-Q16** | **`CLEANUP_FAILURE_IS_NON_SUCCESS`** | Mandatory cleanup; cleanup failure is non-success (inherits P2C3-OD-14). |
| **C3D-Q17** | **`ONE_REQUEST_PER_PROCESS`** | One request per process lifetime. |
| **C3D-Q18** | **`ONE_FIXED_REDACTED_JSON_LINE_STDOUT`** | One fixed redacted JSON line on stdout; fixed key order; empty stderr for expected failures and unwindable panics (see §6.6 limitation). |
| **C3D-Q19** | **`NO_LEAKAGE_IN_OUTPUT`** | No path, filename, bytes, content excerpt, identity tuple, native error, handle, NTSTATUS, Win32 value, size, stack, or PHI in output. |
| **C3D-Q20** | **`NO_TELEMETRY_RUNTIME_INTERNET_OR_DOWNLOAD`** | No telemetry, runtime internet, or runtime download. |
| **C3D-Q21** | **`NO_MUTABLE_TEST_SEAMS_OR_OVERRIDES`** | No mutable test seams, environment switches, dependency overrides, or exported setters that weaken production controls. |
| **C3D-Q22** | **`NO_HASH_DIGEST_OR_MANIFEST`** | No hash/digest computation; no manifest creation or persistence. |
| **C3D-Q23** | **`NO_DB_CATALOG_RUNTIME_CONNECTION`** | No database, catalog, or runtime connection. |
| **C3D-Q24** | **`NO_OWNER_PRIMARY_VERIFIED_ADVANCEMENT`** | No `ownerPrimaryVerified` advancement. |
| **C3D-Q25** | **`NO_DEPLOYMENT_OR_LEGACY_MUTATION`** | No deployment; no legacy / primary desktop project mutation. |
| **C3D-Q26** | **`ZERO_PAID_DEPENDENCY_CEILING`** | Zero-paid route and dependency ceiling per §10; any new dependency needs separate license and security review. |
| **C3D-Q27** | **`DISTINCT_PROTECTED_RUNNER_NAMESPACE`** | Use `RULE5_PROTECTED_RUNNER_*` only; do not reuse C3C spike authority or imply C3C outcomes are production outcomes. |
| **C3D-Q28** | **`CLOSED_FIFTEEN_CODE_FAILURE_TAXONOMY`** | Closed unique failure taxonomy of exactly **15** codes (§7); `message === failureCode` when an error object is defined. |
| **C3D-Q29** | **`MANDATORY_SYNTHETIC_PROOF_MATRIX_21`** | Mandatory synthetic proof matrix of exactly **21** unique proofs (§8); no optional substitute; no skip/mock PASS. |
| **C3D-Q30** | **`INDEPENDENT_NATIVE_SECURITY_REVIEW_AFTER_IMPLEMENTATION`** | After implementation, a separate independent native security review is mandatory before C3D completion claims. |
| **C3D-Q31** | **`C3D_COMPLETION_DOES_NOT_AUTHORIZE_C3E`** | C3D completion must not automatically authorize C3E. |
| **C3D-Q32** | **`FUTURE_ALLOWLIST_UNAUTHORIZED_UNTIL_OWNER_TOKEN`** | Proposed implementation allowlist (§11) is documented only; creating the crate tree or implementing code requires separate owner authorization. |
| **C3D-Q33** | **`PROVENANCE_PRESERVED_FOR_REUSED_C3C_ALGORITHMS`** | When implementation later reuses C3C-reviewed algorithms, provenance of reuse must be preserved in review evidence. |

**Register count:** C3D-Q01 through C3D-Q33 = **33** sequential unique decisions.

---

## 4. Secure open/read procedure (normative reuse of C3C techniques)

C3D **may reuse** security-reviewed C3C algorithms and invariants. C3D **must not** treat the C3C spike binary, spike namespace, or spike evidence as the protected runner or as proof of C3D completion.

### 4.1 Required controls

| Control | Requirement |
|---------|-------------|
| Walk | Handle-relative component walk |
| Reparse | Reject **parent** and **final** reparse points |
| Stream | Unnamed default data stream only |
| Links | `NumberOfLinks === 1` |
| Sharing | Allow **read** sharing only; deny **write** and **delete** sharing |
| Identity | `(volume_serial: u64, file_id: u128, number_of_links: u32)` |
| Recheck | Same-handle identity recheck before/during bounded read |
| Read | Same-handle bounded read; maximum **262144** bytes |
| Fail mode | Fail closed on unavailable or contradictory control |
| Cleanup | Mandatory; cleanup failure → non-success |

### 4.2 Selection grammar (stdin)

- One absolute Windows drive-letter path to a single file
- No UNC (`\\`), no `\\?\` device forms as accepted production selection, no GUID volume, no relative path, no multi-line batch
- Lexical rejection of reserved device names and ADS syntax in components
- Path must not be echoed

Exact parser details are implementation concerns under later authorization; this contract locks the security posture above.

---

## 5. Process and output boundary

| Rule | Value |
|------|-------|
| Requests | One request per process |
| Stdout | Exactly one JSON line |
| Stderr | Empty for expected failures and unwindable panics (see §6.6) |
| Key order | Fixed: `code`, then `outcome` |
| Forbidden fields | path, filename, bytes, excerpt, identity tuple, native error, handle, NTSTATUS, Win32, size, stack, PHI, argv, host identity |
| Network | None at runtime |
| Seams | No mutable production-weakening test seams |

---

## 6. C3D namespace and envelope

### 6.1 Proposed binary / library identity (not created in this tranche)

| Item | Proposed value | Status |
|------|----------------|--------|
| Crate path | `tools/provenance/windowsProtectedRunner/` | **Unauthorized** — do not create now |
| Package name (proposed) | `ehas2-windows-protected-runner` | Documentation only |
| Binary name (proposed) | `ehas2-windows-protected-runner` | Documentation only |
| C3C spike path | `tools/provenance/windowsHandleSpike/` | **Not** the protected runner |

### 6.2 Stdin grammar (documentation)

1. Process starts with no path on argv for selection.
2. Read **one** line from stdin (UTF-8); trim trailing CR/LF only.
3. Interpret as absolute drive-letter file path selection under §4.2.
4. Empty, multi-line, or non-conforming input → fixed input/control or invalid-selection failure (§7).
5. Do not write the path anywhere.

### 6.3 Categorical outcome vocabulary

| `outcome` | Meaning |
|-----------|---------|
| `PROCEDURE_COMPLETED` | Secure open / bounded read / cleanup procedure completed under synthetic or later-authorized policy |
| `PROCEDURE_NON_SUCCESS` | Fail-closed non-success; paired with a taxonomy `code` |

Do **not** use raw `SUCCESS` where it could imply clinical verification or byte proof.

### 6.4 Deterministic JSON envelope and key order

Success example shape (illustrative; no real path/bytes):

```json
{"code":"RULE5_PROTECTED_RUNNER_OK","outcome":"PROCEDURE_COMPLETED"}
```

Non-success example shape:

```json
{"code":"RULE5_PROTECTED_RUNNER_OVERSIZE","outcome":"PROCEDURE_NON_SUCCESS"}
```

| Rule | Value |
|------|-------|
| Keys | Exactly `code` then `outcome` |
| Types | Both strings |
| One line | Single JSON object; no pretty-print; no trailing fields |
| Error object (if used in tests) | If an error object is defined, `message === failureCode` (code string only) |

### 6.5 Fixed error namespace

Prefix: **`RULE5_PROTECTED_RUNNER_`**

Success code: **`RULE5_PROTECTED_RUNNER_OK`** (not counted in the failure taxonomy).

Failure codes: exactly the **15** constants in §7.

### 6.6 Exit-code behavior and empty-stderr guarantee

| Condition | Exit code (proposed lock) | stderr |
|-----------|---------------------------|--------|
| `PROCEDURE_COMPLETED` | `0` | empty |
| Expected `PROCEDURE_NON_SUCCESS` | non-zero fixed class (implementation may use `1`) | empty |
| Unwindable panic caught and mapped to INTERNAL | non-zero | empty (panic hook + `catch_unwind` pattern reused from C3C B2) |

**Limitation:** The empty-stderr guarantee applies to **expected** failures and **unwindable** panics handled by the documented redaction pattern. It does **not** claim that every possible abort, external kill, or non-unwindable process termination leaves stderr empty.

### 6.7 Namespace separation

| Namespace | Stage | Authority |
|-----------|-------|-----------|
| `RULE5_WINDOWS_HANDLE_SPIKE_*` | C3C | Synthetic spike only — not production runner |
| `RULE5_PROTECTED_RUNNER_*` | C3D (+ later C3E use of the runner) | Protected-runner component |
| C3E evidence labels | C3E | Separate owner-authorized access-run evidence — not claimable by C3D docs alone |

---

## 7. Failure taxonomy (exactly 15 unique codes)

Namespace prefix: **`RULE5_PROTECTED_RUNNER_`**

Each constant appears **once** in this normative table. Count = **15**. Unique count = **15**. No duplicate rows. No path/data/value embedded in code or message. No native error remapping leakage. Unknown downstream/native failures map to **`RULE5_PROTECTED_RUNNER_INTERNAL`**. Do **not** claim every `TypeError` or OS error is caller invalidity.

| # | Code constant | Category |
|---|---------------|----------|
| 1 | `RULE5_PROTECTED_RUNNER_UNSUPPORTED_PLATFORM` | unsupported platform |
| 2 | `RULE5_PROTECTED_RUNNER_INVALID_SELECTION` | invalid selection |
| 3 | `RULE5_PROTECTED_RUNNER_UNSUPPORTED_VOLUME` | unsupported volume |
| 4 | `RULE5_PROTECTED_RUNNER_UNSAFE_PATH_COMPONENT` | unsafe component |
| 5 | `RULE5_PROTECTED_RUNNER_REPARSE_REJECTED` | reparse rejection |
| 6 | `RULE5_PROTECTED_RUNNER_ADS_REJECTED` | ADS rejection |
| 7 | `RULE5_PROTECTED_RUNNER_HARDLINK_REJECTED` | hard-link rejection |
| 8 | `RULE5_PROTECTED_RUNNER_IDENTITY_UNAVAILABLE` | identity unavailable |
| 9 | `RULE5_PROTECTED_RUNNER_IDENTITY_CHANGED` | identity changed |
| 10 | `RULE5_PROTECTED_RUNNER_SHARE_POLICY_FAILED` | share-policy failure |
| 11 | `RULE5_PROTECTED_RUNNER_OVERSIZE` | oversize |
| 12 | `RULE5_PROTECTED_RUNNER_READ_FAILED` | read failure |
| 13 | `RULE5_PROTECTED_RUNNER_CLEANUP_FAILED` | cleanup failure |
| 14 | `RULE5_PROTECTED_RUNNER_INPUT_CONTROL_FAILED` | input/control failure |
| 15 | `RULE5_PROTECTED_RUNNER_INTERNAL` | internal failure |

**Mechanical justification for 15 (not 14):** C3C spike taxonomy had **14** codes and folded some stdin/control faults into invalid-selection or INTERNAL. C3D adds an explicit **`INPUT_CONTROL_FAILED`** code for stdin/control-channel failures that are not lexical path invalidity, keeping caller-invalidity claims narrow. Final unique failure-code count = **15**.

---

## 8. Synthetic implementation proof plan (not executed)

Mandatory evidence matrix for a **future** C3D implementation. This tranche does **not** execute proofs.

Rules:

- Unique IDs; mechanical mandatory count = **21**
- No optional proof may substitute for a mandatory proof
- No skip, mock, or unavailable mandatory control may produce PASS
- Privilege-dependent fixture requirements must be disclosed in implementation evidence
- Real protected files are forbidden as fixtures
- Separate independent native security review is mandatory after implementation

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
| **C3D-T12** | Retained-original coexistence identity distinction (C3C-C07 posture) |
| **C3D-T13** | Identity mismatch decision mapping → `IDENTITY_CHANGED` |
| **C3D-T14** | Cleanup failure as non-success |
| **C3D-T15** | Component-relative walk evidence |
| **C3D-T16** | Exact JSON key order and one-line output |
| **C3D-T17** | Stderr redaction for expected errors and unwindable panic |
| **C3D-T18** | Stdin-only selection (no argv path authority) |
| **C3D-T19** | No path / byte / native-value leakage |
| **C3D-T20** | No protected-source fixture or reference |
| **C3D-T21** | No hash / manifest activity |

**Mandatory count:** **21** unique IDs (C3D-T01–C3D-T21). This is **not** a copy of C3C’s 17-proof matrix; it is calculated for C3D’s protected-runner envelope, stdin-only selection, leakage, and hash/manifest non-activity proofs.

**Privilege disclosure (future evidence):** Any proof that cannot complete under standard-user rights must be labeled with the exact privilege class used (for example retained elevated DIRECT) and must not be silently skipped.

---

## 9. C3C reuse boundary

### 9.1 Allowed reuse

- Security-reviewed algorithms and invariants from C3C
- Dependency / toolchain versions already evidenced (Community VS / MSVC / SDK / rustup / Rust / `windows-sys` / `windows-link`)
- Safe ADS parsing approach (C3C B1)
- Panic redaction pattern (C3C B2)
- RAII handle ownership
- Identity comparator
- Lexical validation concepts
- Synthetic fixture techniques

### 9.2 Not automatically reusable as authority

- C3C binary / package name
- C3C error namespace (`RULE5_WINDOWS_HANDLE_SPIKE_*`)
- C3C outcome vocabulary as production runner outcomes
- C3C “synthetic spike” status as protected-runner readiness
- C3C evidence as proof of C3D completion
- Owner elevation as a routine production requirement
- Any claim of protected-source readiness

### 9.3 Provenance

Future implementation must preserve provenance notes for reused C3C code (source path / review reference) in the C3D security-review package.

---

## 10. Zero-paid and dependency ceiling

**Lock:** **`ZERO_PAID_ROUTE_AVAILABLE`** / **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`**

### 10.1 Permitted baseline (already evidenced; do not install/update in this tranche)

| Component | Evidenced ceiling |
|-----------|-------------------|
| Visual Studio | Community 2026 GA |
| MSVC | 14.51.36231 |
| Windows SDK | 10.0.26100.0 |
| rustup | 1.29.0 |
| Rust / Cargo | 1.97.1 |
| `windows-sys` | 0.61.2 |
| `windows-link` | 0.2.1 |
| Registry | crates.io only |
| Build | source-only local unsigned build |

### 10.2 Forbidden

- Paid API / SaaS / cloud
- Paid dependency or commercial native library
- Paid CI
- Paid certificate / signing requirement
- Telemetry
- Runtime download
- Alternate registry
- Git dependency
- Prebuilt repository binary

Any **new** dependency requires separate license and security review **before** use. This documentation tranche must not install, update, fetch, or resolve dependencies.

---

## 11. Implementation allowlist proposal (**unauthorized**)

Prefer a separate C3D crate under an EHAS2-only path, for example:

`tools/provenance/windowsProtectedRunner/`

**Proposed allowed entries only** (future owner implementation authorization required):

1. `Cargo.toml`
2. `Cargo.lock`
3. `rust-toolchain.toml`
4. `src/**/*.rs`
5. `tests/**/*.rs`

**Not allowed unless separately authorized:** README, workflow, install script, committed binary, `target/`, fixture corpus in-repo, manifest, JS bridge, catalog, or runtime integration.

**This tranche must not create this directory or any of the files above.**

---

## 12. C3D completion and security gates

A future C3D implementation may be considered complete **only when all** of the following hold:

1. Separate owner **implementation** authorization exists
2. Implementation stays within its allowlist
3. All **21** mandatory synthetic proofs pass directly
4. No mandatory test is ignored / skipped
5. Dependency graph and licenses remain allowed
6. No protected-source access occurs
7. Independent native security review passes
8. Review head remains unchanged through merge
9. Post-merge evidence is documented
10. Separate owner approval is issued before **C3E**

**C3D completion must not automatically authorize C3E.**

---

## 13. C3E boundary (STOP)

**C3E** is a separate owner-controlled **security-access dry run** involving **one** explicitly selected protected artifact only after:

1. C3D implementation merge
2. Full mandatory synthetic proof evidence (21/21)
3. Independent C3D native security review
4. Post-merge evidence documentation
5. Explicit owner **C3E** authorization
6. Owner-visible checkpoint immediately before access

Even C3E must **not** automatically authorize:

- hashing
- manifest persistence
- full run
- Rule Engine comparison
- catalog / runtime integration
- `ownerPrimaryVerified`
- deployment

**No protected path or artifact is identified in this contract.**

Tokens: **`C3E_NOT_AUTHORIZED`** · **`PROTECTED_SOURCE_DISCOVERY_NOT_AUTHORIZED`** · **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** · **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** · **`SECURITY_ACCESS_FULL_RUN_NOT_AUTHORIZED`**

---

## 14. Cross-document consistency (this documentation set)

Pointer-only companions updated with this tranche:

- C3A — C3D ladder / stale C3C current-pointer correction
- C3C implementation evidence — next-stage pointer
- P2 policy §25 — C3D contract-documentation status subsection
- Inventory §15 — current-main note only

C3B and C3C **normative** contracts are not rewritten.

---

## 15. STOP boundary

**Historical (contract-documentation tranche):** stop after C3D contract documentation; that tranche did **not** authorize implementation.

**Current post-merge STOP (after PR #81 + evidence documentation):** do **not**:

- start C3E
- discover / access / read protected sources
- compute hashes or create manifests
- run security-access dry/full access
- advance `ownerPrimaryVerified`
- connect catalog/runtime
- deploy
- weaken C3D-Q01–Q33 normative locks in this contract

Synthetic C3D implementation already merged under separate authorization is recorded in [rule-05-windows-protected-runner-implementation-evidence-R5-M6B-P2C3D.md](./rule-05-windows-protected-runner-implementation-evidence-R5-M6B-P2C3D.md).

---

## 16. Verdict

| Field | Value |
|-------|--------|
| **Verdict label (contract tranche)** | **`P2_C3D_PROTECTED_RUNNER_IMPLEMENTATION_CONTRACT_DOCUMENTED`** |
| **Meaning** | C3D protected-runner implementation contract documentation |
| **Current implementation evidence** | **`P2_C3D_SYNTHETIC_PROTECTED_RUNNER_IMPLEMENTATION_MERGED`** / **`C3D_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTED`** (PR #81) |
| **Does not imply** | C3E authorized; protected bytes accessible; byte proof complete; `ownerPrimaryVerified` |

**Delivery token (contract documentation PR):** **`R5_P2C3D_PROTECTED_RUNNER_CONTRACT_DOCUMENTATION_DELIVERED_FOR_REVIEW`**
