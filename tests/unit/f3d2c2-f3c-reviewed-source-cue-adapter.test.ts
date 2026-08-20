import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { F3cReviewedCueSourceService } from '../../packages/database/src/services/f3cReviewedCueSourceService.ts';
import { ValidationError } from '../../packages/database/src/domainErrors.ts';
import {
  F3C_REVIEWED_CUE_SOURCE_LOCK_PREFIX,
  f3cReviewedCueSourceLockKey,
} from '../../packages/database/src/services/cueSourceLock.ts';
import {
  CUE_PARSER_CONNECTED,
  CUE_PARSER_PRODUCTION_ENABLED,
} from '../../packages/evidence-extract/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const TENANT = {
  organizationId: '00000000-0000-4000-8000-0000000000c1',
  clinicId: '00000000-0000-4000-8000-0000000000c2',
  actorId: '00000000-0000-4000-8000-0000000000c3',
  actorRole: 'Doctor',
  membershipStatus: 'ACTIVE' as const,
  allowPatientPhi: true,
};

const CONSULT = '00000000-0000-4000-8000-0000000000c4';
const EVIDENCE = '00000000-0000-4000-8000-0000000000c5';
const CANDIDATE = '00000000-0000-4000-8000-0000000000c6';
const SECRET = 'SECRET_REVIEWED_SOURCE_TEXT_MUST_NOT_LEAK';

describe('F3D-2C2 F3C reviewed-source cue adapter contract', () => {
  const cues = new F3cReviewedCueSourceService();

  it('derives shared tenant+candidate reviewed-source lock key', () => {
    const key = f3cReviewedCueSourceLockKey({
      organizationId: TENANT.organizationId,
      clinicId: TENANT.clinicId,
      candidateId: CANDIDATE,
    });
    expect(key.startsWith(`${F3C_REVIEWED_CUE_SOURCE_LOCK_PREFIX}:`)).toBe(true);
    expect(key).toContain(TENANT.organizationId);
    expect(key).toContain(TENANT.clinicId);
    expect(key).toContain(CANDIDATE);
    expect(key).not.toMatch(/hashtext[^e]|pg_advisory_lock\(/);
    expect(key).not.toContain('CHIEF_COMPLAINT');
    expect(key.startsWith('ehas2:cue-source:v1:')).toBe(false);
  });

  it('rejects unknown selector keys without requiring database access', async () => {
    const closed = [
      {
        consultationId: CONSULT,
        evidenceItemId: EVIDENCE,
        candidateId: CANDIDATE,
        eligibleText: SECRET,
      },
      {
        consultationId: CONSULT,
        evidenceItemId: EVIDENCE,
        candidateId: CANDIDATE,
        correctedRawText: SECRET,
      },
      {
        consultationId: CONSULT,
        evidenceItemId: EVIDENCE,
        candidateId: CANDIDATE,
        originalRawText: SECRET,
      },
      {
        consultationId: CONSULT,
        evidenceItemId: EVIDENCE,
        candidateId: CANDIDATE,
        action: 'ACCEPT_AS_SOURCE_TEXT',
      },
      {
        consultationId: CONSULT,
        evidenceItemId: EVIDENCE,
        candidateId: CANDIDATE,
        reviewId: CANDIDATE,
      },
      {
        consultationId: CONSULT,
        evidenceItemId: EVIDENCE,
        candidateId: CANDIDATE,
        organizationId: TENANT.organizationId,
      },
      { consultationId: CONSULT, evidenceItemId: EVIDENCE, candidateId: CANDIDATE, diseaseId: 'x' },
      { consultationId: CONSULT, evidenceItemId: EVIDENCE, candidateId: CANDIDATE, pack: 'x' },
      {
        consultationId: CONSULT,
        evidenceItemId: EVIDENCE,
        candidateId: CANDIDATE,
        sourceLocator: { page: 1 },
      },
    ];
    for (const input of closed) {
      await expect(cues.parseF3cReviewedSourceCues(TENANT, input as never)).rejects.toMatchObject({
        name: 'ValidationError',
        message: 'UNTRUSTED_INPUT',
      });
    }
  });

  it('does not leak source text, locator keys, SQL, tokens, or pack checksums on closed-input failure', async () => {
    try {
      await cues.parseF3cReviewedSourceCues(TENANT, {
        consultationId: CONSULT,
        evidenceItemId: EVIDENCE,
        candidateId: CANDIDATE,
        eligibleText: SECRET,
      } as never);
      throw new Error('expected closed-input failure');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const blob = `${(err as Error).name}\n${(err as Error).message}\n${JSON.stringify(err)}`;
      expect(blob).not.toContain(SECRET);
      expect(blob).not.toMatch(/b3abc204|owner-approval|EHAS2_F3D2_PACK_APPROVAL/i);
      expect(blob).not.toMatch(/SELECT |hashtextextended|password/i);
      expect(blob).not.toMatch(/object_key|objectKey|presigned|filename/i);
      expect(blob).not.toMatch(/ehas2-owner-cue-pack/);
      expect((err as Error).message).toBe('UNTRUSTED_INPUT');
    }
  });

  it('does not change /ready cue-parser activation fields', () => {
    const src = fs.readFileSync(path.join(root, 'apps/api/src/createApp.ts'), 'utf8');
    expect(src).toMatch(/ready:\s*false/);
    expect(src).toMatch(/cueParserConnected:\s*CUE_PARSER_CONNECTED/);
    expect(src).toMatch(/cueParserProductionEnabled:\s*CUE_PARSER_PRODUCTION_ENABLED/);
    expect(src).toMatch(/normalizationParserAvailable:\s*NORMALIZATION_PARSER_AVAILABLE/);
    expect(src).toMatch(/clinicalEngine:\s*false/);
    expect(src).toMatch(/extractProduction:\s*EVIDENCE_EXTRACT_PRODUCTION/);
    expect(src).not.toMatch(/parseF3cReviewedSourceCues|f3cReviewedCueSourceService/);
    expect(CUE_PARSER_CONNECTED).toBe(false);
    expect(CUE_PARSER_PRODUCTION_ENABLED).toBe(false);
  });

  it('has no API, worker, or web runtime caller', () => {
    for (const rel of ['apps/api/src', 'apps/worker/src', 'apps/web/src']) {
      const abs = path.join(root, rel);
      if (!fs.existsSync(abs)) continue;
      const files = fs.readdirSync(abs, { recursive: true, encoding: 'utf8' }) as string[];
      for (const file of files) {
        if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
        const src = fs.readFileSync(path.join(abs, file), 'utf8');
        expect(src, file).not.toMatch(
          /parseF3cReviewedSourceCues|f3cReviewedCueSourceService|F3cReviewedCueSourceService/,
        );
      }
    }
  });

  it('writer audit: every production F3C review mutation uses the shared reviewed-source lock', () => {
    const reviewRepo = path.join(root, 'packages/database/src/repositories/candidateReview.ts');
    const reviewSrc = fs.readFileSync(reviewRepo, 'utf8');
    expect(reviewSrc).toMatch(/lockF3cReviewedCueSource\s*\(/);
    expect(reviewSrc).not.toMatch(/pg_advisory_xact_lock\(\s*hashtext\s*\(/);
    expect(reviewSrc).not.toMatch(/pg_advisory_lock\s*\(/);

    const evidenceSrc = fs.readFileSync(
      path.join(root, 'packages/database/src/services/evidenceService.ts'),
      'utf8',
    );
    expect(evidenceSrc).toMatch(
      /candidateReviewRepo\.lockCandidate\s*\(\s*tx,\s*tenant,\s*candidateId/,
    );
    expect(evidenceSrc).toMatch(/async submitCandidateReview\(/);

    const productionTrees = [
      'packages/database/src',
      'apps/api/src',
      'apps/worker/src',
      'apps/web/src',
    ];
    const reviewMutations: string[] = [];
    const legacyHashtextLocks: string[] = [];
    for (const tree of productionTrees) {
      const absTree = path.join(root, tree);
      if (!fs.existsSync(absTree)) continue;
      const files = fs.readdirSync(absTree, { recursive: true, encoding: 'utf8' }) as string[];
      for (const file of files) {
        if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
        const abs = path.join(absTree, file);
        const rel = path.relative(root, abs).split(path.sep).join('/');
        if (/(?:^|\/)(?:tests|__tests__|fixtures)\//.test(rel)) continue;
        const src = fs.readFileSync(abs, 'utf8');
        if (
          /INSERT INTO clinical_evidence_extraction_candidate_reviews/i.test(src) ||
          /UPDATE clinical_evidence_extraction_candidate_reviews/i.test(src)
        ) {
          reviewMutations.push(rel);
        }
        if (
          /pg_advisory_xact_lock\(\s*hashtext\s*\(/i.test(src) &&
          /candidate/i.test(src) &&
          !rel.includes('factCandidate')
        ) {
          legacyHashtextLocks.push(rel);
        }
      }
    }

    expect(reviewMutations).toEqual(['packages/database/src/repositories/candidateReview.ts']);
    expect(legacyHashtextLocks).toEqual([]);

    const lockSrc = fs.readFileSync(
      path.join(root, 'packages/database/src/services/cueSourceLock.ts'),
      'utf8',
    );
    expect(lockSrc).toMatch(/ehas2:f3c-reviewed-cue-source:v1/);
    expect(lockSrc).toMatch(/pg_advisory_xact_lock\(hashtextextended\(\$1::text, \$2::bigint\)\)/);
  });
});
