import axios from 'axios';
import { getValidToken, clearSession } from '../security/tokenManager';

/** Default API calls (login, lists, save) */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30000;

/** Ollama / long reports — backend can take several minutes (must override instance 30s default) */
export const LONG_REQUEST_TIMEOUT_MS =
  Number(import.meta.env.VITE_API_LONG_TIMEOUT_MS) || 300000;

/** Step 3.4 Ollama+book summary — CPU par 4–8 min; must exceed Vite proxy (vite.config.js) */
export const EXPERT_CLINICAL_TIMEOUT_MS =
  Number(import.meta.env.VITE_API_EXPERT_CLINICAL_TIMEOUT_MS) || 600000;

const LONG_TIMEOUT_PATHS = [
  '/api/summary/generate',
  '/api/reports/analyze',
  '/api/expert/analyze',
  '/api/expert/summary',
  '/api/search/analyze-complete',
  '/api/search/analyze'
];

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || '',
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' }
});

function isAuthUrl(url) {
  const u = String(url || '');
  return (
    u.includes('/api/auth/login') ||
    u.includes('/api/auth/verify-otp') ||
    u.includes('/api/auth/refresh') ||
    u.includes('/api/super-admin/login')
  );
}

function redirectToLogin() {
  const path = window.location.pathname;
  if (path.startsWith('/super-admin')) {
    if (path !== '/super-admin/login') window.location.href = '/super-admin/login';
    return;
  }
  if (path.startsWith('/admin')) {
    if (path !== '/admin/login') window.location.href = '/admin/login';
    return;
  }
  if (path === '/login' || path === '/register') return;
  window.location.href = '/login';
}

client.interceptors.request.use(async (config) => {
  const url = String(config.url || '');
  /* Instance default is 30s — axios merges it before interceptor, so ?? would never bump to long */
  if (url.includes('/api/summary/expert-clinical')) {
    config.timeout = EXPERT_CLINICAL_TIMEOUT_MS;
  } else if (LONG_TIMEOUT_PATHS.some((p) => url.includes(p))) {
    config.timeout = LONG_REQUEST_TIMEOUT_MS;
  }
  if (!isAuthUrl(config.url)) {
    const token = await getValidToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    const url = original?.url || '';

    if (err.response?.status === 401 && !isAuthUrl(url) && original && !original._retry) {
      original._retry = true;
      const token = await getValidToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      }
      clearSession();
      redirectToLogin();
    } else if (err.response?.status === 401 && !isAuthUrl(url)) {
      clearSession();
      redirectToLogin();
    }

    if (err.response?.status === 429) {
      const retryAfter = err.response?.headers?.['retry-after'];
      err.message =
        retryAfter
          ? `Bahut zyada requests (429) — ${retryAfter} second baad dubara try karein.`
          : 'Bahut zyada requests (429) — 1-2 minute ruk kar page refresh karein, phir सार dubara banayein.';
    } else if (err.response?.status === 502 || err.response?.status === 504) {
      const reqUrl = String(err.config?.url || '');
      if (reqUrl.includes('/api/search/')) {
        err.message =
          '502 — Backend बंद है (port 5000)। Terminal में `npm run dev` restart करें; 5–10 सेकंड रुककर Dubara Analyze।';
      } else if (reqUrl.includes('/api/summary/expert-clinical')) {
        err.message =
          '502 Bad Gateway — backend/Ollama कनेक्शन टूटा। `npm run dev` restart + `ollama serve`, फिर Dubara सारांश।';
      }
    } else if (!err.response && (err.code === 'ERR_NETWORK' || /ECONNREFUSED|Network Error/i.test(err.message || ''))) {
      const reqUrl = String(err.config?.url || '');
      if (reqUrl.includes('/api/')) {
        err.message =
          'Backend से कनेक्ट नहीं — `npm run dev` चलाएं (API port 5000)। Vite चल रहा हो तो API crash हो सकता है; terminal देखें।';
      }
    } else if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
      const reqUrl = String(err.config?.url || '');
      if (reqUrl.includes('/api/summary/expert-clinical')) {
        err.message =
          'Request time out — Ollama सारांश अभी भी चल रहा हो सकता है। `ollama serve` चलाएं, 5–8 मिनट रुककर «Dubara सारांश» दबाएं। frontend/.env: `VITE_API_EXPERT_CLINICAL_TIMEOUT_MS=720000` फिर Vite restart (`npm run dev:web`).';
      } else if (reqUrl.includes('/api/summary/generate') || reqUrl.includes('/api/expert/summary')) {
        err.message =
          'Request time out — Ollama summary 2–4 min tak lag sakti hai. Thodi der baad dubara try karein; `ollama serve` chal raha ho. `.env`: `VITE_API_LONG_TIMEOUT_MS` badha sakte hain.';
      } else if (reqUrl.includes('/api/expert/analyze')) {
        err.message =
          'Request time out — EH Expert Engine (Python) check karein: alag terminal mein `npm run expert-engine`, phir dubara try karein.';
      } else if (reqUrl.includes('/api/reports/analyze')) {
        err.message = 'Request time out — report analyze dubara try karein.';
      } else {
        err.message = 'Request time out — dubara try karein. `npm run dev` aur network check karein.';
      }
    }

    return Promise.reject(err);
  }
);

export default client;
