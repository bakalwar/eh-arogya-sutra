'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { appEnv } from '@/lib/api/config';
import { isAuthenticated, verifySession } from '@/lib/session/tokenManager';

const isLocalApp = appEnv === 'local';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(isLocalApp);
  const checkedRef = useRef(isLocalApp);

  useEffect(() => {
    if (isLocalApp || checkedRef.current) return;

    let cancelled = false;

    async function runCheck() {
      if (isAuthenticated()) {
        if (!cancelled) {
          checkedRef.current = true;
          setReady(true);
        }
        return;
      }

      const ok = await verifySession();
      if (cancelled) return;

      if (ok) {
        checkedRef.current = true;
        setReady(true);
        return;
      }

      router.replace(`/login?next=${encodeURIComponent(pathname || '/overview')}`);
    }

    runCheck();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!isLocalApp && !ready) {
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
