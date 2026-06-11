'use strict';

const { loadDynamicEhRules } = require('./dynamicEhRulesStore');

const ELECTRICITY_LABELS = {
  RE: 'RE (लाल विद्युत)',
  BE: 'BE (नीली विद्युत)',
  WE: 'WE (सफेद विद्युत)',
  GE: 'GE (हरी विद्युत)',
  YE: 'YE (पीली विद्युत)'
};

function cleanMasterElectricity(raw) {
  let s = String(raw || '').trim();
  if (!s) return ELECTRICITY_LABELS.WE;
  if (s.includes('+')) s = s.split('+')[0].trim();
  const codes = [...s.matchAll(/\b(RE|BE|WE|GE|YE)\b/gi)].map((m) => m[1].toUpperCase());
  if (codes.length >= 1) return ELECTRICITY_LABELS[codes[0]] || s;
  return s;
}

function normalizePolarityKey(polarityState) {
  const p = String(polarityState || '');
  if (/HYPO|निष्क्रिय|शिथिल/i.test(p)) return 'HYPO';
  if (/HYPER|उग्र|अति-सक्रिय/i.test(p)) return 'HYPER';
  if (/POSITIVE|सकारात्मक/i.test(p)) return 'POSITIVE';
  if (/NEGATIVE|ऋणात्मक/i.test(p)) return 'NEGATIVE';
  return 'MIXED';
}

function elecCodes(raw) {
  const s = String(raw || '');
  const m = s.match(/\b(RE|BE|WE|GE|YE)\b/gi);
  return m ? [...new Set(m.map((c) => c.toUpperCase()))] : [];
}

function matchesList(text, keywords = []) {
  const t = String(text || '').toLowerCase();
  return (keywords || []).some((k) => {
    const kw = String(k).toLowerCase().trim();
    if (!kw) return false;
    if (/^[a-z]{2,5}$/.test(kw)) {
      return new RegExp(`(^|[^a-z])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i').test(t);
    }
    return t.includes(kw);
  });
}

function polarityMatches(condList, polarityKey) {
  const pk = normalizePolarityKey(polarityKey);
  const set = new Set((condList || []).map(normalizePolarityKey));
  if (set.has(pk)) return true;
  if (pk === 'HYPER' && set.has('POSITIVE')) return true;
  if (pk === 'POSITIVE' && set.has('HYPER')) return true;
  if (pk === 'HYPO' && set.has('NEGATIVE')) return true;
  if (pk === 'NEGATIVE' && set.has('HYPO')) return true;
  return false;
}

function matchCondition(ifBlock, ctx) {
  const cond = ifBlock || {};
  const { sys, dia, polarityKey, phase, symptomText, temperament } = ctx;

  const hasIf =
    cond.bp_systolic_gte != null ||
    cond.bp_systolic_gt != null ||
    cond.bp_systolic_lte != null ||
    cond.bp_systolic_lt != null ||
    cond.bp_diastolic_gte != null ||
    cond.bp_diastolic_lte != null ||
    (cond.polarity_in?.length > 0) ||
    (cond.phase_in?.length > 0) ||
    (cond.temperament_in?.length > 0) ||
    (cond.symptoms_any?.length > 0) ||
    (cond.symptoms_all?.length > 0);

  if (!hasIf) return true;

  if (cond.bp_systolic_gte != null && !(sys >= Number(cond.bp_systolic_gte))) return false;
  if (cond.bp_systolic_gt != null && !(sys > Number(cond.bp_systolic_gt))) return false;
  if (cond.bp_systolic_lte != null && !(sys <= Number(cond.bp_systolic_lte))) return false;
  if (cond.bp_systolic_lt != null && !(sys < Number(cond.bp_systolic_lt))) return false;
  if (cond.bp_diastolic_gte != null && !(dia >= Number(cond.bp_diastolic_gte))) return false;
  if (cond.bp_diastolic_lte != null && !(dia <= Number(cond.bp_diastolic_lte))) return false;

  if (cond.polarity_in?.length && !polarityMatches(cond.polarity_in, polarityKey)) {
    return false;
  }
  if (cond.phase_in?.length) {
    const ph = String(phase || '').toUpperCase().replace(/-/g, '_');
    if (!cond.phase_in.map((p) => String(p).toUpperCase().replace(/-/g, '_')).includes(ph)) {
      return false;
    }
  }
  if (cond.temperament_in?.length && temperament) {
    if (
      !cond.temperament_in.some((t) =>
        String(temperament).toLowerCase().includes(String(t).toLowerCase())
      )
    ) {
      return false;
    }
  }
  if (cond.symptoms_any?.length && !matchesList(symptomText, cond.symptoms_any)) return false;
  if (cond.symptoms_all?.length && !cond.symptoms_all.every((k) => matchesList(symptomText, [k]))) {
    return false;
  }

  return true;
}

function isBlockedElectricity(currentElec, blockList = []) {
  const current = elecCodes(currentElec);
  const blocks = (blockList || []).flatMap((b) => elecCodes(b));
  return current.some((c) => blocks.includes(c));
}

function pickPreferredElectricity(preferList = []) {
  const p = preferList[0];
  if (!p) return null;
  const code = elecCodes(p)[0];
  return ELECTRICITY_LABELS[code] || String(p);
}

function ruleTouchesElectricity(then = {}) {
  return Boolean(
    then.force_electricity ||
      then.prefer_electricity?.length ||
      then.block_electricity?.length
  );
}

function ruleTouchesPotency(then = {}) {
  return Boolean(then.force_potency || then.set_potency_max || then.set_potency_min);
}

function applyThenElectricity(masterElectricity, then = {}) {
  let out = masterElectricity;
  if (then.block_electricity?.length && isBlockedElectricity(out, then.block_electricity)) {
    if (then.force_electricity) {
      out = pickPreferredElectricity([then.force_electricity]) || out;
    } else if (then.prefer_electricity?.length) {
      out = pickPreferredElectricity(then.prefer_electricity) || out;
    }
  } else if (then.force_electricity) {
    out = pickPreferredElectricity([then.force_electricity]) || out;
  } else if (then.prefer_electricity?.length) {
    out = pickPreferredElectricity(then.prefer_electricity) || out;
  }
  return out;
}

/**
 * Apply book-derived dynamic IF/THEN rules — primary source of truth.
 * Highest-priority matching rule wins for potency/electricity/water conflicts.
 */
function applyDynamicEhRules(baseRules, input = {}) {
  const store = loadDynamicEhRules();
  const sysRaw = input.bp_systolic;
  const diaRaw = input.bp_diastolic;
  const sys = Number.isFinite(Number(sysRaw)) ? Number(sysRaw) : 120;
  const dia = Number.isFinite(Number(diaRaw)) ? Number(diaRaw) : 80;

  const symptoms = (input.symptoms || []).map((s) =>
    typeof s === 'object' ? s.name || s.hindi || '' : String(s)
  );
  const symptomText = symptoms.join(' ').toLowerCase();
  const phase = String(input.phase || 'ACUTE').toUpperCase().replace(/-/g, '_');

  const ctx = {
    sys,
    dia,
    polarityKey: normalizePolarityKey(baseRules.polarityState),
    phase,
    symptomText,
    temperament: input.temperament || ''
  };

  const matching = (store.rules || [])
    .filter((rule) => rule.enabled !== false && matchCondition(rule.if, ctx))
    .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0));

  let calculatedPotency = baseRules.calculatedPotency || baseRules.potency || 'D10';
  let masterElectricity = baseRules.masterElectricity || baseRules.electricity || ELECTRICITY_LABELS.WE;
  let waterInstruction = baseRules.waterInstruction;
  const applied = [];

  const bestPotRule = matching.find((r) => ruleTouchesPotency(r.then));
  const bestElecRule = matching.find((r) => ruleTouchesElectricity(r.then));
  const bestWaterRule = matching.find((r) => r.then?.water_instruction_hi);

  if (bestPotRule?.then) {
    const then = bestPotRule.then;
    if (then.force_potency) calculatedPotency = then.force_potency;
    if (then.set_potency_max) {
      const order = ['D4', 'D6', 'D10', 'D30'];
      const cur = order.indexOf(calculatedPotency);
      const max = order.indexOf(then.set_potency_max);
      if (cur > max && max >= 0) calculatedPotency = then.set_potency_max;
    }
  }

  if (bestElecRule?.then) {
    masterElectricity = applyThenElectricity(masterElectricity, bestElecRule.then);
  }

  if (bestWaterRule?.then?.water_instruction_hi) {
    waterInstruction = bestWaterRule.then.water_instruction_hi;
  }

  for (const rule of matching) {
    applied.push({
      id: rule.id,
      priority: rule.priority,
      note_hi: rule.then?.note_hi || rule.rationale_hi || ''
    });
  }

  const hasApplicableClinicalRule = Boolean(bestElecRule || bestPotRule);

  if (!hasApplicableClinicalRule) {
    const baselinePot = baseRules.calculatedPotency || baseRules.potency;
    const baselineElec = baseRules.masterElectricity || baseRules.electricity;
    const elecOk = baselineElec && /\b(RE|BE|WE|GE|YE)\b/i.test(String(baselineElec));

    if (baselinePot && elecOk) {
      const cleaned = cleanMasterElectricity(baselineElec);
      return {
        ...baseRules,
        calculatedPotency: baselinePot,
        potency: baselinePot,
        masterElectricity: cleaned,
        electricity: cleaned,
        waterInstruction: waterInstruction || baseRules.waterInstruction,
        dynamicRulesApplied: [
          ...applied,
          {
            id: 'vitals_baseline_clinical',
            priority: 50,
            note_hi: 'वाइटल्स-आधारित पोटेंसी/विद्युत (JSON rule lock नहीं — EH इंजन डॉक्टर विवेक)'
          }
        ],
        dynamicRulesPrimary: true,
        electricityLockedByDynamic: false,
        vitalsBaselineFallback: true,
        hasApplicableClinicalRule: true,
        noApplicableRule: false
      };
    }

    return {
      ...baseRules,
      calculatedPotency: null,
      potency: null,
      masterElectricity: null,
      electricity: null,
      waterInstruction: null,
      dynamicRulesApplied: applied,
      dynamicRulesPrimary: true,
      electricityLockedByDynamic: false,
      hasApplicableClinicalRule: false,
      noApplicableRule: true
    };
  }

  masterElectricity = cleanMasterElectricity(masterElectricity);

  return {
    ...baseRules,
    calculatedPotency,
    potency: calculatedPotency,
    masterElectricity,
    electricity: masterElectricity,
    waterInstruction: waterInstruction || baseRules.waterInstruction,
    dynamicRulesApplied: applied,
    dynamicRulesPrimary: true,
    electricityLockedByDynamic: Boolean(bestElecRule),
    hasApplicableClinicalRule: true,
    noApplicableRule: false
  };
}

/**
 * Terminal audit — which rules matched for this case (force-fresh JSON read).
 */
function auditDynamicRuleMatch(input = {}, baseRules = {}) {
  const { loadDynamicEhRules, clearDynamicRulesCache } = require('./dynamicEhRulesStore');
  clearDynamicRulesCache();
  const store = loadDynamicEhRules({ force: true });

  const sysRaw = input.bp_systolic;
  const diaRaw = input.bp_diastolic;
  const sys = Number.isFinite(Number(sysRaw)) ? Number(sysRaw) : 120;
  const dia = Number.isFinite(Number(diaRaw)) ? Number(diaRaw) : 80;
  const symptoms = (input.symptoms || []).map((s) =>
    typeof s === 'object' ? s.name || s.hindi || '' : String(s)
  );
  const symptomText = symptoms.join(' ').toLowerCase();
  const phase = String(input.phase || 'ACUTE').toUpperCase().replace(/-/g, '_');

  const ctx = {
    sys,
    dia,
    polarityKey: normalizePolarityKey(baseRules.polarityState || 'MIXED'),
    phase,
    symptomText,
    temperament: input.temperament || ''
  };

  const ruleAudit = (store.rules || []).map((rule) => {
    const enabled = rule.enabled !== false;
    const matched = enabled && matchCondition(rule.if, ctx);
    return {
      id: rule.id,
      priority: rule.priority,
      enabled,
      matched,
      source: rule.source || store.source,
      thenKeys: Object.keys(rule.then || {})
    };
  });

  const matchedRules = ruleAudit.filter((r) => r.matched);
  const applied = applyDynamicEhRules(baseRules, input);

  const bestElec = matchedRules.find((r) =>
    ['force_electricity', 'prefer_electricity', 'block_electricity'].some((k) =>
      r.thenKeys.includes(k)
    )
  );
  const bestPot = matchedRules.find((r) =>
    r.thenKeys.some((k) => k.includes('potency'))
  );

  return {
    storePath: require('./dynamicEhRulesStore').RULES_PATH,
    storeSource: store.source,
    storeUpdatedAt: store.updatedAt,
    totalRules: store.rules.length,
    enabledRules: ruleAudit.filter((r) => r.enabled).length,
    matchedCount: matchedRules.length,
    matchedIds: matchedRules.map((r) => r.id),
    bestElectricityRuleId: bestElec?.id || null,
    bestPotencyRuleId: bestPot?.id || null,
    lockedElectricity: applied.masterElectricity,
    lockedPotency: applied.potency,
    electricityLockedByDynamic: applied.electricityLockedByDynamic,
    hasApplicableClinicalRule: applied.hasApplicableClinicalRule,
    noApplicableRule: applied.noApplicableRule,
    ruleAudit,
    appliedNotes: (applied.dynamicRulesApplied || []).map((a) => a.id).slice(0, 12)
  };
}

function formatDynamicRulesForPrompt(input = {}, rules = {}) {
  const audit = auditDynamicRuleMatch(input, rules);
  const lines = [
    `### DYNAMIC RULE ENGINE (dynamicEhRules.json — ${audit.totalRules} rules, ${audit.matchedCount} matched this case)`,
    `- Locked potency: **${audit.lockedPotency}**`,
    `- Locked electricity: **${audit.lockedElectricity}** (do NOT use R.E./B.E./G.E. unless this lock says so)`,
    `- Matched rule IDs: ${audit.matchedIds.length ? audit.matchedIds.join(', ') : '(vitals baseline only)'}`,
    `- Primary electricity rule: ${audit.bestElectricityRuleId || 'none'}`,
    `**11-section / old template FORBIDDEN. Output exactly 7 sections (## 1 … ## 7) only.**`
  ];
  return { text: lines.join('\n'), audit };
}

module.exports = {
  applyDynamicEhRules,
  matchCondition,
  polarityMatches,
  normalizePolarityKey,
  cleanMasterElectricity,
  ELECTRICITY_LABELS,
  auditDynamicRuleMatch,
  formatDynamicRulesForPrompt
};
