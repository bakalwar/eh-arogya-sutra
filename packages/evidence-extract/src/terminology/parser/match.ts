import type { TerminologyPackEntry } from '../types.js';
import { asciiFoldLetters, isEnglishWordAlias } from './transport.js';
import { CUE_PARSER_BUDGET_MS, MAX_CUE_MATCHES, type CueParserReasonCode } from './types.js';

const PUNCT = new Set([
  0x28, 0x29, 0x5b, 0x5d, 0x7b, 0x7d, 0x2c, 0x3a, 0x3b, 0x2e, 0x3f, 0x21, 0x22, 0x27, 0x60, 0x201c,
  0x201d, 0x2018, 0x2019, 0x0964,
]);

const CLAUSE_CHARS = new Set([0x2e, 0x3f, 0x21, 0x0964, 0x0a]);

export type RawCueHit = {
  readonly entry: TerminologyPackEntry;
  readonly startOffset: number;
  readonly endOffset: number;
};

export type ScanOutcome =
  | { readonly ok: true; readonly hits: readonly RawCueHit[] }
  | { readonly ok: false; readonly reason: CueParserReasonCode };

function isWs(code: number): boolean {
  return code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d;
}

function isAsciiDigit(code: number): boolean {
  return code >= 0x30 && code <= 0x39;
}

function isAsciiLetter(code: number): boolean {
  return (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a);
}

function isDevanagariLetter(code: number): boolean {
  return code >= 0x0900 && code <= 0x097f;
}

function isLetter(code: number): boolean {
  return isAsciiLetter(code) || isDevanagariLetter(code);
}

function leftOk(text: string, start: number, unit: boolean): boolean {
  if (start === 0) return true;
  const prev = text.charCodeAt(start - 1);
  if (isWs(prev) || PUNCT.has(prev)) return true;
  if (unit && isAsciiDigit(prev)) return true;
  return false;
}

function rightOk(text: string, end: number): boolean {
  if (end === text.length) return true;
  const next = text.charCodeAt(end);
  if (isWs(next) || PUNCT.has(next)) return true;
  return false;
}

function sliceEqualsAlias(slice: string, entry: TerminologyPackEntry): boolean {
  if (entry.entryType === 'UNIT_ALIAS') {
    return slice === entry.aliasText;
  }
  if (isEnglishWordAlias(entry.language, entry.aliasText)) {
    return asciiFoldLetters(slice) === asciiFoldLetters(entry.aliasText);
  }
  return slice === entry.aliasText;
}

function tryEntryAt(text: string, start: number, entry: TerminologyPackEntry): number | null {
  const alias = entry.aliasText;
  const end = start + alias.length;
  if (end > text.length) return null;
  if (!leftOk(text, start, entry.entryType === 'UNIT_ALIAS')) return null;
  if (!rightOk(text, end)) return null;
  if (entry.entryType === 'UNIT_ALIAS' && end < text.length && isLetter(text.charCodeAt(end))) {
    return null;
  }
  if (entry.entryType === 'UNIT_ALIAS' && start > 0 && isLetter(text.charCodeAt(start - 1))) {
    return null;
  }
  const slice = text.slice(start, end);
  if (!sliceEqualsAlias(slice, entry)) return null;
  return end;
}

export function sortActiveAliases(
  entries: readonly TerminologyPackEntry[],
): TerminologyPackEntry[] {
  return entries
    .filter((e) => e.decisionStatus === 'ACTIVE')
    .slice()
    .sort((a, b) => {
      const len = b.aliasText.length - a.aliasText.length;
      if (len !== 0) return len;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
}

function hitsAt(
  text: string,
  start: number,
  sorted: readonly TerminologyPackEntry[],
): { length: number; entries: TerminologyPackEntry[] } | null {
  let bestLen = 0;
  const found: TerminologyPackEntry[] = [];
  for (const entry of sorted) {
    const len = entry.aliasText.length;
    if (bestLen > 0 && len < bestLen) break;
    const end = tryEntryAt(text, start, entry);
    if (end == null) continue;
    if (bestLen === 0) bestLen = len;
    if (len === bestLen) found.push(entry);
  }
  if (found.length === 0) return null;
  return { length: bestLen, entries: found };
}

export function scanFrozenAliases(
  text: string,
  entries: readonly TerminologyPackEntry[],
  budgetMs: number = CUE_PARSER_BUDGET_MS,
  now: () => number = () => performance.now(),
): ScanOutcome {
  const t0 = now();
  const sorted = sortActiveAliases(entries);
  const hits: RawCueHit[] = [];
  const seen = new Set<string>();
  let i = 0;
  while (i < text.length) {
    if (now() - t0 > budgetMs) {
      return { ok: false, reason: 'PARSER_TIMEOUT' };
    }
    const found = hitsAt(text, i, sorted);
    if (!found) {
      i += 1;
      continue;
    }
    if (found.entries.length > 1) {
      return { ok: false, reason: 'AMBIGUOUS_OVERLAP' };
    }
    const entry = found.entries[0];
    const startOffset = i;
    const endOffset = i + found.length;
    const key = `${entry.id}:${startOffset}:${endOffset}`;
    if (seen.has(key)) {
      i = endOffset;
      continue;
    }
    seen.add(key);
    hits.push({ entry, startOffset, endOffset });
    if (hits.length > MAX_CUE_MATCHES) {
      return { ok: false, reason: 'TOO_MANY_MATCHES' };
    }
    i = endOffset;
  }
  hits.sort((a, b) => {
    if (a.startOffset !== b.startOffset) return a.startOffset - b.startOffset;
    if (a.endOffset !== b.endOffset) return b.endOffset - a.endOffset;
    return a.entry.id < b.entry.id ? -1 : a.entry.id > b.entry.id ? 1 : 0;
  });
  return { ok: true, hits };
}

function clauseBounds(text: string, start: number, end: number): { from: number; to: number } {
  let from = 0;
  for (let i = start - 1; i >= 0; i -= 1) {
    if (CLAUSE_CHARS.has(text.charCodeAt(i))) {
      from = i + 1;
      break;
    }
  }
  let to = text.length;
  for (let i = end; i < text.length; i += 1) {
    if (CLAUSE_CHARS.has(text.charCodeAt(i))) {
      to = i;
      break;
    }
  }
  return { from, to };
}

const COORDINATORS: readonly { text: string; fold: boolean }[] = [
  { text: 'and', fold: true },
  { text: 'or', fold: true },
  { text: 'और', fold: false },
  { text: 'या', fold: false },
];

function coordinatorAt(text: string, start: number, token: string, fold: boolean): boolean {
  const end = start + token.length;
  if (end > text.length) return false;
  if (!leftOk(text, start, false) || !rightOk(text, end)) return false;
  const slice = text.slice(start, end);
  if (fold) return asciiFoldLetters(slice) === asciiFoldLetters(token);
  return slice === token;
}

export function negationAttachmentStatus(
  text: string,
  start: number,
  end: number,
): 'SCOPE_UNRESOLVED' | 'UNRESOLVED_NEGATION' {
  const { from, to } = clauseBounds(text, start, end);
  const clause = text.slice(from, to);
  const base = from;
  for (let i = 0; i < clause.length; i += 1) {
    for (const coord of COORDINATORS) {
      if (coordinatorAt(text, base + i, coord.text, coord.fold)) {
        return 'UNRESOLVED_NEGATION';
      }
    }
  }
  return 'SCOPE_UNRESOLVED';
}
