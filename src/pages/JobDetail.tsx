import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJob, useApplyJob } from '../hooks/useJobs';
import { useAuthStore } from '../store/authStore';
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Clock, 
  Briefcase,
  MessageCircle,
  User,
  Loader2,
  CheckCircle
} from 'lucide-react';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data, isLoading } = useJob(id!);
  const applyMutation = useApplyJob();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');

  const job = data?.job;
  const applications = data?.applications || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-400">Job not found</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">Go Home</button>
      </div>
    );
  }

  const isOwner = user?.id === job.posted_by;
  const hasApplied = applications.some((a: any) => a.freelancer_id === user?.id);

  const handleApply = async () => {
    if (!applyMessage.trim()) return;
    await applyMutation.mutateAsync({ jobId: id!, message: applyMessage });
    setShowApplyModal(false);
    setApplyMessage('');
  };

  return (
    <div className="pb-4">
      {/* Header Image / Gradient */}
      <div className="h-32 bg-gradient-to-br from-emerald-600 to-emerald-900 relative">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full bg-black/30 backdrop-blur text-white"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="px-4 -mt-8 relative z-10">
        {/* Status Badge */}
        <div className="flex justify-between items-start mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            job.status === 'open' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
            job.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
            job.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
            'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            {job.status.replace('_', ' ')}
          </span>
          <span className="text-emerald-400 font-bold text-lg">{job.budget} Pi</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">{job.title}</h1>

        {/* Client Info */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <User size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{job.posted_by_name || 'Anonymous'}</p>
            <p className="text-xs text-slate-400">Client</p>
          </div>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Briefcase size={14} />
              Category
            </div>
            <p className="text-white font-medium">{job.category}</p>
          </div>
          {job.location && (
            <div className="card p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <MapPin size={14} />
                Location
              </div>
              <p className="text-white font-medium">{job.location}</p>
            </div>
          )}
          {job.deadline && (
            <div className="card p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock size={14} />
                Deadline
              </div>
              <p className="text-white font-medium">{new Date(job.deadline).toLocaleDateString()}</p>
            </div>
          )}
          <div className="card p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <DollarSign size={14} />
              Budget
            </div>
            <p className="text-white font-medium">{job.budget} Pi</p>
          </div>
        </div>

        {/* Description */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
          <p className="text-slate-300 whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* Images */}
        {job.images && job.images.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Images</h2>
            <div className="grid grid-cols-2 gap-2">
              {job.images.map((img, i) => (
                <img key={i} src={img} alt="" className="rounded-xl w-full h-40 object-cover bg-slate-700" />
              ))}
            </div>
          </div>
        )}

        {/* Applications */}
        {isOwner && applications.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Applications ({applications.length})</h2>
            <div className="space-y-3">
              {applications.map((app: any) => (
                <div key={app.id} className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-emerald-400" />
                    <span className="text-sm font-medium text-white">{app.freelancer_name || app.freelancer_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      app.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      app.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{app.status}</span>
                  </div>
                  <p className="text-sm text-slate-300">{app.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apply Button */}
        {!isOwner && job.status === 'open' && (
          <div className="sticky bottom-20 z-30">
            {hasApplied ? (
              <div className="flex items-center justify-center gap-2 py-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <CheckCircle size={20} className="text-emerald-400" />
                <span className="text-emerald-400 font-medium">You have applied</span>
              </div>
            ) : (
              <button 
                onClick={() => setShowApplyModal(true)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Apply Now
              </button>
            )}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md p-4 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-3">Apply for this job</h3>
            <textarea
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="Write your cover letter..."
              className="input h-32 resize-none mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowApplyModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button 
                onClick={handleApply}
                disabled={!applyMessage.trim() || applyMutation.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {applyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
