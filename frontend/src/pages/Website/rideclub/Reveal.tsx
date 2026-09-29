import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section';
}

/**
 * Sections reveal progressively on scroll — fade + translate up, once,
 * respecting prefers-reduced-motion. This is the site's only scroll
 * motion device, used consistently rather than a different effect per
 * section.
 */
export const Reveal: React.FC<RevealProps> = ({ children, className, delay = 0 }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: reduceMotion ? 0.2 : 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};
