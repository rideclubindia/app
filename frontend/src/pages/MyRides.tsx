import React, { useEffect, useState } from 'react';
import { ArrowLeft, Navigation2, Activity, MapPin, Calendar, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';
import { CockpitLayout } from '../components/spatial/CockpitLayout';
import { SpatialMembrane } from '../components/spatial/SpatialMembrane';
import { LeftGravityWell } from '../components/spatial/LeftGravityWell';

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const getDeterministicUuid = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0');
  return `00000000-0000-0000-0000-${hex}`;
};

const MyRides = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async (uid: string) => {
      const userUuid = getDeterministicUuid(uid);
      try {
        const { data: navSessions } = await supabase.from('navigation_sessions').select('*').eq('user_id', userUuid).order('created_at', { ascending: false });
        
        const formatted = (navSessions || []).map(n => {
          let distanceStr = 'Unknown distance';
          if (n.origin_lat && n.origin_lng && n.dest_lat && n.dest_lng) {
            const dist = getDistanceKm(n.origin_lat, n.origin_lng, n.dest_lat, n.dest_lng);
            distanceStr = `${dist.toFixed(1)} km`;
          }
          
          return {
            id: n.id,
            title: `Navigated to ${n.dest_name || 'Destination'}`,
            status: n.status,
            distance: distanceStr,
            time: n.created_at
          };
        });
        
        setHistory(formatted);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        fetchHistory(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <CockpitLayout
      mapChildren={
        <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
          <div className="absolute w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] -top-[300px] -right-[200px]"></div>
          <div className="absolute w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -bottom-[300px] -left-[100px]"></div>
        </div>
      }
    >
      <Helmet>
        <title>My Rides | Ride Club</title>
      </Helmet>

      <SpatialMembrane position="left" className="w-[420px] p-5 flex flex-col gap-6 max-h-[100dvh]">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 mb-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/profile')} 
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-[20px] font-bold text-white tracking-tight leading-none">My Navigations</h1>
              <p className="text-[13px] text-white/50 mt-1">Your recent trips</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-4 pb-8">
          {loading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-full h-24 bg-white/5 rounded-[20px] animate-pulse border border-white/10"></div>
              ))}
            </>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
              <div className="w-20 h-20 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mb-6">
                <Navigation2 className="w-10 h-10 text-blue-400" strokeWidth={2} />
              </div>
              <h3 className="text-[20px] font-bold text-white mb-2 tracking-tight">No Navigations Yet</h3>
              <p className="text-[14px] text-white/50 max-w-[250px]">Your navigation history will appear here once you start taking trips.</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-[20px] p-4 flex gap-4 backdrop-blur-md hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Navigation2 className="w-5 h-5 text-blue-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-white leading-tight truncate mb-2">{item.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-md text-white/60 text-[10px] font-bold uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.time).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-md text-white/60 text-[10px] font-bold uppercase tracking-wider">
                      <MapPin className="w-3 h-3" />
                      {item.distance}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    {item.status === 'completed' && <span className="flex items-center gap-1 text-green-400 text-[11px] font-bold uppercase tracking-wider"><Activity className="w-3 h-3" /> Completed</span>}
                    {item.status === 'active' && <span className="flex items-center gap-1 text-blue-400 text-[11px] font-bold uppercase tracking-wider"><Activity className="w-3 h-3 animate-pulse" /> Active</span>}
                    {item.status === 'cancelled' && <span className="flex items-center gap-1 text-red-400 text-[11px] font-bold uppercase tracking-wider"><Activity className="w-3 h-3" /> Cancelled</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SpatialMembrane>
    </CockpitLayout>
  );
};

export default MyRides;
