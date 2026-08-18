import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocalPreviewAllowed } from '../../../lib/preview/previewGate';
import { SYNTHETIC_CANDIDATE_REVIEW_FIXTURES } from '../../../lib/preview/candidateReviewFixtures';
import { PageHeader, Surface } from '../../../components/ui/Primitives';
import { CandidateReviewLocalBoard } from '../../../components/preview/CandidateReviewLocalBoard';

export const metadata: Metadata = {
  title: 'Source-linked candidate review · Preview · EHAS2',
  description: 'F3C synthetic source-text review — not clinical authority.',
  robots: { index: false, follow: false },
};

export default function CandidateReviewPreviewPage() {
  if (!isLocalPreviewAllowed(process.env)) {
    notFound();
  }

  return (
    <main id="main-content" className="ehas2-preview-status" tabIndex={-1}>
      <PageHeader
        title="Source-linked candidate review"
        description="F3C non-production preview. OCR remains UNVERIFIED and NOT_AUTHORITATIVE. Transcription review only."
      />
      <Surface>
        <p className="ehas2-field__hint" data-ehas2-f3c-disclaimer="true">
          SYNTHETIC DEMO — NOT CLINICAL OUTPUT — NOT SAVED. ACCEPT_AS_SOURCE_TEXT does not confirm
          diagnosis, clinical findings, medicine, severity, or treatment.
        </p>
        <ul className="ehas2-preview-truths">
          <li>No production upload · no object-store keys · no original filenames</li>
          <li>No translation · no Rules 1–9 · no clinical analysis · no Rx</li>
          <li>Patient photos remain non-diagnostic · diagnostic images are not interpreted</li>
        </ul>
        <CandidateReviewLocalBoard fixtures={SYNTHETIC_CANDIDATE_REVIEW_FIXTURES} />
      </Surface>
    </main>
  );
}
