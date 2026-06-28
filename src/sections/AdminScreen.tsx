import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { apiFetch, getAdminStats, getAdminUsers, getAdminSettings, updateAdminSetting, banUser } from '../lib/api';
import { formatBudget, timeAgo } from '../lib/utils';

interface AdminScreenProps {
  t: TFunction;
  user: { uid: string; username: string; role?: string };
  onBack: () => void;
}

type AdminTab = 'stats' | 'jobs' | 'users' | 'escrows' | 'settings';

export default function AdminScreen({ t, user, onBack }: AdminScreenProps) {
  const [tab, setTab] = useState<AdminTab>('stats');
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feeValue, setFeeValue] = useState('');
  const [feeLoading, setFeeLoading] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u, st] = await Promise.all([
        getAdminStats().catch(() => null),
        getAdminUsers().catch(() => []),
        getAdminSettings().catch(() => null),
      ]);
      setStats(s);
      setUsers((u as any)?.users || u || []);
      setSettings(st);
      if (st?.platform_fee !== undefined) setFeeValue(String(st.platform_fee));
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

  useEffect(() => {
    if (tab === 'jobs' && jobs.length === 0) loadJobs();
    if (tab === 'escrows' && escrows.length === 0) loadEscrows();
  }, [tab]);

  const handleBan = async (userId: string, banned: boolean) => {
    try {
      await banUser(userId, !banned);
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, banned: !banned } : u));
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Delete this job?')) return;
    try {
      await apiFetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (e: any) { alert(e.message); }
  };

  const handleSaveFee = async () => {
    setFeeLoading(true);
    try {
      await updateAdminSetting('platform_fee', parseFloat(feeValue));
      alert('Fee updated!');
    } catch (e: any) { alert(e.message); }
    finally { setFeeLoading(false); }
  };

  const TABS: { key: AdminTab; label: string }[] = [
    { key: 'stats', label: t('stats') },
    { key: 'users', label: t('users') },
    { key: 'jobs', label: t('allJobs') },
    { key: 'escrows', label: t('escrow') },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="animate-fade-in pb-20">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
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
              tab === tb.key ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {loading && tab === 'stats' && (
          <div className="flex justify-center pt-8">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Stats */}
        {tab === 'stats' && stats && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Users', value: stats.total_users ?? '—' },
              { label: 'Total Jobs', value: stats.total_jobs ?? '—' },
              { label: 'Active Escrows', value: stats.active_escrows ?? '—' },
              { label: 'Total Revenue', value: stats.total_revenue ? `π${Number(stats.total_revenue).toFixed(2)}` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-card border border-border p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-black mt-1">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && users.map(u => (
          <div key={u.uid || u.id} className="p-4 rounded-xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">@{u.username}</p>
                <p className="text-xs text-muted-foreground">{u.role} {u.kyc ? '· KYC ✓' : ''}</p>
              </div>
              <button
                onClick={() => handleBan(u.uid || u.id, u.banned)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${u.banned ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}
              >
                {u.banned ? t('unban') : t('ban')}
              </button>
            </div>
          </div>
        ))}

        {/* Jobs */}
        {tab === 'jobs' && jobs.map(job => (
          <div key={job.id} className="p-4 rounded-xl bg-card border border-border space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm flex-1">{job.title}</h3>
              <button
                onClick={() => handleDeleteJob(job.id)}
                className="text-destructive text-xs font-bold px-2 py-1 rounded bg-destructive/10"
              >
                {t('delete')}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              @{job.client_username} · {formatBudget(job.budget)} · {job.status} · {timeAgo(job.created_at)}
            </p>
          </div>
        ))}

        {/* Escrows */}
        {tab === 'escrows' && escrows.map(e => (
          <div key={e.id} className="p-4 rounded-xl bg-card border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{e.job_title || `Job #${e.job_id}`}</span>
              <span className="text-emerald-500 font-bold">{formatBudget(e.amount)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{e.status} · {timeAgo(e.created_at)}</p>
          </div>
        ))}

        {/* Settings */}
        {tab === 'settings' && (
          <div className="rounded-xl bg-card border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Platform Fee (%)</h3>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={feeValue}
                onChange={e => setFeeValue(e.target.value)}
                className="flex-1 rounded-xl bg-muted border border-border px-3 py-2 text-sm"
              />
              <button
                onClick={handleSaveFee}
                disabled={feeLoading}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-60"
              >
                {feeLoading ? '...' : t('save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
