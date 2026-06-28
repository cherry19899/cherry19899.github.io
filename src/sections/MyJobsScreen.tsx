import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { ChatShimmer } from '../components/Shimmer';
import { Badge } from '../components/ui/badge';
import { getUserJobs, myApplications } from '../lib/api';
import { formatBudget, timeAgo } from '../lib/utils';

interface User {
  uid: string;
  username: string;
}

interface MyJobsScreenProps {
  t: TFunction;
  user: User;
  onOpenJob: (jobId: number) => void;
}

type Tab = 'posted' | 'applied';

export default function MyJobsScreen({ t, user, onOpenJob }: MyJobsScreenProps) {
  const [tab, setTab] = useState<Tab>('posted');
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [applications, setApplicationsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleDelete = (e: any) => {
      setPostedJobs(prev => prev.filter(j => j.id !== e.detail?.jobId));
    };
    window.addEventListener('workpro-job-deleted', handleDelete);
    return () => window.removeEventListener('workpro-job-deleted', handleDelete);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobs, apps] = await Promise.all([
        getUserJobs(user.username).catch(() => ({ jobs: [] })),
        myApplications().catch(() => []),
      ]);
      setPostedJobs((jobs as any).jobs || jobs || []);
      setApplicationsData((apps as any).applications || apps || []);
    } finally {
      setLoading(false);
    }
  };

  const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'success' => {
    if (status === 'open') return 'default';
    if (status === 'in_progress') return 'success';
    if (status === 'completed') return 'success';
    if (status === 'expired' || status === 'cancelled') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="animate-fade-in">
      {/* Tab switcher */}
      <div className="flex p-4 gap-2">
        {(['posted', 'applied'] as Tab[]).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              tab === tabKey
                ? 'bg-emerald-500 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {tabKey === 'posted' ? t('postedJobs') : t('myApplications')}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3 pb-20">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <ChatShimmer key={i} />)
        ) : tab === 'posted' ? (
          postedJobs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">📋</p>
              <p>{t('noPosted')}</p>
            </div>
          ) : (
            postedJobs.map(job => (
              <div
                key={job.id}
                onClick={() => onOpenJob(job.id)}
                className="p-4 rounded-xl bg-card border border-border space-y-2 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm flex-1">{job.title}</h3>
                  <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatBudget(job.budget)}</span>
                  <span>{job.applicants_count || 0} {t('applicants')}</span>
                  <span>{timeAgo(job.created_at)}</span>
                </div>
              </div>
            ))
          )
        ) : (
          applications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">📝</p>
              <p>{t('noApplicationsYet') || t('noApplications')}</p>
            </div>
          ) : (
            applications.map((app: any) => (
              <div
                key={app.id}
                onClick={() => app.job_id && onOpenJob(app.job_id)}
                className="p-4 rounded-xl bg-card border border-border space-y-2 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm flex-1">{app.job_title || `Job #${app.job_id}`}</h3>
                  <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
                </div>
                {app.cover_letter && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{app.cover_letter}</p>
                )}
                <p className="text-xs text-muted-foreground">{timeAgo(app.created_at)}</p>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
