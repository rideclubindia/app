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
    <div className="portrait:w-full portrait:h-[48px] portrait:flex-row portrait:justify-around portrait:py-0 portrait:px-1.5 portrait:gap-0 portrait:order-last landscape:w-[48px] landscape:h-full landscape:flex-col landscape:justify-start landscape:py-3 landscape:px-0 landscape:gap-3.5 landscape:order-first bg-white border-r border-gray-200/80 flex items-center shrink-0 z-50 shadow-xs">
      {/* Brand logo at the top - landscape only */}
      <div className="hidden landscape:flex w-7.5 h-7.5 rounded-lg bg-[#FF5A00] items-center justify-center landscape:mb-1 shadow-xs">
        <span className="text-white text-[10px] font-black italic tracking-tighter">RC</span>
      </div>

      {navItems.map(item => {
        const activePath = location.pathname === '/dev-home' ? '/home' : location.pathname;
        const isActive = activePath.includes(item.path);
        
        return (
          <button 
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`w-8.5 h-8.5 flex flex-col items-center justify-center rounded-lg transition-all relative group cursor-pointer ${
              isActive 
                ? 'bg-orange-50 text-[#FF5A00] shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={item.label}
          >
            <item.icon className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
            
            {/* Active indicator - left bar in landscape, bottom bar in portrait */}
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#FF5A00] rounded-r-full hidden landscape:block" />}
            {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#FF5A00] rounded-t-full landscape:hidden" />}
            
            {/* Tooltip on hover - landscape only */}
            <div className="hidden landscape:block absolute left-12 bg-gray-900 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {item.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};
