import Link from 'next/link';
import type { SyntheticPatient } from '../../data/syntheticPatients';

export function PatientTable({ patients }: { patients: readonly SyntheticPatient[] }) {
  return (
    <div className="ehas2-table-wrap" role="region" aria-label="Patient table" tabIndex={0}>
      <table className="ehas2-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Age</th>
            <th scope="col">Gender</th>
            <th scope="col">Last consultation</th>
            <th scope="col">Status</th>
            <th scope="col">Follow-up</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/patients/${p.id}`}>{p.displayName}</Link>
              </td>
              <td>{p.ageYears}</td>
              <td>{p.gender}</td>
              <td>{p.lastConsultationDate ?? '—'}</td>
              <td>{p.status}</td>
              <td>{p.pendingFollowUp ? 'Pending' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PatientCard({ patient }: { patient: SyntheticPatient }) {
  return (
    <article className="ehas2-patient-card">
      <h3>
        <Link href={`/patients/${patient.id}`}>{patient.displayName}</Link>
      </h3>
      <p>
        Age {patient.ageYears} · {patient.gender}
      </p>
      <p>Last consultation: {patient.lastConsultationDate ?? 'None'}</p>
      <p>
        Status: {patient.status}
        {patient.pendingFollowUp ? ' · Pending follow-up' : ''}
      </p>
    </article>
  );
}
