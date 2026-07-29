'use client';

import type { ReactNode } from 'react';

type ValidatedFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function ValidatedField({ id, label, error, hint, children }: ValidatedFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className="ehas2-field">
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <p id={hintId} className="ehas2-field__hint">
          {hint}
        </p>
      ) : null}
      <div
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
        }
      >
        {children}
      </div>
      {error ? (
        <p id={errorId} className="ehas2-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type NumericVitalFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  unit?: string;
  inputMode?: 'numeric' | 'decimal';
};

export function NumericVitalField({
  id,
  label,
  value,
  onChange,
  error,
  unit,
  inputMode = 'numeric',
}: NumericVitalFieldProps) {
  return (
    <ValidatedField id={id} label={unit ? `${label} (${unit})` : label} error={error}>
      <input
        id={id}
        name={id}
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
        autoComplete="off"
      />
    </ValidatedField>
  );
}

export function SeveritySelector({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <ValidatedField id={id} label="Severity (1–10)" error={error}>
      <select id={id} name={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select severity</option>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={String(n)}>
            {n}
          </option>
        ))}
      </select>
    </ValidatedField>
  );
}

export function PhaseSelector({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <ValidatedField id={id} label="Phase" error={error}>
      <select id={id} name={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select phase</option>
        <option value="acute">Acute</option>
        <option value="subacute">Subacute</option>
        <option value="chronic">Chronic</option>
        <option value="unknown">Unknown</option>
      </select>
    </ValidatedField>
  );
}

export function ErrorSummary({
  errors,
  onFocusField,
}: {
  errors: Record<string, string>;
  onFocusField: (field: string) => void;
}) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;
  return (
    <div className="ehas2-error-summary" role="alert" tabIndex={-1} id="case-error-summary">
      <strong>Please fix the following:</strong>
      <ul>
        {entries.map(([field, message]) => (
          <li key={field}>
            <button type="button" className="ehas2-linkish" onClick={() => onFocusField(field)}>
              {message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
