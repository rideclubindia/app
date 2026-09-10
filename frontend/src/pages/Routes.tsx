import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, MapPin, Map, Search, Navigation2, Clock, AlertTriangle, Crosshair, X, ChevronDown } from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';
import { useNavigate, useLocation } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getTravelModeIcon } from '../components/TravelIcons';
import { IncidentDrawer } from '../components/IncidentDrawer';
import { useIncidentCategories, incidentIconMap } from '../hooks/useIncidentCategories';
import { filterActiveIncidents } from '../lib/incidentExpiry';
import { useToast } from '../components/ToastContext';
import { LeftNavigationRail } from '../components/LeftNavigationRail';
import { Helmet } from 'react-helmet-async';

const Routes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { destLat, destLng, destName, originLat, originLng, isGroupMode } = location.state || {
    destLat: 17.3850,
    destLng: 78.4867,
    destName: 'Hyderabad Center',
    originLat: undefined,
    originLng: undefined,
    isGroupMode: false
  };

  const [selectedRoute, setSelectedRoute] = useState(0);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const pinMarkersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const [selectingLocationFor, setSelectingLocationFor] = useState<string | null>(null);
  const selectingLocationForRef = useRef<string | null>(null);
  
  useEffect(() => {
    selectingLocationForRef.current = selectingLocationFor;
  }, [selectingLocationFor]);

  const { categories: reportTypes } = useIncidentCategories();

  const globalLocation = useLocationStore((state) => state.coordinates);
  const globalLocationName = useLocationStore((state) => state.locationName);

  const [originText, setOriginText] = useState('Fetching location...');
  const [destText, setDestText] = useState(destName);
  const [routePins, setRoutePins] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  
  const [originCoords, setOriginCoords] = useState<{lat: number, lng: number} | null>(null);
  const [destCoords, setDestCoords] = useState({ lat: destLat, lng: destLng });
  const [stops, setStops] = useState<{text: string, coords: {lat: number, lng: number} | null, type?: string}[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  const TRAVEL_MODES = [
    { id: 'foot-walking', label: 'Walk', profile: 'foot-walking', speedMultiplier: 1 },
    { id: 'motorcycle', label: 'Bike', profile: 'driving-car', speedMultiplier: 0.45 },
    { id: 'driving-car', label: 'Car', profile: 'driving-car', speedMultiplier: 0.35 },
    { id: 'public-transport', label: 'Public', profile: 'driving-car', speedMultiplier: 0.3 }
  ];
  const [selectedMode, setSelectedMode] = useState(TRAVEL_MODES[1]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const { data: memberData } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', u.uid)
            .eq('status', 'accepted');
            
          if (memberData && memberData.length > 0) {
            const groupIds = memberData.map(m => m.group_id);
            const { data: groupData } = await supabase
              .from('groups')
              .select('id, name')
              .in('id', groupIds);
              
            if (groupData) setUserGroups(groupData);
          } else {
            setUserGroups([]);
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (originLat && originLng) {
      setOriginCoords({ lat: originLat, lng: originLng });
      setOriginText('My Location');
      return;
    }

    if (globalLocation) {
      setOriginCoords({ lat: globalLocation.lat, lng: globalLocation.lng });
      setOriginText(globalLocationName || 'My Location');
    } else {
      useLocationStore.getState().fetchLocationOnce().then(loc => {
        setOriginCoords({ lat: loc.lat, lng: loc.lng });
        setOriginText(loc.locationName || 'My Location');
      }).catch(() => {
        setOriginText('Hyderabad Center');
        setOriginCoords({ lat: 17.3850, lng: 78.4867 });
      });
    }
  }, [originLat, originLng, globalLocation]);

  const handleGeocode = async (text: string, target: string) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text + ', Hyderabad')}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      if (data && data.length > 0) {
         const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
         if (target === 'origin') setOriginCoords(coords);
         else if (target === 'dest') setDestCoords(coords);
         else if (target.startsWith('stop-')) {
           const index = parseInt(target.split('-')[1]);
           setStops(prev => {
             const newStops = [...prev];
             if (newStops[index]) newStops[index].coords = coords;
             return newStops;
           });
         }
      } else {
        showToast('No locations found for that search', 'error');
      }
    } catch (error) {
       showToast('Location search failed. Please try again.', 'error');
    }
  };

  const [routeOptions, setRouteOptions] = useState<Array<any>>([{
    id: 0,
    name: 'Primary Route',
    eta: 'Calculating...',
    distance: '...',
    traffic: 'Unknown',
    incidents: 0,
    isPrimary: true
  }]);

  useEffect(() => {
    if (map.current) return;
    
    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [78.4867, 17.3850],
        zoom: 12
      });

      map.current.on('load', () => {
        if (!map.current) return;
        
        map.current.addSource('route', {
          'type': 'geojson',
          'data': { type: 'FeatureCollection', features: [] }
        });

        map.current.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'route',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#ef4523',
            'line-width': 6,
            'line-opacity': 0.8
          }
        });

        setMapLoaded(true);
        
        map.current.on('click', async (e) => {
          const target = selectingLocationForRef.current;
          if (target) {
            const lat = e.lngLat.lat;
            const lng = e.lngLat.lng;
            
            if (target === 'origin') setOriginCoords({ lat, lng });
            else if (target === 'dest') setDestCoords({ lat, lng });
            else if (target.startsWith('stop-')) {
              const index = parseInt(target.split('-')[1]);
              setStops(prev => {
                const newStops = [...prev];
                if (newStops[index]) newStops[index].coords = { lat, lng };
                return newStops;
              });
            }
            
            setSelectingLocationFor(null);
            selectingLocationForRef.current = null;

            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
              const data = await res.json();
              const text = data.display_name?.split(',').slice(0, 2).join(',') || 'Selected on map';
              if (target === 'origin') setOriginText(text);
              else if (target === 'dest') setDestText(text);
              else if (target.startsWith('stop-')) {
                const index = parseInt(target.split('-')[1]);
                setStops(prev => {
                  const newStops = [...prev];
                  if (newStops[index]) newStops[index].text = text;
                  return newStops;
                });
              }
            } catch {
              if (target === 'origin') setOriginText('Selected on map');
              else if (target === 'dest') setDestText('Selected on map');
              else if (target.startsWith('stop-')) {
                const index = parseInt(target.split('-')[1]);
                setStops(prev => {
                  const newStops = [...prev];
                  if (newStops[index]) newStops[index].text = 'Selected on map';
                  return newStops;
                });
              }
            }
          }
        });
      });
    }
    
    return () => {
      map.current?.remove();
      map.current = null;
    }
  }, []);

  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);

  const getStopInfo = (type?: string) => {
    switch (type) {
      case 'Food': return { emoji: '🍔', color: '#F59E0B' };
      case 'Fuel': return { emoji: '⛽', color: '#EF4444' };
      case 'Hospital': return { emoji: '🏥', color: '#DC2626' };
      case 'Mechanic': return { emoji: '🔧', color: '#64748B' };
      case 'Tea': return { emoji: '☕', color: '#8B5CF6' };
      case 'Stay': return { emoji: '🛏️', color: '#3B82F6' };
      case 'Sightseeing': return { emoji: '📸', color: '#10B981' };
      default: return { emoji: '📍', color: '#007AFF' };
    }
  };

  const fetchRoute = async () => {
    if (!map.current || !mapLoaded || !originCoords || !destCoords) return;
    try {
      const { fetchTomTomRoute } = await import('../lib/routing');
      const coordinates = [
        [originCoords.lng, originCoords.lat],
        ...stops.filter(s => s.coords).map(s => [s.coords!.lng, s.coords!.lat]),
        [destCoords.lng, destCoords.lat]
      ];
      const routeFeature = await fetchTomTomRoute(coordinates, selectedMode.id);

      if (routeFeature) {
        const summary = routeFeature.properties.summary;
        const adjustedDurationSecs = summary.duration;

        let incidentsCount = 0;
        try {
          const routeLine = turf.lineString(routeFeature.geometry.coordinates);
          const routeBuffer = turf.buffer(routeLine, 0.5, { units: 'kilometers' });
          if (routeBuffer) {
            incidentsCount = routePins.filter(pin => {
              if (!pin.latitude || !pin.longitude) return false;
              const pt = turf.point([pin.longitude, pin.latitude]);
              return turf.booleanPointInPolygon(pt, routeBuffer);
            }).length;
          }
        } catch (e) {
          incidentsCount = 0;
        }

        const distanceKm = summary.distance / 1000;
        const durationHours = adjustedDurationSecs / 3600;
        const avgSpeedKph = durationHours > 0 ? distanceKm / durationHours : 0;
        const freeflowByMode: Record<string, number> = { 'foot-walking': 5, 'motorcycle': 40, 'driving-car': 50, 'public-transport': 30 };
        const freeflow = freeflowByMode[selectedMode.id] || 50;

        let trafficLabel = 'Unknown';
        if (avgSpeedKph > 0) {
          const ratio = avgSpeedKph / freeflow;
          if (ratio < 0.5) trafficLabel = 'Heavy';
          else if (ratio < 0.85) trafficLabel = 'Moderate';
          else trafficLabel = 'Light';
        }
        if (incidentsCount >= 5) trafficLabel = 'Severe';

        const formatEta = (mins: number) => {
          if (mins <= 0) return '<1 min';
          if (mins < 60) return `${mins} min`;
          return `${Math.floor(mins / 60)}h ${mins % 60}m`;
        };
        const etaMins = Math.ceil(adjustedDurationSecs / 60);

        setRouteOptions([{
          id: 0,
          name: 'Primary Route',
          eta: formatEta(etaMins),
          distance: `${distanceKm.toFixed(1)} km`,
          traffic: trafficLabel,
          incidents: incidentsCount,
          isPrimary: true,
          feature: routeFeature
        }]);
        
        const source = map.current?.getSource('route') as maplibregl.GeoJSONSource;
        if (source) source.setData(routeFeature);

        document.querySelectorAll('.route-endpoint-marker').forEach(el => el.remove());

        if (originCoords && map.current) {
          const startEl = document.createElement('div');
          startEl.className = 'route-endpoint-marker';
          startEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;">
            <div style="background:#34C759;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>`;
          new maplibregl.Marker({ element: startEl }).setLngLat([originCoords.lng, originCoords.lat]).addTo(map.current);
        }

        if (destCoords && map.current) {
          const endEl = document.createElement('div');
          endEl.className = 'route-endpoint-marker';
          endEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;">
            <div style="background:#FF3B30;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>`;
          new maplibregl.Marker({ element: endEl }).setLngLat([destCoords.lng, destCoords.lat]).addTo(map.current);
        }

        if (stops.length > 0 && map.current) {
          stops.filter(s => s.coords).forEach((stop, index) => {
            const stopEl = document.createElement('div');
            stopEl.className = 'route-endpoint-marker';
            const info = getStopInfo(stop.type);
            stopEl.innerHTML = `<div style="display:flex;align-items:center;background:white;padding:4px 8px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.2);border:2px solid ${info.color};font-weight:700;font-size:12px;color:#1e293b;white-space:nowrap;gap:6px;">
              <span>${info.emoji}</span>
            </div>`;
            new maplibregl.Marker({ element: stopEl }).setLngLat([stop.coords!.lng, stop.coords!.lat]).addTo(map.current!);
          });
        }
        
        const bbox = routeFeature.bbox;
        if (bbox) map.current?.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50 });
      }
    } catch (error) {
      showToast('Failed to calculate route', 'error');
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [originCoords, destCoords, stops, mapLoaded, routePins.length, selectedMode]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const fetchPins = async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from('pins').select('*').eq('status', 'active').gte('created_at', twoHoursAgo);
      if (data) {
        const activePins = await filterActiveIncidents(data);
        const filteredData = activePins.filter(pin => !pin.group_id || userGroups.some(g => g.id === pin.group_id));
        setRoutePins(filteredData);
        
        filteredData.forEach((pin: any) => {
          if (!pin.latitude || !pin.longitude) return;
          if (pinMarkersRef.current[pin.id]) return;

          const el = document.createElement('div');
          const typeObj = reportTypes.find(t => t.id === pin.category) || reportTypes[7];
          const IconComp = typeObj ? incidentIconMap[typeObj.iconName] : AlertTriangle;
          el.className = 'cursor-pointer hover:scale-110 transition-transform active:scale-95';
          const root = createRoot(el);
          root.render(
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${typeObj?.bg || 'bg-gray-100'}`}>
              <IconComp className={`w-4 h-4 ${typeObj?.color || 'text-gray-600'}`} />
            </div>
          );

          el.addEventListener('click', (e) => { e.stopPropagation(); setSelectedIncident(pin); });
          const marker = new maplibregl.Marker({ element: el }).setLngLat([pin.longitude, pin.latitude]).addTo(map.current!);
          pinMarkersRef.current[pin.id] = marker;
        });

        Object.keys(pinMarkersRef.current).forEach(id => {
          if (!filteredData.some((p: any) => p.id === id)) {
            pinMarkersRef.current[id].remove();
            delete pinMarkersRef.current[id];
          }
        });
      }
    };
    
    fetchPins();
    const interval = setInterval(fetchPins, 3000);
    return () => clearInterval(interval);
  }, [mapLoaded, userGroups]);

  return (
    <React.Fragment>
    <Helmet>
      <title>Route Planner | Ride Club</title>
    </Helmet>

    {/* Plan Route isn't one of the two landscape screens (Ride and
        Navigation) — it always uses the portrait stack, regardless of how
        wide the window is. */}
    <div className="w-full h-full bg-[#E8F1F2] flex flex-col overflow-hidden">

      {/* 1. Navigation Rail */}
      <LeftNavigationRail />

      {/* 2. Planner Panel */}
      <div className="flex flex-col w-full h-[58%] order-3 border-t bg-[#F7F8FA] shrink-0 z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)] border-gray-200">

        {/* Header */}
        <div className="flex items-center gap-3 shrink-0 px-4 pt-3 pb-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#111111] hover:bg-gray-50 active:scale-95 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[#111111] font-semibold text-lg tracking-wide uppercase leading-tight">Plan Route</h1>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-3 flex flex-col gap-3">

          {/* Location Inputs Card */}
          <div className="bg-white rounded-[8px] border border-gray-100 p-3 flex flex-col gap-2.5 shadow-sm">

            {/* Origin */}
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#34C759] border-2 border-white ring-1 ring-gray-200 shrink-0" />
              <div className="relative flex-1">
                <input
                  type="text"
                  value={originText}
                  onChange={e => setOriginText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGeocode(originText, 'origin')}
                  onBlur={() => originText.trim() && handleGeocode(originText, 'origin')}
                  placeholder="Start location..."
                  className="w-full h-10 bg-[#F7F8FA] border border-gray-200 rounded-xl pl-3 pr-[68px] text-[13px] text-[#111111] font-medium outline-none focus:border-[#FF5A00]/60 focus:bg-white transition-all placeholder-gray-400"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button 
                    onClick={() => {
                      if (globalLocation) {
                        setOriginCoords({ lat: globalLocation.lat, lng: globalLocation.lng });
                        setOriginText(globalLocationName || 'My Location');
                      } else {
                        useLocationStore.getState().fetchLocationOnce().then(loc => {
                          setOriginCoords({ lat: loc.lat, lng: loc.lng });
                          setOriginText(loc.locationName || 'My Location');
                        });
                      }
                    }}
                    className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[#FF5A00] hover:bg-[#FF5A00]/10 active:scale-95 transition-all"
                    title="Use my location"
                  >
                    <Crosshair className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSelectingLocationFor('origin')}
                    className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center ${selectingLocationFor === 'origin' ? 'bg-[#FF5A00] text-white' : 'text-blue-500 hover:bg-blue-500/10'} active:scale-95 transition-all`}
                    title="Pick on map"
                  >
                    <Map className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Connector line between origin and destination */}
            <div className="flex items-center gap-2.5 -my-1.5">
              <div className="w-[10px] flex justify-center">
                <div className="w-0.5 h-5 border-l-2 border-dashed border-gray-300" />
              </div>
            </div>

            {/* Stops */}
            {stops.map((stop, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF8A4C] border-2 border-white ring-1 ring-gray-200 shrink-0" />
                <div className="flex-1 flex gap-1.5">
                  <div className="relative">
                    <button 
                      onClick={() => setOpenDropdownIdx(openDropdownIdx === index ? null : index)}
                      className="h-10 flex items-center justify-between gap-1 bg-[#F7F8FA] border border-gray-200 rounded-xl px-2.5 text-[13px] text-[#111111] font-medium outline-none hover:bg-gray-100 min-w-[52px] transition-all"
                    >
                      <div className="flex items-center gap-1">
                        {getStopInfo(stop.type).emoji}
                      </div>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>
                    {openDropdownIdx === index && (
                      <div className="absolute top-[100%] left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-[110] w-[140px] py-1 max-h-[200px] overflow-y-auto hide-scrollbar">
                        {['Pin', 'Food', 'Hospital', 'Mechanic', 'Tea', 'Fuel', 'Stay', 'Sightseeing'].map(t => (
                          <div key={t} onClick={() => { 
                            const newStops = [...stops];
                            newStops[index].type = t === 'Pin' ? 'Other' : t;
                            setStops(newStops);
                            setOpenDropdownIdx(null);
                          }} className="px-3 py-2 text-[13px] font-medium text-[#111111] hover:bg-gray-50 cursor-pointer flex items-center gap-2">
                            {getStopInfo(t === 'Pin' ? 'Other' : t).emoji} {t}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={stop.text}
                      onChange={e => {
                        const newStops = [...stops];
                        newStops[index].text = e.target.value;
                        setStops(newStops);
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleGeocode(stop.text, `stop-${index}`)}
                      onBlur={() => stop.text.trim() && handleGeocode(stop.text, `stop-${index}`)}
                      placeholder={`Stop ${index + 1}...`}
                      className="w-full h-10 bg-[#F7F8FA] border border-gray-200 rounded-xl pl-3 pr-[38px] text-[13px] text-[#111111] font-medium outline-none focus:border-[#FF5A00]/60 focus:bg-white transition-all placeholder-gray-400"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <button 
                        onClick={() => setSelectingLocationFor(`stop-${index}`)}
                        className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center ${selectingLocationFor === `stop-${index}` ? 'bg-[#FF5A00] text-white' : 'text-blue-500 hover:bg-blue-500/10'} active:scale-95 transition-all`}
                        title="Pick on map"
                      >
                        <Map className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newStops = stops.filter((_, i) => i !== index);
                      setStops(newStops);
                    }}
                    className="w-10 h-10 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl active:scale-95 transition-colors flex items-center justify-center shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Destination */}
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] border-2 border-white ring-1 ring-gray-200 shrink-0" />
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={destText}
                  onChange={e => setDestText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGeocode(destText, 'dest')}
                  onBlur={() => destText.trim() && handleGeocode(destText, 'dest')}
                  placeholder="Destination..."
                  className="w-full h-10 bg-[#F7F8FA] border border-gray-200 rounded-xl pl-9 pr-[38px] text-[13px] text-[#111111] font-medium outline-none focus:border-[#FF5A00]/60 focus:bg-white transition-all placeholder-gray-400"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <button 
                    onClick={() => setSelectingLocationFor('dest')}
                    className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center ${selectingLocationFor === 'dest' ? 'bg-[#FF5A00] text-white' : 'text-blue-500 hover:bg-blue-500/10'} active:scale-95 transition-all`}
                    title="Pick on map"
                  >
                    <Map className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {stops.length < 5 && (
              <button 
                onClick={() => setStops([...stops, { text: '', coords: null }])} 
                className="text-[12px] font-semibold text-[#FF5A00] hover:bg-[#FF5A00]/10 transition-colors w-fit px-3 py-1.5 rounded-lg border border-[#FF5A00]/20 mt-0.5 ml-5"
              >
                + Add Stop
              </button>
            )}
          </div>

          {/* Travel Modes */}
          <div className="bg-white rounded-[8px] border border-gray-100 p-1.5 grid grid-cols-4 gap-1 shadow-sm">
            {TRAVEL_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode)}
                className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
                  selectedMode.id === mode.id
                    ? 'bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/25'
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <span className="mb-0.5">{getTravelModeIcon(mode.id, 'w-[18px] h-[18px]')}</span>
                <span className="font-semibold text-[10px] uppercase tracking-wider">{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Route Summary */}
          {routeOptions.map((route) => (
            <div 
              key={route.id}
              onClick={() => setSelectedRoute(route.id)}
              className={`bg-white rounded-[8px] border p-3.5 transition-all shadow-sm cursor-pointer ${
                selectedRoute === route.id ? 'border-[#FF5A00] ring-1 ring-[#FF5A00]/30' : 'border-gray-100'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Fastest Route</span>
                  {selectedRoute === route.id && (
                    <span className="bg-[#FF5A00] text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-sm leading-none">SELECTED</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-end mb-3">
                <h3 className="text-[26px] font-semibold text-[#111111] leading-none tabular-nums">{route.eta}</h3>
                <span className="text-[15px] font-semibold text-[#111111]">{route.distance}</span>
              </div>
              
              <div className="flex gap-1.5">
                <div className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg uppercase tracking-wider ${
                  route.traffic === 'Heavy' || route.traffic === 'Severe'
                    ? 'bg-red-50 text-red-600'
                    : route.traffic === 'Moderate'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-green-50 text-green-600'
                }`}>
                  <Clock className="w-3 h-3" />
                  {route.traffic} Traffic
                </div>
                {route.incidents > 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3" />
                    {route.incidents} Incidents
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sticky Start Button — the panel sits flush against the bottom of
            the screen in portrait, which is exactly where the floating pill
            nav bar (fixed, not part of this flex layout) also sits. Extra
            bottom padding here keeps this button (and the route cards
            scrolled to the bottom, e.g. their traffic/incident badges)
            clear of it instead of rendering underneath. */}
        <div className="shrink-0 p-3 pb-[92px] border-t border-gray-200 bg-[#F7F8FA]">
          <button 
            onClick={() => {
              const selected = routeOptions.find(r => r.id === selectedRoute);
              if (selected && (selected as any).feature) {
                navigate('/navigation', { 
                  state: { 
                    routeFeature: (selected as any).feature,
                    eta: selected.eta,
                    distance: selected.distance,
                    destName: destText,
                    destLat: destCoords.lat,
                    destLng: destCoords.lng,
                    travelMode: selectedMode,
                    isGroupMode: isGroupMode
                  } 
                });
              } else {
                navigate('/navigation');
              }
            }} 
            className="w-full py-3.5 bg-[#FF5A00] text-white font-semibold text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF5A00]/25 active:scale-95 hover:bg-[#ff6a1a] transition-all uppercase tracking-wider"
          >
            <Navigation2 className="w-5 h-5 fill-white" />
            Start Navigation
          </button>
        </div>
      </div>

      {/* 3. Map Area */}
      <div className="w-full flex-1 order-1 relative z-0 overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/10 to-transparent pointer-events-none z-10" />

        {/* Map hint banner when picking a location */}
        {selectingLocationFor && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-[#111111]/90 backdrop-blur text-white text-[12px] font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
            <MapPin className="w-3.5 h-3.5 text-[#FF5A00]" />
            Tap on the map to set {selectingLocationFor === 'origin' ? 'start' : selectingLocationFor === 'dest' ? 'destination' : 'stop'} location
            <button onClick={() => { setSelectingLocationFor(null); selectingLocationForRef.current = null; }} className="ml-1 text-white/60 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>

      {selectedIncident && (
        <IncidentDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </React.Fragment>
  );
};

export default Routes;
