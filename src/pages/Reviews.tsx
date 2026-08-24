import { useState, useEffect, useCallback } from 'react';
import Spinner from '../components/Spinner';
import { useParams } from 'react-router-dom';
import { t, timeAgo } from '../lib/i18n';
import { getStoredUser, getReviewsV2 } from '../lib/api';

interface Review {
  id: number;
  job_id: number | null;
  reviewer_id: string;
  reviewer_username?: string | null;
  reviewer_avatar?: string | null;
  rating: number;
  text?: string | null;
  reply?: string | null;
  created_at: string;
}

const PAGE = 20;

function Stars({ n, className = '' }: { n: number; className?: string }) {
  const filled = Math.min(5, Math.max(0, Math.round(n)));
  return (
    <span className={className} aria-label={`${filled}/5`}>
      <span className="text-amber-400">{'★'.repeat(filled)}</span>
      <span className="text-gray-200 dark:text-slate-600">{'★'.repeat(5 - filled)}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const tr = t();
  const { id } = useParams();
  const me = getStoredUser();
  const userId = id || me?.uid || '';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [avg, setAvg] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback((p: number) => {
    if (!userId) return;
    p === 1 ? setLoading(true) : setLoadingMore(true);
    setLoadError(false);
    getReviewsV2(userId, p, PAGE)
      .then((d: any) => {
        const rows: Review[] = d.reviews || [];
        // Replace on the first page, append afterwards — appending on page 1
        // duplicates the list whenever the page is reloaded.
        setReviews(prev => (p === 1 ? rows : [...prev, ...rows]));
        setTotal(d.total || 0);
        setAvg(d.weighted_rating != null ? parseFloat(d.weighted_rating) : null);
        setPage(p);
      })
      // A failed load must not render as "no reviews yet" — that reads as a
      // fact about the person rather than as a broken request.
      .catch(() => setLoadError(true))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [userId]);

  useEffect(() => { load(1); }, [load]);

  // Distribution over what is actually on screen. Labelled as such rather than
  // implying it covers every review when only the first page has loaded.
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.rating) === star).length,
  }));

  if (loading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in pb-24 bg-white dark:bg-slate-900 min-h-screen space-y-4">
      {/* Summary */}
      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-4">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-3">⭐ {tr.reviews}</h1>
        {total > 0 ? (
          <div className="flex items-center gap-4">
            <div className="text-center shrink-0">
              <p className="text-3xl font-bold text-gray-900 dark:text-white leading-none">
                {(avg ?? 0).toFixed(1)}
              </p>
              <Stars n={avg ?? 0} className="text-sm block mt-1" />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                {total} {tr.reviews.toLowerCase()}
              </p>
            </div>
            <div className="flex-1 space-y-1">
              {dist.map(d => (
                <div key={d.star} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 w-3 text-right">{d.star}</span>
                  <span className="text-amber-400 text-[10px]">★</span>
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: reviews.length ? `${(d.count / reviews.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 w-4">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-slate-500">{tr.noReviewsYet}</p>
        )}
      </div>

      {loadError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-500 mb-2">{tr.loadFailed}</p>
          <button onClick={() => load(1)} className="text-sm font-semibold text-emerald-500">{tr.retry}</button>
        </div>
      )}

      {/* List */}
      {reviews.map(r => (
        <div key={r.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 overflow-hidden">
              {r.reviewer_avatar
                ? <img src={r.reviewer_avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {(r.reviewer_username || '?').charAt(0).toUpperCase()}
                  </span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  @{r.reviewer_username || tr.deletedUser}
                </p>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">{timeAgo(r.created_at)}</span>
              </div>
              <Stars n={r.rating} className="text-xs" />
              {r.text
                ? <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mt-1.5 break-words">{r.text}</p>
                : <p className="text-xs text-gray-300 dark:text-slate-600 italic mt-1.5">{tr.ratingNoText}</p>}
              {r.reply && (
                <div className="mt-2 pl-3 border-l-2 border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-gray-500 dark:text-slate-400 break-words">{r.reply}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {reviews.length < total && !loadError && (
        <button
          onClick={() => load(page + 1)}
          disabled={loadingMore}
          className="w-full py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 text-sm font-semibold text-emerald-500 disabled:opacity-50"
        >
          {loadingMore ? <Spinner /> : tr.loadMore}
        </button>
      )}
    </div>
  );
}
