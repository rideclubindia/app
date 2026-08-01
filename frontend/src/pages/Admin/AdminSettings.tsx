import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Settings as SettingsIcon, Save, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '../../components/ToastContext';

const AdminSettings = () => {
  const { showToast } = useToast();
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    websiteMaintenanceMode: false,
    comingSoonMode: false,
    websiteComingSoonMode: false,
    blockWebAccess: false,
    comingSoonTitle: 'Something Big Is Coming',
    comingSoonSubtitle: "We're building something exciting for our community.",
    comingSoonDescription: "A new experience is on the way.\n\nEnhanced features, smarter tools, better performance, and innovations that have never been seen before in our platform.\n\nWe're currently preparing everything behind the scenes to deliver a faster, more engaging, and more powerful experience.\n\nStay tuned. The wait will be worth it.",
    comingSoonLaunchDate: '',
    comingSoonImage: '',
    comingSoonLogo: '',
    comingSoonButtonText: '',
    comingSoonButtonAction: '',
    comingSoonShowCountdown: false,
    requireEmailVerification: true,
    maxPinsPerUserDaily: 10,
    supportEmail: 'support@rideclub.in'
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, key: 'maintenanceMode' | 'websiteMaintenanceMode' | 'requireEmailVerification' | 'comingSoonMode' | 'websiteComingSoonMode' | 'blockWebAccess' | null, label: string, checked: boolean }>({ isOpen: false, key: null, label: '', checked: false });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data } = await supabase.from('cms_content').select('*').eq('slug', 'app-settings').maybeSingle();
      if (data && data.content) {
        setSettingsId(data.id);
        setSettings({ ...settings, ...(data.content as any) });
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      let finalSettings = { ...settings };

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `coming-soon-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('incident-photos').upload(fileName, imageFile);
        if (!uploadError) {
          const { data } = supabase.storage.from('incident-photos').getPublicUrl(fileName);
          finalSettings.comingSoonImage = data.publicUrl;
          setSettings(prev => ({ ...prev, comingSoonImage: data.publicUrl }));
        } else {
          showToast('Failed to upload image. Make sure bucket incident-photos exists.', 'error');
        }
      }

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `coming-soon-logo-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('incident-photos').upload(fileName, logoFile);
        if (!uploadError) {
          const { data } = supabase.storage.from('incident-photos').getPublicUrl(fileName);
          finalSettings.comingSoonLogo = data.publicUrl;
          setSettings(prev => ({ ...prev, comingSoonLogo: data.publicUrl }));
        } else {
          showToast('Failed to upload logo image.', 'error');
        }
      }

      if (settingsId) {
        const { error } = await supabase.from('cms_content').update({ content: finalSettings }).eq('id', settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('cms_content').insert([{
          title: 'Global App Settings',
          slug: 'app-settings',
          content_type: 'settings',
          content: finalSettings,
          is_published: true
        }]).select().single();
        if (error) throw error;
        if (data) setSettingsId(data.id);
      }
      setImageFile(null);
      setLogoFile(null);
      showToast('Settings saved successfully', 'success');
    } catch (e: any) {
      console.error('Save Settings Error:', e);
      showToast(`Failed: ${e.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: 'maintenanceMode' | 'websiteMaintenanceMode' | 'requireEmailVerification' | 'comingSoonMode' | 'websiteComingSoonMode' | 'blockWebAccess', label: string, checked: boolean) => {
    setConfirmModal({ isOpen: true, key, label, checked });
  };

  const confirmAction = async () => {
    const { key, label, checked } = confirmModal;
    setConfirmModal({ isOpen: false, key: null, label: '', checked: false });
    if (!key) return;
    
    const newSettings = { ...settings, [key]: checked };
    setSettings(newSettings);
    
    try {
      if (settingsId) {
        const { data, error } = await supabase.from('cms_content').update({ content: newSettings }).eq('id', settingsId).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Database blocked the update due to RLS policies. Please run the SQL command to disable RLS.");
      } else {
        const { data, error } = await supabase.from('cms_content').insert([{
          title: 'Global App Settings',
          slug: 'app-settings',
          content_type: 'settings',
          content: newSettings,
          is_published: true
        }]).select().single();
        if (error) throw error;
        if (data) setSettingsId(data.id);
      }
      showToast(`${label} ${checked ? 'Enabled' : 'Disabled'}`, 'success');
    } catch (e: any) {
      console.error('Supabase Update Error:', e);
      showToast(`Failed: ${e.message || 'Unknown error'}`, 'error');
    }
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="p-6 bg-[#F8F9FB] w-full h-full overflow-hidden flex flex-col">
      <div className="mb-6 shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" />
            Global Settings
          </h1>
          <p className="text-[12px] text-[#8A8A8E] mt-1">Manage platform configuration and feature toggles.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className={`flex items-center gap-2 h-8 px-4 text-white rounded text-[12px] font-bold ${isSaving ? 'bg-gray-400' : 'bg-primary'}`}>
          <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start w-full flex-1 min-h-0">
        <div className="flex-1 w-full bg-white border border-[#E5E5EA] rounded-lg space-y-6 shadow-sm p-6 overflow-y-auto h-full">
          <h3 className="font-bold text-[14px]">Platform Toggles</h3>
          <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">App Maintenance Mode</span>
            <button
              onClick={() => handleToggle('maintenanceMode', 'App Maintenance Mode', !settings.maintenanceMode)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                settings.maintenanceMode ? 'bg-[#ef4523]' : 'bg-[#E5E5EA]'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  settings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">Website Maintenance Mode</span>
            <button
              onClick={() => handleToggle('websiteMaintenanceMode', 'Website Maintenance Mode', !settings.websiteMaintenanceMode)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                settings.websiteMaintenanceMode ? 'bg-[#ef4523]' : 'bg-[#E5E5EA]'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  settings.websiteMaintenanceMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
               <span className="text-[13px] font-semibold block">App Coming Soon Mode</span>
               <span className="text-[11px] text-[#8A8A8E]">Hides the entire app and shows a coming soon screen.</span>
            </div>
            <button
              onClick={() => handleToggle('comingSoonMode', 'App Coming Soon Mode', !settings.comingSoonMode)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                settings.comingSoonMode ? 'bg-[#ef4523]' : 'bg-[#E5E5EA]'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  settings.comingSoonMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
               <span className="text-[13px] font-semibold block">Website Coming Soon Mode</span>
               <span className="text-[11px] text-[#8A8A8E]">Hides the entire website and shows a coming soon screen.</span>
            </div>
            <button
              onClick={() => handleToggle('websiteComingSoonMode', 'Website Coming Soon Mode', !settings.websiteComingSoonMode)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                settings.websiteComingSoonMode ? 'bg-[#ef4523]' : 'bg-[#E5E5EA]'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  settings.websiteComingSoonMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
               <span className="text-[13px] font-semibold block">Block Web App Access</span>
               <span className="text-[11px] text-[#8A8A8E]">Restricts users from accessing the app via web browsers (forces native app).</span>
            </div>
            <button
              onClick={() => handleToggle('blockWebAccess', 'Block Web App Access', !settings.blockWebAccess)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                settings.blockWebAccess ? 'bg-[#ef4523]' : 'bg-[#E5E5EA]'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  settings.blockWebAccess ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">Require Email Verification</span>
            <button
              onClick={() => handleToggle('requireEmailVerification', 'Email Verification', !settings.requireEmailVerification)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                settings.requireEmailVerification ? 'bg-[#ef4523]' : 'bg-[#E5E5EA]'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  settings.requireEmailVerification ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>



        <h3 className="font-bold text-[14px] pt-4 border-t">Limits & Config</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#8A8A8E] uppercase mb-1">Daily Pins Per User</label>
            <input 
              type="number" 
              value={settings.maxPinsPerUserDaily} 
              onChange={e => setSettings({...settings, maxPinsPerUserDaily: parseInt(e.target.value) || 0})}
              className="w-full h-10 border rounded px-3 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#8A8A8E] uppercase mb-1">Support Email</label>
            <input 
              type="email" 
              value={settings.supportEmail} 
              onChange={e => setSettings({...settings, supportEmail: e.target.value})}
              className="w-full h-10 border rounded px-3 text-[13px]"
            />
          </div>
          </div>
        </div>

        {(settings.comingSoonMode || settings.websiteComingSoonMode) && (
          <div className="flex-1 w-full bg-white border border-[#E5E5EA] rounded-lg space-y-5 shadow-sm p-6 animate-in fade-in slide-in-from-right-4 overflow-y-auto h-full">
            <div className="border-b pb-3 mb-4">
              <h4 className="font-bold text-[14px] text-[#273a5a]">Coming Soon Configuration</h4>
              <p className="text-[11px] text-[#8A8A8E]">Configure the screen that users will see while this mode is active.</p>
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-[#8A8A8E] uppercase mb-1">Headline</label>
              <input 
                type="text" 
                value={settings.comingSoonTitle} 
                onChange={e => setSettings({...settings, comingSoonTitle: e.target.value})}
                className="w-full h-10 border rounded px-3 text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8A8A8E] uppercase mb-1">Subheading</label>
              <input 
                type="text" 
                value={settings.comingSoonSubtitle} 
                onChange={e => setSettings({...settings, comingSoonSubtitle: e.target.value})}
                className="w-full h-10 border rounded px-3 text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8A8A8E] uppercase mb-1">Description</label>
              <textarea 
                value={settings.comingSoonDescription} 
                onChange={e => {
                  setSettings({...settings, comingSoonDescription: e.target.value});
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="w-full border rounded p-3 text-[13px] min-h-[120px] resize-none overflow-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8A8A8E] uppercase mb-1">Launch Date (Optional)</label>
              <input 
                type="datetime-local" 
                value={settings.comingSoonLaunchDate} 
                onChange={e => setSettings({...settings, comingSoonLaunchDate: e.target.value})}
                className="w-full h-10 border rounded px-3 text-[13px]"
              />
            </div>
            <div className="flex items-center gap-3 h-10">
              <input 
                type="checkbox" 
                id="showCountdownInline"
                checked={settings.comingSoonShowCountdown} 
                onChange={e => setSettings({...settings, comingSoonShowCountdown: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="showCountdownInline" className="text-[13px] font-semibold">Show Countdown Timer</label>
            </div>
            
            <div className="pt-4 border-t">
              <label className="block text-[11px] font-bold text-[#8A8A8E] uppercase mb-2">Background Image</label>
              <div className="flex flex-col gap-3">
                  <div className="flex gap-4 items-center">
                    {settings.comingSoonImage && !imageFile && (
                        <div className="relative w-16 h-16 rounded border overflow-hidden shrink-0">
                          <img src={settings.comingSoonImage} className="w-full h-full object-cover" />
                          <button onClick={() => setSettings({...settings, comingSoonImage: ''})} className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white">
                              <X className="w-3 h-3" />
                          </button>
                        </div>
                    )}
                    {imageFile && (
                        <div className="relative w-16 h-16 rounded border overflow-hidden shrink-0">
                          <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" />
                          <button onClick={() => setImageFile(null)} className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white">
                              <X className="w-3 h-3" />
                          </button>
                        </div>
                    )}
                    
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={imageInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setImageFile(e.target.files[0]);
                          }
                        }}
                    />
                    <button onClick={() => imageInputRef.current?.click()} className="flex items-center justify-center gap-2 flex-1 h-10 border rounded text-[12px] font-bold hover:bg-gray-50">
                        <ImageIcon className="w-4 h-4" /> Upload Image
                    </button>
                  </div>
                  
                  <input 
                      type="text" 
                      value={settings.comingSoonImage} 
                      onChange={e => { setSettings({...settings, comingSoonImage: e.target.value}); setImageFile(null); }}
                      className="w-full h-10 border rounded px-3 text-[13px]"
                      placeholder="Or enter image URL directly..."
                  />
              </div>
            </div>

            <div className="pt-4 border-t">
              <label className="block text-[11px] font-bold text-[#8A8A8E] uppercase mb-2">Custom Logo (Optional)</label>
              <div className="flex flex-col gap-3">
                  <div className="flex gap-4 items-center">
                    {settings.comingSoonLogo && !logoFile && (
                        <div className="relative w-16 h-16 rounded border overflow-hidden shrink-0 bg-gray-100">
                          <img src={settings.comingSoonLogo} className="w-full h-full object-contain" />
                          <button onClick={() => setSettings({...settings, comingSoonLogo: ''})} className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white">
                              <X className="w-3 h-3" />
                          </button>
                        </div>
                    )}
                    {logoFile && (
                        <div className="relative w-16 h-16 rounded border overflow-hidden shrink-0 bg-gray-100">
                          <img src={URL.createObjectURL(logoFile)} className="w-full h-full object-contain" />
                          <button onClick={() => setLogoFile(null)} className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white">
                              <X className="w-3 h-3" />
                          </button>
                        </div>
                    )}
                    
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={logoInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setLogoFile(e.target.files[0]);
                          }
                        }}
                    />
                    <button onClick={() => logoInputRef.current?.click()} className="flex items-center justify-center gap-2 flex-1 h-10 border rounded text-[12px] font-bold hover:bg-gray-50">
                        <ImageIcon className="w-4 h-4" /> Upload Logo
                    </button>
                  </div>
                  
                  <input 
                      type="text" 
                      value={settings.comingSoonLogo || ''} 
                      onChange={e => { setSettings({...settings, comingSoonLogo: e.target.value}); setLogoFile(null); }}
                      className="w-full h-10 border rounded px-3 text-[13px]"
                      placeholder="Or enter logo URL directly..."
                  />
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#8A8A8E] uppercase mb-1">Button Text (Optional)</label>
                <input 
                  type="text" 
                  value={settings.comingSoonButtonText} 
                  onChange={e => setSettings({...settings, comingSoonButtonText: e.target.value})}
                  className="w-full h-10 border rounded px-3 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#8A8A8E] uppercase mb-1">Button URL / Action</label>
                <input 
                  type="text" 
                  value={settings.comingSoonButtonAction} 
                  onChange={e => setSettings({...settings, comingSoonButtonAction: e.target.value})}
                  className="w-full h-10 border rounded px-3 text-[13px]"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 text-[13px] font-bold text-white bg-primary rounded hover:bg-[#d83c1d] disabled:bg-gray-400"
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-[16px] font-bold text-[#273a5a] mb-2">Confirm Action</h3>
            <p className="text-[#8A8A8E] text-[13px] mb-6">
              Are you sure you want to {confirmModal.checked ? 'turn on' : 'turn off'} <strong>{confirmModal.label}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, key: null, label: '', checked: false })}
                className="px-4 py-2 text-[13px] font-semibold text-[#8A8A8E] hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAction}
                className="px-4 py-2 text-[13px] font-semibold text-white bg-[#ef4523] hover:bg-[#d83c1d] rounded"
              >
                Yes, {confirmModal.checked ? 'Turn On' : 'Turn Off'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
