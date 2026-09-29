import { afterEach, describe, expect, it, vi } from 'vitest';

// Node has no localStorage; a minimal in-memory one for the location store and last-fix fallback
vi.hoisted(() => {
  const mem = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k: string, v: string) => { mem.set(k, String(v)); },
    removeItem: (k: string) => { mem.delete(k); },
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() { return mem.size; },
  };
});
import * as turf from '@turf/turf';
import { getRouteOrigin, upcomingStops } from './routeOrigin';
import { fetchTomTomRoutes } from './routing';
import { useLocationStore } from '../store/useLocationStore';

const km = (a: [number, number], b: [number, number]) => turf.distance(turf.point(a), turf.point(b));
const me: [number, number] = [78.40, 17.40];
const stopA = { name: 'A', lng: 78.45, lat: 17.42 };
const stopB = { name: 'B', lng: 78.50, lat: 17.44 };
const dest = { name: 'Dest', lng: 78.60, lat: 17.48 };

// Captures the TomTom request and returns the ordered points it was asked to route through
const capturePoints = async (points: number[][]) => {
  let url = '';
  vi.stubGlobal('fetch', vi.fn(async (u: string) => { url = u; return { ok: true, json: async () => ({ routes: [] }) } as any; }));
  await fetchTomTomRoutes(points, 'motorcycle', 2);
  const path = decodeURIComponent(url.split('/calculateRoute/')[1].split('/json')[0]);
  return path.split(':').map((p) => p.split(',').map(Number).reverse());
};

afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); useLocationStore.setState({ coordinates: null } as any); });

describe('route origin is always the latest current location', () => {
  it('prefers the live fix over the location service and old fixes', () => {
    useLocationStore.setState({ coordinates: { lat: 1, lng: 1 } } as any);
    expect(getRouteOrigin({ lng: me[0], lat: me[1] })).toEqual(me);
  });

  it('falls back to the location service, then a recent fix, and never an old one', () => {
    useLocationStore.setState({ coordinates: { lat: 17.1, lng: 78.1 } } as any);
    expect(getRouteOrigin(null)).toEqual([78.1, 17.1]);
    useLocationStore.setState({ coordinates: null } as any);
    localStorage.setItem('rc_last_fix', JSON.stringify({ lat: 17.2, lng: 78.2, at: new Date().toISOString() }));
    expect(getRouteOrigin(null)).toEqual([78.2, 17.2]);
    localStorage.setItem('rc_last_fix', JSON.stringify({ lat: 17.2, lng: 78.2, at: new Date(Date.now() - 10 * 60000).toISOString() }));
    expect(getRouteOrigin(null)).toBeNull();
  });

  it('Test 1: current location → destination (request starts at the rider)', async () => {
    const pts = await capturePoints([getRouteOrigin({ lng: me[0], lat: me[1] })!, [dest.lng, dest.lat]]);
    expect(pts[0]).toEqual(me);
    expect(pts[pts.length - 1]).toEqual([dest.lng, dest.lat]);
  });

  it('Test 2/3: current location → stops in order → destination', async () => {
    const ahead = upcomingStops(me, [stopA, stopB, dest], km);
    const pts = await capturePoints([me, ...ahead.map((s) => [s.lng, s.lat])]);
    expect(pts).toEqual([me, [stopA.lng, stopA.lat], [stopB.lng, stopB.lat], [dest.lng, dest.lat]]);
  });

  it('Test 5/6: after passing stop A the route starts at the rider and skips A', async () => {
    const past: [number, number] = [78.47, 17.43];
    const ahead = upcomingStops(past, [stopA, stopB, dest], km);
    expect(ahead.map((s) => s.name)).toEqual(['B', 'Dest']);
    const pts = await capturePoints([past, ...ahead.map((s) => [s.lng, s.lat])]);
    expect(pts[0]).toEqual(past);
  });

  it('Test 8: restarting from a different place uses the new location, not the first stop', async () => {
    const elsewhere: [number, number] = [78.30, 17.30];
    const pts = await capturePoints([getRouteOrigin({ lng: elsewhere[0], lat: elsewhere[1] })!, [stopA.lng, stopA.lat], [dest.lng, dest.lat]]);
    expect(pts[0]).toEqual(elsewhere);
    expect(pts[0]).not.toEqual([stopA.lng, stopA.lat]);
  });

  it('keeps the destination even when the rider is right at it', () => {
    expect(upcomingStops([dest.lng, dest.lat], [stopA, dest], km).map((s) => s.name)).toEqual(['Dest']);
  });
});
