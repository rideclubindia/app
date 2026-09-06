import React from 'react';
import WebsitePage from '../../WebsitePage';
import { Cpu, Radio, Shield, Database, Compass, Layers, Zap, CheckCircle2, Lock, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const specsData = [
  {
    category: 'Hardware & Sensor Processing',
    icon: Cpu,
    items: [
      { label: 'IMU Sensor Pipeline', val: '6-Axis Gyroscope + Accelerometer at 60Hz' },
      { label: 'Filtering Algorithm', val: 'Kalman Dynamic Road-Vibration Suppression' },
      { label: 'Lean Angle Precision', val: '±0.5° Angular Resolution' },
      { label: 'Battery Optimization', val: 'Sub-4% per 100km telemetry overhead' }
    ]
  },
  {
    category: 'Real-Time Telemetry & Mesh Network',
    icon: Radio,
    items: [
      { label: 'Transport Protocol', val: 'Low-Latency WebSockets (WSS v2.4)' },
      { label: 'Peer Sync Frequency', val: 'Sub-30ms coordinate broadcasting' },
      { label: 'Squad Concurrency', val: 'Up to 50 active riders per pack room' },
      { label: 'Offline Fallback', val: 'Buffered dead-reckoning coordinate cache' }
    ]
  },
  {
    category: 'Autonomous Crash Sentinel Protocol',
    icon: Shield,
    items: [
      { label: 'Impact Detection Threshold', val: '4.8G Deceleration Vector' },
      { label: 'Tilt Detection Angle', val: '>65° Lateral Rollover Angle' },
      { label: 'Emergency Timer Window', val: '30-second audible & visual countdown' },
      { label: 'Notification Dispatch', val: 'Twilio Multi-SMS + Coordinates to Emergency Contacts' }
    ]
  },
  {
    category: 'Vector Mapping & Offline Tile Store',
    icon: Database,
    items: [
      { label: 'Rendering Engine', val: 'MapLibre GL GPU-Accelerated Shaders' },
      { label: 'Offline Storage', val: 'IndexedDB vector pack caching' },
      { label: 'Sunlight Contrast', val: 'High-contrast Night & Direct Sunlight HUD modes' },
      { label: 'Turn-by-Turn Engine', val: 'Valhalla / OSRM dual router with waypoint re-routing' }
    ]
  }
];

const Architecture: React.FC = () => {
  return (
    <WebsitePage title="Architecture & Specs" fullWidth={true}>
      {/* WEBFLOW ENTERPRISE SUBPAGE HERO */}
      <section className="dev-subpage-hero">
        <div className="dev-subpage-badge">
          <span>SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATIONS</span>
        </div>
        <h1 className="dev-subpage-title">
          Built for <br />
          <span className="gradient-accent">Extreme Road Environments</span>
        </h1>
        <p className="dev-subpage-subtitle">
          An in-depth breakdown of the Ride Club telemetry engine: sensor Kalman filtering, real-time WebSocket pack mesh, and autonomous safety sentinel protocols.
        </p>
      </section>

      {/* ARCHITECTURE DIAGRAM / OVERVIEW PANEL */}
      <section className="dev-section pt-0">
        <div className="dev-feature-panel mb-12">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs text-white font-bold uppercase tracking-wider">
                DISTRIBUTED SYSTEM TOPOLOGY
              </span>
            </div>
            <span className="font-mono text-xs text-orange-500 font-bold">RELEASE 2.4.0</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800">
              <div className="text-orange-500 font-bold mb-2 flex items-center gap-2">
                <Cpu size={15} /> 01. EDGE CLIENT TIER
              </div>
              <p className="text-zinc-400 font-sans text-xs leading-relaxed mb-3">
                Browser PWA running 60Hz IMU loop, IndexedDB vector map tile storage, and client-side dead-reckoning navigation.
              </p>
              <div className="text-zinc-500 text-[11px]">TECH: React 18, Vite, MapLibre GL, Web Workers</div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800">
              <div className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                <Radio size={15} /> 02. REALTIME MESH TIER
              </div>
              <p className="text-zinc-400 font-sans text-xs leading-relaxed mb-3">
                High-throughput WebSocket cluster maintaining active squad rooms, proximity calculations, and route synchronization.
              </p>
              <div className="text-zinc-500 text-[11px]">TECH: FastAPI, Redis Pub/Sub, WebSockets, Supabase</div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800">
              <div className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                <Shield size={15} /> 03. SENTINEL & SOS DAEMON
              </div>
              <p className="text-zinc-400 font-sans text-xs leading-relaxed mb-3">
                Autonomous state machine evaluating crash signals, managing 30-second abort countdowns, and triggering multi-channel SOS.
              </p>
              <div className="text-zinc-500 text-[11px]">TECH: Twilio SMS API, Background Geolocation, AES-256</div>
            </div>
          </div>

          {/* TELEMETRY & DATA-FLOW PIPELINE DIAGRAM */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80">
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap size={14} className="text-[#FF5A00]" />
              <span>Full-Duplex Telemetry Pipeline (Sensor to Mesh Packet Flow)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800">
                <div className="text-zinc-300 font-bold text-[11px] mb-1">STEP 1: SENSOR SAMPLING</div>
                <div className="text-zinc-400 text-[11px] font-sans">Phone 6-axis IMU records accelerometer & gyro at 60Hz. Raw high-frequency jitter is smoothed.</div>
                <div className="mt-2 text-[#FF5A00] text-[10px]">Kalman Filter: Active</div>
              </div>
              <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800">
                <div className="text-zinc-300 font-bold text-[11px] mb-1">STEP 2: THRESHOLD AUDIT</div>
                <div className="text-zinc-400 text-[11px] font-sans">Vector magnitude continuously audited against 4.8G impact deceleration and &gt;65° lateral rollover.</div>
                <div className="mt-2 text-emerald-400 text-[10px]">Sentinel Daemon: Nominal</div>
              </div>
              <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800">
                <div className="text-zinc-300 font-bold text-[11px] mb-1">STEP 3: MESH BROADCAST</div>
                <div className="text-zinc-400 text-[11px] font-sans">Compressed telemetry coordinates stream via persistent WebSocket connection to squad room channel.</div>
                <div className="mt-2 text-blue-400 text-[10px]">Latency: &lt;30ms target</div>
              </div>
              <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800">
                <div className="text-zinc-300 font-bold text-[11px] mb-1">STEP 4: GPU MAP RENDER</div>
                <div className="text-zinc-400 text-[11px] font-sans">MapLibre GL GPU shaders interpolate rider positions smoothly at 60 FPS with daylight contrast filters.</div>
                <div className="mt-2 text-purple-400 text-[10px]">Offline Vector Cache: IndexedDB</div>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILED SPECIFICATION MATRICES */}
        <div className="dev-section-header">
          <div className="dev-section-tag">Specification Matrix</div>
          <h2 className="dev-section-title">Hardware, Network & Safety Benchmarks</h2>
          <p className="dev-section-desc">
            Granular technical parameters that define our motorcycle telemetry and group coordination platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {specsData.map((spec, idx) => {
            const Icon = spec.icon;
            return (
              <div key={idx} className="dev-feature-panel">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{spec.category}</h3>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {spec.items.map((item, i) => (
                    <div key={i} className="p-3 rounded bg-zinc-950/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-zinc-400">{item.label}</span>
                      <span className="text-white font-semibold font-sans sm:font-mono text-right">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-12 p-8 md:p-12 rounded-xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="dev-section-tag">Explore Live</span>
            <h3 className="text-2xl font-bold text-white mb-2">Ready to test our telemetry stack?</h3>
            <p className="text-sm text-zinc-400">Launch the live progressive web app directly on your motorcycle mount.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="wf-btn-primary">
              <span>Launch App Now</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/features" className="wf-btn-secondary">
              <span>Explore Features</span>
            </Link>
          </div>
        </div>
      </section>
    </WebsitePage>
  );
};

export default Architecture;
