import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOrderedMigrationIds } from '../../packages/database/src/migrate.ts';
import {
  STRUCTURED_VITAL_FIELD_SPECS,
  STRUCTURED_VITAL_SOURCE_FIELDS,
  STRUCTURED_VITAL_SOURCE_LOCK_PREFIX,
  sortStructuredVitalFields,
  vitalFieldsChanged,
  FactNormalizationService,
  ValidationError,
} from '../../packages/database/src/index.ts';
import {
  F3D2D2_PERSISTENCE_CONNECTED,
  F3D2D2_PRODUCTION_WRITER_CONNECTED,
  FACT_NORMALIZATION_AUTHORITY_SCOPE,
  F3D2D_PRODUCTION_ENABLED,
  NORMALIZER_STRUCTURED_VITAL_FIELDS,
} from '../../packages/evidence-extract/src/index.ts';
import type { TenantContext } from '../../packages/database/src/tenantContext.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const SERVICE = 'packages/database/src/services/factNormalizationService.ts';
const LOCK = 'packages/database/src/services/cueSourceLock.ts';
const LIFECYCLE = 'packages/database/src/services/factNormalizationLifecycle.ts';
const INTAKE = 'packages/database/src/services/consultationIntakeService.ts';
const FACT = 'packages/database/src/services/factCandidateService.ts';
const READY = 'apps/api/src/createApp.ts';
const H2 = 'scripts/ehas2-parser-runtime-import-firewall.mjs';
const PACK = 'packages/evidence-extract/packs/ehas2-owner-cue-pack.v1.0.0.json';

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

describe('F3D-2D4 structured vital lifecycle + STRUCTURED_UNIT contract', () => {
  it('keeps migration tip at 016 with no 017', () => {
    const ids = getOrderedMigrationIds();
    expect(ids.at(-1)).toBe('016_f3d2_fact_normalizations');
    expect(ids).toHaveLength(16);
    expect(
      fs
        .readdirSync(path.join(root, 'packages/database/migrations'))
        .some((n) => n.startsWith('017_')),
    ).toBe(false);
  });

  it('documents exact repository-backed vital field matrix', () => {
    expect([...STRUCTURED_VITAL_SOURCE_FIELDS]).toEqual([...NORMALIZER_STRUCTURED_VITAL_FIELDS]);
    expect(STRUCTURED_VITAL_FIELD_SPECS.map((s) => s.sourceField)).toEqual([
      'VITAL_BP_SYSTOLIC',
      'VITAL_BP_DIASTOLIC',
      'VITAL_PULSE',
      'VITAL_TEMPERATURE',
      'VITAL_SPO2',
      'VITAL_WEIGHT',
      'VITAL_HEIGHT',
    ]);
    expect(STRUCTURED_VITAL_FIELD_SPECS.map((s) => s.unitText)).toEqual([
      'mmHg',
      'mmHg',
      'bpm',
      '°C',
      '%',
      'kg',
      'cm',
    ]);
    const schema = read('packages/database/migrations/003_patient_clinical.sql');
    for (const col of [
      'blood_pressure_systolic',
      'blood_pressure_diastolic',
      'pulse_bpm',
      'temperature_c',
      'spo2_percent',
      'weight_kg',
      'height_cm',
    ]) {
      expect(schema).toMatch(new RegExp(col));
    }
  });

  it('sorts and diffs vital fields deterministically', () => {
    expect(
      sortStructuredVitalFields(['VITAL_WEIGHT', 'VITAL_BP_SYSTOLIC', 'VITAL_WEIGHT', 'NOPE']),
    ).toEqual(['VITAL_BP_SYSTOLIC', 'VITAL_WEIGHT']);
    expect(
      vitalFieldsChanged(
        { bloodPressureSystolic: 120, pulseBpm: 72 },
        { bloodPressureSystolic: 120, pulseBpm: 80 },
      ),
    ).toEqual(['VITAL_PULSE']);
    expect(vitalFieldsChanged({ temperatureC: 37 }, { temperatureC: null })).toEqual([
      'VITAL_TEMPERATURE',
    ]);
  });

  it('wires shared vital locks, intake invalidation, and D3 STRUCTURED_UNIT', () => {
    expect(read(LOCK)).toMatch(/STRUCTURED_VITAL_SOURCE_LOCK_PREFIX/);
    expect(read(LOCK)).toMatch(/ehas2:structured-vital-source:v1/);
    expect(read(LOCK)).toMatch(/lockStructuredVitalSourceFields/);
    expect(read(LIFECYCLE)).toMatch(/invalidateStructuredVitalFactsAndNormalizations/);
    expect(read(INTAKE)).toMatch(/lockStructuredVitalSourceFields/);
    expect(read(INTAKE)).toMatch(/invalidateStructuredVitalFactsAndNormalizations/);
    expect(read(FACT)).toMatch(/lockStructuredVitalSourceFields/);
    expect(read(FACT)).toMatch(/unit: '°C'/);
    expect(read(SERVICE)).toMatch(/mode:\s*'STRUCTURED_UNIT'/);
    expect(read(SERVICE)).toMatch(/normalizationMode/);
    expect(read(SERVICE)).not.toMatch(/STRUCTURED_UNIT_DEFERRED/);
    expect(read(SERVICE)).not.toMatch(FORBIDDEN_RUNTIME);
    expect(STRUCTURED_VITAL_SOURCE_LOCK_PREFIX).toBe('ehas2:structured-vital-source:v1');
  });

  it('preserves chief/F3C lock domains and H2 allowlist', () => {
    expect(read(LOCK)).toMatch(/ehas2:cue-source:v1/);
    expect(read(LOCK)).toMatch(/ehas2:f3c-reviewed-cue-source:v1/);
    const h2 = read(H2);
    expect(h2).toMatch(/cueEligibleSourceService\.ts/);
    expect(h2).toMatch(/f3cReviewedCueSourceService\.ts/);
    expect(h2).not.toMatch(/factNormalizationService\.ts/);
    expect(h2).not.toMatch(/structuredVitalSource\.ts/);
  });

  it('keeps production pack/checksum, readiness, and writer flags unchanged', () => {
    const pack = JSON.parse(read(PACK)) as {
      packId: string;
      packVersion: string;
      ownerApprovalToken: string;
    };
    expect(pack.packId).toBe('ehas2-owner-cue-pack');
    expect(pack.packVersion).toBe('1.0.0');
    expect(pack.ownerApprovalToken).toMatch(
      /^EHAS2_F3D2_PACK_APPROVAL:ehas2-owner-cue-pack:1\.0\.0:[a-f0-9]{64}$/,
    );
    expect(F3D2D2_PERSISTENCE_CONNECTED).toBe(false);
    expect(F3D2D2_PRODUCTION_WRITER_CONNECTED).toBe(false);
    expect(F3D2D_PRODUCTION_ENABLED).toBe(false);
    expect(FACT_NORMALIZATION_AUTHORITY_SCOPE).toBe('FACT_NORMALIZED_SOURCE_LINKED');
    const ready = read(READY);
    expect(ready).toMatch(/ready:\s*false/);
    expect(ready).toMatch(/normalizationParserAvailable:\s*NORMALIZATION_PARSER_AVAILABLE/);
    expect(ready).toMatch(/cueParserConnected:\s*CUE_PARSER_CONNECTED/);
    expect(ready).toMatch(/cueParserProductionEnabled:\s*CUE_PARSER_PRODUCTION_ENABLED/);
    expect(ready).not.toMatch(/f3d2dFoundation/);
    expect(ready).not.toMatch(/f3d2d4/i);
    expect(read(SERVICE)).not.toMatch(/router\.|app\.(get|post|put|patch)/);
  });

  it('rejects closed-input caller value/unit/mode/draft keys', async () => {
    const service = new FactNormalizationService();
    for (const bad of [
      { unitText: 'mmHg' },
      { mode: 'STRUCTURED_UNIT' },
      { assertedValueText: '120' },
      { drafts: [] },
      { parserResult: { ok: true } },
    ]) {
      await expect(
        service.materializeFactNormalizations(tenant, {
          sourceFactCandidateId: '00000000-0000-4000-8000-000000000001',
          idempotencyKey: 'd4-unit-closed-01',
          ...bad,
        } as never),
      ).rejects.toBeInstanceOf(ValidationError);
    }
  });

  it('orders vital source lock before fact/norm work; idempotency before D2', () => {
    const service = read(SERVICE);
    const vitalLockAt = service.indexOf('lockStructuredVitalSourceFields');
    const parentLockAt = service.indexOf('lockAndLoadParentFact');
    const resolveAt = service.indexOf('idempotency.resolveOrThrow');
    const hookAt = service.indexOf('this.deps.beforeFirstWriteParse');
    const normalizeAt = service.indexOf("mode: 'STRUCTURED_UNIT'");
    expect(vitalLockAt).toBeGreaterThan(-1);
    expect(parentLockAt).toBeGreaterThan(vitalLockAt);
    expect(resolveAt).toBeGreaterThan(parentLockAt);
    expect(hookAt).toBeGreaterThan(resolveAt);
    expect(normalizeAt).toBeGreaterThan(hookAt);

    const factSvc = read(FACT);
    const factVitalLock = factSvc.indexOf('lockStructuredVitalSourceFields');
    const factIdentity = factSvc.indexOf('lockIdentity');
    expect(factVitalLock).toBeGreaterThan(-1);
    expect(factIdentity).toBeGreaterThan(factVitalLock);

    const intake = read(INTAKE);
    expect(intake.indexOf('lockStructuredVitalSourceFields')).toBeLessThan(
      intake.indexOf('invalidateStructuredVitalFactsAndNormalizations'),
    );
    expect(intake.indexOf('invalidateStructuredVitalFactsAndNormalizations')).toBeLessThan(
      intake.indexOf('upsertVitals'),
    );
  });
});
