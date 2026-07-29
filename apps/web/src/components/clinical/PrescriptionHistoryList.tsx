'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type {
  ClinicianReviewStatus,
  PrescriptionHistoryItem,
} from '../../lib/clinicalDisplay/types';
import { EmptyState, PageHeader, Surface } from '../ui/Primitives';
import { DemoClinicalBanner } from './ClinicalPrimitives';
import { PrescriptionStatusBadge } from './SummaryAndReview';

export function PrescriptionHistoryList({ items }: { items: readonly PrescriptionHistoryItem[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | ClinicianReviewStatus>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.filter((item) => {
      if (status !== 'all' && item.status !== status) return false;
      if (!q) return true;
      return (
        item.syntheticPatientName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.casePreviewId.toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) =>
      sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
    );
    return list;
  }, [items, query, status, sort]);

  return (
    <div className="ehas2-stack">
      <DemoClinicalBanner message="DEMO DATA — prescription history preview" />
      <PageHeader
        title="Prescriptions"
        description="Synthetic history only. No persistence or clinical engine."
      />
      <Surface>
        <div className="ehas2-toolbar">
          <div className="ehas2-field">
            <label htmlFor="rx-search">Search</label>
            <input
              id="rx-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="ehas2-filter-row">
            <div className="ehas2-field">
              <label htmlFor="rx-status">Status</label>
              <select
                id="rx-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="all">All</option>
                <option value="pending-review">Pending Review</option>
                <option value="accepted">Accepted</option>
                <option value="modified">Modified</option>
                <option value="rejected">Rejected</option>
                <option value="needs-clarification">Needs Clarification</option>
              </select>
            </div>
            <div className="ehas2-field">
              <label htmlFor="rx-sort">Sort</label>
              <select
                id="rx-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No prescriptions" body="No synthetic history matches these filters." />
        ) : (
          <ul className="ehas2-card-list">
            {filtered.map((item) => (
              <li key={item.id}>
                <article className="ehas2-patient-card">
                  <h3>
                    <Link href={`/prescriptions/${item.id}`}>{item.syntheticPatientName}</Link>
                  </h3>
                  <p>
                    {item.demoLabel} · {item.date} · {item.versionLabel} · {item.mixtureCount}{' '}
                    mixtures
                  </p>
                  <p>
                    Review: <PrescriptionStatusBadge status={item.status} />
                  </p>
                  <div className="ehas2-action-row">
                    <Link
                      className="ehas2-btn ehas2-btn--secondary"
                      href={`/cases/${item.casePreviewId}/prescription`}
                    >
                      Open prescription
                    </Link>
                    <button type="button" className="ehas2-btn ehas2-btn--ghost" disabled>
                      Compare versions (placeholder)
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}
