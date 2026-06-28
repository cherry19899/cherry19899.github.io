import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { getEscrows, releaseEscrow, refundEscrow } from '../lib/api';
import { formatBudget, timeAgo } from '../lib/utils';
import { Badge } from '../components/ui/badge';

interface EscrowScreenProps {
  t: TFunction;
  user: { uid: string; username: string };
}

export default function EscrowScreen({ t, user }: EscrowScreenProps) {
  const [escrows, setEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const d = await getEscrows();
      setEscrows(d.escrows || d || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleRelease = async (id: number) => {
    if (!confirm('Release funds to freelancer?')) return;
    try { await releaseEscrow(id); await load(); }
    catch (e: any) { alert(e.message); }
  };

  const handleRefund = async (id: number) => {
    if (!confirm('Refund escrow?')) return;
    try { await refundEscrow(id); await load(); }
    catch (e: any) { alert(e.message); }
  };

  const variant = (s: string): 'default' | 'secondary' | 'success' | 'destructive' => {
    if (s === 'funded') return 'default';
    if (s === 'released') return 'success';
    if (s === 'disputed') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="animate-fade-in px-4 pb-20">
      <div className="sticky top-0 glass border-b border-border h-14 flex items-center">
        <h1 className="font-bold text-base">{t('escrow')}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center pt-16">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : escrows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🔒</p>
          <p>{t('noEscrows')}</p>
        </div>
      ) : (
        <div className="space-y-3 pt-4">
          {escrows.map(e => (
            <div key={e.id} className="rounded-xl bg-card border border-border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{e.job_title || `Job #${e.job_id}`}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {e.freelancer_username || e.freelancer_uid}
                  </p>
                </div>
                <Badge variant={variant(e.status)}>{e.status}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-emerald-500">{formatBudget(e.amount)}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(e.created_at)}</span>
              </div>

              {e.status === 'funded' && e.client_uid === user.uid && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRelease(e.id)}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold"
                  >
                    {t('release')}
                  </button>
                  <button
                    onClick={() => handleRefund(e.id)}
                    className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-semibold"
                  >
                    {t('refunded')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
