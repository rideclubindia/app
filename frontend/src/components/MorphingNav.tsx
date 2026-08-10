import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, User, Users, Navigation2, Home as HomeIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'home', path: '/home', icon: HomeIcon, label: 'Home' },
  { id: 'incidents', path: '/map', icon: AlertTriangle, label: 'Navigate' },
  { id: 'ride', path: '/ride-plus', matches: ['/ride-plus', '/group-ride-dashboard'], icon: Navigation2, label: 'Ride+', isHero: true },
  { id: 'groups', path: '/groups', icon: Users, label: 'Community' },
  { id: 'profile', path: '/profile', icon: User, label: 'Profile' }
];

export const MorphingNav = () => {
  const location = useLocation();

  const getIsActive = (tab: any) => {
    if (tab.matches) {
      return tab.matches.some((m: string) => location.pathname.startsWith(m));
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <div className="w-full max-w-[400px] px-4 pb-4">
      <div className="flex items-center justify-between px-2 py-3 bg-white/80 backdrop-blur-xl border border-white/40 shadow-lg rounded-3xl">
        {TABS.map((tab) => {
          const isActive = getIsActive(tab);
          const Icon = tab.icon;

          if (tab.isHero) {
            return (
              <Link key={tab.id} to={tab.path} className="relative z-10 flex flex-col items-center justify-center -mt-8 outline-none active:scale-95 transition-transform">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 text-white">
                  <Icon className="w-6 h-6 ml-0.5" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold mt-1 text-primary">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.id}
              to={tab.path}
              className="flex flex-col items-center justify-center w-[60px] h-[50px] outline-none group active:scale-95 transition-transform"
            >
              <motion.div
                initial={false}
                animate={{
                  y: isActive ? -2 : 0,
                  scale: isActive ? 1.1 : 1,
                }}
                className="relative"
              >
                <Icon
                  className={`w-[22px] h-[22px] transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <motion.div 
                    layoutId="active-dot" 
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" 
                  />
                )}
              </motion.div>
              <span
                className={`text-[10px] mt-1 transition-colors duration-200 ${
                  isActive ? 'text-primary font-semibold' : 'text-gray-400 font-medium'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
