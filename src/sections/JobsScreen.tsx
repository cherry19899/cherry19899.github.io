import React, { useState, useEffect, useCallback } from 'react';
import { TFunction, CATEGORIES } from '../hooks/useTranslation';
import { JobCardShimmer } from '../components/Shimmer';
import StarRating from '../components/StarRating';
import { getJobs } from '../lib/api';
import { formatBudget, timeAgo, truncate } from '../lib/utils';

interface User {
  uid: string;
  username: string;
  balance_pi?: number;
  connects?: number;
}

interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;
  category: string;
  skills?: string[];
  status: string;
  created_at: string;
  client_username?: string;
  applicants_count?: number;
  connects_required?: number;
  images?: string[];
  is_urgent?: boolean;
  rating?: number;
}

interface JobsScreenProps {
  t: TFunction;
  user: User;
  onOpenJob: (jobId: number) => void;
  onPostJob: () => void;
  onOpenPortfolio?: (userId: string) => void;
}

const SORT_OPTIONS = [
  { key: 'newest', labelKey: 'sortNewest' },
  { key: 'budget_low', labelKey: 'sortBudgetLow' },
  { key: 'budget_high', labelKey: 'sortBudgetHigh' },
  { key: 'popular', labelKey: 'sortPopular' },
];

export default function JobsScreen({ t, user, onOpenJob, onPostJob }: JobsScreenProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('workpro_bookmarks') || '[]'); }
    catch { return []; }
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async (p = 1) => {
    setLoading(p === 1);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      if (sort) params.set('sort', sort);
      if (minBudget) params.set('min_budget', minBudget);
      if (maxBudget) params.set('max_budget', maxBudget);
      params.set('page', String(p));
      const data = await getJobs(params.toString());
      const list = data.jobs || data || [];
      setJobs(p === 1 ? list : prev => [...prev, ...list]);
      setTotalPages(data.total_pages || 1);
      setPage(p);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [category, search, sort, minBudget, maxBudget]);

  useEffect(() => { loadJobs(1); }, [loadJobs]);

  const toggleBookmark = (id: number) => {
    const next = bookmarks.includes(id) ? bookmarks.filter(b => b !== id) : [...bookmarks, id];
    setBookmarks(next);
    localStorage.setItem('workpro_bookmarks', JSON.stringify(next));
  };

  const displayJobs = showBookmarks ? jobs.filter(j => bookmarks.includes(j.id)) : jobs;

  const connects = parseInt(localStorage.getItem('workpro_connects') || '0');

  return (
    <div className="animate-fade-in pb-24">
      {/* Sub-header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 pt-3">
        {/* Greeting + Balance row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const h = new Date().getHours();
                return h < 12 ? t('goodMorning') : h < 17 ? t('goodAfternoon') : t('goodEvening');
              })()}
            </p>
            <p className="text-xl font-black text-foreground leading-tight">Find Work</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-base font-bold text-emerald-500">
              {Number(user.balance_pi ?? 0).toFixed(0)} π
            </p>
            <p className="text-xs text-muted-foreground">{connects} Connects</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchJobs')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Category pills — bookmark icon + All (active green) + others */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide">
          <button
            onClick={() => setShowBookmarks(b => !b)}
            className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
              showBookmarks ? 'bg-amber-500/20 border-amber-400 text-amber-400' : 'border-border text-muted-foreground'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={showBookmarks ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                category === c.key
                  ? 'bg-emerald-500 text-white'
                  : 'border border-border text-foreground'
              }`}
            >
              {t(c.label)}
            </button>
          ))}
        </div>

        {/* Jobs count + sort row */}
        <div className="flex items-center justify-between pb-3">
          <p className="text-sm font-semibold text-foreground">
            {jobs.length} {t('jobs') || 'Jobs'}
          </p>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
            </button>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="py-1.5 px-2 rounded-lg border border-border text-xs text-foreground bg-background"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{t(o.labelKey) || o.key}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hidden advanced filters (kept for functionality) */}
        <div className="hidden">
          <input value={minBudget} onChange={e => setMinBudget(e.target.value)} type="number" />
          <input value={maxBudget} onChange={e => setMaxBudget(e.target.value)} type="number" />
          <button
            onClick={() => setShowBookmarks(b => !b)}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold ${showBookmarks ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground'}`}
          >
            🔖
          </button>
        </div>
      </div>

      {/* Job list */}
      <div className="p-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <JobCardShimmer key={i} />)
        ) : displayJobs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🔍</p>
            <p>{showBookmarks ? t('noBookmarks') : t('noJobs')}</p>
          </div>
        ) : (
          displayJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              t={t}
              bookmarked={bookmarks.includes(job.id)}
              onToggleBookmark={() => toggleBookmark(job.id)}
              onOpen={() => onOpenJob(job.id)}
            />
          ))
        )}

        {/* Load more */}
        {!loading && page < totalPages && (
          <button
            onClick={() => loadJobs(page + 1)}
            className="w-full py-3 text-sm text-emerald-500 font-semibold"
          >
            Load more
          </button>
        )}
      </div>

      {/* FAB: Post Job */}
      <button
        onClick={onPostJob}
        className="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Post a job"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  );
}

interface JobCardProps {
  job: Job;
  t: TFunction;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onOpen: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  development: 'bg-blue-500/10 text-blue-500',
  dev: 'bg-blue-500/10 text-blue-500',
  design: 'bg-purple-500/10 text-purple-500',
  writing: 'bg-amber-500/10 text-amber-500',
  marketing: 'bg-rose-500/10 text-rose-500',
  other: 'bg-slate-500/10 text-slate-500',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  disputed: 'Disputed',
};

function JobCard({ job, t, bookmarked, onToggleBookmark, onOpen }: JobCardProps) {
  const catKey = (job.category || 'other').toLowerCase();
  const catColor = CATEGORY_COLORS[catKey] || CATEGORY_COLORS.other;
  const authorInitial = (job.client_username || '?')[0].toUpperCase();

  return (
    <div
      className="rounded-2xl bg-card border border-border overflow-hidden cursor-pointer active:scale-[0.99] transition-transform shadow-sm"
      onClick={onOpen}
    >
      <div className="p-4 space-y-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-base text-foreground leading-snug flex-1">{job.title}</h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-base font-bold text-emerald-500">{formatBudget(job.budget)}</span>
            <button
              onClick={e => { e.stopPropagation(); onToggleBookmark(); }}
              className="text-muted-foreground"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{truncate(job.description, 80)}</p>
        )}

        {/* Category tag */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${catColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {job.category || 'Other'}
          </span>
          {job.is_urgent && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500">Urgent</span>
          )}
        </div>

        {/* Author row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-600">
              {authorInitial}
            </div>
            <span className="text-xs font-medium text-foreground">{job.client_username || '—'}</span>
            {job.rating && job.rating > 0 && (
              <>
                <span className="text-amber-400 text-xs">★</span>
                <span className="text-xs text-muted-foreground">{job.rating.toFixed(1)}</span>
              </>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo(job.created_at)}</span>
        </div>

        {/* Applicants + Status row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-500">
            {job.applicants_count ?? 0} Applicants
          </span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
            job.status === 'open'
              ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
              : job.status === 'in_progress'
              ? 'border-blue-500/30 text-blue-500 bg-blue-500/5'
              : 'border-border text-muted-foreground'
          }`}>
            {STATUS_LABELS[job.status] || job.status}
          </span>
        </div>
      </div>

      {/* Apply Now button */}
      {job.status === 'open' && (
        <button
          onClick={e => { e.stopPropagation(); onOpen(); }}
          className="w-full py-3 text-sm font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors border-t border-emerald-500/10"
        >
          Apply Now
        </button>
      )}
    </div>
  );
}
