import React from 'react';
import { Home, Compass, Plus, MessageCircle, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isLandscapeAllowedRoute } from '../lib/orientationRoutes';

export const LeftNavigationRail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Only Ride and Navigation may adapt to a landscape window. On every other
  // screen the rail stays the portrait bottom pill no matter how wide the
  // window is — the `landscape:` variants are dropped entirely rather than
  // relying on an orientation lock the browser may not honour.
  const allowLandscape = isLandscapeAllowedRoute(location.pathname);

  // live ride is full-screen in portrait: the ride's own drawer replaces the bottom menu
  const hideInPortrait = location.pathname.startsWith('/ride-plus/live') ? 'portrait:!hidden ' : location.pathname.startsWith('/ride-plus/create') ? '!hidden ' : '';

  const railClass = hideInPortrait + (allowLandscape
    ? 'portrait:fixed portrait:left-1/2 portrait:-translate-x-1/2 portrait:bottom-3 portrait:z-50 portrait:w-[calc(100%-24px)] portrait:max-w-[420px] portrait:h-[68px] portrait:flex-row portrait:justify-around portrait:px-3 portrait:rounded-full landscape:static landscape:w-[72px] landscape:h-full landscape:flex-col landscape:justify-start landscape:py-4 landscape:gap-3.5 landscape:order-first landscape:rounded-r-[24px] nav-bar-app flex items-center shrink-0'
    : 'fixed left-1/2 -translate-x-1/2 bottom-3 z-50 w-[calc(100%-24px)] max-w-[420px] h-[68px] flex-row justify-around px-3 rounded-full nav-bar-app flex items-center shrink-0');

  const fabClass = allowLandscape
    ? 'portrait:w-14 portrait:h-14 portrait:-translate-y-4 landscape:w-11 landscape:h-11 landscape:translate-y-0 rounded-full nav-fab-app flex items-center justify-center text-white shrink-0 active:scale-95 transition-all cursor-pointer'
    : 'w-14 h-14 -translate-y-4 rounded-full nav-fab-app flex items-center justify-center text-white shrink-0 active:scale-95 transition-all cursor-pointer';

  const itemSizingClass = allowLandscape
    ? 'portrait:w-12 landscape:w-11 landscape:h-11 landscape:rounded-xl'
    : 'w-12';

  const labelClass = allowLandscape
    ? 'portrait:block landscape:hidden text-[9px] font-bold'
    : 'block text-[9px] font-bold';

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'map', icon: Compass, label: 'Explore', path: '/explore' },
    { id: 'ride-plus', icon: Plus, label: 'Create', path: '/ride-plus', isFab: true },
    { id: 'groups', icon: MessageCircle, label: 'Messages', path: '/groups' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className={railClass}>
      {/* Brand logo — landscape only */}
      {allowLandscape && (
        <div className="hidden landscape:flex w-8 h-8 rounded-xl btn-app-primary items-center justify-center landscape:mb-1.5">
          <span className="text-white text-[10px] font-black italic tracking-tighter">RC</span>
        </div>
      )}

      {navItems.map(item => {
        const activePath = location.pathname === '/dev-home' ? '/home' : location.pathname;
        const isActive = activePath.includes(item.path.split('/')[1] ? `/${item.path.split('/')[1]}` : item.path);

        if (item.isFab) {
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              title="Create or find a ride, join with a code, or report an incident"
              className={fabClass}
            >
              <item.icon className="w-6 h-6 stroke-[2.5]" />
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center gap-0.5 transition-all relative group cursor-pointer ${itemSizingClass} ${
              isActive
                ? 'text-[#FF6B22]'
                : 'text-gray-400 hover:text-gray-700'
            }`}
            title={item.label}
          >
            <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
            <span className={labelClass}>{item.label}</span>

            {/* Tooltip on hover - landscape only */}
            {allowLandscape && (
              <div className="hidden landscape:block absolute left-14 bg-gray-900 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {item.label}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
