import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { getJob, getApplicationsForJob, applyToJob, hireApplication, releaseEscrow, getEscrows, updateApplicationStatus, checkApplication } from '../lib/api';
import { approvePayment, completePayment } from '../lib/api';
import { formatBudget, formatDate, getStatusColor } from '../lib/utils';

interface User {
  uid: string;
  username: string;
}

interface JobDetailModalProps {
  t: TFunction;
  jobId: number;
  user: User;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
  onOpenChat?: (roomId: string) => void;
}

declare const Pi: any;

export default function JobDetailModal({ t, jobId, user, onClose, onNavigate, onOpenChat }: JobDetailModalProps) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [applying, setApplying] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [showApps, setShowApps] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hiringId, setHiringId] = useState<number | null>(null);

  useEffect(() => { load(); }, [jobId]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [jobData, appliedData] = await Promise.all([
        getJob(jobId),
        checkApplication(jobId).catch(() => ({ applied: false })),
      ]);
      const j = jobData.job || jobData;
      setJob(j);
      setIsOwner(j.client_id === user?.uid || j.client_uid === user?.uid || j.posted_by === user?.uid);
      setHasApplied(appliedData?.applied || false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadApps = async () => {
    try {
      const d = await getApplicationsForJob(jobId);
      setApplications(d.applications || d || []);
    } catch {}
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const connects = parseInt(localStorage.getItem('workpro_connects') || '0');
    if (connects < 1) { alert(t('notEnoughConnects')); return; }
    setApplying(true);
    try {
      await applyToJob(jobId, {
        cover_letter: coverLetter,
        bid_amount: parseFloat(proposedBudget) || job.budget,
      });
      const c = parseInt(localStorage.getItem('workpro_connects') || '0');
      localStorage.setItem('workpro_connects', String(Math.max(0, c - 1)));
      setHasApplied(true);
      setShowApplyForm(false);
    } catch (e: any) {
      if (e.alreadyApplied) { setHasApplied(true); setShowApplyForm(false); return; }
      alert(e.message);
    } finally {
      setApplying(false);
    }
  };

  const handleHire = async (app: any) => {
    const amount = app.bid_amount || app.proposed_budget || job.budget || 1;
    if (!confirm(`Hire ${app.freelancer_username || 'freelancer'} for π${amount}?`)) return;
    setHiringId(app.id);
    try {
      if (typeof Pi === 'undefined') { alert(t('piBrowserRequired') || 'Pi Browser required'); return; }
      const metadata = { type: 'escrow', job_id: jobId, application_id: app.id, freelancer_id: app.freelancer_uid || app.user_id, client_id: user.uid };
      await Pi.createPayment(
        { amount: parseFloat(amount), memo: `WorkPro Escrow: ${job.title}`, metadata },
        {
          onReadyForServerApproval: async (paymentId: string) => { await approvePayment({ payment_id: paymentId, metadata }); },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            await completePayment({ payment_id: paymentId, txid, metadata });
            await hireApplication(jobId, { application_id: app.id, payment_id: paymentId, txid, amount });
            alert(`${app.freelancer_username || 'Freelancer'} hired! π${amount} locked in escrow.`);
            load(); loadApps();
          },
          onCancel: () => setHiringId(null),
          onError: (e: any) => { setHiringId(null); alert(e?.message || t('paymentFailed')); },
        }
      );
    } catch (e: any) { alert(e.message); }
    finally { setHiringId(null); }
  };

  const handleRelease = async () => {
    if (!confirm('Mark job as complete and release funds to freelancer?')) return;
    try {
      const d = await getEscrows();
      const escrow = (d.escrows || []).find((e: any) => String(e.job_id) === String(jobId) && e.status === 'funded');
      if (!escrow) { alert('No active escrow found.'); return; }
      await releaseEscrow(escrow.id);
      alert('Funds released!');
      load();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !job) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-card rounded-2xl p-6 text-center space-y-3">
        <p className="text-destructive">{error || 'Job not found'}</p>
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-muted text-sm">{t('back')}</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-border px-4 h-14 flex items-center gap-3">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-bold text-base flex-1 truncate">{job.title}</h1>
        <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: getStatusColor(job.status) + '30', color: getStatusColor(job.status) }}>
          {job.status || 'open'}
        </span>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Meta */}
        <div className="rounded-xl bg-card border border-border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-500">{formatBudget(job.budget)}</span>
            <span className="text-xs text-muted-foreground">{formatDate(job.created_at)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {job.category} · {job.connects_required || 1} connect{job.connects_required !== 1 ? 's' : ''}
          </p>
          {job.deadline && <p className="text-xs text-muted-foreground">{t('deadline')}: {formatDate(job.deadline)}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</h3>
          <p className="text-sm leading-relaxed">{job.description}</p>
        </div>

        {/* Skills */}
        {job.skills?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('skills')}</h3>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((s: string) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Images */}
        {job.images?.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {job.images.map((img: string, i: number) => (
              <img key={i} src={img} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" alt="" />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!isOwner && job.status === 'open' && (
            <button
              onClick={() => !hasApplied && setShowApplyForm(!showApplyForm)}
              disabled={hasApplied}
              className={`w-full py-3 rounded-xl font-bold text-sm ${hasApplied ? 'bg-muted text-muted-foreground' : 'bg-emerald-500 text-white'}`}
            >
              {hasApplied ? `${t('apply')} ✓` : showApplyForm ? t('cancel') : t('applyNow')}
            </button>
          )}

          {isOwner && (
            <>
              <button
                onClick={() => { setShowApps(!showApps); if (!showApps) loadApps(); }}
                className="w-full py-3 rounded-xl bg-muted font-bold text-sm"
              >
                {showApps ? 'Hide' : 'View'} {t('applicants')}
              </button>
              {job.status === 'in_progress' && (
                <button onClick={handleRelease} className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm">
                  ✓ Release Payment (Complete Job)
                </button>
              )}
            </>
          )}
        </div>

        {/* Apply form */}
        {showApplyForm && (
          <form onSubmit={handleApply} className="rounded-xl bg-card border border-border p-4 space-y-3">
            <h3 className="font-semibold">{t('coverLetter')}</h3>
            <p className="text-xs text-muted-foreground">{t('applyHint')}</p>
            <textarea
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              placeholder={t('coverLetterPlaceholder')}
              rows={5}
              required
              className="w-full rounded-xl bg-muted border border-border px-3 py-2 text-sm resize-none"
            />
            <input
              type="number"
              step="0.01"
              value={proposedBudget}
              onChange={e => setProposedBudget(e.target.value)}
              placeholder={`${t('budget')} (${formatBudget(job.budget)})`}
              className="w-full rounded-xl bg-muted border border-border px-3 py-2 text-sm"
            />
            <button type="submit" disabled={applying} className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold disabled:opacity-60">
              {applying ? t('saving') : t('apply')}
            </button>
          </form>
        )}

        {/* Applications list */}
        {showApps && isOwner && (
          <div className="space-y-3">
            <h3 className="font-semibold">{t('applicants')} ({applications.length})</h3>
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noApplications')}</p>
            ) : applications.map((app: any) => (
              <div key={app.id} className="rounded-xl bg-card border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{app.freelancer_username || 'Freelancer'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: getStatusColor(app.status) + '30', color: getStatusColor(app.status) }}>
                    {app.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{app.cover_letter || app.message}</p>
                <p className="text-xs font-semibold">{formatBudget(app.bid_amount || app.proposed_budget)}</p>
                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleHire(app)}
                      disabled={hiringId === app.id}
                      className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold"
                    >
                      {hiringId === app.id ? t('processing') : '🔒 Hire & Pay'}
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(app.id, 'rejected').then(loadApps)}
                      className="flex-1 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-bold"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {app.status === 'accepted' && (
                  <span className="text-emerald-500 text-xs font-bold">✓ Hired</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
