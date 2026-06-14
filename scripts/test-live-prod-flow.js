'use strict';

/**
 * Live production smoke: Vercel login → search analyze → summary → stack-status
 * Run: node scripts/test-live-prod-flow.js
 */
const VERCEL = (process.env.VERCEL_APP || 'https://eh-arogya-sutra.vercel.app').replace(/\/$/, '');
const RAILWAY = (process.env.RAILWAY_API || 'https://eh-arogya-api-production.up.railway.app').replace(/\/$/, '');
const MOBILE = process.env.DEMO_MOBILE || '9876543210';
const PASSWORD = process.env.DEMO_PASSWORD || 'demo123';

const caseInput = {
  name: 'Ram Sharma',
  patient: { name: 'Ram Sharma', age: 45, gender: 'Male', bp_systolic: 140, bp_diastolic: 90 },
  chief_complaint: 'bukhar, khansi, gale mein dard, 5 din se',
  duration_days: 5,
  phase: 'ACUTE',
  condition: 'acute',
};

async function fetchJson(url, opts = {}, label = url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { _raw: text.slice(0, 300) };
    }
    return { ok: res.ok, status: res.status, json, label };
  } catch (err) {
    return { ok: false, status: 0, json: { error: err.message }, label };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const results = [];

  console.log('=== Railway health ===');
  const health = await fetchJson(`${RAILWAY}/health`);
  results.push({ step: 'railway-health', ...health });
  console.log(health.status, health.json.status || health.json.message || health.json.error);

  console.log('\n=== Vercel login page ===');
  const loginPage = await fetchJson(`${VERCEL}/login`, { method: 'GET' });
  results.push({ step: 'vercel-login-page', status: loginPage.status, ok: loginPage.status === 200 });
  console.log(loginPage.status, loginPage.json._raw ? 'HTML OK' : loginPage.json.message);

  console.log('\n=== Vercel POST /api/auth/login ===');
  const login = await fetchJson(`${VERCEL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: MOBILE, password: PASSWORD }),
  });
  results.push({ step: 'vercel-login-api', ...login });
  const token = login.json?.data?.token || login.json?.token;
  console.log(login.status, login.json.message || login.json.error);
  if (!token) {
    console.error('No JWT — cannot continue authenticated tests.');
    printSummary(results);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  console.log('\n=== Summary without auth (expect 401, not 404) ===');
  const summaryNoAuth = await fetchJson(`${VERCEL}/api/summary/eh-api`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseData: {} }),
  });
  results.push({ step: 'summary-no-auth', ...summaryNoAuth });
  console.log(summaryNoAuth.status, summaryNoAuth.json.message || summaryNoAuth.json.error || summaryNoAuth.json._raw?.slice?.(0, 80));

  console.log('\n=== Railway search analyze (direct) ===');
  const analyzeRailway = await fetchJson(`${RAILWAY}/api/search/analyze`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(caseInput),
  });
  results.push({ step: 'railway-analyze', ...analyzeRailway });
  console.log(analyzeRailway.status, analyzeRailway.json.message || analyzeRailway.json.pipeline || analyzeRailway.json.error);

  console.log('\n=== Vercel same-origin summary (with auth) ===');
  const eh = analyzeRailway.json?.data?.eh_analysis || {};
  const caseData = {
    patient: analyzeRailway.json?.data?.patient || caseInput.patient,
    analysis: analyzeRailway.json?.data?.analysis || {},
    eh_analysis: eh,
    expert: analyzeRailway.json?.data?.expert,
    medicines: analyzeRailway.json?.data?.medicines,
    mixtures: eh.mixtures,
    chief_complaint: caseInput.chief_complaint,
  };
  const summary = await fetchJson(`${VERCEL}/api/summary/eh-api`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ caseData }),
  });
  results.push({ step: 'vercel-summary-auth', ...summary });
  const summaryText =
    summary.json?.clinical_summary ||
    summary.json?.summary ||
    summary.json?.data?.clinical_summary ||
    '';
  console.log(summary.status, summary.json.message || summary.json.detail || (summaryText ? `OK ${summaryText.slice(0, 80)}...` : summary.json.error));

  console.log('\n=== Railway stack-status ===');
  const stack = await fetchJson(`${RAILWAY}/api/summary/stack-status`);
  results.push({ step: 'stack-status', ...stack });
  console.log(stack.status, stack.json?.data?.label || stack.json.message || stack.json.error);

  printSummary(results);
  const failed = results.filter((r) => {
    if (r.step === 'summary-no-auth') return r.status === 404;
    if (r.step === 'vercel-summary-auth') return r.status !== 200 && r.status !== 201;
    if (r.step === 'railway-analyze') return r.status !== 200;
    if (r.step === 'vercel-login-api') return r.status !== 200;
    if (r.step === 'railway-health') return r.status !== 200;
    return false;
  });
  process.exit(failed.length ? 1 : 0);
}

function printSummary(results) {
  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    const pass =
      r.step === 'summary-no-auth'
        ? r.status === 401
        : r.step === 'vercel-summary-auth'
          ? r.status === 200 || r.status === 201
          : r.ok;
    console.log(`${pass ? 'PASS' : 'FAIL'} ${r.step}: HTTP ${r.status}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
