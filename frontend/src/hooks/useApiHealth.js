import { useCallback, useEffect, useRef, useState } from 'react';

function apiBase() {
  return (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
}

/** Health URL: production → Railway/direct base; dev → Vite proxy /health */
function healthUrl() {
  const base = apiBase();
  if (base) return `${base}/health`;
  return '/health';
}

/**
 * API health — dev: Vite proxy /health; production: VITE_API_BASE/health or /health (Vercel rewrite).
 */
export function useApiHealth(pollMs = 30000) {
  const [status, setStatus] = useState('checking');
  const failStreakRef = useRef(0);

  const check = useCallback(async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(healthUrl(), { signal: ctrl.signal });
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
      for (let i = 0; i < 12 && !cancelled; i++) {
        const ok = await check();
        if (ok) break;
        await new Promise((r) => setTimeout(r, 1500 + i * 500));
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
