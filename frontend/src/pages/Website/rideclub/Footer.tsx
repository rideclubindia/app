import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUp, Mail } from 'lucide-react';
import logoDark from '../../../assets/Logos/Logo for Dark Backgrounds 2.svg';
import VectorWordmark from '../../../components/originkit/ui/vector-wordmark';

const cols = [
  { title: 'Product', links: [['/features', 'Rides'], ['/features', 'Navigation'], ['/safety', 'Safety'], ['/community', 'Community']] },
  { title: 'Resources', links: [['/app', 'The app'], ['/architecture', 'Architecture'], ['/guidelines', 'Guidelines'], ['/contact', 'Support']] },
  { title: 'Company', links: [['/about', 'About'], ['/careers', 'Careers'], ['/press', 'Press'], ['/contact', 'Contact']] }
];

const socials = [
  ['https://instagram.com', 'Instagram'],
  ['https://linkedin.com', 'LinkedIn'],
  ['https://youtube.com', 'YouTube']
];

export const Footer: React.FC = () => {
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="rc-footer">
      <div className="rc-footer-inner">
        <div className="rc-footer-main">
          <div className="rc-footer-brand">
            <Link to="/" aria-label="RideClub home">
              {/* logo file has wide empty margins; negative margins trim them */}
              <img src={logoDark} alt="RideClub" className="rc-footer-logo" />
            </Link>
            <p className="rc-footer-pitch">Live group rides, crash detection and route planning — built for two wheels.</p>
            <div className="rc-footer-actions">
              <Link to="/login" className="rc-btn rc-btn-primary"><span>Launch the app</span><ArrowRight size={15} /></Link>
              <a href="mailto:rideclubindia@gmail.com" className="rc-footer-mail"><Mail size={15} /> rideclubindia@gmail.com</a>
            </div>
          </div>

          <nav className="rc-footer-nav" aria-label="Footer">
            {cols.map((c) => (
              <div key={c.title} className="rc-footer-col">
                <div className="rc-footer-col-title">{c.title}</div>
                {c.links.map(([to, label]) => <Link key={label} to={to}>{label}</Link>)}
              </div>
            ))}
            <div className="rc-footer-col">
              <div className="rc-footer-col-title">Follow</div>
              {socials.map(([href, label]) => (
                <a key={label} href={href} target="_blank" rel="noreferrer">{label} <ArrowRight size={13} className="rc-footer-ext" /></a>
              ))}
            </div>
          </nav>
        </div>

        <div className="rc-footer-word" aria-hidden="true">
          <VectorWordmark
            text="RIDECLUB"
            font={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 900, fontSize: '330px', letterSpacing: '0em' }}
            background="transparent"
            textColor="#f3efe8"
            shade="#3a342c"
            accent="#ffffff"
            handles={{ size: 90, spread: 22 }}
            style={{ minWidth: 0, minHeight: 0, height: 'auto', aspectRatio: '1208 / 360' }}
          />
        </div>

        <div className="rc-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Ride Club India</span>
          <div className="rc-footer-legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookies">Cookies</Link>
            <button type="button" onClick={toTop} className="rc-footer-top-btn" aria-label="Back to top"><ArrowUp size={15} /></button>
          </div>
        </div>
      </div>
    </footer>
  );
};
