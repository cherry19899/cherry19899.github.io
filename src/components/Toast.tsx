import React, { useState, useCallback, useEffect } from 'react';

interface Toast { id: number; msg: string; type: 'success' | 'error' | 'info'; }

let _toast: ((msg: string, type?: Toast['type']) => void) | null = null;

export function useToastFn() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((msg: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  _toast = toast;
  return { toasts, toast };
}

export function toast(msg: string, type: Toast['type'] = 'info') {
  _toast?.(msg, type);
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm mx-auto">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-lg text-white animate-fade-in pointer-events-auto ${
            t.type === 'success' ? 'bg-emerald-500' :
            t.type === 'error'   ? 'bg-red-500' :
                                   'bg-gray-800'
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
