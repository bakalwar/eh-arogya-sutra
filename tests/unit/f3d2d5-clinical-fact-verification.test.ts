import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOrderedMigrationIds } from '../../packages/database/src/migrate.ts';
import {
  FACT_VERIFICATION_ACTION_REASON_CODES,
  FACT_VERIFICATION_ACTIONS,
  FACT_VERIFICATION_AUTHORITY_SCOPE,
  FACT_VERIFICATION_REASON_CODES,
} from '../../packages/evidence-extract/src/factVerificationTypes.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const UP = 'packages/database/migrations/017_f3d2d5_clinical_fact_verification.sql';
const DOWN = 'packages/database/migrations/017_f3d2d5_clinical_fact_verification.down.sql';
const SERVICE = 'packages/database/src/services/factVerificationService.ts';
const READY = 'apps/api/src/createApp.ts';
const ROUTES_DIR = 'apps/api/src/routes';

const SERVICE_FIREWALL =
  /@ehas2\/rule[1-9]|Rules\b|medicine-registry|medicineCode|clinically_used\s*[:=]\s*true|clinicallyUsed\s*[:=]\s*true|AnalyzeComplete|analyzeComplete|ConfirmPrescription|confirmPrescription/i;

describe('F3D-2D5 clinical fact-verification contract', () => {
  it('keeps migration tip at 017_f3d2d5_clinical_fact_verification length 17', () => {
    const ids = getOrderedMigrationIds();
    expect(ids).toHaveLength(17);
    expect(ids.at(-1)).toBe('017_f3d2d5_clinical_fact_verification');
    expect(fs.existsSync(path.join(root, UP))).toBe(true);
    expect(fs.existsSync(path.join(root, DOWN))).toBe(true);
  });

  it('migration SQL enforces review-only authority, Doctor actor, four actions, FORCE RLS, append-only, deferred snapshot binding, no CASCADE', () => {
    const sql = read(UP);
    expect(sql).toMatch(/SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY/);
    expect(sql).toMatch(
      /clinically_used boolean NOT NULL DEFAULT false CHECK \(clinically_used = false\)/,
    );
    expect(sql).toMatch(/actor_role text NOT NULL CHECK \(actor_role = 'Doctor'\)/);
    expect(sql).toMatch(/'ACCEPT_SOURCE_LINKED_FACT'/);
    expect(sql).toMatch(/'REJECT_SOURCE_LINKED_FACT'/);
    expect(sql).toMatch(/'MARK_UNRESOLVED'/);
    expect(sql).toMatch(/'REQUEST_SOURCE_CORRECTION'/);
    expect(sql).toMatch(/FORCE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/FACT_VERIFICATIONS_IMMUTABLE/);
    expect(sql).toMatch(/FACT_VERIFICATION_NORMS_IMMUTABLE/);
    expect(sql).toMatch(/clinical_fact_verification_events_append_only/);
    expect(sql).toMatch(/clinical_fact_verification_normalizations_append_only/);
    expect(sql).toMatch(/REVOKE DELETE ON clinical_fact_verification_events FROM ehas2_app/);
    expect(sql).toMatch(/ehas2_fact_verification_snapshot_fingerprint/);
    expect(sql).toMatch(/FACT_VERIFICATION_SNAPSHOT_INVALID/);
    expect(sql).toMatch(/DEFERRABLE INITIALLY DEFERRED/);
    expect(sql).toMatch(/ehas2_fact_verification_lock_subject/);
    expect(sql).toMatch(/ehas2:fact-verification:v1:/);
    expect(sql).toMatch(/hashtextextended/);
    expect(sql).toMatch(/COLLATE "C"/);
    expect(sql).toMatch(/clinical_fact_verification_events_snapshot_deferred/);
    expect(sql).toMatch(/clinical_fact_verification_normalizations_snapshot_deferred/);
    expect(sql).toMatch(/clinical_fact_normalizations_verification_snapshot_deferred/);
    expect(sql).toMatch(/clinical_fact_candidates_verification_snapshot_deferred/);
    expect(sql).not.toMatch(/ON DELETE CASCADE/);
  });

  it('down drops 017-owned verification tables, indexes, deferred snapshot and lock functions only', () => {
    const down = read(DOWN);
    expect(down).toMatch(/DROP TABLE IF EXISTS clinical_fact_verification_normalizations/);
    expect(down).toMatch(/DROP TABLE IF EXISTS clinical_fact_verification_events/);
    expect(down).toMatch(
      /DROP INDEX IF EXISTS clinical_fact_verification_events_017_child_parent_uq/,
    );
    expect(down).toMatch(
      /DROP INDEX IF EXISTS clinical_fact_normalizations_017_verification_norm_uq/,
    );
    expect(down).toMatch(
      /DROP INDEX IF EXISTS clinical_fact_candidates_017_verification_parent_uq/,
    );
    expect(down).toMatch(/DROP FUNCTION IF EXISTS ehas2_fact_verification_event_append_only/);
    expect(down).toMatch(/DROP FUNCTION IF EXISTS ehas2_fact_verification_norm_append_only/);
    expect(down).toMatch(/DROP FUNCTION IF EXISTS ehas2_fact_verification_validate_event/);
    expect(down).toMatch(/DROP FUNCTION IF EXISTS ehas2_fact_verification_snapshot_fingerprint/);
    expect(down).toMatch(/DROP FUNCTION IF EXISTS ehas2_fact_verification_lock_subject/);
    expect(down).toMatch(/DROP FUNCTION IF EXISTS ehas2_fact_verification_subject_lock_key/);
    expect(down).toMatch(
      /DROP TRIGGER IF EXISTS clinical_fact_candidates_verification_snapshot_deferred/,
    );
    expect(down).not.toMatch(/DROP TABLE IF EXISTS clinical_fact_candidates/);
    expect(down).not.toMatch(/DROP TABLE IF EXISTS clinical_fact_normalizations;/);
    expect(down).not.toMatch(/DROP TABLE IF EXISTS organizations/);
    expect(down).not.toMatch(/DROP TABLE IF EXISTS consultations/);
  });

  it('service exposes reviewSourceLinkedFact, FACT_VERIFICATION_OPERATION, treating Doctor assert, no ClinicAdmin bypass', () => {
    const service = read(SERVICE);
    expect(service).toMatch(/reviewSourceLinkedFact/);
    expect(service).toMatch(/FACT_VERIFICATION_OPERATION/);
    expect(service).toMatch(/assertTreatingDoctor/);
    // Treating-doctor gate: fail closed unless actorRole is Doctor (source uses !==).
    expect(service).toMatch(/actorRole !== 'Doctor'/);
    expect(service).toMatch(/tenant\.actorId !== doctorUserId/);
    expect(service).not.toMatch(/ClinicAdmin/);
    expect(service).not.toMatch(/bypass/i);
    expect(read('packages/evidence-extract/src/factVerificationTypes.ts')).toMatch(
      /actorRole: 'Doctor'/,
    );
  });

  it('firewalls service away from Rules, medicine, clinically_used=true, AnalyzeComplete, ConfirmPrescription', () => {
    expect(read(SERVICE)).not.toMatch(SERVICE_FIREWALL);
  });

  it('pins authority scope constant and action/reason maps', () => {
    expect(FACT_VERIFICATION_AUTHORITY_SCOPE).toBe('SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY');
    expect([...FACT_VERIFICATION_ACTIONS]).toEqual([
      'ACCEPT_SOURCE_LINKED_FACT',
      'REJECT_SOURCE_LINKED_FACT',
      'MARK_UNRESOLVED',
      'REQUEST_SOURCE_CORRECTION',
    ]);
    expect([...FACT_VERIFICATION_REASON_CODES]).toEqual([
      'SOURCE_REPRESENTATION_REVIEWED',
      'SOURCE_REPRESENTATION_INACCURATE',
      'SOURCE_STALE_OR_CONFLICTING',
      'INSUFFICIENT_SOURCE_CONTEXT',
      'NORMALIZATION_SCOPE_UNRESOLVED',
      'SOURCE_TEXT_CORRECTION_REQUIRED',
      'SOURCE_VALUE_CORRECTION_REQUIRED',
    ]);
    expect(FACT_VERIFICATION_ACTION_REASON_CODES.ACCEPT_SOURCE_LINKED_FACT).toEqual([
      'SOURCE_REPRESENTATION_REVIEWED',
    ]);
    expect(FACT_VERIFICATION_ACTION_REASON_CODES.REJECT_SOURCE_LINKED_FACT).toEqual([
      'SOURCE_REPRESENTATION_INACCURATE',
      'SOURCE_STALE_OR_CONFLICTING',
    ]);
    expect(FACT_VERIFICATION_ACTION_REASON_CODES.MARK_UNRESOLVED).toEqual([
      'INSUFFICIENT_SOURCE_CONTEXT',
      'NORMALIZATION_SCOPE_UNRESOLVED',
    ]);
    expect(FACT_VERIFICATION_ACTION_REASON_CODES.REQUEST_SOURCE_CORRECTION).toEqual([
      'SOURCE_TEXT_CORRECTION_REQUIRED',
      'SOURCE_VALUE_CORRECTION_REQUIRED',
    ]);
  });

  it('keeps /ready still ready:false in createApp', () => {
    const ready = read(READY);
    expect(ready).toMatch(/ready:\s*false/);
    expect(ready).not.toMatch(/f3d2d5Foundation/i);
    expect(ready).not.toMatch(/factVerification.*ready:\s*true/i);
  });

  it('has no API route for fact-verification under apps/api/src/routes', () => {
    const routesDir = path.join(root, ROUTES_DIR);
    const routeFiles = fs.readdirSync(routesDir).filter((n) => /\.[cm]?[jt]sx?$/.test(n));
    expect(routeFiles.some((n) => /fact.?verif/i.test(n))).toBe(false);
    for (const name of routeFiles) {
      const text = read(path.join(ROUTES_DIR, name).replace(/\\/g, '/'));
      expect(text).not.toMatch(/fact-verification|factVerification|FactVerification/i);
    }
  });
});
