import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface FlowStep {
  id: string;
  title: string;
  desc: string;
  icon?: LucideIcon;
}

interface FlowProps {
  steps: FlowStep[];
}

export const Flow: React.FC<FlowProps> = ({ steps }) => {
  return (
    <div className="rc-flow">
      {steps.map((step, i) => (
        <div key={step.id} className="rc-flow-step">
          <span className="rc-flow-node">{String(i + 1).padStart(2, '0')}</span>
          <div className="rc-flow-title">{step.title}</div>
          <p className="rc-flow-desc">{step.desc}</p>
        </div>
      ))}
    </div>
  );
};
