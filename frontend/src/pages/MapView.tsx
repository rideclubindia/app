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
    return (
    <React.Fragment>
      <CockpitLayout
        mapChildren={
          <div className="w-full h-full relative">
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
          </div>
        }
      >
        <SpatialMembrane>
          {showDrawer ? (
            <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                <button onClick={() => { setShowDrawer(false); setClickLocation(null); markerRef.current?.remove(); popupRef.current?.remove(); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                  <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <h2 className="font-bold text-[18px] text-white">Add Report</h2>
                <div className="w-10" />
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8 custom-scrollbar">
                {/* Location Confirmed Text */}
                <div className="w-full bg-green-500/10 text-green-400 font-bold p-4 rounded-xl flex items-center gap-3 border border-green-500/20">
                  <MapPin className="w-5 h-5" />
                  Location Confirmed on Map
                </div>
                
                {/* Select Type Grid */}
                <div className="flex-shrink-0">
                  <h3 className="font-bold text-[14px] text-white/50 uppercase tracking-wider mb-4">Select Type</h3>
                  <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                    {reportTypes.map((type) => {
                      const IconComp = incidentIconMap[type.iconName as keyof typeof incidentIconMap];
                      const isSelected = reportType === type.id;
                      return (
                        <div key={type.id} onClick={() => setReportType(type.id)} className="flex flex-col items-center gap-2 cursor-pointer group">
                          <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all ${isSelected ? 'ring-2 ring-[#ef4523] ring-offset-2 ring-offset-[#0B0F19] shadow-[0_0_20px_rgba(239,69,35,0.3)] bg-white/10' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            <IconComp className={`w-7 h-7 ${isSelected ? 'text-[#ef4523]' : 'text-white/70'}`} />
                          </div>
                          <span className={`text-[12px] font-semibold text-center leading-tight ${isSelected ? 'text-[#ef4523]' : 'text-white/50'}`}>
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
                    <h3 className="font-bold text-[14px] text-white/50 uppercase tracking-wider mb-3">Custom Name</h3>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#ef4523] focus:ring-1 focus:ring-[#ef4523] transition-all text-[15px] text-white placeholder-white/30" 
                      placeholder="E.g., Pothole, Stray Animal..." 
                      value={customCategory} 
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                  </div>
                )}
                
                {/* Description Area */}
                <div className="flex-shrink-0">
                  <h3 className="font-bold text-[14px] text-white/50 uppercase tracking-wider mb-3 flex items-center justify-between">
                    Description <span className="text-white/30 font-normal text-[12px] capitalize tracking-normal">(optional)</span>
                  </h3>
                  <div className="relative">
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pb-8 h-[120px] resize-none outline-none focus:border-[#ef4523] focus:ring-1 focus:ring-[#ef4523] transition-all text-[15px] text-white placeholder-white/30" 
                      placeholder="Tell others what's happening..." 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <span className="absolute bottom-3 right-4 text-[12px] text-white/30 font-medium">{description.length}/200</span>
                  </div>
                </div>

                {/* Photo Area */}
                <div className="flex-shrink-0">
                  <h3 className="font-bold text-[14px] text-white/50 uppercase tracking-wider mb-3 flex items-center justify-between">
                    Photos ({selectedFiles.length}/3) <span className="text-white/30 font-normal text-[12px] capitalize tracking-normal">(optional)</span>
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
                  
                  <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="relative w-[100px] h-[100px] shrink-0 rounded-xl overflow-hidden border border-[#ef4523]">
                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} 
                          className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-black/70 transition-colors backdrop-blur-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {selectedFiles.length < 3 && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-[100px] h-[100px] shrink-0 border border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/30 hover:bg-white/5 transition-colors"
                      >
                        <Camera className="w-8 h-8" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Post To Selection */}
                <div className="flex-shrink-0 relative">
                  <h3 className="font-bold text-[14px] text-white/50 uppercase tracking-wider mb-3">Post To</h3>
                  <div 
                    onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer outline-none focus:border-[#ef4523] focus:ring-1 focus:ring-[#ef4523] transition-all hover:bg-white/10"
                  >
                    <span className="text-[15px] font-medium text-white/90">
                      {selectedGroupForReport === null 
                        ? (userGroups.length > 0 ? "Public (Everyone)" : "Public (Join a group to post privately)") 
                        : `Group: ${userGroups.find(g => g.id === selectedGroupForReport)?.name || 'Unknown'}`
                      }
                    </span>
                    <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${showGroupDropdown ? 'rotate-180' : ''}`} />
                  </div>

                  {showGroupDropdown && (
                    <div className="absolute left-0 right-0 bottom-full mb-2 bg-[#1C2538] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-xl">
                      <div 
                        onClick={() => { setSelectedGroupForReport(null); setShowGroupDropdown(false); }}
                        className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between ${selectedGroupForReport === null ? 'bg-[#ef4523]/10' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <Globe className={`w-5 h-5 ${selectedGroupForReport === null ? 'text-[#ef4523]' : 'text-white/50'}`} />
                          <div>
                            <p className={`font-bold text-[15px] ${selectedGroupForReport === null ? 'text-[#ef4523]' : 'text-white'}`}>Public (Everyone)</p>
                            <p className="text-[12px] text-white/40">Anyone nearby can see this</p>
                          </div>
                        </div>
                        {selectedGroupForReport === null && <Check className="w-5 h-5 text-[#ef4523]" />}
                      </div>

                      <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                        {userGroups.map(g => (
                          <div 
                            key={g.id}
                            onClick={() => { setSelectedGroupForReport(g.id); setShowGroupDropdown(false); }}
                            className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between ${selectedGroupForReport === g.id ? 'bg-[#ef4523]/10' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <Users className={`w-5 h-5 ${selectedGroupForReport === g.id ? 'text-[#ef4523]' : 'text-white/50'}`} />
                              <div>
                                <p className={`font-bold text-[15px] ${selectedGroupForReport === g.id ? 'text-[#ef4523]' : 'text-white'}`}>{g.name}</p>
                                <p className="text-[12px] text-white/40">Only group members can see this</p>
                              </div>
                            </div>
                            {selectedGroupForReport === g.id && <Check className="w-5 h-5 text-[#ef4523]" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
              
              <div className="p-6 border-t border-white/10 shrink-0">
                <button 
                  onClick={submitReport} 
                  disabled={isSubmitting}
                  className={`w-full h-[56px] text-white font-bold text-[16px] rounded-xl flex items-center justify-center transition-all ${isSubmitting ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-[#ef4523] shadow-[0_8px_20px_rgba(239,69,35,0.3)] active:scale-95 hover:bg-[#ff5533]'}`}
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
          ) : (
            <div className="flex flex-col h-full overflow-hidden p-6 gap-8 animate-in slide-in-from-right duration-300">
              
              {/* Search Bar */}
              <div className="relative z-30 shrink-0">
                <div className="bg-white/5 rounded-2xl border border-white/10 h-[52px] flex items-center px-4 gap-3 focus-within:border-[#ef4523] focus-within:bg-white/10 transition-colors">
                  <Search className="w-5 h-5 text-[#ef4523]" strokeWidth={3} />
                  <input 
                    type="text" 
                    placeholder={isSearching ? "Searching..." : "Search location for incident..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    disabled={isSearching}
                    className="flex-1 text-[15px] font-bold outline-none bg-transparent placeholder-white/30 text-white"
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
                    className="w-[32px] h-[32px] shrink-0 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5 transform rotate-45" />
                  </button>
                </div>
                
                {/* Autocomplete Dropdown */}
                {(searchResults.length > 0 || searchQuery.length > 0) && (
                   <div className="absolute top-[64px] w-full bg-[#1C2538] rounded-xl shadow-2xl py-2 flex flex-col max-h-[320px] overflow-y-auto z-50 border border-white/10 custom-scrollbar backdrop-blur-xl">
                     {isSearching && searchResults.length === 0 && (
                       <div className="px-5 py-4 text-center text-[13px] text-white/50">
                         Searching "{searchQuery}"...
                       </div>
                     )}
                     {searchResults.length > 0 && (
                       <div className="text-[11px] text-white/40 uppercase tracking-wider px-5 py-2 font-bold bg-white/5">
                         {searchResults.some((r: any) => r.isSavedLocation) ? 'SAVED LOCATIONS' : 'SUGGESTIONS'}
                       </div>
                     )}
                     {searchResults.map((item, i) => (
                        <div key={i} className="px-3 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer flex items-center justify-between gap-3 group transition-colors">
                          <div onClick={() => selectSearchResult(item)} className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold text-white truncate flex items-center gap-2">
                              {item.isSavedLocation && <span className="text-[#fbbf24]">⭐</span>}
                              {(item.display_name || item.name).split(',')[0]}
                            </p>
                            <p className="text-[13px] text-white/40 truncate">{item.display_name || item.name}</p>
                          </div>
                          {!item.isSavedLocation && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveSearchResult(item);
                              }}
                              className="ml-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Save location"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                     ))}
                     {searchResults.length === 0 && !isSearching && searchQuery.length > 0 && (
                       <div>
                         <div className="px-5 py-3 text-[13px] text-white/50 border-b border-white/5">
                           No results found for "{searchQuery}"
                         </div>
                         <div className="text-[11px] text-white/40 uppercase tracking-wider px-5 py-2 font-bold bg-white/5 border-b border-white/5">
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
                          className="px-5 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 text-[#ef4523] transition-colors"
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
                          className="px-5 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 text-blue-400 transition-colors"
                        >
                          <MapPin className="w-5 h-5" />
                          <p className="text-[15px] font-bold">Select on Map & Save</p>
                        </div>
                     )}
                   </div>
                )}
              </div>

              {/* Quick Actions (Replaces Floating Layers & Location Buttons) */}
              <div className="flex gap-3 shrink-0">
                <button onClick={() => setMapStyle(mapStyle === 'default' ? 'dark' : 'default')} className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Layers className="w-5 h-5 text-white/80" />
                  </div>
                  <span className="text-[12px] font-bold text-white/80">Toggle Map</span>
                </button>
                <button onClick={() => setShowTraffic(!showTraffic)} className={`flex-1 border rounded-2xl p-3 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group ${showTraffic ? 'bg-[#ef4523]/10 border-[#ef4523]/30 hover:bg-[#ef4523]/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showTraffic ? 'bg-[#ef4523]/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <Activity className={`w-5 h-5 ${showTraffic ? 'text-[#ef4523]' : 'text-white/80'}`} />
                  </div>
                  <span className={`text-[12px] font-bold ${showTraffic ? 'text-[#ef4523]' : 'text-white/80'}`}>Traffic</span>
                </button>
                <button 
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
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Crosshair className="w-5 h-5 text-white/80" />
                  </div>
                  <span className="text-[12px] font-bold text-white/80">Locate Me</span>
                </button>
              </div>
              
              {/* Incident Filters */}
              <div className="shrink-0">
                <h3 className="text-[13px] font-bold text-white/40 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Menu className="w-4 h-4" /> Filters
                </h3>
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
                         className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${isHidden ? 'bg-transparent text-white/30 border-white/10 hover:bg-white/5' : 'bg-white/10 text-white border-white/20 hover:bg-white/20 shadow-sm'}`}
                       >
                         {cat.id}
                       </button>
                     );
                   })}
                </div>
              </div>
              
              {/* Live Updates */}
              <div className="flex-1 flex flex-col min-h-0 bg-white/5 rounded-3xl border border-white/10 p-5 overflow-hidden">
                <div className="flex justify-between items-center mb-5 shrink-0">
                  <h3 className="text-[18px] font-bold text-white flex items-center gap-2">
                    Live Updates
                  </h3>
                  <span className="bg-[#ef4523]/20 text-[#ef4523] px-3 py-1 rounded-full text-[12px] font-bold">
                    {nearbyAlerts.length} Active
                  </span>
                </div>

                <div className="flex gap-2 shrink-0 mb-4 p-1 bg-black/20 rounded-xl">
                  <button onClick={() => setActiveTab('All')} className={`flex-1 py-2 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'All' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white'}`}>
                    <Layers className="w-3.5 h-3.5" /> All
                  </button>
                  <button onClick={() => setActiveTab('Rides')} className={`flex-1 py-2 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'Rides' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white'}`}>
                    <Car className="w-3.5 h-3.5" /> Rides
                  </button>
                  <button onClick={() => setActiveTab('Events')} className={`flex-1 py-2 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'Events' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white'}`}>
                    <Calendar className="w-3.5 h-3.5" /> Events
                  </button>
                  <button onClick={() => setActiveTab('Alerts')} className={`flex-1 py-2 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'Alerts' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white'}`}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Alerts
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                  {isLoadingUpdates ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="w-full bg-white/5 rounded-2xl p-4 flex items-center gap-4 shrink-0 animate-pulse">
                        <div className="w-[48px] h-[48px] rounded-full bg-white/10 flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-white/10 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))
                  ) : activeTab === 'Rides' ? (
                    <div className="text-center py-10 text-white/40 font-medium text-[13px] flex flex-col items-center gap-3">
                       <Car className="w-8 h-8 opacity-30" />
                       No active rides nearby
                    </div>
                  ) : activeTab === 'Events' ? (
                    <div className="text-center py-10 text-white/40 font-medium text-[13px] flex flex-col items-center gap-3">
                       <Calendar className="w-8 h-8 opacity-30" />
                       No events nearby
                    </div>
                  ) : nearbyAlerts.length > 0 ? (
                    nearbyAlerts.slice(0, 10).map(alert => {
                      const typeObj = reportTypes.find(t => t.id === alert.category) || reportTypes.find(t => t.id === 'Other');
                      const IconComp = typeObj ? incidentIconMap[typeObj.iconName as keyof typeof incidentIconMap] : AlertTriangle;
                      return (
                        <div key={alert.id} onClick={() => navigate(`/incident/${alert.id}`)} className="w-full bg-black/20 rounded-2xl p-4 flex items-center justify-between border border-white/5 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all shrink-0 group">
                          <div className="flex items-center gap-4">
                            <div className={`w-[48px] h-[48px] rounded-full flex items-center justify-center flex-shrink-0 bg-white/10 border border-white/10 group-hover:scale-110 transition-transform`}>
                              <IconComp className={`w-5 h-5 text-white`} />
                            </div>
                            <div>
                              <h4 className="font-bold text-[16px] text-white leading-tight mb-1">{alert.category}</h4>
                              <p className="text-[13px] text-white/50 leading-tight truncate max-w-[140px]">{alert.description || "Nearby report"}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-[11px] text-white/40 font-medium">{formatTimeAgo(alert.created_at)}</span>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#ef4523] group-hover:text-white text-white/50 transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-white/40 font-medium text-[13px] flex flex-col items-center gap-3">
                       <Activity className="w-8 h-8 opacity-30" />
                       No active updates nearby
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SpatialMembrane>
      </CockpitLayout>

      {selectedIncident && (
        <IncidentDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </React.Fragment>
  );
};

export default MapView;
\n\nexport default MapView;
