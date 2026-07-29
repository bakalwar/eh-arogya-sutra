import type { ReactNode } from 'react';
import { SkipLink } from '../a11y/SkipLink';
import { TopBar } from './TopBar';

type AppShellProps = {
  children: ReactNode;
  topBar?: ReactNode;
  sidebar?: ReactNode;
  tabletNav?: ReactNode;
  mobileNav?: ReactNode;
};

export function AppShell({ children, topBar, sidebar, tabletNav, mobileNav }: AppShellProps) {
  return (
    <div className="ehas2-shell">
      <SkipLink />
      {topBar ?? <TopBar />}
      {tabletNav}
      <div className="ehas2-shell__body">
        {sidebar}
        <main id="main-content" className="ehas2-main" tabIndex={-1}>
          {children}
        </main>
      </div>
      {mobileNav}
    </div>
  );
}
