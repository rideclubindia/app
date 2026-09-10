import React, { useState, useEffect } from 'react';
import { Filter, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastContext';
import { useIncidentCategories, resolvePinIcon } from '../hooks/useIncidentCategories';
import { filterActiveIncidents } from '../lib/incidentExpiry';

const filters = ['All', 'Traffic Jam', 'Accidents', 'Road Closed', 'Vibe Check', 'Hazard'];

const AlertsFeed = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { categories: reportTypes } = useIncidentCategories();
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
        if (data) setAlerts(await filterActiveIncidents(data));

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

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    return `${hours}h ago`;
  };

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

      <div className="flex flex-col h-full bg-[#F7F8FA]">
        {/* Header */}
        <div className="flex items-center gap-3 shrink-0 px-4 pt-4 pb-2">
          <div className="w-9 h-9 rounded-full bg-[#FFF0E6] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#FF5A00]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[#111111] font-semibold text-lg tracking-wide uppercase leading-tight">Live Alerts</h1>
            <p className="text-[12px] text-gray-400 font-medium mt-0.5">{filteredAlerts.length} active community reports</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar shrink-0 px-4 pb-2">
          <button aria-label="Filter" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400 shadow-sm">
            <Filter className="w-3.5 h-3.5" />
          </button>
          {filters.map(filter => (
            <button
              key={filter}
              aria-label={`Filter by ${filter}`}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/25'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Alerts List — incident page card style */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4 flex flex-col gap-2">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-[8px] border border-gray-100 p-3.5 animate-pulse flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 rounded w-1/3 mb-2"></div>
                    <div className="h-2.5 bg-gray-100 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center bg-white border border-dashed border-gray-200 rounded-[8px] p-4">
              <AlertTriangle className="w-6 h-6 mb-2 text-[#FF5A00]" />
              <p className="text-[12px] font-semibold text-[#111111]">No alerts found</p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Reports will appear here as the community posts them.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const IconComp = resolvePinIcon(alert, reportTypes);
              return (
                <div 
                  key={alert.id} 
                  onClick={() => navigate(`/incident/${alert.id}`)}
                  className="bg-white border border-gray-100 hover:border-[#FF5A00]/40 rounded-[8px] shadow-sm p-3 flex items-center gap-3 transition-all cursor-pointer"
                >
                  {/* Category Icon */}
                  <div className="w-9 h-9 rounded-full bg-white border-2 border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0">
                    <IconComp className="w-4 h-4 text-red-500" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="text-[13px] font-semibold text-[#111111] truncate leading-tight">
                        {alert.category || 'Alert'}
                      </h4>
                      <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" /> {formatTimeAgo(alert.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium truncate">
                      {alert.description || `Reported by ${alert.reporter_name || 'community'}`}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default AlertsFeed;
