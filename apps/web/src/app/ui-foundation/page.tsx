import { jupiterColors } from '@ehas2/design-system';
import { PublicShell } from '../../components/shell/PublicShell';
import { Button } from '../../components/ui/Button';
import {
  Badge,
  Breadcrumbs,
  Divider,
  EmptyState,
  ErrorState,
  NotImplementedNotice,
  OfflineBanner,
  PageHeader,
  Skeleton,
  StatusPill,
  Surface,
} from '../../components/ui/Primitives';

export default function UiFoundationPage() {
  return (
    <PublicShell>
      <PageHeader
        title="DESIGN SYSTEM PREVIEW — NO CLINICAL FUNCTIONALITY"
        description="Typography, color, controls, and foundational states for Phase 1B. Not the final dashboard."
      />
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'UI Foundation' }]} />

      <div className="ehas2-preview-grid">
        <Surface>
          <h2>Typography</h2>
          <p style={{ fontFamily: 'var(--ehas2-font-display)', fontSize: '1.5rem' }}>
            Plus Jakarta Sans — Display
          </p>
          <p style={{ fontFamily: 'var(--ehas2-font-body)' }}>
            Inter — Body copy for clinical UI chrome.
          </p>
          <p className="ehas2-hindi">Noto Sans Devanagari — नमस्ते · आरोग्य सूत्र</p>
          <p>Hinglish example: Naya case shuru karein · Reports check karein</p>
        </Surface>

        <Surface>
          <h2>Colors</h2>
          <div className="ehas2-swatch-row">
            {Object.entries(jupiterColors).map(([name, value]) => (
              <div key={name} title={`${name} ${value}`}>
                <div className="ehas2-swatch" style={{ background: value }} />
                <small>{name}</small>
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <h2>Controls</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Badge>Badge</Badge>
            <StatusPill label="UI Foundation" />
          </div>
          <Divider />
          <Skeleton width="60%" height="1.25rem" />
        </Surface>

        <EmptyState title="Empty" body="No synthetic records to show." />
        <ErrorState title="Error" body="Something went wrong." supportId="SUP-DEMO-1" />
        <OfflineBanner />
        <NotImplementedNotice feature="Clinical analysis" />
      </div>
    </PublicShell>
  );
}
