'use strict';

const axios = require('axios');

const BASE = process.env.API_BASE || 'http://127.0.0.1:5000';

async function main() {
  console.log('=== Summary flow test ===');
  console.log('API:', BASE);

  const login = await axios.post(`${BASE}/api/auth/login`, {
    mobile: '9876543210',
    password: 'demo123'
  });
  const token =
    login.data?.token || login.data?.data?.accessToken || login.data?.accessToken;
  if (!token) {
    console.error('Login failed:', login.data);
    process.exit(1);
  }
  console.log('Login OK');

  const client = axios.create({
    baseURL: BASE,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 120000,
    validateStatus: () => true
  });

  const analyze = await client.post('/api/search/analyze-complete', {
    patient_name: 'Ram Sharma',
    age: 45,
    gender: 'Male',
    bp_systolic: 155,
    bp_diastolic: 95,
    chief_complaint: 'shir dard, pet me dard, gas, ghabrahat',
    phase: 'ACUTE',
    duration_days: 7,
    condition: 'acute'
  });

  console.log('analyze-complete status:', analyze.status);
  if (analyze.status !== 200 || !analyze.data?.success) {
    console.error('analyze failed:', analyze.data);
    process.exit(1);
  }

  const payload = analyze.data.data || {};
  const summaryFromAnalyze =
    payload.clinical_summary ||
    payload.summary ||
    payload.eh_analysis?.clinical_summary ||
    payload.eh_analysis?.parcha ||
    '';
  console.log('Summary from analyze length:', summaryFromAnalyze.length);
  console.log('Has EH AROGYA SUTRA:', summaryFromAnalyze.includes('EH AROGYA SUTRA'));
  console.log('Pipeline:', analyze.data.pipeline);
  console.log('Mixtures count:', (payload.mixtures || []).length);

  const caseData = {
    patient: payload.patient,
    analysis: payload.analysis,
    expert: payload.expert,
    eh_analysis: payload.eh_analysis,
    mixtures: payload.mixtures,
    medicines: payload.medicines,
    clinical_summary: payload.clinical_summary,
    summary: payload.summary
  };

  const expertClinical = await client.post('/api/summary/expert-clinical', { caseData }, {
    timeout: 300000
  });
  console.log('expert-clinical status:', expertClinical.status);
  if (expertClinical.status !== 200) {
    console.error('expert-clinical failed:', expertClinical.data);
  } else {
    const s = expertClinical.data?.data?.summary || '';
    console.log('expert-clinical summary length:', s.length);
    console.log('source:', expertClinical.data?.data?.source);
    console.log('summary_via:', expertClinical.data?.data?.summary_via);
    console.log('preview:', s.slice(0, 400).replace(/\n/g, ' '));
  }

  const generate = await client.post('/api/summary/generate', { caseData }, {
    timeout: 300000
  });
  console.log('generate status:', generate.status);
  if (generate.status !== 200) {
    console.error('generate failed:', generate.data);
  } else {
    const s = generate.data?.data?.summary || '';
    console.log('generate summary length:', s.length);
    console.log('source:', generate.data?.data?.source);
    console.log('preview:', s.slice(0, 400).replace(/\n/g, ' '));
  }
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
