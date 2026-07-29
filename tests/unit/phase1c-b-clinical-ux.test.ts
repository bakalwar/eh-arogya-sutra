import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertNoRealPatientFixtures,
  filterSyntheticPatients,
  SYNTHETIC_DATA_BANNER,
  SYNTHETIC_PATIENTS,
} from '../../apps/web/src/data/syntheticPatients.ts';
import { createEmptyCaseDraft, CASE_STEPS } from '../../apps/web/src/lib/case/types.ts';
import {
  firstErrorField,
  validateCaseStep,
  validatePatientDraft,
  validateVitalsDraft,
  validateSymptoms,
} from '../../apps/web/src/lib/case/validation.ts';
import {
  EMERGENCY_WARNING_COPY,
  hasActiveRedFlags,
} from '../../apps/web/src/lib/case/emergency.ts';
import {
  clearLocalReports,
  reportUploadConnected,
  validateReportFile,
  type LocalReportFile,
} from '../../apps/web/src/lib/case/reportFiles.ts';
import {
  doctorNavExcludesSuperAdmin,
  DOCTOR_NAV_ITEMS,
} from '../../apps/web/src/config/navigation.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Phase 1C-B patients', () => {
  it('labels synthetic data and excludes real-patient fixtures', () => {
    expect(SYNTHETIC_DATA_BANNER).toMatch(/DEMO PATIENT RECORD/);
    const blob = JSON.stringify(SYNTHETIC_PATIENTS);
    expect(assertNoRealPatientFixtures(blob)).toBe(true);
    expect(blob.toLowerCase()).not.toMatch(/irfaz/);
  });

  it('supports empty search/filter and sorted list states', () => {
    expect(filterSyntheticPatients({ query: 'zzz-none', status: 'all', sort: 'name' })).toEqual([]);
    expect(
      filterSyntheticPatients({ query: '', status: 'follow-up', sort: 'name' }).length,
    ).toBeGreaterThan(0);
    const byName = filterSyntheticPatients({ query: '', status: 'all', sort: 'name' });
    expect(byName[0]?.displayName <= (byName[1]?.displayName ?? '')).toBe(true);
  });
});

describe('Phase 1C-B validation', () => {
  it('validates patient and vitals ranges including BP', () => {
    expect(validatePatientDraft(createEmptyCaseDraft().patient).existingPatientId).toBeTruthy();
    const vitals = createEmptyCaseDraft().vitals;
    expect(validateVitalsDraft(vitals).systolicBp).toBeTruthy();
    expect(
      validateVitalsDraft({
        ...vitals,
        systolicBp: '120',
        diastolicBp: '80',
        pulse: '72',
      }),
    ).toEqual({});
    expect(
      validateVitalsDraft({
        ...vitals,
        systolicBp: '-1',
        diastolicBp: '80',
        pulse: '72',
      }).systolicBp,
    ).toMatch(/Negative|60/);
  });

  it('rejects empty/whitespace symptoms and exposes first error field', () => {
    const errors = validateSymptoms({
      chiefComplaint: '   ',
      completeSymptoms: '   ',
      duration: '',
      phase: '',
      severity: '11',
      suspectedDiagnosis: '',
    });
    expect(errors.chiefComplaint).toBeTruthy();
    expect(errors.completeSymptoms).toBeTruthy();
    expect(firstErrorField(errors)).toBeTruthy();
  });

  it('requires emergency acknowledgement when red flags selected', () => {
    expect(hasActiveRedFlags(['chest-pain'])).toBe(true);
    const draft = createEmptyCaseDraft();
    draft.clinical.redFlags = ['breathing'];
    draft.clinical.followUpType = 'new';
    const errors = validateCaseStep('clinical', draft);
    expect(errors.emergencyAcknowledged).toBeTruthy();
    expect(EMERGENCY_WARNING_COPY).toMatch(/not a diagnosis/i);
  });
});

describe('Phase 1C-B reports and privacy', () => {
  it('validates type/size/duplicates and never claims upload connected', () => {
    expect(reportUploadConnected()).toBe(false);
    const ok = validateReportFile(
      { name: 'lab.png', type: 'image/png', size: 1024 },
      [],
      'blood-lab',
    );
    expect(ok.ok).toBe(true);
    const dup = validateReportFile(
      { name: 'lab.png', type: 'image/png', size: 1024 },
      ok.ok ? [ok.meta] : [],
      'blood-lab',
    );
    expect(dup.ok).toBe(false);
    expect(
      validateReportFile({ name: 'x.exe', type: 'application/octet-stream', size: 10 }, [], 'other')
        .ok,
    ).toBe(false);
    expect(
      validateReportFile(
        { name: 'big.png', type: 'image/png', size: 11 * 1024 * 1024 },
        [],
        'other',
      ).ok,
    ).toBe(false);
  });

  it('clears object URLs helper and avoids localStorage patient persistence in source', () => {
    const reports: LocalReportFile[] = [];
    clearLocalReports(reports);
    const provider = fs.readFileSync(
      path.join(root, 'apps/web/src/context/CaseDraftProvider.tsx'),
      'utf8',
    );
    expect(provider).not.toMatch(/localStorage/);
    expect(provider).toMatch(/beforeunload/);
    const uploader = fs.readFileSync(
      path.join(root, 'apps/web/src/components/cases/ReportUploader.tsx'),
      'utf8',
    );
    expect(uploader).not.toMatch(/fetch\(|XMLHttpRequest|axios/);
  });
});

describe('Phase 1C-B case flow and boundaries', () => {
  it('defines six case steps and review without medicine fields', () => {
    expect(CASE_STEPS.map((s) => s.id)).toEqual([
      'patient',
      'vitals',
      'symptoms',
      'clinical',
      'reports',
      'review',
    ]);
    const types = fs.readFileSync(path.join(root, 'apps/web/src/lib/case/types.ts'), 'utf8');
    expect(types).not.toMatch(/potency|electricity|tablet formula|external formula/i);
    const clinical = fs.readFileSync(
      path.join(root, 'apps/web/src/components/cases/ClinicalContextStep.tsx'),
      'utf8',
    );
    expect(clinical).toMatch(/no medicine defaults/i);
  });

  it('analysis screen produces no prescription', () => {
    const analysis = fs.readFileSync(
      path.join(root, 'apps/web/src/components/cases/AnalysisNotConnected.tsx'),
      'utf8',
    );
    expect(analysis).toMatch(/No prescription generated/);
    expect(analysis).not.toMatch(/Engine Online|prescription ready/i);
  });

  it('keeps Super Admin hidden and wires patient/case routes in nav', () => {
    expect(doctorNavExcludesSuperAdmin()).toBe(true);
    expect(DOCTOR_NAV_ITEMS.some((i) => i.href === '/patients')).toBe(true);
    expect(DOCTOR_NAV_ITEMS.some((i) => i.href === '/cases/new')).toBe(true);
    expect(DOCTOR_NAV_ITEMS.some((i) => i.href.includes('/ops'))).toBe(false);
  });
});
