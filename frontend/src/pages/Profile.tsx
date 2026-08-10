import React, { useEffect, useState } from 'react';
import { ChevronRight, Settings, Bell, MapPin, Navigation2, Car, Map as MapIcon, ShieldCheck, Check, Bike, LogOut, Shield, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastContext';
import { Helmet } from 'react-helmet-async';
import { getDeterministicUuid } from '../lib/user';
import { useLocationStore } from '../store/useLocationStore';
import { CockpitLayout } from '../components/spatial/CockpitLayout';
import { SpatialMembrane } from '../components/spatial/SpatialMembrane';

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
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser.uid);
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
    <CockpitLayout 
      mapChildren={
        <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
          <div className="absolute w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -top-[300px] -right-[200px]"></div>
          <div className="absolute w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -bottom-[300px] -left-[100px]"></div>
        </div>
      }
    >
      <Helmet>
        <title>Your Profile | Ride Club</title>
      </Helmet>
      
      <SpatialMembrane position="left" className="w-[420px] p-5 flex flex-col gap-6 max-h-[100dvh]">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 mb-2">
          <div>
            <h1 className="text-[28px] font-bold text-white tracking-tight leading-none">Profile</h1>
            <p className="text-[14px] text-white/50 mt-1">Manage your identity</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95">
              <Settings className="w-5 h-5 text-white/80" strokeWidth={1.5} />
            </button>
            <button onClick={() => navigate('/alerts')} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95 relative">
              <Bell className="w-5 h-5 text-white/80" strokeWidth={1.5} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#1a1a1a]"></div>
            </button>
            <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all active:scale-95">
              <LogOut className="w-5 h-5 text-red-400" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-5 pb-8">
          
          {/* Identity Card */}
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-white/20 overflow-hidden shadow-2xl shrink-0">
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <button onClick={() => navigate('/edit-profile')} className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform border-2 border-[#1a1a1a]">
                  <Settings className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[22px] font-bold text-white leading-none tracking-tight">{fullName}</h2>
                  {stats.trust >= 80 && <Check className="w-[18px] h-[18px] text-primary" strokeWidth={3} />}
                </div>
                
                <p className="text-[13px] text-white/60 mb-2 font-medium">{profileData?.email || user?.email}</p>
                
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                    <Heart className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[12px] font-bold text-white/80">{profileData?.blood_group || 'No Blood Group'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-[12px] font-bold text-white/80">Safe Rider</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Stats */}
          <div>
            <h3 className="text-[16px] font-bold text-white mb-3 tracking-tight">Your Impact</h3>
            <div className="grid grid-cols-2 gap-3">
              <div onClick={() => navigate('/ride-history')} className="bg-white/5 border border-white/10 rounded-[20px] p-4 backdrop-blur-md cursor-pointer hover:bg-white/10 transition-all active:scale-95 group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Car className="w-4 h-4 text-primary" strokeWidth={2.5} />
                  </div>
                  <span className="text-[13px] font-medium text-white/60">Rides</span>
                </div>
                <span className="text-[28px] font-black text-white group-hover:text-primary transition-colors">{activityStats.totalRides}</span>
              </div>
              
              <div onClick={() => navigate('/my-rides')} className="bg-white/5 border border-white/10 rounded-[20px] p-4 backdrop-blur-md cursor-pointer hover:bg-white/10 transition-all active:scale-95 group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Navigation2 className="w-4 h-4 text-blue-400" strokeWidth={2.5} />
                  </div>
                  <span className="text-[13px] font-medium text-white/60">Navigations</span>
                </div>
                <span className="text-[28px] font-black text-white group-hover:text-blue-400 transition-colors">{activityStats.totalNavigations}</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[20px] p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <MapIcon className="w-4 h-4 text-white/70" strokeWidth={2.5} />
                  </div>
                  <span className="text-[13px] font-medium text-white/60">Distance</span>
                </div>
                <span className="text-[28px] font-black text-white">{activityStats.kmTraveled.toFixed(1)}<span className="text-[16px] font-bold text-white/40 ml-1">km</span></span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[20px] p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-green-400" strokeWidth={2.5} />
                  </div>
                  <span className="text-[13px] font-medium text-white/60">Trust</span>
                </div>
                <span className="text-[28px] font-black text-white">{stats.trust}%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2 mt-2">
             <div onClick={() => navigate('/edit-profile')} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-white">Edit Details</p>
                    <p className="text-[13px] text-white/50 mt-0.5">Update personal info</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
             </div>

             <div className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Bike className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-white">Bike Information</p>
                    <p className="text-[13px] text-white/50 mt-0.5">{bModel}</p>
                  </div>
                </div>
                <span className="bg-primary/20 text-primary border border-primary/30 text-[11px] font-bold px-3 py-1 rounded-full tracking-wider">{bNumber}</span>
             </div>
             
             <div onClick={() => navigate('/support')} className="bg-white/5 border border-white/10 rounded-[16px] p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-white">Help & Support</p>
                    <p className="text-[13px] text-white/50 mt-0.5">Contact us</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
             </div>
          </div>

        </div>
      </SpatialMembrane>
    </CockpitLayout>
  );
};

export default Profile;
