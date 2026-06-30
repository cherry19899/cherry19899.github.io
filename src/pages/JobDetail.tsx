import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJob, getApplicationsForJob, applyToJob, hireApplication, startChat } from '../lib/api';
import type { Job, Application } from '../types';
import { useAppAuth, useToastCtx } from '../App';
import Modal from '../components/Modal';
import { CAT_COLORS } from '../lib/constants';

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
  const { user } = useAppAuth();
  const { toast } = useToastCtx();
  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [message, setMessage] = useState('');
  const [bidAmount, setBidAmount] = useState('');

  const isOwner = user && (user.uid === job?.posted_by || `pi_${job?.posted_by}` === user.uid || job?.posted_by === user.uid);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getJob(id).catch(() => null),
      getApplicationsForJob(id).catch(() => []),
    ]).then(([j, a]) => {
      setJob(j?.job || j);
      setApps(a?.applications || a || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!user) { toast('Sign in to apply', 'error'); return; }
    setApplying(true);
    try {
      await applyToJob(id!, { message, bid_amount: bidAmount ? Number(bidAmount) : undefined });
      toast('Application sent!', 'success');
      setShowApply(false);
      setMessage(''); setBidAmount('');
      // refresh apps
      getApplicationsForJob(id!).then((a: any) => setApps(a?.applications || a || [])).catch(() => {});
    } catch (e: any) {
      toast(e.message || 'Failed to apply', 'error');
    } finally { setApplying(false); }
  };

  const handleHire = async (app: Application) => {
    try {
      await hireApplication(id!, { application_id: app.id, freelancer_id: app.freelancer_id });
      toast(`Hired @${app.freelancer_username}!`, 'success');
      setJob(j => j ? { ...j, status: 'in_progress', hired_freelancer_id: app.freelancer_id } : j);
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'accepted' } : a));
    } catch (e: any) { toast(e.message || 'Failed to hire', 'error'); }
  };

  const handleChat = async (withUid: string) => {
    try {
      const d = await startChat({ job_id: Number(id), other_uid: withUid });
      nav(`/chat/${d.room_id || d.id}`);
    } catch (e: any) { toast(e.message || 'Failed to open chat', 'error'); }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-3/4" />
        <div className="h-4 bg-slate-800 rounded w-1/4" />
        <div className="h-24 bg-slate-800 rounded" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center pt-20 gap-4">
        <p className="text-slate-400">Job not found</p>
        <button onClick={() => nav('/')} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold">Go Home</button>
      </div>
    );
  }

  const catColor = CAT_COLORS[job.category?.toLowerCase() || 'other'] || CAT_COLORS.other;
  const alreadyApplied = apps.some(a => a.freelancer_id === user?.uid || a.freelancer_id === user?.id);

  return (
    <div className="max-w-lg mx-auto p-4 pb-28 space-y-4 animate-fade-in">
      {/* Back */}
      <button onClick={() => nav(-1)} className="flex items-center gap-2 text-slate-400 text-sm">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back
      </button>

      {/* Main card */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-black text-xl text-white leading-tight flex-1">{job.title}</h1>
          <span className="text-emerald-400 font-bold text-xl shrink-0">{job.budget} π</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor}`}>{job.category}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            job.status === 'open' ? 'border-emerald-500/40 text-emerald-400' :
            job.status === 'in_progress' ? 'border-blue-500/40 text-blue-400' :
            'border-slate-600 text-slate-400'
          }`}>{job.status.replace('_', ' ')}</span>
          {job.is_urgent && <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-semibold">Urgent</span>}
        </div>

        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>

        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(Array.isArray(job.skills) ? job.skills : [job.skills])
              .flatMap(s => (typeof s === 'string' ? s.split(',').map(x => x.trim()) : [s]))
              .filter(Boolean)
              .map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{s}</span>
              ))
            }
          </div>
        )}

        <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
          <span>@{job.client_username || 'unknown'}</span>
          <span>{job.applicants_count ?? 0} applicants</span>
          {(job.apply_cost ?? 0) > 0 && <span>{job.apply_cost} connects to apply</span>}
          <span>{timeAgo(job.created_at)}</span>
        </div>
      </div>

      {/* Apply button */}
      {job.status === 'open' && user && !isOwner && (
        <button
          onClick={() => alreadyApplied ? toast('Already applied!', 'info') : setShowApply(true)}
          className={`w-full py-4 rounded-xl font-bold text-white transition-colors ${
            alreadyApplied ? 'bg-slate-700 text-slate-400 cursor-default' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {alreadyApplied ? '✓ Already Applied' : 'Apply Now'}
        </button>
      )}

      {/* Chat with hired freelancer (job owner) */}
      {isOwner && job.status === 'in_progress' && job.hired_freelancer_id && (
        <button
          onClick={() => handleChat(job.hired_freelancer_id!)}
          className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
        >
          💬 Chat with freelancer
        </button>
      )}

      {/* Applications list (owner/admin) */}
      {(isOwner || isAdmin) && apps.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-bold text-white">Applications ({apps.length})</h2>
          {apps.map(app => (
            <div key={app.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-sm">@{app.freelancer_username || app.freelancer_id}</span>
                <div className="flex items-center gap-2">
                  {app.bid_amount && <span className="text-emerald-400 font-bold text-sm">{app.bid_amount} π</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    app.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                    app.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>{app.status}</span>
                </div>
              </div>
              {app.message && <p className="text-slate-400 text-xs leading-relaxed">{app.message}</p>}
              {app.status === 'pending' && isOwner && job.status === 'open' && (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => handleHire(app)} className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold">
                    Hire
                  </button>
                  <button onClick={() => handleChat(app.freelancer_id)} className="flex-1 py-2 rounded-lg bg-slate-700 text-white text-xs font-semibold">
                    Chat
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apply modal */}
      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply to job">
        <div className="space-y-4">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Introduce yourself and describe your approach…"
            rows={4}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500"
          />
          <input
            value={bidAmount}
            onChange={e => setBidAmount(e.target.value)}
            type="number"
            placeholder={`Bid in Pi (budget: ${job.budget} π)`}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleApply}
            disabled={applying || !message.trim()}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold disabled:opacity-60"
          >
            {applying ? 'Sending…' : 'Send Application'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
