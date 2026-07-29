'use client';

import {
  EMERGENCY_WARNING_COPY,
  RED_FLAG_OPTIONS,
  hasActiveRedFlags,
} from '../../lib/case/emergency';

export function EmergencyWarning({
  selectedFlags,
  acknowledged,
  onAcknowledgeChange,
  error,
}: {
  selectedFlags: string[];
  acknowledged: boolean;
  onAcknowledgeChange: (value: boolean) => void;
  error?: string;
}) {
  if (!hasActiveRedFlags(selectedFlags)) return null;
  return (
    <div className="ehas2-emergency" role="alert">
      <h3>Emergency / red-flag warning</h3>
      <p>{EMERGENCY_WARNING_COPY}</p>
      <ul>
        {RED_FLAG_OPTIONS.filter((o) => selectedFlags.includes(o.id)).map((o) => (
          <li key={o.id}>{o.label}</li>
        ))}
      </ul>
      <p>
        Final emergency policy belongs to the verified clinical-engine and clinical-safety phase. No
        medicine or treatment is generated here.
      </p>
      <label>
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => onAcknowledgeChange(e.target.checked)}
        />{' '}
        I acknowledge this UI warning and will use clinical judgement.
      </label>
      {error ? (
        <p className="ehas2-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function UnsavedChangesDialog({
  open,
  onStay,
  onLeave,
}: {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  if (!open) return null;
  return (
    <div className="ehas2-dialog-backdrop" role="presentation">
      <div className="ehas2-dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
        <h2 id="unsaved-title">Unsaved case preview</h2>
        <p>
          Leaving will discard in-memory draft inputs and selected report previews. Nothing is saved
          to a server.
        </p>
        <div className="ehas2-dialog__actions">
          <button type="button" className="ehas2-btn ehas2-btn--ghost" onClick={onStay}>
            Stay
          </button>
          <button type="button" className="ehas2-btn ehas2-btn--primary" onClick={onLeave}>
            Discard and leave
          </button>
        </div>
      </div>
    </div>
  );
}
