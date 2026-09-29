import React from 'react';
import { safetyPillars } from '../Safety/data';

export const AwardsSection: React.FC = () => {
  return (
    <section className="dev-section wf-awards-section">
      <div className="wf-awards-head">
        <div className="dev-section-tag">What Ride Club Guarantees</div>
        <h2 className="wf-awards-headline">
          The safety protocol every ride runs on.
        </h2>
        <p className="wf-awards-desc">
          No fabricated awards wall — here is exactly what the platform does to keep a rider found when something goes wrong.
        </p>
      </div>

      <div className="wf-awards-stat-row">
        {safetyPillars.map((pillar, i) => (
          <div key={pillar.id} className="wf-awards-stat">
            <span className="wf-awards-stat-num">{String(i + 1).padStart(2, '0')}</span>
            <pillar.icon size={18} className="wf-awards-chip-icon" />
            <div className="wf-awards-stat-title">{pillar.title}</div>
            <p className="wf-awards-stat-desc">{pillar.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
