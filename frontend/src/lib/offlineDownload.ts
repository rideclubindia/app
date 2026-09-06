import { cacheTile } from './tileCache';
import { TOMTOM_API_KEY } from './routing';

const R = 6371; // Earth radius in km

// Math to convert lat/lng to mercator tile coordinates
function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

// Calculate the bounding box for a given center and radius (in km)
// Note: This is an approximation for small distances
function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = (radiusKm / R) * (180 / Math.PI);
  const lngDelta = (radiusKm / R) * (180 / Math.PI) / Math.cos((lat * Math.PI) / 180);

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

export type DownloadProgressCallback = (downloaded: number, total: number) => void;

/**
 * Downloads a region of map tiles for offline use.
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radiusKm Radius in kilometers (e.g., 5km for a 10x10km area)
 * @param minZoom Minimum zoom level to cache
 * @param maxZoom Maximum zoom level to cache
 * @param onProgress Callback to report progress
 */
export async function downloadMapRegion(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  minZoom: number = 10,
  maxZoom: number = 15,
  onProgress?: DownloadProgressCallback
) {
  const bbox = getBoundingBox(centerLat, centerLng, radiusKm);
  const tileUrls: string[] = [];

  // Generate all tile URLs needed
  for (let z = minZoom; z <= maxZoom; z++) {
    const minX = lon2tile(bbox.minLng, z);
    const maxX = lon2tile(bbox.maxLng, z);
    const minY = lat2tile(bbox.maxLat, z); // maxLat has smaller Y
    const maxY = lat2tile(bbox.minLat, z); // minLat has larger Y

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        // CARTO Voyager Basemap
        tileUrls.push(`https://basemaps.cartocdn.com/gl/voyager-gl-style/${z}/${x}/${y}.pbf`);
        // TomTom Traffic
        tileUrls.push(`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/${z}/${x}/${y}.png?key=${TOMTOM_API_KEY}`);
      }
    }
  }

  const totalTiles = tileUrls.length;
  let downloadedTiles = 0;

  if (onProgress) onProgress(downloadedTiles, totalTiles);

  // Download tiles in batches to avoid overwhelming the browser/network
  const BATCH_SIZE = 10;
  for (let i = 0; i < tileUrls.length; i += BATCH_SIZE) {
    const batch = tileUrls.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            // Cache it natively without idb:// prefix so it works for all fetches
            await cacheTile(url, buffer);
          }
        } catch (err) {
          console.warn('Failed to fetch offline tile:', url, err);
        } finally {
          downloadedTiles++;
        }
      })
    );

    if (onProgress) onProgress(downloadedTiles, totalTiles);
  }
}
