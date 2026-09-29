import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ChevronLeft, Share2, Heart, Calendar, Users, MapPin, ShieldAlert, Camera, X, Check,
  Loader2, ChevronRight, LocateFixed, Clock, Route as RouteIcon, Copy, ExternalLink, Crown, UserPlus, Pencil, Flag, Download
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '../../lib/supabase';
import { saveOfflineCopy, readOfflineCopy } from '../../lib/offlineData';
import { auth } from '../../lib/firebase';
import { useToast } from '../../components/ToastContext';
import { useLocationStore } from '../../store/useLocationStore';
import { useIncidentCategories, incidentIconMap } from '../../hooks/useIncidentCategories';
import { getDeterministicUuid, getAppUser } from '../../lib/user';
import { useRideStartGate } from '../../components/RideStartGate';
import { downloadRoute } from '../../lib/offlineDownload';

type ReportStage = null | 'category' | 'details' | 'location' | 'success';

const CATEGORY_SUBTITLES: Record<string, string> = {
  'Accident': 'Collision or fall',
  'Traffic Jam': 'Heavy traffic or congestion',
  'Road Closed': 'Road blocked or closed',
  'Flood': 'Waterlogging or flooding',
  'Vibe Check': 'Harassment, unsafe behavior',
  'Construction': 'Roadwork or construction',
  'Hazard': 'Obstacle, debris, bad road',
  'Other': 'Something else',
};

const RideDetail = () => {
  const { id: rideId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ensureReady, gate } = useRideStartGate();
  const [starting, setStarting] = useState(false);
  const { showToast } = useToast();
  const { categories } = useIncidentCategories();

  const [ride, setRide] = useState<any>(null);
  const [riderCount, setRiderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'incidents'>('overview');
  const [incidents, setIncidents] = useState<any[]>([]);

  // Report-incident wizard state
  const [reportStage, setReportStage] = useState<ReportStage>(null);
  const [reportCategory, setReportCategory] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPhotos, setReportPhotos] = useState<File[]>([]);
  const [reportLat, setReportLat] = useState<number | null>(null);
  const [reportLng, setReportLng] = useState<number | null>(null);
  const [reportLocationLabel, setReportLocationLabel] = useState('');
  const [reportLocationSub, setReportLocationSub] = useState('');
  const [locatingUser, setLocatingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const reportMapContainer = React.useRef<HTMLDivElement>(null);
  const reportMap = React.useRef<maplibregl.Map | null>(null);
  const reportMarker = React.useRef<maplibregl.Marker | null>(null);

  const [members, setMembers] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [showAllRiders, setShowAllRiders] = useState(false);
  const [joining, setJoining] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ km: number; min: number } | null>(null);
  const [saved, setSaved] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [offline, setOffline] = useState<{ state: 'idle' | 'working' | 'done' | 'error'; done: number; total: number }>({ state: 'idle', done: 0, total: 0 });
  const routeMapContainer = React.useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!rideId) return;
    const [{ data: freshRide, error: rideErr }, { data: freshMem }, { data: freshStops }] = await Promise.all([
      supabase.from('rides').select('*').eq('id', rideId).single(),
      supabase.from('ride_members').select('*').eq('ride_id', rideId).order('created_at', { ascending: true }),
      supabase.from('ride_stops').select('*').eq('ride_id', rideId).order('sequence', { ascending: true }),
    ]);
    let data = freshRide, mem = freshMem, st = freshStops;
    if (rideErr || !freshRide) {
      const cached = readOfflineCopy<{ ride: any; members: any[]; stops: any[] }>('ride_' + rideId);
      if (cached) ({ ride: data, members: mem, stops: st } = cached);
    } else {
      saveOfflineCopy('ride_' + rideId, { ride: freshRide, members: freshMem || [], stops: freshStops || [] });
    }
    setRide(data);
    setMembers(mem || []);
    setRiderCount((mem || []).length);
    setStops(st || []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
    try { setSaved((JSON.parse(localStorage.getItem('rideclub_saved_rides') || '[]') as string[]).includes(rideId || '')); } catch { /* storage blocked */ }
  }, [rideId]);

  // Ordered route points: saved stops, else start → destination
  const routePoints = React.useMemo(() => {
    const fromStops = stops
      .filter((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number')
      .map((s) => ({ lat: s.latitude, lng: s.longitude, name: s.stop_name, type: s.stop_type }));
    if (fromStops.length >= 2) return fromStops;
    const pts = [];
    if (ride?.start_location?.lat != null) pts.push({ lat: ride.start_location.lat, lng: ride.start_location.lng, name: ride.start_location.name, type: 'Start' });
    if (ride?.destination?.lat != null) pts.push({ lat: ride.destination.lat, lng: ride.destination.lng, name: ride.destination.name, type: 'Destination' });
    return pts;
  }, [stops, ride]);

  useEffect(() => {
    if (!routeMapContainer.current || routePoints.length < 2 || reportStage || tab !== 'overview') return;
    const map = new maplibregl.Map({
      container: routeMapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [routePoints[0].lng, routePoints[0].lat],
      zoom: 11,
      attributionControl: false,
      cooperativeGestures: true,
    });
    const bounds = new maplibregl.LngLatBounds();
    routePoints.forEach((p) => bounds.extend([p.lng, p.lat]));

    routePoints.forEach((p, i) => {
      const el = document.createElement('div');
      const isEnd = i === routePoints.length - 1;
      el.className = 'rd-marker';
      el.style.cssText = `width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:#fff;font:800 12px system-ui;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);background:${i === 0 ? '#16a34a' : isEnd ? '#111827' : '#FF6B22'}`;
      el.textContent = i === 0 ? 'S' : isEnd ? 'F' : String(i);
      new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
    });

    const ctrl = new AbortController();
    map.on('load', async () => {
      map.fitBounds(bounds, { padding: 40, duration: 0 });
      let coords: [number, number][] = routePoints.map((p) => [p.lng, p.lat]);
      try {
        const q = routePoints.map((p) => `${p.lng},${p.lat}`).join(';');
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${q}?overview=full&geometries=geojson`, { signal: ctrl.signal });
        const json = await res.json();
        const r = json?.routes?.[0];
        if (r) {
          coords = r.geometry.coordinates;
          setRouteCoords(coords);
          setRouteInfo({ km: r.distance / 1000, min: r.duration / 60 });
        }
      } catch { /* fall back to straight segments */ }
      if (!map.getStyle()) return;
      map.addSource('ride-route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } } });
      map.addLayer({ id: 'ride-route-casing', type: 'line', source: 'ride-route', paint: { 'line-color': '#ffffff', 'line-width': 8 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      map.addLayer({ id: 'ride-route', type: 'line', source: 'ride-route', paint: { 'line-color': '#FF6B22', 'line-width': 5 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
    });
    return () => { ctrl.abort(); map.remove(); };
  }, [routePoints, reportStage, tab]);

  const loadIncidents = async () => {
    if (!rideId) return;
    const { data } = await supabase.from('pins').select('*').eq('ride_id', rideId).eq('status', 'active').order('created_at', { ascending: false });
    setIncidents(data || []);
  };

  useEffect(() => { loadIncidents(); }, [rideId]);

  const resetReport = () => {
    setReportStage(null);
    setReportCategory(null);
    setReportTitle('');
    setReportDescription('');
    setReportPhotos([]);
    setReportLat(null);
    setReportLng(null);
    setReportLocationLabel('');
    setReportLocationSub('');
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
      const data = await res.json();
      const props = data.features?.[0]?.properties;
      if (props) {
        setReportLocationLabel([props.district || props.name, props.city || props.state].filter(Boolean).join(', ') || 'Selected location');
        setReportLocationSub([props.street, props.name].filter(Boolean).join(', ') || '');
      }
    } catch (e) {
      console.warn('Reverse geocode failed', e);
    }
  };

  const useMyLocation = () => {
    setLocatingUser(true);
    useLocationStore.getState().fetchLocationOnce().then((loc) => {
      setReportLat(loc.lat);
      setReportLng(loc.lng);
      reportMap.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 15 });
      reportMarker.current?.setLngLat([loc.lng, loc.lat]);
      reverseGeocode(loc.lat, loc.lng);
    }).catch(() => {
      showToast('Unable to get your location', 'error');
    }).finally(() => setLocatingUser(false));
  };

  // Initialize the pick-a-location map when the location step opens
  useEffect(() => {
    if (reportStage !== 'location' || !reportMapContainer.current || reportMap.current) return;
    const lat = reportLat ?? ride?.start_location?.lat ?? 17.3850;
    const lng = reportLng ?? ride?.start_location?.lng ?? 78.4867;
    if (reportLat == null) { setReportLat(lat); setReportLng(lng); }

    reportMap.current = new maplibregl.Map({
      container: reportMapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [lng, lat],
      zoom: 15,
      attributionControl: false,
      interactive: true,
    });
    reportMarker.current = new maplibregl.Marker({ color: '#FF6B22' }).setLngLat([lng, lat]).addTo(reportMap.current);

    reportMap.current.on('click', (e) => {
      const { lng: clickLng, lat: clickLat } = e.lngLat;
      setReportLat(clickLat);
      setReportLng(clickLng);
      reportMarker.current?.setLngLat([clickLng, clickLat]);
      reverseGeocode(clickLat, clickLng);
    });

    if (!reportLocationLabel) reverseGeocode(lat, lng);

    return () => {
      reportMap.current?.remove();
      reportMap.current = null;
    };
  }, [reportStage]);

  const submitReport = async () => {
    if (!rideId || !reportCategory) return;
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      const reporterName = user?.displayName || user?.email?.split('@')[0] || 'Rider';

      const photoUrls: string[] = [];
      for (const file of reportPhotos) {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('incident-photos').upload(fileName, file);
        if (!upErr) {
          photoUrls.push(supabase.storage.from('incident-photos').getPublicUrl(fileName).data.publicUrl);
        }
      }

      const { error } = await supabase.from('pins').insert({
        category: reportCategory,
        title: reportTitle || reportCategory,
        description: reportDescription,
        latitude: reportLat ?? ride?.start_location?.lat ?? 0,
        longitude: reportLng ?? ride?.start_location?.lng ?? 0,
        severity: reportCategory === 'Accident' ? 3 : 1,
        status: 'active',
        reporter_name: reporterName,
        reporter_id: user ? getDeterministicUuid(user.uid) : null,
        ride_id: rideId,
        photo_url: photoUrls[0] || null,
        photo_urls: photoUrls
      });
      if (error) throw error;

      setReportStage('success');
      loadIncidents();
    } catch (e) {
      console.error(e);
      showToast('Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="w-full h-full bg-app-canvas flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#FF6B22] animate-spin" /></div>;
  }

  if (!ride) {
    return (
      <div className="w-full h-full bg-app-canvas flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-[14px] font-bold text-gray-700">Ride not found.</p>
        <button onClick={() => navigate('/explore')} className="px-4 py-2 btn-app-primary text-white text-[12px] font-bold rounded-full cursor-pointer">Back to Explore</button>
      </div>
    );
  }

  const isLive = ride.status === 'live';
  const routeText = [ride.start_location?.name, ride.destination?.name].filter(Boolean).join(' → ') || 'Route TBD';

  const me = getAppUser(auth.currentUser);
  const myUuid = me ? (me.uid.length === 36 ? me.uid : getDeterministicUuid(me.uid)) : null;
  const myMember = members.find((m) => m.user_id === myUuid);
  const isOwner = !!me && (ride.owner_id === me.uid || myMember?.role === 'admin');
  const isMember = !!myMember;
  const isFull = !!ride.max_riders && riderCount >= ride.max_riders;
  const leader = members.find((m) => m.role === 'admin') || null;
  const rideDate = ride.ride_date ? new Date(ride.ride_date) : null;
  const straightKm = routePoints.length >= 2
    ? routePoints.slice(1).reduce((sum: number, p: any, i: number) => {
        const a = routePoints[i];
        const R = 6371, dLat = ((p.lat - a.lat) * Math.PI) / 180, dLng = ((p.lng - a.lng) * Math.PI) / 180;
        const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((p.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        return sum + 2 * R * Math.asin(Math.sqrt(h));
      }, 0)
    : null;
  const km = routeInfo?.km ?? straightKm;
  const fmtDuration = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}m` : `${Math.round(min)} min`);

  const shareRide = async () => {
    const url = `${window.location.origin}/ride-plus/view/${ride.id}`;
    const text = `Join "${ride.name}" on RideClub${rideDate ? ` — ${rideDate.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : ''}.${ride.ride_code ? ` Ride code: ${ride.ride_code}` : ''}`;
    try {
      if (navigator.share) { await navigator.share({ title: ride.name, text, url }); return; }
    } catch { return; }
    try { await navigator.clipboard.writeText(`${text}\n${url}`); showToast('Invite link copied', 'success'); } catch { showToast('Could not copy link', 'error'); }
  };

  const copyCode = async () => {
    if (!ride.ride_code) return;
    try { await navigator.clipboard.writeText(ride.ride_code); showToast('Ride code copied', 'success'); } catch { /* clipboard blocked */ }
  };

  const toggleSave = () => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem('rideclub_saved_rides') || '[]');
      const next = list.includes(ride.id) ? list.filter((x) => x !== ride.id) : [...list, ride.id];
      localStorage.setItem('rideclub_saved_rides', JSON.stringify(next));
      setSaved(next.includes(ride.id));
    } catch { /* storage blocked */ }
  };

  const saveOffline = async () => {
    const path = routeCoords ? routeCoords.map(([lng, lat]) => ({ lat, lng })) : routePoints;
    if (path.length === 0) return;
    setOffline({ state: 'working', done: 0, total: 0 });
    try {
      await downloadRoute(path, (done, total) => setOffline({ state: 'working', done, total }));
      try { localStorage.setItem('rideclub_offline_ride_' + ride.id, String(Date.now())); } catch { /* storage blocked */ }
      setOffline((o) => ({ ...o, state: 'done' }));
    } catch (e) {
      console.error('Offline route download failed', e);
      setOffline({ state: 'error', done: 0, total: 0 });
    }
  };

  // Starting a scheduled ride: emergency contact first, one live ride at a time, then mark it live (the database enforces both too)
  const startRide = async () => {
    if (isLive) { if (await ensureReady()) navigate(`/ride-plus/live/${ride.id}`); return; }
    if (!(await ensureReady())) return;
    setStarting(true);
    try {
      const { data: other } = await supabase.from('rides').select('id, name').eq('owner_id', ride.owner_id).eq('status', 'live').neq('id', ride.id).limit(1);
      if (other?.length) { showToast(`End your live ride "${other[0].name || 'current ride'}" before starting this one.`, 'error'); return; }
      const { error } = await supabase.from('rides').update({ status: 'live' }).eq('id', ride.id);
      if (error) {
        const m = String(error.message || '');
        showToast(m.includes('EMERGENCY_CONTACT_REQUIRED') ? 'Add an emergency contact before starting a ride.' : m.includes('ALREADY_IN_LIVE_RIDE') ? 'You already have a live ride. End it first.' : 'Could not start the ride. Try again.', 'error');
        return;
      }
      navigate(`/ride-plus/live/${ride.id}`);
    } finally {
      setStarting(false);
    }
  };

  const joinRide = async () => {
    if (!me || !myUuid) { navigate('/login'); return; }
    setJoining(true);
    const { error } = await supabase.from('ride_members').insert({
      ride_id: ride.id,
      user_id: myUuid,
      role: 'rider',
      status: 'approved',
      display_name: me.displayName || me.email?.split('@')[0] || 'Rider',
      avatar_url: me.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(me.displayName || me.email?.split('@')[0] || 'Rider')}`,
    });
    setJoining(false);
    if (error && error.code !== '23505') { showToast(error.message || 'Could not join this ride', 'error'); return; }
    showToast(`You're in: ${ride.name}`, 'success');
    load();
  };

  // ---- Report-incident wizard screens ----
  if (reportStage) {
    return (
      <div className="w-full h-full bg-app-canvas flex flex-col overflow-hidden font-sans">
        {reportStage !== 'success' && (
          <div className="shrink-0 px-4 pt-4 pb-2 flex items-center gap-3">
            <button onClick={() => reportStage === 'category' ? resetReport() : setReportStage(reportStage === 'location' ? 'details' : 'category')} className="w-10 h-10 rounded-full card-app flex items-center justify-center text-gray-800 cursor-pointer active:scale-95 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[16px] font-bold text-gray-950">
              {reportStage === 'category' ? 'Report an Incident' : reportStage === 'details' ? 'Report Details' : 'Add Location & Photos'}
            </h1>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-4 pb-[100px] max-w-[520px] w-full mx-auto flex flex-col gap-4">
          {reportStage === 'category' && (
            <>
              <p className="text-[12px] text-gray-500 font-medium">Let us know what happened. This helps keep our community safe.</p>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.map(cat => {
                  const Icon = incidentIconMap[cat.iconName] || ShieldAlert;
                  const selected = reportCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setReportCategory(cat.id); setReportStage('details'); }}
                      className={`card-app p-3.5 flex flex-col items-start gap-2.5 cursor-pointer text-left transition-all ${selected ? 'ring-2 ring-[#FF6B22]' : ''}`}
                    >
                      <div className={`w-10 h-10 icon-badge ${cat.bg} shrink-0`}><Icon className={`w-5 h-5 ${cat.color}`} /></div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-950 leading-tight">{cat.id}</p>
                        <p className="text-[10.5px] text-gray-500 font-medium mt-0.5 leading-tight">{CATEGORY_SUBTITLES[cat.id] || 'Report this issue'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="card-app p-3.5 bg-blue-50/60 text-[11px] font-semibold text-blue-800 flex items-start gap-2 mt-1">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                This report will be shared with the ride/group members and admins. It is not public.
              </div>
            </>
          )}

          {reportStage === 'details' && (
            <>
              <p className="text-[12px] text-gray-500 font-medium">Add more information to help your group.</p>
              <div className="card-app p-3.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Title *</span>
                <input value={reportTitle} onChange={e => setReportTitle(e.target.value.slice(0, 100))} placeholder={`${reportCategory} near...`} className="w-full bg-transparent text-[14px] font-bold text-gray-950 placeholder-gray-400 focus:outline-none" />
                <div className="text-right"><span className="text-[10px] text-gray-400 font-medium">{reportTitle.length}/100</span></div>
              </div>
              <div className="card-app p-3.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Description *</span>
                <textarea value={reportDescription} onChange={e => setReportDescription(e.target.value.slice(0, 500))} rows={4} placeholder="What happened? Is everyone safe?" className="w-full bg-transparent text-[13px] text-gray-800 font-medium placeholder-gray-400 focus:outline-none resize-none" />
                <div className="text-right"><span className="text-[10px] text-gray-400 font-medium">{reportDescription.length}/500</span></div>
              </div>
              <button
                onClick={() => {
                  if (!reportDescription.trim()) { showToast('Please add a description', 'error'); return; }
                  setReportStage('location');
                }}
                className="w-full py-4 btn-app-primary text-white font-bold text-[14px] rounded-full cursor-pointer mt-1"
              >
                Next
              </button>
            </>
          )}

          {reportStage === 'location' && (
            <>
              <div>
                <span className="text-[13px] font-bold text-gray-950 block mb-2">Location *</span>
                <div className="card-app overflow-hidden">
                  <div ref={reportMapContainer} className="w-full h-[160px] relative" />
                  <button onClick={useMyLocation} disabled={locatingUser} className="w-full flex items-center gap-2 px-3.5 py-2.5 border-t border-gray-100 text-[12px] font-bold text-gray-700 cursor-pointer disabled:opacity-60">
                    {locatingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5 text-[#FF6B22]" />}
                    Use My Location
                  </button>
                  {reportLocationLabel && (
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-t border-gray-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-gray-950 truncate">{reportLocationLabel}</p>
                          {reportLocationSub && <p className="text-[10px] text-gray-500 truncate">{reportLocationSub}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[13px] font-bold text-gray-950 block mb-2">Add Photos (Optional)</span>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => {
                  if (e.target.files) setReportPhotos(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 5));
                }} />
                <div className="flex gap-2.5 flex-wrap">
                  {reportPhotos.map((f, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setReportPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {reportPhotos.length < 5 && (
                    <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-2xl card-app flex flex-col items-center justify-center gap-1 text-gray-500 cursor-pointer shrink-0">
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] font-bold">Add Photos{'\n'}(Up to 5)</span>
                    </button>
                  )}
                </div>
              </div>
              <button onClick={submitReport} disabled={submitting} className="w-full py-4 btn-app-primary text-white font-bold text-[14px] rounded-full cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Next
              </button>
            </>
          )}

          {reportStage === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-10">
              <div className="w-20 h-20 rounded-full bg-[#FF6B22]/10 flex items-center justify-center">
                <Check className="w-10 h-10 text-[#FF6B22]" strokeWidth={3} />
              </div>
              <div>
                <h2 className="text-[19px] font-black text-gray-950">Incident Reported</h2>
                <p className="text-[12px] text-gray-500 font-medium mt-1 max-w-[260px]">Your report has been shared with the ride members.</p>
              </div>
              <div className="w-full flex flex-col gap-2.5 mt-2">
                <button onClick={() => { resetReport(); setTab('incidents'); }} className="w-full py-3.5 btn-app-primary text-white font-bold text-[14px] rounded-full cursor-pointer">View in Ride</button>
                <button onClick={resetReport} className="w-full py-3.5 card-app text-gray-700 font-bold text-[14px] rounded-full cursor-pointer">Back to Ride</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Main ride detail (Overview / Incidents) ----
  const shownRiders = showAllRiders ? members : members.slice(0, 6);
  const stopList = routePoints;

  return (
    <React.Fragment>
      <Helmet><title>{ride.name} | RideClub</title></Helmet>
      <div className="w-full h-full bg-app-canvas flex flex-col overflow-hidden font-sans">
        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar pb-4 max-w-[560px] w-full mx-auto flex flex-col">

          <div className="relative h-[300px] shrink-0">
            <img
              src={ride.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=60'}
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=60'; }}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/85" />
            <button onClick={() => navigate(-1)} aria-label="Back" className="absolute top-4 left-4 w-11 h-11 rounded-full bg-white/95 flex items-center justify-center text-gray-800 shadow-md cursor-pointer active:scale-95 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button onClick={shareRide} aria-label="Share ride" className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center text-gray-800 shadow-md cursor-pointer active:scale-95 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={toggleSave} aria-label={saved ? 'Remove from saved' : 'Save ride'} className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md cursor-pointer active:scale-95 transition-all ${saved ? 'bg-white text-red-500' : 'bg-white/95 text-gray-800'}`}>
                <Heart className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="absolute left-4 right-4 bottom-12">
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {isLive && <span className="text-[11px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />Live now</span>}
                {ride.vehicle_type && ride.vehicle_type !== 'Any' && <span className="text-[11px] font-bold bg-white/20 backdrop-blur-sm border border-white/25 text-white px-2.5 py-1 rounded-full">{ride.vehicle_type}</span>}
                <span className="text-[11px] font-bold bg-white/20 backdrop-blur-sm border border-white/25 text-white px-2.5 py-1 rounded-full capitalize">{ride.visibility || 'public'} ride</span>
                {isOwner && <span className="text-[11px] font-bold bg-[#FF6B22] text-white px-2.5 py-1 rounded-full">You're the leader</span>}
              </div>
              <h1 className="text-[26px] font-black text-white leading-[1.1] drop-shadow-md">{ride.name}</h1>
              <p className="text-[13px] text-white/85 font-medium mt-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{routeText}</span></p>
            </div>
          </div>

          <div className="px-4 -mt-8 relative z-10 flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-[0_8px_24px_rgba(17,24,39,0.10)] border border-gray-100 grid grid-cols-4 divide-x divide-gray-100">
              {[
                { icon: Calendar, top: rideDate ? rideDate.toLocaleDateString([], { day: '2-digit', month: 'short' }) : 'TBD', sub: rideDate ? rideDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Time TBD' },
                { icon: Users, top: `${riderCount}/${ride.max_riders || '--'}`, sub: isFull ? 'Full' : 'Riders' },
                { icon: RouteIcon, top: km != null ? `${Math.round(km)} km` : '--', sub: 'Distance' },
                { icon: Clock, top: routeInfo ? fmtDuration(routeInfo.min) : '--', sub: 'Ride time' },
              ].map((st) => (
                <div key={st.sub} className="py-3.5 px-1 flex flex-col items-center gap-1 text-center">
                  <span className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center"><st.icon className="w-4 h-4 text-[#FF6B22]" /></span>
                  <span className="text-[14px] font-black text-gray-950 leading-tight">{st.top}</span>
                  <span className="text-[11px] font-semibold text-gray-500">{st.sub}</span>
                </div>
              ))}
            </div>

            {ride.ride_code && (
              <button onClick={copyCode} className="min-h-[52px] px-4 rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 flex items-center gap-3 text-left cursor-pointer active:scale-[0.99]">
                <span className="text-[11px] font-bold text-orange-700/80 uppercase tracking-wider">Ride code</span>
                <span className="flex-1 text-[16px] font-black tracking-[0.14em] text-gray-950">{ride.ride_code}</span>
                <span className="flex items-center gap-1 text-[12.5px] font-bold text-[#FF6B22]"><Copy className="w-4 h-4" /> Copy</span>
              </button>
            )}

            <div className="flex items-center gap-5 border-b border-gray-100">
              {(['overview', 'incidents'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={`pb-2.5 min-h-[44px] text-[14px] font-bold cursor-pointer border-b-2 transition-colors capitalize ${tab === t ? 'text-[#FF6B22] border-[#FF6B22]' : 'text-gray-400 border-transparent'}`}>
                  {t === 'incidents' ? `Incidents${incidents.length ? ` (${incidents.length})` : ''}` : t}
                </button>
              ))}
            </div>

            {tab === 'overview' ? (
              <div className="flex flex-col gap-5">
                {ride.description && (
                  <section className="card-app p-4">
                    <h2 className="text-[15px] font-black text-gray-950 mb-1.5">About this ride</h2>
                    <p className="text-[14px] leading-relaxed text-gray-600">{ride.description.replace(/^Type: .+\n?\n?/m, '')}</p>
                  </section>
                )}

                {routePoints.length >= 2 && (
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-[15px] font-black text-gray-950">Route</h2>
                      <a
                        href={`https://www.google.com/maps/dir/${routePoints.map((p: any) => `${p.lat},${p.lng}`).join('/')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12.5px] font-bold text-[#FF6B22] min-h-[36px] flex items-center gap-1"
                      >
                        Open in Maps <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-100 shadow-sm">
                      <div ref={routeMapContainer} className="w-full h-[240px]" />
                      {km != null && (
                        <span className="absolute left-3 bottom-3 bg-white/95 rounded-full px-3 py-1.5 text-[12px] font-bold text-gray-900 shadow-md flex items-center gap-1.5">
                          <RouteIcon className="w-3.5 h-3.5 text-[#FF6B22]" /> {Math.round(km)} km{routeInfo ? ` · ${fmtDuration(routeInfo.min)}` : ''}
                        </span>
                      )}
                    </div>
                  </section>
                )}

                {routePoints.length >= 2 && (
                  <button
                    onClick={saveOffline}
                    disabled={offline.state === 'working'}
                    className="card-app min-h-[60px] px-3.5 py-3 flex items-center gap-3 text-left cursor-pointer disabled:cursor-default"
                  >
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${offline.state === 'done' ? 'bg-emerald-50 text-emerald-600' : offline.state === 'error' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-[#FF6B22]'}`}>
                      {offline.state === 'working' ? <Loader2 className="w-5 h-5 animate-spin" /> : offline.state === 'done' ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-bold text-gray-950">
                        {offline.state === 'done' ? 'Route saved for offline' : offline.state === 'working' ? 'Saving route map…' : offline.state === 'error' ? 'Download failed — tap to retry' : 'Save route for offline'}
                      </span>
                      {offline.state === 'working' && offline.total > 0 ? (
                        <span className="block mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <span className="block h-full bg-[#FF6B22] rounded-full transition-[width]" style={{ width: `${Math.round((offline.done / offline.total) * 100)}%` }} />
                        </span>
                      ) : (
                        <span className="block text-[12px] text-gray-500 font-medium">
                          {offline.state === 'done' ? 'Map works along this route without signal' : 'Map along the whole route, for areas with no signal'}
                        </span>
                      )}
                    </span>
                  </button>
                )}

                {stopList.length > 0 && (
                  <section>
                    <div className="flex items-end justify-between mb-2.5">
                      <h2 className="text-[16px] font-black text-gray-950">Route stops</h2>
                      <span className="text-[12px] font-bold text-gray-500">{stopList.length} stops{km != null ? ` · ${Math.round(km)} km` : ''}</span>
                    </div>
                    <ol className="flex flex-col">
                      {stopList.map((p: any, i: number) => {
                        const isFirst = i === 0, isLast = i === stopList.length - 1;
                        const tone = isFirst ? 'emerald' : isLast ? 'gray' : 'orange';
                        const legKm = i > 0 ? (() => {
                          const q = stopList[i - 1];
                          const dLat = ((p.lat - q.lat) * Math.PI) / 180, dLng = ((p.lng - q.lng) * Math.PI) / 180;
                          const h = Math.sin(dLat / 2) ** 2 + Math.cos((q.lat * Math.PI) / 180) * Math.cos((p.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
                          return 2 * 6371 * Math.asin(Math.sqrt(h));
                        })() : null;
                        return (
                          <li key={`${p.name}-${i}`} className="relative flex gap-3 pb-3 last:pb-0">
                            {!isLast && <span className="absolute left-[19px] top-10 bottom-0 border-l-2 border-dashed border-gray-300" />}
                            <span className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${tone === 'emerald' ? 'bg-emerald-500 text-white' : tone === 'gray' ? 'bg-gray-900 text-white' : 'bg-white text-[#FF6B22] border-2 border-[#FF6B22]'}`}>
                              {isFirst ? <Flag className="w-4.5 h-4.5" /> : isLast ? <MapPin className="w-4.5 h-4.5" /> : <span className="text-[14px] font-black">{i}</span>}
                            </span>
                            <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm px-3.5 py-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[14.5px] font-bold text-gray-950 leading-tight">{p.name || 'Unnamed stop'}</p>
                                {legKm != null && <span className="shrink-0 text-[11px] font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5" title="Straight-line distance from previous stop">~{Math.round(legKm)} km</span>}
                              </div>
                              <p className={`text-[12px] font-semibold mt-0.5 ${isFirst ? 'text-emerald-600' : isLast ? 'text-gray-500' : 'text-[#FF6B22]'}`}>
                                {isFirst ? `Meeting point${rideDate ? ` · ${rideDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}` : isLast ? 'Destination' : (p.type && p.type !== 'Stop' ? p.type : 'Stop along the way')}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                )}

                {leader && (
                  <section>
                    <h2 className="text-[16px] font-black text-gray-950 mb-2.5">Ride leader</h2>
                    <div role="button" tabIndex={0} onClick={() => navigate(`/rider/${leader.user_id}`)} className="card-app p-3.5 flex items-center gap-3 cursor-pointer">
                      <img src={leader.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.display_name || 'Leader')}`} alt={leader.display_name || 'Leader'} onError={(e) => { const n = encodeURIComponent((e.currentTarget.alt || 'Rider')); if (!e.currentTarget.src.includes('ui-avatars')) e.currentTarget.src = 'https://ui-avatars.com/api/?background=ff6b22&color=fff&name=' + n; }} className="w-12 h-12 rounded-full object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold text-gray-950 truncate">{leader.display_name || 'Ride leader'}{leader.user_id === myUuid ? ' (you)' : ''}</p>
                        <p className="text-[12.5px] text-gray-500 font-medium">Organiser of this ride</p>
                      </div>
                      <span className="shrink-0 flex items-center gap-1 text-[11.5px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full"><Crown className="w-3.5 h-3.5" /> Leader</span>
                    </div>
                  </section>
                )}

                <section>
                  <div className="flex items-end justify-between mb-2.5">
                    <h2 className="text-[16px] font-black text-gray-950">Riders</h2>
                    <span className="text-[12px] font-bold text-gray-500">{riderCount} going{ride.max_riders ? ` · ${Math.max(0, ride.max_riders - riderCount)} spots left` : ''}</span>
                  </div>
                  <div className="card-app overflow-hidden">
                    {ride.max_riders ? (
                      <div className="px-3.5 pt-3.5">
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-[#FF6B22]" style={{ width: `${Math.min(100, (riderCount / ride.max_riders) * 100)}%` }} />
                        </div>
                      </div>
                    ) : null}
                    {members.length === 0 ? (
                      <p className="p-4 text-center text-[13px] font-semibold text-gray-500">No riders yet — be the first to join.</p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {shownRiders.map((m) => (
                          <li key={m.id || m.user_id} role="button" tabIndex={0} onClick={() => navigate(`/rider/${m.user_id}`)} className="flex items-center gap-3 px-3.5 py-2.5 min-h-[56px] cursor-pointer hover:bg-gray-50">
                            <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.display_name || 'Rider')}`} alt={m.display_name || 'Rider'} onError={(e) => { const n = encodeURIComponent((e.currentTarget.alt || 'Rider')); if (!e.currentTarget.src.includes('ui-avatars')) e.currentTarget.src = 'https://ui-avatars.com/api/?background=ff6b22&color=fff&name=' + n; }} className="w-10 h-10 rounded-full object-cover shrink-0" />
                            <span className="flex-1 min-w-0 text-[14px] font-semibold text-gray-900 truncate">{m.display_name || 'Rider'}{m.user_id === myUuid ? ' (you)' : ''}</span>
                            <span className={`shrink-0 text-[11.5px] font-bold px-2.5 py-1 rounded-full ${m.role === 'admin' ? 'text-amber-700 bg-amber-50' : m.status === 'pending' ? 'text-gray-600 bg-gray-100' : 'text-emerald-700 bg-emerald-50'}`}>
                              {m.role === 'admin' ? 'Leader' : m.status === 'pending' ? 'Pending' : 'Going'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {members.length > 6 && (
                      <button onClick={() => setShowAllRiders((v) => !v)} className="w-full min-h-[48px] border-t border-gray-100 text-[13.5px] font-bold text-[#FF6B22] cursor-pointer">
                        {showAllRiders ? 'Show less' : `View all ${members.length} riders`}
                      </button>
                    )}
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={shareRide} className="min-h-[112px] rounded-3xl p-3.5 flex flex-col justify-between text-left cursor-pointer active:scale-[0.98] transition-transform bg-gradient-to-br from-[#ff8a3d] to-[#f0530f] text-white shadow-[0_8px_20px_rgba(255,107,34,0.35)]">
                    <span className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center"><UserPlus className="w-5 h-5" /></span>
                    <span>
                      <span className="block text-[15px] font-black">Invite riders</span>
                      <span className="block text-[11.5px] font-semibold text-white/85">Share link{ride.ride_code ? ' & code' : ''}</span>
                    </span>
                  </button>
                  <button onClick={() => setReportStage('category')} className="min-h-[112px] rounded-3xl p-3.5 flex flex-col justify-between text-left cursor-pointer active:scale-[0.98] transition-transform bg-white border border-red-100 shadow-sm">
                    <span className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-red-600" /></span>
                    <span>
                      <span className="block text-[15px] font-black text-gray-950">Report incident</span>
                      <span className="block text-[11.5px] font-semibold text-gray-500">Only ride members see it</span>
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {incidents.length === 0 ? (
                  <div className="card-app p-6 text-center">
                    <ShieldAlert className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-[13px] font-semibold text-gray-500">No incidents reported on this ride yet.</p>
                  </div>
                ) : incidents.map(inc => (
                  <div key={inc.id} className="card-app p-3.5 flex items-start gap-3">
                    <div className="w-9 h-9 icon-badge bg-red-50 shrink-0"><ShieldAlert className="w-4 h-4 text-red-500" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-gray-950">{inc.title || inc.category}</p>
                      <p className="text-[12px] text-gray-500 font-medium mt-0.5">{inc.description}</p>
                      <p className="text-[11px] text-gray-400 font-semibold mt-1">Reported by {inc.reporter_name || 'a rider'} · {new Date(inc.created_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
                <button onClick={() => setReportStage('category')} className="w-full min-h-[48px] card-app text-[#FF6B22] font-bold text-[13px] rounded-full cursor-pointer flex items-center justify-center gap-1.5">
                  + Report a New Incident
                </button>
              </div>
            )}
          </div>
        </div>

        {gate}
        <div className="shrink-0 px-4 pt-3 pb-[104px] max-w-[560px] w-full mx-auto flex gap-2.5">
          {isOwner ? (
            <>
              <button onClick={() => navigate('/ride-plus/create', { state: { editRideId: ride.id } })} className="min-h-[56px] px-5 card-app text-gray-900 font-bold text-[15px] rounded-full cursor-pointer flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button onClick={startRide} disabled={starting} className="flex-1 min-h-[56px] btn-app-primary text-white font-bold text-[16px] rounded-full cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
                {starting && <Loader2 className="w-5 h-5 animate-spin" />}{isLive ? 'Open live ride' : 'Start ride'}
              </button>
            </>
          ) : isMember ? (
            <button onClick={async () => { if (isLive && !(await ensureReady())) return; navigate(`/ride-plus/live/${ride.id}`); }} className="w-full min-h-[56px] btn-app-primary text-white font-bold text-[16px] rounded-full cursor-pointer">
              {isLive ? 'Join live ride' : "You're going · Open ride"}
            </button>
          ) : (
            <button onClick={joinRide} disabled={joining || isFull} className="w-full min-h-[56px] btn-app-primary text-white font-bold text-[16px] rounded-full cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
              {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isFull ? 'Ride is full' : joining ? 'Joining…' : 'Join Ride'}
            </button>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default RideDetail;
