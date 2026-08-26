import React from 'react';
import { Home, AlertTriangle, Car, Users, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'map', icon: AlertTriangle, label: 'Incidents', path: '/map' },
    { id: 'ride-plus', icon: Car, label: 'Ride+', path: '/ride-plus' },
    { id: 'groups', icon: Users, label: 'Groups', path: '/groups' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-50 flex justify-around items-center px-2">
      {navItems.map(item => {
        const isActive = location.pathname.includes(item.path);
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
              isActive ? 'text-[#FF5A00]' : 'text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute top-0 w-8 h-1 bg-[#FF5A00] rounded-b-full"></div>
            )}
          </button>
        );
      })}
    </div>
  );
};
