import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { apiFetch, getAdminStats, getAdminUsers, banUser, unbanUser } from '../lib/api';
import { formatBudget, timeAgo } from '../lib/utils';

interface AdminScreenProps {
  t: TFunction;
  user: { uid: string; username: string; role?: string };
  onBack: () => void;
}

type AdminTab = 'stats' | 'users' | 'jobs' | 'escrows' | 'earnings' | 'devfee';

export default function AdminScreen({ t, user, onBack }: AdminScreenProps) {
  const [tab, setTab] = useState<AdminTab>('stats');
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [devFee, setDevFee] = useState<{ developerFeePercent: number; maxPercent: number } | null>(null);
  const [devFeeInput, setDevFeeInput] = useState('');
  const [devFeeSaving, setDevFeeSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        getAdminStats().catch(() => null),
        getAdminUsers().catch(() => []),
      ]);
      setStats(s);
      setUsers((u as any)?.users || u || []);
    } catch {}
    finally { setLoading(false); }
  };

  const loadJobs = async () => {
    try {
      const d = await apiFetch('/api/admin/jobs/all');
      setJobs(d.jobs || d || []);
    } catch {}
  };

  const loadEscrows = async () => {
    try {
      const d = await apiFetch('/api/admin/escrows');
      setEscrows(d.escrows || d || []);
    } catch {}
  };

  const loadEarnings = async () => {
    try {
      const d = await apiFetch('/api/admin/earnings');
      setEarnings(d);
    } catch {}
  };

  const loadDevFee = async () => {
    try {
      const d = await apiFetch('/api/admin/developer-fee');
      setDevFee(d);
      setDevFeeInput(String(d.developerFeePercent ?? 0));
    } catch {}
  };

  useEffect(() => {
    if (tab === 'jobs' && jobs.length === 0) loadJobs();
    if (tab === 'escrows' && escrows.length === 0) loadEscrows();
    if (tab === 'earnings' && !earnings) loadEarnings();
    if (tab === 'devfee' && !devFee) loadDevFee();
  }, [tab]);

  const handleBan = async (userId: string, isBanned: boolean) => {
    try {
      if (isBanned) await unbanUser(userId);
      else await banUser(userId);
      setUsers(prev => prev.map(u => (u.uid === userId || u.id === userId) ? { ...u, is_blocked: !isBanned, banned: !isBanned } : u));
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Delete this job?')) return;
    try {
      await apiFetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (e: any) { alert(e.message); }
  };

  const handleSaveDevFee = async () => {
    const pct = parseFloat(devFeeInput);
    if (isNaN(pct) || pct < 0 || pct > (devFee?.maxPercent ?? 20)) {
      alert(`Enter a value between 0 and ${devFee?.maxPercent ?? 20}`);
      return;
    }
    setDevFeeSaving(true);
    try {
      const d = await apiFetch('/api/admin/developer-fee', {
        method: 'PATCH',
        body: JSON.stringify({ percent: pct }),
      });
      setDevFee(prev => prev ? { ...prev, developerFeePercent: d.developerFeePercent } : prev);
      alert('Developer fee updated');
    } catch (e: any) { alert(e.message); }
    finally { setDevFeeSaving(false); }
  };

  const TABS: { key: AdminTab; label: string }[] = [
    { key: 'stats', label: t('stats') },
    { key: 'users', label: t('users') },
    { key: 'jobs', label: t('allJobs') },
    { key: 'escrows', label: t('escrow') },
    { key: 'earnings', label: 'Earnings' },
    { key: 'devfee', label: 'Dev Fee' },
  ];

  return (
    <div className="animate-fade-in pb-20">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-bold text-base">{t('admin')}</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
        {TABS.map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === tb.key ? 'bg-[#4CAF7A] text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {loading && tab === 'stats' && (
          <div className="flex justify-center pt-8">
            <div className="w-8 h-8 border-2 border-[#4CAF7A] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Stats */}
        {tab === 'stats' && stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Users', value: stats.total_users ?? '—' },
                { label: 'Total Jobs', value: stats.total_jobs ?? '—' },
                { label: 'Active Escrows', value: stats.active_escrows ?? '—' },
                { label: 'Total Revenue', value: stats.total_revenue != null ? `π${Number(stats.total_revenue).toFixed(2)}` : '—' },
                { label: 'Platform Fee', value: stats.platformFeePercent != null ? `${stats.platformFeePercent}%` : '—' },
                { label: 'Dev Fee', value: stats.developerFeePercent != null ? `${stats.developerFeePercent}%` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-2xl font-black mt-1 text-[#1a1a2e]">{value}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Users */}
        {tab === 'users' && users.map(u => {
          const isBanned = u.is_blocked || u.banned;
          return (
            <div key={u.uid || u.id} className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-[#1a1a2e]">@{u.username}</p>
                  <p className="text-xs text-gray-500">{u.role}{u.kyc_verified ? ' · KYC ✓' : ''}</p>
                </div>
                <button
                  onClick={() => handleBan(u.uid || u.id, isBanned)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isBanned ? 'bg-[#4CAF7A]/10 text-[#4CAF7A]' : 'bg-red-50 text-red-500'}`}
                >
                  {isBanned ? t('unban') : t('ban')}
                </button>
              </div>
            </div>
          );
        })}

        {/* Jobs */}
        {tab === 'jobs' && jobs.map(job => (
          <div key={job.id} className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm flex-1 text-[#1a1a2e]">{job.title}</h3>
              <button
                onClick={() => handleDeleteJob(job.id)}
                className="text-red-500 text-xs font-bold px-2 py-1 rounded bg-red-50"
              >
                {t('delete')}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              @{job.client_username || job.posted_by_name} · {formatBudget(job.budget)} · {job.status} · {timeAgo(job.created_at)}
            </p>
          </div>
        ))}

        {/* Escrows */}
        {tab === 'escrows' && escrows.map(e => (
          <div key={e.id} className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-[#1a1a2e]">{e.job_title || `Job #${e.job_id}`}</span>
              <span className="text-[#4CAF7A] font-bold">{formatBudget(e.amount)}</span>
            </div>
            <p className="text-xs text-gray-500">
              {e.client_name ? `@${e.client_name}` : ''}{e.freelancer_name ? ` → @${e.freelancer_name}` : ''} · {e.status} · {timeAgo(e.created_at)}
            </p>
          </div>
        ))}

        {/* Earnings */}
        {tab === 'earnings' && (
          <>
            {!earnings ? (
              <div className="flex justify-center pt-8">
                <div className="w-8 h-8 border-2 border-[#4CAF7A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Collected', value: `π${Number(earnings.summary?.total_earnings ?? 0).toFixed(2)}` },
                    { label: 'Transactions', value: earnings.summary?.total_transactions ?? 0 },
                    { label: 'Avg Transaction', value: `π${Number(earnings.summary?.average_transaction ?? 0).toFixed(2)}` },
                    { label: 'Pending Volume', value: `π${Number(earnings.summary?.pending_volume ?? 0).toFixed(2)}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-xl font-black mt-1 text-[#1a1a2e]">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mt-2">
                  {(earnings.history || []).slice(0, 20).map((p: any) => (
                    <div key={p.id} className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#1a1a2e]">{p.client_name ? `@${p.client_name}` : p.user_id}</p>
                        <p className="text-xs text-gray-500">{timeAgo(p.created_at)} · {p.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#4CAF7A]">π{Number(p.amount).toFixed(2)}</p>
                        <p className="text-xs text-gray-400">fee π{Number(p.developer_fee ?? 0).toFixed(3)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Dev Fee */}
        {tab === 'devfee' && (
          <div className="space-y-4">
            {!devFee ? (
              <div className="flex justify-center pt-8">
                <div className="w-8 h-8 border-2 border-[#4CAF7A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm space-y-1">
                  <p className="text-xs text-gray-500">Current developer fee</p>
                  <p className="text-3xl font-black text-[#4CAF7A]">{devFee.developerFeePercent}%</p>
                  <p className="text-xs text-gray-400">Max allowed: {devFee.maxPercent}%</p>
                </div>
                <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm space-y-3">
                  <p className="text-sm font-semibold text-[#1a1a2e]">Set developer fee (%)</p>
                  <input
                    type="number"
                    value={devFeeInput}
                    onChange={e => setDevFeeInput(e.target.value)}
                    min={0}
                    max={devFee.maxPercent}
                    step={0.1}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF7A]"
                    placeholder={`0 – ${devFee.maxPercent}`}
                  />
                  <button
                    onClick={handleSaveDevFee}
                    disabled={devFeeSaving}
                    className="w-full py-2.5 rounded-xl bg-[#4CAF7A] text-white text-sm font-bold disabled:opacity-60"
                  >
                    {devFeeSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
