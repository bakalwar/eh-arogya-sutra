import {
  MAX_HEADING_CHARS,
  MAX_NORMALIZED_CHARS,
  MAX_RANGE_CHARS,
  MAX_RAW_CHARS,
  MAX_UNIT_CHARS,
  type CandidateType,
  type ScriptHint,
} from './types.js';

const DEVANAGARI = /[\u0900-\u097F]/;
const LATIN = /[A-Za-z]/;

export function detectScriptHint(text: string): ScriptHint {
  const hasDeva = DEVANAGARI.test(text);
  const hasLatn = LATIN.test(text);
  if (hasDeva && hasLatn) return 'Mixed';
  if (hasDeva) return 'Deva';
  if (hasLatn) return 'Latn';
  return 'Unknown';
}

export function boundRawText(raw: string, candidateType: CandidateType): string {
  const max = candidateType === 'REPORT_HEADING' ? MAX_HEADING_CHARS : MAX_RAW_CHARS;
  const nfc = raw.normalize('NFC');
  if (nfc.length < 1) {
    throw Object.assign(new Error('TEXT_LIMIT'), { code: 'TEXT_LIMIT' });
  }
  return nfc.slice(0, max);
}

export function normalizeCandidateText(raw: string): string {
  const collapsed = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  return collapsed.slice(0, MAX_NORMALIZED_CHARS);
}

export function boundOptional(value: string | null, max: number): string | null {
  if (value == null) return null;
  const nfc = value.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!nfc) return null;
  return nfc.slice(0, max);
}

export function boundUnit(value: string | null): string | null {
  return boundOptional(value, MAX_UNIT_CHARS);
}

export function boundRange(value: string | null): string | null {
  return boundOptional(value, MAX_RANGE_CHARS);
}
