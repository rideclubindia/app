import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, Bell, Users, Search, Navigation, AlertTriangle, Cloud, CloudRain, Sun, Zap, Info, Crosshair, HelpCircle, AlertOctagon, X, Star, Calendar, MessageCircle, ChevronDown, Flag, User, MapPin, SearchIcon, Plus, Menu, Layers, Activity, Car, ChevronRight, Camera, Globe, Check } from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiClient, API_BASE_URL } from '../lib/apiClient';
import { getRealtime, EV_PINS_NEW } from '../realtime';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { IncidentDrawer } from '../components/IncidentDrawer';
import { useToast } from '../components/ToastContext';
import { useIncidentCategories, incidentIconMap } from '../hooks/useIncidentCategories';
import { filterActiveIncidents } from '../lib/incidentExpiry';
import { useIncidentNotifications } from '../hooks/useIncidentNotifications';
import { getDeterministicUuid } from '../lib/user';
import logoLight from '../assets/Logos/Logo for White Backgrounds 2.svg';

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
  const [reportType, setReportType] = useState('Accident');
  const [description, setDescription] = useState('');
  
  const { setIsMapReporting } = useLocationStore();
  useEffect(() => {
    setIsMapReporting(showDrawer);
    return () => setIsMapReporting(false);
  }, [showDrawer, setIsMapReporting]);
  
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

  useEffect(() => {
    if (contextMap) {
      map.current = contextMap;
      const handleMapClick = (e: maplibregl.MapMouseEvent) => {
        const { lng, lat } = e.lngLat;
        setClickLocation({ lat, lng });
        if (markerRef.current) markerRef.current.remove();
        markerRef.current = new maplibregl.Marker({ color: '#ef4523' })
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

      // Find category styling (color/bg are Tailwind classes)
      const typeObj = reportTypes?.find(t => t.id === alert.category);
      const IconComp = typeObj ? incidentIconMap[typeObj.iconName] : AlertTriangle;

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
    if (!clickLocation) {
      showToast('Please select a location on the map first.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      let finalCategory = reportType === 'Other' && customCategory.trim() !== '' 
        ? `Other: ${customCategory.trim()}` 
        : reportType;

      const { data, error } = await supabase.from('pins').insert([{
        category: finalCategory,
        description: description,
        severity: reportType === 'Accident' ? 3 : 1,
        latitude: clickLocation.lat,
        longitude: clickLocation.lng,
        status: 'active',
        reporter_name: 'Rider', // Default name, ideally fetch from profiles
        group_id: selectedGroupForReport
      }]).select();
      
      if (error) throw error;
      
      showToast('Report submitted successfully!', 'success');
      setShowDrawer(false);
      setClickLocation(null);
      setDescription('');
      setSelectedFiles([]);
      setReportType('Accident');
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
    markerRef.current = new maplibregl.Marker({ color: '#ef4523' })
      .setLngLat([lng, lat])
      .addTo(map.current!);
  };

  const saveSearchResult = (item: any) => {
    showToast(`Saved ${item.name} to locations`, 'success');
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {showDrawer ? (
            <div className="flex flex-col h-full bg-white overflow-hidden animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-200 shrink-0 bg-white">
                <button 
                  onClick={() => { setShowDrawer(false); setClickLocation(null); markerRef.current?.remove(); popupRef.current?.remove(); }} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors cursor-pointer"
                  title="Back to Map"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="font-extrabold text-[15px] text-gray-950 tracking-tight">Report Incident</h2>
                <div className="w-8" />
              </div>
              
              <div className="flex-1 overflow-y-auto px-3.5 py-2.5 flex flex-col gap-3 custom-scrollbar">
                {/* Location Confirmed Banner */}
                <div className="w-full bg-emerald-50 text-emerald-900 font-bold p-2.5 rounded-lg flex items-center gap-2 border border-emerald-200 text-[12px] shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Pin Placed: Coordinates Verified</span>
                </div>
                
                {/* Select Type Grid */}
                <div className="flex-shrink-0">
                  <h3 className="font-bold text-[11px] text-gray-700 uppercase tracking-wider mb-2">Select Incident Category</h3>
                  <div className="grid grid-cols-4 gap-1.5">
                    {reportTypes.map((type) => {
                      const IconComp = incidentIconMap[type.iconName as keyof typeof incidentIconMap] || AlertTriangle;
                      const isSelected = reportType === type.id;
                      return (
                        <button
                          type="button"
                          key={type.id} 
                          onClick={() => setReportType(type.id)} 
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-orange-50 border-[#ef4523] shadow-2xs ring-1 ring-[#ef4523]' 
                              : 'bg-gray-50/80 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all ${
                            isSelected 
                              ? 'bg-[#ef4523] text-white shadow-2xs' 
                              : 'bg-white border border-gray-200 text-gray-700'
                          }`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span className={`text-[10px] font-bold text-center leading-tight line-clamp-1 ${
                            isSelected ? 'text-[#ef4523]' : 'text-gray-800'
                          }`}>
                            {type.id}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Custom Name (if Other) */}
                {reportType === 'Other' && (
                  <div className="flex-shrink-0 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold text-[11px] text-gray-700 uppercase tracking-wider mb-1">Custom Incident Name</h3>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#ef4523] focus:ring-1 focus:ring-[#ef4523] transition-all text-[13px] text-gray-950 placeholder-gray-400 font-medium" 
                      placeholder="E.g., Fallen Tree, Road Flooding..." 
                      value={customCategory} 
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                  </div>
                )}
                
                {/* Description Area */}
                <div className="flex-shrink-0">
                  <h3 className="font-bold text-[11px] text-gray-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    Description <span className="text-gray-500 font-normal text-[10px] lowercase tracking-normal">(optional)</span>
                  </h3>
                  <div className="relative">
                    <textarea 
                      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 pb-6 h-[80px] resize-none outline-none focus:border-[#ef4523] focus:ring-1 focus:ring-[#ef4523] transition-all text-[13px] text-gray-950 placeholder-gray-400 font-medium" 
                      placeholder="Add details to help fellow riders..." 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <span className="absolute bottom-2 right-2.5 text-[10px] text-gray-500 font-medium">{description.length}/200</span>
                  </div>
                </div>

                {/* Photo Area */}
                <div className="flex-shrink-0">
                  <h3 className="font-bold text-[11px] text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    Photos ({selectedFiles.length}/3) <span className="text-gray-500 font-normal text-[10px] lowercase tracking-normal">(optional)</span>
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
                  
                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="relative w-[76px] h-[76px] shrink-0 rounded-lg overflow-hidden border-2 border-[#ef4523] shadow-2xs">
                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} 
                          className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-black/80 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {selectedFiles.length < 3 && (
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-[76px] h-[76px] shrink-0 border-2 border-dashed border-gray-300 hover:border-[#ef4523] rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-[#ef4523] hover:bg-orange-50/40 transition-colors cursor-pointer"
                      >
                        <Camera className="w-5 h-5 mb-0.5" />
                        <span className="text-[9px] font-bold">Add Photo</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Post To Selection */}
                <div className="flex-shrink-0 relative">
                  <h3 className="font-bold text-[11px] text-gray-700 uppercase tracking-wider mb-1">Broadcast Audience</h3>
                  <div 
                    onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 flex items-center justify-between cursor-pointer outline-none focus:border-[#ef4523] hover:border-gray-400 transition-all shadow-2xs"
                  >
                    <span className="text-[13px] font-bold text-gray-900">
                      {selectedGroupForReport === null 
                        ? (userGroups.length > 0 ? "Public (Everyone Nearby)" : "Public (All Riders)") 
                        : `Group: ${userGroups.find(g => g.id === selectedGroupForReport)?.name || 'Unknown'}`
                      }
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showGroupDropdown ? 'rotate-180' : ''}`} />
                  </div>

                  {showGroupDropdown && (
                    <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                      <div 
                        onClick={() => { setSelectedGroupForReport(null); setShowGroupDropdown(false); }}
                        className={`p-2.5 border-b border-gray-100 cursor-pointer hover:bg-orange-50 transition-colors flex items-center justify-between ${selectedGroupForReport === null ? 'bg-orange-50/70' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <Globe className={`w-4 h-4 ${selectedGroupForReport === null ? 'text-[#ef4523]' : 'text-gray-500'}`} />
                          <div>
                            <p className={`font-bold text-[12px] ${selectedGroupForReport === null ? 'text-[#ef4523]' : 'text-gray-900'}`}>Public (Everyone)</p>
                            <p className="text-[10px] text-gray-500 font-medium">All nearby riders will receive alert</p>
                          </div>
                        </div>
                        {selectedGroupForReport === null && <Check className="w-4 h-4 text-[#ef4523]" />}
                      </div>

                      <div className="max-h-[140px] overflow-y-auto custom-scrollbar">
                        {userGroups.map(g => (
                          <div 
                            key={g.id}
                            onClick={() => { setSelectedGroupForReport(g.id); setShowGroupDropdown(false); }}
                            className={`p-2.5 border-b border-gray-100 cursor-pointer hover:bg-orange-50 transition-colors flex items-center justify-between ${selectedGroupForReport === g.id ? 'bg-orange-50/70' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <Users className={`w-4 h-4 ${selectedGroupForReport === g.id ? 'text-[#ef4523]' : 'text-gray-500'}`} />
                              <div>
                                <p className={`font-bold text-[12px] ${selectedGroupForReport === g.id ? 'text-[#ef4523]' : 'text-gray-900'}`}>{g.name}</p>
                                <p className="text-[10px] text-gray-500 font-medium">Restricted to group members only</p>
                              </div>
                            </div>
                            {selectedGroupForReport === g.id && <Check className="w-4 h-4 text-[#ef4523]" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
              
              <div className="p-3 border-t border-gray-200 shrink-0 bg-white shadow-2xs">
                <button 
                  onClick={submitReport} 
                  disabled={isSubmitting}
                  className={`w-full h-[44px] text-white font-bold text-[14px] rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    isSubmitting 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#ef4523] shadow-xs hover:bg-[#e03817] active:scale-98'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Submitting Report...
                    </div>
                  ) : 'Submit Report'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden p-1 gap-2 animate-in slide-in-from-right duration-300">
              
              {/* Search Bar - Compact */}
              <div className="relative z-30 shrink-0">
                <div className="bg-white rounded-xl border border-gray-200 shadow-2xs h-[42px] flex items-center px-3 gap-2.5 focus-within:border-[#ef4523] transition-colors">
                  <Search className="w-3.5 h-3.5 shrink-0 text-[#ef4523]" strokeWidth={2.5} />
                  <input 
                    type="text" 
                    placeholder={isSearching ? "Searching..." : "Search location..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    disabled={isSearching}
                    className="flex-1 min-w-0 text-[12px] font-semibold outline-none bg-transparent placeholder-gray-400 text-gray-900 truncate"
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
                        el.style.width = '20px';
                        el.style.height = '20px';
                        el.style.borderRadius = '50%';
                        el.style.backgroundColor = '#FFFFFF';
                        el.style.border = '5px solid #ef4523';
                        el.style.boxShadow = '0 0 0 4px rgba(255,102,0,0.2)';
                        userMarkerRef.current = new maplibregl.Marker(el)
                          .setLngLat([lng, lat])
                          .addTo(map.current!);
                        map.current?.flyTo({ center: [lng, lat], zoom: 15, speed: 1.2 });
                      }, () => {
                        showToast('Unable to get your location.', 'error');
                      });
                    }}
                    className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
                  >
                    <Navigation className="w-3 h-3 transform rotate-45" />
                  </button>
                </div>
                
                {/* Autocomplete Dropdown */}
                {(searchResults.length > 0 || searchQuery.length > 0) && (
                   <div className="absolute top-[46px] w-full bg-white rounded-xl shadow-lg py-1.5 flex flex-col max-h-[280px] overflow-y-auto z-50 border border-gray-200 custom-scrollbar">
                     {isSearching && searchResults.length === 0 && (
                       <div className="px-4 py-3 text-center text-[12px] text-gray-500">
                         Searching "{searchQuery}"...
                       </div>
                     )}
                     {searchResults.length > 0 && (
                       <div className="text-[9px] text-gray-500 uppercase tracking-wider px-3.5 py-1 font-bold bg-gray-50">
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

              {/* Live Updates - Compact */}
              <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-gray-200/90 p-2.5 overflow-hidden shadow-2xs">
                <div className="flex justify-between items-center mb-2 shrink-0">
                  <h3 className="text-[13px] font-extrabold text-gray-950 flex items-center gap-1.5">
                    Live Updates
                  </h3>
                  <span className="bg-[#ef4523]/10 text-[#ef4523] px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0">
                    {nearbyAlerts.length} Active
                  </span>
                </div>

                <div className="flex gap-1 shrink-0 mb-2 p-0.5 bg-gray-100 rounded-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                  <button onClick={() => setActiveTab('All')} className={`flex-1 min-w-0 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${activeTab === 'All' ? 'bg-white text-gray-950 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}>
                    <Layers className="w-2.5 h-2.5 shrink-0" /> All
                  </button>
                  <button onClick={() => setActiveTab('Rides')} className={`flex-1 min-w-0 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${activeTab === 'Rides' ? 'bg-white text-gray-950 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}>
                    <Car className="w-2.5 h-2.5 shrink-0" /> Rides
                  </button>
                  <button onClick={() => setActiveTab('Events')} className={`flex-1 min-w-0 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${activeTab === 'Events' ? 'bg-white text-gray-950 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}>
                    <Calendar className="w-2.5 h-2.5 shrink-0" /> Events
                  </button>
                  <button onClick={() => setActiveTab('Alerts')} className={`flex-1 min-w-0 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${activeTab === 'Alerts' ? 'bg-white text-gray-950 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}>
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Alerts
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-2">
                  {isLoadingUpdates ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="w-full bg-gray-50 rounded-lg p-3 flex items-center gap-3 shrink-0 animate-pulse">
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
                      const typeObj = reportTypes.find(t => t.id === alert.category) || reportTypes.find(t => t.id === 'Other');
                      const IconComp = typeObj ? incidentIconMap[typeObj.iconName as keyof typeof incidentIconMap] : AlertTriangle;
                      return (
                        <div key={alert.id} onClick={() => navigate(`/incident/${alert.id}`)} className="w-full bg-gray-50 rounded-lg p-2.5 flex items-center justify-between border border-gray-100 cursor-pointer hover:bg-gray-100 hover:border-gray-200 transition-all shrink-0 group">
                          <div className="flex items-center gap-3">
                            <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0 bg-white border border-gray-200 shadow-sm group-hover:scale-105 transition-transform">
                              <IconComp className="w-4 h-4 text-[#ef4523]" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-[13px] text-gray-900 leading-tight mb-0.5">{alert.category}</h4>
                              <p className="text-[11px] text-gray-500 leading-tight truncate max-w-[140px]">{alert.description || "Nearby report"}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] text-gray-400 font-medium">{formatTimeAgo(alert.created_at)}</span>
                            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-[#ef4523] group-hover:text-white text-gray-400 transition-colors shadow-xs">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
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
            </div>
          )}

      {selectedIncident && (
        <IncidentDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </div>
  );
};

export default MapView;
