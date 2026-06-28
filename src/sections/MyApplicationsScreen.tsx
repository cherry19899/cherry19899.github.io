import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { myApplications } from '../lib/api';
import { Badge } from '../components/ui/badge';
import { timeAgo } from '../lib/utils';

interface MyApplicationsScreenProps {
  t: TFunction;
  onBack: () => void;
  onOpenJob?: (jobId: number) => void;
}

export default function MyApplicationsScreen({ t, onBack, onOpenJob }: MyApplicationsScreenProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    myApplications()
      .then(d => setApplications(d.applications || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const variant = (s: string): 'default' | 'secondary' | 'destructive' | 'success' => {
    if (s === 'accepted') return 'success';
    if (s === 'rejected') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in overflow-y-auto">
      <div className="sticky top-0 glass border-b border-border px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-bold text-base">{t('myApplications')}</h1>
      </div>

      <div className="p-4 space-y-3 pb-8">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">📝</p>
            <p>{t('noApplications')}</p>
          </div>
        ) : (
          applications.map((app: any) => (
            <div
              key={app.id}
              onClick={() => app.job_id && onOpenJob?.(app.job_id)}
              className="p-4 rounded-xl bg-card border border-border space-y-2 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm flex-1">{app.job_title || `Job #${app.job_id}`}</h3>
                <Badge variant={variant(app.status)}>{app.status}</Badge>
              </div>
              {app.cover_letter && (
                <p className="text-xs text-muted-foreground line-clamp-2">{app.cover_letter}</p>
              )}
              <p className="text-xs text-muted-foreground">{timeAgo(app.created_at)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
