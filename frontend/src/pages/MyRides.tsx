import React, { useEffect, useState } from 'react';
import { ChevronLeft, MapPin, Navigation2, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';

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
    <div className="w-full h-full bg-[#F2F4F7] flex flex-col font-sans overflow-hidden">
      <Helmet>
        <title>My Rides | Ride Club</title>
      </Helmet>
      
      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-4 bg-white shadow-sm flex items-center shrink-0 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center -ml-2 text-[#273a5a] hover:bg-gray-100 rounded-full transition-colors active:scale-95">
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-sm">
            <Navigation2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-[20px] font-bold text-[#273a5a] tracking-tight">My Navigations</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6 pb-[100px]">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-[100px] bg-white rounded-2xl animate-pulse shadow-sm border border-gray-100"></div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-[20px] font-bold text-[#273a5a] mb-2">No Navigations Yet</h2>
            <p className="text-[15px] text-[#8A8A8E] max-w-[250px]">Your navigation history will appear here once you start taking trips.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                <div className="w-[48px] h-[48px] rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Navigation2 className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-[16px] font-bold text-[#273a5a] leading-tight mb-1">{item.title}</h3>
                  <div className="flex items-center gap-3 text-[13px] font-medium text-[#8A8A8E]">
                    <span>{new Date(item.time).toLocaleDateString()}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{item.distance}</span>
                  </div>
                </div>
                <div className="pt-1">
                  {item.status === 'completed' && <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[11px] font-bold rounded-full uppercase tracking-wider">Completed</span>}
                  {item.status === 'active' && <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-full uppercase tracking-wider">Active</span>}
                  {item.status === 'cancelled' && <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[11px] font-bold rounded-full uppercase tracking-wider">Cancelled</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRides;
