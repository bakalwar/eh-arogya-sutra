# Report cleanup runbook

## Deletion failure

If original report deletion cannot be verified:

1. Do **not** silently declare cleanup successful
2. Mark `DELETION_VERIFICATION_FAILED`
3. Raise safe security/operations alert (no report contents)
4. Retry within bounded policy (`maxRetryCount`, `maxRetentionWindowMinutes`)
5. Escalate overdue cleanup to Super Admin operations
6. Show doctor only a safe processing status

Default policy: 5 retries, 60-minute max retention window, 30-minute escalation threshold, SEV-2.

Broad destructive delete commands are forbidden.
