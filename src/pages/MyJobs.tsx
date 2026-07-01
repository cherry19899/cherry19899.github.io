import React, { useState, useEffect } from 'react';
import { t } from '../lib/i18n';
import { useNavigate } from 'react-router-dom';
import { getMyJobs, getMyJobsAsFreelancer } from '../lib/api';
import { CAT_COLORS } from '../lib/constants';

interface Job { id: number; title: string; budget: number; category?: string; status?: string; created_at: string; }

const STATUS_STYLE: Record<string, string> = {
  open:        'bg-emerald-100 text-emerald-600',
  in_progress: 'bg-blue-100 text-blue-600',
  completed:   'bg-gray-100 text-gray-500',
  cancelled:   'bg-red-100 text-red-500',
  disputed:    'bg-amber-100 text-amber-600',
};

export default function MyJobsPage() {
  const tr = t();
  const nav = useNavigate();
  const [tab, setTab] = useState<'posted' | 'hired'>('posted');
  const [posted, setPosted] = useState<Job[]>([]);
  const [hired, setHired] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMyJobs().catch(() => []),
      getMyJobsAsFreelancer().catch(() => []),
    ]).then(([p, h]) => {
      setPosted(p?.jobs || p || []);
      setHired(h?.jobs || h || []);
    }).finally(() => setLoading(false));
  }, []);

  const jobs = tab === 'posted' ? posted : hired;

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in pb-24 bg-white dark:bg-slate-900 min-h-screen">
      <div className="flex gap-2 mb-4">
        {(['posted', 'hired'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              tab === t ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
            }`}
          >
            {t === 'posted' ? `Размещено (${posted.length})` : `Нанято (${hired.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-3">📋</span>
          <p className="font-semibold text-gray-900 dark:text-white">{tr.noJobsYet}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const catColor = CAT_COLORS[job.category?.toLowerCase() || 'other'] || CAT_COLORS.other;
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
                  <span className={`text-xs font-semibold px-3 py-0.5 rounded-full ${catColor}`}>{job.category}</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusCls}`}>
                    {(job.status || 'open').replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
