import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EvidenceService } from '../../packages/database/src/index.ts';

describe('F3B fail-closed retention and intent bypass', () => {
  it('does not delete extraction candidates or runs', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'packages/database/src/repositories/extraction.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/DELETE FROM clinical_evidence_extraction_candidates/i);
    expect(src).not.toMatch(/DELETE FROM clinical_evidence_extraction_runs/i);
    expect(src).not.toMatch(/pruneCandidateRetention/);
    expect(src).toMatch(/isRetentionCapReached/);
  });

  it('rejects content-intent test helper in production', async () => {
    const service = new EvidenceService();
    await expect(
      service.setEvidenceContentIntentForTest(
        {
          organizationId: '00000000-0000-4000-8000-000000000001',
          clinicId: '00000000-0000-4000-8000-000000000002',
          actorId: '00000000-0000-4000-8000-000000000003',
          actorRole: 'Doctor',
          membershipStatus: 'ACTIVE',
          allowPatientPhi: true,
        },
        '00000000-0000-4000-8000-0000000000aa',
        'WRITTEN_REPORT_DOCUMENT',
        { EHAS2_NODE_ENV: 'production', NODE_ENV: 'production' },
      ),
    ).rejects.toThrow(/CONTENT_INTENT_TEST_ONLY/);
  });

  it('does not expose content intent on evidence HTTP routes', () => {
    const routes = fs.readFileSync(
      path.join(process.cwd(), 'apps/api/src/routes/evidence.ts'),
      'utf8',
    );
    expect(routes).not.toMatch(/setEvidenceContentIntentForTest|setContentIntent/);
    expect(routes).not.toMatch(/contentIntent/);
  });
});
