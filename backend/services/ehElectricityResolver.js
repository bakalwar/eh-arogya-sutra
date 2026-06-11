'use strict';

/**
 * Dynamic B.E. / R.E. / G.E. / W.E. / Y.E. selection from pathology, symptoms, temperament.
 */
const VALID_CODES = ['B.E.', 'R.E.', 'G.E.', 'W.E.', 'Y.E.'];

const ELECTRICITY_META = {
  'B.E.': {
    label_hi: 'नीली विद्युत (Blue Electricity)',
    prakriti: 'NEGATIVE (ऋणात्मक)',
    rog: 'HYPER — BP उच्च, हृदय, सूजन'
  },
  'R.E.': {
    label_hi: 'लाल विद्युत (Red Electricity)',
    prakriti: 'POSITIVE (धनात्मक)',
    rog: 'HYPO — कमज़ोरी, Chronic, Anemia'
  },
  'G.E.': {
    label_hi: 'हरी विद्युत (Green Electricity)',
    prakriti: 'NEUTRAL (संतुलन)',
    rog: 'जोड़, यूरिक, लसीका, गुर्दा'
  },
  'W.E.': {
    label_hi: 'सफेद विद्युत (White Electricity)',
    prakriti: 'NEUTRAL (शांत)',
    rog: 'Anxiety, नींद, चक्कर, Nervous'
  },
  'Y.E.': {
    label_hi: 'पीली विद्युत (Yellow Electricity)',
    prakriti: 'POSITIVE (उत्तेजक)',
    rog: 'तीव्र दर्द, जलन, बुखार, फेफड़े'
  }
};

const GROUP_ELEC = { S: 'G.E.', A: 'B.E.', F: 'W.E.', C: 'G.E.', L: 'R.E.', P: 'Y.E.', V: 'G.E.' };

const ACUTE_HYPER_KW = [
  'acute',
  'tiivr',
  'तीव्र',
  'pain',
  'dard',
  'peeda',
  'vedana',
  'jaln',
  'burning',
  'jalan',
  'hyper',
  'inflammation',
  'sujan',
  'bukhar',
  'fever',
  'khansi',
  'asthma',
  'shwas'
];

const CHRONIC_WEAK_KW = [
  'chronic',
  'degenerative',
  'kamzori',
  'weakness',
  'thakan',
  'anemia',
  'dur',
  'weak',
  'mand',
  'kshay',
  'pandu'
];

const LYMPH_JOINT_KW = [
  'lymph',
  'lasika',
  'jod',
  'joint',
  'uric',
  'gout',
  'kidney',
  'gurda',
  'ganth',
  'arthritis',
  'pth'
];

const NERVOUS_KW = ['anxiety', 'neend', 'chakkar', 'nervous', 'brain', 'ghabrahat', 'insomnia', 'vertigo'];

const HEART_BP_KW = ['bp', 'hypertension', 'heart', 'dhadkan', 'arter', 'hrday', 'hriy'];

function normalizeElectricityCode(raw) {
  if (!raw) return null;
  const s = String(raw)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  const map = {
    BE: 'B.E.',
    RE: 'R.E.',
    GE: 'G.E.',
    WE: 'W.E.',
    YE: 'Y.E.',
    'B.E': 'B.E.',
    'R.E': 'R.E.',
    'G.E': 'G.E.',
    'W.E': 'W.E.',
    'Y.E': 'Y.E.'
  };
  const bare = s.replace(/\./g, '');
  if (map[bare]) return map[bare];
  if (VALID_CODES.includes(raw.trim())) return raw.trim();
  return null;
}

function blob(ctx) {
  const parts = [
    ctx.condition,
    ctx.condition_hindi,
    ctx.anatomy,
    Array.isArray(ctx.anatomy) ? ctx.anatomy.join(' ') : '',
    ctx.pathology,
    ...(ctx.symptoms || [])
  ];
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function hasKw(text, list) {
  return list.some((k) => text.includes(k));
}

function temperamentList(ctx) {
  const t = ctx.temperament || ctx.medTemperament || [];
  return (Array.isArray(t) ? t : [t]).map((x) => String(x).toLowerCase());
}

function buildComponent(code, rationale, pathologyClass) {
  const meta = ELECTRICITY_META[code] || ELECTRICITY_META['G.E.'];
  return {
    code,
    label_hi: meta.label_hi,
    prakriti: meta.prakriti,
    rog: meta.rog,
    pathology_class: pathologyClass,
    rationale
  };
}

/**
 * @param {object} ctx — rule + medicine context
 * @returns {{ code: string, component: object }}
 */
function resolveElectricityComponent(ctx = {}) {
  const text = blob(ctx);
  const temps = temperamentList(ctx);
  const path = String(ctx.pathology || '').toLowerCase();
  const medGroup = String(ctx.medGroup || ctx.group || '')
    .replace(/-Group/i, '')
    .charAt(0)
    .toUpperCase();

  const existing = normalizeElectricityCode(
    ctx.existingElectricity || ctx.dosage_protocol?.electricity || ctx.electricity_component?.code
  );
  if (existing && ctx.respectExisting !== false) {
    return {
      code: existing,
      component: buildComponent(existing, 'Existing valid EH electricity code preserved.', path || 'unspecified')
    };
  }

  const isAcute = path.includes('acute') || path.includes('tiivr') || path.includes('तीव्र');
  const isChronic = path.includes('chronic') || path.includes('dur') || hasKw(text, CHRONIC_WEAK_KW);
  const isHyperAcute =
    isAcute ||
    hasKw(text, ACUTE_HYPER_KW) ||
    (hasKw(text, ['pain', 'dard', 'jaln', 'burning', 'bukhar', 'fever']) && !isChronic);

  if (isHyperAcute) {
    if (hasKw(text, HEART_BP_KW) && !hasKw(text, ['fever', 'bukhar', 'khansi', 'lung'])) {
      return {
        code: 'B.E.',
        component: buildComponent(
          'B.E.',
          'Acute/Hyper + BP/Heart — Blue Electricity (arterial calming).',
          'acute_hyper'
        )
      };
    }
    if (hasKw(text, ['fever', 'bukhar', 'khansi', 'lung', 'asthma', 'shwas', 'cough'])) {
      return {
        code: 'Y.E.',
        component: buildComponent(
          'Y.E.',
          'Acute/Hyper + fever/respiratory — Yellow Electricity.',
          'acute_hyper'
        )
      };
    }
    if (hasKw(text, ['pain', 'dard', 'jaln', 'burning', 'peeda', 'vedana'])) {
      return {
        code: 'Y.E.',
        component: buildComponent(
          'Y.E.',
          'Acute/Hyper pain or burning — Yellow Electricity (Mattei acute stimulus).',
          'acute_hyper'
        )
      };
    }
    if (hasKw(text, NERVOUS_KW) || temps.some((t) => t.includes('nervous'))) {
      return {
        code: 'W.E.',
        component: buildComponent('W.E.', 'Acute nervous agitation — White Electricity.', 'acute_hyper')
      };
    }
  }

  if (isChronic || hasKw(text, CHRONIC_WEAK_KW)) {
    if (
      hasKw(text, LYMPH_JOINT_KW) ||
      temps.some((t) => t.includes('lymph')) ||
      medGroup === 'S' ||
      medGroup === 'C' ||
      medGroup === 'L'
    ) {
      return {
        code: 'G.E.',
        component: buildComponent(
          'G.E.',
          'Chronic/Weakness + lymph/joint/kidney — Green Electricity (temperament/pathology).',
          'chronic_weak'
        )
      };
    }
    if (hasKw(text, NERVOUS_KW) || temps.some((t) => t.includes('nervous')) || medGroup === 'F') {
      return {
        code: 'W.E.',
        component: buildComponent('W.E.', 'Chronic weakness + nervous system — White Electricity.', 'chronic_weak')
      };
    }
    if (hasKw(text, HEART_BP_KW) || temps.some((t) => t.includes('sanguine')) || medGroup === 'A') {
      return {
        code: 'R.E.',
        component: buildComponent(
          'R.E.',
          'Chronic weakness + blood/heart — Red Electricity (positive restoration).',
          'chronic_weak'
        )
      };
    }
    return {
      code: 'R.E.',
      component: buildComponent('R.E.', 'Chronic/Weakness default — Red Electricity.', 'chronic_weak')
    };
  }

  if (hasKw(text, LYMPH_JOINT_KW)) {
    return {
      code: 'G.E.',
      component: buildComponent('G.E.', 'Joint/uric/lymph anatomy — Green Electricity.', 'lymph_joint')
    };
  }

  if (hasKw(text, NERVOUS_KW) || medGroup === 'F') {
    return {
      code: 'W.E.',
      component: buildComponent('W.E.', 'Nervous temperament — White Electricity.', 'nervous')
    };
  }

  if (hasKw(text, HEART_BP_KW) || medGroup === 'A') {
    return {
      code: 'B.E.',
      component: buildComponent('B.E.', 'Sanguine/heart-BP axis — Blue Electricity.', 'cardiovascular')
    };
  }

  if (medGroup === 'P') {
    return {
      code: 'Y.E.',
      component: buildComponent('Y.E.', 'Pectorale (lung) group default — Yellow Electricity.', 'respiratory')
    };
  }

  const groupDefault = GROUP_ELEC[medGroup] || 'G.E.';
  return {
    code: groupDefault,
    component: buildComponent(groupDefault, `Medicine group ${medGroup || '?'} default electricity.`, 'group_default')
  };
}

function enrichMappingRule(rule, medEntry) {
  const medGroup = String(medEntry.group || '').replace(/-Group/i, '');
  const { code, component } = resolveElectricityComponent({
    ...rule,
    medGroup,
    group: medEntry.group,
    temperament: medEntry.temperament,
    medTemperament: medEntry.temperament,
    dosage_protocol: rule.dosage_protocol,
    respectExisting: false
  });

  const dp = { ...(rule.dosage_protocol || {}) };
  dp.electricity = code;

  return {
    ...rule,
    dosage_protocol: dp,
    electricity_component: component
  };
}

function enrichMedicineEntry(medEntry) {
  const rules = (medEntry.mapping_rules || []).map((r) => enrichMappingRule(r, medEntry));
  const primary = rules[0]?.electricity_component || resolveElectricityComponent({
    temperament: medEntry.temperament,
    medGroup: String(medEntry.group || '').replace(/-Group/i, ''),
    pathology: 'Chronic'
  }).component;

  return {
    ...medEntry,
    mapping_rules: rules,
    formula_electricity: {
      default_component: primary,
      valid_codes: VALID_CODES
    }
  };
}

module.exports = {
  VALID_CODES,
  ELECTRICITY_META,
  normalizeElectricityCode,
  resolveElectricityComponent,
  enrichMappingRule,
  enrichMedicineEntry
};
