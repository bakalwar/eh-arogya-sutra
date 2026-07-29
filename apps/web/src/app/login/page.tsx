import type { Metadata } from 'next';
import { EHAS2Logo } from '../../components/brand/EHAS2Logo';
import { LoginForm } from '../../components/entry/LoginForm';
import { SkipLink } from '../../components/a11y/SkipLink';
import { Surface, PageHeader } from '../../components/ui/Primitives';

export const metadata: Metadata = {
  title: 'Doctor Login · E.H. AROGYA SUTRA 2',
  description: 'Doctor login UI preview — authentication service is not connected.',
};

export default function LoginPage() {
  return (
    <div className="ehas2-auth-layout">
      <SkipLink />
      <main id="main-content" className="ehas2-auth-card" tabIndex={-1}>
        <Surface>
          <div style={{ display: 'grid', justifyItems: 'center', gap: '0.75rem' }}>
            <EHAS2Logo size={72} priority />
            <PageHeader
              title="Doctor login"
              description="Enter your mobile number. Authentication service is not connected."
            />
          </div>
          <LoginForm />
        </Surface>
      </main>
    </div>
  );
}
