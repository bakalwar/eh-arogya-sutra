# Rule 5 — R5-M6B byte-verification and source-security policy (P2-A)

## 1. Identity and DOCUMENTATION_ONLY scope

| Field | Value |
|-------|--------|
| **Phase** | **R5-M6B Track B — P2-A** |
| **Classification** | **DOCUMENTATION_ONLY** / **POLICY_ONLY** |
| **Persistence base (canonical `main`)** | `b47baf83258e8a855c9be207e8f5f3d8c6a1a414` |
| **Companion P1 charter** | [rule-05-provenance-authority-charter-R5-M6B.md](./rule-05-provenance-authority-charter-R5-M6B.md) |
| **Companion inventory** | [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md) |
| **Track B CA-1** | **EMPTY_STRUCTURAL_CONTRACT_PRESENT** — **catalog row count 0** |
| **Authorization ceiling** | **POLICY_ONLY_DOCUMENTATION_RECORDED** (after authorized merge) |

This document records **byte-verification and source-security policy** only. It does **not** access protected source files, compute digests on real data, run PHI scanning or de-identification, implement verifier tooling, create manifests, assign catalog row IDs, populate catalog rows, set `ownerPrimaryVerified`, close FG/CQ items, or connect runtime.

---

## 2. Canonical baseline

| Item | Status on base `b47baf83258e8a855c9be207e8f5f3d8c6a1a414` |
|------|----------------------------------------------------------|
| P1 verdict | **`R5_M6B_P1_PROVENANCE_CHARTER_DOCUMENTATION_RECORDED`** |
| Owner corpus tier | **OWNER_DECLARED_ORIGINAL** / **BYTE_PROOF_PENDING** / **OWNER_PRIMARY_VERIFICATION_PENDING** |
| CA-1 | Empty structural catalog; **0** rows; runtime **NOT_IMPLEMENTED** / **NOT_CONNECTED** |
| **CATALOG_ROW_ID_NAMESPACE** | **OWNER_DECISION_REQUIRED** (TB-OD-02) |
| FG-001 / FG-004 / FG-009 | **OPEN** |
| CQ-001–CQ-008 | **Unresolved** |
| Evidence activation | **NONE** |
| Clinical validation | **0** |

P2-A does not change the above operational statuses.

---

## 3. Relationship to P1 and CA-1

| Document | Relationship |
|----------|----------------|
| **P1** | Records owner provenance declarations (PROV-OD-01–14). **PROV-OD-07** deferred exact hash/normalization policy to P2; **this document fulfills PROV-OD-07 policy recording** without executing verification. |
| **CA-1** | Empty evidence catalog envelope only. P2-A does not add rows or connect runtime. |
| **Track A audits** | Provide **AUDIT_REFERENCE** anchors for future compare; mechanical byte results do not rewrite audit clinical verdicts. |

---

## 4. Data classification

| Input / output type | Classification | Git posture (default) |
|---------------------|----------------|------------------------|
| Original clinic notes | **PHI_POSSIBLE** + **SENSITIVE_OWNER_SOURCE** | **FORBIDDEN_FROM_GIT** |
| Original transcripts / jsonl exports | **PHI_POSSIBLE** + **SENSITIVE_OWNER_SOURCE** | **FORBIDDEN_FROM_GIT** |
| Normalized owner medicine corpus | **SENSITIVE_OWNER_SOURCE** (PHI possible) | **SECURITY_REVIEW_REQUIRED** before Git |
| De-identified derivative | **SECURITY_REVIEW_REQUIRED** | **SAFE_FOR_PRIVATE_GIT** only after owner + security review |
| Audit Markdown (38 + index) | **NON_PHI_METADATA** (governance) | **SAFE_FOR_PRIVATE_GIT** |
| Registry JSON | **NON_PHI_METADATA** | **SAFE_FOR_PRIVATE_GIT** (index only) |
| Future verification manifest | **NON_PHI_METADATA** if field rules obeyed | **SECURITY_REVIEW_REQUIRED** before commit |
| Mismatch codes / enums | **NON_PHI_METADATA** | **SAFE_FOR_PRIVATE_GIT** |
| Cryptographic digests (no content) | **NON_PHI_METADATA** | **SAFE_FOR_PRIVATE_GIT** after metadata review |
| Tool debug logs | **FORBIDDEN_FROM_GIT** | Local only |

**Metadata leakage note:** digests, byte lengths, and structural anchors can fingerprint artifacts; filenames, paths, timestamps, and operator identity must not appear in repository-safe output (P2-OD-10, P2-OD-13).

---

## 5. Threat model

| Threat | Mitigation (policy) |
|--------|---------------------|
| PHI committed to Git | Forbidden paths; manual review gate; no manifest persistence without review |
| Source exfiltration via tool/CI | Offline-only v1; no network; CI never reads protected corpus |
| Silent corpus rewrite | Read-only open; no implicit normalization for artifact hashes (P2-OD-03) |
| Provenance proof → clinical authority | Separate gates; byte PASS ≠ `ownerPrimaryVerified` ≠ clinical validation |
| Path/filename disclosure | Opaque artifact IDs only in Git-safe output |
| Log/snippet leakage | Minimal redacted codes only (P2-OD-11) |
| Fabricated anchors | APP/BE/RE/Ver2 **NOT_APPLICABLE** / **SOURCE_NOT_AVAILABLE** |
| Quarantine merge | Ven1 B stays **QUARANTINED**; no silent merge |

---

## 6. Trust zones A–E

| Zone | Allowed | Forbidden | Access | Persistence | Logging | Cleanup |
|------|---------|-----------|--------|-------------|---------|---------|
| **A — Protected source** | Owner-controlled read-only bytes | Git, CI upload, auto-discovery | Owner / authorized operator | Owner storage | None to repo | Owner policy |
| **B — Verification execution** | Hash/compare read-only | Write source, log content, network | Local hardened runner | Ephemeral | Redacted codes | Mandatory |
| **C — Temporary derived** | Local compare buffers | Default write beside source | Same session as B | Delete after run (P2-OD-19) | No text | Best-effort immediate delete |
| **D — Repository-safe output** | Policy, manifest schema, enums, digests (reviewed) | PHI, paths, snippets | After human review | Private Git | CI schema tests | Versioned docs/manifests |
| **E — CI** | Synthetic fixtures, manifest validator | Protected corpus, secrets | GitHub Actions | CI artifacts (non-PHI) | Test names only | CI retention |

No real storage path is selected in this policy document.

### 6.1 Temporary retention and cleanup (P2-OD-19; policy only)

**Decision:** **IMMEDIATE_BEST_EFFORT_DELETE_DEFAULT**

| Topic | Policy |
|-------|--------|
| Operational scope | **Best-effort deletion** is an **operational cleanup requirement only**. It does **not** claim or guarantee **forensic secure erasure**, particularly on SSDs, cloud-synced storage, copy-on-write filesystems, backups, or snapshots. |
| Cleanup failure | If temporary-file or temporary-directory cleanup **fails**, a future verifier must: report a **dedicated non-success cleanup status** (generic execution/configuration outcome — **outside** the fixed BV-v1 mismatch-result manifest); return a **non-zero / non-success exit**; **not** report the run as complete **PASS**; **not** automatically persist or emit a repository-safe manifest as if cleanup succeeded; provide **only** a **redacted local remediation instruction** (no source path or content in repository output). |
| BV vocabulary | The fixed BV-v1 list has **no** dedicated cleanup code. **Do not** add a twentieth BV code in P2-A. Adding a dedicated cleanup error code is **deferred** to **P2-B** tool-contract review. Cleanup failure **blocks PASS** and **manifest persistence** regardless. |
| P2-A boundary | This wording is **policy-only**. **No** cleanup tooling or cleanup **execution** is authorized in P2-A. |

This policy does **not** prescribe guaranteed secure wipe or destructive disk operations.

---

## 7. Original, normalized, and de-identified identities

| Identity | Definition | v1 hash (future) |
|----------|------------|------------------|
| **ORIGINAL_ARTIFACT** | Bytes as captured from owner source | **rawHash** (exact bytes) |
| **NORMALIZED_DERIVATIVE** | Existing owner-prepared normalized corpus file (not regenerated by tool) | **normalizedHash** (exact bytes of file as-is) |
| **DEIDENTIFIED_DERIVATIVE** | Git-safe derivative after approval | **deidentifiedHash** (only if created + approved) |
| **AUDIT_REFERENCE** | Track A markdown anchors | Compare targets only |
| **REGISTRY_DERIVED_INDEX** | `medicines.v2.json` | No hash authority |

Future relationships (manifest — not created in P2-A): `derivedFrom`, `normalizationPolicyVersion`, `policyVersion`, encoding/BOM/EOL records, structural anchors, exclusion rule IDs.

---

## 8. SHA-256 v1 policy (P2-OD-01)

**Decision:** **SHA256_V1**

| Rule | Detail |
|------|--------|
| Primary digest | **SHA-256** sole required primary digest for v1 |
| Representation | **`sha256:`** + **lowercase hex** |
| SHA-512 / BLAKE3 | Not required in v1 |
| Git blob SHA | May be recorded only as **supplementary** reference in a **later authorized** policy extension — not v1 requirement |
| P2-A | **No digest computed** on any real file |

---

## 9. No-implicit-transformation policy (P2-OD-02, P2-OD-03)

**Artifact hash separation:** **RAW_AND_NORMALIZED_SEPARATE**

**Normalization posture:** **NO_IMPLICIT_TRANSFORMATION_V1**

| Step (future verifier) | Rule |
|------------------------|------|
| Open raw source | **Read-only** |
| Raw hash | Over **exact original bytes** |
| Normalized file | Hash **exact existing bytes** of normalized artifact — **do not regenerate or rewrite** normalized corpus |
| Clinical implication | **No hash** implies clinical truth, ownership verification, or safety validation |

**Forbidden for artifact hashes:** CRLF→LF conversion; BOM removal; silent Unicode normalization; trailing-space / terminal-newline / blank-line modification; MED header rewrites; **MED=None** replacement; **MED=SLASS** → **MED=S-Lass**; case normalization.

**Comparison-window exclusions** (Cursor-save lines, agent tails, non-owner regions): affect **bounded anchor comparison only**; **do not** alter raw or normalized artifact hashes; must use **rule IDs**, never silent byte deletion at source.

Any future **transformation-based** normalized derivative requires a **new policy version** and **separate owner authorization**.

---

## 10. Encoding, BOM, EOL, and Unicode recording

| Attribute | Policy |
|-----------|--------|
| UTF-8 | Validate before interpretive steps; **BV-ENC-INVALID** on failure |
| BOM | **Detect and record**; do not remove for artifact hash |
| EOL | **Detect and record** (CRLF/LF/mixed); do not convert for artifact hash |
| Unicode | **Do not** silently normalize for artifact hash |
| P2-A | Records policy only — no detection run |

---

## 11. PHI and manual-review gate (P2-OD-05, P2-OD-06)

| Decision | Rule |
|----------|------|
| **P2-OD-05** | **MANUAL_REVIEW_REQUIRED_NO_AUTOMATIC_EXCEPTION** — originals/transcripts/jsonl **PHI_POSSIBLE**; medicine-only text **not** automatically non-PHI; automation may assist, **cannot prove absence**; unresolved → fail-closed (**BV-PHI-UNRESOLVED**) |
| **P2-OD-06** | **OWNER_AND_SECURITY_REVIEW_REQUIRED** — de-identification **not** executed in P2-A; Git-safe derivative requires owner + designated security review; **no scan alone sufficient** |

---

## 12. Byte, header, and anchor comparison model

| Dimension | Future compare | Outcomes |
|-----------|----------------|----------|
| Physical `MED=` header | Expected normalized form vs bytes | **PASS / MISMATCH / NOT_APPLICABLE / SOURCE_NOT_AVAILABLE** |
| Line anchor | 1-based line in agreed scope | **PASS / MISMATCH / AMBIGUOUS** |
| jsonl anchor | Record index/key if applicable | **PASS / MISMATCH / NOT_APPLICABLE** |
| Declared length | See §13 | **BV-LEN-UNIT-UNRESOLVED** or **BV-LEN-MISMATCH** |
| Wrapper open/close | Per audit bounds | **PASS / BV-WRAPPER-MISMATCH** |
| Excluded regions | Rule IDs | **BV-EXCL-REGION-MISMATCH** if inconsistent |
| Duplicate occurrence | A vs B | **BV-OCC-QUARANTINED** for B |
| Byte PASS effect | Future byte-proof field only | **Does not** set `ownerPrimaryVerified`; **does not** change clinical/safety/runtime |

---

## 13. Declared-length unresolved policy (P2-OD-04)

**Decision:** **LENGTH_UNIT_DISCOVERY_REQUIRED**

| Rule | Detail |
|------|--------|
| Audit `len` values | Remain **LENGTH_UNIT_UNRESOLVED** in P2-A |
| Assumption | **No unit assumed** |
| Future discovery | Approved non-PHI or de-identified sample compares: raw bytes, Unicode code points, UTF-16 code units, JSON payload length, other demonstrably relevant units |
| Until resolved | Emit **BV-LEN-UNIT-UNRESOLVED** — **never PASS** on length |

---

## 14. Missing and abnormal medicine outcomes

| Medicine | Outcome |
|----------|---------|
| **APP, BE, RE, Ver2** | **SOURCE_NOT_AVAILABLE** or **NOT_APPLICABLE** — **no fabricated anchors** |
| **GE, WE, YE** | Preserve physical **`MED=None`**; semantic electricity = documentation-only |
| **S-Lass** | Preserve physical **`MED=SLASS`** |
| **Ven1** | Occurrence **A** = authoritative candidate; **B** = **QUARANTINED** — separate, no merge |

Existing Track A audit verdicts remain unchanged by mechanical byte proof.

---

## 15. MED=None and MED=SLASS protections

Covered in §9 and §14: **no** rewrite of **MED=None** to medicine codes; **no** change of **MED=SLASS** to hyphenated registry display form for physical header identity.

---

## 16. Duplicate and quarantine policy

Aligns with P1 **PROV-OD-10**: **NO_SILENT_MERGE**. Engineering outcome **BV-OCC-QUARANTINED** for non-authoritative duplicates. Does not close CF-* conflict flags.

---

## 17. Future verifier architecture (P2-OD-07, P2-OD-08, P2-OD-09)

| Decision | Record |
|----------|--------|
| **P2-OD-07** | Proposed future path: **`tools/provenance/`** — **no tool created in P2-A** |
| **P2-OD-08** | **EXPLICIT_CLI_SOURCE_ARGUMENT_ONLY** — explicit source path at invocation; no hardcoded path; no default directory; no crawl; no auto-discovery; no committed source path; no filename/path in Git-safe output |
| **P2-OD-09** | **OFFLINE_ONLY_V1** — no upload/fetch; no network mode in v1; CI never accesses protected source |

Recommended end-state (future): **hybrid** — local/offline verifier + repository manifest schema validator (synthetic only in CI).

---

## 18. Future minimal manifest field classification (P2-OD-12)

P2-A **classifies only** — **no schema or manifest file created**.

| Class | Candidate fields |
|-------|------------------|
| **May later include (after approval)** | manifestVersion, verificationToolVersion, policyVersion, opaque sourceArtifactId, sourceRole, hashAlgorithm, reviewed digest fields, byte lengths, encoding/BOM/EOL status, PHIScanStatus, manualReviewStatus, ownerAttestationReference, medicineCode, physicalHeader, structural anchors, declaredLength and resolved/unit status, wrapper/match/mismatch statuses |
| **Forbidden** | filenames; absolute/relative protected paths; operator identity; hostname; patient identifiers; raw text/snippets; free-text notes |
| **Real-data digests in Git** | **SECURITY_REVIEW_REQUIRED** before persistence |

**P2-OD-10:** **OPAQUE_ARTIFACT_ID_ONLY** — not catalog row-ID namespace (TB-OD-02 unchanged).

**P2-OD-13:** **OMIT_FROM_V1_REPOSITORY_MANIFEST** — no timestamps unless separately authorized.

---

## 19. Fixed BV-v1 engineering codes (P2-OD-14)

**Decision:** **FIXED_BV_V1_ENGINEERING_CODES**

| Code | Meaning |
|------|---------|
| **BV-SRC-MISSING** | Source not available |
| **BV-PHI-UNRESOLVED** | PHI status not cleared |
| **BV-ENC-INVALID** | Encoding invalid |
| **BV-RAW-HASH-MISMATCH** | Raw digest mismatch |
| **BV-NORM-HASH-MISMATCH** | Normalized digest mismatch |
| **BV-NORM-POLICY-MISMATCH** | Policy version mismatch |
| **BV-HDR-MISSING** | Header not found |
| **BV-HDR-DUPLICATE** | Duplicate header |
| **BV-HDR-CODE-MISMATCH** | Physical vs expected code |
| **BV-MED-NONE-ATTRIBUTION** | MED=None documentation check |
| **BV-LINE-ANCHOR-MISMATCH** | Line anchor |
| **BV-JSONL-ANCHOR-MISMATCH** | jsonl anchor |
| **BV-LEN-UNIT-UNRESOLVED** | Length unit unknown |
| **BV-LEN-MISMATCH** | Length mismatch under resolved unit |
| **BV-WRAPPER-MISMATCH** | Wrapper boundary |
| **BV-EXCL-REGION-MISMATCH** | Exclusion rule disagreement |
| **BV-OCC-QUARANTINED** | Quarantined occurrence |
| **BV-TOOL-VERSION-MISMATCH** | Tool vs manifest version |
| **BV-PARTIAL-RUN** | Incomplete verification |

Engineering codes only — **do not** close CF/ME/CQ or establish clinical validity.

---

## 20. Logging and redaction policy (P2-OD-11)

| Allowed on stdout/stderr (future) | Forbidden |
|-----------------------------------|-----------|
| Counts; status enums; **BV-*** codes; exit summary | Source text; snippets; patient data; filenames; paths; usernames; hostnames; free-text notes |

Debug logs: **local only** — **forbidden from Git**.

---

## 21. CI boundary (P2-OD-15)

**Decision:** **SCHEMA_AND_SYNTHETIC_ONLY**

| CI may (future) | CI must not |
|-----------------|-------------|
| Policy/schema syntax; allowed manifest fields; hash format; status enums; deterministic ordering; **synthetic non-clinical** fixtures | Access protected corpus; download protected sources; validate clinical truth; set `ownerPrimaryVerified`; activate evidence/runtime |

---

## 22. Authorization-state model

| State | P2-A posture |
|-------|----------------|
| **POLICY_ONLY_DOCUMENTATION_RECORDED** | **Authorized by P2-A merge** (documentation) |
| **TOOL_IMPLEMENTATION** | **Not authorized** |
| **SYNTHETIC_TEST_EXECUTION** | **Not authorized** |
| **PROTECTED_SOURCE_DRY_RUN** | **Not authorized** (P2-OD-16: separate written owner token) |
| **PROTECTED_SOURCE_FULL_RUN** | **Not authorized** (P2-OD-17: token after dry-run acceptance) |
| **MANIFEST_PERSISTENCE** | **Not authorized** (P2-OD-18: separate private-repo review) |

---

## 23. P2-A through P2-E sequencing

| Tranche | Description | P2-A |
|---------|-------------|------|
| **P2-A** | This policy document | **Current** |
| **P2-B** | Tool + synthetic fixtures only | Blocked until authorized |
| **P2-C** | Protected dry run | Blocked |
| **P2-D** | Full 38-medicine verification | Blocked |
| **P2-E** | Manifest persistence in Git | Blocked |

---

## 24. Explicit non-claims

P2-A does **not** claim:

- Any protected source was accessed, copied, or hashed.
- PHI absence or successful de-identification.
- `ownerPrimaryVerified` for any medicine.
- Clinical or safety validation.
- FG/CQ closure.
- Catalog rows, row IDs, or runtime activation.
- That manifest policy equals evidence activation.

---

## 25. STOP boundary

**Stop after P2-A documentation** (Draft PR review). **Do not** proceed without separate owner authorization to:

- Implement **`tools/provenance/`** or run synthetic tests (P2-B).
- Execute protected-source dry run or full run (P2-C / P2-D).
- Persist real-data manifests (P2-E).
- Populate catalog, select row-ID namespace, T4/T5, R5-M7, or runtime integration.

---

## 25.1 P2-B1 in-memory core status (authorized implementation tranche)

| Status | Value |
|--------|--------|
| **Authorization token** | **`R5_P2B1_PURE_IN_MEMORY_CORE_IMPLEMENTATION_AUTHORIZED`** |
| **P2-B1** | **`PURE_IN_MEMORY_CORE_PRESENT`** — `tools/provenance/verifyCore.mjs` |
| **Tests** | **`SYNTHETIC_IN_MEMORY_TESTS_PRESENT`** — no committed fixture files |
| **Filesystem** | **`FILESYSTEM_ACCESS_NOT_IMPLEMENTED`** (core module) |
| **CLI** | **`CLI_NOT_IMPLEMENTED`** |
| **Protected source** | **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| **Byte proof (owner corpus)** | **`BYTE_PROOF_PENDING`** |
| **Manifest persistence** | **`MANIFEST_PERSISTENCE_NOT_AUTHORIZED`** |

P2-B1 implements **SHA256_V1**, byte inspection, and the **four** BV-v1 codes **BV-ENC-INVALID**, **BV-RAW-HASH-MISMATCH**, **BV-NORM-HASH-MISMATCH**, **BV-NORM-POLICY-MISMATCH** over **caller-supplied bytes only**. It does **not** access protected sources, persist manifests, populate catalog rows, set **`ownerPrimaryVerified`**, close FG/CQ items, or connect runtime. **P2-B2+** (structural anchors, confined CLI, protected runner) remain **separately authorized** unless a tranche is explicitly recorded below.

---

## 25.2 P2-B2A structural comparator status (authorized implementation tranche)

| Status | Value |
|--------|--------|
| **Authorization token** | **`R5_P2B2A_PURE_STRUCTURAL_COMPARATOR_IMPLEMENTATION_AUTHORIZED`** |
| **P2-B2A** | **`PURE_STRUCTURAL_COMPARATOR_PRESENT`** — `tools/provenance/verifyStructure.mjs` |
| **Tests** | **`SYNTHETIC_OBSERVATION_TESTS_PRESENT`** — no committed fixture files |
| **Byte-to-structure parser** | **`BYTE_TO_STRUCTURE_PARSER_NOT_IMPLEMENTED`** |
| **Filesystem** | **`FILESYSTEM_ACCESS_NOT_IMPLEMENTED`** |
| **CLI** | **`CLI_NOT_IMPLEMENTED`** |
| **Protected source** | **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| **Byte proof (owner corpus)** | **`BYTE_PROOF_PENDING`** |
| **Manifest persistence** | **`MANIFEST_PERSISTENCE_NOT_AUTHORIZED`** |

P2-B2A implements **`compareSyntheticStructure`** over **caller-supplied synthetic observation and expectation objects only** (no bytes, no parsing, no paths). It reuses **`BV-ENC-INVALID`** from P2-B1 for upstream encoding gate status on observations. It does **not** verify owner corpus bytes, access protected sources, persist manifests, populate catalog rows, or connect runtime. **P2-B2B+ / P2-B3 / P2-C** remain **separately authorized**.

---

## 25.3 P2-B2B basic in-memory header-line parser status (authorized implementation tranche)

| Status | Value |
|--------|--------|
| **Authorization token** | **`R5_P2B2B_BASIC_IN_MEMORY_PARSER_IMPLEMENTATION_AUTHORIZED`** |
| **P2-B2B** | **`BASIC_IN_MEMORY_HEADER_LINE_PARSER_PRESENT`** — `tools/provenance/parseStructure.mjs` |
| **Tests** | **`SYNTHETIC_BYTE_TESTS_PRESENT`** — `tests/unit/provenance-parse-structure.test.ts`; no committed fixture files |
| **Wrapper token parser** | **`WRAPPER_TOKEN_PARSER_NOT_IMPLEMENTED`** |
| **JSONL anchor derivation** | **`JSONL_ANCHOR_DERIVATION_NOT_IMPLEMENTED`** |
| **Quarantine assignment** | **`QUARANTINE_ASSIGNMENT_NOT_IMPLEMENTED`** |
| **Exclusion inference** | **`EXCLUSION_INFERENCE_NOT_IMPLEMENTED`** |
| **Filesystem** | **`FILESYSTEM_ACCESS_NOT_IMPLEMENTED`** |
| **CLI** | **`CLI_NOT_IMPLEMENTED`** |
| **Protected source** | **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| **Byte proof (owner corpus)** | **`BYTE_PROOF_PENDING`** |
| **Manifest persistence** | **`MANIFEST_PERSISTENCE_NOT_AUTHORIZED`** |

P2-B2B implements **`parseSyntheticStructureFromBytes`** over **caller-supplied bytes and a strict `{ lengthUnit }` config only** (header-line discovery, fixed absent wrapper/JSONL/exclusions, no quarantine mapping). It imports **`inspectByteCharacteristics`** and **`BV-ENC-INVALID`** from P2-B1 only. It does **not** parse wrapper tokens, derive JSONL anchors from bytes, infer clinical exclusions, verify owner corpus paths, persist manifests, populate catalog rows, or connect runtime. **P2-B3 / P2-C** remain **separately authorized**.

---

## 25.4 P2-B2C fixed wrapper token parser status (authorized implementation tranche)

| Status | Value |
|--------|--------|
| **Authorization token** | **`R5_P2B2C_FIXED_WRAPPER_TOKEN_PARSER_IMPLEMENTATION_AUTHORIZED`** |
| **P2-B2C** | **`FIXED_WRAPPER_TOKEN_PARSER_PRESENT`** — `tools/provenance/parseStructure.mjs` (`wrapperMode: 'FIXED_USER_QUERY_V1'`) |
| **Wrapper ambiguity** | **`WRAPPER_AMBIGUITY_FAIL_CLOSED`** — malformed token-bearing source throws **`Rule5WrapperSourceAmbiguityError`** / **`RULE5_WRAPPER_SOURCE_AMBIGUOUS`** |
| **Wrapper tokens** | **`WRAPPER_TOKENS_FIXED_USER_QUERY_V1`** — fixed whole-line literals only; no caller tokens; no regex |
| **Wrapper boundary** | **`WRAPPER_BOUNDARY_DOCUMENT_END_ONLY`** — `boundaryEndLine = totalLogicalLines` |
| **Tests** | **`SYNTHETIC_BYTE_TESTS_PRESENT`** — extended `tests/unit/provenance-parse-structure.test.ts`; no committed fixture files |
| **JSONL anchor derivation** | **`JSONL_ANCHOR_DERIVATION_NOT_IMPLEMENTED`** |
| **Quarantine assignment** | **`QUARANTINE_ASSIGNMENT_NOT_IMPLEMENTED`** |
| **Exclusion inference** | **`EXCLUSION_INFERENCE_NOT_IMPLEMENTED`** |
| **Filesystem** | **`FILESYSTEM_ACCESS_NOT_IMPLEMENTED`** |
| **CLI** | **`CLI_NOT_IMPLEMENTED`** |
| **Protected source** | **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| **Byte proof (owner corpus)** | **`BYTE_PROOF_PENDING`** |
| **Manifest persistence** | **`MANIFEST_PERSISTENCE_NOT_AUTHORIZED`** |

P2-B2C extends **`parseSyntheticStructureFromBytes`** with an optional strict **`{ lengthUnit, wrapperMode: 'FIXED_USER_QUERY_V1' }`** config only. Legacy **`{ lengthUnit }`** config preserves P2-B2B behavior (wrapper scan disabled). Fixed-token scan uses exact whole-line matching with document-end boundary only. Malformed or ambiguous token-bearing source throws **`Rule5WrapperSourceAmbiguityError`** — not a BV code. It does **not** derive JSONL anchors, infer exclusions, verify owner corpus paths, persist manifests, populate catalog rows, set **`ownerPrimaryVerified`**, or connect runtime. **P2-B3 / P2-C** remain **separately authorized**.

---

## 25.5 P2-B3 confined synthetic CLI status (authorized implementation tranche)

| Status | Value |
|--------|--------|
| **Authorization token** | **`R5_P2B3_CONFINED_SYNTHETIC_CLI_IMPLEMENTATION_AUTHORIZED`** |
| **P2-B3** | **`P2-B3 CONFINED_SYNTHETIC_CLI_PRESENT`** — `tools/provenance/verifySyntheticCli.mjs` + `tools/provenance/readSyntheticInput.mjs` |
| **Filesystem** | **`FILESYSTEM_ACCESS_SYNTHETIC_ONLY`** — confined `--root` + relative `--input` only; no protected-source paths |
| **Marker interlock** | **`SYNTHETIC_ROOT_MARKER_INTERLOCK_PRESENT`** — mandatory `.ehas2-provenance-synthetic-root` (24-byte UTF-8 exact match); **`SYNTHETIC_CONTENT_NOT_CRYPTOGRAPHICALLY_PROVEN`** |
| **CLI scope** | **`PARSER_ONLY_CLI_PRESENT`** — calls **`inspectByteCharacteristics`** then **`parseSyntheticStructureFromBytes`** only |
| **Comparator** | **`COMPARATOR_CLI_NOT_IMPLEMENTED`** — no **`compareSyntheticStructure`**, no digests in output |
| **Platform** | **Linux-only** full execution; other platforms → **`RULE5_CLI_UNSUPPORTED_PLATFORM`** |
| **Tests** | **`SYNTHETIC_BYTE_TESTS_PRESENT`** — `tests/unit/provenance-synthetic-cli.test.ts`; test-created **`mkdtemp`** only |
| **Protected source** | **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| **Byte proof (owner corpus)** | **`BYTE_PROOF_PENDING`** |
| **Manifest persistence** | **`MANIFEST_PERSISTENCE_NOT_AUTHORIZED`** |
| **Runtime** | **`CLI_RUNTIME_NOT_CONNECTED`** |

P2-B3 implements a **parser-only**, **Linux-only** confined synthetic CLI over an explicit **`--root`** with mandatory marker interlock (not cryptographic proof of synthetic content). It performs per-component **`lstat`**, **`O_RDONLY | O_NOFOLLOW`** open, **`fstat`** identity checks, **`nlink === 1`**, and bounded reads (marker ≤65 bytes; input ≤262145 read / ≤262144 accept). Operational stdout is one redacted JSON line; stderr is empty. Exit **0** for **`PARSED`** or **`ENCODING_INVALID`** only — not clinical validation, byte proof, or owner-corpus verification. It does **not** compare expectations, emit hashes, persist manifests, populate catalog rows, or connect runtime. **P2-C1 / P2-C execution** remain **separately authorized** (see §25.6).

---

## 25.6 P2-C1 protected-source security contract status (documentation tranche)

| Status | Value |
|--------|--------|
| **Authorization token** | **`R5_P2C1_PROTECTED_SOURCE_AND_MANIFEST_SECURITY_CONTRACT_DOCUMENTATION_AUTHORIZED`** |
| **P2-C1** | **`P2_C1_DOCUMENTATION_ONLY_SECURITY_CONTRACT`** — [rule-05-protected-source-security-contract-R5-M6B-P2C1.md](./rule-05-protected-source-security-contract-R5-M6B-P2C1.md) |
| **Classification** | **DOCUMENTATION_ONLY** / **SECURITY_CONTRACT_ONLY** |
| **Verdict** | **`R5_P2C1_PROTECTED_SOURCE_AND_MANIFEST_SECURITY_CONTRACT_DOCUMENTATION_RECORDED`** |
| **Sequencing** | P2-C1 is a **prerequisite documentation sub-tranche** that **precedes** historical §23 **P2-C protected dry run**; §23 label retained as historical |
| **B3 boundary** | B3 remains **synthetic-only**, **Linux-only**, **marker-interlocked**, **parser-only** — **not** extended for protected source (**`SEPARATE_PROTECTED_SOURCE_RUNNER_REQUIRED`**) |
| **Next possible impl** | **P2-C2** synthetic manifest schema only — **`P2_C2_SYNTHETIC_MANIFEST_SCHEMA_ONLY_REQUIRES_SEPARATE_AUTHORIZATION`** — **not authorized now** |
| **Protected source** | **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| **Byte proof (owner corpus)** | **`BYTE_PROOF_PENDING`** |
| **Manifest persistence** | **`MANIFEST_PERSISTENCE_NOT_AUTHORIZED`** |
| **Runtime** | **`CLI_RUNTIME_NOT_CONNECTED`** |
| **`ownerPrimaryVerified`** | **Not set** — **`EXPLICIT_POST_RECONCILIATION_OWNER_DECISION_REQUIRED`** |

P2-C1 records protected-source, manifest-field, trust-zone, checkpoint, and output-redaction rules only. It does **not** access protected source, compute digests, run dry/full protected execution, create or persist manifests, implement tooling, populate catalog rows, set **`ownerPrimaryVerified`**, or connect runtime. §25.1–§25.5 history is unchanged.

---

## 25.7 P2-C2 synthetic repo-safe manifest schema status (authorized implementation tranche)

| Status | Value |
|--------|--------|
| **Authorization token** | **`R5_P2C2_SYNTHETIC_REPO_SAFE_MANIFEST_SCHEMA_IMPLEMENTATION_AUTHORIZED`** |
| **P2-C2** | **`P2-C2 SYNTHETIC_REPO_SAFE_MANIFEST_SCHEMA_VALIDATOR_PRESENT`** — `tools/provenance/manifestSchema.mjs` |
| **Scope** | **`IN_MEMORY_ONLY`** — validate + serialize synthetic repo-safe manifest objects only |
| **Fixture** | **`NO_COMMITTED_JSON_FIXTURE`** — in-test synthetic objects only |
| **Digest** | **`NO_DIGEST_FIELD`** / **`NO_HASH_COMPUTATION`** |
| **Filesystem** | **`NO_FILESYSTEM`** |
| **CLI** | **`NO_CLI`** |
| **Manifest persistence** | **`NO_MANIFEST_PERSISTENCE`** / **`MANIFEST_PERSISTENCE_NOT_AUTHORIZED`** |
| **Protected source** | **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| **`ownerPrimaryVerified`** | **`OWNER_PRIMARY_VERIFIED_FALSE_ONLY`** — literal `false` in schema; not set true |
| **Runtime** | **`CLI_RUNTIME_NOT_CONNECTED`** |
| **Byte proof (owner corpus)** | **`BYTE_PROOF_PENDING`** |

P2-C2 implements a **12-field**, **flat**, **repo-safe synthetic** manifest validator and canonical serializer only. It does **not** access protected source, compute digests, write manifest files, persist manifests, run CLI, populate catalog rows, set **`ownerPrimaryVerified` true**, or connect runtime. Protected-local manifest schema remains **unimplemented** and **separately authorized**. §25.1–§25.6 history is unchanged.

---

## 25.8 P2-C3A Windows protected-runner technical contract status (documentation tranche)

| Status | Value |
|--------|--------|
| **Authorization token** | **`R5_P2C3A_WINDOWS_PROTECTED_RUNNER_TECHNICAL_CONTRACT_DOCUMENTATION_AUTHORIZED`** |
| **P2-C3A** | **`P2-C3A WINDOWS_PROTECTED_RUNNER_TECHNICAL_CONTRACT_DOCUMENTATION_RECORDED`** — [rule-05-windows-protected-runner-contract-R5-M6B-P2C3A.md](./rule-05-windows-protected-runner-contract-R5-M6B-P2C3A.md) |
| **Classification** | **DOCUMENTATION_ONLY** / **TECHNICAL_CONTRACT_ONLY** |
| **Pure Node protected open** | **`PURE_NODE_PROTECTED_FILE_OPEN_NOT_AUTHORIZED`** |
| **Native / verified OS-handle hardening** | **`NATIVE_OR_VERIFIED_OS_HANDLE_HARDENING_REQUIRED`** — before protected clinical byte access |
| **Protected runner** | **`PROTECTED_RUNNER_NOT_IMPLEMENTED`** |
| **Security-access dry run** | **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** |
| **Protected source** | **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| **Digest** | **`NO_HASH_COMPUTATION`** |
| **Manifest persistence** | **`NO_MANIFEST_PERSISTENCE`** / **`MANIFEST_PERSISTENCE_NOT_AUTHORIZED`** |
| **`ownerPrimaryVerified`** | **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** — not set |
| **Runtime** | **`CLI_RUNTIME_NOT_CONNECTED`** |
| **Byte proof (owner corpus)** | **`BYTE_PROOF_PENDING`** |
| **Stage ladder** | C3A → C3B → review → C3C → review → C3D → review → C3E — separate tokens; no auto-advance |
| **B3 boundary** | B3 remains **permanently Linux synthetic-only** — **`B3_NON_REUSE_PERMANENT`** |
| **P2-C2 boundary** | P2-C2 schema **synthetic-only** — **`P2_C2_SCHEMA_NON_REUSE_FOR_PROTECTED_RESULTS`** |

P2-C3A records Windows protected-runner architecture, P2C3-OD-01–20, feasibility matrix, output category framework, and provisional failure taxonomy only. It does **not** implement code, run filesystem or native experiments, access protected source, compute digests, create or persist manifests, authorize security-access dry run or full run, populate catalog rows, set **`ownerPrimaryVerified`**, or connect runtime. §25.1–§25.7 history is unchanged.

---

## 25.9 P2-C3B synthetic in-memory orchestration status (implementation + post-merge security review)

| Status | Value |
|--------|--------|
| **Authorization token** | **`R5_P2C3B_SYNTHETIC_ORCHESTRATION_DOCUMENTATION_AUTHORIZED`** |
| **P2-C3B contract** | [rule-05-synthetic-orchestration-contract-R5-M6B-P2C3B.md](./rule-05-synthetic-orchestration-contract-R5-M6B-P2C3B.md) |
| **Implementation** | **`P2-C3B SYNTHETIC_IN_MEMORY_ORCHESTRATION_IMPLEMENTED`** — `tools/provenance/syntheticOrchestration.mjs` — merged PR **#73** @ `abc24d312138908470bbc9c9ba080ededc8cad3f` |
| **Tests** | **`P2-C3B SYNTHETIC_IN_MEMORY_ORCHESTRATION_TESTS_PRESENT`** — 53 direct unit tests |
| **Post-merge security review** | **`POST_C3B_INDEPENDENT_SECURITY_REVIEW_PASS`** — owner acceptance **`R5_P2C3B_POST_MERGE_INDEPENDENT_SECURITY_REVIEW_ACCEPTED`** |
| **Scope** | **`SYNTHETIC_CALLER_OWNED_BYTES_ONLY`** / **`IN_MEMORY_ONLY`** |
| **Byte cap** | **`MAX_SYNTHETIC_ORCHESTRATION_BYTES_262144`** |
| **Resource-bound note** | **`EXCLUDED_RANGES_ELEMENT_CAP_NOT_SET_TRUSTED_IN_PROCESS_ONLY`** — not production-external safe |
| **Digest** | **`NO_HASH_COMPUTATION`** |
| **Filesystem** | **`NO_FILESYSTEM`** |
| **CLI** | **`NO_CLI`** (B3 remains separate; **`B3_NON_REUSE_PERMANENT`**) |
| **Manifest** | **`MANIFEST_COMPLETELY_EXCLUDED_FROM_C3B_V1`** / **`NO_MANIFEST_PERSISTENCE`** |
| **Protected source** | **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| **Dry run** | **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** |
| **`ownerPrimaryVerified`** | **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** |
| **Runtime** | **`CLI_RUNTIME_NOT_CONNECTED`** |
| **Byte proof (owner corpus)** | **`BYTE_PROOF_PENDING`** |
| **Next stage** | **`C3C_NOT_AUTHORIZED`** — separate contract and owner token required |

P2-C3B implements synthetic in-memory inspect/parse/optional-compare orchestration only. It does **not** access protected source, compute digests, write manifest files, run CLI, perform filesystem or native experiments, authorize C3C/C3D/C3E, populate catalog rows, set **`ownerPrimaryVerified`**, or connect runtime. §25.1–§25.8 history is unchanged.

---

## 25.10 P2-C3C Windows handle-hardening synthetic spike status

| Status | Value |
|--------|--------|
| **Contract authorization token** | **`R5_P2C3C_WINDOWS_HANDLE_HARDENING_SPIKE_CONTRACT_DOCUMENTATION_AUTHORIZED`** |
| **P2-C3C contract** | [rule-05-windows-handle-hardening-spike-contract-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-contract-R5-M6B-P2C3C.md) |
| **Zero-paid toolchain evidence** | [rule-05-windows-handle-hardening-spike-zero-paid-toolchain-license-evidence-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-zero-paid-toolchain-license-evidence-R5-M6B-P2C3C.md) |
| **Post-merge implementation evidence** | [rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md](./rule-05-windows-handle-hardening-spike-implementation-evidence-R5-M6B-P2C3C.md) |
| **Classification (current)** | **`P2_C3C_SYNTHETIC_WINDOWS_HANDLE_HARDENING_SPIKE_IMPLEMENTATION_MERGED`** / **`C3C_SYNTHETIC_SPIKE_MANDATORY_EVIDENCE_17_OF_17_SUPPORTED`** / **`POST_C3C_INDEPENDENT_SECURITY_REVIEW_PASS`** / **`C3C_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTED`** |
| **Historical contract / install labels** | **`P2-C3C WINDOWS_HANDLE_HARDENING_SPIKE_CONTRACT_DOCUMENTATION_RECORDED`** / **`P2-C3C ZERO_PAID_TOOLCHAIN_LICENSE_EVIDENCE_DOCUMENTATION_RECORDED`** (historical pre-install) / **`P2-C3C ZERO_PAID_LOCAL_TOOLCHAIN_POST_INSTALL_EVIDENCE_RECORDED`** |
| **Zero-paid route** | **`ZERO_PAID_LOCAL_TOOLCHAIN_INSTALLED_VERIFIED`** / **`OWNER_ACCEPTED_INSTALLED_COMMUNITY_ROUTE_EVIDENCED`** — exact MSVC / Windows SDK / rustup / rustc / Cargo fingerprints recorded; Cargo graph locked via PR #78 (`windows-sys 0.61.2` → `windows-link 0.2.1`) |
| **Implementation** | **`P2_C3C_SYNTHETIC_WINDOWS_HANDLE_HARDENING_SPIKE_IMPLEMENTATION_MERGED`** (PR #78; reviewed head `8eb6732…`; merge `39b5e8a…`) |
| **Spike evidence** | **`C3C_SYNTHETIC_SPIKE_MANDATORY_EVIDENCE_17_OF_17_SUPPORTED`** (T03 retained elevated DIRECT; other 16 standard-user; no committed `#[ignore]`) |
| **Cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** |
| **Digest** | **`NO_HASH_COMPUTATION`** |
| **Manifest** | **`NO_MANIFEST_PERSISTENCE`** |
| **Protected source** | **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| **Dry run** | **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** |
| **Full run** | **`SECURITY_ACCESS_FULL_RUN_NOT_AUTHORIZED`** |
| **`ownerPrimaryVerified`** | **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** |
| **Runtime** | **`CLI_RUNTIME_NOT_CONNECTED`** |
| **Byte proof (owner corpus)** | **`BYTE_PROOF_PENDING`** |
| **Catalog** | **`CATALOG_ROW_COUNT_0`** |
| **Next stages** | See §25.11 — **`P2_C3D_SYNTHETIC_PROTECTED_RUNNER_IMPLEMENTATION_MERGED`** / **`C3D_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTED`** / **`C3E_NOT_AUTHORIZED`** |

P2-C3C records the Windows handle-hardening synthetic spike **contract**, zero-paid toolchain evidence, and (after PR #78) **synthetic implementation merge evidence**. Historical labels `C3C_IMPLEMENTATION_NOT_AUTHORIZED` / `C3C_SYNTHETIC_SPIKE_NOT_EXECUTED` remain valid only as **pre-implementation** status. Current work does **not** authorize protected-source access, digests, manifest persistence, C3E, catalog rows, **`ownerPrimaryVerified`**, or runtime connection. §25.1–§25.9 history is unchanged.

---

## 25.11 P2-C3D protected-runner implementation status

| Status | Value |
|--------|--------|
| **Contract authorization token (historical)** | **`R5_P2C3D_PROTECTED_RUNNER_CONTRACT_DOCUMENTATION_AUTHORIZED`** |
| **P2-C3D contract** | [rule-05-windows-protected-runner-implementation-contract-R5-M6B-P2C3D.md](./rule-05-windows-protected-runner-implementation-contract-R5-M6B-P2C3D.md) |
| **P2-C3D post-merge evidence** | [rule-05-windows-protected-runner-implementation-evidence-R5-M6B-P2C3D.md](./rule-05-windows-protected-runner-implementation-evidence-R5-M6B-P2C3D.md) |
| **Classification (current)** | **`P2_C3D_SYNTHETIC_PROTECTED_RUNNER_IMPLEMENTATION_MERGED`** / **`C3D_MANDATORY_SYNTHETIC_EVIDENCE_21_OF_21_SUPPORTED`** / **`POST_C3D_INDEPENDENT_NATIVE_SECURITY_REVIEW_PASS`** / **`C3D_POST_MERGE_IMPLEMENTATION_EVIDENCE_DOCUMENTED`** |
| **Historical contract-tranche labels** | `P2_C3D_PROTECTED_RUNNER_IMPLEMENTATION_CONTRACT_DOCUMENTED` / `C3D_DOCUMENTATION_ONLY` / `C3D_IMPLEMENTATION_NOT_AUTHORIZED` / `C3D_SYNTHETIC_IMPLEMENTATION_NOT_EXECUTED` remain valid only as **pre-PR #81** status |
| **PR / merge identity** | PR #81; reviewed head `03f232e3…`; merge `e9560ee2…` |
| **Cost lock** | **`NO_PAID_API_SERVICE_DEPENDENCY_OR_CERTIFICATE`** / **`ZERO_PAID_ROUTE_AVAILABLE`** |
| **Digest** | **`NO_HASH_COMPUTATION`** |
| **Manifest** | **`NO_MANIFEST_PERSISTENCE`** |
| **Protected source** | **`PROTECTED_SOURCE_DISCOVERY_NOT_AUTHORIZED`** / **`PROTECTED_SOURCE_ACCESS_NOT_AUTHORIZED`** / **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| **Dry run** | **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** |
| **Full run** | **`SECURITY_ACCESS_FULL_RUN_NOT_AUTHORIZED`** |
| **C3E** | **`C3E_NOT_AUTHORIZED`** |
| **`ownerPrimaryVerified`** | **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** |
| **Runtime** | **`CLI_RUNTIME_NOT_CONNECTED`** |
| **Byte proof (owner corpus)** | **`BYTE_PROOF_PENDING`** |
| **Catalog** | **`CATALOG_ROW_COUNT_0`** |

P2-C3D records the protected-runner **implementation contract** and (after PR #81) **synthetic implementation merge evidence**. Historical labels `C3D_IMPLEMENTATION_NOT_AUTHORIZED` / `C3D_SYNTHETIC_IMPLEMENTATION_NOT_EXECUTED` remain valid only as **pre-implementation** status. Current work does **not** authorize C3E, protected-source discovery/open/read, digests, manifest persistence, catalog rows, **`ownerPrimaryVerified`**, or runtime connection. C3D completion does **not** authorize C3E. §25.1–§25.10 history is unchanged.

---

## 26. P2-OD-01–19 register (P2-A recorded)

| ID | Decision | Recorded choice |
|----|----------|-----------------|
| **P2-OD-01** | Primary hash | **SHA256_V1** — `sha256:<lowercase-hex>`; no digest computed in P2-A |
| **P2-OD-02** | Artifact hash separation | **RAW_AND_NORMALIZED_SEPARATE** (+ deid hash if later approved) |
| **P2-OD-03** | Normalization posture | **NO_IMPLICIT_TRANSFORMATION_V1** |
| **P2-OD-04** | Declared-length unit | **LENGTH_UNIT_DISCOVERY_REQUIRED** |
| **P2-OD-05** | PHI classification | **MANUAL_REVIEW_REQUIRED_NO_AUTOMATIC_EXCEPTION** |
| **P2-OD-06** | De-identification approval | **OWNER_AND_SECURITY_REVIEW_REQUIRED** |
| **P2-OD-07** | Future tool location | **TOOLS_PROVENANCE_REPOSITORY_REVIEWED_CODE** (proposed `tools/provenance/`) |
| **P2-OD-08** | Source input | **EXPLICIT_CLI_SOURCE_ARGUMENT_ONLY** |
| **P2-OD-09** | Network | **OFFLINE_ONLY_V1** |
| **P2-OD-10** | Source identity in Git output | **OPAQUE_ARTIFACT_ID_ONLY** |
| **P2-OD-11** | Logging | **MINIMAL_REDACTED_CODES_ONLY** |
| **P2-OD-12** | Future manifest | **MINIMAL_SAFE_FIELD_SET_FIRST** (classification only) |
| **P2-OD-13** | Timestamps | **OMIT_FROM_V1_REPOSITORY_MANIFEST** |
| **P2-OD-14** | Mismatch vocabulary | **FIXED_BV_V1_ENGINEERING_CODES** (§19) |
| **P2-OD-15** | CI boundary | **SCHEMA_AND_SYNTHETIC_ONLY** |
| **P2-OD-16** | Protected dry run | **SEPARATE_WRITTEN_OWNER_TOKEN_REQUIRED** |
| **P2-OD-17** | Full protected run | **SEPARATE_TOKEN_AFTER_DRY_RUN_ACCEPTANCE** |
| **P2-OD-18** | Manifest persistence | **SEPARATE_PRIVATE_REPOSITORY_REVIEW_REQUIRED** |
| **P2-OD-19** | Temporary retention | **IMMEDIATE_BEST_EFFORT_DELETE_DEFAULT** |

---

## 27. Mandatory footer / verdict

**Authorization ceiling (post-merge when authorized):** **`POLICY_ONLY_DOCUMENTATION_RECORDED`**

**Verdict label:** **`R5_M6B_P2A_BYTE_VERIFICATION_SECURITY_POLICY_DOCUMENTATION_RECORDED`**

This verdict means **policy documentation only**. It does **not** imply source bytes were accessed, hashed, or verified.

Evidence activation: **NONE**. Clinical validation: **0**. Runtime: **NOT_IMPLEMENTED** / **NOT_CONNECTED**. **BYTE_PROOF_PENDING** and **OWNER_PRIMARY_VERIFICATION_PENDING** remain.
