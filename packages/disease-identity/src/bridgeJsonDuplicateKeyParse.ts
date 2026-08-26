import { DiseaseIdentityError } from './errors.js';

/**
 * Parse a Bridge JSONL object while rejecting duplicate keys at every object depth.
 * Key identity uses JSON string decoding (so "a" and "\\u0061" collide).
 * Builds the value itself — does not rely on JSON.parse last-value collapse.
 */
export function parseJsonObjectRejectDuplicateKeys(
  text: string,
  lineNumber: number,
): Record<string, unknown> {
  const parser = new BridgeJsonDuplicateKeyRejectParser(text, lineNumber);
  const value = parser.parseValue();
  parser.skipWhitespace();
  if (!parser.eof()) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Trailing tokens after bridge JSON at line ${lineNumber}`,
    );
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Bridge row must be a JSON object at line ${lineNumber}`,
    );
  }
  return value as Record<string, unknown>;
}

/** @deprecated Alias — all-depth duplicate rejection. */
export const parseJsonObjectRejectDuplicateRootKeys = parseJsonObjectRejectDuplicateKeys;

class BridgeJsonDuplicateKeyRejectParser {
  private readonly text: string;
  private readonly lineNumber: number;
  private index = 0;

  constructor(text: string, lineNumber: number) {
    this.text = text;
    this.lineNumber = lineNumber;
  }

  eof(): boolean {
    return this.index >= this.text.length;
  }

  skipWhitespace(): void {
    while (this.index < this.text.length) {
      const ch = this.text[this.index]!;
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        this.index += 1;
        continue;
      }
      break;
    }
  }

  private peek(): string {
    return this.text[this.index] ?? '';
  }

  private advance(): string {
    const ch = this.text[this.index];
    if (ch === undefined) {
      throw this.malformed('Unexpected end of bridge JSON');
    }
    this.index += 1;
    return ch;
  }

  private expect(ch: string): void {
    if (this.advance() !== ch) {
      throw this.malformed(`Expected '${ch}' in bridge JSON`);
    }
  }

  private malformed(detail: string): DiseaseIdentityError {
    return new DiseaseIdentityError('MALFORMED_INPUT', `${detail} at line ${this.lineNumber}`);
  }

  private duplicateKey(): DiseaseIdentityError {
    return new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Duplicate bridge JSON key at line ${this.lineNumber}`,
    );
  }

  parseValue(): unknown {
    this.skipWhitespace();
    const ch = this.peek();
    if (ch === '{') return this.parseObject();
    if (ch === '[') return this.parseArray();
    if (ch === '"') return this.parseString();
    if (ch === 't') return this.parseLiteral('true', true);
    if (ch === 'f') return this.parseLiteral('false', false);
    if (ch === 'n') return this.parseLiteral('null', null);
    if (ch === '-' || (ch >= '0' && ch <= '9')) return this.parseNumber();
    throw this.malformed('Malformed bridge JSON value');
  }

  private parseLiteral(literal: string, value: unknown): unknown {
    for (let i = 0; i < literal.length; i += 1) {
      if (this.advance() !== literal[i]) {
        throw this.malformed('Malformed bridge JSON literal');
      }
    }
    return value;
  }

  private parseNumber(): number {
    const start = this.index;
    if (this.peek() === '-') this.advance();
    if (this.peek() === '0') {
      this.advance();
    } else if (this.peek() >= '1' && this.peek() <= '9') {
      while (this.peek() >= '0' && this.peek() <= '9') this.advance();
    } else {
      throw this.malformed('Malformed bridge JSON number');
    }
    if (this.peek() === '.') {
      this.advance();
      if (!(this.peek() >= '0' && this.peek() <= '9')) {
        throw this.malformed('Malformed bridge JSON number');
      }
      while (this.peek() >= '0' && this.peek() <= '9') this.advance();
    }
    if (this.peek() === 'e' || this.peek() === 'E') {
      this.advance();
      if (this.peek() === '+' || this.peek() === '-') this.advance();
      if (!(this.peek() >= '0' && this.peek() <= '9')) {
        throw this.malformed('Malformed bridge JSON number');
      }
      while (this.peek() >= '0' && this.peek() <= '9') this.advance();
    }
    const raw = this.text.slice(start, this.index);
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      throw this.malformed('Malformed bridge JSON number');
    }
    return n;
  }

  private parseString(): string {
    this.expect('"');
    let out = '';
    while (!this.eof()) {
      const ch = this.advance();
      if (ch === '"') return out;
      if (ch === '\\') {
        const esc = this.advance();
        switch (esc) {
          case '"':
          case '\\':
          case '/':
            out += esc;
            break;
          case 'b':
            out += '\b';
            break;
          case 'f':
            out += '\f';
            break;
          case 'n':
            out += '\n';
            break;
          case 'r':
            out += '\r';
            break;
          case 't':
            out += '\t';
            break;
          case 'u': {
            let hex = '';
            for (let i = 0; i < 4; i += 1) {
              const h = this.advance();
              if (!/[0-9a-fA-F]/.test(h)) {
                throw this.malformed('Malformed bridge JSON unicode escape');
              }
              hex += h;
            }
            out += String.fromCharCode(Number.parseInt(hex, 16));
            break;
          }
          default:
            throw this.malformed('Malformed bridge JSON escape');
        }
        continue;
      }
      if (ch.charCodeAt(0) < 0x20) {
        throw this.malformed('Malformed bridge JSON control character in string');
      }
      out += ch;
    }
    throw this.malformed('Unterminated bridge JSON string');
  }

  private parseArray(): unknown[] {
    this.expect('[');
    this.skipWhitespace();
    const items: unknown[] = [];
    if (this.peek() === ']') {
      this.advance();
      return items;
    }
    for (;;) {
      items.push(this.parseValue());
      this.skipWhitespace();
      if (this.peek() === ']') {
        this.advance();
        return items;
      }
      this.expect(',');
      this.skipWhitespace();
    }
  }

  private parseObject(): Record<string, unknown> {
    this.expect('{');
    this.skipWhitespace();
    const obj: Record<string, unknown> = {};
    const seen = new Set<string>();
    if (this.peek() === '}') {
      this.advance();
      return obj;
    }
    for (;;) {
      if (this.peek() !== '"') {
        throw this.malformed('Bridge JSON object key must be a string');
      }
      const key = this.parseString();
      if (seen.has(key)) {
        throw this.duplicateKey();
      }
      seen.add(key);
      this.skipWhitespace();
      this.expect(':');
      obj[key] = this.parseValue();
      this.skipWhitespace();
      if (this.peek() === '}') {
        this.advance();
        return obj;
      }
      this.expect(',');
      this.skipWhitespace();
    }
  }
}
