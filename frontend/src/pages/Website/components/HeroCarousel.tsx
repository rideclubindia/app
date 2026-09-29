import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { heroSlides } from '../data/heroSlides';

const AUTOPLAY_MS = 7000;

export const HeroCarousel: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion();
  const touchStartX = useRef<number | null>(null);
  const total = heroSlides.length;
  const slide = heroSlides[index];

  const goTo = useCallback((next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex(((next % total) + total) % total);
  }, [index, total]);

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [goNext, reduceMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 40) goPrev();
    else if (delta < -40) goNext();
    touchStartX.current = null;
  };

  // The reference shows the *other* slides as the numbered row below the
  // active one — not a full list including the current slide.
  const upcoming = [1, 2, 3].map((offset) => (index + offset) % total);

  return (
    <section className={`wf2-hero-wrap theme-${slide.theme}`}>
      {/* One continuous full-bleed photo behind both columns, with a
          gradient wash toward the right where the text sits — not a
          separate image tile next to a flat-color panel. */}
      <div className="wf2-hero-photo" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={slide.id}
            src={slide.image}
            alt=""
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.75, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>
        <div className="wf2-hero-gradient" />

        <span className="wf2-hero-bignum" aria-hidden="true">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={index}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: direction * 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -direction * 18 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {String(index + 1).padStart(2, '0')}
            </motion.span>
          </AnimatePresence>
        </span>

        <div className="wf2-hero-row">
          <div className="wf2-hero-media">
            <span className="wf2-hero-play">
              <Play size={18} fill="currentColor" />
            </span>
            <div className="wf-hero-about-card">
              <div className="wf-hero-about-label">About</div>
              <p className="wf-hero-about-text">
                Ride Club keeps motorcycle groups connected on the road: live tracking, crash detection, and route planning built for riders.
              </p>
            </div>
          </div>

          <div className="wf2-hero-panel">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={slide.id}
                className="wf2-hero-badge"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.4 }}
              >
                {slide.badge}
              </motion.span>
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={slide.id}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1], delay: reduceMotion ? 0 : 0.08 }}
              >
                <div className="wf2-hero-eyebrow">{slide.eyebrow}</div>
                <h1 className="wf2-hero-headline">{slide.headline}</h1>
                <p className="wf2-hero-desc">{slide.description}</p>
                <div className="wf2-hero-cta-row">
                  <Link to={slide.ctaLink} className="wf-btn-primary">
                    <span>{slide.ctaLabel}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="wf-hero-slides">
        {upcoming.map((idx) => (
          <button
            key={heroSlides[idx].id}
            type="button"
            onClick={() => goTo(idx)}
            className="wf-hero-slide"
          >
            <span className="wf-hero-slide-num">0{idx + 1}.</span>
            <span className="wf-hero-slide-title">{heroSlides[idx].headline}</span>
          </button>
        ))}
        <div className="wf-hero-slide-arrows">
          <button type="button" onClick={goPrev} aria-label="Previous slide" className="wf-hero-slide-arrow-btn">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={goNext} aria-label="Next slide" className="wf-hero-slide-arrow-btn">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
