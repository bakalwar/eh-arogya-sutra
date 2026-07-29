'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { SyntheticConsultation } from '../../data/syntheticPatients';
import { EmptyState, Surface } from '../ui/Primitives';

export function ConsultationTimeline({
  consultations,
}: {
  consultations: readonly SyntheticConsultation[];
}) {
  const [status, setStatus] = useState<'all' | SyntheticConsultation['status']>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = useMemo(() => {
    const filtered =
      status === 'all' ? consultations : consultations.filter((c) => c.status === status);
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  }, [consultations, status]);

  if (consultations.length === 0) {
    return (
      <EmptyState
        title="No consultation history"
        body="This synthetic patient has no history placeholders yet."
      />
    );
  }

  return (
    <div className="ehas2-stack">
      <div className="ehas2-filter-row">
        <div className="ehas2-field">
          <label htmlFor="history-status">Filter by status</label>
          <select
            id="history-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending-review">Pending review</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="ehas2-field">
          <label htmlFor="history-date">Filter by date</label>
          <input id="history-date" type="date" disabled title="Date filter foundation" />
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState title="No matching history" body="Adjust filters to see synthetic entries." />
      ) : (
        <ul className="ehas2-timeline">
          {list.map((c) => {
            const open = expanded === c.id;
            return (
              <li key={c.id}>
                <Surface>
                  <button
                    type="button"
                    className="ehas2-timeline__toggle"
                    aria-expanded={open}
                    onClick={() => setExpanded(open ? null : c.id)}
                  >
                    <strong>{c.date}</strong> · {c.status} · {c.chiefComplaintSummary}
                  </button>
                  {open ? (
                    <div className="ehas2-timeline__body">
                      <p>Clinician review: {c.clinicianReviewStatus}</p>
                      <p>
                        Prescription status: {c.prescriptionStatus} —{' '}
                        <Link href="/dashboard/coming/prescriptions">Phase 1C-C</Link>
                      </p>
                      <p>Report/document placeholders: {c.reportPlaceholderCount}</p>
                    </div>
                  ) : null}
                </Surface>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
