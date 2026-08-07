# Rule 5 — R5-M6B Medicine Evidence Audit Framework

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Classification** | DOCUMENTATION_ONLY_AUDIT_FRAMEWORK |
| **Registry** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded; historical v1 only; no replacement/remapping |
| **Rule 5** | NOT_IMPLEMENTED |
| **Orchestration** | NOT_CONNECTED |
| **Evidence activated** | NONE |
| **Thresholds authorized** | NONE |
| **Clinical selection authorized** | NO |
| **Potency authorized** | NO |
| **Dosage authorized** | NO |
| **Rule 6** | NOT_STARTED |
| **Runtime / deployment change** | NONE |

**Companion index:** [rule-05-medicine-evidence-audit-index-R5-M6B.md](./rule-05-medicine-evidence-audit-index-R5-M6B.md)

**Related governance (read-only context):**

- [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md) (R5-M6A inventory)
- [rule-05-owner-decisions-R5-M0.md](./rule-05-owner-decisions-R5-M0.md) (Rule 5 owner decisions)
- [rule-01-q3-precontract-owner-decisions.md](./rule-01-q3-precontract-owner-decisions.md) (Q3 pre-contract boundary — no Rule 5 activation)

**Canonical registry artifacts (identity only — not clinical authority):**

- `packages/medicine-registry/src/medicines.v2.json`
- `packages/medicine-registry/src/registry.v2.manifest.json`

**Historical v1 (39 incl. C11 — non-canonical for identity):**

- `packages/medicine-registry/src/medicines.v1.json`
- `packages/medicine-registry/src/registry.v1.manifest.json`

---

## 2. Purpose

This framework defines how each of the **38** canonical medicines will be audited **individually**, **consistently**, and **read-only** before any Rule 5 safety evidence may be considered for future activation milestones.

This document:

- Establishes source layers, precedence, per-medicine template sections, audit rules, and audit order.
- Does **not** perform medicine **A1** (or any medicine) audit in this PR.
- Does **not** copy clinical medicine body text into audit reports.
- Does **not** activate evidence, thresholds, potency, dosage, or runtime behavior.

No medicine in this framework or index is claimed to be clinically validated, safe, effective, indicated, contraindicated, or production-ready.

---

## 3. Source authority layers

Source categories below describe **classification only**. They do **not** copy materia-medica clinical body content.

| Layer | Classification | Role |
|-------|----------------|------|
| **1** | `OWNER_PROVIDED_SOURCE_CANDIDATE` | Owner transcript or owner-supplied source text where available. External transcript location must be cited as protected/reference metadata only — **never** as a local absolute path in committed audit output. Provenance and license are **not** automatically verified. |
| **2** | `NORMALIZED_OWNER_TEXT_COPY` | Tracked normalized corpus derived from owner-supplied text. **Not** primary authority. **Not** clinical validation. |
| **3** | `CURRENT_EHAS2_REGISTRY_V2` | Identity and current normalized metadata in `medicines.v2.json` / manifest. Structure and canonical code only — **not** clinical authority. |
| **4** | `LEGACY_NORMALIZED_ENGINE_COPY` | Legacy structured medicine registry/engine record (e.g. legacy app normalized registry). Comparison source only — **not** clinical evidence authority. |
| **5** | `HISTORICAL_OR_CONFLICTING_LEGACY_SOURCE` | Old catalog, partial SQL seed, alternate code lists, legacy mappings. Cannot silently change canonical identity or clinical meaning. |
| **6** | `OWNER_APPROVED_CLINICAL_EVIDENCE` | **Future** classification only. May be assigned **only** after explicit owner review and adequate provenance. |
| **7** | `INDEPENDENT_VALIDATED_CLINICAL_EVIDENCE` | **Future** classification only. **Not** currently assumed for any medicine. |

**No source layer is ACTIVE by default.** The lifecycle label **ACTIVE** (per R5-M6A vocabulary) applies only after separate future activation approval and is **out of scope** for M6B framework documentation.

---

## 4. Source precedence

1. **Canonical identity** comes from registry v2 and owner decision **CQ-001A** (`registry.v2.manifest.json`, `medicines.v2.json`).
2. **Clinical wording** must be traced to owner-provided source where available; gaps remain explicit.
3. **Registry or engine normalization** cannot create new clinical authority.
4. **Legacy scoring or selection output** cannot become materia-medica evidence.
5. **Conflicts** are recorded; never silently resolved or merged by convenience.
6. **Missing information** is not fabricated.
7. **Default posture:** no source is treated as validated, licensed, or activation-ready without per-medicine audit and explicit owner decisions where required.

---

## 5. Individual medicine audit template

Every future per-medicine audit record (one file or controlled artifact per medicine — **not created in this framework PR**) **must** include the following sections.

### 5.1 Audit identity

- Audit sequence number (1–38 per canonical order in §8)
- Canonical medicine code
- Registry version (`ehas2-medicine-registry-v2`)
- Registry row/blob reference (repo-relative pointer to v2 entry only)
- Audit date / audit record version
- Owner-decision status (pending / recorded / blocked)

### 5.2 Canonical identity

- Code (must match v2)
- Canonical display name, if present in authoritative source
- Aliases (if any)
- Excluded or conflicting aliases
- **No-remap confirmation** (especially: no C11 restoration, no code substitution)

### 5.3 Source inventory

For each source row:

- Source ID
- Source classification (§3 layers)
- Repository-relative or protected reference (no local absolute paths; no secrets)
- Source-present status
- Tracked / untracked / external status
- Provenance verification status
- License verification status
- Owner-provided status

### 5.4 Source lineage

- Primary narrative candidate (`OWNER_PROVIDED_SOURCE_CANDIDATE`)
- Normalized corpus copy (`NORMALIZED_OWNER_TEXT_COPY`)
- EHAS2 registry v2 row (`CURRENT_EHAS2_REGISTRY_V2`)
- Legacy engine normalization (`LEGACY_NORMALIZED_ENGINE_COPY`)
- Historical or conflicting sources (`HISTORICAL_OR_CONFLICTING_LEGACY_SOURCE`)
- Derived / copy relationships
- Duplication / supersession notes

### 5.5 Text integrity comparison

- Missing sections (vs owner primary where applicable)
- Added normalization (registry or tooling)
- Wording drift
- Duplicated text
- Conflicting claims
- Unsupported expansion
- **No silent correction** — changes require explicit owner decision when material

### 5.6 Materia-medica content inventory (inventory only — not approval)

Inventory presence/absence and source reference only for:

- Description
- Organ/system affinity
- Disease/condition associations
- Temperament relationship
- Blood/Lymph relationship
- Polarity
- Potency narrative
- Oral route
- External route
- Tablet/globule route
- Electricity relationship
- Formula/mixture claims
- Search tags

### 5.7 Rule 5 safety-evidence inventory

For **each** domain below, status must be **only** one of:

- `SOURCE_PRESENT_UNVALIDATED`
- `SOURCE_PRESENT_CONFLICTING`
- `SOURCE_NOT_FOUND`
- `OWNER_REVIEW_REQUIRED`
- `INDEPENDENT_VALIDATION_REQUIRED`
- `OWNER_APPROVED` (only after explicit future owner decision for that domain)

**Do not use ACTIVE.**

Domains:

- Contraindications
- Allergies / hypersensitivity
- Adverse effects
- Medicine–medicine interactions
- Medicine–condition interactions
- Route incompatibility
- Overdose / exposure
- Duration / cumulative-use risk
- Monitoring targets
- Pause criteria
- Stop criteria
- Emergency / red-flag criteria
- Follow-up timing
- Special-population considerations

### 5.8 Potency / dosage boundary

Record factually (no execution):

- Source-text potency claim (present/absent/conflicting)
- Source-text dilution claim
- Numeric dosage present/absent
- Frequency present/absent
- Duration present/absent
- Legacy engine calculation present/absent
- Owner authorization status for any numeric or executable use

**Mandatory:** Potency, dosage, and threshold text is **not** executable and **not** authorized merely because it appears in owner or legacy text.

### 5.9 Conflict register

- Conflict ID
- Topic
- Source A / B protected references
- Conflict classification
- Materiality
- Affected future rule/milestone
- Owner decision required (yes/no)
- **No silent precedence**

### 5.10 Gap register

- Gap ID
- Missing domain
- Severity for governance planning
- Affected Rule 5 / Rule 6 milestone
- Required evidence type
- Owner decision needed
- Activation blocker (yes/no)

### 5.11 Owner clinical decision queue (governance — not runtime)

- Question / decision ID
- Exact decision topic
- Options / evidence summary
- Owner answer (when recorded)
- Status

**Governance boundary:** The clinical system will **not** ask the doctor interactive questions during patient analysis (aligned with Rule 1 Q3G-TIE / pre-contract posture). This queue is for **software-governance owner decisions during development**, not runtime questioning or question banks.

### 5.12 Final audit classification

Boolean or enumerated posture fields (default **false** / not complete until audited):

| Field | Default before audit/approval |
|-------|-------------------------------|
| identityVerified | false |
| ownerSourceLocated | false |
| normalizedCopyMatched | false |
| provenanceVerified | false |
| licenseVerified | false |
| clinicallyValidated | false |
| rule5SafetyCoverageComplete | false |
| rule6RelationshipApproved | false |
| evidenceActivated | false |
| runtimeAuthorized | false |

### 5.13 Mandatory audit footer (per medicine audit)

Each completed medicine audit must end with:

| Item | Expected during M6B framework phase |
|------|-------------------------------------|
| Files read | Listed (repo-relative) |
| Files changed | None for read-only audits |
| Patient data accessed | NO |
| Secrets accessed | NO |
| Database accessed | NO |
| Legacy engine executed | NO |
| Evidence activated | NO |
| Thresholds authorized | NO |
| Potency/dosage authorized | NO |
| Medicine selected | NO |
| Rule 5 runtime changed | NO |
| Rule 6 started | NO |
| Deployment | NONE |

---

## 6. Audit rules

- Read-only source review only.
- **One medicine at a time.** Complete the current medicine audit before starting the next.
- **No fixed/default medicine** selection or implicit clinical winner.
- **No C11 restoration or remap.** C11 exists only in historical v1 context.
- **No clinical claim** from registry presence alone.
- **No clinical claim** from legacy score or engine output alone.
- **No cure/guarantee language.**
- **No raw PHI** or patient cases in audit artifacts.
- **No `.env`, secrets, or database access** during audits.
- **No legacy engine execution** for audit evidence gathering.
- **No copying** a full copyrighted book or source; short excerpts only when necessary and legally permitted; prefer paraphrase plus protected/reference citation.
- **Every unknown remains unknown.**
- **Every conflict remains explicit.**
- **Owner approval** and **independent validation** are separate axes.
- **Documentation approval** (including this framework) does **not** activate clinical evidence.

---

## 7. Audit order (canonical 38)

Exactly this sequence (matches [master index](./rule-05-medicine-evidence-audit-index-R5-M6B.md)):

1. A1 — **next audit target after framework merge** (not audited in framework PR)
2. A2
3. A3
4. APP
5. BE
6. C1
7. C2
8. C3
9. C4
10. C5
11. C6
12. C10
13. C13
14. C15
15. C17
16. F1
17. F2
18. GE
19. L1
20. P1
21. P2
22. P3
23. P4
24. RE
25. S-Lass
26. S1
27. S2
28. S3
29. S5
30. S6
31. S10
32. S11
33. S12
34. Ven1
35. Ver1
36. Ver2
37. WE
38. YE

**C11 is not in this list** and must not appear as a canonical audit row.

---

## 8. Project-level documentation accuracy (M6B)

Do **not** claim that owner or normalized source text contains complete contraindication, interaction, adverse-effect, monitoring, potency, or dosage evidence for all medicines.

Known posture on canonical `main` at framework authoring:

- Owner/normalized source material for the canonical medicine **set** may exist where prior discovery recorded it; **per-medicine audit is not yet complete** (completed audits = **0**).
- Source **existence ≠ clinical validation**.
- Safety evidence remains **unverified** until individual medicine audits complete.
- Rule 5 remains **NOT_IMPLEMENTED** (`nineRules.ts`, contract foundation).
- Rule 6 remains **NOT_STARTED**.
- Orchestration remains **NOT_CONNECTED**.
- R5-M6A inventory explicitly records **evidenceActivated: NONE** and **thresholdsAuthorized: NONE**.

This framework **does not** implement R5-M6B metadata catalog contracts described as future work in R5-M6A §15; it defines the **audit methodology and index** only.

---

## 9. Explicit non-authorization (this document)

This framework does **not** authorize:

- Changes to `medicines.v2.json`, manifests, or registry counts
- Rule 5 contract/code/test implementation
- Evidence catalog **ACTIVE** rows
- Threshold, timing, or monitoring target values
- Potency/dosage execution or authorization
- Medicine selection or clinical activation
- Legacy engine runs, database reads, or deployment

---

## 10. Framework footer (mandatory)

| Item | Value |
|------|--------|
| Files read (framework authoring) | R5-M6A inventory; registry v2 JSON/manifest; Rule 5 posture references |
| Files changed (this PR) | Framework + index only (see index footer) |
| Patient data accessed | NO |
| Secrets accessed | NO |
| Database accessed | NO |
| Legacy engine executed | NO |
| Evidence activated | NONE |
| Thresholds authorized | NONE |
| Potency/dosage authorized | NO |
| Medicine selected | NO |
| Rule 5 runtime changed | NO |
| Rule 6 started | NO |
| Deployment | NONE |

**Authority tag:** DOCUMENTATION_ONLY_AUDIT_FRAMEWORK · **Clinical validation claim:** NONE
