import type { ReactNode } from 'react';

export function SkipLink() {
  return (
    <a className="ehas2-skip" href="#main-content">
      Skip to content
    </a>
  );
}

export function ScreenReaderText({ children }: { children: ReactNode }) {
  return <span className="ehas2-sr-only">{children}</span>;
}
