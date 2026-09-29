import React from 'react';
import { Link } from 'react-router-dom';
import { incidentTimeline } from '../Safety/data';

export const ArticlesSection: React.FC = () => {
  return (
    <section className="dev-section pt-0">
      <div className="dev-section-header">
        <div className="dev-section-tag">Safety Protocol</div>
        <h2 className="dev-section-title">How a crash SOS actually plays out</h2>
      </div>

      <div className="wf-articles-grid">
        {incidentTimeline.map((entry) => (
          <Link key={entry.step} to="/safety" className="wf-article-card">
            <div className="wf-article-meta">
              <span className="wf-article-step">{entry.step}</span>
              <span>Safety Protocol</span>
            </div>
            <h3>{entry.title}</h3>
            <p>{entry.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};
