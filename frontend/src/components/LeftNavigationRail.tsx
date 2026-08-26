import React from 'react';
import { Home, ShieldAlert, Car, Users, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const LeftNavigationRail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'map', icon: ShieldAlert, label: 'Incidents', path: '/map' },
    { id: 'ride-plus', icon: Car, label: 'Ride+', path: '/ride-plus' },
    { id: 'groups', icon: Users, label: 'Groups', path: '/groups' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="portrait:w-full portrait:h-[56px] portrait:flex-row portrait:justify-around portrait:py-0 portrait:px-2 portrait:gap-0 portrait:order-last landscape:w-[56px] landscape:h-full landscape:flex-col landscape:justify-start landscape:py-4 landscape:px-0 landscape:gap-6 landscape:order-first bg-[#111111] flex items-center shrink-0 z-50">
      {/* Brand logo at the top - landscape only */}
      <div className="hidden landscape:flex w-8 h-8 rounded-full bg-[#FF5A00] items-center justify-center landscape:mb-1 shadow-[0_0_10px_rgba(255,90,0,0.4)]">
        <span className="text-white text-[10px] font-semibold italic tracking-tighter">RC</span>
      </div>

      {navItems.map(item => {
        const activePath = location.pathname === '/dev-home' ? '/home' : location.pathname;
        const isActive = activePath.includes(item.path);
        
        return (
          <button 
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all relative group ${
              isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title={item.label}
          >
            <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            
            {/* Active indicator - left bar in landscape, bottom bar in portrait */}
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FF5A00] rounded-r-full hidden landscape:block" />}
            {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-1 bg-[#FF5A00] rounded-t-full landscape:hidden" />}
            
            {/* Tooltip on hover - landscape only */}
            <div className="hidden landscape:block absolute left-14 bg-[#111111] text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {item.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};
