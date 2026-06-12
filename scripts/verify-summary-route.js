'use strict';

/**
 * Verify POST /api/summary/eh-api exists on Node backend (port 5000).
 * Usage: node scripts/verify-summary-route.js [baseUrl]
 */
const axios = require('axios');

const BASE = (process.argv[2] || process.env.API_BASE || 'http://127.0.0.1:5000').replace(/\/$/, '');

async function main() {
  console.log('Verifying summary routes at', BASE);

  const routes = await axios.get(`${BASE}/api/summary/routes`, { validateStatus: () => true });
  console.log('GET /api/summary/routes:', routes.status, routes.data?.data?.primary || routes.data?.message);

  const getEh = await axios.get(`${BASE}/api/summary/eh-api`, { validateStatus: () => true });
  console.log('GET /api/summary/eh-api:', getEh.status, '(expect 405)');

  const login = await axios.post(`${BASE}/api/auth/login`, {
    mobile: '9876543210',
    password: 'demo123'
  });
  const token = login.data?.token;
  if (!token) {
    console.error('Login failed');
    process.exit(1);
  }

  const post = await axios.post(
    `${BASE}/api/summary/eh-api`,
    {
      caseData: {
        name: 'Verify Patient',
        chief_complaint: 'headache, gas',
        eh_analysis: { mixtures: [{ label: 'A', formula: 'A1' }] }
      }
    },
    {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
      timeout: 120000
    }
  );
  console.log('POST /api/summary/eh-api:', post.status, post.data?.data?.source || post.data?.message);
  if (post.status === 404) {
    console.error('FAIL — route missing on Node backend');
    process.exit(1);
  }
  if (post.status !== 200) {
    console.error('Unexpected status');
    process.exit(1);
  }
  console.log('OK — summary length:', (post.data?.data?.summary || '').length);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
