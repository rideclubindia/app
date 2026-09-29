import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import './RideClubHome.css';
import './RideClubSections.css';
import './RideClubPages.css';
import './RideClubLayouts.css';
import { Nav } from './Nav';
import { Footer } from './Footer';
import { Reveal } from './Reveal';
import ctaImg from '../../../assets/rideclub/riders_coast_wide.jpg';

interface PageShellProps {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  aside?: React.ReactNode;
  variant?: 'split' | 'flip' | 'banner';
  children?: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({ eyebrow, title, intro, image, imageAlt = '', aside, variant = 'split', children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (variant === 'banner' && image) {
    return (
      <div className="rc-site">
        <Nav />
        <section className="rc-wrap rc-page-banner">
          <div className="rc-page-banner-inner">
            <img src={image} alt={imageAlt} />
            <div className="rc-halves rc-page-banner-grid">
              <Reveal className="rc-page-banner-text">
                <span className="rc-eyebrow">{eyebrow}</span>
                <h1 className="rc-page-title">{title}</h1>
              </Reveal>
              {intro && <Reveal className="rc-page-banner-intro"><p className="rc-lead">{intro}</p></Reveal>}
            </div>
          </div>
        </section>
        {children}
        <Footer />
      </div>
    );
  }

  return (
    <div className="rc-site">
      <Nav />
      <section className={`rc-wrap rc-halves rc-page-hero${variant === 'flip' ? ' is-flip' : ''}`}>
        <Reveal className="rc-page-hero-text">
          <span className="rc-eyebrow">{eyebrow}</span>
          <h1 className="rc-page-title">{title}</h1>
          {intro && <p className="rc-lead rc-page-intro">{intro}</p>}
        </Reveal>
        <div className="rc-page-hero-side">
          {image ? (
            <div className="rc-page-hero-img"><img src={image} alt={imageAlt} /></div>
          ) : aside}
        </div>
      </section>
      {children}
      <Footer />
    </div>
  );
};

interface SplitBandProps {
  eyebrow: string;
  title: string;
  lead?: React.ReactNode;
  tint?: boolean;
  id?: string;
  children: React.ReactNode;
}

export const SplitBand: React.FC<SplitBandProps> = ({ eyebrow, title, lead, tint, id, children }) => (
  <section className={`rc-band${tint ? ' rc-band-tint' : ''}`} id={id}>
    <div className="rc-wrap rc-halves rc-split">
      <Reveal>
        <span className="rc-eyebrow">{eyebrow}</span>
        <h2 className="rc-title">{title}</h2>
        {lead && <p className="rc-lead rc-split-lead">{lead}</p>}
      </Reveal>
      <Reveal>{children}</Reveal>
    </div>
  </section>
);

export interface IconItem {
  icon?: LucideIcon;
  title: string;
  desc?: string;
  meta?: React.ReactNode;
  step?: string;
}

export const IconList: React.FC<{ items: IconItem[] }> = ({ items }) => (
  <div className="rc-news-list">
    {items.map(({ icon: Icon, title, desc, meta, step }) => (
      <div key={title} className="rc-news-card">
        {Icon && <span className="rc-news-logo" aria-hidden="true"><Icon size={18} /></span>}
        <div>
          {step && <span className="rc-news-step">{step}</span>}
          <h3>{title}</h3>
          {desc && <p>{desc}</p>}
          {meta && <div className="rc-item-meta">{meta}</div>}
        </div>
      </div>
    ))}
  </div>
);

export const CardGrid: React.FC<{ items: IconItem[] }> = ({ items }) => (
  <div className="rc-card-grid">
    {items.map(({ icon: Icon, title, desc }) => (
      <div key={title} className="rc-card">
        {Icon && <Icon size={26} strokeWidth={1.7} />}
        <h3>{title}</h3>
        {desc && <p>{desc}</p>}
      </div>
    ))}
  </div>
);

export const StatGrid: React.FC<{ stats: { label: string; value: string }[] }> = ({ stats }) => (
  <div className="rc-stat-grid">
    {stats.map((s) => (
      <div key={s.label}>
        <strong>{s.value}</strong>
        <span>{s.label}</span>
      </div>
    ))}
  </div>
);

interface CtaBandProps {
  eyebrow: string;
  title: string;
  text?: string;
  actions?: React.ReactNode;
}

export const CtaBand: React.FC<CtaBandProps> = ({ eyebrow, title, text, actions }) => (
  <section className="rc-contact">
    <img src={ctaImg} alt="" aria-hidden="true" loading="lazy" />
    <div className="rc-wrap rc-halves rc-contact-grid">
      <Reveal>
        <span className="rc-eyebrow">{eyebrow}</span>
        <h2 className="rc-title">{title}</h2>
      </Reveal>
      <Reveal className="rc-cta-side">
        {text && <p className="rc-cta-text">{text}</p>}
        <div className="rc-contact-actions">
          {actions ?? (
            <>
              <Link to="/login" className="rc-btn rc-btn-primary"><span>Launch the app</span><ArrowRight size={16} /></Link>
              <Link to="/contact" className="rc-btn rc-btn-glass"><span>Contact us</span></Link>
            </>
          )}
        </div>
      </Reveal>
    </div>
  </section>
);
