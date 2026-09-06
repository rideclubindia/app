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
import { useDeviceIMU } from '../hooks/useDeviceIMU';
import { useRealtimeStatus } from '../realtime';
import { SOSModal } from './SOSModal';
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
  const imu = useDeviceIMU(speed || 0);
  const rtStatus = useRealtimeStatus();
  const [, setMapInstance] = useState<maplibregl.Map | null>(null);
  
  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<any | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{distance: number, duration: number} | null>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);

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
    <div className="w-full h-full bg-[#F3F4F6] overflow-hidden portrait:flex-col landscape:flex-row flex">
      
      {/* 1. Telemetry Panel */}
      <div className="flex flex-col portrait:w-full portrait:h-[50%] portrait:order-2 portrait:border-t portrait:border-r-0 landscape:w-[38%] landscape:min-w-[260px] landscape:max-w-[320px] landscape:h-full landscape:order-2 landscape:border-r landscape:border-t-0 bg-[#F9FAFB] shrink-0 z-10 shadow-xs border-gray-200">
        <div className="flex-1 flex flex-col pt-2 pb-1.5 overflow-hidden min-h-0">
            {/* Header with Title, Crash Sentinel Status, and Clock */}
            <div className="px-3.5 mb-1.5 flex justify-between items-center">
              <div>
                <span className="text-gray-950 font-black text-[15px] tracking-wider uppercase leading-tight block">RideClub</span>
              </div>
              
              {/* Integrated Sentinel & Status Bar */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setShowSOSModal(true)}
                  className="px-2 py-0.5 rounded-full bg-emerald-100/90 hover:bg-emerald-200/90 border border-emerald-300 text-emerald-900 text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  title="Click to view Sentinel state or test SOS broadcast"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Sentinel: Armed</span>
                </button>

                <span className="text-[11px] font-bold text-gray-800 tabular-nums">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
            </div>
           
           <div className="shrink-0 mb-1.5">
             <SpeedometerCluster 
               speed={speed || 0} 
               leanAngle={imu.leanAngle} 
               gForce={imu.gForce} 
               isCalibrated={imu.isCalibrated} 
             />
           </div>

           {/* Ride Summary — compact, fixed */}
           {currentRide ? (
             <div className="px-2.5 shrink-0 pb-1.5">
               <div className="bg-white rounded-lg border border-gray-200/80 shadow-2xs p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold text-gray-700 uppercase tracking-wider">Current Ride</span>
                    <div className="flex items-center gap-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                        rtStatus.status === 'connected' 
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                          : 'bg-blue-100 text-blue-900 border-blue-300'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${rtStatus.status === 'connected' ? 'bg-emerald-600 animate-pulse' : 'bg-blue-600'}`} />
                        {rtStatus.status === 'connected' ? 'Mesh: Active' : 'Mesh: Ready'}
                      </span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded leading-none ${currentRide.status === 'live' ? 'bg-[#FF5A00] text-white shadow-2xs' : 'bg-blue-100 text-blue-800'}`}>
                        {currentRide.status === 'live' ? 'LIVE' : 'SCHEDULED'}
                      </span>
                    </div>
                  </div>
                 <h3 className="text-[13px] font-bold text-gray-900 truncate leading-tight">{currentRide.name || 'My Ride'}</h3>
                 <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                   <span className="bg-gray-100/80 border border-gray-200 text-gray-700 text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                     <Clock className="w-3 h-3 text-gray-600" />
                     {currentRide.ride_date ? new Date(currentRide.ride_date).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                   </span>
                   <span className="bg-gray-100/80 border border-gray-200 text-gray-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                     {upcomingStops.length} stops
                   </span>
                   {currentRide.ride_code && (
                     <span className="bg-gray-100/80 border border-gray-200 text-gray-800 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                       {currentRide.ride_code}
                     </span>
                   )}
                 </div>
               </div>
             </div>
           ) : latestIncident ? (
             /* Latest Incident fallback card */
             <div className="px-2.5 shrink-0 pb-1.5">
               <div 
                 onClick={() => navigate(`/incident/${latestIncident.id}`)}
                 className="bg-white rounded-lg border border-gray-200 shadow-2xs p-2.5 cursor-pointer hover:border-[#FF5A00] transition-colors"
               >
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-[9px] font-bold text-gray-700 uppercase tracking-wider">Latest Incident</span>
                   <span className="bg-red-100 text-red-800 border border-red-200 text-[8px] font-extrabold px-1.5 py-0.5 rounded leading-none uppercase">Alert</span>
                 </div>
                 <h3 className="text-[13px] font-bold text-gray-900 truncate leading-tight">{latestIncident.category || 'Incident'}</h3>
                 <p className="text-[10px] text-gray-600 font-medium truncate mt-0.5">
                   {latestIncident.description || `Reported by ${latestIncident.reporter_name || 'community'}`}
                 </p>
               </div>
               <button 
                 onClick={() => navigate('/ride-plus/create')}
                 className="w-full mt-2 py-2 bg-[#FF5A00] hover:bg-[#e04f00] text-white text-[12px] font-bold rounded-lg shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
               >
                 <RouteIcon className="w-3.5 h-3.5" /> Create Ride
               </button>
             </div>
           ) : (
             /* No Active Ride empty state */
             <div className="px-2.5 shrink-0 pb-1.5">
               <div className="bg-white rounded-lg border border-dashed border-gray-300 p-3 text-center">
                 <RouteIcon className="w-5 h-5 text-gray-500 mx-auto mb-1.5" />
                 <p className="text-[12px] font-bold text-gray-900">No Active Ride</p>
                 <p className="text-[10px] text-gray-600 font-medium mt-0.5 mb-2">Start a group ride to coordinate with your pack.</p>
                 <button 
                   onClick={() => navigate('/ride-plus/create')}
                   className="w-full py-2 bg-[#FF5A00] hover:bg-[#e04f00] text-white text-[12px] font-bold rounded-lg shadow-xs active:scale-95 transition-all cursor-pointer"
                 >
                   Create Ride
                 </button>
               </div>
             </div>
           )}

           {/* Upcoming Stops — always visible, fills remaining height */}
           {currentRide && upcomingStops.length > 0 && (
             <div className="px-2.5 flex-1 min-h-0 flex flex-col">
               <div className="bg-white rounded-lg border border-gray-200/80 shadow-2xs p-2.5 flex-1 min-h-0 flex flex-col overflow-hidden">
                 <span className="text-[9px] font-bold text-gray-700 uppercase tracking-wider block mb-2 shrink-0">Upcoming Stops</span>
                 
                 <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
                   <div className="flex flex-col gap-2 relative px-1 py-0.5">
                     {/* Vertical track */}
                     <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-gray-200 rounded-full" />
                     <div className="absolute left-[13px] top-3 h-6 w-0.5 bg-[#FF5A00] rounded-full shadow-xs" />
                     
                     {upcomingStops.map((stop, idx) => (
                       <div key={stop.id || idx} className="flex items-start gap-2.5 relative z-10">
                         <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${idx === 0 ? 'bg-white border-2 border-[#FF5A00] shadow-xs' : 'bg-white border border-gray-300'}`}>
                           {stopEmoji(stop.stop_type)}
                         </div>
                         <div className="flex flex-col min-w-0">
                           <span className={`text-[11px] font-bold truncate ${idx === 0 ? 'text-[#FF5A00]' : 'text-gray-900'}`}>{stop.stop_name || `Stop ${idx + 1}`}</span>
                           <span className="text-[9px] font-semibold text-gray-600">{stop.stop_type || 'Stop'}</span>
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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-[340px] z-20 px-4">
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                placeholder="Search places or coordinates..."
                className="w-full h-11 bg-white rounded-xl pl-11 pr-4 shadow-sm border border-gray-300 text-gray-950 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#FF5A00] focus:border-[#FF5A00] placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            </form>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {searchResults.map((result, i) => (
                  <button 
                    key={i}
                    className="w-full text-left px-3.5 py-2.5 border-b border-gray-100 hover:bg-gray-50 flex items-start gap-2.5 cursor-pointer"
                    onClick={() => selectDestination(result)}
                  >
                    <MapPin className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-gray-900 text-xs truncate">{result.name || result.display_name.split(',')[0]}</span>
                      <span className="text-[11px] text-gray-600 truncate">{result.display_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Destination Panel - COMPACT */}
        {selectedDestination && !isNavigating && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[300px] bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-20">
            <div className="flex justify-between items-start mb-1.5">
              <h3 className="font-bold text-sm text-gray-950 truncate pr-2">{selectedDestination.name}</h3>
              <button 
                onClick={() => setSelectedDestination(null)}
                className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 shrink-0 cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5 rotate-45" />
              </button>
            </div>
            <p className="text-[11px] text-gray-700 mb-3.5 line-clamp-2">{selectedDestination.address}</p>
            
            <button 
              onClick={startNavigation}
              className="w-full py-2.5 bg-[#FF5A00] hover:bg-[#e04f00] text-white text-sm font-bold rounded-xl shadow-sm shadow-[#FF5A00]/30 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Navigation2 className="w-4 h-4 fill-current" />
              Start Navigation
            </button>
          </div>
        )}

        {/* Rich Turn-by-Turn Navigation Overlay - COMPACT */}
        {isNavigating && (
          <div className="absolute top-4 left-4 w-[260px] bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden flex flex-col">
            {/* Top Section */}
            <div className="p-3.5 flex items-start justify-between">
              <div className="flex gap-2.5">
                <ArrowUp className="w-7 h-7 text-gray-950 stroke-[2.5]" />
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-950 tracking-tight tabular-nums">
                      {routeInfo ? (routeInfo.distance > 1000 ? (routeInfo.distance / 1000).toFixed(1) : Math.round(routeInfo.distance)) : '...'}
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {routeInfo && routeInfo.distance > 1000 ? 'km' : 'm'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 mt-0.5 truncate max-w-[130px]">{selectedDestination?.name || 'Destination'}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end shrink-0 pt-0.5">
                <CornerUpRight className="w-5 h-5 text-gray-950 stroke-[2.5] mb-1" />
                <span className="text-[11px] font-bold text-gray-700">
                  {routeInfo ? (routeInfo.distance / 1000).toFixed(1) + ' km' : '...'}
                </span>
              </div>
            </div>
            
            {/* Divider */}
            <hr className="border-gray-200" />
            
            {/* Bottom Section */}
            <div className="px-3.5 py-2.5 bg-gray-50 flex items-center justify-between text-[11px] font-bold text-gray-700">
              <span className="text-gray-950 font-black">
                {routeInfo ? (routeInfo.distance / 1000).toFixed(1) + ' km' : '-- km'}
              </span>
              <span>
                {routeInfo ? Math.round(routeInfo.duration / 60) + ' min' : '-- min'}
              </span>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-600" />
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
              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 flex items-center justify-center transition-colors cursor-pointer"
              title="End Navigation"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
