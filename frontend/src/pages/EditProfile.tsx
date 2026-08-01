import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { getDeterministicUuid } from '../lib/user';
import { useToast } from '../components/ToastContext';
import { Helmet } from 'react-helmet-async';

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

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', pid)
          .single();

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

  if (isLoading) {
    return (
      <div className="w-full h-full bg-[#F7F8FA] flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#F7F8FA] flex flex-col font-sans overflow-hidden">
      <Helmet>
        <title>Edit Profile | Ride Club</title>
      </Helmet>
      
      {/* Header */}
      <div className="px-5 pt-4 pb-4 bg-white border-b border-gray-100 flex items-center justify-between z-10 shadow-sm relative">
        <button onClick={() => navigate('/profile')} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10">
          <ArrowLeft className="w-6 h-6 text-[#14142B]" />
        </button>
        <h1 className="text-[17px] font-bold text-[#14142B] absolute inset-0 flex items-center justify-center pointer-events-none">Edit Profile</h1>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="text-[14px] font-bold text-[#FF7A00] flex items-center gap-1 disabled:opacity-50 z-10"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <div className="bg-white rounded-[20px] p-5 border border-[#EFF0F6] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col gap-5">
          
          <div>
            <label className="block text-[13px] font-semibold text-[#6E7191] mb-1.5 ml-1">Full Name</label>
            <input 
              type="text" 
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className="w-full bg-[#F7F8FA] border border-[#EFF0F6] rounded-xl px-4 py-3 text-[15px] font-medium text-[#14142B] focus:outline-none focus:border-[#FF7A00] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#6E7191] mb-1.5 ml-1">Phone Number</label>
            <input 
              type="tel" 
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
              className="w-full bg-[#F7F8FA] border border-[#EFF0F6] rounded-xl px-4 py-3 text-[15px] font-medium text-[#14142B] focus:outline-none focus:border-[#FF7A00] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#6E7191] mb-1.5 ml-1">Blood Group</label>
            <input 
              type="text" 
              name="blood_group"
              value={formData.blood_group}
              onChange={handleChange}
              placeholder="e.g. O+ve"
              className="w-full bg-[#F7F8FA] border border-[#EFF0F6] rounded-xl px-4 py-3 text-[15px] font-medium text-[#14142B] focus:outline-none focus:border-[#FF7A00] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#6E7191] mb-1.5 ml-1">Emergency Contact</label>
            <input 
              type="tel" 
              name="emergency_contact"
              value={formData.emergency_contact}
              onChange={handleChange}
              placeholder="e.g. Mom: +91 9876543210"
              className="w-full bg-[#F7F8FA] border border-[#EFF0F6] rounded-xl px-4 py-3 text-[15px] font-medium text-[#14142B] focus:outline-none focus:border-[#FF7A00] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#6E7191] mb-1.5 ml-1">Bike Model</label>
            <input 
              type="text" 
              name="bike_model"
              value={formData.bike_model}
              onChange={handleChange}
              placeholder="e.g. Royal Enfield Classic 350"
              className="w-full bg-[#F7F8FA] border border-[#EFF0F6] rounded-xl px-4 py-3 text-[15px] font-medium text-[#14142B] focus:outline-none focus:border-[#FF7A00] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#6E7191] mb-1.5 ml-1">Bike Number</label>
            <input 
              type="text" 
              name="bike_number"
              value={formData.bike_number}
              onChange={handleChange}
              placeholder="e.g. TS 07 EU 1234"
              className="w-full bg-[#F7F8FA] border border-[#EFF0F6] rounded-xl px-4 py-3 text-[15px] font-medium text-[#14142B] focus:outline-none focus:border-[#FF7A00] transition-colors uppercase"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default EditProfile;
