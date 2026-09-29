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

