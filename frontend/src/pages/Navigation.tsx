import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { ArrowLeft, ArrowUp, CornerUpLeft, CornerUpRight, Crosshair, Flag, Loader2, MapPin, Navigation2, Plus, Search, TrafficCone, X } from 'lucide-react';
import { fetchTomTomRoutes, TOMTOM_API_KEY } from '../lib/routing';
import { useLocationStore } from '../store/useLocationStore';
import { useOrientationLock } from '../hooks/useOrientationLock';
import { getRouteOrigin } from '../lib/routeOrigin';
import { requestLocation, openLocationSettings, canOpenSettings } from '../lib/locationPermission';
import { notify } from '../lib/notify';
import { useToast } from '../components/ToastContext';

// Standalone navigation: current location, traffic, route options and search (with stops). Nothing else.

type LngLat = [number, number];
interface Place { id: string; name: string; address: string; lng: number; lat: number; km: number | null }
interface Stop { id: string; name: string; lng: number; lat: number }
type RouteFeature = Awaited<ReturnType<typeof fetchTomTomRoutes>>[number];

const STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const ROUTE_COLORS = { active: '#FF5A00', alt: '#9CA3AF' };

const fmtKm = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);
const fmtMin = (s: number) => { const m = Math.round(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };
const turnIcon = (type: number) => (type === 0 || type === 2 || type === 4 ? CornerUpLeft : type === 1 || type === 3 || type === 5 ? CornerUpRight : type === 10 ? Flag : ArrowUp);

export default function Navigation() {
  useOrientationLock('any');
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: any };
  const storeCoords = useLocationStore((s) => s.coordinates);

  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const meMarker = useRef<maplibregl.Marker | null>(null);
  const pinMarkers = useRef<maplibregl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const [me, setMe] = useState<{ lng: number; lat: number; heading: number | null } | null>(storeCoords ? { ...storeCoords, heading: null } : null);
  const [following, setFollowing] = useState(false);
  const [traffic, setTraffic] = useState(false);

  const [dest, setDest] = useState<Stop | null>(
    state?.destLat != null && state?.destLng != null ? { id: 'dest', name: state.destName || 'Destination', lat: Number(state.destLat), lng: Number(state.destLng) } : null,
  );
  const [stops, setStops] = useState<Stop[]>([]);
  const [routes, setRoutes] = useState<RouteFeature[]>([]);
  const [selected, setSelected] = useState(0);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [locIssue, setLocIssue] = useState<'denied' | 'unavailable' | null>(null);
  const [askingLoc, setAskingLoc] = useState(false);
  const [navigating, setNavigating] = useState(false);

  // Starting point typed or tapped by the rider when GPS isn't available; live location always wins once it arrives
  const [manualStart, setManualStart] = useState<Stop | null>(null);
  const [pickMode, setPickMode] = useState<'start' | 'stop' | 'dest' | null>(null);
  const [searchFor, setSearchFor] = useState<'dest' | 'start'>('dest');
  const startMarker = useRef<maplibregl.Marker | null>(null);
  const pickModeRef = useRef(pickMode);
  pickModeRef.current = pickMode;
  const applyPick = useRef<(mode: 'start' | 'stop' | 'dest', p: Place) => void>(() => {});

  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState<string | null>(null);
  const searchAbort = useRef<AbortController | null>(null);

  // Map
  useEffect(() => {
    if (!mapEl.current || map.current) return;
    const start = me ? [me.lng, me.lat] : dest ? [dest.lng, dest.lat] : [78.4867, 17.385];
    map.current = new maplibregl.Map({ container: mapEl.current, style: STYLE, center: start as LngLat, zoom: 13, attributionControl: false });
    map.current.on('load', () => setMapReady(true));
    map.current.on('dragstart', () => setFollowing(false));
    map.current.on('click', async (e) => {
      const mode = pickModeRef.current;
      if (!mode) return;
      const { lng, lat } = e.lngLat;
      setPickMode(null);
      let name = 'Pinned location';
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4000);
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=17&lat=${lat}&lon=${lng}`, { signal: ctrl.signal });
        clearTimeout(t);
        const d = await r.json();
        name = d?.name || d?.display_name?.split(',').slice(0, 2).join(',') || name;
      } catch { /* keep "Pinned location" */ }
      applyPick.current(mode, { id: `pin-${lng.toFixed(5)},${lat.toFixed(5)}`, name, address: '', lng, lat, km: null });
    });
    return () => { map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Current location (own watch so heading is live)
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setMe({ lng: p.coords.longitude, lat: p.coords.latitude, heading: p.coords.heading ?? null }),
      (e) => { if (e.code === e.PERMISSION_DENIED) setLocIssue('denied'); },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    if (!mapReady || !map.current || !me) return;
    if (!meMarker.current) {
      const el = document.createElement('div');
      el.style.cssText = 'width:44px;height:44px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35))';
      el.innerHTML = '<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#fff"/><path d="M20 7 L30 30 L20 24 L10 30 Z" fill="#FF5A00"/></svg>';
      meMarker.current = new maplibregl.Marker({ element: el, rotationAlignment: 'map' }).setLngLat([me.lng, me.lat]).addTo(map.current);
    }
    meMarker.current.setLngLat([me.lng, me.lat]);
    if (me.heading != null) meMarker.current.setRotation(me.heading);
    if (following) map.current.easeTo({ center: [me.lng, me.lat], bearing: navigating && me.heading != null ? me.heading : map.current.getBearing(), duration: 800 });
  }, [me, mapReady, following, navigating]);

  // Traffic
  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m) return;
    if (traffic) {
      if (!m.getSource('traffic')) m.addSource('traffic', { type: 'raster', tiles: [`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`], tileSize: 256 });
      if (!m.getLayer('traffic')) m.addLayer({ id: 'traffic', type: 'raster', source: 'traffic', paint: { 'raster-opacity': 0.8 } }, m.getLayer('routes-alt') ? 'routes-alt' : undefined);
    } else if (m.getLayer('traffic')) {
      m.removeLayer('traffic');
    }
  }, [traffic, mapReady]);

  // Notify once on arrival; re-arms only after moving 200m away or picking a new destination
  const arrivedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!navigating || !me || !dest) return;
    const key = `${dest.lat},${dest.lng}`;
    const m = turf.distance([me.lng, me.lat], [dest.lng, dest.lat], { units: 'meters' });
    if (m <= 60 && arrivedRef.current !== key) {
      arrivedRef.current = key;
      notify({ title: 'You have arrived', body: `You reached ${dest.name}.`, route: '/navigation', tag: 'nav-arrival' });
    } else if (m > 200 && arrivedRef.current === key) arrivedRef.current = null;
  }, [navigating, me, dest]);

  // Routes: current location → stops → destination
  const hasFix = me != null;
  const [routeTick, setRouteTick] = useState(0);
  const meRef = useRef(me);
  meRef.current = me;
  const lastCalcRef = useRef(0);
  const computeRoutes = useCallback(async () => {
    if (!dest) { setRoutes([]); return; }
    // Always the latest valid location, never a previous route origin or the first stop
    const origin = getRouteOrigin(meRef.current) ?? (manualStart ? [manualStart.lng, manualStart.lat] : null);
    if (!origin) { setRoutes([]); setRouteError('NO_LOCATION'); return; }
    lastCalcRef.current = Date.now();
    setRouting(true);
    setRouteError(null);
    try {
      const pts = [origin, ...stops.map((s) => [s.lng, s.lat]), [dest.lng, dest.lat]];
      const r = await fetchTomTomRoutes(pts, 'motorcycle', 2);
      setRoutes(r);
      setSelected(0);
      if (!r.length) setRouteError('No route found.');
    } catch {
      setRouteError(navigator.onLine ? 'Could not calculate a route.' : 'No internet connection.');
    } finally {
      setRouting(false);
    }
    // Recalculate when the trip changes or the first GPS fix arrives, not on every GPS tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest, stops, hasFix, routeTick, manualStart]);

  useEffect(() => { computeRoutes(); }, [computeRoutes]);

  // Back from system settings with location allowed: pick up a fresh fix without another tap
  useEffect(() => {
    if (!locIssue) return;
    const recheck = async () => {
      if (document.visibilityState !== 'visible') return;
      const r = await requestLocation();
      if (r.status === 'granted') { setLocIssue(null); setMe({ lng: r.lng, lat: r.lat, heading: null }); setRouteTick((t) => t + 1); }
    };
    document.addEventListener('visibilitychange', recheck);
    return () => document.removeEventListener('visibilitychange', recheck);
  }, [locIssue]);

  // Resume from background / network back: recalculate from where the rider is now
  useEffect(() => {
    const bump = () => { if (document.visibilityState === 'visible') setRouteTick((t) => t + 1); };
    document.addEventListener('visibilitychange', bump);
    window.addEventListener('online', bump);
    return () => { document.removeEventListener('visibilitychange', bump); window.removeEventListener('online', bump); };
  }, []);

  // Off the selected route by more than 150 m while navigating: reroute from the current position (at most every 20 s)
  useEffect(() => {
    const line = routes[selected]?.geometry?.coordinates;
    if (!navigating || !me || !line || line.length < 2 || Date.now() - lastCalcRef.current < 20000) return;
    try {
      if (turf.pointToLineDistance([me.lng, me.lat], turf.lineString(line), { units: 'kilometers' }) > 0.15) setRouteTick((t) => t + 1);
    } catch { /* ignore */ }
  }, [me, navigating, routes, selected]);

  // Draw routes (selected on top) and fit
  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m) return;
    const fc = (list: RouteFeature[]) => ({ type: 'FeatureCollection' as const, features: list as any });
    const layers: [string, ReturnType<typeof fc>, string, number][] = [
      ['routes-alt', fc(routes.filter((_, i) => i !== selected)), ROUTE_COLORS.alt, 6],
      ['routes-active', fc(routes[selected] ? [routes[selected]] : []), ROUTE_COLORS.active, 7],
    ];
    for (const [id, data, color, width] of layers) {
      const src = m.getSource(id) as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(data as any);
      else {
        m.addSource(id, { type: 'geojson', data: data as any });
        m.addLayer({ id, type: 'line', source: id, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': color, 'line-width': width, 'line-opacity': id === 'routes-alt' ? 0.75 : 1 } });
      }
    }
    const bbox = routes[selected]?.bbox;
    if (bbox && !navigating) m.fitBounds(bbox as any, { padding: { top: 140, bottom: 300, left: 40, right: 80 }, duration: 700 });
  }, [routes, selected, mapReady, navigating]);

  // Destination + stop pins
  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m) return;
    pinMarkers.current.forEach((p) => p.remove());
    const pins = [...stops.map((s, i) => ({ s, label: String(i + 1), color: '#111827' })), ...(dest ? [{ s: dest, label: '', color: '#FF5A00' }] : [])];
    pinMarkers.current = pins.map(({ s, label, color }) => {
      const el = document.createElement('div');
      el.style.cssText = `width:30px;height:30px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font:700 12px system-ui`;
      el.textContent = label;
      return new maplibregl.Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(m);
    });
  }, [stops, dest, mapReady]);

  // Manual starting point pin (only while there's no live location)
  useEffect(() => {
    const m = map.current;
    if (!mapReady || !m) return;
    startMarker.current?.remove();
    startMarker.current = null;
    if (!manualStart || me) return;
    // Same navigation arrow as the live-location marker, pointing along the route
    const el = document.createElement('div');
    el.style.cssText = 'width:44px;height:44px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35))';
    el.innerHTML = '<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#fff"/><path d="M20 7 L30 30 L20 24 L10 30 Z" fill="#FF5A00"/></svg>';
    let heading = 0;
    const line = routes[selected]?.geometry?.coordinates as LngLat[] | undefined;
    if (line && line.length > 1) {
      try {
        const l = turf.lineString(line);
        const closest = turf.nearestPointOnLine(l, turf.point([manualStart.lng, manualStart.lat]));
        heading = turf.bearing(closest, turf.along(l, Math.min(((closest.properties as any).location ?? 0) + 0.05, turf.length(l))));
      } catch { /* keep north */ }
    }
    startMarker.current = new maplibregl.Marker({ element: el, rotationAlignment: 'map' }).setLngLat([manualStart.lng, manualStart.lat]).setRotation(heading).addTo(m);
    if (!dest) m.easeTo({ center: [manualStart.lng, manualStart.lat], zoom: 14, duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualStart, me, mapReady, routes, selected]);

  // Search as you type (Nominatim), biased to ~40 km around you
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) { searchAbort.current?.abort(); setResults([]); setSearchMsg(null); setSearching(false); return; }
    const t = setTimeout(async () => {
      searchAbort.current?.abort();
      const ctrl = new AbortController();
      searchAbort.current = ctrl;
      setSearching(true);
      setSearchMsg(null);
      try {
        const box = me ? `&viewbox=${me.lng - 0.4},${me.lat + 0.4},${me.lng + 0.4},${me.lat - 0.4}` : '';
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(term)}${box}`, { signal: ctrl.signal });
        const data = await res.json();
        const list: Place[] = (data || []).map((d: any) => {
          const lng = parseFloat(d.lon), lat = parseFloat(d.lat);
          return { id: String(d.place_id), name: d.name || d.display_name.split(',')[0], address: d.display_name.split(',').slice(1, 3).join(',').trim(), lng, lat, km: me ? turf.distance([me.lng, me.lat], [lng, lat]) : null };
        }).sort((a: Place, b: Place) => (a.km ?? 0) - (b.km ?? 0));
        setResults(list);
        if (!list.length) setSearchMsg(`No places found for "${term}"`);
      } catch (e: any) {
        if (e?.name !== 'AbortError') { setResults([]); setSearchMsg(navigator.onLine ? 'Search is unavailable right now.' : 'No internet connection.'); }
      } finally {
        if (searchAbort.current === ctrl) setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const closeSearch = () => { setSearchOpen(false); setQ(''); setResults([]); setSearchFor('dest'); };

  const goTo = (p: Place) => {
    if (searchFor === 'start') { setManualStart({ id: p.id, name: p.name, lng: p.lng, lat: p.lat }); closeSearch(); return; }
    setDest({ id: p.id, name: p.name, lng: p.lng, lat: p.lat }); setStops([]); setNavigating(false); closeSearch();
  };
  const startSearch = () => { setSearchFor('start'); setSearchOpen(true); };

  // Insert the stop in the gap that adds the least detour, keeping the destination last
  const addStop = (p: Place) => {
    if (!dest) return goTo(p);
    const stop: Stop = { id: p.id, name: p.name, lng: p.lng, lat: p.lat };
    const first: LngLat = me ? [me.lng, me.lat] : stops[0] ? [stops[0].lng, stops[0].lat] : [p.lng, p.lat];
    const chain: LngLat[] = [first, ...stops.map((s) => [s.lng, s.lat] as LngLat), [dest.lng, dest.lat]];
    let best = stops.length, bestCost = Infinity;
    for (let i = 0; i < chain.length - 1; i++) {
      const cost = turf.distance(chain[i], [p.lng, p.lat]) + turf.distance([p.lng, p.lat], chain[i + 1]) - turf.distance(chain[i], chain[i + 1]);
      if (cost < bestCost) { bestCost = cost; best = i; }
    }
    setStops((prev) => [...prev.slice(0, best), stop, ...prev.slice(best)]);
    closeSearch();
  };

  const active = routes[selected];
  const summary = active?.properties.summary as { distance: number; duration: number; trafficDelay?: number } | undefined;
  const steps: any[] = active?.properties.segments?.[0]?.steps || [];
  const nextStep = (() => {
    // Live GPS, or the manual start point when location isn't available
    const pos: LngLat | null = me ? [me.lng, me.lat] : manualStart ? [manualStart.lng, manualStart.lat] : null;
    if (!navigating || !active || !pos || !steps.length) return null;
    try {
      const line = turf.lineString(active.geometry.coordinates);
      const idx = (turf.nearestPointOnLine(line, pos).properties as any).index ?? 0;
      const s = steps.find((st) => st.way_points[0] > idx) || steps[steps.length - 1];
      const dist = turf.length(turf.lineSlice(pos, active.geometry.coordinates[s.way_points[0]], line)) * 1000;
      return { text: s.instruction as string, dist, Icon: turnIcon(s.type) };
    } catch { return null; }
  })();

  applyPick.current = (mode, p) => {
    if (mode === 'start') setManualStart({ id: 'start', name: p.name, lng: p.lng, lat: p.lat });
    else if (mode === 'stop') addStop(p);
    else { setDest({ id: p.id, name: p.name, lng: p.lng, lat: p.lat }); setStops([]); setNavigating(false); }
  };

  // Navigating: follow the rider heading-up; otherwise frame the whole route (or fall back to locating)
  // Same behaviour as ride navigation: centre on the rider (or start point) facing the route direction ahead
  const recenter = (nav: boolean = navigating) => {
    const m = map.current;
    if (!m) return;
    const line = routes[selected]?.geometry?.coordinates as LngLat[] | undefined;
    const target: LngLat | null = me ? [me.lng, me.lat] : manualStart ? [manualStart.lng, manualStart.lat] : line?.length ? line[0] : null;
    if (!target) { locate(); return; }
    let bearing = m.getBearing();
    if (line && line.length > 1) {
      try {
        const l = turf.lineString(line);
        const closest = turf.nearestPointOnLine(l, turf.point(target));
        const along = (closest.properties as any).location ?? 0;
        bearing = turf.bearing(closest, turf.along(l, Math.min(along + 0.05, turf.length(l))));
      } catch { /* keep current bearing */ }
    }
    setFollowing(true);
    m.easeTo({ center: target, bearing, pitch: nav ? 60 : 0, zoom: nav ? 19 : 16, duration: 1000 });
  };

  // Centre on the rider; asks for location again when there's no fix yet
  const locate = async () => {
    if (me && map.current) {
      setFollowing(true);
      map.current.easeTo({ center: [me.lng, me.lat], zoom: navigating ? 19 : 15, bearing: navigating && me.heading != null ? me.heading : 0, pitch: navigating ? 45 : 0, duration: 700 });
      return;
    }
    // No GPS but the rider set their start point: that is where they are, so don't ask for location again
    if (manualStart && map.current) {
      map.current.easeTo({ center: [manualStart.lng, manualStart.lat], zoom: navigating ? 19 : 15, bearing: 0, pitch: navigating ? 60 : 0, duration: 700 });
      return;
    }
    setAskingLoc(true);
    const r = await requestLocation();
    setAskingLoc(false);
    if (r.status === 'granted') {
      setLocIssue(null);
      setMe({ lng: r.lng, lat: r.lat, heading: null });
      setFollowing(true);
      map.current?.easeTo({ center: [r.lng, r.lat], zoom: 15, duration: 700 });
      setRouteTick((t) => t + 1);
    } else {
      setLocIssue(r.status);
      showToast(r.status === 'denied' ? 'Location is blocked. Allow it in settings, or set your start point manually.' : 'Location is off. Turn on GPS, or set your start point manually.', 'error');
    }
  };
  // Starting navigation re-centres straight away, from GPS or the manual start point
  const start = () => { setRouteTick((t) => t + 1); setNavigating(true); recenter(true); };
  const stop = () => { setNavigating(false); setFollowing(false); map.current?.easeTo({ pitch: 0, bearing: 0, duration: 600 }); };

  const iconBtn = (on: boolean) => `w-12 h-12 rounded-2xl shadow-md border flex items-center justify-center active:scale-95 ${on ? 'bg-[#FF5A00] border-[#FF5A00] text-white' : 'bg-white border-gray-100 text-gray-900'}`;

  return (
    <div className="fixed inset-0 bg-[#F7F8FA] overflow-hidden pt-[max(20px,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="relative w-full h-full">
        <div ref={mapEl} className="absolute inset-0 w-full h-full" />

        {/* Top: back + search, or the next turn while navigating */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-2 items-start">
          <button onClick={() => (navigating ? stop() : navigate(-1))} aria-label={navigating ? 'Stop navigation' : 'Back'} className={iconBtn(false)}>
            {navigating ? <X className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
          </button>
          {navigating && nextStep ? (
            <div className="flex-1 min-w-0 rounded-2xl bg-[#0F5132] text-white shadow-lg px-4 py-3 flex items-center gap-3">
              <nextStep.Icon className="w-10 h-10 shrink-0" />
              <div className="min-w-0">
                <p className="text-[22px] font-bold leading-none tabular-nums">{fmtKm(nextStep.dist)}</p>
                <p className="text-[14px] text-white/85 mt-1 truncate">{nextStep.text}</p>
              </div>
            </div>
          ) : navigating && dest ? (
            <div className="flex-1 min-w-0 rounded-2xl bg-[#0F5132] text-white shadow-lg px-4 py-3 flex items-center gap-3">
              <ArrowUp className="w-10 h-10 shrink-0" />
              <div className="min-w-0">
                <p className="text-[22px] font-bold leading-none tabular-nums">{summary ? fmtKm(summary.distance) : '--'}</p>
                <p className="text-[14px] text-white/85 mt-1 truncate">Head to {dest.name}</p>
              </div>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="flex-1 min-w-0 h-12 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center gap-2.5 px-4 text-left active:scale-[0.99]">
              <Search className="w-5 h-5 text-gray-500 shrink-0" />
              <span className={`truncate text-[15px] ${dest ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>{dest ? dest.name : 'Where to?'}</span>
            </button>
          )}
        </div>

        {/* Right: traffic + locate */}
        <div className="absolute right-3 top-[76px] z-20 flex flex-col gap-3">
          <button onClick={() => setTraffic((v) => !v)} aria-pressed={traffic} aria-label="Live traffic" className={iconBtn(traffic)}>
            <TrafficCone className="w-5 h-5" />
          </button>
          <button onClick={locate} aria-label="My location" className={iconBtn(following)}>
            <Crosshair className="w-5 h-5" />
          </button>
          <button onClick={() => recenter()} aria-label="Re-center" title="Re-center" className={iconBtn(navigating && following)}>
            <Navigation2 className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom: routes, or trip progress while navigating */}
        {dest && (
          <div className="absolute left-3 right-3 bottom-3 z-20 landscape:right-auto landscape:w-[380px] rounded-3xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] border border-gray-100 overflow-hidden">
            {navigating ? (
              <div className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[22px] font-bold text-gray-950 tabular-nums leading-none">{summary ? fmtMin(summary.duration) : '--'}</p>
                  <p className="text-[13px] text-gray-500 mt-1 truncate">{summary ? fmtKm(summary.distance) : ''} · to {dest.name}</p>
                </div>
                <button onClick={() => setSearchOpen(true)} className="h-12 px-4 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-900 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Stop</button>
                <button onClick={stop} className="h-12 px-5 rounded-2xl bg-red-600 text-white text-[14px] font-bold">End</button>
              </div>
            ) : (
              <>
                <div className="px-4 pt-3.5 pb-2 flex items-start gap-3 border-b border-gray-100">
                  <MapPin className="w-5 h-5 text-[#FF5A00] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-gray-950 truncate">{dest.name}</p>
                    {stops.length > 0 && <p className="text-[12px] text-gray-500 truncate">via {stops.map((s) => s.name).join(', ')}</p>}
                  </div>
                  {stops.length > 0 && <button onClick={() => setStops([])} className="text-[12px] font-semibold text-gray-500 underline shrink-0">Clear stops</button>}
                </div>
                {manualStart && !me && (
                  <div className="px-4 py-2.5 flex items-center gap-3 border-b border-gray-100">
                    <span className="w-3 h-3 rounded-full bg-green-600 ring-4 ring-green-100 shrink-0 ml-1" />
                    <p className="flex-1 min-w-0 text-[13px] text-gray-700 truncate">From <span className="font-semibold text-gray-950">{manualStart.name}</span></p>
                    <button onClick={startSearch} className="text-[12px] font-semibold text-[#FF5A00] shrink-0">Change</button>
                    <button onClick={() => setPickMode('start')} className="text-[12px] font-semibold text-[#FF5A00] shrink-0">Map</button>
                  </div>
                )}
                <div className="max-h-[34vh] overflow-y-auto">
                  {routing ? (
                    <div className="py-6 flex justify-center"><Loader2 className="w-6 h-6 text-[#FF5A00] animate-spin" /></div>
                  ) : routeError === 'NO_LOCATION' ? (
                    <div className="px-4 py-4 flex items-start gap-3">
                      <span className="w-10 h-10 rounded-full bg-orange-50 text-[#FF5A00] flex items-center justify-center shrink-0"><Crosshair className="w-5 h-5" /></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-gray-950">{locIssue === 'denied' ? 'Location is blocked' : locIssue === 'unavailable' ? 'Location is turned off' : 'Location needed'}</p>
                        <p className="text-[13px] text-gray-500 mt-0.5">
                          {locIssue === 'denied'
                            ? (canOpenSettings() ? 'Open settings, tap Permissions → Location and choose Allow.' : 'Allow location for this site in your browser settings, then try again.')
                            : locIssue === 'unavailable' ? 'Turn on location (GPS) on your phone, then try again.'
                            : 'Routes start from where you are.'}
                        </p>
                        <div className="flex gap-2 mt-3">
                          {locIssue === 'denied' && canOpenSettings() ? (
                            <button onClick={() => openLocationSettings('app')} className="h-11 px-4 rounded-xl bg-[#FF5A00] text-white text-[14px] font-semibold">Open settings</button>
                          ) : locIssue === 'unavailable' && canOpenSettings() ? (
                            <button onClick={() => openLocationSettings('services')} className="h-11 px-4 rounded-xl bg-[#FF5A00] text-white text-[14px] font-semibold">Turn on location</button>
                          ) : null}
                          <button
                            disabled={askingLoc}
                            onClick={async () => {
                              setAskingLoc(true);
                              const r = await requestLocation();
                              setAskingLoc(false);
                              if (r.status === 'granted') { setLocIssue(null); setMe({ lng: r.lng, lat: r.lat, heading: null }); setRouteTick((t) => t + 1); }
                              else setLocIssue(r.status);
                            }}
                            className={`h-11 px-4 rounded-xl text-[14px] font-semibold disabled:opacity-60 ${locIssue ? 'border border-gray-200 text-gray-900' : 'bg-[#FF5A00] text-white'}`}
                          >
                            {askingLoc ? 'Checking…' : locIssue ? 'Try again' : 'Allow location'}
                          </button>
                        </div>
                        <p className="text-[13px] font-semibold text-gray-950 mt-4">Or set where you're starting from</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={startSearch} className="flex-1 h-11 px-3 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 flex items-center justify-center gap-1.5"><Search className="w-4 h-4" /> Search</button>
                          <button onClick={() => setPickMode('start')} className="flex-1 h-11 px-3 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-900 flex items-center justify-center gap-1.5"><MapPin className="w-4 h-4" /> Pick on map</button>
                        </div>
                      </div>
                    </div>
                  ) : routeError ? (
                    <p className="px-4 py-5 text-center text-[14px] text-gray-600">{routeError} <button onClick={computeRoutes} className="font-semibold text-[#FF5A00]">Retry</button></p>
                  ) : routes.map((r, i) => {
                    const sm = r.properties.summary as { distance: number; duration: number; trafficDelay?: number };
                    return (
                      <button key={i} onClick={() => setSelected(i)} className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-100 last:border-0 ${i === selected ? 'bg-orange-50/70' : ''}`}>
                        <span className={`w-2.5 h-10 rounded-full shrink-0 ${i === selected ? 'bg-[#FF5A00]' : 'bg-gray-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[17px] font-bold text-gray-950 tabular-nums">{fmtMin(sm.duration)}</p>
                          <p className="text-[12.5px] text-gray-500">{fmtKm(sm.distance)}{(sm.trafficDelay ?? 0) > 60 ? ` · +${fmtMin(sm.trafficDelay!)} traffic` : ' · light traffic'}</p>
                        </div>
                        {i === 0 && <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">Fastest</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="p-3 flex gap-2">
                  <button onClick={() => setSearchOpen(true)} className="h-14 px-4 rounded-2xl border border-gray-200 text-[15px] font-semibold text-gray-900 flex items-center gap-1.5"><Plus className="w-5 h-5" /> Add stop</button>
                  <button onClick={start} disabled={!active || routing} className="flex-1 h-14 rounded-2xl bg-[#FF5A00] text-white text-[16px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]">
                    <Navigation2 className="w-5 h-5 fill-white" /> Start
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {pickMode && (
          <div className="absolute left-3 right-3 top-[76px] z-30 rounded-2xl bg-gray-950 text-white shadow-lg px-4 py-3 flex items-center gap-3">
            <MapPin className="w-5 h-5 shrink-0" />
            <p className="flex-1 text-[14px] font-semibold">{pickMode === 'start' ? "Tap the map where you're starting from" : pickMode === 'stop' ? 'Tap the map to add a stop' : 'Tap the map to set your destination'}</p>
            <button onClick={() => setPickMode(null)} className="text-[13px] font-semibold text-white/80 shrink-0">Cancel</button>
          </div>
        )}

        {/* Recenter while navigating after the map was moved */}
        {navigating && !following && (
          <button onClick={() => recenter()} className="absolute left-1/2 -translate-x-1/2 bottom-[112px] z-20 h-12 px-5 rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.18)] border border-gray-100 text-[14px] font-bold text-gray-900 flex items-center gap-2 active:scale-95">
            <Navigation2 className="w-4 h-4 fill-[#FF5A00] text-[#FF5A00]" /> Re-center
          </button>
        )}

        {/* Search sheet */}
        {searchOpen && (
          <div className="absolute inset-x-0 top-0 z-40 max-h-[75%] landscape:left-3 landscape:right-auto landscape:top-3 landscape:w-[400px] landscape:rounded-3xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] rounded-b-3xl flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 p-3">
              <button onClick={closeSearch} aria-label="Close search" className="w-11 h-11 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 shrink-0"><ArrowLeft className="w-5 h-5" /></button>
              <div className="flex-1 flex items-center gap-2 h-12 px-4 rounded-full bg-gray-100">
                <Search className="w-5 h-5 text-gray-500 shrink-0" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchFor === 'start' ? 'Where are you starting from?' : dest ? 'Search a stop or new destination' : 'Search a place'} aria-label="Search places" className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-gray-950 placeholder:text-gray-500" />
                {q && <button onClick={() => setQ('')} aria-label="Clear" className="text-gray-500"><X className="w-4 h-4" /></button>}
              </div>
            </div>
            <button
              onClick={() => { const mode = searchFor === 'start' ? 'start' : dest ? 'stop' : 'dest'; closeSearch(); setPickMode(mode); }}
              className="mx-3 mb-3 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3 px-4 text-left active:scale-[0.99]"
            >
              <MapPin className="w-5 h-5 text-[#FF5A00] shrink-0" />
              <span className="flex-1 text-[15px] font-semibold text-gray-900">{searchFor === 'start' ? 'Choose start on map' : dest ? 'Choose a stop on map' : 'Choose on map'}</span>
            </button>
            <div className="flex-1 min-h-0 overflow-y-auto border-t border-gray-100">
              {searching && !results.length ? (
                <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 text-[#FF5A00] animate-spin" /></div>
              ) : searchMsg ? (
                <p className="py-8 px-6 text-center text-[14px] text-gray-500">{searchMsg}</p>
              ) : q.trim().length < 3 ? (
                <p className="py-8 px-6 text-center text-[14px] text-gray-500">Type at least 3 letters.</p>
              ) : (
                <ul>
                  {results.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
                      <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-gray-950 truncate">{p.name}</p>
                        <p className="text-[13px] text-gray-500 truncate">{p.km != null ? `${p.km < 1 ? `${Math.round(p.km * 1000)} m` : `${p.km.toFixed(1)} km`} · ` : ''}{p.address}</p>
                      </div>
                      {dest && searchFor === 'dest' && (
                        <button onClick={() => addStop(p)} className="h-11 px-3 rounded-full border border-gray-200 text-[13px] font-bold text-gray-900 flex items-center gap-1 shrink-0"><Plus className="w-4 h-4" /> Stop</button>
                      )}
                      <button onClick={() => goTo(p)} className="h-11 px-4 rounded-full bg-[#FF5A00] text-white text-[13px] font-bold shrink-0">{searchFor === 'start' ? 'Start here' : 'Go'}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {!dest && !searchOpen && (
          <div className="absolute left-3 right-3 bottom-3 z-20 landscape:right-auto landscape:w-[380px] rounded-3xl bg-white shadow-lg border border-gray-100 p-4">
            <p className="text-[15px] font-semibold text-gray-950">Where are you riding?</p>
            <p className="text-[13px] text-gray-500 mt-0.5">Search a destination to see route options.</p>
          </div>
        )}
      </div>
    </div>
  );
}
