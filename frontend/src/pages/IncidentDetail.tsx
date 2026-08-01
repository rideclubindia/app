import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Navigation2, ThumbsUp, ThumbsDown, ShieldCheck, MapPin, AlertTriangle } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLocationStore } from '../store/useLocationStore';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastContext';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUserId(u ? u.uid : null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchIncident = async () => {
      if (!id) return;
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
      interactive: false,
      attributionControl: false
    });

    const el = document.createElement('div');
    el.className = 'w-10 h-10 bg-danger/20 rounded-full flex items-center justify-center animate-pulse';
    const inner = document.createElement('div');
    inner.className = 'w-4 h-4 bg-danger rounded-full shadow-[0_0_10px_rgba(255,0,0,0.8)]';
    el.appendChild(inner);

    new maplibregl.Marker({ element: el })
      .setLngLat([pin.longitude, pin.latitude])
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [loading, pin]);

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
        <h2 className="text-xl font-bold text-dark">Incident Not Found</h2>
        <p className="text-gray-500 text-center mt-2 mb-6">This report may have been removed or resolved.</p>
        <button onClick={() => navigate(-1)} className="bg-primary text-white font-bold py-3 px-6 rounded-full">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans relative">
      
      {/* Hero Map (Takes remaining height) */}
      <div className="w-full flex-1 relative flex-shrink-0">
        <div className="absolute inset-0 z-0">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#273a5a]/40 via-transparent to-transparent z-10 pointer-events-none"></div>
        
        {/* Floating Header Controls */}
        <div className="absolute top-12 left-0 right-0 px-4 z-20 flex justify-between items-center pointer-events-none">
          <button onClick={() => navigate(-1)} className="pointer-events-auto w-[44px] h-[44px] bg-white shadow-md rounded-full flex items-center justify-center text-[#273a5a] hover:bg-gray-50 transition-colors border border-gray-100">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={handleShare} className="pointer-events-auto w-[44px] h-[44px] bg-white shadow-md rounded-full flex items-center justify-center text-[#273a5a] hover:bg-gray-50 transition-colors border border-gray-100">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Incident Card Overlapping Hero (R:24px) */}
      <div className="bg-white rounded-t-lg -mt-[24px] z-20 relative px-6 pt-8 pb-[108px] flex-shrink-0">
        
        <div className="flex items-center gap-10 mb-2">
          <span className="bg-danger/10 text-danger text-[12px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {pin.category || 'Incident'}
          </span>
          {/* Mock distance for now, normally would compute from userLocation */}
          <span className="text-gray-400 text-[13px] font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Nearby
          </span>
        </div>
        
        <h1 className="text-[28px] font-bold text-dark leading-tight">{pin.category} Reported</h1>
        
        <div className="mt-6 flex items-center justify-between border-b border-gray-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-[44px] h-[44px] rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
              <span className="text-gray-500 font-bold text-sm">{pin.reporter_name ? pin.reporter_name.charAt(0).toUpperCase() : 'CM'}</span>
            </div>
            <div>
              <p className="text-[14px] font-bold text-dark flex items-center gap-1">
                {pin.reporter_name || 'Community Member'} <ShieldCheck className="w-4 h-4 text-success" />
              </p>
              <p className="text-[12px] text-gray-500">Reported {formatTimeAgo(pin.created_at)}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-[20px] font-bold text-success leading-none">{trustScore}%</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mt-1">Trust Score</p>
            <div className="flex gap-2 mt-1.5 text-[11px] font-medium text-gray-500">
              <span className="text-success">{voteStats.confirms} Confirmed</span>
              <span className="text-danger">{voteStats.falses} Rejected</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-[16px] font-bold text-dark mb-2">Description</h3>
          <p className="text-[16px] text-gray-600 leading-relaxed">
            {pin.description || "No additional description provided by the reporter."}
          </p>
        </div>

        {pin.photo_url && (
          <div className="mt-6">
            <h3 className="text-[16px] font-bold text-dark mb-3">Photos</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              {pin.photo_url.split(',').map((url: string, idx: number) => (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 snap-start">
                  <img src={url} alt={`Incident Photo ${idx + 1}`} className="w-[140px] h-[140px] object-cover rounded-lg border border-gray-200 shadow-sm" />
                </a>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Action Bar (H:88px) */}
      <div className="absolute bottom-0 w-full h-[88px] bg-white border-t border-gray-100 flex items-center justify-between px-3 sm:px-6 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] gap-2 sm:gap-4">
        
        <div className="flex gap-2 flex-1">
          {userVote !== null ? (
            <div className={`flex-1 h-[48px] rounded-lg flex items-center justify-center font-bold text-[15px] ${
              userVote === 'confirm'
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-red-100 text-red-700 border-2 border-red-300'
            }`}>
              ✓ You {userVote === 'confirm' ? 'confirmed' : 'reported fake'}
            </div>
          ) : (
            <>
              <button onClick={() => handleVote(false)} disabled={userVote !== null} className="flex-1 h-[48px] px-2 sm:px-5 rounded-lg bg-gray-50 hover:bg-success/10 text-gray-600 hover:text-success flex items-center justify-center gap-1.5 sm:gap-2 font-bold transition-colors">
                <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
                Yes
              </button>
              <button onClick={() => handleVote(true)} disabled={userVote !== null} className="flex-1 h-[48px] px-2 sm:px-5 rounded-lg bg-gray-50 hover:bg-danger/10 text-gray-600 hover:text-danger flex items-center justify-center gap-1.5 sm:gap-2 font-bold transition-colors">
                <ThumbsDown className="w-4 h-4 sm:w-5 sm:h-5" />
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
          className="whitespace-nowrap flex-shrink-0 h-[48px] px-3 sm:px-6 rounded-lg bg-primary hover:bg-[#ef4523] text-white flex items-center justify-center gap-1.5 sm:gap-2 text-[14px] sm:text-base font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all">
          <Navigation2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>Navigate Here</span>
        </button>

      </div>

    </div>
  );
};

export default IncidentDetail;
