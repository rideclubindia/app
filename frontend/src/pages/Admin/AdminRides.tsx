import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Search, Filter, Car, Map as MapIcon, X, Users, MapPin, Coffee, Fuel, Clock, Utensils, BedDouble, Droplets, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useIncidentCategories, incidentIconMap } from '../../hooks/useIncidentCategories';
import { SearchInput } from '../../components/ui/SearchInput';
import { renderToString } from 'react-dom/server';
import { useConfirm } from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastContext';

const AdminRides = () => {
    const confirm = useConfirm();
    const { showToast } = useToast();

  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [incidents, setIncidents] = useState<any[]>([]);
  
  const [selectedRide, setSelectedRide] = useState<any | null>(null);
  const [rideDetails, setRideDetails] = useState<any>({ members: [], stops: [], locations: [], creator: null });
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const routeStopMarkers = useRef<maplibregl.Marker[]>([]);
  const { categories } = useIncidentCategories();

  useEffect(() => {
    const fetchRides = async () => {
      const [ridesRes, pinsRes] = await Promise.all([
        supabase.from('rides').select('*').order('created_at', { ascending: false }),
        supabase.from('pins').select('*').eq('status', 'active')
      ]);
        
      if (ridesRes.data) setRides(ridesRes.data);
      if (pinsRes.data) setIncidents(pinsRes.data);
      setLoading(false);
    };
    fetchRides();

    const subscription = supabase
      .channel('admin_rides_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => {
        fetchRides();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [78.4867, 17.3850],
        zoom: 12,
        attributionControl: false
      });
      map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    }
  }, []);

  useEffect(() => {
    if (!map.current) return;
    
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    const addMarkers = async () => {
      const activeRides = rides.filter(r => r.status === 'live');
      for (const ride of activeRides) {
        const { data } = await supabase.from('ride_locations').select('*').eq('ride_id', ride.id).order('updated_at', { ascending: false }).limit(1);
        if (data && data.length > 0) {
          const loc = data[0];
          const el = document.createElement('div');
          el.className = 'w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform';
          el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;
          
          el.addEventListener('click', () => handleViewRide(ride));

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([loc.longitude, loc.latitude])
            .addTo(map.current!);
            
          markersRef.current[ride.id] = marker;
        }
      }
    };
    addMarkers();
  }, [rides]);

  useEffect(() => {
    if (!map.current) return;
    
    const draw = async () => {
      if (map.current!.getSource('route')) {
        map.current!.removeLayer('route-line');
        map.current!.removeSource('route');
      }
      routeStopMarkers.current.forEach(m => m.remove());
      routeStopMarkers.current = [];

      incidents.forEach(pin => {
        if (!pin.latitude || !pin.longitude) return;
        
        const cat = categories.find(c => c.id === pin.category);
        const IconComponent = cat && incidentIconMap[cat.iconName as keyof typeof incidentIconMap] ? incidentIconMap[cat.iconName as keyof typeof incidentIconMap] : incidentIconMap['MoreHorizontal' as keyof typeof incidentIconMap];
        const iconHtml = renderToString(<IconComponent className="w-3.5 h-3.5" />);
        
        const el = document.createElement('div');
        el.className = `w-6 h-6 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] border-2 border-white cursor-pointer ${cat?.bg || 'bg-gray-100'} ${cat?.color || 'text-gray-600'}`;
        el.innerHTML = iconHtml;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([pin.longitude, pin.latitude])
          .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(`
            <div style="padding:4px;font-family:sans-serif;">
              <strong style="font-size:12px;display:block;margin-bottom:2px;">${pin.category}</strong>
              <span style="font-size:10px;color:#8A8A8E;">${pin.upvotes || 0} confirmations</span>
            </div>
          `))
          .addTo(map.current!);
        routeStopMarkers.current.push(marker);
      });

      if (selectedRide) {
        if (rideDetails.stops && rideDetails.stops.length > 0) {
          rideDetails.stops.forEach((stop: any, index: number) => {
            if (stop.latitude && stop.longitude) {
              const isStart = index === 0;
              const isEnd = index === rideDetails.stops.length - 1;
              const type = stop.stop_type || '';
              
              const getStopIcon = (t: string) => {
                switch(t) {
                  case 'Rest Stop': return <Coffee className="w-3.5 h-3.5" />;
                  case 'Gas Station': return <Fuel className="w-3.5 h-3.5" />;
                  case 'Restaurant': return <Utensils className="w-3.5 h-3.5" />;
                  case 'Hotel': return <BedDouble className="w-3.5 h-3.5" />;
                  case 'Restroom': return <Droplets className="w-3.5 h-3.5" />;
                  case 'Sightseeing': return <Camera className="w-3.5 h-3.5" />;
                  case 'Pickup': return <Users className="w-3.5 h-3.5" />;
                  default: return <MapPin className="w-3.5 h-3.5" />;
                }
              };

              const el = document.createElement('div');
              el.className = `w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold z-20 border-2 border-white shadow-md ${isStart ? 'bg-[#E5F9ED] text-[#34C759]' : isEnd ? 'bg-[#FFEBEE] text-[#FF3B30]' : 'bg-gray-100 text-gray-500'}`;
              
              if (isStart) el.innerText = 'A';
              else if (isEnd) el.innerText = 'B';
              else el.innerHTML = renderToString(getStopIcon(type));

              const marker = new maplibregl.Marker({ element: el })
                .setLngLat([stop.longitude, stop.latitude])
                .addTo(map.current!);
              routeStopMarkers.current.push(marker);
            }
          });
        }

        if (rideDetails.stops && rideDetails.stops.length >= 2) {
          const coords = rideDetails.stops
            .filter((s: any) => s.latitude && s.longitude)
            .map((s: any) => [s.longitude, s.latitude]);

          if (coords.length >= 2) {
            try {
              const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
                method: 'POST',
                headers: {
                  'Authorization': 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZlZTI0N2U2NGIwNjQwYTY5N2E0ZGJkMzVlZmYyMDI5IiwiaCI6Im11cm11cjY0In0=',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ coordinates: coords })
              });
              const data = await res.json();
              if (data.features && data.features.length > 0) {
                const routeFeature = data.features[0];
                map.current!.addSource('route', {
                  type: 'geojson',
                  data: routeFeature
                });
                map.current!.addLayer({
                  id: 'route-line',
                  type: 'line',
                  source: 'route',
                  layout: { 'line-join': 'round', 'line-cap': 'round' },
                  paint: { 'line-color': '#273a5a', 'line-width': 4, 'line-opacity': 0.8 }
                });

                const bbox = routeFeature.bbox;
                if (bbox) {
                  map.current!.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50, maxZoom: 16 });
                }
              }
            } catch (err) {
              console.error("Failed to fetch route:", err);
            }
          }
        } else {
           const bounds = new maplibregl.LngLatBounds();
           let hasBounds = false;
           if (rideDetails.locations && rideDetails.locations.length > 0) {
             rideDetails.locations.forEach((loc: any) => { if(loc.longitude) { bounds.extend([loc.longitude, loc.latitude]); hasBounds = true; } });
           } else if (rideDetails.stops && rideDetails.stops.length > 0) {
             rideDetails.stops.forEach((s: any) => { if(s.longitude) { bounds.extend([s.longitude, s.latitude]); hasBounds = true; } });
           }
           if (hasBounds) map.current!.fitBounds(bounds, { padding: 50, maxZoom: 16 });
        }
      }
    };

    if (map.current.isStyleLoaded()) {
      draw();
    } else {
      map.current.once('load', draw);
    }
  }, [selectedRide, rideDetails.locations, rideDetails.stops, incidents]);

  const handleViewRide = async (ride: any) => {
    setSelectedRide(ride);
    setLoadingDetails(true);
    
    if (markersRef.current[ride.id]) {
      const lngLat = markersRef.current[ride.id].getLngLat();
      map.current?.flyTo({ center: lngLat, zoom: 15 });
    }
    
    try {
      const [membersRes, stopsRes, locsRes, creatorRes] = await Promise.all([
        supabase.from('ride_members').select('*').eq('ride_id', ride.id),
        supabase.from('ride_stops').select('*').eq('ride_id', ride.id).order('sequence', { ascending: true }),
        supabase.from('ride_locations').select('*').eq('ride_id', ride.id).order('updated_at', { ascending: false }).limit(1000),
        supabase.from('profiles').select('*').eq('id', ride.owner_id).single()
      ]);

      let stops = stopsRes.data || [];
      
      stops = await Promise.all(stops.map(async (stop: any) => {
        let name = stop.location_name;
        if (!name || name.match(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/)) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${stop.latitude}&lon=${stop.longitude}&zoom=14`);
            const data = await res.json();
            name = data.name || data.display_name?.split(',')[0] || name;
          } catch (e) {}
        }
        return { ...stop, location_name: name };
      }));

      setRideDetails({
        members: membersRes.data || [],
        stops: stops,
        locations: locsRes.data || [],
        creator: creatorRes.data || null
      });
      
    } catch (err) {
      console.error("Failed to fetch ride details:", err);
    }
    setLoadingDetails(false);
  };

  const filteredRides = rides.filter(r => 
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-white">
      <div className={`w-[360px] flex flex-col border-r border-[#E5E5EA] bg-white shrink-0 z-20 ${selectedRide ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-[#E5E5EA] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[18px] font-bold text-dark flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                {rides.length} Total Rides
              </h1>
              <p className="text-[12px] text-[#8A8A8E] mt-0.5">Overview and manage live rides</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5EA] rounded text-[12px] font-bold text-dark hover:bg-gray-50">
              <Filter className="w-3.5 h-3.5" />
              More filters
            </button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchInput 
                variant="admin"
                placeholder="Search rides by name or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="px-3 h-9 rounded border border-[#E5E5EA] text-[12px] font-bold hover:bg-gray-50">
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-2">
            {filteredRides.map(ride => {
              const isActive = ride.status === 'live';
              return (
                <div 
                  key={ride.id} 
                  onClick={() => handleViewRide(ride)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedRide?.id === ride.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-[#E5E5EA] hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[14px] text-dark leading-tight">{ride.name || 'Unnamed Ride'}</h3>
                        <p className="text-[11px] text-[#8A8A8E] font-mono mt-0.5">ID: {String(ride.id).substring(0, 8)}...</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-[#E5F9ED] text-[#34C759]' : 'bg-[#F2F4F7] text-[#8A8A8E]'}`}>
                      {ride.status || 'ended'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="text-[11px] text-[#8A8A8E]">Started: {new Date(ride.created_at).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
            {filteredRides.length === 0 && !loading && (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Car className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-[14px] font-bold text-dark">No rides found</p>
                <p className="text-[12px] text-[#8A8A8E] mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-[#F2F4F7] overflow-hidden">
        <div ref={mapContainer} className="w-full h-full" />

        <div className={`absolute top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-10 transform transition-transform duration-300 flex flex-col ${selectedRide ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedRide && (
          <>
            <div className="p-5 border-b border-[#E5E5EA] shrink-0 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-[20px] font-bold text-dark leading-tight">{selectedRide.name || 'Unnamed Ride'}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedRide.status === 'live' ? 'bg-[#E5F9ED] text-[#34C759]' : 'bg-[#F2F4F7] text-[#8A8A8E]'}`}>
                      {selectedRide.status || 'ended'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A8A8E] font-mono mb-2">ID: {selectedRide.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedRide(null)}
                  className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8A8A8E] hover:bg-[#E5E5EA] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center h-40 text-gray-500">Loading ride details...</div>
              ) : (
                <div className="space-y-8">
                  <div className="mb-6">
                    <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Ride Details
                    </h3>
                    <div className="bg-[#F8F9FB] rounded-lg p-3 grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
                      <div className="col-span-2">
                        <span className="text-[#8A8A8E] block mb-0.5">Created By</span>
                        <span className="font-bold text-dark">
                          {(() => {
                            const creator = rideDetails.creator;
                            if (creator && (creator.full_name || creator.display_name || creator.email)) {
                              return creator.full_name || creator.display_name || creator.email;
                            }
                            
                            const adminMember = rideDetails.members.find((m: any) => m.role === 'admin' || m.role === 'owner' || m.user_id === selectedRide.owner_id);
                            if (adminMember && (adminMember.display_name || adminMember.full_name)) {
                              return adminMember.display_name || adminMember.full_name;
                            }
                            
                            return 'Unknown User';
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8A8A8E] block mb-0.5">Time of Creation</span>
                        <span className="font-bold text-dark">{new Date(selectedRide.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      {selectedRide.status === 'ended' && selectedRide.updated_at && (
                        <div>
                          <span className="text-[#8A8A8E] block mb-0.5">When Ended</span>
                          <span className="font-bold text-[#FF3B30]">{new Date(selectedRide.updated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Passengers ({rideDetails.members.length})
                    </h3>
                    {rideDetails.members.length === 0 ? (
                      <div className="text-[13px] text-gray-500 py-2">No active members found.</div>
                    ) : (
                      <div className="space-y-2">
                        {rideDetails.members.map((member: any) => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-[12px]">
                                {member.display_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-[13px] text-dark">{member.display_name || 'Unknown User'}</div>
                                <div className="text-[11px] text-gray-500 capitalize">{member.role}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Route Stops ({rideDetails.stops.length})
                    </h3>
                    <div className="relative pl-4 space-y-6">
                      <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-[#E5E5EA]"></div>
                      {rideDetails.stops.map((stop: any, index: number) => {
                        const isStart = index === 0;
                        const isEnd = index === rideDetails.stops.length - 1;
                        const type = stop.stop_type?.toLowerCase() || '';
                        
                        let iconRender = <span className="font-bold text-[11px]">{index}</span>;
                        if (isStart) iconRender = <span className="font-bold text-[11px]">A</span>;
                        else if (isEnd) iconRender = <span className="font-bold text-[11px]">B</span>;
                        else if (type === 'rest stop') iconRender = <Coffee className="w-3.5 h-3.5" />;
                        else if (type === 'gas station') iconRender = <Fuel className="w-3.5 h-3.5" />;
                        else if (type === 'restaurant') iconRender = <Utensils className="w-3.5 h-3.5" />;
                        else if (type === 'hotel') iconRender = <BedDouble className="w-3.5 h-3.5" />;
                        else if (type === 'restroom') iconRender = <Droplets className="w-3.5 h-3.5" />;
                        else if (type === 'sightseeing') iconRender = <Camera className="w-3.5 h-3.5" />;
                        else iconRender = <MapPin className="w-3.5 h-3.5" />;

                        return (
                          <div 
                            key={stop.id} 
                            className="flex gap-4 relative cursor-pointer group"
                            onClick={() => {
                              if(stop.latitude && stop.longitude && map.current) {
                                map.current.flyTo({ center: [stop.longitude, stop.latitude], zoom: 16 });
                              }
                            }}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 transition-colors ${
                              isStart ? 'bg-[#E5F9ED] text-[#34C759] group-hover:bg-[#34C759] group-hover:text-white' : 
                              isEnd ? 'bg-[#FFEBEE] text-[#FF3B30] group-hover:bg-[#FF3B30] group-hover:text-white' : 
                              'bg-[#F2F2F7] text-[#8A8A8E] group-hover:bg-[#8A8A8E] group-hover:text-white'
                            }`}>
                              {iconRender}
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                {stop.location_name || (stop.latitude ? `${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)}` : 'Unknown Location')}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 flex gap-2">
                                <span className="uppercase text-[9px] font-bold px-1.5 rounded bg-gray-100">{stop.stop_type || (isStart ? 'pickup' : isEnd ? 'dropoff' : 'stop')}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {rideDetails.stops.length === 0 && (
                        <div className="text-sm text-gray-500">No stops defined.</div>
                      )}
                    </div>
                  </div>

                  {/* Recent Locations Section */}
                  <div>
                    <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MapIcon className="w-4 h-4" />
                      Recent Pings
                    </h3>
                    <div className="space-y-2">
                      {rideDetails.locations.slice(0, 5).map((loc: any, index: number) => (
                        <div 
                          key={index} 
                          onClick={() => {
                            map.current?.flyTo({ center: [loc.longitude, loc.latitude], zoom: 16 });
                          }}
                          className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono cursor-pointer hover:border-primary/30 transition-colors"
                        >
                          <div>
                            <span className="text-[#8A8A8E]">GPS:</span> {loc.latitude?.toFixed(5)}, {loc.longitude?.toFixed(5)}
                            <div className="text-[10px] text-gray-400 mt-0.5">{new Date(loc.updated_at).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                      {rideDetails.locations.length === 0 && (
                        <div className="text-sm text-gray-500">No recent GPS pings.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedRide.status === 'live' && (
              <div className="p-5 border-t border-[#E5E5EA] shrink-0 bg-gray-50 flex gap-3">
                <button 
                  onClick={async () => {
                    const ok = await confirm({ title: 'Force End Ride', message: 'This ride will be immediately ended for all participants.', confirmLabel: 'Force End', variant: 'danger' });
                    if (!ok) return;
                    await supabase.from('rides').update({ status: 'ended' }).eq('id', selectedRide.id);
                    showToast('Ride ended', 'success');
                    setSelectedRide(null);
                  }}
                  className="flex-1 bg-white border border-red-500 text-red-500 font-bold h-[44px] rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
                >
                  Force End Ride
                </button>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default AdminRides;
