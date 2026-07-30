'use client';

import { useState, type FormEvent } from 'react';
import {
  BlockedSubmitButton,
  ProfileAuthGate,
  ProfileReadonlyFormNotice,
  ProfileSubnav,
} from './ProfileShell';
import { profileApiFetch } from '../../lib/profileApi';
import { Surface } from '../ui/Primitives';

export function ProfileHomePage({ currentPath }: { currentPath: string }) {
  const [apiNote, setApiNote] = useState<string | null>(null);

  async function probe() {
    const result = await profileApiFetch<unknown>('/me/profile');
    if (result.ok) {
      setApiNote('Unexpected success — auth should be NOT_CONNECTED in this phase.');
      return;
    }
    setApiNote(`${result.code}: ${result.message} (request ${result.requestId})`);
  }

  return (
    <ProfileAuthGate
      currentPath={currentPath}
      title="My Profile"
      description="Professional identity for prescriptions. Real authentication is not active."
    >
      <ProfileSubnav active="profile" />
      <Surface>
        <h2 className="ehas2-profile-subhead">Profile completion</h2>
        <p className="ehas2-field__hint">
          Completion status loads from <code>/me/profile-completion</code> after Phase 4 auth.
        </p>
        <ul className="ehas2-profile-checklist">
          <li>Display / prescription name — pending auth</li>
          <li>Active qualification — pending auth</li>
          <li>Active registration — pending auth (none invented)</li>
          <li>Primary phone — pending auth</li>
        </ul>
        <button type="button" className="ehas2-btn ehas2-btn--ghost" onClick={() => void probe()}>
          Probe profile API
        </button>
        {apiNote ? (
          <p className="ehas2-field__error" role="status">
            {apiNote}
          </p>
        ) : null}
      </Surface>
    </ProfileAuthGate>
  );
}

export function ProfileEditPage({ currentPath }: { currentPath: string }) {
  const [blocked, setBlocked] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBlocked(true);
  }

  return (
    <ProfileAuthGate
      currentPath={currentPath}
      title="Edit profile"
      description="Update permitted professional fields after authentication is connected."
    >
      <ProfileSubnav active="edit" />
      <ProfileReadonlyFormNotice />
      <form className="ehas2-auth-actions" onSubmit={onSubmit} noValidate>
        <div className="ehas2-field">
          <label htmlFor="displayName">Display name</label>
          <input id="displayName" name="displayName" autoComplete="name" maxLength={200} />
        </div>
        <div className="ehas2-field">
          <label htmlFor="prescriptionName">Prescription name</label>
          <input id="prescriptionName" name="prescriptionName" maxLength={200} />
        </div>
        <div className="ehas2-field">
          <label htmlFor="specialization">Speciality / practice area</label>
          <input id="specialization" name="specialization" maxLength={120} />
        </div>
        <div className="ehas2-field">
          <label htmlFor="yearsOfExperience">Years of experience</label>
          <input id="yearsOfExperience" name="yearsOfExperience" inputMode="numeric" />
        </div>
        <div className="ehas2-field">
          <label htmlFor="professionalBio">Professional summary</label>
          <textarea id="professionalBio" name="professionalBio" rows={4} maxLength={2000} />
        </div>
        <div className="ehas2-field">
          <label htmlFor="preferredLanguage">Preferred language</label>
          <select id="preferredLanguage" name="preferredLanguage" defaultValue="en">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>
        <div className="ehas2-field">
          <label htmlFor="timezone">Timezone</label>
          <input id="timezone" name="timezone" defaultValue="Asia/Kolkata" maxLength={64} />
        </div>
        <BlockedSubmitButton label="Save profile" />
        {blocked ? (
          <p id="profile-submit-blocked" className="ehas2-field__error" role="status">
            NOT_CONNECTED — profile was not saved.
          </p>
        ) : (
          <p id="profile-submit-blocked" className="ehas2-sr-only">
            Submit remains blocked while authentication is not connected.
          </p>
        )}
      </form>
    </ProfileAuthGate>
  );
}

export function ProfileQualificationsPage({ currentPath }: { currentPath: string }) {
  return (
    <ProfileAuthGate
      currentPath={currentPath}
      title="Qualifications"
      description="Manage your own qualifications. Unsupported ownership claims are rejected server-side."
    >
      <ProfileSubnav active="qualifications" />
      <ProfileReadonlyFormNotice />
      <p className="ehas2-field__hint">No qualification is invented by default.</p>
      <BlockedSubmitButton label="Add qualification" />
    </ProfileAuthGate>
  );
}

export function ProfileRegistrationsPage({ currentPath }: { currentPath: string }) {
  return (
    <ProfileAuthGate
      currentPath={currentPath}
      title="Professional registrations"
      description="Registration number, authority, jurisdiction, and validity — when entered and verified later."
    >
      <ProfileSubnav active="registrations" />
      <ProfileReadonlyFormNotice />
      <p className="ehas2-field__hint">
        Missing registration is shown truthfully. No default registration is invented.
      </p>
      <BlockedSubmitButton label="Add registration" />
    </ProfileAuthGate>
  );
}

export function PrescriberPreviewPage({ currentPath }: { currentPath: string }) {
  const [note, setNote] = useState<string | null>(null);

  async function loadPreview() {
    const result = await profileApiFetch<{
      previewOnly: boolean;
      snapshot: unknown;
    }>('/me/prescriber-identity-preview');
    if (result.ok) {
      setNote('Unexpected success — auth should be NOT_CONNECTED.');
      return;
    }
    setNote(`${result.code}: ${result.message}`);
  }

  return (
    <ProfileAuthGate
      currentPath={currentPath}
      title="Prescriber identity preview"
      description="Preview of the identity that will freeze on future prescription issue — not an issued prescription."
    >
      <ProfileSubnav active="prescriber" />
      <p className="ehas2-field__hint">
        Historical issued snapshots remain immutable. Later profile edits cannot rewrite old
        prescription identity.
      </p>
      <button
        type="button"
        className="ehas2-btn ehas2-btn--ghost"
        onClick={() => void loadPreview()}
      >
        Load preview API
      </button>
      {note ? (
        <p className="ehas2-field__error" role="status">
          {note}
        </p>
      ) : null}
    </ProfileAuthGate>
  );
}

export function ClinicSettingsPage({ currentPath }: { currentPath: string }) {
  const [blocked, setBlocked] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBlocked(true);
  }

  return (
    <ProfileAuthGate
      currentPath={currentPath}
      title="Clinic settings"
      description="ClinicAdmin may update permitted clinic details after authentication. Ordinary doctors cannot alter ownership."
    >
      <ProfileSubnav active="clinic" />
      <ProfileReadonlyFormNotice />
      <form className="ehas2-auth-actions" onSubmit={onSubmit} noValidate>
        <div className="ehas2-field">
          <label htmlFor="clinicName">Clinic name</label>
          <input id="clinicName" name="clinicName" maxLength={200} />
        </div>
        <div className="ehas2-field">
          <label htmlFor="clinicPhone">Phone</label>
          <input id="clinicPhone" name="clinicPhone" inputMode="tel" maxLength={20} />
        </div>
        <div className="ehas2-field">
          <label htmlFor="clinicEmail">Email</label>
          <input id="clinicEmail" name="clinicEmail" type="email" maxLength={254} />
        </div>
        <div className="ehas2-field">
          <label htmlFor="addressLine1">Address line 1</label>
          <input id="addressLine1" name="addressLine1" maxLength={200} />
        </div>
        <div className="ehas2-field">
          <label htmlFor="city">City</label>
          <input id="city" name="city" maxLength={120} />
        </div>
        <div className="ehas2-field">
          <label htmlFor="clinicTimezone">Timezone</label>
          <input id="clinicTimezone" name="timezone" defaultValue="Asia/Kolkata" maxLength={64} />
        </div>
        <BlockedSubmitButton label="Save clinic settings" />
        {blocked ? (
          <p className="ehas2-field__error" role="status">
            NOT_CONNECTED — clinic settings were not saved.
          </p>
        ) : null}
      </form>
    </ProfileAuthGate>
  );
}

export function ClinicHoursPage({ currentPath }: { currentPath: string }) {
  return (
    <ProfileAuthGate
      currentPath={currentPath}
      title="Clinic hours"
      description="Weekly schedule and closed days. ClinicAdmin only for mutations."
    >
      <ProfileSubnav active="hours" />
      <ProfileReadonlyFormNotice />
      <p className="ehas2-field__hint">
        Indian timezone support uses IANA zones such as Asia/Kolkata.
      </p>
      <BlockedSubmitButton label="Replace hours" />
    </ProfileAuthGate>
  );
}

export function ClinicTeamPage({ currentPath }: { currentPath: string }) {
  return (
    <ProfileAuthGate
      currentPath={currentPath}
      title="Clinic team"
      description="Tenant-safe membership summary for the current clinic. Ownership changes are not self-service."
    >
      <ProfileSubnav active="team" />
      <p className="ehas2-field__hint">
        Membership list loads from <code>/clinics/current/memberships</code> after auth. Ordinary
        doctors cannot alter memberships.
      </p>
    </ProfileAuthGate>
  );
}
