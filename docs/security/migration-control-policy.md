# Migration control policy

Future Super Admin Migration Control states:

`NOT_CONFIGURED`, `PREFLIGHT_RUNNING`, `PREFLIGHT_FAILED`, `TARGET_READY`, `BACKUP_RUNNING`, `COPYING`, `VALIDATING`, `AWAITING_OWNER_CONFIRMATION`, `SWITCHING_TRAFFIC`, `MONITORING`, `COMPLETED`, `ROLLBACK_AVAILABLE`, `ROLLING_BACK`, `FAILED`

The control must not switch servers without gates. Management Admin cannot trigger migration. Implementation services return `NOT_IMPLEMENTED`.
