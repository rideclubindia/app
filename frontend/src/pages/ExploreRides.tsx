import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search, SlidersHorizontal, MapPin, Users, Calendar, Heart, Bell, Map as MapIcon, List as ListIcon, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { saveOfflineCopy, readOfflineCopy } from '../lib/offlineData';
import { useLocationStore } from '../store/useLocationStore';
import { MapEngine } from '../map/MapEngine';
import { useAvatar, initialsImage } from '../hooks/useAvatar';
import { getAppUser } from '../lib/user';
import { auth } from '../lib/firebase';

interface Ride {
  id: string;
  name: string;
  ride_date: string | null;
  image_url: string | null;
  start_location: { lat?: number; lng?: number; name?: string } | null;
  destination: { name?: string } | null;
  max_riders: number | null;
  vehicle_type: string | null;
  status: string | null;
  rider_count: number;
}

const SAVED_RIDES_KEY = 'rideclub_saved_rides';

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const ExploreRides = () => {
  const navigate = useNavigate();
  const coordinates = useLocationStore(s => s.coordinates);

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'weekend'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'nearby'>('date');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_RIDES_KEY) || '[]'); } catch { return []; }
  });

  // Real data only: public, upcoming rides with a live member count per ride.
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: ridesData, error: ridesErr } = await supabase
        .from('rides')
        .select('id, name, ride_date, image_url, start_location, destination, max_riders, vehicle_type, status')
        .eq('visibility', 'public')
        .gte('ride_date', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
        .order('ride_date', { ascending: true })
        .limit(50);

      if (ridesErr) {
        setRides(readOfflineCopy<Ride[]>('explore_rides') || []);
        setLoading(false);
        return;
      }

      if (!ridesData || ridesData.length === 0) {
        setRides([]);
        setLoading(false);
        return;
      }

      const ids = ridesData.map(r => r.id);
      const { data: members } = await supabase.from('ride_members').select('ride_id').in('ride_id', ids);
      const counts: Record<string, number> = {};
      (members || []).forEach(m => { counts[m.ride_id] = (counts[m.ride_id] || 0) + 1; });

      const list = ridesData.map(r => ({ ...r, rider_count: counts[r.id] || 0 }));
      saveOfflineCopy('explore_rides', list);
      setRides(list);
      setLoading(false);
    };
    load();
  }, []);

  const toggleSave = (id: string) => {
    setSaved(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(SAVED_RIDES_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Vehicle chips are derived from what's actually in the data — never a
  // hardcoded category list that might not match the real vehicle_type values.
  const vehicleOptions = useMemo(() => {
    const set = new Set<string>();
    rides.forEach(r => { if (r.vehicle_type && r.vehicle_type !== 'Any') set.add(r.vehicle_type); });
    return ['All', ...Array.from(set)];
  }, [rides]);

  const distanceFor = (ride: Ride) => {
    if (!coordinates || !ride.start_location?.lat || !ride.start_location?.lng) return null;
    return getDistanceKm(coordinates.lat, coordinates.lng, ride.start_location.lat, ride.start_location.lng);
  };

  const filteredRides = useMemo(() => {
    const now = new Date();
    let list = rides.filter(r => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const haystack = [r.name, r.start_location?.name, r.destination?.name].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (vehicleFilter !== 'All' && r.vehicle_type !== vehicleFilter) return false;
      if (dateFilter !== 'all' && r.ride_date) {
        const rd = new Date(r.ride_date);
        if (dateFilter === 'today' && rd.toDateString() !== now.toDateString()) return false;
        if (dateFilter === 'tomorrow') {
          const tmrw = new Date(now); tmrw.setDate(now.getDate() + 1);
          if (rd.toDateString() !== tmrw.toDateString()) return false;
        }
        if (dateFilter === 'weekend') {
          const day = rd.getDay();
          if (day !== 0 && day !== 6) return false;
        }
      }
      return true;
    });
    if (sortBy === 'nearby' && coordinates) {
      list = [...list].sort((a, b) => (distanceFor(a) ?? Infinity) - (distanceFor(b) ?? Infinity));
    }
    return list;
  }, [rides, searchQuery, vehicleFilter, dateFilter, sortBy, coordinates]);

  const formatRoute = (ride: Ride) => [ride.start_location?.name, ride.destination?.name].filter(Boolean).join(' → ') || 'Route TBD';

  const me = getAppUser(auth.currentUser);
  const avatar = useAvatar(me);

  return (
    <React.Fragment>
      <Helmet><title>Explore Rides | RideClub</title></Helmet>
      <div className="w-full h-full bg-app-canvas flex flex-col overflow-hidden font-sans">

        <div className="shrink-0 px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-black tracking-tight leading-tight">
              <span className="text-gray-950">Ride</span><span className="text-[#FF6B22]">Club</span>
            </h1>
            <p className="text-[11px] text-gray-500 font-semibold">Ride Together. Go Further.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/alerts')} aria-label="Alerts" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 active:scale-95 transition-all cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
            </button>
            <button onClick={() => navigate('/profile')} aria-label="Profile" className="w-10 h-10 rounded-full overflow-hidden bg-[#FF6B22]/10 active:scale-95 transition-all cursor-pointer">
              <img src={avatar} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { const f = initialsImage(me?.displayName || 'Rider'); if (e.currentTarget.src !== f) e.currentTarget.src = f; }} />
            </button>
          </div>
        </div>

        <div className="shrink-0 px-4 max-w-[520px] w-full mx-auto flex flex-col gap-3">

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by place, ride name, or route..."
                className="w-full h-12 card-app pl-11 pr-4 text-[13px] font-semibold text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#FF6B22]"
              />
            </div>
            <button
              onClick={() => setView(v => v === 'list' ? 'map' : 'list')}
              className="w-12 h-12 shrink-0 card-app flex items-center justify-center text-gray-600 cursor-pointer"
              title={view === 'list' ? 'Show map' : 'Show list'}
            >
              {view === 'list' ? <MapIcon className="w-4.5 h-4.5" /> : <ListIcon className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* Vehicle chips — derived from real data, never hardcoded */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {vehicleOptions.map(v => (
              <button
                key={v}
                onClick={() => setVehicleFilter(v)}
                className={`px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                  vehicleFilter === v ? 'btn-app-primary text-white' : 'card-app text-gray-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Date + nearby filters — real fields (ride_date, haversine distance) */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {([
              { id: 'all', label: 'Any Date' },
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'weekend', label: 'This Weekend' },
            ] as const).map(d => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                  dateFilter === d.id ? 'bg-gray-950 text-white' : 'card-app text-gray-500'
                }`}
              >
                <Calendar className="w-3 h-3" /> {d.label}
              </button>
            ))}
            <button
              onClick={() => setSortBy(s => s === 'nearby' ? 'date' : 'nearby')}
              disabled={!coordinates}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 disabled:opacity-40 ${
                sortBy === 'nearby' ? 'bg-gray-950 text-white' : 'card-app text-gray-500'
              }`}
              title={coordinates ? 'Sort by distance from you' : 'Enable location to sort by distance'}
            >
              <MapPin className="w-3 h-3" /> Nearby
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 mt-2">
          {view === 'map' ? (
            <div className="relative w-full h-full">
              <MapEngine
                userLocation={coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : { lat: 17.3850, lng: 78.4867 }}
                destinationLocation={null}
                mode="explore"
                onMapLoad={() => {}}
              />
              {/* Ride pin count overlay — real count, not decorative */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 card-app px-3.5 py-2 text-[12px] font-bold text-gray-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B22]" /> {filteredRides.length} rides in view
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto hide-scrollbar px-4 pb-[100px] max-w-[900px] w-full mx-auto">
              {loading ? (
                <div className="flex flex-col gap-2.5">
                  {[1, 2, 3].map(i => <div key={i} className="card-app h-[92px] animate-pulse" />)}
                </div>
              ) : filteredRides.length === 0 ? (
                <div className="card-app p-6 text-center mt-4">
                  <p className="text-[13px] font-semibold text-gray-500">No public rides match your filters right now.</p>
                  <button onClick={() => navigate('/ride-plus/create')} className="mt-3 px-4 py-2 btn-app-primary text-white text-[12px] font-bold rounded-full cursor-pointer">Create the First One</button>
                </div>
              ) : (
                // Bento grid: first ride is the dominant tile, the rest are
                // equal supporting tiles. Same .bento-tile surface as the
                // regular card-app rows, just laid out on a responsive grid.
                <div className="bento-grid">
                  {filteredRides.map((ride, i) => {
                    const dist = distanceFor(ride);
                    const isLive = ride.status === 'live';
                    return (
                      <button
                        key={ride.id}
                        onClick={() => navigate(`/ride-plus/view/${ride.id}`)}
                        className={`bento-tile ${i === 0 ? 'bento-tile--wide' : ''} w-full min-w-0 p-2.5 flex items-center gap-3 text-left cursor-pointer relative`}
                      >
                        <img src={ride.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=60'} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-[13px] font-bold text-gray-950 truncate">{ride.name || 'Group Ride'}</h4>
                            {isLive && <span className="text-[8px] font-black bg-[#FF6B22] text-white px-1.5 py-0.5 rounded-full shrink-0">LIVE</span>}
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium truncate">{formatRoute(ride)}</p>
                          <div className="flex items-center gap-2.5 mt-1 text-[10px] text-gray-500 font-semibold flex-wrap">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{ride.ride_date ? new Date(ride.ride_date).toLocaleDateString([], { day: '2-digit', month: 'short' }) : 'TBD'}</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ride.rider_count}/{ride.max_riders || '--'}</span>
                            {dist !== null && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{dist.toFixed(1)} km away</span>}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSave(ride.id); }}
                          className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
                        >
                          <Heart className={`w-4 h-4 ${saved.includes(ride.id) ? 'fill-[#FF6B22] text-[#FF6B22]' : 'text-gray-300'}`} />
                        </button>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default ExploreRides;
