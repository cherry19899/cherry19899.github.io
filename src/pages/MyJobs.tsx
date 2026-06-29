import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyJobs } from '../hooks/useJobs';
import JobCard from '../components/JobCard';
import EmptyState from '../components/EmptyState';
import { Briefcase, Loader2, Plus } from 'lucide-react';

type Tab = 'posted' | 'applied';

export default function MyJobs() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('posted');
  const { data: jobs, isLoading } = useMyJobs();

  const userId = JSON.parse(localStorage.getItem('workpro_user') || '{}').id;

  const filtered = (jobs || []).filter(job => {
    if (tab === 'posted') return job.posted_by === userId;
    return job.hired_freelancer_id === userId;
  });

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('posted')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'posted' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          Posted
        </button>
        <button
          onClick={() => setTab('applied')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'applied' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          Hired
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-emerald-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title={tab === 'posted' ? 'No jobs posted' : 'No hired jobs'}
          description={tab === 'posted' ? 'Post your first job to find freelancers' : 'Apply to jobs to get hired'}
          action={
            tab === 'posted' ? (
              <button onClick={() => navigate('/create-job')} className="btn-primary flex items-center gap-2">
                <Plus size={16} />
                Post a Job
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
