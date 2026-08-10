import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Navigation2, Plus, Users, Bookmark, Bike, AlertTriangle, Crosshair } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LeftGravityRail: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { icon: Search, label: 'Search', onClick: () => {} },
    { icon: Navigation2, label: 'Start Navigation', onClick: () => navigate('/route-planner') },
    { icon: Plus, label: 'Create Ride', onClick: () => navigate('/ride-plus/create') },
    { icon: Users, label: 'Join Ride', onClick: () => navigate('/ride-plus/join') },
    { icon: Bookmark, label: 'Saved Places', onClick: () => navigate('/saved-locations') },
    { icon: Bike, label: 'Nearby Rides', onClick: () => navigate('/my-rides') },
    { icon: AlertTriangle, label: 'Report Hazard', onClick: () => navigate('/my-incidents') },
    { icon: Crosshair, label: 'Recenter', onClick: () => {} },
  ];

  return (
    <div 
      className="absolute left-0 top-0 bottom-0 z-50 flex"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* 72px Permanent Interaction Zone */}
      <div className="w-[72px] h-full flex flex-col items-center pt-8 pointer-events-auto">
         <div className="w-1 h-12 bg-[#F97316] rounded-full opacity-40"></div>
         <span className="text-[#F97316] text-[10px] font-bold rotate-90 mt-12 whitespace-nowrap opacity-60">
           {isExpanded ? 'Pull again to close' : 'Pull to reveal'}
         </span>
      </div>

      {/* 56px Membrane */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-[56px] h-[90%] my-auto bg-white/82 backdrop-blur-[16px] rounded-[28px] shadow-[inset_0_0_0_1px_rgba(249,115,22,0.2)] flex flex-col items-center py-6 gap-6 pointer-events-auto border border-white/50"
            style={{ backgroundColor: 'rgba(255,255,255,0.82)' }}
          >
            {actions.map((action, idx) => (
              <button 
                key={idx} 
                onClick={action.onClick}
                className="group flex flex-col items-center gap-1 active:scale-95 transition-transform w-full"
              >
                <action.icon className="w-6 h-6 text-[#111827] group-hover:text-[#F97316] transition-colors" strokeWidth={2} />
                <span className="text-[10px] text-[#6B7280] font-medium scale-0 group-hover:scale-100 absolute left-[64px] bg-white px-2 py-1 rounded shadow-md transition-transform origin-left whitespace-nowrap">
                  {action.label}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
