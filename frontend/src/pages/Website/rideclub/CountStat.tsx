import React, { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

interface CountStatProps {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

/** A number that counts up from 0 once it scrolls into view. */
export const CountStat: React.FC<CountStatProps> = ({ value, prefix = '', suffix = '', label }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (!isInView || reduceMotion) return;
    const duration = 900;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, reduceMotion, value]);

  return (
    <div className="rc-stat" ref={ref}>
      <span className="rc-stat-val">{prefix}{display}{suffix}</span>
      <span className="rc-stat-label">{label}</span>
    </div>
  );
};
