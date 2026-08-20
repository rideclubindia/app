import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  userId: string;
  onComplete: () => void;
  onClose: () => void;
}

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
      const { error } = await supabase
        .from('profiles')
        .update({ 
          bike_details: bikeDetails, 
          blood_group: bloodGroup, 
          emergency_contact: `${emergencyContact} (${relation})`
        })
        .eq('id', userId);
        
      if (!error) {
        onComplete();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-dark/80 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] w-full max-w-md rounded-xl p-6 relative shadow-2xl border border-gray-800">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center text-dark hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mb-6 mx-auto">
          <ShieldAlert className="w-8 h-8 text-danger" />
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2">Complete Emergency Profile</h2>
        <p className="text-gray-400 text-center mb-6 text-sm">
          Before you ride, please provide your emergency details. This helps your group respond faster in an emergency.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Bike Details</label>
            <input 
              type="text" 
              placeholder="e.g., Royal Enfield Himalayan (Black)"
              value={bikeDetails}
              onChange={e => setBikeDetails(e.target.value)}
              className="w-full bg-[#2c2c2e] text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-danger border-transparent"
            />
          </div>
          
          <div className="relative">
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Blood Group</label>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-[#2c2c2e] text-white rounded-xl px-4 py-3 cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-danger border-transparent"
            >
              <span>{bloodGroup}</span>
              <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-[#2c2c2e] border border-gray-700 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                  <div 
                    key={bg} 
                    onClick={() => { setBloodGroup(bg); setIsDropdownOpen(false); }}
                    className={`px-4 py-3 cursor-pointer hover:bg-danger/20 hover:text-danger transition-colors ${bloodGroup === bg ? 'bg-danger/10 text-danger font-bold' : 'text-white'}`}
                  >
                    {bg}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Emergency Contact Number</label>
            <input 
              type="text" 
              placeholder="e.g., +91 9876543210"
              value={emergencyContact}
              onChange={e => setEmergencyContact(e.target.value)}
              className="w-full bg-[#2c2c2e] text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-danger border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Relation</label>
            <input 
              type="text" 
              placeholder="e.g., Father, Sister, Friend"
              value={relation}
              onChange={e => setRelation(e.target.value)}
              className="w-full bg-[#2c2c2e] text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-danger border-transparent"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={loading || !bikeDetails || !emergencyContact || !relation}
            className="w-full mt-6 bg-danger hover:bg-danger/90 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Emergency Details'}
          </button>
        </div>
      </div>
    </div>
  );
};
