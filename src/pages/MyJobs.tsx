import { useState, useEffect, useCallback } from 'react';
import Spinner from '../components/Spinner';
import { t, statusLabel } from '../lib/i18n';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getMyJobs, getMyJobsAsFreelancer, getMyApplications,
  getOffers, acceptOffer, declineOffer, withdrawApplication,
} from '../lib/api';
import { toast } from '../components/Toast';
import { CAT_COLORS } from '../lib/constants';
import { categoryLabel, type CategoryKey } from '../lib/categories';

interface Job { id: number; title: string; budget: number; category?: string; status?: string; created_at: string; }
interface AppItem {
  id: number; job_id: number; status: string; message?: string; created_at: string;
  job_title?: string; job_budget?: number; job_status?: string; client_username?: string; client_name?: string;
}

const STATUS_STYLE: Record<string, string> = {
  open:        'bg-emerald-100 text-emerald-600',
  in_progress: 'bg-blue-100 text-blue-600',
  completed:   'bg-gray-100 text-gray-500',
  cancelled:   'bg-red-100 text-red-500',
  disputed:    'bg-amber-100 text-amber-600',
};
const APP_STATUS_STYLE: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-600',
  accepted: 'bg-emerald-100 text-emerald-600',
  rejected: 'bg-red-100 text-red-500',
  offer:    'bg-blue-100 text-blue-600',
  withdrawn:'bg-gray-100 text-gray-500',
};

type Tab = 'posted' | 'hired' | 'applied' | 'offers';
const TABS: Tab[] = ['posted', 'hired', 'applied', 'offers'];

export default function MyJobsPage() {
  const tr = t();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initial = (params.get('tab') as Tab) || 'posted';
  const [tab, setTab] = useState<Tab>(TABS.includes(initial) ? initial : 'posted');
  const [posted, setPosted] = useState<Job[]>([]);
  const [hired, setHired] = useState<Job[]>([]);
  const [applied, setApplied] = useState<AppItem[]>([]);
  const [offers, setOffers] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  // Each tab loads independently, so a failure is tracked per tab. Before this,
  // a rejected request fell through to `[]` and the tab rendered "(0)" with its
  // empty state — a freelancer whose getOffers() call failed was told they had
  // no offers rather than that the list could not be loaded.
  const [failed, setFailed] = useState<Record<Tab, boolean>>({
    posted: false, hired: false, applied: false, offers: false,
  });

  const load = useCallback(() => {
    setLoading(true);
    const FAILED = Symbol('failed');
    Promise.all([
      getMyJobs().catch(() => FAILED),
      getMyJobsAsFreelancer().catch(() => FAILED),
      getMyApplications().catch(() => FAILED),
      getOffers().catch(() => FAILED),
    ]).then(([p, h, a, o]: any[]) => {
      setFailed({ posted: p === FAILED, hired: h === FAILED, applied: a === FAILED, offers: o === FAILED });
      if (p !== FAILED) setPosted(p?.jobs || p || []);
      if (h !== FAILED) setHired(h?.jobs || h || []);
      // "offer" rows are direct offers — they live on their own tab
      if (a !== FAILED) setApplied(((a?.applications || []) as AppItem[]).filter(x => x.status !== 'offer'));
      if (o !== FAILED) setOffers(o?.offers || o || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabLabel = (tb: Tab) => {
    // A tab whose request failed has no count to show — "(0)" would read as
    // "you have none" rather than "this did not load".
    const count = (n: number) => (failed[tb] ? '' : ` (${n})`);
    switch (tb) {
      case 'posted':  return `${tr.posted}${count(posted.length)}`;
      case 'hired':   return `${tr.hired}${count(hired.length)}`;
      case 'applied': return `${tr.applied}${count(applied.length)}`;
      case 'offers':  return `${tr.tabOffers}${count(offers.length)}`;
    }
  };

  const doAccept = async (o: AppItem) => {
    setActing(o.id);
    try {
      await acceptOffer(o.id);
      toast(tr.offerAccepted, 'success');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setActing(null); }
  };

  const doDecline = async (o: AppItem) => {
    setActing(o.id);
    try {
      await declineOffer(o.id);
      toast(tr.offerDeclined, 'info');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setActing(null); }
  };

  const doWithdraw = async (a: AppItem) => {
    if (!window.confirm(tr.withdrawConfirm)) return;
    setActing(a.id);
    try {
      await withdrawApplication(a.id);
      toast(tr.applicationWithdrawn, 'info');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setActing(null); }
  };

  const renderJobCard = (job: Job) => {
    const catKey = (job.category?.toLowerCase() || 'other') as CategoryKey;
    const catColor = CAT_COLORS[catKey] || CAT_COLORS.other;
    const statusCls = STATUS_STYLE[job.status || 'open'] || STATUS_STYLE.open;
    return (
      <div
        key={job.id}
        onClick={() => nav(`/job/${job.id}`)}
        className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-4 cursor-pointer active:scale-[0.99] transition-transform space-y-2"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white leading-snug flex-1">{job.title}</h3>
          <span className="text-emerald-500 font-bold text-sm shrink-0">{job.budget} π</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-0.5 rounded-full ${catColor}`}>{categoryLabel(catKey)}</span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusCls}`}>
            {statusLabel(job.status || 'open')}
          </span>
        </div>
      </div>
    );
  };

  const renderAppCard = (a: AppItem, isOffer: boolean) => {
    const cls = APP_STATUS_STYLE[a.status] || APP_STATUS_STYLE.pending;
    return (
      <div
        key={a.id}
        className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-4 space-y-2"
      >
        <div
          onClick={() => nav(`/job/${a.job_id}`)}
          className="cursor-pointer space-y-1"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white leading-snug flex-1">
              {a.job_title || `Job #${a.job_id}`}
            </h3>
            {a.job_budget != null && <span className="text-emerald-500 font-bold text-sm shrink-0">{a.job_budget} π</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {a.client_username && (
              <span className="text-xs text-gray-400 dark:text-slate-500">👤 @{a.client_username}</span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>{statusLabel(a.status)}</span>
          </div>
          {a.message && (
            <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{a.message}</p>
          )}
        </div>

        {!isOffer && a.status === 'pending' && (
          <button
            onClick={() => doWithdraw(a)}
            disabled={acting === a.id}
            className="w-full py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 text-xs font-semibold disabled:opacity-60"
          >
            {tr.withdrawApplication}
          </button>
        )}

        {isOffer && a.status === 'offer' && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => doDecline(a)}
              disabled={acting === a.id}
              className="flex-1 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-xs font-semibold disabled:opacity-60"
            >
              {tr.decline}
            </button>
            <button
              onClick={() => doAccept(a)}
              disabled={acting === a.id}
              className="flex-[1.5] py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold disabled:opacity-60"
            >
              {acting === a.id ? <Spinner /> : `✅ ${tr.accept}`}
            </button>
          </div>
        )}
      </div>
    );
  };

  const empty = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-3">📋</span>
      <p className="font-semibold text-gray-900 dark:text-white">{tr.noJobsYet}</p>
    </div>
  );

  const errorState = (
    <button onClick={load} className="w-full flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-3">⚠️</span>
      <p className="font-semibold text-gray-900 dark:text-white">{tr.loadFailed}</p>
      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{tr.retry}</p>
    </button>
  );

  const content = () => {
    if (failed[tab]) return errorState;
    if (tab === 'posted') return posted.length ? posted.map(renderJobCard) : empty;
    if (tab === 'hired') return hired.length ? hired.map(renderJobCard) : empty;
    if (tab === 'applied') return applied.length ? applied.map(a => renderAppCard(a, false)) : empty;
    return offers.length ? offers.map(o => renderAppCard(o, true)) : empty;
  };

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in pb-24 bg-white dark:bg-slate-900 min-h-screen">
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TABS.map(tb => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              tab === tb ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
            }`}
          >
            {tabLabel(tb)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">{content()}</div>
      )}
    </div>
  );
}
