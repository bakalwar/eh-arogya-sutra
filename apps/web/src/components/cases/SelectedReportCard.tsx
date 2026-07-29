'use client';

import type { LocalReportFile } from '../../lib/case/reportFiles';
import { REPORT_CATEGORIES } from '../../lib/case/reportFiles';

export function SelectedReportCard({
  report,
  onRemove,
  onReplace,
}: {
  report: LocalReportFile;
  onRemove: () => void;
  onReplace: (files: FileList | null) => void;
}) {
  const categoryLabel =
    REPORT_CATEGORIES.find((c) => c.id === report.category)?.label ?? report.category;
  const replaceId = `replace-${report.id}`;
  return (
    <article className="ehas2-report-card">
      <header>
        <h3>{report.displayName}</h3>
        <p>
          {categoryLabel} · {(report.sizeBytes / 1024).toFixed(1)} KB · .{report.extension}
        </p>
      </header>
      {!report.mimeExtensionConsistent ? (
        <p className="ehas2-field__error" role="status">
          MIME/extension consistency warning — preview only; file is not uploaded.
        </p>
      ) : null}
      {report.previewKind === 'image' && report.objectUrl ? (
        <img
          src={report.objectUrl}
          alt={`Preview of ${report.displayName}`}
          className="ehas2-report-preview"
        />
      ) : null}
      {report.previewKind === 'pdf-placeholder' ? (
        <p role="status">
          PDF selected — safe metadata preview only (no embedded viewer / no execution).
        </p>
      ) : null}
      <div className="ehas2-report-card__actions">
        <button type="button" className="ehas2-btn ehas2-btn--ghost" onClick={onRemove}>
          Remove
        </button>
        <label htmlFor={replaceId} className="ehas2-btn ehas2-btn--secondary">
          Replace
        </label>
        <input
          id={replaceId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
          className="ehas2-sr-only"
          onChange={(e) => onReplace(e.target.files)}
        />
      </div>
    </article>
  );
}
