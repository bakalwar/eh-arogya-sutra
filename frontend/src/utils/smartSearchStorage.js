/** PDF blueprint Smart Search session */
export const EH_SMART_SEARCH_KEY = 'eh_smart_search_pdf_v1';
/** Backend clinicalSummaryVersion — बदलने पर पुराना cached सार invalidate */
export const SUMMARY_ENGINE_VERSION = 'dynamic-engine-v22-complete-pdf';

export function saveSmartSearchResult(data) {
  sessionStorage.setItem(EH_SMART_SEARCH_KEY, JSON.stringify(data));
}

export function loadSmartSearchResult() {
  const raw = sessionStorage.getItem(EH_SMART_SEARCH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSmartSearchResult() {
  sessionStorage.removeItem(EH_SMART_SEARCH_KEY);
}
