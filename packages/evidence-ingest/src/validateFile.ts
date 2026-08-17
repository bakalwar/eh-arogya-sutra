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
const JPEG_SIG = Buffer.from([0xff, 0xd8, 0xff]);
const PDF_SIG = Buffer.from('%PDF-');
const ZIP_SIG = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const ZIP_EMPTY_SIG = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
const RAR_SIG = Buffer.from('Rar!');
const SEVEN_Z_SIG = Buffer.from([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]);
const MZ_SIG = Buffer.from([0x4d, 0x5a]);
const ELF_SIG = Buffer.from([0x7f, 0x45, 0x4c, 0x46]);
const MACHO_32 = Buffer.from([0xfe, 0xed, 0xfa, 0xce]);
const MACHO_64 = Buffer.from([0xfe, 0xed, 0xfa, 0xcf]);

function startsWith(buf: Buffer, sig: Buffer, offset = 0): boolean {
  if (buf.length < offset + sig.length) return false;
  return buf.subarray(offset, offset + sig.length).equals(sig);
}

function contains(buf: Buffer, sig: Buffer, maxScan: number): boolean {
  const end = Math.min(buf.length, maxScan);
  if (end < sig.length) return false;
  return buf.subarray(0, end).includes(sig);
}

function asciiPrefix(buf: Buffer, n: number): string {
  return buf.subarray(0, Math.min(n, buf.length)).toString('latin1').toLowerCase();
}

export function sanitizeEvidenceFilename(raw: string): string | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  const normalized = raw.normalize('NFKC').replace(/\0/g, '');
  for (let i = 0; i < normalized.length; i += 1) {
    const code = normalized.charCodeAt(i);
    if (code < 32 || code === 127) return null;
  }
  if (/\\/.test(normalized) || /^[A-Za-z]:/.test(normalized)) return null;
  if (normalized.includes('..')) return null;
  const replaced = normalized.replace(/\\/g, '/');
  const base = replaced.split('/').pop() ?? '';
  if (!base || base === '.' || base === '..') return null;
  const collapsed = base.replace(/\s+/g, ' ').trim();
  if (!/^[A-Za-z0-9._ -]+$/.test(collapsed)) return null;
  if (collapsed.length > MAX_SANITIZED_FILENAME_LENGTH) {
    return collapsed.slice(0, MAX_SANITIZED_FILENAME_LENGTH);
  }
  return collapsed || null;
}

export function extensionOf(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? (parts.at(-1) ?? '') : '';
}

function detectMime(bytes: Buffer): (typeof DETECTED_MIME)[keyof typeof DETECTED_MIME] | null {
  if (startsWith(bytes, PNG_SIG)) return DETECTED_MIME.png;
  if (startsWith(bytes, JPEG_SIG)) return DETECTED_MIME.jpeg;
  if (startsWith(bytes, PDF_SIG)) return DETECTED_MIME.pdf;
  return null;
}

function rejectDangerousContainer(bytes: Buffer): string | null {
  if (startsWith(bytes, ZIP_SIG) || startsWith(bytes, ZIP_EMPTY_SIG)) {
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
  const head = asciiPrefix(bytes, 256);
  if (head.includes('<?php') || head.startsWith('<!doctype html') || head.startsWith('<html')) {
    return 'HTML_OR_SCRIPT_REJECTED';
  }
  if (head.includes('<svg') || head.startsWith('<?xml')) {
    return 'SVG_OR_XML_REJECTED';
  }
  return null;
}

function rejectPdfPolyglot(bytes: Buffer): string | null {
  if (!startsWith(bytes, PDF_SIG)) return null;
  if (contains(bytes, ZIP_SIG, 8192)) return 'POLYGLOT_REJECTED';
  const scan = asciiPrefix(bytes, 8192);
  if (scan.includes('/javascript')) return 'POLYGLOT_REJECTED';
  return null;
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
  const dangerous = rejectDangerousContainer(bytes);
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
  const polyglot = rejectPdfPolyglot(bytes);
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
