# On-call and escalation

**Status:** Process foundation. No live paging in Phase 1A-H.

## Principles

- SEV-1 requires fast human acknowledgement and escalation timers  
- Contacts live in secure configuration / secret manager — **not** in git  
- Escalation path: primary on-call → secondary → owner  
- Track acknowledgement and resolution in the incident record  

## Doctor problem reports

Doctors see ticket status only (New / Investigating / Waiting / Resolved / Closed). They must not see internal security investigation details.

## Residual risk

Missed pages, incorrect routing, and alert fatigue can delay response. Drills (Phase 13) reduce but do not eliminate this risk.
