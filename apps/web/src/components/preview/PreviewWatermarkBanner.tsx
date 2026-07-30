'use client';

import { PREVIEW_WATERMARK } from '../../lib/preview/previewGate';

export function PreviewWatermarkBanner({ extra }: { extra?: string }) {
  return (
    <div className="ehas2-preview-banner" role="status" data-ehas2-preview-watermark="true">
      <strong>{PREVIEW_WATERMARK}</strong>
      {extra ? <span> · {extra}</span> : null}
    </div>
  );
}
