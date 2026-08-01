import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, Bell, Users, Search, Navigation, AlertTriangle, Cloud, CloudRain, Sun, Zap, Info, Crosshair, HelpCircle, AlertOctagon, X, Star, Calendar, MessageCircle, ChevronDown, Flag, User, MapPin, SearchIcon, Plus, Menu, Layers, Activity, Car, ChevronRight, Camera, Globe, Check } from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiClient, API_BASE_URL } from '../lib/apiClient';
import { io } from 'socket.io-client';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { IncidentDrawer } from '../components/IncidentDrawer';
import { useToast } from '../components/ToastContext';
import { useIncidentCategories, incidentIconMap } from '../hooks/useIncidentCategories';
import { useIncidentNotifications } from '../hooks/useIncidentNotifications';
import { getDeterministicUuid } from '../lib/user';
import logoLight from '../assets/Logos/Logo for White Backgrounds 2.svg';

const MapView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const pinMarkersRef = useRef<{ [id: string]: maplibregl.Marker }>({});

  // Haversine distance formula to calculate km between two coords
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; // Distance in km
  };

  // Global Location
  const globalLocation = useLocationStore((state) => state.coordinates);

  // States
  const [clickLocation, setClickLocation] = useState<{lat: number, lng: number} | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [reportType, setReportType] = useState('Accident');
  const [description, setDescription] = useState('');
  
  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // View Incident State
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [isHomeDrawerMinimized, setIsHomeDrawerMinimized] = useState(true);
  const [isGroupMode, setIsGroupMode] = useState(location.state?.isGroupMode || false);
  const [activeTab, setActiveTab] = useState('All');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroupForReport, setSelectedGroupForReport] = useState<string | null>(null);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  // Map Layers State
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [mapStyle, setMapStyle] = useState('default');
  const [showTraffic, setShowTraffic] = useState(false);  // Disable traffic by default
  const [show3DBuildings, setShow3DBuildings] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

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

  // Track Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setCurrentUserId(u ? u.uid : null);
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

  const { categories: reportTypes } = useIncidentCategories();

  // Push browser notifications for incidents within 20km or in user's groups
  useIncidentNotifications(
    alerts,
    userLocation,
    userGroups.map((g: any) => g.id),
    20 // 20km radius
  );

  const submitReport = async () => {
    if (!clickLocation) return;
    setIsSubmitting(true);
    try {
      let photoUrl = null;
      
      if (selectedFiles.length > 0) {
        const urls = [];
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('incident-photos')
            .upload(fileName, file);
            
          if (uploadError) {
            console.error("Upload error", uploadError);
          } else {
            const { data } = supabase.storage
              .from('incident-photos')
              .getPublicUrl(fileName);
            urls.push(data.publicUrl);
          }
        }
        if (urls.length > 0) {
          photoUrl = urls.join(',');
        }
      }

      const finalCategory = reportType === 'Other' && customCategory.trim() !== '' 
        ? `Other: ${customCategory.trim()}` 
        : reportType;

      const user = auth.currentUser;
      const uName = user?.displayName || user?.email?.split('@')[0] || 'Community Member';

      const { data, error } = await supabase.from('pins').insert({
        category: finalCategory,
        description: description,
        latitude: clickLocation.lat,
        longitude: clickLocation.lng,
        severity: reportType === 'Accident' ? 3 : 1,
        photo_url: photoUrl,
        group_id: selectedGroupForReport,
        reporter_name: uName
      }).select().single();
      
      // Also post to new backend
      try {
        await apiClient.post('/api/pins/', {
          category: finalCategory,
          description: description,
          latitude: clickLocation.lat,
          longitude: clickLocation.lng,
          severity: reportType === 'Accident' ? 3 : 1,
          group_id: selectedGroupForReport
        });
      } catch (err) {
        // Silently ignore if new backend is unavailable
      }

      if (error) throw error;
      if (data) setAlerts(prev => [data, ...prev]);
      
      // Auto-post to group chat if a group was selected
      if (selectedGroupForReport && auth.currentUser && !error) {
        const uName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Unknown';
        const msgText = `🚨 New Report: ${finalCategory}${description ? ` - ${description}` : ''}`;
        let finalContent = photoUrl ? `${msgText}|||IMG=${photoUrl}` : msgText;
        if (data && data.id) {
          finalContent += `|||ID=${data.id}`;
        }
        
        await supabase.from('messages').insert({
          group_id: selectedGroupForReport,
          user_id: getDeterministicUuid(auth.currentUser.uid),
          username: uName,
          content: finalContent
        });
      }

      setShowDrawer(false);
      setClickLocation(null);
      setDescription('');
      setReportType('Accident');
      setCustomCategory('');
      setSelectedFiles([]);
      markerRef.current?.remove();
      popupRef.current?.remove();
      showToast('Report submitted successfully', 'success');
    } catch (error) {
      showToast('Failed to create pin', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Geocoding Autocomplete with saved locations + fallback strategy
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const delayFn = setTimeout(async () => {
        try {
          setIsSearching(true);
          let results: any[] = [];
          
          // STEP 1: Search user's saved locations first
          const firebaseUid = auth.currentUser?.uid;
          let savedLocs: any[] = [];
          if (firebaseUid) {
            const profileId = await resolveProfileId(firebaseUid);
            if (profileId) {
              const { data } = await supabase
                .from('saved_locations')
                .select('*')
                .eq('user_id', profileId)
                .ilike('name', `%${searchQuery}%`)
                .limit(5);
              savedLocs = data || [];
            }
          }
          
          if (savedLocs.length > 0) {
            results = savedLocs.map((loc: any) => ({
              ...loc,
              display_name: `${loc.name}${loc.address ? ', ' + loc.address : ''}`,
              lat: loc.latitude,
              lon: loc.longitude,
              isSavedLocation: true,
              isCustom: true
            }));
          }
          
          // STEP 2: Search public places if saved locations don't fully satisfy
          if (results.length < 3) {
            let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Hyderabad, India')}&limit=10`);
            let data = await res.json();
            
            if (!data || data.length < 2) {
              res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&viewbox=78.2,17.2,78.6,17.6&bounded=1`);
              data = await res.json();
            }
            
            if (!data || data.length === 0) {
              res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10`);
              data = await res.json();
            }
            
            const publicResults = (data || [])
              .sort((a: any, b: any) => {
                const aIsInHyd = a.display_name?.toLowerCase().includes('hyderabad') ? 0 : 1;
                const bIsInHyd = b.display_name?.toLowerCase().includes('hyderabad') ? 0 : 1;
                return aIsInHyd - bIsInHyd;
              })
              .slice(0, 5 - results.length);
            
            results = [...results, ...publicResults];
          }
          
          setSearchResults(results);
          setIsSearching(false);
        } catch(e) {
          console.warn('Search error:', e);
          setIsSearching(false);
        }
      }, 500);
      return () => clearTimeout(delayFn);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const selectSearchResult = (result: any) => {
    setSearchQuery(result.display_name || result.name);
    setSearchResults([]);
    
    // Zoom to location on the map for incident reporting
    const lat = parseFloat(result.lat || result.latitude);
    const lng = parseFloat(result.lon || result.longitude);
    if (map.current && lat && lng) {
      map.current.flyTo({ center: [lng, lat], zoom: 16, speed: 1.2 });
    }
  };

  const saveSearchResult = async (result: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Please sign in to save locations', 'error');
        return;
      }

      const firebaseUid = auth.currentUser?.uid;
      if (!firebaseUid) {
        showToast('Please sign in again', 'error');
        return;
      }

      const profileId = await resolveProfileId(firebaseUid);
      if (!profileId) {
        showToast('Could not find your profile', 'error');
        return;
      }

      const { error } = await supabase
        .from('saved_locations')
        .insert([{
          user_id: profileId,
          name: (result.display_name || result.name).split(',')[0],
          latitude: result.lat || result.latitude,
          longitude: result.lon || result.longitude,
          address: result.display_name || result.name,
          location_type: 'custom'
        }]);

      if (error) {
        if ((error as any).code === '42501') {
          showToast('Database permissions blocked saving location. Apply latest RLS fix migration.', 'error');
          return;
        }
        throw error;
      }
      showToast(`"${(result.display_name || result.name).split(',')[0]}" saved!`, 'success');
      setSearchQuery('');
      setSearchResults([]);
    } catch(error) {
      console.error('Save error:', error);
      showToast('Failed to save location', 'error');
    }
  };

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      selectSearchResult(searchResults[0]);
    }
  };

  // Update GeoJSON source when alerts or userLocation change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    try {
      const source = map.current.getSource('pins') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: alerts
            .filter(pin => pin && typeof pin.longitude === 'number' && typeof pin.latitude === 'number')
            .filter(pin => userLocation ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, pin.latitude, pin.longitude) <= 10 : true)
            .filter(pin => !pin.group_id || userGroups.some(g => g.id === pin.group_id))
            .map(pin => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [pin.longitude, pin.latitude] },
              properties: { ...pin }
            }))
        });
      }
    } catch(e) {
      console.warn("Map update failed", e);
    }
  }, [alerts, mapLoaded, userLocation, userGroups]);

  useEffect(() => {
    if (map.current) return;

    
    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [78.4867, 17.3850],
        zoom: 13
      });

      // Force resize after mount to ensure map fills container properly in flex layouts
      setTimeout(() => {
        map.current?.resize();
      }, 100);

      map.current.on('load', () => {
        if (!map.current) return;
        
        setMapLoaded(true);
      });

      // Handle map click to drop a new pin
      map.current.on('click', (e) => {
        // If the click originated from a marker, ignore it to prevent the "new pin" popup
        const target = e.originalEvent.target as HTMLElement;
        if (target.closest('.maplibregl-marker') || target.closest('.incident-marker')) {
          return;
        }

        const { lng, lat } = e.lngLat;
        
        if ((window as any).isSelectingDestination) {
          (window as any).isSelectingDestination = false;
          navigate('/route-planner', {
            state: {
              destLat: lat,
              destLng: lng,
              destName: 'Selected Location'
            }
          });
          return;
        }

        setClickLocation({ lat, lng });
        setSelectedIncident(null);
        
        // Remove old marker/popup
        if (markerRef.current) markerRef.current.remove();
        if (popupRef.current) popupRef.current.remove();

        // Add new marker with custom HTML
        const el = document.createElement('div');
        const root = createRoot(el);
        root.render(
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white bg-orange-100 animate-bounce">
            <Plus className="w-6 h-6 text-orange-500" />
          </div>
        );

        markerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        // Add popup tooltip
        const popupContent = document.createElement('div');
        popupContent.className = 'p-2 flex flex-col gap-2 items-center';
        popupContent.innerHTML = `
          <span class="font-bold text-[#273a5a] text-[14px]">Report here?</span>
          <div class="flex gap-2 mt-1">
            <button id="cancel-pin" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-bold transition-colors">Cancel</button>
            <button id="confirm-pin" class="bg-[#ef4523] hover:bg-[#ef4523] text-white px-4 py-2 rounded-lg text-[13px] font-bold shadow-md shadow-orange-500/20 transition-colors">Confirm</button>
          </div>
        `;
        
        popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 35 })
          .setLngLat([lng, lat])
          .setDOMContent(popupContent)
          .addTo(map.current!);

        popupContent.querySelector('#confirm-pin')?.addEventListener('click', () => {
          if (!auth.currentUser) {
            navigate('/login');
            return;
          }
          setShowDrawer(true);
          popupRef.current?.remove();
        });
        
        popupContent.querySelector('#cancel-pin')?.addEventListener('click', () => {
          setClickLocation(null);
          popupRef.current?.remove();
          markerRef.current?.remove();
        });
      });
    }

    // Setup Socket.IO for real-time updates ONLY if backend is reachable
    let socket: any = null;
    
    const initSocket = async () => {
      try {
        // Quick ping to check if backend is alive before opening socket
        await fetch(`${API_BASE_URL}/api/v1/health`, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
        
        const token = localStorage.getItem('rie_token');
        const socketOptions: any = {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 3,
          path: '/socket.io/',
          transports: ['websocket', 'polling']
        };
        
        if (token) {
          socketOptions.query = { token };
        }

        socket = io(API_BASE_URL, socketOptions);

        socket.on('connect', () => {
          console.log('Socket.IO connected');
        });

        socket.on('connect_error', () => {
          // Silently handle connection error
        });

        socket.on('new_pin', (newPin: any) => {
          setAlerts(prev => [newPin, ...prev]);
        });

        socket.on('ride_event', (event: any) => {
          if (event.event_type === 'OVERSPEED' || event.event_type === 'HARD_BRAKE' || event.event_type === 'SEPARATION') {
            showToast(`${event.event_type.replace('_', ' ')} Alert!`, 'error');
          } else {
            showToast(`Ride Event: ${event.event_type}`, 'info');
          }
        });
      } catch (e) {
        console.debug('Backend offline, skipping Socket.IO connection');
      }
    };
    
    initSocket();

    // Get User Geolocation
    if (globalLocation) {
      const newLoc = { lat: globalLocation.lat, lng: globalLocation.lng };
      setUserLocation(newLoc);
      try {
        if (map.current) {
           map.current.flyTo({ center: [newLoc.lng, newLoc.lat], zoom: 13 });
        }
      } catch (e) {
        console.warn("Map flyTo failed", e);
      }

        // Place blue dot at user location on initial load
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }
        const el = document.createElement('div');
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#273a5a';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 0 0 6px rgba(66,133,244,0.25), 0 2px 8px rgba(0,0,0,0.2)';
        el.style.animation = 'pulse-ring 1.5s ease-out infinite';
        userMarkerRef.current = new maplibregl.Marker(el)
          .setLngLat([newLoc.lng, newLoc.lat])
          .addTo(map.current!);
    }

    return () => {
      if (socket) socket.disconnect();
      map.current?.remove();
      map.current = null;
    }
  }, []);

  // Fetch pins when userLocation becomes available
  useEffect(() => {
    let consecutiveFailures = 0;
    
    const fetchPins = async () => {
      try {
        const lat = userLocation?.lat || 17.3850;
        const lng = userLocation?.lng || 78.4867;
        let incomingPins: any[] = [];

        // Primary source: backend nearby endpoint
        try {
          if (consecutiveFailures < 3) {
            const res = await apiClient.get(`/api/pins/nearby?lat=${lat}&lng=${lng}&radius_km=50`);
            incomingPins = Array.isArray(res.data) ? res.data : [];
            consecutiveFailures = 0; // reset on success
          }
        } catch {
          consecutiveFailures++;
          incomingPins = [];
        }

        // Fallback source: Supabase (same source family used by Home/Admin)
        if (incomingPins.length === 0) {
          const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: supaPins } = await supabase
            .from('pins')
            .select('*')
            .eq('status', 'active')
            .gte('created_at', last24Hours)
            .order('created_at', { ascending: false })
            .limit(200);

          incomingPins = Array.isArray(supaPins) ? supaPins : [];
        }

        // Keep locally visible incidents when backend temporarily returns empty
        setAlerts((prev) => {
          if (incomingPins.length === 0) {
            return prev;
          }

          const byId = new Map<string, any>();
          for (const pin of prev) {
            byId.set(String(pin.id), pin);
          }
          for (const pin of incomingPins) {
            byId.set(String(pin.id), pin);
          }

          return Array.from(byId.values());
        });
      } catch (error) {
        // Silently handle
      } finally {
        setIsLoadingUpdates(false);
      }
    };

    fetchPins();
    
    // Only poll if we haven't failed repeatedly
    const interval = setInterval(() => {
      if (consecutiveFailures < 3) {
        fetchPins();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [userLocation]);

  // Map Style Effect
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    let styleUrl: any = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
    if (mapStyle === 'dark') styleUrl = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
    if (mapStyle === 'satellite') {
      styleUrl = {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      };
    }
    map.current.setStyle(styleUrl);
  }, [mapStyle, mapLoaded]);

  // Traffic & 3D Buildings Overlay
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const setupLayers = () => {
      try {
        if (!map.current || !map.current.isStyleLoaded()) return;
        
        // Traffic
        if (showTraffic) {
          try {
            if (!map.current.getSource('tomtom-traffic')) {
              map.current.addSource('tomtom-traffic', {
                type: 'raster',
                tiles: [`${API_BASE_URL}/api/v1/traffic/tile/{z}/{x}/{y}`],
                tileSize: 256
              });
            }
            if (!map.current.getLayer('tomtom-traffic-layer')) {
              map.current.addLayer({
                id: 'tomtom-traffic-layer',
                type: 'raster',
                source: 'tomtom-traffic',
                paint: { 'raster-opacity': 0.8 }
              });
            }
          } catch (e) { console.warn('Traffic error:', e); }
        } else {
          try {
            if (map.current.getLayer('tomtom-traffic-layer')) map.current.removeLayer('tomtom-traffic-layer');
            if (map.current.getSource('tomtom-traffic')) map.current.removeSource('tomtom-traffic');
          } catch (e) { console.warn('Traffic removal error:', e); }
        }

        // 3D Buildings
        try {
          if (show3DBuildings && mapStyle !== 'satellite') {
            const sources = map.current.getStyle()?.sources || {};
            const sourceName = sources['carto'] ? 'carto' : sources['openmaptiles'] ? 'openmaptiles' : null;

            if (sourceName && !map.current.getLayer('3d-buildings')) {
              map.current.addLayer({
                id: '3d-buildings',
                source: sourceName,
                'source-layer': 'building',
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                  'fill-extrusion-color': mapStyle === 'dark' ? '#333' : '#ddd',
                  'fill-extrusion-height': ['get', 'render_height'],
                  'fill-extrusion-base': ['get', 'render_min_height'],
                  'fill-extrusion-opacity': 0.6
                }
              });
            }
          } else {
            if (map.current.getLayer('3d-buildings')) map.current.removeLayer('3d-buildings');
          }
        } catch (e) { console.warn('3D Buildings error:', e); }
      } catch (e) {
        console.warn("Map setupLayers failed", e);
      }
    };

    setupLayers();
    map.current.on('styledata', setupLayers);
    return () => {
      map.current?.off('styledata', setupLayers);
    };
  }, [mapLoaded, mapStyle, showTraffic, show3DBuildings]);

  // Sync alerts to map markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // We'll keep track of which pins are currently rendered
    const currentPinIds = new Set(alerts.map(a => a.id));

    // Remove markers that no longer exist
    Object.keys(pinMarkersRef.current).forEach(id => {
      if (!currentPinIds.has(id)) {
        pinMarkersRef.current[id].remove();
        delete pinMarkersRef.current[id];
      }
    });

    // Add or update markers
    alerts.forEach(pin => {
      if (!pin.latitude || !pin.longitude) return;
      if (pin.group_id && !userGroups.some(g => g.id === pin.group_id)) return; // Group restriction
      
      // Filter hidden categories
      if (hiddenCategories.includes(pin.category)) {
        if (pinMarkersRef.current[pin.id]) {
          pinMarkersRef.current[pin.id].remove();
          delete pinMarkersRef.current[pin.id];
        }
        return;
      }

      if (pinMarkersRef.current[pin.id]) return; // Already exists

      let typeObj = reportTypes.find(t => t.id === pin.category);
      if (!typeObj && pin.category?.startsWith('Other:')) {
        typeObj = reportTypes.find(t => t.id === 'Other');
      }

      const el = document.createElement('div');
      el.className = 'incident-marker cursor-pointer hover:scale-110 transition-transform active:scale-95';
      
      const root = createRoot(el);
      const IconComp = typeObj ? incidentIconMap[typeObj.iconName as keyof typeof incidentIconMap] : AlertTriangle;
      
      root.render(
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${typeObj?.bg || 'bg-gray-100'}`}>
          <IconComp className={`w-6 h-6 ${typeObj?.color || 'text-gray-600'}`} />
        </div>
      );

      const stopProp = (e: any) => e.stopPropagation();
      el.addEventListener('mousedown', stopProp);
      el.addEventListener('touchstart', stopProp);
      el.addEventListener('pointerdown', stopProp);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        navigate(`/incident/${pin.id}`);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map.current!);
        
      pinMarkersRef.current[pin.id] = marker;
    });

  }, [alerts, mapLoaded, userGroups, hiddenCategories]);

  // Filter alerts for the nearby card list
  const nearbyAlerts = alerts
    .filter(pin => pin && typeof pin.longitude === 'number' && typeof pin.latitude === 'number')
    .filter(pin => !pin.group_id || userGroups.some(g => g.id === pin.group_id))
    .filter(pin => !hiddenCategories.includes(pin.category));

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} d ago`;
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#F2F4F7]">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Top Floating Menu & Alerts */}
      <div className="absolute top-6 left-4 right-4 landscape:right-[calc(50%+16px)] z-30 flex justify-between items-center">
        <button onClick={() => navigate('/home')} className="w-[48px] h-[48px] bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-[#273a5a] active:bg-gray-50 active:scale-95 transition-all">
          <img src={logoLight} alt="Ride Club Logo" className="w-8 h-8 object-contain" />
        </button>
        <button onClick={() => navigate('/alerts')} className="relative w-[48px] h-[48px] bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-[#273a5a] active:bg-gray-50 active:scale-95 transition-all">
          <Bell className="w-6 h-6" />
          <div className="absolute top-[12px] right-[12px] w-2.5 h-2.5 bg-[#ef4523] border-2 border-white rounded-full"></div>
        </button>
      </div>

      {/* Top Search Bar */}
      <div className="absolute top-[88px] left-1/2 -translate-x-1/2 landscape:-translate-x-[calc(50%+200px)] w-[90%] max-w-[380px] z-30 flex items-center gap-2">
        <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex-1 h-[48px] flex items-center px-4 gap-3 relative z-20">
          <Search className="w-5 h-5 text-[#ef4523]" strokeWidth={3} />
          <input 
            type="text" 
            placeholder={isSearching ? "Searching..." : "Search location for incident..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            disabled={isSearching}
            className="flex-1 text-[15px] font-bold outline-none bg-transparent placeholder-gray-400"
          />
          <button 
            aria-label="Navigate to Location"
            onClick={() => {
              useLocationStore.getState().fetchLocationOnce().then((loc) => {
                const lat = loc.lat;
                const lng = loc.lng;
                setUserLocation({ lat, lng });
                userMarkerRef.current?.remove();
                const el = document.createElement('div');
                el.style.width = '24px';
                el.style.height = '24px';
                el.style.borderRadius = '50%';
                el.style.backgroundColor = '#FFFFFF';
                el.style.border = '6px solid #ef4523';
                el.style.boxShadow = '0 0 0 6px rgba(255,102,0,0.2)';
                userMarkerRef.current = new maplibregl.Marker(el)
                  .setLngLat([lng, lat])
                  .addTo(map.current!);
                map.current?.flyTo({ center: [lng, lat], zoom: 15, speed: 1.2 });
              }, () => {
                showToast('Unable to get your location.', 'error');
              });
            }}
            className="w-[32px] h-[32px] shrink-0 flex items-center justify-center rounded-full bg-[#FFF0E6] text-[#ef4523] hover:bg-[#ffe0cc] active:scale-95 transition-all"
          >
            <Navigation className="w-3.5 h-3.5 transform rotate-45" />
          </button>
        </div>
        
        {/* Autocomplete Dropdown */}
        {(searchResults.length > 0 || searchQuery.length > 0) && (
           <div className="absolute top-[64px] w-full bg-white rounded-lg shadow-lg py-2 flex flex-col max-h-[320px] overflow-y-auto z-10 border border-gray-100">
             {isSearching && searchResults.length === 0 && (
               <div className="px-5 py-4 text-center text-[13px] text-[#8A8A8E]">
                 Searching "{searchQuery}"...
               </div>
             )}
             {searchResults.length > 0 && (
               <div className="text-[12px] text-[#8A8A8E] px-5 py-2 font-semibold bg-gray-50">
                 {searchResults.some((r: any) => r.isSavedLocation) ? 'SAVED LOCATIONS' : 'SUGGESTIONS'}
               </div>
             )}
             {searchResults.map((item, i) => (
                <div key={i} className="px-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-3 group">
                  <div onClick={() => selectSearchResult(item)} className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-dark truncate flex items-center gap-2">
                      {item.isSavedLocation && <span className="text-[#fbbf24]">⭐</span>}
                      {(item.display_name || item.name).split(',')[0]}
                    </p>
                    <p className="text-[13px] text-gray-500 truncate">{item.display_name || item.name}</p>
                  </div>
                  {!item.isSavedLocation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveSearchResult(item);
                      }}
                      className="ml-2 p-2 rounded-lg bg-[#FFF0E6] hover:bg-[#ffe0cc] text-[#ef4523] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Save location"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
             ))}
             {searchResults.length === 0 && !isSearching && searchQuery.length > 0 && (
               <div>
                 <div className="px-5 py-3 text-[13px] text-[#8A8A8E] border-b border-gray-50">
                   No results found for "{searchQuery}"
                 </div>
                 <div className="text-[12px] text-[#8A8A8E] px-5 py-2 font-semibold bg-gray-50 border-b">
                   TRY THESE OPTIONS
                 </div>
               </div>
             )}
             {(searchResults.length > 0 || searchQuery.length > 0) && (
                <div 
                  onClick={() => {
                    showToast('Tap on the map to set your destination', 'info');
                    setSearchQuery('');
                    setSearchResults([]);
                    (window as any).isSelectingDestination = true;
                  }} 
                  className="px-5 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-[#ef4523]"
                >
                  <MapPin className="w-5 h-5" />
                  <p className="text-[15px] font-bold">Select on Map</p>
                </div>
             )}
             {(searchResults.length > 0 || searchQuery.length > 0) && (
                <div 
                  onClick={() => {
                    navigate('/saved-location-picker', {
                      state: {
                        name: searchQuery.trim() || 'Pinned Location'
                      }
                    });
                  }} 
                  className="px-5 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-blue-700"
                >
                  <MapPin className="w-5 h-5" />
                  <p className="text-[15px] font-bold">Select on Map & Save</p>
                </div>
             )}
           </div>
        )}
      </div>

      {/* Floating Action Buttons - Same as Navigation */}
      <div className={`absolute bottom-[240px] landscape:bottom-6 left-4 flex flex-col gap-3 transition-all ${isHomeDrawerMinimized ? 'z-30' : 'z-10'}`}>
        <button onClick={() => setShowLayersMenu(true)} aria-label="Toggle Layers" className="bg-white w-[48px] h-[48px] rounded-full shadow-md border border-gray-100 flex items-center justify-center text-[#273a5a] active:bg-gray-50 active:scale-95 transition-all">
          <Layers className="w-5 h-5" />
        </button>
        <button 
          aria-label="My Location"
          onClick={() => {
            useLocationStore.getState().fetchLocationOnce().then((loc) => {
              const lat = loc.lat;
              const lng = loc.lng;
              setUserLocation({ lat, lng });

              userMarkerRef.current?.remove();

              const el = document.createElement('div');
              el.style.width = '24px';
              el.style.height = '24px';
              el.style.borderRadius = '50%';
              el.style.backgroundColor = '#FFFFFF';
              el.style.border = '6px solid #ef4523';
              el.style.boxShadow = '0 0 0 6px rgba(255,102,0,0.2)';

              userMarkerRef.current = new maplibregl.Marker(el)
                .setLngLat([lng, lat])
                .addTo(map.current!);

              map.current?.flyTo({ center: [lng, lat], zoom: 15, pitch: 0, bearing: 0, speed: 1.2 });
            }, () => {
              showToast('Unable to get your location. Please allow location access.', 'error');
            });
          }}
          className="bg-white w-[48px] h-[48px] rounded-full shadow-md border border-gray-100 flex items-center justify-center text-[#273a5a] active:bg-gray-50 active:scale-95 transition-all"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {/* Map Layers Menu */}
      <div className={`fixed inset-0 bg-[#273a5a]/40 z-40 transition-opacity duration-300 ${showLayersMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowLayersMenu(false)}></div>
      
      <div className={`fixed bottom-0 left-0 w-full landscape:h-[100dvh] landscape:w-[50%] landscape:left-auto landscape:right-0 landscape:rounded-t-none landscape:rounded-l-lg landscape:shadow-[-20px_0_60px_rgba(0,0,0,0.15)] bg-white rounded-t-lg z-50 flex flex-col pt-2 px-6 pb-[40px] transition-transform duration-300 transform ${showLayersMenu ? 'translate-y-0 landscape:translate-x-0' : 'translate-y-full landscape:translate-y-0 landscape:translate-x-full'}`}>
        <div className="w-full flex justify-center cursor-pointer py-2 mb-2" onClick={() => setShowLayersMenu(false)}>
          <div className="w-[48px] h-[5px] bg-[#E5E5EA] rounded-full"></div>
        </div>

        <div className="flex justify-between items-center mb-6">
           <h2 className="text-[22px] font-bold text-[#273a5a]">Map Layers</h2>
           <button onClick={() => setShowLayersMenu(false)} className="bg-[#F2F2F7] w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-[#E5E5EA] transition-colors">
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pb-6">
          
          {/* Map Type */}
          <div>
            <h3 className="text-[16px] font-bold text-[#8A8A8E] mb-3">Map Type</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
              <button onClick={() => setMapStyle('default')} className={`flex flex-col items-center gap-2 shrink-0 ${mapStyle === 'default' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}>
                <div className={`w-[80px] h-[80px] rounded-lg border-[3px] ${mapStyle === 'default' ? 'border-[#ef4523]' : 'border-transparent'} bg-gray-100 overflow-hidden`}>
                  <div className="w-full h-full bg-[#E5E3DF]"></div>
                </div>
                <span className={`text-[13px] font-semibold ${mapStyle === 'default' ? 'text-[#ef4523]' : 'text-gray-600'}`}>Default</span>
              </button>
              
              <button onClick={() => setMapStyle('dark')} className={`flex flex-col items-center gap-2 shrink-0 ${mapStyle === 'dark' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}>
                <div className={`w-[80px] h-[80px] rounded-lg border-[3px] ${mapStyle === 'dark' ? 'border-[#ef4523]' : 'border-transparent'} bg-gray-800 overflow-hidden`}>
                   <div className="w-full h-full bg-[#273a5a]"></div>
                </div>
                <span className={`text-[13px] font-semibold ${mapStyle === 'dark' ? 'text-[#ef4523]' : 'text-gray-600'}`}>Dark</span>
              </button>
              
              <button onClick={() => setMapStyle('satellite')} className={`flex flex-col items-center gap-2 shrink-0 ${mapStyle === 'satellite' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}>
                <div className={`w-[80px] h-[80px] rounded-lg border-[3px] ${mapStyle === 'satellite' ? 'border-[#ef4523]' : 'border-transparent'} bg-green-900 overflow-hidden`}>
                   <div className="w-full h-full bg-[#4A5D23]"></div>
                </div>
                <span className={`text-[13px] font-semibold ${mapStyle === 'satellite' ? 'text-[#ef4523]' : 'text-gray-600'}`}>Satellite</span>
              </button>
            </div>
          </div>

          {/* Map Details */}
          <div>
             <h3 className="text-[16px] font-bold text-[#8A8A8E] mb-3">Map Details</h3>
             <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                       <Navigation className="w-5 h-5 text-blue-500" />
                     </div>
                     <span className="text-[16px] font-bold text-gray-800">Live Traffic</span>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={showTraffic} onChange={() => setShowTraffic(!showTraffic)} className="sr-only peer" />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
                   </label>
                </div>
                
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                       <Layers className="w-5 h-5 text-indigo-500" />
                     </div>
                     <span className="text-[16px] font-bold text-gray-800">3D Buildings</span>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={show3DBuildings} onChange={() => setShow3DBuildings(!show3DBuildings)} className="sr-only peer" />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
                   </label>
                </div>
             </div>
          </div>

          {/* Incident Filters */}
          <div>
            <h3 className="text-[16px] font-bold text-[#8A8A8E] mb-3">Filter Incidents</h3>
            <div className="flex flex-wrap gap-2">
               {reportTypes.map(cat => {
                 const isHidden = hiddenCategories.includes(cat.id);
                 return (
                   <button 
                     key={cat.id} 
                     onClick={() => {
                       if (isHidden) {
                         setHiddenCategories(hiddenCategories.filter(c => c !== cat.id));
                       } else {
                         setHiddenCategories([...hiddenCategories, cat.id]);
                       }
                     }}
                     className={`px-4 py-2 rounded-full text-[14px] font-bold border transition-colors ${isHidden ? 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50' : 'bg-[#FFF0E6] text-[#ef4523] border-transparent hover:bg-orange-100'}`}
                   >
                     {cat.id}
                   </button>
                 );
               })}
            </div>
          </div>
          
        </div>
      </div>

      {/* Bottom Sheet (Collapsible) */}
      {!showDrawer && !selectedIncident && (  
        <div className={`absolute bottom-0 w-full landscape:h-[100dvh] landscape:w-[50%] landscape:left-auto landscape:right-0 landscape:rounded-t-none landscape:rounded-l-[32px] landscape:shadow-[-8px_0_30px_rgba(0,0,0,0.08)] bg-gradient-to-br from-orange-50 to-white rounded-[32px] rounded-b-none shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-20 flex flex-col pt-3 px-6 pb-[50px] transition-all duration-300 overflow-hidden h-auto ${isHomeDrawerMinimized ? '' : 'max-h-[65vh] landscape:max-h-full'}`}>
          <div className="w-full flex justify-center cursor-pointer py-1 mb-2" onClick={() => setIsHomeDrawerMinimized(!isHomeDrawerMinimized)}>
            <div className="w-[48px] h-[4px] bg-[#D1D1D6] rounded-full shrink-0"></div>
          </div>
          
          <div className="flex justify-between items-start shrink-0 pb-4">
             <div>
                <p className="text-[10px] font-bold text-[#ef4523] tracking-widest mb-1.5 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  LIVE UPDATES
                </p>
                <h2 className="text-[26px] font-bold text-[#273a5a] leading-tight mb-1">Near You</h2>
                <p className="text-[14px] text-[#8A8A8E] font-medium">See what's happening on the road</p>
             </div>
             <div className="flex items-center gap-1.5 bg-[#FFF0E6] px-3 py-1.5 rounded-full mt-4">
                <div className="w-2 h-2 bg-[#ef4523] rounded-full"></div>
                <span className="text-[#ef4523] text-[12px] font-bold">{nearbyAlerts.length} active</span>
             </div>
          </div>

          <div className="flex justify-between gap-2">
            <button 
              onClick={() => setActiveTab('All')}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 border transition-colors ${activeTab === 'All' ? 'bg-[#FFF0E6] text-[#ef4523] border-[#ef4523]' : 'bg-white text-[#273a5a] border-gray-100 hover:bg-gray-50 shadow-sm'}`}>
              <Layers className="w-3.5 h-3.5" /> All
            </button>
            <button 
              onClick={() => setActiveTab('Rides')}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 border transition-colors ${activeTab === 'Rides' ? 'bg-[#FFF0E6] text-[#ef4523] border-[#ef4523]' : 'bg-white text-[#273a5a] border-gray-100 hover:bg-gray-50 shadow-sm'}`}>
              <Car className="w-3.5 h-3.5" /> Rides
            </button>
            <button 
              onClick={() => setActiveTab('Events')}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 border transition-colors ${activeTab === 'Events' ? 'bg-[#FFF0E6] text-[#ef4523] border-[#ef4523]' : 'bg-white text-[#273a5a] border-gray-100 hover:bg-gray-50 shadow-sm'}`}>
              <Calendar className="w-3.5 h-3.5" /> Events
            </button>
            <button 
              onClick={() => setActiveTab('Alerts')}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 border transition-colors ${activeTab === 'Alerts' ? 'bg-[#FFF0E6] text-[#ef4523] border-[#ef4523]' : 'bg-white text-[#273a5a] border-gray-100 hover:bg-gray-50 shadow-sm'}`}>
              <AlertTriangle className="w-3.5 h-3.5" /> Alerts
            </button>
          </div>

          {!isHomeDrawerMinimized && (
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4 mt-4">
            {isLoadingUpdates ? (
              Array(1).fill(0).map((_, i) => (
                <div key={i} className="w-full bg-white rounded-lg p-4 flex items-center gap-4 border border-[#E5E5EA] shrink-0 animate-pulse">
                  <div className="w-[52px] h-[52px] rounded-full bg-gray-200 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))
            ) : activeTab === 'Rides' ? (
              <div className="text-center py-6 text-gray-500 font-medium text-[13px]">No active rides nearby</div>
            ) : activeTab === 'Events' ? (
              <div className="text-center py-6 text-gray-500 font-medium text-[13px]">No events nearby</div>
            ) : nearbyAlerts.length > 0 ? (
              nearbyAlerts.slice(0, 5).map(alert => {
                const typeObj = reportTypes.find(t => t.id === alert.category) || reportTypes.find(t => t.id === 'Other');
                const IconComp = typeObj ? incidentIconMap[typeObj.iconName as keyof typeof incidentIconMap] : AlertTriangle;
                return (
                  <div key={alert.id} onClick={() => navigate(`/incident/${alert.id}`)} className="w-full bg-white rounded-lg p-4 flex items-center justify-between border border-[#E5E5EA] cursor-pointer hover:bg-gray-50 transition-colors shrink-0">
                    <div className="flex items-center gap-4">
                      <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0 ${typeObj?.bg || 'bg-gray-100'}`}>
                        <IconComp className={`w-6 h-6 ${typeObj?.color || 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[17px] text-[#273a5a] leading-tight mb-0.5">{alert.category}</h4>
                        <p className="text-[14px] text-[#8A8A8E] leading-tight truncate max-w-[140px]">{alert.description || "Nearby report"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[12px] text-[#8A8A8E] font-medium">{formatTimeAgo(alert.created_at)}</span>
                      <button className="bg-[#F2F2F7] w-8 h-8 rounded-full flex items-center justify-center text-[#273a5a] hover:bg-[#E5E5EA] transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500 font-medium text-[13px]">No active updates nearby</div>
            )}
            </div>
          )}
        </div>
      )}

      {/* Add Report Full Drawer */}
      {showDrawer && !selectedIncident && (
        <div className="absolute bottom-0 left-0 w-full h-[92%] landscape:h-[100dvh] landscape:w-[50%] landscape:left-auto landscape:right-0 landscape:rounded-t-none landscape:rounded-l-lg landscape:shadow-[-20px_0_60px_rgba(0,0,0,0.15)] bg-white rounded-t-lg shadow-[0_-20px_60px_rgba(0,0,0,0.15)] z-50 flex flex-col animate-in slide-in-from-bottom landscape:slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button onClick={() => { setShowDrawer(false); setClickLocation(null); markerRef.current?.remove(); popupRef.current?.remove(); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-6 h-6 text-dark" />
            </button>
            <h2 className="font-bold text-[18px] text-dark">Add Report</h2>
            <div className="w-10" /> {/* Spacer */}
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-8">
            
            {/* Location Confirmed Text */}
            <div className="w-full bg-green-50 text-green-700 font-bold p-4 rounded-lg flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              Location Confirmed on Map
            </div>
            
            {/* Select Type Grid */}
            <div className="flex-shrink-0">
              <h3 className="font-bold text-[16px] text-dark mb-4">Select Type</h3>
              <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                {reportTypes.map((type) => {
                  const IconComp = incidentIconMap[type.iconName as keyof typeof incidentIconMap];
                  const isSelected = reportType === type.id;
                  return (
                    <div key={type.id} onClick={() => setReportType(type.id)} className="flex flex-col items-center gap-2 cursor-pointer">
                      <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2 shadow-lg ' + type.bg : type.bg}`}>
                        <IconComp className={`w-7 h-7 ${type.color}`} />
                      </div>
                      <span className={`text-[12px] font-semibold text-center leading-tight ${isSelected ? 'text-primary' : 'text-gray-600'}`}>
                        {type.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Custom Name (if Other) */}
            {reportType === 'Other' && (
              <div className="flex-shrink-0 animate-in fade-in slide-in-from-top-2">
                <h3 className="font-bold text-[16px] text-dark mb-3">Custom Name</h3>
                <input 
                  type="text" 
                  className="w-full bg-white border border-gray-200 rounded-lg p-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-[15px]" 
                  placeholder="E.g., Pothole, Stray Animal..." 
                  value={customCategory} 
                  onChange={(e) => setCustomCategory(e.target.value)}
                />
              </div>
            )}
            
            {/* Description Area */}
            <div className="flex-shrink-0">
              <h3 className="font-bold text-[16px] text-dark mb-3">
                Description <span className="text-gray-400 font-normal text-[14px]">(optional)</span>
              </h3>
              <div className="relative">
                <textarea 
                  className="w-full bg-white border border-gray-200 rounded-lg p-4 pb-8 h-[120px] resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-[15px]" 
                  placeholder="Tell others what's happening..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                />
                <span className="absolute bottom-3 right-4 text-[12px] text-gray-400 font-medium">{description.length}/200</span>
              </div>
            </div>

            {/* Photo Area */}
            <div className="flex-shrink-0">
              <h3 className="font-bold text-[16px] text-dark mb-3">
                Add Photos ({selectedFiles.length}/3) <span className="text-gray-400 font-normal text-[14px]">(optional)</span>
              </h3>
              
              <input 
                type="file" 
                accept="image/*" 
                multiple
                className="hidden" 
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files);
                    setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 3));
                  }
                }}
              />
              
              <div className="flex gap-3 overflow-x-auto pb-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative w-[100px] h-[100px] shrink-0 rounded-lg overflow-hidden border-2 border-primary">
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} 
                      className="absolute top-1 right-1 bg-[#273a5a]/50 p-1 rounded-full text-white hover:bg-[#273a5a]/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {selectedFiles.length < 3 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-[100px] h-[100px] shrink-0 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    <Camera className="w-8 h-8" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Post To Selection */}
            <div className="flex-shrink-0 relative">
              <h3 className="font-bold text-[16px] text-dark mb-3">Post To</h3>
              <div 
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                className="w-full bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between cursor-pointer outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <span className="text-[15px] font-medium text-dark">
                  {selectedGroupForReport === null 
                    ? (userGroups.length > 0 ? "Public (Everyone)" : "Public (Join a group to post privately)") 
                    : `Group: ${userGroups.find(g => g.id === selectedGroupForReport)?.name || 'Unknown'}`
                  }
                </span>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showGroupDropdown ? 'rotate-90' : ''}`} />
              </div>

              {showGroupDropdown && (
                <div className="absolute left-0 right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                  <div 
                    onClick={() => { setSelectedGroupForReport(null); setShowGroupDropdown(false); }}
                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedGroupForReport === null ? 'bg-orange-50/50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className={`w-5 h-5 ${selectedGroupForReport === null ? 'text-primary' : 'text-gray-400'}`} />
                      <div>
                        <p className={`font-bold text-[15px] ${selectedGroupForReport === null ? 'text-primary' : 'text-dark'}`}>Public (Everyone)</p>
                        <p className="text-[12px] text-gray-500">Anyone nearby can see this</p>
                      </div>
                    </div>
                    {selectedGroupForReport === null && <Check className="w-5 h-5 text-primary" />}
                  </div>

                  <div className="max-h-[200px] overflow-y-auto">
                    {userGroups.map(g => (
                      <div 
                        key={g.id}
                        onClick={() => { setSelectedGroupForReport(g.id); setShowGroupDropdown(false); }}
                        className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedGroupForReport === g.id ? 'bg-orange-50/50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <Users className={`w-5 h-5 ${selectedGroupForReport === g.id ? 'text-primary' : 'text-gray-400'}`} />
                          <div>
                            <p className={`font-bold text-[15px] ${selectedGroupForReport === g.id ? 'text-primary' : 'text-dark'}`}>{g.name}</p>
                            <p className="text-[12px] text-gray-500">Only group members can see this</p>
                          </div>
                        </div>
                        {selectedGroupForReport === g.id && <Check className="w-5 h-5 text-primary" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </div>
          
          {/* Submit Button Sticky Footer */}
          <div className="w-full p-5 pb-[90px] bg-white border-t border-gray-100 flex-shrink-0 mt-auto z-10">
            <button 
              onClick={submitReport} 
              disabled={isSubmitting}
              className={`w-full h-[56px] text-white font-bold text-[16px] rounded-lg flex items-center justify-center transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#ef4523] shadow-[0_8px_20px_rgba(241,90,36,0.3)] active:scale-95'}`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : 'Submit Report'}
            </button>
          </div>
          
        </div>
      )}

      {selectedIncident && (
        <IncidentDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </div>
  );
};

export default MapView;
