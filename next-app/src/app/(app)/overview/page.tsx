'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  PrescriptionPanel,
  QuickActions,
  ClinicalSearchCard,
  ReportAnalysisCard,
} from '@/components/ui/DashboardPanels';
import { PatientTable } from '@/components/ui/PatientTable';
import { StatsGrid } from '@/components/ui/StatCard';
import { formatTodayDate } from '@/lib/formatDate';
import { dashboardStatTemplate } from '@/lib/dashboardStats';
import { fetchPatients } from '@/lib/api/patients';
import { getCurrentUser } from '@/lib/session/tokenManager';
import { loadSmartSearchResult } from '@/lib/session/smartSearchStorage';
import type { PatientRecord, CaseSummary } from '@/lib/types';

const emptyCase: CaseSummary = {
  patientId: '',
  patientName: '',
  mulank: 0,
  numerologyCalc: '',
  numerologyResult: '',
  polarity: {
    blood: { value: '—', sub: '' },
    lymph: { value: '—', sub: '' },
    disease: { value: '—', sub: '' },
  },
  formulas: [],
  dietDo: [],
  dietDont: [],
  advice: [],
};

function mapSessionToCase(data: Record<string, unknown>): CaseSummary | null {
  if (!data) return null;
  const patient = (data.patient || {}) as Record<string, unknown>;
  const eh = (data.eh_analysis || {}) as Record<string, unknown>;
  const polarity = (eh.polarity as Record<string, unknown>) || {};
  const name = (patient.name as string) || (data.patient_name as string) || '';
  if (!name) return null;
  const mixtures = (data.mixtures || eh.mixtures || []) as Array<Record<string, unknown>>;

  return {
    patientId: String(data.patientId || 'session'),
    patientName: name,
    mulank: 0,
    numerologyCalc: '—',
    numerologyResult: '—',
    polarity: {
      blood: { value: String(polarity.polarity || '—'), sub: 'Polarity' },
      lymph: { value: String((eh.prakriti as Record<string, unknown>)?.prakriti || '—'), sub: 'Prakriti' },
      disease: { value: String(eh.phase || '—'), sub: 'Phase' },
    },
    formulas: mixtures.slice(0, 3).map((m, i) => ({
      name: String(m.label || `Formula ${String.fromCharCode(65 + i)}`),
      medicines: String(m.formula || m.formula_obj || '—')
        .split('+')
        .map((s) => s.trim())
        .filter(Boolean),
      potency: String((eh.potency as Record<string, unknown>)?.potency || '—'),
      dose: String(m.dose || '—'),
    })),
    dietDo: [],
    dietDont: [],
    advice: [],
  };
}

export default function OverviewPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [liveCase, setLiveCase] = useState<CaseSummary | null>(null);
  const user = getCurrentUser();

  useEffect(() => {
    fetchPatients()
      .then((rows) => setPatients(rows.slice(0, 5)))
      .catch(() => setPatients([]));
    const session = loadSmartSearchResult();
    if (session) setLiveCase(mapSessionToCase(session));
  }, []);

  const doctorName = user?.name || 'Doctor';
  const stats = dashboardStatTemplate.map((s, i) =>
    i === 0 && patients.length ? { ...s, value: patients.length } : s
  );

  return (
    <>
      <PageHeader
        title={
          <>
            Dr. <span>{doctorName.replace(/^Dr\.?\s*/i, '')}</span>
          </>
        }
        date={formatTodayDate()}
        mobileTitle={
          <>
            Overview · <span>{doctorName.split(' ')[0]}</span>
          </>
        }
        action={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/reports" className="btn-new">
              Report Analysis
            </Link>
            <Link href="/symptom-search" className="btn-secondary">
              New Case
            </Link>
          </div>
        }
      />

      <StatsGrid stats={stats} />

      <div className="two-col">
        <QuickActions />
        <ClinicalSearchCard />
      </div>

      <div className="two-col" style={{ marginTop: 18 }}>
        <ReportAnalysisCard />
        <PrescriptionPanel caseData={liveCase || emptyCase} />
      </div>

      <div style={{ marginTop: 18 }}>
        <PatientTable patients={patients} actionHref="/records" />
      </div>
    </>
  );
}
