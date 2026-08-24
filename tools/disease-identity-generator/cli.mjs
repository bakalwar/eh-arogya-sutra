#!/usr/bin/env node
/**
 * R2-DATA-P2C disease identity generator — bounded, fail-closed, non-runtime.
 *
 * Synthetic mode: processes explicit JSON/JSONL inputs only.
 * Full corpus mode: requires --authorize-full-corpus and owner token (not executed in P2C-A).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSyntheticDiseaseRecord,
  buildSyntheticMappedRecord,
  reconcileManifestCounts,
  serializeJsonl,
  validateAndIndexRecordBatch,
  validateSyntheticGeneratorInput,
  DiseaseIdentityError,
  APPROVED_AGGREGATE_COUNTS,
  BUNDLE_SCHEMA_VERSION,
  DATASET_VERSION,
  AUTHORITY_CLASSIFICATION,
  sha256HexLower,
} from '../../packages/disease-identity/dist/index.js';
import { parseArgs } from './lib/parseArgs.mjs';
import {
  cmdBuildFullCorpus,
  cmdCompareFullBuilds,
  cmdPreflightFullCorpus,
  cmdVerifyFullBundle,
  cmdVerifyInventory,
  printFullCorpusUsage,
} from './lib/fullCorpusCommands.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function usage() {
  console.error(`Usage:
  node tools/disease-identity-generator/cli.mjs synthetic --input <file.jsonl> --output <dir>
  node tools/disease-identity-generator/cli.mjs validate --input <file.jsonl>
  node tools/disease-identity-generator/cli.mjs manifest-template --output <file.json>
`);
  printFullCorpusUsage();
  process.exit(2);
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
  validateSyntheticGeneratorInput(raw);
  if (raw.recordKind === 'LEGACY_DB_ROW') {
    return buildSyntheticDiseaseRecord({
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
  }
  if (raw.recordKind === 'MAPPED_CODE_INDEX_INPUT') {
    return buildSyntheticMappedRecord({
      mappedSourceLabel: raw.mappedSourceLabel,
      mappedCodeRaw: raw.mappedCodeRaw,
      bridgeDisposition: raw.bridgeDisposition,
      candidateLegacyDbIds: raw.candidateLegacyDbIds,
      linkedEhas2DiseaseIds: raw.linkedEhas2DiseaseIds,
      provenanceVariants: raw.provenanceVariants,
    });
  }
  throw new DiseaseIdentityError('MALFORMED_INPUT', 'Unsupported synthetic input recordKind');
}

function cmdSynthetic(args) {
  if (args.flags.has('authorize-full-corpus')) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'authorize-full-corpus is not valid for synthetic mode',
    );
  }
  const input = args.input;
  const output = args.output;
  if (!input || !output) {
    usage();
  }
  const inputPath = path.resolve(ROOT, input);
  const outputDir = path.resolve(ROOT, output);

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
  validateAndIndexRecordBatch(records);

  mkdirSync(outputDir, { recursive: true });
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
  validateAndIndexRecordBatch(records);
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

async function main() {
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
      case 'preflight-full-corpus':
        await cmdPreflightFullCorpus(args, ROOT);
        break;
      case 'build-full-corpus':
        await cmdBuildFullCorpus(args, ROOT);
        break;
      case 'verify-full-bundle':
        await cmdVerifyFullBundle(args);
        break;
      case 'compare-full-builds':
        await cmdCompareFullBuilds(args);
        break;
      case 'verify-inventory':
        await cmdVerifyInventory(args);
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
