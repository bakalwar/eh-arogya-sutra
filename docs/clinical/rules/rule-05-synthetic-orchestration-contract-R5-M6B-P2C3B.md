# Rule 5 — R5-M6B synthetic in-memory orchestration contract (P2-C3B)

## 1. Document control

| Field | Value |
|-------|--------|
| **Phase** | **R5-M6B Track B — P2-C3B** |
| **Classification** | **DOCUMENTATION_ONLY** / **IMPLEMENTATION_CONTRACT_RECORDED** |
| **Decision register** | **C3B-Q01–Q16** (owner-locked) |
| **Contract correction** | **C3B-C01** — Proxy-detectability correction |
| **Authorization token (delivery)** | **`R5_P2C3B_SYNTHETIC_ORCHESTRATION_DOCUMENTATION_AUTHORIZED`** |
| **Authorization ceiling** | **`DOCUMENTATION_ONLY_SYNTHETIC_ORCHESTRATION_CONTRACT_RECORDED`** |
| **Canonical baseline (`main`)** | `abc24d312138908470bbc9c9ba080ededc8cad3f` |
| **Implementation PR** | **#73** — merge commit `abc24d312138908470bbc9c9ba080ededc8cad3f` |
| **Reviewed implementation head** | `d5e08d2649b300fd13773790e50e9fd2a448b114` |
| **Companion P2-A policy** | [rule-05-byte-verification-policy-R5-M6B-P2.md](./rule-05-byte-verification-policy-R5-M6B-P2.md) |
| **Companion P2-C3A contract** | [rule-05-windows-protected-runner-contract-R5-M6B-P2C3A.md](./rule-05-windows-protected-runner-contract-R5-M6B-P2C3A.md) |
| **Companion inventory** | [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md) |
| **Track B CA-1** | **EMPTY_STRUCTURAL_CONTRACT_PRESENT** — **catalog row count 0** |

This document records the **implemented and post-merge security-reviewed** P2-C3B synthetic in-memory orchestration contract only. It performs **no** new implementation, filesystem or native experiment, protected-source access, hashing, manifest creation or persistence, security-access dry run, full run, catalog population, or runtime connection.

---

## 2. Classification and authorization ceiling

| Boundary | Status |
|----------|--------|
| **Permitted in P2-C3B documentation** | Contract recording; status tokens; test/CI evidence summary; post-merge security-review result; resource-bound disclosure |
| **Not authorized by P2-C3B documentation** | C3C/C3D/C3E; Windows filesystem safety claims; native-helper selection; protected-source access; hashing or digest comparison; manifest construction/persistence; security-access dry/full run; byte-proof completion; clinical correctness claims; `ownerPrimaryVerified` advancement; catalog/runtime connection; external/untrusted C3B exposure |
| **Authorization ceiling** | **`DOCUMENTATION_ONLY_SYNTHETIC_ORCHESTRATION_CONTRACT_RECORDED`** |

P2-C3B documentation does **not** authorize the next P2C3 stage.

---

## 3. Canonical implementation identity

| Item | Value |
|------|--------|
| **Production module** | `tools/provenance/syntheticOrchestration.mjs` |
| **Unit tests** | `tests/unit/provenance-synthetic-orchestration.test.ts` |
| **Implementation PR** | **#73** |
| **Reviewed head** | `d5e08d2649b300fd13773790e50e9fd2a448b114` |
| **Merge commit / canonical `main` at review** | `abc24d312138908470bbc9c9ba080ededc8cad3f` |
| **Direct C3B tests** | **53 pass** |
| **Focused provenance regression** | **225 pass**, **17 platform-skipped** on Windows |
| **Latest implementation CI** | Run **31510678106** — **success** at `d5e08d2649b300fd13773790e50e9fd2a448b114` |
| **Post-merge security review** | **`R5_P2C3B_POST_MERGE_INDEPENDENT_SECURITY_REVIEW_PASS`** — owner acceptance **`R5_P2C3B_POST_MERGE_INDEPENDENT_SECURITY_REVIEW_ACCEPTED`** |

**Honest mechanical notes:**

- Post-merge **shuffled** focused provenance suite passed.
- C3B suite passed **twice** sequentially on merged files.
- **Typecheck** and **boundary verification** passed during merge verification; they were **not** rerun in the later post-merge security-review environment.
- The **full monorepo test suite** was **not** rerun during the post-merge security review.

---

## 4. Relationship to P2-C3A and P2C3-OD ladder

| Document / register | Relationship |
|---------------------|--------------|
| **P2-C3A** | Records Windows protected-runner architecture and **P2C3-OD-01–20**. P2-C3B fulfills the **C3B** stage of the §5 ladder — synthetic in-memory orchestration only. |
| **P2C3-OD-17** | Separate tokens required for C3B, C3C, C3D, C3E — **no auto-advance**. |
| **P2C3-OD-20** | Independent security review after C3B — **PASS recorded**; does **not** authorize C3C. |
| **P2C3-OD-04** | **B3_NON_REUSE_PERMANENT** — B3 remains Linux synthetic-only; C3B does not import B3 CLI. |
| **P2C3-OD-19** | **NO_MANIFEST_PERSISTENCE_THROUGH_C3** — C3B excludes manifest entirely. |

P2-C3B does **not** modify any P2C3-OD decision in P2-C3A.

---

## 5. C3B purpose and synthetic-only boundary

P2-C3B provides a **pure in-memory orchestrator** over **caller-owned synthetic bytes** and **caller-owned configuration objects**. It wires:

1. immutable byte snapshot
2. `inspectByteCharacteristics` (B1)
3. `parseSyntheticStructureFromBytes` (B2B/B2C)
4. optional `compareSyntheticStructure` (B2A) when expectation explicitly requests comparison

| Token | Meaning |
|-------|---------|
| **`SYNTHETIC_CALLER_OWNED_BYTES_ONLY`** | Bytes are supplied by the caller in-process; no filesystem read |
| **`NO_FILESYSTEM`** | No `node:fs`, path discovery, or CLI input |
| **`NO_CLI`** | C3B is library-only; B3 remains separate |
| **`NO_HASH_COMPUTATION`** | No digest computation or comparison |
| **`MANIFEST_COMPLETELY_EXCLUDED_FROM_C3B_V1`** | No manifest import, validation, serialization, or persistence |
| **`B3_NON_REUSE_PERMANENT`** | B3 CLI is not imported or repurposed |

C3B is **not** a protected-source runner, byte-proof engine, or clinical validator.

---

## 6. Locked C3B-Q01–Q16 register

| ID | Lock token | Recorded contract |
|----|------------|-------------------|
| **C3B-Q01** | **`INSPECT_PARSE_WITH_EXPLICIT_OPTIONAL_COMPARE`** | Always: snapshot → inspect → parse. Compare only when a third argument is supplied and `assessmentMode === 'COMPARE'`. Omission = parse-only. `{ assessmentMode: 'NOT_APPLICABLE' }` runs compare path with NOT_APPLICABLE outcome when encoding valid. |
| **C3B-Q02** | **`BYTE_ROOTS_BUFFER_AND_UINT8ARRAY_ONLY`** | Accepted roots: `Buffer` (when available) and `Uint8Array` only. All other roots → `INVALID_INPUT`. |
| **C3B-Q03** | **`STRICT_TRAP_SAFE_PLAIN_OBJECT_INPUTS`** | See **§7 C3B-C01**. Normative meaning: observational trap-safe validation of plain-object inputs; no universal Proxy rejection claim. |
| **C3B-Q04** | **`SINGLE_IMMUTABLE_BYTE_SNAPSHOT`** | Exactly one `Uint8Array.from` snapshot per call; downstream receives snapshot only. |
| **C3B-Q05** | **`SYNTHETIC_ONLY_NO_IO_HASH_MANIFEST_CLI`** | No filesystem, network, subprocess, hash, manifest, or CLI surface in C3B v1. |
| **C3B-Q06** | **`FIXED_DOWNSTREAM_IMPORT_SURFACE`** | Imports limited to `inspectByteCharacteristics`, `parseSyntheticStructureFromBytes`, `compareSyntheticStructure`, and wrapper-ambiguity symbols from parseStructure. |
| **C3B-Q07** | **`DEEP_COPY_AND_DEEP_FREEZE_OUTPUTS`** | Full envelopes deep-copied then deep-frozen; B1 inspection copied to fixed field set before freeze. |
| **C3B-Q08** | **`CANONICAL_CONFIG_EXPECTATION_BEFORE_DOWNSTREAM`** | Parser config and expectation canonicalized into plain acyclic objects before downstream calls; caller references do not reach downstream or output. |
| **C3B-Q09** | **`FIXED_OUTCOME_PRECEDENCE_LADDER`** | See **§15**. Wrapper ambiguity returns before ladder evaluation. |
| **C3B-Q10** | **`FIXED_ORCHESTRATION_ERROR_TAXONOMY`** | Four throwing orchestration codes plus mapped wrapper ambiguity code — see **§17**. |
| **C3B-Q11** | **`DETERMINISTIC_ENVELOPE_SHAPES_AND_KEY_ORDER`** | Fixed top-level keys and nested shapes — see **§16**. |
| **C3B-Q12** | **`WRAPPER_AMBIGUITY_MINIMAL_THREE_KEY_ENVELOPE`** | `Rule5WrapperSourceAmbiguityError` → minimal frozen `{ orchestrationVersion, outcome: 'WRAPPER_AMBIGUOUS', failureCode }` without throw. |
| **C3B-Q13** | **`ENCODING_INVALID_OVERRIDES_STRUCTURAL_PASS`** | When inspection encoding invalid, top outcome is `ENCODING_INVALID`; structural PASS is impossible. |
| **C3B-Q14** | **`EXPECTATION_OMISSION_VS_NOT_APPLICABLE_DISTINCT`** | Omission → `PARSED`, no `comparison`. NOT_APPLICABLE → `STRUCTURE_NOT_APPLICABLE` with comparison present when encoding valid. |
| **C3B-Q15** | **`PUBLIC_EXPORT_SURFACE_LOCKED`** | See **§8**. No helper exports beyond the locked surface. |
| **C3B-Q16** | **`STOP_BOUNDARY_NO_DOWNSTREAM_STAGE_AUTHORITY`** | See **§26**. C3C/C3D/C3E not authorized by C3B implementation or this document. |

---

## 7. Corrected Proxy-detectability contract C3B-C01

**C3B-C01** replaces any impossible blanket “reject all Proxy” rule.

| Rule | Detail |
|------|--------|
| **No universal Proxy detection** | Standard JavaScript cannot prove every transparent, non-revoked, non-trapping Proxy is a Proxy. **No universal Proxy-rejection claim** is made. |
| **Fail-closed traps** | Revoked proxies; throwing `getPrototypeOf`, `ownKeys`, or `getOwnPropertyDescriptor` traps; prototype ≠ `Object.prototype`; invariant-violating proxies → **`INVALID_CONFIG`** (config/expectation) or **`INVALID_INPUT`** (byte root). |
| **Getter/setter non-invocation** | Only own **data** descriptors with `.value` are read; getters/setters are **not** invoked. |
| **Transparent Proxy acceptance** | Observationally valid transparent Proxy over a valid plain target **may** be accepted. |
| **Canonical-copy isolation** | Even if a Proxy is accepted at validation time, canonical copies prevent caller object references from reaching downstream calls or returned output. |
| **Forbidden shortcuts** | No WeakSet branding, Node internals, or production test seams. |

---

## 8. Public API and export surface

| Export | Kind | Notes |
|--------|------|-------|
| `ORCHESTRATION_VERSION` | immutable string constant | `'P2-C3B-1'` |
| `MAX_SYNTHETIC_ORCHESTRATION_BYTES` | immutable number constant | `262144` |
| `RULE5_SYNTHETIC_ORCHESTRATION_INVALID_INPUT` | immutable string constant | |
| `RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG` | immutable string constant | |
| `RULE5_SYNTHETIC_ORCHESTRATION_INPUT_OVERSIZE` | immutable string constant | |
| `RULE5_SYNTHETIC_ORCHESTRATION_INTERNAL` | immutable string constant | |
| `RULE5_WRAPPER_SOURCE_AMBIGUOUS` | re-exported immutable string | from parseStructure |
| `Rule5SyntheticOrchestrationError` | Error subclass | `message === failureCode` |
| `evaluateSyntheticProvenanceOrchestration` | function | sole entry point |

No mutable exported object, registry, or runtime hook exists. Concurrent calls share **no** mutable orchestration state.

---

## 9. Allowed and forbidden imports

**Allowed (implemented):**

- `./verifyCore.mjs` — `inspectByteCharacteristics` only
- `./parseStructure.mjs` — `parseSyntheticStructureFromBytes`, `Rule5WrapperSourceAmbiguityError`, `RULE5_WRAPPER_SOURCE_AMBIGUOUS`
- `./verifyStructure.mjs` — `compareSyntheticStructure` only

**Forbidden (must not appear in C3B module):**

- `node:fs`, `node:path`, `node:os`, `node:crypto`
- `./manifestSchema.mjs`, `./readSyntheticInput.mjs`, `./verifySyntheticCli.mjs`
- `computeSha256V1`, hash/digest helpers, `process.env`, network/subprocess APIs

---

## 10. Byte-root and 262144-byte cap

| Token | Meaning |
|-------|---------|
| **`MAX_SYNTHETIC_ORCHESTRATION_BYTES_262144`** | Maximum accepted input length |
| **`SYNTHETIC_CALLER_OWNED_BYTES_ONLY`** | Caller supplies bytes in-process |

Rules:

- Roots: `Buffer` or `Uint8Array` only → else **`INVALID_INPUT`**
- Length must be non-negative integer → else **`INVALID_INPUT`**
- Length **> 262144** → **`INPUT_OVERSIZE`** before snapshot allocation
- Exactly **one** explicit `Uint8Array.from` snapshot per call
- Caller mutation after call does not affect results

---

## 11. ParserConfig and expectation schemas

### 11.1 ParserConfig

Allowed key sets (exact):

- `{ lengthUnit }`
- `{ lengthUnit, wrapperMode }` where `wrapperMode === 'FIXED_USER_QUERY_V1'`

`lengthUnit` ∈ `{ BYTE, UTF8_CODEPOINT, UTF16_CODE_UNIT, LINE_COUNT, ABSENT }`.

### 11.2 Expectation — omission

If the third argument is omitted: parse-only path; outcome **`PARSED`**; no `comparison`.

### 11.3 Expectation — NOT_APPLICABLE

Exact keys: `{ assessmentMode: 'NOT_APPLICABLE' }` only.

### 11.4 Expectation — COMPARE

Exact keys:

- `assessmentMode: 'COMPARE'`
- `expectedPhysicalHeader` — `/^MED=(?:None|[A-Z0-9]+)$/`
- `lineAnchorExpected` — positive integer or `'ABSENT'`
- `jsonlAnchorExpected` — non-negative integer or `'ABSENT'`
- `wrapper` — `{ openLine, closeLine, boundaryEndLine }`
- `excludedRanges` — dense array of `{ startLine, endLine }`
- `declaredLength` — non-negative integer or `'ABSENT'`
- `lengthUnit` — compare unit set including `'UNRESOLVED'` and `'ABSENT'`

**Wrapper numeric shape:** when both `openLine` and `closeLine` are numeric, require `openLine <= closeLine <= boundaryEndLine`. Mixed ABSENT/numeric shapes are rejected.

**Excluded ranges:** per-range positive integers with `startLine <= endLine`; non-overlapping by inclusive rule `current.startLine <= previous.endLine` after sorting a **local copy**; caller array order preserved in canonical expectation.

---

## 12. Trap-safe observational validation

Validation uses:

- `assertPlainObjectRoot` — rejects null, arrays, non-`Object.prototype` roots
- `Reflect.ownKeys` with string-key constraint
- `Object.getOwnPropertyDescriptor` — data properties only
- exact key-set equality for schema objects
- dense array index validation for `excludedRanges`

Introspection trap throws map to **`INVALID_CONFIG`** via `mapIntrospectionToInvalidConfig` after rethrowing known orchestration errors. This is **not** a broad `TypeError → INVALID_CONFIG` remap for downstream parse/compare failures — those map to **`INTERNAL`**.

---

## 13. Canonical-copy and caller-reference isolation

After validation:

- Parser config is a fresh plain object passed downstream
- Expectation is a fresh plain object/array structure
- Returned inspection, observation, and comparison are **deep-copied** then **deep-frozen**
- Caller-owned config/expectation mutation after the call does not alter returned results
- No caller object reference appears in output graph

---

## 14. Evaluation order

Per call:

1. Validate and snapshot bytes
2. Canonicalize parser config
3. If third argument supplied: canonicalize expectation
4. `inspectByteCharacteristics(snapshot)`
5. `parseSyntheticStructureFromBytes(snapshot, parserConfigCanonical)`
6. If wrapper ambiguity error: return minimal envelope (**stop**)
7. If expectation supplied: `compareSyntheticStructure(expectationCanonical, observationRaw)`
8. Select outcome and build full envelope

Malformed caller config throws **before** steps 4–7 complete. Wrapper ordering and excluded-range overlap violations throw **`INVALID_CONFIG`** before compare.

---

## 15. Outcome precedence

After successful parse (no wrapper ambiguity throw):

| Priority | Top-level `outcome` | Condition |
|----------|---------------------|-----------|
| — | **`WRAPPER_AMBIGUOUS`** | Early return from parse ambiguity — **not** part of `selectOutcome` |
| 1 | **`ENCODING_INVALID`** | `inspection.interpretiveEncoding !== 'PASS'` |
| 2 | **`STRUCTURE_NOT_APPLICABLE`** | `comparison.outcome === 'NOT_APPLICABLE'` |
| 3 | **`STRUCTURE_COMPARED_FAIL`** | `comparison.outcome === 'FAIL'` |
| 4 | **`STRUCTURE_COMPARED_PASS`** | `comparison.outcome === 'PASS'` |
| 5 | **`PARSED`** | No comparison performed |

Invalid encoding can **never** become structural PASS. Wrapper ambiguity can **never** become PARSED/PASS. Malformed caller contract **never** becomes a normal result.

---

## 16. Exact deterministic result shapes

### 16.1 Full envelope (parse or compare success path)

Top-level key order:

1. `orchestrationVersion`
2. `outcome`
3. `inspection`
4. `observation`
5. `comparison` — present only when expectation supplied

Inspection fields (exact set): `byteLength`, `utf8`, `bom`, `eol`, `loneCrObserved`, `terminalNewline`, `interpretiveEncoding`.

BV codes appear **only** inside `comparison` (`primaryBvCode`, `bvCodes`). No top-level BV fields.

### 16.2 Wrapper ambiguity envelope (exactly three keys)

1. `orchestrationVersion`
2. `outcome: 'WRAPPER_AMBIGUOUS'`
3. `failureCode: RULE5_WRAPPER_SOURCE_AMBIGUOUS`

No inspection, observation, or comparison.

---

## 17. Error class and fixed failure codes

**Class:** `Rule5SyntheticOrchestrationError` — `message === failureCode`.

**Throwing codes (orchestration-owned):**

| Code | When |
|------|------|
| `RULE5_SYNTHETIC_ORCHESTRATION_INVALID_INPUT` | Bad byte root or length access |
| `RULE5_SYNTHETIC_ORCHESTRATION_INVALID_CONFIG` | Malformed parser config or expectation |
| `RULE5_SYNTHETIC_ORCHESTRATION_INPUT_OVERSIZE` | Length > 262144 |
| `RULE5_SYNTHETIC_ORCHESTRATION_INTERNAL` | Unexpected downstream failure after validation |

**Mapped non-throw code:**

| Code | When |
|------|------|
| `RULE5_WRAPPER_SOURCE_AMBIGUOUS` | Wrapper source ambiguity — minimal envelope |

No new codes are defined by this document. Errors do not leak native messages, paths, raw bytes, or caller field values.

---

## 18. Wrapper ambiguity mapping

When `parseSyntheticStructureFromBytes` throws `Rule5WrapperSourceAmbiguityError`:

- **Do not throw** orchestration error
- Return minimal three-key frozen envelope
- **Do not** run compare
- **Do not** attach inspection/observation

Unrelated invalid config still throws **`INVALID_CONFIG`**, not wrapper ambiguity.

---

## 19. Encoding-invalid and NOT_APPLICABLE behavior

| Case | Top outcome | `comparison` |
|------|-------------|--------------|
| Expectation omitted + invalid encoding | `ENCODING_INVALID` | absent |
| NOT_APPLICABLE + invalid encoding | `ENCODING_INVALID` | present; comparator may record NOT_APPLICABLE internally but top outcome is encoding-invalid |
| COMPARE + invalid encoding | `ENCODING_INVALID` | present; `primaryBvCode` may be `BV-ENC-INVALID` |
| NOT_APPLICABLE + valid encoding | `STRUCTURE_NOT_APPLICABLE` | `{ outcome: 'NOT_APPLICABLE', reason: 'AUDIT_EXPECTATION_NOT_APPLICABLE' }` |
| Expectation omitted + valid encoding | `PARSED` | absent |

Omission and NOT_APPLICABLE remain **distinct**.

---

## 20. Immutability and leakage controls

| Control | Status |
|---------|--------|
| Result root frozen | yes |
| inspection / observation / comparison frozen | yes |
| Nested occurrence / wrapper / range objects frozen | yes |
| Raw bytes in output | **no** |
| Caller object references in output | **no** |
| Paths / env / argv / hashes / timestamps | **no** |
| Native error text in fixed fields | **no** |
| `ownerPrimaryVerified` | **absent** |
| Manifest fields | **absent** |

---

## 21. Test and CI evidence

| Evidence | Result |
|----------|--------|
| Direct C3B unit tests | **53 pass** |
| Focused provenance regression | **225 pass**, **17 skipped** (Windows B3 Linux-only tests) |
| Implementation CI run **31510678106** | **success** @ `d5e08d2` |
| Trap/proxy tests | D01–D12 |
| Caller domain validation tests | 12 tests — wrapper ordering and excluded-range overlap |
| Static import boundary scan | T25 |
| Deep-freeze and caller-mutation tests | T12–T14, D12 |

Tests use neutral synthetic `MED=TOK*` bytes only. No protected paths, manifests, B3 CLI execution from C3B tests, or clinical corpus fixtures.

---

## 22. Post-merge security-review result

| Item | Value |
|------|--------|
| **Review classification** | **`R5_P2C3B_POST_MERGE_INDEPENDENT_SECURITY_REVIEW_PASS`** |
| **Owner acceptance** | **`R5_P2C3B_POST_MERGE_INDEPENDENT_SECURITY_REVIEW_ACCEPTED`** |
| **C3C gate** | Review **PASS** satisfies P2C3-OD-20 post-C3B requirement — **C3C remains NOT AUTHORIZED** |
| **Blocking security defects** | **None recorded** |

---

## 23. Resource-bound note

| Resource | Bound | Notes |
|----------|-------|-------|
| Input bytes | **262144 max** | Enforced before snapshot |
| Parsed occurrences | bounded by input size | Derived from scanned lines in snapshot |
| `excludedRanges` element count | **no separate cap in v1** | Validation performs **O(n log n)** sort + **O(n)** traversal on caller array length |

**Status token:** **`EXCLUDED_RANGES_ELEMENT_CAP_NOT_SET_TRUSTED_IN_PROCESS_ONLY`**

Conservative recording:

- C3B is currently restricted to **trusted same-process caller-owned neutral synthetic inputs**.
- The finding is **self-DoS / resource-hardening**, not protected-source authority or privilege escalation.
- C3B must **not** be exposed to untrusted/external caller-controlled expectation arrays without a **separately reviewed element-count cap**.
- **No claim** that all C3B resources are independently bounded.
- **No cap value** is invented in this documentation tranche.
- A later cap requires **separate contract and implementation authorization**.

This status must **not** be described as production-external safe.

---

## 24. Explicit non-claims

P2-C3B implementation and this document do **not** claim or authorize:

- C3C / C3D / C3E
- Windows filesystem safety or native helper selection
- Protected-source access or byte-proof completion
- Hashing, digest comparison, or manifest construction/persistence
- Security-access dry run or full run
- Clinical correctness or protected-source validation
- `ownerPrimaryVerified` advancement
- Catalog population or runtime connection
- External/untrusted C3B exposure safety

No outcome implies byte proof, protected-source validation, or clinical correctness.

---

## 25. C3C gate status

| Token | Meaning |
|-------|---------|
| **`POST_C3B_INDEPENDENT_SECURITY_REVIEW_PASS`** | Post-C3B security review recorded |
| **`C3C_NOT_AUTHORIZED`** | Windows filesystem/native feasibility spike **not started** |
| **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** | No protected bytes |
| **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** | No dry run |
| **`NATIVE_OR_VERIFIED_OS_HANDLE_HARDENING_REQUIRED`** | Unchanged from P2-C3A |

C3C requires a **later separate contract** and **owner authorization token**. This documentation tranche does **not** select a native helper or authorize filesystem experiments.

---

## 26. STOP boundary

**Stop after P2-C3B documentation merge review.** Do **not** proceed without separate owner authorization for:

- **C3C** Windows synthetic filesystem / native feasibility spike
- **C3D** protected-runner implementation
- **C3E** security-access dry run on protected bytes
- Hash computation, digest comparison, or structural assessment on protected corpus
- Manifest persistence or protected-local schema
- Catalog population, runtime connection, or `ownerPrimaryVerified` advancement
- `excludedRanges` element-count cap implementation (unless separately authorized)

---

## 27. Status tokens (P2-C3B recorded)

| Token | Meaning |
|-------|---------|
| **`P2-C3B SYNTHETIC_IN_MEMORY_ORCHESTRATION_IMPLEMENTED`** | Module merged on `main` via PR #73 |
| **`P2-C3B SYNTHETIC_IN_MEMORY_ORCHESTRATION_TESTS_PRESENT`** | 53 direct unit tests present |
| **`POST_C3B_INDEPENDENT_SECURITY_REVIEW_PASS`** | Post-merge security review passed |
| **`SYNTHETIC_CALLER_OWNED_BYTES_ONLY`** | Caller-owned in-process bytes only |
| **`MAX_SYNTHETIC_ORCHESTRATION_BYTES_262144`** | Byte cap |
| **`STRICT_TRAP_SAFE_OBSERVATIONAL_VALIDATION_PRESENT`** | Trap-safe validation implemented |
| **`CANONICAL_COPY_CALLER_REFERENCE_ISOLATION_PRESENT`** | Canonical copy isolation implemented |
| **`FROZEN_IN_MEMORY_RESULTS_PRESENT`** | Deep-freeze outputs implemented |
| **`OPTIONAL_EXPLICIT_SYNTHETIC_COMPARISON_PRESENT`** | Explicit compare when expectation supplied |
| **`NO_HASH_COMPUTATION`** | No hashing in C3B |
| **`MANIFEST_COMPLETELY_EXCLUDED_FROM_C3B_V1`** | No manifest in C3B |
| **`NO_FILESYSTEM`** | No filesystem access |
| **`NO_CLI`** | No CLI in C3B |
| **`B3_NON_REUSE_PERMANENT`** | B3 not reused |
| **`C3C_NOT_AUTHORIZED`** | Next stage not authorized |
| **`PROTECTED_SOURCE_EXECUTION_NOT_AUTHORIZED`** | No protected source |
| **`SECURITY_ACCESS_DRY_RUN_NOT_AUTHORIZED`** | No dry run |
| **`NO_MANIFEST_PERSISTENCE`** | No manifest persistence |
| **`BYTE_PROOF_PENDING`** | Owner corpus byte proof pending |
| **`OWNER_PRIMARY_VERIFIED_NOT_ADVANCED`** | Not advanced |
| **`CLI_RUNTIME_NOT_CONNECTED`** | Runtime not connected |
| **`EXCLUDED_RANGES_ELEMENT_CAP_NOT_SET_TRUSTED_IN_PROCESS_ONLY`** | Resource-bound disclosure — trusted in-process only |

---

## 28. Verdict

| Field | Value |
|-------|--------|
| **Verdict label** | **`R5_P2C3B_SYNTHETIC_ORCHESTRATION_CONTRACT_DOCUMENTATION_RECORDED`** |
| **Meaning** | Implemented P2-C3B contract recorded on `main` after authorized documentation delivery |
| **Does not imply** | C3C authorized; protected bytes accessed; byte proof complete; manifest ready; clinical validation; runtime connected |

**Delivery token (for authorized documentation PR):** **`R5_P2C3B_SYNTHETIC_ORCHESTRATION_DOCUMENTATION_DELIVERED_FOR_REVIEW`**
