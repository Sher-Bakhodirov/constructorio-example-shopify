// Recent searches, stored in the same localStorage key and format as Constructor's UI library
// (`_constructorio_recent_searches`), so a shopper's history is shared between approaches.

const STORAGE_KEY = '_constructorio_recent_searches';
const MAX_STORED = 100;

function read() {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

/**
 * Returns the most recent search terms, newest first.
 */
export function getRecentSearches(limit = 5) {
  return read()
    .map((item) => (typeof item === 'string' ? item : item?.term))
    .filter(Boolean)
    .reverse()
    .slice(0, limit);
}

/**
 * Adds a term to the end of the list (the newest), removing earlier copies of it.
 */
export function storeRecentSearch(term) {
  const cleaned = String(term || '').trim();
  if (!cleaned) return;

  const items = read().filter((item) => (item?.term || item)?.toUpperCase?.() !== cleaned.toUpperCase());
  items.push({ term: cleaned, ts: Date.now() });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_STORED)));
  } catch {
    // Storage full or blocked: recent searches are a convenience, so ignore.
  }
}
