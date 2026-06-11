'use strict';

const { dedupeStepByStepLines } = require('./summarySection4');
const { enforceSevenSectionLayout } = require('../constants/clinicalSummaryVersion');

const SECTION_HEADER = /^##\s*(?:▌)?(\d+|[\u0967-\u096D])\.?\s*/;

function uniqueStrings(arr = []) {
  const seen = new Set();
  const out = [];
  for (const s of arr) {
    const k = String(s).replace(/\s+/g, ' ').trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(String(s).trim());
  }
  return out;
}

/**
 * Parse markdown summary into structured JSON (7 sections max).
 */
function markdownToSummaryJson(markdown = '') {
  const text = enforceSevenSectionLayout(String(markdown || ''));
  const sections = [];
  const lines = text.split('\n');
  let current = null;

  for (const line of lines) {
    const m = line.match(SECTION_HEADER);
    if (m) {
      if (current) sections.push(current);
      current = { title: line.trim(), lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) sections.push(current);

  const steps = [];
  for (const sec of sections) {
    for (const ln of sec.lines) {
      if (/^\*\s*\*\*चरण\s*\d+:/i.test(ln.trim())) steps.push(ln.trim());
    }
  }

  return {
    version: 1,
    sectionCount: sections.length,
    sections: sections.map((s) => ({
      title: s.title,
      body: uniqueStrings(s.lines.filter((l) => l.trim())).join('\n')
    })),
    stepByStep: uniqueStrings(dedupeStepByStepLines(steps)),
    header: lines.find((l) => /^#\s/.test(l)) || null
  };
}

/**
 * Strip legacy hallucination patterns not present in allowed electricity code.
 */
function scrubForbiddenElectricity(text, allowedCode = 'WE', options = {}) {
  let s = String(text || '');
  const allowed = String(allowedCode || 'WE').toUpperCase();
  const block = new Set(['GE', 'RE', 'YE', 'G.E.', 'R.E.', 'Y.E.']);
  if (allowed !== 'GE') block.add('GE');
  if (allowed !== 'RE') block.add('RE');
  if (allowed !== 'YE') block.add('YE');
  if (allowed !== 'BE') block.add('BE');

  const allowedLabel =
    allowed === 'BE'
      ? 'BE (नीली विद्युत)'
      : allowed === 'WE'
        ? 'WE (सफेद विद्युत)'
        : allowed === 'GE'
          ? 'GE (हरी विद्युत)'
          : allowed === 'RE'
            ? 'RE (लाल विद्युत)'
            : allowed === 'YE'
              ? 'YE (पीली विद्युत)'
              : allowed;

  [
    [/Y\.?\s*E\.?\s*\([^)]*विद्युत[^)]*\)/gi, allowedLabel],
    [/B\.?\s*E\.?\s*\([^)]*पीली[^)]*\)/gi, allowedLabel],
    [/गलत\s+BE\.?\s*\/\s*BE\.?\s*वर्जित/gi, '']
  ].forEach(([re, rep]) => {
    s = s.replace(re, rep);
  });

  for (const code of block) {
    const re = new RegExp(`\\b${code.replace(/\./g, '\\.?')}\\b`, 'gi');
    s = s.replace(re, allowed);
  }
  if (!options.preserveLayout) {
    s = s.replace(/\n##\s*(?:8|9|10|11)[^\n]*/gi, '');
    s = s.replace(
      /इलेक्ट्रो[-\s]?होम्योपैथी.*क्लिनिकल\s*विशेषज्ञ\s*प्रिस्क्रिप्शन/gi,
      'इलेक्ट्रो-होम्योपैथी क्लिनिकल विशेषज्ञ सारांश'
    );
    return s.replace(/\s{2,}/g, ' ').trim();
  }
  return s.trim();
}

/**
 * Rebuild markdown from cleaned JSON (deduped).
 */
function summaryJsonToMarkdown(json = {}) {
  const parts = [];
  if (json.header) parts.push(json.header, '');
  for (const sec of json.sections || []) {
    parts.push(sec.title, sec.body, '');
  }
  const lines = dedupeStepByStepLines(parts.join('\n').trim().split('\n'));
  return lines.join('\n');
}

/**
 * Full pipeline: markdown → JSON clean → markdown for HTML render.
 */
function cleanSummaryForRender(markdown, options = {}) {
  const allowedElec = options.allowedElectricity || 'WE';
  let text = scrubForbiddenElectricity(markdown, allowedElec, {
    preserveLayout: options.preserveLayout === true
  });
  if (options.preserveLayout) {
    const json = {
      version: 1,
      sectionCount: (text.match(/^##\s/gm) || []).length,
      sections: [],
      lockedElectricity: allowedElec,
      lockedPotency: options.allowedPotency || null,
      matchedRuleIds: options.matchedRuleIds || []
    };
    return { markdown: text.trim(), json };
  }
  const json = markdownToSummaryJson(text);
  json.lockedElectricity = allowedElec;
  json.lockedPotency = options.allowedPotency || null;
  json.matchedRuleIds = options.matchedRuleIds || [];
  text = summaryJsonToMarkdown(json);
  text = dedupeStepByStepLines(String(text || '').split('\n')).join('\n');
  return { markdown: text, json };
}

module.exports = {
  markdownToSummaryJson,
  summaryJsonToMarkdown,
  cleanSummaryForRender,
  scrubForbiddenElectricity,
  uniqueStrings
};
