import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Key, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/firebase';
import { useToast } from '../../components/ToastContext';
import { getDeterministicUuid } from '../../lib/user';

const JoinRide = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 5) {
      showToast('Please enter a valid Ride Code', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        showToast('Not authenticated. Please log in.', 'error');
        setLoading(false);
        return;
      }

      // Find ride by code
      const { data: ride, error: findErr } = await supabase
        .from('rides')
        .select('id')
        .eq('ride_code', code.toUpperCase())
        .single();
        
      if (findErr || !ride) {
        throw new Error('Ride not found. Please check the code.');
      }

      // Join the ride
      const { error: joinErr } = await supabase.from('ride_members').insert({
        ride_id: ride.id,
        user_id: user.uid.length === 36 ? user.uid : getDeterministicUuid(user.uid),
        role: 'rider',
        status: 'pending',
        display_name: user.displayName || user.email?.split('@')[0] || 'Rider',
        avatar_url: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email?.split('@')[0] || 'Rider'}`
      });

      // Ignore duplicate error if already joined
      if (joinErr && joinErr.code !== '23505') {
        throw joinErr;
      }

      showToast('Join request sent! Waiting for admin approval.', 'success');
      navigate(`/ride-plus/live/${ride.id}`);

    } catch (err: any) {
      showToast(err.message || 'Failed to request joining ride', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans relative">
      <div className="bg-white px-6 pt-4 pb-4 shadow-sm flex items-center gap-4 z-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-dark hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-dark">Join Ride</h1>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center -mt-16">
        <div className="w-20 h-20 bg-[#FFF0E6] rounded-full flex items-center justify-center mb-6">
          <Key className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-dark mb-2">Enter Ride Code</h2>
        <p className="text-gray-500 text-center mb-4 px-6">Ask the ride leader for the 6-character ride code to join their live group.</p>

        <form onSubmit={handleJoin} className="w-full max-w-[300px] flex flex-col gap-4">
          <input
            type="text"
            placeholder="RIDE-XXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={11}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-6 py-4 text-center text-[20px] font-bold tracking-widest text-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase transition-colors"
          />

          <button 
            type="submit"
            disabled={loading || code.length < 5}
            className="w-full bg-dark text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? 'Joining...' : 'Join Now'} <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinRide;
