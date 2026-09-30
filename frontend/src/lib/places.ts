// Google Places search (not wired into any screen yet); re-enable with the backend route once GOOGLE_MAPS_API_KEY is set
import { apiClient } from './apiClient';

export interface PlaceHit {
  id: string;
  name: string;
  address: string;
  // Google suggestions get coordinates only once picked (resolvePlace); OpenStreetMap results have them already
  lat?: number;
  lng?: number;
  distanceM?: number | null;
}

export interface ResolvedPlace { id: string; name: string; address: string; lat: number; lng: number }

// One token per search-to-selection, so Google bills the typing and the pick as a single session
let session: string | null = null;
const sessionToken = () => (session ||= (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`));

// Remembered for the whole app session once the backend reports Google isn't configured
let googleOff = false;

const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = Math.PI / 180;
  const x = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
};

async function searchOsm(q: string, near?: { lat: number; lng: number } | null, signal?: AbortSignal): Promise<PlaceHit[]> {
  const box = near ? `&viewbox=${near.lng - 0.4},${near.lat + 0.4},${near.lng + 0.4},${near.lat - 0.4}` : '';
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=8&countrycodes=in&q=${encodeURIComponent(q)}${box}`, { signal });
  const data = await res.json();
  return (data || []).map((d: any) => {
    const lat = parseFloat(d.lat), lng = parseFloat(d.lon);
    return {
      id: `osm-${d.place_id}`,
      name: d.name || String(d.display_name).split(',')[0],
      address: String(d.display_name).split(',').slice(1, 4).join(',').trim(),
      lat, lng,
      distanceM: near ? km(near, { lat, lng }) * 1000 : null,
    };
  }).sort((a: PlaceHit, b: PlaceHit) => (a.distanceM ?? 0) - (b.distanceM ?? 0));
}

// Place suggestions near the rider: Google Places when configured, OpenStreetMap otherwise
export async function searchPlaces(q: string, near?: { lat: number; lng: number } | null, signal?: AbortSignal): Promise<PlaceHit[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  if (!googleOff) {
    try {
      const { data } = await apiClient.get('/api/v1/places/autocomplete', {
        params: { q: term, lat: near?.lat, lng: near?.lng, session: sessionToken() },
        signal,
      });
      return data.places as PlaceHit[];
    } catch (e: any) {
      if (e?.name === 'CanceledError' || e?.name === 'AbortError') throw e;
      if (e?.response?.status === 503) googleOff = true;
    }
  }
  return searchOsm(term, near, signal);
}

// Coordinates for a picked suggestion (ends the Google billing session)
export async function resolvePlace(hit: PlaceHit): Promise<ResolvedPlace> {
  if (hit.lat != null && hit.lng != null) return { id: hit.id, name: hit.name, address: hit.address, lat: hit.lat, lng: hit.lng };
  const { data } = await apiClient.get(`/api/v1/places/${encodeURIComponent(hit.id)}`, { params: { session: sessionToken() } });
  session = null;
  return { id: data.id, name: hit.name || data.name, address: data.address || hit.address, lat: data.lat, lng: data.lng };
}

export const formatDistance = (m?: number | null) => (m == null ? '' : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);
