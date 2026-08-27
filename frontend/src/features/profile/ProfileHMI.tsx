import React, { useEffect, useState } from 'react';
import { ChevronRight, Settings, Bell, Navigation2, Car, Map as MapIcon, ShieldCheck, Check, Bike, LogOut, Shield, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ToastContext';
import { Helmet } from 'react-helmet-async';
import { getDeterministicUuid } from '../../lib/user';
import { useLocationStore } from '../../store/useLocationStore';

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const ProfileHMI = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

  const [stats, setStats] = useState({ reports: 0, confirms: 0, trust: 100, rank: 0 });
  const [activityStats, setActivityStats] = useState({ totalRides: 0, totalNavigations: 0, kmTraveled: 0 });

  const globalLocationName = useLocationStore((state) => state.locationName);
  const locationError = useLocationStore((state) => state.error);
  const [locationName, setLocationName] = useState<string>('Finding location...');

  useEffect(() => {
    if (locationError) {
      setLocationName(locationError.includes('denied') ? 'Location Disabled' : 'Location Unavailable');
    } else if (globalLocationName) {
      setLocationName(globalLocationName);
    }
  }, [globalLocationName, locationError]);

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
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, showToast]);

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
    <React.Fragment>
    <Helmet>
      <title>Your Profile | Ride Club</title>
    </Helmet>

    <div className="w-full h-full bg-[#F2F4F7] flex flex-col font-sans overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0 px-5 pt-4 pb-2">
        <div>
          <h1 className="text-[#111111] font-semibold text-lg tracking-wide uppercase leading-tight">Profile</h1>
          <p className="text-[12px] text-gray-400 font-medium mt-0.5">Manage your identity</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/settings')} className="w-9 h-9 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center transition-all active:scale-95 shadow-sm">
            <Settings className="w-[18px] h-[18px] text-[#111111]" strokeWidth={1.8} />
          </button>
          <button onClick={() => navigate('/alerts')} className="w-9 h-9 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center transition-all active:scale-95 relative shadow-sm">
            <Bell className="w-[18px] h-[18px] text-[#111111]" strokeWidth={1.8} />
            <div className="absolute top-2 right-2 w-2 h-2 bg-[#FF5A00] rounded-full border border-white"></div>
          </button>
          <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-white hover:bg-red-50 border border-gray-200 flex items-center justify-center transition-all active:scale-95 shadow-sm">
            <LogOut className="w-[18px] h-[18px] text-red-500" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-6 flex flex-col gap-4">

        {/* Identity Card */}
        <div className="bg-white border border-gray-100 rounded-[8px] p-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-gray-100 overflow-hidden shadow-sm">
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button onClick={() => navigate('/edit-profile')} className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FF5A00] rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform border-2 border-white">
                <Settings className="w-3 h-3 text-white" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h2 className="text-[19px] font-semibold text-[#111111] leading-tight truncate">{fullName}</h2>
                {stats.trust >= 80 && <Check className="w-4 h-4 text-[#FF5A00] shrink-0" strokeWidth={3} />}
              </div>

              <p className="text-[12px] text-gray-400 font-medium truncate mb-2">{profileData?.email || user?.email}</p>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-lg">
                  <Heart className="w-3 h-3 text-red-500" />
                  <span className="text-[11px] font-semibold text-red-600">{profileData?.blood_group || 'No Blood Group'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-lg">
                  <ShieldCheck className="w-3 h-3 text-green-600" />
                  <span className="text-[11px] font-semibold text-green-700">Safe Rider</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Stats */}
        <div>
          <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Impact</h3>
          <div className="grid grid-cols-2 landscape:grid-cols-4 gap-3">
            <div onClick={() => navigate('/ride-history')} className="bg-white border border-gray-100 rounded-[8px] p-3.5 shadow-sm cursor-pointer hover:border-[#FF5A00]/40 transition-all active:scale-95 group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#FFF0E6] flex items-center justify-center">
                  <Car className="w-3.5 h-3.5 text-[#FF5A00]" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-medium text-gray-400">Rides</span>
              </div>
              <span className="text-[24px] font-semibold text-[#111111] tabular-nums">{activityStats.totalRides}</span>
            </div>

            <div onClick={() => navigate('/my-rides')} className="bg-white border border-gray-100 rounded-[8px] p-3.5 shadow-sm cursor-pointer hover:border-blue-300 transition-all active:scale-95 group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                  <Navigation2 className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-medium text-gray-400">Navigations</span>
              </div>
              <span className="text-[24px] font-semibold text-[#111111] tabular-nums">{activityStats.totalNavigations}</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-[8px] p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <MapIcon className="w-3.5 h-3.5 text-gray-500" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-medium text-gray-400">Distance</span>
              </div>
              <span className="text-[24px] font-semibold text-[#111111] tabular-nums">{activityStats.kmTraveled.toFixed(1)}<span className="text-[13px] font-semibold text-gray-400 ml-1">km</span></span>
            </div>

            <div className="bg-white border border-gray-100 rounded-[8px] p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-medium text-gray-400">Trust</span>
              </div>
              <span className="text-[24px] font-semibold text-[#111111] tabular-nums">{stats.trust}%</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</h3>
          <div className="bg-white border border-gray-100 rounded-[8px] shadow-sm flex flex-col overflow-hidden">
            <div onClick={() => navigate('/edit-profile')} className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FFF0E6] flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4 text-[#FF5A00]" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#111111]">Edit Details</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">Update personal info</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>

            <div className="p-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Bike className="w-4 h-4 text-blue-500" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#111111]">Bike Information</p>
                  <p className="text-[12px] text-gray-400 mt-0.5 truncate">{bModel}</p>
                </div>
              </div>
              <span className="bg-[#FFF0E6] text-[#FF5A00] text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wider shrink-0">{bNumber}</span>
            </div>

            <div onClick={() => navigate('/support')} className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-green-600" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#111111]">Help & Support</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">Contact us</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        </div>

      </div>
    </div>
    </React.Fragment>
  );
};

export default ProfileHMI;
