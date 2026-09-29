import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  Radio,
  ShieldAlert,
  Sun,
  Users,
  WifiOff,
  Mountain,
  Waves,
  Moon,
  Building2,
  Compass,
  Flag,
  Route,
  Tent,
  Coffee
} from 'lucide-react';
import './Website/rideclub/RideClubHome.css';
import './Website/rideclub/RideClubSections.css';
import { Nav } from './Website/rideclub/Nav';
import { Hero } from './Website/rideclub/Hero';
import { Footer } from './Website/rideclub/Footer';
import { Reveal } from './Website/rideclub/Reveal';
import { addSubscriber } from '../services/apiClient';
import { safetyTestimonials, incidentTimeline } from './Website/Safety/data';

import meshRadarImg from '../assets/webflow_mesh_radar.jpg';
import cockpitImg from '../assets/webflow_cockpit_hero.jpg';
import dashAlertImg from '../assets/webflow_dash_alert.jpg';
import ridersWideImg from '../assets/rideclub/riders_coast_wide.jpg';
import ridersNightImg from '../assets/rideclub/riders_night.jpg';
import dawnImg from '../assets/WebsiteImages/img3.jpg';
import snowImg from '../assets/WebsiteImages/img8.jpg';
import autumnImg from '../assets/WebsiteImages/img10.jpg';
import sunsetLaneImg from '../assets/WebsiteImages/img11.jpg';
import tunnelImg from '../assets/WebsiteImages/img15.jpg';

const serviceSlides = [
  { img: meshRadarImg, alt: 'Group ride radar showing every rider on one map' },
  { img: cockpitImg, alt: 'Turn-by-turn navigation on a motorcycle dashboard' }
];

const servicesA = ['Live group rides', 'Motorcycle route planner', 'Turn-by-turn navigation', 'Offline maps'];
const servicesB = ['Crash detection', 'Automatic SOS', 'Nearby-rider alerts', 'Install from your browser'];

const approach = [
  { title: 'Create the ride', desc: 'Pick a route, a start time and a meeting point. RideClub saves the map for offline use before you leave.' },
  { title: 'Share the link', desc: 'Send one join link to the riders you want on this one — no group chat juggling.' },
  { title: 'Join and roll out', desc: 'Riders confirm and drop straight into the shared live route.' },
  { title: 'Ride as a pack', desc: 'Everyone stays on one live map, start to finish — and if someone goes down, the pack knows.' }
];

const safetyNet = [
  { icon: ShieldAlert, title: 'Crash detection', meta: '30-second countdown' },
  { icon: Radio, title: 'SOS broadcast', meta: '32 km nearby-rider radius' },
  { icon: Users, title: 'Live pack tracking', meta: '50+ riders per ride' },
  { icon: WifiOff, title: 'Offline maps', meta: 'Works with no signal' },
  { icon: Sun, title: 'Sunlight-readable', meta: 'Full daylight glare' },
  { icon: Clock, title: 'Always on', meta: '24/7 monitoring' }
];

const rides = [
  { route: 'Blue Ridge Twisties', meta: '86 km · 5 riders · Starts Sat', img: tunnelImg },
  { route: 'Alpine Snowline Run', meta: '142 km · 6 riders · Planning', img: snowImg },
  { route: 'Old Town Dawn Ride', meta: '38 km · 9 riders · Starts 05:30', img: dawnImg },
  { route: 'Countryside Sunset Loop', meta: '96 km · 12 riders · Active now', img: sunsetLaneImg, large: true },
  { route: 'Autumn Forest Trail', meta: '64 km · 4 riders · Starts Sun', img: autumnImg }
];

const rideTypes = [
  { icon: Mountain, label: 'Mountain passes' },
  { icon: Waves, label: 'Coastal runs' },
  { icon: Moon, label: 'Night rides' },
  { icon: Building2, label: 'Daily commutes' },
  { icon: Compass, label: 'Solo touring' },
  { icon: Flag, label: 'Group rallies' },
  { icon: Route, label: 'Long-distance' },
  { icon: Tent, label: 'Weekend camps' },
  { icon: Coffee, label: 'Café meetups' }
];

const WebsiteHome: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subSuccess, setSubSuccess] = useState('');
  const [subError, setSubError] = useState('');
  const [svcIdx, setSvcIdx] = useState(0);
  const [openStep, setOpenStep] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const quote = safetyTestimonials[quoteIdx];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      setSubSuccess("You're on the list — we'll send ride updates and new features.");
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

  const stepSvc = (d: number) => setSvcIdx((i) => (i + d + serviceSlides.length) % serviceSlides.length);
  const stepQuote = (d: number) => setQuoteIdx((i) => (i + d + safetyTestimonials.length) % safetyTestimonials.length);

  return (
    <div className="rc-site">
      <Nav />
      <Hero />

      {/* Services — image slider left, headline + two-column list right */}
      <section className="rc-wrap rc-halves rc-svc" id="rc-services">
        <div className="rc-svc-media">
          <div className="rc-svc-arrows">
            <button type="button" className="rc-round-btn" aria-label="Previous image" onClick={() => stepSvc(-1)}><ArrowLeft size={18} /></button>
            <button type="button" className="rc-round-btn" aria-label="Next image" onClick={() => stepSvc(1)}><ArrowRight size={18} /></button>
          </div>
          <div className="rc-svc-img">
            <AnimatePresence initial={false}>
              <motion.img
                key={serviceSlides[svcIdx].img}
                src={serviceSlides[svcIdx].img}
                alt={serviceSlides[svcIdx].alt}
                loading="lazy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            </AnimatePresence>
          </div>
        </div>
        <Reveal className="rc-svc-body">
          <span className="rc-eyebrow">Our services</span>
          <h2 className="rc-title">Group riding, crash safety and navigation — in one app.</h2>
          <div className="rc-svc-lists">
            <ul>{servicesA.map((s) => <li key={s}>{s}</li>)}</ul>
            <ul>{servicesB.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        </Reveal>
      </section>

      {/* Studio — statement + accordion left, bleeding photo with stat tiles right */}
      <section className="rc-wrap rc-halves rc-studio" id="rc-approach">
        <Reveal className="rc-studio-body">
          <span className="rc-icon-badge" aria-hidden="true"><span><Bike size={20} /></span></span>
          <h2 className="rc-title">Built by riders to keep every pack together, even where the signal drops.</h2>
          <div className="rc-accordion">
            {approach.map((a, i) => {
              const open = openStep === i;
              return (
                <div key={a.title} className={`rc-acc-item${open ? ' is-open' : ''}`}>
                  <button type="button" aria-expanded={open} onClick={() => setOpenStep(open ? -1 : i)}>
                    {open ? <Minus size={15} /> : <Plus size={15} />}
                    <span>{a.title}</span>
                  </button>
                  {open && <p>{a.desc}</p>}
                </div>
              );
            })}
          </div>
        </Reveal>
        <div className="rc-studio-media">
          <img src={ridersNightImg} alt="Two motorcyclists riding together on a road at night" loading="lazy" />
          <div className="rc-studio-stats">
            <div className="rc-tile rc-tile-accent">
              <span className="rc-tile-num"><ShieldAlert size={26} /> 30<sup>s</sup></span>
              <span className="rc-tile-label">SOS countdown before help is dispatched</span>
            </div>
            <div className="rc-tile rc-tile-dark">
              <span className="rc-tile-num"><Users size={26} /> 50<sup>+</sup></span>
              <span className="rc-tile-label">riders tracked live in one pack</span>
            </div>
          </div>
        </div>
      </section>

      {/* Safety net — the awards-grid layout, filled with real safety features */}
      <section className="rc-band rc-band-tint" id="rc-safety">
        <div className="rc-wrap rc-halves rc-split">
          <Reveal>
            <span className="rc-eyebrow">Safety net</span>
            <h2 className="rc-title">The safety net behind every ride.</h2>
          </Reveal>
          <Reveal className="rc-split-right">
            <p className="rc-lead">
              If a rider goes down, RideClub detects the impact, gives them <strong>30 seconds to cancel</strong>, then alerts their emergency contacts and <strong>every RideClub rider nearby</strong> — with or without mobile signal.
            </p>
            <div className="rc-feature-grid">
              {safetyNet.map(({ icon: Icon, title, meta }) => (
                <div key={title} className="rc-feature">
                  <Icon size={34} strokeWidth={1.6} />
                  <strong>{title}</strong>
                  <span>{meta}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Featured rides — the selected-works gallery */}
      <section className="rc-wrap rc-works" id="rc-featured">
        <Reveal className="rc-head-row">
          <div>
            <span className="rc-eyebrow">Featured rides</span>
            <h2 className="rc-title">Rides worth joining.</h2>
          </div>
          <Link to="/features" className="rc-link-arrow">Show all rides <ArrowRight size={16} /></Link>
        </Reveal>
        <div className="rc-halves rc-works-grid">
          {rides.filter((r) => r.large).map((r) => (
            <Reveal key={r.route} className="rc-work is-large">
              <Link to="/features">
                <div className="rc-work-img"><img src={r.img} alt={r.route} loading="lazy" /></div>
                <h3>{r.route}</h3>
                <span>{r.meta}</span>
              </Link>
            </Reveal>
          ))}
          <div className="rc-works-small">
            {rides.filter((r) => !r.large).map((r) => (
              <Reveal key={r.route} className="rc-work">
                <Link to="/features">
                  <div className="rc-work-img"><img src={r.img} alt={r.route} loading="lazy" /></div>
                  <h3>{r.route}</h3>
                  <span>{r.meta}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Ride types — the client-logo layout, as typographic marks */}
      <section className="rc-band rc-band-tint" id="rc-community">
        <div className="rc-wrap rc-halves rc-split">
          <Reveal>
            <span className="rc-eyebrow">Built for riders</span>
            <h2 className="rc-title">For solo riders, for groups, for every road between.</h2>
          </Reveal>
          <Reveal className="rc-split-right">
            <p className="rc-lead">
              Whatever kind of riding you do, RideClub keeps the plan, the pack and the safety net in one place — <strong>designed for two wheels</strong>, not adapted from a car app.
            </p>
            <div className="rc-mark-grid">
              {rideTypes.map(({ icon: Icon, label }) => (
                <div key={label} className="rc-mark"><Icon size={24} strokeWidth={2} /><span>{label}</span></div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Rider story — full-bleed photo with overlapping quote card */}
      <section className="rc-quote" id="rc-story">
        <img src={dashAlertImg} alt="" aria-hidden="true" loading="lazy" />
        <div className="rc-wrap">
          <Reveal className="rc-quote-card">
            <span className="rc-avatar" aria-hidden="true">{quote.author.split(' ').map((w) => w[0]).join('')}</span>
            <span className="rc-pill">{quote.role}</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={quote.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <p className="rc-quote-text">&ldquo;{quote.quote}&rdquo;</p>
                <strong className="rc-quote-name">{quote.author}</strong>
                <span className="rc-quote-role">{quote.role}</span>
              </motion.div>
            </AnimatePresence>
            <div className="rc-quote-controls">
              <div className="rc-quote-arrows">
                <button type="button" aria-label="Previous story" onClick={() => stepQuote(-1)}><ArrowLeft size={16} /></button>
                <button type="button" aria-label="Next story" onClick={() => stepQuote(1)}><ArrowRight size={16} /></button>
              </div>
              <span className="rc-quote-count">{quoteIdx + 1}<i />{safetyTestimonials.length}</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Crash SOS steps — the news-archive card layout */}
      <section className="rc-wrap rc-halves rc-news" id="rc-journal">
        <Reveal>
          <span className="rc-eyebrow">Crash detection</span>
          <h2 className="rc-title">How a crash SOS plays out.</h2>
          <p className="rc-lead rc-news-lead">Three steps, no taps needed — RideClub handles it while you can't.</p>
          <Link to="/safety" className="rc-link-arrow">How safety works <ArrowRight size={16} /></Link>
        </Reveal>
        <div className="rc-news-list">
          {incidentTimeline.map((s) => (
            <Reveal key={s.step}>
              <Link to="/safety" className="rc-news-card">
                <span className="rc-news-logo" aria-hidden="true"><s.icon size={18} /></span>
                <div>
                  <span className="rc-news-step">Step {s.step}</span>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Contact CTA — full-bleed photo, headline left, contact + updates right */}
      <section className="rc-contact" id="rc-cta">
        <img src={ridersWideImg} alt="" aria-hidden="true" loading="lazy" />
        <div className="rc-wrap rc-halves rc-contact-grid">
          <Reveal>
            <span className="rc-eyebrow">Join RideClub</span>
            <h2 className="rc-title">Ready to ride? Find the road. Find your people.</h2>
            <div className="rc-contact-actions">
              <Link to="/login" className="rc-btn rc-btn-primary"><span>Get started</span><ArrowRight size={16} /></Link>
              <Link to="/contact" className="rc-btn rc-btn-glass"><span>Contact us</span></Link>
            </div>
          </Reveal>
          <Reveal className="rc-contact-info">
            <div>
              <strong>Rider support</strong>
              <a href="mailto:support@rideclub.in">support@rideclub.in</a>
            </div>
            <div>
              <strong>Ride updates</strong>
              <span>New features and routes, a few times a month.</span>
              <form onSubmit={handleSubscribe} className="rc-contact-form">
                <input
                  type="email"
                  placeholder="you@example.com"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubscribing}
                  required
                />
                <button type="submit" disabled={isSubscribing}>{isSubscribing ? '…' : 'Sign up'}</button>
              </form>
              {subSuccess && <span className="rc-contact-msg is-ok"><CheckCircle2 size={13} /> {subSuccess}</span>}
              {subError && <span className="rc-contact-msg is-err">{subError}</span>}
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WebsiteHome;
