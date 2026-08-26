import { RequestParameters, ResponseCallback } from 'maplibre-gl';
import { getCachedTile, cacheTile } from './tileCache';

/**
 * Custom MapLibre protocol to intercept map tile requests.
 * Uses the `idb://` prefix to distinguish requests that should be cached.
 */
export const offlineProtocol = async (params: RequestParameters, abortController: AbortController) => {
  const url = params.url.replace('idb://', 'https://');
  
  try {
    // 1. Check if the tile is in IndexedDB
    const cachedBuffer = await getCachedTile(url);
    
    if (cachedBuffer) {
      return { data: cachedBuffer };
    }

    // 2. Not in cache, fetch from network
    // If abortController is undefined (older maplibre behavior without it), fallback to a new one (though it won't be abortable)
    const signal = abortController ? abortController.signal : undefined;
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    // 3. Cache it for offline use later
    await cacheTile(url, buffer);

    // 4. Return to MapLibre
    return { data: buffer };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    } else {
      console.error('Offline Protocol Error:', error);
      throw error;
    }
  }
};
