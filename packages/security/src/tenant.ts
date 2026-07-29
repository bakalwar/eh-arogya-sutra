/**
 * Tenant isolation context — required for doctor/clinic resource access.
 * Super Admin control-plane actions do not use clinic tenant as privilege elevation.
 */
export type TenantContext = {
  tenantId: string;
  clinicDisplayName?: string;
};

export function createTenantContext(tenantId: string, clinicDisplayName?: string): TenantContext {
  const id = tenantId.trim();
  if (!id) throw new Error('tenantId is required');
  return { tenantId: id, clinicDisplayName };
}

export function assertTenantMatch(
  principalTenantId: string | null | undefined,
  resourceTenantId: string,
): boolean {
  if (!principalTenantId) return false;
  return principalTenantId === resourceTenantId;
}
