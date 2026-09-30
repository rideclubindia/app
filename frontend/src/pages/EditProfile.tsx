import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, User, Phone, Droplet, ShieldAlert, Bike, Hash, Camera, Trash2 } from 'lucide-react';
import { uploadImage, UploadError } from '../lib/mediaUpload';
import { initialsImage } from '../hooks/useAvatar';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { getDeterministicUuid, getAppUser } from '../lib/user';
import { useToast } from '../components/ToastContext';
import { Helmet } from 'react-helmet-async';
import { getMyProfile, updateMyProfile } from '../lib/myProfile';
import { normalizeMobile, formatEmergencyContact } from '../lib/emergencyContact';

const EditProfile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState<'uploading' | 'removing' | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    blood_group: '',
    emergency_contact: '',
    bike_model: '',
    bike_number: ''
  });

  const resolveProfileId = async (_firebaseUid: string): Promise<string | null> => (await getMyProfile())?.id ?? null;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const uid = getAppUser(auth.currentUser)?.uid;
        if (!uid) {
          navigate('/login', { replace: true });
          return;
        }
        
        const pid = await resolveProfileId(uid);
        if (!pid) throw new Error('Profile not found');
        setProfileId(pid);

        const data = await getMyProfile(true);
        
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

          setAvatarUrl(data.avatar_url || null);
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

  // Photo changes save immediately to profiles.avatar_url, the single source every screen reads
  const changePhoto = async (file: File | undefined) => {
    if (!file || !profileId) return;
    setPhotoBusy('uploading');
    try {
      const url = await uploadImage(file, 'avatar');
      await updateMyProfile({ avatar_url: url });
      setAvatarUrl(url);
      showToast('Profile photo updated', 'success');
    } catch (e: any) {
      showToast(e instanceof UploadError ? e.message : 'Could not save your photo. Try again.', 'error');
    } finally {
      setPhotoBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    if (!profileId || !avatarUrl) return;
    setPhotoBusy('removing');
    try {
      await updateMyProfile({ avatar_url: null });
      setAvatarUrl(null);
      showToast('Profile photo removed', 'success');
    } catch {
      showToast('Could not remove your photo. Try again.', 'error');
    } finally {
      setPhotoBusy(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!profileId) return;
    // Same rule as starting a ride: a real mobile number, stored as "+91XXXXXXXXXX (Name)" for the SOS SMS
    const rawContact = formData.emergency_contact.trim();
    if (rawContact) {
      const phone = normalizeMobile(rawContact.split('(')[0]);
      if (!phone) { showToast('Emergency contact needs a valid 10-digit mobile number, e.g. 9876543210 (Mom)', 'error'); return; }
      const name = rawContact.match(/\(([^)]+)\)/)?.[1]?.trim() || 'Emergency contact';
      formData.emergency_contact = formatEmergencyContact({ name, phone });
    }
    setIsSaving(true);
    
    try {
      await updateMyProfile({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          blood_group: formData.blood_group,
          emergency_contact: formData.emergency_contact,
          bike_details: {
            model: formData.bike_model,
            number: formData.bike_number
          }
        });
      showToast('Profile updated successfully', 'success');
      navigate('/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full bg-[#F7F8FA] border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-[14px] text-[#111111] placeholder-gray-400 font-medium focus:outline-none focus:border-[#FF5A00]/60 focus:bg-white focus:ring-1 focus:ring-[#FF5A00]/30 transition-all";

  return (
    <React.Fragment>
      <Helmet>
        <title>Edit Profile | Ride Club</title>
      </Helmet>

      <div className="w-full h-full bg-[#F2F4F7] flex flex-col font-sans overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/profile')} 
              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#111111] hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[#111111] font-semibold text-lg tracking-wide uppercase leading-tight">Edit Profile</h1>
              <p className="text-[12px] text-gray-400 font-medium mt-0.5">Update your details</p>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={isSaving || isLoading}
            className="h-9 px-4 rounded-full bg-[#FF5A00] hover:bg-[#ff6a1a] text-white text-[13px] font-semibold flex items-center gap-2 shadow-md shadow-[#FF5A00]/25 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-6">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-[#FF5A00] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 landscape:grid-cols-3 gap-4 max-w-[1200px]">

              {/* Profile photo */}
              <div className="bg-white border border-gray-100 rounded-[8px] p-4 shadow-sm flex items-center gap-4 landscape:col-span-3">
                <div className="relative shrink-0">
                  <img
                    src={avatarUrl || initialsImage(formData.full_name || 'Rider')}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={(e) => { const f = initialsImage(formData.full_name || 'Rider'); if (e.currentTarget.src !== f) e.currentTarget.src = f; }}
                    className="w-20 h-20 rounded-full object-cover bg-gray-100"
                  />
                  {photoBusy && (
                    <div className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#111111]">Profile photo</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Shown to riders in rides, groups and messages.</p>
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!!photoBusy} className="h-10 px-3.5 rounded-xl bg-[#FF5A00] text-white text-[13px] font-semibold flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50">
                      <Camera className="w-4 h-4" /> {photoBusy === 'uploading' ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Add photo'}
                    </button>
                    {avatarUrl && (
                      <button type="button" onClick={removePhoto} disabled={!!photoBusy} className="h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 disabled:opacity-50">
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => changePhoto(e.target.files?.[0])} />
                </div>
              </div>

              {/* Personal Details */}
              <div className="bg-white border border-gray-100 rounded-[8px] p-4 shadow-sm flex flex-col gap-3">
                <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Personal</h3>

                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className={inputClass}
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="tel" 
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Safety Details */}
              <div className="bg-white border border-gray-100 rounded-[8px] p-4 shadow-sm flex flex-col gap-3">
                <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Safety</h3>

                <div className="relative">
                  <Droplet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                  <input 
                    type="text" 
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    placeholder="Blood Group (e.g. O+)"
                    className={`${inputClass} uppercase`}
                  />
                </div>

                <div className="relative">
                  <ShieldAlert className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF5A00]" />
                  <input 
                    type="tel" 
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    placeholder="Emergency Contact"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Bike Details */}
              <div className="bg-white border border-gray-100 rounded-[8px] p-4 shadow-sm flex flex-col gap-3">
                <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Bike</h3>

                <div className="relative">
                  <Bike className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                  <input 
                    type="text" 
                    name="bike_model"
                    value={formData.bike_model}
                    onChange={handleChange}
                    placeholder="Bike Model (e.g. Classic 350)"
                    className={inputClass}
                  />
                </div>

                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    name="bike_number"
                    value={formData.bike_number}
                    onChange={handleChange}
                    placeholder="Registration Plate"
                    className={`${inputClass} uppercase`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default EditProfile;
