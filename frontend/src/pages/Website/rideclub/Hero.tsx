import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import groupImg from '../../../assets/rideclub/riders_coast_tall.jpg';
import crashImg from '../../../assets/webflow_dash_alert.jpg';
import navImg from '../../../assets/webflow_cockpit_hero.jpg';

const slides = [
  {
    tab: 'Live group rides',
    kicker: ['Every rider,', 'one live map'],
    title: 'Ride together. Go further.',
    img: groupImg,
    alt: 'A group of motorcyclists riding a coastal road at sunset'
  },
  {
    tab: 'Crash detection & SOS',
    kicker: ['Help on the way', 'in 30 seconds'],
    title: 'Go down. Get help.',
    img: crashImg,
    alt: 'Crash detection screen counting down before sending an SOS'
  },
  {
    tab: 'Turn-by-turn navigation',
    kicker: ['Offline maps,', 'sunlight-readable'],
    title: 'Every turn, at a glance.',
    img: navImg,
    alt: 'Motorcycle dashboard showing turn-by-turn navigation'
  }
];

const AUTOPLAY_MS = 7000;

export const Hero: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const slide = slides[idx];

  const go = (dir: number) => setIdx((i) => (i + dir + slides.length) % slides.length);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const t = window.setTimeout(() => go(1), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [idx, paused, reduceMotion]);

  const fade = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

  return (
    <section
      className="rc-hero"
      id="rc-hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="rc-hero-media">
        <AnimatePresence initial={false}>
          <motion.img
            key={slide.img}
            src={slide.img}
            alt={slide.alt}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>
        <span className="rc-hero-num" aria-hidden="true">{String(idx + 1).padStart(2, '0')}</span>

        <div className="rc-hero-about">
          <span className="rc-hero-about-label">About RideClub</span>
          <p>
            Built for motorcycle groups, not adapted from a car app — plan the route, bring the pack, and stay connected until everyone's home.
          </p>
          <Link to="/login" className="rc-hero-start">
            <span className="rc-hero-start-icon"><ArrowRight size={16} /></span>
            <span>Start riding — it's free</span>
          </Link>
        </div>
      </div>

      <div className="rc-hero-content">
        <div className="rc-hero-top">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={idx} className="rc-hero-kicker" {...fade} transition={{ duration: 0.35 }}>
              {slide.kicker[0]}<br />{slide.kicker[1]}
            </motion.p>
          </AnimatePresence>
          <div className="rc-hero-chip">
            <span>Android &amp; web</span>
            <span>Free to start</span>
          </div>
        </div>

        <div className="rc-hero-main">
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1 key={idx} className="rc-hero-display" {...fade} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              {slide.title}
            </motion.h1>
          </AnimatePresence>
          <p className="rc-hero-copy">
            Plan rides, find riders, and stay connected wherever the road takes you — live tracking, crash detection, and route planning built for two wheels.
          </p>
        </div>

        <div className="rc-hero-tabs-wrap">
          <div className="rc-hero-tabs" role="tablist" aria-label="Featured capabilities">
            {slides.map((s, i) => (
              <button
                key={s.tab}
                type="button"
                role="tab"
                aria-selected={i === idx}
                className={`rc-hero-tab${i === idx ? ' is-active' : ''}`}
                onClick={() => setIdx(i)}
              >
                <span className="rc-hero-tab-bar">
                  {i === idx && !paused && !reduceMotion && (
                    <span className="rc-hero-tab-progress" style={{ animationDuration: `${AUTOPLAY_MS}ms` }} />
                  )}
                </span>
                <span className="rc-hero-tab-num">{String(i + 1).padStart(2, '0')}.</span>
                <span className="rc-hero-tab-label">{s.tab}</span>
              </button>
            ))}
          </div>
          <div className="rc-hero-arrows">
            <button type="button" aria-label="Previous" onClick={() => go(-1)}><ChevronLeft size={16} /></button>
            <button type="button" aria-label="Next" onClick={() => go(1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </section>
  );
};
