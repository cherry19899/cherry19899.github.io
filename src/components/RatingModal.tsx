import React, { useState } from 'react';
import { submitRating } from '../lib/api';
import { toast } from './Toast';

interface Props {
  jobId: number;
  toUserId: string;
  toUsername: string;
  onDone: () => void;
  onSkip: () => void;
}

export default function RatingModal({ jobId, toUserId, toUsername, onDone, onSkip }: Props) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  const handleSubmit = async () => {
    if (!stars) { toast('Select a rating', 'error'); return; }
    setSaving(true);
    try {
      await submitRating({ to_user_id: toUserId, job_id: jobId, rating: stars, comment });
      toast('Rating submitted!', 'success');
      onDone();
    } catch (e: any) {
      toast(e.message || 'Failed to submit rating', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onSkip}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Rate your experience</h2>
        <p className="text-gray-400 text-sm text-center mb-6">How was working with @{toUsername}?</p>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-3">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setStars(n)}
              className="text-4xl transition-transform active:scale-125"
            >
              <span className={(hover || stars) >= n ? 'text-amber-400' : 'text-gray-200'}>★</span>
            </button>
          ))}
        </div>

        {(hover || stars) > 0 && (
          <p className="text-center text-sm font-semibold text-emerald-500 mb-4">
            {labels[hover || stars]}
          </p>
        )}

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Leave a comment (optional)…"
          rows={3}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 resize-none mb-4"
        />

        <button
          onClick={handleSubmit}
          disabled={saving || !stars}
          className="w-full h-14 rounded-full bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50 transition-colors mb-2"
        >
          {saving ? 'Submitting…' : 'Submit Rating'}
        </button>

        <button onClick={onSkip} className="w-full py-3 text-sm text-gray-400 font-medium">
          Skip for now
        </button>
      </div>
    </div>
  );
}
