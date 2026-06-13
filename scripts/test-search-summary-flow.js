'use strict';

/**
 * End-to-end: Search Engine → EH API (9 Rule Engines) → Summary
 * Run: node scripts/test-search-summary-flow.js
 */
const NODE = process.env.NODE_API || 'http://127.0.0.1:5000';
const PYTHON = process.env.EH_API || 'http://127.0.0.1:8005';

const caseInput = {
  name: 'Ram Sharma',
  patient: {
    name: 'Ram Sharma',
    age: 45,
    gender: 'Male',
    bp_systolic: 140,
    bp_diastolic: 90,
  },
  chief_complaint: 'bukhar, khansi, gale mein dard, 5 din se',
  duration_days: 5,
  phase: 'ACUTE',
  condition: 'acute',
};

async function main() {
  console.log('=== Step 1: Node Search Engine → EH API /api/v3/prescribe (9 Rule Engines) ===');
  const analyzeRes = await fetch(`${NODE}/api/search/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(caseInput),
  });
  const analyzeJson = await analyzeRes.json();
  if (!analyzeRes.ok || !analyzeJson.success) {
    console.error('Analyze FAILED:', analyzeRes.status, analyzeJson.message || analyzeJson);
    process.exit(1);
  }
  const data = analyzeJson.data || {};
  const eh = data.eh_analysis || {};
  console.log('OK pipeline:', analyzeJson.pipeline || 'eh-api-9engine-prescribe');
  console.log('Prakriti:', eh.prakriti?.prakriti || eh.prakriti || '—');
  console.log('Polarity:', eh.polarity?.polarity || eh.polarity || '—');
  console.log('Potency:', eh.potency?.potency || eh.potency || '—');
  console.log('Active systems:', (eh.active_systems || []).slice(0, 5).join(', ') || '—');
  console.log('Mixtures:', Array.isArray(eh.mixtures) ? eh.mixtures.length : 0);

  console.log('\n=== Step 2: EH API POST /api/summary/eh-api (summary_engine.py) ===');
  const caseData = {
    patient: data.patient || caseInput.patient,
    analysis: data.analysis || {},
    eh_analysis: eh,
    expert: data.expert,
    medicines: data.medicines,
    mixtures: eh.mixtures || data.mixtures,
    chief_complaint: caseInput.chief_complaint,
  };

  const summaryRes = await fetch(`${PYTHON}/api/summary/eh-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EH_API_KEY || 'EH_TEST_KEY_2026',
    },
    body: JSON.stringify({ caseData }),
  });
  const summaryJson = await summaryRes.json();
  if (!summaryRes.ok) {
    console.error('Summary FAILED:', summaryRes.status, summaryJson.detail || summaryJson.message || summaryJson);
    process.exit(1);
  }

  const summaryText =
    summaryJson.clinical_summary ||
    summaryJson.summary ||
    summaryJson.eh_analysis?.clinical_summary ||
    summaryJson.parcha ||
    '';
  const words = summaryText.trim().split(/\s+/).filter(Boolean).length;
  console.log('OK status:', summaryJson.status || summaryJson.ok || 'success');
  console.log('Summary words:', words);
  console.log('Prakriti (summary):', summaryJson.prakriti || eh.prakriti?.prakriti || '—');
  console.log('\n--- Summary preview (first 800 chars) ---\n');
  console.log(summaryText.slice(0, 800));
  console.log('\n--- End preview ---\n');

  console.log('=== Step 3: Node stack-status (EH API health via BFF) ===');
  try {
    const st = await fetch(`${NODE}/api/summary/stack-status`);
    const stJson = await st.json();
    console.log(stJson.data?.label || stJson);
  } catch (e) {
    console.log('stack-status skip:', e.message);
  }

  console.log('\nRESULT: Search → 9 Rule Engines → Summary pipeline WORKING locally.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
