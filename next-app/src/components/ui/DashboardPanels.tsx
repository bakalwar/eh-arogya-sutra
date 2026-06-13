import Link from 'next/link';
import type { CaseSummary } from '@/lib/types';

export function QuickActions() {
  const actions = [
    { href: '/symptom-search', icon: '🔍', title: 'Symptom Search', sub: 'Chief complaint → prescription' },
    { href: '/reports', icon: '🧪', title: 'Report Analysis', sub: 'Blood / MRI / CT' },
    { href: '/records', icon: '📋', title: 'Patient Records', sub: 'Registry & history' },
    { href: '/case-summary', icon: '📄', title: 'Case Summary', sub: 'Active prescription' },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">⚡ Quick Actions</div>
      </div>
      <div className="card-body">
        <div className="quick-grid">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className="quick-btn">
              <div className="quick-icon">{action.icon}</div>
              <div>
                <div className="quick-title">{action.title}</div>
                <div className="quick-sub">{action.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ClinicalSearchCard() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🔍 Clinical Search</div>
        <Link href="/symptom-search" className="card-action">
          Open →
        </Link>
      </div>
      <div className="card-body">
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>
          Enter patient vitals and symptoms to receive polarity-aware Electro Homoeopathy
          recommendations.
        </p>
        <Link href="/symptom-search" className="btn-new">
          Start Clinical Search
        </Link>
      </div>
    </div>
  );
}

export function ReportAnalysisCard() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🧪 Report Analysis</div>
        <Link href="/reports" className="card-action">
          Open →
        </Link>
      </div>
      <div className="card-body">
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>
          Upload laboratory or imaging reports for automated extraction and clinical mapping.
        </p>
        <Link href="/reports" className="btn-secondary">
          Analyze Report
        </Link>
      </div>
    </div>
  );
}

export function PrescriptionPanel({ caseData }: { caseData: CaseSummary }) {
  const hasCase = caseData.patientName && caseData.patientName !== 'Patient';

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">📄 Prescription</div>
        <Link href="/case-summary" className="card-action">
          Full View →
        </Link>
      </div>
      <div className="card-body">
        {!hasCase ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            No active case.{' '}
            <Link href="/symptom-search" style={{ color: 'var(--gold2)' }}>
              Start a clinical search
            </Link>{' '}
            or{' '}
            <Link href="/reports" style={{ color: 'var(--gold2)' }}>
              analyze a report
            </Link>
            .
          </p>
        ) : (
          <>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3, letterSpacing: 1 }}>
              CURRENT CASE
            </div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18,
                color: 'var(--white)',
                marginBottom: 12,
              }}
            >
              {caseData.patientName}
              {caseData.mulank ? (
                <>
                  {' '}
                  · <span style={{ color: 'var(--gold2)' }}>Mulank {caseData.mulank}</span>
                </>
              ) : null}
            </div>

            <div className="polarity-row">
              <div className="pol-box blood">
                <div className="pol-title">Blood</div>
                <div className="pol-val">{caseData.polarity.blood.value}</div>
                <div className="pol-sub">{caseData.polarity.blood.sub}</div>
              </div>
              <div className="pol-box lymph">
                <div className="pol-title">Lymph</div>
                <div className="pol-val">{caseData.polarity.lymph.value}</div>
                <div className="pol-sub">{caseData.polarity.lymph.sub}</div>
              </div>
              <div className="pol-box polarity">
                <div className="pol-title">Rog</div>
                <div className="pol-val">{caseData.polarity.disease.value}</div>
                <div className="pol-sub">{caseData.polarity.disease.sub}</div>
              </div>
            </div>

            {caseData.formulas.length > 0 && (
              <div className="formula-list">
                {caseData.formulas.map((formula) => (
                  <div key={formula.name} className="f-card">
                    <div className="f-name">{formula.name}</div>
                    <div className="f-meds">
                      {formula.medicines.map((med, i) => (
                        <span key={`${med}-${i}`}>
                          {i > 0 ? <span className="f-plus">+</span> : null}
                          <span className="f-med">{med}</span>
                        </span>
                      ))}
                    </div>
                    <div className="f-info">
                      <span className="f-pot">{formula.potency}</span>
                      <span className="f-dose">{formula.dose}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(caseData.dietDo.length > 0 || caseData.dietDont.length > 0) && (
              <div className="diet-grid">
                {caseData.dietDo.length > 0 && (
                  <div className="diet-card do">
                    <div className="diet-title">✅ Khayen</div>
                    <div className="diet-items">
                      {caseData.dietDo.map((item) => (
                        <span key={item} className="d-item">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {caseData.dietDont.length > 0 && (
                  <div className="diet-card dont">
                    <div className="diet-title">❌ Na Khayen</div>
                    <div className="diet-items">
                      {caseData.dietDont.map((item) => (
                        <span key={item} className="d-item">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  date,
  action,
  mobileTitle,
}: {
  title: React.ReactNode;
  subtitle?: string;
  date?: string;
  action?: React.ReactNode;
  mobileTitle?: React.ReactNode;
}) {
  return (
    <>
      {mobileTitle ? (
        <div className="m-app-header mobile-only">
          <div className="m-app-title">{mobileTitle}</div>
        </div>
      ) : null}
      <div className="page-header">
        <div>
          <div className="page-greet-small">Namaskar</div>
          <div className="page-greet">{title}</div>
          {date ? <div className="page-date">{date}</div> : null}
          {subtitle ? <div className="page-subtitle">{subtitle}</div> : null}
        </div>
        {action}
      </div>
    </>
  );
}

/** @deprecated Use ClinicalSearchCard */
export function SearchPanel() {
  return <ClinicalSearchCard />;
}
