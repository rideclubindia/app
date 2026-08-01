import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Trash2, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { useToast } from '../components/ToastContext';
import { getDeterministicUuid } from '../lib/user';
import { Helmet } from 'react-helmet-async';

const SavedLocationsList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
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

  const fetchSavedLocations = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchSavedLocations();
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleDeleteLocation = async (id: string, name: string) => {
    try {
      const { error } = await supabase.from('saved_locations').delete().eq('id', id);
      if (error) throw error;
      showToast(`"${name}" deleted`, 'success');
      fetchSavedLocations();
    } catch (e) {
      console.error('Error deleting location:', e);
      showToast('Failed to delete location', 'error');
    }
  };

  return (
    <div className="w-full h-full bg-[#F7F8FA] flex flex-col font-sans overflow-hidden">
      <Helmet>
        <title>Saved Locations | Ride Club</title>
      </Helmet>
      
      {/* Header */}
      <div className="px-5 pt-4 pb-4 bg-white border-b border-gray-100 flex items-center z-10 shadow-sm relative">
        <button onClick={() => navigate('/profile')} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10">
          <ArrowLeft className="w-6 h-6 text-[#14142B]" />
        </button>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h1 className="text-[17px] font-bold text-[#14142B]">Saved Locations</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[18px] font-bold text-[#14142B]">Your Places</h3>
            <button 
              onClick={() => navigate('/saved-location-picker', { state: { name: 'Pinned Location' } })}
              className="text-[14px] font-bold text-[#FF7A00] hover:bg-[#FFF3E7] px-3 py-1 rounded-full transition-colors flex items-center gap-1"
            >
              + Add
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : savedLocations.length > 0 ? (
            <div className="flex flex-col gap-3">
              {savedLocations.map((loc, idx) => (
                <div key={loc.id || idx} className="bg-white rounded-[20px] p-4 flex items-center justify-between border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-4 flex-1 truncate pr-4">
                    <div className="w-12 h-12 rounded-full bg-[#FFF3E7] flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-[#FF7A00]" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col truncate">
                      <p className="text-[16px] font-bold text-[#14142B] truncate">{loc.name || 'Saved Location'}</p>
                      <p className="text-[13px] font-medium text-[#6E7191] mt-0.5 truncate">{loc.address || `${loc.latitude?.toFixed(4)}, ${loc.longitude?.toFixed(4)}`}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteLocation(loc.id, loc.name)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FFEAE6] text-[#FF4D4D] hover:bg-[#FF4D4D] hover:text-white transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[20px] p-8 text-center border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)] mt-4">
              <div className="w-16 h-16 rounded-full bg-[#F4F4F6] flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-[#A0A3BD]" strokeWidth={2} />
              </div>
              <h4 className="text-[17px] font-bold text-[#14142B] mb-2">No saved locations</h4>
              <p className="text-[14px] text-[#6E7191] max-w-[200px] mx-auto">Save places like home or work for quick access</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedLocationsList;
