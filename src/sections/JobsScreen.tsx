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
    <div className="animate-fade-in pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-border px-4 pt-safe">
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const h = new Date().getHours();
                return h < 12 ? t('goodMorning') : h < 17 ? t('goodAfternoon') : t('goodEvening');
              })()}, {user.username}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {connects} connects · π{user.balance_pi?.toFixed(2) ?? '—'}
            </p>
          </div>
          <button
            onClick={onPostJob}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold"
          >
            + {t('postJob')}
          </button>
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

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                category === c.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t(c.label)}
            </button>
          ))}
        </div>

        {/* Sort + bookmarks row */}
        <div className="flex items-center gap-2 pb-3">
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="flex-1 py-1.5 px-2 rounded-lg bg-muted border border-border text-xs text-foreground"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{t(o.labelKey)}</option>
            ))}
          </select>
          <input
            value={minBudget}
            onChange={e => setMinBudget(e.target.value)}
            placeholder={t('minBudget')}
            type="number"
            className="w-20 py-1.5 px-2 rounded-lg bg-muted border border-border text-xs"
          />
          <input
            value={maxBudget}
            onChange={e => setMaxBudget(e.target.value)}
            placeholder={t('maxBudget')}
            type="number"
            className="w-20 py-1.5 px-2 rounded-lg bg-muted border border-border text-xs"
          />
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

function JobCard({ job, t, bookmarked, onToggleBookmark, onOpen }: JobCardProps) {
  return (
    <div
      className="p-4 rounded-xl bg-card border border-border space-y-2 cursor-pointer active:scale-[0.99] transition-transform"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-snug flex-1">{job.title}</h3>
        <button
          className={`text-lg flex-shrink-0 ${bookmarked ? 'text-amber-400' : 'text-muted-foreground'}`}
          onClick={e => { e.stopPropagation(); onToggleBookmark(); }}
        >
          {bookmarked ? '🔖' : '🔲'}
        </button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{truncate(job.description, 100)}</p>

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-500">{formatBudget(job.budget)}</span>
        <span className="text-xs text-muted-foreground">{timeAgo(job.created_at)}</span>
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.skills.slice(0, 4).map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {job.is_urgent && (
          <span className="text-red-400 font-semibold">{t('urgent')}</span>
        )}
        {job.applicants_count !== undefined && (
          <span>{job.applicants_count} {t('applicants')}</span>
        )}
        {job.rating && job.rating > 0 && (
          <StarRating value={job.rating} size={12} />
        )}
      </div>
    </div>
  );
}
