# Rule 5 — R5-M6B P2-C3C zero-paid toolchain / license evidence

## 1. Document control

| Field | Value |
|-------|--------|
| **Phase** | **R5-M6B Track B — P2-C3C** |
| **Classification** | **DOCUMENTATION_ONLY** |
| **Authorization token** | **`R5_P2C3C_ZERO_PAID_TOOLCHAIN_LICENSE_EVIDENCE_DOCUMENTATION_AUTHORIZED`** |
| **Reconciliation basis** | **`R5_P2C3C_ZERO_PAID_TOOLCHAIN_EVIDENCE_CLASSIFICATION_CORRECTED_AND_READY_FOR_DOCUMENTATION_AUTHORIZATION`** |
| **Authorization ceiling** | **`P2-C3C ZERO_PAID_TOOLCHAIN_LICENSE_EVIDENCE_DOCUMENTATION_RECORDED`** |
| **Canonical baseline (`main`)** | `3cd1e185ca3d176597cc77094654b90a3591d866` |
| **Companion C3C contract** | [rule-05-windows-handle-hardening-spike-contract-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-contract-R5-M6B-P2C3C.md) |
| **Companion P2-A policy** | [rule-05-byte-verification-policy-R5-M6B-P2.md](./rule-05-byte-verification-policy-R5-M6B-P2.md) |
| **Companion inventory** | [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md) |
| **Global cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |

This document records the **already completed** P2-C3C zero-paid toolchain and license-evidence reconciliation, including **verified** and **pending** items. It does **not** authorize Visual Studio / SDK / rustup / Rust installation, EULA acceptance, compilation, Cargo operations, native or filesystem experiments, protected-source access, hashing, manifest persistence, dry/full run, C3D/C3E, catalog, or runtime work.

**C3C success is not claimed.** The complete build stack is **not** verified.

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

## 4. Completed evidence

Recorded as **completed** (not installation, not compilation, not legal approval):

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

Do **not** treat completed license/eligibility evidence as installed-artifact verification.

---

## 5. Pending evidence

Recorded honestly as **pending**. None of the following is PASS, approved, or verified:

| Pending item | Classification posture |
|--------------|------------------------|
| Community C++ workload exact EULA / build-use terms | **`TECHNICALLY_SUITABLE_LICENSE_REVIEW_PENDING`** |
| Windows SDK-through-Community exact terms | **`TECHNICALLY_SUITABLE_LICENSE_REVIEW_PENDING`** |
| Owner EULA acceptance during separately authorized setup | Pending setup authorization |
| Exact MSVC toolset version | **`VERSION_SELECTION_PENDING`** |
| Exact Windows SDK version | **`VERSION_SELECTION_PENDING`** |
| Exact rustup version and tagged license | **`VERSION_SELECTION_PENDING`** |
| Installed rustc / Cargo fingerprints | **`VERSION_SELECTION_PENDING`** |
| windows-link exact `Cargo.lock` resolution | **`VERSION_SELECTION_PENDING`** |
| Complete build stack verification | Not claimed |
| Implementation authorization | **`C3C_IMPLEMENTATION_NOT_AUTHORIZED`** |

---

## 6. Decision table (exactly 17 rows)

Exactly **one** classification per row. Slash alternatives, bare `OPTIONAL`, and premature VERIFIED claims for workload/SDK are forbidden.

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

## 7. Preferred future zero-paid route (not fully verified)

Documented planning route only:

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

rustup is the preferred **official setup mechanism**, outside the reproducible build lock, setup-only (never a runtime dependency). Exact rustup version and tagged license remain **`VERSION_SELECTION_PENDING`**. Alternative install mechanisms are excluded unless separately audited.

This route is **`ZERO_PAID_ROUTE_PARTIALLY_VERIFIED`**. It is **not** a fully verified build stack.

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

## 10. Governance status

| Token | Status |
|-------|--------|
| **`P2-C3C ZERO_PAID_TOOLCHAIN_LICENSE_EVIDENCE_DOCUMENTATION_RECORDED`** | This evidence document recorded |
| **`DOCUMENTATION_ONLY`** | No install / implement / compile in this tranche |
| **`ZERO_PAID_ROUTE_PARTIALLY_VERIFIED`** | Eligibility and selected crate/Rust license evidence recorded; stack incomplete |
| **`COMMUNITY_CPP_WORKLOAD_LICENSE_REVIEW_PENDING`** | Pending |
| **`WINDOWS_SDK_LICENSE_REVIEW_PENDING`** | Pending |
| **`EXACT_TOOLCHAIN_VERSION_SELECTION_PENDING`** | Pending |
| **`INSTALLED_ARTIFACT_VERIFICATION_PENDING`** | Pending |
| **`CARGO_LOCK_RESOLUTION_PENDING`** | Pending |
| **`C3C_IMPLEMENTATION_NOT_AUTHORIZED`** | Implementation blocked |
| **`C3C_SYNTHETIC_SPIKE_NOT_EXECUTED`** | Spike not run |
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

## 11. Explicit non-claims

This document does **not** claim:

- full toolchain verified
- license / legal approval
- installation completed
- compilation completed
- C3C proven
- protected-runner readiness
- clinical validation
- Rule Engine comparison completion
- ownerPrimaryVerified advancement
- EULA acceptance completed
- Microsoft component terms satisfied for Community C++ workload or Windows SDK beyond high-level individual eligibility

---

## 12. STOP boundary

**Stop after zero-paid toolchain license evidence documentation.**

Do **not**, under this authorization:

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

## 13. Verdict

| Field | Value |
|-------|--------|
| **Verdict label** | **`P2-C3C ZERO_PAID_TOOLCHAIN_LICENSE_EVIDENCE_DOCUMENTATION_RECORDED`** |
| **Meaning** | Zero-paid toolchain / license evidence reconciliation recorded as documentation only |
| **Does not imply** | Stack fully verified; install done; implementation authorized; C3C success |

Evidence activation: **NONE**. Clinical validation: **0**. Runtime: **NOT_CONNECTED**. **`BYTE_PROOF_PENDING`**. **`CATALOG_ROW_COUNT_0`**.
