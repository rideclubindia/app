import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Minus, Plus, type LucideIcon } from 'lucide-react';
import { Reveal } from './Reveal';

interface Head {
  eyebrow: string;
  title: string;
  lead?: React.ReactNode;
  tint?: boolean;
}

const SectionHead: React.FC<Head & { action?: React.ReactNode }> = ({ eyebrow, title, lead, action }) => (
  <Reveal className="rc-sec-head">
    <div>
      <span className="rc-eyebrow">{eyebrow}</span>
      <h2 className="rc-title">{title}</h2>
    </div>
    <div className="rc-sec-head-side">
      {lead && <p className="rc-lead">{lead}</p>}
      {action}
    </div>
  </Reveal>
);

const band = (tint?: boolean) => `rc-band${tint ? ' rc-band-tint' : ''}`;

/* Index rows: big number + title left, description right, full-width rules */
export interface RowItem { title: string; desc?: React.ReactNode; meta?: React.ReactNode; icon?: LucideIcon; }
export const IndexRows: React.FC<Head & { items: RowItem[]; action?: React.ReactNode }> = ({ items, action, ...head }) => (
  <section className={band(head.tint)}>
    <div className="rc-wrap">
      <SectionHead {...head} action={action} />
      <ol className="rc-index">
        {items.map((it, i) => (
          <Reveal key={it.title} className="rc-index-row">
            <div className="rc-index-l">
              <span className="rc-index-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{it.title}</h3>
            </div>
            <div className="rc-index-r">
              {it.desc && <p>{it.desc}</p>}
              {it.meta && <div className="rc-item-meta">{it.meta}</div>}
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  </section>
);

/* Tabs: selectable list left, large detail panel right */
export const TabsSection: React.FC<Head & { items: { icon: LucideIcon; title: string; desc: string }[] }> = ({ items, ...head }) => {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const cur = items[active];
  const Icon = cur.icon;
  return (
    <section className={band(head.tint)}>
      <div className="rc-wrap">
        <SectionHead {...head} />
        <div className="rc-halves rc-tabs">
          <div className="rc-tab-list" role="tablist">
            {items.map((it, i) => (
              <button
                key={it.title}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={i === active ? 'is-active' : ''}
                onClick={() => setActive(i)}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
                {it.title}
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
          <div className="rc-tab-panel-wrap">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                role="tabpanel"
                className="rc-tab-panel"
                initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                transition={{ duration: 0.3 }}
              >
                <span className="rc-tab-icon"><Icon size={30} /></span>
                <span className="rc-tab-count">{String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
                <h3>{cur.title}</h3>
                <p>{cur.desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

/* Zigzag: photo and text alternate sides row by row */
export const Zigzag: React.FC<Head & { items: { title: string; desc: string; img: string; icon?: LucideIcon }[] }> = ({ items, ...head }) => (
  <section className={band(head.tint)}>
    <div className="rc-wrap">
      <SectionHead {...head} />
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <div key={it.title} className={`rc-halves rc-zig${i % 2 ? ' is-flip' : ''}`}>
            <Reveal className="rc-zig-img"><img src={it.img} alt="" loading="lazy" /></Reveal>
            <Reveal className="rc-zig-text">
              {Icon && <Icon size={28} />}
              <h3>{it.title}</h3>
              <p>{it.desc}</p>
            </Reveal>
          </div>
        );
      })}
    </div>
  </section>
);

/* Accordion beside a tall photo */
export const AccordionMedia: React.FC<Head & { items: { title: string; desc: string; icon?: LucideIcon }[]; img: string; imgAlt?: string }> = ({ items, img, imgAlt = '', ...head }) => {
  const [open, setOpen] = useState(0);
  return (
    <section className={band(head.tint)}>
      <div className="rc-wrap rc-halves rc-accm">
        <Reveal>
          <span className="rc-eyebrow">{head.eyebrow}</span>
          <h2 className="rc-title">{head.title}</h2>
          {head.lead && <p className="rc-lead rc-split-lead">{head.lead}</p>}
          <div className="rc-accordion rc-accm-list">
            {items.map((it, i) => {
              const isOpen = open === i;
              const Icon = it.icon;
              return (
                <div key={it.title} className={`rc-acc-item${isOpen ? ' is-open' : ''}`}>
                  <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                    {Icon && <Icon size={18} />}
                    <span>{it.title}</span>
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                  </button>
                  {isOpen && <p>{it.desc}</p>}
                </div>
              );
            })}
          </div>
        </Reveal>
        <div className="rc-accm-img"><img src={img} alt={imgAlt} loading="lazy" /></div>
      </div>
    </section>
  );
};

/* Vertical timeline with connecting line and big numerals */
export const Timeline: React.FC<Head & { steps: { title: string; desc: string }[] }> = ({ steps, ...head }) => (
  <section className={band(head.tint)}>
    <div className="rc-wrap rc-halves">
      <Reveal className="rc-sticky">
        <span className="rc-eyebrow">{head.eyebrow}</span>
        <h2 className="rc-title">{head.title}</h2>
        {head.lead && <p className="rc-lead rc-split-lead">{head.lead}</p>}
      </Reveal>
      <ol className="rc-timeline">
        {steps.map((s, i) => (
          <Reveal key={s.title} className="rc-tl-step">
            <span className="rc-tl-num">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  </section>
);

/* Horizontal stepper: 4 steps, two per half, joined by a line */
export const Stepper: React.FC<Head & { steps: { title: string; desc: string; icon?: LucideIcon }[] }> = ({ steps, ...head }) => (
  <section className={band(head.tint)}>
    <div className="rc-wrap">
      <SectionHead {...head} />
      <div className="rc-halves rc-stepper">
        {[steps.slice(0, 2), steps.slice(2, 4)].map((pair, h) => (
          <div key={h} className="rc-stepper-half">
            {pair.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} className="rc-step">
                  <span className="rc-step-dot">{Icon ? <Icon size={16} /> : h * 2 + i + 1}</span>
                  <span className="rc-step-n">Step {String(h * 2 + i + 1).padStart(2, '0')}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </Reveal>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* Typographic stat band: big numbers, dividers, no cards */
export const StatBand: React.FC<{ stats: { value: string; label: string }[]; eyebrow?: string; tint?: boolean }> = ({ stats, eyebrow, tint }) => (
  <section className={band(tint)}>
    <div className="rc-wrap">
      {eyebrow && <span className="rc-eyebrow rc-statband-eyebrow">{eyebrow}</span>}
      <div className="rc-halves rc-statband">
        {[stats.slice(0, 2), stats.slice(2, 4)].map((pair, h) => (
          <div key={h} className="rc-statband-half">
            {pair.map((s) => (
              <Reveal key={s.label} className="rc-statband-item">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </Reveal>
            ))}
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* Full-bleed photo with a quote card and arrows */
export const QuoteBand: React.FC<{ items: { quote: string; author: string; role?: string }[]; img: string; tag?: string }> = ({ items, img, tag }) => {
  const [i, setI] = useState(0);
  const q = items[i];
  const step = (d: number) => setI((n) => (n + d + items.length) % items.length);
  return (
    <section className="rc-quote">
      <img src={img} alt="" aria-hidden="true" loading="lazy" />
      <div className="rc-wrap rc-quote-wrap">
        <Reveal className="rc-quote-card">
          <span className="rc-avatar" aria-hidden="true">{q.author.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
          {tag && <span className="rc-pill">{tag}</span>}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <p className="rc-quote-text">&ldquo;{q.quote}&rdquo;</p>
              <strong className="rc-quote-name">{q.author}</strong>
              {q.role && <span className="rc-quote-role">{q.role}</span>}
            </motion.div>
          </AnimatePresence>
          {items.length > 1 && (
            <div className="rc-quote-controls">
              <div className="rc-quote-arrows">
                <button type="button" aria-label="Previous" onClick={() => step(-1)}><ArrowLeft size={16} /></button>
                <button type="button" aria-label="Next" onClick={() => step(1)}><ArrowRight size={16} /></button>
              </div>
              <span className="rc-quote-count">{i + 1}<i />{items.length}</span>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
};

/* Monogram tiles: big initials, two per half */
export const Monograms: React.FC<Head & { people: { name: string; role: string }[] }> = ({ people, ...head }) => (
  <section className={band(head.tint)}>
    <div className="rc-wrap">
      <SectionHead {...head} />
      <div className="rc-halves rc-mono">
        {[people.slice(0, 2), people.slice(2, 4)].map((pair, h) => (
          <div key={h} className="rc-mono-half">
            {pair.map((p) => (
              <Reveal key={p.name} className="rc-mono-tile">
                <span className="rc-mono-initials" aria-hidden="true">{p.name.split(' ').map((n) => n[0]).join('')}</span>
                <h3>{p.name}</h3>
                <span>{p.role}</span>
              </Reveal>
            ))}
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* Date rows: big date, event details, action */
export const DateRows: React.FC<Head & { events: { date: string; title: string; location: string; attendees: string }[] }> = ({ events, ...head }) => (
  <section className={band(head.tint)}>
    <div className="rc-wrap">
      <SectionHead {...head} />
      <div className="rc-dates">
        {events.map((e) => {
          const [mon, day] = e.date.split(' ');
          return (
            <Reveal key={e.title} className="rc-halves rc-date-row">
              <div className="rc-date-l">
                <span className="rc-date-big"><strong>{day}</strong><span>{mon}</span></span>
                <h3>{e.title}</h3>
              </div>
              <div className="rc-date-r">
                <span>{e.location}</span>
                <span>{e.attendees} registered</span>
                <Link to="/login" className="rc-btn rc-btn-outline">Save a spot</Link>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  </section>
);

/* Bento: two tall cards left, 2x2 right */
export const Bento: React.FC<Head & { items: { icon: LucideIcon; title: string; desc: string }[] }> = ({ items, ...head }) => (
  <section className={band(head.tint)}>
    <div className="rc-wrap">
      <SectionHead {...head} />
      <div className="rc-halves rc-bento">
        <div className="rc-bento-l">
          {items.slice(0, 2).map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} className={`rc-bento-card is-big${i === 0 ? ' is-accent' : ''}`}>
              <Icon size={34} strokeWidth={1.6} />
              <h3>{title}</h3>
              <p>{desc}</p>
            </Reveal>
          ))}
        </div>
        <div className="rc-bento-r">
          {items.slice(2, 6).map(({ icon: Icon, title, desc }) => (
            <Reveal key={title} className="rc-bento-card">
              <Icon size={24} strokeWidth={1.7} />
              <h3>{title}</h3>
              <p>{desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);
