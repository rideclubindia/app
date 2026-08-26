import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Navigation2, ThumbsUp, ThumbsDown, ShieldCheck, MapPin, AlertTriangle, Clock, Layers, Compass, Crosshair } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLocationStore } from '../store/useLocationStore';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastContext';
import { LeftNavigationRail } from '../components/LeftNavigationRail';
import { useIncidentCategories, incidentIconMap } from '../hooks/useIncidentCategories';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getDeterministicUuid, isWithinHours } from '../lib/user';


const IncidentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [pin, setPin] = useState<any>(null);
  const [trustScore, setTrustScore] = useState<number>(100);
  const [voteStats, setVoteStats] = useState({ confirms: 0, falses: 0 });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<'confirm' | 'fake' | null>(null);
  
  const [loading, setLoading] = useState(true);
  const userLoc = useLocationStore((state) => state.coordinates);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const { categories: reportTypes } = useIncidentCategories();

  // Map control states (same as /ride-plus/live)
  const [showTraffic, setShowTraffic] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUserId(u ? u.uid : null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchIncident = async () => {
      if (!id) return;
      // Dev-only mock for visual iteration without auth/data
      if (import.meta.env.DEV && id === 'dev-mock') {
        setPin({
          id: 'dev-mock',
          category: 'Accident',
          description: 'Two vehicles collided at the junction. Traffic is moving slowly on one side. Drive careful while passing this stretch.',
          reporter_name: 'Harsha',
          created_at: new Date(Date.now() - 25 * 60000).toISOString(),
          latitude: 17.3616,
          longitude: 78.4747,
          photo_url: null
        });
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.from('pins').select('*').eq('id', id).single();
        if (error) throw error;
        if (data) {
          setPin(data);
          if (currentUserId) {
            supabase.from('alert_views').upsert({
              pin_id: id,
              user_id: getDeterministicUuid(currentUserId),
              viewed_at: Date.now()
            }, { onConflict: 'pin_id, user_id' }).then();
          }
        }

        // Fetch confirmations for trust score
        const { data: confData, error: confError } = await supabase
          .from('confirmations')
          .select('is_false, user_id')
          .eq('pin_id', id);

        if (!confError && confData) {
          let confirms = 0;
          let falses = 0;
          confData.forEach(c => {
            if (c.is_false) falses++;
            else confirms++;

            if (currentUserId && c.user_id === getDeterministicUuid(currentUserId)) {
              setUserVote(c.is_false ? 'fake' : 'confirm');
            }
          });
          setVoteStats({ confirms, falses });
          const total = confirms + falses;
          if (total === 0) setTrustScore(100);
          else setTrustScore(Math.max(0, Math.floor((confirms / total) * 100)));
        }

      } catch (err) {
        showToast('Failed to load incident details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchIncident();
  }, [id, showToast, currentUserId]);

  

  useEffect(() => {
    if (loading || !pin || !mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [pin.longitude, pin.latitude],
      zoom: 15,
      attributionControl: false
    });

    // Category icon marker with pulsing ring
    const cat = reportTypes.find(t => t.id === pin.category) || reportTypes[7];
    const IconComp = cat ? incidentIconMap[cat.iconName] : AlertTriangle;

    const el = document.createElement('div');
    const root = createRoot(el);
    root.render(
      <div className="relative flex flex-col items-center">
        <div className="absolute -top-1 w-14 h-14 rounded-full animate-ping bg-red-500/20" />
        <div className="relative flex flex-col items-center drop-shadow-lg">
          <div className="w-11 h-11 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center bg-white">
            <IconComp className={`w-5 h-5 ${cat?.color || 'text-red-500'}`} />
          </div>
          <div className="w-2.5 h-2.5 bg-white rotate-45 -mt-1.5 rounded-[2px] shadow-sm"></div>
        </div>
      </div>
    );

    new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([pin.longitude, pin.latitude])
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [loading, pin, reportTypes]);

  // Traffic Layer logic (same as /ride-plus/live)
  useEffect(() => {
    if (!map.current || loading || !pin) return;
    const updateTraffic = () => {
      if (!map.current || !map.current.isStyleLoaded()) return;
      try {
        if (showTraffic) {
          if (!map.current.getSource('tomtom-traffic')) {
            map.current.addSource('tomtom-traffic', {
              type: 'raster',
              tiles: [`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=GkjXLzDVKuB5KI8iXmBBYKVtYTDu6LhJ`],
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
        } else {
          if (map.current.getLayer('tomtom-traffic-layer')) map.current.removeLayer('tomtom-traffic-layer');
        }
      } catch (e) { console.warn('Traffic error:', e); }
    };
    updateTraffic();
    map.current.on('styledata', updateTraffic);
    return () => { map.current?.off('styledata', updateTraffic); }
  }, [loading, pin, showTraffic]);

  // Map control handlers (same as /ride-plus/live)
  const handle3D = () => {
    if (!map.current) return;
    const next3D = !is3D;
    if (next3D) {
      map.current.easeTo({ pitch: 60, zoom: 16.5, duration: 1000 });
    } else {
      map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
    }
    setIs3D(next3D);
  };

  const handleFollow = () => {
    if (!map.current) return;
    setIsFollowingUser(true);
    const fly = (lat: number, lng: number) => {
      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        el.style.cssText = 'width:18px;height:18px;background:#007BFF;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(0,123,255,0.2);';
        userMarkerRef.current = new maplibregl.Marker(el).setLngLat([lng, lat]).addTo(map.current!);
      } else {
        userMarkerRef.current.setLngLat([lng, lat]);
      }
      map.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
    };
    if (userLoc) {
      fly(userLoc.lat, userLoc.lng);
    } else {
      useLocationStore.getState().fetchLocationOnce().then(loc => fly(loc.lat, loc.lng)).catch(() => {
        showToast('Unable to get your location.', 'error');
      });
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} d ago`;
  };

  const handleVote = async (isFalse: boolean) => {
    if (!id || !currentUserId) return;
    if (isFalse && pin && !isWithinHours(pin.created_at, 1)) {
      showToast('Fake reporting period has expired.', 'error');
      return;
    }
    if (userVote !== null) {
      showToast('You have already voted on this incident', 'info');
      return;
    }

    try {
      const { error } = await supabase.from('confirmations').insert({
        pin_id: id,
        user_id: getDeterministicUuid(currentUserId),
        is_false: isFalse
      });
      if (error) {
        if (error.code === '23505') {
          showToast('You have already voted on this incident', 'info');
        } else {
          throw error;
        }
      } else {
        setUserVote(isFalse ? 'fake' : 'confirm');
        setVoteStats(prev => ({
          confirms: isFalse ? prev.confirms : prev.confirms + 1,
          falses: isFalse ? prev.falses + 1 : prev.falses
        }));
        showToast('Vote recorded successfully', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to record vote', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Ride Club Incident',
        text: `Check out this incident report: ${pin?.category}`,
        url: window.location.href,
      }).catch(err => console.log('Error sharing', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard', 'success');
    }
  };
  if (loading) {
    return (
      <div className="w-full h-full bg-white flex flex-col font-sans relative">
        <div className="w-full h-[220px] bg-gray-200 animate-pulse flex-shrink-0" />
        <div className="flex-1 bg-white rounded-t-lg -mt-[24px] z-20 relative px-6 pt-8">
           <div className="h-6 w-24 bg-gray-200 rounded mb-4 animate-pulse"></div>
           <div className="h-10 w-full bg-gray-200 rounded mb-4 animate-pulse"></div>
           <div className="h-10 w-3/4 bg-gray-200 rounded mb-4 animate-pulse"></div>
           <div className="flex items-center gap-4 mb-6">
             <div className="w-11 h-11 bg-gray-200 rounded-full animate-pulse"></div>
             <div className="flex-1">
               <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
               <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (!pin) {
    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center font-sans p-6">
        <AlertTriangle className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-dark">Incident Not Found</h2>
        <p className="text-gray-500 text-center mt-2 mb-6">This report may have been removed or resolved.</p>
        <button onClick={() => navigate(-1)} className="bg-primary text-white font-semibold py-3 px-6 rounded-full">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white flex flex-col landscape:flex-row font-sans relative">

      {/* Side Navigation Rail (landscape only) */}
      <div className="hidden landscape:flex h-full shrink-0">
        <LeftNavigationRail />
      </div>

      {/* Hero Map (Takes remaining height/width) */}
      <div className="w-full flex-1 relative flex-shrink-0 landscape:order-2">
        <div className="absolute inset-0 z-0">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#273a5a]/40 via-transparent to-transparent z-10 pointer-events-none"></div>

        {/* Floating Header Controls */}
        <div className="absolute portrait:top-12 landscape:top-4 left-0 right-0 px-4 z-20 flex justify-between items-center pointer-events-none">
          <button onClick={() => navigate(-1)} className="pointer-events-auto w-[44px] h-[44px] bg-white shadow-md rounded-full flex items-center justify-center text-[#273a5a] hover:bg-gray-50 transition-colors border border-gray-100">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={handleShare} className="pointer-events-auto w-[44px] h-[44px] bg-white shadow-md rounded-full flex items-center justify-center text-[#273a5a] hover:bg-gray-50 transition-colors border border-gray-100">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Map Controls (same as /ride-plus/live) */}
        {!loading && pin && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
            <button
              onClick={() => setShowTraffic(!showTraffic)}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all duration-300 ${showTraffic ? 'bg-[#FF5A00] text-white shadow-[0_4px_16px_rgba(255,90,0,0.4)]' : 'bg-white/95 backdrop-blur border border-gray-100 text-[#111111] hover:bg-gray-50'}`}
              title="Toggle Traffic"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={handle3D}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all duration-300 ${is3D ? 'bg-[#FF5A00] text-white shadow-[0_4px_16px_rgba(255,90,0,0.4)]' : 'bg-white/95 backdrop-blur border border-gray-100 text-[#111111] hover:bg-gray-50'}`}
              title="3D View"
            >
              {is3D ? <Compass className="w-4 h-4" /> : <Navigation2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleFollow}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all duration-300 ${isFollowingUser ? 'bg-[#FF5A00] text-white shadow-[0_4px_16px_rgba(255,90,0,0.4)]' : 'bg-white/95 backdrop-blur border border-gray-100 text-[#111111] hover:bg-gray-50'}`}
              title="My Location"
              aria-label="My Location"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Incident Details - side panel in landscape, bottom sheet in portrait */}
      <div className="bg-[#F7F8FA] rounded-t-lg -mt-[24px] z-20 relative portrait:px-5 portrait:pt-7 portrait:pb-[108px] landscape:order-1 landscape:w-[360px] landscape:h-full landscape:mt-0 landscape:rounded-none landscape:border-r landscape:border-gray-200 landscape:overflow-y-auto hide-scrollbar landscape:px-4 landscape:pt-4 landscape:pb-[104px] flex-shrink-0">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full border-2 border-white shadow-md flex items-center justify-center shrink-0 bg-white">
              {(() => {
                const cat = reportTypes.find(t => t.id === pin.category) || reportTypes[7];
                const IconComponent = cat ? incidentIconMap[cat.iconName] : AlertTriangle;
                return <IconComponent className={`w-4 h-4 ${cat?.color || 'text-red-500'}`} />;
              })()}
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {pin.category || 'Incident'}
            </span>
          </div>
          <span className="text-gray-400 text-[11px] font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatTimeAgo(pin.created_at)}
          </span>
        </div>

        <h1 className="text-[22px] font-bold text-[#111111] leading-tight tracking-tight">{pin.category} Reported</h1>
        <p className="text-[12px] text-gray-400 font-medium flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5" /> Nearby
        </p>

        {/* Reporter + Trust Card */}
        <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-3.5 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#FFF0E6] flex items-center justify-center shrink-0 border border-[#FF5A00]/10">
              <span className="text-[#FF5A00] font-bold text-[15px]">{pin.reporter_name ? pin.reporter_name.charAt(0).toUpperCase() : 'C'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#111111] flex items-center gap-1 truncate">
                {pin.reporter_name || 'Community Member'} <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
              </p>
              <p className="text-[11px] text-gray-400 font-medium">Reported {formatTimeAgo(pin.created_at)}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trust Score</span>
              <span className="text-[13px] font-bold text-success tabular-nums">{trustScore}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${trustScore >= 70 ? 'bg-gradient-to-r from-[#FF5A00] to-success' : trustScore >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${trustScore}%` }}
              />
            </div>
            <div className="flex gap-2 mt-2.5">
              <span className="flex-1 text-center bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1.5 rounded-lg uppercase tracking-wider">{voteStats.confirms} Confirmed</span>
              <span className="flex-1 text-center bg-red-50 text-red-500 text-[10px] font-bold px-2 py-1.5 rounded-lg uppercase tracking-wider">{voteStats.falses} Rejected</span>
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-3.5 mt-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</span>
          <p className="text-[13px] text-gray-600 leading-relaxed mt-1.5">
            {pin.description || "No additional description provided by the reporter."}
          </p>
        </div>

        {pin.photo_url && (
          <div className="mt-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Photos</span>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar mt-2 pb-1 snap-x">
              {pin.photo_url.split(',').map((url: string, idx: number) => (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 snap-start">
                  <img src={url} alt={`Incident Photo ${idx + 1}`} className="w-[96px] h-[96px] object-cover rounded-[8px] border border-gray-200 shadow-sm" />
                </a>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Action Bar (H:88px) - panel width in landscape */}
      <div className="absolute bottom-0 w-full landscape:left-[56px] landscape:w-[360px] h-[88px] bg-white border-t border-gray-200 flex items-center justify-between px-3 sm:px-4 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] gap-2 sm:gap-3">
        
        <div className="flex gap-2 flex-1">
          {userVote !== null ? (
            <div className={`flex-1 h-[46px] rounded-xl flex items-center justify-center font-semibold text-[13px] ${
              userVote === 'confirm'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              ✓ You {userVote === 'confirm' ? 'confirmed' : 'reported fake'}
            </div>
          ) : (
            <>
              <button onClick={() => handleVote(false)} disabled={userVote !== null} className="flex-1 h-[46px] px-2 rounded-xl bg-white border border-gray-200 hover:border-success/40 hover:bg-green-50 text-gray-600 hover:text-success flex items-center justify-center gap-1.5 font-semibold text-[13px] transition-colors shadow-sm">
                <ThumbsUp className="w-4 h-4" />
                Yes
              </button>
              <button onClick={() => handleVote(true)} disabled={userVote !== null} className="flex-1 h-[46px] px-2 rounded-xl bg-white border border-gray-200 hover:border-danger/40 hover:bg-red-50 text-gray-600 hover:text-danger flex items-center justify-center gap-1.5 font-semibold text-[13px] transition-colors shadow-sm">
                <ThumbsDown className="w-4 h-4" />
                No
              </button>
            </>
          )}
        </div>

        <button 
          onClick={() => {
            navigate('/route-planner', { 
              state: { 
                destLat: pin.latitude, 
                destLng: pin.longitude, 
                destName: `${pin.category} Reported Location`,
                originLat: userLoc?.lat,
                originLng: userLoc?.lng
              } 
            });
          }}
          className="whitespace-nowrap flex-shrink-0 h-[46px] px-4 sm:px-5 rounded-xl bg-[#FF5A00] hover:bg-[#ff6a1a] text-white flex items-center justify-center gap-1.5 text-[13px] font-semibold shadow-lg shadow-[#FF5A00]/25 active:scale-95 transition-all">
          <Navigation2 className="w-4 h-4 shrink-0" />
          <span>Navigate Here</span>
        </button>

      </div>

    </div>
  );
};

export default IncidentDetail;
