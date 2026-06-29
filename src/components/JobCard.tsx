import { useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { MapPin, DollarSign, Clock, Briefcase } from 'lucide-react';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const navigate = useNavigate();

  const statusColors: Record<string, string> = {
    open: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    disputed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div 
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="card cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate pr-2">{job.title}</h3>
          <p className="text-sm text-slate-400 mt-0.5">{job.posted_by_name || 'Anonymous'}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[job.status] || statusColors.open}`}>
          {job.status.replace('_', ' ')}
        </span>
      </div>

      {/* Description preview */}
      <p className="text-sm text-slate-400 line-clamp-2 mb-3">{job.description}</p>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <DollarSign size={12} className="text-emerald-400" />
          {job.budget} Pi
        </span>
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {job.location}
          </span>
        )}
        {job.deadline && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {new Date(job.deadline).toLocaleDateString()}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Briefcase size={12} />
          {job.category}
        </span>
      </div>

      {/* Images preview */}
      {job.images && job.images.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {job.images.slice(0, 3).map((img, i) => (
            <img 
              key={i} 
              src={img} 
              alt="" 
              className="w-16 h-16 rounded-lg object-cover bg-slate-700 shrink-0"
              loading="lazy"
            />
          ))}
          {job.images.length > 3 && (
            <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center text-xs text-slate-400 shrink-0">
              +{job.images.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
