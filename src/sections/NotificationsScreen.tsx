import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { getNotifications, markNotificationsRead } from '../lib/api';
import { timeAgo } from '../lib/utils';

interface NotificationsScreenProps {
  t: TFunction;
  onBack: () => void;
}

export default function NotificationsScreen({ t, onBack }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(d => setNotifications(d.notifications || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async () => {
    try { await markNotificationsRead(); setNotifications(ns => ns.map(n => ({ ...n, read: true }))); }
    catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in overflow-y-auto">
      <div className="sticky top-0 glass border-b border-border px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-bold text-base flex-1">{t('notifications')}</h1>
        {notifications.some(n => !n.read) && (
          <button onClick={markRead} className="text-xs text-emerald-500 font-semibold">
            {t('markAllRead')}
          </button>
        )}
      </div>

      <div className="p-4 space-y-2 pb-8">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🔔</p>
            <p>{t('noNotifications')}</p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border ${n.read ? 'bg-card border-border' : 'bg-emerald-500/5 border-emerald-500/20'}`}
            >
              <p className="text-sm">{n.message || n.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
