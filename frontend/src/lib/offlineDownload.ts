import { cacheTile, getCachedTile } from './tileCache';

const R = 6371; // Earth radius in km
export const DEFAULT_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const lon2tile = (lon: number, z: number) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2tile = (lat: number, z: number) =>
  Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z);

export interface Bounds { minLat: number; maxLat: number; minLng: number; maxLng: number; }

export const boundsAround = (lat: number, lng: number, radiusKm: number): Bounds => {
  const dLat = (radiusKm / R) * (180 / Math.PI);
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
};

export type DownloadProgressCallback = (downloaded: number, total: number) => void;

interface StyleResources { fixed: string[]; tileTemplates: { templates: string[]; maxzoom: number }[]; }

// Reads the map style to find the exact URLs MapLibre will request (tiles, sprites, glyphs)
async function resolveStyle(styleUrl: string): Promise<StyleResources> {
  const style = await (await fetch(styleUrl)).json();
  const fixed: string[] = [styleUrl];
  const tileTemplates: StyleResources['tileTemplates'] = [];

  for (const src of Object.values<any>(style.sources || {})) {
    if (src.type !== 'vector' && src.type !== 'raster') continue;
    let tiles: string[] | undefined = src.tiles;
    let maxzoom = src.maxzoom ?? 14;
    if (!tiles && src.url) {
      fixed.push(src.url);
      const tj = await (await fetch(src.url)).json();
      tiles = tj.tiles;
      maxzoom = tj.maxzoom ?? maxzoom;
    }
    if (tiles?.length) tileTemplates.push({ templates: tiles, maxzoom });
  }

  if (typeof style.sprite === 'string') {
    for (const suffix of ['.json', '.png', '@2x.json', '@2x.png']) fixed.push(style.sprite + suffix);
  }

  if (typeof style.glyphs === 'string') {
    const stacks = new Set<string>();
    for (const layer of style.layers || []) {
      const font = layer.layout?.['text-font'];
      if (Array.isArray(font) && font.every((f: unknown) => typeof f === 'string')) stacks.add(font.join(','));
    }
    for (const stack of stacks) {
      for (const range of ['0-255', '256-511', '8192-8447']) {
        fixed.push(style.glyphs.replace('{fontstack}', stack).replace('{range}', range));
      }
    }
  }
  return { fixed, tileTemplates };
}

const tileUrl = (templates: string[], z: number, x: number, y: number) =>
  templates[(x + y) % templates.length].replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));

function tilesInBounds(b: Bounds, z: number) {
  const out: [number, number][] = [];
  const minX = lon2tile(b.minLng, z), maxX = lon2tile(b.maxLng, z);
  const minY = lat2tile(b.maxLat, z), maxY = lat2tile(b.minLat, z);
  for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) out.push([x, y]);
  return out;
}

async function fetchAll(urls: string[], onProgress?: DownloadProgressCallback) {
  let done = 0;
  onProgress?.(0, urls.length);
  const BATCH = 12;
  for (let i = 0; i < urls.length; i += BATCH) {
    await Promise.all(
      urls.slice(i, i + BATCH).map(async (url) => {
        try {
          if (!(await getCachedTile(url))) {
            const res = await fetch(url);
            if (res.ok) await cacheTile(url, await res.arrayBuffer());
          }
        } catch (err) {
          console.warn('Offline download skipped', url, err);
        } finally {
          done++;
        }
      })
    );
    onProgress?.(done, urls.length);
  }
}

/** Download a square area around a point (radiusKm 25 ≈ 50 × 50 km). */
export async function downloadMapRegion(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  minZoom = 10,
  maxZoom = 14,
  onProgress?: DownloadProgressCallback,
  styleUrl = DEFAULT_STYLE_URL
) {
  const { fixed, tileTemplates } = await resolveStyle(styleUrl);
  const bounds = boundsAround(centerLat, centerLng, radiusKm);
  const urls = [...fixed];
  for (const { templates, maxzoom } of tileTemplates) {
    for (let z = minZoom; z <= Math.min(maxZoom, maxzoom); z++) {
      for (const [x, y] of tilesInBounds(bounds, z)) urls.push(tileUrl(templates, z, x, y));
    }
  }
  await fetchAll(urls, onProgress);
  return urls.length;
}

/**
 * Download a ride route: the whole route area at overview zooms, plus
 * detailed zooms only along the road (a corridor), so long routes stay small.
 */
export async function downloadRoute(
  path: { lat: number; lng: number }[],
  onProgress?: DownloadProgressCallback,
  styleUrl = DEFAULT_STYLE_URL
) {
  if (path.length === 0) return 0;
  // densify so no gap between points is larger than ~0.5 km (a z14 tile is ~2 km wide)
  const dense: { lat: number; lng: number }[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const km = Math.hypot((b.lat - a.lat) * 111, (b.lng - a.lng) * 111 * Math.cos((a.lat * Math.PI) / 180));
    const steps = Math.ceil(km / 0.5);
    for (let s = 1; s <= steps; s++) dense.push({ lat: a.lat + ((b.lat - a.lat) * s) / steps, lng: a.lng + ((b.lng - a.lng) * s) / steps });
  }
  path = dense;
  const { fixed, tileTemplates } = await resolveStyle(styleUrl);
  const lats = path.map((p) => p.lat), lngs = path.map((p) => p.lng);
  const pad = 0.05;
  const area: Bounds = { minLat: Math.min(...lats) - pad, maxLat: Math.max(...lats) + pad, minLng: Math.min(...lngs) - pad, maxLng: Math.max(...lngs) + pad };

  const urls = new Set<string>(fixed);
  for (const { templates, maxzoom } of tileTemplates) {
    for (let z = 8; z <= Math.min(11, maxzoom); z++) for (const [x, y] of tilesInBounds(area, z)) urls.add(tileUrl(templates, z, x, y));
    for (let z = 12; z <= Math.min(14, maxzoom); z++) {
      for (const p of path) {
        const cx = lon2tile(p.lng, z), cy = lat2tile(p.lat, z);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) urls.add(tileUrl(templates, z, cx + dx, cy + dy));
      }
    }
  }
  const list = [...urls];
  await fetchAll(list, onProgress);
  return list.length;
}
