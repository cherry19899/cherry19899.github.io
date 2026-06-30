import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationsRead } from '../lib/api';
import type { Notification } from '../types';
import { useAppAuth } from '../App';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const NOTIF_ICONS: Record<string, string> = {
  job_application: '📨',
  application_accepted: '✅',
  payment_received: '💰',
  escrow_funded: '🔒',
  escrow_released: '🎉',
  new_message: '💬',
  job_completed: '🏁',
  review_received: '⭐',
};

export default function NotificationsPage() {
  const nav = useNavigate();
  const { refreshUnread } = useAppAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((d: any) => setNotifs(d?.notifications || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Mark all read on mount
    markNotificationsRead().catch(() => {});
    refreshUnread();
  }, []);

  const handleClick = (notif: Notification) => {
    if (notif.room_id) nav(`/chat/${notif.room_id}`);
    else if (notif.job_id) nav(`/job/${notif.job_id}`);
  };

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in">
      <h2 className="text-lg font-bold text-white mb-4">Notifications</h2>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : notifs.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications" subtitle="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer active:scale-[0.99] transition-all ${
                n.is_read
                  ? 'bg-slate-800/50 border-slate-700/50'
                  : 'bg-slate-800 border-emerald-500/20'
              }`}
            >
              <span className="text-2xl shrink-0">{NOTIF_ICONS[n.type] || '📢'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${n.is_read ? 'text-slate-300' : 'text-white'}`}>{n.title}</p>
                  <span className="text-xs text-slate-500 shrink-0">{timeAgo(n.created_at)}</span>
                </div>
                {n.body && <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>}
              </div>
              {!n.is_read && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
