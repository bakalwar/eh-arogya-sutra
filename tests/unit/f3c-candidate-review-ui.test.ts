import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  bboxToCssPercent,
  SYNTHETIC_CANDIDATE_REVIEW_FIXTURES,
} from '../../apps/web/src/lib/preview/candidateReviewFixtures.ts';
import { previewMayCallCandidateReviewApi } from '../../apps/web/src/lib/preview/previewGate.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('F3C source-linked review UI', () => {
  it('renders page/bbox CSS from synthetic English and Hindi fixtures', () => {
    const en = SYNTHETIC_CANDIDATE_REVIEW_FIXTURES.find((f) => f.language === 'en');
    const hi = SYNTHETIC_CANDIDATE_REVIEW_FIXTURES.find((f) => f.language === 'hi');
    expect(en?.rawText).toBe('Hemoglobin');
    expect(hi?.rawText).toBe('हीमोग्लोबिन');
    expect(en?.sourceLocator.page).toBe(1);
    expect(hi?.sourceLocator.bbox).toBeTruthy();
    expect(bboxToCssPercent(en!.sourceLocator.bbox!)).toEqual({
      left: '12%',
      top: '18%',
      width: '28%',
      height: '6%',
    });
  });

  it('preview page is gated, disconnected, and shows limitations', () => {
    const page = fs.readFileSync(
      path.join(root, 'apps/web/src/app/preview/candidate-review/page.tsx'),
      'utf8',
    );
    const view = fs.readFileSync(
      path.join(root, 'apps/web/src/components/preview/CandidateSourceLocatorView.tsx'),
      'utf8',
    );
    const board = fs.readFileSync(
      path.join(root, 'apps/web/src/components/preview/CandidateReviewLocalBoard.tsx'),
      'utf8',
    );
    expect(page).toMatch(/isLocalPreviewAllowed/);
    expect(page).toMatch(/UNVERIFIED/);
    expect(page).toMatch(/NOT_AUTHORITATIVE/);
    expect(page).not.toMatch(/fetch\(|axios|XMLHttpRequest/);
    expect(board).not.toMatch(/fetch\(|axios|XMLHttpRequest/);
    expect(view).toMatch(/data-ehas2-source-bbox/);
    expect(view).toMatch(/data-page/);
    expect(previewMayCallCandidateReviewApi()).toBe(false);
  });
});
