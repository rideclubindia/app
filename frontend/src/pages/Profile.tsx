import React, { useEffect, useState } from 'react';
import { ChevronRight, Settings, Bell, MapPin, Bookmark, Clock, Star, Download, LogOut, Check, ShieldCheck, Bike, AlertTriangle, Navigation, Flame, Navigation2, Car, Map, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastContext';
import { Helmet } from 'react-helmet-async';
import { getDeterministicUuid } from '../lib/user';
import { useLocationStore } from '../store/useLocationStore';
import LottiePackage from 'lottie-react';
import bikeAnimation from '../assets/bike.json';

// Handle CommonJS/ESM interop for Lottie
const Lottie = (LottiePackage as any).default || LottiePackage;

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const Profile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

  const [stats, setStats] = useState({ reports: 0, confirms: 0, trust: 100, rank: 0 });
  const [activityStats, setActivityStats] = useState({ totalRides: 0, totalNavigations: 0, kmTraveled: 0 });

  // Use global location store for location name
  const globalLocationName = useLocationStore((state) => state.locationName);
  const locationError = useLocationStore((state) => state.error);
  
  // Keep local state for compatibility, but sync with global
  const [locationName, setLocationName] = useState<string>('Finding location...');

  useEffect(() => {
    if (locationError) {
      setLocationName(locationError.includes('denied') ? 'Location Disabled' : 'Location Unavailable');
    } else if (globalLocationName) {
      setLocationName(globalLocationName);
    }
  }, [globalLocationName, locationError]);

  const [savedLocations, setSavedLocations] = useState<any[]>([]);

  const resolveProfileId = async (firebaseUid: string): Promise<string | null> => {
    const deterministicUid = getDeterministicUuid(firebaseUid);

    const { data: byIdRows, error: byIdError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', [firebaseUid, deterministicUid])
      .limit(1);

    if (!byIdError && byIdRows && byIdRows.length > 0) {
      return String(byIdRows[0].id);
    }

    const email = auth.currentUser?.email;
    if (!email) return null;

    const { data: byEmailRows, error: byEmailError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (byEmailError) return null;
    return byEmailRows && byEmailRows.length > 0 ? String(byEmailRows[0].id) : null;
  };

  useEffect(() => {
    const fetchUserData = async (uid: string) => {
      const userUuid = getDeterministicUuid(uid);
      const user = auth.currentUser;
      const displayName = user?.displayName || user?.email?.split('@')[0] || '';
      
      try {
        const profileId = await resolveProfileId(uid);
        if (profileId) {
          const { data: pData } = await supabase.from('profiles').select('*').eq('id', profileId).single();
          if (pData) setProfileData(pData);
          
          // Removed emergency_contacts fetch since the table doesn't exist
        }

        let reportsCount = 0;
        if (displayName) {
          const { count } = await supabase.from('pins').select('*', { count: 'exact', head: true }).eq('reporter_name', displayName);
          reportsCount = count || 0;
        }

        const { data: confData } = await supabase.from('confirmations').select('is_false, created_at, pin_id, pins(category)').eq('user_id', userUuid);
        
        let confirms = 0;
        let falses = 0;
        if (confData) {
          confData.forEach(c => {
            c.is_false === true ? falses++ : confirms++;
          });
        }
        const totalVotes = confirms + falses;
        const trust = totalVotes === 0 ? 100 : Math.max(0, Math.floor((confirms / totalVotes) * 100));
        
        setStats({ reports: reportsCount || 0, confirms, trust, rank: (reportsCount || 0) + confirms });

        const [ownedRidesRes, rideLocationsRes, rideMembersRes] = await Promise.all([
          supabase.from('rides').select('id').eq('owner_id', uid),
          supabase.from('ride_locations').select('ride_id').eq('user_id', uid),
          supabase.from('ride_members').select('ride_id').in('user_id', [uid, userUuid].filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))
        ]);

        const rideIdSet = new Set<string>();
        (ownedRidesRes.data || []).forEach((r: any) => r?.id && rideIdSet.add(String(r.id)));
        (rideLocationsRes.data || []).forEach((r: any) => r?.ride_id && rideIdSet.add(String(r.ride_id)));
        (rideMembersRes.data || []).forEach((r: any) => r?.ride_id && rideIdSet.add(String(r.ride_id)));

        const totalRides = rideIdSet.size;
        
        const { data: navSessions } = await supabase
          .from('navigation_sessions')
          .select('origin_lat, origin_lng, dest_lat, dest_lng, created_at, status, dest_name')
          .eq('user_id', userUuid);
        
        const totalNavigations = navSessions ? navSessions.length : 0;
        
        let totalDistanceKm = 0;
        if (navSessions) {
          navSessions.forEach(session => {
            if (session.status === 'completed' && session.origin_lat && session.origin_lng && session.dest_lat && session.dest_lng) {
              totalDistanceKm += getDistanceKm(session.origin_lat, session.origin_lng, session.dest_lat, session.dest_lng);
            }
          });
        }
        
        setActivityStats({
          totalRides: totalRides || 0,
          totalNavigations,
          kmTraveled: totalDistanceKm
        });



      } catch (e) {
        console.error(e);
        showToast('Failed to load profile data', 'error');
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser.uid);
        fetchSavedLocations(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, showToast]);

  const fetchSavedLocations = async (uid: string) => {
    try {
      const profileId = await resolveProfileId(uid);
      if (!profileId) return;

      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedLocations(data || []);
    } catch (e) {
      console.error('Error fetching saved locations:', e);
    }
  };

  const handleDeleteLocation = async (id: string, name: string) => {
    try {
      const { error } = await supabase.from('saved_locations').delete().eq('id', id);
      if (error) throw error;
      showToast(`"${name}" deleted`, 'success');
      fetchSavedLocations(user.uid);
    } catch (e) {
      console.error('Error deleting location:', e);
      showToast('Failed to delete location', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.clear();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('ride_club_permissions_accepted_')) localStorage.removeItem(key);
      });
      await signOut(auth);
      navigate('/login');
    } catch (e) {
      showToast('Failed to logout', 'error');
    }
  };

  const avatarUrl = profileData?.avatar_url || user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || user?.email?.split('@')[0] || "User"}&background=FF6600&color=fff`;
  const fullName = profileData?.full_name || user?.displayName || user?.email?.split('@')[0] || "User";

  return (
    <div className="w-full h-full bg-[#F7F8FA] flex flex-col font-sans overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <Helmet>
        <title>Your Profile | Ride Club</title>
      </Helmet>
      
      {/* Top Header */}
      <div className="px-[24px] pt-4 pb-4 bg-[#F7F8FA] flex-shrink-0 flex justify-between items-start z-10">
        <div>
          <h1 className="text-[32px] font-bold text-[#14142B] leading-tight tracking-tight">Profile</h1>
          <p className="text-[14px] font-medium text-[#6E7191] mt-1">Manage your account</p>
        </div>
        <div className="flex gap-3 pb-1">
          <button onClick={() => navigate('/settings')} className="w-[42px] h-[42px] bg-white rounded-full flex items-center justify-center text-[#4E4B66] border border-[#EFF0F6] shadow-sm hover:scale-95 active:scale-[0.98] transition-transform">
            <Settings className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button onClick={() => navigate('/alerts')} className="w-[42px] h-[42px] bg-white rounded-full flex items-center justify-center text-[#4E4B66] border border-[#EFF0F6] shadow-sm hover:scale-95 active:scale-[0.98] transition-transform relative">
            <Bell className="w-5 h-5" strokeWidth={1.5} />
            <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#EF4444] rounded-full border-2 border-white"></div>
          </button>
                  {/* Logout */}
        <button onClick={handleLogout} className="w-10 h-10 bg-white rounded-full flex items-center justify-center gap-2 hover:bg-[#FEF2F2] hover:border-[#EF4444]/30 active:scale-[0.98] transition-all mb-8 shadow-sm">
          <LogOut className="w-5 h-5 text-[#EF4444]" strokeWidth={2} />
        </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-[12px]">
        
        {/* Profile Hero Card */}
        <div className="relative w-full overflow-hidden rounded-[12px] bg-white p-[20px] mb-[12px] shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-[#EFF0F6]">
          {/* Subtle background decoration (city skyline) */}
          <div className="absolute right-0 top-0 w-[60%] h-[150px] opacity-40 pointer-events-none z-0 rounded-tr-[28px] overflow-hidden">
             <img src="https://cdni.iconscout.com/illustration/premium/thumb/city-skyline-5355609-4475510.png" alt="city" className="w-full h-full object-cover object-left opacity-20 filter grayscale" />
          </div>

          <div className="absolute top-6 right-5 z-20">
            <ChevronRight className="w-5 h-5 text-[#14142B] stroke-[2.5]" />
          </div>

          <div className="relative z-10 flex gap-4 items-start">
            {/* Left: Avatar */}
            <div className="relative">
              <div className="w-[84px] h-[84px] rounded-full border-[3px] border-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden bg-white shrink-0 relative">
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button onClick={() => navigate('/edit-profile')} className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100">
                <svg className="w-3.5 h-3.5 text-[#14142B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            
            {/* Center: Info */}
            <div className="flex-1 z-10 flex flex-col pr-[85px] pt-1">
              <div className="flex items-center gap-1.5 mb-2">
                <h2 className="text-[20px] font-bold text-[#14142B] leading-none tracking-tight">{fullName}</h2>
                <svg className="w-[16px] h-[16px] text-[#FF7A00]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
              
              {stats.trust >= 80 && (
                <div className="inline-flex items-center gap-1.5 bg-[#FFF3E7] px-2.5 py-[3px] rounded-full mb-3 w-fit">
                  <Check className="w-[12px] h-[12px] text-[#FF7A00]" strokeWidth={3} />
                  <span className="text-[11px] font-bold text-[#FF7A00]">Verified Rider</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-1.5">
                <svg className="w-[14px] h-[14px] text-[#A0A3BD]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <p className="text-[12px] font-semibold text-[#6E7191]">{profileData?.phone_number || user?.phoneNumber || 'No phone number'}</p>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-[14px] h-[14px] text-[#A0A3BD]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <p className="text-[12px] font-semibold text-[#6E7191]">{profileData?.email || user?.email || 'No email'}</p>
              </div>
              
              {/* Health/Safety Pills */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#EF4444] text-[14px] leading-none">🩸</span>
                  <span className="text-[12px] font-bold text-[#A0A3BD]">{profileData?.blood_group || 'Not set'}</span>
                </div>
                <div className="w-[1px] h-[14px] bg-[#EFF0F6]"></div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-[14px] h-[14px] text-[#22C55E]" strokeWidth={2.5} />
                  <span className="text-[12px] font-bold text-[#22C55E]">Safe Rider</span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Right: Illustration Background */}
          <div className="absolute right-0 top-[10px] opacity-100 pointer-events-none z-0 w-[200px] h-[200px] flex justify-end">
             <Lottie animationData={bikeAnimation} loop={true} className="w-full h-full object-cover translate-x-12 opacity-90" />
          </div>
          
          {/* Current Location Box */}
          <div className="mt-5 flex items-center justify-between bg-white px-3 py-[10px] rounded-[8px]  border border-[#273a5a33] z-20 relative">
            <div className="flex items-center gap-3">
              <div className="w-[42px] h-[42px] rounded-[12px] bg-[#FF7A00] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-[20px] h-[20px] text-white" fill="currentColor" strokeWidth={1} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#FF7A00] leading-none mb-1">Current Location</p>
                <p className="text-[11px] font-semibold text-[#6E7191] leading-tight max-w-[150px] truncate">{locationName}</p>
              </div>
            </div>
            <button onClick={() => navigate('/map')} className="text-[12px] font-bold text-[#FF7A00] border border-[#FF7A00] px-3.5 py-1.5 rounded-full hover:bg-[#FFF3E7] active:scale-[0.98] transition-all flex items-center gap-1 flex-shrink-0">
              View on Map
              <MapPin className="w-3 h-3" />
            </button>
          </div>
        </div>
        {/* Your Impact (Ride Stats) */}
        <div className="mb-[12px]">
          <h3 className="text-[18px] font-bold text-[#14142B] mb-3 px-1">Your Impact</h3>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Total Rides */}
            <div onClick={() => navigate('/ride-history')} className="bg-white rounded-[20px] p-4 border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#FFF3E7] flex items-center justify-center">
                  <Car className="w-4 h-4 text-[#FF7A00]" strokeWidth={2.5} />
                </div>
                <span className="text-[12px] font-bold text-[#6E7191]">Total Rides</span>
              </div>
              <span className="text-[24px] font-black text-[#14142B]">{activityStats.totalRides}</span>
            </div>

            {/* Navigations */}
            <div onClick={() => navigate('/my-rides')} className="bg-white rounded-[20px] p-4 border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#E5F1FF] flex items-center justify-center">
                  <Navigation2 className="w-4 h-4 text-[#007AFF]" strokeWidth={2.5} />
                </div>
                <span className="text-[12px] font-bold text-[#6E7191]">Navigations</span>
              </div>
              <span className="text-[24px] font-black text-[#14142B]">{activityStats.totalNavigations}</span>
            </div>

            {/* Distance */}
            <div className="bg-white rounded-[20px] p-4 border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#F4F4F6] flex items-center justify-center">
                  <Map className="w-4 h-4 text-[#A0A3BD]" strokeWidth={2.5} />
                </div>
                <span className="text-[12px] font-bold text-[#6E7191]">Distance</span>
              </div>
              <span className="text-[24px] font-black text-[#14142B]">{activityStats.kmTraveled.toFixed(1)}<span className="text-[14px] font-bold text-[#A0A3BD] ml-1">km</span></span>
            </div>

            {/* Trust Score */}
            <div className="bg-white rounded-[20px] p-4 border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#E6F4EA] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#22C55E]" strokeWidth={2.5} />
                </div>
                <span className="text-[12px] font-bold text-[#6E7191]">Trust Score</span>
              </div>
              <span className="text-[24px] font-black text-[#14142B]">{stats.trust}%</span>
            </div>
          </div>

          {/* Incidents & Confirms */}
          <div className="bg-white rounded-[20px] p-4 border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFEAE6] flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#FF4D4D]" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#6E7191]">Incidents</p>
                <p className="text-[18px] font-black text-[#14142B] leading-none mt-1">{stats.reports}</p>
              </div>
            </div>
            <div className="w-[1px] h-10 bg-[#EFF0F6]"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[12px] font-bold text-[#6E7191]">Confirms</p>
                <p className="text-[18px] font-black text-[#14142B] leading-none mt-1">{stats.confirms}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E6F4EA] flex items-center justify-center">
                <Check className="w-5 h-5 text-[#22C55E]" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="flex flex-col gap-2 mb-[32px]">
          {/* Edit Profile */}
          <div onClick={() => navigate('/edit-profile')} className="bg-white rounded-[20px] p-4 flex items-center justify-between border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FFF3E7] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#FF7A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#14142B]">Edit Profile Details</p>
                <p className="text-[13px] font-medium text-[#6E7191] mt-0.5">Update personal info & garage</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#A0A3BD]" />
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-[20px] p-4 flex items-center justify-between border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FFEAE6] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#FF4D4D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#14142B]">Emergency Contact</p>
                <p className="text-[13px] font-medium text-[#6E7191] mt-0.5">{profileData?.emergency_contact || 'No contacts added'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${profileData?.emergency_contact ? 'bg-[#E6F4EA] text-[#22C55E]' : 'bg-[#F2F2F2] text-[#A0A3BD]'}`}>
                {profileData?.emergency_contact ? 'Active' : 'Setup'}
              </span>
            </div>
          </div>

          {/* Bike Information */}
          {(() => {
            let bModel = 'Not set';
            let bNumber = 'Not set';
            if (profileData?.bike_details) {
              if (typeof profileData.bike_details === 'object') {
                bModel = profileData.bike_details.model || bModel;
                bNumber = profileData.bike_details.number || bNumber;
              } else if (typeof profileData.bike_details === 'string') {
                try {
                  const parsed = JSON.parse(profileData.bike_details);
                  bModel = parsed.model || bModel;
                  bNumber = parsed.number || bNumber;
                } catch (e) {
                  bModel = profileData.bike_details || bModel;
                }
              }
            }
            return (
              <div className="bg-white rounded-[20px] p-4 flex items-center justify-between border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#E5F1FF] flex items-center justify-center">
                    <Bike className="w-6 h-6 text-[#007AFF]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#14142B]">Bike Information</p>
                    <p className="text-[13px] font-medium text-[#6E7191] mt-0.5">{bModel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#FFF3E7] text-[#FF7A00] text-[11px] font-bold px-2.5 py-1 rounded-md">{bNumber}</span>
                </div>
              </div>
            );
          })()}

          {/* Safety & Security */}
          <div className="bg-white rounded-[20px] p-4 flex items-center justify-between border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#E6F4EA] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#22C55E]" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#14142B]">Safety & Security</p>
                <p className="text-[13px] font-medium text-[#6E7191] mt-0.5">Manage your safety settings</p>
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div onClick={() => navigate('/support')} className="bg-white rounded-[20px] p-4 flex items-center justify-between border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FFF3E7] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#FF7A00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#14142B]">Help & Support</p>
                <p className="text-[13px] font-medium text-[#6E7191] mt-0.5">FAQs, support and more</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#A0A3BD]" />
          </div>

          {/* Settings */}
          <div className="bg-white rounded-[20px] p-4 flex items-center justify-between border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#E5F1FF] flex items-center justify-center">
                <Settings className="w-6 h-6 text-[#007AFF]" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#14142B]">Settings</p>
                <p className="text-[13px] font-medium text-[#6E7191] mt-0.5">App preferences and account</p>
              </div>
            </div>
          </div>
        </div>

        {/* Removed inline Saved Locations List (moved to separate page) */}

      </div>
    </div>
  );
};

export default Profile;
