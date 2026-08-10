import React, { useEffect, useState } from 'react';
import { ArrowLeft, Car, Calendar, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';
import { CockpitLayout } from '../components/spatial/CockpitLayout';
import { SpatialMembrane } from '../components/spatial/SpatialMembrane';

const RideHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHistory = async (uid: string) => {
      try {
        const { data: ownedRides } = await supabase
          .from('rides')
          .select('*')
          .eq('owner_id', uid)
          .order('created_at', { ascending: false });

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

        const all = [...(ownedRides || []), ...joinedRides];
        const unique = Array.from(new Map(all.map(r => [r.id, r])).values());
        
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

  const filteredHistory = history.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <CockpitLayout
      mapChildren={
        <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
          <div className="absolute w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -top-[300px] -right-[200px]"></div>
          <div className="absolute w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -bottom-[300px] -left-[100px]"></div>
        </div>
      }
    >
      <Helmet>
        <title>Ride History | Ride Club</title>
      </Helmet>

      <SpatialMembrane position="left" className="w-[420px] p-5 flex flex-col gap-5 max-h-[100dvh]">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 mb-1">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/profile')} 
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-[20px] font-bold text-white tracking-tight leading-none">Ride History</h1>
              <p className="text-[13px] text-white/50 mt-1">Your group rides</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search rides..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-all backdrop-blur-md"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar shrink-0 pb-1">
          {['all', 'live', 'scheduled', 'ended', 'cancelled'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap capitalize transition-all border ${filter === f ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-3 pb-8">
          {loading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-full h-[88px] bg-white/5 rounded-[20px] animate-pulse border border-white/10"></div>
              ))}
            </>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-20">
              <div className="w-16 h-16 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center mb-4">
                <Car className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-[20px] font-bold text-white mb-2">No Rides Yet</h2>
              <p className="text-[14px] text-white/50 max-w-[250px]">Your ride history will appear here once you join or create a ride.</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <p className="text-center text-white/40 text-[14px] mt-10">No rides found matching your filters.</p>
          ) : (
            filteredHistory.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-[20px] p-4 flex gap-4 backdrop-blur-md hover:bg-white/10 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="text-[15px] font-bold text-white leading-tight truncate mb-2">{item.name}</h3>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="flex items-center gap-1.5 text-white/60 text-[11px] font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5 text-white/60 text-[11px] font-medium truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[120px]">{item.destination?.name || 'Unknown destination'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-start shrink-0">
                  {item.status === 'ended' && <span className="px-2.5 py-1 bg-white/10 text-white/60 border border-white/10 text-[10px] font-bold rounded-full uppercase tracking-wider">Ended</span>}
                  {item.status === 'live' && <span className="px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold rounded-full uppercase tracking-wider">Live</span>}
                  {item.status === 'scheduled' && <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider">Scheduled</span>}
                  {item.status === 'cancelled' && <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider">Cancelled</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </SpatialMembrane>
    </CockpitLayout>
  );
};

export default RideHistory;
