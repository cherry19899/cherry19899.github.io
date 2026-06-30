import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../lib/api';
import { useAppCtx } from '../App';
import { CATEGORIES, CAT_COLORS } from '../lib/constants';
import { t } from '../lib/i18n';

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function greeting() {
  const h = new Date().getHours();
  const tr = t();
  if (h >= 5 && h < 12) return tr.goodMorning;
  if (h >= 12 && h < 17) return tr.goodAfternoon;
  return tr.goodEvening;
}

interface Job {
  id: number; title: string; description?: string; budget: number | string;
  category?: string; posted_by_name?: string; client_username?: string;
  applications?: number; applicants_count?: number;
  apply_cost?: number; is_urgent?: boolean; created_at: string;
}

export default function HomePage() {
  const { user } = useAppCtx();
  const nav = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (p = 1, replace = true) => {
    if (p === 1) setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(p), limit: '20', sort });
      if (cat !== 'all') qs.set('category', cat);
      if (search) qs.set('search', search);
      const data = await getJobs(qs.toString());
      const list: Job[] = data?.jobs || data || [];
      setJobs(prev => replace ? list : [...prev, ...list]);
      setHasMore(list.length === 20);
      setPage(p);
    } catch {}
    finally { setLoading(false); }
  }, [cat, sort, search]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => load(1, true), search ? 300 : 0);
    return () => clearTimeout(timer.current);
  }, [load]);

  const tr = t();

  return (
    <div className="max-w-lg mx-auto animate-fade-in bg-white dark:bg-slate-900 min-h-screen">

      {/* Greeting */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-xs text-gray-400 dark:text-slate-500">{greeting()},</p>
          <p className="text-base font-bold text-gray-900 dark:text-white">{user?.username || ''} 👋</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 dark:text-slate-500">{tr.balance}</p>
          <p className="text-base font-bold text-emerald-500">{(user as any)?.balance_pi ?? '0'} π</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-[calc(3.5rem+1.75rem)] z-30 bg-white dark:bg-slate-900 px-4 pt-2 border-b border-gray-100 dark:border-slate-800">
        {/* Search */}
        <div className="relative mb-3 flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tr.searchJobs}
              className="w-full pl-10 pr-4 h-11 rounded-full bg-gray-100 dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <button className="w-11 h-11 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-gray-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                cat === c.key
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pb-3">
          <span className="text-xs text-gray-500 dark:text-slate-400">{jobs.length} {tr.jobs.toLowerCase()}</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-xs bg-gray-100 dark:bg-slate-800 border-0 text-gray-600 dark:text-slate-400 rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="newest">{tr.newest}</option>
            <option value="budget_high">{tr.budgetHigh}</option>
            <option value="budget_low">{tr.budgetLow}</option>
          </select>
        </div>
      </div>

      {/* Job list */}
      <div className="p-4 space-y-3 pb-32">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <JobSkeleton key={i} />)
          : jobs.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-5xl mb-3">🔍</span>
              <p className="font-semibold text-gray-900 dark:text-white">{tr.noJobsFound}</p>
              <p className="text-sm text-gray-400 mt-1">{tr.tryDifferentFilters}</p>
            </div>
          )
          : jobs.map(job => (
            <JobCard key={job.id} job={job} onClick={() => nav(`/job/${job.id}`)} />
          ))
        }
        {!loading && hasMore && (
          <button onClick={() => load(page + 1, false)} className="w-full py-3 text-sm text-emerald-500 font-semibold">
            {tr.loadMore}
          </button>
        )}
      </div>

      {/* FAB */}
      {user && (
        <button
          onClick={() => nav('/post-job')}
          className="fixed bottom-24 right-4 z-[999] w-14 h-14 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 flex items-center justify-center text-white text-3xl font-light active:scale-95 transition-transform"
        >
          +
        </button>
      )}
    </div>
  );
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const catColor = CAT_COLORS[job.category?.toLowerCase() || 'other'] || CAT_COLORS.other;
  const author = job.posted_by_name || job.client_username || 'unknown';
  const applicants = job.applications ?? job.applicants_count ?? 0;
  const tr = t();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white leading-snug flex-1 line-clamp-2">{job.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-emerald-500 font-bold text-sm">{Number(job.budget)} π</span>
          <button className="text-gray-300 dark:text-slate-600 hover:text-emerald-400 transition-colors" onClick={e => e.stopPropagation()}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">{job.description}</p>
      )}

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-semibold px-3 py-0.5 rounded-full ${catColor}`}>{job.category}</span>
        {job.is_urgent && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-500">{tr.urgent}</span>}
        {(job.apply_cost ?? 0) > 0 && <span className="text-xs text-gray-400 dark:text-slate-500">{job.apply_cost} connects</span>}
      </div>

      {/* Author + stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
            {author[0]?.toUpperCase()}
          </div>
          <span className="text-gray-500 dark:text-slate-400">@{author}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 dark:text-slate-500">{applicants} {tr.applicants}</span>
          <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">{tr.open}</span>
          <span className="text-gray-400 dark:text-slate-500">{timeAgo(job.created_at)}</span>
        </div>
      </div>

      {/* Apply Now button */}
      <button
        onClick={onClick}
        className="w-full h-10 rounded-full bg-emerald-500 text-white text-sm font-semibold active:scale-[0.98] transition-transform shadow-sm shadow-emerald-500/30"
      >
        {tr.applyNow}
      </button>
    </div>
  );
}

function JobSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 space-y-3">
      <div className="flex justify-between">
        <div className="h-4 skeleton rounded w-2/3" />
        <div className="h-4 skeleton rounded w-12" />
      </div>
      <div className="h-3 skeleton rounded w-full" />
      <div className="h-3 skeleton rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 skeleton rounded-full w-20" />
        <div className="h-5 skeleton rounded-full w-16" />
      </div>
      <div className="h-10 skeleton rounded-full w-full" />
    </div>
  );
}
