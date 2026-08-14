import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NINE_RULE_DEFINITIONS,
  ORCHESTRATION_STATUS,
  PRESCRIPTION_ENGINE_STATUS,
  VALIDATION_ORCHESTRATION_STATUS,
  allNineRuleInterfaceResults,
} from '../../packages/clinical-contracts/src/index.ts';
import { CLINICAL_VALIDATION_DASHBOARD } from '../../apps/web/src/lib/clinical-validation/dashboard.ts';
import { PREVIEW_CATALOG } from '../../apps/web/src/lib/preview/previewCatalog.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Phase 5C nine-rule orchestration contracts', () => {
  it('preserves exact canonical rule names and order 1–9', () => {
    expect(NINE_RULE_DEFINITIONS.map((r) => r.ruleName)).toEqual([
      'Temperament Engine',
      'Polarity Engine',
      'Organ / System Affinity',
      'Potency',
      'Monitoring, Follow-up & Post-Release Safety Surveillance',
      'Multi-Disease / Organ-System Triad',
      'External Use Routes',
      'Disease-level Prakruti Inference',
      'Master Pipeline',
    ]);
  });

  it('Rule 1/8/9 shadow READY_FOR_VALIDATION; production orchestration NOT_CONNECTED', () => {
    const r1 = allNineRuleInterfaceResults().find((r) => r.ruleNumber === 1);
    expect(r1?.status).toBe('READY_FOR_VALIDATION');
    expect(r1?.affectsClinicalSelection).toBe(false);
    expect(r1?.ruleName).toBe('Temperament Engine');
    const r8 = allNineRuleInterfaceResults().find((r) => r.ruleNumber === 8);
    // nineRules metadata only: synthetic shadow package exists for technical validation.
    expect(r8?.status).toBe('READY_FOR_VALIDATION');
    expect(r8?.affectsClinicalSelection).toBe(false);
    const r9 = allNineRuleInterfaceResults().find((r) => r.ruleNumber === 9);
    expect(r9?.status).toBe('READY_FOR_VALIDATION');
    expect(r9?.affectsClinicalSelection).toBe(false);
    expect(ORCHESTRATION_STATUS).toBe('NOT_CONNECTED');
    expect(VALIDATION_ORCHESTRATION_STATUS).toBe('READY_FOR_VALIDATION');
    expect(PRESCRIPTION_ENGINE_STATUS).toBe('PRESCRIPTION_ENGINE_NOT_CONNECTED');
  });

  it('preview clinical-validation dashboard is static and non-prescribing', () => {
    expect(CLINICAL_VALIDATION_DASHBOARD.clinicalReadiness).toBe(false);
    expect(CLINICAL_VALIDATION_DASHBOARD.prescriptionEngine).toBe('NOT_CONNECTED');
    expect(CLINICAL_VALIDATION_DASHBOARD.medicineOutput).toBe(0);
    expect(CLINICAL_VALIDATION_DASHBOARD.realPatientData).toBe('NO');
    expect(CLINICAL_VALIDATION_DASHBOARD.rule8Status).toBe('OWNER_DECISION_REQUIRED');
    expect(CLINICAL_VALIDATION_DASHBOARD.rule8Implementation).toBe('NOT_IMPLEMENTED');
    expect(CLINICAL_VALIDATION_DASHBOARD.prescriptionEngine).toBe('NOT_CONNECTED');
    expect(CLINICAL_VALIDATION_DASHBOARD.phase5dReady).toBe(false);
    expect(CLINICAL_VALIDATION_DASHBOARD.goldenCases.total).toBe(26);
    expect(CLINICAL_VALIDATION_DASHBOARD.databaseWritesFromPreview).toBe(0);
    const item = PREVIEW_CATALOG.find((i) => i.id === 'clinical-validation');
    expect(item?.href).toBe('/preview/clinical-validation');
    expect(
      fs.existsSync(path.join(root, 'apps/web/src/app/preview/clinical-validation/page.tsx')),
    ).toBe(true);
  });

  it('golden fixtures are labelled SYNTHETIC and number 26', () => {
    const cases = JSON.parse(
      fs.readFileSync(path.join(root, 'fixtures/synthetic/clinical/golden/cases.json'), 'utf8'),
    ) as Array<{ label: string }>;
    expect(cases).toHaveLength(26);
    expect(cases.every((c) => c.label === 'SYNTHETIC')).toBe(true);
  });

  it('required Phase 5C clinical docs exist', () => {
    const docs = [
      'docs/clinical/nine-rule-orchestration.md',
      'docs/clinical/rule-by-rule-implementation-status.md',
      'docs/clinical/disease-retrieval-validation.md',
      'docs/clinical/clinical-interpretation-validation.md',
      'docs/clinical/rule-8-decision.md',
      'docs/clinical/golden-case-catalog.md',
      'docs/clinical/golden-comparison-results.md',
      'docs/clinical/determinism-and-fingerprints.md',
      'docs/clinical/prescription-boundary.md',
      'docs/architecture/clinical-engine-scaling.md',
      'docs/phase-reports/PHASE_5C_NINE_RULE_VALIDATION_REPORT.md',
      'docs/phase-reports/PHASE_5C_FINAL_MANIFEST.md',
      'docs/clinical/rule-8-readiness-decision.md',
      'docs/clinical/prescription-readiness-matrix.md',
      'docs/clinical/mixture-evidence-safety-policy.md',
      'docs/clinical/phase5c-golden-assertion-review.md',
      'docs/phase-reports/PHASE_5C_G_CLOSURE_REPORT.md',
      'docs/phase-reports/PHASE_5C_G_FINAL_MANIFEST.md',
    ];
    for (const d of docs) {
      expect(fs.existsSync(path.join(root, d)), d).toBe(true);
    }
  });
});
