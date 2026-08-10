import React, { useEffect, useState } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { getDeterministicUuid } from '../lib/user';
import { Helmet } from 'react-helmet-async';
import { CockpitLayout } from '../components/spatial/CockpitLayout';
import { SpatialMembrane } from '../components/spatial/SpatialMembrane';
import { useIncidentCategories, incidentIconMap } from '../hooks/useIncidentCategories';

const MyIncidents = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { categories: reportTypes } = useIncidentCategories();

  const resolveReporterName = async (firebaseUid: string): Promise<string> => {
    const deterministicUid = getDeterministicUuid(firebaseUid);
    const { data: byIdRows } = await supabase
      .from('profiles')
      .select('full_name, username')
      .in('id', [firebaseUid, deterministicUid])
      .limit(1);

    if (byIdRows && byIdRows.length > 0) {
      return byIdRows[0].full_name || byIdRows[0].username;
    }

    const email = auth.currentUser?.email;
    if (email) {
      const { data: byEmailRows } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('email', email)
        .limit(1);

      if (byEmailRows && byEmailRows.length > 0) {
         return byEmailRows[0].full_name || byEmailRows[0].username;
      }
    }
    
    return auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Anonymous';
  };

  const fetchIncidents = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const rName = await resolveReporterName(uid);

      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('reporter_name', rName)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (e) {
      console.error('Error fetching incidents:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchIncidents();
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <CockpitLayout 
      mapChildren={
        <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
          {/* Abstract background mesh for non-map screens to maintain spatial feel */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
          <div className="absolute w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -top-[400px] -right-[400px]"></div>
          <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] -bottom-[300px] -left-[300px]"></div>
          <div className="z-10 text-white/10 font-bold text-4xl select-none uppercase tracking-[1em]">
            RIDECLUB
          </div>
        </div>
      }
    >
      <Helmet>
        <title>My Incidents | Ride Club</title>
      </Helmet>
      
      <SpatialMembrane position="left" className="w-[380px] p-4 flex flex-col gap-4 max-h-[100dvh]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2 shrink-0">
          <button 
            onClick={() => navigate('/profile')} 
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-white tracking-tight">My Incidents</h1>
            <p className="text-[13px] text-white/50">Your reported history</p>
          </div>
        </div>

        {/* River of incidents */}
        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-3 pb-8">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : incidents.length > 0 ? (
            incidents.map((incident, idx) => {
               const typeObj = reportTypes.find(t => t.id === incident.category) || reportTypes[7];
               const IconComp = typeObj ? incidentIconMap[typeObj.iconName] : AlertTriangle;
               
               return (
                <div key={incident.id || idx} className="bg-white/5 border border-white/10 rounded-[20px] p-4 backdrop-blur-md flex flex-col transition-all hover:bg-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeObj?.bg || 'bg-gray-800'}`}>
                      <IconComp className={`w-5 h-5 ${typeObj?.color || 'text-gray-400'}`} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-white capitalize">{incident.category || 'Incident'}</p>
                      <p className="text-[12px] text-white/50">{new Date(incident.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-white/70 pl-[52px] leading-relaxed">{incident.description || 'No description provided'}</p>
                </div>
              );
            })
          ) : (
            <div className="bg-white/5 rounded-[20px] p-8 text-center border border-white/10 backdrop-blur-md mt-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <AlertTriangle className="w-8 h-8 text-white/30" strokeWidth={2} />
              </div>
              <h4 className="text-[17px] font-bold text-white mb-2">No incidents</h4>
              <p className="text-[14px] text-white/50 max-w-[200px] mx-auto leading-relaxed">You haven't reported any incidents yet.</p>
            </div>
          )}
        </div>
      </SpatialMembrane>
    </CockpitLayout>
  );
};

export default MyIncidents;
