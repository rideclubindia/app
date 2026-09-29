import React from 'react';
import { Play } from 'lucide-react';
import { coreValues } from '../AboutUs/data';

interface AboutSectionProps {
  image: string;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ image }) => {
  const bullets = coreValues.slice(0, 3);

  return (
    <section className="dev-section pt-0">
      {/* Full-width statement row — headline left, description right, not
          the photo+bullets side-by-side box every other section uses. */}
      <div className="wf-about-statement-row">
        <div className="wf-about-statement-head">
          <span className="wf-about-play">
            <Play size={18} fill="currentColor" />
          </span>
          <div className="dev-section-tag">Our Studio</div>
          <h2 className="wf-awards-headline">
            Built by riders, for the road you actually take.
          </h2>
        </div>
        <p className="wf-about-statement-desc">
          Ride Club keeps motorcycle groups connected on the road: live tracking, crash detection, and route planning built for riders.
        </p>
      </div>

      {/* Full-bleed-within-section photo, edge to edge */}
      <div className="wf-about-media">
        <img src={image} alt="Ride Club riders on the road" />
      </div>

      {/* Bullets and stats sit below the photo as one wide row, not
          floating cards on top of it. */}
      <div className="wf-about-foot-row">
        <ul className="wf-about-bullets">
          {bullets.map((value) => (
            <li key={value.id}>
              <value.icon size={18} className="wf-awards-chip-icon" />
              <div>
                <strong>{value.title}</strong>
                <span>{value.description}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="wf-about-stats">
          <div className="wf-about-stat">
            <span className="wf-awards-stat-num">6</span>
            <span className="wf-about-stat-label">core principles we build against</span>
          </div>
          <div className="wf-about-stat">
            <span className="wf-awards-stat-num">24/7</span>
            <span className="wf-about-stat-label">monitoring center coverage</span>
          </div>
        </div>
      </div>
    </section>
  );
};
