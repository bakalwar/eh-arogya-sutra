# Log redaction policy

**Status:** Policy + foundation helpers in `@ehas2/security` (`redactSensitiveFields`).

## Never log by default

passwords; tokens; OTP secrets; API keys; cookies; Authorization headers; private keys; full connection strings with credentials.

## Patient / clinical (default deny in ops views)

patient names; phone numbers; complete symptoms; uploaded reports; prescriptions; clinical notes; OCR text.

## Allowed by default (ops)

event IDs; tenant/clinic IDs where necessary; request/trace IDs; error codes; counts/metrics; hashed/pseudonymous identifiers; redacted metadata.

## Doctor-facing errors

Simple message + safe error code + support ID (+ optional retry guidance). Never stack traces, SQL, filesystem paths, env vars, secrets, or security-detection internals.

## Support PHI access

Requires explicit reason, minimum necessary access, authorization, time limit, and audit — not default dashboard behavior.
