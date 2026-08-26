import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Crosshair, Navigation2, MapPin, Route as RouteIcon,
  Users, Clock, ArrowUp, CornerUpRight, X, CheckCircle2
} from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';
import { supabase } from '../lib/supabase';
import { MapEngine } from '../map/MapEngine';
import { SpeedometerCluster } from '../hmi/components/Speedometer';
import type maplibregl from 'maplibre-gl';

const stopEmoji = (type?: string) => {
  switch (type) {
    case 'Food': case 'Restaurant': return '🍔';
    case 'Fuel': case 'Gas Station': return '⛽';
    case 'Hospital': return '🏥';
    case 'Mechanic': return '🔧';
    case 'Tea': return '☕';
    case 'Stay': case 'Hotel': return '🏨';
    case 'Sightseeing': return '📸';
    case 'Restroom': return '🚻';
    default: return '📍';
  }
};

export const HomeLandscape = ({ currentRide }: { currentRide?: any }) => {
  const { speed, coordinates } = useLocationStore();
  const navigate = useNavigate();
  const [, setMapInstance] = useState<maplibregl.Map | null>(null);
  
  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<any | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{distance: number, duration: number} | null>(null);

  // Dynamic ride stops (or fallback latest incident when no ride exists)
  const [rideStops, setRideStops] = useState<any[]>([]);
  const [latestIncident, setLatestIncident] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (currentRide?.id) {
        setLatestIncident(null);
        const { data } = await supabase
          .from('ride_stops')
          .select('*')
          .eq('ride_id', currentRide.id)
          .order('sequence', { ascending: true });
        setRideStops(data || []);
      } else {
        setRideStops([]);
        const { data: pin } = await supabase
          .from('pins')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setLatestIncident(pin || null);
      }
    };
    load();
  }, [currentRide?.id]);

  const upcomingStops = rideStops.filter(s => s.stop_type !== 'Start');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
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

  const selectDestination = (place: any) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    setSelectedDestination({
      name: place.name || place.display_name.split(',')[0],
      address: place.display_name,
      lat,
      lng
    });
    setSearchResults([]);
    setSearchQuery('');
    setIsNavigating(false);
  };

  const startNavigation = () => {
    if (!selectedDestination) return;
    setIsNavigating(true);
  };
  
  const exitNavigation = () => {
    setIsNavigating(false);
    setSelectedDestination(null);
  };

  const fallbackLocation = React.useMemo(() => ({ lat: 17.3850, lng: 78.4867 }), []);
  const activeUserLocation = React.useMemo(() => {
    return coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : fallbackLocation;
  }, [coordinates?.lat, coordinates?.lng, fallbackLocation]);

  return (
    <div className="w-full h-full bg-black overflow-hidden portrait:flex-col landscape:flex-row flex">
      
      {/* 1. Telemetry Panel */}
      <div className="flex flex-col portrait:w-full portrait:h-[50%] portrait:order-2 portrait:border-t portrait:border-r-0 landscape:w-[40%] landscape:min-w-[270px] landscape:max-w-[340px] landscape:h-full landscape:order-2 landscape:border-r landscape:border-t-0 bg-[#F7F8FA] shrink-0 z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)] border-gray-200">
        <div className="flex-1 flex flex-col pt-2 pb-2 overflow-hidden min-h-0">
           {/* Header with Title and Clock */}
           <div className="px-5 mb-1 flex justify-between items-start">
             <div>
               <span className="text-[#111111] font-semibold text-lg tracking-wide uppercase leading-tight block">RideClub</span>
             </div>
             
             {/* Integrated Status Bar */}
             <div className="flex items-center gap-2 text-[#111111] pb-3">
               <span className="text-[11px] font-semibold tabular-nums">
                 {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
               </span>
             </div>
           </div>
           
           <div className="shrink-0 mb-3">
             <SpeedometerCluster speed={speed || 0} />
           </div>

           {/* Ride Summary — compact, fixed */}
           {currentRide ? (
             <div className="px-2 shrink-0 pb-2">
               <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-3">
                 <div className="flex items-center justify-between mb-1.5">
                   <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Current Ride</span>
                   <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm leading-none ${currentRide.status === 'live' ? 'bg-[#FF5A00] text-white' : 'bg-blue-100 text-blue-600'}`}>
                     {currentRide.status === 'live' ? 'LIVE' : 'SCHEDULED'}
                   </span>
                 </div>
                 <h3 className="text-[14px] font-semibold text-[#111111] truncate leading-tight">{currentRide.name || 'My Ride'}</h3>
                 <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                   <span className="bg-gray-50 border border-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
                     <Clock className="w-3 h-3" />
                     {currentRide.ride_date ? new Date(currentRide.ride_date).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                   </span>
                   <span className="bg-gray-50 border border-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-1 rounded-lg">
                     {upcomingStops.length} stops
                   </span>
                   {currentRide.ride_code && (
                     <span className="bg-gray-50 border border-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-1 rounded-lg">
                       {currentRide.ride_code}
                     </span>
                   )}
                 </div>
               </div>
             </div>
           ) : latestIncident ? (
             /* Latest Incident fallback card */
             <div className="px-2 shrink-0 pb-2">
               <div 
                 onClick={() => navigate(`/incident/${latestIncident.id}`)}
                 className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-3 cursor-pointer hover:border-[#FF5A00]/40 transition-colors"
               >
                 <div className="flex items-center justify-between mb-1.5">
                   <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Latest Incident</span>
                   <span className="bg-red-50 text-red-500 text-[8px] font-bold px-1.5 py-0.5 rounded-sm leading-none uppercase">Alert</span>
                 </div>
                 <h3 className="text-[14px] font-semibold text-[#111111] truncate leading-tight">{latestIncident.category || 'Incident'}</h3>
                 <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                   {latestIncident.description || `Reported by ${latestIncident.reporter_name || 'community'}`}
                 </p>
               </div>
               <button 
                 onClick={() => navigate('/ride-plus/create')}
                 className="w-full mt-2 py-2.5 bg-[#FF5A00] hover:bg-[#ff6a1a] text-white text-[12px] font-semibold rounded-xl shadow-md shadow-[#FF5A00]/25 active:scale-95 transition-all flex items-center justify-center gap-1.5"
               >
                 <RouteIcon className="w-3.5 h-3.5" /> Create Ride
               </button>
             </div>
           ) : (
             /* No Active Ride empty state */
             <div className="px-2 shrink-0 pb-2">
               <div className="bg-white rounded-[8px] border border-dashed border-gray-200 p-4 text-center">
                 <RouteIcon className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                 <p className="text-[12px] font-semibold text-[#111111]">No Active Ride</p>
                 <p className="text-[11px] text-gray-400 font-medium mt-0.5 mb-3">Start a group ride to see it here.</p>
                 <button 
                   onClick={() => navigate('/ride-plus/create')}
                   className="w-full py-2.5 bg-[#FF5A00] hover:bg-[#ff6a1a] text-white text-[12px] font-semibold rounded-xl shadow-md shadow-[#FF5A00]/25 active:scale-95 transition-all"
                 >
                   Create Ride
                 </button>
               </div>
             </div>
           )}

           {/* Upcoming Stops — always visible, fills remaining height */}
           {currentRide && upcomingStops.length > 0 && (
             <div className="px-2 flex-1 min-h-0 flex flex-col">
               <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-3 flex-1 min-h-0 flex flex-col overflow-hidden">
                 <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block mb-2.5 shrink-0">Upcoming Stops</span>
                 
                 <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
                   <div className="flex flex-col gap-3 relative px-1 py-1">
                     {/* Vertical track */}
                     <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-100 rounded-full" />
                     <div className="absolute left-[15px] top-4 h-8 w-0.5 bg-gradient-to-b from-[#FF5A00] to-[#FF8A4C] rounded-full shadow-[0_0_8px_rgba(255,90,0,0.3)]" />
                     
                     {upcomingStops.map((stop, idx) => (
                       <div key={stop.id || idx} className="flex items-start gap-3 relative z-10">
                         <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] ${idx === 0 ? 'bg-white border-2 border-[#FF5A00] shadow-[0_2px_6px_rgba(255,90,0,0.2)]' : 'bg-white border border-gray-200'}`}>
                           {stopEmoji(stop.stop_type)}
                         </div>
                         <div className="flex flex-col mt-0.5 min-w-0">
                           <span className={`text-[12px] font-semibold truncate ${idx === 0 ? 'text-[#FF5A00]' : 'text-[#111111]'}`}>{stop.stop_name || `Stop ${idx + 1}`}</span>
                           <span className="text-[9px] font-semibold text-gray-400">{stop.stop_type || 'Stop'}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
           )}
         </div>
       </div>
      
      {/* 3. Map Area */}
      <div className="portrait:w-full portrait:flex-1 portrait:order-1 landscape:w-[70%] landscape:h-full landscape:order-3 relative z-0 overflow-hidden">
        <MapEngine 
           userLocation={activeUserLocation}
           destinationLocation={selectedDestination ? { lat: selectedDestination.lat, lng: selectedDestination.lng } : null}
           onMapLoad={setMapInstance}
           mode={isNavigating ? "navigation" : "explore"}
           onRouteInfo={setRouteInfo}
        />
        
        {/* Map Search Overlay - COMPACT */}
        {!isNavigating && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-[320px] z-20 px-4">
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                placeholder="Search places..."
                className="w-full h-10 bg-white/95 backdrop-blur-md rounded-full pl-10 pr-4 shadow-lg border border-gray-100 text-[#111111] text-sm font-medium outline-none focus:ring-2 focus:ring-[#FF5A00]/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </form>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                {searchResults.map((result, i) => (
                  <button 
                    key={i}
                    className="w-full text-left px-3 py-2 border-b border-gray-50 hover:bg-gray-50 flex items-start gap-2"
                    onClick={() => selectDestination(result)}
                  >
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold text-[#111111] text-xs truncate">{result.name || result.display_name.split(',')[0]}</span>
                      <span className="text-[10px] text-gray-500 truncate">{result.display_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Destination Panel - COMPACT */}
        {selectedDestination && !isNavigating && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[280px] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-3 z-20">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-sm text-[#111111] truncate pr-2">{selectedDestination.name}</h3>
              <button 
                onClick={() => setSelectedDestination(null)}
                className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 shrink-0"
              >
                <Crosshair className="w-3 h-3 rotate-45" />
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mb-3 line-clamp-2">{selectedDestination.address}</p>
            
            <button 
              onClick={startNavigation}
              className="w-full py-2 bg-[#FF5A00] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#FF5A00]/20 flex items-center justify-center gap-2"
            >
              <Navigation2 className="w-4 h-4 fill-current" />
              Start Nav
            </button>
          </div>
        )}

        {/* Rich Turn-by-Turn Navigation Overlay - COMPACT */}
        {isNavigating && (
          <div className="absolute top-4 left-4 w-[240px] bg-white/95 backdrop-blur-md rounded-[8px] shadow-lg border border-gray-100 z-20 overflow-hidden flex flex-col">
            {/* Top Section */}
            <div className="p-3 flex items-start justify-between">
              <div className="flex gap-2.5">
                <ArrowUp className="w-7 h-7 text-[#111111] stroke-[2.5]" />
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-[#111111] tracking-tight tabular-nums">
                      {routeInfo ? (routeInfo.distance > 1000 ? (routeInfo.distance / 1000).toFixed(1) : Math.round(routeInfo.distance)) : '...'}
                    </span>
                    <span className="text-sm font-semibold text-[#111111]">
                      {routeInfo && routeInfo.distance > 1000 ? 'km' : 'm'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-500 mt-0.5 truncate max-w-[120px]">{selectedDestination?.name || 'Destination'}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end shrink-0 pt-0.5">
                <CornerUpRight className="w-5 h-5 text-[#111111] stroke-[2.5] mb-1" />
                <span className="text-[10px] font-semibold text-gray-500">
                  {routeInfo ? (routeInfo.distance / 1000).toFixed(1) + ' km' : '...'}
                </span>
              </div>
            </div>
            
            {/* Divider */}
            <hr className="border-gray-100" />
            
            {/* Bottom Section */}
            <div className="px-3 py-2 bg-[#F8FAFC]/80 flex items-center justify-between text-[10px] font-semibold text-gray-500">
              <span className="text-[#111111]">
                {routeInfo ? (routeInfo.distance / 1000).toFixed(1) + ' km' : '-- km'}
              </span>
              <span>
                {routeInfo ? Math.round(routeInfo.duration / 60) + ' min' : '-- min'}
              </span>
              <div className="flex items-center gap-0.5">
                <Users className="w-3 h-3" />
                <span>4</span>
              </div>
              <span>
                {routeInfo ? (() => {
                  const arrivalTime = new Date(Date.now() + routeInfo.duration * 1000);
                  return arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                })() : '--:--'}
              </span>
            </div>

            {/* Exit Button */}
            <button 
              onClick={exitNavigation}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100/50 hover:bg-red-100 text-gray-400 hover:text-red-600 flex items-center justify-center transition-colors"
              title="End Navigation"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      
    </div>
  );
};
