import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import logoLight from '../../../assets/Logos/Logo for White Backgrounds 2.svg';
import logoDark from '../../../assets/Logos/Logo for Dark Backgrounds 2.svg';

type Theme = 'light' | 'dark';

const readTheme = (): Theme => {
  try {
    const saved = localStorage.getItem('rc-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage blocked */ }
  return 'dark';
};
import { InstallPWA } from '../../../components/InstallPWA';

const links = [
  { to: '/features', label: 'Rides' },
  { to: '/safety', label: 'Safety' },
  { to: '/community', label: 'Community' },
  { to: '/app', label: 'The App' },
  { to: '/contact', label: 'Contact' }
];

export const Nav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const [theme, setTheme] = useState<Theme>(readTheme);

  // scoped to the marketing site: removed on unmount so app pages are unaffected
  useEffect(() => {
    document.documentElement.setAttribute('data-rc-theme', theme);
    return () => document.documentElement.removeAttribute('data-rc-theme');
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('rc-theme', next); } catch { /* storage blocked */ }
  };

  // This hero is asymmetric — plain background on the left, a photo only
  // on the right — so a transparent white-text nav (which needs a full-
  // width dark backdrop) would go invisible over the left half. The nav
  // stays on its normal solid/dark-text treatment throughout.
  return (
    <>
      <header className="rc-nav">
        <Link to="/" className="rc-nav-logo">
          <img src={theme === 'dark' ? logoDark : logoLight} alt="Ride Club" style={{ height: '72px', margin: '-20px -8px -18px', display: 'block' }} />
        </Link>

        <nav className="rc-nav-links">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="rc-nav-link">{l.label}</Link>
          ))}
        </nav>

        <div className="rc-nav-actions">
          <button
            type="button"
            onClick={toggleTheme}
            className="rc-theme-toggle"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link to="/login" className="rc-btn rc-btn-primary">
            <span>Launch App</span>
            <ArrowRight size={14} />
          </Link>
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="rc-mobile-toggle"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.25 }}
            className="rc-mobile-menu"
          >
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setIsOpen(false)}>{l.label}</Link>
            ))}
            <div style={{ paddingTop: 20 }}>
              <InstallPWA variant="button" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
