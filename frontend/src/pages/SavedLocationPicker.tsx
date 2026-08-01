import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { getDeterministicUuid } from '../lib/user';

const FALLBACK_RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap © CARTO'
    }
  },
  layers: [
    {
      id: 'carto-raster',
      type: 'raster',
      source: 'carto'
    }
  ]
};

const SavedLocationPicker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [name, setName] = useState<string>((location.state as any)?.name || 'Pinned Location');
  const userLoc = useLocationStore((state) => state.coordinates);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const resolveProfileId = async (firebaseUid: string): Promise<string | null> => {
    const deterministicUid = getDeterministicUuid(firebaseUid);
    const { data: byIdRows, error: byIdError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', [firebaseUid, deterministicUid])
      .limit(1);

    if (!byIdError && byIdRows && byIdRows.length > 0) {
      return String(byIdRows[0].id);
    }

    const email = auth.currentUser?.email;
    if (!email) return null;

    const { data: byEmailRows, error: byEmailError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (byEmailError) return null;
    return byEmailRows && byEmailRows.length > 0 ? String(byEmailRows[0].id) : null;
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const containerEl = mapContainer.current;

    map.current = new maplibregl.Map({
      container: containerEl,
      style: FALLBACK_RASTER_STYLE,
      center: [78.4867, 17.3850],
      zoom: 12
    });

    // Force repeated resize while layout settles to avoid white canvas on first paint.
    const t1 = setTimeout(() => map.current?.resize(), 100);
    const t2 = setTimeout(() => map.current?.resize(), 350);
    const t3 = setTimeout(() => map.current?.resize(), 800);

    const ro = new ResizeObserver(() => {
      map.current?.resize();
    });
    ro.observe(containerEl);

    map.current.on('load', () => {
      map.current?.resize();
      setIsMapReady(true);
    });
    map.current.on('error', () => {
      if (map.current && map.current.getStyle()?.version !== 8) {
        map.current.setStyle(FALLBACK_RASTER_STYLE);
      }
    });

    map.current.on('click', (e) => {
      const { lat, lng } = e.lngLat;
      setPicked({ lat, lng });

      markerRef.current?.remove();
      const el = document.createElement('div');
      el.style.width = '22px';
      el.style.height = '22px';
      el.style.borderRadius = '9999px';
      el.style.backgroundColor = '#ef4523';
      el.style.border = '3px solid #ffffff';
      el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)';

      markerRef.current = new maplibregl.Marker(el).setLngLat([lng, lat]).addTo(map.current!);
    });

    if (userLoc && map.current) {
      map.current.flyTo({
        center: [userLoc.lng, userLoc.lat],
        zoom: 15,
        speed: 1.1
      });
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      ro.disconnect();
      markerRef.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const onConfirm = async () => {
    if (!picked) {
      showToast('Tap on map to pick location first', 'info');
      return;
    }

    const firebaseUid = auth.currentUser?.uid;
    if (!firebaseUid) {
      showToast('Please login again', 'error');
      return;
    }

    const locationName = name.trim() || 'Pinned Location';

    try {
      setIsSaving(true);
      const profileId = await resolveProfileId(firebaseUid);
      if (!profileId) {
        showToast('Could not find your profile', 'error');
        return;
      }

      const { error } = await supabase.from('saved_locations').insert([{
        user_id: profileId,
        name: locationName,
        latitude: picked.lat,
        longitude: picked.lng,
        address: `${picked.lat.toFixed(6)}, ${picked.lng.toFixed(6)}`,
        location_type: 'custom'
      }]);

      if (error) {
        if (error.code === '23505') {
          showToast('This location name already exists', 'error');
          return;
        }
        if (error.code === '42501') {
          showToast('Database permissions blocked saving location. Apply latest RLS fix migration.', 'error');
          return;
        }
        throw error;
      }

      showToast(`"${locationName}" saved`, 'success');
      navigate('/profile');
    } catch (e) {
      console.error('Failed to save location:', e);
      showToast('Failed to save location', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[#273a5a]"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[18px] font-bold text-[#273a5a] leading-tight">Pick Saved Location</h1>
          <p className="text-[12px] text-[#8A8A8E]">Tap map to choose exact point</p>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-100 bg-[#F8F9FB]">
        <label className="text-[12px] font-bold text-[#8A8A8E] block mb-2">Location Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Home, Work, Acuvate..."
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#ef4523] text-[14px]"
        />
      </div>

      <div className="relative flex-1 min-h-[320px]">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full bg-[#E9EEF3]" />
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#E9EEF3] text-[#273a5a] text-[13px] font-semibold">
            Loading map...
          </div>
        )}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 text-[#273a5a] px-3 py-1.5 rounded-full text-[12px] font-semibold shadow-sm border border-gray-100 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#ef4523]" />
          Tap map to pin location
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2">
        <button
          onClick={() => navigate('/profile')}
          className="flex-1 bg-[#F2F4F7] text-[#273a5a] font-bold py-3 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isSaving}
          className="flex-1 bg-[#ef4523] disabled:bg-gray-300 text-white font-bold py-3 rounded-lg"
        >
          {isSaving ? 'Saving...' : 'Use This Location'}
        </button>
      </div>
    </div>
  );
};

export default SavedLocationPicker;
