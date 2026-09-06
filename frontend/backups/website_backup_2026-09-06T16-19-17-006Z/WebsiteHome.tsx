import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Navigation,
  Activity,
  Terminal,
  Cpu,
  Layers,
  MapPin,
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  Radio,
  FileCode,
  Lock,
  Compass,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Database,
  Sun,
  Moon
} from 'lucide-react';
import './Website/WebsiteWebflow.css';
import logoLight from '../assets/Logos/Logo for White Backgrounds 2.svg';
import { addSubscriber } from '../services/apiClient';
import { InstallPWA } from '../components/InstallPWA';
import { AsciiTerminalBox } from './Website/components/AsciiTerminalBox';
import { InteractiveCanvasGrid } from './Website/components/InteractiveCanvasGrid';
import { InteractiveTelemetryRadar } from './Website/components/InteractiveTelemetryRadar';
import cockpitHeroImg from '../assets/webflow_cockpit_hero.jpg';
import meshRadarImg from '../assets/webflow_mesh_radar.jpg';
import crashSentinelImg from '../assets/webflow_crash_sentinel.jpg';


const WebsiteHome: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subSuccess, setSubSuccess] = useState('');
  const [subError, setSubError] = useState('');
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('rideclub_theme_mode') === 'light';
  });
  const [activeSubsystemTab, setActiveSubsystemTab] = useState<'telemetry' | 'safety' | 'mesh'>('telemetry');

  const toggleThemeMode = () => {
    setIsLightMode((prev) => {
      const next = !prev;
      localStorage.setItem('rideclub_theme_mode', next ? 'light' : 'dark');
      return next;
    });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubSuccess('');
    setSubError('');
    if (!email || !email.includes('@')) {
      setSubError('Please enter a valid email address.');
      return;
    }

    setIsSubscribing(true);
    try {
      await addSubscriber(email);
      setSubSuccess('Subscribed to developer releases & telemetry changelog.');
      setEmail('');
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate')) {
        setSubError('This email is already registered.');
      } else {
        setSubError('An error occurred. Please try again later.');
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // App capabilities matching Webflow developer grid design
  const devTools = [
    {
      title: 'Real-Time Rider Cockpit HUD',
      badge: 'Live Telemetry',
      desc: 'High-contrast speed, dynamic lean angle gauge, turn-by-turn vectors, and road hazard radar directly on your handlebars.',
      icon: Navigation,
      link: '/features'
    },
    {
      title: 'Crash Sentinel & Auto SOS',
      badge: 'Safety Daemon',
      desc: '6-axis phone accelerometer & gyro monitoring detects falls and severe impacts, initiating a 30s emergency contact broadcast.',
      icon: Shield,
      link: '/safety'
    },
    {
      title: 'Live Pack Radar & Group Rides',
      badge: 'Multi-Rider Mesh',
      desc: 'See everyone in your motorcycle convoy on a shared tactical radar with pack gap warnings and formation tracking.',
      icon: Users,
      link: '/community'
    },
    {
      title: 'Motorcycle Route Planner',
      badge: 'Scenic Vector GPS',
      desc: 'Find curated twisties, mountain passes, and scenic motorcycling routes designed specifically for two-wheel machines.',
      icon: MapPin,
      link: '/features'
    },
    {
      title: 'Offline Map Cache',
      badge: 'Zero-Signal Mode',
      desc: 'Download high-definition offline vector tiles to navigate remote valley roads and mountain highways without cell reception.',
      icon: Database,
      link: '/features'
    },
    {
      title: 'Installable PWA Experience',
      badge: 'Instant Launch',
      desc: 'Full native app experience without App Store clutter. Install directly to your home screen with offline persistence.',
      icon: Terminal,
      link: '/app'
    }
  ];

  // Feature Deep Dives
  const docCards = [
    {
      title: 'Cockpit HUD & Telemetry',
      desc: 'Explore the digital dashboard, lean metrics, and night HUD modes.',
      icon: Navigation,
      link: '/features'
    },
    {
      title: 'Group Ride Synchronization',
      desc: 'Organize pack rides, invite friends via codes, and track members live.',
      icon: Users,
      link: '/community'
    },
    {
      title: 'Impact & Crash Protocols',
      desc: 'How the autonomous 30-second countdown and SMS alerts keep you safe.',
      icon: Shield,
      link: '/safety'
    },
    {
      title: 'Offline GPS Navigation',
      desc: 'Store offline regional map packs before heading into wilderness trails.',
      icon: Database,
      link: '/features'
    },
    {
      title: 'Rider Profile & Stats',
      desc: 'Track your cumulative distances, saved locations, and safety badges.',
      icon: Lock,
      link: '/about'
    },
    {
      title: 'Phone Mounting & Calibration',
      desc: 'Optimal handlebar mounting positions for accurate lean angle measurement.',
      icon: Cpu,
      link: '/safety'
    }
  ];

  return (
    <div className={`website-wrapper dev-theme ${isLightMode ? 'light-mode' : ''}`}>
      {/* Background Interactive Canvas Blueprint Lines */}
      {!isLightMode && <InteractiveCanvasGrid />}

      {/* TOP ANNOUNCEMENT BANNER matching Webflow Enterprise */}
      <div className="webflow-announcement-banner">
        <span className="webflow-announcement-tag">NEW RELEASE</span>
        <span className="text-zinc-300">
          Ride Club OS 2.4 is live: Autonomous Crash Sentinel & Low-Latency Cockpit HUD.
        </span>
        <Link to="/features" className="webflow-announcement-link">
          <span>Explore Platform Release</span>
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

      {/* WEBFLOW ENTERPRISE HERO */}
      <section className="wf-enterprise-hero">
        <div className="wf-enterprise-eyebrow">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Ride Club Enterprise Telemetry Platform</span>
        </div>

        <h1 className="wf-enterprise-headline">
          Enterprise scale, <br />
          unmatched rider impact.
        </h1>

        <p className="wf-enterprise-subhead">
          Turn every motorcycle journey into a connected, telemetry-driven experience. Built for motorcycle clubs, rallies, and individual riders with autonomous crash safety sentinel and real-time pack radar mesh.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-12">
          <Link to="/login" className="wf-btn-primary">
            <span>Launch Rider App</span>
            <ArrowRight size={16} />
          </Link>
          <a href="#interactive-showcase" className="wf-btn-secondary">
            <span>Explore Architecture</span>
            <ChevronRight size={16} />
          </a>
        </div>

        {/* Hero Showcase Display (High-Fidelity Cockpit Graphic Stage) */}
        <div className="wf-stage-card relative group">
          <img
            src={cockpitHeroImg}
            alt="Ride Club Enterprise Cockpit Telemetry HUD"
            className="w-full h-auto object-cover max-h-[560px]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-blue-400 uppercase tracking-wider font-bold mb-1">
                SMART COCKPIT INTERFACE
              </div>
              <div className="text-lg sm:text-xl font-bold text-white">
                Ultra-responsive 60Hz Gyroscope & Turn-by-Turn Night HUD
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE HUD ACTIVE
              </span>
              <Link to="/app" className="wf-btn-primary py-2 px-3 text-xs">
                <span>View Full Screen</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WEBFLOW LOGO TICKER MARQUEE (Top Motorcycle Brands & Syndicates) */}
      <section className="wf-brands-marquee">
        <div className="max-w-7xl mx-auto px-6 mb-4 text-center">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono font-semibold">
            Trusted across 1,800+ riding syndicates & compatible across all two-wheel machines:
          </span>
        </div>
        <div className="flex overflow-hidden select-none py-2 gap-8 items-center text-zinc-400">
          <div className="flex shrink-0 gap-12 items-center animate-[marquee_30s_linear_infinite]">
            <span className="wf-brand-pill">🏍️ DUCATI CORSE</span>
            <span className="wf-brand-pill">🏁 BMW MOTORRAD</span>
            <span className="wf-brand-pill">⚡ KTM READY TO RACE</span>
            <span className="wf-brand-pill">🦅 HARLEY-DAVIDSON</span>
            <span className="wf-brand-pill">🛡️ TRIUMPH MOTORCYCLES</span>
            <span className="wf-brand-pill">👑 ROYAL ENFIELD RIDERS</span>
            <span className="wf-brand-pill">⚡ YAMAHA RACING MESH</span>
            <span className="wf-brand-pill">⚔️ KAWASAKI NINJA PACK</span>
          </div>
          <div className="flex shrink-0 gap-12 items-center animate-[marquee_30s_linear_infinite]" aria-hidden="true">
            <span className="wf-brand-pill">🏍️ DUCATI CORSE</span>
            <span className="wf-brand-pill">🏁 BMW MOTORRAD</span>
            <span className="wf-brand-pill">⚡ KTM READY TO RACE</span>
            <span className="wf-brand-pill">🦅 HARLEY-DAVIDSON</span>
            <span className="wf-brand-pill">🛡️ TRIUMPH MOTORCYCLES</span>
            <span className="wf-brand-pill">👑 ROYAL ENFIELD RIDERS</span>
            <span className="wf-brand-pill">⚡ YAMAHA RACING MESH</span>
            <span className="wf-brand-pill">⚔️ KAWASAKI NINJA PACK</span>
          </div>
        </div>
      </section>

      {/* DEVELOPER TOOLS & CAPABILITIES GRID */}
      <section id="tools" className="dev-section">
        <div className="dev-section-header">
          <div className="dev-section-tag">Core Infrastructure</div>
          <h2 className="dev-section-title">Built for Performance on the Road</h2>
          <p className="dev-section-desc">
            Modular services and telemetrics designed for low-latency rider awareness, group synchronization, and safety fallbacks.
          </p>
        </div>

        <div className="dev-tools-grid">
          {devTools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <Link key={idx} to={tool.link} className="dev-tool-card">
                <div>
                  <div className="dev-tool-header">
                    <div className="dev-tool-icon-wrap">
                      <Icon size={20} />
                    </div>
                    <ArrowUpRight size={18} className="dev-tool-arrow" />
                  </div>
                  <div className="dev-tool-name">{tool.title}</div>
                  <div className="dev-tool-desc">{tool.desc}</div>
                </div>
                <div className="dev-tool-meta">
                  <span>SUBSYSTEM</span>
                  <span className="text-zinc-400 font-semibold">{tool.badge}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* INTERACTIVE RADAR & TELEMETRY SECTION */}
      <section className="dev-section pt-0">
        <div className="dev-section-header">
          <div className="dev-section-tag">Realtime Simulation</div>
          <h2 className="dev-section-title">6-Axis Motorcycle Telemetrics</h2>
          <p className="dev-section-desc">
            Test and observe the live telemetry pipeline in action with lean angles, G-force monitoring, and pack proximity tracking.
          </p>
        </div>

        <InteractiveTelemetryRadar />
      </section>

      {/* WEBFLOW ENTERPRISE STYLE: AUTOPLAY TABS / SUBSYSTEM SHOWCASE */}
      <section className="dev-section pt-0">
        <div className="dev-section-header">
          <div className="enterprise-badge">
            <span>ENTERPRISE SPECIFICATION & ARCHITECTURE</span>
          </div>
          <h2 className="dev-section-title">Enterprise Scale, Unmatched Rider Impact</h2>
          <p className="dev-section-desc">
            Engineered for high-concurrency motorcycle rallies and mission-critical telemetry. Powered by low-latency WebSockets, 6-axis gyro sampling, and distributed emergency beacon mesh.
          </p>
        </div>

        {/* Enterprise Key Metric Cards */}
        <div className="enterprise-metrics-grid">
          <div className="enterprise-metric-card">
            <div className="enterprise-metric-val text-orange-500">1.8K+</div>
            <div className="enterprise-metric-label">Active Motorcycle Clubs</div>
          </div>
          <div className="enterprise-metric-card">
            <div className="enterprise-metric-val text-emerald-400">&lt;15ms</div>
            <div className="enterprise-metric-label">Beacon Sync Latency</div>
          </div>
          <div className="enterprise-metric-card">
            <div className="enterprise-metric-val text-blue-400">99.99%</div>
            <div className="enterprise-metric-label">Uptime SLA Guaranteed</div>
          </div>
          <div className="enterprise-metric-card">
            <div className="enterprise-metric-val text-cyan-400">100%</div>
            <div className="enterprise-metric-label">Offline Tile Availability</div>
          </div>
        </div>

        {/* Interactive Subsystem Architecture Tabs */}
        <div className="enterprise-showcase-wrapper">
          <div className="enterprise-tabs-nav">
            <button
              onClick={() => setActiveSubsystemTab('telemetry')}
              className={`enterprise-tab-btn ${activeSubsystemTab === 'telemetry' ? 'active' : ''}`}
            >
              <Cpu size={15} /> 01. Gyroscope & Lean Telemetry
            </button>
            <button
              onClick={() => setActiveSubsystemTab('safety')}
              className={`enterprise-tab-btn ${activeSubsystemTab === 'safety' ? 'active' : ''}`}
            >
              <Shield size={15} /> 02. Crash Sentinel & SOS Pipeline
            </button>
            <button
              onClick={() => setActiveSubsystemTab('mesh')}
              className={`enterprise-tab-btn ${activeSubsystemTab === 'mesh' ? 'active' : ''}`}
            >
              <Users size={15} /> 03. Real-Time Pack Radar Mesh
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              {activeSubsystemTab === 'telemetry' && (
                <>
                  <div className="font-mono text-xs text-orange-500 font-bold uppercase tracking-wider">
                    High-Frequency Sensor Processing
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Sub-degree lean angle precision without proprietary hardware.
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                    Utilizes your device's built-in 6-axis IMU (gyroscope + accelerometer) with Kalman filtering algorithms. Smooths road vibrations while accurately capturing real-time apex angles, lateral G-forces, and throttle transitions.
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> 60Hz Filtered Pipeline</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Sunlight-Optimized HUD</span>
                  </div>
                </>
              )}

              {activeSubsystemTab === 'safety' && (
                <>
                  <div className="font-mono text-xs text-orange-500 font-bold uppercase tracking-wider">
                    Autonomous Incident Sentinel
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    30-second automated response sequence when seconds decide outcomes.
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                    Multi-tier collision detection triggers when severe impact G-forces and sudden rollover orientations occur simultaneously. If the rider doesn't cancel within 30 seconds, SMS and coordinates are dispatched to emergency contacts.
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> False-Positive Suppression</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Direct GPS SMS Dispatch</span>
                  </div>
                </>
              )}

              {activeSubsystemTab === 'mesh' && (
                <>
                  <div className="font-mono text-xs text-orange-500 font-bold uppercase tracking-wider">
                    WebSocket Distributed Pack Mesh
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Keep up to 50 squad riders synchronized on a single live map.
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                    Low-bandwidth WebSocket connections stream real-time coordinate updates across group members. Never lose your tail-gunner on confusing highway interchanges or blind mountain hairpins.
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Dynamic Pack Regrouping</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Low Battery Consumption</span>
                  </div>
                </>
              )}

              <div className="pt-4">
                <Link to="/features" className="dev-btn-primary">
                  <span>Explore Technical Documentation</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="wf-stage-card overflow-hidden rounded-xl border border-zinc-800 shadow-2xl">
                {activeSubsystemTab === 'telemetry' && (
                  <img
                    src={cockpitHeroImg}
                    alt="Ride Club IMU Telemetry Engine"
                    className="w-full h-auto object-cover max-h-[380px]"
                  />
                )}
                {activeSubsystemTab === 'safety' && (
                  <img
                    src={crashSentinelImg}
                    alt="Ride Club Crash Sentinel Detection"
                    className="w-full h-auto object-cover max-h-[380px]"
                  />
                )}
                {activeSubsystemTab === 'mesh' && (
                  <img
                    src={meshRadarImg}
                    alt="Ride Club Group Mesh Radar"
                    className="w-full h-auto object-cover max-h-[380px]"
                  />
                )}
                <div className="p-4 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between font-mono text-xs text-zinc-400">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {activeSubsystemTab === 'telemetry' && 'IMU 60Hz KALMAN FILTER ACTIVE'}
                    {activeSubsystemTab === 'safety' && 'CRASH SENTINEL DAEMON ARMED'}
                    {activeSubsystemTab === 'mesh' && 'WSS REALTIME PACK RADAR MESH'}
                  </span>
                  <span className="text-orange-500 font-bold">LATENCY: 12ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WEBFLOW STYLE: CUSTOMER / RIDER STORY SLIDER */}
      <section className="dev-section pt-0">
        <div className="dev-section-header">
          <div className="dev-section-tag">Rider Proof</div>
          <h2 className="dev-section-title">Trusted by Motorcycling Chapters Worldwide</h2>
          <p className="dev-section-desc">
            From weekend morning canyon groups to cross-country endurance riders, see how squads rely on Ride Club.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="enterprise-story-card">
            <p className="enterprise-story-quote">
              "Ride Club's group radar saved our Sunday pack runs. In twisty hill passes where cell towers drop out, knowing our squad's last fixed locations keeps everyone unified."
            </p>
            <div className="pt-4 border-t border-zinc-800/80">
              <div className="font-bold text-white font-sans text-sm">Vikram Malhotra</div>
              <div className="text-xs font-mono text-orange-500">Road Captain — Deccan Desperados MC</div>
            </div>
          </div>

          <div className="enterprise-story-card">
            <p className="enterprise-story-quote">
              "The turn-by-turn navigation HUD with dark high-contrast mode doesn't distract your peripheral vision at night. It's built specifically for motorcycle handlebars."
            </p>
            <div className="pt-4 border-t border-zinc-800/80">
              <div className="font-bold text-white font-sans text-sm">Arjun Singhania</div>
              <div className="text-xs font-mono text-orange-500">Endurance Rider — Iron Butt Verified</div>
            </div>
          </div>

          <div className="enterprise-story-card">
            <p className="enterprise-story-quote">
              "When a member had a slide-off in misty weather, the Crash Sentinel triggered immediately and broadcasted his exact GPS coordinates to our squad leaders."
            </p>
            <div className="pt-4 border-t border-zinc-800/80">
              <div className="font-bold text-white font-sans text-sm">Rohit Verma</div>
              <div className="text-xs font-mono text-orange-500">Safety Marshal — Western Ghats Riders</div>
            </div>
          </div>
        </div>
      </section>

      {/* APP FEATURE GUIDES & DEEP DIVES */}
      <section className="dev-section pt-0">
        <div className="dev-section-header">
          <div className="dev-section-tag">Rider Guides</div>
          <h2 className="dev-section-title">App Feature Guides & Specs</h2>
          <p className="dev-section-desc">
            Explore how Ride Club's cockpit tools, crash algorithms, and group mesh work together on your motorcycle.
          </p>
        </div>

        <div className="dev-doc-cards">
          {docCards.map((doc, i) => {
            const Icon = doc.icon;
            return (
              <Link key={i} to={doc.link} className="dev-doc-card">
                <div className="dev-doc-icon">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="dev-doc-title">{doc.title}</div>
                  <div className="dev-doc-desc">{doc.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SUBSCRIBE TO RIDER & APP UPDATES */}
      <section className="dev-section pt-0">
        <div className="p-8 md:p-12 rounded-xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800">
          <div className="max-w-2xl">
            <span className="dev-section-tag">Rider Newsletter</span>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Stay Updated with New App Releases
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              Get notified about new riding route packs, smart cockpit HUD modes, safety enhancements, and community chapter events.
            </p>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="rider@rideclub.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubscribing}
                className="px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-orange-500 flex-1"
                required
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="dev-btn-primary whitespace-nowrap"
              >
                <span>{isSubscribing ? 'Subscribing...' : 'Subscribe to Releases'}</span>
                <ChevronRight size={14} />
              </button>
            </form>

            {subSuccess && (
              <div className="mt-3 text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 size={13} /> {subSuccess}
              </div>
            )}
            {subError && (
              <div className="mt-3 text-xs text-red-400 font-mono">
                {subError}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* WEBFLOW-STYLE FOOTER */}
      <footer className="dev-footer">
        <div className="dev-footer-inner">
          <div className="dev-footer-cols">
            <div>
              <Link to="/" className="inline-block mb-4">
                <img src={logoLight} alt="Ride Club Logo" style={{ height: '52px' }} />
              </Link>
              <p className="text-zinc-400 text-sm max-w-sm mb-6 leading-relaxed">
                Ride Club is the next-generation motorcycle telemetry and routing ecosystem designed for passionate riders worldwide.
              </p>
              <div className="flex items-center gap-3 font-mono text-xs text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>ALL APIS OPERATIONAL</span>
              </div>
            </div>

            <div>
              <div className="dev-footer-title">Platform</div>
              <ul className="dev-footer-links">
                <li><Link to="/features">Routing Engine</Link></li>
                <li><Link to="/safety">Crash Detection</Link></li>
                <li><Link to="/community">Group Sync</Link></li>
                <li><Link to="/app">The PWA App</Link></li>
                <li><Link to="/architecture">Architecture & Specs</Link></li>
              </ul>
            </div>

            <div>
              <div className="dev-footer-title">Resources</div>
              <ul className="dev-footer-links">
                <li><Link to="/app">Quickstart Docs</Link></li>
                <li><Link to="/features">Route Planning</Link></li>
                <li><Link to="/safety">Safety Protocol</Link></li>
                <li><Link to="/architecture">Architecture</Link></li>
                <li><Link to="/contact">Support Desk</Link></li>
              </ul>
            </div>

            <div>
              <div className="dev-footer-title">Company</div>
              <ul className="dev-footer-links">
                <li><Link to="/about">About Ride Club</Link></li>
                <li><Link to="/community">Rider Community</Link></li>
                <li><Link to="/contact">Contact Team</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <div className="dev-footer-title">Connect</div>
              <ul className="dev-footer-links font-mono text-xs">
                <li><a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-1">GitHub <ExternalLink size={11} /></a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="flex items-center gap-1">X / Twitter <ExternalLink size={11} /></a></li>
                <li><a href="https://discord.com" target="_blank" rel="noreferrer" className="flex items-center gap-1">Discord <ExternalLink size={11} /></a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-1">Instagram <ExternalLink size={11} /></a></li>
              </ul>
            </div>
          </div>

          <div className="dev-footer-bottom">
            <div>
              &copy; {new Date().getFullYear()} Ride Club India. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
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

export default WebsiteHome;
