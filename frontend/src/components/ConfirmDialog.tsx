import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DialogVariant = 'danger' | 'warning' | 'info';

interface DialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

interface ConfirmContextType {
  confirm: (opts: DialogOptions) => Promise<boolean>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ctx.confirm;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<(DialogOptions & { visible: boolean }) | null>(null);
  const resolveRef = useRef<((val: boolean) => void) | null>(null);

  const confirm = useCallback((opts: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ ...opts, visible: true });
    });
  }, []);

  const handleChoice = (choice: boolean) => {
    setDialog(null);
    resolveRef.current?.(choice);
    resolveRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog?.visible && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleChoice(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[380px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top accent bar */}
            <div className={`h-1 w-full ${
              dialog.variant === 'danger' ? 'bg-[#FF3B30]' :
              dialog.variant === 'warning' ? 'bg-[#ef4523]' :
              'bg-[#273a5a]'
            }`} />

            <div className="p-6">
              {/* Icon + Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  dialog.variant === 'danger' ? 'bg-[#FFEBEE] text-[#FF3B30]' :
                  dialog.variant === 'warning' ? 'bg-[#FFF3E0] text-[#ef4523]' :
                  'bg-[#E8EDF5] text-[#273a5a]'
                }`}>
                  {dialog.variant === 'danger' ? <Trash2 className="w-5 h-5" /> :
                   dialog.variant === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                   <Info className="w-5 h-5" />}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-[16px] font-bold text-[#273a5a] leading-tight">{dialog.title}</h3>
                </div>
                <button
                  onClick={() => handleChoice(false)}
                  className="w-7 h-7 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[#8A8A8E] hover:bg-[#E5E5EA] transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Message */}
              <p className="text-[13px] text-[#8A8A8E] leading-relaxed mb-6 pl-14">{dialog.message}</p>

              {/* Buttons */}
              <div className="flex gap-2 pl-14">
                <button
                  onClick={() => handleChoice(false)}
                  className="flex-1 h-9 rounded-lg border border-[#E5E5EA] text-[13px] font-bold text-[#273a5a] hover:bg-[#F2F4F7] transition-colors"
                >
                  {dialog.cancelLabel || 'Cancel'}
                </button>
                <button
                  onClick={() => handleChoice(true)}
                  className={`flex-1 h-9 rounded-lg text-white text-[13px] font-bold transition-colors ${
                    dialog.variant === 'danger' ? 'bg-[#FF3B30] hover:bg-[#FF3B30]/90' :
                    dialog.variant === 'warning' ? 'bg-[#ef4523] hover:bg-[#ef4523]/90' :
                    'bg-[#273a5a] hover:bg-[#273a5a]/90'
                  }`}
                >
                  {dialog.confirmLabel || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
