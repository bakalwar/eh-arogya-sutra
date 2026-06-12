'use strict';

const axios = require('axios');

const BASE = 'http://127.0.0.1:5000';

async function main() {
  const login = await axios.post(`${BASE}/api/auth/login`, {
    mobile: '9876543210',
    password: 'demo123'
  });
  const token =
    login.data?.token || login.data?.data?.accessToken || login.data?.accessToken;
  const client = axios.create({
    baseURL: BASE,
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true
  });

  // Flat payload like broken sessionStorage (only eh_analysis)
  const flat = {
    eh_analysis: {
      prakriti: { prakriti: 'Sanguine' },
      polarity: { polarity: 'POSITIVE' },
      potency: { potency: 'D10' },
      mixtures: [{ label: 'MIXTURE A', formula: 'A1+A2' }],
      active_systems: ['GASTRIC']
    },
    mixtures: [{ label: 'MIXTURE A', formula: 'A1+A2' }],
    name: 'Test Patient',
    chief_complaint: 'pet dard, gas'
  };

  const r1 = await client.post('/api/summary/generate', { caseData: flat });
  console.log('flat caseData status:', r1.status, r1.data?.message || 'ok');

  // Empty wrapper
  const r2 = await client.post('/api/summary/generate', flat);
  console.log('flat body (no wrapper) status:', r2.status, r2.data?.message || 'ok');

  // Only mixtures no symptoms
  const r3 = await client.post('/api/summary/eh-api', {
    caseData: { eh_analysis: { mixtures: [] }, mixtures: [] }
  });
  console.log('empty eh only status:', r3.status, r3.data?.message || 'ok');

  const r4 = await client.post('/api/summary/eh-api', { caseData: flat });
  console.log('eh-api flat status:', r4.status, r4.data?.data?.source || r4.data?.message);
  console.log('summary len:', (r4.data?.data?.summary || '').length);
}

main().catch((e) => console.error(e.message));
