# Rule 5 — R5-M6B provenance and source-authority charter (P1)

## 1. Identity and scope

| Field | Value |
|-------|--------|
| **Phase** | **R5-M6B Track B — P1** |
| **Classification** | **DOCUMENTATION_ONLY** |
| **Persistence base (canonical `main`)** | `9f1acacc961cdeda27bbb1d3655d1a456bf4c25e` |
| **Companion inventory** | [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md) (R5-M6A) |
| **Track A (medicine documentation audits)** | **COMPLETE** — **38/38** ([master index](./rule-05-medicine-evidence-audit-index-R5-M6B.md)) |
| **Track B CA-1** | **EMPTY_STRUCTURAL_CONTRACT_PRESENT** — runtime **NOT_IMPLEMENTED** / **NOT_CONNECTED** ([catalog contract T1/CA-1](./rule-05-evidence-catalog-contract-R5-M6B.md)) |
| **Evidence activated** | **NONE** |
| **Clinically validated medicines (program rollups)** | **0** |
| **Catalog row count** | **0** |
| **CATALOG_ROW_ID_NAMESPACE** | **OWNER_DECISION_REQUIRED** (TB-OD-02) |

This document records **owner provenance and source-authority declarations** and **governance boundaries** only. It does **not** commit original transcripts, perform byte verification, create catalog rows or row IDs, set `ownerPrimaryVerified` to true, close FG/CQ items, mutate the medicine registry, connect runtime, or authorize T4/T5/R5-M7.

---

## 2. Canonical main baseline

| Item | Status on base `9f1acacc961cdeda27bbb1d3655d1a456bf4c25e` |
|------|----------------------------------------------------------|
| CA-1 empty structural contract | **EMPTY_STRUCTURAL_CONTRACT_PRESENT** |
| Rule 5 runtime | **NOT_IMPLEMENTED** / **NOT_CONNECTED** |
| Catalog populated rows | **0** |
| Evidence activation | **NONE** |
| Clinical validation (medicine program) | **0** |
| FG-001 / FG-004 / FG-009 | **OPEN** |
| CQ-001–CQ-008 | **Unresolved** |
| T4 populated catalog | **BLOCKED** |
| T5 activation | **NOT_AUTHORIZED** / **BLOCKED** |

P1 does not change any of the above statuses.

---

## 3. Owner declaration and limitations

The owner records the following **provenance declarations** (PROV-OD register). Each declaration establishes **claimed custody/authorship posture** and **governance intent** only.

| Limitation | Statement |
|------------|-----------|
| Not independent clinical validation | Owner declarations do **not** substitute for clinical evidence review. |
| Not safety validation | Declarations do **not** establish safety-complete or monitoring authority. |
| Not legal adjudication | Declarations do **not** replace license review or redistribution rights analysis. |
| Not `ownerPrimaryVerified` | No declaration in P1 sets medicine-level `ownerPrimaryVerified` to true. |
| Not byte proof | P1 does **not** compute hashes or reconcile declared line/length anchors. |

---

## 4. Source-tier model

| Tier | Status label | May cite in catalog metadata (future)? | Must remain derived/quarantined? |
|------|--------------|----------------------------------------|----------------------------------|
| **Owner corpus (original)** | **OWNER_DECLARED_ORIGINAL** — **BYTE_PROOF_PENDING** — **OWNER_PRIMARY_VERIFICATION_PENDING** | **No** until P2+ byte policy and reconciliation | Original bytes **not** in Git (P1) |
| **Normalized corpus (derived)** | **DERIVED_FROM_OWNER_SOURCE_CLAIMED** — **SOURCE_BYTES_NOT_YET_RECONCILED** | **No** as verified primary | Treat as derived; distinct ID/hash from original (future) |
| **Medicine registry v2** | **DERIVED_UNVERIFIED_INDEX_ONLY** | Identity/index aid only | Must not override owner corpus or conflict records |
| **38 medicine audit artifacts** | **DOCUMENTATION_INVENTORY_ONLY** | Audit-tier citation only | Not clinical or safety authority |
| **Published Materia Medica** | **NOT_USED_IN_CURRENT_CORPUS** — **FUTURE_LEGAL_REVIEW_REQUIRED_IF_INTRODUCED** | Only after separate tier + legal review | Must not silently merge into owner corpus |
| **Dev / API / mock / formula / selector strings** | **QUARANTINED_NO_OWNER_MERGE** | **Forbidden** | No Rule 5 credit; no owner merge |

**Prohibited status labels in affirmative use:** do **not** assign **VERIFIED_OWNER_PRIMARY**, **CLINICALLY_VALIDATED**, **SAFETY_COMPLETE**, **LICENSE_VERIFIED**, **REDISTRIBUTION_APPROVED**, or **ACTIVE** evidence rows unless explicitly negating or prohibiting those states.

---

## 5. Original vs normalized corpus distinction

**Decision ID:** **PROV-OD-02** — **BOTH_SEPARATELY_LABELED**

| Principle | Record |
|-----------|--------|
| Original custody | Original notes, transcripts, and data files remain **under owner control** and are **not** added to Git in P1. |
| Normalized artifact | Normalized corpus is a **derived artifact** from owner preparation (see PROV-OD-01). |
| Byte identity | Original and normalized forms must **never** be silently treated as byte-identical. |
| Future verification | Both require **distinct identifiers and hashes** in a future verification phase (P2). |
| P1 scope | **No** original file is committed in P1. |

---

## 6. Custody and repository-use boundary

**Decision ID:** **PROV-OD-05** — **OWNER_ORIGINAL_CONTENT_PRIVATE_GOVERNANCE_USE_ALLOWED**

| Allowed (governance) | Not allowed (P1 / Git) |
|----------------------|-------------------------|
| Owner permits **governance use** of owner-created medicine corpus material in the **private project** context | Committing **raw clinic notes** containing PHI |
| Recording declarations and future verification **policy** in documentation | Stating **broad public redistribution rights** |
| Future (separate review): de-identified derivative, non-PHI metadata, or hashes/manifests | Stating that **third-party content is licensed** without legal record |

Possession of files in a private workspace does **not** prove redistribution permission.

---

## 7. PHI and de-identification prohibition

| Rule | Detail |
|------|--------|
| Raw clinic notes | **Forbidden** from Git commits in this program tranche. |
| Patient identifiers | **Forbidden** from repository content (names, phones, addresses, emails, account IDs). |
| Protected original records | Remain **outside** canonical repository unless a **separate security review** explicitly authorizes a de-identified derivative or non-PHI manifest. |
| P1 content | This charter contains **no** patient data and **no** raw transcript bodies. |

---

## 8. Registry-derived role

**Decision ID:** **PROV-OD-11** — **DERIVED_UNVERIFIED_INDEX_ONLY**

| Statement | Detail |
|-----------|--------|
| `medicines.v2.json` + manifest | **Identity/index aids only** for the 38-medicine set (excluding legacy C11 posture per audits). |
| Not authorship proof | Registry does **not** prove owner authorship of corpus text. |
| Not clinical/safety proof | Registry does **not** prove clinical correctness, safety, or activation eligibility. |
| Precedence | Registry must **not** override owner corpus tiers or open conflict records (CF-*, TGC-*, ME-*). |

---

## 9. Third-party publication policy

**Decision ID:** **PROV-OD-04** — **NO_THIRD_PARTY_PUBLICATION_AUTHORITY_IN_CURRENT_CORPUS**

| Statement | Detail |
|-----------|--------|
| Current corpus | Owner declares **no third-party book/publication text** was copied into the medicine corpus (PROV-OD-01). |
| Future publication | Any published Materia Medica must enter as a **separately identified source tier** with source, edition, license/permission, and **legal review** before repository use. |
| Merge rule | Third-party publication must **not** silently merge into owner corpus. |

**Decision ID:** **PROV-OD-13** — **REQUIRED_IF_THIRD_PARTY_SOURCE_IS_INTRODUCED**

If any external publication is introduced later, source, license, permission, and legal review are **mandatory** before repository inclusion or redistribution. **File possession alone is not permission.**

---

## 10. Missing-primary medicine policy

**Decision ID:** **PROV-OD-08** — **HOLD_WITH_EXPLICIT_NOT_LOCATED_STATUS**

For **APP**, **BE**, **RE**, and **Ver2** (per Track A audits and index):

| Rule | Detail |
|------|--------|
| Owner-primary | Remains **NOT_LOCATED** / **OWNER_PRIMARY_CORPUS_NOT_LOCATED** — **unchanged** by P1. |
| `ownerPrimaryVerified` | **Must not** be set true. |
| Catalog rows | **No** fabricated populated catalog row in P1 or implied by P1. |
| Future work | Owner-source location/hunt may be performed in a **separate** authorized tranche. |
| Byte anchors | **N/A** until a real source block is located — **no fabricated anchors**. |

---

## 11. MED=None electricity attribution policy

**Decision ID:** **PROV-OD-09** — **CATEGORY_ATTRIBUTION_DOCUMENTATION_ONLY**

For **GE**, **WE**, and **YE**:

| Rule | Detail |
|------|--------|
| Physical header | Preserve **`MED=None`** as documented in audits. |
| Semantics | Electricity attribution remains **provisional documentation** only. |
| Normalization | Do **not** rewrite `MED=None` to `MED=GE`, `MED=WE`, or `MED=YE`. |
| Authority | Do **not** create medicine or clinical authority from this attribution. |
| Row design | Future catalog row design remains **deferred** (PROV-OD-12 / TB-OD-02). |

---

## 12. Duplicate-header and no-silent-merge policy

**Decision ID:** **PROV-OD-10** — **NO_SILENT_MERGE**

| Rule | Detail |
|------|--------|
| Ven1 and similar | Retain existing **authoritative-candidate A** posture; keep **quarantined B** / non-owner occurrences **separate**. |
| Merge | Do **not** merge text or evidence automatically. |
| Conflicts | Existing conflict flags (e.g. CF-VEN1-*, CF-SLASS-*) remain **OPEN**. |

---

## 13. Future byte-proof acceptance framework

**Decision ID:** **PROV-OD-06** — **BOTH_ANCHOR_AND_FULL_ARTIFACT_PROOF_REQUIRED**

Future verification (P2+, not authorized in P1) must include:

| Requirement | Detail |
|-------------|--------|
| Medicine-level reconciliation | Line/header/jsonl/declared-length reconciliation **where applicable**. |
| Full-artifact hash | Cryptographic hash over the agreed artifact scope. |
| Mismatch recording | Document mismatches; preserve OPEN flags — no silent fix. |
| Missing anchors | **N/A** for medicines without a real source anchor. |
| Fabrication | **No** fabricated anchors. |

P1 **does not** execute this program.

---

## 14. Hash and normalization decisions deferred to P2

**Decision ID:** **PROV-OD-07** — **DEFER_EXACT_POLICY_TO_P2**

| P1 | P2 (future) |
|----|-------------|
| May **propose** SHA-256 as a candidate algorithm | Must **finalize** byte-normalization rules |
| Must **not** finalize normalization algorithm | Must distinguish: raw-byte hash; normalized-artifact hash; UTF-8/BOM; CRLF/LF; Unicode normalization; excluded non-owner regions; tool/version identity |
| Must **not** rewrite source files during verification | Verification is **read-only** on source artifacts |

---

## 15. FG-001, FG-004, and FG-009 relationship

| FG | P1 effect |
|----|-----------|
| **FG-001** | Remains **OPEN**. P1 does not implement populated catalog module or close FG-001. |
| **FG-004** | Remains **OPEN**. P1 does not introduce validated EH materia medica package. |
| **FG-009** | Remains **OPEN**. P1 records governance boundaries only; no license verification. |
| **FG-005 / FG-007** | **Unchanged** by P1 unless directly cited for separation — no closure. |

---

## 16. CQ-001 relationship

| Item | Posture |
|------|---------|
| **CQ-001** | Remains **unresolved**. Question: authoritative Electrohomeopathy sources for **monitoring and safety** (M6A §14). |
| **CQ-002–CQ-008** | Remain **unresolved**. |
| P1 | Records owner corpus **provenance** declarations; does **not** answer CQ-001 clinical/source-authority for monitoring/safety activation. |

---

## 17. Row-ID and TB-OD-02 deferral

**Decision ID:** **PROV-OD-12** — **OWNER_DECISION_REQUIRED**

| Rule | Detail |
|------|--------|
| Row entity | P1 does **not** decide whether a future row represents a medicine, source document, source assertion, medicine × source × claim, or opaque entry. |
| TB-OD-02 | **CATALOG_ROW_ID_NAMESPACE** remains **OWNER_DECISION_REQUIRED**. |
| Authorization | **No** row-ID namespace and **no** row type implementation in P1. |

---

## 18. Clinical, safety, and runtime separation

**Decision ID:** **PROV-OD-14** — **MANDATORY_SEPARATE_GATES**

| Gate | Separation |
|------|------------|
| Authorship declaration | ≠ byte verification |
| Byte verification | ≠ `ownerPrimaryVerified` |
| `ownerPrimaryVerified` | ≠ clinical validation |
| Clinical validation | ≠ safety-complete |
| Safety-complete | ≠ activation |
| Catalog presence (future) | ≠ runtime authorization |

Rule 5 must **not** select medicine, potency, dosage, route, or electricity from catalog metadata in P1 or by implication of P1.

---

## 19. Explicit non-claims

P1 does **not** claim:

- Independent clinical validation of any medicine.
- Safety-complete monitoring or adverse-event authority.
- Verified owner-primary status for any medicine.
- License verification or redistribution approval for any tier.
- ACTIVE evidence or runtime-connected Rule 5 behavior.
- Closure of any FG or CQ item.
- Population of evidence catalog rows or assignment of catalog row IDs.
- That repository possession equals legal permission to redistribute third-party works.

---

## 20. STOP boundary

**Stop after P1 documentation** on authorized merge path (Draft PR review). **Do not** proceed without separate owner authorization to:

- P2 byte-verification tooling or source-file hash computation in-repo.
- Commit original transcripts, jsonl corpus bodies, or raw clinic notes.
- Catalog row-ID namespace selection (TB-OD-02).
- T4 populated catalog or T5 runtime integration.
- R5-M7+ milestones, FG/CQ closure, registry mutation, or `ownerPrimaryVerified = true`.

---

## Appendix A — PROV-OD owner decision register (P1 recorded)

| ID | Decision | Recorded choice |
|----|----------|-----------------|
| **PROV-OD-01** | Authority model | **OWNER_CORPUS_PRIMARY_PROVENANCE_CANDIDATE** — corpus prepared by owner from original clinic medicine notes, observations, and professional experience; owner declares no third-party publication text copied into medicine corpus; not clinical/safety/legal adjudication |
| **PROV-OD-02** | Original vs normalized | **BOTH_SEPARATELY_LABELED** |
| **PROV-OD-03** | Authorship attestation | **OWNER_DECLARATION_RECORDED** — does not set `ownerPrimaryVerified` true |
| **PROV-OD-04** | Published MM role | **NO_THIRD_PARTY_PUBLICATION_AUTHORITY_IN_CURRENT_CORPUS** |
| **PROV-OD-05** | Repository permission / PHI | **OWNER_ORIGINAL_CONTENT_PRIVATE_GOVERNANCE_USE_ALLOWED** |
| **PROV-OD-06** | Byte-proof acceptance | **BOTH_ANCHOR_AND_FULL_ARTIFACT_PROOF_REQUIRED** (future P2+) |
| **PROV-OD-07** | Hash/normalization | **DEFER_EXACT_POLICY_TO_P2** |
| **PROV-OD-08** | Missing-primary (APP, BE, RE, Ver2) | **HOLD_WITH_EXPLICIT_NOT_LOCATED_STATUS** |
| **PROV-OD-09** | MED=None (GE, WE, YE) | **CATEGORY_ATTRIBUTION_DOCUMENTATION_ONLY** |
| **PROV-OD-10** | Duplicate headers | **NO_SILENT_MERGE** |
| **PROV-OD-11** | Registry role | **DERIVED_UNVERIFIED_INDEX_ONLY** |
| **PROV-OD-12** | Catalog row entity | **OWNER_DECISION_REQUIRED** |
| **PROV-OD-13** | Third-party legal review | **REQUIRED_IF_THIRD_PARTY_SOURCE_IS_INTRODUCED** |
| **PROV-OD-14** | Clinical/safety separation | **MANDATORY_SEPARATE_GATES** |

---

## Appendix B — P1 verdict label

**`R5_M6B_P1_PROVENANCE_CHARTER_DOCUMENTATION_RECORDED`**

Evidence activation: **NONE**. Clinical validation: **0**. Runtime: **NOT_IMPLEMENTED** / **NOT_CONNECTED**.
