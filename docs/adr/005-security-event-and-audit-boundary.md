# ADR 005: Security event and audit boundary

- **Status:** accepted (Phase 1A-H architecture)
- **Context:** Ops and security monitoring must not become a second path to patient PHI or secrets. Audit trails must resist silent self-erasure.
- **Decision:**
  - Default Super Admin views use redacted metadata, IDs, counts, and error codes only.
  - Patient-data support access is explicit, time-limited, justified, authorized, and audited.
  - `SecurityEvent` and `AuditEvent` contracts require event/request/trace identifiers.
  - Audit events are modeled as `immutable: true`; actors cannot silently delete their trail (enforced in Phase 3+ storage).
  - Doctor-safe errors exclude stacks and internals (`toDoctorSafeError`).
- **Consequences:** Support workflows need deliberate break-glass style access. Logging volume must be designed carefully. Persistence and WORM controls arrive in later phases.
- **Non-goals this phase:** Live event sinks, SIEM integration, production alert delivery.
