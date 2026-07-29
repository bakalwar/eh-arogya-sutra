import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EHAS2Logo } from '../../components/brand/EHAS2Logo';
import { OtpVerificationForm } from '../../components/entry/OtpVerificationForm';
import { SkipLink } from '../../components/a11y/SkipLink';
import { Surface, PageHeader } from '../../components/ui/Primitives';

export const metadata: Metadata = {
  title: 'Verify OTP · E.H. AROGYA SUTRA 2',
  description: 'OTP verification UI preview — no real OTP delivery.',
};

export default function VerifyOtpPage() {
  return (
    <div className="ehas2-auth-layout">
      <SkipLink />
      <main id="main-content" className="ehas2-auth-card" tabIndex={-1}>
        <Surface>
          <div style={{ display: 'grid', justifyItems: 'center', gap: '0.75rem' }}>
            <EHAS2Logo size={64} priority />
            <PageHeader
              title="OTP verification"
              description="UI preview only. No SMS is sent and no backend verification occurs."
            />
          </div>
          <Suspense fallback={<p role="status">Loading OTP preview…</p>}>
            <OtpVerificationForm />
          </Suspense>
        </Surface>
      </main>
    </div>
  );
}
