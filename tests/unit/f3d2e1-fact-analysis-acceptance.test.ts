import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOrderedMigrationIds } from '../../packages/database/src/migrate.ts';
import {
  FACT_ANALYSIS_ACCEPTANCE_ACTION,
  FACT_ANALYSIS_ACCEPTANCE_AUTHORITY,
} from '../../packages/evidence-extract/src/factAnalysisAcceptanceTypes.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UP = 'packages/database/migrations/018_f3d2e1_fact_analysis_acceptance.sql';
const DOWN = 'packages/database/migrations/018_f3d2e1_fact_analysis_acceptance.down.sql';
const SERVICE = 'packages/database/src/services/factAnalysisAcceptanceService.ts';

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('F3D-2E1 fact analysis-acceptance contract', () => {
  it('registers migration 018 as the 18-migration tip', () => {
    const ids = getOrderedMigrationIds();
    expect(ids).toHaveLength(18);
    expect(ids.at(-1)).toBe('018_f3d2e1_fact_analysis_acceptance');
    expect(fs.existsSync(path.join(root, UP))).toBe(true);
    expect(fs.existsSync(path.join(root, DOWN))).toBe(true);
  });

  it('pins analysis-only action and authority constants', () => {
    expect(FACT_ANALYSIS_ACCEPTANCE_ACTION).toBe('ACCEPT_SOURCE_LINKED_FACT_FOR_ANALYSIS_ONLY');
    expect(FACT_ANALYSIS_ACCEPTANCE_AUTHORITY).toBe('SOURCE_LINKED_FACT_ANALYSIS_ELIGIBLE_ONLY');
  });

  it('enforces false clinical use, FORCE RLS, append-only rows, deferred binding, and canonical locking', () => {
    const sql = read(UP);
    expect(sql).toMatch(/ACCEPT_SOURCE_LINKED_FACT_FOR_ANALYSIS_ONLY/);
    expect(sql).toMatch(/SOURCE_LINKED_FACT_ANALYSIS_ELIGIBLE_ONLY/);
    expect(sql).toMatch(
      /clinically_used boolean NOT NULL DEFAULT false CHECK \(clinically_used = false\)/,
    );
    expect(sql.match(/FORCE ROW LEVEL SECURITY/g)?.length).toBeGreaterThanOrEqual(2);
    expect(sql).toMatch(/REVOKE DELETE ON clinical_fact_analysis_acceptance_events FROM ehas2_app/);
    expect(sql).toMatch(
      /REVOKE UPDATE, DELETE ON clinical_fact_analysis_acceptance_normalizations FROM ehas2_app/,
    );
    expect(sql).toMatch(/FACT_ANALYSIS_ACCEPTANCE_EVENTS_IMMUTABLE/);
    expect(sql).toMatch(/FACT_ANALYSIS_ACCEPTANCE_NORMS_IMMUTABLE/);
    expect(sql).toMatch(/FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID/);
    expect(sql.match(/DEFERRABLE INITIALLY DEFERRED/g)?.length).toBeGreaterThanOrEqual(5);
    expect(sql).toMatch(/ehas2_fact_analysis_acceptance_snapshot_fingerprint/);
    expect(sql).toMatch(/ehas2_fact_analysis_acceptance_lock_subject/);
    expect(sql).toMatch(/ehas2:fact-analysis-acceptance:v1:/);
    expect(sql).toMatch(/hashtextextended/);
    expect(sql).toMatch(/COLLATE "C"/);
    expect(sql).not.toMatch(/ON DELETE CASCADE/);
  });

  it('down migration drops only 018-owned objects, never 017 or parent tables', () => {
    const down = read(DOWN);
    expect(down).toMatch(/DROP TABLE IF EXISTS clinical_fact_analysis_acceptance_normalizations/);
    expect(down).toMatch(/DROP TABLE IF EXISTS clinical_fact_analysis_acceptance_events/);
    expect(down).toMatch(/DROP FUNCTION IF EXISTS ehas2_fact_analysis_acceptance_validate_event/);
    expect(down).toMatch(/DROP FUNCTION IF EXISTS ehas2_fact_analysis_acceptance_lock_subject/);
    expect(down).not.toMatch(/DROP TABLE IF EXISTS clinical_fact_verification_events/);
    expect(down).not.toMatch(/DROP TABLE IF EXISTS clinical_fact_verification_normalizations/);
    expect(down).not.toMatch(/DROP TABLE IF EXISTS clinical_fact_candidates/);
    expect(down).not.toMatch(/DROP TABLE IF EXISTS clinical_fact_normalizations/);
  });

  it('materializeFactAnalysisAcceptance accepts only its two closed input keys', () => {
    const service = read(SERVICE);
    expect(service).toMatch(/materializeFactAnalysisAcceptance/);
    expect(service).toMatch(
      /CLOSED_INPUT_KEYS = new Set\(\['sourceFactCandidateId', 'idempotencyKey'\]\)/,
    );
    expect(service).toMatch(/UNKNOWN_INPUT_KEY/);
    expect(service).toMatch(/actorRole !== 'Doctor'/);
    expect(service).not.toMatch(/\bClinicAdmin\b/);
  });

  it('keeps readiness false and exposes no F3D-2E1 foundation flag', () => {
    const app = read('apps/api/src/createApp.ts');
    expect(app).toMatch(/ready:\s*false/);
    expect(app).not.toMatch(/analysisAcceptanceFoundation/i);
    expect(app).not.toMatch(/f3d2e1Foundation/i);
  });

  it('has no analysis-acceptance API route', () => {
    const routes = path.join(root, 'apps/api/src/routes');
    const files = fs.readdirSync(routes).filter((name) => /\.[cm]?[jt]sx?$/.test(name));
    expect(files.some((name) => /analysis.?acceptance/i.test(name))).toBe(false);
    for (const name of files) {
      expect(read(`apps/api/src/routes/${name}`)).not.toMatch(
        /analysis-acceptance|analysisAcceptance|FactAnalysisAcceptance/i,
      );
    }
  });

  it('ships the executable firewall script', () => {
    const rel = 'scripts/f3d2e1-analysis-acceptance-firewall.mjs';
    expect(fs.existsSync(path.join(root, rel))).toBe(true);
    expect(read(rel)).toMatch(/F3D-2E1 fact-analysis acceptance firewall OK/);
  });
});
