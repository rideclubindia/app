import React, { useEffect, useState } from 'react';
import { MiniMap } from '../components/home/MiniMap';
import { Tachometer } from '../components/home/Tachometer';
import { SpeedCockpit } from '../components/home/SpeedCockpit';
import { RouteList } from '../components/home/RouteList';
import { useLocationStore } from '../store/useLocationStore';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { getDeterministicUuid } from '../lib/user';
import { Helmet } from 'react-helmet-async';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const { speed: gpsSpeed } = useLocationStore();
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [ridingMode, setRidingMode] = useState<'Eco' | 'Comfort' | 'Sport'>('Comfort');
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);

  // Fetch Current Ride & Saved Routes from Supabase
  useEffect(() => {
    const fetchRide = async () => {
      const u = auth.currentUser;
      if (!u) return;
      const userId = getDeterministicUuid(u.uid);
      
      // Fetch rides the user has joined
      const { data: memberData } = await supabase
        .from('ride_members')
        .select('ride_id')
        .eq('user_id', userId);

      let activeRides: any[] = [];
      
      if (memberData && memberData.length > 0) {
        const rideIds = memberData.map(m => m.ride_id);
        const { data } = await supabase
          .from('rides')
          .select('*')
          .in('id', rideIds)
          .neq('status', 'ended')
          .order('created_at', { ascending: false });
          
        if (data) activeRides = data;
      }
        
      if (activeRides.length > 0) {
        setCurrentRide(activeRides[0]); // Display max 1 active ride
        
        // Populate saved routes with any other scheduled/active rides they are in
        setSavedRoutes(activeRides.slice(1).map((r: any) => ({
          id: r.id,
          name: r.name || 'Joined Ride',
          distance: r.total_distance ? `${Math.round(r.total_distance)} km` : '--',
          duration: r.estimated_duration || '--',
          stops: r.waypoints?.length || 0
        })));
      } else {
        setCurrentRide(null);
        setSavedRoutes([]);
      }
    };
    fetchRide();

    const channel = supabase.channel('home_ride_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => {
        fetchRide();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);
  return (
    <>
      <Helmet>
        <title>Home | Ride Club</title>
      </Helmet>
      
      <div className="flex h-screen w-full bg-black overflow-hidden text-white relative items-center justify-center font-sans">
        
        {/* Full screen 3-panel grid */}
        <div className="flex w-full h-full max-w-[1400px] items-center p-4 sm:p-8 gap-4 sm:gap-12">
          
          {/* Left Panel: Map */}
          <div className="flex-1 h-full max-h-[500px] flex items-center justify-center relative mask-image-fade">
            <MiniMap />
          </div>

          {/* Center Panel: Speedometer */}
          <div className="flex-[1.5] h-full flex justify-center items-center">
            <SpeedCockpit 
              speed={gpsSpeed} 
              mode={ridingMode} 
              onModeChange={setRidingMode} 
            />
          </div>

          {/* Right Panel: Tachometer */}
          <div className="flex-1 h-full max-h-[500px] flex items-center justify-center">
            <Tachometer />
          </div>
        </div>

        {/* Minimal Floating Nav (Top Right) */}
        <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
          <button 
            onClick={() => navigate('/solo-ride')}
            className="w-10 h-10 rounded-full bg-[#1C1C1E] border border-[#333] flex items-center justify-center text-[#A1A1A6] hover:text-white hover:border-white transition-colors"
            title="Search / Solo Ride"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          <button 
            onClick={() => navigate('/ride-plus/create')}
            className="w-10 h-10 rounded-full bg-[#1C1C1E] border border-[#333] flex items-center justify-center text-[#A1A1A6] hover:text-white hover:border-white transition-colors"
            title="Group Ride"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/map', { state: { openReport: true } })}
            className="w-10 h-10 rounded-full bg-[#1C1C1E] border border-[#333] flex items-center justify-center text-[#A1A1A6] hover:text-[#FF3B30] hover:border-[#FF3B30] transition-colors"
            title="Incidents"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-[1px] shadow-lg cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="w-full h-full rounded-full bg-black overflow-hidden">
              <img src={auth.currentUser?.photoURL || 'https://via.placeholder.com/150'} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

      </div>
      <style>{`
        .mask-image-fade {
          mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
        }
      `}</style>
    </>
  );
};

export default Home;
