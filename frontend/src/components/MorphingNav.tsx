import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, User, Users, Navigation2, Home as HomeIcon } from 'lucide-react';

const TABS = [
  { id: 'home', path: '/home', icon: HomeIcon, label: 'Home' },
  { id: 'incidents', path: '/map', icon: AlertTriangle, label: 'Incidents' },
  { id: 'ride', path: '/ride-plus', matches: ['/ride-plus', '/group-ride-dashboard'], icon: Navigation2, label: 'Ride+', isHero: true },
  { id: 'groups', path: '/groups', icon: Users, label: 'Groups' },
  { id: 'profile', path: '/profile', icon: User, label: 'Account' }
];

export const MorphingNav = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tabPositions, setTabPositions] = useState<number[]>([]);
  const dockControls = useAnimation();

  useEffect(() => {
    const currentTab = TABS.findIndex(t => {
      if (t.matches) {
        return t.matches.some(m => location.pathname.startsWith(m));
      }
      return location.pathname.startsWith(t.path);
    });
    if (currentTab !== -1 && currentTab !== activeIndex) {
      setActiveIndex(currentTab);
      // Slight dock compression when moving (premium physical interaction)
      dockControls.start({
        scaleY: [1, 0.98, 1],
        transition: { duration: 0.4 }
      });
    }
  }, [location.pathname, activeIndex, dockControls]);

  useEffect(() => {
    const updatePositions = () => {
      if (containerRef.current) {
        const paddingX = 16; // Account for px-4 padding (16px) on left and right
        const containerWidth = containerRef.current.offsetWidth;
        const availableWidth = containerWidth - (paddingX * 2);
        const tabWidth = availableWidth / TABS.length;
        const positions = TABS.map((_, i) => paddingX + (i * tabWidth) + (tabWidth / 2));
        setTabPositions(positions);
      }
    };
    
    updatePositions();
    // Slight delay to ensure layout is complete
    setTimeout(updatePositions, 100);
    
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, []);

  const isRidePlusActive = activeIndex === 2;

  // Premium custom cubic-bezier tween for flawless smooth sliding
  const smoothTransition: any = { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.4 };

  return (
    <motion.div 
      className="w-full h-[76px] relative" 
      ref={containerRef}
      animate={dockControls}
      style={{ originY: 1 }} // compress from bottom
    >
      {/* 
        This wrapper applies a single drop-shadow to ALL children combined.
        This elegantly merges the flat dock base and the traveling bump into one seamless shape!
      */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none" 
        style={{ filter: 'drop-shadow(0px -4px 16px rgba(0,0,0,0.06))' }}
      >
        {/* Flat Dock Base */}
        <div className="absolute inset-0 bg-white" />

        {/* Traveling Morphing Bump - only renders the curve itself! */}
        {tabPositions.length > 0 && (
          <motion.div
            className="absolute top-[-32px] left-0 pointer-events-none"
            initial={false}
            animate={{ x: tabPositions[activeIndex] - 65 }} // 130px width / 2 = 65
            transition={smoothTransition}
          >
            <svg width="130" height="34" viewBox="0 0 130 34" className="fill-white">
              <path d="M 0 34 C 34 34, 42 2, 65 2 C 88 2, 96 34, 130 34 Z" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Floating Active Circle (travels between tabs) */}
      {tabPositions.length > 0 && (
        <motion.div
          className="absolute left-0 top-1/2 -mt-[30px] z-10 bg-[#ef4523] rounded-full pointer-events-none"
          initial={false}
          animate={{
            x: tabPositions[activeIndex] - 30, // 60px width / 2 = 30
            y: -34, // Translates up exactly in sync with the icon
            width: 60,
            height: 60,
            boxShadow: isRidePlusActive 
              ? '0 12px 28px rgba(239,69,35,0.18), 0 0 16px rgba(239,69,35,0.12)'
              : '0 8px 24px rgba(239,69,35,0.15), 0 0 12px rgba(239,69,35,0.08)'
          }}
          transition={smoothTransition}
        />
      )}

      {/* Navigation Items */}
      <div className="absolute inset-0 z-20 flex justify-between items-center px-4">
        {TABS.map((tab, index) => {
          const isActive = activeIndex === index;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              to={tab.path}
              className="relative flex flex-col items-center justify-center w-full h-full outline-none group"
            >
              <motion.div
                className="flex items-center justify-center relative"
                initial={false}
                animate={{
                  y: isActive ? -34 : -10, // -10 perfectly centers the inactive icon above the text
                  scale: isActive ? 1.08 : 1,
                  rotate: isActive && tab.isHero ? [0, 3, -2, 0] : 0
                }}
                whileTap={{ scale: isActive ? 0.9 : 0.85 }}
                whileHover={{ scale: isActive ? 1.12 : 1.08 }}
                transition={{
                  y: smoothTransition,
                  scale: { duration: 0.2 },
                  rotate: { duration: 0.4, ease: "easeOut" }
                }}
              >
                <Icon 
                  className={`w-6 h-6 transition-colors duration-200 ${
                    isActive ? 'text-white' : tab.isHero ? 'text-[#ef4523]' : 'text-[#8A8A8E]'
                  }`}
                  strokeWidth={isActive || tab.isHero ? 2.5 : 2} 
                />
              </motion.div>
              
              <motion.span
                initial={false}
                animate={{ 
                  opacity: isActive ? 1 : 0.6,
                  y: isActive ? -4 : 0, // Pull active text slightly up towards the circle
                  color: isActive ? '#ef4523' : '#8A8A8E'
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-[11px] font-medium absolute bottom-[10px] w-full text-center"
                style={{ pointerEvents: 'none' }}
              >
                {tab.label}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
};
