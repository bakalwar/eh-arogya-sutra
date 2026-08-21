import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOrderedMigrationIds } from '../../packages/database/src/migrate.ts';
import {
  assertRulesShadowInputNfcString,
  buildRulesShadowInputFingerprint,
  compareRulesShadowFactOrder,
  compareRulesShadowNormOrder,
} from '../../packages/database/src/rulesShadowInputCanonical.ts';
import {
  MAX_RULES_SHADOW_INPUT_FACTS,
  MAX_RULES_SHADOW_INPUT_NORMS_PER_FACT,
  MAX_RULES_SHADOW_INPUT_TOTAL_NORMS,
  RULES_SHADOW_INPUT_AUTHORITY,
  RULES_SHADOW_INPUT_CREATED_FROM_CONTRACT_VERSION,
  RULES_SHADOW_INPUT_SCHEMA_VERSION,
  type RulesShadowInputDto,
} from '../../packages/evidence-extract/src/rulesShadowInputTypes.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function hex(n: number): string {
  return createHash('sha256').update(`e2-unit-${n}`, 'utf8').digest('hex');
}

describe('F3D-2E2 rules-shadow-input contract', () => {
  it('keeps migration tip at 018 with no 019', () => {
    const ids = getOrderedMigrationIds();
    expect(ids).toHaveLength(18);
    expect(ids.at(-1)).toBe('018_f3d2e1_fact_analysis_acceptance');
    expect(
      fs.existsSync(
        path.join(root, 'packages/database/migrations/019_f3d2e2_rules_shadow_input.sql'),
      ),
    ).toBe(false);
  });

  it('pins shadow-input authority and caps', () => {
    expect(RULES_SHADOW_INPUT_AUTHORITY).toBe('SOURCE_LINKED_FACT_RULES_SHADOW_INPUT_ONLY');
    expect(RULES_SHADOW_INPUT_SCHEMA_VERSION).toBe('f3d2e2-rules-shadow-input-v1');
    expect(RULES_SHADOW_INPUT_CREATED_FROM_CONTRACT_VERSION).toBe('f3d2e1-analysis-acceptance-v1');
    expect(MAX_RULES_SHADOW_INPUT_FACTS).toBe(128);
    expect(MAX_RULES_SHADOW_INPUT_NORMS_PER_FACT).toBe(32);
    expect(MAX_RULES_SHADOW_INPUT_TOTAL_NORMS).toBe(512);
  });

  it('closed input is consultationId only and builder is write-free', () => {
    const service = read('packages/database/src/services/rulesShadowInputService.ts');
    expect(service).toMatch(/CLOSED_INPUT_KEYS = new Set\(\['consultationId'\]\)/);
    expect(service).toMatch(/buildRulesShadowInput/);
    expect(service).toMatch(/actorRole !== 'Doctor'/);
    expect(service).not.toMatch(/\bClinicAdmin\b/);
    expect(service).not.toMatch(/INSERT INTO|DELETE FROM/i);
    expect(service).not.toMatch(/Date\.now\s*\(|Math\.random\s*\(|randomUUID/);
  });

  it('ready remains false with no E2 readiness flag', () => {
    const source = read('apps/api/src/createApp.ts');
    expect(source).toMatch(/ready:\s*false/);
    expect(source).not.toMatch(/rulesShadowInput|f3d2e2Foundation|shadowInputFoundation/i);
  });

  it('rejects malformed Unicode / non-NFC strings', () => {
    expect(() => assertRulesShadowInputNfcString('café'.normalize('NFD'), 64)).toThrow(
      /MALFORMED_UNICODE/,
    );
    expect(() => assertRulesShadowInputNfcString('ok', 64)).not.toThrow();
  });

  it('orders facts and norms deterministically', () => {
    const facts = [
      {
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        factCandidateId: 'b',
        acceptanceEventId: '2',
      },
      {
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        factCandidateId: 'a',
        acceptanceEventId: '1',
      },
    ].sort(compareRulesShadowFactOrder);
    expect(facts[0]?.sourceChannel).toBe('DOCTOR_DECLARED');
    const norms = [
      {
        normalizationKind: 'UNIT_ALIAS',
        canonicalLabel: 'b',
        normalizationIdentityFingerprint: hex(2),
        normalizationId: '2',
      },
      {
        normalizationKind: 'DURATION_PHRASE',
        canonicalLabel: 'a',
        normalizationIdentityFingerprint: hex(1),
        normalizationId: '1',
      },
    ].sort(compareRulesShadowNormOrder);
    expect(norms[0]?.normalizationKind).toBe('DURATION_PHRASE');
  });

  it('fingerprint golden vector is stable across repeats', () => {
    const draft: Omit<RulesShadowInputDto, 'consultationInputFingerprint'> = {
      schemaVersion: RULES_SHADOW_INPUT_SCHEMA_VERSION,
      authorityScope: RULES_SHADOW_INPUT_AUTHORITY,
      clinicallyUsed: false,
      organizationId: '11111111-1111-4111-8111-111111111111',
      clinicId: '22222222-2222-4222-8222-222222222222',
      patientId: '33333333-3333-4333-8333-333333333333',
      consultationId: '44444444-4444-4444-8444-444444444444',
      treatingDoctorId: '55555555-5555-4555-8555-555555555555',
      createdFromContractVersion: RULES_SHADOW_INPUT_CREATED_FROM_CONTRACT_VERSION,
      limitationCodes: ['NOT_AUTHORITATIVE', 'NO_DISEASE_MAPPING'],
      facts: [
        {
          factCandidateId: '66666666-6666-4666-8666-666666666666',
          acceptanceEventId: '77777777-7777-4777-8777-777777777777',
          verificationEventId: '88888888-8888-4888-8888-888888888888',
          sourceChannel: 'DOCTOR_DECLARED',
          sourceField: 'CHIEF_COMPLAINT',
          sourceIdentityFingerprint: hex(10),
          sourceContentFingerprint: hex(11),
          normalizationSnapshotFingerprint: hex(12),
          acceptanceContractVersion: RULES_SHADOW_INPUT_CREATED_FROM_CONTRACT_VERSION,
          packId: 'pack',
          packVersion: '1',
          packContentChecksum: hex(13),
          parserVersion: 'f3d2b-cue-parser-v1',
          parserFingerprint: hex(14),
          normalizerMethod: 'OWNER_FROZEN_SOURCE_PRESERVING_V1',
          normalizerVersion: 'f3d2d2-src-norm-v1',
          normalizerFingerprint: hex(15),
          decisionStatus: 'ACTIVE',
          limitationCodes: ['SOURCE_LINKED_NORMALIZATION_ONLY'],
          normalizedSignals: [
            {
              normalizationId: '99999999-9999-4999-8999-999999999999',
              normalizationIdentityFingerprint: hex(16),
              normalizationKind: 'NEGATION_CUE',
              canonicalLabel: 'denies',
              structuredNumericValue: null,
              exactUnitAlias: null,
              durationLabel: null,
              negationScope: 'SCOPE_UNRESOLVED',
              cueEntryIds: ['cue-1'],
              limitationCodes: ['SCOPE_UNRESOLVED'],
            },
          ],
        },
      ],
    };
    const a = buildRulesShadowInputFingerprint(draft);
    const b = buildRulesShadowInputFingerprint(draft);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).toBe(b);
  });

  it('firewall script exists and is wired in CI', () => {
    expect(fs.existsSync(path.join(root, 'scripts/f3d2e2-rules-shadow-input-firewall.mjs'))).toBe(
      true,
    );
    const ci = read('.github/workflows/ci.yml');
    expect(ci).toMatch(/f3d2e2-rules-shadow-input-firewall\.mjs/);
    expect(ci).toMatch(/ehas2_phase_f3d2e2_test/);
  });
});
