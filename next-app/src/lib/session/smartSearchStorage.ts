export const EH_SMART_SEARCH_KEY = 'eh_smart_search_pdf_v1';

export function saveSmartSearchResult(data: Record<string, unknown>) {
  sessionStorage.setItem(EH_SMART_SEARCH_KEY, JSON.stringify(data));
}

export function loadSmartSearchResult(): Record<string, unknown> | null {
  const raw = sessionStorage.getItem(EH_SMART_SEARCH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function clearSmartSearchResult() {
  sessionStorage.removeItem(EH_SMART_SEARCH_KEY);
}
