import React, { useState, useCallback } from 'react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}

const COLORS = {
  success: 'bg-emerald-500',
  error:   'bg-red-500',
  info:    'bg-slate-700',
};

export default function Toast({
  id, message, type, onDismiss,
}: ToastItem & { onDismiss: (id: string) => void }) {
  return (
    <div
      className={`pointer-events-auto px-4 py-3 rounded-xl text-white text-sm font-medium shadow-xl animate-fade-in ${COLORS[type]}`}
      onClick={() => onDismiss(id)}
    >
      {message}
    </div>
  );
}
