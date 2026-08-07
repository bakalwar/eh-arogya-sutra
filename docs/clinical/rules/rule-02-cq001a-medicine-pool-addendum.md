# Rule 2 — CQ-001A medicine pool addendum (identity only)

**Authority:** Documentation pointer · **NOT** a Rule 2 clinical freeze amendment  
**Effective:** Post CQ-001A (2026-08-07) · **EHAS2 runtime:** NOT_CONNECTED · **Clinical activation:** NOT_AUTHORIZED

---

## Purpose

Frozen Rule 2 documents ([rule-02-polarity-engine.md](./rule-02-polarity-engine.md), [rule-02-owner-decisions.md](./rule-02-owner-decisions.md)) still contain **historical** references to a **39-medicine** pool from the pre–CQ-001A registry identity. Those frozen clinical bodies were **not rewritten** by this addendum.

---

## CQ-001A supersedes medicine identity and count only

| Topic | Record |
|-------|--------|
| **Current canonical registry** | `ehas2-medicine-registry-v2` (`medicines.v2.json`, `registry.v2.manifest.json`) |
| **Current count** | **38** medicine/electricity codes |
| **C11** | **Excluded** — not a current candidate; **no** replacement or remapping |
| **Historical v1** | `ehas2-medicine-registry-v1` — **39** codes including C11 (immutable snapshot) |

This changes **package identity and count** only. It does **not** declare medicines clinically validated, prove indications, activate Rule 5, implement Rule 6, or connect production.

---

## Rule 2 semantics unchanged

- Rule 2 **Polarity Engine** semantics remain as owner-frozen — formula-specific polarity annotation only.
- Rule 2 has **no direct effect** on primary medicine selection (**OWNER-APPROVED**).
- Where frozen Rule 2 text mentions a **39-medicine pool**, interpret **current owner target** as the **38**-medicine v2 pool above unless the passage is explicitly labelled historical Phase 5A/5B or v1 context.

---

## Non-claims

This addendum does **not** authorize:

- fixed, mandatory, or default medicines (including A1, A2, L1, S1);
- Blood/Lymph selection implementation;
- Rule 1 or Rule 6 implementation;
- Rule 5 evidence activation;
- potency, dosage, or threshold approval;
- C11 restoration or remapping;
- production or prescription connection.
