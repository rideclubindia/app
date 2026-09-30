import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Bell, Users, Search, Navigation, AlertTriangle, Cloud, CloudRain, Sun, Zap, Info, Crosshair, HelpCircle, AlertOctagon, X, Star, Calendar, MessageCircle, ChevronDown, Flag, User, MapPin, SearchIcon, Plus, Menu, Layers, Activity, Car, ChevronRight, Camera, Globe, Check, Send } from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiClient, API_BASE_URL } from '../lib/apiClient';
import { getRealtime, EV_PINS_NEW } from '../realtime';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { IncidentDrawer } from '../components/IncidentDrawer';
import { useToast } from '../components/ToastContext';
import { useIncidentCategories, incidentIconMap, resolvePinIcon, CUSTOM_ICON_OPTIONS } from '../hooks/useIncidentCategories';
import { filterActiveIncidents } from '../lib/incidentExpiry';
import { useIncidentNotifications } from '../hooks/useIncidentNotifications';
import { getDeterministicUuid } from '../lib/user';
import logoLight from '../assets/Logos/Logo for White Backgrounds 2.svg';
import { getMyProfile } from '../lib/myProfile';

const MapView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { map: contextMap } = (useOutletContext<{ map: maplibregl.Map | null }>() || {}) as { map: maplibregl.Map | null };
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
  const [reportType, setReportType] = useState('');
  const [customIconName, setCustomIconName] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  
  const { setIsMapReporting, setMapPanelMode } = useLocationStore();
  // Reporting intent: arrived here to report an incident (e.g. from Home's
  // "Report Incident" card) — kept separate from mapPanelMode below so the
  // "tap anywhere to report" hint only fires on that entry, not every visit.
  const [reportingActive, setReportingActive] = useState(!!location.state?.reportMode);
  useEffect(() => {
    setIsMapReporting(showDrawer);
    // /map is always full-screen now — both the search/live-updates panel
    // and the report sheet float over it as real overlays (fixed-position,
    // portaled to <body>), not a stacked split panel.
    setMapPanelMode('full');
    return () => { setIsMapReporting(false); setMapPanelMode('default'); };
  }, [showDrawer, setIsMapReporting, setMapPanelMode]);
  
  // File upload state — each photo starts uploading the moment it's picked
  // (not held back until Submit), so by the time the rider taps Submit the
  // photos are usually already done instead of adding a wait right there.
  interface PendingPhoto { id: string; file: File; previewUrl: string; url: string | null; uploading: boolean; error: boolean }
  const [selectedFiles, setSelectedFiles] = useState<PendingPhoto[]>([]);
  // submitReport's wait-for-uploads loop runs inside a closure captured at
  // call time — plain `selectedFiles` there would never see the state
  // updates uploadPhoto makes while that loop is polling. Mirror into a ref.
  const selectedFilesRef = useRef<PendingPhoto[]>([]);
  useEffect(() => { selectedFilesRef.current = selectedFiles; }, [selectedFiles]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadPhoto = async (photo: PendingPhoto) => {
    setSelectedFiles(prev => prev.map(p => p.id === photo.id ? { ...p, uploading: true, error: false } : p));
    try {
      const formData = new FormData();
      formData.append('file', photo.file);
      // Uses apiClient's configured baseURL (VITE_API_URL) rather than a
      // relative path through the Vite dev proxy — the proxy targets :8000
      // (vite.config.ts), but this repo's own docker-compose maps the API
      // container to :8001, matching VITE_API_URL. If you run the backend
      // bare (`python main.py`, no docker), it defaults to :8000 instead —
      // either start it with `--port 8001` or point VITE_API_URL at :8000.
      const res = await apiClient.post('/api/pins/photo-upload', formData, {
        headers: { 'Content-Type': undefined },
      });
      const url = res.data?.url || null;
      setSelectedFiles(prev => prev.map(p => p.id === photo.id ? { ...p, uploading: false, url, error: !url } : p));
    } catch (e) {
      console.warn('Photo upload failed', e);
      setSelectedFiles(prev => prev.map(p => p.id === photo.id ? { ...p, uploading: false, error: true } : p));
    }
  };

  const addPhotos = (files: File[]) => {
    setSelectedFiles(prev => {
      const room = 3 - prev.length;
      const toAdd = files.slice(0, Math.max(0, room)).map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        url: null,
        uploading: false,
        error: false,
      }));
      toAdd.forEach(p => uploadPhoto(p));
      return [...prev, ...toAdd];
    });
  };
  const [customCategory, setCustomCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const addDescriptionSuggestion = (text: string) => {
    setDescription(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return text;
      if (trimmed.toLowerCase().includes(text.toLowerCase())) return prev;
      return `${trimmed}, ${text}`;
    });
    descriptionRef.current?.focus();
  };
  
  // View Incident State
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [isHomeDrawerMinimized, setIsHomeDrawerMinimized] = useState(true);
  // Live Updates is now a bottom sheet opened on demand, not a panel docked
  // over the top of the map by default — the map should be fully visible.
  const [showUpdatesSheet, setShowUpdatesSheet] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(location.state?.isGroupMode || false);
  const [activeTab, setActiveTab] = useState('All');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroupForReport, setSelectedGroupForReport] = useState<string | null>(null);
  // Decoupled from selectedGroupForReport so switching to "Group" reads as
  // selected even before a specific group id is picked (or when the rider
  // has zero groups to pick from).
  const [audienceMode, setAudienceMode] = useState<'public' | 'group'>('public');
  // When arriving from a group page's "Report an Incident" button, lock the
  // audience to that group instead of asking again.
  const lockedGroupId: string | null = location.state?.presetGroupId || null;
  const reportHintShown = useRef(false);

  // Map Layers State
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [mapStyle, setMapStyle] = useState('default');
  const [showTraffic, setShowTraffic] = useState(false);  // Disable traffic by default
  const [show3DBuildings, setShow3DBuildings] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  // Same rie_token fallback as the auth-state effect below — resolves who's
  // actually reporting even when there's no real Firebase session.
  const resolveActiveUser = (): { uid: string; displayName: string | null; email: string | null } | null => {
    if (auth.currentUser) {
      return { uid: auth.currentUser.uid, displayName: auth.currentUser.displayName, email: auth.currentUser.email };
    }
    const rieToken = localStorage.getItem('rie_token');
    if (rieToken) {
      try {
        const payload = JSON.parse(atob(rieToken.split('.')[1]));
        if (payload.uid) {
          return { uid: payload.uid, displayName: payload.sub ? String(payload.sub).split('@')[0] : null, email: payload.sub || null };
        }
      } catch (e) { /* ignore malformed token */ }
    }
    return null;
  };

  const resolveProfileId = async (_firebaseUid: string): Promise<string | null> => (await getMyProfile())?.id ?? null;

  // Track auth state. Firebase's onAuthStateChanged only reflects a real
  // Firebase session — most riders here are actually signed in via a
  // separate "rie_token" (decoded client-side), which Firebase never sees.
  // Without this fallback, `u` is always null for those sessions and the
  // group fetch below never runs at all — not a data problem, an identity
  // one. Same pattern already used in GroupsHMI/RidePlusHMI/ProfileHMI.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      let activeUid = firebaseUser?.uid;
      if (!activeUid) {
        const rieToken = localStorage.getItem('rie_token');
        if (rieToken) {
          try {
            const payload = JSON.parse(atob(rieToken.split('.')[1]));
            if (payload.uid) activeUid = payload.uid;
          } catch (e) { /* ignore malformed token */ }
        }
      }
      const u = activeUid ? { uid: activeUid } : null;
      setCurrentUserId(u ? u.uid : null);
      if (u) {
        try {
          // group_members.user_id is stored inconsistently across the app —
          // usually the raw Firebase uid, but occasionally the deterministic
          // profile uuid (e.g. adding a member by profile search). Match
          // both so a real membership never silently disappears here.
          const { data: memberData } = await supabase
            .from('group_members')
            .select('group_id')
            .in('user_id', [u.uid, getDeterministicUuid(u.uid)])
            .in('status', ['accepted', 'admin']);
            
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

  useEffect(() => {
    if (lockedGroupId) { setSelectedGroupForReport(lockedGroupId); setAudienceMode('group'); }
    if (location.state?.reportMode && !reportHintShown.current) {
      reportHintShown.current = true;
      showToast(lockedGroupId ? 'Tap the map to pin the incident location' : 'Tap anywhere on the map to report an incident', 'info');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (contextMap) {
      map.current = contextMap;
      const handleMapClick = (e: maplibregl.MapMouseEvent) => {
        const { lng, lat } = e.lngLat;
        setClickLocation({ lat, lng });
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = new maplibregl.Marker({ color: 'var(--rc-primary)' })
          .setLngLat([lng, lat])
          .addTo(contextMap);
        setShowDrawer(true);
      };
      
      contextMap.on('click', handleMapClick);
      return () => {
        contextMap.off('click', handleMapClick);
      };
    }
  }, [contextMap]);

  // Fetch alerts
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const { data, error } = await supabase.from('pins')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && data) {
          setAlerts(await filterActiveIncidents(data));
        }
      } catch (err) {
        console.error('Error fetching pins:', err);
      } finally {
        setIsLoadingUpdates(false);
      }
    };
    fetchPins();

    // Realtime platform: instant pin fan-out via the shared WS connection
    // (the Supabase channel below stays as the durable fallback).
    const rt = getRealtime();
    rt.connect();
    rt.subscribePins();
    const offPins = rt.on(EV_PINS_NEW, () => { fetchPins(); });

    // Optional: Realtime subscription for pins
    const channel = supabase.channel('public:pins')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pins' }, payload => {
        fetchPins();
      })
      .subscribe();

    return () => {
      offPins();
      rt.unsubscribePins();
      supabase.removeChannel(channel);
    };
  }, []);

  const { categories: reportTypes } = useIncidentCategories();

  // Render Alert Markers on Map
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers that are no longer in alerts
    const currentAlertIds = new Set(alerts.map(a => a.id));
    Object.keys(pinMarkersRef.current).forEach(id => {
      if (!currentAlertIds.has(id)) {
        pinMarkersRef.current[id].remove();
        delete pinMarkersRef.current[id];
      }
    });

    // Add new markers (supports both PostGIS `location` and plain lat/lng columns)
    alerts.forEach(alert => {
      if (pinMarkersRef.current[alert.id]) return;

      const lng = alert.location?.coordinates?.[0] ?? alert.longitude;
      const lat = alert.location?.coordinates?.[1] ?? alert.latitude;
      if (lat == null || lng == null) return;

      // Find category styling (color/bg are Tailwind classes); the icon
      // itself prefers a custom icon_name (set on "Other" reports) over the
      // fixed category icon.
      const typeObj = reportTypes?.find(t => t.id === alert.category);
      const IconComp = resolvePinIcon(alert, reportTypes || []);

      const el = document.createElement('div');
      el.className = 'cursor-pointer hover:scale-110 transition-transform active:scale-95';
      const root = createRoot(el);
      root.render(
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${typeObj?.bg || 'bg-red-50'}`}>
          <IconComp className={`w-4 h-4 ${typeObj?.color || 'text-red-500'}`} />
        </div>
      );

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current!);
        
      marker.getElement().addEventListener('click', () => {
        navigate(`/incident/${alert.id}`);
      });

      pinMarkersRef.current[alert.id] = marker;
    });
  }, [alerts, contextMap, reportTypes]);

  const nearbyAlerts = alerts; // Temporary mock or mapping if alerts is populated elsewhere

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const submitReport = async () => {
    const activeUser = resolveActiveUser();
    if (!clickLocation) {
      showToast('Please select a location on the map first.', 'error');
      return;
    }
    if (!reportType) {
      showToast('Please select an incident category.', 'error');
      return;
    }
    if (reportType === 'Other') {
      if (!customCategory.trim()) {
        showToast('Please name this incident.', 'error');
        return;
      }
      if (!customIconName) {
        showToast('Please choose an icon for this incident.', 'error');
        return;
      }
    }
    if (audienceMode === 'group' && !lockedGroupId && !selectedGroupForReport) {
      showToast('Please select a group to share with.', 'error');
      return;
    }
    if (selectedGroupForReport && !userGroups.some(g => g.id === selectedGroupForReport) && selectedGroupForReport !== lockedGroupId) {
      showToast('Please select a valid group.', 'error');
      return;
    }
    if (selectedFiles.length > 3) {
      showToast('You can attach up to 3 photos.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCategory = reportType === 'Other' && customCategory.trim() !== ''
        ? `Other: ${customCategory.trim()}`
        : reportType;

      // Photos upload as soon as they're picked (see addPhotos/uploadPhoto),
      // not held back until now — this just waits out whichever ones are
      // still mid-flight and collects whatever succeeded.
      if (selectedFilesRef.current.some(p => p.uploading)) {
        setIsUploadingPhotos(true);
        while (selectedFilesRef.current.some(p => p.uploading)) {
          await new Promise(r => setTimeout(r, 200));
        }
        setIsUploadingPhotos(false);
      }
      const photoUrls: string[] = selectedFilesRef.current.filter(p => p.url).map(p => p.url as string);
      if (photoUrls.length < selectedFilesRef.current.length) {
        showToast('Some photos failed to upload — continuing with the rest.', 'error');
      }

      const { data, error } = await supabase.from('pins').insert([{
        category: finalCategory,
        title: reportType === 'Other' ? customCategory.trim() : finalCategory,
        icon_name: reportType === 'Other' ? customIconName : null,
        description: description,
        severity: reportType === 'Accident' ? 3 : 1,
        latitude: clickLocation.lat,
        longitude: clickLocation.lng,
        status: 'active',
        reporter_name: activeUser?.displayName || activeUser?.email?.split('@')[0] || 'Rider',
        reporter_id: activeUser ? getDeterministicUuid(activeUser.uid) : null,
        group_id: audienceMode === 'group' ? selectedGroupForReport : null,
        photo_url: photoUrls[0] || null,
        photo_urls: photoUrls,
      }]).select();

      if (error) throw error;

      showToast('Report submitted successfully!', 'success');
      setShowDrawer(false);
      setReportingActive(false);
      setClickLocation(null);
      setDescription('');
      setSelectedFiles([]);
      setReportType('');
      setCustomCategory('');
      setCustomIconName(null);
      setSelectedGroupForReport(null);
      markerRef.current?.remove();

      // Add the new pin directly to state so it appears instantly
      if (data && data.length > 0) {
        setAlerts(prev => [data[0], ...prev]);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsSearching(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await res.json();
        const formatted = data.features.map((f: any) => ({
          name: f.properties.name,
          display_name: [f.properties.name, f.properties.city, f.properties.state].filter(Boolean).join(', '),
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          isSavedLocation: false
        }));
        setSearchResults(formatted);
      } catch (err) {
        showToast('Search failed', 'error');
      } finally {
        setIsSearching(false);
      }
    }
  };

  const selectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    
    map.current?.flyTo({ center: [lng, lat], zoom: 16 });
    setSearchResults([]);
    setSearchQuery(item.name || item.display_name);
    
    // Add temporary marker for searched location
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = new maplibregl.Marker({ color: 'var(--rc-primary)' })
      .setLngLat([lng, lat])
      .addTo(map.current!);
  };

  const saveSearchResult = (item: any) => {
    showToast(`Saved ${item.name} to locations`, 'success');
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setClickLocation(null);
    markerRef.current?.remove();
    popupRef.current?.remove();
    setReportType('');
    setCustomCategory('');
    setCustomIconName(null);
    setDescription('');
    setSelectedFiles([]);
    setSelectedGroupForReport(lockedGroupId);
    setAudienceMode(lockedGroupId ? 'group' : 'public');
  };

  const DESCRIPTION_SUGGESTIONS = ['Multiple vehicles', 'Road partially blocked', 'Rider injured'];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {showDrawer ? createPortal(
        <React.Fragment>
          {/* Dim the map behind the sheet — purely visual, pointer-events
              pass through so tapping the map still repositions the pin. */}
          <div className="fixed inset-0 bg-black/25 z-[55] pointer-events-none animate-in fade-in duration-200" />
            {/* Portaled straight to <body> so this genuinely sits above the
                floating bottom nav rail — some ancestor in the cockpit layout
                creates its own stacking context, which trapped a plain fixed
                child here and let the nav's FAB render on top regardless of
                z-index. */}
            <div className="fixed inset-x-0 bottom-0 z-[60] max-h-[80vh] bg-white overflow-hidden rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.25)] flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="flex flex-col items-center pt-2.5 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              <div className="flex items-start justify-between gap-3 px-5 py-3.5 shrink-0 border-b border-gray-100">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <AlertOctagon className="w-5 h-5 text-[var(--rc-primary)]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-[17px] text-gray-950 tracking-tight leading-tight">Report Incident</h2>
                    <p className="text-[12px] text-gray-500 font-medium leading-tight mt-0.5">Help keep our riding community safe</p>
                  </div>
                </div>
                <button
                  onClick={closeDrawer}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer shrink-0"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-50/70 px-4 py-4 flex flex-col gap-3 custom-scrollbar">
                {/* Location Confirmed Banner */}
                <div className="w-full bg-emerald-50 text-emerald-900 p-3.5 rounded-2xl flex items-center gap-2.5 border border-emerald-200 text-[12.5px] shadow-2xs shrink-0">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold flex-1 min-w-0">Location pinned on map</span>
                  <span className="text-emerald-700 font-bold text-[11.5px] shrink-0 flex items-center gap-0.5">
                    Tap the map to adjust <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                {/* Select Type Grid */}
                <div className="flex-shrink-0 bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs">
                  <h3 className="font-bold text-[13px] text-gray-950 mb-3">Select Incident Category</h3>
                  <div className="grid grid-cols-4 gap-2.5">
                    {reportTypes.map((type) => {
                      const IconComp = incidentIconMap[type.iconName as keyof typeof incidentIconMap] || AlertTriangle;
                      const isSelected = reportType === type.id;
                      return (
                        <button
                          type="button"
                          key={type.id}
                          onClick={() => { setReportType(type.id); if (type.id !== 'Other') { setCustomCategory(''); setCustomIconName(null); } }}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-orange-50 border-[var(--rc-primary)] shadow-2xs'
                              : 'bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all ${
                            isSelected
                              ? 'bg-white text-[var(--rc-primary)] shadow-2xs'
                              : 'bg-white border border-gray-200 text-gray-700'
                          }`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span className={`text-[10px] font-bold text-center leading-tight line-clamp-1 ${
                            isSelected ? 'text-[var(--rc-primary)]' : 'text-gray-800'
                          }`}>
                            {type.id}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Name + Icon (if Other) */}
                {reportType === 'Other' && (
                  <div className="flex-shrink-0 animate-in fade-in slide-in-from-top-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-[13px] text-gray-950 mb-1.5">Incident Name</h3>
                      <input
                        type="text"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[var(--rc-primary)] focus:ring-1 focus:ring-[var(--rc-primary)] transition-all text-[13px] text-gray-950 placeholder-gray-400 font-medium"
                        placeholder="E.g., Fallen Tree, Road Flooding..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-[13px] text-gray-950 mb-2.5">Custom Icon</h3>
                      <div className="grid grid-cols-4 gap-2.5">
                        {CUSTOM_ICON_OPTIONS.map((opt) => {
                          const OptIcon = incidentIconMap[opt.key];
                          const isSelected = customIconName === opt.key;
                          return (
                            <button
                              type="button"
                              key={opt.key}
                              onClick={() => setCustomIconName(opt.key)}
                              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-50 border-[var(--rc-primary)] shadow-2xs'
                                  : 'bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all ${
                                isSelected
                                  ? 'bg-white text-[var(--rc-primary)] shadow-2xs'
                                  : 'bg-white border border-gray-200 text-gray-700'
                              }`}>
                                <OptIcon className="w-4 h-4" />
                              </div>
                              <span className={`text-[10px] font-bold text-center leading-tight line-clamp-1 ${
                                isSelected ? 'text-[var(--rc-primary)]' : 'text-gray-800'
                              }`}>
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Description Area */}
                <div className="flex-shrink-0 bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs">
                  <h3 className="font-bold text-[13px] text-gray-950 mb-2 flex items-center justify-between">
                    Description <span className="text-gray-400 font-normal text-[11px]">(Optional)</span>
                  </h3>
                  <div className="relative">
                    <textarea
                      ref={descriptionRef}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pb-6 h-[80px] resize-none outline-none focus:border-[var(--rc-primary)] focus:ring-1 focus:ring-[var(--rc-primary)] transition-all text-[13px] text-gray-950 placeholder-gray-400 font-medium"
                      placeholder="Add details to help fellow riders..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                      maxLength={200}
                    />
                    <span className="absolute bottom-2 right-2.5 text-[10px] text-gray-400 font-medium">{description.length}/200</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {DESCRIPTION_SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addDescriptionSuggestion(s)}
                        className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-[11px] font-semibold text-gray-600 transition-colors cursor-pointer"
                      >
                        + {s}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => descriptionRef.current?.focus()}
                      className="px-2.5 py-1 rounded-full bg-orange-50 hover:bg-orange-100 text-[11px] font-semibold text-[var(--rc-primary)] transition-colors cursor-pointer"
                    >
                      + Add suggestion
                    </button>
                  </div>
                </div>

                {/* Photo Area */}
                <div className="flex-shrink-0 bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs">
                  <h3 className="font-bold text-[13px] text-gray-950 mb-2.5 flex items-center justify-between gap-2">
                    <span className="shrink-0">Photos ({selectedFiles.length}/3)</span>
                    <span className="text-gray-400 font-normal text-[11px] text-right">Add photos to give better context</span>
                  </h3>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        addPhotos(Array.from(e.target.files));
                        e.target.value = '';
                      }
                    }}
                  />

                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {selectedFiles.length < 3 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-[76px] h-[76px] shrink-0 border-2 border-dashed border-gray-300 hover:border-[var(--rc-primary)] rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-[var(--rc-primary)] hover:bg-orange-50/40 transition-colors cursor-pointer"
                      >
                        <Camera className="w-5 h-5 mb-0.5" />
                        <span className="text-[9px] font-bold text-center leading-tight">Add Photos<br />({selectedFiles.length}/3)</span>
                      </button>
                    )}
                    {selectedFiles.map((photo) => (
                      <div key={photo.id} className={`relative w-[76px] h-[76px] shrink-0 rounded-2xl overflow-hidden shadow-2xs ${photo.error ? 'ring-2 ring-red-400' : ''}`}>
                        <img src={photo.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        {photo.uploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                        {photo.error && !photo.uploading && (
                          <button
                            onClick={() => uploadPhoto(photo)}
                            className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-0.5 text-white cursor-pointer"
                            title="Upload failed — tap to retry"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-[8px] font-bold">Retry</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedFiles(prev => prev.filter((p) => p.id !== photo.id))}
                          className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-black/80 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Post To Selection */}
                <div className="flex-shrink-0 bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs">
                  <h3 className="font-bold text-[13px] text-gray-950 mb-2.5">Broadcast Audience</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => { if (lockedGroupId) return; setAudienceMode('public'); setSelectedGroupForReport(null); }}
                      disabled={!!lockedGroupId}
                      className={`p-3 rounded-2xl border flex flex-col items-start gap-2 text-left transition-all ${lockedGroupId ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${
                        audienceMode === 'public' ? 'bg-orange-50 border-[var(--rc-primary)]' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-2xs">
                          <Globe className={`w-4 h-4 ${audienceMode === 'public' ? 'text-[var(--rc-primary)]' : 'text-gray-500'}`} />
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${audienceMode === 'public' ? 'border-[var(--rc-primary)]' : 'border-gray-300'}`}>
                          {audienceMode === 'public' && <div className="w-2 h-2 rounded-full bg-[var(--rc-primary)]" />}
                        </div>
                      </div>
                      <div>
                        <p className={`font-bold text-[12.5px] leading-tight ${audienceMode === 'public' ? 'text-[var(--rc-primary)]' : 'text-gray-900'}`}>Public (All Riders)</p>
                        <p className="text-[10.5px] text-gray-500 font-medium leading-tight mt-0.5">Visible to all riders in the community</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => !lockedGroupId && setAudienceMode('group')}
                      disabled={!!lockedGroupId}
                      className={`p-3 rounded-2xl border flex flex-col items-start gap-2 text-left transition-all ${lockedGroupId ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${
                        audienceMode === 'group' ? 'bg-orange-50 border-[var(--rc-primary)]' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-2xs">
                          <Users className={`w-4 h-4 ${audienceMode === 'group' ? 'text-[var(--rc-primary)]' : 'text-gray-500'}`} />
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${audienceMode === 'group' ? 'border-[var(--rc-primary)]' : 'border-gray-300'}`}>
                          {audienceMode === 'group' && <div className="w-2 h-2 rounded-full bg-[var(--rc-primary)]" />}
                        </div>
                      </div>
                      <div>
                        <p className={`font-bold text-[12.5px] leading-tight ${audienceMode === 'group' ? 'text-[var(--rc-primary)]' : 'text-gray-900'}`}>Selected Group</p>
                        <p className="text-[10.5px] text-gray-500 font-medium leading-tight mt-0.5">Share only with a specific group</p>
                      </div>
                    </button>
                  </div>

                  {!lockedGroupId && audienceMode === 'group' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {userGroups.length === 0 ? (
                        <p className="text-[11.5px] text-gray-500 font-medium px-1">You haven't joined any groups yet.</p>
                      ) : (
                        <>
                          <p className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-0.5">
                            {selectedGroupForReport ? 'Sharing with' : 'Choose a group'}
                          </p>
                          <div className="flex flex-col gap-2">
                            {userGroups.map(g => {
                              const isSelected = selectedGroupForReport === g.id;
                              return (
                                <button
                                  key={g.id}
                                  type="button"
                                  onClick={() => setSelectedGroupForReport(g.id)}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${
                                    isSelected ? 'bg-orange-50 border-[var(--rc-primary)]' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-white text-[var(--rc-primary)] shadow-2xs' : 'bg-gray-100 text-gray-500'}`}>
                                    <Users className="w-4 h-4" />
                                  </div>
                                  <span className={`flex-1 min-w-0 truncate text-[13px] font-bold ${isSelected ? 'text-[var(--rc-primary)]' : 'text-gray-900'}`}>
                                    {g.name}
                                  </span>
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-[var(--rc-primary)]' : 'border-gray-300'}`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--rc-primary)]" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {lockedGroupId && (
                    <p className="text-[11px] text-gray-500 font-medium mt-1.5 px-1">Shared only with this group.</p>
                  )}
                </div>

              </div>

              <div className="px-4 pt-3.5 pb-5 border-t border-gray-100 shrink-0 bg-white">
                <button
                  onClick={submitReport}
                  disabled={isSubmitting}
                  className={`w-full h-[50px] text-white font-bold text-[14.5px] rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[var(--rc-primary)] to-[#e0391f] shadow-lg shadow-[var(--rc-primary)]/25 hover:brightness-105 active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {isUploadingPhotos ? 'Uploading Photos...' : 'Submitting Report...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Incident
                    </>
                  )}
                </button>
              </div>
            </div>
        </React.Fragment>,
        document.body
      ) : createPortal(
            // The map is always full-screen now — just a compact search
            // pill floats over the top of it. Live Updates lives in its own
            // bottom sheet, opened on demand (see the FAB below), instead of
            // permanently covering most of the map.
            <div className="fixed inset-x-0 top-0 z-40 flex flex-col p-3 gap-2 animate-in fade-in duration-300">

              {/* Search Bar */}
              <div className="relative z-30 shrink-0">
                <div className="card-app h-12 flex items-center px-4 gap-2.5 focus-within:ring-2 focus-within:ring-[#FF6B22] transition-all">
                  <Search className="w-4 h-4 shrink-0 text-[#FF6B22]" strokeWidth={2.5} />
                  <input
                    type="text"
                    placeholder={isSearching ? "Searching..." : "Search location..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    disabled={isSearching}
                    className="flex-1 min-w-0 text-[13px] font-semibold outline-none bg-transparent placeholder-gray-400 text-gray-900 truncate"
                  />
                  <button
                    aria-label="Navigate to my location"
                    onClick={() => {
                      useLocationStore.getState().fetchLocationOnce().then((loc) => {
                        const lat = loc.lat;
                        const lng = loc.lng;
                        setUserLocation({ lat, lng });
                        userMarkerRef.current?.remove();
                        const el = document.createElement('div');
                        el.style.width = '20px';
                        el.style.height = '20px';
                        el.style.borderRadius = '50%';
                        el.style.backgroundColor = '#FFFFFF';
                        el.style.border = '5px solid #FF6B22';
                        el.style.boxShadow = '0 0 0 4px rgba(255,107,34,0.2)';
                        userMarkerRef.current = new maplibregl.Marker(el)
                          .setLngLat([lng, lat])
                          .addTo(map.current!);
                        map.current?.flyTo({ center: [lng, lat], zoom: 15, speed: 1.2 });
                      }, () => {
                        showToast('Unable to get your location.', 'error');
                      });
                    }}
                    className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
                  >
                    <Navigation className="w-4 h-4 transform rotate-45" />
                  </button>
                </div>

                {/* Autocomplete Dropdown */}
                {(searchResults.length > 0 || searchQuery.length > 0) && (
                   <div className="absolute top-[54px] w-full card-app py-1.5 flex flex-col max-h-[280px] overflow-y-auto z-50">
                     {isSearching && searchResults.length === 0 && (
                       <div className="px-4 py-3 text-center text-[12px] text-gray-500">
                         Searching "{searchQuery}"...
                       </div>
                     )}
                     {searchResults.length > 0 && (
                       <div className="text-[9px] text-gray-500 uppercase tracking-wider px-3.5 py-1 font-bold">
                         {searchResults.some((r: any) => r.isSavedLocation) ? 'SAVED LOCATIONS' : 'SUGGESTIONS'}
                       </div>
                     )}
                     {searchResults.map((item, i) => (
                        <div key={i} className="px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-2.5 group transition-colors">
                          <div onClick={() => selectSearchResult(item)} className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-gray-900 truncate flex items-center gap-1">
                              {item.isSavedLocation && <span className="text-[#fbbf24]">⭐</span>}
                              {(item.display_name || item.name).split(',')[0]}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">{item.display_name || item.name}</p>
                          </div>
                          {!item.isSavedLocation && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveSearchResult(item);
                              }}
                              className="ml-2 p-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              aria-label="Save location"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                     ))}
                     {searchResults.length === 0 && !isSearching && searchQuery.length > 0 && (
                       <div>
                         <div className="px-3.5 py-2 text-[11px] text-gray-500 border-b border-gray-100">
                           No results found for "{searchQuery}"
                         </div>
                       </div>
                     )}
                   </div>
                )}
              </div>

              {/* Live Updates — compact pill; opens the bottom sheet below */}
              <button
                onClick={() => setShowUpdatesSheet(true)}
                className="card-app shrink-0 flex items-center justify-between px-4 py-2.5 cursor-pointer active:scale-[0.98] transition-all"
              >
                <span className="flex items-center gap-2 text-[13px] font-bold text-gray-950">
                  <Activity className="w-4 h-4 text-[#FF6B22]" /> Live Updates
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="bg-[#FF6B22]/10 text-[#FF6B22] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    {nearbyAlerts.length} Active
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </span>
              </button>
            </div>,
        document.body
      )}

      {showUpdatesSheet && createPortal(
        <React.Fragment>
          {/* Unlike the report sheet, this one has nothing to lose by
              closing — so tapping the dimmed map behind it closes the sheet
              instead of letting the tap fall through and drop a pin. */}
          <div
            className="fixed inset-0 bg-black/30 z-[55] animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setShowUpdatesSheet(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[60] max-h-[75vh] bg-white overflow-hidden rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.25)] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex flex-col items-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 shrink-0 border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                  <Activity className="w-4.5 h-4.5 text-[var(--rc-primary)]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-extrabold text-gray-950 leading-tight">Live Updates</h3>
                  <p className="text-[11.5px] text-gray-500 font-medium leading-tight mt-0.5">{nearbyAlerts.length} active nearby</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpdatesSheet(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 custom-scrollbar">
              <div className="flex gap-1 shrink-0 p-1 bg-gray-100/70 rounded-full overflow-x-auto hide-scrollbar whitespace-nowrap">
                <button onClick={() => setActiveTab('All')} className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${activeTab === 'All' ? 'bg-white text-gray-950' : 'text-gray-500 hover:text-gray-800'}`}>
                  <Layers className="w-3 h-3 shrink-0" /> All
                </button>
                <button onClick={() => setActiveTab('Rides')} className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${activeTab === 'Rides' ? 'bg-white text-gray-950' : 'text-gray-500 hover:text-gray-800'}`}>
                  <Car className="w-3 h-3 shrink-0" /> Rides
                </button>
                <button onClick={() => setActiveTab('Events')} className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${activeTab === 'Events' ? 'bg-white text-gray-950' : 'text-gray-500 hover:text-gray-800'}`}>
                  <Calendar className="w-3 h-3 shrink-0" /> Events
                </button>
                <button onClick={() => setActiveTab('Alerts')} className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${activeTab === 'Alerts' ? 'bg-white text-gray-950' : 'text-gray-500 hover:text-gray-800'}`}>
                  <AlertTriangle className="w-3 h-3 shrink-0" /> Alerts
                </button>
              </div>

              {isLoadingUpdates ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="w-full bg-gray-50 rounded-2xl p-3 flex items-center gap-3 shrink-0 animate-pulse">
                    <div className="w-[40px] h-[40px] rounded-full bg-gray-200 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-3.5 bg-gray-200 rounded w-1/2 mb-1.5"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))
              ) : activeTab === 'Rides' ? (
                <div className="text-center py-8 text-gray-400 font-medium text-[12px] flex flex-col items-center gap-2">
                   <Car className="w-6 h-6 opacity-40" />
                   No active rides nearby
                </div>
              ) : activeTab === 'Events' ? (
                <div className="text-center py-8 text-gray-400 font-medium text-[12px] flex flex-col items-center gap-2">
                   <Calendar className="w-6 h-6 opacity-40" />
                   No events nearby
                </div>
              ) : nearbyAlerts.length > 0 ? (
                nearbyAlerts.slice(0, 10).map(alert => {
                  const IconComp = resolvePinIcon(alert, reportTypes);
                  const cat = reportTypes.find(t => t.id === alert.category);
                  return (
                    <button key={alert.id} onClick={() => navigate(`/incident/${alert.id}`)} className="w-full bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm rounded-2xl p-3 flex items-center justify-between transition-all shrink-0 group cursor-pointer text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${cat?.bg || 'bg-orange-50'}`}>
                          <IconComp className={`w-4.5 h-4.5 ${cat?.color || 'text-[#FF6B22]'}`} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[13px] text-gray-950 leading-tight mb-0.5">{alert.category}</h4>
                          <p className="text-[11px] text-gray-500 leading-tight truncate max-w-[160px]">{alert.description || "Nearby report"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[10px] text-gray-400 font-medium">{formatTimeAgo(alert.created_at)}</span>
                        <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#FF6B22] group-hover:text-white text-gray-400 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400 font-medium text-[12px] flex flex-col items-center gap-2">
                   <Activity className="w-6 h-6 opacity-40" />
                   No active updates nearby
                </div>
              )}
            </div>
          </div>
        </React.Fragment>,
        document.body
      )}

      {selectedIncident && (
        <IncidentDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </div>
  );
};

export default MapView;
