import type { ReactNode } from 'react';
import { AppShell } from './AppShell';
import { TopBar } from './TopBar';
import { DesktopSidebar, MobileBottomNav, TabletNavigation } from './DoctorNavigation';
import { SYSTEM_STATUS_LABELS } from '../../config/systemStatus';
import { StatusPill } from '../ui/Primitives';

type DoctorShellProps = {
  children: ReactNode;
  currentPath: string;
};

export function DoctorShell({ children, currentPath }: DoctorShellProps) {
  return (
    <AppShell
      topBar={<TopBar title="Doctor workspace" />}
      sidebar={<DesktopSidebar currentPath={currentPath} />}
      tabletNav={<TabletNavigation currentPath={currentPath} />}
      mobileNav={<MobileBottomNav currentPath={currentPath} />}
    >
      <div className="ehas2-status-strip" aria-label="System status">
        {SYSTEM_STATUS_LABELS.slice(2).map((label) => (
          <StatusPill key={label} label={label} tone="warning" />
        ))}
      </div>
      {children}
    </AppShell>
  );
}
