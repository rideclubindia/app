import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, User, Phone, Droplet, ShieldAlert, Bike, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { getDeterministicUuid } from '../lib/user';
import { useToast } from '../components/ToastContext';
import { Helmet } from 'react-helmet-async';
import { CockpitLayout } from '../components/spatial/CockpitLayout';
import { SpatialMembrane } from '../components/spatial/SpatialMembrane';

const EditProfile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    blood_group: '',
    emergency_contact: '',
    bike_model: '',
    bike_number: ''
  });

  const resolveProfileId = async (firebaseUid: string): Promise<string | null> => {
    const deterministicUid = getDeterministicUuid(firebaseUid);
    const { data: byIdRows } = await supabase
      .from('profiles')
      .select('id')
      .in('id', [firebaseUid, deterministicUid])
      .limit(1);

    if (byIdRows && byIdRows.length > 0) return String(byIdRows[0].id);

    const email = auth.currentUser?.email;
    if (!email) return null;

    const { data: byEmailRows } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);

    return byEmailRows && byEmailRows.length > 0 ? String(byEmailRows[0].id) : null;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          navigate('/login');
          return;
        }
        
        const pid = await resolveProfileId(uid);
        if (!pid) throw new Error('Profile not found');
        setProfileId(pid);

        const { data, error } = await supabase.from('profiles').select('*').eq('id', pid).single();
        if (error) throw error;
        
        if (data) {
          let bModel = '';
          let bNumber = '';
          if (data.bike_details) {
            if (typeof data.bike_details === 'object') {
              bModel = data.bike_details.model || '';
              bNumber = data.bike_details.number || '';
            } else if (typeof data.bike_details === 'string') {
              try {
                const parsed = JSON.parse(data.bike_details);
                bModel = parsed.model || '';
                bNumber = parsed.number || '';
              } catch (e) {
                bModel = data.bike_details;
              }
            }
          }

          setFormData({
            full_name: data.full_name || '',
            phone_number: data.phone_number || '',
            blood_group: data.blood_group || '',
            emergency_contact: data.emergency_contact || '',
            bike_model: bModel,
            bike_number: bNumber
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        showToast('Failed to load profile data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!profileId) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          blood_group: formData.blood_group,
          emergency_contact: formData.emergency_contact,
          bike_details: {
            model: formData.bike_model,
            number: formData.bike_number
          }
        })
        .eq('id', profileId);

      if (error) throw error;
      showToast('Profile updated successfully', 'success');
      navigate('/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

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
        <title>Edit Profile | Ride Club</title>
      </Helmet>
      
      <SpatialMembrane position="left" className="w-[420px] p-5 flex flex-col gap-6 max-h-[100dvh]">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 mb-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/profile')} 
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-[20px] font-bold text-white tracking-tight leading-none">Edit Profile</h1>
              <p className="text-[13px] text-white/50 mt-1">Update your details</p>
            </div>
          </div>
          
          <button 
            onClick={handleSave} 
            disabled={isSaving || isLoading}
            className="h-10 px-4 rounded-full bg-primary hover:bg-primary/90 text-white text-[14px] font-bold flex items-center gap-2 shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-4 pb-8">
          
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Personal Details */}
              <div className="bg-white/5 border border-white/10 rounded-[20px] p-5 backdrop-blur-md flex flex-col gap-4">
                <h3 className="text-[14px] font-bold text-white/40 uppercase tracking-wider mb-1">Personal</h3>
                
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="tel" 
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Safety Details */}
              <div className="bg-white/5 border border-white/10 rounded-[20px] p-5 backdrop-blur-md flex flex-col gap-4">
                <h3 className="text-[14px] font-bold text-white/40 uppercase tracking-wider mb-1">Safety</h3>
                
                <div className="relative">
                  <Droplet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                  <input 
                    type="text" 
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    placeholder="Blood Group (e.g. O+)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-all uppercase"
                  />
                </div>

                <div className="relative">
                  <ShieldAlert className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="tel" 
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    placeholder="Emergency Contact"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Bike Details */}
              <div className="bg-white/5 border border-white/10 rounded-[20px] p-5 backdrop-blur-md flex flex-col gap-4">
                <h3 className="text-[14px] font-bold text-white/40 uppercase tracking-wider mb-1">Bike</h3>
                
                <div className="relative">
                  <Bike className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    name="bike_model"
                    value={formData.bike_model}
                    onChange={handleChange}
                    placeholder="Bike Model (e.g. Classic 350)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    name="bike_number"
                    value={formData.bike_number}
                    onChange={handleChange}
                    placeholder="Registration Plate"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-all uppercase"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </SpatialMembrane>
    </CockpitLayout>
  );
};

export default EditProfile;
