/** PostgreSQL access layer — Phase 3. Status: NOT_READY. */
export const DATABASE_PACKAGE_VERSION = '0.1.0-phase1a' as const;
export const DATABASE_PACKAGE_STATUS = 'NOT_READY' as const;

export type TenantContext = {
  organizationId: string;
  doctorUserId: string;
};

export function getConnection(): never {
  const err = new Error('DATABASE_PACKAGE_STATUS: NOT_READY (Phase 3)');
  (err as Error & { code: string }).code = 'NOT_READY';
  throw err;
}
