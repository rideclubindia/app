import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocationStore } from '../../store/useLocationStore';
import { ChevronLeft, MapPin, Map, Users, Calendar, Zap, Globe, ChevronDown, ArrowRight, Search, Crosshair, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, X, Camera, Send, Sparkles, Bike as Motorcycle, Loader2 } from 'lucide-react';
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
  const editRideId: string | null = location.state?.editRideId || null;
  const isEditMode = !!editRideId;

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

  // --- Edit Mode: load existing ride and prefill ---
  useEffect(() => {
    const loadRide = async () => {
      if (!editRideId) return;
      try {
        const { data: ride, error } = await supabase.from('rides').select('*').eq('id', editRideId).single();
        if (error || !ride) {
          showToast('Failed to load ride for editing', 'error');
          return;
        }
        const rd = ride.ride_date ? new Date(ride.ride_date) : new Date();
        setFormData(prev => ({
          ...prev,
          name: ride.name || '',
          description: ride.description || '',
          visibility: ride.visibility || 'public',
          max_riders: ride.max_riders || 20,
          ride_date: rd.toISOString().split('T')[0],
          ride_time: rd.toTimeString().slice(0, 5),
          vehicle_type: ride.vehicle_type || 'Any'
        }));
        setIsInstant(ride.status === 'live');
        if (ride.image_url) setCoverPreview(ride.image_url);

        const sl = ride.start_location;
        const dst = ride.destination;
        if (sl?.lat && sl?.lng) {
          setOriginCoords({ lat: sl.lat, lng: sl.lng });
          setOriginText(sl.name || 'Start Location');
        }
        if (dst?.lat && dst?.lng) {
          setDestCoords({ lat: dst.lat, lng: dst.lng });
          setDestText(dst.name || 'Destination');
        }

        const { data: stopsData } = await supabase.from('ride_stops').select('*').eq('ride_id', editRideId).order('sequence', { ascending: true });
        if (stopsData) {
          const middle = stopsData.filter(s => s.stop_type !== 'Start' && s.stop_type !== 'Destination');
          setStops(middle.map(s => ({
            text: s.stop_name || '',
            coords: s.latitude && s.longitude ? { lat: s.latitude, lng: s.longitude } : null,
            type: s.stop_type || 'Other'
          })));
        }
      } catch (e) {
        console.error(e);
        showToast('Failed to load ride', 'error');
      }
    };
    loadRide();
  }, [editRideId]);

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

    if (text.length < 2) {
      setSuggestions([]);
      setActiveInput(null);
      return;
    }

    setActiveInput(target);
    try {
      // Fast, Google Maps-style global places search (Photon by Komoot API)
      const lat = globalLocation?.lat || 17.3850;
      const lng = globalLocation?.lng || 78.4867;
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&lat=${lat}&lon=${lng}&limit=6`);
      const data = await res.json();
      
      if (data && data.features) {
        const mapped = data.features.map((f: any) => ({
          display_name: [f.properties.name, f.properties.street, f.properties.city, f.properties.state, f.properties.country].filter(Boolean).join(', '),
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0]
        }));
        setSuggestions(mapped);
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion: any, target: string) => {
    const coords = { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) };
    const text = suggestion.display_name;

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
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=1`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
         const f = data.features[0];
         const coords = { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
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

      let finalImageUrl = coverPreview;
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

      // 1. Create or Update Ride
      let rideId: string;
      if (isEditMode) {
        const { error: upErr } = await supabase.from('rides').update({
          name: formData.name,
          description: fullDescription,
          visibility: formData.visibility,
          max_riders: formData.max_riders,
          ride_date: combinedDateTime,
          vehicle_type: formData.vehicle_type,
          image_url: finalImageUrl,
          start_location: { lat: originCoords!.lat, lng: originCoords!.lng, name: originText },
          destination: { lat: destCoords!.lat, lng: destCoords!.lng, name: destText }
        }).eq('id', editRideId);
        if (upErr) throw upErr;
        rideId = editRideId;
      } else {
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
        rideId = ride.id;

        // 2. Add Owner as Admin Member (create only)
        await supabase.from('ride_members').insert({
          ride_id: ride.id,
          user_id: getDeterministicUuid(user.uid),
          role: 'admin',
          status: 'approved',
          display_name: user.displayName || user.email?.split('@')[0] || 'Admin',
          avatar_url: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email?.split('@')[0] || 'Admin'}`
        });
      }

      // 3. Save all Stops (replace existing in edit mode)
      const allStops = [
        { name: originText, lat: originCoords!.lat, lng: originCoords!.lng, type: 'Start' },
        ...stops.filter(s => s.coords).map(s => ({ name: s.text, lat: s.coords!.lat, lng: s.coords!.lng, type: s.type || 'Waypoint' })),
        { name: destText, lat: destCoords!.lat, lng: destCoords!.lng, type: 'Destination' }
      ];

      const stopInserts = allStops.map((stop, idx) => ({
        ride_id: rideId,
        stop_name: stop.name,
        latitude: stop.lat,
        longitude: stop.lng,
        sequence: idx,
        stop_type: stop.type
      }));

      await supabase.from('ride_stops').delete().eq('ride_id', rideId);
      const { error: stopErr } = await supabase.from('ride_stops').insert(stopInserts);
      if (stopErr) throw stopErr;

      if (isEditMode) {
        showToast('Ride updated!', 'success');
      } else {
        showToast(`Ride created! Code: ${rideCode}`, 'success');
      }
      navigate(`/ride-plus/live/${rideId}`); 
      
     } catch (err: any) {
      showToast(err.message || (isEditMode ? 'Failed to update ride' : 'Failed to create ride'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-10 bg-[#F7F8FA] border border-gray-200 rounded-xl px-3 text-[13px] text-[#111111] placeholder-gray-400 font-medium outline-none focus:border-[#FF5A00]/60 focus:bg-white focus:ring-1 focus:ring-[#FF5A00]/30 transition-all";

  return (
    <div className="w-full h-full bg-[#F2F4F7] flex flex-col font-sans overflow-hidden">
      {step === 1 && (
        <>
        {/* Header */}
        <div className="flex items-center gap-3 shrink-0 px-5 pt-4 pb-2">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#111111] hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[#111111] font-semibold text-lg tracking-wide uppercase leading-tight">{isEditMode ? 'Edit Ride' : 'Create Ride'}</h1>
            <p className="text-[12px] text-gray-400 font-medium mt-0.5">Step 1 of 2 &middot; {isEditMode ? 'Update ride details' : 'Ride details'}</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex portrait:flex-col landscape:flex-row gap-3 px-3 pb-3">

          {/* Cover Image */}
          <div className="portrait:h-[180px] portrait:shrink-0 landscape:w-[36%] landscape:h-full">
            <input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={handleCoverSelect} />
            <div className="relative w-full h-full rounded-[8px] overflow-hidden border border-gray-100 shadow-sm group">
              <img 
                src={coverPreview}
                alt="Ride Cover" 
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
              <button onClick={() => coverInputRef.current?.click()} className="absolute bottom-3 right-3 px-3 py-2 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/20 text-[12px] font-semibold gap-1.5 flex items-center hover:bg-black/60 active:scale-95 transition-all">
                <Camera className="w-3.5 h-3.5" /> Edit Cover
              </button>
            </div>
          </div>

          {/* Form Column */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto hide-scrollbar pr-1 flex flex-col gap-3">

              {/* Ride Name */}
              <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-3">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ride Name</span>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Sunday Morning Cruise"
                  className="w-full bg-transparent text-[17px] font-semibold text-[#111111] placeholder-gray-300 focus:outline-none uppercase tracking-wide"
                />
              </div>

              {/* Settings Card */}
              <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm flex flex-col overflow-visible">

                {/* Timing Switch */}
                <div 
                  className={`p-3.5 flex items-center justify-between border-b border-gray-50 transition-colors ${(restrictInstant && !isEditMode) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
                  onClick={() => {
                    if (restrictInstant && !isEditMode) {
                      showToast('You already have an active ride. Leave or end it to create an instant ride.', 'error');
                      return;
                    }
                    setIsInstant(!isInstant);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${isInstant ? 'bg-[#FFF0E6]' : 'bg-blue-50'}`}>
                      {isInstant ? <Zap className="w-5 h-5 text-[#FF5A00]" fill="currentColor" /> : <Calendar className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[14px] text-[#111111]">
                        {isInstant ? 'Ride Now' : 'Schedule Later'}
                      </span>
                      <span className="text-[12px] text-gray-400 font-medium">
                        {isInstant ? 'Start immediately' : 'Pick a specific time'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Switch Graphic */}
                  <div className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 relative ${isInstant ? 'bg-[#FF5A00]' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isInstant ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Expanded Date/Time Pickers (If Scheduled) */}
                {!isInstant && (
                  <div className="px-3.5 py-3 bg-[#F7F8FA] border-b border-gray-50 flex gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <input 
                      type="date"
                      value={formData.ride_date}
                      onChange={(e) => setFormData({...formData, ride_date: e.target.value})}
                      className={`flex-1 ${inputClass}`}
                    />
                    <input 
                      type="time"
                      value={formData.ride_time}
                      onChange={(e) => setFormData({...formData, ride_time: e.target.value})}
                      className={`flex-1 ${inputClass}`}
                    />
                  </div>
                )}

                {/* Max Riders */}
                <div className="p-3.5 flex flex-col gap-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[14px] text-[#111111]">Rider Capacity</span>
                        <span className="text-[12px] text-gray-400 font-medium">Limit the group size</span>
                      </div>
                    </div>
                    <div className="bg-[#111111] text-white px-3 py-1 rounded-full text-[12px] font-semibold shadow-sm tabular-nums">
                      {formData.max_riders} Max
                    </div>
                  </div>
                  
                  <div className="px-1">
                    <input 
                      type="range" 
                      min={2} 
                      max={50}
                      value={formData.max_riders || 20} 
                      onChange={(e) => setFormData({...formData, max_riders: parseInt(e.target.value)})} 
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF5A00]"
                    />
                    <div className="flex justify-between text-[11px] text-gray-400 font-semibold mt-1.5">
                      <span>2 riders</span>
                      <span>50 riders</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Type */}
                <div 
                  className="p-3.5 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer relative"
                  onClick={() => setOpenDropdown(openDropdown === 'vehicle' ? null : 'vehicle')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                      <Motorcycle className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[14px] text-[#111111]">Vehicle Type</span>
                      <span className="text-[12px] text-gray-400 font-medium">What should people bring?</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[#111111] font-semibold text-[12px] bg-[#F7F8FA] border border-gray-200 px-3 py-1.5 rounded-full">
                    {vehicleTypes.find(v => v.value === formData.vehicle_type)?.label || 'Any Vehicle'}
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${openDropdown === 'vehicle' ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Dropdown */}
                  {openDropdown === 'vehicle' && (
                    <div className="absolute top-[calc(100%-8px)] right-4 w-[200px] max-h-[300px] overflow-y-auto hide-scrollbar bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-200">
                      {vehicleTypes.map(vt => (
                        <div 
                          key={vt.value}
                          className={`px-4 py-2.5 text-[13px] font-semibold transition-colors border-b border-gray-50 last:border-0 ${formData.vehicle_type === vt.value ? 'bg-[#FFF0E6] text-[#FF5A00]' : 'text-[#111111] hover:bg-gray-50'}`}
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
                  className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer relative"
                  onClick={() => setOpenDropdown(openDropdown === 'visibility' ? null : 'visibility')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[14px] text-[#111111]">Visibility</span>
                      <span className="text-[12px] text-gray-400 font-medium">Who can see this ride?</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[#111111] font-semibold text-[12px] bg-[#F7F8FA] border border-gray-200 px-3 py-1.5 rounded-full">
                    {formData.visibility === 'public' ? 'Public' : 'Private'}
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${openDropdown === 'visibility' ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Dropdown */}
                  {openDropdown === 'visibility' && (
                    <div className="absolute top-[calc(100%-8px)] right-4 w-[160px] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div 
                        className={`px-4 py-2.5 text-[13px] font-semibold transition-colors border-b border-gray-50 ${formData.visibility === 'public' ? 'bg-emerald-50 text-emerald-600' : 'text-[#111111] hover:bg-gray-50'}`}
                        onClick={(e) => { e.stopPropagation(); setFormData({...formData, visibility: 'public'}); setOpenDropdown(null); }}
                      >
                        Public
                      </div>
                      <div 
                        className={`px-4 py-2.5 text-[13px] font-semibold transition-colors ${formData.visibility === 'private' ? 'bg-emerald-50 text-emerald-600' : 'text-[#111111] hover:bg-gray-50'}`}
                        onClick={(e) => { e.stopPropagation(); setFormData({...formData, visibility: 'private'}); setOpenDropdown(null); }}
                      >
                        Private
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* About this ride */}
              <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-3.5">
                <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF5A00]" /> About this ride
                </h3>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="e.g. Meet at the gas station at 8 AM. We'll ride through the canyon and stop for lunch..."
                  rows={3}
                  maxLength={500}
                  className="w-full bg-[#F7F8FA] border border-gray-200 rounded-xl p-3 text-[13px] text-[#111111] font-medium placeholder-gray-400 focus:outline-none focus:border-[#FF5A00]/60 focus:bg-white focus:ring-1 focus:ring-[#FF5A00]/30 transition-all resize-none"
                />
                <div className="text-right mt-1">
                  <span className="text-[10px] text-gray-400 font-medium">{formData.description.length}/500</span>
                </div>
              </div>

            </div>

            {/* CTA */}
            <div className="shrink-0 pt-3">
              <button 
                onClick={handleNextStep}
                className="w-full bg-[#FF5A00] hover:bg-[#ff6a1a] text-white font-semibold text-[15px] py-3.5 rounded-xl shadow-lg shadow-[#FF5A00]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                Continue to Route <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {/* ====== STEP 2: ROUTE BUILDER ====== */}
      {step === 2 && (
        <>
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(1)} className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#111111] hover:bg-gray-50 active:scale-95 transition-all shadow-sm">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[#111111] font-semibold text-lg tracking-wide uppercase leading-tight">Plan Route</h1>
              <p className="text-[12px] text-gray-400 font-medium mt-0.5">Step 2 of 2 &middot; Add stops along the way</p>
            </div>
          </div>
          <button 
            onClick={handleFinalCreate}
            disabled={loading}
            className="h-10 px-5 rounded-full bg-[#FF5A00] hover:bg-[#ff6a1a] text-white text-[14px] font-semibold flex items-center gap-2 shadow-lg shadow-[#FF5A00]/25 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isEditMode ? 'Save Changes' : 'Create Ride'}
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-row gap-3 px-3 pb-3">

          {/* Inputs Panel */}
          <div className="w-[340px] min-w-[290px] max-w-[380px] shrink-0 bg-white rounded-[8px] border border-gray-100 shadow-sm overflow-y-auto hide-scrollbar p-3">

            {/* Origin */}
            <div className="flex items-start gap-2.5">
              <div className="flex flex-col items-center pt-[15px] shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#34C759] border-2 border-white ring-1 ring-gray-200" />
                <div className="w-0.5 flex-1 min-h-[24px] border-l-2 border-dashed border-gray-200 my-1" />
              </div>
              <div className="relative flex-1 pb-1">
                <input
                  type="text"
                  value={originText}
                  onChange={e => handleInputChange(e.target.value, 'origin')}
                  onFocus={() => { if(originText.length >= 3) handleInputChange(originText, 'origin'); }}
                  onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                  placeholder="Start location..."
                  className={inputClass}
                />
                {activeInput === 'origin' && suggestions.length > 0 && (
                  <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] max-h-48 overflow-y-auto hide-scrollbar">
                    {suggestions.map((s, i) => (
                      <div 
                        key={i} 
                        className="p-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer text-[12px] font-medium text-[#111111] truncate"
                        onMouseDown={() => handleSelectSuggestion(s, 'origin')}
                      >
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button 
                    onClick={() => {
                      if (globalLocation) {
                        setOriginCoords({ lat: globalLocation.lat, lng: globalLocation.lng });
                        setOriginText(globalLocationName || 'My Location');
                      }
                    }}
                    className="w-[30px] h-[30px] flex items-center justify-center text-[#FF5A00] hover:bg-[#FF5A00]/10 rounded-lg transition-colors active:scale-95"
                    title="Use Current Location"
                  >
                    <Crosshair className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSelectingLocationFor('origin')}
                    className={`w-[30px] h-[30px] flex items-center justify-center rounded-lg active:scale-95 transition-all ${selectingLocationFor === 'origin' ? 'text-white bg-[#FF5A00]' : 'text-blue-500 hover:bg-blue-50'}`}
                    title="Pick on map"
                  >
                    <Map className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stops */}
            {stops.map((stop, index) => (
              <div key={index} className="flex items-start gap-2.5">
                <div className="flex flex-col items-center pt-[15px] shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#FF8A4C] border-2 border-white ring-1 ring-gray-200" />
                  <div className="w-0.5 flex-1 min-h-[24px] border-l-2 border-dashed border-gray-200 my-1" />
                </div>
                <div className="flex-1 pb-1 flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <div className="relative">
                      <button 
                        onClick={() => setOpenDropdownIdx(openDropdownIdx === index ? null : index)}
                        className="h-10 flex items-center justify-between gap-1 bg-[#F7F8FA] border border-gray-200 rounded-xl px-2.5 text-[12px] text-[#111111] font-medium outline-none hover:bg-gray-100 min-w-[52px] transition-all"
                      >
                        {getStopInfo(stop.type).emoji}
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
                        onChange={e => handleInputChange(e.target.value, `stop-${index}`)}
                        onFocus={() => { if(stop.text.length >= 3) handleInputChange(stop.text, `stop-${index}`); }}
                        onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                        placeholder={`Stop ${index + 1}...`}
                        className={`${inputClass} pr-[38px]`}
                      />
                      {activeInput === `stop-${index}` && suggestions.length > 0 && (
                        <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] max-h-48 overflow-y-auto hide-scrollbar">
                          {suggestions.map((s, i) => (
                            <div 
                              key={i} 
                              className="p-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer text-[12px] font-medium text-[#111111] truncate"
                              onMouseDown={() => handleSelectSuggestion(s, `stop-${index}`)}
                            >
                              {s.display_name}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <button 
                          onClick={() => setSelectingLocationFor(`stop-${index}`)}
                          className={`w-[30px] h-[30px] flex items-center justify-center rounded-lg active:scale-95 transition-all ${selectingLocationFor === `stop-${index}` ? 'text-white bg-[#FF5A00]' : 'text-blue-500 hover:bg-blue-50'}`}
                          title="Pick on map"
                        >
                          <Map className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const newStops = [...stops];
                        const temp = newStops[index - 1];
                        newStops[index - 1] = newStops[index];
                        newStops[index] = temp;
                        setStops(newStops);
                      }}
                      disabled={index === 0}
                      className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                      title="Move up"
                    >
                      <ArrowUpIcon className="w-3.5 h-3.5 text-gray-500" />
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
                      className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                      title="Move down"
                    >
                      <ArrowDownIcon className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button 
                      onClick={() => {
                        const newStops = stops.filter((_, i) => i !== index);
                        setStops(newStops);
                      }}
                      className="p-1.5 ml-auto bg-red-50 text-red-500 hover:bg-red-100 rounded-lg active:scale-95 transition-colors"
                      title="Remove stop"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Destination */}
            <div className="flex items-start gap-2.5">
              <div className="flex flex-col items-center pt-[15px] shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] border-2 border-white ring-1 ring-gray-200" />
              </div>
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={destText}
                  onChange={e => handleInputChange(e.target.value, 'dest')}
                  onFocus={() => { if(destText.length >= 3) handleInputChange(destText, 'dest'); }}
                  onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                  placeholder="Destination..."
                  className={`${inputClass} pl-9 pr-[38px]`}
                />
                {activeInput === 'dest' && suggestions.length > 0 && (
                  <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] max-h-48 overflow-y-auto hide-scrollbar">
                    {suggestions.map((s, i) => (
                      <div 
                        key={i} 
                        className="p-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer text-[12px] font-medium text-[#111111] truncate"
                        onMouseDown={() => handleSelectSuggestion(s, 'dest')}
                      >
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <button 
                    onClick={() => setSelectingLocationFor('dest')}
                    className={`w-[30px] h-[30px] flex items-center justify-center rounded-lg active:scale-95 transition-all ${selectingLocationFor === 'dest' ? 'text-white bg-[#FF5A00]' : 'text-blue-500 hover:bg-blue-50'}`}
                    title="Pick on map"
                  >
                    <Map className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {stops.length < 5 && (
              <button onClick={() => setStops([...stops, { text: '', coords: null, type: 'Other' }])} className="mt-3 ml-6 text-[12px] font-semibold text-[#FF5A00] hover:bg-[#FF5A00]/10 transition-colors flex items-center gap-1 py-1.5 px-3 rounded-lg border border-[#FF5A00]/20">
                + Add Stop
              </button>
            )}
          </div>

          {/* Map */}
          <div className="flex-1 relative rounded-[8px] overflow-hidden border border-gray-100 shadow-sm bg-[#E8F1F2]">
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#F7F8FA] z-10">
                <div className="w-8 h-8 border-4 border-[#FF5A00] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Picking hint banner */}
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
        </>
      )}
    </div>
  );
};

export default CreateRide;
