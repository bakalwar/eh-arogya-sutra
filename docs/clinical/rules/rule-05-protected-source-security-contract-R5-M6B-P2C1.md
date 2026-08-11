# Rule 5 — R5-M6B protected-source and manifest security contract (P2-C1)

## 1. Document control

| Field | Value |
|-------|--------|
| **Phase** | **R5-M6B Track B — P2-C1** |
| **Classification** | **DOCUMENTATION_ONLY** / **SECURITY_CONTRACT_ONLY** |
| **Decision token** | **`P2_C1_DOCUMENTATION_ONLY_SECURITY_CONTRACT`** |
| **Authorization token (delivery)** | **`R5_P2C1_PROTECTED_SOURCE_AND_MANIFEST_SECURITY_CONTRACT_DOCUMENTATION_AUTHORIZED`** |
| **Authorization ceiling** | **`DOCUMENTATION_ONLY_SECURITY_CONTRACT_RECORDED`** |
| **Canonical baseline (`main`)** | `163236a0752bedd12dee2ecfcaaae0cc400c1380` |
| **Companion P1 charter** | [rule-05-provenance-authority-charter-R5-M6B.md](./rule-05-provenance-authority-charter-R5-M6B.md) |
| **Companion P2-A policy** | [rule-05-byte-verification-policy-R5-M6B-P2.md](./rule-05-byte-verification-policy-R5-M6B-P2.md) |
| **Companion inventory** | [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md) |
| **Track B CA-1** | **EMPTY_STRUCTURAL_CONTRACT_PRESENT** — **catalog row count 0** |

This document records **protected-source, manifest, and execution security rules only**. It performs **no** source access, PHI scan, hashing, dry run, full run, manifest creation, or persistence.

---

## 2. Classification and authorization ceiling

| Boundary | Status |
|----------|--------|
| **Permitted in P2-C1** | Policy documentation; trust-zone rules; field-class posture; checkpoint ladder; non-claims |
| **Not authorized by P2-C1** | Implementation; protected-source access; path discovery; hashing; dry run; full run; manifest creation or persistence; byte proof; `ownerPrimaryVerified`; catalog population; runtime connection |
| **Authorization ceiling** | **`DOCUMENTATION_ONLY_SECURITY_CONTRACT_RECORDED`** |

P2-C1 does **not** issue execution tokens for dry run, full run, or manifest persistence.

---

## 3. Canonical baseline

| Item | Status on base `163236a0752bedd12dee2ecfcaaae0cc400c1380` |
|------|----------------------------------------------------------|
| P1 verdict | **`R5_M6B_P1_PROVENANCE_CHARTER_DOCUMENTATION_RECORDED`** |
| P2-A verdict | **`R5_M6B_P2A_BYTE_VERIFICATION_SECURITY_POLICY_DOCUMENTATION_RECORDED`** |
| P2-B1 | **`PURE_IN_MEMORY_CORE_PRESENT`** |
| P2-B2A | **`PURE_STRUCTURAL_COMPARATOR_PRESENT`** |
| P2-B2B | **`BASIC_IN_MEMORY_HEADER_LINE_PARSER_PRESENT`** |
| P2-B2C | **`FIXED_WRAPPER_TOKEN_PARSER_PRESENT`** |
| P2-B3 | **`P2-B3 CONFINED_SYNTHETIC_CLI_PRESENT`** — merged PR #69 |
| Owner corpus tier | **OWNER_DECLARED_ORIGINAL** / **BYTE_PROOF_PENDING** / **OWNER_PRIMARY_VERIFICATION_PENDING** |
| CA-1 | Empty structural catalog; **0** rows; runtime **NOT_IMPLEMENTED** / **NOT_CONNECTED** |
| **CATALOG_ROW_ID_NAMESPACE** | **OWNER_DECISION_REQUIRED** |
| FG-001 / FG-004 / FG-009 | **OPEN** |
| CQ-001–CQ-008 | **Unresolved** |
| Evidence activation | **NONE** |
| Clinical validation | **0** |

P2-C1 does not change the above operational statuses.

---

## 4. Relationship to P1, P2-A and P2-B1/B2A/B2B/B2C/B3

| Document / tranche | Relationship |
|--------------------|----------------|
| **P1** | Records owner provenance declarations (PROV-OD-01–14). P2-C1 adds execution-security and manifest-field posture without executing verification. |
| **P2-A** | Primary byte-verification policy (P2-OD-01–19). P2-C1 refines protected-source sequencing and manifest posture; does not rewrite P2-A §1–25.5. |
| **P2-B1** | In-memory core — synthetic only; no filesystem. |
| **P2-B2A** | Structural comparator — synthetic observation objects only. |
| **P2-B2B / P2-B2C** | In-memory byte parser — caller-supplied bytes only; no protected paths. |
| **P2-B3** | Confined synthetic CLI — **Linux-only**, **marker-interlocked**, **parser-only**; **permanently synthetic-only** (see §8). |
| **CA-1** | Empty evidence catalog envelope. P2-C1 does not add rows or connect runtime. |

---

## 5. Historical §23 P2-C wording vs P2-C1 prerequisite sequencing

P2-A §23 historically labels **P2-C** as **“Protected dry run”** in the sequencing table. That label remains **historical documentation** in P2-A and is **not** superseded by deletion.

**Refined sequencing (P2-C1 recorded):**

| Tranche | Description | Status |
|---------|-------------|--------|
| **P2-C1** | Protected-source and manifest **security contract** (this document) | **Prerequisite documentation sub-tranche** |
| **P2-C2** | Synthetic-only manifest schema/validator (future) | **Not authorized** |
| **P2-C (execution)** | Protected dry run (historical §23 label) | **Blocked** — requires P2-C1 merge + separate tokens |
| **P2-D** | Full verification scope (future) | **Blocked** |
| **P2-E** | Manifest persistence in Git (future) | **Blocked** |

**P2-C1 precedes** any future protected dry run. Policy §23 historical “P2-C protected dry run” does **not** authorize execution without the refined ladder, platform/runner implementation, and separate owner tokens.

---

## 6. P2C-OD-01 through P2C-OD-19 (owner-locked register)

| ID | Decision token | Summary |
|----|----------------|---------|
| **P2C-OD-01** | **`P2_C1_DOCUMENTATION_ONLY_SECURITY_CONTRACT`** | P2-C1 records rules only; no implementation, source access, hashing, dry/full run, manifest, byte proof, or `ownerPrimaryVerified`. |
| **P2C-OD-02** | **`WINDOWS_PROTECTED_HOST_PRIMARY_LINUX_SYNTHETIC_ONLY`** | Protected owner data remains on owner-controlled Windows host; merged B3 is Linux-only synthetic; no copying protected bytes to Linux, CI, GitHub runner, repository, or cloud. |
| **P2C-OD-03** | **`EXPLICIT_OWNER_SELECTED_SINGLE_FILE_PER_AUTHORIZATION`** | Exact file selected explicitly by owner per future run; no directory crawl, glob, auto-discovery, recursive scan, environment-selected source, registry lookup, or default path; no path requested or recorded during P2-C1. |
| **P2C-OD-04** | **`DRY_RUN_SINGLE_ARTIFACT_NO_PERSISTENCE_THEN_OWNER_REVIEW`** | Future dry run: one artifact, read-only, offline, no Git writes, no manifest persistence, no source modification, fixed redacted output only, STOP after owner review. Full run separately authorized after dry-run acceptance. |
| **P2C-OD-05** | **`POTENTIAL_PHI_BY_DEFAULT_MANUAL_REVIEW_REQUIRED`** | All owner clinic material treated as potentially containing PHI; no automatic PHI-absent assumption; no raw content, patient identifiers, snippets, filenames, or paths in Git, PR, CI, logs, stdout/stderr, manifest, or test fixtures. |
| **P2C-OD-06** | **`NO_GIT_VISIBLE_DERIVATIVE_BEFORE_OWNER_AND_SECURITY_REVIEW`** | No normalized text, excerpt, anchor text, filenames, paths, or content-derived free text becomes Git-visible without separate review; hashing alone is not de-identification. |
| **P2C-OD-07** | **`DIGESTS_LOCAL_ONLY_PENDING_SEPARATE_FINGERPRINT_REVIEW`** | v1: no real corpus digest in Git, PR/CI logs, stdout/stderr, or manifest persistence; future local protected run may compute digest only after separate execution token specifies in-memory/local handling. |
| **P2C-OD-08** | **`FIXED_REDACTED_ENGINEERING_CODES_ONLY`** | Future protected runner: stdout one fixed JSON status line; stderr empty; no paths, filenames, hashes, byte lengths, anchors, header strings, snippets, PHI, argv, host, operator, timestamps, stack, or native errors; no diagnostic mode; do not reuse B3 output schema automatically. |
| **P2C-OD-09** | **`SCHEMA_CLASSIFICATION_ONLY_C2_REQUIRED_FOR_CONCRETE_SCHEMA`** | P2-C1 records allowed/forbidden field classes only; concrete manifest schema, validator, and synthetic tests require separate P2-C2 authorization. |
| **P2C-OD-10** | **`LOCAL_ONLY_NO_PERSISTENCE_UNTIL_SEPARATE_REVIEW`** | No manifest file created in P2-C1; future persistence requires separate private-repository/security review, schema approval, owner review of synthetic example, and explicit persistence token. |
| **P2C-OD-11** | **`IMMEDIATE_BEST_EFFORT_DELETE_CLEANUP_FAILURE_IS_NON_SUCCESS`** | Future protected runner prefers no temp files; if temp data authorized: owner-controlled temp location, minimum lifetime, best-effort immediate delete, no forensic-erasure claim; cleanup failure → non-success; no PASS/full-run/persistence progression. |
| **P2C-OD-12** | **`SEPARATE_RULE5_PROTECTED_RUNNER_ENGINEERING_NAMESPACE`** | Do not reuse or extend clinical BV meanings for filesystem/PHI/cleanup/authorization failures; fixed protected-runner engineering codes in future implementation contract; no native messages or free text. |
| **P2C-OD-13** | **`THREE_MANDATORY_OWNER_CHECKPOINTS`** | Separate written owner approval: (1) before protected dry run, (2) after dry-run report and before full run, (3) before any manifest persistence; no token auto-authorizes the next checkpoint. |
| **P2C-OD-14** | **`EXPLICIT_POST_RECONCILIATION_OWNER_DECISION_REQUIRED`** | `ownerPrimaryVerified` remains false/not set through P2-C1, schema work, tooling, dry run, hash PASS, structural PASS, and full run; may change only after byte evidence review, source-to-normalized reconciliation, medicine attribution review, PHI/security review, and explicit owner governance decision. |
| **P2C-OD-15** | **`SEPARATE_PROTECTED_SOURCE_RUNNER_REQUIRED`** | Do not extend or reuse B3 synthetic adapter/CLI for protected source; B3 remains permanently Linux-only, synthetic-only, marker-interlocked, parser-only; future protected runner requires separate modules, tests, tokens, and trust-zone documentation. |
| **P2C-OD-16** | **`P2_C2_SYNTHETIC_MANIFEST_SCHEMA_ONLY_REQUIRES_SEPARATE_AUTHORIZATION`** | After P2-C1 merge, next possible implementation tranche is synthetic-only manifest schema/validator using synthetic fixtures only; no authorization issued now. |
| **P2C-OD-17** | **`SEPARATE_EXACT_ARTIFACT_DRY_RUN_TOKEN_REQUIRED`** | No protected dry run until P2-C1 merged, platform/runner implemented and independently reviewed, PHI/security gates satisfied, and exact artifact authorization issued. |
| **P2C-OD-18** | **`SEPARATE_TOKEN_AFTER_DRY_RUN_ACCEPTANCE`** | Dry-run success does not authorize full run. |
| **P2C-OD-19** | **`SEPARATE_PRIVATE_STORAGE_AND_SECURITY_REVIEW_REQUIRED`** | No manifest persistence until exact storage, schema, fields, fingerprint risk, and access controls are approved. |

---

## 7. Trust zones A–E

### Zone A — Owner-controlled Windows protected host

| Rule | Detail |
|------|--------|
| Access | Read-only; offline |
| Scope | One explicitly authorized file per future execution token |
| Copy prohibition | No copy to Linux, CI, Git, or cloud |
| P2-C1 boundary | No actual path, drive, filename, or storage identifier recorded in this document |

### Zone B — Future separate Windows protected runner

| Rule | Detail |
|------|--------|
| Status | **Not implemented** |
| Relation to B3 | **Not B3** — separate modules and authorization required |
| Output | Fixed redacted engineering codes only (§15) |

### Zone C — Future ephemeral local buffers

| Rule | Detail |
|------|--------|
| Authorization | Separately authorized only |
| Temp files | Prefer none |
| Cleanup | Best-effort immediate delete; no forensic-erasure claim |
| Failure | Cleanup failure blocks success progression |

### Zone D — Repository-safe documentation

| Rule | Detail |
|------|--------|
| Content | Policies and status tokens only |
| Forbidden | Paths, digests, lengths, anchors, snippets, PHI |

### Zone E — Linux/CI synthetic

| Rule | Detail |
|------|--------|
| Content | Synthetic fixtures only |
| B3 posture | Merged B3 remains **Linux-only**, **marker-interlocked**, **parser-only** |
| Prohibition | Never protected corpus |

**Cross-zone rule:** Protected bytes do not leave Zone A without a future separately authorized and reviewed mechanism. P2-C1 does not authorize any such mechanism.

---

## 8. B3 permanent synthetic-only boundary

Merged P2-B3 (`tools/provenance/verifySyntheticCli.mjs`, `tools/provenance/readSyntheticInput.mjs`) is **permanently**:

| Property | Locked value |
|----------|--------------|
| Platform | **Linux-only** full execution |
| Source | **Synthetic-only** — confined `--root` with marker interlock |
| Scope | **Parser-only** — `inspectByteCharacteristics` + `parseSyntheticStructureFromBytes` |
| Protected source | **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** |
| Extension | **Forbidden** — B3 must not be extended for protected-source reads |

B3 operational stdout is one redacted JSON line for **synthetic** structural parsing only. B3 output schema must **not** be reused automatically for a future protected runner (P2C-OD-08).

---

## 9. Separate protected-runner requirement

**Decision:** **`SEPARATE_PROTECTED_SOURCE_RUNNER_REQUIRED`**

A future protected-source runner must have:

| Requirement | Detail |
|-------------|--------|
| Modules | Separate from B3 adapter/CLI |
| Tests | Separate synthetic and protected-runner contract tests |
| Tokens | Separate dry-run, full-run, and persistence tokens |
| Trust-zone docs | Separate from B3 synthetic confinement |
| Failure namespace | **`SEPARATE_RULE5_PROTECTED_RUNNER_ENGINEERING_NAMESPACE`** — not BV clinical codes |

Windows protected runner implementation requires separate implementation and security review beyond P2-C1.

---

## 10. Platform posture

**Decision:** **`WINDOWS_PROTECTED_HOST_PRIMARY_LINUX_SYNTHETIC_ONLY`**

| Zone | Platform |
|------|----------|
| Protected owner data (expected) | Owner-controlled **Windows** host |
| Merged B3 synthetic tooling | **Linux-only** |
| CI / GitHub runners | **Synthetic fixtures only** — never protected corpus |
| Copy prohibition | No protected bytes to Linux, CI, repository, or cloud |

A future Windows protected runner is **not** implemented or authorized by P2-C1.

---

## 11. Explicit single-file owner-selection rule

**Decision:** **`EXPLICIT_OWNER_SELECTED_SINGLE_FILE_PER_AUTHORIZATION`**

| Rule | Detail |
|------|--------|
| Selection | Exact file selected explicitly by owner for each future authorized run |
| Forbidden | Directory crawl; glob; auto-discovery; recursive scan; environment-selected source; registry lookup; default path |
| P2-C1 | No path requested or recorded |
| Future token | Must identify authorized artifact without placing protected path in Git or public logs |

---

## 12. PHI-by-default / manual-review posture

**Decision:** **`POTENTIAL_PHI_BY_DEFAULT_MANUAL_REVIEW_REQUIRED`**

| Rule | Detail |
|------|--------|
| Default | All owner clinic material potentially contains PHI |
| Assumption | No automatic “PHI absent” assumption |
| Forbidden destinations | Git; PR; CI; logs; stdout/stderr; manifest; test fixtures |
| P2-C1 | Performs no PHI scan — accesses no bytes |

---

## 13. De-identification boundary

**Decision:** **`NO_GIT_VISIBLE_DERIVATIVE_BEFORE_OWNER_AND_SECURITY_REVIEW`**

| Rule | Detail |
|------|--------|
| Forbidden without review | Normalized text; excerpt; anchor text; filenames; paths; content-derived free text in Git-visible form |
| Hashing | Hashing alone is **not** de-identification |
| P2-C1 | Records boundary only; performs no de-identification |

---

## 14. Digest / fingerprint restrictions

**Decision:** **`DIGESTS_LOCAL_ONLY_PENDING_SEPARATE_FINGERPRINT_REVIEW`**

| Rule | v1 posture |
|------|------------|
| Git | No real corpus digest |
| PR / CI logs | No digest |
| stdout / stderr | No digest |
| Manifest persistence | No digest |
| Public/repository comparison | No digest values |
| P2-C1 | Computes none |
| Future local run | Digest only after separate execution token specifies exact in-memory/local handling |

---

## 15. Protected-runner output / redaction contract

**Decision:** **`FIXED_REDACTED_ENGINEERING_CODES_ONLY`**

Future protected runner (not B3):

| Channel | Allowed | Forbidden |
|---------|---------|-----------|
| **stdout** | One fixed JSON status line; fixed engineering codes | Paths; filenames; hashes; byte lengths; anchors; header strings; snippets; PHI; argv echo; host; operator; timestamps |
| **stderr** | Empty | All content including native errors, stacks, diagnostics |
| **Modes** | None | Diagnostic/debug/content-dependent free text |

Do **not** inherit B3 fields (`byteLength`, `interpretiveEncoding`, structural counts, etc.) automatically.

---

## 16. Manifest field-classification table

**Decision:** **`SCHEMA_CLASSIFICATION_ONLY_C2_REQUIRED_FOR_CONCRETE_SCHEMA`**

P2-C1 records **field classes only**. No concrete schema, validator, or JSON schema is created.

### Potentially allowed after separate review

| Field class |
|-------------|
| `manifestVersion` |
| `toolVersion` |
| `policyVersion` |
| opaque `sourceArtifactId` |
| algorithm identifier |
| redacted status codes |
| PHI / manual-review status |
| structural status categories |

### Not automatically authorized

| Field class |
|-------------|
| real digest |
| byte length |
| encoding / BOM / EOL fingerprint |
| anchors |
| any content-derived value |

### Forbidden in repository manifest v1

| Field class |
|-------------|
| filename |
| path |
| patient ID |
| operator |
| hostname |
| source text / snippet |
| free-text note |
| timestamp |

Aligns with P2-A P2-OD-10 (`OPAQUE_ARTIFACT_ID_ONLY`), P2-OD-11 (`MINIMAL_REDACTED_CODES_ONLY`), P2-OD-13 (`OMIT_FROM_V1_REPOSITORY_MANIFEST`).

---

## 17. Local-only / no-persistence posture

**Decision:** **`LOCAL_ONLY_NO_PERSISTENCE_UNTIL_SEPARATE_REVIEW`**

| Rule | Detail |
|------|--------|
| P2-C1 | No manifest file created |
| Future persistence | Requires separate private-repository/security review; exact schema approval; owner review of synthetic example; explicit persistence token (**P2C-OD-19**) |

---

## 18. Cleanup / non-success contract

**Decision:** **`IMMEDIATE_BEST_EFFORT_DELETE_CLEANUP_FAILURE_IS_NON_SUCCESS`**

| Rule | Detail |
|------|--------|
| Default | Prefer no temp files |
| If temp authorized | Exact owner-controlled temp location; minimum necessary lifetime; best-effort immediate delete |
| Claims | No forensic-erasure claim |
| Failure | Cleanup failure → non-success; no PASS / full-run / persistence progression; fixed redacted remediation status only |
| Operations | No destructive disk operation |

Extends P2-A §6.1 and P2-OD-19 for future protected-runner scope.

---

## 19. Separate engineering failure namespace

**Decision:** **`SEPARATE_RULE5_PROTECTED_RUNNER_ENGINEERING_NAMESPACE`**

| Rule | Detail |
|------|--------|
| BV codes | Do **not** reuse or extend clinical BV meanings for filesystem, PHI, cleanup, or authorization failures |
| Protected runner | Fixed **`RULE5_PROTECTED_RUNNER_*`** engineering codes in future implementation contract |
| Messages | No native messages or free text |

Cleanup failure remains outside BV-v1 vocabulary (consistent with P2-A §6.1).

---

## 20. Three owner checkpoints

**Decision:** **`THREE_MANDATORY_OWNER_CHECKPOINTS`**

| Checkpoint | Required owner approval |
|------------|-------------------------|
| **1** | Before protected dry run |
| **2** | After dry-run report and before full run |
| **3** | Before any manifest persistence |

No token automatically authorizes the next checkpoint. Maps to P2-OD-16, P2-OD-17, P2-OD-18 without auto-chaining.

---

## 21. `ownerPrimaryVerified` non-advancement

**Decision:** **`EXPLICIT_POST_RECONCILIATION_OWNER_DECISION_REQUIRED`**

`ownerPrimaryVerified` remains **false / not set** through:

| Stage | Sets `ownerPrimaryVerified`? |
|-------|------------------------------|
| P2-C1 documentation | **No** |
| P2-C2 schema (future) | **No** |
| Tooling / dry run | **No** |
| Hash PASS | **No** |
| Structural PASS | **No** |
| Full run | **No** |

May change only after: byte evidence review; source-to-normalized reconciliation; medicine attribution review; PHI/security review; explicit owner governance decision. Does **not** imply clinical correctness (P1 PROV-OD-14; P2-A §12).

---

## 22. Authorization ladder

```
[COMPLETE] P2-A policy documentation
[COMPLETE] P2-B1 / P2-B2A / P2-B2B / P2-B2C / P2-B3 synthetic tooling
[THIS TRANCHE] P2-C1 security contract documentation
[FUTURE + TOKEN] P2-C2 synthetic manifest schema/validator (synthetic only)
[FUTURE + CHECKPOINT 1 + P2C-OD-17] Protected dry run (single artifact)
[FUTURE + OWNER REVIEW + CHECKPOINT 2 + P2C-OD-18] Protected full run
[FUTURE + SECURITY REVIEW + CHECKPOINT 3 + P2C-OD-19] Manifest persistence
[FUTURE + EXPLICIT GOVERNANCE] ownerPrimaryVerified (never auto)
```

---

## 23. Explicit non-claims

P2-C1 does **not** mean:

| Non-claim |
|-----------|
| Protected source was accessed |
| Path was located |
| PHI was scanned |
| De-identification was completed |
| Digest was computed |
| Byte proof was completed |
| Source was reconciled |
| Manifest was created or persisted |
| Dry run or full run was authorized |
| `ownerPrimaryVerified = true` |
| Clinical or safety validation occurred |
| Evidence was activated |
| Catalog was populated |
| Runtime was connected |

Evidence activation: **NONE**. Clinical validation: **0**. **`BYTE_PROOF_PENDING`**, **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`**, **`MANIFEST_PERSISTENCE_NOT_AUTHORIZED`**, **`CLI_RUNTIME_NOT_CONNECTED`** remain.

---

## 24. STOP boundary

P2-C1 **STOP** — no further work is authorized by this document alone:

| Forbidden without separate authorization |
|------------------------------------------|
| Protected-source access |
| Path discovery |
| Hashing on real corpus |
| Dry run or full run |
| Manifest creation or persistence |
| Code / tool / CLI implementation |
| Setting `ownerPrimaryVerified` |
| Catalog population |
| Runtime connection |
| P2-C2 implementation |

---

## 25. Appendix A — complete P2C-OD register

See §6 for the authoritative P2C-OD-01–19 table with decision tokens and summaries.

---

## 26. Appendix B — documentation verdict / status label

| Item | Value |
|------|--------|
| **Verdict label** | **`R5_P2C1_PROTECTED_SOURCE_AND_MANIFEST_SECURITY_CONTRACT_DOCUMENTATION_RECORDED`** |
| **Authorization ceiling** | **`DOCUMENTATION_ONLY_SECURITY_CONTRACT_RECORDED`** |
| **Classification** | **`P2_C1_DOCUMENTATION_ONLY_SECURITY_CONTRACT`** |

This verdict means **security contract documentation only**. It does **not** imply protected execution readiness, dry-run authorization, verification complete, manifest ready/persisted, or owner-primary verified.

**Evidence activation:** **NONE**. **Clinical validation:** **0**. **Runtime:** **NOT_IMPLEMENTED** / **NOT_CONNECTED**. **`BYTE_PROOF_PENDING`** and **`OWNER_PRIMARY_VERIFICATION_PENDING`** remain.

---

## 27. P2-C2 cross-reference (synthetic repo-safe manifest schema)

| Item | Status |
|------|--------|
| **P2-C2** | **`P2-C2 SYNTHETIC_REPO_SAFE_MANIFEST_SCHEMA_VALIDATOR_PRESENT`** — see P2-A §25.7 |
| **Scope** | Synthetic in-memory schema/validator/serializer only; **`NO_COMMITTED_JSON_FIXTURE`** |
| **Protected-local manifest** | **Unimplemented** — requires separate contract and authorization |
| **P2-C1 execution authority** | **Unchanged** — no protected-source access, dry/full run, or manifest persistence authorized |
| **B3 boundary** | B3 remains **permanently synthetic-only** |

---

## 28. P2-C3A cross-reference (Windows protected-runner technical contract)

| Item | Status |
|------|--------|
| **P2-C3A** | **`P2-C3A WINDOWS_PROTECTED_RUNNER_TECHNICAL_CONTRACT_DOCUMENTATION_RECORDED`** — see P2-A §25.8 |
| **Scope** | Documentation-only technical contract; **`PROTECTED_RUNNER_NOT_IMPLEMENTED`** |
| **Pure Node protected open** | **`PURE_NODE_PROTECTED_FILE_OPEN_NOT_AUTHORIZED`** |
| **Native hardening** | **`NATIVE_OR_VERIFIED_OS_HANDLE_HARDENING_REQUIRED`** before protected clinical bytes |
| **Security-access dry run** | **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** — distinct from byte verification |
| **P2-C1 execution authority** | **Unchanged** — no protected-source access, hashing, dry/full run, or manifest persistence authorized |
| **P2-C2 schema** | **Synthetic-only** — no reuse for protected results |
| **B3 boundary** | B3 remains **permanently Linux synthetic-only** |
