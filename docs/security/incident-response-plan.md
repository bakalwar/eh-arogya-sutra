# Incident response plan (foundation)

**Status:** Runbook foundations only. No destructive automated containment without human approval.

## Covered scenarios

Outage; database failure; account compromise; malicious upload; cross-tenant access; patient-data exposure; clinical-engine failure; deployment regression; backup failure; denial-of-service.

## Required runbook sections

1. Detection  
2. Severity (SEV-1…4)  
3. Owner  
4. Containment  
5. Evidence preservation  
6. Recovery  
7. Communication  
8. Post-incident review  
9. Preventive actions  

Use `docs/operations/runbook-template.md`.

## Principles

- Preserve evidence before destructive recovery when safe  
- Prefer human approval for high-impact containment  
- Do not put patient PHI in broad notification channels  
- Escalate SEV-1 per on-call policy  

## Phase drills

Formal incident and DR drills: **Phase 13**. Production alert activation: **Phase 14**.
