import React, { useState, useEffect, useCallback } from 'react';
import { getAdminStats, getAdminUsers, apiFetch } from '../lib/api';
import type { AdminStats } from '../types';
import { useAppAuth, useToastCtx } from '../App';
import { SkeletonCard } from '../components/Skeleton';

type Tab = 'stats' | 'users' | 'fee';

export default function AdminPage() {
  const { user } = useAppAuth();
  const { toast } = useToastCtx();
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [devFee, setDevFee] = useState('');
  const [platformFee, setPlatformFee] = useState('');
  const [savingFee, setSavingFee] = useState(false);

  const loadStats = useCallback(() => {
    setLoading(true);
    getAdminStats().then(d => setStats(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadUsers = useCallback(() => {
    setLoading(true);
    getAdminUsers().then((d: any) => setUsers(d?.users || d || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadFees = useCallback(() => {
    Promise.all([
      apiFetch('/api/admin/developer-fee'),
      apiFetch('/api/admin/platform-fee'),
    ]).then(([df, pf]) => {
      setDevFee(String(df?.developerFeePercent ?? ''));
      setPlatformFee(String(pf?.platformFeePercent ?? ''));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'stats') loadStats();
    else if (tab === 'users') loadUsers();
    else if (tab === 'fee') loadFees();
  }, [tab]);

  const handleBan = async (uid: string, isBanned: boolean) => {
    try {
      await apiFetch(`/api/admin/users/${uid}/${isBanned ? 'unblock' : 'block'}`, { method: 'POST' });
      setUsers(prev => prev.map(u => u.id === uid || u.uid === uid ? { ...u, is_blocked: !isBanned } : u));
      toast(isBanned ? 'User unblocked' : 'User blocked', 'success');
    } catch (e: any) { toast(e.message || 'Failed', 'error'); }
  };

  const handleSaveFees = async () => {
    setSavingFee(true);
    try {
      await Promise.all([
        apiFetch('/api/admin/developer-fee', { method: 'PATCH', body: JSON.stringify({ percent: Number(devFee) }) }),
        apiFetch('/api/admin/platform-fee', { method: 'PATCH', body: JSON.stringify({ percent: Number(platformFee) }) }),
      ]);
      toast('Fees updated!', 'success');
    } catch (e: any) { toast(e.message || 'Failed to save fees', 'error'); }
    finally { setSavingFee(false); }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center pt-20 gap-4">
        <span className="text-4xl">🔒</span>
        <p className="text-white font-bold text-lg">Admin Only</p>
        <p className="text-slate-400 text-sm">You don't have permission to view this page.</p>
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'stats', label: '📊 Stats' },
    { key: 'users', label: '👥 Users' },
    { key: 'fee', label: '💰 Fees' },
  ];

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 animate-fade-in">
      <h1 className="text-lg font-bold text-white mb-4">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {tab === 'stats' && (
        loading ? (
          <div className="grid grid-cols-2 gap-3">{Array.from({length:6}).map((_,i)=><div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse"/>)}</div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Users', stats.total_users],
                ['Jobs', stats.total_jobs],
                ['Escrows', stats.total_escrows],
                ['Active Escrows', stats.active_escrows],
                ['Revenue (π)', (stats.total_revenue || 0).toFixed(2)],
                ['Chats', stats.chats ?? 0],
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{val}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
            {(stats.platformFeePercent !== undefined || stats.developerFeePercent !== undefined) && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-1 text-sm">
                {stats.platformFeePercent !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Platform fee</span>
                    <span className="text-white font-semibold">{stats.platformFeePercent}%</span>
                  </div>
                )}
                {stats.developerFeePercent !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Developer fee</span>
                    <span className="text-white font-semibold">{stats.developerFeePercent}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-10">No data</div>
        )
      )}

      {/* Users tab */}
      {tab === 'users' && (
        loading ? (
          <div className="space-y-2">{Array.from({length:5}).map((_,i)=><SkeletonCard key={i}/>)}</div>
        ) : (
          <div className="space-y-2">
            {users.map((u: any) => (
              <div key={u.id || u.uid} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 font-bold">
                  {(u.username || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">@{u.username}</p>
                  <p className="text-xs text-slate-500">{u.role} · {u.balance_connects ?? 0} connects</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_blocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {u.is_blocked ? 'Blocked' : 'Active'}
                  </span>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleBan(u.id || u.uid, u.is_blocked)}
                      className={`text-xs px-2 py-1 rounded-lg font-semibold ${u.is_blocked ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}
                    >
                      {u.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-center text-slate-400 py-10">No users</p>}
          </div>
        )
      )}

      {/* Fees tab */}
      {tab === 'fee' && (
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-white">Platform Fee (on escrow release)</h3>
            <p className="text-xs text-slate-400">Charged to client on job completion. Max 20%.</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={platformFee}
                onChange={e => setPlatformFee(e.target.value)}
                min="0" max="20" step="0.5"
                className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-400 text-sm font-semibold">%</span>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-white">Developer Fee</h3>
            <p className="text-xs text-slate-400">Additional fee for the developer. Max 20%.</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={devFee}
                onChange={e => setDevFee(e.target.value)}
                min="0" max="20" step="0.5"
                className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-400 text-sm font-semibold">%</span>
            </div>
          </div>

          <button
            onClick={handleSaveFees}
            disabled={savingFee}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold disabled:opacity-60"
          >
            {savingFee ? 'Saving…' : 'Save Fees'}
          </button>
        </div>
      )}
    </div>
  );
}
