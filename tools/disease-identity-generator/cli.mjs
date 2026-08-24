#!/usr/bin/env node
/**
 * R2-DATA-P2B disease identity generator — bounded, fail-closed, non-runtime.
 *
 * Synthetic mode: processes explicit JSON/JSONL inputs only.
 * Full corpus mode: requires --authorize-full-corpus (not executed in P2B PR).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSyntheticDiseaseRecord,
  buildSyntheticMappedRecord,
  reconcileManifestCounts,
  serializeJsonl,
  validateDiseaseIdentityRecord,
  validateMappedIdentityRecord,
  DiseaseIdentityError,
  APPROVED_AGGREGATE_COUNTS,
  BUNDLE_SCHEMA_VERSION,
  DATASET_VERSION,
  AUTHORITY_CLASSIFICATION,
  sha256HexLower,
} from '../../packages/disease-identity/dist/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function usage() {
  console.error(`Usage:
  node tools/disease-identity-generator/cli.mjs synthetic --input <dir|file.jsonl> --output <dir>
  node tools/disease-identity-generator/cli.mjs validate --input <file.jsonl>
  node tools/disease-identity-generator/cli.mjs manifest-template --output <file.json>

Full corpus mode requires --authorize-full-corpus and is blocked in P2B v1.`);
  process.exit(2);
}

function parseArgs(argv) {
  const args = { flags: new Set(), positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i += 1;
      } else {
        args.flags.add(key);
      }
    } else {
      args.positional.push(token);
    }
  }
  return args;
}

function readJsonl(filePath) {
  const text = readFileSync(filePath, 'utf8');
  if (text.length > 5_000_000) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Input exceeds bounded size');
  }
  return text
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new DiseaseIdentityError('MALFORMED_INPUT', `Invalid JSONL at line ${index + 1}`);
      }
    });
}

function processSyntheticInput(raw) {
  if (raw.recordKind === 'LEGACY_DB_ROW') {
    const record = buildSyntheticDiseaseRecord({
      legacyDbDiseaseId: raw.legacyDbDiseaseId,
      sourceLabel: raw.sourceLabel,
      sourceCodeRaw: raw.sourceCodeRaw,
      nameEnglish: raw.nameEnglish,
      nameHindi: raw.nameHindi,
      bridgeDisposition: raw.bridgeDisposition,
      mappedIndexRefs: raw.mappedIndexRefs,
      candidateLegacyDbIds: raw.candidateLegacyDbIds,
      isDbOnly: raw.isDbOnly,
      codeWithoutMappedParent: raw.codeWithoutMappedParent,
    });
    validateDiseaseIdentityRecord(record);
    return record;
  }
  if (raw.recordKind === 'MAPPED_CODE_INDEX_INPUT') {
    const record = buildSyntheticMappedRecord({
      mappedSourceLabel: raw.mappedSourceLabel,
      mappedCodeRaw: raw.mappedCodeRaw,
      bridgeDisposition: raw.bridgeDisposition,
      candidateLegacyDbIds: raw.candidateLegacyDbIds,
      linkedEhas2DiseaseIds: raw.linkedEhas2DiseaseIds,
      provenanceVariants: raw.provenanceVariants,
    });
    validateMappedIdentityRecord(record);
    return record;
  }
  throw new DiseaseIdentityError('MALFORMED_INPUT', 'Unsupported synthetic input recordKind');
}

function cmdSynthetic(args) {
  if (args.flags.has('authorize-full-corpus')) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Full corpus mode is not authorized in P2B control-plane v1',
    );
  }
  const input = args.input;
  const output = args.output;
  if (!input || !output) {
    usage();
  }
  const inputPath = path.resolve(ROOT, input);
  const outputDir = path.resolve(ROOT, output);
  mkdirSync(outputDir, { recursive: true });

  let inputs;
  if (inputPath.endsWith('.jsonl')) {
    inputs = readJsonl(inputPath);
  } else {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Synthetic mode requires explicit .jsonl input',
    );
  }
  if (inputs.length > 256) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Synthetic batch exceeds bounded size');
  }

  const records = inputs.map((raw) => processSyntheticInput(raw));
  const sorted = [...records].sort((a, b) => {
    const idA =
      'ehas2DiseaseId' in a
        ? String(a.ehas2DiseaseId)
        : String(a.ehas2MappedIndexId ?? a.rawMappedReferenceId);
    const idB =
      'ehas2DiseaseId' in b
        ? String(b.ehas2DiseaseId)
        : String(b.ehas2MappedIndexId ?? b.rawMappedReferenceId);
    return idA.localeCompare(idB);
  });
  const jsonl = serializeJsonl(sorted);
  const outFile = path.join(outputDir, 'synthetic-ledger.jsonl');
  writeFileSync(outFile, jsonl, 'utf8');
  console.log(`Wrote ${sorted.length} records to ${outFile}`);
}

function cmdValidate(args) {
  const input = args.input;
  if (!input) {
    usage();
  }
  const records = readJsonl(path.resolve(ROOT, input));
  for (const record of records) {
    if (record.recordKind === 'LEGACY_DB_ROW') {
      validateDiseaseIdentityRecord(record);
    } else {
      validateMappedIdentityRecord(record);
    }
  }
  console.log(`Validated ${records.length} records`);
}

function cmdManifestTemplate(args) {
  const output = args.output;
  if (!output) {
    usage();
  }
  const template = {
    bundleSchemaVersion: BUNDLE_SCHEMA_VERSION,
    datasetVersion: DATASET_VERSION,
    authorityClassification: AUTHORITY_CLASSIFICATION,
    licensingClassification: 'SYNTHETIC_ENGINEERING',
    canonicalIdAlgorithms: [
      'EHAS2_CANONICAL_DISEASE_ID_v1_SHA256',
      'EHAS2_MAPPED_IDENTITY_KEY_v1_SHA256',
      'EHAS2_IDENTITY_RELATIONSHIP_v1_SHA256',
    ],
    inputEvidenceHashes: {
      note: 'External pinned evidence hashes are declared outside Git in P2B v1',
    },
    generatorVersion: '0.1.0-control-plane',
    artifacts: [],
    aggregateFingerprint: sha256HexLower('synthetic-template'),
    reconciliation: { ...APPROVED_AGGREGATE_COUNTS },
  };
  reconcileManifestCounts(template);
  writeFileSync(path.resolve(ROOT, output), `${JSON.stringify(template, null, 2)}\n`, 'utf8');
  console.log(`Wrote manifest template to ${output}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const [command] = args.positional;
  try {
    switch (command) {
      case 'synthetic':
        cmdSynthetic(args);
        break;
      case 'validate':
        cmdValidate(args);
        break;
      case 'manifest-template':
        cmdManifestTemplate(args);
        break;
      default:
        usage();
    }
  } catch (error) {
    if (error instanceof DiseaseIdentityError) {
      console.error(`${error.code}: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

main();
