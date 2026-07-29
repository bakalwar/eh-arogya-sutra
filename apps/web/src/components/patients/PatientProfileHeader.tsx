import Link from 'next/link';
import {
  SYNTHETIC_DATA_BANNER,
  getPatientConsultations,
  type SyntheticPatient,
} from '../../data/syntheticPatients';
import { Breadcrumbs, PageHeader, Surface } from '../ui/Primitives';
import { PreviewModeBanner } from '../entry/PreviewModeBanner';
import { ConsultationTimeline } from './ConsultationTimeline';

export function PatientProfileHeader({ patient }: { patient: SyntheticPatient }) {
  return (
    <header className="ehas2-patient-header">
      <Breadcrumbs
        items={[{ label: 'Patients', href: '/patients' }, { label: patient.displayName }]}
      />
      <PageHeader title={patient.displayName} description={`Synthetic ID: ${patient.id}`} />
      <p>
        Age {patient.ageYears} · {patient.gender} · Status {patient.status}
      </p>
      <div className="ehas2-action-row">
        <Link className="ehas2-btn ehas2-btn--primary" href={`/cases/new?patient=${patient.id}`}>
          Start New Case
        </Link>
        <Link className="ehas2-btn ehas2-btn--secondary" href={`/patients/${patient.id}/history`}>
          History
        </Link>
      </div>
    </header>
  );
}

export function PatientSummaryPanel({ patient }: { patient: SyntheticPatient }) {
  return (
    <div className="ehas2-summary-grid">
      <Surface>
        <h3>Basic details</h3>
        <p>
          {patient.displayName} · {patient.ageYears} years · {patient.gender}
        </p>
      </Surface>
      <Surface className="ehas2-sensitive">
        <h3>Contact information</h3>
        <p>{patient.contactPlaceholder}</p>
      </Surface>
      <Surface>
        <h3>Vitals summary</h3>
        <p>{patient.vitalsSummary}</p>
      </Surface>
      <Surface>
        <h3>Active concerns</h3>
        {patient.activeConcerns.length ? (
          <ul>
            {patient.activeConcerns.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        ) : (
          <p>None recorded in this preview.</p>
        )}
      </Surface>
      <Surface className="ehas2-sensitive">
        <h3>Allergies / contraindications</h3>
        <p>{patient.allergiesPlaceholder}</p>
      </Surface>
      <Surface>
        <h3>Reports</h3>
        <p>Report count: {patient.reportCount} (no storage connected)</p>
      </Surface>
      <Surface>
        <h3>Follow-up status</h3>
        <p>{patient.pendingFollowUp ? 'Pending follow-up' : 'No pending follow-up'}</p>
      </Surface>
    </div>
  );
}

export function PatientDetailView({ patient }: { patient: SyntheticPatient }) {
  const consultations = getPatientConsultations(patient.id);
  return (
    <div className="ehas2-stack">
      <PreviewModeBanner message={SYNTHETIC_DATA_BANNER} />
      <PatientProfileHeader patient={patient} />
      <PatientSummaryPanel patient={patient} />
      <Surface>
        <h3>Recent consultations</h3>
        <ConsultationTimeline consultations={consultations} />
      </Surface>
      <Surface>
        <h3>Activity timeline</h3>
        <p role="status">
          No live activity feed. Preview uses synthetic consultation placeholders only.
        </p>
      </Surface>
    </div>
  );
}
