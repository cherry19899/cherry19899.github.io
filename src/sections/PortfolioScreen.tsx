import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { getPortfolio, getUserReviews } from '../lib/api';
import StarRating from '../components/StarRating';
import { timeAgo } from '../lib/utils';

interface PortfolioScreenProps {
  t: TFunction;
  userId: string;
  onBack: () => void;
}

export default function PortfolioScreen({ t, userId, onBack }: PortfolioScreenProps) {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPortfolio(userId).catch(() => null),
      getUserReviews(userId).catch(() => []),
    ]).then(([p, r]) => {
      setPortfolio(p?.user || p || null);
      setReviews((r as any)?.reviews || r || []);
    }).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in overflow-y-auto">
      <div className="sticky top-0 glass border-b border-border px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-bold text-base">{t('portfolio')}</h1>
      </div>

      <div className="p-4 space-y-4 pb-8">
        {portfolio && (
          <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-emerald-500/30 flex items-center justify-center text-2xl font-black">
                {portfolio.avatar
                  ? <img src={portfolio.avatar} className="w-full h-full object-cover" alt="" />
                  : (portfolio.username || '?')[0].toUpperCase()
                }
              </div>
              <div>
                <h2 className="font-bold text-lg">@{portfolio.username}</h2>
                {portfolio.kyc && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">KYC ✓</span>
                )}
              </div>
            </div>
            {portfolio.bio && <p className="text-sm text-muted-foreground">{portfolio.bio}</p>}
            {portfolio.skills && (
              <div className="flex flex-wrap gap-1.5">
                {String(portfolio.skills).split(',').map((s: string) => s.trim()).filter(Boolean).map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {reviews.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{t('reviews')} ({reviews.length})</h3>
            {reviews.map((r: any) => (
              <div key={r.id} className="rounded-xl bg-card border border-border p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} size={12} />
                  <span className="text-xs text-muted-foreground">@{r.reviewer_username}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{timeAgo(r.created_at)}</span>
                </div>
                {r.comment && <p className="text-sm">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {!portfolio && !reviews.length && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">👤</p>
            <p>No portfolio found</p>
          </div>
        )}
      </div>
    </div>
  );
}
