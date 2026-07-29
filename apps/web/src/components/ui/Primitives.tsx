import type { ReactNode } from 'react';

export function Badge({ children }: { children: ReactNode }) {
  return <span className="ehas2-badge">{children}</span>;
}

export function StatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'warning' | 'ok';
}) {
  const text = tone === 'ok' ? 'Available' : tone === 'warning' ? 'Attention' : 'Status';
  return (
    <span className="ehas2-status-pill">
      <span className="ehas2-status-pill__dot" aria-hidden="true" />
      <span className="ehas2-status-pill__label">{label}</span>
      <span className="ehas2-sr-only">{text}</span>
    </span>
  );
}

export function Divider() {
  return <hr className="ehas2-divider" />;
}

export function Surface({ children }: { children: ReactNode }) {
  return <div className="ehas2-surface">{children}</div>;
}

export function Skeleton({ width = '100%', height = '1rem' }: { width?: string; height?: string }) {
  return <span className="ehas2-skeleton" style={{ width, height }} aria-hidden="true" />;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="ehas2-empty" role="status">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

export function ErrorState({
  title,
  body,
  supportId,
}: {
  title: string;
  body: string;
  supportId?: string;
}) {
  return (
    <div className="ehas2-error" role="alert">
      <strong>{title}</strong>
      <p>{body}</p>
      {supportId ? <p>Support ID: {supportId}</p> : null}
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div className="ehas2-offline" role="status">
      <strong>Offline</strong>
      <p>Network unavailable. Changes are not syncing.</p>
    </div>
  );
}

export function NotImplementedNotice({ feature }: { feature: string }) {
  return (
    <div className="ehas2-not-implemented" role="status">
      <strong>{feature}</strong>
      <p>NOT_IMPLEMENTED — UI foundation only. No clinical functionality.</p>
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="ehas2-page-header">
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </header>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="ehas2-breadcrumbs">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
            {index < items.length - 1 ? <span aria-hidden="true"> / </span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
