import Link from 'next/link';
import type { ClinicalResultDisplay } from '../../lib/clinicalDisplay/types';
import { PageHeader, Surface } from '../ui/Primitives';
import {
  ClinicalResultHeader,
  EvidencePanel,
  PolarityCard,
  SafetyWarning,
  SystemBadgeGroup,
} from './ClinicalPrimitives';
import {
  DailySchedule,
  ExternalApplicationsSection,
  OralMixturesSection,
  TabletSectionA,
  TabletSectionB,
} from './PrescriptionSections';
import { ClinicianReviewPanel, PrescriptionStatusBadge } from './SummaryAndReview';

export function PrescriptionView({
  result,
  showReview = true,
}: {
  result: ClinicalResultDisplay;
  showReview?: boolean;
}) {
  return (
    <div className="ehas2-stack ehas2-prescription">
      <ClinicalResultHeader result={result} />
      <PageHeader
        title="Prescription"
        description="Structured synthetic clinical layout only — no engine selection."
      />
      <Surface>
        <p>
          Prescription status: <PrescriptionStatusBadge status={result.prescriptionStatus} />
        </p>
        <SystemBadgeGroup systems={result.affectedSystems} primary={result.primarySystem} />
        <PolarityCard polarity={result.polarity} />
      </Surface>
      <section aria-label="Oral mixtures" id="oral-mixtures">
        <h2>Oral mixtures</h2>
        <OralMixturesSection mixtures={result.oralMixtures} />
      </section>
      <section aria-label="Tablet Section A" id="tablet-section-a">
        <h2>Tablet Section A</h2>
        <TabletSectionA section={result.tabletSectionA} />
      </section>
      <section aria-label="Tablet Section B" id="tablet-section-b">
        <h2>Tablet Section B</h2>
        <TabletSectionB slots={result.tabletSectionB} />
      </section>
      <section aria-label="External applications" id="external-applications">
        <h2>External applications</h2>
        <ExternalApplicationsSection items={result.externalApplications} />
      </section>
      <DailySchedule result={result} />
      <SafetyWarning warnings={result.safetyWarnings} />
      <EvidencePanel notes={result.evidenceNotes} />
      {showReview ? <ClinicianReviewPanel status={result.clinicianReviewStatus} /> : null}
      <div className="ehas2-action-row ehas2-no-print">
        <Link
          className="ehas2-btn ehas2-btn--secondary"
          href={`/cases/${result.caseContext.casePreviewId}/summary`}
        >
          Clinical summary
        </Link>
        <Link
          className="ehas2-btn ehas2-btn--secondary"
          href={`/cases/${result.caseContext.casePreviewId}/review`}
        >
          Clinician review
        </Link>
        <Link
          className="ehas2-btn ehas2-btn--primary"
          href={`/print/${result.caseContext.casePreviewId}`}
        >
          Print preview
        </Link>
      </div>
    </div>
  );
}
