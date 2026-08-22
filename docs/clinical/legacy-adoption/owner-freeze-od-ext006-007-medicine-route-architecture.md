# Owner Freeze — Primary Medicine Identity Count, C11 Posture, Route Architecture

| Field | Value |
|-------|--------|
| **Authority** | Dr. Ghanshyam Bakalwar — APPROVED_OWNER_FREEZE |
| **Document class** | Append-only owner decision record |
| **Canonical base** | `61279fe609e91e9d105fc6c1db0025767a875012` |
| **Legacy evidence commit** | `b9ec3f6986c402afee13241673b954fe3564f169` (`bakalwar/eh-arogya-sutra`) |
| **Runtime activation** | **NONE** — documentation/review only |
| **Migration** | Tip remains `018`; no `019` |

This file records owner-approved freezes **OD-EXT-006**, **OD-EXT-007**, and **EH medicine route architecture**. It does not activate medicines, routes, C11, APP profiles, Rules execution, or prescription behavior.

---

## OD-EXT-006 — Primary EH medicine identity count

**Status:** `APPROVED_OWNER_FREEZE`  
**Approval token:** `OWNER-FREEZE-OD-EXT-006-v1`

```text
OD-EXT-006 = APPROVED_OWNER_FREEZE

PRIMARY_EH_MEDICINE_IDENTITY_COUNT = 38

COMPOSITION:
- 32 liquid medicine identities
- 5 electricity medicine identities
- APP as one primary EH medicine identity

PRESERVED_LEGACY_IDENTITY_COUNT = 39

C11:
- preserved separately
- excluded from primary active 38
```

### Required interpretation

| Point | Owner-approved meaning |
|-------|------------------------|
| APP | Included in primary **38** Electrohomeopathy medicine identities; **not** auxiliary utility or non-medicine |
| Legacy liquids | Legacy `LIQUID_MEDICINES_39` contains **33** liquids **including C11** |
| C11 removal arithmetic | Removing C11 from legacy liquids → **32** liquid identities |
| Primary count | `32 liquid + 5 electricity + APP = 38` |
| Preserved total | Adding C11 to preserved inventory → **39** preserved legacy identities |
| Stale filenames/symbols | Legacy filenames or symbols containing `38/39` do **not** override this owner freeze |
| Route eligibility | Identity membership alone does **not** confer route eligibility |

### Legacy forensic note (evidence only)

At `b9ec3f6`, legacy sources include:

- `eh-api/data/engine_medicines_38.py` — `MEDICINES_38` registry (39 unique IDs in legacy naming)
- `eh-api/core/clinical_engines.py` — `LIQUID_MEDICINES_39` (33 liquids incl. C11), `ELECTRICITY_MEDS` (5), APP in master lists
- Legacy comment: *"33 liquid remedies + 5 electricity + APP (external)"*

Owner freeze **supersedes** stale count naming for EHAS2 canonical identity posture. Legacy runtime remains unchanged in the legacy repository.

---

## OD-EXT-007 — C11 quarantine posture

**Status:** `APPROVED_OWNER_FREEZE`  
**Approval token:** `OWNER-FREEZE-OD-EXT-007-v1`

```text
OD-EXT-007 = APPROVED_OWNER_FREEZE

C11_POSTURE =
C11_IDENTITY_PRESERVED_SELECTION_QUARANTINED_SPECIAL_REVIEW
```

### C11 requirements (owner-approved)

| Requirement | Posture |
|-------------|---------|
| Identity | Preserved |
| Legacy crosswalk/history | Preserved |
| Main active 38 | **Excluded** |
| Rules influence | **Disabled** |
| Oral selection | **Disabled** |
| Tablet selection | **Disabled** |
| External selection | **Disabled** |
| Formula influence | **Disabled** |
| Potency/dose/Rx | **Disabled** |
| Diagnosis/treatment/cure claims | **None** |
| Reconsideration | Requires separate owner-authorized Materia Medica, provenance, and clinical review |

**Do not delete C11** from historical inventories.

---

## Route architecture freeze

**Status:** `APPROVED_OWNER_FREEZE`  
**Approval token:** `OWNER-FREEZE-EH-MEDICINE-ROUTE-ARCHITECTURE-v1`

```text
ROUTE_DOMAINS =
ORAL | TABLET | EXTERNAL_APPLICATION

IDENTITY_ARCHITECTURE =
ONE_MEDICINE_MASTER_WITH_SEPARATE_ROUTE_PROFILES
```

### Required future data boundary

1. One canonical master for **38** medicine identities.
2. Separate **Oral** profile per medicine.
3. Separate **Tablet** profile per medicine.
4. Separate **External Application** profile per medicine.
5. Separate detailed external mapping pack linked by medicine ID.
6. **C11** maintained in separate quarantine/history posture (see OD-EXT-007).
7. Tablet A/B independently evaluate their complete approved route-eligible pool.
8. Tablet A/B must **not** be derived from oral formula.
9. Unsupported route **fails closed**.
10. Route eligibility must be **owner-approved** and **evidence-bound**.

### External mapping pack — required representable fields

Organ/system · anatomical application site · preparation/form · application method · dilution · amount · frequency · duration · contraindications · age restrictions · pregnancy/lactation restrictions · skin/eye integrity restrictions · stop conditions · adverse reactions · monitoring · evidence/source · owner approval · contract version · ACTIVE/SUPERSEDED status.

**This task does not create database schema or runtime route mapping.**

### Legacy gap note (documentation only)

Legacy production paths include partial external routes and tablet pools with `derived_from_oral: true` in some engines. Owner freeze requires independent Tablet A/B pools and evidence-bound external mapping — **not implemented** in this documentation tranche.

---

## Cross-references

- Rule 1 temperament taxonomy freezes: [rule-01-temperament-taxonomy-owner-freeze-R1-OD-01-05.md](../rules/rule-01-temperament-taxonomy-owner-freeze-R1-OD-01-05.md)
- Rule 1 keyword row docket: [rule-01-keyword-row-clinical-review-docket.md](../rules/rule-01-keyword-row-clinical-review-docket.md)
- Phase 5R-1F register (historical; preserved): [rule-01-owner-decisions.md](../rules/rule-01-owner-decisions.md)

---

## Status tokens

- `OD_EXT_006_APPROVED_OWNER_FREEZE_RECORDED`
- `OD_EXT_007_APPROVED_OWNER_FREEZE_RECORDED`
- `EH_MEDICINE_ROUTE_ARCHITECTURE_OWNER_FREEZE_RECORDED`
- `NO_RUNTIME_ACTIVATION`
- `NO_MIGRATION_019`
- `C11_NOT_ACTIVATED`
- `APP_ROUTE_PROFILES_NOT_ACTIVATED`
