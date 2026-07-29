import type { ReactNode } from 'react';
import { AppShell } from './AppShell';
import { TopBar } from './TopBar';
import { SYSTEM_STATUS_LABELS } from '../../config/systemStatus';
import { StatusPill } from '../ui/Primitives';

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <AppShell topBar={<TopBar title="E.H. AROGYA SUTRA 2" />}>
      <div className="ehas2-status-strip" aria-label="System status">
        {SYSTEM_STATUS_LABELS.slice(1).map((label) => (
          <StatusPill key={label} label={label} tone="warning" />
        ))}
      </div>
      {children}
    </AppShell>
  );
}
