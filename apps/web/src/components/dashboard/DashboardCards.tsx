import { Surface } from '../ui/Primitives';

export function IntegrationStatusCard({ label, value }: { label: string; value: string }) {
  return (
    <Surface>
      <article className="ehas2-integration-card">
        <h3>{label}</h3>
        <p>
          <strong>{value}</strong>
        </p>
      </article>
    </Surface>
  );
}

export function DashboardStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Surface>
      <article className="ehas2-stat-card">
        <h3>{label}</h3>
        <strong>{value}</strong>
      </article>
    </Surface>
  );
}

export function QuickActionCard({
  label,
  href,
  comingPhase,
}: {
  label: string;
  href: string;
  comingPhase: string;
}) {
  return (
    <a className="ehas2-action-card ehas2-surface" href={href}>
      <article>
        <h3>{label}</h3>
        <p>Coming in {comingPhase}</p>
      </article>
    </a>
  );
}

export function RecentPatientsEmptyState() {
  return (
    <Surface>
      <h3>Recent patients</h3>
      <p>No patients yet. Patient records arrive in Phase 1C-B.</p>
    </Surface>
  );
}

export function RecentActivityEmptyState() {
  return (
    <Surface>
      <h3>Recent activity</h3>
      <p>No activity yet. Clinical actions are not connected in this preview.</p>
    </Surface>
  );
}
