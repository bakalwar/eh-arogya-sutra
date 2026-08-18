'use client';

import { useState } from 'react';
import type { PreviewCandidateFixture } from '../../lib/preview/candidateReviewFixtures';
import { CandidateReviewCard } from './CandidateSourceLocatorView';

const ACTIONS = [
  'ACCEPT_AS_SOURCE_TEXT',
  'CORRECT_SOURCE_TEXT',
  'REJECT_SOURCE_TEXT',
  'MARK_UNRESOLVED',
] as const;

type LocalReview = {
  id: string;
  candidateId: string;
  action: (typeof ACTIONS)[number];
  originalRawText: string;
  correctedRawText: string | null;
  decisionStatus: 'ACTIVE' | 'SUPERSEDED';
};

export function CandidateReviewLocalBoard({
  fixtures,
}: {
  fixtures: readonly PreviewCandidateFixture[];
}) {
  const [history, setHistory] = useState<LocalReview[]>([]);

  function append(fixture: PreviewCandidateFixture, action: (typeof ACTIONS)[number]) {
    setHistory((prev) => {
      const superseded = prev.map((row) =>
        row.candidateId === fixture.id && row.decisionStatus === 'ACTIVE'
          ? { ...row, decisionStatus: 'SUPERSEDED' as const }
          : row,
      );
      return [
        ...superseded,
        {
          id: `local-${superseded.length + 1}`,
          candidateId: fixture.id,
          action,
          originalRawText: fixture.rawText,
          correctedRawText:
            action === 'CORRECT_SOURCE_TEXT' ? `${fixture.rawText} (preview correction)` : null,
          decisionStatus: 'ACTIVE',
        },
      ];
    });
  }

  return (
    <div className="ehas2-candidate-review-board">
      {fixtures.map((fixture) => (
        <section key={fixture.id}>
          <CandidateReviewCard fixture={fixture} />
          <div className="ehas2-candidate-actions">
            {ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                className="ehas2-button"
                onClick={() => append(fixture, action)}
              >
                {action}
              </button>
            ))}
          </div>
        </section>
      ))}
      <section aria-labelledby="local-history">
        <h2 id="local-history">Local append-only preview history</h2>
        <p className="ehas2-field__hint">
          Preview-only. No API, no PostgreSQL, no production upload. ACCEPT_AS_SOURCE_TEXT means
          transcription of written source only.
        </p>
        <ol data-ehas2-review-history="true">
          {history.map((row) => (
            <li key={row.id} data-decision-status={row.decisionStatus} data-action={row.action}>
              <code>{row.action}</code> · original {row.originalRawText}
              {row.correctedRawText ? ` · corrected ${row.correctedRawText}` : ''} ·{' '}
              {row.decisionStatus}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
