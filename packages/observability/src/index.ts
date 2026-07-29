import { FoundationStatus } from '@ehas2/shared';
import type { AuditEvent, SecurityEvent } from '@ehas2/ops-contracts';

export type LogFields = Record<string, string | number | boolean | undefined>;

export function logInfo(message: string, fields: LogFields = {}): void {
  const payload = { level: 'info', message, ...fields, ts: new Date().toISOString() };
  console.log(JSON.stringify(payload));
}

export const OBSERVABILITY_PACKAGE_STATUS = 'NOT_IMPLEMENTED' as const;

/**
 * Security / audit event persistence — NOT live in Phase 1A-H.
 * Phase 3+ will persist immutable audit events.
 */
export class SecurityEventSink {
  static readonly status = FoundationStatus.NOT_IMPLEMENTED;

  emitSecurityEvent(_event: SecurityEvent): never {
    const err = new Error('SecurityEventSink.emitSecurityEvent: NOT_IMPLEMENTED (Phase 3+)');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }

  emitAuditEvent(_event: AuditEvent): never {
    const err = new Error('SecurityEventSink.emitAuditEvent: NOT_IMPLEMENTED (Phase 3+)');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }
}
