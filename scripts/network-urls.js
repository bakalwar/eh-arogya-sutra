'use strict';

const os = require('os');

function getLanIPv4() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

function buildMobileDevUrls(ports = {}) {
  const ip = getLanIPv4();
  const vite = ports.vite ?? 5178;
  const next = ports.next ?? 3001;
  const api = ports.api ?? 5000;
  const python = ports.python ?? 8005;

  if (!ip) {
    return {
      ip: null,
      vite: `http://127.0.0.1:${vite}`,
      next: `http://127.0.0.1:${next}`,
      api: `http://127.0.0.1:${api}`,
      python: `http://127.0.0.1:${python}`,
    };
  }

  return {
    ip,
    vite: `http://${ip}:${vite}`,
    next: `http://${ip}:${next}`,
    api: `http://${ip}:${api}`,
    python: `http://${ip}:${python}`,
  };
}

function printMobileDevBanner(ports = {}) {
  const urls = buildMobileDevUrls(ports);
  const nextPort = ports.next ?? 3001;
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  E.H. AROGYA SUTRA — PRIMARY APP (Next.js :3001)');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Laptop (Local):     http://localhost:${nextPort}/`);
  console.log(`  Laptop (127.0.0.1): http://127.0.0.1:${nextPort}/`);
  if (urls.ip) {
    console.log(`  Phone (Network):    ${urls.next}/`);
    console.log(`  Network IP:         ${urls.ip}`);
  } else {
    console.log('  Phone: connect PC to Wi‑Fi — LAN IP not detected.');
  }
  console.log('');
  console.log('  Opens Report Analysis at /  →  /reports');
  console.log('  Also: /overview  |  /login  |  /symptom-search  |  /case-summary');
  console.log('  APIs proxy via Next — Node :5000 + Python :8005 run in background.');
  console.log('  Tip: Allow Node.js + Python through Windows Firewall (Private network).');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
}

function printDevUrls(ports = {}) {
  printMobileDevBanner(ports);
}

module.exports = { getLanIPv4, buildMobileDevUrls, printMobileDevBanner, printDevUrls };
