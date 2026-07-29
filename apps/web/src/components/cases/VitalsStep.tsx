'use client';

import type { VitalsDraft } from '../../lib/case/types';
import { NumericVitalField } from './ValidatedField';
import { ValidatedField } from './ValidatedField';

export function VitalsStep({
  value,
  onChange,
  errors,
}: {
  value: VitalsDraft;
  onChange: (next: VitalsDraft) => void;
  errors: Record<string, string>;
}) {
  return (
    <fieldset className="ehas2-fieldset">
      <legend>Vitals</legend>
      <div className="ehas2-form-grid">
        <NumericVitalField
          id="systolicBp"
          label="Systolic BP"
          unit="mmHg"
          value={value.systolicBp}
          error={errors.systolicBp}
          onChange={(systolicBp) => onChange({ ...value, systolicBp })}
        />
        <NumericVitalField
          id="diastolicBp"
          label="Diastolic BP"
          unit="mmHg"
          value={value.diastolicBp}
          error={errors.diastolicBp}
          onChange={(diastolicBp) => onChange({ ...value, diastolicBp })}
        />
        <NumericVitalField
          id="pulse"
          label="Pulse"
          unit="bpm"
          value={value.pulse}
          error={errors.pulse}
          onChange={(pulse) => onChange({ ...value, pulse })}
        />
        <NumericVitalField
          id="temperatureC"
          label="Temperature"
          unit="°C"
          value={value.temperatureC}
          error={errors.temperatureC}
          inputMode="decimal"
          onChange={(temperatureC) => onChange({ ...value, temperatureC })}
        />
        <NumericVitalField
          id="oxygenSaturation"
          label="Oxygen saturation"
          unit="%"
          value={value.oxygenSaturation}
          error={errors.oxygenSaturation}
          onChange={(oxygenSaturation) => onChange({ ...value, oxygenSaturation })}
        />
      </div>
      <ValidatedField id="vitalsNotes" label="Optional notes">
        <textarea
          id="vitalsNotes"
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          rows={3}
        />
      </ValidatedField>
    </fieldset>
  );
}
