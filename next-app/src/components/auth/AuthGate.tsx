'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { appEnv } from '@/lib/api/config';
import {
  hasLocalDevAuthGrace,
  isAuthenticated,
  isLocalLanDev,
  verifySession,
} from '@/lib/session/tokenManager';

/** Local dev: skip blocking session probe — dashboard mounts immediately (LAN/mobile safe). */
const isLocalApp =
  appEnv === 'local' ||
  process.env.NODE_ENV === 'development';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(isLocalApp);
  const [checking, setChecking] = useState(!isLocalApp);

  useEffect(() => {
    if (isLocalApp) return;

    let cancelled = false;

    async function runCheck(attempt = 0) {
      setChecking(true);

      if (isAuthenticated()) {
        if (!cancelled) {
          setReady(true);
          setChecking(false);
        }
        return;
      }

      const ok = await verifySession();
      if (cancelled) return;

      if (ok) {
        setReady(true);
        setChecking(false);
        return;
      }

      if (isLocalLanDev() && attempt < 2) {
        await new Promise((r) => window.setTimeout(r, 350));
        if (!cancelled) return runCheck(attempt + 1);
        return;
      }

      if (hasLocalDevAuthGrace() && isLocalLanDev()) {
        setReady(true);
        setChecking(false);
        return;
      }

      setReady(false);
      setChecking(false);
      router.replace(`/login?next=${encodeURIComponent(pathname || '/overview')}`);
    }

    runCheck();

    const onFocus = () => {
      if (!ready && (isAuthenticated() || hasLocalDevAuthGrace())) {
        setReady(true);
      }
    };
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [router, pathname, ready]);

  if (!isLocalApp && (checking || !ready)) {
    return (
      <div
        className="eh-mock-root"
        style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}
      >
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Checking session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
