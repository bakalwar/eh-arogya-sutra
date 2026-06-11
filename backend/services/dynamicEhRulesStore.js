'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RULES_PATH = path.join(__dirname, '../data/dynamicEhRules.json');
const DEFAULT_PATH = path.join(__dirname, '../data/dynamicEhRules.default.json');

let _cache = null;
let _cacheMtime = 0;

/** Ollama batch duplicates — disabled so seed/high-priority rules win */
const GHOST_RULE_IDS = new Set([
  'block_electricity',
  'block_electricity_1',
  'block_dilute_high_bp',
  'D4_D6_D10_D30',
  'eh_climate_cold_region_positive_bias'
]);

function clearDynamicRulesCache() {
  _cache = null;
  _cacheMtime = 0;
}

function applyGhostRulePurge(rules = []) {
  return rules.map((r) => {
    if (!GHOST_RULE_IDS.has(r.id)) return r;
    return {
      ...r,
      enabled: false,
      _purgedGhost: true,
      _purgeReason: 'Duplicate Ollama extract — superseded by high_bp_block_re_prefer_be / norm_low_bp rules'
    };
  });
}

function readJsonSafe(p, fallback) {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    /* */
  }
  return fallback;
}

function defaultStore() {
  return readJsonSafe(DEFAULT_PATH, { version: 1, rules: [] });
}

function loadDynamicEhRules({ force = false } = {}) {
  if (!force && _cache) {
    try {
      const mt = fs.statSync(RULES_PATH).mtimeMs;
      if (mt === _cacheMtime) return _cache;
    } catch {
      return _cache;
    }
  }

  const custom = readJsonSafe(RULES_PATH, null);
  const seed = defaultStore();
  const base = custom?.rules?.length ? custom : seed;
  const byId = new Map();
  for (const r of seed.rules || []) {
    if (r?.id) byId.set(r.id, { ...r, enabled: r.enabled !== false });
  }
  for (const r of base.rules || []) {
    if (!r?.id) continue;
    const prev = byId.get(r.id);
    byId.set(r.id, {
      ...prev,
      ...r,
      enabled: r.enabled !== false,
      if: { ...prev?.if, ...r.if },
      then: { ...prev?.then, ...r.then }
    });
  }
  _cache = {
    version: base.version || 1,
    updatedAt: base.updatedAt || seed.updatedAt,
    source: base.source || seed.source,
    rules: applyGhostRulePurge([...byId.values()]).sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    )
  };

  try {
    _cacheMtime = fs.statSync(RULES_PATH).mtimeMs;
  } catch {
    _cacheMtime = 0;
  }
  return _cache;
}

function normalizeRule(raw, index = 0) {
  const id =
    String(raw.id || raw.rule_id || `rule_${index}_${Date.now()}`)
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 64) || `rule_${crypto.randomBytes(4).toString('hex')}`;

  const flatIf = raw.if && typeof raw.if === 'object' ? raw.if : raw;
  const flatThen = raw.then && typeof raw.then === 'object' ? raw.then : {};

  const iff = {};
  const keys = [
    'bp_systolic_gte',
    'bp_systolic_gt',
    'bp_systolic_lte',
    'bp_systolic_lt',
    'bp_diastolic_gte',
    'bp_diastolic_lte',
    'polarity_in',
    'phase_in',
    'symptoms_any',
    'symptoms_all',
    'temperament_in'
  ];
  keys.forEach((k) => {
    if (flatIf[k] != null) iff[k] = flatIf[k];
  });

  const then = {};
  [
    'block_electricity',
    'force_electricity',
    'prefer_electricity',
    'force_potency',
    'set_potency_max',
    'set_potency_min',
    'note_hi',
    'water_instruction_hi'
  ].forEach((k) => {
    if (flatThen[k] != null) then[k] = flatThen[k];
  });

  return {
    id,
    enabled: raw.enabled !== false,
    priority: Number(raw.priority) || 50,
    if: iff,
    then,
    rationale_hi: String(raw.rationale_hi || raw.rationale || then.note_hi || '').trim(),
    source: raw.source || 'ollama-extract',
    createdAt: raw.createdAt || new Date().toISOString()
  };
}

function mergeRules(existing, incoming) {
  const map = new Map((existing || []).map((r) => [r.id, r]));
  for (let i = 0; i < (incoming || []).length; i += 1) {
    const n = normalizeRule(incoming[i], i);
    const prev = map.get(n.id);
    map.set(n.id, prev ? { ...prev, ...n, if: { ...prev.if, ...n.if }, then: { ...prev.then, ...n.then } } : n);
  }
  return [...map.values()].sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

function saveDynamicEhRules(rules, meta = {}) {
  fs.mkdirSync(path.dirname(RULES_PATH), { recursive: true });
  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    source: meta.source || 'ai-auto-rule-generator',
    extractedFrom: meta.extractedFrom || null,
    ruleCount: rules.length,
    rules: rules.map((r, i) => normalizeRule(r, i))
  };
  fs.writeFileSync(RULES_PATH, JSON.stringify(payload, null, 2), 'utf8');
  clearDynamicRulesCache();
  return payload;
}

function appendExtractedRules(newRules, meta = {}) {
  clearDynamicRulesCache();
  const current = loadDynamicEhRules({ force: true });
  const merged = mergeRules(current.rules || [], newRules);
  return saveDynamicEhRules(merged, meta);
}

function updateRuleEnabled(ruleId, enabled) {
  const id = String(ruleId || '').trim();
  if (!id) throw new Error('Rule id required');

  const store = loadDynamicEhRules({ force: true });
  const idx = store.rules.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error(`Rule not found: ${id}`);

  const rules = store.rules.map((r) =>
    r.id === id ? { ...r, enabled: enabled !== false } : r
  );
  const saved = saveDynamicEhRules(rules, {
    source: store.source || 'admin-ui',
    extractedFrom: 'toggle'
  });
  const rule = saved.rules.find((r) => r.id === id);
  return { rule, store: saved };
}

function bulkUpdateRulesEnabled(updates = []) {
  const map = new Map(
    (updates || [])
      .filter((u) => u?.id != null)
      .map((u) => [String(u.id).trim(), u.enabled !== false])
  );
  if (!map.size) throw new Error('No rule updates provided');

  const store = loadDynamicEhRules({ force: true });
  const rules = store.rules.map((r) =>
    map.has(r.id) ? { ...r, enabled: map.get(r.id) } : r
  );
  const saved = saveDynamicEhRules(rules, {
    source: store.source || 'admin-ui',
    extractedFrom: 'bulk-toggle'
  });
  return {
    updated: [...map.keys()],
    store: saved
  };
}

module.exports = {
  RULES_PATH,
  GHOST_RULE_IDS,
  loadDynamicEhRules,
  saveDynamicEhRules,
  appendExtractedRules,
  mergeRules,
  normalizeRule,
  defaultStore,
  updateRuleEnabled,
  bulkUpdateRulesEnabled,
  clearDynamicRulesCache,
  applyGhostRulePurge
};
