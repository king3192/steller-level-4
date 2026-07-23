import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ type = 'info', message, onClose, duration = 5000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-slide-up px-4 sm:px-0">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl ${
          isSuccess
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
            : isError
            ? 'bg-red-950/90 border-red-500/30 text-red-200'
            : 'bg-slate-900/90 border-slate-700 text-slate-200'
        }`}
      >
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
        {isError && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />}

        <div className="flex-1 text-xs font-medium leading-relaxed">{message}</div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/10"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Toast;
