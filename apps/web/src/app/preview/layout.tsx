import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { isLocalPreviewAllowed, PREVIEW_LAYOUT_FIXTURE_LABEL } from '../../lib/preview/previewGate';
import { PreviewWatermarkBanner } from '../../components/preview/PreviewWatermarkBanner';
import Link from 'next/link';

export default function PreviewLayout({ children }: { children: ReactNode }) {
  if (!isLocalPreviewAllowed(process.env)) {
    notFound();
  }
  return (
    <div className="ehas2-preview-root" data-ehas2-preview-root="true">
      <PreviewWatermarkBanner extra={PREVIEW_LAYOUT_FIXTURE_LABEL} />
      <div className="ehas2-preview-toolbar">
        <Link href="/preview">← Preview gallery</Link>
        <span>Local development only · no session · no database writes</span>
      </div>
      {children}
    </div>
  );
}
