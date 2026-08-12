# Rule 5 — R5-M6B P2-C3C zero-paid toolchain / license evidence

## 1. Document control

| Field | Value |
|-------|--------|
| **Phase** | **R5-M6B Track B — P2-C3C** |
| **Classification** | **DOCUMENTATION_ONLY** |
| **Current authorization token** | **`R5_P2C3C_ZERO_PAID_LOCAL_TOOLCHAIN_POST_INSTALL_EVIDENCE_DOCUMENTATION_AUTHORIZED`** |
| **Evidence input token** | **`R5_P2C3C_ZERO_PAID_LOCAL_TOOLCHAIN_POST_INSTALL_VERIFIED_AND_READY_FOR_EVIDENCE_DOCUMENTATION`** |
| **Authorization ceiling (current)** | **`P2-C3C ZERO_PAID_LOCAL_TOOLCHAIN_POST_INSTALL_EVIDENCE_RECORDED`** |
| **Historical authorization token (pre-install license evidence)** | **`R5_P2C3C_ZERO_PAID_TOOLCHAIN_LICENSE_EVIDENCE_DOCUMENTATION_AUTHORIZED`** |
| **Historical reconciliation basis** | **`R5_P2C3C_ZERO_PAID_TOOLCHAIN_EVIDENCE_CLASSIFICATION_CORRECTED_AND_READY_FOR_DOCUMENTATION_AUTHORIZATION`** |
| **Historical authorization ceiling (pre-install)** | **`P2-C3C ZERO_PAID_TOOLCHAIN_LICENSE_EVIDENCE_DOCUMENTATION_RECORDED`** |
| **Canonical baseline (`main`)** | `92254694f38b8e7823d3452ae1899f6591e7026f` |
| **Historical license-evidence baseline** | `3cd1e185ca3d176597cc77094654b90a3591d866` |
| **Post-install verification date** | **2026-08-12** |
| **Companion C3C contract** | [rule-05-windows-handle-hardening-spike-contract-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-contract-R5-M6B-P2C3C.md) |
| **Companion post-merge implementation evidence** | [rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md) |
| **Companion P2-A policy** | [rule-05-byte-verification-policy-R5-M6B-P2.md](./rule-05-byte-verification-policy-R5-M6B-P2.md) |
| **Companion inventory** | [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md) |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |

This document records (1) the **historical** P2-C3C zero-paid toolchain / license-evidence reconciliation (pre-install) and (2) the **post-install** independently verified local artifact evidence. Historical pre-install pending classifications remain visible below. Post-install classifications are in **§14–§20**.

**Current post-merge supersession (after PR #78):** Cargo dependency/lock resolution and synthetic spike implementation are **no longer pending** — see [rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md). This zero-paid document remains the authoritative record of **toolchain license / install fingerprints**; it does **not** re-authorize C3D/C3E, protected-source execution, hashing, manifest, catalog, or runtime work.

**Historical post-install sentence (preserved):** at post-install documentation time, Cargo dependency / lock resolution remained pending and implementation remained unauthorized.

---

## 2. Owner attestation (decision evidence)

Recorded owner statement (governance name only; no additional personal data):

Dr. Ghanshyam Bakalwar develops EHAS2 in his **individual capacity**.

Normative interpretation:

1. Not enterprise employee development.
2. Owner attests a **valid licensed Windows 11** installation.
3. Visual Studio Community eligibility is evaluated through the **individual-developer** permission.
4. Any “five users” organizational statement is retained **only** as owner-supplied context; it is not the primary eligibility basis when individual-developer eligibility independently governs.
5. This is factual owner attestation, **not** legal advice.
6. This is **not** authorization to buy a subscription, certificate, API, service, CI usage, or other paid product.
7. Owner attestation **does not** replace Microsoft component terms. If exact Microsoft terms applicable to a component do not clearly cover this use, that component remains blocked pending those terms.

---

## 3. Permanent no-paid lock

**Token (exact):** **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`**

Explicitly forbidden:

- paid API
- paid SaaS / service
- paid dependency or package
- paid CI or cloud runner
- paid certificate or Authenticode service
- paid artifact storage
- commercial native library
- telemetry service
- runtime internet dependency

If a future required component is paid-only, the stage is **BLOCKED**. Do not silently replace it with another paid product.

---

## 4. Completed evidence (historical pre-install license reconciliation)

Recorded as **completed** at the pre-install license-evidence documentation stage (not installation, not compilation, not legal approval):

| Completed item | Notes |
|----------------|-------|
| Valid licensed Windows 11 owner attestation | Owner decision evidence only |
| Visual Studio Community high-level individual eligibility | Official Community Usage proposition + owner attestation |
| Rust 1.97.1 official release | Official Rust Project announcement (2026-07-16) |
| Rust 1.97.1 tagged dual-license evidence | Tag `1.97.1` COPYRIGHT — MIT OR Apache-2.0; general Rust policy supporting |
| windows-sys 0.61.2 license / API / feature evidence | MIT OR Apache-2.0; required symbols and feature names recorded in reconciliation |
| windows-link `^0.2.1` declared constraint and published license | Declared transitive requirement; published crate license MIT OR Apache-2.0 |
| Standalone Build Tools excluded from v1 | **`OPTIONAL_EXCLUDED_FROM_V1`** |
| GitHub Actions / workflow excluded from v1 | No workflow path; not mandatory proof infrastructure |
| Source-only repository posture | No prebuilt binary commitment authorized |

Do **not** treat historical license/eligibility evidence alone as installed-artifact verification. Installed-artifact verification is recorded in **§14–§16**.

---

## 5. Pending evidence (historical pre-install snapshot)

**Historical snapshot only** (pre-install documentation stage). Do not treat as current installed-version status. Current post-install classifications are in **§17**.

| Pending item | Classification posture (historical) |
|--------------|-------------------------------------|
| Community C++ workload exact EULA / build-use terms | **`TECHNICALLY_SUITABLE_LICENSE_REVIEW_PENDING`** |
| Windows SDK-through-Community exact terms | **`TECHNICALLY_SUITABLE_LICENSE_REVIEW_PENDING`** |
| Owner EULA acceptance during separately authorized setup | Pending setup authorization (historical) |
| Exact MSVC toolset version | **`VERSION_SELECTION_PENDING`** |
| Exact Windows SDK version | **`VERSION_SELECTION_PENDING`** |
| Exact rustup version and tagged license | **`VERSION_SELECTION_PENDING`** |
| Installed rustc / Cargo fingerprints | **`VERSION_SELECTION_PENDING`** |
| windows-link exact `Cargo.lock` resolution | **`VERSION_SELECTION_PENDING`** |
| Complete build stack verification | Not claimed |
| Implementation authorization | **`C3C_IMPLEMENTATION_NOT_AUTHORIZED`** |

---

## 6. Decision table (historical pre-install; exactly 17 rows)

**Historical pre-install decision table.** Preserved as recorded evidence. Current installed status is **§17**, not a silent rewrite of this table.

Exactly **one** classification per row. Slash alternatives, bare `OPTIONAL`, and premature VERIFIED claims for workload/SDK are forbidden in this historical table.

| Component | Classification |
|---|---|
| Licensed Windows 11 OS | VERIFIED_ZERO_PAID_LICENSE_EVIDENCE_COMPLETE |
| Visual Studio Community individual eligibility | VERIFIED_ZERO_PAID_LICENSE_EVIDENCE_COMPLETE |
| Community C++ workload | TECHNICALLY_SUITABLE_LICENSE_REVIEW_PENDING |
| Standalone MSVC Build Tools | OPTIONAL_EXCLUDED_FROM_V1 |
| Windows SDK through Community | TECHNICALLY_SUITABLE_LICENSE_REVIEW_PENDING |
| Standalone Windows SDK | OPTIONAL_EXCLUDED_FROM_V1 |
| Rust 1.97.1 license | VERIFIED_ZERO_PAID_LICENSE_EVIDENCE_COMPLETE |
| rustc/Cargo/std installed fingerprint | VERSION_SELECTION_PENDING |
| rustup setup artifact | VERSION_SELECTION_PENDING |
| windows-sys 0.61.2 | VERIFIED_ZERO_PAID_LICENSE_EVIDENCE_COMPLETE |
| windows-link declared ^0.2.1 constraint | VERIFIED_ZERO_PAID_LICENSE_EVIDENCE_COMPLETE |
| windows-link exact lockfile resolution | VERSION_SELECTION_PENDING |
| Cargo.lock | VERSION_SELECTION_PENDING |
| clippy/rustfmt | OPTIONAL_EXCLUDED_FROM_V1 |
| Optional audit tools | OPTIONAL_EXCLUDED_FROM_V1 |
| Paid services/signing/paid CI | PAID_OR_METERED_REJECTED |
| Runtime internet/telemetry | TECHNICALLY_UNSUITABLE |

Mechanical intent: **17** rows; each classification is a single allowed vocabulary token.

---

## 7. Preferred zero-paid route (planning + post-install alignment)

Documented planning route:

1. Licensed Windows 11 x64
2. Visual Studio Community under individual eligibility
3. Minimum required C++ workload
4. Windows SDK through Community
5. Rust 1.97.1
6. Target `x86_64-pc-windows-msvc`
7. `windows-sys = 0.61.2`
8. `windows-link` exact resolution later frozen in `Cargo.lock`
9. Rust standard library otherwise
10. Source-only repository
11. Offline runtime
12. No paid component

**Standalone Build Tools remain excluded from v1.**

rustup is the preferred **official setup mechanism**, outside the reproducible build lock, setup-only (never a runtime dependency). Exact installed rustup / rustc / Cargo fingerprints are recorded in **§16** (superseding the historical **`VERSION_SELECTION_PENDING`** posture for those installed artifacts only). Alternative install mechanisms are excluded unless separately audited.

Historical route posture at pre-install documentation: **`ZERO_PAID_ROUTE_PARTIALLY_VERIFIED`**.

Current local install posture (versions recorded; Cargo still pending): **`ZERO_PAID_LOCAL_TOOLCHAIN_INSTALLED_VERIFIED`**. This is **not** a claim that Cargo resolution, compilation, or C3C proofs are complete.

---

## 8. Future implementation allowlist (unauthorized)

Recorded for a **later** implementation token only. This documentation tranche **must not** add these files:

1. `tools/provenance/windowsHandleSpike/Cargo.toml`
2. `tools/provenance/windowsHandleSpike/Cargo.lock`
3. `tools/provenance/windowsHandleSpike/rust-toolchain.toml`
4. `tools/provenance/windowsHandleSpike/src/**/*.rs`
5. `tools/provenance/windowsHandleSpike/tests/**/*.rs`

Exactly **five** entries. `Cargo.lock` appears **once**.

Excluded unless separately authorized: README, workflow files, GitHub Actions, prebuilt binary, install scripts, paid tools, cargo-deny / cargo-audit / cargo-license as mandatory proof infrastructure.

---

## 9. Official evidence index (summary)

**Official primary (supporting the completed rows above):**

- Rust 1.97.1 announcement: https://blog.rust-lang.org/2026/07/16/Rust-1.97.1/ (via https://blog.rust-lang.org/releases/latest/)
- Rust 1.97.1 tagged COPYRIGHT: https://raw.githubusercontent.com/rust-lang/rust/1.97.1/COPYRIGHT
- Rust licenses policy (supporting): https://www.rust-lang.org/policies/licenses
- Visual Studio Community Usage (individual eligibility): https://visualstudio.microsoft.com/vs/community/
- Visual Studio downloads / Build Tools notice: https://visualstudio.microsoft.com/downloads/
- Community / Build Tools license-terms directory entries: https://visualstudio.microsoft.com/license-terms/

**Package-registry metadata:**

- crates.io `windows-sys` 0.61.2 and `windows-link` published metadata
- docs.rs `windows-sys` 0.61.2 API surface for required symbols

**Not treated as official Rust Project release source:** releases.rs

---

## 10. Governance status (historical pre-install snapshot)

**Historical governance tokens** as recorded at pre-install license-evidence documentation. Current governance is **§19**.

| Token | Status (historical) |
|-------|---------------------|
| **`P2-C3C ZERO_PAID_TOOLCHAIN_LICENSE_EVIDENCE_DOCUMENTATION_RECORDED`** | Historical evidence document recorded |
| **`DOCUMENTATION_ONLY`** | No install / implement / compile in that tranche |
| **`ZERO_PAID_ROUTE_PARTIALLY_VERIFIED`** | Eligibility and selected crate/Rust license evidence recorded; stack incomplete at that time |
| **`COMMUNITY_CPP_WORKLOAD_LICENSE_REVIEW_PENDING`** | Pending (historical) |
| **`WINDOWS_SDK_LICENSE_REVIEW_PENDING`** | Pending (historical) |
| **`EXACT_TOOLCHAIN_VERSION_SELECTION_PENDING`** | Pending (historical; superseded for installed MSVC/SDK/Rust versions by §14–§16) |
| **`INSTALLED_ARTIFACT_VERIFICATION_PENDING`** | Pending (historical; superseded by post-install verification recorded here) |
| **`CARGO_LOCK_RESOLUTION_PENDING`** | Pending (historical; later superseded by PR #78 — see §19) |
| **`C3C_IMPLEMENTATION_NOT_AUTHORIZED`** | Implementation blocked (historical; later superseded by PR #78 — see §19) |
| **`C3C_SYNTHETIC_SPIKE_NOT_EXECUTED`** | Spike not run (historical; later superseded by PR #78 — see §19) |
| **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** | No protected bytes |
| **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** | No dry run |
| **`NO_HASH_COMPUTATION`** | No digests |
| **`NO_MANIFEST_PERSISTENCE`** | No manifest write |
| **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** | Not advanced |
| **`BYTE_PROOF_PENDING`** | Owner corpus proof pending |
| **`CATALOG_ROW_COUNT_0`** | Catalog remains empty |
| **`CLI_RUNTIME_NOT_CONNECTED`** | Runtime not connected |
| **`C3D_NOT_AUTHORIZED`** | Not authorized |
| **`C3E_NOT_AUTHORIZED`** | Not authorized |
| **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** | Permanent lock |

---

## 11. Explicit non-claims (historical pre-install + continuing)

The historical pre-install documentation did **not** claim:

- full toolchain verified
- license / legal approval
- installation completed (at that stage)
- compilation completed
- C3C proven
- protected-runner readiness
- clinical validation
- Rule Engine comparison completion
- ownerPrimaryVerified advancement
- EULA acceptance completed (at that stage)
- Microsoft component terms satisfied for Community C++ workload or Windows SDK beyond high-level individual eligibility

**Continuing non-claims after post-install evidence recording:**

- C3C proven
- full stack implementation-ready without Cargo resolution
- Microsoft blanket legal approval
- source access / protected-runner ready
- byte proof complete
- Rule Engine comparison complete
- standalone Build Tools entitlement
- paid subscription / certificate / service authorization

---

## 12. STOP boundary (historical pre-install authorization)

**Stop after zero-paid toolchain license evidence documentation** (historical tranche).

That authorization did **not** permit:

- install Visual Studio, Windows SDK, rustup, or Rust
- accept any EULA
- create Cargo files, `rust-toolchain.toml`, or workflow files
- compile, fetch crates, or generate lockfiles
- execute native or filesystem experiments
- access protected source
- compute hashes or persist manifests
- run dry/full security access
- authorize C3D / C3E
- advance `ownerPrimaryVerified`
- populate catalog or connect runtime

---

## 13. Verdict (historical pre-install)

| Field | Value |
|-------|--------|
| **Verdict label (historical)** | **`P2-C3C ZERO_PAID_TOOLCHAIN_LICENSE_EVIDENCE_DOCUMENTATION_RECORDED`** |
| **Meaning** | Zero-paid toolchain / license evidence reconciliation recorded as documentation only |
| **Does not imply** | Stack fully verified; install done; implementation authorized; C3C success |

Evidence activation: **NONE**. Clinical validation: **0**. Runtime: **NOT_CONNECTED**. **`BYTE_PROOF_PENDING`**. **`CATALOG_ROW_COUNT_0`**.

---

## 14. Post-install host evidence (redacted; 2026-08-12)

**Evidence class:** installed artifact observation (redacted host facts only).

| Fact | Recorded value |
|------|----------------|
| OS family | Windows 11 Client/Professional family |
| Architecture | x64 |
| Version | 25H2 |
| Build | 26200.8875 |
| C3C support gate | Supported by **C3C-Q05** for this recorded host class |

Do **not** claim all future Windows builds are supported. No username, machine name, device/product key, account/email, IP/network information, or absolute local path is recorded.

---

## 15. Visual Studio Community installed evidence (2026-08-12)

**Evidence class:** installed artifact observation.

| Field | Recorded value |
|-------|----------------|
| Product | Visual Studio Community 2026 |
| Product ID | `Microsoft.VisualStudio.Product.Community` |
| Channel | `VisualStudio.18.Release` |
| Prerelease | `false` |
| Complete / launchable | `true` / `true` |
| Product version | 18.9.0 |
| Catalog / build | 18.9.12105.275 |
| Workload | `Microsoft.VisualStudio.Workload.NativeDesktop` |
| MSVC component | `Microsoft.VisualStudio.Component.VC.Tools.x86.x64` |
| SDK component | `Microsoft.VisualStudio.Component.Windows11SDK.26100` |
| includeRecommended | `false` / `0` |

**Absent** in the selected Community installation (not owner-selected for v1):

- Professional / Enterprise / trial
- Preview / Insiders
- CMake
- ATL / MFC
- ASAN
- Clang
- Azure / Copilot workloads
- Extra SDK components 22621 / 28000

**Unavoidable installer dependencies** (not separately owner-selected features):

| Component | Classification |
|-----------|----------------|
| `Microsoft.VisualStudio.Component.VC.Redist.14.Latest` | **`INSTALLER_REQUIRED_TRANSITIVE_COMPONENT`** |
| `Microsoft.VisualStudio.Component.VC.CoreIde` | **`INSTALLER_REQUIRED_TRANSITIVE_COMPONENT`** |
| `Microsoft.VisualStudio.Component.TextTemplating` | **`INSTALLER_REQUIRED_TRANSITIVE_COMPONENT`** |

### 15.1 Exact MSVC and Windows SDK evidence

| Field | Recorded value |
|-------|----------------|
| MSVC toolset | 14.51.36231 |
| x64 `cl` / `link` | present |
| x64 `libcpmt` / `libcmt` | present |
| Windows SDK | 10.0.26100.0 |
| x64 `kernel32.lib` | present |
| Compatible target | `x86_64-pc-windows-msvc` |

**No compilation was performed** during verification or this documentation tranche.

### 15.2 Incomplete standalone Build Tools remnant

- Not registered in vswhere
- Not repaired
- Not used
- Remains **`EXCLUDED_FROM_V1`**
- Absolute folder path is **not** recorded

---

## 16. Exact Rust installed evidence (2026-08-12)

**Evidence class:** installed artifact observation + license evidence for rustup setup artifact.

### 16.1 rustup

| Field | Recorded value |
|-------|----------------|
| Version | 1.29.0 |
| Commit | `28d1352db` |
| Date | 2026-03-05 |
| Role | setup-only; outside reproducible build lock; not a runtime dependency |
| License evidence | MIT OR Apache-2.0 |

### 16.2 rustc

| Field | Recorded value |
|-------|----------------|
| Version | 1.97.1 |
| Commit | `8bab26f4f68e0e26f0bb7960be334d5b520ea452` |
| Commit date | 2026-07-14 |
| LLVM | 22.1.6 |
| Host | `x86_64-pc-windows-msvc` |

### 16.3 Cargo

| Field | Recorded value |
|-------|----------------|
| Version | 1.97.1 |
| Commit | `c980f4866141969fab6254a680546a277789d6f0` |
| Commit date | 2026-06-30 |

### 16.4 Toolchain inventory

| Field | Recorded value |
|-------|----------------|
| Active / default | `1.97.1-x86_64-pc-windows-msvc` |
| Installed target | `x86_64-pc-windows-msvc` only |
| Installed components | `rustc`, `cargo`, `rust-std` only |
| Profile | `minimal` |

**Explicitly not installed** (proxy shims do not count as installed components):

- nightly
- beta
- GNU target
- rustfmt
- clippy
- rust-src
- rust-analyzer
- miri
- LLVM tools

---

## 17. Current post-install classifications (2026-08-12)

Exactly **one** classification / status per row **as of post-install evidence recording**. Historical §5–§6 rows remain visible above and are not silently deleted.

| Item | Status at post-install recording |
|---|---|
| Licensed Windows 11 host | INSTALLED_VERIFIED |
| Visual Studio Community product/channel | INSTALLED_VERIFIED |
| Owner EULA acceptance fact | OWNER_ACCEPTED_INSTALLED_COMMUNITY_ROUTE_EVIDENCED |
| NativeDesktop workload | INSTALLED_VERIFIED |
| MSVC x64 toolset 14.51.36231 | INSTALLED_VERIFIED |
| Windows SDK 10.0.26100.0 | INSTALLED_VERIFIED |
| rustup 1.29.0 setup artifact | INSTALLED_VERIFIED |
| rustc 1.97.1 | INSTALLED_VERIFIED |
| Cargo 1.97.1 | INSTALLED_VERIFIED |
| x86_64-pc-windows-msvc target | INSTALLED_VERIFIED |
| Rust component inventory | INSTALLED_VERIFIED |
| Standalone Build Tools | EXCLUDED_FROM_V1 |
| windows-sys 0.61.2 dependency resolution | PENDING_IMPLEMENTATION_AUTHORIZATION *(historical at post-install)* |
| windows-link exact lock resolution | PENDING_IMPLEMENTATION_AUTHORIZATION *(historical at post-install)* |
| Cargo.lock | PENDING_IMPLEMENTATION_AUTHORIZATION *(historical at post-install)* |
| Compilation | NOT_PERFORMED *(historical at post-install)* |
| Seventeen C3C mandatory proofs | NOT_PERFORMED *(historical at post-install)* |
| Full C3C spike | NOT_EXECUTED *(historical at post-install)* |
| C3C implementation | NOT_AUTHORIZED *(historical at post-install)* |
| Paid service/API/CI/certificate | REJECTED |

**Post-merge supersession (PR #78):** windows-sys 0.61.2 / windows-link 0.2.1 / Cargo.lock resolved; synthetic spike implemented and merged; mandatory evidence aggregate **17/17** supported as documented in [rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md). Paid components remain **REJECTED**.

---

## 18. Owner EULA fact and legal boundary

| Token / fact | Meaning |
|--------------|---------|
| **`OWNER_EULA_ACCEPTED_CONTINUE_INSTALL`** | Owner personally confirmed acceptance during the separately authorized local setup path |
| **`OWNER_ACCEPTED_INSTALLED_COMMUNITY_ROUTE_EVIDENCED`** | Factual installation evidence that the installed Community route was accepted by the owner |

Clarify:

- Owner personally confirmed acceptance
- Agent did **not** first-accept on the owner’s behalf
- This is factual installation evidence only
- **Not** legal advice
- **Not** blanket Microsoft license approval
- **No** standalone Build Tools entitlement claim
- **No** paid subscription / certificate / service authorization

Microsoft EULA text is **not** reproduced here.

---

## 19. Governance status (post-install recording + post-merge supersession)

| Token | Status |
|-------|--------|
| **`P2-C3C ZERO_PAID_LOCAL_TOOLCHAIN_POST_INSTALL_EVIDENCE_RECORDED`** | Post-install evidence recorded |
| **`OWNER_ACCEPTED_INSTALLED_COMMUNITY_ROUTE_EVIDENCED`** | Owner acceptance fact recorded |
| **`ZERO_PAID_LOCAL_TOOLCHAIN_INSTALLED_VERIFIED`** | Local Community + MSVC + SDK + Rust fingerprints recorded |
| **`EXACT_MSVC_VERSION_RECORDED`** | 14.51.36231 |
| **`EXACT_WINDOWS_SDK_VERSION_RECORDED`** | 10.0.26100.0 |
| **`EXACT_RUSTUP_VERSION_RECORDED`** | 1.29.0 |
| **`EXACT_RUSTC_CARGO_FINGERPRINTS_RECORDED`** | rustc/Cargo 1.97.1 commits recorded |
| **`CARGO_DEPENDENCY_RESOLUTION_PENDING`** | *(historical at post-install)* — **superseded** by PR #78 lock |
| **`CARGO_LOCK_RESOLUTION_PENDING`** | *(historical at post-install)* — **superseded** by PR #78 lock |
| **`C3C_IMPLEMENTATION_NOT_AUTHORIZED`** | *(historical at post-install)* — **superseded** by **`P2_C3C_SYNTHETIC_WINDOWS_HANDLE_HARDENING_SPIKE_IMPLEMENTATION_MERGED`** |
| **`C3C_SYNTHETIC_SPIKE_NOT_EXECUTED`** | *(historical at post-install)* — **superseded** by **`C3C_SYNTHETIC_SPIKE_MANDATORY_EVIDENCE_17_OF_17_SUPPORTED`** |
| **`P2_C3C_SYNTHETIC_WINDOWS_HANDLE_HARDENING_SPIKE_IMPLEMENTATION_MERGED`** | **Current** — PR #78 |
| **`POST_C3C_INDEPENDENT_SECURITY_REVIEW_PASS`** | **Current** |
| **`C3C_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTED`** | **Current** companion evidence |
| **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** | No protected bytes |
| **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** | No dry run |
| **`SECURITY_ACCESS_FULL_RUN_NOT_AUTHORIZED`** | No full run |
| **`NO_HASH_COMPUTATION`** | No digests |
| **`NO_MANIFEST_PERSISTENCE`** | No manifest write |
| **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** | Not advanced |
| **`BYTE_PROOF_PENDING`** | Owner corpus proof pending |
| **`CATALOG_ROW_COUNT_0`** | Catalog remains empty |
| **`CLI_RUNTIME_NOT_CONNECTED`** | Runtime not connected |
| **`C3D_NOT_AUTHORIZED`** | Not authorized |
| **`C3E_NOT_AUTHORIZED`** | Not authorized |
| **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** | Permanent lock |

Historical current-facing claims that installed MSVC / SDK / Rust versions remained unknown are **superseded** by §14–§16. Historical §5–§6 / §10 context is preserved. Historical Cargo/implementation-pending rows above are **superseded** only as labeled.

Another installation audit is **not** required unless the installed toolchain changes.

---

## 20. Remaining pending work

**Completed after post-install (separate authorizations; see implementation evidence):** Rust helper crate, `windows-sys`/`Cargo.lock` pin, synthetic 17-proof accounting, independent security review, PR #78 merge.

**Still pending / not authorized:**

1. Separate owner authorization before **C3D**.
2. Separate owner authorization before **C3E** / security-access dry or full run.
3. Protected-source execution, hashing, manifest persistence.
4. `ownerPrimaryVerified` advancement, catalog population, runtime connection, deployment.

---

## 21. STOP boundary (this post-install evidence documentation)

**Stop after post-install evidence documentation.**

Do **not**, under this authorization:

- install, repair, update, or uninstall toolchain components
- accept any EULA
- create Cargo files, `rust-toolchain.toml`, or workflow files
- compile, fetch crates, or generate lockfiles
- execute native or filesystem experiments / C3C spike
- access protected source
- compute hashes or persist manifests
- run dry/full security access
- authorize C3D / C3E
- advance `ownerPrimaryVerified`
- populate catalog or connect runtime

---

## 22. Verdict (current)

| Field | Value |
|-------|--------|
| **Verdict label** | **`P2-C3C ZERO_PAID_LOCAL_TOOLCHAIN_POST_INSTALL_EVIDENCE_RECORDED`** |
| **Meaning** | Independently verified local zero-paid toolchain installation and exact versions recorded as documentation only |
| **Post-merge pointer** | Implementation/Cargo resolution evidenced in [rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md) |
| **Does not imply** | Microsoft blanket legal approval; C3D/C3E authorized; protected-source ready; `ownerPrimaryVerified` |

Evidence activation: **NONE**. Clinical validation: **0**. Runtime: **NOT_CONNECTED**. **`BYTE_PROOF_PENDING`**. **`CATALOG_ROW_COUNT_0`**.
