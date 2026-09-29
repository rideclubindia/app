import React from 'react';
import { Cpu, Radio, Shield, Database, Activity, Gauge, Share2, Map } from 'lucide-react';
import { PageShell, StatGrid, CtaBand } from '../rideclub/PageShell';
import { IndexRows, Stepper } from '../rideclub/Sections';
import { Reveal } from '../rideclub/Reveal';

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
      { label: 'Transport Protocol', val: 'Low-Latency WebSockets (WSS)' },
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

const tiers = [
  { icon: Cpu, title: 'On your phone', desc: 'The installable web app reads your phone’s motion sensors, stores offline map tiles, and keeps navigating when the signal drops.', meta: 'React, Vite, MapLibre GL, Web Workers' },
  { icon: Radio, title: 'Live group sync', desc: 'A real-time server keeps each group ride in sync — positions, distance gaps and the shared route.', meta: 'FastAPI, Redis, WebSockets, Supabase' },
  { icon: Shield, title: 'Crash detection & SOS', desc: 'Watches for crash signals, runs the 30-second countdown, and sends the SOS to your contacts.', meta: 'SMS alerts, background location, encryption' }
];

const pipeline = [
  { icon: Activity, step: 'Step 01', title: 'Sense', desc: 'The phone’s motion sensors are read many times a second and smoothed to ignore road vibration.' },
  { icon: Gauge, step: 'Step 02', title: 'Check', desc: 'Readings are checked against impact and lean-angle thresholds to spot a real crash.' },
  { icon: Share2, step: 'Step 03', title: 'Share', desc: 'Your position streams to your group over a live connection, in well under a second.' },
  { icon: Map, step: 'Step 04', title: 'Draw', desc: 'The map draws every rider smoothly on screen, with high-contrast modes for day and night.' }
];

const headline = [
  { value: '30s', label: 'SOS countdown before alerts go out' },
  { value: '50', label: 'riders per live group ride' },
  { value: '4.8G', label: 'impact detection threshold' },
  { value: '65°', label: 'rollover angle that triggers a check' }
];

const Architecture: React.FC = () => (
  <PageShell
    eyebrow="Architecture & specs"
    title={<>Built for <em>real roads.</em></>}
    intro="How RideClub works under the hood — from your phone's sensors to live group sync and crash detection."
    aside={<StatGrid stats={headline} />}
  >
    <IndexRows
      eyebrow="System overview"
      title="Three parts, one ride."
      lead="What runs on your phone, what runs on our servers, and how they keep your group together."
      items={tiers.map((t) => ({ title: t.title, desc: t.desc, meta: <span>{t.meta}</span> }))}
      tint
    />

    <Stepper eyebrow="Data flow" title="From sensor to map." lead="What happens every moment you're riding." steps={pipeline} />

    <section className="rc-band rc-band-tint">
      <div className="rc-wrap">
        <Reveal className="rc-head-row">
          <div>
            <span className="rc-eyebrow">Specifications</span>
            <h2 className="rc-title">The numbers behind the platform.</h2>
          </div>
        </Reveal>
      </div>
      <div className="rc-wrap rc-halves rc-spec-halves">
        {[specsData.slice(0, 2), specsData.slice(2)].map((col, c) => (
          <div key={c} className="rc-spec-col">
            {col.map((spec) => {
              const Icon = spec.icon;
              return (
                <Reveal key={spec.category} className="rc-spec-block">
                  <h3><Icon size={20} /> {spec.category}</h3>
                  <ul className="rc-spec-list">
                    {spec.items.map((item) => (
                      <li key={item.label}><span>{item.label}</span><span>{item.val}</span></li>
                    ))}
                  </ul>
                </Reveal>
              );
            })}
          </div>
        ))}
      </div>
    </section>

    <CtaBand eyebrow="Try it" title="See it working on your next ride." text="Open RideClub on your phone, mount it on the bars, and ride." />
  </PageShell>
);

export default Architecture;
