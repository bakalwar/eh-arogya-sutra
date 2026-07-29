# ADR 004: Super Admin as a separate control plane

- **Status:** accepted (Phase 1A-H architecture)
- **Context:** Platform owners need a private Security and Operations Center. Ordinary doctors must not access it. Hiding a route in the doctor app is insufficient.
- **Decision:** Treat Super Admin as a **separate security control plane**: separate host (conceptual `ops.<approved-domain>`), identity, session scope, authorization boundary, and audit trail. Optional VPN / identity-aware proxy and IP/device restrictions in production. No doctor navigation entry.
- **Consequences:** Additional operational complexity; stronger isolation. Domain not finalized in Phase 1A-H. Live auth starts Phase 2; UI Phase 9; production monitoring Phase 14.
- **Non-goals this phase:** Real login, live dashboard, WAF, automatic blocking, production alerts.
