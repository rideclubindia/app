import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Menu, X } from 'lucide-react';
import logoLight from '../assets/Logos/Logo for White Backgrounds 2.svg';
import logoDark from '../assets/Logos/Logo for Dark Backgrounds 2.svg';
import './Website.css';
import { InstallPWA } from '../components/InstallPWA';

interface WebsitePageProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

const WebsitePage: React.FC<WebsitePageProps> = ({ title, subtitle, children, fullWidth }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [title]);

  // Prevent scrolling when mobile menu is open
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

  return (
    <div className="website-wrapper export-wrapper" style={{ width: '100%', backgroundColor: '#050505' }}>
      
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
          <Link to="/">Home</Link>
          <Link to="/features" className={title === 'Features' ? 'active' : ''}>Features</Link>
          <Link to="/community" className={title === 'Community' ? 'active' : ''}>Community</Link>
          <Link to="/safety" className={title === 'Safety' ? 'active' : ''}>Safety</Link>
          <Link to="/app" className={title === 'The App' ? 'active' : ''}>The App</Link>
          <Link to="/about" className={title === 'About Us' ? 'active' : ''}>About Us</Link>
          <Link to="/contact" className={title === 'Contact' ? 'active' : ''}>Contact</Link>
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
            top: '74px', /* Below navbar */
            background: '#ffffff',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            padding: '40px 20px',
            gap: '24px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Link to="/" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/features" className={title === 'Features' ? 'mobile-nav-link active' : 'mobile-nav-link'} onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
            <Link to="/community" className={title === 'Community' ? 'mobile-nav-link active' : 'mobile-nav-link'} onClick={() => setIsMobileMenuOpen(false)}>Community</Link>
            <Link to="/safety" className={title === 'Safety' ? 'mobile-nav-link active' : 'mobile-nav-link'} onClick={() => setIsMobileMenuOpen(false)}>Safety</Link>
            <Link to="/app" className={title === 'The App' ? 'mobile-nav-link active' : 'mobile-nav-link'} onClick={() => setIsMobileMenuOpen(false)}>The App</Link>
            <Link to="/about" className={title === 'About Us' ? 'mobile-nav-link active' : 'mobile-nav-link'} onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
            <Link to="/contact" className={title === 'Contact' ? 'mobile-nav-link active' : 'mobile-nav-link'} onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
          </div>
          
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
            <InstallPWA variant="button" />
          </div>
        </div>
      )}

      {/* GENERIC HERO / CONTENT */}
      {!fullWidth && (
        <section 
          id={children ? "policy-hero" : "hero"} 
          style={{ 
            background: 'var(--dark)',
            position: 'relative',
            padding: children ? '40px 20px 40px' : undefined,
            minHeight: children ? '0px' : '600px',
            gridTemplateColumns: children ? '1fr' : undefined,
            display: children ? 'block' : 'grid'
          }}
        >
          <div className="hero-content" style={{ 
            alignItems: 'center', 
            textAlign: 'center', 
            width: '100%', 
            maxWidth: '100%',
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className="hero-tag" style={{ margin: '0 auto 16px auto', fontSize: '12px', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>Ride Club Platform</div>
            <h1 className="hero-title text-center text-white font-black tracking-tight" style={{ marginBottom: children ? '0' : '16px' }}>{title}</h1>
            
            {!children && (
              <>
                <div className="hero-desc" style={{ maxWidth: '600px', margin: '0 auto 32px auto', fontSize: '16px' }}>
                  {subtitle || `We are currently crafting the ${title} page. Check back soon for exciting updates to the world's premium motorcycle community platform.`}
                </div>
                <div className="hero-btns" style={{ justifyContent: 'center' }}>
                  <button onClick={() => navigate('/')} className="btn-outline-white">
                    Return Home
                  </button>
                  <button onClick={() => navigate('/login')} className="btn-orange">
                    Join Now
                  </button>
                </div>
              </>
            )}
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
          <section className="bg-white text-[#333] px-5 md:px-16 py-5 min-h-full">
            <div style={{ maxWidth: '1200px', margin: '0 auto', fontSize: '16px', lineHeight: '1.8' }}>
              {children}
            </div>
          </section>
        )
      )}

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
              <div
                style={{
                  background: '#161616',
                  border: '1px solid #2a2a2a',
                  color: '#444',
                  padding: '8px 12px',
                  fontSize: '11px',
                  flex: 1,
                  borderRadius: '2px 0 0 2px'
                }}
              >
                Your email...
              </div>
              <div
                style={{
                  background: 'var(--orange)',
                  color: '#fff',
                  padding: '8px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '0 2px 2px 0',
                  cursor: 'pointer'
                }}
              >
                GO
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

export default WebsitePage;
