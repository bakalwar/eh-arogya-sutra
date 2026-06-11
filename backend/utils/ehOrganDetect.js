'use strict';

const {
  ORGAN_EH_MAP,
  LAB_RANGES,
  MEDICINE_ANATOMY
} = require('../data/ehAnatomyPathology');

const ORGAN_KEYWORDS = {
  respiratory: [
    'sardi',
    'cold',
    'jukam',
    'jukaam',
    'cough',
    'खांसी',
    'सर्दी',
    'जुकाम',
    'नाक',
    'गला',
    'bronch',
    'asthma',
    'श्वसन',
    'respiratory',
    'सांस',
    'phlegm',
    'balgam'
  ],
  musculoskeletal: [
    'joint',
    'gathiya',
    'गठिया',
    'jod',
    'kamar',
    'पीठ',
    'रीढ',
    'sciatica',
    'arthritis',
    'uric',
    'यूरिक',
    'bone',
    'हड्डी'
  ],
  cardiovascular: [
    'bp',
    'heart',
    'रक्तचाप',
    'धड़कन',
    'hypertension',
    'cardiac',
    'chest pain',
    'सीने'
  ],
  nervous_system: [
    'chakkar',
    'neend',
    'ghabrahat',
    'anxiety',
    'sir dard',
    'headache',
    'चक्कर',
    'घबराहट',
    'नींद',
    'depression',
    'migraine'
  ],
  digestive: [
    'kabz',
    'gas',
    'pet',
    'liver',
    'कब्ज',
    'गैस',
    'पेट',
    'अपच',
    'पाचन',
    'jaundice',
    'pathari',
    'pith',
    'gallstone',
    'pet saf',
    'saf nahi',
    'constipation',
    'पित्त'
  ],
  urinary: ['uti', 'kidney', 'creatinine', 'uric', 'गुर्दा', 'मूत्र', 'stone', 'पथरी'],
  lymphatic_system: ['lymph', 'ganth', 'ganth', 'गांठ', 'immune', 'सूजन', 'tumor'],
  skin: ['skin', 'eczema', 'dad', 'खुजली', 'त्वचा', 'चर्म'],
  endocrine: ['thyroid', 'diabetes', 'sugar', 'मधुमेह', 'थायरॉइड', 'insulin'],
  reproductive: ['pcod', 'leukorrhea', 'safed pani', 'प्रदर', 'uterus', 'मासिक']
};

function detectAffectedOrgans(symptomText = '', reportValues = {}) {
  const t = String(symptomText || '').toLowerCase();
  const organs = [];

  Object.entries(ORGAN_KEYWORDS).forEach(([key, words]) => {
    if (words.some((w) => t.includes(w))) organs.push(key);
  });

  const rv = reportValues || {};
  if (Number(rv.uric_acid) > 7 || Number(rv.creatinine) > 1.2) {
    if (!organs.includes('urinary')) organs.push('urinary');
    if (!organs.includes('musculoskeletal')) organs.push('musculoskeletal');
  }
  if (Number(rv.sugar_fast) > 126 || Number(rv.hba1c) > 5.6) {
    if (!organs.includes('endocrine')) organs.push('endocrine');
  }
  if (Number(rv.pth) > 65) {
    if (!organs.includes('musculoskeletal')) organs.push('musculoskeletal');
  }

  if (!organs.length) organs.push('lymphatic_system');
  return [...new Set(organs)];
}

function analyzeLabReports(reportValues = {}) {
  const findings = [];
  Object.entries(reportValues || {}).forEach(([k, v]) => {
    const num = Number(v);
    if (!Number.isFinite(num)) return;
    const r = LAB_RANGES[k];
    if (!r) return;
    const nm = r.hindi || k;
    if (num > r.high) {
      findings.push({
        test: nm,
        value: num,
        unit: r.unit,
        status: 'उच्च (HIGH) ⬆',
        polarity: 'POSITIVE',
        normal: `${r.low}–${r.high}`,
        eh_meaning: `${nm} की वृद्धि — ऋणात्मक औषधि आवश्यक`
      });
    } else if (num < r.low) {
      findings.push({
        test: nm,
        value: num,
        unit: r.unit,
        status: 'निम्न (LOW) ⬇',
        polarity: 'NEGATIVE',
        normal: `${r.low}–${r.high}`,
        eh_meaning: `${nm} की कमी — धनात्मक औषधि आवश्यक`
      });
    }
  });
  return findings;
}

function getOrganAnatomyText(organs = [], options = {}) {
  const locked = options.lockedElectricityLabel;
  return (organs || [])
    .map((org) => {
      const info = ORGAN_EH_MAP[org];
      if (!info) return '';
      const elecLine = locked
        ? `- विद्युत (rule lock): ${locked}`
        : `- पुस्तक संदर्भ (बाह्य): ${info.electricity}`;
      return (
        `**${info.hindi}**\n` +
        `- शारीरिक रचना: ${info.anatomy}\n` +
        `- रोग विकृति: ${info.pathology}\n` +
        `- EH समूह: ${info.eh_group.join(', ')}\n` +
        elecLine
      );
    })
    .filter(Boolean)
    .join('\n\n');
}

function normMedCode(raw) {
  const s = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!s) return '';
  const m = s.match(/^([A-Z]+)[-]?(\d+)$/);
  if (m) return `${m[1]}-${m[2]}`;
  if (/^S\d+$/i.test(s)) return `S-${s.slice(1)}`;
  if (/^A\d+$/i.test(s)) return `A-${s.slice(1)}`;
  if (/^C\d+$/i.test(s)) return `C-${s.slice(1)}`;
  if (/^F\d+$/i.test(s)) return `F-${s.slice(1)}`;
  if (/^P\d+$/i.test(s)) return `P-${s.slice(1)}`;
  if (/^L\d+$/i.test(s)) return `L-${s.slice(1)}`;
  return s;
}

function getMedicineReasoning(medicines) {
  const arr = Array.isArray(medicines)
    ? medicines
    : String(medicines || '')
        .split('+')
        .map((x) => x.trim())
        .filter(Boolean);
  return arr
    .map((med) => {
      const key = normMedCode(med);
      const info = MEDICINE_ANATOMY[key];
      if (!info) return `**${med}:** EH सूत्र में — पुस्तक RAG से विस्तार।`;
      return (
        `**${info.name}:**\n` +
        `- लक्ष्य अंग: ${info.target_anatomy}\n` +
        `- रोग विकृति: ${info.pathology_treated}\n` +
        `- क्रिया: ${info.action}`
      );
    })
    .join('\n\n');
}

function primaryOrganElectricity(organs = [], isHyper = false) {
  const primary = ORGAN_EH_MAP[organs[0]];
  if (primary) {
    return { electricity: primary.electricity, location: primary.location };
  }
  return {
    electricity: null,
    location: 'प्रभावित अंग पर Compress 20 मिनट'
  };
}

module.exports = {
  detectAffectedOrgans,
  analyzeLabReports,
  getOrganAnatomyText,
  getMedicineReasoning,
  normMedCode,
  primaryOrganElectricity
};
