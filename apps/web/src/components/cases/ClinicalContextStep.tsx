'use client';

import { RED_FLAG_OPTIONS } from '../../lib/case/emergency';
import type { ClinicalContextInput } from '../../lib/case/types';
import { EmergencyWarning } from './EmergencyWarning';
import { ValidatedField } from './ValidatedField';

export function ClinicalContextStep({
  value,
  onChange,
  errors,
}: {
  value: ClinicalContextInput;
  onChange: (next: ClinicalContextInput) => void;
  errors: Record<string, string>;
}) {
  function toggleFlag(id: string) {
    const redFlags = value.redFlags.includes(id)
      ? value.redFlags.filter((x) => x !== id)
      : [...value.redFlags, id];
    onChange({
      ...value,
      redFlags,
      emergencyAcknowledged: redFlags.length === 0 ? false : value.emergencyAcknowledged,
    });
  }

  return (
    <fieldset className="ehas2-fieldset">
      <legend>Clinical context</legend>
      <ValidatedField id="followUpType" label="Follow-up type" error={errors.followUpType}>
        <select
          id="followUpType"
          value={value.followUpType}
          onChange={(e) =>
            onChange({
              ...value,
              followUpType: e.target.value as ClinicalContextInput['followUpType'],
            })
          }
        >
          <option value="">Select</option>
          <option value="new">New</option>
          <option value="follow-up">Follow-up</option>
          <option value="review">Review</option>
          <option value="unknown">Unknown</option>
        </select>
      </ValidatedField>

      <fieldset className="ehas2-fieldset">
        <legend>Emergency / red-flag questions</legend>
        <ul className="ehas2-check-list">
          {RED_FLAG_OPTIONS.map((flag) => (
            <li key={flag.id}>
              <label>
                <input
                  type="checkbox"
                  checked={value.redFlags.includes(flag.id)}
                  onChange={() => toggleFlag(flag.id)}
                />{' '}
                {flag.label}
              </label>
            </li>
          ))}
        </ul>
        <EmergencyWarning
          selectedFlags={value.redFlags}
          acknowledged={value.emergencyAcknowledged}
          onAcknowledgeChange={(emergencyAcknowledged) =>
            onChange({ ...value, emergencyAcknowledged })
          }
          error={errors.emergencyAcknowledged}
        />
      </fieldset>

      <ValidatedField
        id="temperament"
        label="Temperament (optional)"
        hint="Input only — no medicine defaults, no frontend inference."
      >
        <select
          id="temperament"
          value={value.temperament}
          onChange={(e) =>
            onChange({
              ...value,
              temperament: e.target.value as ClinicalContextInput['temperament'],
            })
          }
        >
          <option value="">Not set</option>
          <option value="unknown">Unknown</option>
          <option value="calm">Calm</option>
          <option value="irritable">Irritable</option>
          <option value="anxious">Anxious</option>
          <option value="other">Other</option>
        </select>
      </ValidatedField>

      <ValidatedField
        id="constitution"
        label="Constitution (optional)"
        hint="No hidden fixed triad / A3-S1-L1 defaults."
      >
        <select
          id="constitution"
          value={value.constitution}
          onChange={(e) =>
            onChange({
              ...value,
              constitution: e.target.value as ClinicalContextInput['constitution'],
            })
          }
        >
          <option value="">Not set</option>
          <option value="unknown">Unknown</option>
          <option value="vata">Vata</option>
          <option value="pitta">Pitta</option>
          <option value="kapha">Kapha</option>
          <option value="mixed">Mixed</option>
          <option value="other">Other</option>
        </select>
      </ValidatedField>

      <ValidatedField id="lifestyleFactors" label="Lifestyle factors">
        <textarea
          id="lifestyleFactors"
          value={value.lifestyleFactors}
          onChange={(e) => onChange({ ...value, lifestyleFactors: e.target.value })}
          rows={3}
        />
      </ValidatedField>
      <ValidatedField id="doctorNotes" label="Doctor notes">
        <textarea
          id="doctorNotes"
          value={value.doctorNotes}
          onChange={(e) => onChange({ ...value, doctorNotes: e.target.value })}
          rows={3}
        />
      </ValidatedField>
    </fieldset>
  );
}
