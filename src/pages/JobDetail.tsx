import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJob, getJobApplications, applyToJob, acceptApplication, rejectApplication, createEscrow, startChat } from '../lib/api';
import { useAppCtx } from '../App';
import { toast } from '../components/Toast';
import { CAT_COLORS } from '../lib/constants';
import { createPiPayment } from '../lib/pi';

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type View = 'detail' | 'apply' | 'applicants';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user, updateUser } = useAppCtx();
  const [job, setJob] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('detail');
  const [proposal, setProposal] = useState('');
  const [applying, setApplying] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [hiringId, setHiringId] = useState<number | null>(null);

  const isOwner = job && user && (job.client_uid === user.uid || job.client_id === user.uid);

  useEffect(() => {
    if (!id) return;
    getJob(id)
      .then(d => setJob(d?.job || d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const loadApps = async () => {
    if (!id) return;
    try {
      const d = await getJobApplications(id);
      setApps(d?.applications || d || []);
    } catch {}
  };

  useEffect(() => {
    if (view === 'applicants' && isOwner) loadApps();
  }, [view, isOwner]);

  // ── Apply flow ────────────────────────────────────────────────────────────

  const handleApply = async () => {
    if (!proposal.trim()) { toast('Write a proposal first', 'error'); return; }
    setApplying(true);
    try {
      await applyToJob(id!, { proposal, job_id: Number(id) });
      toast('Application sent! ✅', 'success');
      nav('/my-jobs');
    } catch (e: any) {
      toast(e.message || 'Failed to apply', 'error');
    } finally { setApplying(false); }
  };

  // ── Hire flow: accept app → create escrow with Pi payment ─────────────────

  const handleHire = async (app: any) => {
    setHiringId(app.id);
    try {
      // 1. Accept the application
      await acceptApplication(app.id);
      toast(`Hiring @${app.applicant_username}…`, 'info');

      // 2. Create escrow record
      const escrow = await createEscrow({
        job_id: Number(id),
        freelancer_uid: app.applicant_uid || app.applicant_id,
        amount: job.budget,
      });

      // 3. Pay via Pi SDK
      createPiPayment(
        job.budget,
        `Escrow: ${job.title}`,
        { type: 'escrow_fund', escrow_id: escrow.id, job_id: id },
        {
          onCompleted: async (_pid, txid) => {
            try {
              const { fundEscrow } = await import('../lib/api');
              await fundEscrow(escrow.id, { txid });
              toast('Escrow funded! Job started 🚀', 'success');
              setJob((prev: any) => prev ? { ...prev, status: 'in_progress' } : prev);
            } catch (e: any) { toast(e.message, 'error'); }
          },
          onCancelled: () => toast('Payment cancelled', 'info'),
          onError: (e: any) => toast(e.message || 'Payment failed', 'error'),
        }
      );
    } catch (e: any) {
      toast(e.message || 'Failed to hire', 'error');
    } finally { setHiringId(null); }
  };

  const handleReject = async (appId: number) => {
    setActing(String(appId));
    try {
      await rejectApplication(appId);
      setApps(prev => prev.filter(a => a.id !== appId));
      toast('Application rejected', 'info');
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setActing(null); }
  };

  const handleChat = async (app: any) => {
    try {
      const room = await startChat({ user_id: app.applicant_uid || app.applicant_id, job_id: Number(id) });
      nav(`/chat/${room.room_id || room.id}`);
    } catch (e: any) { toast(e.message, 'error'); }
  };

  if (loading) return (
    <div className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`h-${i === 0 ? 8 : 4} skeleton rounded-xl ${i === 0 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );

  if (!job) return (
    <div className="flex flex-col items-center justify-center py-20">
      <span className="text-5xl mb-3">😕</span>
      <p className="font-semibold text-gray-900">Job not found</p>
      <button onClick={() => nav('/')} className="mt-4 text-emerald-500 font-semibold">← Back to Jobs</button>
    </div>
  );

  const catColor = CAT_COLORS[job.category?.toLowerCase() || 'other'] || CAT_COLORS.other;
  const fee = +(job.budget * 0.02).toFixed(2);

  return (
    <div className="flex flex-col min-h-full">
      {/* View switcher for owner */}
      {isOwner && (
        <div className="sticky top-[calc(3.5rem+1.75rem)] z-30 bg-white border-b border-gray-100 px-4 py-2">
          <div className="flex gap-2 max-w-lg mx-auto">
            {(['detail', 'applicants'] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  view === v ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {v === 'detail' ? 'Details' : `Applicants${apps.length ? ` (${apps.length})` : ''}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 max-w-lg mx-auto w-full p-4 pb-28 animate-fade-in">

        {/* ── Detail view ── */}
        {view === 'detail' && (
          <>
            {/* Header */}
            <div className="mb-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h1 className="text-xl font-bold text-gray-900 leading-snug flex-1">{job.title}</h1>
                <div className="text-right shrink-0">
                  <p className="text-emerald-500 font-bold text-xl">{job.budget} π</p>
                  {job.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      job.status === 'open' ? 'bg-emerald-100 text-emerald-600' :
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                      job.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                      'bg-red-100 text-red-500'
                    }`}>{job.status.replace('_', ' ')}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${catColor}`}>{job.category}</span>
                {job.is_urgent && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-500">🔥 Urgent</span>}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  @{job.client_username || 'unknown'}
                </span>
                <span>{job.applicants_count ?? 0} applicants</span>
                <span>{timeAgo(job.created_at)}</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* Skills */}
            {job.skills && (Array.isArray(job.skills) ? job.skills : job.skills.split(',')).filter(Boolean).length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Skills Required</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(job.skills) ? job.skills : job.skills.split(','))
                    .filter(Boolean)
                    .map((s: string) => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">{s.trim()}</span>
                    ))}
                </div>
              </div>
            )}

            {/* Fee breakdown */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-sm space-y-1.5">
              <div className="flex justify-between text-gray-500"><span>Budget</span><span className="text-gray-900 font-medium">{job.budget} π</span></div>
              <div className="flex justify-between text-gray-400"><span>Platform fee (2%)</span><span>{fee} π</span></div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-emerald-500">{(job.budget + fee).toFixed(2)} π</span>
              </div>
            </div>

            {/* Actions */}
            {!isOwner && job.status === 'open' && (
              view === 'apply' ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Proposal</p>
                  <textarea
                    value={proposal}
                    onChange={e => setProposal(e.target.value)}
                    autoFocus
                    placeholder="Describe your approach, timeline, and why you're the best fit…"
                    rows={5}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 resize-none"
                  />
                  {(job.apply_cost ?? 0) > 0 && (
                    <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      ⚡ Costs {job.apply_cost} connects
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setView('detail')} className="flex-1 h-12 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                      Cancel
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="flex-[2] h-12 rounded-full bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-60"
                    >
                      {applying ? 'Sending…' : 'Submit Proposal'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setView('apply')}
                  className="w-full h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base shadow-lg shadow-emerald-500/30 transition-colors"
                >
                  Apply Now
                </button>
              )
            )}

            {isOwner && (
              <button
                onClick={() => { setView('applicants'); loadApps(); }}
                className="w-full h-14 rounded-full bg-emerald-500 text-white font-semibold text-base shadow-lg shadow-emerald-500/30"
              >
                View Applicants ({job.applicants_count ?? 0})
              </button>
            )}
          </>
        )}

        {/* ── Applicants view ── */}
        {view === 'applicants' && isOwner && (
          <div className="space-y-3">
            {apps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">📭</span>
                <p className="font-semibold text-gray-900">No applicants yet</p>
                <p className="text-sm text-gray-400 mt-1">Share your job to get more visibility</p>
              </div>
            ) : apps.map(app => (
              <div key={app.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 font-bold text-emerald-600 text-sm">
                    {(app.applicant_username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 text-sm">@{app.applicant_username}</p>
                      <span className="text-xs text-gray-400">{timeAgo(app.created_at)}</span>
                    </div>
                    {app.applicant_rating && (
                      <p className="text-xs text-amber-500">{'★'.repeat(Math.round(app.applicant_rating))} {app.applicant_rating}</p>
                    )}
                  </div>
                </div>

                {app.proposal && (
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">
                    {app.proposal}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleChat(app)}
                    className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold"
                  >
                    💬 Chat
                  </button>
                  <button
                    onClick={() => handleReject(app.id)}
                    disabled={acting === String(app.id)}
                    className="flex-1 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-semibold disabled:opacity-60"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleHire(app)}
                    disabled={hiringId === app.id || job.status !== 'open'}
                    className="flex-[1.5] py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold disabled:opacity-60 shadow-sm"
                  >
                    {hiringId === app.id ? '⏳ Hiring…' : '✅ Hire'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
