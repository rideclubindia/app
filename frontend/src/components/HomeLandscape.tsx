import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Crosshair, Navigation2, MapPin,
  Users, ArrowUp, CornerUpRight, X, Siren, SlidersHorizontal,
  Compass, Plus, Calendar, UsersRound, Heart, ArrowRight,
  ShieldAlert as ShieldAlertIcon, ChevronRight as ChevronRightIcon, Radio
} from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';
import { supabase } from '../lib/supabase';
import { useRealtimeStatus } from '../realtime';
import { SOSModal } from './SOSModal';

interface BrowseRide {
  id: string;
  name: string;
  ride_date: string | null;
  image_url: string | null;
  start_location: { name?: string } | null;
  destination: { name?: string } | null;
  max_riders: number | null;
  rider_count: number;
}

export const HomeLandscape = ({ currentRide }: { currentRide?: any }) => {
  const { coordinates } = useLocationStore();
  const navigate = useNavigate();
  const rtStatus = useRealtimeStatus();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);

  const [browseRides, setBrowseRides] = useState<BrowseRide[]>([]);

  // Public upcoming rides, used for the "Featured Ride" banner + "Upcoming
  // Rides" list when the rider doesn't already have an active/scheduled ride.
  useEffect(() => {
    const load = async () => {
      const { data: rides } = await supabase
        .from('rides')
        .select('id, name, ride_date, image_url, start_location, destination, max_riders')
        .eq('visibility', 'public')
        .gte('ride_date', new Date().toISOString())
        .order('ride_date', { ascending: true })
        .limit(4);

      if (!rides || rides.length === 0) {
        setBrowseRides([]);
        return;
      }

      const ids = rides.map(r => r.id);
      const { data: members } = await supabase
        .from('ride_members')
        .select('ride_id')
        .in('ride_id', ids);

      const counts: Record<string, number> = {};
      (members || []).forEach(m => { counts[m.ride_id] = (counts[m.ride_id] || 0) + 1; });

      setBrowseRides(rides.map(r => ({ ...r, rider_count: counts[r.id] || 0 })));
    };
    load();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.slice(0, 5));
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Normal destination navigation: tapping a result starts navigating
  // immediately. No route-preview / "Start Navigation" confirmation step and
  // no stop management — those belong to Ride navigation only. Navigation
  // builds the route itself from this destination (see Navigation.tsx).
  const selectDestination = (place: any) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    setSearchResults([]);
    setSearchQuery('');
    navigate('/navigation', {
      state: {
        destLat: lat,
        destLng: lng,
        destName: place.name || place.display_name.split(',')[0],
      },
    });
  };

  const featured = currentRide || browseRides[0] || null;
  const isFeaturedLive = !!currentRide;
  const upcomingList = currentRide ? browseRides.slice(0, 2) : browseRides.slice(1, 3);

  const formatRoute = (ride: any) =>
    [ride.start_location?.name, ride.destination?.name].filter(Boolean).join(' → ') || 'Route TBD';

  const formatWhen = (dateStr?: string | null) => {
    if (!dateStr) return { day: '--', full: 'Date TBD' };
    const d = new Date(dateStr);
    return {
      day: d.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }),
      full: d.toLocaleString([], { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    };
  };

  // --- Composed sections -----------------------------------------------

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-[20px] font-black tracking-tight leading-tight">
          <span className="text-gray-950">Ride</span><span className="text-[#FF6B22]">Club</span>
        </h1>
        <p className="text-[11px] text-gray-500 font-semibold">Ride Together. Go Further.</p>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setShowSOSModal(true)}
          className="relative w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 active:scale-95 transition-all cursor-pointer"
          title="Sentinel / SOS"
        >
          <Siren className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-[#FF6B22]" />
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-[#FF6B22]/10 flex items-center justify-center text-[#FF6B22] font-black text-[13px] active:scale-95 transition-all cursor-pointer"
          title="Profile"
        >
          RC
        </button>
      </div>
    </div>
  );

  // Results show right here on Home (not a full-screen "Map" overlay) —
  // tapping one goes straight to the route screen with the destination
  // already filled in. See selectDestination.
  const searchBar = (
    <div className="relative z-30">
      <form onSubmit={handleSearch} className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rides, locations, or riders..."
            className="w-full h-12 card-app pl-4 pr-4 text-[13px] font-semibold text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#FF6B22]"
          />
        </div>
        <button type="button" className="w-12 h-12 shrink-0 card-app flex items-center justify-center text-gray-600 cursor-pointer">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </form>

      {(searchResults.length > 0 || isSearching) && (
        <div className="absolute top-[54px] left-0 right-0 card-app py-1.5 flex flex-col max-h-[280px] overflow-y-auto z-30">
          {isSearching && searchResults.length === 0 && (
            <div className="px-4 py-3 text-center text-[12px] text-gray-500 font-medium">Searching "{searchQuery}"...</div>
          )}
          {searchResults.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectDestination(result)}
              className="w-full text-left px-3.5 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 flex items-start gap-2.5 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="font-bold text-gray-900 text-[12.5px] truncate">{result.name || result.display_name.split(',')[0]}</span>
                <span className="text-[11px] text-gray-500 truncate">{result.display_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const incidentBanner = (
    <button
      onClick={() => navigate('/map', { state: { reportMode: true } })}
      className="w-full card-app p-3.5 flex items-center gap-3 text-left cursor-pointer bg-red-50/60" style={{ backgroundColor: '#FEF2EE', border: '1px solid #ffd2d2'}}
    >
      <div className="w-10 h-10 icon-badge bg-red-100 shrink-0">
        <ShieldAlertIcon className="w-5 h-5 text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-bold text-gray-950">Report an Incident</h4>
        <p className="text-[11px] text-gray-500 font-medium">Spotted an issue? Help keep the community safe.</p>
      </div>
      <ChevronRightIcon className="w-4 h-4 text-gray-400 shrink-0" />
    </button>
  );

  // Live Updates: a plain list of active community reports, no embedded map
  // (that's what /map is for) — just an icon on Home into the feed.
  const liveUpdatesBanner = (
    <button
      onClick={() => navigate('/alerts')}
      className="w-full card-app p-3.5 flex items-center gap-3 text-left cursor-pointer"
    >
      <div className="w-10 h-10 icon-badge bg-blue-50 shrink-0">
        <Radio className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-bold text-gray-950">Live Updates</h4>
        <p className="text-[11px] text-gray-500 font-medium">See what riders are reporting nearby.</p>
      </div>
      <ChevronRightIcon className="w-4 h-4 text-gray-400 shrink-0" />
    </button>
  );

  // Bento grid: one dominant tile (Featured Ride) + supporting tiles (quick
  // actions, upcoming rides) sharing the .bento-tile surface/radius/shadow
  // tokens from index.css. Collapses to 1 col on mobile, 2 on tablet, up to
  // 4 on desktop via the shared .bento-grid utility.
  const bentoContent = (
    <div className="bento-grid">
      {featured && (
        <button
          onClick={() => navigate(currentRide ? `/ride-plus/live/${featured.id}` : `/ride-plus/view/${featured.id}`)}
          className="bento-tile bento-tile--lg bento-tile--media relative min-h-[168px] overflow-hidden text-left cursor-pointer group"
        >
          <img
            src={featured.image_url || fallbackRideImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            <Users className="w-3 h-3" /> {isFeaturedLive ? 'Your Ride' : 'Featured Ride'}
          </span>
          <span className="absolute top-3 right-3 text-white/80 text-[11px] font-medium italic">Good Rides, Better People</span>

          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between">
            <div className="min-w-0">
              <h3 className="text-white text-[17px] font-bold truncate">{featured.name || 'My Ride'}</h3>
              <p className="text-white/80 text-[11px] font-medium truncate">{formatRoute(featured)}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#FF6B22] flex items-center justify-center shrink-0 ml-2">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </button>
      )}

      <div className="bento-tile bento-tile--wide p-3.5 flex items-center">
        <div className="grid grid-cols-4 gap-2.5 w-full">
          {[
            { icon: Compass, label: 'Find Rides', path: '/explore', tint: '#FFE3D1', color: '#FF6B22' },
            { icon: Plus, label: 'Create Ride', path: '/ride-plus/create', tint: '#FFE3D1', color: '#FF6B22' },
            { icon: Calendar, label: 'My Rides', path: '/ride-plus', tint: '#E4E9FB', color: '#3B5BDB' },
            { icon: UsersRound, label: 'Clubs', path: '/groups', tint: '#EDE6FB', color: '#7C4DFF' },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div className="w-12 h-12 icon-badge" style={{ backgroundColor: action.tint }}>
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span className="text-[10.5px] font-bold text-gray-700 text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between" style={{ gridColumn: '1 / -1' }}>
        <h3 className="text-[15px] font-bold text-gray-950">Upcoming Rides</h3>
        <button onClick={() => navigate('/explore')} className="text-[12px] font-bold text-[#FF6B22] cursor-pointer">See All</button>
      </div>

      {upcomingList.length === 0 ? (
        <div className="bento-tile p-4 text-center" style={{ gridColumn: '1 / -1' }}>
          <p className="text-[12px] font-semibold text-gray-500">No upcoming public rides yet — be the first to create one.</p>
        </div>
      ) : (
        upcomingList.map(ride => {
          const when = formatWhen(ride.ride_date);
          return (
            <button
              key={ride.id}
              onClick={() => navigate(`/ride-plus/view/${ride.id}`)}
              className="bento-tile p-2.5 flex items-center gap-3 text-left cursor-pointer"
            >
              <img src={ride.image_url || fallbackRideImage} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-bold text-gray-950 truncate">{ride.name || 'Group Ride'}</h4>
                <p className="text-[11px] text-gray-500 font-medium truncate">{formatRoute(ride)}</p>
                <div className="flex items-center gap-2.5 mt-1 text-[10px] text-gray-500 font-semibold">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{when.day}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ride.rider_count}/{ride.max_riders || '--'}</span>
                </div>
              </div>
              <Heart className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          );
        })
      )}
    </div>
  );


  return (
    <div className="w-full h-full bg-app-canvas overflow-y-auto">
      <div className="flex flex-col gap-3 p-4 pb-[50px] max-w-[520px] mx-auto">
        {header}
        {searchBar}
        {incidentBanner}
        {liveUpdatesBanner}
        {bentoContent}
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

const fallbackRideImage = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=60';
