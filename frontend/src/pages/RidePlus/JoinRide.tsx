import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Key, ArrowRight, ShieldCheck, Radio, Users, MapPin, Calendar, Clock, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/firebase';
import { useToast } from '../../components/ToastContext';
import { useRideStartGate } from '../../components/RideStartGate';
import { getAppUser } from '../../lib/user';

const JoinRide = () => {
  const navigate = useNavigate();
  const { ensureReady, gate } = useRideStartGate();
  const { showToast } = useToast();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewRide, setPreviewRide] = useState<any | null>(null);
  const [searchingRide, setSearchingRide] = useState(false);
  const [publicRides, setPublicRides] = useState<any[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);

  // Auto-search ride preview when 6+ characters entered
  useEffect(() => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length >= 5) {
      const timer = setTimeout(async () => {
        setSearchingRide(true);
        try {
          // Works for private rides too: the share code is the invitation, and only card fields come back
          const { data: found, error } = await supabase.rpc('rc_find_ride_by_code', { p_code: cleanCode });
          const data = (found as any[] | null)?.[0] || null;

          if (!error && data) {
            setPreviewRide(data);
          } else {
            setPreviewRide(null);
          }
        } catch {
          setPreviewRide(null);
        } finally {
          setSearchingRide(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPreviewRide(null);
    }
  }, [code]);

  // Fetch currently live or upcoming public rides
  useEffect(() => {
    const fetchPublicRides = async () => {
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('id, name, ride_code, status, ride_date, start_location, destination, max_riders, vehicle_type')
          .eq('visibility', 'public')
          .in('status', ['live', 'scheduled'])
          .order('ride_date', { ascending: true })
          .limit(4);

        if (!error && data) {
          setPublicRides(data);
        }
      } catch (err) {
        console.error('Failed to load public rides', err);
      } finally {
        setLoadingPublic(false);
      }
    };
    fetchPublicRides();
  }, []);

  const handleJoin = async (targetCode?: string) => {
    const codeToJoin = (targetCode || code).trim().toUpperCase();
    if (!codeToJoin || codeToJoin.length < 5) {
      showToast('Please enter a valid Ride Code', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = getAppUser(auth.currentUser);
      if (!user) {
        showToast('Not authenticated. Please log in.', 'error');
        setLoading(false);
        return;
      }

      const { data: found } = await supabase.rpc('rc_find_ride_by_code', { p_code: codeToJoin });
      const ride = (found as any[] | null)?.[0];
      if (!ride) {
        throw new Error('Ride not found. Please verify the 6-character code.');
      }

      // Joining happens in the database as the signed-in rider; the client can't join on someone else's behalf
      const { error: joinErr } = await supabase.rpc('rc_join_ride_by_code', {
        p_code: codeToJoin,
        p_display_name: user.displayName || user.email?.split('@')[0] || 'Rider',
        p_avatar: user.photoURL || null,
      });
      if (joinErr) {
        throw new Error(joinErr.message.includes('RIDE_CLOSED') ? 'This ride has already ended.' : 'Could not join this ride. Try again.');
      }

      showToast(`Joined ride: ${ride.name}`, 'success');
      // Live rides need an emergency contact first; scheduled rides open their details
      if (ride.status === 'live') navigate((await ensureReady()) ? `/ride-plus/live/${ride.id}` : `/ride-plus/view/${ride.id}`);
      else navigate(`/ride-plus/view/${ride.id}`);

    } catch (err: any) {
      showToast(err.message || 'Failed to request joining ride', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#F3F4F6] flex flex-col font-sans overflow-hidden">
      {gate}
      {/* Top App Header */}
      <div className="bg-white px-5 py-3 border-b border-gray-200/80 shadow-2xs flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-800 transition-colors cursor-pointer"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[17px] font-black text-gray-950 tracking-tight leading-tight">Join Live Pack</h1>
            <p className="text-[11px] text-gray-500 font-medium">Connect to an active ride mesh</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/ride-plus/create')}
          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#FF5A00] rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Host a Ride</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="max-w-[720px] mx-auto flex flex-col gap-6">

          {/* Primary Join Hero Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-100/50 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-blue-100/40 rounded-full blur-2xl pointer-events-none" />

            {/* Icon Pill */}
            <div className="w-14 h-14 bg-gradient-to-tr from-[#FF5A00] to-[#ff7d33] rounded-2xl flex items-center justify-center mb-3.5 shadow-sm shadow-[#FF5A00]/30 text-white">
              <Key className="w-7 h-7" />
            </div>

            <h2 className="text-[20px] font-black text-gray-950 tracking-tight">Enter Ride Access Code</h2>
            <p className="text-[12px] text-gray-500 font-medium max-w-[380px] mt-1 mb-5">
              Ask the ride captain for their 6-character ride code to link up with the pack radar.
            </p>

            {/* Code Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleJoin(); }} className="w-full max-w-[360px] flex flex-col gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. RC-9021"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={12}
                  autoFocus
                  className="w-full bg-gray-50/80 border-2 border-gray-300 focus:border-[#FF5A00] focus:bg-white rounded-xl px-4 py-3.5 text-center text-[22px] font-black tracking-widest text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#FF5A00]/15 uppercase font-mono transition-all shadow-inner"
                />
                {searchingRide && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-[#FF5A00] animate-spin" />
                  </div>
                )}
              </div>

              {/* Ride Preview if found */}
              {previewRide && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left animate-in fade-in slide-in-from-top-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        {previewRide.status === 'live' ? 'Live Mesh Active' : 'Scheduled Ride'}
                      </span>
                    </div>
                    <h4 className="text-[13px] font-black text-emerald-950 truncate mt-0.5">{previewRide.name}</h4>
                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{previewRide.start_location || 'Coordinates verified'}</span>
                    </p>
                  </div>
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                </div>
              )}

              <button 
                type="submit"
                disabled={loading || code.trim().length < 5}
                className="w-full h-11 bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 transition-all shadow-sm shadow-[#FF5A00]/30 cursor-pointer text-[14px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Mesh...</span>
                  </>
                ) : (
                  <>
                    <span>Join Ride Pack</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Public & Nearby Active Rides Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#FF5A00]" />
                <h3 className="text-[14px] font-black text-gray-950 tracking-tight uppercase">Open Community Rides</h3>
              </div>
              <span className="text-[11px] text-gray-500 font-semibold">Instant Join</span>
            </div>

            {loadingPublic ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-28 animate-pulse" />
                ))}
              </div>
            ) : publicRides.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
                <Sparkles className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                <p className="text-[13px] font-bold text-gray-800">No public rides broadcasting nearby</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Enter a direct code above or create a new session.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {publicRides.map((ride) => (
                  <div 
                    key={ride.id}
                    className="bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:border-[#FF5A00] p-4 flex flex-col justify-between transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded leading-none ${
                          ride.status === 'live' 
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {ride.status === 'live' ? '● LIVE' : 'SCHEDULED'}
                        </span>
                        <span className="text-[11px] font-mono font-black text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          {ride.ride_code}
                        </span>
                      </div>
                      
                      <h4 className="text-[14px] font-bold text-gray-950 truncate leading-tight group-hover:text-[#FF5A00] transition-colors">
                        {ride.name}
                      </h4>

                      <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium mt-2">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          {ride.start_location ? ride.start_location.split(',')[0] : 'Open Route'}
                        </span>
                        {ride.ride_date && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {new Date(ride.ride_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoin(ride.ride_code)}
                      disabled={loading}
                      className="mt-3.5 w-full py-2 bg-gray-50 hover:bg-[#FF5A00] hover:text-white text-gray-800 text-[12px] font-bold rounded-lg border border-gray-200 hover:border-[#FF5A00] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Join Pack</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default JoinRide;
