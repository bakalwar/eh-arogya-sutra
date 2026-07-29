import { redirect } from 'next/navigation';

/** Compatibility redirect from Phase 1B demo path. */
export default function AppRedirectPage() {
  redirect('/dashboard');
}
