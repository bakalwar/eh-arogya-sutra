'use client';

/** Inline preview — Constitutional Baseline before photo analysis */
export default function ConstitutionalBaselinePreview({
  baselineText,
  organs,
  watchPoints,
  loading,
}: {
  baselineText?: string;
  organs?: string[];
  watchPoints?: string[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="eh-ca-baseline-preview eh-ca-baseline-loading">
        <div className="eh-ca-baseline-label">Constitutional Baseline</div>
        <p className="eh-ca-muted">Loading baseline…</p>
      </div>
    );
  }

  if (!baselineText) return null;

  return (
    <div className="eh-ca-baseline-preview">
      <div className="eh-ca-baseline-label">Constitutional Baseline</div>
      {organs?.length ? (
        <p className="eh-ca-body" style={{ marginBottom: 8 }}>
          <strong>Organ focus:</strong>{' '}
          {organs.map((o) => (
            <span key={o} className="eh-ca-pill eh-ca-pill-watch" style={{ marginRight: 6 }}>
              {o}
            </span>
          ))}
        </p>
      ) : null}
      <p className="eh-ca-body eh-ca-italic">{baselineText}</p>
      {watchPoints?.length ? (
        <div className="eh-ca-watch">
          <span className="eh-ca-muted">Watch:</span>
          {watchPoints.map((w) => (
            <span key={w} className="eh-ca-pill eh-ca-pill-watch">
              {w}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
