import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SYNTHETIC_CLINICAL_RESULTS,
  SYNTHETIC_PRESCRIPTION_HISTORY,
  assertNoForbiddenClinicalDefaults,
} from '../../apps/web/src/data/syntheticClinicalResults.ts';
import { DEMO_CLINICAL_BANNER } from '../../apps/web/src/lib/clinicalDisplay/types.ts';
import { SUMMARY_ORDER } from '../../apps/web/src/components/clinical/SummaryAndReview.tsx';
import {
  doctorNavExcludesSuperAdmin,
  DOCTOR_NAV_ITEMS,
} from '../../apps/web/src/config/navigation.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Phase 1C-C clinical display fixtures', () => {
  it('supports 3/4/5 oral mixture layouts without inventing formulas', () => {
    expect(SYNTHETIC_CLINICAL_RESULTS.threeMixture.oralMixtures).toHaveLength(3);
    expect(SYNTHETIC_CLINICAL_RESULTS.fourMixture.oralMixtures).toHaveLength(4);
    expect(SYNTHETIC_CLINICAL_RESULTS.fiveMixture.oralMixtures).toHaveLength(5);
    expect(DEMO_CLINICAL_BANNER).toMatch(/NOT A GENERATED PRESCRIPTION/);
  });

  it('preserves unresolved electricity and empty Tablet B slots', () => {
    const unresolved = SYNTHETIC_CLINICAL_RESULTS.fourMixture.oralMixtures.find(
      (m) => m.electricity.state === 'unresolved',
    );
    expect(unresolved?.electricity.state).toBe('unresolved');
    const emptySlot = SYNTHETIC_CLINICAL_RESULTS.fourMixture.tabletSectionB.find(
      (s) => s.slotId === 'after-food',
    );
    expect(emptySlot?.status).toBe('not-generated');
    if (emptySlot?.status === 'not-generated') {
      expect(emptySlot.reason).toBe('NO_CLINICALLY_JUSTIFIED_CANDIDATE');
    }
  });

  it('keeps Tablet A as fixture metadata and never defaults WE', () => {
    expect(
      SYNTHETIC_CLINICAL_RESULTS.threeMixture.tabletSectionA.demoIndependentSelectionLabel,
    ).toMatch(/DEMO INDEPENDENT-SELECTION/);
    const blob = JSON.stringify(SYNTHETIC_CLINICAL_RESULTS);
    expect(blob).not.toMatch(/"WE"/);
    expect(assertNoForbiddenClinicalDefaults(blob)).toBe(true);
    expect(blob.toLowerCase()).not.toMatch(/irfaz/);
  });

  it('supports zero-to-four external layouts', () => {
    expect(SYNTHETIC_CLINICAL_RESULTS.threeMixture.externalApplications).toHaveLength(0);
    expect(SYNTHETIC_CLINICAL_RESULTS.fourMixture.externalApplications).toHaveLength(2);
    expect(SYNTHETIC_CLINICAL_RESULTS.fiveMixture.externalApplications).toHaveLength(4);
  });

  it('defines summary section order and Stage 2–6 fixtures', () => {
    expect(SUMMARY_ORDER[0]).toBe('Patient and Case Overview');
    expect(SUMMARY_ORDER.at(-1)).toBe('Engine/Data Version and Evidence');
    expect(SYNTHETIC_CLINICAL_RESULTS.threeMixture.stages.map((s) => s.stage)).toEqual([
      2, 3, 4, 5, 6,
    ]);
    expect(SYNTHETIC_CLINICAL_RESULTS.notGenerated.stages).toEqual([]);
  });
});

describe('Phase 1C-C history print and boundaries', () => {
  it('history uses synthetic DEMO DATA only', () => {
    expect(SYNTHETIC_PRESCRIPTION_HISTORY.every((i) => i.demoLabel === 'DEMO DATA')).toBe(true);
  });

  it('print layout hides navigation and shows demo watermark + PDF not connected', () => {
    const printCss = fs.readFileSync(
      path.join(root, 'apps/web/src/styles/clinical-results.css'),
      'utf8',
    );
    expect(printCss).toMatch(/@media print/);
    expect(printCss).toMatch(/ehas2-no-print/);
    expect(printCss).toMatch(/ehas2-bottom-nav/);
    const printComp = fs.readFileSync(
      path.join(root, 'apps/web/src/components/clinical/PrintPrescriptionLayout.tsx'),
      'utf8',
    );
    expect(printComp).toMatch(/DEMO/);
    expect(printComp).toMatch(/PDF generation service is not connected/);
    expect(printComp).toMatch(/window\.print/);
  });

  it('clinician review UI does not persist and components avoid Phase F / old API', () => {
    const review = fs.readFileSync(
      path.join(root, 'apps/web/src/components/clinical/SummaryAndReview.tsx'),
      'utf8',
    );
    expect(review).toMatch(/Review service not connected/);
    expect(review).not.toMatch(/localStorage|fetch\(|axios/);
    const clinicalSrc = walk(path.join(root, 'apps/web/src/components/clinical'))
      .concat(walk(path.join(root, 'apps/web/src/data')))
      .map((f) => fs.readFileSync(f, 'utf8'))
      .join('\n');
    expect(clinicalSrc).not.toMatch(/from ['"].*PhaseF|import\(.*phase-f|asciiParser/i);
    expect(clinicalSrc).not.toMatch(/Desktop[/\\].*[Aa]rogya.*[Aa]pp/);
    expect(clinicalSrc).not.toMatch(/localhost:3000|localhost:5000\/api/);
  });

  it('keeps Super Admin hidden and wires prescriptions route', () => {
    expect(doctorNavExcludesSuperAdmin()).toBe(true);
    expect(DOCTOR_NAV_ITEMS.some((i) => i.href === '/prescriptions')).toBe(true);
    expect(DOCTOR_NAV_ITEMS.some((i) => i.href.includes('/ops'))).toBe(false);
  });
});

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
