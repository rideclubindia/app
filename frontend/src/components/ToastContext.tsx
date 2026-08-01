import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    setToasts(prev => {
      if (prev.some(t => t.message === message && t.type === type)) {
        return prev;
      }
      
      const id = Math.random().toString(36).substr(2, 9);
      
      setTimeout(() => {
        setToasts(current => current.filter(t => t.id !== id));
      }, 3000);

      return [...prev, { id, message, type }];
    });
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-[360px] w-full animate-in fade-in slide-in-from-top-5 duration-300 ${
              toast.type === 'error' ? 'bg-[#FFEBEE] text-[#FF3B30] border border-[#FFD1D6]' :
              toast.type === 'success' ? 'bg-[#E8F5E9] text-[#4CAF50] border border-[#C8E6C9]' :
              'bg-white text-gray-800 border border-gray-100'
            }`}
          >
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 text-blue-500" />}
            <span className="text-[14px] font-bold flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-[#273a5a]/5 rounded-full transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
