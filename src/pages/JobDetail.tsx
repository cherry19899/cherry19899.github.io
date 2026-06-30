import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJob, applyToJob } from '../lib/api';
import { useAppCtx } from '../App';
import { toast } from '../components/Toast';
import { CAT_COLORS } from '../lib/constants';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAppCtx();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [proposal, setProposal] = useState('');

  useEffect(() => {
    if (!id) return;
    getJob(id).then(d => setJob(d?.job || d)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!proposal.trim()) { toast('Write a proposal first', 'error'); return; }
    setApplying(true);
    try {
      await applyToJob(id!, { proposal });
      toast('Application sent!', 'success');
      nav('/my-jobs');
    } catch (e: any) {
      toast(e.message || 'Failed to apply', 'error');
    } finally { setApplying(false); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header back />

      <div className="flex-1 max-w-lg mx-auto w-full p-4 pb-24 animate-fade-in">
        {loading ? (
          <div className="space-y-4">
            <div className="h-8 skeleton rounded w-3/4" />
            <div className="h-4 skeleton rounded w-1/4" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 skeleton rounded" />)}
            </div>
          </div>
        ) : !job ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-3">😕</span>
            <p className="font-semibold text-gray-900">Job not found</p>
          </div>
        ) : (
          <>
            {/* Header info */}
            <div className="mb-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h1 className="text-xl font-bold text-gray-900 leading-snug flex-1">{job.title}</h1>
                <span className="text-emerald-500 font-bold text-lg shrink-0">{job.budget} π</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`text-xs font-semibold px-3 py-0.5 rounded-full ${CAT_COLORS[job.category?.toLowerCase() || 'other'] || CAT_COLORS.other}`}>
                  {job.category}
                </span>
                {job.is_urgent && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-500">Urgent</span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>@{job.client_username || 'unknown'}</span>
                <span>{job.applicants_count ?? 0} applicants</span>
                <span>{timeAgo(job.created_at)}</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(job.skills) ? job.skills : job.skills.split(',')).map((s: string) => (
                    <span key={s} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Apply */}
            {user && user.uid !== job.client_uid && job.status === 'open' && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Proposal</p>
                <textarea
                  value={proposal}
                  onChange={e => setProposal(e.target.value)}
                  placeholder="Describe how you'll solve this, your timeline, etc."
                  rows={4}
                  className="w-full bg-gray-100 border border-transparent rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 resize-none"
                />
                {(job.apply_cost ?? 0) > 0 && (
                  <p className="text-xs text-gray-400">Costs {job.apply_cost} connects to apply</p>
                )}
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-60 transition-colors"
                >
                  {applying ? 'Applying…' : 'Apply Now'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
