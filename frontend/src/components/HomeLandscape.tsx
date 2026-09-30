import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Users, SlidersHorizontal, Compass, Plus, Calendar, UsersRound,
  ChevronRight, ChevronDown, ShieldAlert, Radio, Bell, Siren, Clock, Sun, Cloud,
  CloudRain, CloudFog, CloudLightning, Snowflake, Map as MapIcon, Zap
} from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';
import { supabase } from '../lib/supabase';
import { saveOfflineCopy, readOfflineCopy } from '../lib/offlineData';
import { auth } from '../lib/firebase';
import { getDeterministicUuid, getAppUser } from '../lib/user';
import { SOSModal } from './SOSModal';
import heroImg from '../assets/rideclub/riders_coast_wide.jpg';
import { useAvatar, initialsImage } from '../hooks/useAvatar';
import './HomeLandscape.css';

interface Ride {
  id: string;
  name: string;
  ride_date: string | null;
  image_url: string | null;
  start_location: { lat?: number; lng?: number; name?: string } | null;
  destination: { lat?: number; lng?: number; name?: string } | null;
  max_riders: number | null;
  vehicle_type: string | null;
  rider_count: number;
}

interface Member { ride_id: string; user_id: string; display_name: string | null; avatar_url: string | null; }

type Filter = 'all' | 'near' | 'weekend' | 'Motorcycle' | 'Scooter';

const NEAR_KM = 25;
const fallbackRideImage = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=60';

const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const hasCoords = (p: Ride['start_location']): p is { lat: number; lng: number; name?: string } =>
  !!p && typeof p.lat === 'number' && typeof p.lng === 'number';

// WMO weather codes (Open-Meteo) → short label + icon
const weatherInfo = (code: number) => {
  if (code === 0) return { label: 'Clear', Icon: Sun };
  if (code <= 3) return { label: 'Cloudy', Icon: Cloud };
  if (code <= 48) return { label: 'Foggy', Icon: CloudFog };
  if (code <= 67 || (code >= 80 && code <= 82)) return { label: 'Rain', Icon: CloudRain };
  if (code <= 77 || code === 85 || code === 86) return { label: 'Snow', Icon: Snowflake };
  return { label: 'Storm', Icon: CloudLightning };
};

const isThisWeekend = (s: string | null) => {
  if (!s) return false;
  const d = new Date(s);
  const now = new Date();
  const sat = new Date(now);
  sat.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7));
  sat.setHours(0, 0, 0, 0);
  const monday = new Date(sat);
  monday.setDate(sat.getDate() + 2);
  return (d >= sat && d < monday) || (now.getDay() === 0 && d.toDateString() === now.toDateString());
};

export const HomeLandscape = ({ currentRide }: { currentRide?: any }) => {
  const { coordinates, locationName } = useLocationStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [liveRide, setLiveRide] = useState<{ id: string; name: string } | null>(null);
  const [liveMembers, setLiveMembers] = useState<Member[]>([]);

  const user = getAppUser(auth.currentUser);
  const avatar = useAvatar(user);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const load = async () => {
      const { data, error: ridesErr } = await supabase
        .from('rides')
        .select('id, name, ride_date, image_url, start_location, destination, max_riders, vehicle_type')
        .eq('visibility', 'public')
        .gte('ride_date', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
        .order('ride_date', { ascending: true })
        .limit(40);
      if (ridesErr) {
        const cached = readOfflineCopy<{ rides: Ride[]; members: Member[] }>('home_rides');
        setRides(cached?.rides || []);
        setMembers(cached?.members || []);
        setLoaded(true);
        return;
      }
      if (!data || data.length === 0) { setRides([]); setLoaded(true); return; }

      const { data: mem } = await supabase
        .from('ride_members')
        .select('ride_id, user_id, display_name, avatar_url')
        .in('ride_id', data.map((r) => r.id));

      const counts: Record<string, number> = {};
      (mem || []).forEach((m) => { counts[m.ride_id] = (counts[m.ride_id] || 0) + 1; });
      const list = data.map((r) => ({ ...r, rider_count: counts[r.id] || 0 }));
      saveOfflineCopy('home_rides', { rides: list, members: mem || [] });
      setMembers(mem || []);
      setRides(list);
      setLoaded(true);
    };
    load();
  }, []);

  // the rider's current ride = a 'live' ride they lead or belong to
  useEffect(() => {
    const u = getAppUser(auth.currentUser);
    if (!u) return;
    const myUuid = u.uid.length === 36 ? u.uid : getDeterministicUuid(u.uid);
    const loadLive = async () => {
      const [{ data: owned }, { data: mine }] = await Promise.all([
        supabase.from('rides').select('id, name').eq('owner_id', u.uid).eq('status', 'live').limit(1),
        supabase.from('ride_members').select('ride_id').eq('user_id', myUuid),
      ]);
      let ride = owned?.[0] || null;
      if (!ride && mine && mine.length > 0) {
        const { data } = await supabase.from('rides').select('id, name').in('id', mine.map((m) => m.ride_id)).eq('status', 'live').order('ride_date', { ascending: false }).limit(1);
        ride = data?.[0] || null;
      }
      setLiveRide(ride);
      if (!ride) { setLiveMembers([]); return; }
      const { data: mem } = await supabase.from('ride_members').select('ride_id, user_id, display_name, avatar_url').eq('ride_id', ride.id);
      setLiveMembers(mem || []);
    };
    loadLive();
  }, []);

  useEffect(() => {
    if (!coordinates) return;
    const ctrl = new AbortController();
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat.toFixed(3)}&longitude=${coordinates.lng.toFixed(3)}&current=temperature_2m,weather_code`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => { if (d?.current) setWeather({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code }); })
      .catch(() => {});
    return () => ctrl.abort();
  }, [coordinates?.lat.toFixed(2), coordinates?.lng.toFixed(2)]);

  const distFromMe = (r: Ride) => (coordinates && hasCoords(r.start_location) ? distanceKm(coordinates, r.start_location) : null);
  const routeKm = (r: Ride) => (hasCoords(r.start_location) && hasCoords(r.destination) ? distanceKm(r.start_location, r.destination) : null);

  const nearbyRides = useMemo(() => rides.filter((r) => { const d = distFromMe(r); return d !== null && d <= NEAR_KM; }), [rides, coordinates]);

  const shownRides = useMemo(() => {
    let list = rides;
    if (filter === 'near') list = nearbyRides;
    else if (filter === 'weekend') list = rides.filter((r) => isThisWeekend(r.ride_date));
    else if (filter === 'Motorcycle' || filter === 'Scooter') list = rides.filter((r) => r.vehicle_type === filter);
    return list.slice(0, 12);
  }, [filter, rides, nearbyRides]);

  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedFor, setSearchedFor] = useState('');
  const searchAbortRef = React.useRef<AbortController | null>(null);

  const runSearch = React.useCallback(async (q: string) => {
    searchAbortRef.current?.abort();
    const ctrl = new AbortController();
    searchAbortRef.current = ctrl;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setSearchResults(data.slice(0, 6));
      setSearchedFor(q);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setSearchResults([]);
      setSearchError(navigator.onLine ? 'Search is unavailable right now. Try again.' : 'No internet connection.');
      setSearchedFor(q);
    } finally {
      if (searchAbortRef.current === ctrl) setIsSearching(false);
    }
  }, []);

  // Suggestions as you type: wait for a short pause and at least 3 characters to avoid a request per keystroke
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      searchAbortRef.current?.abort();
      setSearchResults([]);
      setSearchError(null);
      setSearchedFor('');
      setIsSearching(false);
      return;
    }
    const t = setTimeout(() => runSearch(q), 350);
    return () => clearTimeout(t);
  }, [searchQuery, runSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length >= 2) runSearch(q);
  };

  // Tapping a result starts navigation straight away (Navigation builds the route).
  const selectDestination = (place: any) => {
    setSearchResults([]);
    setSearchQuery('');
    navigate('/navigation', {
      state: { destLat: parseFloat(place.lat), destLng: parseFloat(place.lon), destName: place.name || place.display_name.split(',')[0] },
    });
  };

  const fmtWhen = (s: string | null) => {
    if (!s) return 'Date TBD';
    const d = new Date(s);
    return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  };

  const parts = (locationName || '').split(',').map((p) => p.trim()).filter(Boolean);
  const place = parts[0] || 'Locating…';
  const address = parts.slice(1, 3).join(', ') || 'Finding your location';
  const W = weather ? weatherInfo(weather.code) : null;

  const categories = [
    { icon: Compass, label: 'Find Rides', path: '/explore', tone: 'orange' },
    { icon: Plus, label: 'Create Ride', path: '/ride-plus/create', tone: 'dark' },
    { icon: Calendar, label: 'My Rides', path: '/ride-plus', tone: 'blue' },
    { icon: UsersRound, label: 'Clubs', path: '/groups', tone: 'violet' },
    { icon: MapIcon, label: 'Map', path: '/map', tone: 'green' },
    { icon: Radio, label: 'Live Updates', path: '/alerts', tone: 'sky' },
    { icon: ShieldAlert, label: 'Report', path: '/map', state: { reportMode: true }, tone: 'red' },
  ];

  const filters: { id: Filter; label: string; icon?: typeof Zap }[] = [
    { id: 'all', label: 'All rides' },
    { id: 'near', label: 'Near me', icon: Zap },
    { id: 'weekend', label: 'This weekend' },
    { id: 'Motorcycle', label: 'Motorcycle' },
    { id: 'Scooter', label: 'Scooter' },
  ];

  return (
    <div className="hl-root">
      {/* Top: location + actions + search sit on the banner's colour */}
      <header className="hl-top">
        <img src={heroImg} alt="" className="hl-top-img" />
        <div className="hl-top-fade" />

        <div className="hl-bar">
          <button className="hl-loc" onClick={() => navigate('/map')}>
            <span className="hl-loc-1"><MapPin size={20} fill="currentColor" strokeWidth={0} /> {place} <ChevronDown size={18} /></span>
            <span className="hl-loc-2">{address}</span>
          </button>
          <div className="hl-bar-actions">
            <button className="hl-round hl-sos" onClick={() => setShowSOSModal(true)} aria-label="SOS"><Siren size={20} /></button>
            <button className="hl-round" onClick={() => navigate('/alerts')} aria-label="Alerts"><Bell size={20} /><i className="hl-dot" /></button>
            <button className="hl-round hl-me" onClick={() => navigate('/profile')} aria-label="Profile"><img src={avatar} alt="" referrerPolicy="no-referrer" onError={(e) => { const f = initialsImage(user?.displayName || user?.email?.split('@')[0] || 'Rider'); if (e.currentTarget.src !== f) e.currentTarget.src = f; }} className="hl-me-img" /></button>
          </div>
        </div>

        <div className="hl-search-wrap">
        <form onSubmit={handleSearch} className="hl-search">
          <Search size={22} className="hl-search-ico" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search "Ananthagiri Hills"'
            aria-label="Search places"
          />
          <button type="button" className="hl-search-filter" onClick={() => navigate('/explore')} aria-label="Filters">
            <SlidersHorizontal size={20} />
          </button>
        </form>
        {searchQuery.trim().length >= 3 && (searchResults.length > 0 || isSearching || searchError || searchedFor) && (
          <div className="hl-results" role="listbox" aria-label="Place suggestions">
            {isSearching && searchResults.length === 0 && <div className="hl-results-empty">Searching "{searchQuery.trim()}"…</div>}
            {!isSearching && searchError && <div className="hl-results-empty">{searchError}</div>}
            {!isSearching && !searchError && searchedFor && searchResults.length === 0 && <div className="hl-results-empty">No places found for "{searchedFor}"</div>}
            {searchResults.map((r, i) => (
              <button key={i} type="button" onClick={() => selectDestination(r)} className="hl-result">
                <MapPin size={18} />
                <span><strong>{r.name || r.display_name.split(',')[0]}</strong><small>{r.display_name}</small></span>
              </button>
            ))}
          </div>
        )}
        </div>

        <div className="hl-banner">
          <p className="hl-banner-hi">{greeting}</p>
          <h1 className="hl-banner-title">Ready to <span>Ride?</span></h1>
          {W && weather && (
            <p className="hl-banner-meta"><W.Icon size={16} /> {weather.temp}°C · {W.label} · great riding weather</p>
          )}
          <button className="hl-banner-cta" onClick={() => navigate('/explore')}>Find a ride <ChevronRight size={18} /></button>
        </div>
      </header>

      <div className="hl-body">
        {/* Category row — like Zomato's cuisine strip */}
        <nav className="hl-cats" aria-label="Quick actions">
          {categories.map((c) => (
            <button
              key={c.label}
              className={`hl-cat hl-cat-${c.tone}`}
              onClick={() => navigate(c.path, c.state ? { state: c.state } : undefined)}
            >
              <span className="hl-cat-ico"><c.icon size={28} strokeWidth={2.2} /></span>
              <span className="hl-cat-label">{c.label}</span>
            </button>
          ))}
        </nav>

        {/* Your current (live) ride and the riders on it */}
        {liveRide ? (
          <button className="hl-near" onClick={() => navigate(`/ride-plus/live/${liveRide.id}`)}>
            <span className="hl-near-avs">
              {liveMembers.slice(0, 4).map((m) =>
                m.avatar_url
                  ? <img key={m.user_id} src={m.avatar_url} alt={m.display_name || ''} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  : <span key={m.user_id}>{(m.display_name || 'R')[0]}</span>
              )}
              {liveMembers.length > 4 && <span>+{liveMembers.length - 4}</span>}
            </span>
            <span className="hl-near-txt">
              <strong><i /> {liveRide.name || 'Your ride'}</strong>
              <small>Riding now · {liveMembers.length} {liveMembers.length === 1 ? 'rider' : 'riders'} in your pack</small>
            </span>
            <ChevronRight size={20} />
          </button>
        ) : (
          <button className="hl-near hl-near-idle" onClick={() => navigate('/explore')}>
            <span className="hl-near-avs"><span className="hl-near-empty"><Users size={18} /></span></span>
            <span className="hl-near-txt">
              <strong>You're not on a ride</strong>
              <small>Join or start a ride to see your pack here</small>
            </span>
            <ChevronRight size={20} />
          </button>
        )}

        {/* Filter chips */}
        <div className="hl-chips" role="tablist" aria-label="Filter rides">
          <button className="hl-chip hl-chip-filter" onClick={() => navigate('/explore')}><SlidersHorizontal size={16} /> Filters <ChevronDown size={16} /></button>
          {filters.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              className={`hl-chip${filter === f.id ? ' is-on' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.icon && <f.icon size={15} className="hl-chip-ico" />}{f.label}
            </button>
          ))}
        </div>

        <h2 className="hl-label">Upcoming rides for you</h2>

        {!loaded ? (
          <div className="hl-grid">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="hl-card is-skeleton"><div className="hl-card-img" /><div className="hl-sk-line" /><div className="hl-sk-line short" /></div>)}
          </div>
        ) : shownRides.length === 0 ? (
          <div className="hl-empty">
            <p>{rides.length === 0 ? 'No upcoming rides yet — start one for your crew.' : 'No rides match this filter.'}</p>
            <button onClick={() => (rides.length === 0 ? navigate('/ride-plus/create') : setFilter('all'))}>
              {rides.length === 0 ? 'Create a ride' : 'Show all rides'}
            </button>
          </div>
        ) : (
          <div className="hl-grid">
            {shownRides.map((r) => {
              const km = routeKm(r);
              const isLive = currentRide?.id === r.id;
              return (
                <button
                  key={r.id}
                  className="hl-card"
                  onClick={() => navigate(isLive ? `/ride-plus/live/${r.id}` : `/ride-plus/view/${r.id}`)}
                >
                  <span className="hl-card-img">
                    <img src={r.image_url || fallbackRideImage} alt="" loading="lazy" onError={(e) => { if (e.currentTarget.src !== fallbackRideImage) e.currentTarget.src = fallbackRideImage; }} />
                    {km !== null && <span className="hl-card-tag">{Math.round(km)} km route</span>}
                    <span className="hl-card-badge"><Users size={12} strokeWidth={2.6} /> {r.rider_count}</span>
                  </span>
                  <span className="hl-card-name">{r.name || 'Group Ride'}</span>
                  <span className="hl-card-meta"><Clock size={14} /> {fmtWhen(r.ride_date)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showSOSModal && (
        <SOSModal
          isReceiving={false}
          data={{
            coordinates: coordinates ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : '17.3850, 78.4867',
            riderName: 'Dev Rider',
            bikeDetails: 'Ducati Panigale V4',
            bloodGroup: 'O+',
            emergencyContact: '+91 98765 43210'
          }}
          onClose={() => setShowSOSModal(false)}
        />
      )}
    </div>
  );
};
