#!/usr/bin/env node
/**
 * R2-DATA-P2B synthetic fixture materializer — writes JSON fixtures from builders.
 * Engineering-only; no network, no real corpus.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSyntheticDiseaseRecord,
  buildSyntheticMappedRecord,
  generateDiseaseCanonicalId,
  generateMappedIndexId,
} from '../../packages/disease-identity/dist/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE_ROOT = path.join(ROOT, 'fixtures/synthetic/disease-identity');
mkdirSync(FIXTURE_ROOT, { recursive: true });

const scenarios = {
  'exact-unique': buildSyntheticMappedRecord({
    mappedSourceLabel: 'ICD10',
    mappedCodeRaw: 'A00.0',
    bridgeDisposition: 'EXACT_UNIQUE_MATCH',
    linkedEhas2DiseaseIds: [generateDiseaseCanonicalId(101)],
    candidateLegacyDbIds: [101],
  }),
  'exact-multiple': buildSyntheticMappedRecord({
    mappedSourceLabel: 'ICD10',
    mappedCodeRaw: 'B01.1',
    bridgeDisposition: 'EXACT_MULTIPLE_MATCH',
    candidateLegacyDbIds: [201, 202],
    linkedEhas2DiseaseIds: [],
  }),
  'owner-review-required': buildSyntheticMappedRecord({
    mappedSourceLabel: 'OMIM',
    mappedCodeRaw: '600100',
    bridgeDisposition: 'OWNER_REVIEW_REQUIRED',
    candidateLegacyDbIds: [301, 302],
    linkedEhas2DiseaseIds: [],
  }),
  'no-match': buildSyntheticMappedRecord({
    mappedSourceLabel: 'ICD10',
    mappedCodeRaw: 'R99.9',
    bridgeDisposition: 'NO_MATCH',
    linkedEhas2DiseaseIds: [],
  }),
  'db-only': buildSyntheticDiseaseRecord({
    legacyDbDiseaseId: 5001,
    sourceLabel: 'ICD10',
    sourceCodeRaw: 'Z99.8',
    isDbOnly: true,
    bridgeDisposition: null,
  }),
  'shared-code-different-legacy-id': buildSyntheticDiseaseRecord({
    legacyDbDiseaseId: 6001,
    sourceLabel: 'ICD10',
    sourceCodeRaw: 'C50.9',
    bridgeDisposition: 'EXACT_UNIQUE_MATCH',
    mappedIndexRefs: [generateMappedIndexId('ICD10', 'C50.9')],
  }),
  'mapped-presentation-variants': buildSyntheticMappedRecord({
    mappedSourceLabel: 'MESH',
    mappedCodeRaw: 'MESH:D019999',
    bridgeDisposition: 'EXACT_UNIQUE_MATCH',
    provenanceVariants: [
      { mappedSourceLabel: 'MESH', mappedCodeRaw: 'MESH:D019999' },
      { mappedSourceLabel: 'MESH', mappedCodeRaw: 'd019999' },
    ],
    linkedEhas2DiseaseIds: [generateDiseaseCanonicalId(7001)],
    candidateLegacyDbIds: [7001],
  }),
  'invalid-namespace': buildSyntheticMappedRecord({
    mappedSourceLabel: 'UNKNOWN_NS',
    mappedCodeRaw: 'X001',
    bridgeDisposition: null,
  }),
  'invalid-code': buildSyntheticMappedRecord({
    mappedSourceLabel: 'ICD10',
    mappedCodeRaw: '   ',
    bridgeDisposition: null,
  }),
  'csv-struct-corrupt': buildSyntheticDiseaseRecord({
    legacyDbDiseaseId: 8001,
    sourceLabel: 'ICD10',
    sourceCodeRaw: 'D00.0',
    nameEnglish: '12,34,SYN_CORRUPT',
    bridgeDisposition: 'EXACT_UNIQUE_MATCH',
  }),
  'empty-display': buildSyntheticDiseaseRecord({
    legacyDbDiseaseId: 8002,
    sourceLabel: 'ICD10',
    sourceCodeRaw: 'D00.1',
    nameEnglish: '',
    nameHindi: '',
    bridgeDisposition: 'EXACT_UNIQUE_MATCH',
  }),
  'db-code-without-mapped-parent': buildSyntheticDiseaseRecord({
    legacyDbDiseaseId: 9002,
    sourceLabel: 'ICD10',
    sourceCodeRaw: 'E66.9',
    codeWithoutMappedParent: true,
    bridgeDisposition: null,
  }),
};

for (const [name, record] of Object.entries(scenarios)) {
  writeFileSync(
    path.join(FIXTURE_ROOT, `${name}.json`),
    `${JSON.stringify(record, null, 2)}\n`,
    'utf8',
  );
}

console.log(`Wrote ${Object.keys(scenarios).length} synthetic fixtures to ${FIXTURE_ROOT}`);
