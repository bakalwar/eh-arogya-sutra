'use client';

import { SYNTHETIC_PATIENTS } from '../../data/syntheticPatients';
import type { PatientDraft } from '../../lib/case/types';
import { ValidatedField } from './ValidatedField';

export function PatientStep({
  value,
  onChange,
  errors,
}: {
  value: PatientDraft;
  onChange: (next: PatientDraft) => void;
  errors: Record<string, string>;
}) {
  return (
    <fieldset className="ehas2-fieldset">
      <legend>Patient</legend>
      <div className="ehas2-inline-choices" role="radiogroup" aria-label="Patient source">
        <label>
          <input
            type="radio"
            name="patient-mode"
            checked={value.mode === 'existing'}
            onChange={() => onChange({ ...value, mode: 'existing' })}
          />{' '}
          Select existing synthetic patient
        </label>
        <label>
          <input
            type="radio"
            name="patient-mode"
            checked={value.mode === 'new'}
            onChange={() => onChange({ ...value, mode: 'new' })}
          />{' '}
          Add new patient (preview only)
        </label>
      </div>
      {value.mode === 'existing' ? (
        <ValidatedField
          id="existingPatientId"
          label="Synthetic patient"
          error={errors.existingPatientId}
        >
          <select
            id="existingPatientId"
            value={value.existingPatientId}
            onChange={(e) => onChange({ ...value, existingPatientId: e.target.value })}
          >
            <option value="">Select patient</option>
            {SYNTHETIC_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName} ({p.id})
              </option>
            ))}
          </select>
        </ValidatedField>
      ) : (
        <>
          <ValidatedField id="displayName" label="Patient name" error={errors.displayName}>
            <input
              id="displayName"
              value={value.displayName}
              onChange={(e) => onChange({ ...value, displayName: e.target.value })}
              autoComplete="name"
            />
          </ValidatedField>
          <div className="ehas2-inline-choices">
            <label>
              <input
                type="radio"
                checked={value.ageInputMode === 'age'}
                onChange={() => onChange({ ...value, ageInputMode: 'age' })}
              />{' '}
              Age (years)
            </label>
            <label>
              <input
                type="radio"
                checked={value.ageInputMode === 'dob'}
                onChange={() => onChange({ ...value, ageInputMode: 'dob' })}
              />{' '}
              Date of birth
            </label>
          </div>
          {value.ageInputMode === 'age' ? (
            <ValidatedField id="ageYears" label="Age in years" error={errors.ageYears}>
              <input
                id="ageYears"
                inputMode="numeric"
                value={value.ageYears}
                onChange={(e) =>
                  onChange({ ...value, ageYears: e.target.value.replace(/\D/g, '') })
                }
              />
            </ValidatedField>
          ) : (
            <ValidatedField id="dateOfBirth" label="Date of birth" error={errors.dateOfBirth}>
              <input
                id="dateOfBirth"
                type="date"
                value={value.dateOfBirth}
                onChange={(e) => onChange({ ...value, dateOfBirth: e.target.value })}
              />
            </ValidatedField>
          )}
          <ValidatedField id="gender" label="Gender" error={errors.gender}>
            <select
              id="gender"
              value={value.gender}
              onChange={(e) =>
                onChange({ ...value, gender: e.target.value as PatientDraft['gender'] })
              }
            >
              <option value="">Select</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="unknown">Unknown</option>
            </select>
          </ValidatedField>
          <ValidatedField id="weightKg" label="Weight (kg)" error={errors.weightKg}>
            <input
              id="weightKg"
              inputMode="decimal"
              value={value.weightKg}
              onChange={(e) =>
                onChange({ ...value, weightKg: e.target.value.replace(/[^\d.]/g, '') })
              }
            />
          </ValidatedField>
        </>
      )}
    </fieldset>
  );
}
