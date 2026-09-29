import React, { useState } from 'react';
import { ShieldAlert, X, Bike, Droplet, Phone, HeartHandshake, ChevronDown, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateMyProfile } from '../lib/myProfile';

interface Props {
  userId: string;
  onComplete: () => void;
  onClose: () => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const EmergencySetupModal: React.FC<Props> = ({ userId, onComplete, onClose }) => {
  const [bikeDetails, setBikeDetails] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [relation, setRelation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!bikeDetails || !emergencyContact) return;
    setLoading(true);
    try {
      await updateMyProfile({
        bike_details: bikeDetails,
        blood_group: bloodGroup,
        emergency_contact: `${emergencyContact} (${relation})`
      });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-11 bg-[#F7F8FA] border border-gray-200 rounded-xl px-3.5 pl-10 text-[14px] text-[#111111] placeholder-gray-400 font-medium outline-none focus:border-[#FF5A00]/60 focus:bg-white focus:ring-1 focus:ring-[#FF5A00]/30 transition-all";

  return (
    <div className="fixed top-0 right-0 bottom-0 left-0 landscape:left-[56px] z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[720px] rounded-[8px] shadow-2xl overflow-hidden flex flex-col landscape:flex-row max-h-[90vh]">
        
        {/* Left: Info Panel */}
        <div className="relative landscape:w-[260px] shrink-0 bg-gradient-to-br from-[#FF5A00] to-[#e64a00] p-6 flex landscape:flex-col items-center landscape:items-start text-center landscape:text-left gap-4 landscape:gap-0">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 landscape:w-14 landscape:h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 landscape:mb-5">
            <ShieldAlert className="w-6 h-6 landscape:w-7 landscape:h-7 text-white" />
          </div>

          <div className="landscape:mt-auto">
            <h2 className="text-lg landscape:text-xl font-semibold text-white leading-tight">Complete Emergency Profile</h2>
            <p className="text-white/80 text-[12px] landscape:text-[13px] mt-2 leading-relaxed">
              Before you ride, provide your emergency details. This helps your group respond faster when it matters.
            </p>
          </div>
        </div>

        {/* Right: Form Panel */}
        <div className="flex-1 min-w-0 p-5 overflow-y-auto hide-scrollbar">
          <div className="space-y-3.5">

            {/* Bike Details */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Bike Details</label>
              <div className="relative">
                <Bike className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="e.g., Royal Enfield Himalayan (Black)"
                  value={bikeDetails}
                  onChange={e => setBikeDetails(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            
            {/* Blood Group */}
            <div className="relative">
              <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Blood Group</label>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`${inputClass} cursor-pointer flex items-center justify-between`}
              >
                <span className="flex items-center gap-2.5">
                  <Droplet className="w-4 h-4 text-red-400" />
                  {bloodGroup}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto hide-scrollbar">
                  {BLOOD_GROUPS.map(bg => (
                    <div 
                      key={bg} 
                      onClick={() => { setBloodGroup(bg); setIsDropdownOpen(false); }}
                      className={`px-3.5 py-2.5 cursor-pointer hover:bg-[#FFF0E6] transition-colors flex items-center justify-between ${bloodGroup === bg ? 'bg-[#FFF0E6] text-[#FF5A00] font-semibold' : 'text-[#111111]'}`}
                    >
                      <span>{bg}</span>
                      {bloodGroup === bg && <Check className="w-4 h-4 text-[#FF5A00]" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Emergency Contact Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="e.g., +91 9876543210"
                  value={emergencyContact}
                  onChange={e => setEmergencyContact(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Relation */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Relation</label>
              <div className="relative">
                <HeartHandshake className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="e.g., Father, Sister, Friend"
                  value={relation}
                  onChange={e => setRelation(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Quick blood group chips (optional shortcut) */}
            <div className="flex gap-1.5 flex-wrap pt-0.5">
              {BLOOD_GROUPS.map(bg => (
                <button
                  key={bg}
                  onClick={() => setBloodGroup(bg)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    bloodGroup === bg 
                      ? 'bg-[#FF5A00] text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>

            <button 
              onClick={handleSave}
              disabled={loading || !bikeDetails || !emergencyContact || !relation}
              className="w-full mt-2 bg-[#FF5A00] hover:bg-[#ff6a1a] text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-[#FF5A00]/25 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none text-[15px]"
            >
              {loading ? 'Saving...' : 'Save Emergency Details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
