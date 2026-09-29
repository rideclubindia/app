import React from 'react';

const nodes = [
  { x: 50, y: 15 },
  { x: 20, y: 40 },
  { x: 80, y: 40 },
  { x: 35, y: 68 },
  { x: 65, y: 68 },
  { x: 50, y: 90, accent: true }
];

const edges: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [1, 2], [3, 4]
];

export const NetworkDiagram: React.FC = () => {
  return (
    <div className="rc-network-diagram">
      <svg className="rc-network-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="var(--rc-line-3)"
            strokeWidth={0.4}
          />
        ))}
      </svg>
      {nodes.map((n, i) => (
        <span
          key={i}
          className={`rc-network-node ${n.accent ? 'is-accent' : ''}`}
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        />
      ))}
    </div>
  );
};
