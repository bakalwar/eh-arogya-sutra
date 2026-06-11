import {
  ANATOMY_SVG_ZONES,
  partById,
  SERIES_NAMES,
  SYSTEM_LABELS
} from '../data/anatomyRegions';

export const SEVERITY_LEVELS = ['mild', 'moderate', 'severe'];
export const SEVERITY_WEIGHT = { mild: 1, moderate: 2, severe: 3 };

export const POLARITY_POSITIVE = 'positive';
export const POLARITY_NEGATIVE = 'negative';

/** markings: { [partId]: { polarity, severity } } */
export function deriveMedicineSeries(markings) {
  const set = new Set();
  for (const partId of Object.keys(markings || {})) {
    const part = partById(partId);
    if (!part) continue;
    part.series.forEach((s) => set.add(s));
  }
  return [...set].sort();
}

export function deriveMedicineHints(markings) {
  const series = deriveMedicineSeries(markings);
  return series.map((s) => ({
    code: s,
    label: SERIES_NAMES[s] || s
  }));
}

function maxSeverityForSystem(markings, system) {
  let max = 0;
  let label = 'mild';
  for (const [partId, mark] of Object.entries(markings || {})) {
    const part = partById(partId);
    if (!part || part.system !== system) continue;
    const w = SEVERITY_WEIGHT[mark.severity] || 1;
    if (w >= max) {
      max = w;
      label = mark.severity || 'mild';
    }
  }
  return max ? label : null;
}

/** Prabhavit Ang lines for PDF / Rx */
export function buildPrabhavitSummary(markings) {
  const systems = new Set();
  for (const partId of Object.keys(markings || {})) {
    const part = partById(partId);
    if (part) systems.add(part.system);
  }
  const lines = [];
  for (const sys of systems) {
    const sev = maxSeverityForSystem(markings, sys);
    if (sev) {
      const name = SYSTEM_LABELS[sys] || sys;
      const cap = sev.charAt(0).toUpperCase() + sev.slice(1);
      lines.push(`${name} - ${cap}`);
    }
  }
  return lines;
}

export function buildMarkedPartsList(markings) {
  return Object.entries(markings || {}).map(([id, mark]) => {
    const part = partById(id);
    return {
      id,
      label: part?.label || id,
      polarity: mark.polarity,
      severity: mark.severity,
      series: part?.series || []
    };
  });
}

export function anatomyPayloadForRx(markings, medicines = []) {
  return {
    markings,
    prabhavitAng: buildPrabhavitSummary(markings),
    medicineSeries: deriveMedicineSeries(markings),
    medicineHints: deriveMedicineHints(markings),
    medicines,
    markedParts: buildMarkedPartsList(markings)
  };
}

/** Mini SVG for PDF embed (string) */
export function anatomyMiniSvg(markings, { width = 120, height = 200 } = {}) {
  const scaleX = width / 240;
  const scaleY = height / 480;
  const marks = Object.entries(markings || {});
  let dots = '';
  for (const [id, mark] of marks) {
    const part = partById(id);
    if (!part) continue;
    const z = ANATOMY_SVG_ZONES[id];
    if (!z) continue;
    const fill = mark.polarity === POLARITY_NEGATIVE ? '#2980b9' : '#c0392b';
    const r = 5 + (SEVERITY_WEIGHT[mark.severity] || 1) * 2;
    dots += `<circle cx="${z.cx * scaleX}" cy="${z.cy * scaleY}" r="${r}" fill="${fill}" opacity="0.85"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <ellipse cx="${60 * scaleX}" cy="${20 * scaleY}" rx="${22 * scaleX}" ry="${18 * scaleY}" fill="none" stroke="#4a9b54" stroke-width="1"/>
    <rect x="${45 * scaleX}" y="${38 * scaleY}" width="${30 * scaleX}" height="${12 * scaleY}" rx="4" fill="none" stroke="#4a9b54" stroke-width="1"/>
    <ellipse cx="${60 * scaleX}" cy="${95 * scaleY}" rx="${35 * scaleX}" ry="${45 * scaleY}" fill="none" stroke="#4a9b54" stroke-width="1"/>
    <line x1="${60 * scaleX}" y1="${140 * scaleY}" x2="${60 * scaleX}" y2="${175 * scaleY}" stroke="#4a9b54" stroke-width="1"/>
    <ellipse cx="${60 * scaleX}" cy="${200 * scaleY}" rx="${28 * scaleX}" ry="${35 * scaleY}" fill="none" stroke="#4a9b54" stroke-width="1"/>
    <line x1="${45 * scaleX}" y1="${120 * scaleY}" x2="${20 * scaleX}" y2="${200 * scaleY}" stroke="#4a9b54" stroke-width="1"/>
    <line x1="${75 * scaleX}" y1="${120 * scaleY}" x2="${100 * scaleX}" y2="${200 * scaleY}" stroke="#4a9b54" stroke-width="1"/>
    <line x1="${50 * scaleX}" y1="${235 * scaleY}" x2="${45 * scaleX}" y2="${190 * scaleY}" stroke="#4a9b54" stroke-width="1"/>
    <line x1="${70 * scaleX}" y1="${235 * scaleY}" x2="${75 * scaleX}" y2="${190 * scaleY}" stroke="#4a9b54" stroke-width="1"/>
    ${dots}
  </svg>`;
}
