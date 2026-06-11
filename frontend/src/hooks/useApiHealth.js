import { useCallback, useEffect, useRef, useState } from 'react';
import client from '../api/client';

const DEV_DIRECT_HEALTH =
  import.meta.env.DEV &&
  (import.meta.env.VITE_API_PROXY_TARGET || `http://${window.location.hostname}:5000`).replace(/\/$/, '') +
    '/health';

/**
 * API health — dev mein seedha port 5000 check (Vite proxy spam avoid).
 */
export function useApiHealth(pollMs = 30000) {
  const [status, setStatus] = useState('checking');
  const failStreakRef = useRef(0);

  const check = useCallback(async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      // 1. Try proxy path (most reliable, avoids CORS issues)
      const proxyRes = await fetch('/health', { signal: ctrl.signal });
      if (proxyRes.ok) {
        const data = await proxyRes.json().catch(() => ({}));
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
