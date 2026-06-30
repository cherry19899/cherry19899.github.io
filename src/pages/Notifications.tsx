import React, { useState, useEffect } from 'react';
import { getNotifications, markAllNotifsRead } from '../lib/api';
import { useAppCtx } from '../App';

interface Notif { id: number; title?: string; body?: string; message?: string; created_at: string; is_read?: boolean; read?: boolean; }

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const { refreshUnread } = useAppCtx();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((d: any) => setNotifs(d?.notifications || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    refreshUnread();
  }, []);

  const markRead = (id: number) => {
    markAllNotifsRead().catch(() => {});
    setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
  };

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in pb-24 bg-white dark:bg-slate-900 min-h-screen">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notifications</h2>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
        </div>
      ) : notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-3">🔔</span>
          <p className="font-semibold text-gray-900 dark:text-white">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => {
            const read = n.is_read || n.read;
            return (
              <button
                key={n.id}
                onClick={() => !read && markRead(n.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                  read ? 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {n.title && <p className="font-semibold text-gray-900 dark:text-white text-sm">{n.title}</p>}
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">{n.body || n.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400 dark:text-slate-500">{timeAgo(n.created_at)}</span>
                    {!read && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
