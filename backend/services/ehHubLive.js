/**
 * Live hub: repo file watching + SSE broadcast + optional autoLog append to work-log.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const WORK_LOG = path.join(ROOT, 'local-site/eh-arogya/data/work-log.json');
const AGENT_NOW = path.join(ROOT, 'local-site/eh-arogya/data/agent-now.txt');

const WATCH_DIRS = [
  path.join(ROOT, 'frontend/src'),
  path.join(ROOT, 'backend'),
  path.join(ROOT, 'local-site/eh-arogya/data')
];

const IGNORE_SUB = ['node_modules', '.git', 'dist', 'uploads', '.cursor'];

/** @type {Set<import('http').ServerResponse>} */
const sseClients = new Set();

/** @type {{ path: string, at: string }[]} */
const recentRing = [];
const RING_MAX = 40;

let lastAgentLine = '';
let persistTimer = null;
let pendingPaths = new Set();

function safeRel(fullPath) {
  const r = path.relative(ROOT, fullPath).split(path.sep).join('/');
  return r || fullPath;
}

function shouldIgnore(rel) {
  const lower = rel.replace(/\\/g, '/').toLowerCase();
  return IGNORE_SUB.some((s) => lower.includes(`/${s}/`) || lower.startsWith(`${s}/`));
}

function broadcast(obj) {
  const payload = `data: ${JSON.stringify(obj)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  }
}

/** @type {NodeJS.Timeout | null} */
let broadcastDebounce = null;

function broadcastDebounced(obj) {
  if (broadcastDebounce) clearTimeout(broadcastDebounce);
  broadcastDebounce = setTimeout(() => {
    broadcastDebounce = null;
    broadcast(obj);
  }, 350);
}

function pushChange(relPath) {
  if (!relPath || shouldIgnore(relPath)) return;
  if (relPath.endsWith('work-log.json') && pendingPaths.has('__writing_log__')) return;

  const row = { path: relPath, at: new Date().toISOString() };
  recentRing.push(row);
  while (recentRing.length > RING_MAX) recentRing.shift();

  broadcastDebounced({ type: 'repo_change', recent: recentRing.slice(-20), lastPath: relPath });

  pendingPaths.add(relPath);
  schedulePersist();
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(flushAutoLog, 45000);
}

function flushAutoLog() {
  persistTimer = null;
  const paths = Array.from(pendingPaths).filter((p) => p && p !== '__writing_log__');
  paths.forEach((p) => pendingPaths.delete(p));
  if (paths.length === 0) return;

  try {
    pendingPaths.add('__writing_log__');
    const raw = fs.readFileSync(WORK_LOG, 'utf8');
    const j = JSON.parse(raw);
    j.autoLog = Array.isArray(j.autoLog) ? j.autoLog : [];
    const sample = paths.slice(0, 8);
    j.autoLog.push({
      at: new Date().toISOString(),
      summary: `Repo: ${paths.length} path(s) updated`,
      paths: sample
    });
    while (j.autoLog.length > 50) j.autoLog.shift();
    j.updatedAt = new Date().toISOString();
    fs.writeFileSync(WORK_LOG, `${JSON.stringify(j, null, 2)}\n`, 'utf8');
    broadcast({ type: 'log_refresh' });
  } catch (e) {
    console.warn('[eh-hub] autoLog persist failed:', e.message);
  } finally {
    pendingPaths.delete('__writing_log__');
  }
}

function readAgentNow() {
  try {
    if (!fs.existsSync(AGENT_NOW)) return '';
    return fs.readFileSync(AGENT_NOW, 'utf8').trim().slice(0, 500);
  } catch {
    return '';
  }
}

function getMergedLog() {
  let base = { title: '', links: [], entries: [], autoLog: [], updatedAt: null };
  try {
    base = JSON.parse(fs.readFileSync(WORK_LOG, 'utf8'));
  } catch {
    /* empty */
  }
  const agent = readAgentNow();
  if (agent !== lastAgentLine) {
    lastAgentLine = agent;
  }
  const manualCount = (base.entries || []).length;
  const autoCount = (base.autoLog || []).length;
  return {
    ...base,
    live: {
      recentChanges: recentRing.slice(-25),
      agentNow: agent || null,
      serverTime: new Date().toISOString(),
      sseClients: sseClients.size,
      progressHint: {
        diaryEntries: manualCount,
        autoSnapshots: autoCount
      }
    }
  };
}

function attachSse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: 'hello', merged: getMergedLog().live })}\n\n`);
  const keep = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      clearInterval(keep);
      sseClients.delete(res);
    }
  }, 25000);
  res.on('close', () => {
    clearInterval(keep);
    sseClients.delete(res);
  });
}

function watchDir(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    fs.watch(dir, { recursive: true }, (event, fname) => {
      if (!fname) return;
      const full = path.join(dir, fname);
      let rel = safeRel(full);
      if (rel.startsWith('..')) rel = fname;
      if (fname === 'agent-now.txt' || rel.endsWith('agent-now.txt')) {
        const line = readAgentNow();
        broadcast({ type: 'agent_now', line });
        return;
      }
      if (fname === 'work-log.json' || rel.endsWith('work-log.json')) {
        broadcast({ type: 'log_refresh' });
        return;
      }
      pushChange(rel);
    });
  } catch (e) {
    console.warn('[eh-hub] watch failed for', dir, e.message);
  }
}

function startEhHubWatcher() {
  if (process.env.EH_HUB_WATCH === '0') {
    console.log('[eh-hub] file watcher disabled (EH_HUB_WATCH=0)');
    return;
  }
  for (const d of WATCH_DIRS) {
    watchDir(d);
  }
  console.log('[eh-hub] watching repo for live dashboard + autoLog');
}

function setAgentLine(line) {
  try {
    fs.mkdirSync(path.dirname(AGENT_NOW), { recursive: true });
    fs.writeFileSync(AGENT_NOW, String(line || '').trim().slice(0, 500), 'utf8');
    broadcast({ type: 'agent_now', line: readAgentNow() });
  } catch (e) {
    console.warn('[eh-hub] agent-now write failed:', e.message);
  }
}

module.exports = {
  getMergedLog,
  attachSse,
  startEhHubWatcher,
  broadcast,
  setAgentLine,
  WORK_LOG,
  AGENT_NOW
};
