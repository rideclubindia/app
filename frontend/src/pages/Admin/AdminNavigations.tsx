import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Search, Filter, Navigation2, X, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchInput } from '../../components/ui/SearchInput';
import { useConfirm } from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastContext';

const AdminNavigations = () => {
    const confirm = useConfirm();
    const { showToast } = useToast();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});

  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await supabase.from('navigation_sessions').select('*').order('created_at', { ascending: false });
      if (data) setSessions(data);
      setLoading(false);
    };
    fetchSessions();

    const subscription = supabase
      .channel('admin_navigations_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'navigation_sessions' }, () => {
        fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [78.4867, 17.3850],
        zoom: 12,
        attributionControl: false
      });
      map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    }
  }, []);

  useEffect(() => {
    if (!map.current) return;
    
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    const activeSessions = sessions.filter(s => s.status === 'active');
    activeSessions.forEach(session => {
      if (session.origin_lat && session.origin_lng) {
        const el = document.createElement('div');
        el.className = 'w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-primary border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform';
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`;
        
        el.addEventListener('click', () => handleViewSession(session));

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([session.origin_lng, session.origin_lat])
          .addTo(map.current!);
          
        markersRef.current[session.id] = marker;
      }
    });
  }, [sessions]);

  useEffect(() => {
    if (!map.current) return;
    
    const draw = async () => {
      if (map.current!.getSource('route')) {
        map.current!.removeLayer('route-line');
        map.current!.removeSource('route');
      }

      if (selectedSession && selectedSession.origin_lat && selectedSession.dest_lat) {
        try {
          const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
            method: 'POST',
            headers: {
              'Authorization': 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZlZTI0N2U2NGIwNjQwYTY5N2E0ZGJkMzVlZmYyMDI5IiwiaCI6Im11cm11cjY0In0=',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ coordinates: [[selectedSession.origin_lng, selectedSession.origin_lat], [selectedSession.dest_lng, selectedSession.dest_lat]] })
          });
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            const routeFeature = data.features[0];
            map.current!.addSource('route', {
              type: 'geojson',
              data: routeFeature
            });
            map.current!.addLayer({
              id: 'route-line',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#ef4523', 'line-width': 4, 'line-opacity': 0.8 }
            });

            const bbox = routeFeature.bbox;
            if (bbox) {
              map.current!.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50, maxZoom: 16 });
            }
          }
        } catch (err) {
          console.error("Failed to fetch route:", err);
        }
      }
    };

    if (map.current.isStyleLoaded()) {
      draw();
    } else {
      map.current.once('load', draw);
    }
  }, [selectedSession]);

  const handleViewSession = (session: any) => {
    setSelectedSession(session);
    if (markersRef.current[session.id]) {
      const lngLat = markersRef.current[session.id].getLngLat();
      map.current?.flyTo({ center: lngLat, zoom: 15 });
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.dest_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-white">
      <div className={`w-[360px] flex flex-col border-r border-[#E5E5EA] bg-white shrink-0 z-20 ${selectedSession ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-[#E5E5EA] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[18px] font-bold text-dark flex items-center gap-2">
                <Navigation2 className="w-5 h-5 text-primary" />
                {sessions.length} Navigations
              </h1>
              <p className="text-[12px] text-[#8A8A8E] mt-0.5">Overview live solo navigations</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5EA] rounded text-[12px] font-bold text-dark hover:bg-gray-50">
              <Filter className="w-3.5 h-3.5" />
              More filters
            </button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchInput 
                variant="admin"
                placeholder="Search navigations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="px-3 h-9 rounded border border-[#E5E5EA] text-[12px] font-bold hover:bg-gray-50">
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-2">
            {filteredSessions.map(session => {
              const isActive = session.status === 'active';
              const isCompleted = session.status === 'completed';
              return (
                <div 
                  key={session.id} 
                  onClick={() => handleViewSession(session)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedSession?.id === session.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-[#E5E5EA] hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-primary">
                        <Navigation2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[14px] text-dark leading-tight">{session.dest_name || 'Unknown Destination'}</h3>
                        <p className="text-[11px] text-[#8A8A8E] font-mono mt-0.5">ID: {String(session.id).substring(0, 8)}...</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-[#E5F9ED] text-[#34C759]' : isCompleted ? 'bg-[#E8F0FE] text-[#273a5a]' : 'bg-[#F2F4F7] text-[#8A8A8E]'}`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="text-[11px] text-[#8A8A8E]">Started: {new Date(session.created_at).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
            {filteredSessions.length === 0 && !loading && (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Navigation2 className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-[14px] font-bold text-dark">No navigations found</p>
                <p className="text-[12px] text-[#8A8A8E] mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-[#F2F4F7]">
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      <div className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 flex flex-col ${selectedSession ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedSession && (
          <>
            <div className="p-5 border-b border-[#E5E5EA] shrink-0 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-[20px] font-bold text-dark leading-tight">{selectedSession.dest_name || 'Unknown Destination'}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedSession.status === 'active' ? 'bg-[#E5F9ED] text-[#34C759]' : selectedSession.status === 'completed' ? 'bg-[#E8F0FE] text-[#273a5a]' : 'bg-[#F2F4F7] text-[#8A8A8E]'}`}>
                      {selectedSession.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A8A8E] font-mono mb-2">ID: {selectedSession.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8A8A8E] hover:bg-[#E5E5EA] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-8">
                <div className="mb-6">
                  <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Navigation2 className="w-4 h-4" />
                    Session Details
                  </h3>
                  <div className="bg-[#F8F9FB] rounded-lg p-3 grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
                    <div>
                      <span className="text-[#8A8A8E] block mb-0.5">Time Started</span>
                      <span className="font-bold text-dark">{new Date(selectedSession.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    {selectedSession.status !== 'active' && selectedSession.updated_at && (
                      <div>
                        <span className="text-[#8A8A8E] block mb-0.5">When Ended</span>
                        <span className="font-bold text-[#FF3B30]">{new Date(selectedSession.updated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Route
                  </h3>
                  <div className="relative pl-4 space-y-6">
                    <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-[#E5E5EA]"></div>
                    
                    <div className="flex gap-4 relative cursor-pointer group">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center relative z-10 transition-colors bg-[#E5F9ED] text-[#34C759]">
                        <span className="font-bold text-[11px]">A</span>
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                          Start Location
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex gap-2">
                          <span className="uppercase text-[9px] font-bold px-1.5 rounded bg-gray-100">{selectedSession.origin_lat.toFixed(4)}, {selectedSession.origin_lng.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 relative cursor-pointer group">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center relative z-10 transition-colors bg-[#FFEBEE] text-[#FF3B30]">
                        <span className="font-bold text-[11px]">B</span>
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {selectedSession.dest_name || 'Destination'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex gap-2">
                          <span className="uppercase text-[9px] font-bold px-1.5 rounded bg-gray-100">{selectedSession.dest_lat.toFixed(4)}, {selectedSession.dest_lng.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>

            {selectedSession.status === 'active' && (
              <div className="p-5 border-t border-[#E5E5EA] shrink-0 bg-gray-50 flex gap-3">
                <button 
                  onClick={async () => {
                    const ok = await confirm({ title: 'Force Cancel Session', message: 'This navigation session will be immediately ended for the user.', confirmLabel: 'Force Cancel', variant: 'danger' });
                    if (!ok) return;
                    await supabase.from('navigation_sessions').update({ status: 'cancelled' }).eq('id', selectedSession.id);
                    showToast('Session cancelled', 'success');
                    setSelectedSession(null);
                  }}
                  className="flex-1 bg-white border border-red-500 text-red-500 font-bold h-[44px] rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
                >
                  Force Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminNavigations;
