import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { getNotifications, markNotificationsRead } from '../lib/api';
import { timeAgo } from '../lib/utils';

interface NotificationsScreenProps {
  t: TFunction;
  onBack: () => void;
  onNavigate?: (tab: string, extra?: any) => void;
}

const NOTIF_ICON: Record<string, string> = {
  new_application: '📝',
  application_accepted: '✅',
  application_rejected: '❌',
  escrow_funded: '🔒',
  escrow_released: '💸',
  escrow_disputed: '⚠️',
  new_message: '💬',
  job_completed: '🎉',
  review_received: '⭐',
  payment_approved: '✅',
  default: '🔔',
};

export default function NotificationsScreen({ t, onBack, onNavigate }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(d => setNotifications(d.notifications || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async () => {
    try {
      await markNotificationsRead();
      setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleTap = (n: any) => {
    if (!n.is_read) {
      setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    const data = n.data || {};
    if (n.type === 'new_message' && data.room_id && onNavigate) {
      onNavigate('chat', { roomId: data.room_id });
    } else if ((n.type === 'new_application' || n.type === 'application_accepted') && data.job_id && onNavigate) {
      onNavigate('jobDetail', { jobId: data.job_id });
    } else if ((n.type === 'escrow_funded' || n.type === 'escrow_released') && onNavigate) {
      onNavigate('escrow');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in overflow-y-auto">
      <div className="sticky top-0 glass border-b border-border px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-bold text-base flex-1">
          {t('notifications')}
          {unreadCount > 0 && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold">
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
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
            <button
              key={n.id}
              onClick={() => handleTap(n)}
              className={`w-full text-left p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                n.is_read
                  ? 'bg-card border-border'
                  : 'bg-emerald-500/5 border-emerald-500/20'
              }`}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">
                {NOTIF_ICON[n.type] || NOTIF_ICON.default}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{n.message || n.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
