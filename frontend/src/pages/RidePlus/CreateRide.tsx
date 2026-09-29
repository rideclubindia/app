import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocationStore } from '../../store/useLocationStore';
import {
  ChevronLeft, MapPin, Map, Users, Calendar, Clock, Zap, Globe, Lock, ChevronRight, ArrowRight, Search, Crosshair,
  ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, X, Camera, Send, Sparkles, Bike as Motorcycle, Motorbike, Car, Bike as CycleIcon, Loader2, Check,
  Sun, Mountain, Compass, TreePine, Moon, Target, Route as RouteIcon, Flag,
  Utensils, Fuel, HeartPulse, Wrench, Coffee, BedDouble
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/firebase';
import { useToast } from '../../components/ToastContext';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getDeterministicUuid, getAppUser } from '../../lib/user';
import { uploadImage, UploadError } from '../../lib/mediaUpload';
import { useConfirm } from '../../components/ConfirmDialog';
import img16 from '../../assets/WebsiteImages/img16.jpg';
const imgSoloRide = img16;

const DRAFT_KEY = 'rideclub_create_ride_draft';

const RIDE_TYPES = [
  { value: 'Leisure', label: 'Leisure', icon: Sun },
  { value: 'Adventure', label: 'Adventure', icon: Mountain },
  { value: 'Touring', label: 'Touring', icon: Compass },
  { value: 'Off-road', label: 'Off-road', icon: TreePine },
  { value: 'Night Ride', label: 'Night Ride', icon: Moon },
  { value: 'Practice', label: 'Practice', icon: Target },
];

const STEPS = ['Basics', 'Route', 'Details', 'Review'] as const;

const CreateRide = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const globalLocation = useLocationStore((state) => state.coordinates);
  const globalLocationName = useLocationStore((state) => state.locationName);

  const location = useLocation();
  const restrictInstant = location.state?.restrictInstant || false;
  const presetGroupId: string | null = location.state?.presetGroupId || null;
  const editRideId: string | null = location.state?.editRideId || null;
  const isEditMode = !!editRideId;

  // --- Basics state ---
  const [isInstant, setIsInstant] = useState(!restrictInstant);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(imgSoloRide);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [rideType, setRideType] = useState('Leisure');

  // --- Route state ---
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
  const [suggestAnchor, setSuggestAnchor] = useState<{ top: number; bottom: number; left: number; width: number } | null>(null);
  const [mapSearchText, setMapSearchText] = useState('');
  const [routeStats, setRouteStats] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [mapView, setMapView] = useState<'map' | 'satellite'>('map');

  // Add-Waypoint popup: pick stop type + location (text search or map tap)
  // in one place, instead of the old always-editable inline row.
  const [showWaypointModal, setShowWaypointModal] = useState(false);
  const [waypointDraft, setWaypointDraft] = useState<{ type: string; text: string; coords: { lat: number, lng: number } | null }>({ type: 'Other', text: '', coords: null });
  const WAYPOINT_DRAFT_KEY = 'waypoint-draft';

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
    vehicle_type: 'any'
  });

  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);

  const getStopInfo = (type?: string) => {
    switch (type) {
      case 'Food': return { emoji: '🍔', color: '#F59E0B', icon: Utensils };
      case 'Fuel': return { emoji: '⛽', color: '#EF4444', icon: Fuel };
      case 'Hospital': return { emoji: '🏥', color: '#DC2626', icon: HeartPulse };
      case 'Mechanic': return { emoji: '🔧', color: '#64748B', icon: Wrench };
      case 'Tea': return { emoji: '☕', color: '#8B5CF6', icon: Coffee };
      case 'Stay': return { emoji: '🛏️', color: '#3B82F6', icon: BedDouble };
      case 'Sightseeing': return { emoji: '📸', color: '#10B981', icon: Camera };
      default: return { emoji: '📍', color: '#007AFF', icon: MapPin };
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
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
    {value: "any", label: "All"},
    {value: "motorcycle", label: "Bike"},
    {value: "car", label: "Car"},
    {value: "cycle", label: "Cycle"}
  ]);

  const vehicleTypeIcon = (label: string) => {
    switch (label) {
      case 'All': return Users;
      case 'Bike': return Motorbike;
      case 'Car': return Car;
      case 'Cycle': return CycleIcon;
      default: return Motorcycle;
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data: vt, error: err1 } = await supabase.from('vehicle_types').select('value, label').order('display_order');
        if (vt && vt.length > 0 && !err1) setVehicleTypes(vt);
      } catch (e) { console.error(e); }
    };
    fetchConfig();
  }, []);

  // --- Draft: real localStorage save/restore, not a fabricated backend feature ---
  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        formData, rideType, originText, destText, originCoords, destCoords, stops, isInstant
      }));
      showToast('Draft saved on this device', 'success');
    } catch {
      showToast('Failed to save draft', 'error');
    }
  };

  useEffect(() => {
    if (isEditMode) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.formData) setFormData(draft.formData);
      if (draft.rideType) setRideType(draft.rideType);
      if (draft.originText) setOriginText(draft.originText);
      if (draft.destText) setDestText(draft.destText);
      if (draft.originCoords) setOriginCoords(draft.originCoords);
      if (draft.destCoords) setDestCoords(draft.destCoords);
      if (draft.stops) setStops(draft.stops);
      if (typeof draft.isInstant === 'boolean') setIsInstant(draft.isInstant);
    } catch { /* ignore corrupt draft */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        // Ride type is packed into description (e.g. "Type: Adventure") since
        // there's no dedicated column — pull it back out here.
        let desc = ride.description || '';
        const typeMatch = desc.match(/^Type: (.+)$/m);
        if (typeMatch) {
          setRideType(typeMatch[1]);
          desc = desc.replace(/^Type: .+\n?\n?/m, '');
        }

        setFormData(prev => ({
          ...prev,
          name: ride.name || '',
          description: desc,
          visibility: ride.visibility || 'public',
          max_riders: ride.max_riders || 20,
          ride_date: rd.toISOString().split('T')[0],
          ride_time: rd.toTimeString().slice(0, 5),
          vehicle_type: ride.vehicle_type || 'any'
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

  // --- Route Effects & Handlers (unchanged logic) ---

  const handleInputChange = async (text: string, target: string) => {
    if (target === 'origin') setOriginText(text);
    else if (target === 'dest') setDestText(text);
    else if (target === WAYPOINT_DRAFT_KEY) setWaypointDraft(prev => ({ ...prev, text }));
    else if (target === 'map-search') setMapSearchText(text);
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
    } else if (target === WAYPOINT_DRAFT_KEY) {
      setWaypointDraft(prev => ({ ...prev, coords, text }));
    } else if (target === 'map-search') {
      setMapSearchText('');
      if (map.current) map.current.flyTo({ center: [coords.lng, coords.lat], zoom: 15 });
      setWaypointDraft({ type: 'Other', text, coords });
      setOpenDropdownIdx(null);
      setShowWaypointModal(true);
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

  useEffect(() => {
    if (step !== 2) return;
    if (map.current) return;

    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
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
          'layout': { 'line-join': 'round', 'line-cap': 'round' },
          'paint': { 'line-color': '#FF6B22', 'line-width': 6, 'line-opacity': 0.85 }
        });

        setMapLoaded(true);

        map.current.on('click', async (e) => {
          const target = selectingLocationForRef.current;
          if (!target) {
            const lat = e.lngLat.lat;
            const lng = e.lngLat.lng;
            let text = 'Selected on map';
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
              const data = await res.json();
              text = data.display_name?.split(',').slice(0, 2).join(',') || text;
            } catch { /* keep fallback text */ }
            setWaypointDraft({ type: 'Other', text, coords: { lat, lng } });
            setOpenDropdownIdx(null);
            setShowWaypointModal(true);
            return;
          }
          if (target) {
            const lat = e.lngLat.lat;
            const lng = e.lngLat.lng;

            if (target === 'origin') setOriginCoords({ lat, lng });
            else if (target === 'dest') setDestCoords({ lat, lng });
            else if (target === WAYPOINT_DRAFT_KEY) setWaypointDraft(prev => ({ ...prev, coords: { lat, lng } }));
            else if (target.startsWith('stop-')) {
              const index = parseInt(target.split('-')[1]);
              setStops(prev => {
                const newStops = [...prev];
                if (newStops[index]) newStops[index].coords = { lat, lng };
                return newStops;
              });
            }

            setSelectingLocationFor(null);
            if (target === WAYPOINT_DRAFT_KEY) setShowWaypointModal(true);

            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
              const data = await res.json();
              const text = data.display_name?.split(',').slice(0, 2).join(',') || 'Selected on map';
              if (target === 'origin') setOriginText(text);
              else if (target === 'dest') setDestText(text);
              else if (target === WAYPOINT_DRAFT_KEY) setWaypointDraft(prev => ({ ...prev, text }));
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
              else if (target === WAYPOINT_DRAFT_KEY) setWaypointDraft(prev => ({ ...prev, text: 'Selected on map' }));
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

        // Real distance/duration from the TomTom response — not decorative.
        if (routeFeature.properties?.summary?.distance != null) {
          setRouteStats({
            distanceKm: routeFeature.properties.summary.distance / 1000,
            durationMin: routeFeature.properties.summary.duration / 60
          });
        }

        document.querySelectorAll('.route-endpoint-marker').forEach(el => el.remove());

        if (originCoords && map.current) {
          const startEl = document.createElement('div');
          startEl.className = 'route-endpoint-marker';
          startEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;">
            <div style="background:#34C759;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
            <span style="font-size:11px;font-weight:700;color:#34C759;margin-top:2px;text-shadow:0 1px 2px rgba(0,0,0,0.2);white-space:nowrap;">Start</span>
          </div>`;
          new maplibregl.Marker({ element: startEl }).setLngLat([originCoords.lng, originCoords.lat]).addTo(map.current);
        }

        if (destCoords && map.current) {
          const endEl = document.createElement('div');
          endEl.className = 'route-endpoint-marker';
          endEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;">
            <div style="background:#FF3B30;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
            <span style="font-size:11px;font-weight:700;color:#FF3B30;margin-top:2px;text-shadow:0 1px 2px rgba(0,0,0,0.2);white-space:nowrap;">End</span>
          </div>`;
          new maplibregl.Marker({ element: endEl }).setLngLat([destCoords.lng, destCoords.lat]).addTo(map.current);
        }

        if (stops.length > 0 && map.current) {
          stops.filter(s => s.coords).forEach((stop, index) => {
            const stopEl = document.createElement('div');
            stopEl.className = 'route-endpoint-marker';
            const info = getStopInfo(stop.type);
            const label = (stop.type && stop.type !== 'Other') ? stop.type : `Stop ${index + 1}`;
            stopEl.innerHTML = `<div style="display:flex;align-items:center;background:white;padding:4px 8px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.2);border:2px solid ${info.color};font-weight:700;font-size:12px;color:#1e293b;white-space:nowrap;gap:6px;">
              <span style="font-size:14px;">${info.emoji}</span> <span>${label}</span>
            </div>`;
            new maplibregl.Marker({ element: stopEl }).setLngLat([stop.coords!.lng, stop.coords!.lat]).addTo(map.current!);
          });
        }

        const bbox = routeFeature.bbox;
        if (bbox) {
          map.current?.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50 });
        }
      }
    } catch (error) {
      console.error('Failed to fetch route:', error);
    }
  };

  useEffect(() => {
    fetchRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originCoords, destCoords, stops, mapLoaded]);

  // Map / Satellite toggle. Switching maplibre's style wipes custom
  // sources/layers, so the route line is re-added and redrawn afterward.
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const styleSpec = mapView === 'satellite'
      ? {
          version: 8 as const,
          sources: {
            esri: {
              type: 'raster' as const,
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256
            }
          },
          layers: [{ id: 'esri', type: 'raster' as const, source: 'esri' }]
        }
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

    map.current.setStyle(styleSpec as any);
    map.current.once('styledata', () => {
      if (!map.current) return;
      if (!map.current.getSource('route')) {
        map.current.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.current.addLayer({
          id: 'route', type: 'line', source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#FF6B22', 'line-width': 6, 'line-opacity': 0.85 }
        });
      }
      fetchRoute();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapView]);

  const generateRideCode = () => 'RIDE-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const goToStep = (n: number) => {
    if (n === 2 && !formData.name) {
      showToast('Ride title is required', 'error');
      return;
    }
    if (n === 3 && (!originCoords || !destCoords)) {
      showToast('Please set a start and end point on the map first.', 'error');
      return;
    }
    setStep(n);
  };

  const handleFinalCreate = async () => {
    if (!originCoords || !destCoords) {
      showToast('Please select at least a START and END point on the map.', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = getAppUser(auth.currentUser);
      if (!user) {
        showToast('Your session has expired. Please log in again.', 'error');
        setLoading(false);
        return;
      }

      const rideCode = generateRideCode();
      const combinedDateTime = isInstant
        ? new Date().toISOString()
        : new Date(`${formData.ride_date}T${formData.ride_time}`).toISOString();

      // Only a real uploaded URL is saved; a local preview (blob:) or bundled asset path is never stored on the ride
      let finalImageUrl: string | null = coverPreview && /^https?:\/\//.test(coverPreview) ? coverPreview : null;
      if (coverFile) {
        try {
          finalImageUrl = await uploadImage(coverFile, 'ride');
        } catch (e: any) {
          const msg = e instanceof UploadError ? e.message : 'Photo upload failed.';
          const keep = await confirm({ title: 'Ride photo not uploaded', message: `${msg} Create the ride without this photo?`, confirmLabel: 'Continue without photo', cancelLabel: 'Go back', variant: 'warning' }).catch(() => false);
          if (!keep) { setLoading(false); return; }
        }
      }

      // Ride type has no dedicated column, so it's packed into description
      // (same convention this codebase already used for tagline/summary).
      const fullDescription = [
        `Type: ${rideType}`,
        formData.tagline ? `Tagline: ${formData.tagline}` : '',
        formData.description
      ].filter(Boolean).join('\n\n');

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
          status: isInstant ? 'live' : 'scheduled',
          group_id: presetGroupId
        }).select().single();

        if (rideErr) throw rideErr;
        rideId = ride.id;

        await supabase.from('ride_members').insert({
          ride_id: ride.id,
          user_id: getDeterministicUuid(user.uid),
          role: 'admin',
          status: 'approved',
          display_name: user.displayName || user.email?.split('@')[0] || 'Admin',
          avatar_url: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email?.split('@')[0] || 'Admin'}`
        });
      }

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

      localStorage.removeItem(DRAFT_KEY);

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

  const inputClass = "w-full h-11 card-app px-3.5 text-[13px] text-gray-950 placeholder-gray-400 font-medium outline-none focus:ring-2 focus:ring-[#FF6B22] transition-all";

  // ---- Shared header/stepper ----
  const header = (
    <div className="shrink-0 px-4 pt-4 pb-3.5 max-w-[560px] w-full mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => step === 1 ? navigate(-1) : goToStep(step - 1)}
          className="w-10 h-10 rounded-full card-app flex items-center justify-center text-gray-800 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-[16px] font-bold text-gray-950 leading-tight">{isEditMode ? 'Edit Ride' : 'Create a Ride'}</h1>
          <p className="text-[10.5px] font-semibold text-gray-400 leading-tight">Step {step} of {STEPS.length} &middot; {STEPS[step - 1]}</p>
        </div>
        <button onClick={saveDraft} className="text-[12px] font-bold text-[#FF6B22] cursor-pointer px-2 py-1">Save Draft</button>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {STEPS.map((label, idx) => {
          const n = idx + 1;
          const isDone = step > n;
          const isCurrent = step === n;
          return (
            <React.Fragment key={label}>
              <button
                onClick={() => n < step && goToStep(n)}
                disabled={n > step}
                aria-label={`${label} step ${n}${isCurrent ? ', current' : isDone ? ', completed' : ''}`}
                className={`flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap py-2.5 -my-2.5 ${n <= step ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-all ${
                  isDone ? 'bg-[#FF6B22] text-white' : isCurrent ? 'bg-[#FF6B22] text-white ring-4 ring-[#FF6B22]/15' : 'bg-gray-100 text-gray-400'
                }`}>
                  {isDone ? <Check className="w-3 h-3" /> : n}
                </span>
                <span className={`hidden xs:inline ${isCurrent ? 'text-gray-950' : isDone ? 'text-gray-600' : 'text-gray-400'}`}>{label}</span>
              </button>
              {n < STEPS.length && <div className={`flex-1 h-[2px] rounded-full transition-colors ${step > n ? 'bg-[#FF6B22]' : 'bg-gray-100'}`} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const sectionLabel = (icon: React.ElementType, text: string) => {
    const Icon = icon;
    return (
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-[#FF6B22]" />
        <span className="text-[13px] font-bold text-gray-950">{text}</span>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-app-canvas flex flex-col font-sans overflow-hidden">
      {header}

      {/* ====== STEP 1: BASICS ====== */}
      {step === 1 && (
        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-4 pb-[100px] max-w-[560px] w-full mx-auto flex flex-col gap-5">
          <div>
            <h2 className="text-[19px] font-black text-gray-950">Ride Basics</h2>
            <p className="text-[12px] text-gray-500 font-medium mt-0.5">Start with the essentials. You can add more details later.</p>
          </div>

          <div className="card-app p-3.5 flex flex-col divide-y divide-gray-100">
            <div className="pb-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Ride Title *</span>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.slice(0, 60) })}
                placeholder="e.g. Sunday Morning Cruise"
                className="w-full bg-transparent text-[16px] font-bold text-gray-950 placeholder-gray-400 placeholder:font-medium focus:outline-none"
              />
            </div>
            <div className="pt-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Short Description</span>
              <textarea
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value.slice(0, 200) })}
                placeholder="A refreshing morning ride with amazing views, coffee stop and great company."
                rows={3}
                className="w-full bg-transparent text-[13px] text-gray-800 placeholder-gray-400 font-medium focus:outline-none resize-none"
              />
            </div>
          </div>

          <div>
            {sectionLabel(Sparkles, 'Ride Type')}
            <div className="grid grid-cols-3 gap-2">
              {RIDE_TYPES.map(rt => (
                <button
                  key={rt.value}
                  onClick={() => setRideType(rt.value)}
                  className={`flex d-flex flex-row items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all ${
                    rideType === rt.value ? 'bg-[#FF6B22]/10 text-[#FF6B22] ring-2 ring-[#FF6B22]/40' : 'card-app text-gray-700'
                  }`}
                >
                  <rt.icon className="w-4 h-4 shrink-0" /> {rt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            {sectionLabel(Motorcycle, 'Vehicle Type')}
            <div className="flex flex-wrap gap-2">
              {vehicleTypes.map(vt => {
                const VtIcon = vehicleTypeIcon(vt.label);
                return (
                  <button
                    key={vt.value}
                    onClick={() => setFormData({ ...formData, vehicle_type: vt.value })}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[12px] font-bold cursor-pointer transition-all ${
                      formData.vehicle_type === vt.value ? 'bg-[#FF6B22]/10 text-[#FF6B22] ring-2 ring-[#FF6B22]/40' : 'card-app text-gray-700'
                    }`}
                  >
                    <VtIcon className="w-3.5 h-3.5 shrink-0" /> {vt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            {sectionLabel(Globe, 'Visibility')}
            <div className="card-app flex flex-col overflow-hidden divide-y divide-gray-100">
              <button
                onClick={() => setFormData({ ...formData, visibility: 'public' })}
                className="p-3.5 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 icon-badge bg-emerald-50 shrink-0"><Globe className="w-4 h-4 text-emerald-600" /></div>
                  <div className="text-left">
                    <p className="text-[13px] font-bold text-gray-950">Public Ride</p>
                    <p className="text-[11px] text-gray-500 font-medium">Visible to all riders on RideClub</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${formData.visibility === 'public' ? 'bg-[#FF6B22]' : 'bg-gray-200'}`}>
                  {formData.visibility === 'public' && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
              <button
                onClick={() => setFormData({ ...formData, visibility: 'private' })}
                className="p-3.5 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 icon-badge bg-gray-100 shrink-0"><Lock className="w-4 h-4 text-gray-600" /></div>
                  <div className="text-left">
                    <p className="text-[13px] font-bold text-gray-950">Private Ride</p>
                    <p className="text-[11px] text-gray-500 font-medium">Only invited riders can join</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${formData.visibility === 'private' ? 'bg-[#FF6B22]' : 'bg-gray-200'}`}>
                  {formData.visibility === 'private' && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={() => goToStep(2)}
            className="w-full py-4 btn-app-primary text-white font-bold text-[14px] rounded-full active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            Next: Plan Route <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ====== STEP 2: ROUTE (map-first layout) ====== */}
      {step === 2 && (
        <div className="flex-1 min-h-0 relative">
          {/* Full-bleed map is the primary surface */}
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

          <div className="absolute top-3 left-3 right-3 z-20 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={mapSearchText}
                onChange={e => { const r = e.target.getBoundingClientRect(); setSuggestAnchor({ top: r.top, bottom: r.bottom, left: r.left, width: r.width }); handleInputChange(e.target.value, 'map-search'); }}
                onFocus={e => { const r = e.target.getBoundingClientRect(); setSuggestAnchor({ top: r.top, bottom: r.bottom, left: r.left, width: r.width }); }}
                onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                placeholder="Search places to add a stop..."
                className="w-full h-10 card-app pl-8 pr-3 text-[13px] text-gray-950 placeholder-gray-400 font-medium outline-none focus:ring-2 focus:ring-[#FF6B22] transition-all"
              />
            </div>
            <div className="flex items-center card-app p-1 gap-1 shrink-0">
              <button
                onClick={() => setMapView('map')}
                className={`w-11 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${mapView === 'map' ? 'bg-gray-950 text-white' : 'text-gray-600'}`}
                title="Map view"
                aria-label="Map view"
              >
                <Map className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMapView('satellite')}
                className={`w-11 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${mapView === 'satellite' ? 'bg-gray-950 text-white' : 'text-gray-600'}`}
                title="Satellite view"
                aria-label="Satellite view"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
              <div className="w-8 h-8 border-4 border-[#FF6B22] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {selectingLocationFor && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-gray-950/90 backdrop-blur text-white text-[12px] font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5 text-[#FF6B22]" />
              Tap the map to set {selectingLocationFor === 'origin' ? 'start' : selectingLocationFor === 'dest' ? 'destination' : 'stop'}
              <button onClick={() => { setSelectingLocationFor(null); selectingLocationForRef.current = null; }} className="ml-1 text-white/60 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Floating route panel, docked above the app's bottom nav bar */}
          <div className="absolute bottom-[92px] left-0 right-0 z-20 px-3 max-w-[560px] w-full mx-auto">
            <div className="card-app-lg p-3 flex flex-col max-h-[54vh]">
              <div className="flex items-center justify-between gap-2 shrink-0">
                <div className="min-w-0">
                  <h2 className="text-[14px] font-black text-gray-950 truncate">Plan Your Route</h2>
                  <p className="text-[10.5px] text-gray-500 font-medium truncate">Set a start, destination and any stops.</p>
                </div>
                {routeStats && (
                  <div className="flex items-center gap-2.5 shrink-0 pl-2 border-l border-gray-100">
                    <div className="flex flex-col items-center leading-none">
                      <span className="text-[12px] font-black text-gray-950">{routeStats.distanceKm.toFixed(0)}km</span>
                      <span className="text-[8px] font-semibold text-gray-400 mt-0.5">Distance</span>
                    </div>
                    <div className="flex flex-col items-center leading-none">
                      <span className="text-[12px] font-black text-gray-950">{routeStats.durationMin < 60 ? `${Math.round(routeStats.durationMin)}m` : `${Math.floor(routeStats.durationMin / 60)}h ${Math.round(routeStats.durationMin % 60)}m`}</span>
                      <span className="text-[8px] font-semibold text-gray-400 mt-0.5">Duration</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar mt-3">
                <div className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center pt-[15px] shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#34C759] border-2 border-white ring-1 ring-gray-200" />
                    <div className="w-0.5 flex-1 min-h-[24px] border-l-2 border-dashed border-gray-200 my-1" />
                  </div>
                  <div className="relative flex-1 pb-1">
                    <input
                      type="text"
                      value={originText}
                      onChange={e => { const r = e.target.getBoundingClientRect(); setSuggestAnchor({ top: r.top, bottom: r.bottom, left: r.left, width: r.width }); handleInputChange(e.target.value, 'origin'); }}
                      onFocus={e => { const r = e.target.getBoundingClientRect(); setSuggestAnchor({ top: r.top, bottom: r.bottom, left: r.left, width: r.width }); if (originText.length >= 3) handleInputChange(originText, 'origin'); }}
                      onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                      placeholder="Start location..."
                      className={inputClass}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <button
                        onClick={() => {
                          if (globalLocation) {
                            setOriginCoords({ lat: globalLocation.lat, lng: globalLocation.lng });
                            setOriginText(globalLocationName || 'My Location');
                          }
                        }}
                        className="w-10 h-10 flex items-center justify-center text-[#FF6B22] hover:bg-[#FF6B22]/10 rounded-lg transition-colors active:scale-95 cursor-pointer"
                        title="Use Current Location"
                        aria-label="Use current location"
                      >
                        <Crosshair className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectingLocationFor('origin')}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg active:scale-95 transition-all cursor-pointer ${selectingLocationFor === 'origin' ? 'text-white bg-[#FF6B22]' : 'text-blue-500 hover:bg-blue-50'}`}
                        title="Pick on map"
                        aria-label="Pick start location on map"
                      >
                        <Map className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {stops.map((stop, index) => {
                  const info = getStopInfo(stop.type);
                  const StopIcon = info.icon;
                  return (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-2xl px-2.5 py-2 mb-2" style={{ border: '1px solid #dddddd' }}>
                    <div className="flex flex-col shrink-0 text-gray-300 cursor-grab" title="Reorder (use the arrows)">
                      <button onClick={() => { const n = [...stops]; const t = n[index - 1]; n[index - 1] = n[index]; n[index] = t; setStops(n); }} disabled={index === 0} className="w-6 h-6 flex items-center justify-center disabled:opacity-20 cursor-pointer" aria-label="Move stop up"><ArrowUpIcon className="w-3 h-3" /></button>
                      <button onClick={() => { const n = [...stops]; const t = n[index + 1]; n[index + 1] = n[index]; n[index] = t; setStops(n); }} disabled={index === stops.length - 1} className="w-6 h-6 flex items-center justify-center disabled:opacity-20 cursor-pointer" aria-label="Move stop down"><ArrowDownIcon className="w-3 h-3" /></button>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: info.color + '20' }}>
                      <StopIcon className="w-4 h-4" style={{ color: info.color }} strokeWidth={2.25} />
                    </div>
                    <button onClick={() => { setWaypointDraft({ type: stop.type || 'Other', text: stop.text, coords: stop.coords }); setShowWaypointModal(true); setOpenDropdownIdx(index); }} className="flex-1 min-w-0 text-left cursor-pointer">
                      <p className="text-[12px] font-bold text-gray-950 truncate">{stop.type && stop.type !== 'Other' ? stop.type : `Stop ${index + 1}`}</p>
                      <p className="text-[10.5px] text-gray-500 font-medium truncate">{stop.text || 'Tap to set location'}</p>
                    </button>
                    <button onClick={() => setStops(stops.filter((_, i) => i !== index))} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-colors cursor-pointer shrink-0" title="Remove stop" aria-label="Remove stop">
                      <span className="w-7 h-7 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </div>
                  );
                })}

                <div className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center pt-[15px] shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] border-2 border-white ring-1 ring-gray-200" />
                  </div>
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={destText}
                      onChange={e => { const r = e.target.getBoundingClientRect(); setSuggestAnchor({ top: r.top, bottom: r.bottom, left: r.left, width: r.width }); handleInputChange(e.target.value, 'dest'); }}
                      onFocus={e => { const r = e.target.getBoundingClientRect(); setSuggestAnchor({ top: r.top, bottom: r.bottom, left: r.left, width: r.width }); if (destText.length >= 3) handleInputChange(destText, 'dest'); }}
                      onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                      placeholder="Destination..."
                      className={`${inputClass} pl-8`}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <button onClick={() => setSelectingLocationFor('dest')} className={`w-10 h-10 flex items-center justify-center rounded-lg active:scale-95 transition-all cursor-pointer ${selectingLocationFor === 'dest' ? 'text-white bg-[#FF6B22]' : 'text-blue-500 hover:bg-blue-50'}`} title="Pick on map" aria-label="Pick destination on map">
                        <Map className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {stops.length < 5 && (
                  <button
                    onClick={() => { setWaypointDraft({ type: 'Other', text: '', coords: null }); setOpenDropdownIdx(null); setShowWaypointModal(true); }}
                    className="w-full mt-1 text-[12px] font-bold text-[#FF6B22] bg-[#FF6B22]/10 hover:bg-[#FF6B22]/15 transition-colors flex items-center justify-center gap-1.5 py-2.5 rounded-2xl cursor-pointer"
                  >
                    + Add Waypoint
                  </button>
                )}
              </div>

              <div className="flex gap-2.5 shrink-0 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => goToStep(1)} className="px-5 py-3 card-app text-gray-700 font-bold text-[13px] rounded-full cursor-pointer flex items-center gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => goToStep(3)} className="flex-1 py-3 btn-app-primary text-white font-bold text-[13px] rounded-full cursor-pointer flex items-center justify-center gap-1.5">
                  Next: Add Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions render fixed to the viewport (anchored to the focused input's
              on-screen position) so they're never clipped by the scrollable route panel. */}
          {(activeInput === 'origin' || activeInput === 'dest' || activeInput === 'map-search') && suggestions.length > 0 && suggestAnchor && (() => {
            const spaceBelow = window.innerHeight - suggestAnchor.bottom;
            const openUp = spaceBelow < 180 && suggestAnchor.top > spaceBelow;
            return (
              <div
                className="fixed card-app z-[200] max-h-48 overflow-y-auto hide-scrollbar shadow-lg"
                style={{
                  left: suggestAnchor.left,
                  width: suggestAnchor.width,
                  ...(openUp ? { bottom: window.innerHeight - suggestAnchor.top + 4 } : { top: suggestAnchor.bottom + 4 })
                }}
              >
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="p-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer text-[12px] font-medium text-gray-950 truncate"
                    onMouseDown={() => handleSelectSuggestion(s, activeInput)}
                  >
                    {s.display_name}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ====== ADD/EDIT WAYPOINT MODAL ====== */}
      {showWaypointModal && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-950/40" onClick={() => setShowWaypointModal(false)} />
          <div className="relative w-full max-w-[480px] card-app m-3 mb-[92px] p-4 max-h-[80vh] overflow-y-auto hide-scrollbar animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-gray-950">{openDropdownIdx !== null ? 'Edit Waypoint' : 'Add Waypoint'}</h3>
              <button onClick={() => setShowWaypointModal(false)} className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Stop Type</span>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {['Food', 'Fuel', 'Hospital', 'Mechanic', 'Tea', 'Stay', 'Sightseeing', 'Other'].map(t => {
                const info = getStopInfo(t);
                const StopIcon = info.icon;
                const isSelected = waypointDraft.type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setWaypointDraft(prev => ({ ...prev, type: t }))}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl cursor-pointer transition-all border ${isSelected ? 'shadow-sm' : 'bg-gray-50 hover:bg-gray-100'}`}
                    style={isSelected ? { backgroundColor: info.color + '12', borderColor: info.color, boxShadow: `inset 0 0 0 1.5px ${info.color}` } : { borderColor: '#ddd' }}
                  >
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: info.color + (isSelected ? '30' : '18') }}
                    >
                      <StopIcon className="w-[18px] h-[18px]" style={{ color: info.color }} strokeWidth={2.25} />
                    </span>
                    <span className={`text-[9.5px] font-bold ${isSelected ? 'text-gray-950' : 'text-gray-600'}`}>{t}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Location</span>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={waypointDraft.text}
                onChange={e => handleInputChange(e.target.value, WAYPOINT_DRAFT_KEY)}
                onFocus={() => { if (waypointDraft.text.length >= 3) handleInputChange(waypointDraft.text, WAYPOINT_DRAFT_KEY); }}
                placeholder="Search a place..."
                className={`${inputClass} pl-8`}
              />
              {activeInput === WAYPOINT_DRAFT_KEY && suggestions.length > 0 && (
                <div className="mt-1 card-app overflow-hidden max-h-40 overflow-y-auto hide-scrollbar">
                  {suggestions.map((s, i) => (
                    <div key={i} className="p-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer text-[12px] font-medium text-gray-950 truncate" onMouseDown={() => handleSelectSuggestion(s, WAYPOINT_DRAFT_KEY)}>
                      {s.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { setShowWaypointModal(false); setSelectingLocationFor(WAYPOINT_DRAFT_KEY); }}
              className="w-full py-2.5 card-app text-gray-700 font-bold text-[12px] rounded-2xl cursor-pointer flex items-center justify-center gap-1.5 mb-4"
            >
              <Map className="w-4 h-4 text-blue-500" /> Or pick location on map
            </button>

            <div className="flex gap-2.5">
              {openDropdownIdx !== null && (
                <button
                  onClick={() => { setStops(stops.filter((_, i) => i !== openDropdownIdx)); setShowWaypointModal(false); }}
                  className="px-4 py-3 bg-red-50 text-red-600 font-bold text-[13px] rounded-full cursor-pointer"
                >
                  Remove
                </button>
              )}
              <button
                onClick={() => {
                  if (!waypointDraft.text.trim()) { showToast('Please set a location for this waypoint', 'error'); return; }
                  if (openDropdownIdx !== null) {
                    setStops(prev => prev.map((s, i) => i === openDropdownIdx ? { ...waypointDraft } : s));
                  } else {
                    setStops(prev => [...prev, { ...waypointDraft }]);
                  }
                  setShowWaypointModal(false);
                }}
                className="flex-1 py-3 btn-app-primary text-white font-bold text-[13px] rounded-full cursor-pointer"
              >
                {openDropdownIdx !== null ? 'Save Changes' : 'Add Waypoint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== STEP 3: DETAILS ====== */}
      {step === 3 && (
        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-4 pb-[100px] max-w-[560px] w-full mx-auto flex flex-col gap-5">
          <div>
            <h2 className="text-[19px] font-black text-gray-950">Ride Details</h2>
            <p className="text-[12px] text-gray-500 font-medium mt-0.5">Add schedule, meeting point and additional information.</p>
          </div>

          <div className="flex flex-col gap-2.5">
            {sectionLabel(Calendar, 'Schedule')}
            <div className="card-app p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 icon-badge ${isInstant ? 'bg-[#FFE7D1]' : 'bg-blue-50'} shrink-0`}>
                  {isInstant ? <Zap className="w-5 h-5 text-[#FF6B22]" fill="currentColor" /> : <Calendar className="w-5 h-5 text-blue-500" />}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-gray-950">{isInstant ? 'Ride Now' : 'Schedule Later'}</p>
                  <p className="text-[11px] text-gray-500 font-medium">{isInstant ? 'Start immediately' : 'Pick a date and time'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (restrictInstant && !isEditMode) {
                    showToast('You already have an active ride. Leave or end it to create an instant ride.', 'error');
                    return;
                  }
                  setIsInstant(!isInstant);
                }}
                className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors relative shrink-0 ${isInstant ? 'bg-[#FF6B22]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isInstant ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {!isInstant && (
              <div className="grid grid-cols-2 gap-3">
                <div className="card-app p-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date *</span>
                  <input type="date" value={formData.ride_date} onChange={(e) => setFormData({ ...formData, ride_date: e.target.value })} className="w-full bg-transparent text-[13px] font-bold text-gray-950 outline-none" />
                </div>
                <div className="card-app p-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Start Time *</span>
                  <input type="time" value={formData.ride_time} onChange={(e) => setFormData({ ...formData, ride_time: e.target.value })} className="w-full bg-transparent text-[13px] font-bold text-gray-950 outline-none" />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {sectionLabel(Users, 'Capacity & Meeting Point')}
            <div className="card-app p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-gray-950 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" /> Max Riders</span>
                <span className="bg-gray-950 text-white px-2.5 py-0.5 rounded-full text-[12px] font-bold tabular-nums">{formData.max_riders}</span>
              </div>
              <input type="range" min={2} max={50} value={formData.max_riders} onChange={(e) => setFormData({ ...formData, max_riders: parseInt(e.target.value) })} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B22]" />
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-1"><span>2 riders</span><span>50 riders</span></div>
            </div>

            {/* Meeting point — reuses the real start location from Route step */}
            <div className="card-app p-3.5 flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#E4F1F0] flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-[#1A9A5C]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Meeting Point</span>
                <p className="text-[13px] font-bold text-gray-950 truncate">{originText || 'Not set'}</p>
                <button onClick={() => goToStep(2)} className="text-[11px] font-bold text-[#FF6B22] cursor-pointer mt-0.5">Change on Route step</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {sectionLabel(Camera, 'Cover Photo')}
            <div className="flex gap-2.5">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                <img src={coverPreview} alt="" className="w-full h-full object-cover" />
              </div>
              <button onClick={() => coverInputRef.current?.click()} className="w-20 h-20 rounded-2xl card-app flex flex-col items-center justify-center gap-1 text-gray-500 cursor-pointer shrink-0">
                <Camera className="w-5 h-5" />
                <span className="text-[9px] font-bold">Change</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {sectionLabel(Sparkles, 'Additional Notes')}
            <div className="card-app p-3.5">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 300) })}
              placeholder="e.g. Don't forget to carry water, helmet and a full tank!"
              rows={3}
              className="w-full bg-transparent text-[13px] text-gray-800 font-medium placeholder-gray-400 focus:outline-none resize-none"
            />
            <div className="text-right"><span className="text-[10px] text-gray-400 font-medium">{formData.description.length}/300</span></div>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button onClick={() => goToStep(2)} className="px-5 py-3.5 card-app text-gray-700 font-bold text-[13px] rounded-full cursor-pointer flex items-center gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => goToStep(4)} className="flex-1 py-3.5 btn-app-primary text-white font-bold text-[13px] rounded-full cursor-pointer flex items-center justify-center gap-1.5">
              Next: Review Ride <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ====== STEP 4: REVIEW ====== */}
      {step === 4 && (
        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-4 pb-[100px] max-w-[560px] w-full mx-auto flex flex-col gap-4">
          <div>
            <h2 className="text-[19px] font-black text-gray-950">Review Your Ride</h2>
            <p className="text-[12px] text-gray-500 font-medium mt-0.5">Double-check everything before you {isEditMode ? 'save' : 'publish'}.</p>
          </div>

          <div className="relative h-[140px] rounded-[20px] overflow-hidden shrink-0">
            <img src={coverPreview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3.5">
              <span className="text-[9px] font-bold bg-[#FF6B22] text-white px-2 py-0.5 rounded-full uppercase">{rideType}</span>
              <h3 className="text-white text-[16px] font-black mt-1">{formData.name || 'Untitled Ride'}</h3>
            </div>
          </div>

          <div className="card-app divide-y divide-gray-100 overflow-hidden">
            {[
              { icon: isInstant ? Zap : Calendar, label: isInstant ? 'Starts' : 'Date & Time', value: isInstant ? 'Immediately' : `${formData.ride_date} at ${formData.ride_time}` },
              { icon: MapPin, label: 'Meeting Point', value: originText || '—' },
              { icon: Flag, label: 'Destination', value: destText || '—' },
              { icon: RouteIcon, label: 'Waypoints', value: `${stops.length} stop${stops.length === 1 ? '' : 's'}` },
              ...(routeStats ? [{ icon: RouteIcon, label: 'Distance / Time', value: `${routeStats.distanceKm.toFixed(0)} km · ~${Math.round(routeStats.durationMin)} min` }] : []),
              { icon: Motorcycle, label: 'Vehicle Type', value: vehicleTypes.find(v => v.value === formData.vehicle_type)?.label || 'All' },
              { icon: Users, label: 'Max Riders', value: `${formData.max_riders}` },
              { icon: formData.visibility === 'public' ? Globe : Lock, label: 'Visibility', value: formData.visibility === 'public' ? 'Public' : 'Private' },
            ].map(row => (
              <div key={row.label} className="p-3.5 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-gray-500 flex items-center gap-2"><row.icon className="w-4 h-4 text-gray-400" /> {row.label}</span>
                <span className="text-[13px] font-bold text-gray-950 text-right max-w-[55%] truncate">{row.value}</span>
              </div>
            ))}
          </div>

          {formData.description && (
            <div className="card-app p-3.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Notes</span>
              <p className="text-[13px] text-gray-800 font-medium">{formData.description}</p>
            </div>
          )}

          <div className="flex gap-2.5">
            <button onClick={() => goToStep(3)} className="px-5 py-3.5 card-app text-gray-700 font-bold text-[13px] rounded-full cursor-pointer flex items-center gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleFinalCreate}
              disabled={loading}
              className="flex-1 py-3.5 btn-app-primary text-white font-bold text-[13px] rounded-full cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isEditMode ? 'Save Changes' : 'Publish Ride'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateRide;
