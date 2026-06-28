import React, { useState } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { submitReview } from '../lib/api';

interface ReviewModalProps {
  t: TFunction;
  toUserId: string;
  jobId: number;
  onClose: () => void;
}

export default function ReviewModal({ t, toUserId, jobId, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { alert(t('selectRating')); return; }
    setSubmitting(true);
    try {
      await submitReview({ to_user_id: toUserId, job_id: jobId, rating, comment });
      alert(t('reviewSubmitted'));
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-lg bg-card rounded-t-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold">{t('leaveReview')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 text-3xl">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} type="button" onClick={() => setRating(s)}
                className={s <= rating ? 'text-amber-400' : 'text-muted'}>
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t('reviewPlaceholder')}
            rows={4}
            className="w-full rounded-xl bg-muted border border-border p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 py-3 rounded-xl font-bold bg-emerald-500 text-white disabled:opacity-60">
              {submitting ? t('saving') : t('submit') || 'Submit'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold bg-muted text-foreground">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
