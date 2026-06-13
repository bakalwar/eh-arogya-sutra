import { Suspense } from 'react';
import SignupForm from './SignupForm';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="eh-mock-root login-page" style={{ minHeight: '100vh' }} />}>
      <SignupForm />
    </Suspense>
  );
}
