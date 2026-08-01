import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, MapPin, Map, Search, Navigation2, Clock, AlertTriangle, Crosshair, Car, Ban, Waves, Shield, Hammer, MoreHorizontal, ArrowUp, ArrowDown, X, ChevronDown } from 'lucide-react';
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
import { useToast } from '../components/ToastContext';

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
    // Use fractional multipliers to significantly lower the base ORS free-flow speeds to realistic city speeds
    { id: 'motorcycle', label: 'Bike', profile: 'driving-car', speedMultiplier: 0.45 },
    { id: 'driving-car', label: 'Car', profile: 'driving-car', speedMultiplier: 0.35 },
    { id: 'public-transport', label: 'Public Transport', profile: 'driving-car', speedMultiplier: 0.3 }
  ];
  const [selectedMode, setSelectedMode] = useState(TRAVEL_MODES[1]);

  // Track Firebase auth state
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
              
            if (groupData) {
              setUserGroups(groupData);
            }
          } else {
            setUserGroups([]);
          }
        } catch (e) {
          console.error("Group fetch error:", e);
        }
      }
    });
    return () => unsub();
  }, []);

  // Auto-fetch user location on mount
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
        setOriginText('Hyderabad Center'); // Fallback display when permission denied
        setOriginCoords({ lat: 17.3850, lng: 78.4867 }); // Fallback to Hyderabad center
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
       console.error("Geocoding failed", error);
       showToast('Location search failed. Please try again.', 'error');
    }
  };

  const [routeOptions, setRouteOptions] = useState<Array<{
    id: number,
    name: string,
    eta: string,
    distance: string,
    traffic: string,
    incidents: number,
    isPrimary: boolean,
    feature?: any
  }>>([
    {
      id: 0,
      name: 'Primary Route',
      eta: 'Calculating...',
      distance: '...',
      traffic: 'Unknown',
      incidents: 0,
      isPrimary: true
    }
  ]);

  useEffect(() => {
    if (map.current) return;
    
    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [78.4867, 17.3850], // Hyderabad
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
            'line-color': '#ef4523', // primary color
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
            
            if (target === 'origin') {
              setOriginCoords({ lat, lng });
            } else if (target === 'dest') {
              setDestCoords({ lat, lng });
            } else if (target.startsWith('stop-')) {
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
      // Use TomTom API
      const { fetchTomTomRoute } = await import('../lib/routing');
      const coordinates = [
        [originCoords.lng, originCoords.lat],
        ...stops.filter(s => s.coords).map(s => [s.coords!.lng, s.coords!.lat]),
        [destCoords.lng, destCoords.lat]
      ];
      const routeFeature = await fetchTomTomRoute(coordinates, selectedMode.id);

      if (routeFeature) {
        const summary = routeFeature.properties.summary;

        // Use ORS duration directly
        const adjustedDurationSecs = summary.duration;

        // Count incidents ONLY within 500m of the actual route line (not the bounding box)
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

        // Traffic label based on ratio of ORS speed to free-flow speed
        const durationHours = adjustedDurationSecs / 3600;
        const avgSpeedKph = durationHours > 0 ? distanceKm / durationHours : 0;
        const freeflowByMode: Record<string, number> = {
          'foot-walking': 5,
          'motorcycle': 40,
          'driving-car': 50,
          'public-transport': 30
        };
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
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          return `${h}h ${m}m`;
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
        if (source) {
          source.setData(routeFeature);
        }

        // Remove old start/end markers
        document.querySelectorAll('.route-endpoint-marker').forEach(el => el.remove());

        // Add Start marker (green dot with label)
        if (originCoords && map.current) {
          const startEl = document.createElement('div');
          startEl.className = 'route-endpoint-marker';
          startEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;">
            <div style="background:#34C759;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
            <span style="font-size:11px;font-weight:700;color:#34C759;margin-top:2px;text-shadow:0 1px 2px rgba(0,0,0,0.2);white-space:nowrap;">Start</span>
          </div>`;
          new maplibregl.Marker({ element: startEl })
            .setLngLat([originCoords.lng, originCoords.lat])
            .addTo(map.current);
        }

        // Add End marker (red dot with label)
        if (destCoords && map.current) {
          const endEl = document.createElement('div');
          endEl.className = 'route-endpoint-marker';
          endEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;">
            <div style="background:#FF3B30;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
            <span style="font-size:11px;font-weight:700;color:#FF3B30;margin-top:2px;text-shadow:0 1px 2px rgba(0,0,0,0.2);white-space:nowrap;">End</span>
          </div>`;
          new maplibregl.Marker({ element: endEl })
            .setLngLat([destCoords.lng, destCoords.lat])
            .addTo(map.current);
        }

        // Add intermediate stops markers (pill with label)
        if (stops.length > 0 && map.current) {
          stops.filter(s => s.coords).forEach((stop, index) => {
            const stopEl = document.createElement('div');
            stopEl.className = 'route-endpoint-marker';
            
            const info = getStopInfo(stop.type);
            const label = (stop.type && stop.type !== 'Other') ? stop.type : `Stop ${index + 1}`;
            
            stopEl.innerHTML = `<div style="display:flex;align-items:center;background:white;padding:4px 8px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.2);border:2px solid ${info.color};font-weight:700;font-size:12px;color:#1e293b;white-space:nowrap;gap:6px;">
              <span style="font-size:14px;">${info.emoji}</span> <span>${label}</span>
            </div>`;
            new maplibregl.Marker({ element: stopEl })
              .setLngLat([stop.coords!.lng, stop.coords!.lat])
              .addTo(map.current!);
          });
        }
        
        const bbox = routeFeature.bbox;
        if (bbox) {
          map.current?.fitBounds([
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]]
          ], { padding: 50 });
        }
      }
    } catch (error) {
      console.error("Failed to fetch route:", error);
      showToast('Failed to calculate route. Please check your network or try another mode.', 'error');
      setRouteOptions([{
        id: 0,
        name: 'Primary Route',
        eta: 'Unavailable',
        distance: 'Unavailable',
        traffic: 'Unknown',
        incidents: 0,
        isPrimary: true
      }]);
    }
  };

  // Fetch route when coordinates change or travel mode changes
  useEffect(() => {
    fetchRoute();
  }, [originCoords, destCoords, stops, mapLoaded, routePins.length, selectedMode]);

  // Fetch pins and render as HTML markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const fetchPins = async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from('pins').select('*').eq('status', 'active').gte('created_at', twoHoursAgo);
      if (data) {
        // Filter out pins meant for other private groups
        const filteredData = data.filter(pin => !pin.group_id || userGroups.some(g => g.id === pin.group_id));
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

          const stopProp = (e: any) => e.stopPropagation();
          el.addEventListener('mousedown', stopProp);
          el.addEventListener('touchstart', stopProp);
          el.addEventListener('pointerdown', stopProp);

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedIncident(pin);
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([pin.longitude, pin.latitude])
            .addTo(map.current!);
            
          pinMarkersRef.current[pin.id] = marker;
        });

        // Cleanup removed markers
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
    <div className="w-full h-full bg-gray-50 flex flex-col font-sans overflow-hidden">
      
      {/* Top Destination Card (H:120px) */}
      <div className="bg-white px-4 pt-4 pb-4 shadow-sm z-20 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-dark" />
          </button>
          <h1 className="text-[20px] font-bold text-dark">Plan Route</h1>
        </div>
        
        <div className="flex gap-3">
          <div className="flex flex-col items-center justify-start pt-[17px]">
            <div className="w-[10px] h-[10px] rounded-full border-2 border-primary flex-shrink-0"></div>
            {stops.map((_, i) => (
              <React.Fragment key={i}>
                <div className="w-[2px] h-[36px] bg-gray-200 my-1 flex-shrink-0"></div>
                <div className="w-[8px] h-[8px] rounded-full border-2 border-primary bg-white flex-shrink-0 relative z-10"></div>
              </React.Fragment>
            ))}
            <div className="w-[2px] h-[36px] bg-gray-200 my-1 flex-shrink-0"></div>
            <div className="w-[10px] h-[10px] rounded-full bg-primary flex-shrink-0"></div>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={originText}
                onChange={e => setOriginText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGeocode(originText, 'origin')}
                onBlur={() => originText.trim() && handleGeocode(originText, 'origin')}
                placeholder="Start location..."
                className="w-full h-[44px] bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-[80px] text-[14px] text-dark font-medium outline-none focus:border-primary focus:bg-white transition-all"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button 
                  onClick={() => {
                    if (globalLocation) {
                      setOriginCoords({ lat: globalLocation.lat, lng: globalLocation.lng });
                      setOriginText(globalLocationName || 'My Location');
                      return;
                    }
                    useLocationStore.getState().fetchLocationOnce().then(loc => {
                      setOriginCoords({ lat: loc.lat, lng: loc.lng });
                      setOriginText(loc.locationName || 'My Location');
                    }).catch(() => {
                      showToast('Unable to get location. Please allow location access.', 'error');
                    });
                  }}
                  className="w-[28px] h-[28px] rounded flex items-center justify-center text-blue-500 hover:bg-blue-50 active:scale-95 transition-all"
                  title="Use my location"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectingLocationFor('origin')}
                  className={`w-[28px] h-[28px] rounded flex items-center justify-center ${selectingLocationFor === 'origin' ? 'text-primary bg-primary/10' : 'text-blue-500 hover:bg-blue-50'} active:scale-95 transition-all`}
                  title="Select on map"
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>
            {stops.map((stop, index) => (
              <div key={index} className="flex gap-2 w-full items-center relative">
                <div className="relative flex">
                  <button 
                    onClick={() => setOpenDropdownIdx(openDropdownIdx === index ? null : index)}
                    className="h-[44px] flex items-center justify-between gap-1 bg-gray-50 border border-gray-200 border-r-0 rounded-l-lg px-2 text-[12px] text-[#273a5a] font-medium outline-none hover:bg-gray-100 min-w-[95px]"
                  >
                    <div className="flex items-center gap-1">
                      {getStopInfo(stop.type).emoji} <span className="truncate">{!stop.type || stop.type === 'Other' ? 'Pin' : stop.type}</span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                  {openDropdownIdx === index && (
                    <div className="absolute top-[100%] left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-[110] w-[140px] py-1 max-h-[200px] overflow-y-auto hide-scrollbar">
                      {['Pin', 'Food', 'Hospital', 'Mechanic', 'Tea', 'Fuel', 'Stay', 'Sightseeing'].map(t => (
                        <div key={t} onClick={() => { 
                          const newStops = [...stops];
                          newStops[index].type = t === 'Pin' ? 'Other' : t;
                          setStops(newStops);
                          setOpenDropdownIdx(null);
                        }} className="px-3 py-2 text-[13px] font-medium text-[#273a5a] hover:bg-gray-50 cursor-pointer flex items-center gap-2">
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
                    className="w-full h-[44px] bg-gray-50 border border-gray-200 border-l-0 rounded-r-lg pl-3 pr-[40px] text-[14px] text-dark font-medium outline-none focus:border-primary focus:bg-white transition-all"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <button 
                      onClick={() => setSelectingLocationFor(`stop-${index}`)}
                      className={`w-[28px] h-[28px] rounded flex items-center justify-center ${selectingLocationFor === `stop-${index}` ? 'text-primary bg-primary/10' : 'text-blue-500 hover:bg-blue-50'} active:scale-95 transition-all ml-1`}
                      title="Select on map"
                    >
                      <Map className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        const newStops = [...stops];
                        const temp = newStops[index - 1];
                        newStops[index - 1] = newStops[index];
                        newStops[index] = temp;
                        setStops(newStops);
                      }}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        const newStops = [...stops];
                        const temp = newStops[index + 1];
                        newStops[index + 1] = newStops[index];
                        newStops[index] = temp;
                        setStops(newStops);
                      }}
                      disabled={index === stops.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      const newStops = stops.filter((_, i) => i !== index);
                      setStops(newStops);
                    }}
                    className="p-2 ml-1 bg-danger/10 text-danger hover:bg-danger/20 rounded-lg active:scale-95 transition-colors"
                    title="Remove Stop"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="flex gap-2 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={destText}
                  onChange={e => setDestText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGeocode(destText, 'dest')}
                  onBlur={() => destText.trim() && handleGeocode(destText, 'dest')}
                  placeholder="Destination..."
                  className="w-full h-[44px] bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-[40px] text-[14px] text-dark font-medium outline-none focus:border-primary focus:bg-white transition-all"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button 
                    onClick={() => setSelectingLocationFor('dest')}
                    className={`w-[28px] h-[28px] rounded flex items-center justify-center ${selectingLocationFor === 'dest' ? 'text-primary bg-primary/10' : 'text-blue-500 hover:bg-blue-50'} active:scale-95 transition-all`}
                    title="Select on map"
                  >
                    <Map className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {stops.length < 5 && (
              <div className="flex justify-end -mt-1">
                 <button onClick={() => setStops([...stops, { text: '', coords: null }])} className="text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 py-1 px-2 rounded hover:bg-primary/5">
                   + Add Stop
                 </button>
              </div>
            )}
          </div>
        </div>

        {/* Travel Mode Selector */}
        <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {TRAVEL_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode)}
              className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-2 rounded-lg border transition-all ${
                selectedMode.id === mode.id
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="mb-1 text-current flex items-center justify-center">{getTravelModeIcon(mode.id, 'w-6 h-6')}</span>
              <span className="font-semibold text-[12px]">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-gray-200 overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Bottom Route Options Container */}
      <div className="bg-white rounded-t-lg shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-20 flex flex-col">
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-[40px] h-[4px] bg-gray-200 rounded-full"></div>
        </div>
        
        <div className="px-6 py-4 flex flex-col gap-4 max-h-[350px] overflow-y-auto hide-scrollbar">
          {routeOptions.map((route) => (
            <div 
              key={route.id}
              onClick={() => setSelectedRoute(route.id)}
              className={`h-[120px] rounded-lg border-2 transition-all cursor-pointer flex flex-col p-4 ${
                selectedRoute === route.id ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className={`text-[18px] font-bold ${selectedRoute === route.id ? 'text-primary' : 'text-dark'}`}>
                    {route.eta}
                  </h3>
                  <p className="text-[13px] text-gray-500 font-medium">
                    {route.name}{' '}

                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-bold text-dark">{route.distance}</span>
                </div>
              </div>
              
              <div className="mt-auto flex gap-3">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600 bg-white border border-gray-100 px-2 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  {route.traffic}
                </div>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-danger bg-danger/10 px-2 py-1 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {route.incidents} Incidents
                </div>
              </div>
            </div>
          ))}

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
            className="w-full h-[56px] mt-2 bg-primary hover:bg-[#ef4523] text-white font-bold text-[16px] rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-95 transition-all"
          >
            <Navigation2 className="w-5 h-5" />
            Start Navigation
          </button>
        </div>
      </div>

      {selectedIncident && (
        <IncidentDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </div>
  );
};

export default Routes;
