import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { apiFetch } from '../lib/api';
import { formatBudget, timeAgo } from '../lib/utils';

interface OffersScreenProps {
  t: TFunction;
  onBack: () => void;
}

export default function OffersScreen({ t, onBack }: OffersScreenProps) {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/offers/my')
      .then(d => setOffers(d.offers || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = async (id: number) => {
    try {
      await apiFetch(`/api/offers/${id}/accept`, { method: 'POST' });
      setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'accepted' } : o));
      alert(t('offerAccepted'));
    } catch (e: any) { alert(e.message); }
  };

  const handleDecline = async (id: number) => {
    try {
      await apiFetch(`/api/offers/${id}/decline`, { method: 'POST' });
      setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'declined' } : o));
      alert(t('offerDeclined'));
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in overflow-y-auto">
      <div className="sticky top-0 glass border-b border-border px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-bold text-base">Custom Offers</h1>
      </div>

      <div className="p-4 space-y-3 pb-8">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">📨</p>
            <p>{t('noOffers')}</p>
          </div>
        ) : (
          offers.map((offer: any) => (
            <div key={offer.id} className="p-4 rounded-xl bg-card border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{t('fromClient')}: @{offer.client_username}</span>
                <span className="text-emerald-500 font-bold">{formatBudget(offer.budget)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{offer.description}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(offer.created_at)}</p>
              {offer.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(offer.id)}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold">
                    Accept
                  </button>
                  <button onClick={() => handleDecline(offer.id)}
                    className="flex-1 py-2 rounded-lg bg-muted text-sm font-bold">
                    Decline
                  </button>
                </div>
              )}
              {offer.status !== 'pending' && (
                <span className={`text-xs font-semibold ${offer.status === 'accepted' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {offer.status}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
