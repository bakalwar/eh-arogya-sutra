import Link from 'next/link';
import type { PolarityType } from '@/lib/types';

export function PolarityTag({ polarity }: { polarity: PolarityType }) {
  const map = {
    positive: 'tag-pos',
    negative: 'tag-neg',
    mixed: 'tag-mix',
  } as const;
  const label = { positive: 'POSITIVE', negative: 'NEGATIVE', mixed: 'MIXED' }[polarity];
  return <span className={`tag ${map[polarity]}`}>{label}</span>;
}

export function FormulaDisplay({ medicines }: { medicines: string[] }) {
  return (
    <span className="rx-formula">
      {medicines.map((med, i) => (
        <span key={`${med}-${i}`}>
          {i > 0 ? <span className="rx-p">+</span> : null}
          <span className="rx-m">{med}</span>
        </span>
      ))}
    </span>
  );
}

export function PatientTable({
  patients,
  actionHref,
}: {
  patients: Array<{
    id: string;
    initials: string;
    name: string;
    age: number;
    gender: string;
    diagnosis: string;
    symptoms: string;
    polarity: PolarityType;
    formula: string[];
  }>;
  actionHref?: string;
}) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">👥 Recent Patients</div>
        {actionHref ? (
          <Link href={actionHref} className="card-action">
            View All →
          </Link>
        ) : null}
      </div>
      <div className="card-body card-body-flush">
        <table className="patient-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Diagnosis</th>
              <th>Polarity</th>
              <th>Formula</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>
                  <div className="p-name-wrap">
                    <div className="p-av">{patient.initials}</div>
                    <div>
                      <div>{patient.name}</div>
                      <div className="p-diag">
                        {patient.age} Saal · {patient.gender}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div>{patient.diagnosis}</div>
                  <div className="p-diag">{patient.symptoms}</div>
                </td>
                <td>
                  <PolarityTag polarity={patient.polarity} />
                </td>
                <td>
                  <FormulaDisplay medicines={patient.formula} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
