import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  getEscrows, releaseEscrow, cancelEscrow, disputeEscrow,
  getMilestones, saveMilestones as apiSaveMilestones,
  requestMilestone, approveMilestone,
} from '../lib/api';
import { useAppCtx } from '../App';
import { toast } from '../components/Toast';
import RatingModal from '../components/RatingModal';
import { t } from '../lib/i18n';

interface Escrow {
  id: number; job_title?: string; amount: number; status: string;
  client_uid?: string; client_username?: string;
  freelancer_uid?: string; freelancer_username?: string;
  job_id?: number; created_at: string;
}

interface Milestone {
  id?: number; milestone_index: number; title: string; percent: number; amount?: number;
  status: 'pending' | 'requested' | 'approved' | 'auto_released';
  freelancer_requested?: boolean; client_approved?: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  funded:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  released: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  refunded: 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400',
  disputed: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};
const STATUS_ICON: Record<string, string> = {
  pending: '⏳', funded: '🔒', released: '✅', refunded: '↩️', disputed: '⚠️',
};

// ─── Milestone timeline ───────────────────────────────────────────────────────

function MilestoneTimeline({
  escrow, isClient, isFreelancer, onRefresh,
}: {
  escrow: Escrow; isClient: boolean; isFreelancer: boolean; onRefresh: () => void;
}) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<{ title: string; percent: string }[]>([]);
  const tr = t();

  const loadMilestones = useCallback(() => {
    setLoading(true);
    getMilestones(escrow.id)
      .then(d => setMilestones(d?.milestones || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [escrow.id]);

  useEffect(() => { loadMilestones(); }, [loadMilestones]);

  const totalPercent = draft.reduce((s, m) => s + (parseFloat(m.percent) || 0), 0);

  const startEdit = () => {
    setDraft(
      milestones.length > 0
        ? milestones.map(m => ({ title: m.title, percent: String(m.percent) }))
        : [{ title: '', percent: '50' }, { title: '', percent: '50' }]
    );
    setEditMode(true);
  };

  const addRow = () => setDraft(d => [...d, { title: '', percent: '' }]);
  const removeRow = (i: number) => setDraft(d => d.filter((_, j) => j !== i));
  const updateRow = (i: number, field: 'title' | 'percent', val: string) =>
    setDraft(d => d.map((row, j) => j === i ? { ...row, [field]: val } : row));

  const doSave = async () => {
    if (Math.abs(totalPercent - 100) > 0.01) {
      toast('Percentages must sum to 100%', 'error'); return;
    }
    if (draft.some(m => !m.title.trim())) {
      toast('All milestones need a title', 'error'); return;
    }
    try {
      const payload = draft.map((m, i) => ({
        milestone_index: i, title: m.title.trim(), percent: parseFloat(m.percent),
      }));
      await apiSaveMilestones(escrow.id, payload);
      toast(tr.saveMilestones + ' ✓', 'success');
      setEditMode(false);
      loadMilestones();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const doRequest = async (m: Milestone) => {
    if (!m.id) return;
    setActing(m.id);
    try {
      await requestMilestone(escrow.id, m.id);
      toast(tr.requestRelease + ' ✓', 'success');
      loadMilestones();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setActing(null); }
  };

  const doApprove = async (m: Milestone) => {
    if (!m.id) return;
    setActing(m.id);
    try {
      await approveMilestone(escrow.id, m.id);
      toast(tr.approveRelease + ' ✓ 🎉', 'success');
      loadMilestones();
      onRefresh();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setActing(null); }
  };

  const mStatusIcon = (m: Milestone) => {
    if (m.status === 'approved' || m.status === 'auto_released') return '✅';
    if (m.status === 'requested') return '🟡';
    return '⭕';
  };

  const mStatusColor = (m: Milestone) => {
    if (m.status === 'approved' || m.status === 'auto_released')
      return 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
    if (m.status === 'requested')
      return 'border-amber-400 bg-amber-50 dark:bg-amber-900/20';
    return 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800';
  };

  if (loading) return <div className="h-12 skeleton rounded-xl" />;

  if (editMode) {
    return (
      <div className="space-y-3 mt-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
          {tr.milestones} — {tr.escrowTimeline}
        </p>
        {draft.map((m, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={m.title}
              onChange={e => updateRow(i, 'title', e.target.value)}
              placeholder={tr.milestoneTitle}
              className="flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400"
            />
            <input
              type="number"
              min="1" max="100"
              value={m.percent}
              onChange={e => updateRow(i, 'percent', e.target.value)}
              placeholder="%"
              className="w-16 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-2 py-2 text-sm text-gray-900 dark:text-white text-center focus:outline-none focus:border-emerald-400"
            />
            <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-500 p-1">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ))}
        <div className={`text-xs font-semibold text-right ${Math.abs(totalPercent - 100) > 0.01 ? 'text-red-500' : 'text-emerald-500'}`}>
          {tr.total}: {totalPercent.toFixed(0)}%
        </div>
        <div className="flex gap-2">
          <button onClick={addRow} className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-semibold">
            + {tr.addMilestone}
          </button>
          <button onClick={() => setEditMode(false)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-500 text-xs font-semibold">
            {tr.cancel}
          </button>
          <button onClick={doSave} className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold">
            {tr.saveMilestones}
          </button>
        </div>
      </div>
    );
  }

  if (milestones.length === 0) {
    if (!isClient || escrow.status !== 'funded') return null;
    return (
      <button onClick={startEdit} className="w-full py-2.5 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-500 text-xs font-semibold">
        + {tr.addMilestone}
      </button>
    );
  }

  // Progress bar
  const approvedCount = milestones.filter(m => m.status === 'approved' || m.status === 'auto_released').length;
  const progress = milestones.length > 0 ? (approvedCount / milestones.length) * 100 : 0;

  return (
    <div className="space-y-3 mt-2">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mb-1">
          <span>{tr.milestones}</span>
          <span>{approvedCount}/{milestones.length}</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-slate-700" />
        {milestones.map((m, idx) => (
          <div key={m.id ?? idx} className={`relative mb-3 border rounded-xl p-3 transition-all ${mStatusColor(m)}`}>
            {/* Dot on timeline */}
            <div className="absolute -left-5 top-3.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-600 flex items-center justify-center text-[10px]">
              {mStatusIcon(m)}
            </div>

            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{m.title}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  {m.percent}% · {(escrow.amount * m.percent / 100).toFixed(2)} π
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {isFreelancer && m.status === 'pending' && escrow.status === 'funded' && (
                  <button
                    onClick={() => doRequest(m)}
                    disabled={acting === m.id}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 text-white text-xs font-semibold disabled:opacity-60"
                  >
                    {acting === m.id ? '⏳' : tr.requestRelease}
                  </button>
                )}
                {isClient && m.status === 'requested' && (
                  <button
                    onClick={() => doApprove(m)}
                    disabled={acting === m.id}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold disabled:opacity-60"
                  >
                    {acting === m.id ? '⏳' : tr.approveRelease}
                  </button>
                )}
                {m.status === 'requested' && (
                  <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
                    Pending approval
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit button for client */}
      {isClient && escrow.status === 'funded' && (
        <button onClick={startEdit} className="text-xs text-gray-400 dark:text-slate-500 hover:text-emerald-500 font-semibold">
          ✏️ Edit milestones
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EscrowPage() {
  const { user } = useAppCtx();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const [acting, setActing] = useState<number | null>(null);
  const [disputeModal, setDisputeModal] = useState<number | null>(null);
  const [disputeText, setDisputeText] = useState('');
  const [ratingTarget, setRatingTarget] = useState<{ escrow: Escrow } | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const tr = t();

  const load = () => {
    setLoading(true);
    getEscrows()
      .then((d: any) => setEscrows(d?.escrows || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = escrows.filter(e =>
    tab === 'active'
      ? ['pending', 'funded', 'disputed'].includes(e.status)
      : ['released', 'refunded'].includes(e.status)
  );

  const doRelease = async (e: Escrow) => {
    setActing(e.id);
    try {
      await releaseEscrow(e.id);
      toast('Funds released! 🎉', 'success');
      load();
      if (e.freelancer_uid && e.freelancer_uid !== user?.uid) {
        setRatingTarget({ escrow: e });
      }
    } catch (err: any) { toast(err.message || 'Failed', 'error'); }
    finally { setActing(null); }
  };

  const doCancel = async (id: number) => {
    setActing(id);
    try { await cancelEscrow(id); toast('Escrow cancelled, funds refunded.', 'success'); load(); }
    catch (err: any) { toast(err.message || 'Failed', 'error'); }
    finally { setActing(null); }
  };

  const doDispute = async () => {
    if (!disputeModal) return;
    try {
      await disputeEscrow(disputeModal, disputeText);
      toast('Dispute raised — admin will review.', 'info');
      setDisputeModal(null);
      setDisputeText('');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in pb-24 bg-white dark:bg-slate-900 min-h-screen">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['active', 'done'] as const).map(tab_key => (
          <button
            key={tab_key}
            onClick={() => setTab(tab_key)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              tab === tab_key
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
            }`}
          >
            {tab_key === 'active'
              ? `Active (${escrows.filter(e => ['pending','funded','disputed'].includes(e.status)).length})`
              : 'History'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-3">🔒</span>
          <p className="font-semibold text-gray-900 dark:text-white">
            {tab === 'active' ? 'No active escrows' : 'No history yet'}
          </p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Complete a job to see escrow activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => {
            const isClient = e.client_uid === user?.uid;
            const isFreelancer = e.freelancer_uid === user?.uid;
            const statusCls = STATUS_STYLE[e.status] || STATUS_STYLE.pending;
            const isExpanded = expanded.has(e.id);

            return (
              <div key={e.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                {/* Header — always visible */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleExpand(e.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                        {e.job_title || `Escrow #${e.id}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-slate-500">
                        {e.client_username && <span>👤 @{e.client_username}</span>}
                        {e.freelancer_username && <span>→ @{e.freelancer_username}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-emerald-500 font-bold">{e.amount} π</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls}`}>
                        {STATUS_ICON[e.status]} {e.status}
                      </span>
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 dark:text-slate-500">
                    <svg
                      viewBox="0 0 24 24" className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                    <span>{isExpanded ? 'Collapse' : `${tr.milestones} · ${tr.view}`}</span>
                  </div>
                </div>

                {/* Expanded: milestones + actions */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-50 dark:border-slate-700 pt-3">
                    {/* Milestone timeline */}
                    {(e.status === 'funded' || e.status === 'released') && (
                      <MilestoneTimeline
                        escrow={e}
                        isClient={isClient}
                        isFreelancer={isFreelancer}
                        onRefresh={load}
                      />
                    )}

                    {/* Actions */}
                    {e.status === 'funded' && isClient && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDisputeModal(e.id)}
                          className="flex-1 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-semibold"
                        >
                          ⚠️ Dispute
                        </button>
                        <button
                          onClick={() => doCancel(e.id)}
                          disabled={acting === e.id}
                          className="flex-1 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-xs font-semibold disabled:opacity-60"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => doRelease(e)}
                          disabled={acting === e.id}
                          className="flex-[1.5] py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold disabled:opacity-60 shadow-sm"
                        >
                          {acting === e.id ? '⏳' : '✅ Release All'}
                        </button>
                      </div>
                    )}

                    {e.status === 'pending' && isClient && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                        ⏳ Waiting for payment to fund escrow
                      </div>
                    )}

                    {e.status === 'released' && !ratingTarget && (
                      <button
                        onClick={() => setRatingTarget({ escrow: e })}
                        className="text-xs text-emerald-500 font-semibold w-full text-left"
                      >
                        ★ {tr.leaveReview} →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute modal */}
      {disputeModal !== null && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40" onClick={() => setDisputeModal(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mb-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{tr.raiseDispute}</h2>
            <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">Admin will review and resolve the escrow.</p>
            <textarea
              value={disputeText}
              onChange={e => setDisputeText(e.target.value)}
              placeholder={tr.disputeReason + '…'}
              rows={4}
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 resize-none mb-4"
            />
            <button
              onClick={doDispute}
              className="w-full h-12 rounded-full bg-red-500 text-white font-semibold"
            >
              Submit Dispute
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Rating modal */}
      {ratingTarget && (
        <RatingModal
          jobId={ratingTarget.escrow.job_id || 0}
          toUserId={ratingTarget.escrow.freelancer_uid || ratingTarget.escrow.client_uid || ''}
          toUsername={ratingTarget.escrow.freelancer_username || ratingTarget.escrow.client_username || '?'}
          onDone={() => { setRatingTarget(null); load(); }}
          onSkip={() => setRatingTarget(null)}
        />
      )}
    </div>
  );
}
