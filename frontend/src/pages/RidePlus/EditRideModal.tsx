import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, MapPin, Map, Users, ChevronDown, ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon, Search, Save, Sparkles, Crosshair,
  Globe, Clock, Edit2, Loader2, History, ChevronLeft
} from 'lucide-react';
import { Bike as Motorcycle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/firebase';
import { useToast } from '../../components/ToastContext';
import { fetchTomTomRoute } from '../../lib/routing';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface EditRideModalProps {
  rideId: string;
  onClose: () => void;
  onSaved?: () => void;
}

interface StopData {
  text: string;
  coords: { lat: number; lng: number } | null;
  type?: string;
}

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

const EditRideModal: React.FC<EditRideModalProps> = ({ rideId, onClose, onSaved }) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'info' | 'route' | 'log'>('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Ride Info State ---
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public',
    max_riders: 20,
    vehicle_type: 'Any',
  });

  // --- Route/Stops State ---
  const [originText, setOriginText] = useState('');
  const [destText, setDestText] = useState('');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [stops, setStops] = useState<StopData[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<'vehicle' | 'visibility' | null>(null);

  // --- Map State ---
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectingLocationFor, setSelectingLocationFor] = useState<string | null>(null);
  const selectingLocationForRef = useRef<string | null>(null);

  // --- Edit Log State ---
  const [editLog, setEditLog] = useState<any[]>([]);

  // --- Original data for diffing ---
  const [originalRide, setOriginalRide] = useState<any>(null);
  const [originalStops, setOriginalStops] = useState<any[]>([]);

  // --- Config ---
  const [vehicleTypes] = useState([
    { value: 'Any', label: 'Any Vehicle' },
    { value: 'Motorcycle', label: 'Motorcycle Only' },
    { value: 'Car', label: 'Car Only' },
    { value: 'Offroad', label: 'Offroad/4x4' },
  ]);

  useEffect(() => {
    selectingLocationForRef.current = selectingLocationFor;
  }, [selectingLocationFor]);

  // --- Load existing ride data ---
  useEffect(() => {
    const loadRide = async () => {
      setLoading(true);
      try {
        const { data: ride, error: rideErr } = await supabase
          .from('rides')
          .select('*')
          .eq('id', rideId)
          .single();
        if (rideErr || !ride) {
          showToast('Failed to load ride', 'error');
          onClose();
          return;
        }

        setOriginalRide(ride);
        setFormData({
          name: ride.name || '',
          description: ride.description || '',
          visibility: ride.visibility || 'public',
          max_riders: ride.max_riders || 20,
          vehicle_type: ride.vehicle_type || 'Any',
        });

        if (ride.start_location) {
          setOriginCoords({ lat: ride.start_location.lat, lng: ride.start_location.lng });
          setOriginText(ride.start_location.name || 'Start');
        }
        if (ride.destination) {
          setDestCoords({ lat: ride.destination.lat, lng: ride.destination.lng });
          setDestText(ride.destination.name || 'Destination');
        }

        // Load stops
        const { data: stopsData } = await supabase
          .from('ride_stops')
          .select('*')
          .eq('ride_id', rideId)
          .order('sequence');

        if (stopsData && stopsData.length > 0) {
          setOriginalStops(stopsData);
          // Filter out start/destination, keep only intermediate stops
          const intermediateStops = stopsData.filter(
            (s: any) => s.stop_type !== 'Start' && s.stop_type !== 'Destination'
          );
          setStops(
            intermediateStops.map((s: any) => ({
              text: s.stop_name || '',
              coords: { lat: s.latitude, lng: s.longitude },
              type: s.stop_type || 'Other',
            }))
          );
        }

        // Load edit log
        const { data: logData } = await supabase
          .from('ride_edit_log')
          .select('*')
          .eq('ride_id', rideId)
          .order('created_at', { ascending: false })
          .limit(20);
        if (logData) setEditLog(logData);
      } catch (e) {
        showToast('Error loading ride data', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadRide();
  }, [rideId]);

  // --- Map initialization (only for route tab) ---
  useEffect(() => {
    if (activeTab !== 'route') return;
    if (map.current) return;
    if (!mapContainer.current) return;

    const center: [number, number] = originCoords
      ? [originCoords.lng, originCoords.lat]
      : [78.4867, 17.385];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center,
      zoom: 12,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      map.current.addSource('route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ef4523', 'line-width': 6, 'line-opacity': 0.8 },
      });

      setMapLoaded(true);

      map.current!.on('click', async (e) => {
        const target = selectingLocationForRef.current;
        if (!target) return;

        const lat = e.lngLat.lat;
        const lng = e.lngLat.lng;

        if (target === 'origin') setOriginCoords({ lat, lng });
        else if (target === 'dest') setDestCoords({ lat, lng });
        else if (target.startsWith('stop-')) {
          const index = parseInt(target.split('-')[1]);
          setStops((prev) => {
            const next = [...prev];
            if (next[index]) next[index].coords = { lat, lng };
            return next;
          });
        }

        setSelectingLocationFor(null);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          const text = data.display_name?.split(',').slice(0, 2).join(',') || 'Selected on map';
          if (target === 'origin') setOriginText(text);
          else if (target === 'dest') setDestText(text);
          else if (target.startsWith('stop-')) {
            const index = parseInt(target.split('-')[1]);
            setStops((prev) => {
              const next = [...prev];
              if (next[index]) next[index].text = text;
              return next;
            });
          }
        } catch {
          const fallback = 'Selected on map';
          if (target === 'origin') setOriginText(fallback);
          else if (target === 'dest') setDestText(fallback);
          else if (target.startsWith('stop-')) {
            const index = parseInt(target.split('-')[1]);
            setStops((prev) => {
              const next = [...prev];
              if (next[index]) next[index].text = fallback;
              return next;
            });
          }
        }
      });
    });

    return () => {
      // Don't aggressively clean up to prevent flashing
    };
  }, [activeTab]);

  // --- Fetch and draw route on map ---
  const fetchRoute = useCallback(async () => {
    if (!map.current || !mapLoaded || !originCoords || !destCoords) return;
    try {
      const coordinates = [
        [originCoords.lng, originCoords.lat],
        ...stops.filter((s) => s.coords).map((s) => [s.coords!.lng, s.coords!.lat]),
        [destCoords.lng, destCoords.lat],
      ];
      const routeFeature = await fetchTomTomRoute(coordinates, 'driving-car');

      if (routeFeature) {
        const source = map.current?.getSource('route');
        if (source) {
          (source as maplibregl.GeoJSONSource).setData(routeFeature);
        }

        // Clear old markers
        document.querySelectorAll('.edit-route-marker').forEach((el) => el.remove());

        // Start marker
        const startEl = document.createElement('div');
        startEl.className = 'edit-route-marker';
        startEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;">
          <div style="background:#34C759;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
          <span style="font-size:10px;font-weight:700;color:#34C759;margin-top:2px;text-shadow:0 1px 2px rgba(0,0,0,0.2);white-space:nowrap;">Start</span>
        </div>`;
        new maplibregl.Marker({ element: startEl })
          .setLngLat([originCoords.lng, originCoords.lat])
          .addTo(map.current!);

        // End marker
        const endEl = document.createElement('div');
        endEl.className = 'edit-route-marker';
        endEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;">
          <div style="background:#FF3B30;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
          <span style="font-size:10px;font-weight:700;color:#FF3B30;margin-top:2px;text-shadow:0 1px 2px rgba(0,0,0,0.2);white-space:nowrap;">End</span>
        </div>`;
        new maplibregl.Marker({ element: endEl })
          .setLngLat([destCoords.lng, destCoords.lat])
          .addTo(map.current!);

        // Stop markers
        stops
          .filter((s) => s.coords)
          .forEach((stop, idx) => {
            const info = getStopInfo(stop.type);
            const label = stop.type && stop.type !== 'Other' ? stop.type : `Stop ${idx + 1}`;
            const el = document.createElement('div');
            el.className = 'edit-route-marker';
            el.innerHTML = `<div style="display:flex;align-items:center;background:white;padding:3px 7px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.2);border:2px solid ${info.color};font-weight:700;font-size:11px;color:#1e293b;white-space:nowrap;gap:4px;">
              <span style="font-size:13px;">${info.emoji}</span> <span>${label}</span>
            </div>`;
            new maplibregl.Marker({ element: el })
              .setLngLat([stop.coords!.lng, stop.coords!.lat])
              .addTo(map.current!);
          });

        const bbox = routeFeature.bbox;
        if (bbox) {
          map.current?.fitBounds(
            [
              [bbox[0], bbox[1]],
              [bbox[2], bbox[3]],
            ],
            { padding: 50 }
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch route:', error);
    }
  }, [originCoords, destCoords, stops, mapLoaded]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // --- Geocoding helpers ---
  const handleInputChange = async (text: string, target: string) => {
    if (target === 'origin') setOriginText(text);
    else if (target === 'dest') setDestText(text);
    else if (target.startsWith('stop-')) {
      const index = parseInt(target.split('-')[1]);
      setStops((prev) => {
        const next = [...prev];
        if (next[index]) next[index].text = text;
        return next;
      });
    }

    if (text.length < 3) {
      setSuggestions([]);
      setActiveInput(null);
      return;
    }

    setActiveInput(target);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      setSuggestions(data || []);
    } catch {
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
      setStops((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index].coords = coords;
          next[index].text = text;
        }
        return next;
      });
    }
    setSuggestions([]);
    setActiveInput(null);
  };

  // --- Build change diff ---
  const buildChangeDiff = () => {
    const changes: any = {};

    if (originalRide) {
      if (formData.name !== (originalRide.name || '')) changes.name = { from: originalRide.name, to: formData.name };
      if (formData.description !== (originalRide.description || '')) changes.description = { from: originalRide.description, to: formData.description };
      if (formData.visibility !== (originalRide.visibility || 'public')) changes.visibility = { from: originalRide.visibility, to: formData.visibility };
      if (formData.max_riders !== (originalRide.max_riders || 20)) changes.max_riders = { from: originalRide.max_riders, to: formData.max_riders };
      if (formData.vehicle_type !== (originalRide.vehicle_type || 'Any')) changes.vehicle_type = { from: originalRide.vehicle_type, to: formData.vehicle_type };
    }

    // Check if stops changed
    const origIntermediateStops = originalStops.filter(
      (s: any) => s.stop_type !== 'Start' && s.stop_type !== 'Destination'
    );
    if (
      stops.length !== origIntermediateStops.length ||
      JSON.stringify(stops.map((s) => ({ text: s.text, lat: s.coords?.lat, lng: s.coords?.lng, type: s.type }))) !==
        JSON.stringify(origIntermediateStops.map((s: any) => ({ text: s.stop_name, lat: s.latitude, lng: s.longitude, type: s.stop_type })))
    ) {
      changes.stops = {
        from: origIntermediateStops.map((s: any) => s.stop_name).join(' → '),
        to: stops.map((s) => s.text || 'Unnamed').join(' → '),
        count_from: origIntermediateStops.length,
        count_to: stops.length,
      };
    }

    // Check if origin/dest changed
    if (originalRide?.start_location) {
      const ol = originalRide.start_location;
      if (originCoords && (ol.lat !== originCoords.lat || ol.lng !== originCoords.lng)) {
        changes.start_location = { from: ol.name || 'Original', to: originText };
      }
    }
    if (originalRide?.destination) {
      const dl = originalRide.destination;
      if (destCoords && (dl.lat !== destCoords.lat || dl.lng !== destCoords.lng)) {
        changes.destination = { from: dl.name || 'Original', to: destText };
      }
    }

    return changes;
  };

  // --- Save handler ---
  const handleSave = async () => {
    if (!originCoords || !destCoords) {
      showToast('Start and destination are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        showToast('Not authenticated', 'error');
        return;
      }

      const changes = buildChangeDiff();
      const hasChanges = Object.keys(changes).length > 0;

      if (!hasChanges) {
        showToast('No changes detected', 'info');
        setSaving(false);
        return;
      }

      // Determine edit type
      const editTypes: string[] = [];
      if (changes.name || changes.description || changes.visibility || changes.max_riders || changes.vehicle_type) {
        editTypes.push('metadata_updated');
      }
      if (changes.stops || changes.start_location || changes.destination) {
        editTypes.push('stops_modified');
      }

      // 1. Recalculate route if stops/locations changed
      let routeGeometry: any = null;
      if (changes.stops || changes.start_location || changes.destination) {
        try {
          const coordinates = [
            [originCoords.lng, originCoords.lat],
            ...stops.filter((s) => s.coords).map((s) => [s.coords!.lng, s.coords!.lat]),
            [destCoords.lng, destCoords.lat],
          ];
          routeGeometry = await fetchTomTomRoute(coordinates, 'driving-car');
          editTypes.push('route_recalculated');
        } catch (e) {
          console.error('Route recalc failed:', e);
          showToast('Route recalculation failed, saving other changes', 'error');
        }
      }

      // 2. Update rides table
      const rideUpdate: any = {
        name: formData.name,
        description: formData.description,
        visibility: formData.visibility,
        max_riders: formData.max_riders,
        vehicle_type: formData.vehicle_type,
        start_location: { lat: originCoords.lat, lng: originCoords.lng, name: originText },
        destination: { lat: destCoords.lat, lng: destCoords.lng, name: destText },
        version: (originalRide?.version || 0) + 1,
      };
      if (routeGeometry) {
        rideUpdate.route_geometry = routeGeometry;
      }

      const { error: updateErr } = await supabase
        .from('rides')
        .update(rideUpdate)
        .eq('id', rideId);
      if (updateErr) throw updateErr;

      // 3. Replace ride_stops (delete old + insert new)
      if (changes.stops || changes.start_location || changes.destination) {
        await supabase.from('ride_stops').delete().eq('ride_id', rideId);

        const allStops = [
          { name: originText, lat: originCoords.lat, lng: originCoords.lng, type: 'Start' },
          ...stops
            .filter((s) => s.coords)
            .map((s) => ({
              name: s.text,
              lat: s.coords!.lat,
              lng: s.coords!.lng,
              type: s.type || 'Waypoint',
            })),
          { name: destText, lat: destCoords.lat, lng: destCoords.lng, type: 'Destination' },
        ];

        const stopInserts = allStops.map((stop, idx) => ({
          ride_id: rideId,
          stop_name: stop.name,
          latitude: stop.lat,
          longitude: stop.lng,
          sequence: idx,
          stop_type: stop.type,
        }));

        const { error: stopErr } = await supabase.from('ride_stops').insert(stopInserts);
        if (stopErr) throw stopErr;
      }

      // 4. Insert edit log
      await supabase.from('ride_edit_log').insert({
        ride_id: rideId,
        editor_id: user.uid,
        editor_name: user.displayName || user.email?.split('@')[0] || 'Admin',
        edit_type: editTypes.join(', '),
        changes,
      });

      // 5. Insert ride event for realtime notification
      await supabase.from('ride_events').insert({
        ride_id: rideId,
        user_id: user.uid,
        event_type: 'RIDE_UPDATED',
        description: `Ride updated: ${editTypes.join(', ')}`,
        payload: {
          editor_name: user.displayName || user.email?.split('@')[0] || 'Admin',
          edit_types: editTypes,
          changes_summary: Object.keys(changes).join(', '),
        },
      });

      showToast('Ride updated successfully! All riders will be notified.', 'success');
      onSaved?.();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] bg-dark/60 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[#273a5a] font-bold">Loading ride data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-dark/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg max-h-[95vh] rounded-t-3xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#273a5a] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#ef4523]" /> Edit Ride
              </h2>
              <p className="text-xs text-gray-400 font-medium">Changes sync to all riders in real time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-50 p-1 mx-5 mt-3 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'info'
                ? 'bg-white text-[#273a5a] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Ride Info
          </button>
          <button
            onClick={() => setActiveTab('route')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'route'
                ? 'bg-white text-[#273a5a] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Route & Stops
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'log'
                ? 'bg-white text-[#273a5a] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4 inline mr-1" />
            Log
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 hide-scrollbar">
          {/* ═══ RIDE INFO TAB ═══ */}
          {activeTab === 'info' && (
            <div className="flex flex-col gap-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ride Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] font-medium text-[#273a5a] outline-none focus:border-[#ef4523] focus:bg-white transition-all"
                  placeholder="e.g. Sunday Morning Cruise"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description / Notes</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  maxLength={500}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-medium text-[#273a5a] outline-none focus:border-[#ef4523] focus:bg-white transition-all resize-none"
                  placeholder="Ride details, meeting point instructions, etc."
                />
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              {/* 2-column grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Max Riders */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#273a5a]" />
                    <span className="text-[#273a5a] font-bold text-[13px]">
                      {formData.max_riders} Riders
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={50}
                    value={formData.max_riders}
                    onChange={(e) =>
                      setFormData({ ...formData, max_riders: parseInt(e.target.value) })
                    }
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ef4523]"
                  />
                </div>

                {/* Vehicle Type */}
                <div
                  className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-1 relative cursor-pointer"
                  onClick={() =>
                    setOpenDropdown(openDropdown === 'vehicle' ? null : 'vehicle')
                  }
                >
                  <div className="flex items-center gap-2">
                    <Motorcycle className="w-4 h-4 text-[#273a5a]" />
                    <span className="text-[#273a5a] font-bold text-[13px] flex-1 truncate">
                      {vehicleTypes.find((v) => v.value === formData.vehicle_type)?.label || 'Any'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 text-gray-400 absolute right-3 top-4 transition-transform ${
                      openDropdown === 'vehicle' ? 'rotate-180' : ''
                    }`}
                  />
                  {openDropdown === 'vehicle' && (
                    <div className="absolute bottom-[calc(100%+4px)] left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      {vehicleTypes.map((vt) => (
                        <div
                          key={vt.value}
                          className={`px-4 py-2.5 text-[12px] font-medium hover:bg-gray-50 transition-colors ${
                            formData.vehicle_type === vt.value
                              ? 'bg-orange-50 text-[#ef4523]'
                              : 'text-[#273a5a]'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, vehicle_type: vt.value });
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
                  className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-1 relative cursor-pointer col-span-2"
                  onClick={() =>
                    setOpenDropdown(openDropdown === 'visibility' ? null : 'visibility')
                  }
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span className="text-[#273a5a] font-bold text-[13px]">
                      {formData.visibility === 'public' ? 'Public' : 'Private'}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium ml-auto mr-4">
                      Who can see this ride?
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 text-gray-400 absolute right-3 top-4 transition-transform ${
                      openDropdown === 'visibility' ? 'rotate-180' : ''
                    }`}
                  />
                  {openDropdown === 'visibility' && (
                    <div className="absolute bottom-[calc(100%+4px)] left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      {['public', 'private'].map((v) => (
                        <div
                          key={v}
                          className={`px-4 py-2.5 text-[12px] font-medium hover:bg-gray-50 transition-colors capitalize ${
                            formData.visibility === v
                              ? 'bg-orange-50 text-[#ef4523]'
                              : 'text-[#273a5a]'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, visibility: v });
                            setOpenDropdown(null);
                          }}
                        >
                          {v}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ ROUTE & STOPS TAB ═══ */}
          {activeTab === 'route' && (
            <div className="flex flex-col gap-4">
              {/* Stop List */}
              <div className="flex flex-col gap-2">
                {/* Origin */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-[10px] h-[10px] rounded-full border-2 border-[#34C759] shrink-0" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Start</span>
                  </div>
                  <input
                    type="text"
                    value={originText}
                    onChange={(e) => handleInputChange(e.target.value, 'origin')}
                    onFocus={() => {
                      if (originText.length >= 3) handleInputChange(originText, 'origin');
                    }}
                    onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                    placeholder="Start location..."
                    className="w-full h-[40px] bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-[70px] text-[13px] text-[#273a5a] font-medium outline-none focus:border-[#ef4523] focus:bg-white transition-all"
                  />
                  {activeInput === 'origin' && suggestions.length > 0 && (
                    <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-[100] max-h-36 overflow-y-auto">
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          className="p-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer text-[12px] font-medium text-[#273a5a] truncate"
                          onMouseDown={() => handleSelectSuggestion(s, 'origin')}
                        >
                          {s.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="absolute right-1 top-[28px] flex items-center gap-0.5">
                    <button
                      onClick={() => setSelectingLocationFor('origin')}
                      className={`w-[26px] h-[26px] rounded flex items-center justify-center ${
                        selectingLocationFor === 'origin'
                          ? 'text-white bg-[#ef4523]'
                          : 'text-blue-500 hover:bg-blue-50'
                      } active:scale-95 transition-all`}
                    >
                      <Map className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Intermediate Stops */}
                {stops.map((stop, index) => (
                  <div key={index} className="flex gap-2 w-full items-start">
                    <div className="flex flex-col items-center pt-7 shrink-0">
                      <div className="w-[8px] h-[8px] rounded-full border-2 border-purple-400 bg-white" />
                    </div>
                    <div className="flex-1 relative">
                      <div className="flex items-center gap-1 mb-1">
                        <button
                          onClick={() =>
                            setOpenDropdownIdx(openDropdownIdx === index ? null : index)
                          }
                          className="h-[24px] flex items-center gap-1 text-[11px] text-[#273a5a] font-medium hover:bg-gray-100 rounded px-1.5 transition-colors relative"
                        >
                          {getStopInfo(stop.type).emoji}{' '}
                          <span className="truncate">
                            {!stop.type || stop.type === 'Other' ? 'Pin' : stop.type}
                          </span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </button>

                        {openDropdownIdx === index && (
                          <div className="absolute top-[24px] left-0 bg-white border border-gray-100 rounded-lg shadow-lg z-[110] w-[130px] py-1 max-h-[180px] overflow-y-auto hide-scrollbar">
                            {['Pin', 'Food', 'Hospital', 'Mechanic', 'Tea', 'Fuel', 'Stay', 'Sightseeing'].map(
                              (t) => (
                                <div
                                  key={t}
                                  onClick={() => {
                                    const next = [...stops];
                                    next[index].type = t === 'Pin' ? 'Other' : t;
                                    setStops(next);
                                    setOpenDropdownIdx(null);
                                  }}
                                  className="px-3 py-1.5 text-[12px] font-medium text-[#273a5a] hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                                >
                                  {getStopInfo(t === 'Pin' ? 'Other' : t).emoji} {t}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      <input
                        type="text"
                        value={stop.text}
                        onChange={(e) => handleInputChange(e.target.value, `stop-${index}`)}
                        onFocus={() => {
                          if (stop.text.length >= 3) handleInputChange(stop.text, `stop-${index}`);
                        }}
                        onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                        placeholder={`Stop ${index + 1}...`}
                        className="w-full h-[38px] bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-[36px] text-[13px] text-[#273a5a] font-medium outline-none focus:border-[#ef4523] focus:bg-white transition-all"
                      />

                      {activeInput === `stop-${index}` && suggestions.length > 0 && (
                        <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-[100] max-h-36 overflow-y-auto">
                          {suggestions.map((s, i) => (
                            <div
                              key={i}
                              className="p-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer text-[12px] font-medium text-[#273a5a] truncate"
                              onMouseDown={() => handleSelectSuggestion(s, `stop-${index}`)}
                            >
                              {s.display_name}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="absolute right-1 top-[28px] flex items-center gap-0.5">
                        <button
                          onClick={() => setSelectingLocationFor(`stop-${index}`)}
                          className={`w-[24px] h-[24px] rounded flex items-center justify-center ${
                            selectingLocationFor === `stop-${index}`
                              ? 'text-white bg-[#ef4523]'
                              : 'text-blue-500 hover:bg-blue-50'
                          } active:scale-95 transition-all`}
                        >
                          <Map className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Reorder + Delete */}
                    <div className="flex items-center gap-0.5 pt-6 shrink-0">
                      <div className="flex flex-col">
                        <button
                          onClick={() => {
                            const next = [...stops];
                            const temp = next[index - 1];
                            next[index - 1] = next[index];
                            next[index] = temp;
                            setStops(next);
                          }}
                          disabled={index === 0}
                          className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 transition-colors"
                        >
                          <ArrowUpIcon className="w-3 h-3 text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            const next = [...stops];
                            const temp = next[index + 1];
                            next[index + 1] = next[index];
                            next[index] = temp;
                            setStops(next);
                          }}
                          disabled={index === stops.length - 1}
                          className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 transition-colors"
                        >
                          <ArrowDownIcon className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                      <button
                        onClick={() => setStops(stops.filter((_, i) => i !== index))}
                        className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg active:scale-95 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Stop */}
                {stops.length < 5 && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setStops([...stops, { text: '', coords: null, type: 'Other' }])}
                      className="text-[12px] font-semibold text-[#ef4523] hover:text-[#ef4523]/80 transition-colors flex items-center gap-1 py-1 px-2 rounded hover:bg-orange-50"
                    >
                      + Add Stop
                    </button>
                  </div>
                )}

                {/* Destination */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-[10px] h-[10px] rounded-full bg-[#FF3B30] shrink-0" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Destination</span>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={destText}
                      onChange={(e) => handleInputChange(e.target.value, 'dest')}
                      onFocus={() => {
                        if (destText.length >= 3) handleInputChange(destText, 'dest');
                      }}
                      onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                      placeholder="Destination..."
                      className="w-full h-[40px] bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-[36px] text-[13px] text-[#273a5a] font-medium outline-none focus:border-[#ef4523] focus:bg-white transition-all"
                    />
                    {activeInput === 'dest' && suggestions.length > 0 && (
                      <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-[100] max-h-36 overflow-y-auto">
                        {suggestions.map((s, i) => (
                          <div
                            key={i}
                            className="p-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer text-[12px] font-medium text-[#273a5a] truncate"
                            onMouseDown={() => handleSelectSuggestion(s, 'dest')}
                          >
                            {s.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <button
                        onClick={() => setSelectingLocationFor('dest')}
                        className={`w-[26px] h-[26px] rounded flex items-center justify-center ${
                          selectingLocationFor === 'dest'
                            ? 'text-white bg-[#ef4523]'
                            : 'text-blue-500 hover:bg-blue-50'
                        } active:scale-95 transition-all`}
                      >
                        <Map className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="relative h-[250px] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
                {selectingLocationFor && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#273a5a] text-white px-3 py-1.5 rounded-full font-bold text-[11px] shadow-xl z-30 animate-pulse">
                    Tap map to select location
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ ACTIVITY LOG TAB ═══ */}
          {activeTab === 'log' && (
            <div className="flex flex-col gap-3">
              {editLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <History className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium text-sm">No edit history yet</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Changes made to this ride will appear here
                  </p>
                </div>
              ) : (
                <div className="relative border-l-2 border-gray-100 ml-4 pl-5 flex flex-col gap-4">
                  {editLog.map((entry, idx) => (
                    <div key={entry.id || idx} className="relative">
                      <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-white border-4 border-[#ef4523]" />
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#273a5a]">
                            {entry.editor_name || 'Admin'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(entry.created_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {entry.edit_type?.replace(/_/g, ' ').replace(/,\s*/g, ' · ')}
                        </p>
                        {entry.changes && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Object.keys(entry.changes).map((key) => (
                              <span
                                key={key}
                                className="px-2 py-0.5 bg-orange-50 text-[#ef4523] rounded-full text-[10px] font-bold"
                              >
                                {key.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Save Button */}
        {activeTab !== 'log' && (
          <div className="px-5 py-4 border-t border-gray-100 shrink-0 bg-white">
            <button
              onClick={handleSave}
              disabled={saving || !formData.name}
              className="w-full bg-[#ef4523] hover:bg-[#e0481c] text-white font-bold text-[15px] py-3.5 rounded-xl shadow-[0_8px_24px_rgba(239,69,35,0.3)] active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save & Notify Riders
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditRideModal;
