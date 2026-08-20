import React, { useState, useEffect } from 'react';
import { ChevronRight, Filter, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastContext';

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
    <>
      <Helmet>
        <title>Live Alerts Feed | Ride Club</title>
        <meta name="description" content="Check real-time community reports for accidents, hazards, and police sightings." />
      </Helmet>

      <div className="flex flex-col gap-4 h-full">
        {/* Header */}
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => navigate('/home')} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-[18px] font-bold text-white tracking-tight leading-none">Live Alerts</h1>
            <p className="text-[11px] text-white/50 mt-0.5">Community reports</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar shrink-0 pb-1">
          <button aria-label="Filter" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-white/40">
            <Filter className="w-3.5 h-3.5" />
          </button>
          {filters.map(filter => (
            <button
              key={filter}
              aria-label={`Filter by ${filter}`}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-[#F97316] text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-2.5 pr-1">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-white/40 text-xs">
              Loading alerts...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-white/40 border border-dashed border-white/10 rounded-xl p-4">
              <AlertTriangle className="w-6 h-6 mb-2 opacity-50 text-[#F97316]" />
              <p className="text-xs font-medium">No alerts found</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div 
                key={alert.id} 
                onClick={() => navigate(`/incident/${alert.id}`)}
                className="bg-[#161C28] border border-[#2A3040] hover:border-[#F97316]/40 rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer group"
              >
                {/* Left Icon */}
                <div className="w-9 h-9 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                </div>
                
                {/* Center Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate leading-tight mb-0.5">
                    {alert.category || 'Alert'}
                  </h4>
                  <div className="flex items-center text-[10px] font-medium text-white/60">
                    <span className="truncate">{alert.description || 'Reported by community'}</span>
                  </div>
                </div>
                
                {/* Right Arrow */}
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default AlertsFeed;
