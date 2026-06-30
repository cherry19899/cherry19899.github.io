import React, { useState, useEffect, useCallback } from 'react';
import { getAdminStats, getAdminUsers, apiFetch } from '../lib/api';
import type { AdminStats } from '../types';
import { useAppAuth, useToastCtx } from '../App';
import { SkeletonCard } from '../components/Skeleton';

type Tab = 'stats' | 'users' | 'jobs' | 'escrows' | 'earnings' | 'fee';

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
    if (tab === 'stats' || tab === 'earnings') loadStats();
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
        <p className="text-gray-900 font-bold text-lg">Admin Only</p>
        <p className="text-gray-500 text-sm">You don't have permission to view this page.</p>
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'stats', label: 'Stats' },
    { key: 'users', label: 'Users' },
    { key: 'jobs', label: 'All Jobs' },
    { key: 'escrows', label: 'Escrows' },
    { key: 'earnings', label: 'Earnings' },
    { key: 'fee', label: 'Fees' },
  ];

  const revenue = (stats?.total_revenue || 0).toFixed(2);

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

      {/* Stats tab */}
      {(tab === 'stats' || tab === 'earnings') && (
        loading ? (
          <div className="grid grid-cols-2 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Earnings" value={`${revenue} π`} bg="bg-emerald-50" color="text-emerald-500" />
              <StatCard label="Transactions" value={String(stats.total_escrows ?? 0)} bg="bg-blue-50" color="text-blue-500" />
              <StatCard label="Collected" value={`${revenue} π`} bg="bg-orange-50" color="text-orange-500" />
              <StatCard label="Pending" value="0 π" bg="bg-purple-50" color="text-purple-500" />
              <StatCard label="Users" value={String(stats.total_users ?? 0)} bg="bg-gray-50" color="text-gray-700" />
              <StatCard label="Jobs" value={String(stats.total_jobs ?? 0)} bg="bg-gray-50" color="text-gray-700" />
            </div>
            {(stats.platformFeePercent !== undefined || stats.developerFeePercent !== undefined) && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-1 text-sm">
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
          <div className="text-center text-gray-400 py-10">No data</div>
        )
      )}

      {/* Users tab */}
      {tab === 'users' && (
        loading ? (
          <div className="space-y-2">{Array.from({length:5}).map((_,i)=><SkeletonCard key={i}/>)}</div>
        ) : (
          <div className="space-y-2">
            {users.map((u: any) => (
              <div key={u.id || u.uid} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-sm">
                  {(u.username || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-sm truncate">@{u.username}</p>
                  <p className="text-xs text-gray-400">{u.role} · {u.balance_connects ?? 0} connects</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_blocked ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-600'}`}>
                    {u.is_blocked ? 'BLOCKED' : 'Active'}
                  </span>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleBan(u.id || u.uid, u.is_blocked)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold ${u.is_blocked ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}
                    >
                      {u.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-center text-gray-400 py-10">No users</p>}
          </div>
        )
      )}

      {/* Jobs/Escrows placeholder */}
      {(tab === 'jobs' || tab === 'escrows') && (
        <div className="text-center text-gray-400 py-10">Coming soon</div>
      )}

      {/* Fees tab */}
      {tab === 'fee' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Platform Fee (on escrow release)</h3>
            <p className="text-xs text-gray-400">Charged to client on job completion. Max 20%.</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={platformFee}
                onChange={e => setPlatformFee(e.target.value)}
                min="0" max="20" step="0.5"
                className="input-base flex-1"
              />
              <span className="text-gray-500 text-sm font-semibold">%</span>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Developer Fee</h3>
            <p className="text-xs text-gray-400">Additional fee for the developer. Max 20%.</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={devFee}
                onChange={e => setDevFee(e.target.value)}
                min="0" max="20" step="0.5"
                className="input-base flex-1"
              />
              <span className="text-gray-500 text-sm font-semibold">%</span>
            </div>
          </div>

          <button
            onClick={handleSaveFees}
            disabled={savingFee}
            className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-bold disabled:opacity-60"
          >
            {savingFee ? 'Saving…' : 'Save Fees'}
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, bg, color }: { label: string; value: string; bg: string; color: string }) {
  return (
    <div className={`${bg} rounded-2xl p-4 text-center`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
