import React, { useState, useEffect } from 'react';
import { getEscrows, releaseEscrow, cancelEscrow, disputeEscrow } from '../lib/api';
import { useAppCtx } from '../App';
import { toast } from '../components/Toast';
import RatingModal from '../components/RatingModal';

interface Escrow {
  id: number; job_title?: string; amount: number; status: string;
  client_uid?: string; client_username?: string;
  freelancer_uid?: string; freelancer_username?: string;
  job_id?: number; created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-600',
  funded:   'bg-emerald-100 text-emerald-600',
  released: 'bg-blue-100 text-blue-600',
  refunded: 'bg-gray-100 text-gray-500',
  disputed: 'bg-red-100 text-red-500',
};
const STATUS_ICON: Record<string, string> = {
  pending: '⏳', funded: '🔒', released: '✅', refunded: '↩️', disputed: '⚠️',
};

export default function EscrowPage() {
  const { user } = useAppCtx();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const [acting, setActing] = useState<number | null>(null);
  const [disputeModal, setDisputeModal] = useState<number | null>(null);
  const [disputeText, setDisputeText] = useState('');
  const [ratingTarget, setRatingTarget] = useState<{ escrow: Escrow } | null>(null);

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
      // Show rating modal for the freelancer
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

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in pb-24">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['active', 'done'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              tab === t ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t === 'active' ? `Active (${escrows.filter(e => ['pending','funded','disputed'].includes(e.status)).length})` : 'History'}
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
          <p className="font-semibold text-gray-900">{tab === 'active' ? 'No active escrows' : 'No history yet'}</p>
          <p className="text-sm text-gray-400 mt-1">Complete a job to see escrow activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => {
            const isClient = e.client_uid === user?.uid;
            const statusCls = STATUS_STYLE[e.status] || STATUS_STYLE.pending;

            return (
              <div key={e.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 leading-snug line-clamp-2">
                      {e.job_title || `Escrow #${e.id}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
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

                {/* Actions */}
                {e.status === 'funded' && isClient && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDisputeModal(e.id)}
                      className="flex-1 py-2.5 rounded-xl bg-amber-50 text-amber-600 text-xs font-semibold"
                    >
                      ⚠️ Dispute
                    </button>
                    <button
                      onClick={() => doCancel(e.id)}
                      disabled={acting === e.id}
                      className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-500 text-xs font-semibold disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => doRelease(e)}
                      disabled={acting === e.id}
                      className="flex-[1.5] py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold disabled:opacity-60 shadow-sm"
                    >
                      {acting === e.id ? '⏳' : '✅ Release'}
                    </button>
                  </div>
                )}

                {e.status === 'pending' && isClient && (
                  <div className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                    ⏳ Waiting for payment to fund escrow
                  </div>
                )}

                {e.status === 'released' && !ratingTarget && (
                  <button
                    onClick={() => setRatingTarget({ escrow: e })}
                    className="text-xs text-emerald-500 font-semibold w-full text-left"
                  >
                    ★ Leave a rating →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute modal */}
      {disputeModal !== null && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40" onClick={() => setDisputeModal(null)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Raise a Dispute</h2>
            <p className="text-sm text-gray-400 mb-4">Admin will review and resolve the escrow.</p>
            <textarea
              value={disputeText}
              onChange={e => setDisputeText(e.target.value)}
              placeholder="Describe the issue…"
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 resize-none mb-4"
            />
            <button
              onClick={doDispute}
              className="w-full h-12 rounded-full bg-red-500 text-white font-semibold"
            >
              Submit Dispute
            </button>
          </div>
        </div>
      )}

      {/* Rating modal */}
      {ratingTarget && (
        <RatingModal
          jobId={ratingTarget.escrow.job_id || 0}
          toUserId={ratingTarget.escrow.freelancer_uid || ratingTarget.escrow.client_uid || ''}
          toUsername={ratingTarget.escrow.freelancer_username || ratingTarget.escrow.client_username || '?'}
          onDone={() => setRatingTarget(null)}
          onSkip={() => setRatingTarget(null)}
        />
      )}
    </div>
  );
}
