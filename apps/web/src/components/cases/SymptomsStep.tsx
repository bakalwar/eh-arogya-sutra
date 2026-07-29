'use client';

import type { BodySiteInput, SymptomInput } from '../../lib/case/types';
import { BodySiteSelector } from './BodySiteSelector';
import { PhaseSelector, SeveritySelector, ValidatedField } from './ValidatedField';

export function SymptomsStep({
  symptoms,
  bodySites,
  onSymptomsChange,
  onBodySitesChange,
  errors,
}: {
  symptoms: SymptomInput;
  bodySites: BodySiteInput;
  onSymptomsChange: (next: SymptomInput) => void;
  onBodySitesChange: (next: BodySiteInput) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="ehas2-stack">
      <fieldset className="ehas2-fieldset">
        <legend>Chief complaint and symptoms</legend>
        <ValidatedField id="chiefComplaint" label="Chief complaint" error={errors.chiefComplaint}>
          <textarea
            id="chiefComplaint"
            value={symptoms.chiefComplaint}
            onChange={(e) => onSymptomsChange({ ...symptoms, chiefComplaint: e.target.value })}
            rows={2}
          />
        </ValidatedField>
        <ValidatedField
          id="completeSymptoms"
          label="Complete symptoms"
          error={errors.completeSymptoms}
        >
          <textarea
            id="completeSymptoms"
            value={symptoms.completeSymptoms}
            onChange={(e) => onSymptomsChange({ ...symptoms, completeSymptoms: e.target.value })}
            rows={4}
          />
        </ValidatedField>
        <ValidatedField
          id="suspectedDiagnosis"
          label="Suspected diagnosis (optional)"
          hint="UI input only — no engine validation."
        >
          <input
            id="suspectedDiagnosis"
            value={symptoms.suspectedDiagnosis}
            onChange={(e) => onSymptomsChange({ ...symptoms, suspectedDiagnosis: e.target.value })}
          />
        </ValidatedField>
        <ValidatedField id="duration" label="Duration" error={errors.duration}>
          <input
            id="duration"
            value={symptoms.duration}
            onChange={(e) => onSymptomsChange({ ...symptoms, duration: e.target.value })}
            placeholder="e.g. 3 days"
          />
        </ValidatedField>
        <PhaseSelector
          id="phase"
          value={symptoms.phase}
          error={errors.phase}
          onChange={(phase) =>
            onSymptomsChange({ ...symptoms, phase: phase as SymptomInput['phase'] })
          }
        />
        <SeveritySelector
          id="severity"
          value={symptoms.severity}
          error={errors.severity}
          onChange={(severity) => onSymptomsChange({ ...symptoms, severity })}
        />
      </fieldset>
      <BodySiteSelector value={bodySites} onChange={onBodySitesChange} error={errors.siteIds} />
    </div>
  );
}
