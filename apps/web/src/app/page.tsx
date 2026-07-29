import { DESIGN_SYSTEM_VERSION } from '@ehas2/design-system';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 720 }}>
      <h1 style={{ fontFamily: 'var(--ehas2-font-display)' }}>E.H. AROGYA SUTRA 2</h1>
      <p>Phase 1A — engineering foundation. No clinical features.</p>
      <ul>
        <li>Design system: {DESIGN_SYSTEM_VERSION}</li>
        <li>API namespace (future): {EHAS2_API_NAMESPACE}</li>
      </ul>
    </main>
  );
}
