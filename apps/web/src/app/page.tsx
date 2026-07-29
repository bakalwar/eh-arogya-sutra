import Link from 'next/link';
import { PublicShell } from '../components/shell/PublicShell';
import { Button } from '../components/ui/Button';
import { Badge, PageHeader, Surface } from '../components/ui/Primitives';

export default function HomePage() {
  return (
    <PublicShell>
      <section className="ehas2-hero">
        <PageHeader
          title="E.H. AROGYA SUTRA 2"
          description="UI Foundation — Clinical Engine · Not Connected. No patient workflow is active."
        />
        <p className="ehas2-hindi">आरोग्य सूत्र २ — डिज़ाइन सिस्टम पूर्वावलोकन</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
          <Link href="/ui-foundation">
            <Button variant="primary">Open design system preview</Button>
          </Link>
          <Link href="/app">
            <Button variant="secondary">Doctor shell demo</Button>
          </Link>
          <Badge>Phase 1B</Badge>
        </div>
      </section>
      <Surface>
        <p>
          This is a responsive application shell only. Disease data, medicine registry,
          authentication, payments, and live Super Admin monitoring are not integrated.
        </p>
      </Surface>
    </PublicShell>
  );
}
