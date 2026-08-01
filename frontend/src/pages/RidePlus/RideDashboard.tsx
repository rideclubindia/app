import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, MapPin, Navigation2, Clock, ChevronRight, LogOut, Calendar, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '../../components/ToastContext';
import { getDeterministicUuid } from '../../lib/user';
import { useConfirm } from '../../components/ConfirmDialog';
import { apiClient } from '../../lib/apiClient';
import { Activity, AlertTriangle, ShieldCheck, Play, RefreshCw } from 'lucide-react';

const EditRideModal = lazy(() => import('./EditRideModal'));
const RideDashboard = () => {
    const confirm = useConfirm();

  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [selectedDashboardRide, setSelectedDashboardRide] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [editRideId, setEditRideId] = useState<string | null>(null);

  // Wait for Firebase auth to fully initialize
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUid(user?.uid || null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const fetchActiveRides = async (uid: string) => {
    setLoading(true);
    setDbError(null);
    try {
      // Strategy 1: rides I directly own (most reliable, bypasses ride_members RLS)
      const { data: ownedRides, error: ownErr } = await supabase
        .from('rides')
        .select('*')
        .eq('owner_id', uid)
        .neq('status', 'ended')
        .order('created_at', { ascending: false });

      if (ownErr) {
        console.warn('Owned rides query error:', ownErr.message);
        throw ownErr; // Force it to show in UI
      }

      // Strategy 2: rides I'm a member of (via ride_members)
      const { data: memberRows } = await supabase
        .from('ride_members')
        .select('ride_id, role')
        .eq('user_id', getDeterministicUuid(uid));

      let joinedRides: any[] = [];
      if (memberRows && memberRows.length > 0) {
        const ids = memberRows.map((m: any) => m.ride_id);
        const { data } = await supabase
          .from('rides').select('*').in('id', ids).neq('status', 'ended');
        joinedRides = data || [];
      }

      // Merge + deduplicate by ride id
      const all = [...(ownedRides || []), ...joinedRides];
      const unique = Array.from(new Map(all.map(r => [r.id, r])).values());

      // Filter out scheduled rides older than 24 hours
      const now = Date.now();
      const nonExpiredRides = unique.filter((r: any) => {
        if (r.status === 'scheduled') {
          const rideTime = new Date(r.ride_date).getTime();
          return now - rideTime <= 24 * 60 * 60 * 1000;
        }
        return true;
      });

      // Attach role: admin if owned, else from ride_members
      const withRole = nonExpiredRides.map((ride: any) => {
        if (ride.owner_id === uid) return { ...ride, myRole: 'admin' };
        const mem = (memberRows || []).find((m: any) => m.ride_id === ride.id);
        return { ...ride, myRole: mem?.role || 'member' };
      });

      setActiveRides(withRole);
    } catch (e: any) {
      setDbError(e.message);
      showToast('Failed to load rides: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    if (!currentUid) { setLoading(false); return; }

    fetchActiveRides(currentUid);

    // Realtime: auto-refresh when rides table changes
    const sub = supabase.channel('ride-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => {
        fetchActiveRides(currentUid);
      })
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, [authReady, currentUid]);

  const handleEndOrLeave = async (ride: any) => {
    const uid = currentUid;
    if (!uid) return;

    const isOwner = ride.myRole === 'admin';
    if (isOwner) {
      const { error } = await supabase.from('rides').update({ status: 'ended' }).eq('id', ride.id);
      if (error) { showToast('Failed to end ride', 'error'); return; }
      showToast('Ride ended for all members.', 'success');
    } else {
      const ok = await confirm({ title: 'Leave Ride', message: 'You will be removed from this ride.', confirmLabel: 'Leave', variant: 'warning' });
      if (ok) {
        const { error } = await supabase.from('ride_members').delete().eq('ride_id', ride.id).eq('user_id', getDeterministicUuid(uid));
        if (error) { showToast('Failed to leave ride: ' + error.message, 'error'); }
        else { showToast('You left the ride.', 'success'); }
      }
    }
    if (currentUid) fetchActiveRides(currentUid);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const statusColor: Record<string, string> = {
    live: 'bg-success/10 text-success',
    scheduled: 'bg-blue-100 text-blue-600',
    active: 'bg-success/10 text-success',
    completed: 'bg-gray-100 text-gray-500',
  };

  const fetchDashboard = async (rideId: string) => {
    setSelectedDashboardRide(rideId);
    setLoadingDashboard(true);
    try {
      // Use numeric ID if rideId is UUID or map it. The backend currently takes int. 
      // For now, we will pass rideId as string and backend should handle it or fail gracefully.
      const res = await apiClient.get(`/api/v1/dashboard/ride/${rideId}`);
      setDashboardData(res.data);
    } catch (e) {
      showToast('Failed to load analytics dashboard', 'error');
      setDashboardData(null);
    } finally {
      setLoadingDashboard(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#F2F4F7] flex flex-col font-sans overflow-hidden pb-[90px]">
      
      {/* Hero Header */}
      <div className="relative bg-[#1c2331] px-6 pt-12 pb-14 overflow-hidden z-10 shrink-0 shadow-lg">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ef4523] rounded-full mix-blend-screen filter blur-[80px] opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10">
          <p className="text-[12px] font-black text-white/50 tracking-[0.2em] mb-1.5 uppercase">Navigation</p>
          <h1 className="text-[32px] font-black text-white leading-none tracking-tight">Ride+</h1>
        </div>
      </div>

      <div className="p-2 overflow-y-auto flex-1 hide-scrollbar">
        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8 -mt-8 px-2 relative z-20">
          <button 
            onClick={() => navigate('/ride-plus/create', { state: { restrictInstant: activeRides.length > 0 } })} 
            className="group relative bg-gradient-to-br from-[#ef4523] to-[#d93a1a] text-white p-5 rounded-[24px] shadow-[0_8px_24px_rgba(239,69,35,0.3)] flex flex-col items-start gap-4 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="bg-white/20 backdrop-blur-md p-3 rounded-[16px] flex items-center justify-center shadow-inner border border-white/20">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <span className="block font-black text-[17px] leading-tight">Create Ride</span>
              <span className="block text-[11px] text-white/80 font-medium mt-0.5">Start a new group</span>
            </div>
          </button>
          
          <button 
            onClick={() => {
              if (activeRides.length > 0) {
                showToast('You are already in an active ride. Leave or end it first to join a new one.', 'error');
                return;
              }
              navigate('/ride-plus/join');
            }} 
            className={`group relative bg-white border border-gray-100 p-5 rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col items-start gap-4 transition-all duration-300 overflow-hidden ${activeRides.length > 0 ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]'}`}
          >
            <div className="bg-gray-50 p-3 rounded-[16px] flex items-center justify-center border border-gray-100 group-hover:bg-indigo-50 transition-colors">
              <Users className={`w-6 h-6 ${activeRides.length > 0 ? 'text-gray-400' : 'text-indigo-500'}`} />
            </div>
            <div className="text-left">
              <span className={`block font-black text-[17px] leading-tight ${activeRides.length > 0 ? 'text-gray-400' : 'text-[#273a5a]'}`}>Join Ride</span>
              <span className="block text-[11px] text-gray-400 font-medium mt-0.5">Enter a ride code</span>
            </div>
          </button>
        </div>

        {/* Active Rides Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[20px] font-bold text-[#273a5a]">Your Active Rides</h2>
            <button onClick={() => currentUid && fetchActiveRides(currentUid)} className="text-[#ef4523] text-sm font-bold flex items-center gap-1.5">Refresh <RefreshCw className="w-4 h-4"/></button>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 animate-pulse h-[110px]" />
              ))}
            </div>
          ) : activeRides.length === 0 ? (
            <div className="relative overflow-hidden bg-white/50 backdrop-blur-md rounded-[32px] p-8 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center shadow-sm min-h-[250px]">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-5 shadow-inner border border-white">
                <Navigation2 className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-[18px] font-black text-[#273a5a] mb-1.5">No Active Rides</h3>
              <p className="text-gray-500 text-[13px] font-medium max-w-[200px]">Your scheduled and live group rides will appear right here.</p>
              {dbError && <p className="text-red-400 text-[11px] mt-3 font-bold bg-red-50 px-3 py-1 rounded-full">DB Error: {dbError}</p>}
              {!currentUid && authReady && <p className="text-orange-500 text-[11px] mt-3 font-bold bg-orange-50 px-3 py-1 rounded-full">⚠️ Sign in to view rides</p>}
              <button onClick={() => currentUid && fetchActiveRides(currentUid)} className="mt-6 bg-[#273a5a] text-white px-6 py-2.5 rounded-full text-[13px] font-bold hover:scale-105 active:scale-95 transition-transform shadow-[0_4px_12px_rgba(39,58,90,0.2)]">Refresh</button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRides.map((ride) => (
                <div key={ride.id} className="bg-white rounded-[32px] border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row mb-6 overflow-hidden group hover:shadow-[0_16px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                  
                  {/* Image Side (Ride Card) */}
                  <div className="relative w-full sm:w-[45%] h-[180px] sm:h-auto shrink-0 bg-gray-900">
                    <img src={(ride.image_url && !ride.image_url.includes('blob:')) ? ride.image_url : "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80"} alt="Ride cover" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    
                    {/* Dark gradient overlay for readability (fintech style) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-black/60 sm:to-black/90"></div>
                    
                    {/* Top Left: LIVE Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-[0_4px_12px_rgba(0,0,0,0.2)] backdrop-blur-md border border-white/20 ${ride.status === 'live' ? 'bg-[#ef4523]/90 text-white' : 'bg-black/40 text-white'}`}>
                        {ride.status === 'live' ? '🔴 Live Now' : ride.status}
                      </span>
                    </div>
                    
                    {/* Bottom Left: Ride Title and ID */}
                    <div className="absolute bottom-4 left-4 right-4 flex flex-col">
                      <h3 className="text-white font-black text-[22px] leading-tight drop-shadow-lg line-clamp-2">{ride.name}</h3>
                      <span className="text-white/70 text-[11px] font-bold mt-1 uppercase tracking-[0.2em] drop-shadow-sm">ID: {ride.ride_code}</span>
                    </div>
                  </div>

                  {/* Actions & Details Side */}
                  <div className="w-full sm:w-[55%] p-5 flex flex-col justify-between bg-white relative">
                    
                    {/* Details Row */}
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                          <MapPin className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-[#273a5a] text-[13px] font-bold line-clamp-1">{ride.destination?.name || 'Unknown destination'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                          <Calendar className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-[#273a5a] text-[13px] font-bold">{formatDate(ride.ride_date)}</span>
                      </div>
                    </div>

                    <hr className="border-gray-100 mb-4" />
                    
                    {/* Actions Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Start/Join Ride */}
                      <button 
                        onClick={() => navigate(`/ride-plus/live/${ride.id}`)}
                        className="bg-[#1c2331] hover:bg-black text-white py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-[13px] shadow-[0_4px_12px_rgba(28,35,49,0.2)] active:scale-95 transition-all"
                      >
                        <Play className="w-4 h-4 text-[#ef4523]" /> 
                        {ride.status === 'live' ? 'Join Live' : 'Start'}
                      </button>

                      {/* Dashboard */}
                      <button 
                        onClick={() => navigate(`/group-ride-dashboard?ride_id=${ride.id}`)}
                        className="bg-gray-50 hover:bg-gray-100 text-[#273a5a] py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-[13px] border border-gray-200 active:scale-95 transition-all"
                      >
                        <Activity className="w-4 h-4 text-indigo-500" /> 
                        Dashboard
                      </button>

                      {/* Edit Ride */}
                      {ride.myRole === 'admin' && (
                        <button 
                          onClick={() => setEditRideId(ride.id)}
                          className="bg-blue-50/50 hover:bg-blue-50 text-blue-600 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-[13px] active:scale-95 transition-all"
                        >
                          <Edit2 className="w-4 h-4" /> 
                          Edit
                        </button>
                      )}

                      {/* End / Leave */}
                      <button 
                        onClick={() => handleEndOrLeave(ride)}
                        className="bg-red-50/50 hover:bg-red-50 text-red-500 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-[13px] active:scale-95 transition-all"
                      >
                        <LogOut className="w-4 h-4" /> 
                        {ride.myRole === 'admin' ? 'End Ride' : 'Leave'}
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Edit Ride Modal */}
      {editRideId && (
        <Suspense fallback={<div className="fixed inset-0 z-[200] bg-dark/60 backdrop-blur-sm flex items-center justify-center"><div className="bg-white rounded-3xl p-8 shadow-2xl"><div className="w-8 h-8 border-4 border-[#ef4523] border-t-transparent rounded-full animate-spin" /></div></div>}>
          <EditRideModal
            rideId={editRideId}
            onClose={() => setEditRideId(null)}
            onSaved={() => { if (currentUid) fetchActiveRides(currentUid); }}
          />
        </Suspense>
      )}
    </div>

      {selectedDashboardRide && (
        <div className="fixed inset-0 z-[100] bg-dark/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-4">
          <div className="bg-[#F2F4F7] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="bg-white p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-[#273a5a] flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" /> Ride Analytics
              </h2>
              <button onClick={() => setSelectedDashboardRide(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {loadingDashboard ? (
                <div className="flex justify-center py-10"><Activity className="w-8 h-8 animate-pulse text-gray-400" /></div>
              ) : dashboardData ? (
                <div className="flex flex-col gap-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
                        <ShieldCheck className="w-6 h-6 text-success" />
                      </div>
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Safety Score</span>
                      <span className="text-3xl font-black text-[#273a5a]">{dashboardData.safety_score || 0}<span className="text-lg text-gray-400">/100</span></span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                        <Activity className="w-6 h-6 text-blue-500" />
                      </div>
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Avg Speed</span>
                      <span className="text-3xl font-black text-[#273a5a]">{Math.round(dashboardData.average_speed_kmh || 0)} <span className="text-lg text-gray-400">km/h</span></span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center col-span-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Duration</span>
                      <span className="text-3xl font-black text-[#273a5a]">{Math.round((dashboardData.duration_seconds || 0) / 60)} <span className="text-lg text-gray-400">mins</span></span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-lg font-bold text-[#273a5a] mb-4">Ride Timeline</h3>
                    <div className="relative border-l-2 border-gray-100 ml-3 pl-5 flex flex-col gap-6">
                      {(dashboardData.timeline || []).length === 0 ? (
                        <p className="text-sm text-gray-500 font-medium">No events recorded yet.</p>
                      ) : (
                        dashboardData.timeline.map((evt: any, i: number) => (
                          <div key={i} className="relative">
                            <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-white border-4 border-primary" />
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                                {new Date(evt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              <h4 className="font-bold text-[#273a5a] text-sm">{evt.event}</h4>
                              {evt.details && <p className="text-sm text-gray-500 mt-1">{evt.details}</p>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertTriangle className="w-10 h-10 text-orange-400 mb-3" />
                  <p className="text-gray-600 font-medium">Analytics not available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideDashboard;
