'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { DoctorShell } from '../shell/DoctorShell';
import { PreviewModeBanner } from '../entry/PreviewModeBanner';
import { AUTH_PREVIEW_BANNER, UI_PREVIEW_SESSION_LABEL } from '../../lib/authPreview';
import { SYNTHETIC_DEMO_PROFILE } from '../../lib/profileApi';
import { PageHeader, Surface, StatusPill } from '../ui/Primitives';
import { Button } from '../ui/Button';

export function ProfileAuthGate({
  currentPath,
  title,
  description,
  children,
}: {
  currentPath: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <DoctorShell currentPath={currentPath}>
      <PreviewModeBanner message={`${UI_PREVIEW_SESSION_LABEL} · ${AUTH_PREVIEW_BANNER}`} />
      <div className="ehas2-dashboard-grid ehas2-profile-grid">
        <PageHeader title={title} description={description} />
        <Surface>
          <div className="ehas2-profile-status" role="status">
            <StatusPill label="Authentication · NOT_CONNECTED" tone="warning" />
            <StatusPill label="Profile API · fail-closed" tone="warning" />
            <StatusPill label="Uploads · NOT_ACTIVE" tone="neutral" />
          </div>
          <p className="ehas2-field__hint">
            Protected profile APIs return <strong>AUTH_NOT_CONNECTED</strong> until Phase 4
            authentication is approved and wired. This UI does not pretend a real doctor is logged
            in and does not write professional or clinic data to localStorage or PostgreSQL.
          </p>
          {children}
        </Surface>
        <Surface>
          <h2 className="ehas2-profile-subhead">SYNTHETIC_DEMO illustration</h2>
          <p className="ehas2-field__hint">{SYNTHETIC_DEMO_PROFILE.note}</p>
          <dl className="ehas2-profile-dl">
            <div>
              <dt>Display name</dt>
              <dd>{SYNTHETIC_DEMO_PROFILE.displayName}</dd>
            </div>
            <div>
              <dt>Title (demo)</dt>
              <dd>{SYNTHETIC_DEMO_PROFILE.professionalTitle}</dd>
            </div>
            <div>
              <dt>Clinic (demo)</dt>
              <dd>{SYNTHETIC_DEMO_PROFILE.clinicName}</dd>
            </div>
          </dl>
        </Surface>
      </div>
    </DoctorShell>
  );
}

export function ProfileSubnav({ active }: { active: string }) {
  const links = [
    { id: 'profile', href: '/profile', label: 'My Profile' },
    { id: 'edit', href: '/profile/edit', label: 'Edit' },
    { id: 'qualifications', href: '/profile/qualifications', label: 'Qualifications' },
    { id: 'registrations', href: '/profile/registrations', label: 'Registrations' },
    { id: 'prescriber', href: '/profile/prescriber-preview', label: 'Prescriber preview' },
    { id: 'clinic', href: '/clinic/settings', label: 'Clinic settings' },
    { id: 'hours', href: '/clinic/hours', label: 'Clinic hours' },
    { id: 'team', href: '/clinic/team', label: 'Clinic team' },
  ];
  return (
    <nav className="ehas2-profile-subnav" aria-label="Profile sections">
      {links.map((link) => (
        <Link
          key={link.id}
          href={link.href}
          className={
            active === link.id
              ? 'ehas2-profile-subnav__link is-active'
              : 'ehas2-profile-subnav__link'
          }
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function ProfileReadonlyFormNotice() {
  return (
    <p className="ehas2-field__hint" role="note">
      Forms are interactive for layout QA only. Submit stays blocked with a truthful NOT_CONNECTED
      outcome — no fake success toast and no local persistence of sensitive profile fields.
    </p>
  );
}

export function BlockedSubmitButton({ label }: { label: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        /* intentionally no network / no toast success */
      }}
      aria-describedby="profile-submit-blocked"
    >
      {label} (blocked · NOT_CONNECTED)
    </Button>
  );
}
