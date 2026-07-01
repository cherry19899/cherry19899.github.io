import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminStats, getAdminUsers, getAdminJobs, getAdminEscrows, getAdminEarnings,
  adminDeleteJob, adminResolveEscrow, adminBlockUser, adminGrantConnects, apiFetch,
  getAdminAnalytics, getAdminRealtime,
} from '../lib/api';
import { useAppCtx } from '../App';
import { toast } from '../components/Toast';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type Tab = 'stats' | 'users' | 'jobs' | 'escrows' | 'earnings' | 'analytics';

export default function AdminPage() {
  const { user } = useAppCtx();
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [feeValue, setFeeValue] = useState('2');
  const [savingFee, setSavingFee] = useState(false);
  const [grantModal, setGrantModal] = useState<any>(null);
  const [grantAmt, setGrantAmt] = useState('10');
  const [acting, setActing] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);

  const load = useCallback(() => {
    setLoading(true);
    if (tab === 'analytics') {
      Promise.all([
        getAdminAnalytics('signups', analyticsDays),
        getAdminAnalytics('revenue', analyticsDays),
        getAdminAnalytics('jobs', analyticsDays),
        getAdminAnalytics('retention'),
        getAdminRealtime(),
      ]).then(([signups, revenue, jobsData, retention, realtime]) => {
        setAnalytics({ signups, revenue, jobs: jobsData, retention });
        setRealtimeData(realtime);
      }).catch(() => {}).finally(() => setLoading(false));
      return;
    }
    const fn: Record<string, () => Promise<any>> = {
      stats:    getAdminStats,
      users:    () => getAdminUsers(),
      jobs:     getAdminJobs,
      escrows:  getAdminEscrows,
      earnings: getAdminEarnings,
    };
    fn[tab]()
      .then(d => {
        if (tab === 'stats')    setStats(d);
        if (tab === 'users')    setUsers(d?.users || d || []);
        if (tab === 'jobs')     setJobs(d?.jobs || d?.all_jobs || d || []);
        if (tab === 'escrows')  setEscrows(d?.escrows || d || []);
        if (tab === 'earnings') setEarnings(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, analyticsDays]);

  useEffect(() => { load(); }, [load]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center pt-20 gap-3">
        <span className="text-5xl">🔒</span>
        <p className="text-gray-900 font-bold text-lg">Admin Only</p>
      </div>
    );
  }

  const rev = (stats?.total_revenue || earnings?.summary?.total_earnings || 0).toFixed(2);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'stats',     label: 'Stats' },
    { key: 'users',     label: `Users${users.length ? ` (${users.length})` : ''}` },
    { key: 'jobs',      label: `Jobs${jobs.length ? ` (${jobs.length})` : ''}` },
    { key: 'escrows',   label: `Escrows${escrows.length ? ` (${escrows.length})` : ''}` },
    { key: 'earnings',  label: 'Earnings' },
    { key: 'analytics', label: '📊 Analytics' },
  ];

  const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  const filteredUsers = users.filter(u =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredJobs = jobs.filter(j =>
    !search || j.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-lg mx-auto pb-24 animate-fade-in bg-white dark:bg-slate-900 min-h-screen">
      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search bar for users / jobs */}
        {(tab === 'users' || tab === 'jobs') && (
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'users' ? 'Search users…' : 'Search jobs…'}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
        )}
      </div>

      <div className="px-4 space-y-3">

        {/* ── STATS ── */}
        {tab === 'stats' && (
          loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatCard bg="bg-emerald-50" color="text-emerald-500" value={`${rev} π`} label="Revenue" />
                <StatCard bg="bg-blue-50" color="text-blue-500" value={String(stats.total_escrows ?? 0)} label="Escrows" />
                <StatCard bg="bg-violet-50" color="text-violet-500" value={String(stats.total_users ?? 0)} label="Users" />
                <StatCard bg="bg-amber-50" color="text-amber-500" value={String(stats.total_jobs ?? 0)} label="Jobs" />
                <StatCard bg="bg-orange-50" color="text-orange-500" value={String(stats.active_escrows ?? 0)} label="Active Escrows" />
                <StatCard bg="bg-cyan-50" color="text-cyan-500" value={String(stats.chats ?? 0)} label="Chats" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-4 space-y-3 text-sm">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Platform Fee</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={feeValue}
                    onChange={e => setFeeValue(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-emerald-400"
                    placeholder="e.g. 2"
                  />
                  <span className="text-gray-500">%</span>
                  <button
                    onClick={async () => {
                      setSavingFee(true);
                      try {
                        await apiFetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ key: 'platform_fee_percent', value: Number(feeValue) }) });
                        toast(`Fee set to ${feeValue}%`, 'success');
                      } catch (e: any) { toast(e.message, 'error'); }
                      finally { setSavingFee(false); }
                    }}
                    disabled={savingFee}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold disabled:opacity-60"
                  >
                    {savingFee ? '…' : 'Save'}
                  </button>
                </div>
                {stats?.platformFeePercent !== undefined && (
                  <p className="text-xs text-gray-400">Current: {stats.platformFeePercent}%</p>
                )}
              </div>
            </>
          ) : <p className="text-center text-gray-400 py-10">No data</p>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          loading ? (
            <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-16 skeleton rounded-2xl"/>)}</div>
          ) : (
            <>
              {filteredUsers.length === 0 && <p className="text-center text-gray-400 py-10">No users found</p>}
              {filteredUsers.map((u: any) => (
                <div key={u.id || u.uid} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-sm">
                      {(u.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white font-semibold text-sm">@{u.username}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{u.role} · {u.balance_connects ?? 0}⚡ connects · {u.balance_pi ?? 0} π</p>
                      {u.rating && <p className="text-xs text-amber-500">{'★'.repeat(Math.round(u.rating))} {parseFloat(u.rating).toFixed(1)}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${u.is_blocked ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-600'}`}>
                      {u.is_blocked ? 'BLOCKED' : 'Active'}
                    </span>
                  </div>

                  {u.role !== 'admin' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGrantModal(u)}
                        className="flex-1 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold"
                      >
                        ⚡ Grant Connects
                      </button>
                      <button
                        onClick={async () => {
                          setActing(u.id || u.uid);
                          try {
                            await adminBlockUser(u.id || u.uid, !u.is_blocked);
                            setUsers(prev => prev.map(x => (x.id || x.uid) === (u.id || u.uid) ? { ...x, is_blocked: !u.is_blocked } : x));
                            toast(u.is_blocked ? 'Unblocked' : 'Blocked', 'success');
                          } catch (e: any) { toast(e.message, 'error'); }
                          finally { setActing(null); }
                        }}
                        disabled={acting === (u.id || u.uid)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60 ${u.is_blocked ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}
                      >
                        {u.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )
        )}

        {/* ── JOBS ── */}
        {tab === 'jobs' && (
          loading ? (
            <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-16 skeleton rounded-2xl"/>)}</div>
          ) : (
            <>
              {filteredJobs.length === 0 && <p className="text-center text-gray-400 py-10">No jobs</p>}
              {filteredJobs.map((j: any) => (
                <div key={j.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{j.title}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">@{j.posted_by_name || j.posted_by || j.client_username} · {j.budget} π · {j.status}</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete "${j.title}"?`)) return;
                      try { await adminDeleteJob(j.id); setJobs(prev => prev.filter(x => x.id !== j.id)); toast('Job deleted', 'success'); }
                      catch (e: any) { toast(e.message, 'error'); }
                    }}
                    className="text-red-400 hover:text-red-600 shrink-0 p-1"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </>
          )
        )}

        {/* ── ESCROWS ── */}
        {tab === 'escrows' && (
          loading ? (
            <div className="space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-20 skeleton rounded-2xl"/>)}</div>
          ) : (
            <>
              {escrows.length === 0 && <p className="text-center text-gray-400 py-10">No escrows</p>}
              {escrows.map((e: any) => (
                <div key={e.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{e.job_title || `Escrow #${e.id}`}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">@{e.client_name || e.client_username} → @{e.freelancer_name || e.freelancer_username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-500 font-bold">{e.amount} π</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        e.status === 'funded' ? 'bg-emerald-100 text-emerald-600' :
                        e.status === 'disputed' ? 'bg-red-100 text-red-500' :
                        'bg-gray-100 text-gray-500'
                      }`}>{e.status}</span>
                    </div>
                  </div>
                  {(e.status === 'funded' || e.status === 'disputed') && (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try { await adminResolveEscrow(e.id, 'refund_to_client'); setEscrows(prev => prev.map(x => x.id === e.id ? { ...x, status: 'refunded' } : x)); toast('Refunded', 'success'); }
                          catch (err: any) { toast(err.message, 'error'); }
                        }}
                        className="flex-1 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-semibold"
                      >
                        Refund Client
                      </button>
                      <button
                        onClick={async () => {
                          try { await adminResolveEscrow(e.id, 'release_to_freelancer'); setEscrows(prev => prev.map(x => x.id === e.id ? { ...x, status: 'released' } : x)); toast('Released to freelancer', 'success'); }
                          catch (err: any) { toast(err.message, 'error'); }
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Release Funds
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )
        )}

        {/* ── ANALYTICS ── */}
        {tab === 'analytics' && (
          <>
            {/* Realtime strip */}
            {realtimeData && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <StatCard bg="bg-emerald-50" color="text-emerald-500" value={String(realtimeData.online_now ?? 0)} label="Online now" />
                <StatCard bg="bg-blue-50" color="text-blue-500" value={String(realtimeData.signups_24h ?? 0)} label="Signups 24h" />
                <StatCard bg="bg-amber-50" color="text-amber-500" value={String(realtimeData.active_escrows ?? 0)} label="Active escrows" />
              </div>
            )}

            {/* Days filter */}
            <div className="flex gap-2 mb-4">
              {[7, 14, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setAnalyticsDays(d)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold ${analyticsDays === d ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}
                >
                  {d}d
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-48 skeleton rounded-2xl"/>)}</div>
            ) : analytics ? (
              <div className="space-y-4">
                {/* Sign-ups line chart */}
                {analytics.signups?.data?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">Sign-ups</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={analytics.signups.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5, 10)} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Revenue area chart */}
                {analytics.revenue?.data?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">Revenue (π)</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={analytics.revenue.data}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5, 10)} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Jobs by category bar chart */}
                {analytics.jobs?.by_category?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">Jobs by Category</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={analytics.jobs.by_category} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 9 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Retention / role breakdown pie */}
                {analytics.retention?.by_role?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">User Roles</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={analytics.retention.by_role}
                          dataKey="count"
                          nameKey="role"
                          cx="50%"
                          cy="50%"
                          outerRadius={65}
                          label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {analytics.retention.by_role.map((_: any, i: number) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Export CSV buttons */}
                <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">Export CSV</p>
                  <div className="flex flex-wrap gap-2">
                    {['users', 'jobs', 'escrows', 'payments', 'reviews'].map(table => (
                      <button
                        key={table}
                        onClick={async () => {
                          try {
                            const csvText = await apiFetch(`/api/admin/export/${table}`);
                            const blob = new Blob([typeof csvText === 'string' ? csvText : JSON.stringify(csvText)], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${table}-${new Date().toISOString().slice(0,10)}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch (e: any) { toast(e.message, 'error'); }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-semibold capitalize"
                      >
                        ⬇ {table}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : <p className="text-center text-gray-400 py-10">No analytics data</p>}
          </>
        )}

        {/* ── EARNINGS ── */}
        {tab === 'earnings' && (
          loading ? (
            <div className="grid grid-cols-2 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 skeleton rounded-2xl"/>)}</div>
          ) : earnings ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatCard bg="bg-emerald-50" color="text-emerald-500" value={`${(earnings.summary?.total_earnings || 0).toFixed(2)} π`} label="Total Earnings" />
                <StatCard bg="bg-blue-50" color="text-blue-500" value={String(earnings.summary?.total_transactions || 0)} label="Transactions" />
                <StatCard bg="bg-orange-50" color="text-orange-500" value={`${(earnings.summary?.collected || 0).toFixed(2)} π`} label="Collected" />
                <StatCard bg="bg-purple-50" color="text-purple-500" value={`${(earnings.summary?.pending_volume || 0).toFixed(2)} π`} label="Pending" />
              </div>
              {earnings.payments?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent Transactions</p>
                  {earnings.payments.slice(0, 10).map((p: any, i: number) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 flex justify-between text-sm">
                      <span className="text-gray-600 truncate flex-1">{p.job_title || p.memo || `Payment #${p.id}`}</span>
                      <span className="text-emerald-500 font-semibold shrink-0 ml-2">{p.amount} π</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : <p className="text-center text-gray-400 py-10">No earnings data</p>
        )}
      </div>

      {/* Grant connects modal */}
      {grantModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setGrantModal(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mb-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Grant Connects</h2>
            <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">To @{grantModal.username}</p>
            <div className="flex gap-2 mb-4">
              {[5, 10, 25, 50].map(n => (
                <button
                  key={n}
                  onClick={() => setGrantAmt(String(n))}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold ${grantAmt === String(n) ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={grantAmt}
              onChange={e => setGrantAmt(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-emerald-400"
              placeholder="Custom amount"
            />
            <button
              onClick={async () => {
                try {
                  await adminGrantConnects(grantModal.id || grantModal.uid, Number(grantAmt));
                  toast(`Granted ${grantAmt} connects to @${grantModal.username}`, 'success');
                  setGrantModal(null);
                } catch (e: any) { toast(e.message, 'error'); }
              }}
              className="w-full h-12 rounded-full bg-emerald-500 text-white font-semibold"
            >
              Grant {grantAmt} Connects ⚡
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ bg, color, value, label }: { bg: string; color: string; value: string; label: string }) {
  return (
    <div className={`${bg} dark:bg-slate-800 rounded-2xl p-4 text-center`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}
