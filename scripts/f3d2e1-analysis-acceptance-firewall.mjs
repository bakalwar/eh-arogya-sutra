/** F3D-2E1 firewall: analysis acceptance remains source-linked and selector-free. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCOPED = [
  'packages/database/src/services/factAnalysisAcceptanceService.ts',
  'packages/database/src/repositories/factAnalysisAcceptance.ts',
  'packages/database/src/factAnalysisAcceptanceSnapshot.ts',
  'packages/database/src/factAnalysisAcceptanceLock.ts',
  'packages/database/migrations/018_f3d2e1_fact_analysis_acceptance.sql',
  'packages/evidence-extract/src/factAnalysisAcceptanceTypes.ts',
];
const FORBIDDEN_IMPORT =
  /from\s+['"]@ehas2\/(?:rule[1-9]|medicine-registry|engine-adapter|clinical-engine)['"]|require\(['"]@ehas2\/(?:rule[1-9]|medicine-registry|engine-adapter|clinical-engine)['"]\)/i;
const FORBIDDEN_CALL =
  /clinicallyUsed\s*:\s*true|clinically_used\s*:\s*true|clinically_used\s*=\s*true|evaluateRule[1-9]|addStructuredFindings|AnalyzeComplete|analyzeComplete\s*\(|ConfirmPrescription|confirmPrescription|structured_report_findings/i;
const SQL_FREE_TEXT_NOTES =
  /\b(?:asserted_text|original_source_span|raw_complaint|free_text|note_text|clinical_note|doctor_notes|observation_notes|chief_complaint_text)\b/;

function scan(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return ['missing'];
  const text = fs.readFileSync(file, 'utf8');
  const hits = [];
  if (FORBIDDEN_IMPORT.test(text) || FORBIDDEN_CALL.test(text)) hits.push('coupling');
  if (rel.endsWith('.sql') && SQL_FREE_TEXT_NOTES.test(text)) hits.push('free-text');
  if (rel.endsWith('.sql') && /ON DELETE CASCADE/i.test(text)) hits.push('cascade');
  if (
    rel.endsWith('.sql') &&
    (!/DEFERRABLE INITIALLY DEFERRED/.test(text) ||
      !/ehas2_fact_analysis_acceptance_snapshot_fingerprint/.test(text) ||
      !/FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID/.test(text) ||
      !/ehas2_fact_analysis_acceptance_lock_subject/.test(text) ||
      !/ehas2:fact-analysis-acceptance:v1:/.test(text) ||
      !/hashtextextended/.test(text) ||
      !/COLLATE "C"/.test(text) ||
      !/ACCEPT_SOURCE_LINKED_FACT_FOR_ANALYSIS_ONLY/.test(text) ||
      !/SOURCE_LINKED_FACT_ANALYSIS_ELIGIBLE_ONLY/.test(text) ||
      !/f3d2e1-analysis-acceptance-v1/.test(text))
  ) {
    hits.push('contract');
  }
  return hits;
}

const failed = SCOPED.flatMap((rel) => {
  const hits = scan(rel);
  return hits.length ? [`${rel} (${hits.join(', ')})`] : [];
});
if (failed.length) {
  console.error('F3D-2E1 analysis acceptance firewall failed:', failed.join('; '));
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ehas2-f3d2e1-fw-'));
try {
  const probe = path.join(tmp, 'probe.ts');
  fs.writeFileSync(
    probe,
    `import { evaluateRule1 } from '@ehas2/rule1';\nclinically_used: true\nAnalyzeComplete()\nConfirmPrescription\n`,
    'utf8',
  );
  const text = fs.readFileSync(probe, 'utf8');
  if (!FORBIDDEN_IMPORT.test(text) || !FORBIDDEN_CALL.test(text)) {
    console.error('F3D-2E1 negative probe failed');
    process.exit(1);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('F3D-2E1 fact-analysis acceptance firewall OK');
