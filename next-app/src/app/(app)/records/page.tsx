'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/DashboardPanels';
import { PatientTable } from '@/components/ui/PatientTable';
import { formatTodayDate } from '@/lib/formatDate';
import { fetchPatients } from '@/lib/api/patients';
import type { PatientRecord } from '@/lib/types';

export default function RecordsPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients()
      .then(setPatients)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load patients'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.symptoms.toLowerCase().includes(q) ||
      p.diagnosis.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <PageHeader
        title={
          <>
            Patient <span>Records</span>
          </>
        }
        subtitle="Complete patient registry with diagnosis, polarity, and prescriptions."
        date={formatTodayDate()}
        mobileTitle={
          <>
            Records · <span>{loading ? '…' : `${patients.length} Patients`}</span>
          </>
        }
        action={
          <Link href="/symptom-search" className="btn-new">
            ➕ New Case
          </Link>
        }
      />

      {loading ? (
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Loading patients…</p>
      ) : null}
      {error ? <div className="eh-analyze-status error">{error}</div> : null}

      <PatientTable patients={filtered} />

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <div className="card-title">📁 Search Records</div>
        </div>
        <div className="card-body">
          <div className="search-input-wrap">
            <span style={{ color: 'var(--gold)', fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Search by name, symptoms, diagnosis..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
