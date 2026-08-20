import React from 'react';
import { Home, AlertTriangle, PlusSquare, Users, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LowerMapControl: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 bg-[#161C28]/85 backdrop-blur-md rounded-[10px] p-1 border border-[#2A3040]/40">
      {[
        { icon: Home, label: 'Home', path: '/' },
        { icon: AlertTriangle, label: 'Incidents', path: '/map' },
        { icon: PlusSquare, label: 'Ride+', path: '/ride-plus' },
        { icon: Users, label: 'Groups', path: '/groups' },
        { icon: User, label: 'Profile', path: '/profile' }
      ].map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div className="w-[1px] h-4 bg-[#2A3040]" />}
          <button 
            onClick={() => navigate(item.path)}
            title={item.label}
            className="w-9 h-8 rounded-[8px] flex items-center justify-center text-[#C0C6D0] hover:text-white hover:bg-[#1E2536] transition-colors"
          >
            <item.icon size={16} />
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
