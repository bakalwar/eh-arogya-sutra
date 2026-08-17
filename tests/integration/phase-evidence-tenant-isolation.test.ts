import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  Permission,
  PlatformRole,
  assertNoManagementPhiByDefault,
  createPrincipalForPolicyEvaluation,
  roleHasPermission,
} from '../../packages/security/src/index.ts';
import { createApp } from '../../apps/api/src/createApp.ts';
import { EHAS2_API_NAMESPACE } from '../../packages/shared/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function httpJson(
  app: ReturnType<typeof createApp>,
  method: string,
  path: string,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { Accept: 'application/json' },
    });
    const json = (await res.json()) as Record<string, unknown>;
    return { status: res.status, json };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

describe('F1 evidence authorization and RLS contract', () => {
  it('grants evidence ingest only to clinic-scoped clinical roles', () => {
    expect(roleHasPermission(PlatformRole.Doctor, Permission.EvidenceIngest)).toBe(true);
    expect(roleHasPermission(PlatformRole.ClinicAdmin, Permission.EvidenceMetadataRead)).toBe(true);
    expect(roleHasPermission(PlatformRole.ManagementAdmin, Permission.EvidenceIngest)).toBe(false);
    expect(roleHasPermission(PlatformRole.SuperAdmin, Permission.EvidenceMetadataRead)).toBe(false);
    expect(assertNoManagementPhiByDefault(PlatformRole.ManagementAdmin)).toBe(true);
  });

  it('migration 010 forces tenant RLS and revokes audit mutation', () => {
    const sql = fs.readFileSync(
      path.join(root, 'packages/database/migrations/010_clinical_evidence_ingestion.sql'),
      'utf8',
    );
    expect(sql).toMatch(/FORCE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/clinical_evidence_items/);
    expect(sql).toMatch(/ehas2_tenant_ok/);
    expect(sql).toMatch(/REVOKE UPDATE, DELETE ON audit_events FROM ehas2_app/);
    expect(sql).not.toMatch(/FOR UPDATE|FOR DELETE/);
  });

  it('unauthenticated evidence read is 401 and management is denied', async () => {
    const anon = createApp();
    const unauth = await httpJson(
      anon,
      'GET',
      `${EHAS2_API_NAMESPACE}/consultations/00000000-0000-4000-8000-000000000001/evidence`,
    );
    expect(unauth.status).toBe(401);

    const principal = createPrincipalForPolicyEvaluation({
      subjectId: '00000000-0000-4000-8000-000000000099',
      role: PlatformRole.ManagementAdmin,
      tenantId: null,
      isTestPrincipal: true,
    });
    const mgmt = createApp({
      resolvePrincipal: () => principal,
      resolveTenantContext: () => null,
    });
    const denied = await httpJson(
      mgmt,
      'GET',
      `${EHAS2_API_NAMESPACE}/consultations/00000000-0000-4000-8000-000000000001/evidence`,
    );
    expect([401, 403]).toContain(denied.status);
    expect(denied.status).not.toBe(200);
  });
});
