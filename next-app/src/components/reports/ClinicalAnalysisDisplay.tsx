'use client';

export interface LabFindingRow {
  parameter: string;
  value: string;
  status: string;
  eh_meaning?: string;
}

export interface OrganSystemInfo {
  system: string;
  description: string;
  dosha: string;
  typical_pathology?: string;
}

export interface ConstitutionalTendency {
  focusAreas: string;
  note: string;
  watch: string[];
  baseline_text?: string;
  correlation_text?: string;
  match_status?: string;
}

export interface ClinicalReportData {
  prakriti: string;
  prakriti_analysis: string;
  dosha_dominant?: string;
  vat_status: string;
  pitt_status: string;
  kaph_status: string;
  dosha_analysis: string;
  lab_findings: LabFindingRow[];
  lab_summary: string;
  affected_part_analysis: string;
  active_systems: string[];
  organ_systems?: OrganSystemInfo[];
  severity: string;
  overall_clinical_impression: string;
}

export interface ClinicalAnalysisPayload {
  patient: {
    name: string;
    age: number;
    gender: string;
    date: string;
  };
  clinicalReport: ClinicalReportData;
  constitutionalTendency: ConstitutionalTendency;
  layer1_summary?: string;
  pipeline?: string;
  analysis_via?: string;
}

function statusBadgeClass(status: string) {
  const s = String(status || '').toUpperCase();
  if (s === 'HIGH' || s === 'LOW' || s === 'ABNORMAL') return 'eh-ca-badge eh-ca-badge-warn';
  return 'eh-ca-badge eh-ca-badge-ok';
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: 'teal' | 'gold' | 'red' | 'blue' | 'purple';
  children: React.ReactNode;
}) {
  return (
    <section className={`eh-ca-section eh-ca-accent-${accent}`}>
      <h3 className="eh-ca-heading">{title}</h3>
      {children}
    </section>
  );
}

export default function ClinicalAnalysisDisplay({ data }: { data: ClinicalAnalysisPayload }) {
  const r = data.clinicalReport;
  const p = data.patient;
  const tendency = data.constitutionalTendency;

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
        <div className="eh-ca-badges">
          <span className="eh-ca-badge eh-ca-badge-prakriti">{r.prakriti}</span>
          <span className="eh-ca-badge eh-ca-badge-severity">{r.severity}</span>
        </div>
      </div>

      <Section title="Prakriti & Temperament" accent="teal">
        <p className="eh-ca-body">{r.prakriti_analysis}</p>
      </Section>

      <Section title="Blood, Lymph & Dosha Analysis" accent="gold">
        <div className="eh-ca-dosha-row">
          <span>
            Vat: <strong>{r.vat_status}</strong>
          </span>
          <span>
            Pitt: <strong>{r.pitt_status}</strong>
          </span>
          <span>
            Kaph: <strong>{r.kaph_status}</strong>
          </span>
          {r.dosha_dominant ? (
            <span className="eh-ca-muted">Dominant: {r.dosha_dominant}</span>
          ) : null}
        </div>
        <p className="eh-ca-body">{r.dosha_analysis}</p>
      </Section>

      <Section title="Laboratory / Report Findings" accent="red">
        {r.lab_findings?.length ? (
          <ul className="eh-ca-lab-list">
            {r.lab_findings.map((lab, i) => (
              <li key={`${lab.parameter}-${i}`} className="eh-ca-lab-row">
                <span className="eh-ca-lab-param">{lab.parameter}</span>
                <span className="eh-ca-lab-val">{lab.value}</span>
                <span className={statusBadgeClass(lab.status)}>{lab.status}</span>
                {lab.eh_meaning ? <span className="eh-ca-lab-meaning">{lab.eh_meaning}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="eh-ca-muted">Not provided</p>
        )}
        {r.lab_summary ? <p className="eh-ca-body">{r.lab_summary}</p> : null}
      </Section>

      <Section title="Affected Body Part Analysis" accent="blue">
        <p className="eh-ca-body">{r.affected_part_analysis || 'Not provided'}</p>
        {(r.organ_systems?.length || r.active_systems?.length) ? (
          <div className="eh-ca-system-pills">
            {(r.organ_systems?.length ? r.organ_systems : r.active_systems.map((s) => ({ system: s, description: '' }))).map(
              (sys) => (
                <span key={sys.system} className="eh-ca-pill" title={'description' in sys ? sys.description : ''}>
                  {sys.system}
                </span>
              )
            )}
          </div>
        ) : null}
      </Section>

      <Section title="Constitutional Health Tendency" accent="purple">
        {tendency.match_status ? (
          <p className="eh-ca-body">
            <strong>Photo correlation:</strong>{' '}
            <span className="eh-ca-pill eh-ca-pill-watch">{tendency.match_status.replace(/_/g, ' ')}</span>
          </p>
        ) : null}
        <p className="eh-ca-body">
          <strong>Constitutional Focus Areas:</strong> {tendency.focusAreas}
        </p>
        {tendency.baseline_text && tendency.correlation_text ? (
          <>
            <p className="eh-ca-body eh-ca-italic">
              <strong>Constitutional Baseline:</strong> {tendency.baseline_text}
            </p>
            <p className="eh-ca-body eh-ca-italic">
              <strong>Constitutional Tendency (photo correlation):</strong> {tendency.correlation_text}
            </p>
          </>
        ) : (
          <p className="eh-ca-body eh-ca-italic">{tendency.note}</p>
        )}
        <div className="eh-ca-watch">
          <span className="eh-ca-muted">Clinical watch:</span>
          {tendency.watch.map((w) => (
            <span key={w} className="eh-ca-pill eh-ca-pill-watch">
              {w}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Overall Clinical Impression" accent="teal">
        <div className="eh-ca-impression">
          {r.overall_clinical_impression.split(/\n\n+/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </Section>
    </div>
  );
}
