import React, { useState, useEffect } from 'react';
import { t } from '../lib/i18n';
import { useParams, useNavigate } from 'react-router-dom';
import { getJob, getJobApplications, applyToJob, rejectApplication, startChat, submitWork, apiFetch } from '../lib/api';
import { useAppCtx } from '../App';
import { toast } from '../components/Toast';
import { CAT_COLORS } from '../lib/constants';
import { createPiPayment, shareJob } from '../lib/pi';
import { applyCostFor } from '../lib/connects';

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Days until a deadline (negative = past). null if no/invalid date.
function daysUntil(d?: string): number | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

type View = 'detail' | 'apply' | 'applicants';

export default function JobDetailPage() {
  const tr = t();
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user, updateUser } = useAppCtx();
  const [job, setJob] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('detail');
  const [applyMode, setApplyMode] = useState(false);
  const [proposal, setProposal] = useState('');
  const [applying, setApplying] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [hiringId, setHiringId] = useState<number | null>(null);

  const isOwner = job && user && job.posted_by === user.uid;
  const myConnects = user?.balance_connects ?? 0;
  const applyCost = applyCostFor(job?.budget);

  useEffect(() => {
    if (!id) return;
    getJob(id)
      .then(d => { if (d) setJob(d?.job || d); })
      .catch(() => setJob(null))
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
    if (myConnects < applyCost) { toast(tr.notEnoughConnects, 'error'); return; }
    setApplying(true);
    console.log('[apply] start', { jobId: id, applyCost, myConnects });
    try {
      const data: any = await applyToJob(id!, { proposal, job_id: Number(id) });
      console.log('[apply] response', data);
      updateUser({ balance_connects: Math.max(0, myConnects - applyCost) });
      const roomId = data?.room_id || data?.room?.id;
      console.log('[apply] roomId=', roomId, 'new_balance=', data?.new_balance ?? data?.remaining_connects);
      if (roomId) {
        toast('Application sent! Opening chat...', 'success');
        nav(`/chat/${roomId}`);
      } else {
        toast('Application sent! ✅', 'success');
        nav('/my-jobs');
      }
    } catch (e: any) {
      console.error('[apply] error', e?.message || e, e?.status);
      toast(e.message || 'Failed to apply', 'error');
    } finally { setApplying(false); }
  };

  const [submitting, setSubmitting] = useState(false);
  const handleSubmitWork = async () => {
    setSubmitting(true);
    try {
      await submitWork(id!);
      setJob((prev: any) => prev ? { ...prev, status: 'submitted' } : prev);
      toast(tr.workSubmitted, 'success');
    } catch (e: any) {
      toast(e.message || 'Failed to submit', 'error');
    } finally { setSubmitting(false); }
  };

  // ── Hire flow: Pi payment → hire endpoint (creates escrow) ───────────────

  const handleHire = (app: any) => {
    setHiringId(app.id);
    toast(`Hiring @${app.applicant_username}…`, 'info');

    createPiPayment(
      Number(job.budget),
      `Hire: ${job.title}`,
      { type: 'hire', job_id: id, application_id: app.id },
      {
        onApproval: async (paymentId) => {
          await apiFetch(`/api/jobs/${id}/hire`, {
            method: 'POST',
            body: JSON.stringify({
              application_id: app.id,
              freelancer_id: app.applicant_uid || app.applicant_id,
              payment_id: paymentId,
            }),
          });
        },
        onCompleted: (_pid, _txid) => {
          toast('Job started! Escrow funded 🚀', 'success');
          setJob((prev: any) => prev ? { ...prev, status: 'in_progress' } : prev);
          setHiringId(null);
        },
        onCancelled: () => { toast('Payment cancelled', 'info'); setHiringId(null); },
        onError: (e: any) => { toast(e.message || 'Payment failed', 'error'); setHiringId(null); },
      }
    );
  };

  const handleReject = (appId: number) => {
    setActing(String(appId));
    rejectApplication(appId).catch(() => {});
    setApps(prev => prev.filter(a => a.id !== appId));
    toast('Application declined', 'info');
    setActing(null);
  };

  const handleChat = async (app: any) => {
    try {
      const room = await startChat({ other_user_id: app.applicant_uid || app.applicant_id, job_id: Number(id) });
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
      <p className="font-semibold text-gray-900">{tr.jobNotFound}</p>
      <button onClick={() => nav('/')} className="mt-4 text-emerald-500 font-semibold">← Back to Jobs</button>
    </div>
  );

  const catColor = CAT_COLORS[job.category?.toLowerCase() || 'other'] || CAT_COLORS.other;
  const fee = +(Number(job.budget) * 0.02).toFixed(2);

  return (
    <div className="flex flex-col min-h-full">
      {/* View switcher for owner */}
      {isOwner && (
        <div className="sticky top-24 z-30 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 py-2">
          <div className="flex gap-2 max-w-lg mx-auto">
            {(['detail', 'applicants'] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  view === v ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                }`}
              >
                {v === 'detail' ? 'Details' : `Applicants${apps.length ? ` (${apps.length})` : ''}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 max-w-lg mx-auto w-full p-4 pb-28 animate-fade-in bg-white dark:bg-slate-900">

        {/* ── Detail view ── */}
        {view === 'detail' && (
          <>
            {/* Header */}
            <div className="mb-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug flex-1">{job.title}</h1>
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

              <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  @{job.posted_by_name || 'unknown'}
                </span>
                <span>{job.applications ?? 0} applicants</span>
                <span>{timeAgo(job.created_at)}</span>
              </div>

              {/* Deadline */}
              {job.deadline && (() => {
                const d = daysUntil(job.deadline);
                const soon = d !== null && d <= 3;
                return (
                  <div className="flex items-center gap-2 mt-3 text-xs">
                    <svg className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span className="text-gray-500 dark:text-slate-400">
                      Deadline: {new Date(job.deadline).toLocaleDateString()}
                    </span>
                    {soon && (
                      <span className="font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-500">
                        {d! < 0 ? 'Overdue' : 'Due soon'}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Share (Pi native dialog; no-ops outside Pi Browser) */}
              <button
                onClick={() => shareJob(String(job.id), job.title)}
                className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-500 active:opacity-70"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share
              </button>
            </div>

            {/* Photo */}
            {(job.images?.[0] || job.image) && (
              <img src={job.images?.[0] || job.image} alt="" className="w-full max-h-64 object-cover rounded-2xl mb-4" />
            )}

            {/* Description */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 mb-4">
              <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* Skills */}
            {job.skills && (Array.isArray(job.skills) ? job.skills : job.skills.split(',')).filter(Boolean).length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{tr.skillsRequired}</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(job.skills) ? job.skills : job.skills.split(','))
                    .filter(Boolean)
                    .map((s: string) => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 font-medium">{s.trim()}</span>
                    ))}
                </div>
              </div>
            )}

            {/* Fee breakdown */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 mb-5 text-sm space-y-1.5">
              <div className="flex justify-between text-gray-500 dark:text-slate-400"><span>{tr.budget}</span><span className="text-gray-900 dark:text-white font-medium">{Number(job.budget)} π</span></div>
              <div className="flex justify-between text-gray-400 dark:text-slate-500"><span>Platform fee (2%)</span><span>{fee} π</span></div>
              <div className="border-t border-gray-200 dark:border-slate-700 pt-1.5 flex justify-between font-bold">
                <span className="text-gray-900 dark:text-white">{tr.total}</span>
                <span className="text-emerald-500">{(Number(job.budget) + fee).toFixed(2)} π</span>
              </div>
            </div>

            {/* Actions */}
            {!isOwner && job.status === 'open' && (
              applyMode ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{tr.yourProposal}</p>
                  <textarea
                    value={proposal}
                    onChange={e => setProposal(e.target.value)}
                    autoFocus
                    placeholder="Describe your approach, timeline, and why you're the best fit…"
                    rows={5}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 resize-none"
                  />
                  {(
                    <p className={`text-xs font-medium flex items-center gap-1 ${myConnects >= applyCost ? 'text-amber-600' : 'text-red-500'}`}>
                      ⚡ {tr.applyCostLabel}: {applyCost} {tr.connects.toLowerCase()} · {myConnects} {tr.connects.toLowerCase()}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setApplyMode(false)} className="flex-1 h-12 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                      Cancel
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={applying || myConnects < applyCost}
                      className="flex-[2] h-12 rounded-full bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-60"
                    >
                      {applying ? '⏳' : myConnects < applyCost ? tr.notEnoughConnects : tr.submitProposal}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setApplyMode(true)}
                  className="w-full h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base shadow-lg shadow-emerald-500/30 transition-colors"
                >
                  {tr.applyNow} · {applyCost} {tr.connects.toLowerCase()}
                </button>
              )
            )}

            {isOwner && (
              <button
                onClick={() => { setView('applicants'); loadApps(); }}
                className="w-full h-14 rounded-full bg-emerald-500 text-white font-semibold text-base shadow-lg shadow-emerald-500/30"
              >
                View Applicants ({job.applications ?? 0})
              </button>
            )}

            {/* Hired freelancer: submit work */}
            {!isOwner && user && job.hired_freelancer_id === user.uid && job.status === 'in_progress' && (
              <button
                onClick={handleSubmitWork}
                disabled={submitting}
                className="w-full h-14 rounded-full bg-emerald-500 text-white font-semibold text-base shadow-lg shadow-emerald-500/30 disabled:opacity-60"
              >
                {submitting ? '⏳' : `📤 ${tr.submitWork}`}
              </button>
            )}
            {!isOwner && user && job.hired_freelancer_id === user.uid && job.status === 'submitted' && (
              <div className="w-full py-4 rounded-2xl bg-amber-50 text-amber-700 text-sm font-semibold text-center">
                ✅ {tr.workSubmitted}
              </div>
            )}
          </>
        )}

        {/* ── Applicants view ── */}
        {view === 'applicants' && isOwner && (
          <div className="space-y-3">
            {apps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">📭</span>
                <p className="font-semibold text-gray-900">{tr.noApplicants}</p>
                <p className="text-sm text-gray-400 mt-1">Share your job to get more visibility</p>
              </div>
            ) : apps.map(app => (
              <div key={app.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {(app.applicant_username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">@{app.applicant_username}</p>
                      <span className="text-xs text-gray-400 dark:text-slate-500">{timeAgo(app.created_at)}</span>
                    </div>
                    {app.applicant_rating && (
                      <p className="text-xs text-amber-500">{'★'.repeat(Math.round(app.applicant_rating))} {app.applicant_rating}</p>
                    )}
                  </div>
                </div>

                {app.proposal && (
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3">
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
