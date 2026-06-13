'use client';

import type { LabFindingRow } from '@/components/reports/ClinicalAnalysisDisplay';

export interface SynthesizedClinicalPayload {
  patient: {
    name: string;
    age: number;
    gender: string;
    date: string;
  };
  clinicalReport: {
    prakriti?: string;
    dosha_dominant?: string;
    vat_status: string;
    pitt_status: string;
    kaph_status: string;
    lab_findings: LabFindingRow[];
    severity?: string;
    overall_clinical_impression: string;
  };
  pipeline?: string;
}

function statusBadgeClass(status: string) {
  const s = String(status || '').toUpperCase();
  if (s === 'HIGH' || s === 'LOW' || s === 'ABNORMAL') return 'eh-ca-badge eh-ca-badge-warn';
  return 'eh-ca-badge eh-ca-badge-ok';
}

function doshaPillClass(status: string) {
  const s = String(status || '').toLowerCase();
  if (s.includes('severe')) return 'eh-ca-dosha-pill eh-ca-dosha-severe';
  if (s.includes('mild')) return 'eh-ca-dosha-pill eh-ca-dosha-mild';
  return 'eh-ca-dosha-pill eh-ca-dosha-balanced';
}

/** Final synthesized report only — no raw baseline/EH intermediate text. */
export default function SynthesizedClinicalDisplay({ data }: { data: SynthesizedClinicalPayload }) {
  const r = data.clinicalReport;
  const p = data.patient;
  const narrative = r.overall_clinical_impression || '';

  return (
    <div className="eh-clinical-analysis">
      <div className="eh-ca-patient-strip">
        <div>
          <strong>{p.name}</strong>
          <span className="eh-ca-muted">
            {' '}
            · {p.age}y · {p.gender} · {new Date(p.date).toLocaleDateString()}
          </span>
        </div>
        {r.severity ? (
          <div className="eh-ca-badges">
            <span className="eh-ca-badge eh-ca-badge-severity">{r.severity}</span>
          </div>
        ) : null}
      </div>

      <div className="eh-ca-dosha-row" style={{ marginBottom: 16 }}>
        <span className={doshaPillClass(r.vat_status)}>Vat: {r.vat_status}</span>
        <span className={doshaPillClass(r.pitt_status)}>Pitt: {r.pitt_status}</span>
        <span className={doshaPillClass(r.kaph_status)}>Kaph: {r.kaph_status}</span>
        {r.dosha_dominant ? (
          <span className="eh-ca-muted">Elevated: {r.dosha_dominant}</span>
        ) : null}
      </div>

      <div className="eh-ca-impression">
        {narrative.split(/\n\n+/).filter(Boolean).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {r.lab_findings?.length ? (
        <section className="eh-ca-section eh-ca-accent-red" style={{ marginTop: 20 }}>
          <h3 className="eh-ca-heading">Laboratory Values</h3>
          <ul className="eh-ca-lab-list">
            {r.lab_findings.map((lab, i) => (
              <li key={`${lab.parameter}-${i}`} className="eh-ca-lab-row">
                <span className="eh-ca-lab-param">{lab.parameter}</span>
                <span className="eh-ca-lab-val">{lab.value}</span>
                <span className={statusBadgeClass(lab.status)}>{lab.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
