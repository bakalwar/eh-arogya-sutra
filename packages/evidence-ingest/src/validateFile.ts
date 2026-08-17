import { createHash } from 'node:crypto';
import {
  ALLOWED_DECLARED_MIME,
  ALLOWED_EXTENSIONS,
  DETECTED_MIME,
  MAX_EVIDENCE_BYTES,
  MAX_SANITIZED_FILENAME_LENGTH,
  type FileValidationResult,
} from './types.js';

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SOI = Buffer.from([0xff, 0xd8]);
const PDF_SIG = Buffer.from('%PDF-');
const ZIP_SIG = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const ZIP_EMPTY_SIG = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
const ZIP_SPANNED_SIG = Buffer.from([0x50, 0x4b, 0x07, 0x08]);
const RAR_SIG = Buffer.from('Rar!');
const SEVEN_Z_SIG = Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]);
const MZ_SIG = Buffer.from([0x4d, 0x5a]);
const ELF_SIG = Buffer.from([0x7f, 0x45, 0x4c, 0x46]);
const MACHO_32 = Buffer.from([0xfe, 0xed, 0xfa, 0xce]);
const MACHO_64 = Buffer.from([0xfe, 0xed, 0xfa, 0xcf]);
const MAX_PNG_CHUNKS = 4096;
const MAX_JPEG_MARKERS = 65536;

function startsWith(buf: Buffer, sig: Buffer, offset = 0): boolean {
  if (buf.length < offset + sig.length) return false;
  return buf.subarray(offset, offset + sig.length).equals(sig);
}

function indexOf(buf: Buffer, sig: Buffer, from = 0): number {
  if (sig.length === 0 || buf.length < sig.length) return -1;
  return buf.indexOf(sig, from);
}

function contains(buf: Buffer, sig: Buffer): boolean {
  return indexOf(buf, sig) !== -1;
}

function hasControlOrNul(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

export function sanitizeEvidenceFilename(raw: string): string | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  if (hasControlOrNul(raw)) return null;
  const normalized = raw.normalize('NFKC');
  if (hasControlOrNul(normalized)) return null;
  if (/\\/.test(normalized) || /^[A-Za-z]:/.test(normalized)) return null;
  if (normalized.includes('..')) return null;
  const replaced = normalized.replace(/\\/g, '/');
  const base = replaced.split('/').pop() ?? '';
  if (!base || base === '.' || base === '..') return null;
  const collapsed = base.replace(/\s+/g, ' ').trim();
  if (!collapsed || hasControlOrNul(collapsed)) return null;
  if (!/^[A-Za-z0-9._ -]+$/.test(collapsed)) return null;
  const extension = extensionOf(collapsed);
  if (collapsed.length <= MAX_SANITIZED_FILENAME_LENGTH) {
    return collapsed;
  }
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
    return null;
  }
  const suffix = `.${extension}`;
  const maxStem = MAX_SANITIZED_FILENAME_LENGTH - suffix.length;
  if (maxStem < 1) return null;
  const stem = collapsed.slice(0, collapsed.length - suffix.length);
  if (stem.length === 0) return null;
  const truncated = `${stem.slice(0, maxStem)}${suffix}`;
  if (truncated.length > MAX_SANITIZED_FILENAME_LENGTH) return null;
  if (!/^[A-Za-z0-9._ -]+$/.test(truncated)) return null;
  if (extensionOf(truncated) !== extension) return null;
  return truncated;
}

export function extensionOf(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? (parts.at(-1) ?? '') : '';
}

function detectMime(bytes: Buffer): (typeof DETECTED_MIME)[keyof typeof DETECTED_MIME] | null {
  if (startsWith(bytes, PNG_SIG)) return DETECTED_MIME.png;
  if (startsWith(bytes, JPEG_SOI)) return DETECTED_MIME.jpeg;
  if (startsWith(bytes, PDF_SIG)) return DETECTED_MIME.pdf;
  return null;
}

function rejectDangerousPrefix(bytes: Buffer): string | null {
  if (
    startsWith(bytes, ZIP_SIG) ||
    startsWith(bytes, ZIP_EMPTY_SIG) ||
    startsWith(bytes, ZIP_SPANNED_SIG)
  ) {
    return 'ARCHIVE_REJECTED';
  }
  if (startsWith(bytes, RAR_SIG) || startsWith(bytes, SEVEN_Z_SIG)) {
    return 'ARCHIVE_REJECTED';
  }
  if (startsWith(bytes, MZ_SIG) || startsWith(bytes, ELF_SIG)) {
    return 'EXECUTABLE_REJECTED';
  }
  if (startsWith(bytes, MACHO_32) || startsWith(bytes, MACHO_64)) {
    return 'EXECUTABLE_REJECTED';
  }
  if (bytes.length >= 132 && bytes.subarray(128, 132).toString('latin1') === 'DICM') {
    return 'DICOM_REJECTED';
  }
  const head = bytes.subarray(0, Math.min(256, bytes.length)).toString('latin1').toLowerCase();
  if (head.includes('<?php') || head.startsWith('<!doctype html') || head.startsWith('<html')) {
    return 'HTML_OR_SCRIPT_REJECTED';
  }
  if (head.includes('<svg') || head.startsWith('<?xml')) {
    return 'SVG_OR_XML_REJECTED';
  }
  return null;
}

function rejectEmbeddedPolyglot(bytes: Buffer): string | null {
  if (
    contains(bytes, ZIP_SIG) ||
    contains(bytes, ZIP_EMPTY_SIG) ||
    contains(bytes, ZIP_SPANNED_SIG)
  ) {
    return 'POLYGLOT_REJECTED';
  }
  if (contains(bytes, RAR_SIG) || contains(bytes, SEVEN_Z_SIG)) {
    return 'POLYGLOT_REJECTED';
  }
  if (contains(bytes, MZ_SIG) || contains(bytes, ELF_SIG)) {
    return 'POLYGLOT_REJECTED';
  }
  if (contains(bytes, MACHO_32) || contains(bytes, MACHO_64)) {
    return 'POLYGLOT_REJECTED';
  }
  const ascii = bytes.toString('latin1').toLowerCase();
  if (ascii.includes('/javascript') || ascii.includes('<?php')) {
    return 'POLYGLOT_REJECTED';
  }
  if (ascii.includes('<!doctype html') || ascii.includes('<html') || ascii.includes('<svg')) {
    return 'POLYGLOT_REJECTED';
  }
  return null;
}

function validatePngStructure(bytes: Buffer): string | null {
  if (!startsWith(bytes, PNG_SIG)) return 'STRUCTURE_REJECTED';
  let offset = 8;
  let sawIhdr = false;
  let sawIend = false;
  let chunks = 0;
  while (offset + 12 <= bytes.length) {
    chunks += 1;
    if (chunks > MAX_PNG_CHUNKS) return 'STRUCTURE_REJECTED';
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (!/^[A-Za-z]{4}$/.test(type)) return 'STRUCTURE_REJECTED';
    if (chunkEnd > bytes.length) return 'STRUCTURE_REJECTED';
    if (!sawIhdr) {
      if (type !== 'IHDR' || length !== 13) return 'STRUCTURE_REJECTED';
      sawIhdr = true;
    }
    if (type === 'IEND') {
      if (length !== 0) return 'STRUCTURE_REJECTED';
      sawIend = true;
      if (chunkEnd !== bytes.length) return 'TRAILING_PAYLOAD_REJECTED';
      break;
    }
    offset = chunkEnd;
  }
  if (!sawIhdr || !sawIend) return 'STRUCTURE_REJECTED';
  return null;
}

function validateJpegStructure(bytes: Buffer): string | null {
  if (!startsWith(bytes, JPEG_SOI)) return 'STRUCTURE_REJECTED';
  let offset = 2;
  let markers = 0;
  let sawSos = false;
  while (offset < bytes.length) {
    markers += 1;
    if (markers > MAX_JPEG_MARKERS) return 'STRUCTURE_REJECTED';
    if (bytes[offset] !== 0xff) {
      if (!sawSos) return 'STRUCTURE_REJECTED';
      while (offset + 1 < bytes.length) {
        if (bytes[offset] === 0xff && bytes[offset + 1] === 0xd9) {
          if (offset + 2 !== bytes.length) return 'TRAILING_PAYLOAD_REJECTED';
          return null;
        }
        offset += 1;
      }
      return 'STRUCTURE_REJECTED';
    }
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return 'STRUCTURE_REJECTED';
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd9) {
      if (offset !== bytes.length) return 'TRAILING_PAYLOAD_REJECTED';
      return null;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    if (offset + 2 > bytes.length) return 'STRUCTURE_REJECTED';
    const segLen = bytes.readUInt16BE(offset);
    if (segLen < 2) return 'STRUCTURE_REJECTED';
    const next = offset + segLen;
    if (next > bytes.length) return 'STRUCTURE_REJECTED';
    if (marker === 0xda) {
      sawSos = true;
      offset = next;
      continue;
    }
    offset = next;
  }
  return 'STRUCTURE_REJECTED';
}

function validatePdfStructure(bytes: Buffer): string | null {
  if (!startsWith(bytes, PDF_SIG)) return 'STRUCTURE_REJECTED';
  if (bytes.length < 15) return 'STRUCTURE_REJECTED';
  const eofMarker = Buffer.from('%%EOF');
  const eofIdx = bytes.lastIndexOf(eofMarker);
  if (eofIdx < 0) return 'STRUCTURE_REJECTED';
  const after = bytes.subarray(eofIdx + eofMarker.length).toString('latin1');
  if (!/^\s*$/.test(after)) return 'TRAILING_PAYLOAD_REJECTED';
  return null;
}

function validateStructure(
  detectedMime: (typeof DETECTED_MIME)[keyof typeof DETECTED_MIME],
  bytes: Buffer,
): string | null {
  if (detectedMime === DETECTED_MIME.png) return validatePngStructure(bytes);
  if (detectedMime === DETECTED_MIME.jpeg) return validateJpegStructure(bytes);
  if (detectedMime === DETECTED_MIME.pdf) return validatePdfStructure(bytes);
  return 'STRUCTURE_REJECTED';
}

export function validateEvidenceBytes(input: {
  filename: string;
  declaredMime: string;
  bytes: Uint8Array;
}): FileValidationResult {
  const filenameSanitized = sanitizeEvidenceFilename(input.filename);
  if (!filenameSanitized) {
    return { ok: false, code: 'FILENAME_REJECTED' };
  }
  const extension = extensionOf(filenameSanitized);
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
    return { ok: false, code: 'EXTENSION_REJECTED' };
  }
  const declared = input.declaredMime.trim().toLowerCase();
  if (!(ALLOWED_DECLARED_MIME as readonly string[]).includes(declared)) {
    return { ok: false, code: 'MIME_REJECTED' };
  }
  const bytes = Buffer.from(input.bytes);
  if (bytes.length <= 0) {
    return { ok: false, code: 'EMPTY_FILE' };
  }
  if (bytes.length > MAX_EVIDENCE_BYTES) {
    return { ok: false, code: 'SIZE_REJECTED' };
  }
  const dangerous = rejectDangerousPrefix(bytes);
  if (dangerous) return { ok: false, code: dangerous };
  const detectedMime = detectMime(bytes);
  if (!detectedMime) {
    return { ok: false, code: 'MAGIC_BYTE_REJECTED' };
  }
  if (detectedMime === DETECTED_MIME.pdf && extension !== 'pdf') {
    return { ok: false, code: 'MIME_EXTENSION_MISMATCH' };
  }
  if (detectedMime === DETECTED_MIME.png && extension !== 'png') {
    return { ok: false, code: 'MIME_EXTENSION_MISMATCH' };
  }
  if (detectedMime === DETECTED_MIME.jpeg && extension !== 'jpg' && extension !== 'jpeg') {
    return { ok: false, code: 'MIME_EXTENSION_MISMATCH' };
  }
  if (detectedMime === DETECTED_MIME.pdf && declared !== 'application/pdf') {
    return { ok: false, code: 'MIME_MISMATCH' };
  }
  if (detectedMime === DETECTED_MIME.png && declared !== 'image/png') {
    return { ok: false, code: 'MIME_MISMATCH' };
  }
  if (detectedMime === DETECTED_MIME.jpeg && declared !== 'image/jpeg') {
    return { ok: false, code: 'MIME_MISMATCH' };
  }
  const structure = validateStructure(detectedMime, bytes);
  if (structure) return { ok: false, code: structure };
  const polyglot = rejectEmbeddedPolyglot(bytes);
  if (polyglot) return { ok: false, code: polyglot };
  const contentSha256 = createHash('sha256').update(bytes).digest('hex');
  return {
    ok: true,
    filenameSanitized,
    extension: extension as 'pdf' | 'jpg' | 'jpeg' | 'png',
    declaredMime: declared,
    detectedMime,
    byteSize: bytes.length,
    contentSha256,
  };
}

export function buildEvidenceObjectKey(input: {
  organizationId: string;
  clinicId: string;
  consultationId: string;
  evidenceId: string;
  contentSha256: string;
}): string {
  return `ehas2/${input.organizationId}/${input.clinicId}/${input.consultationId}/${input.evidenceId}/${input.contentSha256}`;
}
