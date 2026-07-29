'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { MANAGEMENT_NAV_ITEMS } from '../../config/managementNavigation';
import { AppShell } from '../shell/AppShell';
import { TopBar } from '../shell/TopBar';
import { StatusPill } from '../ui/Primitives';

type ManagementShellProps = {
  children: ReactNode;
  currentPath: string;
};

/**
 * Management Admin shell — separate from Doctor workspace.
 * Placeholder pages only; services are not connected.
 * Does not include Super Admin /ops controls.
 */
export function ManagementShell({ children, currentPath }: ManagementShellProps) {
  return (
    <AppShell
      topBar={<TopBar title="Management Admin · not connected" />}
      sidebar={
        <nav className="ehas2-sidebar" aria-label="Management Admin">
          <p className="ehas2-sidebar__brand">Management Admin</p>
          <ul className="ehas2-sidebar__list">
            {MANAGEMENT_NAV_ITEMS.map((item) => {
              const active = currentPath === item.href;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={active ? 'ehas2-nav-link ehas2-nav-link--active' : 'ehas2-nav-link'}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      }
    >
      <div className="ehas2-status-strip" aria-label="Management status">
        <StatusPill label="Management services not connected" tone="warning" />
        <StatusPill label="No live Management login" tone="warning" />
      </div>
      {children}
    </AppShell>
  );
}
