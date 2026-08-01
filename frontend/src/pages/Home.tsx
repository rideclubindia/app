import React, { useEffect, useRef, useState } from 'react';
import { Bell, Navigation, Users, Plus, User, Flag, AlertTriangle, Calendar, Map, Flame, Trophy, ChevronRight, Activity, MapPin, ChevronDown, ArrowUp, Search, Sun, Crosshair, Cloud, CloudRain, CloudLightning, X, ChevronUp, Bike, Bookmark, Clock, Wind, LogOut } from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../lib/supabase';
import { getDeterministicUuid } from '../lib/user';
import lightLogo from '../assets/Logos/Logo for White Backgrounds 2.svg';
import { apiClient } from '../lib/apiClient';
import { useToast } from '../components/ToastContext';

const Home = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(true);
  const [weather, setWeather] = useState<{ temp: number, code: number, aqi: number } | null>(null);
  const { coordinates: userLocation, locationName } = useLocationStore();
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [currentNavigation, setCurrentNavigation] = useState<any>(null);
  const [currentUserUuid, setCurrentUserUuid] = useState<string | null>(null);
  const [rawUid, setRawUid] = useState<string | null>(null);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [showRidePopup, setShowRidePopup] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const resolveProfileId = async (uid: string) => {
    let u = getDeterministicUuid(uid);
    const { data } = await supabase.from('profiles').select('id').eq('id', u).single();
    return data ? data.id : null;
  };

  useEffect(() => {
    if (currentRide && currentRide.status === 'live') {
      setIsGroupMode(true);
    }
  }, [currentRide]);

  const handleToggleRideMode = () => {
    setIsGroupMode(!isGroupMode);
  };

  const handleEndGroupNavigation = async () => {
    if (!currentRide) return;
    await supabase.from('rides').update({ status: 'ended' }).eq('id', currentRide.id);
    showToast('Group navigation ended', 'success');
  };

  const handleExitGroupNavigation = async () => {
    if (!currentRide || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    await supabase.from('ride_members').delete().eq('ride_id', currentRide.id).eq('user_id', uid);
    await supabase.from('ride_locations').delete().eq('ride_id', currentRide.id).eq('user_id', uid);
    showToast('Left group navigation', 'info');
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setCurrentUserUuid(getDeterministicUuid(currentUser.uid));
        setRawUid(currentUser.uid);
      } else {
        setCurrentUserUuid(null);
        setRawUid(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUserUuid) return;
    
    const fetchCurrentRide = async () => {
      if (!rawUid) return;

      try {
        // Strategy 1: rides I directly own
        const { data: ownedRides, error: ownErr } = await supabase
          .from('rides')
          .select('*')
          .eq('owner_id', rawUid)
          .neq('status', 'ended');
          
        if (ownErr) console.error("Home fetch own rides error:", ownErr);

        // Strategy 2: rides I'm a member of (via ride_members)
        const userUuid = rawUid.length === 36 ? rawUid : getDeterministicUuid(rawUid);
        const { data: memberRows, error: memErr } = await supabase
          .from('ride_members')
          .select('ride_id, role')
          .eq('user_id', userUuid);
          
        if (memErr) console.error("Home fetch member rows error:", memErr);

        let joinedRides: any[] = [];
        if (memberRows && memberRows.length > 0) {
          const ids = memberRows.map((m: any) => m.ride_id);
          const { data, error: joinErr } = await supabase
            .from('rides')
            .select('*')
            .in('id', ids)
            .neq('status', 'ended');
          joinedRides = data || [];
          if (joinErr) console.error("Home fetch joined rides error:", joinErr);
        }

        // Merge + deduplicate by ride id
        const all = [...(ownedRides || []), ...joinedRides];
        const unique = Array.from(new globalThis.Map(all.map((r: any) => [r.id, r])).values());
        
        // Filter for active/scheduled (and hide scheduled rides older than 24 hours)
        const now = Date.now();
        const activeRides = unique
           .filter((r: any) => {
             if (r.status === 'live') return true;
             if (r.status === 'scheduled') {
               const rideTime = new Date(r.ride_date).getTime();
               return now - rideTime <= 24 * 60 * 60 * 1000;
             }
             return false;
           })
           .sort((a: any, b: any) => new Date(a.ride_date).getTime() - new Date(b.ride_date).getTime());
        
        if (activeRides.length > 0) {
           setCurrentRide(activeRides[0]);
        } else {
           setCurrentRide(null);
        }
      } catch (err) {
        console.error("fetchCurrentRide failed:", err);
      }

      // Fetch Active Navigation Session
      try {
        const { data: navSession } = await supabase
          .from('navigation_sessions')
          .select('*')
          .eq('user_id', getDeterministicUuid(rawUid!))
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (navSession) {
          setCurrentNavigation(navSession);
        } else {
          setCurrentNavigation(null);
        }
      } catch (err) {
        console.error("Home fetch nav session error:", err);
      }
    };
    
    if (rawUid || currentUserUuid) fetchCurrentRide();
    
    // Realtime: auto-refresh when rides table changes
    const sub = supabase.channel('home-ride-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => {
        if (rawUid) fetchCurrentRide();
      })
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, [currentUserUuid, rawUid]);

  // Helper to calculate distance
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Geocoding Autocomplete for Route Planner
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const delayFn = setTimeout(async () => {
        try {
          setIsSearching(true);
          let results: any[] = [];
          
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
    
    navigate('/route-planner', {
      state: {
        destLat: result.lat || result.latitude,
        destLng: result.lon || result.longitude,
        destName: (result.display_name || result.name).split(',')[0],
        isGroupMode: isGroupMode
      }
    });
  };

  const hasFetchedWeatherRef = useRef(false);

  useEffect(() => {
    const lat = userLocation?.lat || 17.3850;
    const lng = userLocation?.lng || 78.4867;

    // Update map when location changes
    if (map.current && userLocation) {
      map.current.jumpTo({ center: [lng, lat] });
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      }
      if (!hasFetchedWeatherRef.current) {
        hasFetchedWeatherRef.current = true;
        fetchWeather(lat, lng);
      }
    } else if (!map.current) {
      initMap(lng, lat);
      if (!hasFetchedWeatherRef.current) {
        hasFetchedWeatherRef.current = true;
        fetchWeather(lat, lng);
      }
    }

    async function fetchWeather(lat: number, lng: number) {
      try {
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`);
        const wData = await wRes.json();
        const aRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi`);
        const aData = await aRes.json();
        
        setWeather({
          temp: Math.round(wData.current.temperature_2m),
          code: wData.current.weather_code,
          aqi: Math.round(aData.current.us_aqi)
        });
      } catch (err) {
        console.error("Weather fetch failed", err);
      }
    }

    function initMap(lng: number, lat: number) {
      if (mapContainer.current && !map.current) {
        // Defer heavy map initialization to avoid blocking the main thread
        setTimeout(() => {
          if (!mapContainer.current) return;
          
          map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
            center: [lng, lat],
            zoom: 14,
            attributionControl: false,
            interactive: false // Keep it static in the background
          });

          // Force resize to ensure map fills the viewport correctly
          setTimeout(() => {
            map.current?.resize();
          }, 100);
          
          // Add user location marker
          const el = document.createElement('div');
          el.className = 'w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-white';
          el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4523" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="transform rotate-45"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>';
          markerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(map.current);
        }, 50);
      }
    }

    // Cleanup is not done per-render because we want the map to persist across renders
    return () => {
      // Intentionally empty so we don't unmount the map during userLocation updates
    };
  }, [userLocation]);

  useEffect(() => {
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const hasFetchedAlertsRef = useRef(false);

  // Fetch Alerts (extracted so it depends on currentUserUuid)
  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoadingUpdates(true);
      const processAlerts = async (data: any[]) => {
        setActiveAlertsCount(data?.length || 0);
        
        let lastViewed = 0;
        let viewedPinsMap = new window.Map();
        
        if (currentUserUuid) {
          const { data: profile } = await supabase.from('profiles').select('alerts_last_viewed').eq('id', currentUserUuid).single();
          if (profile && profile.alerts_last_viewed) {
             lastViewed = Number(profile.alerts_last_viewed);
          }
          
          const { data: views } = await supabase.from('alert_views').select('*').eq('user_id', currentUserUuid);
          if (views) {
            views.forEach(v => viewedPinsMap.set(v.pin_id, Number(v.viewed_at)));
          }
        }
        
        const hasUnread = data && data.length > 0 && new Date(data[0].created_at).getTime() > lastViewed;
        setHasUnreadAlerts(!!hasUnread);

        if (data) {
          const validData = data.filter((a: any) => {
            if (viewedPinsMap.has(a.id)) {
              const viewedAt = viewedPinsMap.get(a.id);
              if (Date.now() - viewedAt > 60 * 60 * 1000) return false;
            }
            return true;
          });
          setRecentAlerts(validData.slice(0, 3));
        }
      };

      const lat = userLocation?.lat || 17.3850;
      const lng = userLocation?.lng || 78.4867;

      try {
        const res = await apiClient.get(`/api/pins/nearby?lat=${lat}&lng=${lng}&radius_km=50`);
        await processAlerts(res.data || []);
      } catch (error) {
        // Fallback to supabase if backend is unavailable
        try {
          const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: supaPins } = await supabase.from('pins').select('*').eq('status', 'active').gte('created_at', last24Hours);
          const pins = supaPins || [];
          
          const turf = await import('@turf/turf');
          const userPt = turf.point([lng, lat]);
          const nearby = pins.filter((p: any) => {
            if (!p.latitude || !p.longitude) return false;
            const pt = turf.point([p.longitude, p.latitude]);
            return turf.distance(userPt, pt) <= 50;
          });
          await processAlerts(nearby);
        } catch {
          // silently handle fallback error
        }
      } finally {
        setIsLoadingUpdates(false);
      }
    };
    
    if (currentUserUuid && userLocation && !hasFetchedAlertsRef.current) {
      hasFetchedAlertsRef.current = true;
      fetchAlerts();
    }
  }, [currentUserUuid, userLocation]);

  useEffect(() => {
    if (showLocationPicker && currentUserUuid) {
      const fetchLocations = async () => {
        const { data } = await supabase.from('saved_locations').select('*').eq('user_id', currentUserUuid);
        if (data) setSavedLocations(data);
      };
      fetchLocations();
    }
  }, [showLocationPicker, currentUserUuid]);

  const handleJoinGroup = async () => {
    if (joinCode.trim().length > 0) {
      const { data: ride } = await supabase.from('rides').select('id').eq('ride_code', joinCode).single();
      if (ride) {
        navigate(`/group-ride-dashboard?ride_id=${ride.id}`);
        setShowJoinGroup(false);
      } else {
        showToast('Invalid Group Code', 'error');
      }
    }
  };

  const handleCreateGroup = () => {
    setShowJoinGroup(false);
    navigate('/map', { state: { isGroupMode: true } });
  };

  return (
    <div className="absolute inset-0 bg-[#F8F9FA] overflow-hidden font-sans">
      <Helmet>
        <title>Live Map & Navigation | Ride Club</title>
        <meta name="description" content="View the live map, track your friends, and get real-time hazard alerts." />
      </Helmet>
      
      {/* Fixed Map Background (Top 40%) */}
      <div className="absolute top-0 left-0 w-full h-[65vh] landscape:h-[100dvh] z-0 pointer-events-none">
         <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* Fixed Header (Location, Avatar, Search & Toggle) */}
      <div className="absolute top-0 left-0 right-0 landscape:right-[50%] landscape:w-auto z-30 pt-4 pointer-events-none flex flex-col gap-2">
         {/* Location & Avatar Header */}
         {/* Location Header */}
         <div className="px-4 flex items-center justify-between gap-2 mb-3 pointer-events-auto mt-2">
            <div 
              onClick={() => setShowLocationPicker(true)}
              className="bg-white/95 backdrop-blur-md rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-3 py-2 flex items-center gap-2 border border-white/50 cursor-pointer active:scale-95 transition-transform flex-1 min-w-0"
            >
              <div className="w-8 h-8 rounded-full bg-[#FFF0E6] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#ef4523]" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1 font-black text-[14px] text-[#14142B] leading-tight truncate">
                   <span className="truncate">Current Location</span> 
                   <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" strokeWidth={3} />
                </div>
                <div className="text-[11px] font-medium text-gray-500 truncate w-full">
                   {locationName || 'Fetching location...'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => navigate('/alerts')} className="relative w-10 h-10 bg-white/95 backdrop-blur-md rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center justify-center border border-white/50 active:scale-95 transition-transform">
                <Bell className="w-5 h-5 text-[#14142B]" />
                {hasUnreadAlerts && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ef4523] rounded-full border border-white"></span>}
              </button>
            </div>
         </div>

         {/* Search Bar & Toggle Row */}
         <div className="px-4 flex items-center gap-2 pointer-events-auto z-[60] relative">
             <div className="flex-1 bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center px-4 py-3.5 gap-3 border border-gray-100 transition-all">
                <Search className="w-5 h-5 text-[#ef4523]" strokeWidth={3} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isGroupMode ? 'Search routes (Group)...' : 'Search routes...'}
                  className="flex-1 bg-transparent border-none outline-none text-[15px] font-bold text-[#14142B] placeholder-gray-400 w-full"
                />
                
                {searchQuery.length > 0 && (
                  <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-gray-100 rounded-full">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
             </div>
             
             {/* Navigation Mode Toggle */}
             <div className="bg-white rounded-[16px] p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center border border-gray-100 relative">
                <button 
                  onClick={handleToggleRideMode}
                  className={`relative z-10 w-11 h-10 rounded-[12px] flex items-center justify-center transition-all duration-300 ${!isGroupMode ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <User className="w-5 h-5" strokeWidth={isGroupMode ? 2 : 2.5} />
                </button>
                <button 
                  onClick={handleToggleRideMode}
                  className={`relative z-10 w-11 h-10 rounded-[12px] flex items-center justify-center transition-all duration-300 ${isGroupMode ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Users className="w-5 h-5" strokeWidth={isGroupMode ? 2.5 : 2} />
                </button>
                {/* Active Slider */}
                <div 
                  className="absolute top-1.5 left-1.5 w-11 h-10 bg-[#ef4523] rounded-[12px] transition-transform duration-300 ease-in-out shadow-sm"
                  style={{ transform: `translateX(${isGroupMode ? '44px' : '0'})` }}
                />
             </div>
         </div>

         {/* Search Results Dropdown - OUTSIDE the search bar for proper z-index */}
         {searchQuery.length > 2 && (
           <div className="px-4 pointer-events-auto z-[60] relative">
             <div className="bg-white rounded-[24px] shadow-2xl overflow-hidden border border-gray-100 mt-2">
               {isSearching ? (
                 <div className="p-6 text-center text-gray-400 font-bold flex items-center justify-center gap-2">
                   <div className="w-4 h-4 border-2 border-gray-300 border-t-[#ef4523] rounded-full animate-spin"></div>
                   Searching...
                 </div>
               ) : searchResults.length > 0 ? (
                 <div className="max-h-[50vh] overflow-y-auto">
                   {searchResults.map((res: any, idx: number) => (
                     <div 
                       key={idx} 
                       onClick={() => selectSearchResult(res)}
                       className="p-4 border-b border-gray-50 flex items-start gap-4 hover:bg-gray-50 cursor-pointer transition-colors"
                     >
                       <div className="w-10 h-10 rounded-full bg-[#FFF0E6] flex items-center justify-center shrink-0 mt-1">
                         {res.isSavedLocation ? <Bookmark className="w-5 h-5 text-[#ef4523]" /> : <MapPin className="w-5 h-5 text-[#ef4523]" />}
                       </div>
                       <div className="flex-1 text-left">
                         <h4 className="font-bold text-[15px] text-[#273a5a] leading-tight mb-1">{res.display_name.split(',')[0]}</h4>
                         <p className="text-[13px] text-gray-500 line-clamp-2 leading-snug">{res.display_name.substring(res.display_name.indexOf(',') + 1).trim()}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="p-6 text-center text-gray-400 font-bold">No results found</div>
               )}
             </div>
           </div>
         )}

         {/* Moved Weather & AQI Widget Below Search - hidden when searching */}
         {weather && searchQuery.length <= 2 && (
           <div className="px-4 mt-3 pointer-events-auto z-30 relative">
             <div className="inline-flex bg-white/95 backdrop-blur-md rounded-[14px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] px-3 py-2 items-center gap-3 border border-white/50">
               <div className="flex items-center gap-1.5">
                 <Cloud className="w-4 h-4 text-gray-500" />
                 <span className="font-bold text-[13px] text-[#14142B]">{weather.temp}°C</span>
               </div>
               {weather.aqi !== undefined && (
                 <>
                   <div className="w-[1px] h-4 bg-gray-200"></div>
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">AQI</span>
                     <span className="font-black text-[13px] text-[#14142B] leading-none">{weather.aqi}</span>
                   </div>
                 </>
               )}
             </div>
           </div>
         )}
      </div>

      {/* Fixed Drawer Container at bottom 70% */}
      <div className="absolute bottom-0 left-0 right-0 h-[35vh] landscape:h-[100dvh] landscape:w-[50%] landscape:left-auto landscape:right-0 z-10 flex flex-col pointer-events-none justify-end">
        
        {/* Floating Live Activity Widget (Top of Drawer) */}
        {currentRide && (
          <div className="px-4 mb-4 shrink-0 pointer-events-auto z-50 animate-in slide-in-from-bottom-10 duration-500">
            <div 
              className="w-full bg-white/95 backdrop-blur-xl rounded-[28px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100/50 relative overflow-hidden"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {currentRide.status === 'live' ? (
                    <span className="flex items-center gap-1.5 bg-[#ef4523]/10 text-[#ef4523] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4523] animate-pulse"></span>
                      LIVE RIDE
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      SCHEDULED
                    </span>
                  )}
                </div>
                <img src={lightLogo} alt="Logo" className="h-3.5 opacity-40 grayscale" />
              </div>

              {/* Content Row */}
              <div onClick={() => navigate(`/ride-plus/live/${currentRide.id}`)} className="cursor-pointer group active:scale-[0.98] transition-transform">
                <h3 className="text-[#14142B] font-black text-[20px] leading-tight mb-1">
                  {currentRide.status === 'live' ? 'Next Stop' : 'Upcoming Ride'}
                </h3>
                <p className="text-gray-500 text-[13px] font-medium mb-4">
                  {currentRide.status === 'live' 
                    ? 'Arriving in 12 mins' 
                    : `Scheduled for ${new Date(currentRide.ride_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                  }
                </p>

                {/* Progress / Dotted Line Area */}
                {currentRide.status === 'live' ? (
                  <div className="relative h-10 flex items-center justify-between px-1 mb-3">
                    {/* Dotted background line */}
                    <div className="absolute left-1 right-1 h-[2px] border-b-2 border-dashed border-gray-200 top-1/2 -translate-y-1/2"></div>
                    
                    {/* Animated Bike moving across (fake progress) */}
                    <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-br from-[#ef4523] to-[#d83c1d] rounded-full shadow-[0_4px_12px_rgba(239,69,35,0.4)] flex items-center justify-center z-10">
                      <Bike className="w-4 h-4 text-white" />
                    </div>
                    
                    {/* Start dot */}
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 z-0 relative"></div>
                    {/* End icon */}
                    <div className="w-8 h-8 rounded-full bg-[#FFF0E6] flex items-center justify-center z-10 relative shadow-sm border border-white">
                      <MapPin className="w-4 h-4 text-[#ef4523]" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-gray-500 text-[13px] font-medium truncate pr-4">
                      {currentRide.name || currentRide.destination?.name || 'Waiting to start...'}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/ride-plus/live/${currentRide.id}`)}
                  className="flex-[2] bg-[#ef4523] text-white font-bold py-3 rounded-[16px] text-[13px] active:scale-95 transition-all shadow-[0_4px_12px_rgba(239,69,35,0.25)]"
                >
                  {currentRide.status === 'live' ? 'View Map' : 'Join Ride'}
                </button>
                <button 
                  onClick={() => navigate(`/group-ride-dashboard?ride_id=${currentRide.id}`)}
                  className="flex-1 bg-gray-50 text-gray-700 font-bold py-3 rounded-[16px] text-[13px] active:scale-95 transition-all border border-gray-100 flex items-center justify-center hover:bg-gray-100"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Main White Content Sheet */}
        <div className="w-full h-full bg-gradient-to-br from-orange-50 to-white relative rounded-t-[24px] landscape:rounded-t-none landscape:rounded-l-[24px] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)] landscape:shadow-[-10px_0_40px_rgba(0,0,0,0.1)] pointer-events-auto">
          
          {/* Decorative Top Line */}
          <div className="w-full flex justify-center pt-3 pb-3 shrink-0">
             <div className="w-10 h-1 bg-gray-200 rounded-full"></div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto hide-scrollbar">

          {/* Active Navigation (Embedded instead of Double Drawer) */}
          {currentNavigation && (
            <div className="px-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-[15px] text-[#14142B] tracking-wide">ACTIVE NAVIGATION</h3>
                <span className="bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse"></span>
                  LIVE
                </span>
              </div>

              <div 
                onClick={() => navigate('/navigation')}
                className="w-full bg-[#F8F9FA] rounded-[20px] p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform border border-gray-100 shadow-sm"
              >
                <div className="w-[46px] h-[46px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center shrink-0">
                  <Navigation className="w-5 h-5 text-[#3B82F6]" />
                </div>
                
                <div className="text-left flex-1 overflow-hidden">
                  <p className="text-[15px] font-extrabold text-[#273a5a] truncate leading-tight mb-1">
                    To {currentNavigation.dest_name || 'Destination'}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                    <span className="text-[#3B82F6]">Tap to resume</span>
                  </div>
                </div>
                
                <div className="shrink-0 bg-white w-7 h-7 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5 text-[#3B82F6]" strokeWidth={3} />
                </div>
              </div>
              {/* Group Navigation Controls */}
              {isGroupMode && currentRide && (
                <div className="flex gap-2 mt-2">
                  {currentRide.owner_id === auth.currentUser?.uid && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEndGroupNavigation(); }}
                      className="flex-1 bg-red-50 text-red-600 font-bold py-2.5 rounded-[14px] text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all border border-red-100"
                    >
                      <X className="w-4 h-4" /> End Group
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleExitGroupNavigation(); }}
                    className="flex-1 bg-gray-50 text-gray-700 font-bold py-2.5 rounded-[14px] text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all border border-gray-100"
                  >
                    <LogOut className="w-4 h-4" /> Exit
                  </button>
                </div>
              )}
            </div>
          )}



          {/* Circular Categories (Horizontal Scroll) */}
          <div className="flex gap-5 overflow-x-auto hide-scrollbar px-6 mb-6">
            <div onClick={() => navigate('/my-rides')} className="flex flex-col items-center gap-2 cursor-pointer shrink-0 group">
              <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#FFF0E6] to-[#FFE0CC] shadow-sm flex items-center justify-center border-2 border-white group-active:scale-95 transition-all">
                <Navigation className="w-7 h-7 text-[#ef4523]" strokeWidth={2} />
              </div>
              <span className="text-[12px] font-bold text-[#14142B] text-center leading-tight">All<br/>Routes</span>
            </div>
            
            <div onClick={() => navigate('/my-incidents')} className="flex flex-col items-center gap-2 cursor-pointer shrink-0 group">
              <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2] shadow-sm flex items-center justify-center border-2 border-white group-active:scale-95 transition-all">
                <AlertTriangle className="w-7 h-7 text-[#EF4444]" strokeWidth={2} />
              </div>
              <span className="text-[12px] font-bold text-[#14142B] text-center leading-tight">Police /<br/>Hazards</span>
            </div>

            <div onClick={() => navigate('/saved-locations')} className="flex flex-col items-center gap-2 cursor-pointer shrink-0 group">
              <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#F5F8FF] to-[#DBEAFE] shadow-sm flex items-center justify-center border-2 border-white group-active:scale-95 transition-all">
                <Bookmark className="w-7 h-7 text-[#3B82F6]" strokeWidth={2} />
              </div>
              <span className="text-[12px] font-bold text-[#14142B] text-center leading-tight">Saved<br/>Places</span>
            </div>

            <div onClick={() => navigate('/ride-history')} className="flex flex-col items-center gap-2 cursor-pointer shrink-0 group">
              <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] shadow-sm flex items-center justify-center border-2 border-white group-active:scale-95 transition-all">
                <Clock className="w-7 h-7 text-[#F59E0B]" strokeWidth={2} />
              </div>
              <span className="text-[12px] font-bold text-[#14142B] text-center leading-tight">Recent<br/>History</span>
            </div>
          </div>

          <div className="w-full h-[1px] bg-gray-100 mb-4"></div>

          </div>
        </div>
      </div>

      {/* Ride Details Popup */}
      {showRidePopup && currentRide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowRidePopup(false)} 
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/30 hover:bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-full h-[160px] bg-gray-200 relative">
              <img src={(currentRide.image_url && !currentRide.image_url.includes('blob:')) ? currentRide.image_url : "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80"} alt="Ride cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${currentRide.status === 'live' ? 'bg-[#ef4523] text-white' : 'bg-white text-[#273a5a]'}`}>
                  {currentRide.status}
                </span>
                <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white border border-white/20">
                  ID: {currentRide.ride_code}
                </span>
              </div>
              
              <div className="absolute bottom-4 left-5 right-5">
                <h3 className="text-white font-bold text-[24px] drop-shadow-md mb-0.5 truncate leading-tight">{currentRide.name}</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#FFF0E6] flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-[#ef4523]" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-0.5">Destination</p>
                  <p className="text-[15px] font-bold text-[#273a5a] truncate">{currentRide.destination?.name || 'Unknown Location'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#F2F2F7] flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-[#8A8A8E]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-0.5">Schedule</p>
                  <p className="text-[15px] font-bold text-[#273a5a]">{new Date(currentRide.ride_date).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-3">
                {currentRide.owner_id === rawUid && (
                  <button
                    onClick={() => { setShowRidePopup(false); navigate(`/group-ride-dashboard?ride_id=${currentRide.id}`); }}
                    className="flex-1 bg-[#F2F2F7] text-[#273a5a] hover:bg-gray-200 font-bold py-4 rounded-2xl text-[14px] flex justify-center items-center gap-2 active:scale-95 transition-all"
                  >
                    Dashboard
                  </button>
                )}
                <button
                  onClick={() => { setShowRidePopup(false); navigate(`/ride-plus/live/${currentRide.id}`); }}
                  className="flex-[2] bg-[#ef4523] text-white hover:bg-[#d83c1d] font-bold py-4 rounded-2xl text-[14px] flex justify-center items-center gap-2 shadow-[0_8px_20px_rgba(239,69,35,0.25)] active:scale-95 transition-all"
                >
                  Go to Live Ride <ChevronRight className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white w-full rounded-t-[32px] p-6 pb-28 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[20px] text-[#14142B]">Select Location</h3>
              <button onClick={() => setShowLocationPicker(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-[50vh] overflow-y-auto hide-scrollbar">
              {savedLocations.length > 0 ? savedLocations.map(loc => (
                <div 
                  key={loc.id} 
                  onClick={() => {
                    useLocationStore.setState({ coordinates: { lat: loc.latitude, lng: loc.longitude }, locationName: loc.address || loc.name });
                    setShowLocationPicker(false);
                  }}
                  className="flex items-center gap-4 p-3 rounded-[16px] hover:bg-gray-50 cursor-pointer border border-gray-100 active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F5F8FF] flex items-center justify-center shrink-0">
                    <Bookmark className="w-5 h-5 text-[#3B82F6]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[15px] text-[#14142B]">{loc.name}</h4>
                    <p className="text-[12px] text-gray-500 line-clamp-1">{loc.address}</p>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center text-gray-400 font-medium text-[14px]">
                  No saved locations found.<br/>Go to Saved Places to add some.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinGroup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm pointer-events-auto pb-24">
          <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[18px] text-[#14142B]">Join Group Navigation</h3>
              <button onClick={() => setShowJoinGroup(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <p className="text-[14px] text-gray-500 font-medium mb-6">
              Enter a group code to start tracking with your friends on a shared map.
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
              <input 
                type="text" 
                placeholder="Enter Code (e.g. A1B2C3)" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full bg-transparent outline-none font-black text-center text-[24px] tracking-widest text-[#273a5a] placeholder-gray-300 uppercase"
                maxLength={6}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleJoinGroup}
                disabled={joinCode.length < 3}
                className={`w-full py-4 rounded-2xl font-black text-[15px] transition-all flex items-center justify-center gap-2 ${
                  joinCode.length >= 3 
                    ? 'bg-[#ef4523] text-white shadow-[0_8px_20px_rgba(239,69,35,0.25)] hover:bg-[#d83c1d] active:scale-95' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Join & Start Tracking
              </button>

              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-[1px] bg-gray-100"></div>
                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">OR</span>
                <div className="flex-1 h-[1px] bg-gray-100"></div>
              </div>

              <button 
                onClick={handleCreateGroup}
                className="w-full py-4 rounded-2xl font-black text-[15px] transition-all flex items-center justify-center gap-2 bg-[#F2F2F7] text-[#14142B] hover:bg-[#E5E5EA] active:scale-95"
              >
                <Plus className="w-5 h-5 text-[#ef4523]" /> Start New Group Navigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
