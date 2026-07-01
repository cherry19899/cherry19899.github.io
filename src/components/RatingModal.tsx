import React, { useState } from 'react';
import { submitReviewV2 } from '../lib/api';
import { toast } from './Toast';
import { t } from '../lib/i18n';

interface Props {
  jobId: number;
  toUserId: string;
  toUsername: string;
  onDone: () => void;
  onSkip: () => void;
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export default function RatingModal({ jobId, toUserId, toUsername, onDone, onSkip }: Props) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const tr = t();

  const canSubmit = stars > 0 && (comment.length === 0 || comment.length >= 10);

  const handleSubmit = async () => {
    if (!stars) { toast(tr.yourRating, 'error'); return; }
    if (comment && comment.length < 10) { toast(tr.reviewMinLength, 'error'); return; }
    setSaving(true);
    try {
      await submitReviewV2({
        reviewee_id: toUserId,
        job_id: jobId,
        rating: stars,
        text: comment.trim() || null,
      });
      toast(tr.reviewSuccess, 'success');
      onDone();
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.toLowerCase().includes('already')) toast(tr.alreadyReviewed, 'info');
      else toast(msg || 'Failed', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onSkip}>
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl p-6 pb-10 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mb-6" />

        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">{tr.leaveReview}</h2>
        <p className="text-gray-400 dark:text-slate-500 text-sm text-center mb-6">@{toUsername}</p>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onTouchStart={() => setStars(n)}
              onClick={() => setStars(n)}
              className="text-4xl transition-transform active:scale-125"
            >
              <span className={(hover || stars) >= n ? 'text-amber-400' : 'text-gray-200 dark:text-slate-600'}>★</span>
            </button>
          ))}
        </div>

        {(hover || stars) > 0 && (
          <p className="text-center text-sm font-semibold text-emerald-500 mb-4">
            {LABELS[hover || stars]}
          </p>
        )}

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={tr.reviewText}
          rows={3}
          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 resize-none mb-1"
        />
        {comment.length > 0 && comment.length < 10 && (
          <p className="text-xs text-red-400 mb-3">{tr.reviewMinLength}</p>
        )}
        {comment.length === 0 && <div className="mb-3" />}

        <button
          onClick={handleSubmit}
          disabled={saving || !canSubmit}
          className="w-full h-14 rounded-full bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50 transition-colors mb-2"
        >
          {saving ? '⏳' : tr.submitReview}
        </button>

        <button onClick={onSkip} className="w-full py-3 text-sm text-gray-400 dark:text-slate-500 font-medium">
          Skip for now
        </button>
      </div>
    </div>
  );
}
