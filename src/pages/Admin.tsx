import React, { useState, useEffect, useCallback } from 'react';
import { getAdminStats, getAdminUsers, apiFetch } from '../lib/api';
import { useAppCtx } from '../App';
import { toast } from '../components/Toast';

type Tab = 'stats' | 'users' | 'jobs' | 'escrows' | 'earnings';

interface Stats {
  total_users?: number; total_jobs?: number; total_escrows?: number;
  active_escrows?: number; total_revenue?: number; chats?: number;
  platformFeePercent?: number; developerFeePercent?: number;
}

export default function AdminPage() {
  const { user } = useAppCtx();
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(() => {
    setLoading(true);
    getAdminStats().then(d => setStats(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadUsers = useCallback(() => {
    setLoading(true);
    getAdminUsers().then((d: any) => setUsers(d?.users || d || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'stats' || tab === 'earnings') loadStats();
    else if (tab === 'users') loadUsers();
  }, [tab]);

  const handleBan = async (uid: string, isBanned: boolean) => {
    try {
      await apiFetch(`/api/admin/users/${uid}/${isBanned ? 'unblock' : 'block'}`, { method: 'POST' });
      setUsers(p => p.map(u => (u.id === uid || u.uid === uid) ? { ...u, is_blocked: !isBanned } : u));
      toast(isBanned ? 'Unblocked' : 'Blocked', 'success');
    } catch (e: any) { toast(e.message || 'Failed', 'error'); }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center pt-20 gap-3">
        <span className="text-5xl">🔒</span>
        <p className="text-gray-900 font-bold text-lg">Admin Only</p>
        <p className="text-gray-500 text-sm">No permission</p>
      </div>
    );
  }

  const rev = (stats?.total_revenue || 0).toFixed(2);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'stats',    label: 'Stats' },
    { key: 'users',    label: 'Users' },
    { key: 'jobs',     label: 'All Jobs' },
    { key: 'escrows',  label: 'All Escrows' },
    { key: 'earnings', label: 'Earnings' },
  ];

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats / Earnings */}
      {(tab === 'stats' || tab === 'earnings') && (
        loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 skeleton rounded-2xl" />
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatCard bg="bg-emerald-50" color="text-emerald-500" value={`${rev} π`} label="Total Earnings" />
              <StatCard bg="bg-blue-50" color="text-blue-500" value={String(stats.total_escrows ?? 0)} label="Transactions" />
              <StatCard bg="bg-orange-50" color="text-orange-500" value={`${rev} π`} label="Collected" />
              <StatCard bg="bg-purple-50" color="text-purple-500" value="0 π" label="Pending" />
              <StatCard bg="bg-gray-50" color="text-gray-700" value={String(stats.total_users ?? 0)} label="Users" />
              <StatCard bg="bg-gray-50" color="text-gray-700" value={String(stats.total_jobs ?? 0)} label="Jobs" />
            </div>

            {(stats.platformFeePercent !== undefined || stats.developerFeePercent !== undefined) && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-2 text-sm">
                {stats.platformFeePercent !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform fee</span>
                    <span className="text-gray-900 font-semibold">{stats.platformFeePercent}%</span>
                  </div>
                )}
                {stats.developerFeePercent !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Developer fee</span>
                    <span className="text-gray-900 font-semibold">{stats.developerFeePercent}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-10">No data yet</p>
        )
      )}

      {/* Users */}
      {tab === 'users' && (
        loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {users.length === 0 && <p className="text-center text-gray-400 py-10">No users</p>}
            {users.map((u: any) => (
              <div key={u.id || u.uid} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-sm">
                  {(u.username || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-sm truncate">@{u.username}</p>
                  <p className="text-xs text-gray-400">{u.role}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_blocked ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-600'}`}>
                    {u.is_blocked ? 'BLOCKED' : 'Active'}
                  </span>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleBan(u.id || u.uid, u.is_blocked)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                        u.is_blocked ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
                      }`}
                    >
                      {u.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Jobs / Escrows placeholder */}
      {(tab === 'jobs' || tab === 'escrows') && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <span className="text-4xl mb-3">🚧</span>
          <p className="font-medium">Coming soon</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ bg, color, value, label }: { bg: string; color: string; value: string; label: string }) {
  return (
    <div className={`${bg} rounded-2xl p-4 text-center`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
