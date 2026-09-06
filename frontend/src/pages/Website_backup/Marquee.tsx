import React from 'react';
import { motion } from 'framer-motion';

interface MarqueeProps {
  items: string[];
  speed?: number;
  dark?: boolean;
}

// Infinite horizontal scroll strip. Renders the item list twice back-to-back
// and animates a translateX loop, so the seam is invisible.
export const Marquee: React.FC<MarqueeProps> = ({ items, speed = 30, dark = true }) => {
  const color = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';

  return (
    <div style={{ overflow: 'hidden', width: '100%', maskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)' }}>
      <motion.div
        style={{ display: 'flex', gap: '64px', width: 'max-content' }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              color,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
            }}
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
};
