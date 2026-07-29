'use client';

import { ManagementShell } from './ManagementShell';
import { EmptyState, PageHeader, Surface } from '../ui/Primitives';

export function ManagementPlaceholderPage({
  currentPath,
  title,
  moduleLabel,
}: {
  currentPath: string;
  title: string;
  moduleLabel: string;
}) {
  return (
    <ManagementShell currentPath={currentPath}>
      <div className="ehas2-dashboard-grid">
        <PageHeader
          title={title}
          description="Protected Management Admin placeholder — not a live dashboard."
        />
        <Surface>
          <EmptyState
            title={`${moduleLabel} not connected`}
            body="Management services are not connected. No invented metrics or live data are shown."
          />
          <p role="status">
            Authorization policies apply on the API. Frontend visibility is UX only.
          </p>
        </Surface>
      </div>
    </ManagementShell>
  );
}
