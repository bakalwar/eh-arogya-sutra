/** F3D-2E2 firewall: Rules-shadow-input DTO remains non-persistent and selector-free. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCOPED = [
  'packages/database/src/services/rulesShadowInputService.ts',
  'packages/database/src/rulesShadowInputCanonical.ts',
  'packages/evidence-extract/src/rulesShadowInputTypes.ts',
];
const FORBIDDEN_IMPORT =
  /from\s+['"]@ehas2\/(?:rule[1-9]|medicine-registry|engine-adapter|clinical-engine)['"]|require\(['"]@ehas2\/(?:rule[1-9]|medicine-registry|engine-adapter|clinical-engine)['"]\)/i;
const FORBIDDEN_CALL =
  /clinicallyUsed\s*:\s*true|clinically_used\s*:\s*true|clinically_used\s*=\s*true|evaluateRule[1-9]|AnalyzeComplete|analyzeComplete\s*\(|ConfirmPrescription|confirmPrescription|fetch\s*\(|axios|Date\.now\s*\(|Math\.random\s*\(|randomUUID|INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM|019_|\.createApp|apps\/api|apps\/worker|apps\/web/i;
const FORBIDDEN_FIELDS =
  /\b(?:chiefComplaintText|chief_complaint_text|assertedText|asserted_text|ocrText|ocr_text|originalSourceSpan|storagePath|objectKey|object_key|medicineCode|medicineId|diseaseId|diseaseLabel|potency|dosage|formula)\b/;

function scan(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return ['missing'];
  const text = fs.readFileSync(file, 'utf8');
  const hits = [];
  if (FORBIDDEN_IMPORT.test(text) || FORBIDDEN_CALL.test(text)) hits.push('coupling');
  if (FORBIDDEN_FIELDS.test(text)) hits.push('phi-or-selector');
  if (
    !/SOURCE_LINKED_FACT_RULES_SHADOW_INPUT_ONLY/.test(text) &&
    rel.endsWith('rulesShadowInputTypes.ts')
  ) {
    hits.push('authority');
  }
  if (rel.endsWith('rulesShadowInputService.ts')) {
    if (!/buildRulesShadowInput/.test(text)) hits.push('builder');
    if (!/CLOSED_INPUT_KEYS = new Set\(\['consultationId'\]\)/.test(text))
      hits.push('closed-input');
    if (!/listActiveByConsultation/.test(text)) hits.push('e1-only');
    if (
      !/acquireRulesShadowInputLockPlan|acquireCanonicalSourceLocks/.test(text)
    ) {
      hits.push('lock-order');
    }
    if (/INSERT INTO|UPDATE |DELETE FROM/i.test(text)) hits.push('writes');
  }
  if (rel.endsWith('rulesShadowInputCanonical.ts') && !/sha256/.test(text)) {
    hits.push('fingerprint');
  }
  return hits;
}

const failed = SCOPED.flatMap((rel) => {
  const hits = scan(rel);
  return hits.length ? [`${rel} (${hits.join(', ')})`] : [];
});
if (failed.length) {
  console.error('F3D-2E2 rules-shadow-input firewall failed:', failed.join('; '));
  process.exit(1);
}

// Reachability: no apps/api|worker|web import of buildRulesShadowInput
const reachRoots = [
  'apps/api',
  'apps/worker',
  'apps/web',
  'packages/rule1',
  'packages/rule2',
  'packages/rule3',
  'packages/rule6',
  'packages/rule7',
  'packages/rule8',
  'packages/rule9',
];
for (const rel of reachRoots) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) continue;
  const stack = [abs];
  while (stack.length) {
    const cur = stack.pop();
    const st = fs.statSync(cur);
    if (st.isDirectory()) {
      for (const name of fs.readdirSync(cur)) {
        if (name === 'node_modules' || name === 'dist') continue;
        stack.push(path.join(cur, name));
      }
      continue;
    }
    if (!/\.(ts|tsx|js|mjs|py)$/.test(cur)) continue;
    const text = fs.readFileSync(cur, 'utf8');
    if (/buildRulesShadowInput|RulesShadowInputService|rulesShadowInputService/.test(text)) {
      console.error('F3D-2E2 reachability firewall failed:', path.relative(root, cur));
      process.exit(1);
    }
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ehas2-f3d2e2-fw-'));
try {
  const probe = path.join(tmp, 'probe.ts');
  fs.writeFileSync(
    probe,
    `import { evaluateRule1 } from '@ehas2/rule1';\nclinically_used: true\nAnalyzeComplete()\nConfirmPrescription\nDate.now()\nINSERT INTO x\nchiefComplaintText\n`,
    'utf8',
  );
  const text = fs.readFileSync(probe, 'utf8');
  if (!FORBIDDEN_IMPORT.test(text) || !FORBIDDEN_CALL.test(text) || !FORBIDDEN_FIELDS.test(text)) {
    console.error('F3D-2E2 negative probe failed');
    process.exit(1);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('F3D-2E2 rules-shadow-input firewall OK');
