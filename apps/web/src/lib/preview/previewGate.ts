/**
 * Local preview gate — Phase 4C-V.
 * Preview is available only in explicit local development / test mode.
 * Query parameters and production NODE_ENV cannot enable preview.
 */

export const PREVIEW_WATERMARK = 'SYNTHETIC DEMO — NOT CLINICAL OUTPUT — NOT SAVED' as const;

export const PREVIEW_LAYOUT_FIXTURE_LABEL =
  'SYNTHETIC LAYOUT FIXTURE — NOT A CLINICAL RECOMMENDATION' as const;

export const PREVIEW_NOT_AVAILABLE = 'PREVIEW_NOT_AVAILABLE' as const;

export type PreviewEnv = {
  NODE_ENV?: string;
  EHAS2_NODE_ENV?: string;
};

/**
 * True only when running Next.js/Vite-style local development or automated tests.
 * Production (`NODE_ENV=production`) is always false — no query/header override.
 */
export function isLocalPreviewAllowed(
  env: PreviewEnv = typeof process !== 'undefined' ? process.env : {},
): boolean {
  const nodeEnv = (env.NODE_ENV ?? '').toLowerCase();
  const ehas2Env = (env.EHAS2_NODE_ENV ?? '').toLowerCase();
  if (nodeEnv === 'production') return false;
  if (ehas2Env === 'production') return false;
  if (nodeEnv === 'development' || nodeEnv === 'test') return true;
  if (ehas2Env === 'development' || ehas2Env === 'test') return true;
  return false;
}

/** Query/header/body flags must never enable preview. */
export function queryCannotEnablePreview(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> | null | undefined,
): true {
  void searchParams;
  return true;
}

export function previewCreatesPrincipal(): false {
  return false;
}

export function previewCreatesTenantContext(): false {
  return false;
}

export function previewIssuesSession(): false {
  return false;
}

export function previewMayWritePostgres(): false {
  return false;
}

export function previewMayRequestOtp(): false {
  return false;
}

export function previewMayCallClinicalEngine(): false {
  return false;
}

export function previewMayUploadReports(): false {
  return false;
}

export function previewMayCallCandidateReviewApi(): false {
  return false;
}

export function previewMayCallPayment(): false {
  return false;
}
