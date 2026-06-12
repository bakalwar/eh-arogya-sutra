import axios from 'axios';
import { getValidToken, clearSession } from '../security/tokenManager';
import { resolveApiBase } from './resolveApiBase';
import { SUMMARY_EH_API_PATH, SUMMARY_EH_API_ALIASES } from './summaryEndpoints';

/** Default API calls (login, lists, save) */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30000;

/** Long API calls — reports, search analyze */
export const LONG_REQUEST_TIMEOUT_MS =
  Number(import.meta.env.VITE_API_LONG_TIMEOUT_MS) ||
  Number(import.meta.env.VITE_API_TIMEOUT) ||
  Number(import.meta.env.VITE_SUMMARY_TIMEOUT) ||
  300000;

/** EH API clinical summary — can take several minutes; must exceed Vite proxy (vite.config.js) */
export const EXPERT_CLINICAL_TIMEOUT_MS =
  Number(import.meta.env.VITE_API_EXPERT_CLINICAL_TIMEOUT_MS) ||
  Number(import.meta.env.VITE_SUMMARY_TIMEOUT) ||
  Number(import.meta.env.VITE_API_TIMEOUT) ||
  600000;

const SUMMARY_TIMEOUT_PATHS = [
  SUMMARY_EH_API_PATH,
  ...SUMMARY_EH_API_ALIASES,
  '/api/summary/expert-clinical'
];

const LONG_TIMEOUT_PATHS = [
  ...SUMMARY_TIMEOUT_PATHS,
  '/api/reports/analyze',
  '/api/expert/analyze',
  '/api/expert/summary',
  '/api/search/analyze-complete',
  '/api/search/analyze'
];

const client = axios.create({
  baseURL: resolveApiBase(),
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' }
});

function isAuthUrl(url) {
  const u = String(url || '');
  return (
    u.includes('/api/auth/login') ||
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
  if (SUMMARY_TIMEOUT_PATHS.some((p) => url.includes(p))) {
    config.timeout = EXPERT_CLINICAL_TIMEOUT_MS;
  } else if (LONG_TIMEOUT_PATHS.some((p) => url.includes(p))) {
    config.timeout = LONG_REQUEST_TIMEOUT_MS;
  }
  /* Let the browser set multipart boundary — default application/json breaks file uploads */
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
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
        err.message = import.meta.env.PROD
          ? 'Server se connect nahi ho paya. Internet check karein aur thodi der baad dubara try karein.'
          : 'Backend se connect nahi — npm run dev chalayein (API port 5000). Terminal mein error dekhein.';
      }
    } else if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
      const reqUrl = String(err.config?.url || '');
      if (reqUrl.includes('/api/summary/expert-clinical')) {
        err.message =
          'Request time out — Ollama सारांश अभी भी चल रहा हो सकता है। `ollama serve` चलाएं, 5–8 मिनट रुककर «Dubara सारांश» दबाएं। frontend/.env: `VITE_API_EXPERT_CLINICAL_TIMEOUT_MS=720000` फिर Vite restart (`npm run dev:web`).';
      } else if (
        reqUrl.includes(SUMMARY_EH_API_PATH) ||
        SUMMARY_EH_API_ALIASES.some((p) => reqUrl.includes(p)) ||
        reqUrl.includes('/api/expert/summary')
      ) {
        err.message =
          'Request time out — EH API summary 2–5 min tak lag sakti hai. `npm run expert-engine` chal raha ho, thodi der baad «Dubara सारांश» dubara try karein. `.env`: `VITE_API_EXPERT_CLINICAL_TIMEOUT_MS` badha sakte hain.';
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
