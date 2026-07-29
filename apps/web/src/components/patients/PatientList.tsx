'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  SYNTHETIC_DATA_BANNER,
  filterSyntheticPatients,
  type SyntheticPatientStatus,
} from '../../data/syntheticPatients';
import { Button } from '../ui/Button';
import { EmptyState, PageHeader, Skeleton, Surface } from '../ui/Primitives';
import { PreviewModeBanner } from '../entry/PreviewModeBanner';
import { PatientCard } from './PatientCard';
import { PatientFilters } from './PatientFilters';
import { PatientSearch } from './PatientSearch';
import { PatientTable } from './PatientTable';

export function PatientList() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | SyntheticPatientStatus>('all');
  const [sort, setSort] = useState<'name' | 'recent' | 'age'>('recent');
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [page] = useState(1);

  const patients = useMemo(
    () => filterSyntheticPatients({ query, status, sort }),
    [query, status, sort],
  );

  return (
    <div className="ehas2-stack">
      <PreviewModeBanner message={SYNTHETIC_DATA_BANNER} />
      <PageHeader
        title="Patients"
        description="Synthetic design-preview records only. No patient database is connected."
      />
      <div className="ehas2-action-row">
        <Link className="ehas2-btn ehas2-btn--primary" href="/cases/new">
          New Case
        </Link>
        <Button type="button" variant="secondary" disabled>
          Add Patient (preview soon)
        </Button>
      </div>
      <Surface>
        <div className="ehas2-toolbar">
          <PatientSearch value={query} onChange={setQuery} />
          <PatientFilters status={status} sort={sort} onStatus={setStatus} onSort={setSort} />
        </div>
        {loading ? (
          <div aria-busy="true" aria-label="Loading patients">
            <Skeleton height="3rem" />
            <Skeleton height="3rem" />
            <Skeleton height="3rem" />
          </div>
        ) : null}
        {error ? (
          <div className="ehas2-error" role="alert">
            {error}
          </div>
        ) : null}
        {!loading && !error && patients.length === 0 && !query ? (
          <EmptyState
            title="No patients in preview"
            body="Synthetic fixtures are empty for this filter. No live patient list exists."
          />
        ) : null}
        {!loading && !error && patients.length === 0 && query ? (
          <EmptyState title="No results" body="No synthetic patients match this search." />
        ) : null}
        {!loading && !error && patients.length > 0 ? (
          <>
            <div className="ehas2-only-desktop">
              <PatientTable patients={patients} />
            </div>
            <div className="ehas2-only-mobile">
              <ul className="ehas2-card-list">
                {patients.map((p) => (
                  <li key={p.id}>
                    <PatientCard patient={p} />
                  </li>
                ))}
              </ul>
            </div>
            <nav className="ehas2-pagination" aria-label="Pagination">
              <button type="button" className="ehas2-btn ehas2-btn--ghost" disabled>
                Previous
              </button>
              <span>Page {page} of 1 (foundation)</span>
              <button type="button" className="ehas2-btn ehas2-btn--ghost" disabled>
                Next
              </button>
            </nav>
          </>
        ) : null}
      </Surface>
    </div>
  );
}
