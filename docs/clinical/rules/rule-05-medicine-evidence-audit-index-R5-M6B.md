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
| 1 | A1 | VERIFIED | LOCATED_REVIEWED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_4 | NONE | [rule-05-medicine-evidence-audit-A1-R5-M6B.md](./rule-05-medicine-evidence-audit-A1-R5-M6B.md) |
| 2 | A2 | VERIFIED | LOCATED_REVIEWED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_4 | NONE | [rule-05-medicine-evidence-audit-A2-R5-M6B.md](./rule-05-medicine-evidence-audit-A2-R5-M6B.md) |
| 3 | A3 | VERIFIED | LOCATED_REVIEWED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_4 | NONE | [rule-05-medicine-evidence-audit-A3-R5-M6B.md](./rule-05-medicine-evidence-audit-A3-R5-M6B.md) |
| 4 | APP | VERIFIED | NOT_LOCATED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_6 | NONE | [rule-05-medicine-evidence-audit-APP-R5-M6B.md](./rule-05-medicine-evidence-audit-APP-R5-M6B.md) |
| 5 | BE | VERIFIED | NOT_LOCATED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_9 | NONE | [rule-05-medicine-evidence-audit-BE-R5-M6B.md](./rule-05-medicine-evidence-audit-BE-R5-M6B.md) |
| 6 | C1 | VERIFIED | LOCATED_REVIEWED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_6 | NONE | [rule-05-medicine-evidence-audit-C1-R5-M6B.md](./rule-05-medicine-evidence-audit-C1-R5-M6B.md) |
| 7 | C2 | VERIFIED | LOCATED_REVIEWED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_6 | NONE | [rule-05-medicine-evidence-audit-C2-R5-M6B.md](./rule-05-medicine-evidence-audit-C2-R5-M6B.md) |
| 8 | C3 | VERIFIED | LOCATED_REVIEWED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_0 | NONE | [rule-05-medicine-evidence-audit-C3-R5-M6B.md](./rule-05-medicine-evidence-audit-C3-R5-M6B.md) |
| 9 | C4 | VERIFIED | LOCATED_REVIEWED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_0 | NONE | [rule-05-medicine-evidence-audit-C4-R5-M6B.md](./rule-05-medicine-evidence-audit-C4-R5-M6B.md) |
| 10 | C5 | VERIFIED | LOCATED_REVIEWED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_0 | NONE | [rule-05-medicine-evidence-audit-C5-R5-M6B.md](./rule-05-medicine-evidence-audit-C5-R5-M6B.md) |
| 11 | C6 | VERIFIED | LOCATED_REVIEWED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_0 | NONE | [rule-05-medicine-evidence-audit-C6-R5-M6B.md](./rule-05-medicine-evidence-audit-C6-R5-M6B.md) |
| 12 | C10 | VERIFIED | LOCATED_REVIEWED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_0 | NONE | [rule-05-medicine-evidence-audit-C10-R5-M6B.md](./rule-05-medicine-evidence-audit-C10-R5-M6B.md) |
| 13 | C13 | VERIFIED | LOCATED_REVIEWED | COMPLETED_CONFLICTS | COMPLETED_CONFLICTS | INCOMPLETE_NOT_VERIFIED | NOT_VERIFIED | COMPLETED_INVENTORY_NOT_VALIDATED | INCOMPLETE_BLOCKED | NOT_AUTHORIZED | RECORDED_0 | NONE | [rule-05-medicine-evidence-audit-C13-R5-M6B.md](./rule-05-medicine-evidence-audit-C13-R5-M6B.md) |
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
| Completed documentation audits | 13 |
| In progress | 0 |
| Next eligible medicine in canonical sequence | **C15** — `NOT_STARTED`; informational only; separate owner authorization required |
| Evidence activated | 0 |
| Clinically validated | 0 |
| Rule 5 safety-complete | 0 |
| Potency/dosage authorized | 0 |
| Runtime authorized | 0 |

**A1 status:** documentation audit **complete** ([A1 audit record](./rule-05-medicine-evidence-audit-A1-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; four owner decisions **recorded** (CQ-001–004).

**A2 status:** documentation audit **complete with conflicts** ([A2 audit record](./rule-05-medicine-evidence-audit-A2-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; four owner decisions **recorded** (R5-M6B-A2-CQ-001–004).

**A3 status:** documentation audit **complete with conflicts** ([A3 audit record](./rule-05-medicine-evidence-audit-A3-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; four owner decisions **recorded** (R5-M6B-A3-CQ-001–004).

**APP status:** documentation audit **complete with conflicts and owner-primary not located** ([APP audit record](./rule-05-medicine-evidence-audit-APP-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; six owner decisions **recorded** (R5-M6B-APP-CQ-001–006); **ME-APP-001** open.

**BE status:** documentation audit **complete with conflicts and owner-primary not located** ([BE audit record](./rule-05-medicine-evidence-audit-BE-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; **`RECORDED_9`** = eight explicit owner CQ decisions (R5-M6B-BE-CQ-001–008 = A) + one owner-delegated technical classification (R5-M6B-BE-CQ-009 = A / TGC-BE-009); **ME-BE-001** open; **essential owner clinical decisions: NONE** (blocked by missing verified primary).

**C1 status:** documentation audit **complete with conflicts** ([C1 audit record](./rule-05-medicine-evidence-audit-C1-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; owner source **`LOCATED_REVIEWED`** with **`PROVISIONAL_OWNER_PRIMARY`** (transcript line **1217** byte proof **pending**; length mismatch **open**; provenance **`INCOMPLETE_NOT_VERIFIED`**); **`RECORDED_6`** = essential owner decisions **EOD-C1-01–06 = A** only; **`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`** (TGC-C1-001–010, not in owner-decision column); **ME-C1-001** open.

**C2 status:** documentation audit **complete with conflicts** ([C2 audit record](./rule-05-medicine-evidence-audit-C2-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; owner source **`LOCATED_REVIEWED`** with **`PROVISIONAL_OWNER_PRIMARY`** (**provisional, not fully verified**; 019c `MED=C2` L488 §1–5 + expert tip; **L527–528 agent tail excluded**; **L4103 duplicate dev block rejected**; transcript line **1241** byte proof **pending**; open wrapper / length **open**; provenance **`INCOMPLETE_NOT_VERIFIED`**); **`RECORDED_6`** = essential owner decisions **EOD-C2-01–06 = A** only; **`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`** (TGC-C2-001–010, not in owner-decision column); **ME-C2-001** open.

**C3 status:** documentation audit **complete with conflicts** ([C3 audit record](./rule-05-medicine-evidence-audit-C3-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; owner source **`LOCATED_REVIEWED`** with **`PROVISIONAL_OWNER_PRIMARY`** (**provisional, not fully verified**; 019c `MED=C3` L531 · clinical inventory **L535–568** §1–5 + expert tip; inner `</user_query>` at **L569**; **C2 L527–528 not attributed to C3**; upstream C2 segmentation/wrapper **open**; transcript line **1254** / len **2828** **unverified**; provenance **`INCOMPLETE_NOT_VERIFIED`**); **`RECORDED_0`** = documentation audit **complete**, **zero** essential owner clinical decisions recorded, **`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`** (TGC-C3-001–010, **not** in owner-decision column), **no** clinical authority created; **ME-C3-001** open; **`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**.

**C4 status:** documentation audit **complete with conflicts** ([C4 audit record](./rule-05-medicine-evidence-audit-C4-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; owner source **`LOCATED_REVIEWED`** with **`PROVISIONAL_OWNER_PRIMARY`** (**provisional, not fully verified**; 019c `MED=C4` L572 · clinical inventory **L576–608** §1–5 + expert tip; **C3 closes L569** — **no bleed into C4**; inner `</user_query>` at **L610**; **C5 begins L612**; transcript line **1266** / len **2842** **unverified**; provenance **`INCOMPLETE_NOT_VERIFIED`**); **`RECORDED_0`** = documentation audit **complete**, **zero** essential owner clinical decisions recorded, **`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`** (TGC-C4-001–010, **not** in owner-decision column), **no** clinical authority created; **ME-C4-001** open; **`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**.

**C5 status:** documentation audit **complete with conflicts** ([C5 audit record](./rule-05-medicine-evidence-audit-C5-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; owner source **`LOCATED_REVIEWED`** with **`PROVISIONAL_OWNER_PRIMARY`** (**provisional, not fully verified**; 019c `MED=C5` **L613** · clinical inventory **L621–650** §1–5 + expert tip; **C4 closes L610** — **no bleed into C5**; inner wrapper **L615–652**; **`MED=C6` begins L655**; transcript line **1275** / len **2919** **unverified**; MM3 doctor length **2915** delta **open**; provenance **`INCOMPLETE_NOT_VERIFIED`**); **`RECORDED_0`** = documentation audit **complete**, **zero** essential owner clinical decisions recorded, **`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`** (TGC-C5-001–010, **not** in owner-decision column), **no** clinical authority created; **ME-C5-001–007** open; **`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**.

**C6 status:** documentation audit **complete with conflicts** ([C6 audit record](./rule-05-medicine-evidence-audit-C6-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; owner source **`LOCATED_REVIEWED`** with **`PROVISIONAL_OWNER_PRIMARY`** (**provisional, not fully verified**; 019c `MED=C6` **L655** · clinical inventory **L663–687** §1–5 + expert tip **L688–L689-A** only; **L689 intra-line split** — agent tail **L689-B** (`es me jo potency di gai hai…`) **excluded** as rejected workflow contamination; inner wrapper **L658–690**; **C5 closes L652** — **no bleed into C6**; **`MED=C10` L692** (C10 opens **~L696**); transcript line **1290** / len **3169** **unverified**; MM3 doctor length **3165** delta **open**; MM2 `doctor_notes` **contaminated** (full line/block); provenance **`INCOMPLETE_NOT_VERIFIED`**); **`RECORDED_0`** = documentation audit **complete**, **zero** essential owner clinical decisions recorded, **`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`** (TGC-C6-001–010, **not** in owner-decision column), **no** clinical authority created; **ME-C6-001–007** open; **`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**.

**C10 status:** documentation audit **complete with conflicts** ([C10 audit record](./rule-05-medicine-evidence-audit-C10-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; owner source **`LOCATED_REVIEWED`** with **`PROVISIONAL_OWNER_PRIMARY`** (**provisional, not fully verified**; 019c single `MED=C10` **L693** · clinical inventory **L701–725** §1–5 + expert tip **L726–727**; inner wrapper **L696–728**; **C6 closes L690**; **physical `MED=C11` L731–767** (excluded 38-set); **canonical successor `MED=C13` L770** (~L773); **no C6-style agent tail** on C10 expert tip; **CF-C10-001** preserves **L692/L693** anchor drift vs prior C6 **`MED=C10` ~L692** pointer without rewriting C6 artifact; transcript line **1313** / len **2676** **unverified**; MM3 doctor length **2672** delta **open**; provenance **`INCOMPLETE_NOT_VERIFIED`**); **`RECORDED_0`** = documentation audit **complete**, **zero** essential owner clinical decisions recorded, **`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`** (TGC-C10-001–010, **not** in owner-decision column), **no** clinical authority created; **ME-C10-001–007** open; **`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**.

**C13 status:** documentation audit **complete with conflicts** ([C13 audit record](./rule-05-medicine-evidence-audit-C13-R5-M6B.md)); **not** clinically validated; Rule 5 safety **incomplete**; owner source **`LOCATED_REVIEWED`** with **`PROVISIONAL_OWNER_PRIMARY`** (**provisional, not fully verified**; 019c single `MED=C13` **L770** · clinical inventory **L779–801** §1–4 + expert tip **L804–805**; inner wrapper **L773–807**; **L775–776** Cursor save **excluded**; **L802–803** 116k keyword framing **non-operational**; **physical `MED=C11` L731–767** (excluded 38-set); **canonical predecessor C10**; **successor `MED=C15` L810** (~L813); **no duplicate `MED=C13`**; **no C6-style agent tail** on C13 expert tip; **CF-C13-001** preserves **C10 open-only C13 pointer** vs **wrapper close L807** without rewriting C10 artifact; transcript line **1354** / len **2691** **unverified**; MM3 doctor length **2687** delta **open**; provenance **`INCOMPLETE_NOT_VERIFIED`**); **`RECORDED_0`** = documentation audit **complete**, **zero** essential owner clinical decisions recorded, **`TECHNICAL_GOVERNANCE_CLASSIFICATION_COUNT: 10`** (TGC-C13-001–010, **not** in owner-decision column), **no** clinical authority created; **ME-C13-001–007** open; **`ESSENTIAL_OWNER_CLINICAL_DECISIONS: NONE — BLOCKED BY MISSING VERIFIED PRIMARY AND RULE 5 SAFETY EVIDENCE`**.

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
| Medicines indexed | 38 |
| Documentation audits completed | 13 (A1, A2, A3, APP, BE, C1, C2, C3, C4, C5, C6, C10, C13) |
| A1 documentation audit | YES |
| A2 documentation audit | YES |
| A3 documentation audit | YES |
| APP documentation audit | YES |
| BE documentation audit | YES |
| C1 documentation audit | YES |
| C2 documentation audit | YES |
| C3 documentation audit | YES |
| C4 documentation audit | YES |
| C5 documentation audit | YES |
| C6 documentation audit | YES |
| C10 documentation audit | YES |
| C13 documentation audit | YES |
| A1 clinically validated | NO |
| A2 clinically validated | NO |
| A3 clinically validated | NO |
| APP clinically validated | NO |
| BE clinically validated | NO |
| C1 clinically validated | NO |
| C2 clinically validated | NO |
| C3 clinically validated | NO |
| C4 clinically validated | NO |
| C5 clinically validated | NO |
| C6 clinically validated | NO |
| C10 clinically validated | NO |
| C13 clinically validated | NO |
| A2 owner decisions recorded | 4 |
| A3 owner decisions recorded | 4 |
| APP owner decisions recorded | 6 |
| BE governance classifications recorded | 9 (8 explicit owner CQ + 1 delegated technical) |
| C1 owner decisions recorded | 6 (EOD-C1-01–06) |
| C1 technical governance classifications | 10 (TGC-C1-001–010) |
| C2 owner decisions recorded | 6 (EOD-C2-01–06) |
| C2 technical governance classifications | 10 (TGC-C2-001–010) |
| C3 owner decision status | RECORDED_0 (documentation audit complete; zero essential owner clinical decisions; TGC count 10 separate; no clinical authority) |
| C3 technical governance classifications | 10 (TGC-C3-001–010) |
| C4 owner decision status | RECORDED_0 (documentation audit complete; zero essential owner clinical decisions; TGC count 10 separate; no clinical authority) |
| C4 technical governance classifications | 10 (TGC-C4-001–010) |
| C5 owner decision status | RECORDED_0 (documentation audit complete; zero essential owner clinical decisions; TGC count 10 separate; no clinical authority) |
| C5 technical governance classifications | 10 (TGC-C5-001–010) |
| C6 owner decision status | RECORDED_0 (documentation audit complete; zero essential owner clinical decisions; TGC count 10 separate; no clinical authority) |
| C6 technical governance classifications | 10 (TGC-C6-001–010) |
| C10 owner decision status | RECORDED_0 (documentation audit complete; zero essential owner clinical decisions; TGC count 10 separate; no clinical authority) |
| C10 technical governance classifications | 10 (TGC-C10-001–010) |
| C13 owner decision status | RECORDED_0 (documentation audit complete; zero essential owner clinical decisions; TGC count 10 separate; no clinical authority) |
| C13 technical governance classifications | 10 (TGC-C13-001–010) |
| Next eligible in sequence (not an audit target) | C15 — NOT_STARTED |
| C11 present in index | NO |
| Registry JSON/manifest changed | NO |
| Clinical evidence activated | NONE |
| Patient data accessed | NO |
| Secrets accessed | NO |
| Database accessed | NO |
| Legacy engine executed | NO |

**Authority tag:** DOCUMENTATION_ONLY_AUDIT_INDEX · **A1–BE, C1, C2, C3, C4, C5, C6, C10, and C13 audit records linked; C1/C2/C3/C4/C5/C6/C10/C13 provisional primary; C3/C4/C5/C6/C10/C13 RECORDED_0; APP/BE owner-primary not located; no clinical validation**
