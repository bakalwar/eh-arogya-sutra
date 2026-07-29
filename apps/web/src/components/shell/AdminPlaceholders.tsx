import type { ReactNode } from 'react';
import { NotImplementedNotice } from '../ui/Primitives';

export function AdminShell({ children }: { children?: ReactNode }) {
  return (
    <div>
      <NotImplementedNotice feature="AdminShell" />
      {children}
    </div>
  );
}

export function SuperAdminShell() {
  return (
    <div data-ehas2-super-admin-shell="not-implemented">
      <NotImplementedNotice feature="SuperAdminShell" />
      <p>Separate control plane — not exposed in doctor UI (Phase 9/14).</p>
    </div>
  );
}
