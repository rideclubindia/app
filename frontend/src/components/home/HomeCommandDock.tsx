import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map as MapIcon, Plus, Users, User as UserIcon, TriangleAlert } from 'lucide-react';

export const HomeCommandDock: React.FC = () => {
  const navigate = useNavigate();

  const itemClass =
    'flex flex-col items-center justify-center gap-1 w-[60px] h-[52px] text-[#9CA3AF] hover:text-[#111827] transition-colors';
  const labelClass = 'text-[8px] font-semibold tracking-[0.14em] uppercase';

  return (
    <div className="bg-white border border-[#E9ECF0] rounded-[18px] px-3 py-1.5 flex items-center justify-between shadow-[0_2px_16px_rgba(17,24,39,0.05)]">
      <button onClick={() => navigate('/profile')} className={itemClass}>
        <UserIcon className="w-5 h-5" strokeWidth={1.8} />
        <span className={labelClass}>Profile</span>
      </button>

      <button onClick={() => navigate('/map')} className={itemClass}>
        <MapIcon className="w-5 h-5" strokeWidth={1.8} />
        <span className={labelClass}>Navigate</span>
      </button>

      {/* Primary action */}
      <button
        onClick={() => navigate('/ride-plus/create')}
        className="h-[52px] px-7 rounded-full bg-[#F97316] hover:bg-[#fb8332] text-white flex items-center justify-center gap-2 shadow-lg shadow-[#F97316]/25 transition-all active:scale-95"
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em]">Ride+</span>
      </button>

      <button onClick={() => navigate('/groups')} className={itemClass}>
        <Users className="w-5 h-5" strokeWidth={1.8} />
        <span className={labelClass}>Groups</span>
      </button>

      <button onClick={() => navigate('/alerts')} className={itemClass}>
        <TriangleAlert className="w-5 h-5" strokeWidth={1.8} />
        <span className={labelClass}>Alerts</span>
      </button>
    </div>
  );
};
