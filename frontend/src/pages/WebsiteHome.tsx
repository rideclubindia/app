import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Shield,
  Users,
  Map,
  Activity,
  Smartphone,
  Navigation,
  Globe,
  Menu,
  X,
  Radar,
  CloudLightning,
  Wrench,
  Watch
} from 'lucide-react';
import './Website.css';
import logoLight from '../assets/Logos/Logo for White Backgrounds 2.svg';
import { addSubscriber } from '../services/apiClient';
import { InstallPWA } from '../components/InstallPWA';
import { fadeInUp, fadeIn, blurIn, scaleIn, slideInLeft, slideInRight, staggerContainer, magneticHover, viewport } from './Website/animations';
import { GradientMesh, PhoneMockup } from './Website/GradientArt';
import { Counter } from './Website/Counter';
import { Marquee } from './Website/Marquee';
import { FAQAccordion } from './Website/FAQAccordion';

const WebsiteHome: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subSuccess, setSubSuccess] = useState('');
  const [subError, setSubError] = useState('');

  const { scrollY } = useScroll();
  const heroTextY = useTransform(scrollY, [0, 500], [0, -60]);
  const heroTextOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroArtY = useTransform(scrollY, [0, 500], [0, 40]);

  const handleSubscribe = async () => {
    setSubSuccess('');
    setSubError('');
    if (!email || !email.includes('@')) {
      setSubError('Please enter a valid email address.');
      return;
    }

    setIsSubscribing(true);
    try {
      await addSubscriber(email);
      setSubSuccess('Thank you for subscribing! We will keep you updated.');
      setEmail('');
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate')) {
        setSubError('This email is already subscribed.');
      } else {
        setSubError('An error occurred while subscribing. Please try again later.');
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const stats = [
    { id: 'riders', value: 1200000, suffix: '+', label: 'Riders Protected' },
    { id: 'rides', value: 4500000, suffix: '+', label: 'Rides Completed' },
    { id: 'cities', value: 180, suffix: '+', label: 'Cities Covered' },
    { id: 'response', value: 30, suffix: 's', label: 'Avg. SOS Response' },
  ];

  const faqs = [
    { id: 'f1', question: 'How does crash detection actually work?', answer: 'Ride Club reads your phone\'s accelerometer and gyroscope in real time. A sudden impact combined with an abnormal lean angle triggers a 30-second countdown — if you don\'t cancel it, your emergency contacts and, where available, local responders are alerted with your live GPS position.' },
    { id: 'f2', question: 'Do I need to install anything from an app store?', answer: 'No. Ride Club runs as a Progressive Web App — open it once from your browser, add it to your home screen, and it behaves like a native app with offline maps and push alerts, with zero store review delays for updates.' },
    { id: 'f3', question: 'Is my location shared with anyone besides my emergency contacts?', answer: 'Only during an active SOS or a group ride you\'ve joined. Live-tracking tokens expire automatically the moment a ride ends, and everything in transit is encrypted end-to-end.' },
    { id: 'f4', question: 'Can I use it for solo rides, or is it just for groups?', answer: 'Both. Solo riders get full crash detection and route intelligence; group leaders get pack-sync, gap warnings, and shared live maps the moment two or more riders join a session.' },
  ];

  return (
    <div className="website-wrapper export-wrapper" style={{ width: '100%', minHeight: '100vh' }}>

      {/* TOP BAR */}
      <div id="topbar">
        <div className="top-left">
          <span>Join the fastest growing rider community</span>
          <span style={{ color: '#333' }}>|</span>
          <span>Download the App Today</span>
        </div>
        <div className="top-right">
          <span>Global</span>
          <span className="sep">|</span>
          <span>English</span>
        </div>
      </div>

      {/* NAVBAR */}
      <nav id="navbar">
        <Link to="/" className="logo">
          <img src={logoLight} alt="Ride Club Logo" style={{ height: '90px', display: 'block' }} />
        </Link>
        <div className="nav-links">
          <Link to="/" className="active">Home</Link>
          <Link to="/features">Features</Link>
          <Link to="/community">Community</Link>
          <Link to="/safety">Safety</Link>
          <Link to="/app">The App</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="nav-actions">
          <div className="icon-btn hidden md:block">
            <InstallPWA variant="button" className="text-[10px] py-[6px] px-[14px]" />
          </div>
          <button
            className="mobile-menu-btn md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'none', border: 'none', color: '#111', cursor: 'pointer', padding: '4px' }}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            top: '74px',
            background: '#ffffff',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            padding: '40px 20px',
            gap: '24px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Link to="/" className="mobile-nav-link active" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/features" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
            <Link to="/community" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Community</Link>
            <Link to="/safety" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Safety</Link>
            <Link to="/app" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>The App</Link>
            <Link to="/about" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
            <Link to="/contact" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
            <InstallPWA variant="button" />
          </div>
        </div>
      )}

      {/* HERO — gradient mesh + scroll-linked parallax */}
      <section id="hero" className="mesh-hero">
        <GradientMesh palette="orange" />
        <motion.div className="hero-content" style={{ y: heroTextY, opacity: heroTextOpacity, position: 'relative', zIndex: 2 }}>
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="hero-tag">The Ultimate Ride App</motion.div>
            <motion.div variants={blurIn} className="hero-title">One Throttle,<br />Zero Fear</motion.div>
            <motion.div variants={fadeInUp} className="hero-desc">
              Curated routes, a global rider community, and crash detection that watches your back the second you twist the throttle — all in one app built for two wheels.
            </motion.div>
            <motion.div variants={fadeInUp} className="hero-btns">
              <motion.div {...magneticHover} className="btn-orange">
                <Smartphone size={14} />
                Get the App
              </motion.div>
              <Link to="/features">
                <motion.div {...magneticHover} className="btn-outline-white">
                  Explore Features
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.div className="hero-image" style={{ y: heroArtY, position: 'relative', zIndex: 2, background: 'transparent' }}>
          <PhoneMockup icon={Shield} label="SOS Active — Help En Route" palette="ember" />
        </motion.div>
      </section>

      {/* SUB HERO BANNERS */}
      <div id="sub-hero">
        <motion.div className="sub-hero-item" initial="hidden" whileInView="visible" viewport={viewport} variants={fadeIn}>
          <GradientMesh palette="dark" />
          <div className="overlay"></div>
          <div className="sub-content">
            <div className="sub-tag">Technology</div>
            <div className="sub-title">Live Tracking</div>
            <div className="sub-desc">Share your real-time location with friends and family, automatically.</div>
            <Link to="/safety"><div className="btn-orange-sm" style={{ marginTop: '10px' }}>Learn More</div></Link>
          </div>
        </motion.div>
        <motion.div className="sub-hero-item" initial="hidden" whileInView="visible" viewport={viewport} variants={fadeIn} transition={{ delay: 0.1 }}>
          <GradientMesh palette="ember" />
          <div className="overlay" style={{ background: 'rgba(0,0,0,0.5)' }}></div>
          <div className="sub-content">
            <div className="sub-tag">Safety First</div>
            <div className="sub-title">SOS Alerts</div>
            <div className="sub-desc">Instant crash detection and emergency notifications, no input needed.</div>
            <Link to="/safety"><div className="btn-outline-white-sm" style={{ marginTop: '10px' }}>View Details</div></Link>
          </div>
        </motion.div>
        <motion.div className="sub-hero-item" initial="hidden" whileInView="visible" viewport={viewport} variants={fadeIn} transition={{ delay: 0.2 }}>
          <GradientMesh palette="violet" />
          <div className="overlay"></div>
          <div className="sub-content">
            <div className="sub-tag">Community</div>
            <div className="sub-title">Group Rides</div>
            <div className="sub-desc">Organize and sync rides with your local motorcycle club in one tap.</div>
            <Link to="/community"><div className="btn-orange-sm" style={{ marginTop: '10px' }}>Join Now</div></Link>
          </div>
        </motion.div>
      </div>

      {/* FEATURES / WHY CHOOSE US */}
      <section id="features">
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp} className="section-tag">App Features</motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp} className="section-title">Everything You Need For The Road</motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="features-grid">
          <motion.div variants={fadeInUp} {...magneticHover} className="feature-card">
            <div className="icon-circle">
              <Navigation size={22} />
            </div>
            <div className="feat-title">Advanced Routing</div>
            <div className="feat-desc">
              Curated motorcycle-friendly routes. Find the best twists, turns, and scenic highways with our specialized mapping engine.
            </div>
          </motion.div>
          <motion.div variants={fadeInUp} {...magneticHover} className="feature-card">
            <div className="icon-circle">
              <Users size={22} />
            </div>
            <div className="feat-title">Community Driven</div>
            <div className="feat-desc">
              Connect with riders worldwide. Join groups, host events, and share your journey with people who share your passion.
            </div>
          </motion.div>
          <motion.div variants={fadeInUp} {...magneticHover} className="feature-card">
            <div className="icon-circle">
              <Shield size={22} />
            </div>
            <div className="feat-title">Uncompromised Safety</div>
            <div className="feat-desc">
              Ride with peace of mind. Automated incident detection alerts your emergency contacts instantly if a crash is detected.
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* STAT BAND — animated counters */}
      <section className="stat-band">
        <GradientMesh palette="dark" style={{ opacity: 0.6 }} />
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="stat-grid">
          {stats.map(stat => (
            <motion.div key={stat.id} variants={fadeInUp}>
              <Counter value={stat.value} suffix={stat.suffix} className="stat-number" />
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CATEGORIES */}
      <div id="categories">
        <motion.div className="cat-card" initial="hidden" whileInView="visible" viewport={viewport} variants={slideInLeft}>
          <GradientMesh palette="violet" />
          <div className="cat-overlay"></div>
          <div className="cat-content">
            <div className="cat-title">Explore Routes</div>
            <div className="cat-desc">
              Discover thousands of community-verified motorcycle routes around the world.
            </div>
            <Link to="/features"><div className="btn-orange-sm">View Map</div></Link>
          </div>
        </motion.div>
        <motion.div className="cat-card" initial="hidden" whileInView="visible" viewport={viewport} variants={slideInRight}>
          <GradientMesh palette="orange" />
          <div className="cat-overlay"></div>
          <div className="cat-content">
            <div className="cat-title">Meet Riders</div>
            <div className="cat-desc">
              Find riding buddies, join local clubs, and participate in organized events.
            </div>
            <Link to="/community"><div className="btn-orange-sm">Join Community</div></Link>
          </div>
        </motion.div>
      </div>

      {/* PREMIUM APP TOOLS */}
      <section id="services">
        <motion.div className="services-content" initial="hidden" whileInView="visible" viewport={viewport} variants={slideInLeft}>
          <div className="section-tag-white">Pro Capabilities</div>
          <div className="section-title-white">Premium App Tools</div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewport} className="services-grid">
            <motion.div variants={fadeInUp} className="service-item">
              <div className="si-title">Ride Analytics</div>
              <div className="si-desc">
                Track your speed, lean angle, elevation, and distance with precision telemetrics.
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="service-item">
              <div className="si-title">Offline Maps</div>
              <div className="si-desc">
                Download your routes for offline use when riding in remote areas without signal.
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="service-item">
              <div className="si-title">Garage Management</div>
              <div className="si-desc">
                Keep track of your motorcycles, maintenance schedules, and service history.
              </div>
            </motion.div>
            <motion.div variants={fadeInUp} className="service-item">
              <div className="si-title">Live Weather</div>
              <div className="si-desc">
                Get real-time weather alerts along your route to avoid unexpected storms.
              </div>
            </motion.div>
          </motion.div>
          <motion.div {...magneticHover} className="btn-orange">
            Upgrade to Pro
          </motion.div>
        </motion.div>
        <div className="services-image" style={{ position: 'relative' }}>
          <GradientMesh palette="dark" />
          <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneMockup icon={Radar} label="Live Telemetry" palette="dark" accent="var(--orange-light)" />
          </div>
        </div>
      </section>

      {/* WHY RIDERS LOVE US */}
      <section id="bestsellers">
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp} className="section-tag">App Highlights</motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp} className="section-title">Why Riders Love Us</motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} className="products-grid">
          <motion.div variants={fadeInUp} {...magneticHover} className="product-card">
            <div className="prod-img" style={{ position: 'relative' }}>
              <GradientMesh palette="orange" />
              <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Navigation size={48} color="#fff" />
              </div>
            </div>
            <div className="prod-info">
              <div className="prod-name">Turn-by-Turn Navigation</div>
              <div><span className="text-muted text-xs">Voice-guided routing optimized for two wheels.</span></div>
            </div>
          </motion.div>
          <motion.div variants={fadeInUp} {...magneticHover} className="product-card">
            <div className="prod-img" style={{ position: 'relative' }}>
              <GradientMesh palette="violet" />
              <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={48} color="#fff" />
              </div>
            </div>
            <div className="prod-info">
              <div className="prod-name">Rider Social Feed</div>
              <div><span className="text-muted text-xs">Share photos, tag friends, and document trips.</span></div>
            </div>
          </motion.div>
          <motion.div variants={fadeInUp} {...magneticHover} className="product-card">
            <div className="prod-img" style={{ position: 'relative' }}>
              <GradientMesh palette="ember" />
              <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={48} color="#fff" />
              </div>
            </div>
            <div className="prod-info">
              <div className="prod-name">Performance Telemetry</div>
              <div><span className="text-muted text-xs">Review your speed, elevation, and riding stats.</span></div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* SUBSCRIBE */}
      <section id="subscribe">
        <GradientMesh palette="dark" style={{ opacity: 0.5 }} />
        <div className="sub-content">
          <div className="sub-text">
            <div className="sub-tag">Stay Updated</div>
            <div className="sub-title">
              Subscribe For Early Access<br />To <span>New Features</span>
            </div>
          </div>
          <div className="sub-form">
            <input
              type="text"
              className="sub-input"
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubscribing}
            />
            <motion.div
              {...magneticHover}
              className="sub-btn"
              onClick={handleSubscribe}
              style={{ opacity: isSubscribing ? 0.7 : 1, cursor: isSubscribing ? 'not-allowed' : 'pointer' }}
            >
              {isSubscribing ? 'Subscribing...' : 'Subscribe'}
            </motion.div>
          </div>
        </div>
      </section>
      {(subSuccess || subError) && (
        <div style={{ maxWidth: '1200px', margin: '-40px auto 40px auto', padding: '0 60px' }}>
          {subSuccess && <div style={{ padding: '12px 20px', background: '#e5f9ed', color: '#34c759', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>{subSuccess}</div>}
          {subError && <div style={{ padding: '12px 20px', background: '#ffebee', color: '#ff3b30', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>{subError}</div>}
        </div>
      )}

      {/* TESTIMONIAL */}
      <motion.section id="testimonial" initial="hidden" whileInView="visible" viewport={viewport} variants={fadeIn}>
        <div className="test-text">
          "Ride Club completely changed how I experience motorcycle trips. The community features helped me find an amazing group to ride with, and the SOS tracking gives my family peace of mind."
        </div>
        <div className="test-author">— Sarah Jenkins, Pro Rider</div>
      </motion.section>

      {/* MARQUEE — ecosystem strip */}
      <div className="marquee-band">
        <Marquee items={['Web Dashboard', 'iOS App', 'Android App', 'Apple Watch Sync', 'Offline Maps', 'SOS Network']} />
      </div>

      {/* PROMO BANNER */}
      <section id="promo-banner">
        <motion.div className="promo-item" initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp}>
          <Users size={32} />
          <div className="pi-title">100K+ Riders</div>
        </motion.div>
        <motion.div className="promo-item" initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp} transition={{ delay: 0.1 }}>
          <Map size={32} />
          <div className="pi-title">50K+ Routes</div>
        </motion.div>
        <motion.div className="promo-item" initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp} transition={{ delay: 0.2 }}>
          <Shield size={32} />
          <div className="pi-title">24/7 SOS</div>
        </motion.div>
        <motion.div className="promo-item" initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp} transition={{ delay: 0.3 }}>
          <Globe size={32} />
          <div className="pi-title">Global Reach</div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="faq-band">
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp} style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="section-tag-white" style={{ textAlign: 'center' }}>Questions</div>
          <h2 style={{ fontSize: '40px', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: '12px 0 0' }}>Frequently Asked</h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp}>
          <FAQAccordion items={faqs} dark />
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer id="footer">
        <div id="footer-top">
          <div className="footer-col">
            <div className="fc-logo">
              <img src={logoLight} alt="Ride Club Logo" style={{ height: '90px', display: 'block', marginBottom: '20px' }} />
            </div>
            <div className="fc-desc">
              Two Wheels, One Soul. Discover routes. Meet riders. Create unforgettable journeys with the world's most premium motorcycle community.
            </div>
            <div className="social-links">
              <a href="#" className="font-bold text-gray-400 hover:text-orange-500 px-2">IG</a>
              <a href="#" className="font-bold text-gray-400 hover:text-orange-500 px-2">FB</a>
              <a href="#" className="font-bold text-gray-400 hover:text-orange-500 px-2">YT</a>
              <a href="#" className="font-bold text-gray-400 hover:text-orange-500 px-2">IN</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/safety">Safety</Link></li>
              <li><Link to="/community">Community</Link></li>
              <li><Link to="/download">Download App</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/support">Support</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Stay Connected</h4>
            <div className="fc-desc">
              Subscribe to our newsletter for the latest app updates and riding tips.
            </div>
            <div className="sub-row">
              <input
                type="email"
                placeholder="Your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubscribing}
                style={{
                  background: '#161616',
                  border: '1px solid #2a2a2a',
                  color: '#fff',
                  padding: '8px 12px',
                  fontSize: '11px',
                  flex: 1,
                  borderRadius: '2px 0 0 2px',
                  outline: 'none'
                }}
              />
              <div
                onClick={handleSubscribe}
                style={{
                  background: 'var(--orange)',
                  color: '#fff',
                  padding: '8px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '0 2px 2px 0',
                  cursor: isSubscribing ? 'not-allowed' : 'pointer',
                  opacity: isSubscribing ? 0.7 : 1
                }}
              >
                {isSubscribing ? '...' : 'GO'}
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', color: '#444', marginBottom: '8px' }}>
                Need Help?
              </div>
              <Link to="/contact" className="btn-outline-white-sm" style={{ borderColor: '#2a2a2a', color: '#666' }}>
                Support Center
              </Link>
            </div>
          </div>
        </div>
        <div id="footer-bottom">
          <div id="footer-bottom-inner">
            <div>© {new Date().getFullYear()} Ride Club. All Rights Reserved.</div>
            <div className="fb-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebsiteHome;
