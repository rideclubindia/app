// Last-good copy of query results, so ride screens still show data with no signal.
const PREFIX = 'rideclub_cache_';

export const saveOfflineCopy = (key: string, data: unknown) => {
  try { localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), data })); } catch { /* quota or storage blocked */ }
};

export const readOfflineCopy = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw).data as T) : null;
  } catch {
    return null;
  }
};

/** Use fresh data when the query succeeded; otherwise fall back to the saved copy. */
export const withOfflineCopy = <T>(key: string, fresh: T | null | undefined, error: unknown): T | null => {
  if (!error && fresh != null) {
    saveOfflineCopy(key, fresh);
    return fresh;
  }
  return readOfflineCopy<T>(key) ?? fresh ?? null;
};
