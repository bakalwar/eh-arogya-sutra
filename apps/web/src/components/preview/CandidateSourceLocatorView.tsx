import { bboxToCssPercent } from '../../lib/preview/candidateReviewFixtures';
import type {
  PreviewCandidateFixture,
  PreviewSourceLocator,
} from '../../lib/preview/candidateReviewFixtures';

export function CandidateSourceLocatorView({
  locator,
  fixtureId,
}: {
  locator: PreviewSourceLocator;
  fixtureId: string;
}) {
  const bbox = locator.bbox;
  return (
    <div
      className="ehas2-source-page"
      data-ehas2-source-page="true"
      data-page={String(locator.page)}
      data-block-index={locator.blockIndex == null ? '' : String(locator.blockIndex)}
      data-fixture-id={fixtureId}
      aria-label={`Source page ${locator.page}`}
    >
      <span className="ehas2-source-page__label">Page {locator.page}</span>
      {bbox ? (
        <span
          className="ehas2-source-bbox"
          data-ehas2-source-bbox="true"
          data-bbox-x={String(bbox.x)}
          data-bbox-y={String(bbox.y)}
          data-bbox-w={String(bbox.w)}
          data-bbox-h={String(bbox.h)}
          style={bboxToCssPercent(bbox)}
        />
      ) : null}
    </div>
  );
}

export function CandidateReviewCard({ fixture }: { fixture: PreviewCandidateFixture }) {
  return (
    <article className="ehas2-candidate-review-card" data-ehas2-candidate-card={fixture.id}>
      <CandidateSourceLocatorView locator={fixture.sourceLocator} fixtureId={fixture.id} />
      <dl className="ehas2-candidate-meta">
        <dt>Extracted text</dt>
        <dd data-field="rawText">{fixture.rawText}</dd>
        <dt>Normalized text</dt>
        <dd data-field="normalizedText">{fixture.normalizedText}</dd>
        <dt>Type</dt>
        <dd>
          <code>{fixture.candidateType}</code>
        </dd>
        <dt>Confidence</dt>
        <dd>
          <code>{fixture.confidence}</code> — UNCERTAIN
        </dd>
        <dt>Method</dt>
        <dd>
          <code>{fixture.method}</code>
        </dd>
        <dt>Extractor</dt>
        <dd>
          <code>
            {fixture.extractorName} {fixture.extractorVersion} / {fixture.modelOrLangpackVersion}
          </code>
        </dd>
        <dt>Evidence ID</dt>
        <dd>
          <code>{fixture.evidenceId}</code>
        </dd>
        <dt>Page / block / bbox</dt>
        <dd>
          <code>
            p{fixture.sourceLocator.page}
            {fixture.sourceLocator.blockIndex != null
              ? ` block ${fixture.sourceLocator.blockIndex}`
              : ''}
            {fixture.sourceLocator.bbox
              ? ` bbox ${fixture.sourceLocator.bbox.x},${fixture.sourceLocator.bbox.y},${fixture.sourceLocator.bbox.w},${fixture.sourceLocator.bbox.h}`
              : ''}
          </code>
        </dd>
        <dt>Limitations</dt>
        <dd>
          {fixture.limitationCodes.map((code) => (
            <code key={code}>{code}</code>
          ))}
        </dd>
        <dt>Posture</dt>
        <dd>
          <code>UNVERIFIED</code> · <code>NOT_AUTHORITATIVE</code> · OCR not authoritative
        </dd>
      </dl>
    </article>
  );
}
