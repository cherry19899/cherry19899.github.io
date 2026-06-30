import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyJobs, getMyJobsAsFreelancer } from '../lib/api';
import type { Job } from '../types';
import { useAppAuth } from '../App';
import { CAT_COLORS } from '../lib/constants';
import { SkeletonCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

type Tab = 'posted' | 'hired';

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    open: 'border-emerald-500/40 text-emerald-400',
    in_progress: 'border-blue-500/40 text-blue-400',
    completed: 'border-slate-500/40 text-slate-400',
    cancelled: 'border-red-500/40 text-red-400',
    disputed: 'border-amber-500/40 text-amber-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls[status] || cls.open}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function MyJobsPage() {
  const nav = useNavigate();
  const { user } = useAppAuth();
  const [tab, setTab] = useState<Tab>('posted');
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [hiredJobs, setHiredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMyJobs().catch(() => []),
      getMyJobsAsFreelancer().catch(() => []),
    ]).then(([posted, hired]) => {
      setPostedJobs(posted?.jobs || posted || []);
      setHiredJobs(hired?.jobs || hired || []);
    }).finally(() => setLoading(false));
  }, []);

  const jobs = tab === 'posted' ? postedJobs : hiredJobs;

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['posted', 'hired'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              tab === t ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {t === 'posted' ? `Posted (${postedJobs.length})` : `Hired (${hiredJobs.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="💼"
          title={tab === 'posted' ? 'No jobs posted yet' : 'Not hired yet'}
          subtitle={tab === 'posted' ? 'Post your first job to find freelancers' : 'Apply to jobs to get hired'}
          action={
            tab === 'posted' ? (
              <button onClick={() => nav('/post-job')} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold">
                Post a Job
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const catColor = CAT_COLORS[job.category?.toLowerCase() || 'other'] || CAT_COLORS.other;
            return (
              <div
                key={job.id}
                onClick={() => nav(`/job/${job.id}`)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white leading-snug flex-1">{job.title}</h3>
                  <span className="text-emerald-400 font-bold text-sm shrink-0">{job.budget} π</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${catColor}`}>{job.category}</span>
                  <StatusBadge status={job.status} />
                </div>
                {tab === 'hired' && job.client_username && (
                  <p className="text-xs text-slate-500">Client: @{job.client_username}</p>
                )}
                {tab === 'posted' && (
                  <p className="text-xs text-slate-500">{job.applicants_count ?? 0} applicants</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
