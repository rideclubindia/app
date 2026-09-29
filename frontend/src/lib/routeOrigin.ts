import { useLocationStore } from '../store/useLocationStore';

const LAST_FIX_KEY = 'rc_last_fix';
const MAX_FIX_AGE_MS = 2 * 60 * 1000;

const valid = (p?: { lat: number; lng: number } | null) =>
  !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;

// Every route starts here: the caller's live fix, else the shared location service, else a fix under 2 minutes old; never an old route origin
export const getRouteOrigin = (live?: { lat: number; lng: number } | null): [number, number] | null => {
  if (valid(live)) return [live!.lng, live!.lat];
  const store = useLocationStore.getState().coordinates;
  if (valid(store)) return [store!.lng, store!.lat];
  try {
    const last = JSON.parse(localStorage.getItem(LAST_FIX_KEY) || 'null');
    if (valid(last) && Date.now() - new Date(last.at).getTime() < MAX_FIX_AGE_MS) return [last.lng, last.lat];
  } catch { /* ignore */ }
  return null;
};

// Stops still ahead of the rider: drop leading stops once the rider is already heading past them to the next one
export const upcomingStops = <T extends { lng: number; lat: number }>(origin: [number, number], stops: T[], distKm: (a: [number, number], b: [number, number]) => number): T[] => {
  let i = 0;
  while (i < stops.length - 1) {
    const cur: [number, number] = [stops[i].lng, stops[i].lat];
    const next: [number, number] = [stops[i + 1].lng, stops[i + 1].lat];
    if (distKm(origin, cur) < 0.15) { i++; continue; }
    if (distKm(origin, next) < distKm(cur, next)) { i++; continue; }
    break;
  }
  return stops.slice(i);
};
