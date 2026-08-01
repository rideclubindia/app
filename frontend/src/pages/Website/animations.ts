import type { Variants } from 'framer-motion';

// Shared scroll-reveal viewport config: animate once, slightly before fully in view
export const viewport = { once: true, amount: 0.2 };

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

// Wrap a grid/list container with this, and each child with `fadeInUp`,
// to stagger children in as the container enters the viewport.
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

export const heroCardHover = {
  whileHover: { y: -6, transition: { duration: 0.25, ease: 'easeOut' } },
  whileTap: { scale: 0.98 },
};

export const blurIn: Variants = {
  hidden: { opacity: 0, filter: 'blur(12px)', y: 20 },
  visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

// Tilt + lift on hover, for feature/CTA cards. Spread onto a motion element.
export const magneticHover = {
  whileHover: { y: -8, scale: 1.02, transition: { duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] as const } },
  whileTap: { scale: 0.97 },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease: 'easeIn' } },
};
