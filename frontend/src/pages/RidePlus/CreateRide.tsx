import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { useLocationStore } from '../../store/useLocationStore';
import { ChevronLeft, MapPin, Map, Users, Calendar, Clock, Car, Shield, Globe, Check, ChevronUp, ChevronDown, ChevronRight, ArrowRight, Search, Trash2, Coffee, Fuel, Utensils, BedDouble, Droplets, Camera, Eye, Edit2, Zap, Bike as Motorcycle, Settings, Send, Sparkles, Crosshair, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/firebase';
import { useToast } from '../../components/ToastContext';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { getDeterministicUuid } from '../../lib/user';

const CreateRide = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const globalLocation = useLocationStore((state) => state.coordinates);
  const globalLocationName = useLocationStore((state) => state.locationName);

  const location = useLocation();
  const restrictInstant = location.state?.restrictInstant || false;

  // --- Step 1 State ---
  const [isInstant, setIsInstant] = useState(!restrictInstant);
  const [openDropdown, setOpenDropdown] = useState<'vehicle' | 'visibility' | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("https://images.unsplash.com/photo-1558981403-c5f9899a28bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80");
  const coverInputRef = useRef<HTMLInputElement>(null);

  // --- Step 2 State (Route Planner) ---
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectingLocationFor, setSelectingLocationFor] = useState<string | null>(null);
  const selectingLocationForRef = useRef<string | null>(null);
  
  const [originText, setOriginText] = useState('Locating...');
  const [destText, setDestText] = useState('');
  const [originCoords, setOriginCoords] = useState<{lat: number, lng: number} | null>(null);
  const [destCoords, setDestCoords] = useState<{lat: number, lng: number} | null>(null);
  const [stops, setStops] = useState<{text: string, coords: {lat: number, lng: number} | null, type?: string}[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<string | null>(null);

  useEffect(() => {
    selectingLocationForRef.current = selectingLocationFor;
  }, [selectingLocationFor]);

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    summary: '',
    description: '',
    visibility: 'public',
    max_riders: 20,
    ride_date: new Date().toISOString().split('T')[0],
    ride_time: new Date().toTimeString().slice(0, 5),
    vehicle_type: 'Any'
  });

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

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file.', 'error');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast('Image exceeds the 10MB size limit.', 'error');
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const [vehicleTypes, setVehicleTypes] = useState<{value: string, label: string}[]>([
    {value: "Any", label: "Any Vehicle"},
    {value: "Motorcycle", label: "Motorcycle"},
    {value: "Scooter", label: "Scooter"},
    {value: "Super Bike", label: "Super Bike"},
    {value: "Cruiser", label: "Cruiser"},
    {value: "Adventure", label: "Adventure"},
    {value: "Sport", label: "Sport"},
    {value: "Touring", label: "Touring"},
    {value: "Electric", label: "Electric"},
    {value: "Car", label: "Car / 4 Wheeler"},
    {value: "Other", label: "Other"}
  ]);

  const [availableStopTypes, setAvailableStopTypes] = useState<{value: string, label: string}[]>([
    {value: "Pickup", label: "Pickup Point"},
    {value: "Rest Stop", label: "Rest Stop"},
    {value: "Sightseeing", label: "Sightseeing"},
    {value: "Gas Station", label: "Gas Station"},
    {value: "Restaurant", label: "Restaurant/Food"},
    {value: "Restroom", label: "Restroom"},
    {value: "Hotel", label: "Hotel"}
  ]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data: vt, error: err1 } = await supabase.from('vehicle_types').select('value, label').order('display_order');
        if (vt && vt.length > 0 && !err1) setVehicleTypes(vt);
      } catch (e) { console.error(e); }
      
      try {
        const { data: st, error: err2 } = await supabase.from('stop_types').select('value, label').order('display_order');
        if (st && st.length > 0 && !err2) setAvailableStopTypes(st);
      } catch (e) { console.error(e); }
    };
    fetchConfig();
  }, []);


  // --- Step 2 Effects & Handlers ---
  
  const handleInputChange = async (text: string, target: string) => {
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

    if (text.length < 3) {
      setSuggestions([]);
      setActiveInput(null);
      return;
    }

    setActiveInput(target);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      setSuggestions(data || []);
    } catch (e) {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion: any, target: string) => {
    const coords = { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) };
    const text = suggestion.display_name?.split(',').slice(0, 3).join(',');

    if (target === 'origin') {
      setOriginCoords(coords);
      setOriginText(text);
    } else if (target === 'dest') {
      setDestCoords(coords);
      setDestText(text);
    } else if (target.startsWith('stop-')) {
      const index = parseInt(target.split('-')[1]);
      setStops(prev => {
        const newStops = [...prev];
        if (newStops[index]) {
          newStops[index].coords = coords;
          newStops[index].text = text;
        }
        return newStops;
      });
    }
    
    setSuggestions([]);
    setActiveInput(null);
  };
const handleGeocode = async (text: string, target: string) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}`);
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
       console.error('Geocoding failed', error);
       showToast('Location search failed. Please try again.', 'error');
    }
  };

  useEffect(() => {
    if (step !== 2) return;
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
      // Don't clean up heavily here to prevent flashing
    }
  }, [step]);

  const fetchRoute = async () => {
    if (!map.current || !mapLoaded || !originCoords || !destCoords) return;
    try {
      const { fetchTomTomRoute } = await import('../../lib/routing');
      const coordinates = [
        [originCoords.lng, originCoords.lat],
        ...stops.filter(s => s.coords).map(s => [s.coords!.lng, s.coords!.lat]),
        [destCoords.lng, destCoords.lat]
      ];
      const routeFeature = await fetchTomTomRoute(coordinates, 'driving-car');

      if (routeFeature) {
        const source = map.current?.getSource('route');
        if (source) {
          (source as maplibregl.GeoJSONSource).setData(routeFeature);
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
      console.error('Failed to fetch route:', error);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [originCoords, destCoords, stops, mapLoaded]);

  const generateRideCode = () => {
    return 'RIDE-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Ride name is required', 'error');
      return;
    }
    setStep(2);
  };

  const handleFinalCreate = async () => {
    if (!originCoords || !destCoords) {
      showToast('Please select at least a START and END point on the map.', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        showToast('Not authenticated. Please log in.', 'error');
        setLoading(false);
        return;
      }

      const rideCode = generateRideCode();
      const combinedDateTime = isInstant 
        ? new Date().toISOString() 
        : new Date(`${formData.ride_date}T${formData.ride_time}`).toISOString();

      let finalImageUrl = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";
      if (coverFile) {
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (!coverFile.type.startsWith('image/')) {
          showToast('Cover file must be an image.', 'error');
          setLoading(false);
          return;
        }
        if (coverFile.size > MAX_FILE_SIZE) {
          showToast('Cover image exceeds the 10MB size limit.', 'error');
          setLoading(false);
          return;
        }
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Date.now()}-cover.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('incident-photos').upload(fileName, coverFile);
        if (!uploadErr) {
          finalImageUrl = supabase.storage.from('incident-photos').getPublicUrl(fileName).data.publicUrl;
        } else {
          console.error("Failed to upload cover image, using default", uploadErr);
          showToast('Failed to upload cover image — using a default image instead.', 'info');
        }
      }

      const fullDescription = [
        formData.tagline ? `Tagline: ${formData.tagline}` : '',
        formData.summary ? `Summary: ${formData.summary}` : '',
        formData.description
      ].filter(Boolean).join('\n\n');

      // 1. Create Ride
      const { data: ride, error: rideErr } = await supabase.from('rides').insert({
        ride_code: rideCode,
        owner_id: user.uid,
        name: formData.name,
        description: fullDescription,
        visibility: formData.visibility,
        max_riders: formData.max_riders,
        ride_date: combinedDateTime,
        vehicle_type: formData.vehicle_type,
        image_url: finalImageUrl,
        start_location: { lat: originCoords!.lat, lng: originCoords!.lng, name: originText },
        destination: { lat: destCoords!.lat, lng: destCoords!.lng, name: destText },
        status: isInstant ? 'live' : 'scheduled'
      }).select().single();

      if (rideErr) throw rideErr;

      // 2. Add Owner as Admin Member
      await supabase.from('ride_members').insert({
        ride_id: ride.id,
        user_id: getDeterministicUuid(user.uid),
        role: 'admin',
        status: 'approved',
        display_name: user.displayName || user.email?.split('@')[0] || 'Admin',
        avatar_url: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email?.split('@')[0] || 'Admin'}`
      });

      // 3. Save all Stops
      const allStops = [
        { name: originText, lat: originCoords!.lat, lng: originCoords!.lng, type: 'Start' },
        ...stops.filter(s => s.coords).map(s => ({ name: s.text, lat: s.coords!.lat, lng: s.coords!.lng, type: s.type || 'Waypoint' })),
        { name: destText, lat: destCoords!.lat, lng: destCoords!.lng, type: 'Destination' }
      ];

      const stopInserts = allStops.map((stop, idx) => ({
        ride_id: ride.id,
        stop_name: stop.name,
        latitude: stop.lat,
        longitude: stop.lng,
        sequence: idx,
        stop_type: stop.type
      }));

      const { error: stopErr } = await supabase.from('ride_stops').insert(stopInserts);
      if (stopErr) throw stopErr;

      showToast(`Ride created! Code: ${rideCode}`, 'success');
      navigate(`/ride-plus/live/${ride.id}`); 
      
    } catch (err: any) {
      showToast(err.message || 'Failed to create ride', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#273a5a] flex flex-col font-sans relative overflow-hidden text-white">
      {step === 1 && (
        <>
        <div className="flex-1 overflow-y-auto pb-32 hide-scrollbar bg-white">
          <input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={handleCoverSelect} />
          {/* ====== IMMERSIVE HERO IMAGE ====== */}
          <div className="relative h-[45dvh] w-full shrink-0 rounded-b-[32px] overflow-hidden shadow-sm">
            <img 
              src={coverPreview}
              alt="Ride Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80"></div>
            
            {/* Top Bar */}
            <div className="absolute top-6 left-4 right-4 flex justify-between items-center z-10">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-md active:scale-95 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>

            {/* Edit Cover Button */}
            <button onClick={() => coverInputRef.current?.click()} className="absolute bottom-6 right-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/20 text-sm font-bold gap-2 flex items-center z-10 hover:bg-black/50 transition-colors">
              <Camera className="w-4 h-4" /> Edit Cover
            </button>
          </div>

          {/* ====== MAIN CONTENT BELOW HERO ====== */}
          <div className="px-5 pt-6 pb-6 space-y-8 bg-white relative z-20">

            {/* ---- Ride Identity ---- */}
            <div className="space-y-3">
              <div className="bg-white border border-gray-100 rounded-2xl p-4 relative shadow-sm">
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Sunday Morning Cruise"
                  className="w-full bg-transparent text-[16px] font-bold text-[#273a5a] placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* ---- Settings Stack ---- */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-visible flex flex-col">
              
              {/* Timing Switch */}
              <div 
                className={`p-4 flex items-center justify-between border-b border-gray-50 transition-colors rounded-t-[24px] ${restrictInstant ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50/50 cursor-pointer'}`}
                onClick={() => {
                  if (restrictInstant) {
                    showToast('You already have an active ride. Leave or end it to create an instant ride.', 'error');
                    return;
                  }
                  setIsInstant(!isInstant);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-300 ${isInstant ? 'bg-orange-50' : 'bg-blue-50'}`}>
                    {isInstant ? <Zap className="w-5 h-5 text-[#ef4523]" fill="currentColor" /> : <Calendar className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-[15px] text-[#273a5a]">
                      {isInstant ? 'Ride Now' : 'Schedule Later'}
                    </span>
                    <span className="text-[12px] text-gray-400 font-bold">
                      {isInstant ? 'Start immediately' : 'Pick a specific time'}
                    </span>
                  </div>
                </div>
                
                {/* Switch Graphic */}
                <div className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 relative ${isInstant ? 'bg-[#ef4523]' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${isInstant ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>

              {/* Expanded Date/Time Pickers (If Scheduled) */}
              {!isInstant && (
                <div className="px-4 py-4 bg-gray-50/50 border-b border-gray-50 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <input 
                    type="date"
                    value={formData.ride_date}
                    onChange={(e) => setFormData({...formData, ride_date: e.target.value})}
                    className="flex-1 bg-white text-[#273a5a] text-[13px] font-bold rounded-xl px-4 py-2.5 outline-none border border-gray-200 focus:border-blue-500 transition-colors shadow-sm"
                  />
                  <input 
                    type="time"
                    value={formData.ride_time}
                    onChange={(e) => setFormData({...formData, ride_time: e.target.value})}
                    className="flex-1 bg-white text-[#273a5a] text-[13px] font-bold rounded-xl px-4 py-2.5 outline-none border border-gray-200 focus:border-blue-500 transition-colors shadow-sm"
                  />
                </div>
              )}

              {/* Max Riders */}
              <div className="p-4 flex flex-col gap-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-[15px] text-[#273a5a]">Rider Capacity</span>
                      <span className="text-[12px] text-gray-400 font-bold">Limit the group size</span>
                    </div>
                  </div>
                  <div className="bg-[#14142B] text-white px-3 py-1.5 rounded-full text-[12px] font-bold shadow-sm">
                    {formData.max_riders} Max
                  </div>
                </div>
                
                <div className="px-2 mt-1">
                  <input 
                    type="range" 
                    min={2} 
                    max={50}
                    value={formData.max_riders || 20} 
                    onChange={(e) => setFormData({...formData, max_riders: parseInt(e.target.value)})} 
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-colors"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 font-bold mt-2">
                    <span>2 riders</span>
                    <span>50 riders</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Type */}
              <div 
                className="p-4 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer relative"
                onClick={() => setOpenDropdown(openDropdown === 'vehicle' ? null : 'vehicle')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center">
                    <Motorcycle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-[15px] text-[#273a5a]">Vehicle Type</span>
                    <span className="text-[12px] text-gray-400 font-bold">What should people bring?</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-[#273a5a] font-bold text-[13px] bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                  {vehicleTypes.find(v => v.value === formData.vehicle_type)?.label || 'Any Vehicle'}
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${openDropdown === 'vehicle' ? 'rotate-180' : ''}`} />
                </div>

                {/* Dropdown */}
                {openDropdown === 'vehicle' && (
                  <div className="absolute top-[calc(100%-8px)] right-4 w-[200px] max-h-[300px] overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {vehicleTypes.map(vt => (
                      <div 
                        key={vt.value}
                        className={`px-4 py-3 text-[13px] font-bold transition-colors border-b border-gray-50 last:border-0 ${formData.vehicle_type === vt.value ? 'bg-rose-50 text-rose-600' : 'text-[#273a5a] hover:bg-gray-50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({...formData, vehicle_type: vt.value});
                          setOpenDropdown(null);
                        }}
                      >
                        {vt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visibility */}
              <div 
                className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer relative rounded-b-[24px]"
                onClick={() => setOpenDropdown(openDropdown === 'visibility' ? null : 'visibility')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-[15px] text-[#273a5a]">Visibility</span>
                    <span className="text-[12px] text-gray-400 font-bold">Who can see this ride?</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-[#273a5a] font-bold text-[13px] bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                  {formData.visibility === 'public' ? 'Public' : 'Private'}
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${openDropdown === 'visibility' ? 'rotate-180' : ''}`} />
                </div>

                {/* Dropdown */}
                {openDropdown === 'visibility' && (
                  <div className="absolute top-[calc(100%-8px)] right-4 w-[160px] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div 
                      className={`px-4 py-3 text-[13px] font-bold transition-colors border-b border-gray-50 ${formData.visibility === 'public' ? 'bg-emerald-50 text-emerald-600' : 'text-[#273a5a] hover:bg-gray-50'}`}
                      onClick={(e) => { e.stopPropagation(); setFormData({...formData, visibility: 'public'}); setOpenDropdown(null); }}
                    >
                      Public
                    </div>
                    <div 
                      className={`px-4 py-3 text-[13px] font-bold transition-colors ${formData.visibility === 'private' ? 'bg-emerald-50 text-emerald-600' : 'text-[#273a5a] hover:bg-gray-50'}`}
                      onClick={(e) => { e.stopPropagation(); setFormData({...formData, visibility: 'private'}); setOpenDropdown(null); }}
                    >
                      Private
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ---- About this ride ---- */}
            <div className="space-y-4 pt-2">
              <h3 className="text-[15px] font-black text-[#273a5a] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#ff5a2c]" /> About this ride
              </h3>
              
              <div className="space-y-3">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 relative shadow-sm">
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="e.g. Meet at the gas station at 8 AM. We'll ride through the canyon and stop for lunch..."
                    rows={4}
                    maxLength={500}
                    className="w-full bg-transparent text-[13px] text-[#273a5a] font-medium placeholder-gray-400 focus:outline-none resize-none"
                  />
                  <div className="text-right mt-1">
                    <span className="text-[10px] text-gray-400 font-medium">{formData.description.length}/500</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ====== FLOATING BOTTOM CTA ====== */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-10 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none z-30">
          <button 
            onClick={handleNextStep}
            className="w-full pointer-events-auto bg-[#ff5a2c] text-white font-bold text-[16px] py-4 rounded-xl shadow-[0_8px_24px_rgba(255,90,44,0.35)] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          >
            Next: Select Route <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        </>
      )}

      {/* ====== STEP 2: ROUTE BUILDER ====== */}
      {step === 2 && (
        <div className="flex-1 flex flex-col bg-gray-50 h-[100dvh] w-full relative z-50">
          {/* Top Destination Card */}
          <div className="bg-white px-4 pt-4 pb-4 shadow-sm z-20 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep(1)} className="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="w-6 h-6 text-[#273a5a]" />
                </button>
                <h1 className="text-[20px] font-bold text-[#273a5a]">Plan Route</h1>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex flex-col items-center justify-start pt-[17px]">
                <div className="w-[10px] h-[10px] rounded-full border-2 border-[#34C759] flex-shrink-0"></div>
                {stops.map((_, i) => (
                  <React.Fragment key={i}>
                    <div className="w-[2px] h-[36px] bg-gray-200 my-1 flex-shrink-0"></div>
                    <div className="w-[8px] h-[8px] rounded-full border-2 border-purple-400 bg-white flex-shrink-0 relative z-10"></div>
                  </React.Fragment>
                ))}
                <div className="w-[2px] h-[36px] bg-gray-200 my-1 flex-shrink-0"></div>
                <div className="w-[10px] h-[10px] rounded-full bg-[#FF3B30] flex-shrink-0"></div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={originText}
                    onChange={e => handleInputChange(e.target.value, 'origin')}
                    onFocus={() => { if(originText.length >= 3) handleInputChange(originText, 'origin'); }}
                    onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                    placeholder="Start location..."
                    className="w-full h-[44px] bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-[80px] text-[14px] text-[#273a5a] font-medium outline-none focus:border-[#ff5a2c] focus:bg-white transition-all"
                  />
                  
                  {activeInput === 'origin' && suggestions.length > 0 && (
                    <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[100] max-h-48 overflow-y-auto">
                      {suggestions.map((s, i) => (
                        <div 
                          key={i} 
                          className="p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer text-[13px] font-medium text-[#273a5a] truncate"
                          onMouseDown={() => handleSelectSuggestion(s, 'origin')}
                        >
                          {s.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                  
                    {activeInput === 'dest' && suggestions.length > 0 && (
                      <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[100] max-h-48 overflow-y-auto">
                        {suggestions.map((s, i) => (
                          <div 
                            key={i} 
                            className="p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer text-[13px] font-medium text-[#273a5a] truncate"
                            onMouseDown={() => handleSelectSuggestion(s, 'dest')}
                          >
                            {s.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button 
                      onClick={() => {
                        if (globalLocation) {
                          setOriginCoords({ lat: globalLocation.lat, lng: globalLocation.lng });
                          setOriginText(globalLocationName || 'My Location');
                        }
                      }}
                      className="w-10 h-10 flex items-center justify-center text-blue-500 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
                      title="Use Current Location"
                    >
                      <Crosshair className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectingLocationFor('origin')}
                      className={`w-[28px] h-[28px] rounded flex items-center justify-center ${selectingLocationFor === 'origin' ? 'text-white bg-[#ff5a2c]' : 'text-blue-500 hover:bg-blue-50'} active:scale-95 transition-all`}
                    >
                      <Map className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {stops.map((stop, index) => (
                  <div key={index} className="flex gap-2 w-full items-center">
                    
                    <div className="relative flex-1 flex">
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
                      <input
                        type="text"
                        value={stop.text}
                        onChange={e => handleInputChange(e.target.value, `stop-${index}`)}
                        onFocus={() => { if(stop.text.length >= 3) handleInputChange(stop.text, `stop-${index}`); }}
                        onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                        placeholder={`Stop ${index + 1}...`}
                        className="w-full h-[44px] bg-gray-50 border border-gray-200 border-l-0 rounded-r-lg pl-3 pr-[40px] text-[14px] text-[#273a5a] font-medium outline-none focus:border-[#ff5a2c] focus:bg-white transition-all"
                      />
                      
                      {activeInput === `stop-${index}` && suggestions.length > 0 && (
                        <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[100] max-h-48 overflow-y-auto">
                          {suggestions.map((s, i) => (
                            <div 
                              key={i} 
                              className="p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer text-[13px] font-medium text-[#273a5a] truncate"
                              onMouseDown={() => handleSelectSuggestion(s, `stop-${index}`)}
                            >
                              {s.display_name}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        <button 
                          onClick={() => setSelectingLocationFor(`stop-${index}`)}
                          className={`w-[28px] h-[28px] rounded flex items-center justify-center ${selectingLocationFor === `stop-${index}` ? 'text-white bg-[#ff5a2c]' : 'text-blue-500 hover:bg-blue-50'} active:scale-95 transition-all ml-1`}
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
                        >
                          <ArrowUpIcon className="w-3 h-3 text-gray-600" />
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
                        >
                          <ArrowDownIcon className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          const newStops = stops.filter((_, i) => i !== index);
                          setStops(newStops);
                        }}
                        className="p-2 ml-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg active:scale-95 transition-colors"
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
                      onChange={e => handleInputChange(e.target.value, 'dest')}
                      onFocus={() => { if(destText.length >= 3) handleInputChange(destText, 'dest'); }}
                      onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                      placeholder="Destination..."
                      className="w-full h-[44px] bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-[40px] text-[14px] text-[#273a5a] font-medium outline-none focus:border-[#ff5a2c] focus:bg-white transition-all"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button 
                        onClick={() => setSelectingLocationFor('dest')}
                        className={`w-[28px] h-[28px] rounded flex items-center justify-center ${selectingLocationFor === 'dest' ? 'text-white bg-[#ff5a2c]' : 'text-blue-500 hover:bg-blue-50'} active:scale-95 transition-all`}
                      >
                        <Map className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {stops.length < 5 && (
                  <div className="flex justify-end -mt-1">
                     <button onClick={() => setStops([...stops, { text: '', coords: null, type: 'Other' }])} className="text-[13px] font-semibold text-[#ff5a2c] hover:text-[#ff5a2c]/80 transition-colors flex items-center gap-1 py-1 px-2 rounded hover:bg-orange-50">
                       + Add Stop
                     </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 relative bg-gray-200 overflow-hidden">
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
            
            {/* Overlay if selecting location */}
            {selectingLocationFor && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#273a5a] text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl z-30 animate-pulse">
                Tap map to select location
              </div>
            )}
          </div>

          {/* Bottom Container CTA */}
          <div className="bg-white px-5 py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-20 flex flex-col mt-auto relative border-t border-gray-100">
            <button 
              onClick={handleFinalCreate}
              disabled={loading || !originCoords || !destCoords}
              className="w-full bg-[#ff5a2c] hover:bg-[#e0481c] text-white font-bold text-[16px] py-4 rounded-xl shadow-[0_8px_24px_rgba(255,90,44,0.35)] active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? 'Creating Ride...' : 'Create Ride & Publish'} ✨
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default CreateRide;
