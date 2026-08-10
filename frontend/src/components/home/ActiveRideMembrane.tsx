import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActiveRideMembraneProps {
  ride: any | null;
}

export const ActiveRideMembrane: React.FC<ActiveRideMembraneProps> = ({ ride }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  if (!ride) return null;

  return (
    <motion.div 
      layout
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-8 left-[100px] z-40 bg-white/82 backdrop-blur-[16px] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60 p-5 pointer-events-auto w-[320px]"
      style={{ backgroundColor: 'rgba(255,255,255,0.82)' }}
    >
      <div className="flex justify-between items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <h3 className="text-[12px] font-bold text-[#F97316] uppercase tracking-wider mb-1">Active Ride</h3>
          <h2 className="text-[20px] font-black text-[#111827] leading-tight mb-1">{ride.name}</h2>
          <p className="text-[13px] font-medium text-[#6B7280]">
            86 km remaining • ETA 10:24 AM
          </p>
        </div>
        <button className="w-8 h-8 rounded-full bg-[#FAFAF9] flex items-center justify-center text-[#111827]">
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-4 border-t border-gray-200">
               <div className="flex justify-between items-center mb-4">
                 <div className="text-[12px] text-[#6B7280]">
                    <span className="font-bold text-[#111827]">Borra Caves</span><br/>Next Stop
                 </div>
                 <div className="text-[12px] text-[#6B7280] text-center">
                    <span className="font-bold text-[#111827]">Chapari Viewpoint</span><br/>2 of 4 Stops
                 </div>
                 <div className="text-[12px] text-[#6B7280] text-right">
                    <span className="font-bold text-[#111827]">Araku Valley</span><br/>Destination
                 </div>
               </div>

               <div className="flex justify-between items-center mt-6">
                 <div className="flex -space-x-2">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
                   ))}
                   <div className="text-[12px] font-bold text-[#F97316] ml-4 flex items-center">
                     6 Riders Active
                   </div>
                 </div>
                 
                 <button 
                   onClick={() => navigate(`/ride-plus/live/${ride.id}`)}
                   className="text-[13px] font-bold text-[#F97316] hover:underline"
                 >
                   View Ride
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
