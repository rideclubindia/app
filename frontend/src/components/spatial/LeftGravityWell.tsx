import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeftGravityWellProps {
  onSOSClick?: () => void;
  children?: React.ReactNode;
}

export const LeftGravityWell: React.FC<LeftGravityWellProps> = ({ onSOSClick, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute left-0 inset-y-0 w-[72px] landscape:w-[80px] z-50 pointer-events-none group">
      {/* Permanent SOS Strip */}
      <div 
        className="absolute left-0 inset-y-0 w-2 bg-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.5)] pointer-events-auto cursor-pointer"
        onClick={onSOSClick}
        title="SOS"
      />

      {/* Drag Zone (Invisible) */}
      <div 
        className="absolute inset-y-0 left-2 w-[40px] pointer-events-auto"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onTouchStart={() => setIsOpen(true)}
      />

      {/* Expanded Membrane */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute left-2 inset-y-4 w-[56px] bg-[rgba(255,255,255,0.82)] backdrop-blur-[12px] rounded-r-[20px] shadow-[inset_0_0_20px_rgba(249,115,22,0.4)] pointer-events-auto flex flex-col items-center py-4 border-r border-t border-b border-white/20"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
