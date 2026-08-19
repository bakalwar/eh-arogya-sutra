import { CueParserError, MAX_ELIGIBLE_TEXT_CHARS } from './types.js';

const ALLOWED_CONTROLS = new Set([0x09, 0x0a, 0x0d]);

const ZERO_WIDTH = new Set([
  0xfeff, 0x200b, 0x200c, 0x200d, 0x2060, 0x180e, 0x00ad, 0x2061, 0x2062, 0x2063, 0x2064,
]);

function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff;
}

function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff;
}

/** Refuse malformed Unicode. Does not collapse whitespace or rewrite hyphens. */
export function assertTransportEligibleText(text: string): string {
  if (typeof text !== 'string') {
    throw new CueParserError('MALFORMED_UNICODE');
  }
  if (text.normalize('NFC') !== text) {
    throw new CueParserError('MALFORMED_UNICODE');
  }
  if (text.length > MAX_ELIGIBLE_TEXT_CHARS) {
    throw new CueParserError('INPUT_TOO_LARGE');
  }
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (isHighSurrogate(code)) {
      const next = text.charCodeAt(i + 1);
      if (!isLowSurrogate(next)) {
        throw new CueParserError('MALFORMED_UNICODE');
      }
      i += 1;
      continue;
    }
    if (isLowSurrogate(code)) {
      throw new CueParserError('MALFORMED_UNICODE');
    }
    if (ZERO_WIDTH.has(code)) {
      throw new CueParserError('MALFORMED_UNICODE');
    }
    if (code <= 0x1f || code === 0x7f || (code >= 0x80 && code <= 0x9f)) {
      if (!ALLOWED_CONTROLS.has(code)) {
        throw new CueParserError('MALFORMED_UNICODE');
      }
    }
  }
  return text;
}

export function asciiFoldLetters(value: string): string {
  let out = '';
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code >= 0x41 && code <= 0x5a) {
      out += String.fromCharCode(code + 32);
    } else {
      out += value[i];
    }
  }
  return out;
}

export function isEnglishWordAlias(language: string, aliasText: string): boolean {
  if (language !== 'en') return false;
  for (let i = 0; i < aliasText.length; i += 1) {
    const code = aliasText.charCodeAt(i);
    const letter = (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a);
    if (!letter && code !== 0x20) return false;
  }
  return aliasText.length > 0;
}
