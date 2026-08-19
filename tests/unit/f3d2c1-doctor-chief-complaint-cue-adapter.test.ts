import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CueEligibleSourceService } from '../../packages/database/src/services/cueEligibleSourceService.ts';
import { ValidationError } from '../../packages/database/src/domainErrors.ts';
import {
  chiefComplaintCueSourceLockKey,
  CUE_SOURCE_LOCK_PREFIX,
} from '../../packages/database/src/services/cueSourceLock.ts';
import {
  CUE_PARSER_CONNECTED,
  CUE_PARSER_PRODUCTION_ENABLED,
} from '../../packages/evidence-extract/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const TENANT = {
  organizationId: '00000000-0000-4000-8000-0000000000a1',
  clinicId: '00000000-0000-4000-8000-0000000000a2',
  actorId: '00000000-0000-4000-8000-0000000000a3',
  actorRole: 'Doctor',
  membershipStatus: 'ACTIVE' as const,
  allowPatientPhi: true,
};

const CONSULT = '00000000-0000-4000-8000-0000000000a4';
const SECRET = 'SECRET_CHIEF_COMPLAINT_TEXT_MUST_NOT_LEAK';

describe('F3D-2C1 doctor-declared chief-complaint cue adapter contract', () => {
  const cues = new CueEligibleSourceService();

  it('derives a namespaced 64-bit lock identity without concatenating into SQL', () => {
    const key = chiefComplaintCueSourceLockKey({
      organizationId: TENANT.organizationId,
      clinicId: TENANT.clinicId,
      consultationId: CONSULT,
    });
    expect(key.startsWith(`${CUE_SOURCE_LOCK_PREFIX}:`)).toBe(true);
    expect(key.endsWith(':CHIEF_COMPLAINT')).toBe(true);
    expect(key).toContain(TENANT.organizationId);
    expect(key).toContain(TENANT.clinicId);
    expect(key).toContain(CONSULT);
    expect(key).not.toMatch(/hashtext[^e]|pg_advisory_lock\(/);
  });

  it('rejects unknown selector, text, and clinical input keys without touching the database', async () => {
    const closed = [
      { consultationId: CONSULT, eligibleText: SECRET },
      { consultationId: CONSULT, chiefComplaintText: SECRET },
      { consultationId: CONSULT, sourceLocator: { page: 1 } },
      { consultationId: CONSULT, pack: 'x' },
      { consultationId: CONSULT, diseaseId: 'd' },
      { consultationId: CONSULT, actor: TENANT },
    ];
    for (const input of closed) {
      await expect(
        cues.parseDoctorDeclaredChiefComplaintCues(TENANT, input as never),
      ).rejects.toMatchObject({ name: 'ValidationError', message: 'UNTRUSTED_INPUT' });
    }
  });

  it('does not leak source text, paths, SQL, or pack tokens on closed-input failure', async () => {
    try {
      await cues.parseDoctorDeclaredChiefComplaintCues(TENANT, {
        consultationId: CONSULT,
        eligibleText: SECRET,
      } as never);
      throw new Error('expected closed-input failure');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const blob = `${(err as Error).name}\n${(err as Error).message}\n${JSON.stringify(err)}`;
      expect(blob).not.toContain(SECRET);
      expect(blob).not.toMatch(/b3abc204|owner-approval|EHAS2_F3D2_PACK_APPROVAL/i);
      expect(blob).not.toMatch(/SELECT |hashtextextended|password/i);
      expect(blob).not.toMatch(/ehas2-owner-cue-pack/);
      expect((err as Error).message).toBe('UNTRUSTED_INPUT');
    }
  });

  it('does not change /ready cue-parser activation fields', () => {
    const src = fs.readFileSync(path.join(root, 'apps/api/src/createApp.ts'), 'utf8');
    expect(src).toMatch(/ready:\s*false/);
    expect(src).toMatch(/cueParserConnected:\s*CUE_PARSER_CONNECTED/);
    expect(src).toMatch(/cueParserProductionEnabled:\s*CUE_PARSER_PRODUCTION_ENABLED/);
    expect(src).toMatch(/normalizationParserAvailable:\s*NORMALIZATION_PARSER_AVAILABLE/);
    expect(src).toMatch(/clinicalEngine:\s*false/);
    expect(src).toMatch(/extractProduction:\s*EVIDENCE_EXTRACT_PRODUCTION/);
    expect(src).not.toMatch(/parseDoctorDeclaredChiefComplaintCues|cueEligibleSourceService/);
    expect(CUE_PARSER_CONNECTED).toBe(false);
    expect(CUE_PARSER_PRODUCTION_ENABLED).toBe(false);
  });

  it('has no API, worker, or web runtime caller', () => {
    for (const rel of ['apps/api/src', 'apps/worker/src', 'apps/web/src']) {
      const abs = path.join(root, rel);
      if (!fs.existsSync(abs)) continue;
      const files = fs.readdirSync(abs, { recursive: true, encoding: 'utf8' }) as string[];
      for (const file of files) {
        if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
        const src = fs.readFileSync(path.join(abs, file), 'utf8');
        expect(src, file).not.toMatch(
          /parseDoctorDeclaredChiefComplaintCues|cueEligibleSourceService/,
        );
      }
    }
  });
});
