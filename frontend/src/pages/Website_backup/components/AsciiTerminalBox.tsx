import React, { useState } from 'react';
import { Copy, Check, Terminal, Cpu, Radio, ShieldAlert } from 'lucide-react';


interface TabItem {
  id: string;
  label: string;
  command: string;
  code: string[];
}

const TABS: TabItem[] = [
  {
    id: 'cockpit',
    label: 'App HUD Telemetry',
    command: 'APP_SESSION // RIDE PLUS ACTIVE',
    code: [
      '⚡ RIDE CLUB SMART COCKPIT v2.4.0',
      '├── Mode: Solo Ride HUD | Turn-by-Turn GPS Active',
      '├── Current Velocity: 78.4 km/h  [Speed Limit: 80 km/h]',
      '├── IMU Lean Gauge: 26.8° Left Turn (Max Lean: 44.2°)',
      '├── Road Condition: Dry Asphalt | Hazard Alert: Clear',
      '└── Next Waypoint: Western Ghats Pass in 4.2 km'
    ]
  },
  {
    id: 'sentinel',
    label: 'Crash Sentinel Protocol',
    command: 'SAFETY_SYSTEM // ARMED & MONITORING',
    code: [
      '🛡️ AUTONOMOUS FALL & CRASH DETECTION',
      '├── 6-Axis Accelerometer: 1.05G [Threshold: > 4.5G]',
      '├── Gyro Anomaly Monitor: Nominal (0° roll flip)',
      '├── Auto-SOS Countdown: 30s abort window on severe impact',
      '├── Emergency Mesh Broadcast: 3 emergency contacts linked',
      '└── Offline Local Cache: GPS breadcrumbs logged to IDB'
    ]
  },
  {
    id: 'radar',
    label: 'Group Pack Radar',
    command: 'PACK_LINK // 6 RIDERS IN SQUAD',
    code: [
      '🏍️ LIVE GROUP PROXIMITY MESH',
      '├── Lead Rider: Harsha S. (+45m ahead)',
      '├── Tail Sweep: Rahul K. (-32m behind)',
      '├── Pack Gap Warning: Tight formation (all riders < 50m)',
      '├── Direct Intercom Voice Relay: Channel #3 connected',
      '└── Destination ETA: 18:42 IST (remaining: 38.5 km)'
    ]
  }
];

export const AsciiTerminalBox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('cockpit');
  const [copied, setCopied] = useState<boolean>(false);

  const current = TABS.find((t) => t.id === activeTab) || TABS[0];

  const handleCopy = () => {
    const textToCopy = current.code.join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dev-terminal-outer font-mono">
      {/* Tab bar header */}
      <div className="dev-terminal-tabs">
        <div className="dev-terminal-tab-list">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`dev-terminal-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.id === 'cli' && <Terminal size={12} className="inline mr-1" />}
              {tab.id === 'sdk' && <Cpu size={12} className="inline mr-1" />}
              {tab.id === 'telemetry' && <Radio size={12} className="inline mr-1" />}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="dev-terminal-badge">
          <span className="live-dot" /> LIVE STREAM
        </div>
      </div>

      {/* Main ASCII Terminal Card matching developers.webflow.com */}
      <div className="dev-terminal-card">
        {/* Corner marks */}
        <span className="corner-mark top-left">+</span>
        <span className="corner-mark top-right">+</span>
        <span className="corner-mark bottom-left">+</span>
        <span className="corner-mark bottom-right">+</span>

        {/* ASCII Header border */}
        <div className="dev-terminal-ascii-divider">
          +------------------------------------------------------------------------------------------------------------------------------------+
        </div>

        <div className="dev-terminal-header">
          <div className="dev-terminal-title flex items-center gap-2">
            <span className="prompt-symbol">$</span>
            <span className="text-gray-300 font-semibold">{current.command}</span>
          </div>

          <button
            onClick={handleCopy}
            className="dev-terminal-copy-btn"
            title="Copy snippet"
          >
            {copied ? (
              <span className="text-emerald-400">[ COPIED ]</span>
            ) : (
              <span>[ COPY ]</span>
            )}
          </button>
        </div>

        <div className="dev-terminal-ascii-divider">
          +------------------------------------------------------------------------------------------------------------------------------------+
        </div>

        {/* Code body with line numbers */}
        <div className="dev-terminal-body">
          {current.code.map((line, idx) => (
            <div key={idx} className="dev-terminal-line">
              <span className="line-pipe">|</span>
              <span className="line-num">{String(idx + 1).padStart(2, '0')}</span>
              <span className="line-pipe">|</span>
              <span className="line-content">{line || ' '}</span>
              <span className="line-pipe right">|</span>
            </div>
          ))}
        </div>

        <div className="dev-terminal-ascii-divider">
          +------------------------------------------------------------------------------------------------------------------------------------+
        </div>

        {/* Terminal Footer info bar */}
        <div className="dev-terminal-footer">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>PROTOCOL: WSS/REST v2</span>
            <span>•</span>
            <span>LATENCY: 12ms</span>
            <span>•</span>
            <span>ENCRYPTION: AES-256-GCM</span>
          </div>
          <div className="text-xs text-orange-400 flex items-center gap-1">
            <ShieldAlert size={12} />
            <span>CRASH DAEMON ARMED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsciiTerminalBox;
