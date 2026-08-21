import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOrderedMigrationIds } from '../../packages/database/src/migrate.ts';
import {
  F3D2D2_PERSISTENCE_CONNECTED,
  F3D2D2_PRODUCTION_WRITER_CONNECTED,
} from '../../packages/evidence-extract/src/terminology/normalizer/types.ts';
import {
  F3D2D_PRODUCTION_ENABLED,
  FACT_NORMALIZATION_AUTHORITY_SCOPE,
} from '../../packages/evidence-extract/src/factNormalizationTypes.ts';
import { FactNormalizationService } from '../../packages/database/src/services/factNormalizationService.ts';
import { ValidationError } from '../../packages/database/src/domainErrors.ts';
import type { TenantContext } from '../../packages/database/src/tenantContext.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const SERVICE = 'packages/database/src/services/factNormalizationService.ts';
const LIFECYCLE = 'packages/database/src/services/factNormalizationLifecycle.ts';
const FACT_REPO = 'packages/database/src/repositories/factCandidate.ts';
const READY = 'apps/api/src/createApp.ts';
const H2 = 'scripts/ehas2-parser-runtime-import-firewall.mjs';

const FORBIDDEN_RUNTIME =
  /@ehas2\/rule[1-9]|@ehas2\/medicine-registry|@ehas2\/engine-adapter|@ehas2\/clinical-engine|evaluateRule[1-9]|addStructuredFindings|analyzeComplete\s*\(|tesseract\.js|pdf-parse|LibreTranslate/;

const tenant: TenantContext = {
  organizationId: '00000000-0000-4000-8000-0000000000aa',
  clinicId: '00000000-0000-4000-8000-0000000000bb',
  actorId: '00000000-0000-4000-8000-0000000000cc',
  actorRole: 'Doctor',
  membershipStatus: 'ACTIVE',
  allowPatientPhi: true,
};

describe('F3D-2D3 atomic normalization persistence + lifecycle contract', () => {
  it('keeps migration tip at 016 with no 017', () => {
    const ids = getOrderedMigrationIds();
    expect(ids.at(-1)).toBe('016_f3d2_fact_normalizations');
    expect(ids).toHaveLength(16);
    expect(fs.existsSync(path.join(root, 'packages/database/migrations/017_*.sql'))).toBe(false);
    expect(
      fs.readdirSync(path.join(root, 'packages/database/migrations')).some((n) =>
        n.startsWith('017_'),
      ),
    ).toBe(false);
  });

  it('keeps D2 pure-normalizer production writer flags false; D3 is the service writer', () => {
    expect(F3D2D2_PERSISTENCE_CONNECTED).toBe(false);
    expect(F3D2D2_PRODUCTION_WRITER_CONNECTED).toBe(false);
    expect(F3D2D_PRODUCTION_ENABLED).toBe(false);
    expect(FACT_NORMALIZATION_AUTHORITY_SCOPE).toBe('FACT_NORMALIZED_SOURCE_LINKED');
    expect(read(SERVICE)).toMatch(/materializeFactNormalizations/);
    expect(read(SERVICE)).toMatch(/STRUCTURED_UNIT_DEFERRED/);
    expect(read(SERVICE)).toMatch(/clinical\.fact_normalization/);
    expect(read(SERVICE)).not.toMatch(FORBIDDEN_RUNTIME);
    expect(read(SERVICE)).not.toMatch(/parseOwnerFrozenCues\s*\(/);
  });

  it('wires fact SUPERSEDE paths to linked normalization supersession', () => {
    const factRepo = read(FACT_REPO);
    expect(factRepo).toMatch(/lockActiveIdentitiesForParentFacts/);
    expect(factRepo).toMatch(/supersedeActiveLinkedToFacts/);
    expect(read(LIFECYCLE)).toMatch(/invalidateChiefComplaintFactsAndNormalizations/);
    expect(read(LIFECYCLE)).toMatch(/invalidateReviewedCandidateFactsAndNormalizations/);
    expect(read('packages/database/src/services/consultationIntakeService.ts')).toMatch(
      /invalidateChiefComplaintFactsAndNormalizations/,
    );
    expect(read('packages/database/src/services/consultationService.ts')).toMatch(
      /invalidateChiefComplaintFactsAndNormalizations/,
    );
    expect(read('packages/database/src/services/evidenceService.ts')).toMatch(
      /invalidateReviewedCandidateFactsAndNormalizations/,
    );
  });

  it('does not allowlist D3 for parseOwnerFrozenCues (must use C1/C2)', () => {
    const h2 = read(H2);
    expect(h2).toMatch(/cueEligibleSourceService\.ts/);
    expect(h2).toMatch(/f3cReviewedCueSourceService\.ts/);
    expect(h2).not.toMatch(/factNormalizationService\.ts/);
  });

  it('keeps /ready posture unchanged without f3d2dFoundation', () => {
    const ready = read(READY);
    expect(ready).toMatch(/ready:\s*false/);
    expect(ready).toMatch(/normalizationParserAvailable:\s*NORMALIZATION_PARSER_AVAILABLE/);
    expect(ready).toMatch(/cueParserConnected:\s*CUE_PARSER_CONNECTED/);
    expect(ready).toMatch(/cueParserProductionEnabled:\s*CUE_PARSER_PRODUCTION_ENABLED/);
    expect(ready).not.toMatch(/f3d2dFoundation/);
    expect(ready).not.toMatch(/f3d2d2d3|f3d2d3Foundation/i);
  });

  it('rejects unknown closed-input keys before persistence', async () => {
    const service = new FactNormalizationService();
    await expect(
      service.materializeFactNormalizations(tenant, {
        sourceFactCandidateId: '00000000-0000-4000-8000-000000000001',
        idempotencyKey: 'd3-unit-key-01',
        authorityScope: 'FACT_NORMALIZED_SOURCE_LINKED',
      } as never),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.materializeFactNormalizations(tenant, {
        sourceFactCandidateId: '00000000-0000-4000-8000-000000000001',
        idempotencyKey: 'd3-unit-key-02',
        parserResult: { ok: true },
      } as never),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.materializeFactNormalizations(tenant, {
        sourceFactCandidateId: '00000000-0000-4000-8000-000000000001',
        idempotencyKey: 'd3-unit-key-03',
        drafts: [],
      } as never),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
