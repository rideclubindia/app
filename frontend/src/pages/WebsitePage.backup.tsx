import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, ArrowRight, ChevronRight, Shield, Terminal, CheckCircle2 } from 'lucide-react';
import logoLight from '../assets/Logos/Logo for White Backgrounds 2.svg';
import './Website/WebsiteWebflow.css';
import { InstallPWA } from '../components/InstallPWA';
import { InteractiveCanvasGrid } from './Website/components/InteractiveCanvasGrid';

interface WebsitePageProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

const WebsitePage: React.FC<WebsitePageProps> = ({ title, subtitle, children, fullWidth }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('rideclub_theme_mode') === 'light';
  });

  const toggleThemeMode = () => {
    setIsLightMode((prev) => {
      const next = !prev;
      localStorage.setItem('rideclub_theme_mode', next ? 'light' : 'dark');
      return next;
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className={`website-wrapper dev-theme ${isLightMode ? 'light-mode' : ''}`}>
      {/* Interactive Blueprint Lines */}
      {!isLightMode && <InteractiveCanvasGrid />}

      {/* TOP ANNOUNCEMENT BANNER matching Webflow Enterprise */}
      <div className="webflow-announcement-banner">
        <span className="webflow-announcement-tag">ENTERPRISE</span>
        <span className="text-zinc-300">
          Ride Club OS 2.4 is live: Autonomous Crash Sentinel & Low-Latency Cockpit HUD.
        </span>
        <Link to="/features" className="webflow-announcement-link">
          <span>Explore Platform</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* STICKY WEBFLOW ENTERPRISE NAVBAR */}
      <header className="dev-nav">
        <div className="dev-nav-logo">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoLight} alt="Ride Club" style={{ height: '38px', display: 'block' }} />
            <span className="dev-nav-badge">ENTERPRISE</span>
          </Link>
        </div>

        <nav className="dev-nav-links hidden lg:flex">
          <Link to="/features" className="dev-nav-link">Platform</Link>
          <Link to="/safety" className="dev-nav-link">Crash Sentinel</Link>
          <Link to="/community" className="dev-nav-link">Pack Mesh</Link>
          <Link to="/app" className="dev-nav-link">Cockpit App</Link>
          <Link to="/architecture" className="dev-nav-link">Architecture</Link>
          <Link to="/contact" className="dev-nav-link">Contact Enterprise</Link>
        </nav>

        <div className="dev-nav-actions">
          {/* Light/Dark Mode (Normal Mode) Toggle Button */}
          <button
            onClick={toggleThemeMode}
            className="dev-btn-secondary p-2 flex items-center justify-center rounded-md"
            title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Normal (Light) Mode'}
            aria-label="Toggle theme mode"
          >
            {isLightMode ? <Moon size={15} /> : <Sun size={15} />}
            <span className="hidden sm:inline text-xs font-mono">
              {isLightMode ? 'Dark' : 'Normal'}
            </span>
          </button>

          <div className="hidden sm:block">
            <InstallPWA variant="button" className="dev-btn-secondary" />
          </div>

          <Link to="/login" className="wf-btn-primary py-2 px-4 text-xs font-sans">
            <span>Launch App</span>
            <ArrowRight size={14} />
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-zinc-400 hover:text-white bg-transparent border-0 cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-[96px] z-50 bg-zinc-950/95 border-b border-zinc-800 p-6 flex flex-col gap-4 font-mono">
          <Link to="/features" onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-300 hover:text-white py-2">01. Features</Link>
          <Link to="/safety" onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-300 hover:text-white py-2">02. Safety Protocol</Link>
          <Link to="/community" onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-300 hover:text-white py-2">03. Rider Network</Link>
          <Link to="/app" onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-300 hover:text-white py-2">04. The PWA App</Link>
          <Link to="/architecture" onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-300 hover:text-white py-2">05. Architecture & Specs</Link>
          <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-300 hover:text-white py-2">06. Contact Team</Link>
          <div className="pt-4 border-t border-zinc-800">
            <InstallPWA variant="button" />
          </div>
        </div>
      )}

      {/* GENERIC HERO / CONTENT */}
      {!fullWidth && (
        <section className="dev-subpage-hero">
          <div className="dev-subpage-badge">
            <span>RIDE CLUB PLATFORM &bull; {title.toUpperCase()}</span>
          </div>
          <h1 className="dev-subpage-title">{title}</h1>
          
          <p className="dev-subpage-subtitle mb-8">
            {subtitle || `Comprehensive specifications and capabilities for ${title} across the Ride Club ecosystem.`}
          </p>
          
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="wf-btn-secondary">
              Return Home
            </button>
            <button onClick={() => navigate('/login')} className="wf-btn-primary">
              <span>Launch Cockpit App</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* WHEN NO CUSTOM CHILDREN ARE PASSED, RENDER RICH CARDS */}
      {!children && !fullWidth && (
        <section className="dev-section pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="dev-feature-panel">
              <div className="text-orange-500 font-mono text-xs font-bold uppercase mb-2">Pillar 01</div>
              <h3 className="text-xl font-bold text-white mb-2">High-Precision Telemetry</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Seamless real-time IMU gyroscopic lean angle capture, turn-by-turn routing HUD, and pack proximity sensors.
              </p>
            </div>
            <div className="dev-feature-panel">
              <div className="text-blue-400 font-mono text-xs font-bold uppercase mb-2">Pillar 02</div>
              <h3 className="text-xl font-bold text-white mb-2">Zero App Store Overhead</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Engineered as a high-performance progressive web app. Install to your mobile home screen in under 2 seconds.
              </p>
            </div>
            <div className="dev-feature-panel">
              <div className="text-emerald-400 font-mono text-xs font-bold uppercase mb-2">Pillar 03</div>
              <h3 className="text-xl font-bold text-white mb-2">Autonomous Crash Sentinel</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Background emergency daemon monitors rollover angles and sudden deceleration, dispatching SMS coordinates instantly.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* PAGE CONTENT (IF PROVIDED) */}
      {children && (
        fullWidth ? (
          <div className="website-fullwidth-content">
            {children}
          </div>
        ) : (
          <section className="dev-section pt-0">
            <div className="dev-feature-panel leading-relaxed">
              {children}
            </div>
          </section>
        )
      )}

      {/* WEBFLOW-STYLE FOOTER */}
      <footer className="dev-footer">
        <div className="dev-footer-inner">
          <div className="dev-footer-cols">
            <div>
              <Link to="/" className="inline-block mb-4">
                <img src={logoLight} alt="Ride Club Logo" style={{ height: '52px' }} />
              </Link>
              <p className="text-zinc-400 text-sm max-w-sm mb-6 leading-relaxed font-sans">
                Ride Club is the next-generation motorcycle cockpit and telemetry ecosystem designed for riders worldwide.
              </p>
              <div className="flex items-center gap-3 font-mono text-xs text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>ALL APPS & SENSORS OPERATIONAL</span>
              </div>
            </div>

            <div>
              <div className="dev-footer-title">Rider App</div>
              <ul className="dev-footer-links">
                <li><Link to="/features">Cockpit HUD</Link></li>
                <li><Link to="/safety">Crash Sentinel</Link></li>
                <li><Link to="/community">Group Pack Radar</Link></li>
                <li><Link to="/app">Offline Maps PWA</Link></li>
              </ul>
            </div>

            <div>
              <div className="dev-footer-title">Platform</div>
              <ul className="dev-footer-links">
                <li><Link to="/architecture">Architecture & Specs</Link></li>
                <li><Link to="/architecture">IMU Calibration</Link></li>
                <li><Link to="/safety">Impact Protocols</Link></li>
                <li><Link to="/privacy">Privacy & Telemetry</Link></li>
              </ul>
            </div>

            <div>
              <div className="dev-footer-title">Community</div>
              <ul className="dev-footer-links">
                <li><Link to="/community">Motorcycle Chapters</Link></li>
                <li><Link to="/community">Events & Rallies</Link></li>
                <li><Link to="/contact">Report Incident</Link></li>
                <li><Link to="/guidelines">Riding Guidelines</Link></li>
              </ul>
            </div>

            <div>
              <div className="dev-footer-title">Company</div>
              <ul className="dev-footer-links">
                <li><Link to="/about">About Ride Club</Link></li>
                <li><Link to="/contact">Support Center</Link></li>
                <li><Link to="/login">Launch App</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="dev-footer-bottom font-mono text-xs">
            <div>© {new Date().getFullYear()} Ride Club Inc. All rights reserved.</div>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebsitePage;
