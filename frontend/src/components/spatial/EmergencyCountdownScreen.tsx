import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

// Crash Detection Architecture.md §5 / SOS Escalation Architecture.md §21 —
// extremely clear, high-contrast, large touch target, minimal cognitive load.
// Terminology is deliberately "possible crash" / "are you safe", never
// "crash detected" (§10's engineering principle: safety-assistance, not a
// certified accident detector).

interface EmergencyCountdownScreenProps {
  triggerType: 'manual_sos' | 'automatic_crash_sos' | null;
  expiresAt: number | null; // epoch ms
  isOffline: boolean;
  onConfirmSafe: () => void;
}

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function EmergencyCountdownScreen({
  triggerType,
  expiresAt,
  isOffline,
  onConfirmSafe,
}: EmergencyCountdownScreenProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remainingMs = expiresAt != null ? expiresAt - now : 0;
  const isCrash = triggerType === 'automatic_crash_sos';

  return (
    <div className="fixed inset-0 z-[9999] bg-red-600 flex flex-col items-center justify-center px-6 text-center text-white">
      <AlertTriangle className="w-16 h-16 mb-4" strokeWidth={2.2} />
      <h1 className="text-2xl font-black uppercase tracking-wide mb-2">
        {isCrash ? 'Possible Crash Detected' : 'SOS Active'}
      </h1>
      <p className="text-lg font-semibold mb-8">Are you safe?</p>

      <div className="text-6xl font-black tabular-nums mb-10" aria-live="polite">
        {formatRemaining(remainingMs)}
      </div>

      <button
        onClick={onConfirmSafe}
        className="w-full max-w-xs h-16 rounded-2xl bg-white text-red-600 text-xl font-black uppercase tracking-wide active:scale-95 transition-transform cursor-pointer"
      >
        I'm OK
      </button>

      <p className="mt-8 max-w-xs text-sm text-white/90 font-medium">
        {isOffline
          ? 'No connection — this will be sent to your emergency contacts and ride group as soon as your phone reconnects.'
          : 'Emergency contacts and your ride group will be alerted if there is no response.'}
      </p>
    </div>
  );
}
