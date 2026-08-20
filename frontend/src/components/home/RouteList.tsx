import React from 'react';
import { MapPin, Navigation, MoreVertical, Route as RouteIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RouteData {
  id: string;
  name: string;
  distance: string;
  duration: string;
  stops: number;
  isActive?: boolean;
  progress?: number;
  image?: string;
  startLocation?: string;
  nextStop?: string;
  destination?: string;
  weather?: string;
  eta?: string;
}

interface RouteListProps {
  activeRoute: RouteData | null;
  savedRoutes: RouteData[];
  onRouteClick?: (route: RouteData) => void;
  minimal?: boolean;
}

export const RouteList: React.FC<RouteListProps> = ({ activeRoute, savedRoutes, onRouteClick, minimal }) => {
  if (minimal && !activeRoute) return null;

  return (
    <div className="flex flex-col flex-1 pb-2">
      {!minimal && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white">
            <RouteIcon size={16} />
            <h3 className="font-bold text-sm">My Route</h3>
          </div>
          <Link to="/routes" className="text-[11px] font-semibold text-[#F97316] hover:text-[#FB923C] flex items-center gap-1">
            View All <span className="text-sm leading-none">&rsaquo;</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3 overflow-y-auto hide-scrollbar">
        {/* Active Route */}
        {activeRoute && (
          <div 
            onClick={() => onRouteClick && onRouteClick(activeRoute)}
            className="border border-[#2A3040] rounded-[14px] p-4 bg-[#161C28] flex flex-col cursor-pointer transition-shadow hover:border-[#F97316]/40 relative overflow-hidden"
          >
            
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#1E2536] flex items-center justify-center text-[#F97316]">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-[13px]">{activeRoute.name}</h4>
                    <span className="px-1.5 py-0.5 bg-[#F97316] text-white text-[8px] font-bold rounded-sm uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-[#9BA3B0] mt-0.5">
                    {activeRoute.distance} &middot; {activeRoute.duration} &middot; {activeRoute.stops} Stops
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Visualization */}
            <div className="mt-1 px-1">
              <div className="relative h-[2px] bg-[#2A3040] rounded-full w-full flex items-center my-3">
                <div 
                  className="absolute left-0 h-full bg-[#8890A0] rounded-full" 
                  style={{ width: `${(activeRoute.progress || 0) * 100}%` }}
                />
                <div 
                  className="absolute right-0 h-full bg-[#F97316] rounded-full" 
                  style={{ width: `${(1 - (activeRoute.progress || 0)) * 100}%` }}
                />
                
                <div className="absolute left-0 w-2 h-2 bg-[#8890A0] rounded-full transform -translate-x-1" />
                
                <div 
                  className="absolute w-4 h-4 bg-[#0D1118] border-2 border-[#F97316] rounded-full flex items-center justify-center transform -translate-x-1/2 z-10"
                  style={{ left: `${(activeRoute.progress || 0) * 100}%` }}
                >
                  <div className="w-1 h-1 bg-[#F97316] rounded-full" />
                </div>

                <div className="absolute left-[65%] w-1.5 h-1.5 bg-[#F97316] rounded-full ring-2 ring-[#0D1118] transform -translate-x-1/2 z-0" />
                <div className="absolute right-0 w-2 h-2 bg-[#F97316] rounded-full transform translate-x-1" />
              </div>
              
              <div className="flex justify-between mt-3 text-[9px] font-medium text-[#9BA3B0]">
                <div className="w-1/3 text-left leading-tight">
                  <span className="block text-[#C0C6D0]">{activeRoute.startLocation}</span>
                </div>
                <div className="w-1/3 text-center leading-tight">
                  <span className="block text-[#C0C6D0]">{activeRoute.nextStop}</span>
                </div>
                <div className="w-1/3 text-right leading-tight">
                  <span className="block text-[#C0C6D0]">{activeRoute.destination}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No active route message */}
        {!activeRoute && !minimal && (
          <div className="border border-[#2A3040] border-dashed rounded-[14px] p-6 flex flex-col items-center justify-center text-center">
            <Navigation size={20} className="text-[#8890A0] mb-2" />
            <p className="text-[12px] font-medium text-[#9BA3B0]">No active route</p>
            <Link to="/route-planner" className="text-[11px] font-semibold text-[#F97316] mt-1">
              Plan a ride &rsaquo;
            </Link>
          </div>
        )}

        {/* Saved Routes */}
        {!minimal && savedRoutes.map((route) => (
          <div key={route.id} className="rounded-[12px] p-2.5 bg-[#161C28] hover:bg-[#1E2536] cursor-pointer flex items-center gap-3 transition-colors border border-[#2A3040]">
            <div className="w-14 h-10 rounded-[8px] bg-[#1E2536] flex items-center justify-center flex-shrink-0">
              <Navigation size={14} className="text-[#8890A0]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-[12px] truncate">{route.name}</h4>
              <p className="text-[10px] font-medium text-[#9BA3B0]">
                {route.distance} &bull; {route.duration} &bull; {route.stops} Stops
              </p>
            </div>
            <button className="text-[#8890A0] hover:text-[#C0C6D0] flex-shrink-0">
              <MoreVertical size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
