import { useCallback, useRef, useState } from 'react';
import { Loader2, ShieldAlert, X } from 'lucide-react';
import { loadMyEmergencyContact, normalizeMobile, saveMyEmergencyContact } from '../lib/emergencyContact';

// Blocks starting or joining a live ride until the rider has an emergency contact with a valid mobile number
export function useRideStartGate() {
  const [open, setOpen] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const ensureReady = useCallback(async (): Promise<boolean> => {
    const { primary } = await loadMyEmergencyContact().catch(() => ({ primary: null }));
    if (primary) return true;
    setOpen(true);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const finish = (ok: boolean) => { setOpen(false); resolver.current?.(ok); resolver.current = null; };
  const gate = open ? <EmergencyContactSheet onDone={() => finish(true)} onCancel={() => finish(false)} /> : null;
  return { ensureReady, gate };
}

export function EmergencyContactSheet({ onDone, onCancel, initial }: { onDone: () => void; onCancel: () => void; initial?: { name: string; phone: string } }) {
  const [name, setName] = useState(initial?.name || '');
  const [phone, setPhone] = useState(initial?.phone?.replace(/^\+91/, '') || '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (name.trim().length < 2) return setError('Enter the contact\'s name.');
    const normalized = normalizeMobile(phone);
    if (!normalized) return setError('Enter a valid 10-digit mobile number (or include the country code with +).');
    setSaving(true);
    setError(null);
    try {
      await saveMyEmergencyContact({ name: name.trim(), phone: normalized });
      onDone();
    } catch (e: any) {
      setError(e?.message || 'Could not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="ec-title">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><ShieldAlert className="w-6 h-6" /></span>
          <div className="flex-1 min-w-0">
            <h2 id="ec-title" className="text-[18px] font-bold text-gray-950">Emergency contact required</h2>
            <p className="text-[14px] text-gray-600 mt-1">Before you ride, add someone RideClub can alert by SMS if there's an accident or you press SOS.</p>
          </div>
          <button onClick={onCancel} aria-label="Cancel" className="w-10 h-10 -mr-2 -mt-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <label className="block mt-5">
          <span className="text-[13px] font-semibold text-gray-700">Contact name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya (sister)" autoComplete="name" className="mt-1 w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-[16px] text-gray-950 outline-none focus:border-[#FF6B22] focus:bg-white" />
        </label>
        <label className="block mt-3">
          <span className="text-[13px] font-semibold text-gray-700">Mobile number</span>
          <div className="mt-1 flex items-center h-12 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-[#FF6B22] focus-within:bg-white overflow-hidden">
            <span className="pl-4 pr-2 text-[16px] text-gray-500">+91</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="98765 43210" className="flex-1 min-w-0 h-full bg-transparent pr-4 text-[16px] text-gray-950 outline-none" />
          </div>
        </label>
        {error && <p className="mt-2 text-[13px] text-red-600" role="alert">{error}</p>}

        <button onClick={save} disabled={saving} className="mt-5 w-full h-13 min-h-[52px] rounded-2xl bg-[#FF6B22] text-white text-[16px] font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="w-5 h-5 animate-spin" />} Save & continue
        </button>
        <p className="mt-3 text-[12px] text-gray-400 text-center">You can change this anytime in Profile → Edit profile.</p>
      </div>
    </div>
  );
}
