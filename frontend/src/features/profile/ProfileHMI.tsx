import React, { useEffect, useState } from 'react';
import { Settings, Bell, Car, ShieldCheck, Check, Bike, LogOut, Heart, ChevronLeft, History, UsersRound, LifeBuoy, MapPin, Target, Sunrise, Mountain, Route as RouteIcon } from 'lucide-react';
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
  const [monthlyKm, setMonthlyKm] = useState<{ label: string; km: number }[]>([]);
  const [earlyBirdCount, setEarlyBirdCount] = useState(0);
  const [groupsLedCount, setGroupsLedCount] = useState(0);
  const [myRides, setMyRides] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'rides' | 'groups' | 'achievements'>('overview');

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
        let earlyBirds = 0;
        // Last 9 months, real per-month distance from completed navigation sessions.
        const months: { label: string; key: string; km: number }[] = [];
        for (let i = 8; i >= 0; i--) {
          const d = new Date();
          d.setDate(1);
          d.setMonth(d.getMonth() - i);
          months.push({ label: d.toLocaleDateString([], { month: 'short' }), key: `${d.getFullYear()}-${d.getMonth()}`, km: 0 });
        }
        if (navSessions) {
          navSessions.forEach(session => {
            if (session.status === 'completed' && session.origin_lat && session.origin_lng && session.dest_lat && session.dest_lng) {
              const km = getDistanceKm(session.origin_lat, session.origin_lng, session.dest_lat, session.dest_lng);
              totalDistanceKm += km;
              const created = new Date(session.created_at);
              if (created.getHours() < 7) earlyBirds++;
              const key = `${created.getFullYear()}-${created.getMonth()}`;
              const bucket = months.find(m => m.key === key);
              if (bucket) bucket.km += km;
            }
          });
        }
        setMonthlyKm(months.map(m => ({ label: m.label, km: Math.round(m.km) })));
        setEarlyBirdCount(earlyBirds);

        setActivityStats({
          totalRides: totalRides || 0,
          totalNavigations,
          kmTraveled: totalDistanceKm
        });

        // Rides the user owns or has joined — for the "Rides" tab.
        if (rideIdSet.size > 0) {
          const { data: ridesData } = await supabase
            .from('rides')
            .select('id, name, ride_date, image_url, start_location, destination, status')
            .in('id', Array.from(rideIdSet))
            .order('ride_date', { ascending: false });
          setMyRides(ridesData || []);
        }

        // Groups the user is a member of — for the "Groups" tab.
        const { data: memberRows } = await supabase.from('group_members').select('group_id').eq('user_id', uid);
        const groupIds = (memberRows || []).map(r => r.group_id);
        if (groupIds.length > 0) {
          const { data: groupsData } = await supabase.from('groups').select('*, group_members(count)').in('id', groupIds);
          setMyGroups(groupsData || []);
        }
        const { count: ledCount } = await supabase.from('groups').select('*', { count: 'exact', head: true }).eq('admin_id', uid);
        setGroupsLedCount(ledCount || 0);

      } catch (e) {
        console.error(e);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      let activeUid = currentUser?.uid;
      const rieToken = localStorage.getItem('rie_token');
      if (!activeUid && rieToken) {
        try {
          const payload = JSON.parse(atob(rieToken.split('.')[1]));
          if (payload.uid) activeUid = payload.uid;
        } catch (e) {}
      }

      if (activeUid) {
        setUser(currentUser || { uid: activeUid });
        fetchUserData(activeUid);
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

  // Every achievement here is a threshold computed from real accumulated
  // stats/queries above — none of these are invented counts.
  const achievements = [
    { id: 'first-ride', label: 'First Ride', icon: RouteIcon, earned: activityStats.totalRides >= 1, tint: '#DFF3E3', color: '#1A9A5C' },
    { id: '100km', label: '100 KM', icon: Mountain, earned: activityStats.kmTraveled >= 100, tint: '#FFE7D1', color: '#FF6B22' },
    { id: 'early-bird', label: 'Early Bird', icon: Sunrise, earned: earlyBirdCount >= 1, tint: '#FFF3D1', color: '#C99A1A' },
    { id: 'group-leader', label: 'Group Leader', icon: UsersRound, earned: groupsLedCount >= 1, tint: '#EDE6FB', color: '#7C4DFF' },
    { id: 'safety-champ', label: 'Safety Champ', icon: ShieldCheck, earned: stats.trust >= 90, tint: '#FBE4E4', color: '#E85D67' },
  ];
  const earnedAchievements = achievements.filter(a => a.earned);

  // Real next-goal progress: next round 500km milestone above current distance.
  const goalTarget = Math.max(500, (Math.floor(activityStats.kmTraveled / 500) + 1) * 500);
  const goalPct = Math.min(100, (activityStats.kmTraveled / goalTarget) * 100);

  const maxMonthlyKm = Math.max(1, ...monthlyKm.map(m => m.km));

  const formatRoute = (ride: any) => [ride.start_location?.name, ride.destination?.name].filter(Boolean).join(' → ') || 'Route TBD';

  return (
    <React.Fragment>
    <Helmet>
      <title>Your Profile | Ride Club</title>
    </Helmet>

    <div className="w-full h-full bg-app-canvas flex flex-col font-sans overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all active:scale-95 cursor-pointer">
          <ChevronLeft className="w-[18px] h-[18px] text-gray-700" strokeWidth={2} />
        </button>
        <div className="flex gap-2.5">
          <button onClick={() => navigate('/alerts')} aria-label="Alerts" className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all active:scale-95 cursor-pointer">
            <Bell className="w-[18px] h-[18px] text-gray-700" strokeWidth={2} />
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-[#FF6B22] rounded-full"></span>
          </button>
          <button onClick={() => navigate('/edit-profile')} aria-label="Settings" className="w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all active:scale-95 cursor-pointer">
            <Settings className="w-[18px] h-[18px] text-gray-700" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-6 flex flex-col gap-5 max-w-[520px] w-full mx-auto">

        {/* Identity */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-sm">
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button onClick={() => navigate('/edit-profile')} className="absolute -bottom-1 -right-1 w-10 h-10 btn-app-primary rounded-full flex items-center justify-center hover:scale-105 transition-transform border-2 border-white cursor-pointer" aria-label="Edit profile photo">
              <Settings className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 mt-3">
            <h2 className="text-[19px] font-bold text-gray-950 leading-tight">{fullName}</h2>
            {stats.trust >= 80 && <Check className="w-4 h-4 text-[#FF6B22] shrink-0" strokeWidth={3} />}
          </div>
          <p className="text-[12px] text-gray-500 font-medium">{profileData?.email || user?.email}</p>

          <div className="flex items-center gap-2 flex-wrap justify-center mt-2.5">
            <div className="flex items-center gap-1.5 bg-red-100 px-2.5 py-1 rounded-full">
              <Heart className="w-3 h-3 text-red-700" />
              <span className="text-[11px] font-semibold text-red-800">{profileData?.blood_group || 'No Blood Group'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-100 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-800" />
              <span className="text-[11px] font-semibold text-emerald-900">Safe Rider</span>
            </div>
            {locationName && locationName !== 'Finding location...' && (
              <div className="flex items-center gap-1 text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="text-[11px] font-medium">{locationName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-5 border-b border-gray-100">
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'rides', label: `Rides (${myRides.length})` },
            { id: 'groups', label: `Groups (${myGroups.length})` },
            { id: 'achievements', label: `Achievements (${earnedAchievements.length})` },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-2.5 text-[13px] font-bold cursor-pointer border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id ? 'text-[#FF6B22] border-[#FF6B22]' : 'text-gray-400 border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
        <>
        {/* Stats row — bento grid of equal supporting tiles (same surface as
            card-app, laid out with the shared responsive bento grid). */}
        <div className="bento-grid">
          <div className="bento-tile p-3.5 flex items-center gap-2.5">
            <div className="w-9 h-9 icon-badge bg-[#FFE7D1] shrink-0"><RouteIcon className="w-4 h-4 text-[#FF6B22]" /></div>
            <div><span className="text-[18px] font-black text-gray-950 tabular-nums block leading-tight">{activityStats.totalRides}</span><span className="text-[10px] font-semibold text-gray-500">Total Rides</span></div>
          </div>
          <div className="bento-tile p-3.5 flex items-center gap-2.5">
            <div className="w-9 h-9 icon-badge bg-[#E4E9FB] shrink-0"><Mountain className="w-4 h-4 text-[#3B5BDB]" /></div>
            <div><span className="text-[18px] font-black text-gray-950 tabular-nums block leading-tight">{activityStats.kmTraveled.toFixed(0)}</span><span className="text-[10px] font-semibold text-gray-500">Distance (KM)</span></div>
          </div>
          <div className="bento-tile p-3.5 flex items-center gap-2.5">
            <div className="w-9 h-9 icon-badge bg-[#DFF3E3] shrink-0"><Bell className="w-4 h-4 text-[#1A9A5C]" /></div>
            <div><span className="text-[18px] font-black text-gray-950 tabular-nums block leading-tight">{activityStats.totalNavigations}</span><span className="text-[10px] font-semibold text-gray-500">Navigations</span></div>
          </div>
          <div className="bento-tile p-3.5 flex items-center gap-2.5">
            <div className="w-9 h-9 icon-badge bg-[#FBE4E4] shrink-0"><ShieldCheck className="w-4 h-4 text-[#E85D67]" /></div>
            <div><span className="text-[18px] font-black text-gray-950 tabular-nums block leading-tight">{stats.trust}%</span><span className="text-[10px] font-semibold text-gray-500">Trust Score</span></div>
          </div>
        </div>

        {/* Distance chart — real per-month totals from navigation_sessions */}
        <div className="card-app-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold text-gray-950">Distance (last 9 months)</span>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-[100px]">
            {monthlyKm.map(m => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                <div className="w-full rounded-md bg-[#FF6B22]/85" style={{ height: `${Math.max(4, (m.km / maxMonthlyKm) * 84)}px` }} title={`${m.km} km`} />
                <span className="text-[9px] font-semibold text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-bold text-gray-950">Achievements</h3>
            <button onClick={() => setTab('achievements')} className="text-[11px] font-bold text-[#FF6B22] cursor-pointer">See All</button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {achievements.map(a => (
              <div key={a.id} className={`flex flex-col items-center gap-1 ${a.earned ? '' : 'opacity-35 grayscale'}`}>
                <div className="w-11 h-11 icon-badge" style={{ backgroundColor: a.tint }}>
                  <a.icon className="w-5 h-5" style={{ color: a.color }} />
                </div>
                <span className="text-[9px] font-bold text-gray-700 text-center leading-tight">{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next goal — real progress (kmTraveled), round-number milestone target */}
        <div className="card-app-lg p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 icon-badge bg-[#FFE7D1] shrink-0">
            <Target className="w-5 h-5 text-[#FF6B22]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-bold text-gray-950">Next Goal: Reach {goalTarget} KM</span>
              <span className="text-[11px] font-bold text-gray-500">{activityStats.kmTraveled.toFixed(0)}/{goalTarget} KM</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full btn-app-primary rounded-full" style={{ width: `${goalPct}%` }} />
            </div>
          </div>
        </div>

        {/* Menu grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: Settings, label: 'Edit Details', path: '/edit-profile', tint: '#FFE7D1', color: '#FF6B22' },
            { icon: Bike, label: 'My Bike', path: '/edit-profile', tint: '#E4E9FB', color: '#3B5BDB' },
            { icon: History, label: 'Ride History', path: '/ride-history', tint: '#F6E4FB', color: '#A83BDB' },
            { icon: LifeBuoy, label: 'Support', path: '/support', tint: '#E4FBEF', color: '#1A9A5C' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="card-app p-3.5 flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <div className="w-10 h-10 icon-badge" style={{ backgroundColor: item.tint }}>
                <item.icon className="w-4.5 h-4.5" style={{ color: item.color }} />
              </div>
              <span className="text-[10.5px] font-bold text-gray-700 text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Bike info card — kept as a real-data row from the original screen */}
        <div className="card-app p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 icon-badge bg-blue-100 shrink-0">
              <Car className="w-4 h-4 text-blue-700" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-950">Bike Information</p>
              <p className="text-[11px] text-gray-500 mt-0.5 truncate">{bModel}</p>
            </div>
          </div>
          <span className="bg-[#FFE7D1] text-[#FF6B22] text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wider shrink-0">{bNumber}</span>
        </div>

        {/* Logout — bottom-anchored, full-width for one-handed (left-thumb) reach */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98] cursor-pointer"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          Log Out
        </button>
        </>
        )}

        {tab === 'rides' && (
          <div className="flex flex-col gap-2.5">
            {myRides.length === 0 ? (
              <div className="card-app p-6 text-center">
                <p className="text-[13px] font-semibold text-gray-500">No rides yet.</p>
                <button onClick={() => navigate('/ride-plus/create')} className="mt-3 px-4 py-2 btn-app-primary text-white text-[12px] font-bold rounded-full cursor-pointer">Create a Ride</button>
              </div>
            ) : myRides.map(ride => (
              <button key={ride.id} onClick={() => navigate(`/ride-plus/view/${ride.id}`)} className="card-app p-2.5 flex items-center gap-3 text-left cursor-pointer">
                {ride.image_url && <img src={ride.image_url} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-gray-950 truncate">{ride.name || 'Ride'}</h4>
                  <p className="text-[11px] text-gray-500 font-medium truncate">{formatRoute(ride)}</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{ride.ride_date ? new Date(ride.ride_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date TBD'}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ride.status === 'live' ? 'bg-[#FF6B22] text-white' : 'bg-gray-100 text-gray-600'}`}>{ride.status === 'live' ? 'LIVE' : ride.status?.toUpperCase() || 'DONE'}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'groups' && (
          <div className="flex flex-col gap-2.5">
            {myGroups.length === 0 ? (
              <div className="card-app p-6 text-center">
                <p className="text-[13px] font-semibold text-gray-500">You haven't joined any groups yet.</p>
                <button onClick={() => navigate('/groups')} className="mt-3 px-4 py-2 btn-app-primary text-white text-[12px] font-bold rounded-full cursor-pointer">Find Groups</button>
              </div>
            ) : myGroups.map(group => (
              <button key={group.id} onClick={() => navigate('/groups')} className="card-app p-3 flex items-center gap-3 text-left cursor-pointer">
                <div className="w-11 h-11 rounded-full bg-[#FFE3D1] flex items-center justify-center shrink-0">
                  <span className="text-[#FF6B22] font-bold text-[14px]">{group.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-gray-950 truncate">{group.name}</h4>
                  <p className="text-[11px] text-gray-500 font-medium">{group.group_members?.[0]?.count || 0} members {group.admin_id === user?.uid && '· You lead this group'}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'achievements' && (
          <div className="grid grid-cols-3 gap-2.5">
            {achievements.map(a => (
              <div key={a.id} className={`card-app p-4 flex flex-col items-center gap-2 ${a.earned ? '' : 'opacity-50'}`}>
                <div className="w-12 h-12 icon-badge" style={{ backgroundColor: a.earned ? a.tint : '#F1F1F1' }}>
                  <a.icon className="w-5 h-5" style={{ color: a.earned ? a.color : '#9CA3AF' }} />
                </div>
                <span className="text-[11px] font-bold text-gray-800 text-center leading-tight">{a.label}</span>
                <span className="text-[9px] font-semibold text-gray-400">{a.earned ? 'Earned' : 'Locked'}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
    </React.Fragment>
  );
};

export default ProfileHMI;
