import React from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { SpeedometerCluster } from '../../hmi/components/Speedometer';
import { ChevronDown, MapPin, Navigation2, Crosshair, Plus, Minus, Power, Volume2, Route as RouteIcon, MoreHorizontal, Car, Users } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';

const RideClubBrand = () => (
  <div className="flex items-center gap-3 mb-4 mt-8">
    <div className="w-8 h-8 rounded-full bg-[#FF5A00] flex items-center justify-center shrink-0">
      <span className="text-white text-[10px] font-semibold italic tracking-tighter">RC</span>
    </div>
    <div className="flex flex-col">
      <span className="text-[#111111] font-semibold text-base tracking-wide uppercase leading-tight">RideClub</span>
      <span className="text-[#6B7280] text-[10px] font-medium tracking-wide">Live Free. Ride Safe.</span>
    </div>
  </div>
);

const ActiveRoute = ({ currentRide }: { currentRide: any }) => {
  if (!currentRide) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm w-full shrink-0 flex flex-col items-center justify-center text-center">
        <Car className="w-8 h-8 text-gray-300 mb-2" />
        <span className="font-semibold text-[#111111] text-sm">No Active Ride</span>
        <span className="text-xs text-[#6B7280] font-medium mt-1">Start a ride from the Ride+ menu</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#FF5A00]/40 rounded-xl p-3 shadow-sm w-full shrink-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FF5A00]/10 flex items-center justify-center text-[#FF5A00]">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#111111] text-sm">{currentRide.name || 'Current Ride'}</span>
              <span className="bg-[#FF5A00] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-sm">LIVE</span>
            </div>
            <span className="text-xs text-[#6B7280] font-medium">
              {currentRide.distance ? `${currentRide.distance} km` : 'Tracking distance...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RouteSection = ({ currentRide }: { currentRide: any }) => (
  <div className="w-full mt-3 sm:mt-5 flex flex-col min-h-0 shrink overflow-hidden">
    <div className="flex items-center justify-between mb-2 px-1 shrink-0">
      <div className="flex items-center gap-1.5 text-[#FF5A00]">
        <RouteIcon className="w-4 h-4" />
        <span className="font-semibold text-[#111111] text-sm">My Route</span>
      </div>
      <button className="text-[#FF5A00] text-xs font-semibold flex items-center">
        View All <ChevronDown className="w-3 h-3 -rotate-90 ml-0.5" />
      </button>
    </div>
    
    <div className="flex-1 overflow-y-auto pr-1 pb-2 flex flex-col gap-2">
      <ActiveRoute currentRide={currentRide} />
    </div>
  </div>
);

const TelemetryPanel = ({ speed, currentRide }: { speed: number; currentRide: any }) => (
  <div className="flex flex-col w-[35%] min-w-[320px] max-w-[380px] h-full pt-12 pb-24 px-4 bg-[#F7F8FA] shrink-0 z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)]">
    <RideClubBrand />
    
    <div className="flex justify-center items-center w-full flex-1 min-h-[160px] max-h-[260px] py-4">
      <SpeedometerCluster speed={speed} />
    </div>
    
    <RouteSection currentRide={currentRide} />
  </div>
);

const MapControls = () => (
  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10 pointer-events-none hidden sm:flex">
    <button className="w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-[#111111] hover:bg-gray-50 border border-gray-100 pointer-events-auto">
      <Navigation2 className="w-6 h-6" />
    </button>
    <div className="flex flex-col bg-white/90 backdrop-blur rounded-full shadow-md border border-gray-100 overflow-hidden pointer-events-auto">
      <button className="w-12 h-12 flex items-center justify-center text-[#111111] hover:bg-gray-50 border-b border-gray-100">
        <Plus className="w-6 h-6" />
      </button>
      <button className="w-12 h-12 flex items-center justify-center text-[#111111] hover:bg-gray-50">
        <Minus className="w-6 h-6" />
      </button>
    </div>
    <button className="w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-[#111111] hover:bg-gray-50 border border-gray-100 pointer-events-auto">
      <Crosshair className="w-6 h-6" />
    </button>
  </div>
);

const MapBottomControls = () => (
  <div className="absolute right-4 sm:left-4 sm:right-auto bottom-24 z-10 flex items-center gap-1 bg-white/90 backdrop-blur rounded-full shadow-md border border-gray-100 p-1.5 pointer-events-auto">
    <button className="w-10 h-10 flex items-center justify-center text-[#111111] hover:bg-gray-50 rounded-full hidden sm:flex">
      <RouteIcon className="w-5 h-5" />
    </button>
    <button className="w-10 h-10 flex items-center justify-center text-[#111111] hover:bg-gray-50 rounded-full">
      <MoreHorizontal className="w-5 h-5" />
    </button>
  </div>
);

const NavigationMapArea = () => {
  return (
    <div className="relative flex-1 h-full z-0 overflow-hidden pointer-events-none">
      <MapControls />
      <MapBottomControls />
    </div>
  );
};

export const HomeHMI = () => {
  const { speed } = useLocationStore();
  const context = useOutletContext<any>();
  const currentRide = context?.currentRide;
  
  return (
    <>
      <TelemetryPanel speed={speed || 0} currentRide={currentRide} />
      <NavigationMapArea />
    </>
  );
};
