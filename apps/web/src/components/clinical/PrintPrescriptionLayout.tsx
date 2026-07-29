'use client';

import { useEffect, useState } from 'react';
import type { ClinicalResultDisplay } from '../../lib/clinicalDisplay/types';
import { DEMO_CLINICAL_BANNER } from '../../lib/clinicalDisplay/types';
import {
  DailySchedule,
  ExternalApplicationsSection,
  OralMixturesSection,
  TabletSectionA,
  TabletSectionB,
} from './PrescriptionSections';
import { SafetyWarning } from './ClinicalPrimitives';

export function PrintPrescriptionLayout({ result }: { result: ClinicalResultDisplay }) {
  const [printedAt, setPrintedAt] = useState('Loading print timestamp…');
  useEffect(() => {
    setPrintedAt(new Date().toISOString());
  }, []);
  return (
    <div className="ehas2-print-root">
      <div className="ehas2-print-watermark" aria-hidden="true">
        DEMO
      </div>
      <header className="ehas2-print-header">
        <p>E.H. AROGYA SUTRA 2 · Clinic brand placeholder</p>
        <p role="status">{DEMO_CLINICAL_BANNER}</p>
        <p>
          Printed: {printedAt} · Case {result.caseContext.casePreviewId}
        </p>
      </header>
      <section>
        <h1>Prescription print preview</h1>
        <p>
          {result.patientContext.displayName} · {result.patientContext.ageYears}y ·{' '}
          {result.patientContext.gender}
        </p>
        <p>
          Phase {result.caseContext.phase} · Severity {result.caseContext.severity} · Review{' '}
          {result.clinicianReviewStatus}
        </p>
      </section>
      <section className="ehas2-print-break">
        <h2>Oral formulas</h2>
        <OralMixturesSection mixtures={result.oralMixtures} />
      </section>
      <section className="ehas2-print-break">
        <h2>Tablet Section A</h2>
        <TabletSectionA section={result.tabletSectionA} />
      </section>
      <section className="ehas2-print-break">
        <h2>Tablet Section B</h2>
        <TabletSectionB slots={result.tabletSectionB} />
      </section>
      <section className="ehas2-print-break">
        <h2>External applications</h2>
        <ExternalApplicationsSection items={result.externalApplications} />
      </section>
      <section className="ehas2-print-break">
        <DailySchedule result={result} />
      </section>
      <SafetyWarning warnings={result.safetyWarnings} />
      <footer className="ehas2-print-footer">
        <p>
          Engine {result.engineVersion} · Rules {result.ruleVersion} · Disease{' '}
          {result.diseaseDataVersion} · Medicine {result.medicineDataVersion}
        </p>
        <p>PDF generation service is not connected. Browser print CSS only.</p>
        <p className="ehas2-print-page">Page numbers via browser print dialog where supported.</p>
      </footer>
      <div className="ehas2-no-print ehas2-stack">
        <p role="status">PDF generation service is not connected.</p>
        <button
          type="button"
          className="ehas2-btn ehas2-btn--primary"
          onClick={() => window.print()}
        >
          Open browser print preview
        </button>
      </div>
    </div>
  );
}
