import React, { useState, useEffect, useCallback } from 'react';
import { getNotifications, markAllNotifsRead } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAppCtx } from '../App';
import { t } from '../lib/i18n';

// Notifications are stored with a `notif_key` + `params`; rendering them here
// rather than server-side means the text follows whatever language the reader
// has selected right now. Rows written before this (or with an unknown key)
// fall back to the title/body the backend stored.
function renderNotif(n: { notif_key?: string | null; params?: Record<string, any> | null; title?: string; body?: string; message?: string }) {
  const tr: any = t();
  const tpl = n.notif_key ? tr[n.notif_key] : undefined;
  if (typeof tpl !== 'string' || !tpl) {
    return { title: n.title || '', body: n.body || n.message || '' };
  }
  const fill = (str: string) =>
    str.replace(/\{(\w+)\}/g, (_m, k) => {
      const v = n.params?.[k];
      return v === undefined || v === null ? '' : String(v);
    });
  const [title, body = ''] = tpl.split('||');
  return { title: fill(title).trim(), body: fill(body).trim() };
}

interface Notif {
  id: number; title?: string; body?: string; message?: string;
  notif_key?: string | null; params?: Record<string, any> | null;
  type?: string; created_at: string; is_read?: boolean; read?: boolean;
  job_id?: number | null; room_id?: number | string | null;
}

// ─── IndexedDB offline queue ──────────────────────────────────────────────────

const DB_NAME = 'workpro_notifs';
const STORE = 'pending';

function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function queueOfflineNotif(notif: { title: string; body: string }) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({ ...notif, queued_at: new Date().toISOString() });
  } catch { /* ignore */ }
}

async function flushOfflineQueue(onFlush: (items: any[]) => void) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = req.result || [];
      if (items.length > 0) {
        items.forEach(item => store.delete(item.id));
        onFlush(items);
      }
    };
  } catch { /* ignore */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NOTIF_ICONS: Record<string, string> = {
  application: '📝',
  message: '💬',
  hired: '🎉',
  payment: '💰',
  dispute: '⚠️',
  review: '⭐',
  rating: '⭐',
  offer: '📨',
  submitted: '📦',
  completed: '✅',
  system: '📣',
};

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function groupByDate(notifs: Notif[]): { label: string; items: Notif[] }[] {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  const groups: Record<string, Notif[]> = {};
  for (const n of notifs) {
    const d = new Date(n.created_at).toDateString();
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { refreshUnread } = useAppCtx();
  const nav = useNavigate();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const tr = t();

  const load = useCallback(() => {
    setLoading(true);
    getNotifications()
      .then((d: any) => {
        const list: Notif[] = d?.notifications || d || [];
        setNotifs(list);
        refreshUnread();
        // flush offline queue if any
        flushOfflineQueue(queued => {
          setNotifs(prev => [
            ...queued.map((q, i) => ({
              id: -(i + 1), title: q.title, body: q.body,
              created_at: q.queued_at, is_read: false,
            })),
            ...prev,
          ]);
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshUnread]);

  useEffect(() => { load(); }, [load]);

  const markRead = (id: number) => {
    markAllNotifsRead().catch(() => {});
    setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
  };

  const markAll = () => {
    markAllNotifsRead().catch(() => {});
    setNotifs(p => p.map(n => ({ ...n, is_read: true, read: true })));
  };

  const visible = notifs.filter(n => filter === 'all' || !n.is_read && !n.read);
  const unreadCount = notifs.filter(n => !n.is_read && !n.read).length;
  const groups = groupByDate(visible);

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in pb-24 bg-white dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{tr.notifications}</h2>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            className="text-xs text-emerald-500 font-semibold"
          >
            {tr.markAllRead}
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
            }`}
          >
            {f === 'all' ? tr.all : `${tr.noNotifications.split(' ')[1] || 'Unread'}${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-3">🔔</span>
          <p className="font-semibold text-gray-900 dark:text-white">{tr.noNotifications}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">{label}</p>
              <div className="space-y-2">
                {items.map(n => {
                  const read = n.is_read || n.read;
                  const icon = NOTIF_ICONS[n.type || ''] || '🔔';
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!read) markRead(n.id);
                        if (n.room_id) nav(`/chat/${n.room_id}`);
                        else if (n.job_id) nav(`/job/${n.job_id}`);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-colors flex items-start gap-3 ${
                        read
                          ? 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'
                      }`}
                    >
                      <span className="text-xl shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        {(() => { const r = renderNotif(n); return (<>
                        {r.title && <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{r.title}</p>}
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5 line-clamp-2">{r.body}</p>
                        </>); })()}
                        <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!read && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Expose offline queue helper for SW / push handler use
window.__queueOfflineNotif = queueOfflineNotif;
