import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveHealthUrl } from '../api/resolveApiBase';

/**
 * API health — dev: Vite proxy /health; production browser: same-origin /health (Vercel rewrite).
 */
export function useApiHealth(pollMs = 30000) {
  const [status, setStatus] = useState('checking');
  const failStreakRef = useRef(0);

  const check = useCallback(async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(resolveHealthUrl(), { signal: ctrl.signal, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.status === 'OK' || data?.status === 'ok') {
          clearTimeout(t);
          setStatus('ok');
          failStreakRef.current = 0;
          return true;
        }
      }
    } catch {
      /* down */
    }
    clearTimeout(t);
    setStatus('down');
    failStreakRef.current += 1;
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer;

    const schedule = () => {
      const delay =
        failStreakRef.current === 0
          ? pollMs
          : Math.min(pollMs * 2 ** Math.min(failStreakRef.current, 3), 20000);
      timer = setTimeout(async () => {
        if (cancelled) return;
        await check();
        schedule();
      }, delay);
    };

    (async () => {
      for (let i = 0; i < 8 && !cancelled; i++) {
        const ok = await check();
        if (ok) break;
        await new Promise((r) => setTimeout(r, 1000 + i * 400));
      }
      if (!cancelled) schedule();
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [check, pollMs]);

  return { apiReady: status === 'ok', apiStatus: status, recheckApi: check };
}
