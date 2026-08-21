import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOrderedMigrationIds } from '../../packages/database/src/migrate.ts';
import {
  F3D2D_CUE_MATCH_ROWS_PERSISTED,
  F3D2D_FACT_NORMALIZATION_FOUNDATION,
  F3D2D_NORMALIZER_CONNECTED,
  F3D2D_PARENT_FACT_SUPERSEDE_PROPAGATES_NORMALIZATIONS,
  F3D2D_PRODUCTION_ENABLED,
  FACT_NORMALIZATION_AUTHORITY_SCOPE,
  FACT_NORMALIZATION_KINDS,
  FACT_NORMALIZATION_SELECTOR_FORBIDDEN_FIELD_NAMES,
} from '../../packages/evidence-extract/src/factNormalizationTypes.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const UP = 'packages/database/migrations/016_f3d2_fact_normalizations.sql';
const DOWN = 'packages/database/migrations/016_f3d2_fact_normalizations.down.sql';
const REPO = 'packages/database/src/repositories/factNormalization.ts';
const TYPES = 'packages/evidence-extract/src/factNormalizationTypes.ts';
const READY = 'apps/api/src/createApp.ts';
const FACT_REPO = 'packages/database/src/repositories/factCandidate.ts';

const COUPLING =
  /@ehas2\/rule[1-9]|@ehas2\/medicine-registry|@ehas2\/engine-adapter|@ehas2\/clinical-engine|evaluateRule[1-9]|tesseract\.js|pdf-parse|LibreTranslate|addStructuredFindings|analyzeComplete\s*\(|from\s+['"][^'"]*parseOwnerFrozenCues/;

const PHI_STORAGE =
  /object_key|storage_path|filename|https?:\/\/|password|api[_-]?key|secret|raw_complaint|asserted_text|original_source_span/;

describe('F3D-2D0/2D1 fact-normalization persistence contract', () => {
  it('pins child-event authority without clinical activation', () => {
    expect(F3D2D_FACT_NORMALIZATION_FOUNDATION).toBe(true);
    expect(F3D2D_NORMALIZER_CONNECTED).toBe(false);
    expect(F3D2D_PRODUCTION_ENABLED).toBe(false);
    expect(F3D2D_CUE_MATCH_ROWS_PERSISTED).toBe(false);
    expect(F3D2D_PARENT_FACT_SUPERSEDE_PROPAGATES_NORMALIZATIONS).toBe(true);
    expect(FACT_NORMALIZATION_AUTHORITY_SCOPE).toBe('FACT_NORMALIZED_SOURCE_LINKED');
    expect([...FACT_NORMALIZATION_KINDS]).toEqual([
      'UNIT_ALIAS',
      'DURATION_PHRASE',
      'NEGATION_CUE',
    ]);
    expect(FACT_NORMALIZATION_SELECTOR_FORBIDDEN_FIELD_NAMES).toContain('medicineCode');
    expect(FACT_NORMALIZATION_SELECTOR_FORBIDDEN_FIELD_NAMES).toContain('analyzeComplete');
  });

  it('registers migration 016 tip and down-only owned objects', () => {
    const ids = getOrderedMigrationIds();
    expect(ids).toHaveLength(16);
    expect(ids.at(-1)).toBe('016_f3d2_fact_normalizations');
    expect(fs.existsSync(path.join(root, UP))).toBe(true);
    expect(fs.existsSync(path.join(root, DOWN))).toBe(true);
    const down = read(DOWN);
    expect(down).toMatch(/DROP TRIGGER IF EXISTS clinical_fact_normalizations_append_only/);
    expect(down).toMatch(/DROP FUNCTION IF EXISTS ehas2_fact_normalization_append_only/);
    expect(down).toMatch(/DROP TABLE IF EXISTS clinical_fact_normalizations/);
    expect(down).toMatch(/DROP INDEX IF EXISTS clinical_fact_candidates_016_norm_parent_uq/);
    expect(down).not.toMatch(/DROP TABLE IF EXISTS clinical_fact_candidates/);
    expect(down).not.toMatch(/DROP TABLE IF EXISTS organizations/);
  });

  it('migration 016 schema enforces RLS, append-only, and bounded child authority', () => {
    const sql = read(UP);
    expect(sql).toMatch(/CREATE TABLE clinical_fact_normalizations/);
    expect(sql).toMatch(/clinical_fact_candidates_016_norm_parent_uq/);
    expect(sql).toMatch(/clinical_fact_normalizations_parent_link_fk/);
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/FORCE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/ehas2_tenant_ok\(organization_id, clinic_id\)/);
    expect(sql).toMatch(/REVOKE DELETE ON clinical_fact_normalizations FROM ehas2_app/);
    expect(sql).not.toMatch(/ON DELETE CASCADE/);
    expect(sql).toMatch(
      /clinically_used boolean NOT NULL DEFAULT false CHECK \(clinically_used = false\)/,
    );
    expect(sql).toMatch(/authority_scope = 'FACT_NORMALIZED_SOURCE_LINKED'/);
    expect(sql).toMatch(
      /decision_status text NOT NULL CHECK \(decision_status IN \('ACTIVE', 'SUPERSEDED'\)\)/,
    );
    expect(sql).toMatch(/clinical_fact_normalizations_active_identity_unique/);
    expect(sql).toMatch(/FACT_NORMALIZATIONS_IMMUTABLE/);
    expect(sql).toMatch(/OLD\.decision_status = 'ACTIVE' AND NEW\.decision_status = 'SUPERSEDED'/);
    expect(sql).toMatch(
      /normalization_kind IN \(\s*'UNIT_ALIAS',\s*'DURATION_PHRASE',\s*'NEGATION_CUE'/,
    );
    expect(sql).toMatch(/negation_scope = 'SCOPE_UNRESOLVED'/);
    expect(sql).toMatch(/NO_UNIT_CONVERSION/);
    expect(sql).toMatch(/RECOMPUTE_CUES_FROM_SOURCE/);
    expect(sql).not.toMatch(PHI_STORAGE);
    expect(sql).not.toMatch(
      /disease_id|medicine_code|formula|potency|dose|temperament|constitution|severity/,
    );
    expect(sql).not.toMatch(/CREATE TABLE clinical_cue_matches/);
  });

  it('repository is primitives-only and does not call cue parser or parent fact writers', () => {
    const repo = read(REPO);
    expect(repo).toMatch(/class PgFactNormalizationRepository/);
    expect(repo).toMatch(/async insert\(/);
    expect(repo).toMatch(/async findById\(/);
    expect(repo).toMatch(/async listByConsultation\(/);
    expect(repo).toMatch(/async findActiveByIdentity\(/);
    expect(repo).toMatch(/async lockIdentitiesSorted\(/);
    expect(repo).toMatch(/async supersedeActive\(/);
    expect(repo).toMatch(/async supersedeActiveLinkedToFacts\(/);
    expect(repo).toMatch(/\[\.\.\.new Set\(fingerprints\)\]\.sort\(/);
    expect(repo).toMatch(/FOR UPDATE/);
    expect(repo).toMatch(/FACT_INELIGIBLE/);
    expect(repo).toMatch(/ResourceNotFoundError/);
    expect(repo).toMatch(/lockAndLoadEligibleParent|parent fact row lock/);
    const inputStart = repo.indexOf('export type InsertFactNormalizationInput');
    const inputSlice = repo.slice(inputStart, repo.indexOf('/**', inputStart + 10));
    expect(inputSlice).toMatch(/sourceFactCandidateId/);
    expect(inputSlice).not.toMatch(/\bpatientId\b/);
    expect(inputSlice).not.toMatch(/\bconsultationId\b/);
    expect(inputSlice).not.toMatch(/\bsourceChannel\b/);
    expect(inputSlice).not.toMatch(/\bsourceField\b/);
    expect(inputSlice).not.toMatch(/\bsourceIdentityFingerprint\b/);
    expect(repo).not.toMatch(COUPLING);
    expect(repo).not.toMatch(/UPDATE clinical_fact_candidates/);
    expect(repo).not.toMatch(/INSERT INTO clinical_fact_candidates/);
    expect(repo).not.toMatch(/parseOwnerFrozenCues\s*\(/);
    expect(repo).not.toMatch(/import\s+.*parseOwnerFrozenCues/);
    expect(read(TYPES)).not.toMatch(COUPLING);
  });

  it('D3 wires parent fact SUPERSEDE to linked normalizations via factCandidate helpers', () => {
    const factRepo = read(FACT_REPO);
    expect(factRepo).toMatch(/PgFactNormalizationRepository/);
    expect(factRepo).toMatch(/supersedeActiveLinkedToFacts/);
    expect(factRepo).toMatch(/lockActiveIdentitiesForParentFacts/);
    const services = fs.readdirSync(path.join(root, 'packages/database/src/services'));
    expect(services.some((n) => /factNormalizationService/i.test(n))).toBe(true);
    expect(services.some((n) => /factNormalizationLifecycle/i.test(n))).toBe(true);
  });

  it('keeps readiness and authz flags unchanged without f3d2dFoundation', () => {
    const ready = read(READY);
    expect(ready).toMatch(/ready:\s*false/);
    expect(ready).toMatch(/normalizationParserAvailable:\s*NORMALIZATION_PARSER_AVAILABLE/);
    expect(ready).toMatch(/cueParserConnected:\s*CUE_PARSER_CONNECTED/);
    expect(ready).toMatch(/cueParserProductionEnabled:\s*CUE_PARSER_PRODUCTION_ENABLED/);
    expect(ready).toMatch(/clinicalEngine:\s*false/);
    expect(ready).toMatch(/extractProduction:\s*EVIDENCE_EXTRACT_PRODUCTION/);
    expect(ready).not.toMatch(/f3d2dFoundation:\s*true/);
    expect(ready).not.toMatch(/f3d2dFoundation/);
  });

  it('DTO avoids selector-forbidden clinical fields', () => {
    const types = read(TYPES);
    const start = types.indexOf('export type FactNormalizationDto');
    const slice = types.slice(start);
    for (const field of FACT_NORMALIZATION_SELECTOR_FORBIDDEN_FIELD_NAMES) {
      expect(slice).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
  });
});
