# Rule 5 — R5-M6B Windows handle-hardening synthetic spike contract (P2-C3C)

## 1. Document control

| Field | Value |
|-------|--------|
| **Phase** | **R5-M6B Track B — P2-C3C** |
| **Classification** | **DOCUMENTATION_ONLY** |
| **Decision register** | **C3C-Q01–Q24** (owner-locked) |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |
| **Contract corrections** | **C3C-C02** through **C3C-C07** |
| **Authorization token (delivery)** | **`R5_P2C3C_WINDOWS_HANDLE_HARDENING_SPIKE_CONTRACT_DOCUMENTATION_AUTHORIZED`** |
| **Authorization ceiling** | **`P2-C3C WINDOWS_HANDLE_HARDENING_SPIKE_CONTRACT_DOCUMENTATION_RECORDED`** |
| **Canonical baseline (`main`)** | `69834fce940789a0a55d6ec6deb7148f8d92daf1` |
| **Companion P2-A policy** | [rule-05-byte-verification-policy-R5-M6B-P2.md](./rule-05-byte-verification-policy-R5-M6B-P2.md) |
| **Companion P2-C3A contract** | [rule-05-windows-protected-runner-contract-R5-M6B-P2C3A.md](./rule-05-windows-protected-runner-contract-R5-M6B-P2C3A.md) |
| **Companion P2-C3B contract** | [rule-05-synthetic-orchestration-contract-R5-M6B-P2C3B.md](./rule-05-synthetic-orchestration-contract-R5-M6B-P2C3B.md) |
| **Companion inventory** | [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md) |
| **Companion zero-paid toolchain evidence** | [rule-05-windows-handle-hardening-spike-zero-paid-toolchain-license-evidence-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-zero-paid-toolchain-license-evidence-R5-M6B-P2C3C.md) |
| **Track B CA-1** | **EMPTY_STRUCTURAL_CONTRACT_PRESENT** — **catalog row count 0** |

This document records the **final P2-C3C Windows handle-hardening synthetic spike contract** only. It performs **no** Rust or native implementation, toolchain installation, compilation, binary generation, filesystem or native API experiment, Windows spike execution, protected-source discovery or access, hashing, manifest creation or persistence, security-access dry run, full run, catalog population, or runtime connection.

**C3C success is not claimed.** Current state: **contract documentation recorded only.**

---

## 2. Classification and authorization ceiling

| Boundary | Status |
|----------|--------|
| **Permitted in P2-C3C documentation** | Contract recording; Q01–Q24 register; C02–C07 corrections; 17-proof register; 14-code taxonomy; license/no-paid posture; STOP gates |
| **Not authorized by P2-C3C documentation** | Rust/native implementation; toolchain install; compilation; spike execution; C3D/C3E; protected-source access; hashing; manifest persistence; dry/full run; `ownerPrimaryVerified` advancement; catalog/runtime; paid API/service/CI/dependency/certificate |
| **Authorization ceiling** | **`P2-C3C WINDOWS_HANDLE_HARDENING_SPIKE_CONTRACT_DOCUMENTATION_RECORDED`** |

P2-C3C documentation does **not** authorize implementation or the next P2C3 stage.

---

## 3. Required governance status

| Token | Meaning |
|-------|---------|
| **`P2-C3C WINDOWS_HANDLE_HARDENING_SPIKE_CONTRACT_DOCUMENTATION_RECORDED`** | This contract is recorded as documentation only |
| **`DOCUMENTATION_ONLY`** | No implementation in this tranche |
| **`C3C_IMPLEMENTATION_NOT_AUTHORIZED`** | Rust helper, toolchain, compile, and spike code are **not** authorized |
| **`C3C_SYNTHETIC_SPIKE_NOT_EXECUTED`** | No Windows filesystem/native spike has been run |
| **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** | No protected bytes |
| **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** | No dry run |
| **`NO_HASH_COMPUTATION`** | No digest computation or comparison |
| **`NO_MANIFEST_PERSISTENCE`** | No manifest write or persistence |
| **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** | `ownerPrimaryVerified` not set / not advanced |
| **`BYTE_PROOF_PENDING`** | Owner corpus byte proof pending |
| **`CATALOG_ROW_COUNT_0`** | Catalog row count remains **0** |
| **`CLI_RUNTIME_NOT_CONNECTED`** | Rule 5 runtime not connected |
| **`C3D_NOT_AUTHORIZED`** | Protected-runner implementation not authorized |
| **`C3E_NOT_AUTHORIZED`** | Security-access dry run not authorized |
| **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** | Permanent global cost lock |

---

## 4. Global no-paid lock

**Token:** **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`**

Normative meaning:

1. No paid API.
2. No metered/per-call API.
3. No paid cloud service.
4. No paid proprietary SDK/library/dependency.
5. No paid-only CI runner.
6. No paid artifact/signing service.
7. No paid Authenticode certificate requirement.
8. No runtime subscription or license server.
9. No telemetry/SaaS dependency.
10. No fallback from a free component to a paid service.

If any future required component is paid-only, the stage is **BLOCKED**. Do not silently replace it with another paid product.

---

## 5. Contract corrections C3C-C02 through C3C-C07

These corrections are **normative**. They supersede earlier draft wording where they conflict.

| ID | Correction | Locked result |
|----|------------|---------------|
| **C3C-C02** | Duplicate `RULE5_WINDOWS_HANDLE_SPIKE_CLEANUP_FAILED` row | Exactly **14** unique codes; each listed **once** (§11) |
| **C3C-C03** | Mandatory T10 depended on unavailable removable hardware | Split into **T10-POS** and **T10-NEG**; no skip of mandatory proofs (Q15/Q18) |
| **C3C-C04** | T12 implied pathname replacement mutates same-handle identity | Split into **T12-A / T12-B / T12-C** |
| **C3C-C05** | Mandatory proof count stated as 16 | Mechanical total is **17** |
| **C3C-C06** | T12 assumed rename/replacement while production handle open (conflicts with Q11 deny-delete sharing) | T12-A proves denial while open; replacement is **post-close** only |
| **C3C-C07** | T12-B “post-close replacement” could delete-and-recreate and depend on file-ID reuse | **Retained-original** rename; original and replacement **coexist** during comparison |

---

## 6. Locked C3C-Q01–Q24 register

| ID | Lock token | Recorded contract |
|----|------------|-------------------|
| **C3C-Q01** | **`OUT_OF_PROCESS_RUST_WINDOWS_HELPER_SYNTHETIC_SPIKE_ONLY`** | One standalone **out-of-process Rust helper** for the **future** C3C synthetic spike only. No competing C++/.NET/Node-API production architectures. Does **not** authorize C3D or protected-source use. |
| **C3C-Q02** | **`DOCUMENTED_MICROSOFT_WINDOWS_APIS_ONLY`** | Documented Win32 and documented Microsoft Winternl (`NtCreateFile`, `OBJECT_ATTRIBUTES`) only, plus generated Rust bindings of those APIs. No undocumented NT fields, reverse-engineered syscalls, hard-coded syscall numbers, kernel/filter drivers, hooking, or undocumented-behavior guarantees. |
| **C3C-Q03** | **`OUT_OF_PROCESS_HELPER_ONLY_NO_NATIVE_ADDON`** | **No Node-API addon.** Helper owns path parsing, directory/file handles, metadata checks, and reads. Returns only fixed redacted results. Never returns raw HANDLE values. Never prints paths or native messages. Stderr empty. No network/telemetry. No runtime dependency download. Do not pass paths through argv, environment, shell, logs, or stdout/stderr. |
| **C3C-Q04** | **`MANDATORY_HANDLE_RELATIVE_COMPONENT_WALK`** | Full-path pathname-only `CreateFileW` is insufficient. Trusted volume/root anchor; every parent opened relative to the already-verified parent handle; each component checked before advancing; reparse/junction/mount-point components rejected; final file opened relative to verified parent; no parent pathname re-resolved after its handle is accepted; same final HANDLE used for metadata verification and bounded read. Candidate: `NtCreateFile` + `OBJECT_ATTRIBUTES.RootDirectory` + **`OBJ_DONT_REPARSE`** + per-component verification. If official/runtime evidence contradicts this design, C3C fails. No owner residual acceptance. |
| **C3C-Q05** | **`SUPPORTED_WINDOWS_11_X64_ONLY`** | **Windows 11 x64 only.** Windows 10, Windows on ARM, and Windows Server are out of C3C v1. Exact edition/version/build is recorded at implementation time after lifecycle verification. Unsupported/EOL OS → `UNSUPPORTED_PLATFORM`. |
| **C3C-Q06** | **`LOCAL_FIXED_NTFS_ONLY`** | Owner-controlled **local fixed NTFS** synthetic tree only. No UNC, mapped network, removable, optical, RAM disk, WebDAV, cloud/remote, ReFS/FAT/exFAT, volume mount-point traversal, or cloud placeholder/reparse-backed source. |
| **C3C-Q07** | **`STRICT_DRIVE_LETTER_ABSOLUTE_SELECTION_INTERNAL_HANDLE_RELATIVE_WALK`** | External grammar: one exact absolute **drive-letter** path only. No relative path, UNC, `\\?\`, `\\.`, GLOBALROOT, volume-GUID/device namespace, forward-slash ambiguity, repeated separators, `.` or `..`, trailing dot/space, reserved DOS names, wildcard/glob, environment expansion, registry/default/discovery, colon except the drive separator, empty component, or path logging/persistence. Lexical validation is supplementary; security authority is the handle-relative walk. |
| **C3C-Q08** | **`REJECT_ALL_REPARSE_COMPONENTS_AND_FINAL_REPARSE_FILES`** | Reject every reparse parent and final component: symbolic links, junctions, mount points, cloud placeholders, unknown reparse tags, any reparse attribute/tag. No “safe” reparse-tag allowlist in C3C v1. |
| **C3C-Q09** | **`DEFAULT_UNNAMED_DATA_STREAM_ONLY`** | Reject ADS syntax lexically. After opening the final HANDLE, use a documented handle-authoritative stream-information API (for example `GetFileInformationByHandleEx(FileStreamInfo)`) and verify **unnamed default stream only**. Do not rely only on pathname-based `FindFirstStreamW`. If a documented reliable handle-based ADS check cannot be proven on the target Windows 11/NTFS host, the mandatory control fails and C3C cannot advance to C3D. |
| **C3C-Q10** | **`NUMBER_OF_LINKS_EXACTLY_ONE`** | Handle metadata must show **`NumberOfLinks === 1`**. Any other value or inability to obtain authoritative link count is fail-closed. |
| **C3C-Q11** | **`ALLOW_READ_SHARE_ONLY_DENY_WRITE_AND_DELETE_SHARE`** | Final open: read sharing **allowed**; write sharing **denied**; delete sharing **denied**. Verify in the synthetic spike. Do **not** claim this blocks kernel filters, antivirus, or every external actor. |
| **C3C-Q12** | **`IDENTITY_MECHANISM_MUST_BE_PROVEN_BY_SPIKE`** | Preferred identity: volume serial + 128-bit FileId + link count. `FILE_ID_INFO` desktop authority is **not** pre-locked. C3C must test `FileIdInfo` on the supported Windows 11 host, also collect `BY_HANDLE_FILE_INFORMATION`, and freeze the authoritative tuple **only** from successful documented synthetic evidence. No automatic fallback authority. Size/timestamps are not sole identity. If stable handle identity cannot be proven, C3C fails. |
| **C3C-Q13** | **`C3C_SYNTHETIC_MAX_BYTES_262144`** | Maximum synthetic test file: **262144** bytes. Read ceiling: **262145** bytes. If more than 262144 bytes are observed → `OVERSIZE`. Checked arithmetic. **No hash.** |
| **C3C-Q14** | **`FIXED_REDACTED_RULE5_WINDOWS_HANDLE_SPIKE_NAMESPACE`** | Fixed redacted one-line JSON stdout; stderr empty. Codes use `RULE5_WINDOWS_HANDLE_SPIKE_*` only (§11). Output must not include path, filename, component, handle, identity value, native message, NTSTATUS/Win32 value, size, bytes, stack, or PHI. |
| **C3C-Q15** | **`NO_SKIPPED_MANDATORY_SECURITY_CONTROLS`** | Neutral synthetic files only. Critical reparse/junction/hardlink/ADS tests must execute on at least one owner-controlled supported Windows 11 x64 NTFS environment. If Developer Mode or elevation is required: document the exact prerequisite; use it only on the isolated synthetic host/tree; do not skip or weaken the control. GitHub-hosted CI does not replace the mandatory owner-controlled Windows proof. If a mandatory test cannot run, C3C remains incomplete. |
| **C3C-Q16** | **`RUST_STABLE_PINNED_PLUS_MICROSOFT_WINDOWS_BINDINGS`** | Future implementation may use pinned stable Rust, minimal `windows-sys` or `windows` features, committed `Cargo.lock`, audits, isolated checked unsafe wrappers, and clippy/rustfmt/test gates. **No Node-API addon.** License proof is required before implementation authorization. |
| **C3C-Q17** | **`NO_PAID_SIGNING_C3C_UNSIGNED_LOCAL_SPIKE_ONLY`** | Future spike binary: built locally from reviewed source; synthetic tests only; not distributed as protected runner; no paid Authenticode; no paid signing service; no committed prebuilt executable; no runtime binary download. |
| **C3C-Q18** | **`ALL_MANDATORY_CONTROLS_PROVEN_OR_C3C_FAILS`** | C3C passes only if every mandatory control is supported by documented APIs, exercised on supported Windows 11 x64 NTFS, deterministically tested with synthetic data, independently security-reviewed, and recorded without residual-acceptance language. PARTIAL, UNAVAILABLE, UNDOCUMENTED, skipped, or `OWNER_RESIDUAL_ACCEPTANCE_REQUIRED` on any mandatory control → **`C3C_BLOCKED`**. A generic “global race-free” claim is **not** required or permitted. |
| **C3C-Q19** | **`OWN_SYNTHETIC_TEMP_ROOT_CLEANUP_FAILURE_NON_SUCCESS`** | Spike may create/delete only its own verified synthetic temp root. No protected location. No broad recursive target. Validate exact temp root before deletion. Close handles before cleanup. Cleanup failure → non-success (`CLEANUP_FAILED`). No forensic-erasure claim. |
| **C3C-Q20** | **`SEPARATE_POST_C3C_SECURITY_REVIEW_AND_OWNER_TOKEN_REQUIRED`** | Even after a successful future spike: no automatic C3D; no protected runner; no protected source; no dry run. C3D requires merged C3C implementation, exact post-merge evidence, independent security review, owner acceptance, separate C3D contract, and separate C3D authorization. |
| **C3C-Q21** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** | Same as GLOBAL. Every dependency/tool classified per §15. License-unresolved dependency blocks implementation authorization. |
| **C3C-Q22** | **`OFFLINE_RUNTIME_NO_TELEMETRY_NO_RUNTIME_DOWNLOAD`** | Helper and tests: no network request, telemetry, update check, runtime download, license server, cloud storage, or remote logging. |
| **C3C-Q23** | **`SOURCE_ONLY_REPOSITORY_NO_PREBUILT_BINARY`** | Commit source and lockfiles only. Do not commit EXE/DLL/PDB, native build output, generated temp artifacts, signing keys/certificates, real paths, or runtime output. |
| **C3C-Q24** | **`SYNTHETIC_FEASIBILITY_SPIKE_NOT_PROTECTED_RUNNER`** | C3C proves Windows-handle controls on a **neutral synthetic tree** only. It does not reuse C3B for protected analysis, parse/compare bytes clinically, hash, create a manifest, access protected source, establish byte proof, advance `ownerPrimaryVerified`, authorize C3D/C3E, or connect runtime/catalog. |

---

## 7. Official-source evidence reconciliation

| Owner lock | Documented Microsoft boundary | Status |
|------------|-------------------------------|--------|
| Q04 handle-relative walk | `NtCreateFile`; `OBJECT_ATTRIBUTES.RootDirectory` | Design lock — must be spike-proven |
| Q04 `OBJ_DONT_REPARSE` | `OBJECT_ATTRIBUTES` flags | Design lock — must be spike-proven |
| Q08 final reparse | `CreateFileW` reparse-point open flags as supporting evidence; parent protection requires Q04 | Design lock |
| Q09 handle ADS | `GetFileInformationByHandleEx` / `FileStreamInfo` | Must be spike-proven; failure blocks C3D |
| Q10 link count | `FILE_STANDARD_INFO` / handle metadata | `NumberOfLinks === 1` |
| Q12 FileId | `FILE_ID_INFO` and `GetFileInformationByHandle` / `BY_HANDLE_FILE_INFORMATION` | Tuple **not** frozen until spike evidence |
| Q06 drive type | `GetDriveTypeW` (classifier; supplementary to handle proof) | T10-NEG maps unsupported types to `UNSUPPORTED_VOLUME` |
| Q07 path grammar | Windows file-naming rules (lexical supplement only) | Drive-letter external grammar |

Every security-critical API used in a future implementation must have an official Microsoft source citation **and** a runtime synthetic proof. This documentation tranche cites the **documented Microsoft Windows API boundary** only; it does not execute those APIs.

---

## 8. Documented handle procedure (design lock — not implementation)

Future implementation only. Not authorized by this document.

1. **Platform gate** — Windows 11 x64 + current updates; else `UNSUPPORTED_PLATFORM`.
2. **Lexical gate (Q07)** — external drive-letter path only; else `INVALID_SELECTION` / `UNSAFE_PATH_COMPONENT`.
3. **Volume gate (Q06)** — local fixed NTFS; else `UNSUPPORTED_VOLUME`.
4. **Volume/root anchor** — obtain a trusted volume/root directory handle. Do not treat a full-path `CreateFileW` as sole authority.
5. **Per-component walk** — for each parent then the final component: `NtCreateFile` with `OBJECT_ATTRIBUTES.RootDirectory` set to the already-verified parent handle; **single-component** name; **`OBJ_DONT_REPARSE`**. Reparse → `REPARSE_REJECTED`. Advance only with an accepted directory handle. Do not re-resolve a parent pathname after its handle is accepted.
6. **Final file open** — relative to the verified parent; Q11 share flags; existing regular file only.
7. **Post-open handle checks** — file type; `NumberOfLinks === 1`; unnamed default stream only; no reparse; identity snapshot per Q12.
8. **Bounded read** — **same** production handle; read ceiling 262145; observed length > 262144 → `OVERSIZE`; re-query identity on the same handle → mismatch → `IDENTITY_CHANGED`.
9. **Emit** — one fixed redacted JSON line on stdout; stderr empty; frozen codes only.
10. **Cleanup** — close handles; delete only the owned synthetic root after validation; failure → `CLEANUP_FAILED` (non-success).

Production reading must **never** close and reopen by pathname.

---

## 9. Path, volume, reparse, ADS, hardlink, and share rules

| Domain | Rule |
|--------|------|
| **External path** | Drive-letter absolute form only; no UNC / `\\?\` / `\\.\` / GUID / GLOBALROOT |
| **Volume** | Owner-controlled local **fixed NTFS** synthetic tree only |
| **Reparse** | Reject **every** reparse parent and final component |
| **ADS** | Lexical reject plus handle-authoritative unnamed-default-stream-only validation |
| **Hard link** | `NumberOfLinks === 1` |
| **Share** | Read sharing allowed; write/delete sharing denied |
| **Cap** | Max **262144** bytes; read ceiling **262145** |
| **Output** | No path, filename, component, handle, identity value, native message, NTSTATUS/Win32 value, size, bytes, stack, or PHI |

---

## 10. Identity proof plan

| Step | Action |
|------|--------|
| 1 | On owner Windows 11 x64 fixed NTFS: prove `FileIdInfo` on a synthetic regular file |
| 2 | Collect `BY_HANDLE_FILE_INFORMATION` as compatibility evidence |
| 3 | Record candidate fields (volume serial, 128-bit FileId / file index, link count) from the handle |
| 4 | Freeze the authoritative tuple **only** from successful documented synthetic evidence (Q12) |
| 5 | **T12-A:** same-handle pre/post-read identity stability; rename/delete **denied** while the production handle remains open (Q11) |
| 6 | **T12-B:** after close, **retain** the original by rename to a sibling pathname (**do not delete**); create a new regular file at the original pathname; open via the documented handle-relative procedure; require a **different** identity tuple while **both** files coexist |
| 7 | **T12-C:** pure comparator → `IDENTITY_CHANGED` on synthetic mismatch |
| 8 | During-read re-check on the **same open handle:** stable tuple → continue; comparator-detected mismatch on re-query → `IDENTITY_CHANGED` |

**Explicit non-claim:** this contract does **not** claim that NTFS file IDs are never reusable after deletion. T12-B proves only that pathname reopening can resolve to a **distinct live file object** while the original remains present.

Size and timestamps are supporting only — never sole identity. If the required T12-B rename/create procedure cannot be completed on the owner-controlled NTFS synthetic tree, T12-B is **not proven** and C3C remains **blocked**.

---

## 11. Error taxonomy (exactly 14 unique constants)

Namespace prefix: **`RULE5_WINDOWS_HANDLE_SPIKE_`**

Each constant appears **once**. Count = **14**. Unique count = **14**. No extra code.

| Code constant | Use |
|---------------|-----|
| `RULE5_WINDOWS_HANDLE_SPIKE_UNSUPPORTED_PLATFORM` | Q05 platform gate |
| `RULE5_WINDOWS_HANDLE_SPIKE_INVALID_SELECTION` | Q07 lexical selection |
| `RULE5_WINDOWS_HANDLE_SPIKE_UNSUPPORTED_VOLUME` | Q06 / T10-NEG classifier |
| `RULE5_WINDOWS_HANDLE_SPIKE_UNSAFE_PATH_COMPONENT` | Q07 unsafe component |
| `RULE5_WINDOWS_HANDLE_SPIKE_REPARSE_REJECTED` | Q08 |
| `RULE5_WINDOWS_HANDLE_SPIKE_ADS_REJECTED` | Q09 |
| `RULE5_WINDOWS_HANDLE_SPIKE_HARDLINK_REJECTED` | Q10 |
| `RULE5_WINDOWS_HANDLE_SPIKE_IDENTITY_UNAVAILABLE` | Q12 identity not obtainable |
| `RULE5_WINDOWS_HANDLE_SPIKE_IDENTITY_CHANGED` | Q12 / T12-C mismatch |
| `RULE5_WINDOWS_HANDLE_SPIKE_SHARE_POLICY_FAILED` | Q11 |
| `RULE5_WINDOWS_HANDLE_SPIKE_OVERSIZE` | Q13 |
| `RULE5_WINDOWS_HANDLE_SPIKE_READ_FAILED` | Bounded read failure |
| `RULE5_WINDOWS_HANDLE_SPIKE_CLEANUP_FAILED` | Q19 / T12-B / T13 cleanup non-success |
| `RULE5_WINDOWS_HANDLE_SPIKE_INTERNAL` | Unexpected internal failure |

Stdout: one fixed redacted JSON line containing only frozen outcome/code fields. Stderr: empty.

---

## 12. Threat model

### In-scope (mandatory documented handle-procedure controls)

- Malicious or mistaken path grammar (UNC, device namespace, ADS syntax, reserved names, `..`, trailing dot/space)
- Final-component symlink/reparse substitution if opened without the handle-relative procedure
- Parent-component junction/symlink/mount reparse via pathname re-resolution → mitigated by the handle-relative component walk
- Hard links (`NumberOfLinks ≠ 1`)
- Named ADS on the final file
- Non-local / non-fixed / non-NTFS volume selection
- Oversize file (observed length > 262144)
- Identity change on the same handle between verify and read (detection)
- Write/delete share posture verification (synthetic contention)
- Cleanup failure on the owned synthetic temp root

### Out-of-threat-model (explicit environmental limitations — **not** owner residual acceptance)

- Kernel-mode actors, filter drivers, antivirus, backup agents
- Hardware/storage faults
- Physical access / compromised OS kernel
- Concurrent readers (write/delete share denied per Q11; this does not block all external actors)
- A **global race-free** filesystem claim — **explicitly forbidden**

C3C’s future success claim is limited to: **documented handle-relative procedure proven on synthetic Windows 11 x64 NTFS under the stated threat model.** All mandatory controls are required. Residual acceptance is not permitted.

---

## 13. Deterministic proof register

### Mechanical count (mandatory = 17)

| Group | IDs | Count |
|-------|-----|------:|
| Core synthetic reads / lexical / reparse / ADS / hardlink | T01, T02, T03, T04, T05, T06, T07, T08, T09 | **9** |
| Volume policy | T10-POS, T10-NEG | **2** |
| Share policy | T11 | **1** |
| Identity | T12-A, T12-B, T12-C | **3** |
| Cleanup + procedure evidence | T13, T14 | **2** |
| **Total mandatory proofs** | | **17** |

**ID uniqueness:** T01–T09, T10-POS, T10-NEG, T11, T12-A, T12-B, T12-C, T13, T14 — **17 distinct IDs**, none omitted, none duplicated.

T15–T17 **must never** substitute for a mandatory proof.

### Mandatory matrix

| # | Test | Class |
|---|------|-------|
| T01 | Regular file read ≤ cap | **Mandatory** |
| T02 | Oversize > 262144 B | **Mandatory** |
| T03 | Final symlink/reparse | **Mandatory** |
| T04 | Parent junction/reparse | **Mandatory** |
| T05 | Hard link | **Mandatory** |
| T06 | Named ADS | **Mandatory** |
| T07 | UNC lexical reject | **Mandatory** |
| T08 | Device namespace lexical reject | **Mandatory** |
| T09 | Reserved DOS name | **Mandatory** |
| T10-POS | Fixed NTFS positive (owner Windows 11 x64) | **Mandatory** |
| T10-NEG | Volume classifier negatives → `UNSUPPORTED_VOLUME` | **Mandatory** |
| T11 | Write/delete share denial | **Mandatory** |
| T12-A | Same-handle stability + rename/delete denied while open | **Mandatory** |
| T12-B | Post-close retained-original pathname replacement: original renamed and kept live; new file created at original pathname; new-handle tuple differs; no delete-and-recreate | **Mandatory** |
| T12-C | Comparator → `IDENTITY_CHANGED` | **Mandatory** |
| T13 | Cleanup failure → non-success | **Mandatory** |
| T14 | Component-walk procedure evidence | **Mandatory** |
| T15 | Optional Node pipe IPC | Optional |
| T16 | Optional free-tier Windows CI smoke | Optional |
| T17 | Supplementary real removable/network hardware observation | Supplementary |

### T10

**T10-POS — Real supported owner-controlled Windows 11 x64 fixed NTFS positive proof (mandatory)**

Prove the documented handle-relative procedure on a real owner-controlled Windows 11 x64 **fixed NTFS** synthetic tree.

**T10-NEG — Pure deterministic volume classifier (mandatory)**

The classifier **must** reject each of the following and map **all** of them to `RULE5_WINDOWS_HANDLE_SPIKE_UNSUPPORTED_VOLUME`:

- `DRIVE_REMOVABLE`
- `DRIVE_REMOTE`
- `DRIVE_CDROM`
- `DRIVE_RAMDISK`
- `DRIVE_UNKNOWN`
- `DRIVE_NO_ROOT_DIR`
- non-NTFS

T10-NEG does **not** require real removable or network hardware. T17 may observe real hardware **supplementarily** and must not replace T10-NEG.

### T11

**T11 — Write/delete share denial (mandatory)**

Under Q11, a controlled second-handle write or delete attempt fails or is blocked by share mode. T11 does not substitute for T12-A.

### T12

**T12-A — Same-handle stability and share-denial proof (mandatory)**

1. Open the synthetic file using the documented production handle-relative procedure and Q11 share flags.
2. Capture the authoritative identity tuple.
3. Perform the bounded read from the **same** handle.
4. Re-query the **same** handle after read.
5. Require pre-read and post-read identity tuples to remain **identical**.
6. While the original handle remains open, make a controlled second-handle/process rename or delete attempt within the owned synthetic tree.
7. Require that mutation attempt to be **denied** because delete sharing was not granted.
8. Do **not** expect or claim that pathname replacement succeeds while the production handle is open.
9. No paths, identity values, native errors, handles, or filesystem details may be emitted.

**T12-B — Post-close retained-original pathname replacement distinction (mandatory)**

1. Preserve the original authoritative identity tuple in test memory.
2. Close the original production handle normally.
3. Do **not** delete the original file.
4. Rename the original file to a separate retained sibling pathname inside the same owned synthetic test directory.
5. Keep that renamed original file present for the **entire** comparison.
6. Create a **new regular file** at the original pathname.
7. Open the new file using the documented handle-relative procedure.
8. Require the new handle’s authoritative identity tuple to **differ** from the captured original tuple.
9. The retained original prevents the proof from depending on deletion followed by possible file-ID reuse.
10. This is **test-only** evidence. Production reading must **never** close and reopen by pathname.
11. No path, filename, identity tuple, native error, handle, file data, or filesystem detail may be emitted.
12. Close all handles and clean up **both** files and the owned synthetic root.
13. Any cleanup failure maps to `RULE5_WINDOWS_HANDLE_SPIKE_CLEANUP_FAILED` and is **non-success**.

Clarifications:

- This proof does **not** claim file IDs are never reusable after deletion.
- It proves **only** that pathname reopening can resolve to a distinct live file object.
- Original and replacement **must coexist** during identity comparison.
- If the required rename/create procedure cannot be completed on the owner-controlled NTFS synthetic tree, T12-B is **not proven** and C3C remains **blocked**.
- T12-B remains **one** mandatory proof; total mandatory proof count stays **17**.

**T12-C — Deterministic IDENTITY_CHANGED decision mapping (mandatory)**

1. Exercise an internal pure immutable identity-comparison function through the production decision path.
2. Equal tuples → continue.
3. Unequal tuples → `RULE5_WINDOWS_HANDLE_SPIKE_IDENTITY_CHANGED`.
4. Use synthetic tuple values only.
5. No exported setter, mutable test seam, environment switch, dependency override, global registry, or native-value leakage.

### T13 / T14

- **T13:** induced cleanup failure → `RULE5_WINDOWS_HANDLE_SPIKE_CLEANUP_FAILED` (non-success).
- **T14:** component-walk procedure evidence that relative single-component opens were used rather than a sole full-path open.

### Optional / supplementary (never mandatory substitutes)

- **T15:** optional Node anonymous-pipe IPC (no path leakage).
- **T16:** optional GitHub Actions Windows smoke — **`OPTIONAL_SUPPLEMENTARY_FREE_TIER_ONLY`**; must not incur paid usage; must not become mandatory proof infrastructure.
- **T17:** supplementary observation of real removable/network hardware; does not replace T10-NEG.

---

## 14. Pass / fail criteria

C3C **implementation/spike success is not claimed** by this document.

A future C3C spike pass requires all **17 mandatory proofs**, including:

- [ ] T10-POS: owner-controlled Windows 11 x64 fixed NTFS positive proof
- [ ] T10-NEG: classifier rejects the locked drive-type/non-NTFS set → `UNSUPPORTED_VOLUME`
- [ ] T11: Q11 share denial evidenced
- [ ] T12-A: pre/post-read same-handle identity stable; rename/delete **denied** while handle open
- [ ] T12-B: original file **not deleted**; renamed retained original and replacement **coexist** during comparison; new-handle tuple **differs**; proof does **not** depend on file-ID reuse after deletion; test-only (production must never close and reopen by pathname); cleanup of **both** files + owned synthetic root is mandatory; cleanup failure → `RULE5_WINDOWS_HANDLE_SPIKE_CLEANUP_FAILED`
- [ ] T12-C: synthetic tuple mismatch → `IDENTITY_CHANGED`
- [ ] No claim that pathname replacement occurs while the production handle is open
- [ ] If T12-B rename/create cannot be completed on the owner-controlled NTFS synthetic tree, T12-B is **not proven** and C3C **fails**
- [ ] Independent security review PASS
- [ ] No residual-acceptance language for any mandatory control
- [ ] No paid API/service/dependency/certificate

Any PARTIAL / UNAVAILABLE / UNDOCUMENTED / skipped mandatory control → **`C3C_BLOCKED`**.

---

## 15. License and no-paid gate

Authoritative zero-paid toolchain / license evidence reconciliation (historical pre-install completed vs pending; 17-row decision table) and current post-install installed-version evidence are recorded in:

[rule-05-windows-handle-hardening-spike-zero-paid-toolchain-license-evidence-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-zero-paid-toolchain-license-evidence-R5-M6B-P2C3C.md)

**Status:** **`P2-C3C ZERO_PAID_TOOLCHAIN_LICENSE_EVIDENCE_DOCUMENTATION_RECORDED`** (historical pre-install) / **`P2-C3C ZERO_PAID_LOCAL_TOOLCHAIN_POST_INSTALL_EVIDENCE_RECORDED`** / **`OWNER_ACCEPTED_INSTALLED_COMMUNITY_ROUTE_EVIDENCED`** / **`ZERO_PAID_LOCAL_TOOLCHAIN_INSTALLED_VERIFIED`** / **`EXACT_MSVC_VERSION_RECORDED`** / **`EXACT_WINDOWS_SDK_VERSION_RECORDED`** / **`EXACT_RUSTUP_VERSION_RECORDED`** / **`EXACT_RUSTC_CARGO_FINGERPRINTS_RECORDED`** / **`CARGO_DEPENDENCY_RESOLUTION_PENDING`** / **`CARGO_LOCK_RESOLUTION_PENDING`** / **`C3C_IMPLEMENTATION_NOT_AUTHORIZED`** / **`C3C_SYNTHETIC_SPIKE_NOT_EXECUTED`** / **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`**.

Do **not** claim legal approval, Cargo resolution, compilation, or C3C success from this contract. License-unresolved or paid-only required components **block implementation authorization**. GitHub Actions / workflow paths are **excluded** from C3C v1.

---

## 16. Future implementation allowlist (not authorized)

The following paths are recorded for a **later** implementation token only. This documentation tranche **must not** add them:

1. `tools/provenance/windowsHandleSpike/Cargo.toml`
2. `tools/provenance/windowsHandleSpike/Cargo.lock`
3. `tools/provenance/windowsHandleSpike/rust-toolchain.toml`
4. `tools/provenance/windowsHandleSpike/src/**/*.rs`
5. `tools/provenance/windowsHandleSpike/tests/**/*.rs`

Exactly **five** entries. No README, workflow, GitHub Actions, prebuilt binary, or install scripts in this allowlist.

**Forbidden now and in C3C implementation unless separately authorized:** Node-API addon, committed `.exe`, protected paths, hash/manifest modules, C3B reuse for filesystem proof, catalog/runtime/DB, C3D/C3E.

---

## 17. Explicit non-claims

This document does **not** claim or authorize:

- C3C implementation, compilation, or spike execution
- C3C success
- C3D or C3E
- Native-helper selection as a completed proof
- Windows filesystem safety for protected clinical bytes
- Protected-source access or byte-proof completion
- Hashing, digest comparison, or manifest construction/persistence
- Security-access dry run or full run
- Global race-free filesystem behavior
- NTFS file-ID non-reuse after deletion
- `ownerPrimaryVerified` advancement
- Catalog population or runtime connection
- Paid API, paid service, paid CI, paid dependency, or paid certificate
- Legal/toolchain approval of Rust, `windows-sys`/`windows`, MSVC, or Windows SDK

---

## 18. STOP boundary

**Stop after P2-C3C contract documentation.** Do **not** proceed without a **separate** owner implementation token for:

- Rust helper implementation, toolchain installation, compilation, or binary generation
- Windows synthetic filesystem / native feasibility spike execution
- **C3D** protected-runner implementation — **`C3D_NOT_AUTHORIZED`**
- **C3E** security-access dry run — **`C3E_NOT_AUTHORIZED`**
- Hash computation, digest comparison, or structural assessment on protected corpus
- Manifest persistence or protected-local schema
- Catalog population, runtime connection, or `ownerPrimaryVerified` advancement

---

## 19. Verdict

| Field | Value |
|-------|--------|
| **Verdict label** | **`P2-C3C WINDOWS_HANDLE_HARDENING_SPIKE_CONTRACT_DOCUMENTATION_RECORDED`** |
| **Meaning** | Windows handle-hardening synthetic spike **contract documentation only** |
| **Does not imply** | Spike executed; helper implemented; C3C success; C3D/C3E authorized; byte proof complete; owner-primary verified |

Evidence activation: **NONE**. Clinical validation: **0**. Runtime: **NOT_IMPLEMENTED** / **NOT_CONNECTED**. **`BYTE_PROOF_PENDING`**. **`CATALOG_ROW_COUNT_0`**.
