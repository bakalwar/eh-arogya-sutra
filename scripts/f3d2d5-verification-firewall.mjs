/**
 * F3D-2D5 firewall: clinical fact-verification paths stay Rules-/medicine-/Rx-free.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SCOPED = [
  'packages/database/src/services/factVerificationService.ts',
  'packages/database/src/repositories/factVerification.ts',
  'packages/database/src/factVerificationSnapshot.ts',
  'packages/database/src/factVerificationLock.ts',
  'packages/database/migrations/017_f3d2d5_clinical_fact_verification.sql',
  'packages/evidence-extract/src/factVerificationTypes.ts',
];

const FORBIDDEN_IMPORT =
  /from\s+['"]@ehas2\/(?:rule[1-9]|medicine-registry|engine-adapter|clinical-engine)['"]|require\(['"]@ehas2\/(?:rule[1-9]|medicine-registry|engine-adapter|clinical-engine)['"]\)/i;

const FORBIDDEN_CALL =
  /clinicallyUsed\s*:\s*true|clinically_used\s*:\s*true|clinically_used\s*=\s*true|evaluateRule[1-9]|addStructuredFindings|AnalyzeComplete|analyzeComplete\s*\(|ConfirmPrescription|confirmPrescription|structured_report_findings/i;

/** Column-style free-text note storage only — not source_field enum literals like HISTORY_NOTES. */
const SQL_FREE_TEXT_NOTES =
  /\b(?:asserted_text|original_source_span|raw_complaint|free_text|note_text|clinical_note|doctor_notes|observation_notes|chief_complaint_text)\b/;

function abs(rel) {
  return path.join(root, rel);
}

function scanFile(rel) {
  const file = abs(rel);
  if (!fs.existsSync(file)) {
    console.error(`F3D-2D5 firewall: missing scoped file ${rel}`);
    process.exit(1);
  }
  const text = fs.readFileSync(file, 'utf8');
  const hits = [];
  if (FORBIDDEN_IMPORT.test(text) || FORBIDDEN_CALL.test(text)) {
    hits.push('coupling');
  }
  if (rel.endsWith('.sql') && SQL_FREE_TEXT_NOTES.test(text)) {
    hits.push('free-text-note-fields');
  }
  if (rel.endsWith('.sql') && /ON DELETE CASCADE/i.test(text)) {
    hits.push('on-delete-cascade');
  }
  if (
    rel.endsWith('.sql') &&
    (!/DEFERRABLE INITIALLY DEFERRED/.test(text) ||
      !/ehas2_fact_verification_snapshot_fingerprint/.test(text) ||
      !/FACT_VERIFICATION_SNAPSHOT_INVALID/.test(text) ||
      !/ehas2_fact_verification_lock_subject/.test(text) ||
      !/ehas2:fact-verification:v1:/.test(text) ||
      !/hashtextextended/.test(text) ||
      !/COLLATE "C"/.test(text))
  ) {
    hits.push('missing-deferred-snapshot-binding');
  }
  return hits;
}

const failed = [];
for (const rel of SCOPED) {
  const hits = scanFile(rel);
  if (hits.length) {
    failed.push(`${rel} (${hits.join(', ')})`);
  }
}

if (failed.length) {
  console.error('F3D-2D5 verification firewall failed:', failed.join('; '));
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ehas2-f3d2d5-fw-'));
try {
  const probe = path.join(tmp, 'probe.ts');
  fs.writeFileSync(
    probe,
    `import { evaluateRule1 } from '@ehas2/rule1';\nclinically_used: true\nAnalyzeComplete()\nConfirmPrescription\nstructured_report_findings\n`,
    'utf8',
  );
  const probeText = fs.readFileSync(probe, 'utf8');
  if (!FORBIDDEN_IMPORT.test(probeText) || !FORBIDDEN_CALL.test(probeText)) {
    console.error('F3D-2D5 negative probe did not detect forbidden patterns');
    process.exit(1);
  }
  const sqlProbe = path.join(tmp, 'probe.sql');
  fs.writeFileSync(sqlProbe, `CREATE TABLE t (asserted_text text, free_text text);\n`, 'utf8');
  if (!SQL_FREE_TEXT_NOTES.test(fs.readFileSync(sqlProbe, 'utf8'))) {
    console.error('F3D-2D5 negative SQL probe did not detect free-text note fields');
    process.exit(1);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('F3D-2D5 clinical fact-verification firewall OK');
