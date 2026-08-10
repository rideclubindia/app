import React, { useState, useEffect } from 'react';
import { ChevronRight, Filter, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastContext';
import { CockpitLayout } from '../components/spatial/CockpitLayout';
import { SpatialMembrane } from '../components/spatial/SpatialMembrane';

const filters = ['All', 'Traffic', 'Accidents', 'Road Closed', 'Vibe Check', 'Hazards'];

const AlertsFeed = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState('All');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [viewedAlerts, setViewedAlerts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPins = async () => {
      try {
        const { data, error } = await supabase.from('pins')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        if (data) setAlerts(data);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({ alerts_last_viewed: Date.now() }).eq('id', user.id);
          const { data: views } = await supabase.from('alert_views').select('*').eq('user_id', user.id);
          if (views) {
             const map = new Map<string, number>();
             views.forEach(v => map.set(v.pin_id, Number(v.viewed_at)));
             setViewedAlerts(map);
          }
        }
      } catch (error) {
        showToast('Failed to fetch alerts', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPins();
  }, [showToast]);

  const filteredAlerts = alerts.filter(a => {
    if (viewedAlerts.has(a.id)) {
      const viewedAt = viewedAlerts.get(a.id)!;
      if (Date.now() - viewedAt > 12 * 60 * 60 * 1000) return false;
    }
    
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Accidents') return a.category === 'Accident' || a.category === 'Accidents';
    if (activeFilter === 'Vibe Check') return a.category === 'Vibe Check' || a.category === 'Police';
    return a.category === activeFilter;
  });

  return (
    <CockpitLayout
      mapChildren={
        <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-bl from-red-500/10 to-transparent"></div>
          <div className="absolute w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[120px] -top-[300px] -right-[200px]"></div>
          <div className="absolute w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -bottom-[300px] -left-[100px]"></div>
        </div>
      }
    >
      <Helmet>
        <title>Live Alerts Feed | Ride Club</title>
        <meta name="description" content="Check real-time community reports for accidents, hazards, and police sightings." />
      </Helmet>

      <SpatialMembrane position="left" className="w-[420px] p-5 flex flex-col gap-6 max-h-[100dvh]">
        
        {/* Header */}
        <div className="flex items-center gap-3 shrink-0 mb-2">
          <button onClick={() => navigate('/home')} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-[24px] font-bold text-white tracking-tight leading-none">Live Alerts</h1>
            <p className="text-[13px] text-white/50 mt-1">Community reports</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar shrink-0 pb-1">
          <button aria-label="Filter" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-white/40">
            <Filter className="w-4 h-4" />
          </button>
          {filters.map(filter => (
            <button
              key={filter}
              aria-label={`Filter by ${filter}`}
              onClick={() => setActiveFilter(filter)}
              className={`h-10 px-4 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all border ${
                activeFilter === filter 
                  ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' 
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Feed List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-3 pb-8">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-full h-20 bg-white/5 rounded-2xl animate-pulse border border-white/10"></div>
              ))}
            </>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center p-8 mt-10">
              <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-[18px] font-bold text-white mb-2">No Active Alerts</h3>
              <p className="text-[14px] text-white/50">There are no reports for this category currently.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div 
                key={alert.id} 
                onClick={() => navigate(`/incident/${alert.id}`)}
                className="bg-white/5 border border-white/10 rounded-[20px] p-4 hover:bg-white/10 transition-all cursor-pointer flex items-center gap-4 group"
              >
                {/* Left Icon */}
                <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                
                {/* Center Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-bold text-white truncate leading-tight mb-1">
                    {alert.category || 'Alert'}
                  </h4>
                  <div className="flex items-center text-[12px] font-medium text-white/60">
                    <span className="truncate">{alert.description || 'Reported by community'}</span>
                    <span className="mx-2 text-white/20">•</span>
                    <span className="flex-shrink-0">{new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
                
                {/* Right Arrow */}
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </div>
              </div>
            ))
          )}
        </div>
      </SpatialMembrane>
    </CockpitLayout>
  );
};

export default AlertsFeed;
