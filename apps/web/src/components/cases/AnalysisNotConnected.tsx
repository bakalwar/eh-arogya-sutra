'use client';

import Link from 'next/link';
import { Surface } from '../ui/Primitives';
import { Button } from '../ui/Button';

export function AnalysisNotConnected({ caseId }: { caseId: string }) {
  return (
    <div className="ehas2-stack">
      <Surface>
        <h2>Analysis pending — not connected</h2>
        <p>
          Case preview ID: <code>{caseId}</code>
        </p>
        <ul className="ehas2-status-list">
          <li>Case input validated (frontend only)</li>
          <li>Clinical engine not connected</li>
          <li>Disease data not installed</li>
          <li>Medicine data not installed</li>
          <li>Report analysis not connected</li>
          <li>No prescription generated</li>
        </ul>
        <p role="status">This screen does not simulate successful clinical analysis.</p>
      </Surface>
      <div className="ehas2-action-row">
        <Link className="ehas2-btn ehas2-btn--secondary" href="/cases/new/review">
          Return to review
        </Link>
        <Button type="button" variant="ghost" disabled>
          Save (unavailable)
        </Button>
        <Link className="ehas2-btn ehas2-btn--ghost" href="/dashboard">
          Support / dashboard
        </Link>
      </div>
    </div>
  );
}
