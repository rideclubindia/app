import React, { useState, useEffect } from 'react';
import { ChevronRight, Filter, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    const fetchPins = async () => {
      try {
        const { data, error } = await supabase.from('pins')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        
        if (data) {
          setAlerts(data);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Sync alerts_last_viewed to db
          await supabase.from('profiles').update({ alerts_last_viewed: Date.now() }).eq('id', user.id);
          
          // Fetch alert_views
          const { data: views } = await supabase.from('alert_views').select('*').eq('user_id', user.id);
          if (views) {
             const map = new Map<string, number>();
             views.forEach(v => map.set(v.pin_id, Number(v.viewed_at)));
             setViewedAlerts(map);
          }
        }
      } catch (error) {
        showToast('Failed to fetch alerts', 'error');
      }
    };
    fetchPins();
  }, [showToast]);

  const filteredAlerts = alerts.filter(a => {
    // Hide if viewed more than 12 hours ago
    if (viewedAlerts.has(a.id)) {
      const viewedAt = viewedAlerts.get(a.id)!;
      if (Date.now() - viewedAt > 12 * 60 * 60 * 1000) {
        return false;
      }
    }
    
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Accidents') return a.category === 'Accident' || a.category === 'Accidents';
    if (activeFilter === 'Vibe Check') return a.category === 'Vibe Check' || a.category === 'Police';
    return a.category === activeFilter;
  });

  return (
    <div className="w-full h-full bg-[#F2F4F7] flex flex-col font-sans overflow-hidden md:pb-0">
      <Helmet>
        <title>Live Alerts Feed | Ride Club</title>
        <meta name="description" content="Check real-time community reports for accidents, hazards, and police sightings." />
      </Helmet>
      
      {/* Header */}
      <div className="px-5 pt-4 pb-4 bg-white border-b border-gray-100 flex-shrink-0 z-10 shadow-sm">
        <p className="text-[13px] font-bold text-[#8A8A8E] tracking-wider mb-0.5 uppercase">Community</p>
        <h1 className="text-[22px] font-bold text-[#273a5a] leading-none tracking-tight">Live Alerts</h1>
      </div>

      {/* Filter Chips */}
      <div className="bg-[#F2F4F7] px-4 py-4 flex-shrink-0 z-0">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <button aria-label="Filter" className="w-[36px] h-[36px] rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0 text-[#8A8A8E]">
            <Filter className="w-4 h-4" />
          </button>
          {filters.map(filter => (
            <button
              key={filter}
              aria-label={`Filter by ${filter}`}
              onClick={() => setActiveFilter(filter)}
              className={`h-[36px] px-5 rounded-lg text-[13px] font-bold whitespace-nowrap transition-all shadow-sm active:scale-95 ${
                activeFilter === filter 
                  ? 'bg-[#ef4523] text-white border border-[#ef4523]' 
                  : 'bg-white text-[#8A8A8E] border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-1 hide-scrollbar relative">
        <h3 className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-1 px-1">Today</h3>
        
        {filteredAlerts.length === 0 ? (
          <div className="text-center p-8 text-[#8A8A8E] font-medium mt-10">
            No alerts found for this category.
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div 
              key={alert.id} 
              onClick={() => navigate(`/incident/${alert.id}`)}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-100/50 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center"
            >
              {/* Left Icon */}
              <div className="w-[48px] h-[48px] rounded-lg bg-[#FFF0E6] flex items-center justify-center flex-shrink-0 mr-[16px]">
                <AlertTriangle className="w-6 h-6 text-[#ef4523]" />
              </div>
              
              {/* Center Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-[16px] font-bold text-[#273a5a] truncate leading-none">{alert.category || 'Alert'}</h4>
                  {/* Subtle new badge logic if we wanted, but let's keep it simple */}
                </div>
                <div className="flex items-center text-[13px] font-medium text-[#8A8A8E] mt-1">
                  <span className="truncate">{alert.description || 'Reported by community'}</span>
                  <span className="mx-1.5">•</span>
                  <span className="flex-shrink-0">{new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
              
              {/* Right Arrow */}
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                <ChevronRight className="w-5 h-5 text-[#8A8A8E]" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsFeed;
