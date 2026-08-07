# Rule 5 — R5-M6B 38-Medicine Evidence Audit Index

## 1. Document control

| Field | Value |
|-------|--------|
| **Owner** | Dr. Ghanshyam Bakalwar |
| **Phase** | R5-M6B |
| **Classification** | DOCUMENTATION_ONLY_AUDIT_FRAMEWORK |
| **Registry** | `ehas2-medicine-registry-v2` |
| **Medicine count** | 38 |
| **C11** | Excluded; historical v1 only (`registry.v1.manifest.json` / `medicines.v1.json`); no replacement/remapping |
| **Rule 5** | NOT_IMPLEMENTED |
| **Orchestration** | NOT_CONNECTED |
| **Evidence activated** | NONE |
| **Thresholds authorized** | NONE |
| **Clinical selection authorized** | NO |
| **Potency authorized** | NO |
| **Dosage authorized** | NO |
| **Rule 6** | NOT_STARTED |
| **Runtime / deployment change** | NONE |

**Framework (methodology):** [rule-05-medicine-evidence-audit-framework-R5-M6B.md](./rule-05-medicine-evidence-audit-framework-R5-M6B.md)

**R5-M6A evidence inventory:** [rule-05-evidence-inventory-R5-M6.md](./rule-05-evidence-inventory-R5-M6.md)

**Registry verification (read-only, canonical `main`):**

- `packages/medicine-registry/src/medicines.v2.json` — **38** records; set verified against this index
- `packages/medicine-registry/src/registry.v2.manifest.json` — `medicineCount: 38`, `excludedCodes: ["C11"]`

---

## 2. Canonical 38 set (audit order)

A1, A2, A3, APP, BE, C1, C2, C3, C4, C5, C6, C10, C13, C15, C17, F1, F2, GE, L1, P1, P2, P3, P4, RE, S-Lass, S1, S2, S3, S5, S6, S10, S11, S12, Ven1, Ver1, Ver2, WE, YE

**Count assertion:** 38 unique codes · **C11:** absent from v2 · **No duplicate codes** in index

---

## 3. Master audit index

Initial posture for all medicines until individual read-only audits are performed. **No medicine is clinically validated by this table.**

| Seq | Medicine code | Identity status | Owner source status | Registry comparison status | Legacy comparison status | Provenance status | License status | Clinical-content audit | Rule 5 safety audit | Potency/dosage authorization | Owner decision status | Evidence activation | Audit record link |
|----:|:-------------|:----------------|:--------------------|:---------------------------|:-------------------------|:------------------|:---------------|:-----------------------|:--------------------|:-----------------------------|:----------------------|:--------------------|:------------------|
| 1 | A1 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED · **NEXT_AUDIT_TARGET** |
| 2 | A2 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 3 | A3 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 4 | APP | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 5 | BE | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 6 | C1 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 7 | C2 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 8 | C3 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 9 | C4 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 10 | C5 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 11 | C6 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 12 | C10 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 13 | C13 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 14 | C15 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 15 | C17 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 16 | F1 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 17 | F2 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 18 | GE | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 19 | L1 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 20 | P1 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 21 | P2 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 22 | P3 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 23 | P4 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 24 | RE | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 25 | S-Lass | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 26 | S1 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 27 | S2 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 28 | S3 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 29 | S5 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 30 | S6 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 31 | S10 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 32 | S11 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 33 | S12 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 34 | Ven1 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 35 | Ver1 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 36 | Ver2 | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 37 | WE | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |
| 38 | YE | PENDING_AUDIT | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | NOT_VERIFIED | NOT_VERIFIED | NOT_STARTED | NOT_STARTED | NOT_AUTHORIZED | PENDING | NONE | NOT_CREATED |

---

## 4. Index summary

| Metric | Value |
|--------|------:|
| Total medicines | 38 |
| Completed audits | 0 |
| In progress | 0 |
| Next audit target | **A1** (seq 1 — not audited in framework PR) |
| Evidence activated | 0 |
| Clinically validated | 0 |
| Rule 5 safety-complete | 0 |
| Potency/dosage authorized | 0 |
| Runtime authorized | 0 |

**A1 status:** labelled **NEXT_AUDIT_TARGET** only in audit queue sense; **not** marked audited; **no** A1 audit file created in this task.

---

## 5. Documentation accuracy

- Per-medicine owner/normalized source may exist for some codes from prior project discovery; **this index does not assert completeness or clinical validation** for any row.
- Registry v2 provides **identity and normalized metadata structure** only until individual audits complete.
- Rule 5 safety domains default to **NOT_STARTED** / **NOT_AUTHORIZED** for all medicines.
- No lifecycle state **ACTIVE** is assigned to any medicine evidence in this index.

---

## 6. Index footer (mandatory)

| Item | Value |
|------|--------|
| Files changed (M6B framework PR) | Framework + this index only |
| Medicines indexed | 38 |
| Medicine audits completed | 0 |
| A1 audited | NO |
| Next audit target | A1 |
| C11 present in index | NO |
| Registry JSON/manifest changed | NO |
| Clinical evidence activated | NONE |
| Patient data accessed | NO |
| Secrets accessed | NO |
| Database accessed | NO |
| Legacy engine executed | NO |

**Authority tag:** DOCUMENTATION_ONLY_AUDIT_INDEX · **Framework only; A1 not audited in this PR**
