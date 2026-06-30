import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../lib/api';
import type { Job } from '../types';
import { useAppAuth } from '../App';
import { CATEGORIES, CAT_COLORS } from '../lib/constants';
import { SkeletonCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HomePage() {
  const { user } = useAppAuth();
  const nav = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (p = 1, replace = true) => {
    if (p === 1) setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20', sort });
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      const data = await getJobs(params.toString());
      const list: Job[] = data?.jobs || data || [];
      setJobs(prev => replace ? list : [...prev, ...list]);
      setHasMore(list.length === 20);
      setPage(p);
    } catch {}
    finally { setLoading(false); }
  }, [category, sort, search]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, true), search ? 300 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [load]);

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      {/* Sub-header */}
      <div className="sticky top-[calc(3.5rem+1.75rem)] z-30 bg-white px-4 pt-3 pb-0 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400">
              {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })()}
            </p>
            <p className="text-lg font-black text-gray-900">Find Work</p>
          </div>
          {user && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Connects</p>
              <p className="text-base font-bold text-emerald-500">{user.balance_connects ?? 0}</p>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-100 border border-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                category === c.key ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pb-3">
          <p className="text-xs text-gray-500">{jobs.length} jobs</p>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-xs bg-gray-100 border border-gray-200 text-gray-700 rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="budget_high">Budget ↑</option>
            <option value="budget_low">Budget ↓</option>
          </select>
        </div>
      </div>

      {/* Job list */}
      <div className="p-4 space-y-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : jobs.length === 0
            ? <EmptyState icon="🔍" title="No jobs found" subtitle="Try a different search or category" />
            : jobs.map(job => (
                <JobCard key={job.id} job={job} onClick={() => nav(`/job/${job.id}`)} />
              ))
        }
        {!loading && hasMore && (
          <button onClick={() => load(page + 1, false)} className="w-full py-3 text-sm text-emerald-500 font-semibold">
            Load more
          </button>
        )}
      </div>

      {/* FAB */}
      {user && (
        <button
          onClick={() => nav('/post-job')}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Post a job"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      )}
    </div>
  );
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const catColor = CAT_COLORS[job.category?.toLowerCase() || 'other'] || CAT_COLORS.other;
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2 cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 leading-snug flex-1">{job.title}</h3>
        <span className="text-emerald-500 font-bold text-sm shrink-0">{job.budget} π</span>
      </div>
      {job.description && (
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{job.description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-semibold px-3 py-0.5 rounded-full ${catColor}`}>{job.category}</span>
        {job.is_urgent && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-500">Urgent</span>}
        {(job.apply_cost ?? 0) > 0 && <span className="text-xs text-gray-400">{job.apply_cost} connects</span>}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>@{job.client_username || 'unknown'}</span>
        <div className="flex items-center gap-3">
          <span>{job.applicants_count ?? 0} applicants</span>
          <span>{timeAgo(job.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
