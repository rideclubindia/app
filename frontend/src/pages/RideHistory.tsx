import React, { useEffect, useState } from 'react';
import { ChevronLeft, Car, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';

const RideHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async (uid: string) => {
      try {
        // Strategy 1: rides I directly own
        const { data: ownedRides } = await supabase
          .from('rides')
          .select('*')
          .eq('owner_id', uid)
          .order('created_at', { ascending: false });

        // Strategy 2: rides I'm a member of
        const { data: memberRows } = await supabase
          .from('ride_members')
          .select('ride_id, role')
          .eq('user_id', uid);

        let joinedRides: any[] = [];
        if (memberRows && memberRows.length > 0) {
          const ids = memberRows.map((m: any) => m.ride_id);
          const { data } = await supabase
            .from('rides').select('*').in('id', ids);
          joinedRides = data || [];
        }

        // Merge + deduplicate by ride id
        const all = [...(ownedRides || []), ...joinedRides];
        const unique = Array.from(new Map(all.map(r => [r.id, r])).values());
        
        // Sort by created_at desc
        unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setHistory(unique);
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
        <title>Ride History | Ride Club</title>
      </Helmet>
      
      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-4 bg-white shadow-sm flex items-center shrink-0 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center -ml-2 text-[#273a5a] hover:bg-gray-100 rounded-full transition-colors active:scale-95">
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-8 h-8 rounded-lg bg-[#FFF0E6] flex items-center justify-center shadow-sm">
            <Car className="w-4 h-4 text-[#ef4523]" />
          </div>
          <h1 className="text-[20px] font-bold text-[#273a5a] tracking-tight">Ride History</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6 pb-[100px]">
        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
          {['all', 'live', 'scheduled', 'ended', 'cancelled'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap capitalize transition-colors ${filter === f ? 'bg-[#273a5a] text-white' : 'bg-white text-[#8A8A8E] border border-gray-200 shadow-sm'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-[100px] bg-white rounded-2xl animate-pulse shadow-sm border border-gray-100"></div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-[20px] font-bold text-[#273a5a] mb-2">No Rides Yet</h2>
            <p className="text-[15px] text-[#8A8A8E] max-w-[250px]">Your ride history will appear here once you join or create a ride.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.filter(item => filter === 'all' || item.status === filter).length === 0 ? (
              <p className="text-center text-[#8A8A8E] font-medium mt-10">No rides found for this filter.</p>
            ) : (
              history.filter(item => filter === 'all' || item.status === filter).map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                  <div className="w-[48px] h-[48px] rounded-full bg-[#FFF0E6] flex items-center justify-center flex-shrink-0">
                    <Car className="w-5 h-5 text-[#ef4523]" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-[16px] font-bold text-[#273a5a] leading-tight mb-1">{item.name}</h3>
                    <div className="flex items-center gap-3 text-[13px] font-medium text-[#8A8A8E] mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[13px] font-medium text-[#8A8A8E]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]">{item.destination?.name || 'Unknown destination'}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    {item.status === 'ended' && <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-full uppercase tracking-wider">Ended</span>}
                    {item.status === 'live' && <span className="px-2.5 py-1 bg-[#ef4523]/10 text-[#ef4523] text-[11px] font-bold rounded-full uppercase tracking-wider">Live</span>}
                    {item.status === 'scheduled' && <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-full uppercase tracking-wider">Scheduled</span>}
                    {item.status === 'cancelled' && <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[11px] font-bold rounded-full uppercase tracking-wider">Cancelled</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RideHistory;
