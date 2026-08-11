# Rule 5 — R5-M6B Windows protected-runner technical contract (P2-C3A)

## 1. Document control

| Field | Value |
|-------|--------|
| **Phase** | **R5-M6B Track B — P2-C3A** |
| **Classification** | **DOCUMENTATION_ONLY** / **TECHNICAL_CONTRACT_ONLY** |
| **Decision token** | **`P2_C3A_DOCUMENTATION_ONLY_WINDOWS_RUNNER_TECHNICAL_CONTRACT`** |
| **Authorization token (delivery)** | **`R5_P2C3A_WINDOWS_PROTECTED_RUNNER_TECHNICAL_CONTRACT_DOCUMENTATION_AUTHORIZED`** |
| **Authorization ceiling** | **`DOCUMENTATION_ONLY_WINDOWS_RUNNER_TECHNICAL_CONTRACT_RECORDED`** |
| **Canonical baseline (`main`)** | `c34a780c2f94af4a7870b5d504b056a126f0ee5e` |
| **Companion P2-A policy** | [rule-05-byte-verification-policy-R5-M6B-P2.md](./rule-05-byte-verification-policy-R5-M6B-P2.md) |
| **Companion P2-C1 contract** | [rule-05-protected-source-security-contract-R5-M6B-P2C1.md](./rule-05-protected-source-security-contract-R5-M6B-P2C1.md) |
| **Companion P2-C2 schema** | P2-A §25.7 — synthetic repo-safe manifest only |
| **Companion inventory** | [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md) |
| **Track B CA-1** | **EMPTY_STRUCTURAL_CONTRACT_PRESENT** — **catalog row count 0** |

This document records **Windows protected-runner architecture and security decisions only**. It performs **no** implementation, filesystem experiment, protected-source access, path discovery, hashing, manifest creation or persistence, security-access dry run, full run, or runtime connection.

---

## 2. Classification and authorization ceiling

| Boundary | Status |
|----------|--------|
| **Permitted in P2-C3A** | Technical contract documentation; P2C3-OD register; stage ladder; feasibility matrix; output category framework; provisional failure taxonomy |
| **Not authorized by P2-C3A** | Code or tests; package or fixture changes; filesystem or native feasibility experiments; native-helper selection or implementation; protected path discovery; protected-byte access; hash or digest computation; manifest creation or persistence; security-access dry run; full run; catalog population; `ownerPrimaryVerified` advancement; runtime connection |
| **Authorization ceiling** | **`DOCUMENTATION_ONLY_WINDOWS_RUNNER_TECHNICAL_CONTRACT_RECORDED`** |

P2-C3A does **not** issue implementation tokens for C3B, C3C, C3D, C3E, dry run, full run, or manifest persistence.

---

## 3. Status tokens (P2-C3A recorded)

| Token | Meaning |
|-------|---------|
| **`P2-C3A WINDOWS_PROTECTED_RUNNER_TECHNICAL_CONTRACT_DOCUMENTATION_RECORDED`** | This contract is recorded on `main` after authorized merge |
| **`PURE_NODE_PROTECTED_FILE_OPEN_NOT_AUTHORIZED`** | Pure Node.js path/open checks are **not** authorized for protected clinical bytes |
| **`NATIVE_OR_VERIFIED_OS_HANDLE_HARDENING_REQUIRED`** | Protected clinical byte access requires native or separately verified Windows OS-handle hardening |
| **`PROTECTED_RUNNER_NOT_IMPLEMENTED`** | No protected runner code exists or is authorized by P2-C3A |
| **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** | No security-access dry run is authorized by P2-C3A |
| **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** | No protected-source execution |
| **`NO_HASH_COMPUTATION`** | No hashing authorized by P2-C3A |
| **`NO_MANIFEST_PERSISTENCE`** | No manifest persistence authorized by P2-C3A |
| **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** | `ownerPrimaryVerified` remains not set / not advanced |
| **`CLI_RUNTIME_NOT_CONNECTED`** | Rule 5 runtime not connected |
| **`BYTE_PROOF_PENDING`** | Owner corpus byte proof remains pending |

---

## 4. Relationship to P2-C1, P2-C2, and P2-B3

| Tranche | Relationship |
|---------|--------------|
| **P2-C1** | P2-C3A **extends** the protected-runner ladder documented in P2-C1; P2-C1 execution authority is **unchanged** |
| **P2-C2** | Synthetic repo-safe manifest schema only — **forbidden** for protected results (**`P2_C2_SCHEMA_NON_REUSE_FOR_PROTECTED_RESULTS`**) |
| **P2-B3** | **Permanently** Linux synthetic-only — **not** extended or repurposed (**`B3_NON_REUSE_PERMANENT`**) |

P2-C3A does **not** supersede P2-C1 P2C-OD-01–19. Where P2-C3A adds runner-specific decisions, the **P2C3-OD** register in §6 applies.

---

## 5. Stage ladder (P2C3-OD-17)

No stage auto-authorizes the next. Each requires a **separate written owner authorization token** and, where specified, an **independent security review**.

| Stage | Description | Filesystem | Protected bytes | Hash | Persistence |
|-------|-------------|------------|-----------------|------|-------------|
| **C3A** | Windows protected-runner **technical contract** (this document) | **No** | **No** | **No** | **No** |
| **C3B** | Pure in-memory orchestration core — **synthetic bytes only** | **No** | **No** | Only if C3B contract explicitly authorizes **synthetic** hash tests | **No** |
| — | **Independent security review after C3B** | — | — | — | — |
| **C3C** | Windows filesystem / native **feasibility spike** — **synthetic temp files only** | **Yes** (synthetic only) | **No** | **No** (unless separately authorized for synthetic) | **No** |
| — | **Independent security review after C3C** | — | — | — | — |
| **C3D** | Protected-runner **implementation** — only after native/OS-handle decision from C3C | Future | **No** until C3E token | **No** until separately authorized | **No** |
| — | **Independent security review after C3D** | — | — | — | — |
| **C3E** | **Security-access dry run** — one exact owner-selected artifact | **Yes** | **Yes** (one file) | **No** (see §10) | **No** |

**Protected manifest builder** is **not** part of C3A–C3E (**P2C3-OD-19**).

---

## 6. P2C3-OD-01 through P2C3-OD-20 (owner-locked register)

| ID | Decision token | Summary |
|----|----------------|---------|
| **P2C3-OD-01** | **`P2_C3A_DOCUMENTATION_ONLY_WINDOWS_RUNNER_TECHNICAL_CONTRACT`** | C3A records architecture and security decisions only; no implementation, FS experiment, source access, hashing, manifest, dry/full run, or persistence |
| **P2C3-OD-02** | **`WINDOWS_PRIMARY_PROTECTED_HOST_NODE20_BASELINE`** | Protected owner source remains on owner-controlled **Windows** host; no protected copy to Linux, CI, Git, or cloud; **Node 20.x** is the assessed JavaScript baseline; this does **not** claim Node alone is sufficient |
| **P2C3-OD-03** | **`PURE_NODE_PROTECTED_FILE_OPEN_NOT_AUTHORIZED_NATIVE_OR_VERIFIED_OS_HANDLE_HARDENING_REQUIRED`** | Pure Node path checks are **insufficient** for protected clinical bytes; owner does **not** accept pure-Node TOCTOU/reparse/ADS residual for protected dry run; no protected-source runner may open real clinic data until **native or separately verified OS-handle hardening** exists; mechanism must address final no-follow, reparse/junction, ADS, file identity, and sharing/deny-write limitations; C3A does **not** select or implement a native technology; a **synthetic Windows feasibility spike (C3C)** must determine achievability; no statement of “fully race-free” unless independently proven |
| **P2C3-OD-04** | **`B3_NON_REUSE_PERMANENT`** | B3 remains **Linux synthetic-only**; cannot be repurposed by adding a marker near protected data |
| **P2C3-OD-05** | **`P2_C2_SCHEMA_NON_REUSE_FOR_PROTECTED_RESULTS`** | No conversion or widening from the synthetic P2-C2 schema to a protected manifest |
| **P2C3-OD-06** | **`SINGLE_FILE_EXPLICIT_OWNER_SELECTION_PER_TOKEN`** | Future run: one exact artifact only; no crawl/glob/discovery/default/env/registry lookup; actual path never enters Git/docs/logs; exact selection conveyed only through a future owner-controlled **local** mechanism |
| **P2C3-OD-07** | **`READ_ONLY_OFFLINE_NO_PATH_LOGGING`** | Read-only offline operation; no network, cloud, CI, telemetry, diagnostics, screenshots, or output export |
| **P2C3-OD-08** | **`FIXED_REDACTED_JSON_STDOUT_EMPTY_STDERR`** | Future runner stdout: one fixed JSON line with fixed engineering categories only; stderr **empty**; forbidden: path, filename, digest/hash, length, anchor/header, content/snippet, patient/PHI, argv, operator/host, timestamp, native error/stack |
| **P2C3-OD-09** | **`INITIAL_SECURITY_ACCESS_DRY_RUN_NO_HASH_NO_EXPECTED_DIGEST_NO_COMPARISON`** | Initial checkpoint is **`SECURITY_ACCESS_DRY_RUN`** only — secure open/read/cleanup procedure; does **not** compute hash, compare digest, perform byte proof, establish provenance, produce structural PASS, or advance `ownerPrimaryVerified` |
| **P2C3-OD-10** | **`FUTURE_DIGEST_INPUT_IN_MEMORY_OR_SECURE_PROMPT_ONLY_AFTER_FINGERPRINT_REVIEW`** | No CLI argument, environment variable, shell history, or config file in C3A/B; digest transport not implemented now; separate fingerprint/security token required later |
| **P2C3-OD-11** | **`CATEGORICAL_OUTCOMES_SEPARATED_BY_AUTHORIZATION_STAGE`** | Initial security-access dry run output limited to authorization gate, platform mechanism, secure open, bounded read, cleanup, and overall **PROCEDURE_COMPLETED** / **PROCEDURE_NON_SUCCESS**; no raw/norm MATCH/MISMATCH, structural PASS/FAIL, or encoding/byte/anchor categories until separately authorized |
| **P2C3-OD-12** | **`RULE5_PROTECTED_RUNNER_ENGINEERING_NAMESPACE`** | Separate from BV codes, B3 `RULE5_CLI_*` codes, and clinical/safety reason codes; no native or free-text details |
| **P2C3-OD-13** | **`PHI_SECURITY_POLICY_REVIEW_BEFORE_IMPLEMENTATION_AND_OWNER_ARTIFACT_CONFIRMATION_BEFORE_DRY_RUN`** | Gate 1: PHI/security policy review using synthetic data only — do not inspect protected bytes; Gate 2: before dry run owner confirms exact artifact, treats as potential PHI, separate written token — no PHI-absent or de-identification assumption |
| **P2C3-OD-14** | **`CLEANUP_FAILURE_IS_NON_SUCCESS`** | Prefer no temp files; buffers minimum lifetime; best-effort cleanup only; no forensic-erasure claim; cleanup failure blocks procedure completion; no destructive disk operation |
| **P2C3-OD-15** | **`SYNTHETIC_WINDOWS_TESTS_ONLY_NO_PROTECTED_PATHS`** | C3B/C3C tests use neutral test-created data only; no medicine, patient, clinic, or clinical text |
| **P2C3-OD-16** | **`BOUNDED_SINGLE_HANDLE_READ_EXACT_CAP_REQUIRED_BEFORE_EACH_EXECUTION_CLASS`** | No unbounded read; same opened handle only; detect growth beyond cap; C3A does not invent a protected-file cap; C3B/C3C synthetic contracts select their own test caps; future protected dry-run token must specify approved cap/size policy; file too large → fixed non-success without content or path output |
| **P2C3-OD-17** | **`SEPARATE_TOKENS_C3B_C3C_C3D_C3E`** | See §5 stage ladder; no stage auto-authorizes the next |
| **P2C3-OD-18** | **`CHECKPOINT_1_BEFORE_SECURITY_ACCESS_DRY_RUN_UNCHANGED`** | Owner approval required after runner/security review and **before** any protected byte is opened (extends P2C-OD-13 / P2C-OD-17) |
| **P2C3-OD-19** | **`NO_MANIFEST_PERSISTENCE_THROUGH_C3`** | No protected-local manifest schema or persistence in C3A–C3E unless separately redefined and authorized after security review |
| **P2C3-OD-20** | **`INDEPENDENT_SECURITY_REVIEW_BEFORE_EACH_PROTECTED_BYTE_STAGE`** | Reviews required after C3B, after C3C, after C3D, and immediately before C3E; no protected bytes before applicable reviews pass |

---

## 7. Platform posture (P2C3-OD-02)

| Zone | Platform | P2-C3A status |
|------|----------|---------------|
| Protected owner data (expected) | Owner-controlled **Windows** host | Documented only — **no access** |
| Merged B3 synthetic tooling | **Linux-only** | **Unchanged** — permanently synthetic-only |
| CI / GitHub runners | **Synthetic fixtures only** | Never protected corpus |
| Node baseline | **Node 20.x** assessed | **Not sufficient alone** for protected clinical open |

---

## 8. Pure Node vs native / verified OS-handle hardening (P2C3-OD-03)

| Rule | Detail |
|------|--------|
| Pure Node protected open | **`PURE_NODE_PROTECTED_FILE_OPEN_NOT_AUTHORIZED`** |
| Required before protected clinical bytes | **`NATIVE_OR_VERIFIED_OS_HANDLE_HARDENING_REQUIRED`** |
| Owner TOCTOU/reparse/ADS residual | **Not accepted** for protected clinical bytes |
| C3A native technology | **Not selected** — C3C feasibility spike determines achievability |
| “Fully race-free” claim | **Forbidden** unless independently proven |

### 8.1 Windows feasibility matrix (honest assessment — no protected reads performed)

Classification keys: **RELIABLE** · **PARTIAL** · **UNAVAILABLE** · **REQUIRES_NATIVE_HELPER** · **OWNER_RESIDUAL_ACCEPTANCE_REQUIRED**

| Control | Classification | Disposition for protected clinical bytes |
|---------|----------------|----------------------------------------|
| Open one owner-supplied path read-only (plain Node) | **RELIABLE** (synthetic C3C only) | **Not authorized** for protected clinical open without hardening |
| Final-component no-follow open | **UNAVAILABLE** (Node on Windows) | **Blocker** until native/verified mechanism |
| Symlink / junction / reparse detection | **PARTIAL** | **Blocker** until verified mechanism |
| Parent-component reparse walk | **PARTIAL** + TOCTOU | **Blocker** |
| Hard-link rejection | **PARTIAL** | Must be addressed by hardened mechanism |
| File identity before/after open | **PARTIAL** on Windows | Must be addressed by hardened mechanism |
| Canonical path containment | **PARTIAL** | Must be addressed by hardened mechanism |
| UNC / device path rejection | **PARTIAL** | Required; not sufficient alone |
| ADS rejection | **UNAVAILABLE** / **REQUIRES_NATIVE_HELPER** | **Blocker** in pure Node |
| Bounded read from same handle | **RELIABLE** (once safe open exists) | Required (**P2C3-OD-16**) |
| Growth beyond cap detection | **PARTIAL** | Non-success if exceeded |
| Sharing / deny-write modes | **PARTIAL** | Native/verified mechanism must define |
| TOCTOU / cloud-sync / Defender interference | **OWNER_RESIDUAL_ACCEPTANCE_REQUIRED** | Owner **does not accept** residual acceptance for protected clinical bytes — **blocker** until replaced or new owner decision |

**Conclusion:** Pure Node is adequate for **documenting limits** and **synthetic C3C feasibility experiments** only. Protected clinical byte access requires **native or verified OS-handle hardening** proven through C3C before C3D/C3E.

---

## 9. Architecture separation (documentation only — no modules created)

Future layers remain **separate**. P2-C3A creates **no** code.

| Layer | Role | C3A status |
|-------|------|------------|
| 1 | Authorization / orchestration core | Document only |
| 2 | Windows / **native protected-file adapter** | **Not authorized** until C3C→C3D |
| 3 | In-memory pipeline (inspect / parse / compare on bytes) | Reuse **per-stage authorization** only |
| 4 | Fixed outcome mapper (one JSON stdout line) | Document category sets per stage |
| 5 | Cleanup controller | Document fail-closed rules |

### 9.1 B3 permanent non-reuse (P2C3-OD-04)

Merged B3 (`verifySyntheticCli.mjs`, `readSyntheticInput.mjs`) is **permanently**:

- **Linux-only** full execution
- **Synthetic-only** — confined `--root` with marker interlock
- **Parser-only**
- **Forbidden** extension for protected-source reads or Windows protected host

### 9.2 P2-C2 schema non-reuse (P2C3-OD-05)

`tools/provenance/manifestSchema.mjs` (P2-C2) is **synthetic repo-safe only**:

- `trustZone: CI_SYNTHETIC_ONLY`
- `protectedSourceAccessed: false` (literal)
- `ownerPrimaryVerified: false` (literal)

No conversion or widening to a protected-local manifest envelope.

### 9.3 Conditional reuse of existing pure functions

Reuse requires **separate authorization per stage**. P2-C3A does **not** authorize reuse.

| Function (module) | C3B | C3C | C3D / C3E |
|-------------------|-----|-----|-----------|
| `computeSha256V1`, `inspectByteCharacteristics`, compare helpers (`verifyCore.mjs`) | Synthetic only if C3B authorizes | Generally **not** in C3C FS spike | Only after separate comparison authorization |
| `parseSyntheticStructureFromBytes`, `compareSyntheticStructure` | **Not** unless C3B contract says so | **Not** in C3C | Later inspection tranche only |
| `validateSyntheticManifest` (`manifestSchema.mjs`) | **No** | **No** | **No** for protected results |

**Prohibited imports (future):** protected runner must **not** import B3 CLI/adapter; B3 must **not** import protected-runner modules; protected outcomes must **not** serialize through P2-C2 schema.

---

## 10. Security-access dry run (P2C3-OD-09, 11, 18)

**Term:** **`SECURITY_ACCESS_DRY_RUN`** — distinct from byte-verification dry run or historical P2-A §23 “P2-C protected dry run” execution.

| Permitted at C3E (initial checkpoint) | Forbidden at C3E (initial checkpoint) |
|---------------------------------------|---------------------------------------|
| Authorized secure **open** procedure | Hash computation |
| **Bounded read** from same handle | Expected digest comparison |
| **Cleanup** verification | Byte proof / provenance establishment |
| Fixed categorical outcomes (§11) | Structural PASS/FAIL |
| **PROCEDURE_COMPLETED** / **PROCEDURE_NON_SUCCESS** overall | Encoding / byte / anchor output categories |
| | `ownerPrimaryVerified` advancement |

**Checkpoint 1 (P2C3-OD-18):** Owner written approval after C3D and security reviews, **before** any protected byte is opened.

---

## 11. Output categories by authorization stage (P2C3-OD-11)

### 11.1 C3E security-access dry run — allowed future categories

- Authorization gate: **resolved** / **unresolved**
- Platform security mechanism: **available** / **unavailable**
- Secure source open: **completed** / **non-success**
- Bounded read: **completed** / **non-success**
- Cleanup: **completed** / **non-success**
- Overall: **`PROCEDURE_COMPLETED`** / **`PROCEDURE_NON_SUCCESS`**

Avoid **`SUCCESS`** where it could imply verification completed.

### 11.2 Not authorized at C3E initial checkpoint

- Raw / normalized **MATCH** / **MISMATCH**
- Structural **PASS** / **FAIL**
- Encoding / byte / anchor categories
- Any digest, length, path, filename, or content-derived field

Later comparison/inspection authorization is a **separate tranche** (P2C3-OD-10, P2C3-OD-11).

---

## 12. PHI and cleanup gates (P2C3-OD-13, 14)

### 12.1 Gate A — Before implementation (C3B onward)

- Review PHI/security handling **policy** using **synthetic data only**
- **Do not** inspect protected bytes during policy review

### 12.2 Gate B — Before security-access dry run (C3E)

- Owner explicitly confirms **exact single artifact**
- Treat artifact as **potential PHI**
- Separate written token required
- **No** PHI-absent assumption
- **No** de-identification claim

### 12.3 Cleanup contract

| Rule | Detail |
|------|--------|
| Default | Prefer **no** temp files — in-memory buffers |
| If temp authorized | Owner-controlled location; minimum necessary lifetime |
| Delete | Best-effort immediate delete only |
| Claims | **No** forensic-erasure claim |
| Failure | **`CLEANUP_NON_SUCCESS`** blocks **PROCEDURE_COMPLETED** |
| Disk | **No** destructive disk operation |

---

## 13. Failure namespace framework (P2C3-OD-12 — provisional)

**Prefix (future):** `RULE5_PROTECTED_RUNNER_*`

Implementation code strings remain **provisional** until **C3C feasibility results** report what native-helper outcomes are achievable. P2-C3A records **categories only**.

| Category | Purpose |
|----------|---------|
| **Authorization** | Token/stage gate failures |
| **Platform / security mechanism** | Native helper unavailable or error |
| **Source selection** | Pre-open validation failure (no path in message) |
| **Unsafe link / reparse / ADS / hard link** | Fail-closed open rejection |
| **File identity / change** | Identity or TOCTOU during read |
| **Bounded read** | Cap exceeded or read non-success |
| **PHI gate** | Manual review or owner artifact confirmation unresolved |
| **Cleanup** | Buffer/temp lifecycle non-success |
| **Comparison not authorized** | Caller or stage requested disallowed comparison/hash/structure output |
| **Internal** | Unexpected failure — fixed code only |

**Rules:** Do **not** reuse BV clinical codes for filesystem/PHI/cleanup failures. Do **not** reuse B3 `RULE5_CLI_*` codes without explicit review. No native messages, paths, filenames, digests, lengths, stacks, or PHI in any channel.

---

## 14. Explicit non-claims

P2-C3A does **not** claim:

- Protected runner implemented or ready
- Security-access dry run authorized
- Pure Node protected open is safe for clinic data
- Native helper selected or proven
- Byte proof complete or digest computed
- PHI absent or de-identified
- `ownerPrimaryVerified` for any medicine
- Manifest file exists or may be persisted through C3
- Catalog rows added or runtime connected
- FG/CQ closure

---

## 15. STOP boundary

**Stop after P2-C3A documentation merge.** Do **not** proceed without separate owner authorization for:

- **C3B** in-memory orchestration implementation
- **C3C** Windows synthetic filesystem / native feasibility spike
- **C3D** protected-runner implementation
- **C3E** security-access dry run on protected bytes
- Hash computation, digest comparison, structural assessment on protected corpus
- Manifest persistence or protected-local schema
- Catalog population, runtime connection, or `ownerPrimaryVerified` advancement

---

## 16. Verdict

| Field | Value |
|-------|--------|
| **Verdict label** | **`R5_P2C3A_WINDOWS_PROTECTED_RUNNER_TECHNICAL_CONTRACT_DOCUMENTATION_RECORDED`** |
| **Meaning** | Windows protected-runner technical contract documentation only |
| **Does not imply** | Runner implemented; dry run authorized; byte proof complete; manifest ready; owner-primary verified |

**Delivery token (for authorized documentation PR):** **`R5_P2C3A_WINDOWS_PROTECTED_RUNNER_TECHNICAL_CONTRACT_DOCUMENTATION_DELIVERED_FOR_REVIEW`**
