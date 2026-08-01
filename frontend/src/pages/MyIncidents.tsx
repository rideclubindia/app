import React, { useEffect, useState } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { getDeterministicUuid } from '../lib/user';
import { Helmet } from 'react-helmet-async';

const MyIncidents = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchIncidents = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const profileId = await resolveProfileId(uid);
      if (!profileId) return;

      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('user_id', profileId)
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
    <div className="w-full h-full bg-[#F7F8FA] flex flex-col font-sans overflow-hidden">
      <Helmet>
        <title>My Incidents | Ride Club</title>
      </Helmet>
      
      {/* Header */}
      <div className="px-5 pt-4 pb-4 bg-white border-b border-gray-100 flex items-center z-10 shadow-sm relative">
        <button onClick={() => navigate('/profile')} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10">
          <ArrowLeft className="w-6 h-6 text-[#14142B]" />
        </button>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h1 className="text-[17px] font-bold text-[#14142B]">Incidents Reported</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <div className="mb-8">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : incidents.length > 0 ? (
            <div className="flex flex-col gap-3">
              {incidents.map((incident, idx) => (
                <div key={incident.id || idx} className="bg-white rounded-[20px] p-4 flex flex-col border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#FFF3E7] flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-[#FF7A00]" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-[#14142B] capitalize">{incident.type || 'Incident'}</p>
                      <p className="text-[12px] text-[#6E7191]">{new Date(incident.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#4E4B66]">{incident.description || 'No description provided'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[20px] p-8 text-center border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)] mt-4">
              <div className="w-16 h-16 rounded-full bg-[#F4F4F6] flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-[#A0A3BD]" strokeWidth={2} />
              </div>
              <h4 className="text-[17px] font-bold text-[#14142B] mb-2">No incidents reported</h4>
              <p className="text-[14px] text-[#6E7191] max-w-[200px] mx-auto">You haven't reported any incidents yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyIncidents;
