/** Node backend summary routes (NOT eh_api.py :8005) */
export const SUMMARY_EH_API_PATH = '/api/summary/eh-api';

/** Live Railway fallback until POST /eh-api is deployed on production */
export const SUMMARY_FALLBACK_PATH = '/api/summary/generate';

export const SUMMARY_EH_API_ALIASES = [
  SUMMARY_FALLBACK_PATH,
  '/api/summary/expert-clinical',
  '/api/summary/eh-engine'
];
