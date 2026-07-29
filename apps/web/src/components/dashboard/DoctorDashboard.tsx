'use client';

import { useEffect, useState } from 'react';
import { DoctorShell } from '../shell/DoctorShell';
import { PreviewModeBanner } from '../entry/PreviewModeBanner';
import { DEMO_DOCTOR_NAME, UI_PREVIEW_SESSION_LABEL } from '../../lib/authPreview';
import { DASHBOARD_INTEGRATION_STATUS } from '../../config/systemStatus';
import { QUICK_ACTIONS } from '../../config/navigation';
import {
  DashboardStatCard,
  IntegrationStatusCard,
  QuickActionCard,
  RecentActivityEmptyState,
  RecentPatientsEmptyState,
} from './DashboardCards';
import { ProblemReportDialog } from './ProblemReportDialog';
import { PageHeader, Surface } from '../ui/Primitives';

export function DoctorDashboard({ currentPath }: { currentPath: string }) {
  const [today, setToday] = useState('Loading date…');

  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    );
  }, []);

  return (
    <DoctorShell currentPath={currentPath}>
      <PreviewModeBanner message={`${UI_PREVIEW_SESSION_LABEL} · ${DEMO_DOCTOR_NAME}`} />
      <div className="ehas2-dashboard-grid">
        <PageHeader
          title={`Namaste, ${DEMO_DOCTOR_NAME}`}
          description={`${today} · UI preview session — authentication is not active.`}
        />

        <section aria-label="System integration status" className="ehas2-integration-grid">
          {DASHBOARD_INTEGRATION_STATUS.map((item) => (
            <IntegrationStatusCard key={item.id} label={item.label} value={item.value} />
          ))}
        </section>

        <section aria-label="Today summary" className="ehas2-stat-row">
          <DashboardStatCard label="Today’s Patients" value={0} />
          <DashboardStatCard label="Pending Analyses" value={0} />
          <DashboardStatCard label="Subscription" value="Preview" />
          <DashboardStatCard label="Support" value="Local only" />
        </section>

        <section aria-label="Quick actions" className="ehas2-action-row">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard
              key={action.id}
              label={action.label}
              href={action.href}
              comingPhase={action.comingPhase}
            />
          ))}
        </section>

        <RecentPatientsEmptyState />
        <RecentActivityEmptyState />

        <Surface>
          <h3>Service status summary</h3>
          <p>
            Clinical engine, disease/medicine packages, payment, and monitoring remain disconnected.
            Future authentication guards will protect `/dashboard` after Phase 2.
          </p>
          <p>
            <a className="ehas2-nav-link" href="/feedback">
              Feedback &amp; Support
            </a>
          </p>
          <ProblemReportDialog />
        </Surface>
      </div>
    </DoctorShell>
  );
}
