import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocalPreviewAllowed } from '../../lib/preview/previewGate';
import { PREVIEW_CATALOG, PREVIEW_GROUPS } from '../../lib/preview/previewCatalog';
import { PageHeader, Surface } from '../../components/ui/Primitives';

export const metadata: Metadata = {
  title: 'Local Preview Gallery · E.H. AROGYA SUTRA 2',
  description: 'Local-only synthetic UI preview — not clinical output, not saved.',
  robots: { index: false, follow: false },
};

export default function PreviewGalleryPage() {
  if (!isLocalPreviewAllowed(process.env)) {
    notFound();
  }

  return (
    <main id="main-content" className="ehas2-preview-gallery" tabIndex={-1}>
      <PageHeader
        title="Local preview gallery"
        description="Synthetic UI inspection only. Phase 4B OTP is HOLD. Authentication is not live. Clinical engine is not connected."
      />
      <Surface>
        <ul className="ehas2-preview-truths">
          <li>No Principal / TenantContext / session cookies</li>
          <li>No PostgreSQL writes · no OTP · no engine · no payment · no uploads</li>
          <li>DoctorShell never lists Management Admin or Super Admin</li>
          <li>Production mode returns PREVIEW_NOT_AVAILABLE / 404</li>
        </ul>
      </Surface>
      {PREVIEW_GROUPS.map((group) => {
        const items = PREVIEW_CATALOG.filter((i) => i.group === group.id);
        if (items.length === 0) return null;
        return (
          <section key={group.id} className="ehas2-preview-group" aria-labelledby={`g-${group.id}`}>
            <h2 id={`g-${group.id}`}>{group.label}</h2>
            <div className="ehas2-preview-cards">
              {items.map((item) => (
                <article key={item.id} className="ehas2-preview-card">
                  <h3>
                    <Link href={item.href}>{item.title}</Link>
                  </h3>
                  <p>{item.description}</p>
                  <p className="ehas2-field__hint">
                    Shell: {item.shell} · href: {item.href}
                  </p>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
